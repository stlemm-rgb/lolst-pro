// ===== js/stove.js — 스토브 리그: 이적 예상 리스트(찌라시) · 새해에 찌라시 이적 먼저 실행 =====
// 규칙: data/stove.js STOVE_RULES. 화면(🔥 찌라시 탭)은 아래 '화면' 부분.
// 저장: state.league.stove = { year, list: [이적설], used: { 팀 id: 찌라시로 쓴 영입 수 }, done } (league 통째 저장이라 등록 불필요)
//   이적설 = { id 선수, name 이름(은퇴·해외로 지워져도 보이게, 이름 편집이 같이 바꿈 — js/name_edit.js), pos, from 원래 팀(null = FA), to 갈 팀, kind fa·end·up·none, gain 실력 차, h: [47주 가능성, 48주, …], res: "ok"·"fail" (새해 뒤) }
// 글은 저장하지 않음 — 보여 줄 때 이적설 + 주차로 만듦 (이름 편집으로 바꾼 이름도 바로 반영)

function stoveOf(year) {
  const S = state.league && state.league.stove;
  return S && S.year === year ? S : null;
}
function stoveStage(ch) {
  const s = STOVE_RULES.stages;
  return ch < s[0] ? 0 : ch < s[1] ? 1 : ch < s[2] ? 2 : 3;
}
function stoveChance(r, week) { // 그 주 가능성 (주가 지나면 마지막 값)
  const i = Math.min(r.h.length - 1, Math.max(0, week - STOVE_RULES.startWeek));
  return r.h[i];
}
function stoveClamp(v) { return Math.max(STOVE_RULES.min, Math.min(STOVE_RULES.max, Math.round(v))); }

// 데려올 때 드는 이적료 (FA·계약 끝이면 0)
function stoveFee(p, year) { return p.teamId && p.contractEnd > year ? transferFee(p.id) : 0; }

// 그 팀으로 갈 수 있나 (돈·외국인 제한)
function stoveViable(p, t, year) {
  if (!p || p.retired || p.loan || !t || p.teamId === t.id) return false;
  if (!foreignOk(p.id, t.id)) return false;
  return teamMoney(t.id) - stoveFee(p, year) >= debtFloor(t.id);
}

