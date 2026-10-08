// ===== 팀 내 입지 (126) — 값·글: data/standing.js =====
// state.standing = { teamId, since(이 팀에 온 해), qDone, qFail, captain, captainAskYear, pickYear, earlyYear, last }
// 입지 = 기본 50 + 퀘스트 + 감독 신뢰(평판) + 경력(4강 이상) + 최근 경기력 + 근속 (+ 주장) → 0~100
// 효과: 재계약 연봉·제안(조기 재계약·재계약 없음), 주장(팀 분위기 +1, 이적 시장 영입 후보 고르기)

function ensureStanding() {
  const t = myTeam();
  if (!state.standing || (t && state.standing.teamId !== t.id)) {
    // 처음이거나 팀을 옮김 → 새로 시작
    state.standing = { teamId: t ? t.id : null, since: state.year, qDone: 0, qFail: 0, captain: false, captainAskYear: 0, pickYear: 0, earlyYear: 0, last: null };
  }
  return state.standing;
}

// 퀘스트 완료·만료 (js/quests.js)
function standingQuest(done) {
  const S = ensureStanding();
  if (done) S.qDone++; else S.qFail++;
  S.qHist = (S.qHist || []).concat([done ? 1 : 0]).slice(-STANDING_RULES.quest.recent); // 최근 n개만 점수에
}

// 요소별 점수
function standingParts() {
  const S = ensureStanding();
  const R = STANDING_RULES;
  const t = myTeam();
  const P = state.league.players;
  const clampN = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  const parts = {};
  const qh = S.qHist || [];
  parts.quest = clampN(qh.reduce(function (s, x) { return s + (x ? R.quest.done : R.quest.fail); }, 0), R.quest.min, R.quest.max);
  parts.trust = repTier().trust * R.trustMult; // 평판 등급 (js/fame.js)
  const mates = t ? t.roster.filter(function (id) { return id !== USER_ID && P[id]; }) : [];
  parts.career = Math.min(R.career.max, deepRunList().reduce(function (s, r) { return s + deepRunPoints(r); }, 0));
  const ps = (state.league.season && state.league.season.playerStats) || {};
  const me = ps[USER_ID];
  let form = 0;
  if (me && me.g >= R.form.minSets && t) {
    const others = mates.filter(function (id) { return ps[id] && ps[id].g >= R.form.minSets; });
    if (others.length) {
      const teamAvg = others.reduce(function (s, id) { return s + ps[id].r / ps[id].g; }, 0) / others.length;
      form = clampN((me.r / me.g - teamAvg) * R.form.mult, -R.form.max, R.form.max);
    }
  }
  parts.form = form;
  parts.tenure = Math.min(R.tenure.max, Math.max(0, state.year - S.since) * R.tenure.perSeason);
  parts.romance = typeof romanceStandingPenalty === "function" ? romanceStandingPenalty() : 0; // 사내 연애 공개 (js/romance.js)
  parts.captain = 0;
  if (S.captain) {
    const C = R.captain;
    const done = userMatches().filter(function (m) { return m.winner; }).slice(-C.recent);
    const losses = t ? done.filter(function (m) { return m.winner !== t.id; }).length : 0;
    parts.captain = C.bonus - losses * C.lossPenalty;
  }
  return parts;
}

function standingValue() {
  const p = standingParts();
  const sum = STANDING_RULES.base + p.quest + p.trust + p.career + p.form + p.tenure + p.captain + p.romance;
  return Math.round(Math.max(0, Math.min(100, sum)));
}

function standingGrade(v) {
  const val = v === undefined ? standingValue() : v;
  return STANDING_RULES.grades.find(function (g) { return val >= g.min; });
}

// ----- 경력: 리그·컵·국제대회 4강 이상 (state.career.deepRuns = [{ year, ev, stage }]) -----
const DEEP_EVENTS = {
  cup_po:    { name: "LCK 컵",      intl: false },
  playoffs:  { name: "리그",        intl: false },
  fs_ko:     { name: "First Stand", intl: true },
  msi_ko:    { name: "MSI",         intl: true },
  worlds_ko: { name: "월드",        intl: true },
};
const DEEP_STAGE_NAMES = { semi: "4강", final: "준우승", win: "우승" };

