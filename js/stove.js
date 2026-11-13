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
  const pool = list.filter(function (r) { return r.kind !== "none" && r.to !== my.id; }); // 우리 팀행은 내 행동으로만 (마감 판정)
  for (let k = 0; k < R.trueCount && pool.length; k++) {
    const total = pool.reduce(function (a, r) { return a + r.h[0]; }, 0);
    let x = Math.random() * total, i = 0;
    while (i < pool.length - 1 && (x -= pool[i].h[0]) > 0) i++;
    pool[i].t = true; pool.splice(i, 1);
  }
  for (let k = 0; k < R.fakeCount && pool.length; k++) pool.splice(Math.floor(Math.random() * pool.length), 1)[0].fk = true;
  L.stove = { year: year, team: my.id, list: list, used: {}, done: false }; // team = 47주의 우리 팀 (새해에 내가 팀을 옮겨도 이 팀 기준)
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
      const M = STOVE_RULES.mineDrift;
      if (r.to === (S.team || myTeam().id)) d = M.base + (Math.random() * 2 - 1) * M.jitter;       // 우리 팀행: 행동이 없으면 조금씩 식음
      else if (!stoveViable(p, t, state.year) && r.kind !== "none") d = D.blocked;
      else if (r.kind === "none") d = D.none + (Math.random() * 2 - 1) * 3;
      else if (r.t) d = D.real + Math.random() * D.realJitter;                       // 진짜: 꾸준히 오름
      else if (r.fk) d = wk <= D.fakeTurn ? D.fakeUp : D.fakeDown;                    // 페이크: 오르다 꺾임
      else d = D.fake + (Math.random() * 2 - 1) * D.fakeJitter;                      // 가짜: 흔들리며 내려감
      r.h.push(stoveClamp(last + d + (r.boost || 0))); // 지난주 내 행동 효과 (3단계)
      r.boost = 0;
    }
  });
}