// ----- 47주: 이적 예상 리스트 만들기 -----
function stoveStart() {
  const R = STOVE_RULES, L = state.league, year = state.year;
  if (stoveOf(year)) return;
  const tier1 = tierTeams(1);
  const avg = {};
  POSITION_IDS.forEach(function (pos) {
    const v = tier1.map(function (t) { return starterAt(t.id, pos); }).filter(Boolean).map(playerScore);
    avg[pos] = v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : 0;
  });
  const my = myTeam(), myPos = state.player.position;
  const inCnt = {};
  const list = [];
  // 움직일 만한 선수: FA · 계약 올해 끝 · 2부에서 1부 주전급 (1부 평균 − minBelowAvg 이상)
  const cands = Object.keys(L.players).map(function (id) {
    const p = L.players[id];
    if (p.retired || p.loan || playerScore(id) < avg[p.pos] - R.minBelowAvg) return null;
    const from = p.teamId ? findTeam(p.teamId) : null;
    const kind = !from ? "fa" : p.contractEnd <= year ? "end" : (from.tier === 2 && playerScore(id) >= avg[p.pos] - R.upBelowAvg) ? "up" : null;
    return kind ? { p: p, kind: kind } : null;
  }).filter(Boolean).sort(function (a, b) { return playerScore(b.p.id) - playerScore(a.p.id); });

  cands.forEach(function (c) {
    if (list.length >= R.maxRumors) return;
    const p = c.p, sc = playerScore(p.id);
    const opts = tier1.filter(function (t) {
      if (t.id === p.teamId || (inCnt[t.id] || 0) >= R.perTeamIn) return false;
      if (t.id === my.id && (p.pos === myPos || (inCnt[t.id] || 0) >= 1)) return false; // 우리 팀으로는 1건, 내 포지션 빼고
      const s = starterAt(t.id, p.pos);
      return sc - (s ? playerScore(s) : 0) >= R.minGain && stoveViable(p, t, year);
    }).map(function (t) { const s = starterAt(t.id, p.pos); return { t: t, gain: sc - (s ? playerScore(s) : 0) }; })
      .sort(function (a, b) { return b.gain - a.gain; }).slice(0, 3);
    if (!opts.length) return;
    const o = opts[Math.floor(Math.random() * opts.length)]; // 실력 차 큰 3팀 중 하나
    inCnt[o.t.id] = (inCnt[o.t.id] || 0) + 1;
    const ch = R.base[c.kind] + Math.min(R.gainBonusMax, o.gain * R.gainBonus) + (Math.random() * 2 - 1) * R.jitter;
    list.push({ id: p.id, name: p.name, pos: p.pos, end: p.contractEnd, from: p.teamId || null, to: o.t.id, kind: c.kind, gain: Math.round(o.gain * 10) / 10, h: [stoveClamp(ch)] });
  });

  // 근거 없는 낭설: 계약 남은 1부 스타 → 돈 많은 팀
  tier1.filter(function (t) { return t.id !== my.id; }).sort(function (a, b) { return teamMoney(b.id) - teamMoney(a.id); }).slice(0, R.baseless).forEach(function (rich, i) { // 우리 팀으로 오는 낭설은 없음
    const star = Object.keys(L.players).filter(function (id) {
      const p = L.players[id];
      return p.teamId && p.teamId !== rich.id && p.teamId !== my.id && findTeam(p.teamId).tier === 1 && p.contractEnd > year && !p.loan &&
        !list.some(function (r) { return r.id === id; }) && starterAt(p.teamId, p.pos) === id;
    }).sort(function (a, b) { return playerScore(b) - playerScore(a); })[i * 2];
    if (star) list.push({ id: star, name: L.players[star].name, pos: L.players[star].pos, end: L.players[star].contractEnd, from: L.players[star].teamId, to: rich.id, kind: "none", gain: 0, h: [stoveClamp(R.base.none + Math.random() * 6)] });
  });

  // 진짜 찌라시 몰래 정하기: 근거 있는 이적설 중 처음 가능성이 높을수록 잘 뽑힘 (r.t = 진짜, r.fk = 페이크 — 화면엔 안 보임)
  const pool = list.filter(function (r) { return r.kind !== "none"; });
  for (let k = 0; k < R.trueCount && pool.length; k++) {
    const total = pool.reduce(function (a, r) { return a + r.h[0]; }, 0);
    let x = Math.random() * total, i = 0;
    while (i < pool.length - 1 && (x -= pool[i].h[0]) > 0) i++;
    pool[i].t = true; pool.splice(i, 1);
  }
  for (let k = 0; k < R.fakeCount && pool.length; k++) pool.splice(Math.floor(Math.random() * pool.length), 1)[0].fk = true;
  L.stove = { year: year, list: list, used: {}, done: false };
}

// ----- 48~52주: 가능성 바뀜 -----
function stoveWeek() {
  const S = stoveOf(state.year), D = STOVE_RULES.drift;
  if (!S || S.done) return;
  const want = state.week - STOVE_RULES.startWeek + 1; // 이번 주까지 h 길이
  S.list.forEach(function (r) {
    while (r.h.length < want) {
      const last = r.h[r.h.length - 1];
      const p = findPlayer(r.id), t = findTeam(r.to);
      let d;
      const wk = STOVE_RULES.startWeek + r.h.length; // 이번에 채우는 주
      if (!stoveViable(p, t, state.year) && r.kind !== "none") d = D.blocked;
      else if (r.kind === "none") d = D.none + (Math.random() * 2 - 1) * 3;
      else if (r.t) d = D.real + Math.random() * D.realJitter;                       // 진짜: 꾸준히 오름
      else if (r.fk) d = wk <= D.fakeTurn ? D.fakeUp : D.fakeDown;                    // 페이크: 오르다 꺾임
      else d = D.fake + (Math.random() * 2 - 1) * D.fakeJitter;                      // 가짜: 흔들리며 내려감
      r.h.push(stoveClamp(last + d));
    }
  });
}