// 이번 시즌 우리 팀 기록 (경기 결과에서)
function seasonDeepRuns() {
  const t = myTeam();
  const s = state.league.season;
  if (!t || !s) return [];
  const best = {};
  const rank = { semi: 1, final: 2, win: 3 };
  s.matches.forEach(function (m) {
    if (!DEEP_EVENTS[m.comp] || !m.winner || (m.a !== t.id && m.b !== t.id)) return;
    let stage = null;
    if (m.label.indexOf("결승") !== -1) stage = m.winner === t.id ? "win" : "final";
    else if (m.label.indexOf("4강") !== -1) stage = "semi";
    if (stage && (!best[m.comp] || rank[stage] > rank[best[m.comp]])) best[m.comp] = stage;
  });
  return Object.keys(best).map(function (ev) { return { year: s.year || state.year, ev: ev, stage: best[ev] }; });
}

// 지난 시즌까지 + 이번 시즌
function deepRunList() {
  const c = state.career;
  if (!c.deepRuns) {
    // 예전 세이브: 시즌 기록의 우승만 옮김 (4강·준우승은 남아 있지 않음)
    const map = { "LCK 컵 우승": "cup_po", "리그 우승": "playoffs", "First Stand 우승": "fs_ko", "MSI 우승": "msi_ko", "월드 우승": "worlds_ko" };
    c.deepRuns = [];
    (c.seasons || []).forEach(function (s) { (s.titles || []).forEach(function (tt) { if (map[tt]) c.deepRuns.push({ year: s.year, ev: map[tt], stage: "win" }); }); });
  }
  const done = c.deepRuns.some(function (r) { return r.year === state.year; });
  return c.deepRuns.concat(done ? [] : seasonDeepRuns());
}

function deepRunPoints(r) {
  const R = STANDING_RULES.career;
  return R[r.stage] * (DEEP_EVENTS[r.ev] && DEEP_EVENTS[r.ev].intl ? R.intlMult : 1);
}

function deepRunSummary() {
  const list = deepRunList();
  if (!list.length) return "리그·컵·국제대회 4강 이상 없음";
  const n = function (st) { return list.filter(function (r) { return r.stage === st; }).length; };
  return "우승 " + n("win") + " · 준우승 " + n("final") + " · 4강 " + n("semi");
}

// 시즌이 끝날 때 기록 (js/main.js saveSeasonHistory)
function recordDeepRuns() {
  deepRunList(); // 예전 세이브 옮기기
  if (state.career.deepRuns.some(function (r) { return r.year === state.year; })) return;
  seasonDeepRuns().forEach(function (r) { state.career.deepRuns.push(r); });
}

// ----- 매주 (js/events.js runWeeklyEvents) -----
// 돌려주는 값: 선택지 연락을 보냈는지
function standingWeekly() {
  const S = ensureStanding();
  const t = myTeam();
  if (!t || state.retired) return false;
  const v = standingValue();
  S.last = v;
  const C = STANDING_RULES.captain;
  let fired = false;
  // 주장 해제
  if (S.captain && v < C.loseBelow) {
    S.captain = false;
    postMessage("news", STANDING_TEXTS.captainLostTitle, STANDING_TEXTS.captainLost, { notes: ["팀 내 입지 " + v + " (주장 유지 " + C.loseBelow + " 이상)"] });
  }
  // 주장 제안 (시즌 1번, 정규 일정 중)
  if (!S.captain && !state.benched && v >= C.askFrom && S.captainAskYear !== state.year && state.week >= 2 && state.week < CONTRACT.windowStart) {
    S.captainAskYear = state.year;
    postMessage("inbox", STANDING_TEXTS.captainTitle, STANDING_TEXTS.captain, {
      kind: "captain", ctx: {},
      choices: [{ label: "주장을 맡는다", hint: "경기 시작 때 팀 분위기 +" + C.teamMood + ", 이적 시장에서 영입 후보를 고를 수 있음 · 팀이 지면 입지가 크게 떨어짐" }, { label: "사양한다", hint: "" }],
    });
    fired = true;
  }
  // 주장: 이적 시장(성장 뒤) 영입 후보 고르기
  if (S.captain && state.week === CONTRACT.windowStart && S.pickYear !== state.year) {
    S.pickYear = state.year;
    if (postCaptainPick()) fired = true;
  }
  // 조기 재계약 (계약 마지막 해, 입지가 높으면)
  const g = standingGrade(v);
  if (g.early && state.week === STANDING_RULES.earlyRenewWeek && state.contract && state.contract.endYear === state.year && S.earlyYear !== state.year && !state.pendingMove && !state.retirePlanned) {
    S.earlyYear = state.year;
    if (!pendingRenewalOffer()) {
      const o = makeOffer(t.id, true);
      o.early = true;
      sendOffer(o);
      fired = true;
    }
  }
  return fired;
}

