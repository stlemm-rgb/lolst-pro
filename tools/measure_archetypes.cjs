// 시작 유형 비교 (247): 유형 4개 × 3판(2012 ×2, 2017) × 12시즌, 미드·2부 시작·기본 플레이(훈련 4개 돌림, 체력 30↓ 휴식)
// 해마다 시즌 시작(2주차) 때 나이·종합 능력·리그 미드 순위 → '같은 해'와 '같은 나이' 둘 다로 비교 (유망주는 2살 어려서 커리어가 김)
// 실행: node tools/measure_archetypes.cjs   (약 20분, 브라우저 없이)  ONLY=prospect,grinder 처럼 일부만 · SEASONS=12 · SET="식" (모든 유형에 같은 값 바꾸기)
const fs = require("fs"), vm = require("vm"), path = require("path");
eval(fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8").split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법

const SEASONS = Number(process.env.SEASONS || 12);
const RUN = `(function (year, seasons, arch, setup) {
  eval(setup || "");
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = year; draft.archetype = arch; draft.teams = makeTeamDefs(year);
  const t2 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 2); draft.teamChoice = t2[0][1];
  startCareer(true); state.settings.autoSave = false;
  const rows = [];
  const snap = () => { const me = playerScore(USER_ID);
    rows.push({ y: rows.length + 1, age: state.player.age, score: me, rank: Object.values(state.league.players).filter(p => p.teamId && p.pos === "mid" && playerScore(p.id) > me).length + 1, retired: !!state.retired }); };
  snap();
  for (let w = 0; w < seasons * 52 && !state.retired; w++) {
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : ["solo_rank", "scrim", "replay", "champion"][w % 4];
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
    if (state.week === 2) snap();
  }
  return JSON.stringify(rows);
})`;
const ARCHS = (process.env.ONLY ? process.env.ONLY.split(",") : ["prospect", "grinder", "legend", "living_legend"]);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
for (const arch of ARCHS) {
  const runs = [[2012, 11], [2012, 22], [2017, 33]].map(([yr, sd]) => JSON.parse(vm.runInContext(RUN, create(sd))(yr, SEASONS, arch, process.env.SET)));
  const byYear = [], byAge = {};
  runs.forEach(rs => rs.forEach(r => { (byYear[r.y] = byYear[r.y] || []).push(r); (byAge[r.age] = byAge[r.age] || []).push(r); }));
  const cell = list => list && list.length ? mean(list.map(r => r.score)).toFixed(1) + "점·" + mean(list.map(r => r.rank)).toFixed(1) + "위" : "-";
  console.log("== " + arch);
  console.log("  해(시작 = 1년차): " + [1, 3, 5, 7, 9, 11].map(y => y + "년차 " + cell(byYear[y])).join(" | "));
  console.log("  나이: " + [19, 21, 23, 25, 27, 29].map(a => a + "세 " + cell(byAge[a])).join(" | "));
}