// ----- 새해: 찌라시 이적 먼저 실행 (contractsNewSeason, 계약 만료 정리 뒤 · 영입 라운드 전) -----
// 47주에 정한 진짜 찌라시(r.t)만 이동 (못 가게 됐으면 무산). 그 팀의 원래 영입 횟수에서 뺌 (offseasonRebuild가 used를 봄)
function stoveNewSeason(news) {
  const S = stoveOf(state.year - 1);
  if (!S || S.done) return {};
  S.done = true;
  const moved = {};
  S.list.slice().sort(function (a, b) { return b.h[b.h.length - 1] - a.h[a.h.length - 1]; }).forEach(function (r) {
    const p = findPlayer(r.id), t = findTeam(r.to);
    if (!p || p.retired || !t) { r.res = "fail"; return; }
    if (p.teamId === t.id) { r.res = "ok"; return; } // 이미 그 팀
    if (!r.t || moved[r.id] || (p.capKeep && state.year <= p.capKeep && p.teamId)) { r.res = "fail"; return; }
    const fee = stoveFee(p, state.year), salary = npcContractSalary(p.id, t.tier);
    if (!foreignOk(p.id, t.id) || !canAfford(t, { id: p.id, fee: fee, salary: salary })) { r.res = "fail"; return; }
    const from = p.teamId ? findTeam(p.teamId) : null;
    npcTransfer(p.id, t, fee, salary, "buy");
    moved[r.id] = true;
    S.used[t.id] = (S.used[t.id] || 0) + 1;
    r.res = "ok";
    news.push("🔥 찌라시 적중: " + t.name + ", " + (from ? from.name + "의 " : "FA ") + p.name + "(" + findPosition(p.pos).name + ") 영입" + (fee ? " · 이적료 " + moneyText(fee) : ""));
  });
  return moved;
}
// 새해 이적이 다 끝난 뒤(contractsNewSeason 끝): 적중 여부를 실제 소속팀으로 다시 판정 (찌라시로 옮긴 뒤 정리로 또 옮긴 경우 등)
function stoveFinalize() {
  const S = stoveOf(state.year - 1);
  if (!S || !S.done || S.final) return;
  S.final = true;
  S.list.forEach(function (r) { const p = findPlayer(r.id); r.res = p && p.teamId === r.to ? "ok" : "fail"; r.now = p ? p.teamId || "FA" : null; });
}
// offseasonRebuild: 찌라시로 이미 쓴 영입 수
function stoveUsed(teamId) {
  const S = stoveOf(state.year - 1);
  return S && S.used[teamId] || 0;
}

// ━━━━━ 화면: [이적 시장 → 🔥 찌라시] (시안 33 — 주차 → 📰 신문 띠 → 💬 커뮤니티 게시판, 오른쪽 우리 팀 소식) ━━━━━
// 글은 STOVE_TEXT(data/stove.js)에서 이적설·주차 번호로 골라 빈칸을 채움 (무작위 안 씀 → 정답지 그대로)
const stoveUI = { vw: null, open: null, cf: "all", more: false, listY: 0 };

// 지금 찌라시 탭이 보이나: 47~52주 · 새해 1~4주(결산)
function stoveTabOpen() {
  if (!state.league) return false;
  if (state.week >= STOVE_RULES.startWeek && stoveOf(state.year)) return true;
  const S = stoveOf(state.year - 1);
  return !!(S && S.final && state.week <= 4);
}
// 지금 보고 있는 찌라시 (올해 또는 새해 결산 중인 작년)
function stoveNow() { return state.week >= STOVE_RULES.startWeek ? stoveOf(state.year) : stoveOf(state.year - 1); }
function stoveWeeks(S) { // 주차 버튼: 47 … 지금(최대 52) + 새해면 "new"
  const last = S.year === state.year ? Math.min(state.week, STOVE_RULES.endWeek) : STOVE_RULES.endWeek;
  const out = [];
  for (let w = STOVE_RULES.startWeek; w <= last; w++) out.push(w);
  if (S.year !== state.year) out.push("new");
  return out;
}
function stoveWkName(S, w) { return w === "new" ? (S.year + 1) + "년 1주차" : w + "주차"; }
function stoveHash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function stovePick(arr, seed) { return arr[stoveHash(String(seed)) % arr.length]; }
function stoveIsMine(r) { const my = myTeam(); return r.to === my.id || r.from === my.id; }
function stoveTeamShort(id) { const t = id && findTeam(id); return t ? t.short || t.name : "FA"; }