function pendingRenewalOffer() {
  return state.inbox.some(function (m) { return m.kind === "offer" && m.answered === null && m.offer && m.offer.renewal; });
}

// ----- 재계약 (js/contracts.js) -----
function standingRenewOk() { return standingGrade().renew !== false; }
function standingSalaryPct() { return standingGrade().salary || 0; }

// ----- 주장 효과: 경기 시작 팀 분위기 (js/match_events.js) -----
function captainMood(teamId, side) {
  const S = state.standing;
  const t = myTeam();
  if (!S || !S.captain || !t || teamId !== t.id || !side.some(function (q) { return q.id === USER_ID; })) return 0;
  return STANDING_RULES.captain.teamMood;
}

// ----- 주장: 영입 후보 3명 -----
function captainPickCandidates() {
  const t = myTeam();
  const n = STANDING_RULES.captain.pickCount;
  const posList = weakPositions(t); // 약한 포지션부터 (내 자리 제외, js/club_market.js)
  const candOf = function (pos) {
    const starter = starterAt(t.id, pos);
    const base = starter ? playerScore(starter) : 0;
    return Object.keys(state.league.players).filter(function (id) {
      const p = state.league.players[id];
      return p.pos === pos && playerScore(id) > base && sellable(id, t); // 지금 주전보다 나은 선수
    }).map(function (id) {
      return { id: id, pos: pos, base: base, fee: transferFee(id), salary: npcContractSalary(id, t.tier), score: playerScore(id), age: findPlayer(id).age };
    }).filter(function (c) { return canAfford(t, c); });
  };
  // 가장 약한 포지션 중 후보가 있는 곳
  let main = null;
  for (const pos of posList) { const l = candOf(pos); if (l.length) { main = { pos: pos, list: l }; break; } }
  if (!main) return null;
  const picked = [];
  const add = function (c) { if (c && picked.indexOf(c) === -1 && picked.length < n) picked.push(c); };
  const L = main.list;
  add(L.slice().sort(function (a, b) { return b.score - a.score; })[0]);                                   // 가장 잘하는 선수
  add(L.filter(function (c) { return c.age <= 21; }).sort(function (a, b) { return b.score - a.score; })[0]); // 어린 유망주
  add(L.slice().sort(function (a, b) { return (b.score - b.base) / (b.fee + b.salary + 1) - (a.score - a.base) / (a.fee + a.salary + 1); })[0]); // 가성비
  L.sort(function (a, b) { return b.score - a.score; }).forEach(add);
  // 그래도 모자라면 다음으로 약한 포지션에서
  posList.filter(function (p) { return p !== main.pos; }).forEach(function (pos) {
    if (picked.length >= n) return;
    candOf(pos).sort(function (a, b) { return (b.score - b.base) - (a.score - a.base); }).forEach(add);
  });
  const starter = starterAt(t.id, main.pos);
  return { pos: main.pos, starter: starter, base: starter ? playerScore(starter) : 0, list: picked };
}

