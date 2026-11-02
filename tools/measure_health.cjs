// 체력·컨디션 측정 (238): tools/measure_fatigue.py와 같은 3가지 플레이 방식을 브라우저(Playwright) 없이 Node로
// 플레이 방식 3가지(기본 30↓ 휴식 / 안 쉼 솔랭만 / 관리 50↓ 휴식) × 2부 2012·1부 2017 미드 × 씨앗 3 × 2시즌
// 실행: node tools/measure_health.cjs [게임 폴더(기본: 이 저장소)] [숫자 바꿔 끼우기...]   (약 1~2분)
//   숫자 바꿔 끼우기 예: node tools/measure_health.cjs . "HOUSING.dormConditionLoss=1" "HEALTH_RULES.burnout.conditionAdd=0"
//   예전 코드와 비교: git worktree add <폴더> HEAD → node tools/measure_health.cjs <폴더>
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.resolve(process.argv[2] || path.join(__dirname, "..")) + "/";
const SETS = process.argv.slice(3); // "경로=값" (data/*.js 상수)
const scripts = [...fs.readFileSync(root + "Challenger_Road.html", "utf8").matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => x !== "js/start.js");

function create(seed) {
  const M = Object.create(globalThis.Math);
  M.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const element = { innerHTML: "", hidden: false, value: "", style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, addEventListener() {}, remove() {}, focus() {}, scrollIntoView() {}, setAttribute() {}, getAttribute() { return ""; }, querySelectorAll() { return []; }, querySelector() { return element; } };
  const ctx = vm.createContext({ console, Math: M, Date, setTimeout() {}, clearTimeout() {},
    document: { getElementById() { return element; }, querySelectorAll() { return []; }, querySelector() { return element; }, createElement() { return { ...element }; }, addEventListener() {}, removeEventListener() {}, body: { appendChild() {} } },
    window: { scrollTo() {}, addEventListener() {}, scrollY: 0, innerWidth: 1200, matchMedia() { return { matches: false, addEventListener() {} }; } }, URL, Blob,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: "node" }, location: { href: "" } });
  ctx.window.document = ctx.document;
  for (const s of scripts) vm.runInContext(fs.readFileSync(root + s, "utf8"), ctx, { filename: s });
  SETS.forEach(kv => { const i = kv.indexOf("="); vm.runInContext(kv.slice(0, i) + " = " + kv.slice(i + 1), ctx); });
  return ctx;
}

const POL = {
  "기본(30↓ 휴식)": "state.stamina < 30 ? 'rest' : (state.week % 2 ? 'scrim' : 'replay')",
  "안 쉼(솔랭만)": "'solo_rank'",
  "관리(50↓ 휴식)": "state.stamina < 50 ? 'rest' : (state.week % 2 ? 'scrim' : 'replay')",
};
const SC = [["2부 2012 미드", 2012, "tier2"], ["1부 2017 미드", 2017, "tier1-mid"]];
const SEEDS = [11, 22, 33], WEEKS = 104;

const RUN = `(function (pol, weeks, year, team) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = year; draft.teams = makeTeamDefs(year);
  const t1 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1), t2 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 2);
  draft.teamChoice = team === "tier2" ? t2[0][1] : t1[Math.floor(t1.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const sets = [], wk = []; let injuries = 0, burnouts = 0;
  const orig = userMatchContext;
  userMatchContext = function (a, b, c) { const r = orig(a, b, c); sets.push([state.stamina, state.condition]); return r; };
  const s0 = playerScore(USER_ID);
  const H = () => state.health || {};
  for (let i = 0; i < weeks; i++) {
    state.retirePlanned = false;
    state.plan = eval(pol);
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    const inj0 = !!H().injury, burn0 = !!H().burnout;
    wk.push([state.stamina, state.condition, state.plan === "rest" || inj0 ? 1 : 0, inj0 ? 1 : 0, burn0 ? 1 : 0]);
    nextWeek();
    if (!inj0 && H().injury) injuries++;
    if (!burn0 && H().burnout) burnouts++;
  }
  const seasons = state.career.seasons || [];
  const n = seasons.reduce((a, s) => a + s.sets, 0), w = seasons.reduce((a, s) => a + s.setWins, 0);
  return JSON.stringify({ wk, sets, growth: playerScore(USER_ID) - s0, swr: n ? w / n : 0, injuries, burnouts });
})`;

const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const pct = (xs, f) => Math.round(100 * xs.filter(f).length / Math.max(1, xs.length));
for (const [scn, yr, team] of SC) {
  for (const [pn, pol] of Object.entries(POL)) {
    const agg = SEEDS.map(sd => {
      const c = create(sd * 7919 + yr);
      return JSON.parse(vm.runInContext(RUN, c)(pol, WEEKS, yr, team));
    });
    const wk = agg.flatMap(a => a.wk), sets = agg.flatMap(a => a.sets);
    const row = {
      "체력평균": Math.round(mean(wk.map(w => w[0]))), "체력<20 주%": pct(wk, w => w[0] < 20), "쉰 주%": pct(wk, w => w[2] === 1),
      "컨디션평균": Math.round(mean(wk.map(w => w[1]))), "컨디션<30 주%": pct(wk, w => w[1] < 30),
      "부상(2시즌)": +mean(agg.map(a => a.injuries)).toFixed(1), "부상 주%": pct(wk, w => w[3] === 1),
      "번아웃(2시즌)": +mean(agg.map(a => a.burnouts)).toFixed(1), "번아웃 주%": pct(wk, w => w[4] === 1),
      "출전 세트": Math.round(sets.length / agg.length), "2시즌 성장": +mean(agg.map(a => a.growth)).toFixed(1), "세트승률%": +(100 * mean(agg.map(a => a.swr))).toFixed(1),
    };
    console.log(scn + " / " + pn + " " + JSON.stringify(row));
  }
}
