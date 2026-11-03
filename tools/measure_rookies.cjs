// 대형 신인 · 리그 상위권 측정 (243): 3판(2012 ×2, 2017) × 7시즌, 후보 값별 입단·3년 뒤 점수(1부 주전 평균 대비)와 7년차 리그 상위 30·10명 안 대형 신인 수
// 실행: node tools/measure_rookies.cjs   (약 6분, 브라우저 없이)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법 (게임 폴더 = 첫 인자, 기본 이 저장소)
const RUN = `(function (year, seasons, ov) {
  Object.assign(BIG_ROOKIE, ov);
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = year; draft.teams = makeTeamDefs(year);
  const t1 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = t1[Math.floor(t1.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  let out = null; const entry = [], after3 = [];
  for (let w = 0; w < seasons * 52; w++) {
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
    if (state.week === 2) {
      const all = Object.values(state.league.players).filter(p => p.teamId);
      const t1ids = []; tierTeams(1).forEach(t => { const st = starters(t.id); Object.values(st).forEach(id => { if (id && id !== USER_ID) t1ids.push(id); }); });
      const avg = t1ids.reduce((a, id) => a + playerScore(id), 0) / t1ids.length;
      all.filter(p => p.bigRookie === state.year).forEach(p => entry.push(playerScore(p.id) - avg));
      all.filter(p => p.bigRookie === state.year - 3).forEach(p => after3.push(playerScore(p.id) - avg));
      const ranked = all.slice().sort((a, b) => playerScore(b.id) - playerScore(a.id));
      out = { t1avg: avg, top1: playerScore(ranked[0].id), top30: ranked.slice(0, 30).filter(p => p.bigRookie).length, top10: ranked.slice(0, 10).filter(p => p.bigRookie).length,
        br: all.filter(p => p.bigRookie).length, t1starters: t1ids.filter(id => findPlayer(id).bigRookie).length, t1n: t1ids.length };
    }
  }
  out.entry = entry; out.after3 = after3; return JSON.stringify(out);
})`;
// 후보: 이름 → BIG_ROOKIE에 덮어쓸 값. 243 때 비교한 값 (지금 = B로 정해진 뒤의 data/league.js 값)
const V = { "지금": {}, "예전(+2~4·2~3명)": { scoreAbove: [2, 4], count: [2, 3] }, "A": { scoreAbove: [-4, -2], count: [2, 3] }, "C": { scoreAbove: [-6, -3], count: [2, 3], tier1Count: 0 } };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
for (const [name, ov] of Object.entries(V)) {
  const rs = [[2012, 11], [2012, 22], [2017, 33]].map(([yr, sd]) => JSON.parse(vm.runInContext(RUN, create(sd))(yr, 7, ov)));
  const f = k => mean(rs.map(r => r[k])).toFixed(1);
  console.log(name, JSON.stringify({ "입단(평균대비)": mean(rs.flatMap(r => r.entry)).toFixed(1), "3년뒤(평균대비)": mean(rs.flatMap(r => r.after3)).toFixed(1),
    "7년차 대형신인 수": f("br"), "상위30 안": f("top30"), "상위10 안": f("top10"), "1부 주전 중": f("t1starters") + "/" + f("t1n"), "1부 평균": f("t1avg"), "1위 점수": f("top1") }));
}