// ----- 새해: 찌라시 이적 먼저 실행 (contractsNewSeason, 계약 만료 정리 뒤 · 영입 라운드 전) -----
// 47주에 정한 진짜 찌라시(r.t)만 이동 (못 가게 됐으면 무산). 그 팀의 원래 영입 횟수에서 뺌 (offseasonRebuild가 used를 봄)
function stoveNewSeason(news) {
  const S = stoveOf(state.year - 1);
  if (!S || S.done) return {};
  S.done = true;
  const moved = {}, my = findTeam(S.team) || myTeam(), judge = STOVE_RULES.judge; // 47주의 우리 팀 (새해에 내가 먼저 팀을 옮겨도)
  // 52주 행동 효과는 판정 직전에
  S.list.forEach(function (r) { if (r.boost) { r.h[r.h.length - 1] = stoveClamp(r.h[r.h.length - 1] + r.boost); r.boost = 0; } });
  const last = function (r) { return r.h[r.h.length - 1]; };
  // ① 우리 팀행: '유력' 이상이면 확정 (가능성 높은 순 최대 signMax, 계약 남은 1부 주전도 — sellable 예외, 외국인·돈은 지킴)
  let signed = 0;
  S.list.filter(function (r) { return r.to === my.id; }).sort(function (a, b) { return last(b) - last(a); }).forEach(function (r) {
    const p = findPlayer(r.id);
    r.res = "fail";
    if (signed >= STOVE_RULES.signMax || last(r) < judge || !p || p.retired || p.teamId === my.id || moved[r.id]) return;
    const fee = stoveFee(p, state.year), salary = npcContractSalary(p.id, my.tier);
    if (!foreignOk(p.id, my.id) || !canAfford(my, { id: p.id, fee: fee, salary: salary })) return;
    const from = p.teamId ? findTeam(p.teamId) : null;
    npcTransfer(p.id, my, fee, salary, "buy");
    p.capKeep = state.year; // 이번 시즌 동안 은퇴·이적·방출 안 함 (318 주장 의견과 같은 보호)
    moved[r.id] = true; signed++;
    S.used[my.id] = (S.used[my.id] || 0) + 1;
    r.res = "ok";
    news.push("🕵️ 스토브 리그: " + my.name + ", " + (from ? from.name + "의 " : "FA ") + p.name + "(" + findPosition(p.pos).name + ") 영입 확정" + (fee ? " · 이적료 " + moneyText(fee) : ""));
  });
  S.list.filter(function (r) { return r.to !== my.id; }).slice().sort(function (a, b) { return b.h[b.h.length - 1] - a.h[a.h.length - 1]; }).forEach(function (r) {
    const p = findPlayer(r.id), t = findTeam(r.to);
    if (!p || p.retired || !t) { r.res = "fail"; return; }
    if (p.teamId === t.id) { r.res = "ok"; return; } // 이미 그 팀
    // 진짜 찌라시라도 붙잡기로 '유력' 아래로 내려가면 잔류
    if (!r.t || last(r) < judge || moved[r.id] || (p.capKeep && state.year <= p.capKeep && p.teamId)) { r.res = "fail"; return; }
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
// 스토브 리그의 '우리 팀' = 47주에 내가 있던 팀 (S.team) — 새해에 내가 팀을 옮겨도 결산은 그 팀 기준
function stoveMyId() { const S = stoveNow(); return (S && S.team) || myTeam().id; }
function stoveIsMine(r) { const my = stoveMyId(); return r.to === my || r.from === my; }
function stoveTeamShort(id) { const t = id && findTeam(id); return t ? t.short || t.name : "FA"; }

// 빈칸 채우기 값 (지금 이름·스탯 — 은퇴·해외로 지워졌으면 저장된 이름)
function stoveVars(r) {
  const p = findPlayer(r.id);
  const top = p && p.stats ? STATS.slice().sort(function (a, b) { return p.stats[b.id] - p.stats[a.id]; }) : [];
  const st = findTeam(r.to) ? starterAt(r.to, r.pos) : null;
  return { player: p ? p.name : r.name, pos: findPosition(r.pos).name, age: p ? p.age : "-", score: p ? playerScore(r.id).toFixed(1) : "-",
    stat1: top[0] ? top[0].name : "-", v1: top[0] ? Math.round(p.stats[top[0].id]) : "-", stat2: top[1] ? top[1].name : "-", v2: top[1] ? Math.round(p.stats[top[1].id]) : "-",
    from: stoveTeamShort(r.from), to: stoveTeamShort(r.to), end: r.end || "-", gap: st && st !== r.id ? playerScore(st).toFixed(1) : "-",
    myTeam: stoveTeamShort(stoveMyId()), me: state.player.name, n: "" };
}
function stoveFill(text, r, extra) {
  const v = Object.assign(r ? stoveVars(r) : { myTeam: stoveTeamShort(stoveMyId()), me: state.player.name }, extra || {});
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
  const T = STOVE_TEXT, my = stoveMyId();
  const live = S.list.filter(function (r) { return !r.since || r.since <= w; }); // 행동으로 생긴 이적설은 생긴 주부터
  const score = function (r) { return (stoveIsMine(r) ? 1000 : 0) + (stoveStep(r, w) ? 200 : 0) + stoveChance(r, w) + (stoveHash(r.id + w) % 30); };
  const posts = live.slice().sort(function (a, b) { return score(b) - score(a); }).slice(0, 5).map(function (r) {
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
  // 지난주 내 행동 → 이번 주 반향 글 (맨 위)
  (S.acts || []).filter(function (a) { return a.w === w - 1; }).forEach(function (a, i) {
    const r = S.list.find(function (x) { return x.id === a.id && (a.act === "keep" ? x.from === my : x.to === my); });
    if (!r) return;
    const E = stovePick(T.echo[a.back ? "backfire" : a.act], a.id + w);
    posts.unshift({ key: "c:" + w + ":echo" + i, w: w, kind: "echo", E: E, r: r, st: stoveStage(stoveChance(r, w)), mine: true, title: stoveFill(E.title, r), line: stoveFill(E.lines[0], r),
      cm: 20 + stoveHash(a.id + "e") % 80, up: 60 + stoveHash(a.id + "u") % 300, nick: stovePick(T.nicks, a.id + "echo") });
  });
  return posts;
}
// 신문: 이적설이 그 주에 처음 '유력'이 되면 협상 기사 / 새해엔 결산 + 확정·무산
function stoveNewsFor(S, w) {
  const out = [], my = stoveMyId();
  if (w === "new") {
    out.push({ key: "n:new:result", w: w, kind: "result" });
    S.list.forEach(function (r) {
      if (r.res === "ok") out.push({ key: "n:new:" + r.id + ":" + r.to, w: w, kind: r.to === my ? "mineIn" : r.from === my ? "leftMine" : "official", r: r, mine: stoveIsMine(r) });
      else if (r.from === my && (S.acts || []).some(function (a) { return a.act === "keep" && a.id === r.id; })) out.push({ key: "n:new:" + r.id + ":" + r.to, w: w, kind: "stay", r: r, mine: true }); // 붙잡기 성공
      else if (stoveStage(stoveChance(r, STOVE_RULES.endWeek)) >= 2) out.push({ key: "n:new:" + r.id + ":" + r.to, w: w, kind: "fail", r: r, mine: stoveIsMine(r) });
    });
  } else {
    S.list.forEach(function (r) {
      if (w > STOVE_RULES.startWeek && (!r.since || r.since < w) && stoveStage(stoveChance(r, w)) >= 2 && stoveStage(stoveChance(r, w - 1)) < 2) out.push({ key: "n:" + w + ":" + r.id, w: w, kind: "talks", r: r, mine: stoveIsMine(r) });
    });
  }
  return out.sort(function (a, b) { return (b.kind === "result" ? 2 : b.mine ? 1 : 0) - (a.kind === "result" ? 2 : a.mine ? 1 : 0); });
}
// stay(잔류)·mineIn·leftMine 기사 꼬리표는 '확정'
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
  const tag = p.kind === "list" ? '<span class="sv-tag sum">정리</span>' : p.kind === "echo" ? '<span class="sv-tag echo">반응</span>' : stoveStageTag(p.st) + stoveStep(p.r, p.w);
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
  const my = stoveMyId(), ww = w === "new" ? STOVE_RULES.endWeek : w;
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
  return '<div class="sv-side"><div class="sv-box"><h3>' + teamMarkHTML(stoveMyId(), escapeHTML(stoveTeamShort(stoveMyId()))) + " 우리 팀 소식</h3>" + stoveMyNewsHTML(S, w) + stoveActRowHTML(S) + "</div>" +
    '<div class="sv-box"><h3>전체 이적설 ' + S.list.length + '건</h3><div class="sv-stc">' + cnt.map(function (n, i) { return '<span><i class="s' + i + '"></i>' + STOVE_UI.stage[i] + " <b>" + n + "</b></span>"; }).join("") + "</div></div>" +
    '<details class="sv-box sv-help"><summary>찌라시 읽는 법</summary><p>' + escapeHTML(STOVE_UI.help) + "</p></details></div>";
}
function stoveMobileTopHTML(S, w) {
  const my = stoveMyId();
  const inn = S.list.filter(function (r) { return r.to === my; }).length, out = S.list.filter(function (r) { return r.from === my; }).length;
  return '<details class="sv-mtop"><summary>' + teamMarkHTML(my, escapeHTML(stoveTeamShort(my))) + " 올 수도 " + inn + " · 떠날 수도 " + out + (stoveActOpen() ? " · " + (stoveActedThisWeek(S) ? STOVE_UI.statusDone : STOVE_UI.statusLeft) : "") + "</summary>" + stoveMyNewsHTML(S, w) + stoveActRowHTML(S) + "</details>";
}
function stoveActRowHTML(S) { // 우리 팀 소식 아래: 이번 주 행동 + 스토브 리그로
  if (!stoveActOpen() || S.year !== state.year) return "";
  return '<div class="sv-mrow"><span class="muted">이번 주 행동</span><b' + (stoveActedThisWeek(S) ? "" : ' class="ok"') + ">" + (stoveActedThisWeek(S) ? "완료" : "1회 남음") + "</b></div>" +
    '<button class="sv-wide" data-svtab="stove">🕵️ 스토브 리그에서 행동하기 ›</button>';
}
function stoveInfoHTML(r, w) {
  const v = stoveVars(r), p = findPlayer(r.id), ww = w === "new" ? STOVE_RULES.endWeek : w;
  return '<table class="sv-info"><caption>' + stoveWho(r) + "</caption>" +
    "<tr><th>나이</th><td>" + v.age + (p ? "세" : "") + "</td><th>계약</th><td>" + (p && p.teamId ? p.contractEnd + "년까지" : "FA") + "</td></tr>" +
    "<tr><th>" + escapeHTML(v.stat1) + "</th><td>" + v.v1 + "</td><th>" + escapeHTML(v.stat2) + "</th><td>" + v.v2 + "</td></tr>" +
    (w === "new" // 새해: 결과 / 그 전: 예상 행선지 + 그 팀 주전 종합 (예상할 근거)
      ? '<tr><th>결과</th><td colspan="3">' + (r.res === "ok" ? "✅ " + teamMarkHTML(r.to, escapeHTML(v.to)) + " 이적" : "❌ " + escapeHTML(v.to) + "행 무산") + "</td></tr></table>"
      : '<tr><th>예상 행선지</th><td colspan="3">' + teamMarkHTML(r.to, escapeHTML(v.to)) + " " + stoveStageTag(stoveStage(stoveChance(r, ww)), true) + ' <span class="muted small">(' + escapeHTML(v.to) + " " + v.pos + " 주전 종합 " + v.gap + ")</span></td></tr></table>" +
        (p && p.id !== USER_ID && stoveActOpen() ? '<button class="sv-golink" data-svgo="' + r.id + '">' + STOVE_UI.goAct + "</button>" : ""));
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
  if (p.kind === "echo") {
    body = p.E.lines.map(function (x) { return "<p>" + escapeHTML(stoveFill(x, p.r)) + "</p>"; }).join("") + stoveInfoHTML(p.r, w);
    cm = p.E.comments.map(function (c, i) { return [stovePick(T.nicks, seed + i), i === 0 ? stoveTeamShort(stoveMyId()) + " 팬" : "", stoveFill(c, p.r), 40 + stoveHash(seed + i) % 120]; });
  } else if (p.kind === "list") {
    body = "<p>" + escapeHTML(p.R.intro.split("\n")[0]) + '</p><ol class="sv-items">' + p.items.map(function (r) { return "<li>" + stoveWho(r) + " → " + teamMarkHTML(r.to, escapeHTML(stoveVars(r).to)) + " " + stoveStageTag(stoveStage(stoveChance(r, w)), true) + "</li>"; }).join("") + "</ol>";
    cm = p.R.comments.map(function (c, i) { return [stovePick(T.nicks, seed + i), "", c, 30 + stoveHash(seed + i) % 90]; });
  } else {
    const r = p.r, v = stoveVars(r);
    body = stovePick(T.thread[p.st], seed).map(function (x) { return "<p>" + escapeHTML(stoveFill(x, r)) + "</p>"; }).join("") + stoveInfoHTML(r, w);
    cm = [[stovePick(T.nicks, seed + "a"), v.to + " 팬", stoveFill(stovePick(T.comments.toFan, seed), r), 90 + stoveHash(seed + "a") % 120],
      [stovePick(T.nicks, seed + "b"), r.from ? v.from + " 팬" : "", stoveFill(stovePick(T.comments.fromFan, seed), r), 40 + stoveHash(seed + "b") % 80],
      [stovePick(T.nicks, seed + "c"), "", stoveFill(stovePick(T.comments.neutral, seed), r), 20 + stoveHash(seed + "c") % 60],
      [stovePick(T.nicks, seed + "d"), "", stoveFill(stovePick(T.comments.skeptic, seed), r), 10 + stoveHash(seed + "d") % 50]];
    if (r.to === stoveMyId()) cm.splice(1, 0, [stovePick(T.nicks, seed + "e"), v.myTeam + " 팬", stoveFill(stovePick(T.comments.myFan, seed), r), 60 + stoveHash(seed + "e") % 90]);
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

// SNS 신문(📰 소식)에도 같은 기사 (Codex 주의: 두 곳의 기사 내용이 같게 — stoveArticle 하나로)
// 48~52주: 그 주 협상 기사 1개(우리 팀 관련 먼저) / 새해: 결산 + 우리 팀 관련 기사. 글만 실음 (게임 결과·난수 그대로)
function stovePaperToSns(newYear) {
  const S = newYear ? stoveOf(state.year - 1) : stoveOf(state.year);
  if (!S) return;
  let list = stoveNewsFor(S, newYear ? "new" : state.week);
  list = newYear ? list.filter(function (n) { return n.kind === "result" || n.mine; }) : list.slice(0, 1);
  list.forEach(function (n) {
    const a = stoveArticle(n, S);
    publishHeadline({ key: "stove", headline: "🔥 " + a.head, body: a.body.concat(a.quote ? [a.quote] : []).concat(["— " + a.outlet + " · 자세한 건 [이적 시장 → 🔥 찌라시]"]).join(String.fromCharCode(10)), mine: !!n.mine }, { variant: n.key });
  });
}

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
    else if (b.hasAttribute("data-svgo")) { stoveUI.open = null; stoveGoAct(b.getAttribute("data-svgo")); return; }
    else if (b.hasAttribute("data-svtab")) { selectMenu(b.getAttribute("data-svtab")); return; }
    else return;
    renderPage();
  };
}

// ━━━━━ 3단계: [이적 시장 → 🕵️ 스토브 리그] 행동 (47~52주, 한 주에 1번) ━━━━━
// 다른 팀·FA 선수: 📝 커뮤니티 글 · 💬 직접 연락 · 🗣️ 감독 건의 → '우리 팀행' 이적설(없으면 새로)의 가능성 ↑
// 우리 팀 선수: 🤝 붙잡기 → '떠날' 이적설 가능성 ↓
// 효과는 다음 주(stoveWeek)에 반영 (r.boost), 52주 행동은 새해 판정 직전에. 행동 기록 S.acts = [{ w, id, act, ok, back }] → 다음 주 찌라시에 반향 글
// 마감(새해): 우리 팀행 이적설이 '유력'(STOVE_RULES.judge) 이상이면 확정, 가능성 높은 순 최대 2명 (사용자 결정, 계약 남은 1부 주전도 — sellable 예외)
function stoveActOpen() {
  const S = stoveOf(state.year);
  return !!(S && !S.done && state.week >= STOVE_RULES.startWeek && state.week <= STOVE_RULES.endWeek);
}
function stoveActedThisWeek(S) { return (S.acts || []).some(function (a) { return a.w === state.week; }); }
function stoveRumorTo(S, id) { const my = S.team || myTeam().id; return S.list.find(function (r) { return r.id === id && r.to === my; }); }
function stoveRumorLeave(S, id) { const my = S.team || myTeam().id; return S.list.find(function (r) { return r.id === id && r.from === my && r.to !== my; }); }
function stoveSignCount(S, w) { // 지금 '유력' 이상인 우리 팀행 이적설 수
  const my = S.team || myTeam().id;
  return S.list.filter(function (r) { return r.to === my && stoveChance(r, w) + (r.boost || 0) >= STOVE_RULES.judge; }).length;
}

// 못 고르는 이유 (없으면 null) — 영입 행동(post·dm·boss)
function stoveLockWhy(p) {
  const my = myTeam(), U = STOVE_UI.lock;
  if (!p || p.id === USER_ID) return U.me;
  if (p.teamId === my.id) return null; // 우리 팀 선수는 붙잡기로
  if (p.retired) return U.gone;
  if (p.pos === state.player.position) return U.myPos;
  if (p.loan) return U.loan;
  if (p.capKeep && state.year <= p.capKeep && p.teamId) return U.kept;
  if (!foreignOk(p.id, my.id)) return U.foreign;
  return null;
}
function stoveActLock(S, p, act) {
  const U = STOVE_UI.lock;
  if (stoveActedThisWeek(S)) return U.done;
  if (act === "keep") return p.teamId === myTeam().id && stoveRumorLeave(S, p.id) ? null : U.noLeave;
  const why = stoveLockWhy(p);
  if (why) return why;
  if (act === "boss" && standingValue() < STOVE_RULES.act.boss.need) return U.boss.replace("{need}", STOVE_RULES.act.boss.need).replace("{now}", standingValue());
  return null;
}

// 행동 하기 → { ok, text, notes }
function stoveDoAct(id, act) {
  const S = stoveOf(state.year), A = STOVE_RULES.act, my = myTeam(), p = findPlayer(id);
  if (!S || !stoveActOpen() || !p || stoveActLock(S, p, act)) return null;
  const notes = [];
  let r, ok = true, back = false;
  if (act === "keep") {
    r = stoveRumorLeave(S, id);
    r.boost = (r.boost || 0) + A.keep.down;
    changeRelation(id, A.keep.rel, notes);
  } else {
    r = stoveRumorTo(S, id);
    if (!r) { // 우리 팀행 이적설 새로 (지금까지 주는 낭설 값으로 채움)
      const n = state.week - STOVE_RULES.startWeek + 1, st = starterAt(my.id, p.pos);
      r = { id: p.id, name: p.name, pos: p.pos, end: p.contractEnd, from: p.teamId || null, to: my.id, kind: p.teamId ? (p.contractEnd <= state.year ? "end" : "none") : "fa",
        gain: Math.round((playerScore(p.id) - (st ? playerScore(st) : 0)) * 10) / 10, h: [], mine: true, since: state.week };
      for (let i = 0; i < n; i++) r.h.push(A.newBase);
      S.list.push(r);
    }
    r.mine = true;
    let d = 0;
    if (act === "post") {
      if (Math.random() < A.post.backfire) { back = true; ok = false; d = A.post.backDown; addReputationStove(A.post.rep, notes); }
      else d = A.post.up;
    } else if (act === "dm") {
      if (Math.random() < A.dm.fail) { ok = false; changeRelation(id, A.dm.rel, notes); }
      else d = relationOf(id) >= FRIEND_RULES.friendFrom ? A.dm.friendUp : A.dm.up;
    } else if (act === "boss") {
      d = A.boss.up;
      const ST = ensureStanding();
      if (!ST.captain) { ST.stovePen = { y: state.year, v: (ST.stovePen && ST.stovePen.y === state.year ? ST.stovePen.v : 0) + A.boss.pen }; notes.push(STOVE_UI.bossNote.replace("{n}", A.boss.pen)); }
    }
    r.boost = (r.boost || 0) + d;
  }
  if (!S.acts) S.acts = [];
  S.acts.push({ w: state.week, id: id, act: act, ok: ok, back: back });
  const T = STOVE_TEXT.act[act][ok ? "ok" : "bad"];
  return { ok: ok, text: stoveFill(stovePick(T, id + state.week), r), notes: notes };
}
function addReputationStove(v, notes) {
  const before = state.reputation;
  state.reputation = Math.max(-100, Math.min(100, state.reputation + v));
  if (notes && state.reputation !== before) notes.push("📉 평판 " + (state.reputation - before));
}

// ----- 화면 -----
const stoveActUI = { team: null, pid: null, act: null, msg: null, q: "" };
function stoveActTeams() { return state.league.teams.slice().sort(function (a, b) { return a.tier - b.tier; }); }
function stoveActRowsHTML(S) {
  const my = myTeam().id, sel = stoveActUI.team || my;
  const cnt = function (tid) { return S.list.filter(function (r) { return r.from === tid || r.to === tid; }).length; };
  const row = function (t) {
    const n = cnt(t.id);
    return '<button class="sa-trow' + (sel === t.id ? " on" : "") + '" data-satm="' + t.id + '">' + teamMarkHTML(t.id, "<b>" + escapeHTML(t.name) + "</b>") + (t.id === my ? '<span class="sv-mt">내 팀</span>' : "") + (n ? '<span class="fire">이적설 ' + n + "</span>" : "") + "</button>";
  };
  const T = stoveActTeams();
  return '<div class="sa-lg"><h4>1부</h4>' + T.filter(function (t) { return t.tier === 1; }).map(row).join("") + "</div>" +
    '<div class="sa-lg"><h4>2부</h4>' + T.filter(function (t) { return t.tier !== 1; }).map(row).join("") + "</div>" +
    '<div class="sa-lg"><button class="sa-trow' + (sel === "FA" ? " on" : "") + '" data-satm="FA">🧳 <b>' + STOVE_UI.fa + '</b><span class="fire">' + state.league.freeAgents.filter(function (x) { return state.league.players[x]; }).length + "명</span></button></div>";
}
function stoveActRosterHTML(S) {
  const my = myTeam().id, sel = stoveActUI.team || my, w = state.week;
  const ids = sel === "FA" ? state.league.freeAgents.filter(function (x) { return state.league.players[x]; }) : findTeam(sel).roster;
  const list = ids.slice().sort(function (a, b) { return POSITION_IDS.indexOf(playerPos(a)) - POSITION_IDS.indexOf(playerPos(b)); });
  const head = sel === "FA" ? "🧳 <b>" + STOVE_UI.fa + "</b>" : teamMarkHTML(sel, "<b>" + escapeHTML(findTeam(sel).name) + "</b>");
  return '<div class="sa-roster"><div class="rh">' + head + "</div>" + list.map(function (id) {
    if (id === USER_ID) return '<div class="sa-prow lock"><span class="pos">' + findPosition(state.player.position).name + '</span><b class="nm">' + escapeHTML(state.player.name) + ' <span class="muted small">나</span></b><span class="sc"></span><span class="rt"></span></div>';
    const p = findPlayer(id), rt = stoveRumorTo(S, id), rl = stoveRumorLeave(S, id) || S.list.find(function (r) { return r.id === id && r.to !== my; });
    const r = rt || rl, why = p.teamId === my ? null : stoveLockWhy(p);
    const tag = r ? stoveStageTag(stoveStage(stoveChance(r, w)), true) + " → " + escapeHTML(stoveTeamShort(r.to)) : "";
    return '<button class="sa-prow' + (stoveActUI.pid === id ? " on" : "") + (why ? " lock" : "") + '" data-sapl="' + id + '"><span class="pos">' + findPosition(p.pos).name + '</span><b class="nm">' + escapeHTML(p.name) + '</b><span class="sc">' + playerScore(id).toFixed(1) + '</span><span class="rt">' + tag + "</span></button>";
  }).join("") + "</div>";
}
function stoveActCardHTML(S) {
  const id = stoveActUI.pid, p = id && findPlayer(id);
  if (!p) return '<p class="sa-hint">' + STOVE_UI.pickHint + "</p>";
  const my = myTeam().id, ours = p.teamId === my, w = state.week, U = STOVE_UI;
  const r = ours ? stoveRumorLeave(S, id) : stoveRumorTo(S, id);
  const now = r ? stoveStageTag(stoveStage(stoveChance(r, w))) + " " + (ours ? U.nowLeave.replace("{to}", escapeHTML(stoveTeamShort(r.to))) : U.nowIn) : '<span class="sv-tag s0">' + U.quiet + "</span> " + (ours ? U.quietMine : U.quietNew.replace("{team}", escapeHTML(stoveTeamShort(my))));
  const keys = ours ? ["keep"] : ["post", "dm", "boss"];
  const fee = p.teamId && p.contractEnd > state.year ? transferFee(id) : 0;
  const warn = !ours && fee && teamMoney(my) - fee < debtFloor(my) ? '<p class="sa-warn">' + U.money.replace("{fee}", moneyText(fee)) + "</p>" : "";
  const done = stoveActedThisWeek(S);
  const btn = done ? '<button class="primary" disabled>' + U.btnDone + "</button>" : stoveActUI.act ? '<button class="primary" data-sado="1">' + escapeHTML(p.name) + " " + U.acts[stoveActUI.act][0].replace(/^\S+\s/, "") + " 확정</button>" : '<button class="primary" disabled>' + U.btnPick + "</button>";
  return '<div class="sa-card"><div class="ah"><b>' + escapeHTML(p.name) + '</b> <span class="muted">' + escapeHTML(stoveTeamShort(p.teamId)) + " " + findPosition(p.pos).name + " · 종합 " + playerScore(id).toFixed(1) + "</span></div>" +
    '<div class="now">' + now + "</div>" +
    '<div class="facts">' + p.age + "세 · " + (p.teamId ? "계약 " + p.contractEnd + "년까지" : "FA") + (relationOf(id) ? " · 나와의 관계 " + relationOf(id) : "") + (fee ? " · 이적료 약 " + moneyText(fee) : "") + "</div>" + warn +
    '<div class="sa-acts">' + keys.map(function (k) {
      const lock = stoveActLock(S, p, k), A = U.acts[k];
      return '<button class="sa-act' + (stoveActUI.act === k ? " sel" : "") + '" data-saact="' + k + '"' + (lock ? " disabled" : "") + "><b>" + A[0] + '</b><span class="g">' + A[1] + '</span><span class="b">' + A[2] + "</span>" + (lock && lock !== U.lock.done ? '<span class="why">' + escapeHTML(lock) + "</span>" : "") + "</button>";
    }).join("") + "</div>" +
    (stoveActUI.msg ? '<div class="sa-result">' + stoveActUI.msg + "</div>" : "") +
    '<div class="sa-done"><span class="muted small">' + U.nextWeek + "</span>" + btn + "</div></div>";
}
pages.stove = function () {
  const S = stoveOf(state.year);
  if (!S || !stoveActOpen()) return "<h1>🕵️ 스토브 리그</h1>" + emptyBoxHTML("🕵️", STOVE_UI.closed);
  const my = myTeam(), w = state.week, U = STOVE_UI;
  const weak = POSITION_IDS.filter(function (pos) { return pos !== state.player.position; }).map(function (pos) { const s = starterAt(my.id, pos); return [pos, s ? playerScore(s) : 0]; })
    .sort(function (a, b) { return a[1] - b[1]; }).slice(0, 2);
  const done = stoveActedThisWeek(S);
  const status = '<div class="sa-status"><span class="big' + (done ? "" : " ok") + '">' + (done ? U.statusDone : U.statusLeft) + "</span>" +
    "<span>" + U.statusSign.replace("{n}", stoveSignCount(S, w)).replace("{max}", STOVE_RULES.signMax) + helpBtnHTML(U.signHelp) + "</span>" +
    "<span>" + U.statusWeak + " <b>" + findPosition(weak[0][0]).name + "</b> " + weak[0][1].toFixed(1) + (weak[1] ? " · " + findPosition(weak[1][0]).name + " " + weak[1][1].toFixed(1) : "") + "</span>" +
    '<span class="muted small">' + U.statusMoney + " " + moneyText(teamMoney(my.id)) + "</span></div>";
  const q = stoveActUI.q.trim().toLowerCase();
  const hits = q ? Object.keys(state.league.players).filter(function (id) { return state.league.players[id].name.toLowerCase().indexOf(q) !== -1; }).slice(0, 6) : [];
  const find = '<input type="text" id="sa-q" placeholder="' + U.search + '" value="' + escapeHTML(stoveActUI.q) + '" autocomplete="off">' +
    (q ? '<div class="sa-found">' + (hits.length ? hits.map(function (id) { const p = state.league.players[id]; return '<button data-sago="' + id + '">' + stoveWho({ id: id, name: p.name, pos: p.pos }) + "</button>"; }).join("") : '<p class="sv-empty">' + U.notFound + "</p>") + "</div>" : "");
  return "<h1>🕵️ 스토브 리그</h1>" + '<div class="sa no-link">' + status + '<div class="sa-split"><div class="sa-left">' + find + stoveActRowsHTML(S) + '</div><div class="sa-right">' + stoveActRosterHTML(S) + stoveActCardHTML(S) + "</div></div></div>";
};
function bindStoveAct(page) {
  const root = page.querySelector(".sa");
  if (!root) return;
  const q = document.getElementById("sa-q");
  if (q) q.onchange = q.onkeydown = function (e) { if (e.type === "change" || e.key === "Enter") { stoveActUI.q = q.value; renderPage(); } };
  root.onclick = function (e) {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-satm")) { stoveActUI.team = b.getAttribute("data-satm"); stoveActUI.pid = null; stoveActUI.act = null; stoveActUI.msg = null; }
    else if (b.hasAttribute("data-sapl")) { stoveActUI.pid = b.getAttribute("data-sapl"); stoveActUI.act = null; stoveActUI.msg = null; }
    else if (b.hasAttribute("data-sago")) { const p = findPlayer(b.getAttribute("data-sago")); stoveActUI.team = p.teamId || "FA"; stoveActUI.pid = p.id; stoveActUI.act = null; stoveActUI.msg = null; stoveActUI.q = ""; }
    else if (b.hasAttribute("data-saact")) { stoveActUI.act = b.getAttribute("data-saact"); }
    else if (b.hasAttribute("data-sado")) {
      const res = stoveDoAct(stoveActUI.pid, stoveActUI.act);
      stoveActUI.act = null;
      if (res) { stoveActUI.msg = (res.ok ? "✔ " : "✖ ") + escapeHTML(res.text) + (res.notes.length ? "<br><span class=\"small\">" + res.notes.map(escapeHTML).join(" · ") + "</span>" : ""); if (state.settings.autoSave) saveGame(); }
    } else return;
    renderPage();
  };
}
// 찌라시 탭 → 스토브 리그 탭의 그 선수로
function stoveGoAct(id) {
  const p = findPlayer(id);
  if (!p || !stoveActOpen()) return;
  stoveActUI.team = p.teamId || "FA"; stoveActUI.pid = id; stoveActUI.act = null; stoveActUI.msg = null;
  selectMenu("stove");
}
