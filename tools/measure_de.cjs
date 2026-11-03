// ③ D+E 측정: 시즌 회고가 실제와 맞는지 · 경력 연차별 연락의 새로움
// 실행: node tools/measure_de.cjs   (약 1분, 12시즌 × 3판: 시즌별 성장·부상·회고 글·연락 수·처음 보는 연락·팀 내 입지)
const fs = require("fs"), vm = require("vm");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법
const RUN = `(function (year, tierWant, seasons, goalPick) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = year; draft.teams = makeTeamDefs(year);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === tierWant); draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const seen = {}, rows = [];
  let cur = null;
  for (let w = 0; w < seasons * 52; w++) {
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, m.eventId === "season_goal" ? goalPick : 0));
    const before = state.msgSeq || 0, inj0 = !!(state.health && state.health.injury);
    nextWeek();
    if (state.week === 1 || !cur) { if (cur) rows.push(cur); cur = { y: state.year, age: state.player.age, cy: careerYears(), s0: playerScore(USER_ID), inj: 0, ev: 0, fresh: 0, ids: [] }; }
    if (!inj0 && state.health && state.health.injury) cur.inj++;
    state.inbox.forEach(m => { if (m.eventId && m.id > before && m.tab === "inbox") { cur.ev++; if (!seen[m.eventId]) { seen[m.eventId] = 1; cur.fresh++; } cur.ids.push(m.eventId); } if (m.eventId && m.id > before && /^review_/.test(m.eventId)) cur.review = m.eventId; });
    if (state.week === 47) { cur.s1 = playerScore(USER_ID); cur.title = titleThisYear(); cur.tier = myTeam().tier; cur.bench = !!state.benched; cur.standing = Math.round(standingValue()); cur.captain = !!(state.standing && state.standing.captain); }
  }
  return JSON.stringify(rows.map(r => ({ y: r.y, age: r.age, cy: r.cy, d: r.s1 !== undefined ? Math.round((r.s1 - r.s0) * 10) / 10 : null, inj: r.inj, title: r.title, review: r.review || "", ev: r.ev, fresh: r.fresh, st: r.standing, cap: r.captain, tier: r.tier })));
})`;
for (const [year, tier, seed, goal] of [[2012, 2, 7, 1], [2012, 1, 8, 2], [2017, 1, 9, 1]]) {
  const ctx = create(seed);
  const rows = JSON.parse(vm.runInContext(RUN, ctx)(year, tier, 12, goal));
  console.log("== " + year + " " + tier + "부 씨앗 " + seed + " 목표 선택 " + ["우승", "성장", "즐겁게"][goal]);
  rows.forEach(r => console.log([r.y, r.age + "세", r.cy + "년차", "성장 " + r.d, "부상 " + r.inj, r.title ? "우승" : "-", r.review, "연락 " + r.ev, "처음 " + r.fresh, "입지 " + r.st + (r.cap ? " 주장" : ""), r.tier + "부"].join(" | ")));
}