// 빈칸 채우기 값 (지금 이름·스탯 — 은퇴·해외로 지워졌으면 저장된 이름)
function stoveVars(r) {
  const p = findPlayer(r.id);
  const top = p && p.stats ? STATS.slice().sort(function (a, b) { return p.stats[b.id] - p.stats[a.id]; }) : [];
  const st = findTeam(r.to) ? starterAt(r.to, r.pos) : null;
  return { player: p ? p.name : r.name, pos: findPosition(r.pos).name, age: p ? p.age : "-", score: p ? playerScore(r.id).toFixed(1) : "-",
    stat1: top[0] ? top[0].name : "-", v1: top[0] ? Math.round(p.stats[top[0].id]) : "-", stat2: top[1] ? top[1].name : "-", v2: top[1] ? Math.round(p.stats[top[1].id]) : "-",
    from: stoveTeamShort(r.from), to: stoveTeamShort(r.to), end: r.end || "-", gap: st && st !== r.id ? playerScore(st).toFixed(1) : "-",
    myTeam: stoveTeamShort(myTeam().id), me: state.player.name, n: "" };
}
function stoveFill(text, r, extra) {
  const v = Object.assign(r ? stoveVars(r) : { myTeam: stoveTeamShort(myTeam().id), me: state.player.name }, extra || {});
  return String(text).replace(/\{(\w+)\}/g, function (all, k) { return v[k] !== undefined ? v[k] : all; });
}
function stoveStageTag(st, dim) { return '<span class="sv-tag s' + st + (dim ? " dim" : "") + '">' + STOVE_UI.stage[st] + "</span>"; }
function stoveStep(r, w) { // 지난주보다 단계가 올랐으면 ▲, 내렸으면 ▼
  if (w === "new" || w <= STOVE_RULES.startWeek) return "";
  const a = stoveStage(stoveChance(r, w - 1)), b = stoveStage(stoveChance(r, w));
  return b > a ? '<span class="sv-up">▲</span>' : b < a ? '<span class="sv-down">▼</span>' : "";
}
function stoveWho(r) { // 한 줄: 지금 팀 · 이름 · 포지션 · 종합
  const p = findPlayer(r.id);
  const team = p && p.teamId && findTeam(p.teamId) ? teamMarkHTML(p.teamId, escapeHTML(stoveTeamShort(p.teamId))) : '<span class="muted">' + (p ? "FA" : "은퇴·해외") + "</span>";
  return team + " <b>" + escapeHTML(p ? p.name : r.name) + '</b> <span class="muted">' + findPosition(r.pos).name + "</span>" + (p ? ' <span class="sv-sc">종합 ' + playerScore(r.id).toFixed(1) + "</span>" : "");
}

