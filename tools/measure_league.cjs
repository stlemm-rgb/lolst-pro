// 리그 수준 측정 (246): 3판(2012 ×2, 2017) × 7시즌, 후보 값별 1부 평균·1위·상위 10명 기준선, 레전드·대형 신인이 상위 10·30명 안에 몇 명, 내 선수(미드, 기본 플레이) 점수·리그 미드 순위
// 실행: node tools/measure_league.cjs   (후보 하나에 약 2분, 브라우저 없이)
//   후보는 아래 V: [이름, 시작 전에 실행할 식] — data/*.js 값을 이번 측정에서만 바꿈
const fs = require("fs"), vm = require("vm"), path = require("path");
eval(fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8").split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법

const ARCH = process.env.ARCH || ""; // ARCH=prospect 처럼 내 선수 유형 (기본: 캐릭터 생성 기본값)
const RUN = `(function (year, seasons, setup, arch) {
  eval(setup);
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = year; if (arch) draft.archetype = arch; draft.teams = makeTeamDefs(year);
  const t2 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 2); draft.teamChoice = t2[0][1];
  startCareer(true); state.settings.autoSave = false;
  const y1 = tier1StarterAvg(), rk = {};
  const midRank = () => { const me = playerScore(USER_ID); return Object.values(state.league.players).filter(p => p.teamId && p.pos === "mid" && playerScore(p.id) > me).length + 1; };
  for (let w = 0; w < seasons * 52; w++) {
    if (w === 2 * 52 || w === 4 * 52) rk["y" + (w / 52 + 1)] = midRank(); // 3·5년차 시작 때 내 선수 리그 미드 순위
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : ["solo_rank", "scrim", "replay", "champion"][w % 4];
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
  }
  const all = Object.values(state.league.players).filter(p => p.teamId);
  const ranked = all.slice().sort((a, b) => playerScore(b.id) - playerScore(a.id));
  const me = playerScore(USER_ID);
  const mids = all.filter(p => p.pos === "mid").map(p => playerScore(p.id));
  return JSON.stringify({ y1: y1, y7: tier1StarterAvg(), top1: playerScore(ranked[0].id), top10: playerScore(ranked[9].id),
    lg10: ranked.slice(0, 10).filter(p => p.legend).length, lg30: ranked.slice(0, 30).filter(p => p.legend).length,
    br30: ranked.slice(0, 30).filter(p => p.bigRookie).length, me: me, meRank: mids.filter(s => s > me).length + 1, r3: rk.y3, r5: rk.y5, age: state.player.age, tier: myTeam().tier });
})`;

const V = [
  ["지금", ""],
  ["G1 성장 줄임", "LEAGUE.npcGrowth[0].change=[1,6]; LEAGUE.npcGrowth[1].change=[0,4];"],
  ["G2 성장 더 줄임", "LEAGUE.npcGrowth[0].change=[1,5]; LEAGUE.npcGrowth[1].change=[0,3];"],
  ["S 처음 실력 -4", "['tier1Starter','tier1Sub','tier2Starter','tier2Sub'].forEach(k => LEAGUE.npc[k].avg -= 4); LEAGUE.rookie.avg -= 4;"],
  ["L 레전드 보너스 S+3·A+1", "LEGEND_RULES.gradeBonus = { S: 3, A: 1 };"],
  ["G1+L", "LEAGUE.npcGrowth[0].change=[1,6]; LEAGUE.npcGrowth[1].change=[0,4]; LEGEND_RULES.gradeBonus = { S: 3, A: 1 };"],
  ["G2+L", "LEAGUE.npcGrowth[0].change=[1,5]; LEAGUE.npcGrowth[1].change=[0,3]; LEGEND_RULES.gradeBonus = { S: 3, A: 1 };"],
].filter(v => !process.env.ONLY || process.env.ONLY.split(",").indexOf(v[0].split(" ")[0]) !== -1); // ONLY=G1,S 처럼 일부만
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
for (const [name, setup] of V) {
  const rs = [[2012, 11], [2012, 22], [2017, 33]].map(([yr, sd]) => JSON.parse(vm.runInContext(RUN, create(sd))(yr, 7, setup, ARCH)));
  const f = (k, d) => mean(rs.map(r => r[k])).toFixed(d === undefined ? 1 : d);
  console.log(name + " | 1부 평균 " + f("y1") + "→" + f("y7") + " | 1위 " + f("top1") + " | 10위 " + f("top10") + " | 상위10 레전드 " + f("lg10") + " · 상위30 레전드 " + f("lg30") +
    " · 대형신인 " + f("br30") + " | 내 선수 리그 미드 3년차 " + f("r3") + "위 · 5년차 " + f("r5") + "위 · 7년차 " + f("meRank") + "위 (" + f("me") + "점, " + rs.map(r => r.tier + "부").join("/") + ")");
}
