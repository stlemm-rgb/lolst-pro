// 사기 챔피언(패치 사고 SS·SSS, js/op_patch.js)이 내 시즌 성적에 주는 영향 측정 (PROGRESS 308)
// 같은 선수·같은 씨앗으로 4가지를 비교: 사고 없음 / 내 포지션 SS / 내 포지션 SSS / 다른 포지션 SS
//   사고는 6주에 일부러 일으킴 → 다음 정기 패치(29주)까지 23주 동안 셈 ('사고 기간')
// 상황: 2017 1부 중간 팀, 다섯 포지션 × 씨앗 SEEDS개 × 1시즌, 훈련 = 챔피언 연습 25% (솔랭·스크림·리플레이·챔피언 연습, 체력 30↓ 휴식)
// 실행: node tools/measure_op_patch.cjs            (SEEDS=4 기본, 약 몇 분)
//       VET=18 node tools/measure_op_patch.cjs   (내 스탯 +18 = 5년차쯤 실력)
//       SEEDS=8 node tools/measure_op_patch.cjs     YEAR=2012 TEAM=tier2 node tools/measure_op_patch.cjs
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.resolve(path.join(__dirname, "..")) + "/";
const scripts = [...fs.readFileSync(root + "Challenger_Road.html", "utf8").matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => x !== "js/start.js");
const CODE = scripts.map(s => [s, fs.readFileSync(root + s, "utf8")]);

function create(seed) {
  const M = Object.create(globalThis.Math);
  M.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const element = { innerHTML: "", hidden: false, value: "", style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, addEventListener() {}, remove() {}, focus() {}, scrollIntoView() {}, setAttribute() {}, getAttribute() { return ""; }, querySelectorAll() { return []; }, querySelector() { return element; } };
  const ctx = vm.createContext({ console, Math: M, Date, setTimeout() {}, clearTimeout() {},
    document: { getElementById() { return element; }, querySelectorAll() { return []; }, querySelector() { return element; }, createElement() { return { ...element }; }, addEventListener() {}, removeEventListener() {}, body: { appendChild() {} } },
    window: { scrollTo() {}, addEventListener() {}, scrollY: 0, innerWidth: 1200, matchMedia() { return { matches: false, addEventListener() {} }; } }, URL, Blob,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: "node" }, location: { href: "" } });
  ctx.window.document = ctx.document;
  for (const [s, code] of CODE) vm.runInContext(code, ctx, { filename: s });
  return ctx;
}

const RUN = `(function (pos, mode, year, team, VET) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  // 사고 설정: off = 안 남 / 그 밖 = 6주에 꼭 남, 등급·포지션을 정함
  if (mode === "off") OP_PATCH_RULES.chance = 0;
  else { OP_PATCH_RULES.chance = 1; OP_PATCH_RULES.startWeeks = [[6, 6]]; OP_PATCH_RULES.sssShare = mode === "mineSSS" ? 1 : 0; }
  const want = mode === "other" ? null : pos;
  const origStart = opStart;
  opStart = function (O, plan) {
    origStart(O, plan);
    const c = O.cur; if (!c) return;
    const others = POSITION_IDS.filter(p => p !== pos);
    const target = want || others[c.n % others.length];
    if (c.pos === target) return;
    const sNow = state.meta && state.meta.s ? state.meta.s[target] : null;
    const pool = releasedChampions(state.year, state.week).filter(ch => ch.positions.indexOf(target) !== -1 && ch.name !== sNow);
    c.pos = target; c.champ = pool[c.n % pool.length].name; c.id = state.year + "-" + state.week + "-" + c.champ;
  };
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = year; draft.teams = makeTeamDefs(year);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === (team === "tier2" ? 2 : 1));
  draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  if (VET) Object.keys(state.stats).forEach(k => { if (typeof state.stats[k] === "number") state.stats[k] = Math.min(100, state.stats[k] + VET); }); // 5년차쯤 실력 흉내
  const PLANS = ["solo_rank", "scrim", "replay", "champion"];
  // 세트마다 기록 (사고 기간 안의 내 출전 세트만)
  const S = { sets: 0, wins: 0, myPick: 0, myPickWin: 0, oppPick: 0, oppPickWin: 0, matePick: 0, matePickWin: 0, banned: 0 };
  const origSet = playSet;
  playSet = function (a, b, userCtx, setCtx) {
    const c = opCur(), live = c && opLiveTier(c.champ, c.pos);
    const set = origSet.apply(this, arguments);
    if (userCtx && live) {
      const mine = myTeam().id, side = a === mine ? "a" : "b", other = side === "a" ? "b" : "a";
      const won = set.winner === mine;
      S.sets++; if (won) S.wins++;
      if (c.banMark) S.banned++;
      const myP = set.comps[side].picks, opP = set.comps[other].picks;
      if (userCtx.pick === c.champ) { S.myPick++; if (won) S.myPickWin++; }
      else if (myP.indexOf(c.champ) !== -1) { S.matePick++; if (won) S.matePickWin++; }
      if (opP.indexOf(c.champ) !== -1) { S.oppPick++; if (!won) S.oppPickWin++; }
    }
    return set;
  };
  // 사고 기간(6~28주) 내 세트·경기 수: 주마다 누적값을 봄
  const pst = () => (state.league.season.playerStats || {})[USER_ID] || { g: 0, w: 0, r: 0 };
  let w0 = null, w1 = null;
  const snap = () => { const st = pst(); return { g: st.g, w: st.w, r: st.r, sg: state.career.seasonGames || 0, sw: state.career.seasonWins || 0 }; };
  let mastery = null;
  for (let i = 0; i < 52; i++) {
    if (state.week === 6) w0 = snap();
    if (state.week === 29) w1 = snap();
    state.retirePlanned = false;
    state.plan = state.stamina < 30 ? "rest" : PLANS[state.week % PLANS.length];
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    const c = opCur(); if (c && c.pos === pos && state.week === 28) mastery = state.mastery[c.champ] || 0;
    nextWeek();
  }
  const rec = state.career.seasons.slice(-1)[0] || currentSeasonRecord();
  const h = state.opPatch.history[0] || null;
  const win = { sets: w1.g - w0.g, setWins: w1.w - w0.w, rating: (w1.g - w0.g) ? (w1.r - w0.r) / (w1.g - w0.g) : 0, series: w1.sg - w0.sg, seriesWins: w1.sw - w0.sw };
  return JSON.stringify({ win, S, mastery, h: h && { champ: h.champ, pos: h.pos, tier: h.tier, picks: h.picks, wins: h.wins, bans: h.bans },
    season: { sets: rec.sets, setWins: rec.setWins, series: rec.series, seriesWins: rec.seriesWins, rank: rec.rank, titles: rec.titles.length, rating: rec.rating, score: rec.score } });
})`;

