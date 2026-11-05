// 281 검사·측정: 후반 '위기감' 기사 (js/news.js crisisNewsWeek, data/news.js CRISIS_NEWS)
// 1) 같은 씨앗으로 기사를 켠 판·끈 판의 경기 결과·순위·내 스탯이 똑같음 (신문만 씀·무작위 안 씀. 답은 연락 번호 말고 주차로 골라서 번호가 밀려도 같게)
// 2) 시즌 상한·간격·종류별 상한을 지킴, 빈칸({…})이 남지 않음  3) 3포지션 × 10시즌 실제 진행에서 종류별로 나오는 횟수 (측정)
// 실행: node tools/test_crisis.cjs (약 2분)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const START = `linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = POS; draft.startYear = YEAR; draft.teams = makeTeamDefs(YEAR);
  draft.teamChoice = draft.teams.findIndex(d => d.tier === 1); startCareer(true); state.settings.autoSave = false;`;
const run = (pos, year, seed, off) => JSON.parse(vm.runInContext(`(function () { const POS = "${pos}", YEAR = ${year}; ${START}
  ${off ? "crisisNewsWeek = function () {};" : ""}
  const seen = [], perYear = {};
  const origH = publishHeadline, origN = addNews;
  publishHeadline = function (a, o) { if (a.key && a.key.indexOf("crisis_") === 0) seen.push({ k: a.key.slice(7), y: state.year, w: absWeek(), t: a.headline + a.body }); return origH(a, o); };
  for (let i = 0; i < 52 * 10; i++) {
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, (state.week + m.week) % m.choices.length));
    nextWeek();
    if (state.retired) break;
  }
  const hist = (state.seasonHistory || state.career.seasons || []).length;
  const finger = JSON.stringify([state.year, state.week, state.stats, state.money, state.league.history, Object.keys(state.league.players).length, state.world && state.world.history]);
  return JSON.stringify({ seen: seen, finger: finger, years: careerYears() });
})()`, create(seed)));

// 1) 결과 그대로
const on = run("mid", 2017, 5, false), off = run("mid", 2017, 5, true);
ok(on.finger === off.finger, "기사를 켜도 끈 판과 경기 결과·순위·스탯·해외 기록이 같음 (위기감 기사 " + on.seen.length + "개)");

// 2)·3) 3포지션 × 10시즌
const POSS = ["top", "adc", "support"]; // 시간 때문에 3판 (전체 5포지션 측정은 281 기록: 47개·20시즌)
const all = [];
POSS.forEach(function (pos, k) { all.push.apply(all, run(pos, k % 2 ? 2012 : 2017, 21 + k, false).seen.map(function (x) { return Object.assign({ run: k }, x); })); });
const byKey = {}; all.forEach(function (x) { const s = x.run + ":" + x.y; (byKey[s] = byKey[s] || []).push(x); });
let capOk = true, gapOk = true, eachOk = true;
Object.keys(byKey).forEach(function (s) {
  const L = byKey[s].sort(function (a, b) { return a.w - b.w; });
  if (L.length > CRISIS_RULES_seasonMax()) capOk = false;
  for (let i = 1; i < L.length; i++) if (L[i].w - L[i - 1].w < 4) gapOk = false;
  const c = {}; L.forEach(function (x) { c[x.k] = (c[x.k] || 0) + 1; });
  if ((c.close || 0) > 2 || (c.misread || 0) > 1 || (c.nemesis || 0) > 2 || (c.abroad || 0) > 1) eachOk = false;
});
function CRISIS_RULES_seasonMax() { return 6; }
ok(capOk, "한 시즌 6개 이하");
ok(gapOk, "기사끼리 4주 이상 간격");
ok(eachOk, "종류별 시즌 상한 (진땀승 2 · 분석 1 · 맞대결 2 · 해외 1)");
ok(all.every(function (x) { return x.t.indexOf("{") === -1; }), "빈칸({…})이 남은 글 없음");
const count = {}; all.forEach(function (x) { count[x.k] = (count[x.k] || 0) + 1; });
const seasons = Object.keys(byKey).length;
console.log("   측정 (3판 × 10시즌): 기사 " + all.length + "개 · 나온 시즌 " + seasons + "개 · 종류 " + JSON.stringify(count));
ok(all.length > 0, "실제 진행에서 위기감 기사가 나옴");

console.log(fail ? "\n❌ " + fail + "개 실패" : "\n전체 통과");
process.exit(fail ? 1 : 0);