// 후보 설명: 소속 · 점수 · 나이 · 강점·약점 스탯 · 특성 · 이적료
function captainPickHint(c, pos, base) {
  const p = findPlayer(c.id);
  const st = STATS.map(function (s) { return { name: s.name, v: p.stats[s.id] }; }).sort(function (a, b) { return b.v - a.v; });
  const traits = (p.traits || []).map(function (id) {
    const tr = findTrait(id);
    if (!tr) return "";
    return (tr.npcLocked ? "🔒" : tr.type === "bad" ? "⚠️" : tr.type === "s" ? "🌟" : "✨") + tr.name + (tr.fit ? (traitFits(tr, pos) ? "(🎯)" : "(효과 절반)") : "");
  }).filter(Boolean);
  return (p.teamId ? teamName(p.teamId) : "FA") + " · 점수 " + c.score.toFixed(1) + " (지금 " + findPosition(pos).name + " 주전 " + base.toFixed(1) + ", +" + (c.score - base).toFixed(1) + ") · " + p.age + "세" +
    " · 강점 " + st.slice(0, 3).map(function (x) { return x.name + " " + Math.round(x.v); }).join(", ") +
    " · 약점 " + st[st.length - 1].name + " " + Math.round(st[st.length - 1].v) +
    " · 특성 " + (traits.length ? traits.join(", ") : "없음") +
    " · 이적료 " + (c.fee ? moneyText(c.fee) : "없음(FA)") + ", 연봉 " + moneyText(c.salary);
}

function postCaptainPick() {
  const r = captainPickCandidates();
  if (!r) return false;
  const posName = findPosition(r.pos).name;
  const vars = { pos: posName, starter: r.starter ? playerName(r.starter) : "없음", starterScore: r.base.toFixed(1) };
  const fill = function (s) { return s.replace(/\{(\w+)\}/g, function (a, k) { return vars[k] !== undefined ? vars[k] : a; }); };
  postMessage("inbox", fill(STANDING_TEXTS.pickTitle), fill(STANDING_TEXTS.pick), {
    kind: "captainPick", ctx: {}, pick: { pos: r.pos, ids: r.list.map(function (c) { return c.id; }) },
    choices: r.list.map(function (c) { return { label: findPlayer(c.id).name + " 영입 (" + findPosition(c.pos).name + ")", hint: captainPickHint(c, c.pos, c.base) }; })
      .concat([{ label: "감독님께 맡긴다", hint: "평소처럼 구단이 알아서 보강" }]),
  });
  return true;
}

// 답하기 (js/events.js answerMessage)
function answerStanding(msg, index) {
  const S = ensureStanding();
  let result = "", notes = [];
  if (msg.kind === "captain") {
    if (index === 0) { S.captain = true; result = STANDING_TEXTS.captainYes; notes.push("🎖️ 주장이 됐다 (팀 분위기 +" + STANDING_RULES.captain.teamMood + ")"); addMoment("🎖️", myTeam().name + " 주장"); }
    else result = STANDING_TEXTS.captainNo;
  } else if (msg.kind === "captainPick") {
    const id = msg.pick && msg.pick.ids[index];
    if (!id) result = STANDING_TEXTS.pickSkip;
    else {
      const t = myTeam();
      const p = findPlayer(id);
      const from = p && p.teamId ? teamName(p.teamId) : "FA";
      const c = p ? { id: id, fee: transferFee(id), salary: npcContractSalary(id, t.tier) } : null;
      if (p && sellable(id, t) && canAfford(t, c)) {
        npcTransfer(id, t, c.fee, c.salary, "buy");
        p.contractEnd += 1; // 새해 전에 계약해서 1년 더 (js/club_market.js npcTransfer는 새해 기준)
        result = STANDING_TEXTS.pickDone.replace("{player}", p.name).replace("{from}", from);
        notes.push("🔁 " + t.name + ", " + from + "의 " + p.name + "(" + findPosition(p.pos).name + ") 영입" + (c.fee ? " · 이적료 " + moneyText(c.fee) : ""));
        addNews("이적 시장", "주장 " + state.player.name + "의 의견으로 " + t.name + "이(가) " + from + "의 " + p.name + "을(를) 영입했다.");
      } else {
        result = STANDING_TEXTS.pickFail.replace("{player}", p ? p.name : "그 선수");
      }
    }
  }
  msg.answered = index;
  msg.read = true;
  msg.result = result;
  msg.notes = notes;
  msg.changes = {};
}