const POS = (process.env.POS || "top,jungle,mid,adc,support").split(",");
const NS = +(process.env.SEEDS || 4), YEAR = +(process.env.YEAR || 2017), TEAM = process.env.TEAM || "tier1", VET = +(process.env.VET || 0);
const MODES = { off: "사고 없음", mineSS: "내 포지션 SS", mineSSS: "내 포지션 SSS", other: "다른 포지션 SS" };
const out = {};
const t0 = Date.now();
for (const mode of Object.keys(MODES)) {
  out[mode] = [];
  for (const pos of POS) for (let s = 1; s <= NS; s++) {
    const r = JSON.parse(vm.runInContext(RUN, create(s * 7919 + YEAR))(pos, mode, YEAR, TEAM, VET));
    r.pos = pos; out[mode].push(r);
  }
  process.stderr.write(mode + " 끝 " + Math.round((Date.now() - t0) / 1000) + "초\n");
}
const sum = (rs, f) => rs.reduce((a, r) => a + f(r), 0);
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + "%" : "-";
const avg = (rs, f) => (sum(rs, f) / Math.max(1, rs.length));
console.log("상황: " + YEAR + " " + TEAM + " 중간 팀" + (VET ? " · 내 스탯 +" + VET : "") + " · 포지션 " + POS.join("/") + " × 씨앗 " + NS + " = 판 " + (POS.length * NS) + "개씩\n");
console.log("| 비교 | 사고 기간 세트 승률 | 사고 기간 경기 승률 | 사고 기간 평점 | 시즌 세트 승률 | 시즌 경기 승률 | 시즌 순위 평균 | 우승 수(판당) |");
console.log("|---|---|---|---|---|---|---|---|");
for (const [mode, name] of Object.entries(MODES)) {
  const rs = out[mode];
  console.log("| " + name + " | " + pct(sum(rs, r => r.win.setWins), sum(rs, r => r.win.sets)) + " | " + pct(sum(rs, r => r.win.seriesWins), sum(rs, r => r.win.series)) + " | " + avg(rs, r => r.win.rating).toFixed(2)
    + " | " + pct(sum(rs, r => r.season.setWins), sum(rs, r => r.season.sets)) + " | " + pct(sum(rs, r => r.season.seriesWins), sum(rs, r => r.season.series)) + " | " + avg(rs, r => r.season.rank).toFixed(2) + " | " + avg(rs, r => r.season.titles).toFixed(2) + " |");
}
console.log("\n사기 챔피언이 내 경기에서 어떻게 쓰였나 (사고 기간 내 출전 세트 기준)");
console.log("| 비교 | 세트 | 밴됨 | 내가 뽑음 (그때 승률) | 우리 팀 동료가 뽑음 (승률) | 상대가 뽑음 (그때 우리 패배율) | 28주 내 숙련도 평균 |");
console.log("|---|---|---|---|---|---|---|");
for (const [mode, name] of Object.entries(MODES)) {
  if (mode === "off") continue;
  const rs = out[mode], T = k => sum(rs, r => r.S[k]);
  const ms = rs.filter(r => r.mastery !== null);
  console.log("| " + name + " | " + T("sets") + " | " + pct(T("banned"), T("sets")) + " | " + T("myPick") + "번 " + pct(T("myPick"), T("sets")) + " (" + pct(T("myPickWin"), T("myPick")) + ") | " + T("matePick") + "번 (" + pct(T("matePickWin"), T("matePick")) + ") | " + T("oppPick") + "번 (" + pct(T("oppPickWin"), T("oppPick")) + ") | " + (ms.length ? avg(ms, r => r.mastery).toFixed(0) : "-") + " |");
}
console.log("\n포지션별 사고 기간 세트 승률 (사고 없음 → 내 포지션 SS → 내 포지션 SSS → 다른 포지션 SS)");
for (const pos of POS) {
  const cells = Object.keys(MODES).map(mode => { const rs = out[mode].filter(r => r.pos === pos); return pct(sum(rs, r => r.win.setWins), sum(rs, r => r.win.sets)); });
  console.log("  " + pos + ": " + cells.join(" → "));
}
if (process.env.RAW) console.log(JSON.stringify(out));
