// 이적 측정 (316): 1부 주전이 1년에 얼마나 바뀌는지 + 비시즌·여름 이적 수 — 이적 줄이기 후보 비교
// 실행: node tools/measure_transfers.cjs                (후보 전부, 약 4분)
//       VARIANT=지금 node tools/measure_transfers.cjs   (후보 하나만)
// 상황: 2017 1부 중간 팀 미드, 씨앗 3개 × 4시즌. 1부 주전 = 팀마다 포지션별 주전 (내 선수 포함), 33주(여름 이적 뒤)끼리 비교
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

// 후보: 이름 → data 상수 바꾸기 (식 그대로)
const VARIANTS = {
  "지금": "",   // 316 뒤 '지금' = 아래 '아' (data/contracts.js에 적용됨) · 스토브 리그 진짜 찌라시 3건 포함
  "스토브 0 (찌라시 실행 없음)": "STOVE_RULES.trueCount = 0;",
  "스토브 2": "STOVE_RULES.trueCount = 2;",
  "가 영입 1바퀴": "CLUB_MARKET.passes = 1;",
  "나 기준 올리기": "CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }];",
  "다 가+나": "CLUB_MARKET.passes = 1; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }];",
  "라 가+나+주전 빼 가기 1건": "CLUB_MARKET.passes = 1; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }]; CLUB_MARKET.star.maxMoves = 1;",
  "마 재계약 85%": "CONTRACT.npcRenewChance = 0.85;",
  "바 나+재계약 85%": "CONTRACT.npcRenewChance = 0.85; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }];",
  "사 나+재계약 90%+빼 가기 1건": "CONTRACT.npcRenewChance = 0.9; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }]; CLUB_MARKET.star.maxMoves = 1;",
  "아 사+재계약 95%": "CONTRACT.npcRenewChance = 0.95; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }]; CLUB_MARKET.star.maxMoves = 1;",
  "자 사+여름 영입 기준 올리기": "CONTRACT.npcRenewChance = 0.9; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }]; CLUB_MARKET.star.maxMoves = 1; SUMMER_MARKET.margin = 5;",
  "차 아+자": "CONTRACT.npcRenewChance = 0.95; CLUB_MARKET.rebuild = [{ need: 0.34, buys: 1, margin: 6 }, { need: 0.67, buys: 1, margin: 4 }, { need: 1.01, buys: 2, margin: 3 }]; CLUB_MARKET.star.maxMoves = 1; SUMMER_MARKET.margin = 5;",
};

const RUN = `(function (seasons) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const snap = () => { const o = {}; tier1Ids().forEach(id => { const s = starters(id); o[id] = Object.keys(s).map(k => s[k]).filter(Boolean); }); return o; };
  const out = [];
  let prev = null;
  for (let w = 0; w < seasons * 52 + 33; w++) {
    state.retirePlanned = false;
    state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
    if (state.week === 33) {
      const now = snap();
      if (prev) { let n = 0, t = 0; const why = { 은퇴: 0, 이적: 0, 후보로: 0, "2부로": 0 };
        Object.keys(prev).forEach(id => { if (!now[id]) return; t += prev[id].length; prev[id].filter(x => now[id].indexOf(x) === -1).forEach(x => {
          n++; const p = x === USER_ID ? null : findPlayer(x); const team = x === USER_ID ? myTeam().id : p && p.teamId;
          if (x !== USER_ID && (!p || p.retired)) why.은퇴++; else if (team === id) why.후보로++; else if (team && findTeam(team) && findTeam(team).tier === 2) why["2부로"]++; else why.이적++; }); });
        out.push({ y: state.year, n, t, why }); }
      prev = now;
    }
  }
  const L = state.league.transferLog || [], kinds = {};
  L.forEach(e => { const k = (e.w >= 29 && e.w <= 32 ? "여름 " : "") + e.kind; kinds[k] = (kinds[k] || 0) + 1; });
  const years = new Set(L.map(e => e.y)).size || 1;
  const str = tier1Ids().map(id => teamStrength(id)); const avg = str.reduce((a, b) => a + b, 0) / str.length;
  return JSON.stringify({ out, kinds, years, avg });
})`;

const SEEDS = [7, 21, 42], SEASONS = 4;
const pick = process.env.VARIANT;
console.log("후보 | 1부 주전 1년 변동 (평균) | 해마다 | 1년 이적 수 (보관된 마지막 2년 평균, 은퇴 제외)");
for (const [name, set] of Object.entries(VARIANTS)) {
  if (pick && name.indexOf(pick) === -1) continue;
  let n = 0, t = 0; const per = []; const kinds = {}; let yrs = 0; const why = {}; let avgSum = 0;
  for (const sd of SEEDS) {
    const c = create(sd * 7919);
    if (set) vm.runInContext(set, c);
    const r = JSON.parse(vm.runInContext(RUN, c)(SEASONS));
    r.out.forEach(x => { n += x.n; t += x.t; per.push(Math.round(100 * x.n / x.t)); Object.keys(x.why).forEach(k => { why[k] = (why[k] || 0) + x.why[k]; }); });
    avgSum += r.avg;
    Object.keys(r.kinds).forEach(k => { kinds[k] = (kinds[k] || 0) + r.kinds[k]; }); yrs += r.years;
  }
  const k = Object.keys(kinds).filter(x => x !== "retire").sort().map(x => x + " " + (kinds[x] / yrs).toFixed(1)).join(", ");
  const nYears = per.length;
  console.log(name + " | " + Math.round(100 * n / t) + "% | " + per.join("·") + " | " + k);
  console.log("   마지막 해 1부 평균 전력: " + (avgSum / SEEDS.length).toFixed(1));
  console.log("   바뀐 주전 이유 (1년 평균, 50명 중): " + Object.keys(why).map(x => x + " " + (why[x] / nYears).toFixed(1)).join(" · "));
}