// ----- 화면 -----
function standingBarRow(label, v, max) {
  const w = Math.round(Math.abs(v) / max * 50);
  return '<tr><td class="small">' + label + '</td><td class="rel-bar-cell"><div class="rel-bar"><div class="rel-fill ' + (v >= 0 ? "pos" : "neg") + '" style="' + (v >= 0 ? "left:50%" : "right:50%") + ";width:" + w + '%"></div></div></td><td class="r ' + (v > 0 ? "up" : v < 0 ? "down" : "") + '">' + (v > 0 ? "+" : "") + (Math.round(v * 10) / 10) + "</td></tr>";
}

function standingCardHTML() {
  const S = ensureStanding();
  const R = STANDING_RULES;
  const p = standingParts();
  const v = standingValue();
  const g = standingGrade(v);
  const next = R.grades.slice().reverse().find(function (x) { return x.min > v; });
  const rows = standingBarRow("📋 최근 퀘스트 " + (S.qHist || []).length + "개 (완료 " + (S.qHist || []).filter(Boolean).length + " · 만료 " + (S.qHist || []).filter(function (x) { return !x; }).length + ")", p.quest, R.quest.max) +
    standingBarRow("👔 감독 신뢰 (평판 " + repTier().name + ")", p.trust, 3 * R.trustMult) +
    standingBarRow("🏆 경력 (" + deepRunSummary() + ")", p.career, R.career.max) +
    standingBarRow("📈 이번 시즌 경기력", p.form, R.form.max) +
    standingBarRow("⏳ 근속 (" + S.since + "년~)", p.tenure, R.tenure.max) +
    (p.romance ? standingBarRow("💕 사내 연애 공개", p.romance, 10) : "") +
    (S.captain ? standingBarRow("🎖️ 주장 (최근 패배만큼 −)", p.captain, R.captain.bonus + R.captain.lossPenalty * R.captain.recent) : "");
  const salary = g.salary ? "재계약 연봉 " + (g.salary > 0 ? "+" : "") + Math.round(g.salary * 100) + "%" : "재계약 연봉 그대로";
  const effects = [salary];
  if (g.early) effects.push("계약 마지막 해 " + R.earlyRenewWeek + "주에 조기 재계약 제안");
  if (g.renew === false) effects.push("⚠️ 재계약 제안 없음");
  effects.push(S.captain ? "🎖️ 주장: 팀 분위기 +" + R.captain.teamMood + ", 이적 시장(" + CONTRACT.windowStart + "주)에 영입 후보 고르기" : "입지 " + R.captain.askFrom + " 이상이면 주장 제안");
  return '<div class="card"><h2>🏠 팀 내 입지 <span class="muted small">' + escapeHTML(myTeam().name) + "</span></h2>" +
    '<p><span class="standing-num">' + g.icon + " " + v + "</span> <b>" + g.name + "</b>" + (S.captain ? ' <span class="joker-tag">🎖️ 주장</span>' : "") +
    (next ? ' <span class="muted small">(' + next.name + "까지 " + (next.min - v) + ")</span>" : "") + "</p>" +
    '<div class="bar"><div class="bar-fill' + (v >= 80 ? " gold" : "") + '" style="width:' + v + '%"></div></div>' +
    '<div class="table-wrap"><table class="roster tlog">' + rows + "</table></div>" +
    '<p class="small">' + effects.join(" · ") + "</p>" +
    '<p class="muted small">기본 ' + R.base + "에 요소를 더해요. 팀을 옮기면 퀘스트·근속·주장은 처음부터예요.</p></div>";
}

// 대시보드 한 줄
function standingLineHTML() {
  if (!myTeam()) return "";
  const v = standingValue(), g = standingGrade(v);
  return '<div class="small">🏠 팀 내 입지 <b>' + g.icon + " " + v + " " + g.name + "</b>" + (state.standing && state.standing.captain ? " · 🎖️ 주장" : "") + "</div>";
}