// ----- 한 주의 글 -----
// 커뮤니티: 우리 팀 관련 먼저, 단계가 바뀐 것·높은 것 → 5개 (+ 47주 대어 정리, 50주 중간 정리, 52주 마감 정리)
function stovePostsFor(S, w) {
  if (w === "new") return [];
  const T = STOVE_TEXT, my = myTeam().id;
  const score = function (r) { return (stoveIsMine(r) ? 1000 : 0) + (stoveStep(r, w) ? 200 : 0) + stoveChance(r, w) + (stoveHash(r.id + w) % 30); };
  const posts = S.list.slice().sort(function (a, b) { return score(b) - score(a); }).slice(0, 5).map(function (r) {
    const st = stoveStage(stoveChance(r, w));
    const cat = r.to === my ? "toMine" : r.from === my ? "leave" : "other";
    const seed = r.id + ":" + w;
    return { key: "c:" + w + ":" + r.id, w: w, kind: "rumor", r: r, st: st, mine: stoveIsMine(r), title: stoveFill(stovePick(T.title[cat][st], seed), r),
      line: stoveFill(stovePick(T.why[r.kind] || T.why.end, seed), r), cm: 5 + stoveHash(seed) % 90, up: 20 + stoveHash(seed + "u") % 400, nick: stovePick(T.nicks, seed + "n") };
  });
  const ru = w === STOVE_RULES.startWeek ? "open" : w === STOVE_RULES.endWeek ? "close" : w === 50 ? "mid" : null;
  if (ru) {
    const R = stovePick(T.roundup[ru], S.year + ru);
    const items = ru === "open" ? S.list.filter(function (r) { return r.kind !== "none"; }).slice(0, 5) : S.list.filter(function (r) { return stoveStage(stoveChance(r, w)) >= 2; }).slice(0, 6);
    posts.splice(1, 0, { key: "c:" + w + ":round", w: w, kind: "list", R: R, items: items, title: stoveFill(R.title, null), line: R.intro.split("\n")[0], cm: 60 + stoveHash(ru) % 120, up: 300 + stoveHash(ru + "u") % 400, nick: stovePick(T.nicks, ru) });
  }
  return posts;
}
// 신문: 이적설이 그 주에 처음 '유력'이 되면 협상 기사 / 새해엔 결산 + 확정·무산
function stoveNewsFor(S, w) {
  const out = [], my = myTeam().id;
  if (w === "new") {
    out.push({ key: "n:new:result", w: w, kind: "result" });
    S.list.forEach(function (r) {
      if (r.res === "ok") out.push({ key: "n:new:" + r.id, w: w, kind: r.to === my ? "mineIn" : r.from === my ? "leftMine" : "official", r: r, mine: stoveIsMine(r) });
      else if (stoveStage(stoveChance(r, STOVE_RULES.endWeek)) >= 2) out.push({ key: "n:new:" + r.id, w: w, kind: "fail", r: r, mine: stoveIsMine(r) });
    });
  } else {
    S.list.forEach(function (r) {
      if (w > STOVE_RULES.startWeek && stoveStage(stoveChance(r, w)) >= 2 && stoveStage(stoveChance(r, w - 1)) < 2) out.push({ key: "n:" + w + ":" + r.id, w: w, kind: "talks", r: r, mine: stoveIsMine(r) });
    });
  }
  return out.sort(function (a, b) { return (b.kind === "result" ? 2 : b.mine ? 1 : 0) - (a.kind === "result" ? 2 : a.mine ? 1 : 0); });
}
function stoveNewsTag(k) { const t = k === "talks" || k === "fail" || k === "result" ? k : "official"; return '<span class="sv-ptag k-' + t + '">' + STOVE_UI.newsKind[t] + "</span>"; }
function stoveArticle(n, S) {
  const T = STOVE_TEXT;
  if (n.kind === "result") {
    const hit = S.list.filter(function (r) { return r.res === "ok"; }).length;
    const R = stovePick(T.roundup.result, S.year);
    return { head: stoveFill(R.title, null, { n: hit }), body: [stoveFill(R.intro.split("\n")[0], null, { n: hit })], quote: "", outlet: "e스포츠 데일리" };
  }
  const A = stovePick(T.news[n.kind], n.key);
  return { head: stoveFill(A.head, n.r), body: A.body.map(function (x) { return stoveFill(x, n.r); }), quote: stoveFill(A.quote, n.r), outlet: stovePick(T.outlets, n.key), reporter: stovePick(T.reporters, n.key + "r") };
}

// ----- 그리기 -----
function stoveRowHTML(p) {
  const tag = p.kind === "list" ? '<span class="sv-tag sum">정리</span>' : stoveStageTag(p.st) + stoveStep(p.r, p.w);
  return '<button class="sv-row" data-svopen="' + p.key + '"><span class="l1">' + tag + (p.mine ? '<span class="sv-mt">내 팀</span>' : "") + '<span class="ttl">' + escapeHTML(p.title) + '</span><span class="cm">댓글 ' + p.cm + "</span></span>" +
    '<span class="l2">' + escapeHTML(p.line) + "</span>" +
    '<span class="l3"><span class="who">' + (p.r ? stoveWho(p.r) : "") + '</span><span class="see">확인하기 ›</span></span></button>';
}
function stovePaperHTML(S, w) {
  const list = stoveNewsFor(S, w);
  const head = '<div class="sv-mast"><span>' + STOVE_UI.paperName + '</span><span class="d">' + stoveWkName(S, w) + "</span></div>";
  if (!list.length) return '<div class="sv-paper">' + head + '<p class="none">' + STOVE_UI.noNews + "</p></div>";
  const lim = window.innerWidth <= 860 && !stoveUI.more ? 2 : 6;
  return '<div class="sv-paper">' + head + '<div class="sv-pgrid">' + list.slice(0, lim).map(function (n) {
    const a = stoveArticle(n, S);
    return '<button class="sv-pitem" data-svopen="' + n.key + '"><span class="pt">' + stoveNewsTag(n.kind) + (n.mine ? '<span class="pm">내 팀</span>' : "") + '</span><span class="ph">' + escapeHTML(a.head) + '</span><span class="pf"><span>' + escapeHTML(a.outlet) + '</span><span class="go">기사 보기 ›</span></span></button>';
  }).join("") + "</div>" + (list.length > lim ? '<button class="sv-more" data-svmore="1">기사 ' + (list.length - lim) + "개 더 ›</button>" : "") + "</div>";
}
function stoveBoardHTML(S, w) {
  if (w === "new") return "";
  const list = stovePostsFor(S, w).filter(function (p) { return stoveUI.cf === "all" || p.mine; });
  return '<div class="sv-board"><div class="bh"><span>💬 커뮤니티 소문 <span class="muted">' + list.length + "개</span></span>" +
    '<button class="sv-mine' + (stoveUI.cf === "mine" ? " on" : "") + '" data-svcf="' + (stoveUI.cf === "mine" ? "all" : "mine") + '">' + (stoveUI.cf === "mine" ? "✔ " : "") + "내 팀 관련만</button></div>" +
    (list.length ? list.map(stoveRowHTML).join("") : '<p class="sv-empty">이번 주에는 우리 팀 관련 글이 없어요.</p>') + "</div>";
}
function stoveMyNewsHTML(S, w) {
  const my = myTeam().id, ww = w === "new" ? STOVE_RULES.endWeek : w;
  const rows = S.list.filter(function (r) { return r.to === my || r.from === my; }).map(function (r) {
    const v = stoveVars(r);
    const right = w === "new" ? '<span class="sv-tag ' + (r.res === "ok" ? "s3" : "s0") + ' dim">' + (r.res === "ok" ? "확정" : "무산") + "</span>" : stoveStageTag(stoveStage(stoveChance(r, ww)), true);
    return '<div class="sv-mrow"><span>' + (r.to === my ? "올 수도 " : "떠날 수도 ") + "<b>" + escapeHTML(v.player) + "</b> " + v.pos + (r.to === my ? "" : " → " + escapeHTML(v.to)) + "</span>" + right + "</div>";
  });
  return rows.length ? rows.join("") : '<div class="sv-mrow muted">우리 팀 관련 이적설이 없어요</div>';
}
function stoveSideHTML(S, w) {
  const ww = w === "new" ? STOVE_RULES.endWeek : w, cnt = [0, 0, 0, 0];
  S.list.forEach(function (r) { cnt[stoveStage(stoveChance(r, ww))]++; });
  return '<div class="sv-side"><div class="sv-box"><h3>' + teamMarkHTML(myTeam().id, escapeHTML(stoveTeamShort(myTeam().id))) + " 우리 팀 소식</h3>" + stoveMyNewsHTML(S, w) + "</div>" +
    '<div class="sv-box"><h3>전체 이적설 ' + S.list.length + '건</h3><div class="sv-stc">' + cnt.map(function (n, i) { return '<span><i class="s' + i + '"></i>' + STOVE_UI.stage[i] + " <b>" + n + "</b></span>"; }).join("") + "</div></div>" +
    '<details class="sv-box sv-help"><summary>찌라시 읽는 법</summary><p>' + escapeHTML(STOVE_UI.help) + "</p></details></div>";
}
function stoveMobileTopHTML(S, w) {
  const my = myTeam().id;
  const inn = S.list.filter(function (r) { return r.to === my; }).length, out = S.list.filter(function (r) { return r.from === my; }).length;
  return '<details class="sv-mtop"><summary>' + teamMarkHTML(my, escapeHTML(stoveTeamShort(my))) + " 올 수도 " + inn + " · 떠날 수도 " + out + "</summary>" + stoveMyNewsHTML(S, w) + "</details>";
}
function stoveInfoHTML(r, w) {
  const v = stoveVars(r), p = findPlayer(r.id), ww = w === "new" ? STOVE_RULES.endWeek : w;
  return '<table class="sv-info"><caption>' + stoveWho(r) + "</caption>" +
    "<tr><th>나이</th><td>" + v.age + (p ? "세" : "") + "</td><th>계약</th><td>" + (p && p.teamId ? p.contractEnd + "년까지" : "FA") + "</td></tr>" +
    "<tr><th>" + escapeHTML(v.stat1) + "</th><td>" + v.v1 + "</td><th>" + escapeHTML(v.stat2) + "</th><td>" + v.v2 + "</td></tr>" +
    (w === "new" // 새해: 결과 / 그 전: 예상 행선지 + 그 팀 주전 종합 (예상할 근거)
      ? '<tr><th>결과</th><td colspan="3">' + (r.res === "ok" ? "✅ " + teamMarkHTML(r.to, escapeHTML(v.to)) + " 이적" : "❌ " + escapeHTML(v.to) + "행 무산") + "</td></tr></table>"
      : '<tr><th>예상 행선지</th><td colspan="3">' + teamMarkHTML(r.to, escapeHTML(v.to)) + " " + stoveStageTag(stoveStage(stoveChance(r, ww)), true) + ' <span class="muted small">(' + escapeHTML(v.to) + " " + v.pos + " 주전 종합 " + v.gap + ")</span></td></tr></table>");
}
function stoveDetailHTML(S, key) {
  const back = '<button class="sv-back" data-svclose="1">← 목록으로</button>';
  const part = key.split(":")[1], w = part === "new" ? "new" : Number(part);
  if (key.indexOf("n:") === 0) {
    const n = stoveNewsFor(S, w).find(function (x) { return x.key === key; });
    if (!n) return null;
    const a = stoveArticle(n, S);
    const items = n.kind === "result" ? '<ol class="sv-items">' + S.list.filter(function (r) { return r.kind !== "none"; }).map(function (r) { return "<li>" + (r.res === "ok" ? "✅ " : "❌ ") + stoveWho(r) + " → " + teamMarkHTML(r.to, escapeHTML(stoveVars(r).to)) + "</li>"; }).join("") + "</ol>" : "";
    return '<article class="sv-detail sv-paperd">' + back + '<div class="outlet">' + escapeHTML(a.outlet) + " · 스토브 리그</div>" + stoveNewsTag(n.kind) + "<h2>" + escapeHTML(a.head) + '</h2><div class="by">' + (a.reporter ? escapeHTML(a.reporter) + " 기자 · " : "") + stoveWkName(S, w) + "</div>" +
      '<div class="body">' + a.body.map(function (x) { return "<p>" + escapeHTML(x) + "</p>"; }).join("") + (a.quote ? "<blockquote>" + escapeHTML(a.quote) + "</blockquote>" : "") + items + "</div>" + (n.r ? stoveInfoHTML(n.r, w) : "") + "</article>";
  }
  const p = stovePostsFor(S, w).find(function (x) { return x.key === key; });
  if (!p) return null;
  const T = STOVE_TEXT, seed = p.key;
  const head = '<div class="dh">' + (p.kind === "list" ? '<span class="sv-tag sum">정리</span>' : stoveStageTag(p.st) + stoveStep(p.r, w)) + (p.mine ? '<span class="sv-mt">내 팀</span>' : "") +
    "<h2>" + escapeHTML(p.title) + '</h2><div class="by">' + escapeHTML(p.nick) + " · " + stoveWkName(S, w) + " · 조회 " + (p.up * 7).toLocaleString() + " · 👍 " + p.up + "</div></div>";
  let body, cm;
  if (p.kind === "list") {
    body = "<p>" + escapeHTML(p.R.intro.split("\n")[0]) + '</p><ol class="sv-items">' + p.items.map(function (r) { return "<li>" + stoveWho(r) + " → " + teamMarkHTML(r.to, escapeHTML(stoveVars(r).to)) + " " + stoveStageTag(stoveStage(stoveChance(r, w)), true) + "</li>"; }).join("") + "</ol>";
    cm = p.R.comments.map(function (c, i) { return [stovePick(T.nicks, seed + i), "", c, 30 + stoveHash(seed + i) % 90]; });
  } else {
    const r = p.r, v = stoveVars(r);
    body = stovePick(T.thread[p.st], seed).map(function (x) { return "<p>" + escapeHTML(stoveFill(x, r)) + "</p>"; }).join("") + stoveInfoHTML(r, w);
    cm = [[stovePick(T.nicks, seed + "a"), v.to + " 팬", stoveFill(stovePick(T.comments.toFan, seed), r), 90 + stoveHash(seed + "a") % 120],
      [stovePick(T.nicks, seed + "b"), r.from ? v.from + " 팬" : "", stoveFill(stovePick(T.comments.fromFan, seed), r), 40 + stoveHash(seed + "b") % 80],
      [stovePick(T.nicks, seed + "c"), "", stoveFill(stovePick(T.comments.neutral, seed), r), 20 + stoveHash(seed + "c") % 60],
      [stovePick(T.nicks, seed + "d"), "", stoveFill(stovePick(T.comments.skeptic, seed), r), 10 + stoveHash(seed + "d") % 50]];
    if (r.to === myTeam().id) cm.splice(1, 0, [stovePick(T.nicks, seed + "e"), v.myTeam + " 팬", stoveFill(stovePick(T.comments.myFan, seed), r), 60 + stoveHash(seed + "e") % 90]);
  }
  return '<article class="sv-detail">' + back + head + '<div class="body">' + body + "</div>" +
    '<div class="sv-cmts"><h3>댓글 ' + p.cm + "개 중 주요 반응</h3>" + cm.map(function (c, i) {
      return '<div class="sv-cmt' + (i === 0 ? " best" : "") + '"><div class="cw"><b>' + escapeHTML(c[0]) + "</b>" + (c[1] ? '<span class="fan">' + escapeHTML(c[1]) + "</span>" : "") + (i === 0 ? '<span class="bst">베스트</span>' : "") + "</div><p>" + escapeHTML(c[2]) + '</p><span class="lk">👍 ' + c[3] + "</span></div>";
    }).join("") + "</div></article>";
}

pages.rumors = function () {
  const S = stoveNow();
  if (!S) return "<h1>🔥 찌라시</h1>" + emptyBoxHTML("🔥", "찌라시는 비시즌(" + STOVE_RULES.startWeek + "~" + STOVE_RULES.endWeek + "주)에 올라와요.");
  const weeks = stoveWeeks(S);
  let vw = stoveUI.vw;
  if (weeks.indexOf(vw) === -1) vw = weeks[weeks.length - 1];
  if (stoveUI.open) {
    const d = stoveDetailHTML(S, stoveUI.open);
    if (d) return "<h1>🔥 찌라시</h1>" + '<div class="sv no-link"><div class="sv-dwrap">' + d + "</div></div>";
    stoveUI.open = null;
  }
  const chips = '<div class="sv-weeks">' + weeks.map(function (w, i) {
    return '<button data-svwk="' + w + '" class="' + (w === vw ? "on" : "") + '">' + stoveWkName(S, w) + (w === "new" ? " · 결산" : i === weeks.length - 1 ? " · 이번 주" : "") + "</button>";
  }).join("") + "</div>";
  return "<h1>🔥 찌라시</h1>" + '<div class="sv">' + stoveMobileTopHTML(S, vw) + '<div class="sv-split"><div class="sv-main">' + chips + stovePaperHTML(S, vw) + stoveBoardHTML(S, vw) + "</div>" + stoveSideHTML(S, vw) + "</div></div>";
};

// renderPage에서 (js/main.js)
function bindStove(page) {
  const root = page.querySelector(".sv");
  if (!root) return;
  root.onclick = function (e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-svwk")) { const v = b.getAttribute("data-svwk"); stoveUI.vw = v === "new" ? "new" : Number(v); stoveUI.more = false; }
    else if (b.hasAttribute("data-svopen")) { stoveUI.listY = window.scrollY; stoveUI.open = b.getAttribute("data-svopen"); renderPage(); window.scrollTo(0, 0); return; }
    else if (b.hasAttribute("data-svclose")) { stoveUI.open = null; renderPage(); window.scrollTo(0, stoveUI.listY || 0); return; }
    else if (b.hasAttribute("data-svcf")) { stoveUI.cf = b.getAttribute("data-svcf"); }
    else if (b.hasAttribute("data-svmore")) { stoveUI.more = true; }
    else return;
    renderPage();
  };
}
