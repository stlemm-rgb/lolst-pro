// 263 같은 장면을 팬·동료·상대 선수·기사가 — 검사: 브라우저 없이 Node로
// 1) 5포지션 × 2시즌: 바뀐 SNS 글 수·예시, 분석 기사 수(4주에 1번 이하)
// 2) 이 기능을 끈 판과 켠 판의 게임 결과(내 스탯·리그 선수 스탯·우승 기록)가 똑같은지 (난수를 더 쓰지 않음)
// 실행: node tools/test_position_social.cjs   (약 2분)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const RUN = `(function (pos, seasons, off) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const orig = posSocialSwap, origArt = posArticleWeekly, swaps = [];
  posSocialSwap = function (cat, rc, c) { if (off) return null; const r = orig(cat, rc, c); if (r) swaps.push(cat + " · " + r.who.title + " · " + fillText(r.raw, c)); return r; };
  if (off) posArticleWeekly = function () {};
  for (let w = 0; w < seasons * 52; w++) {
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : ["solo_rank", "scrim", "replay", "champion"][state.week % 4];
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
  }
  const arts = state.inbox.filter(m => m.eventId === "pos_article");
  const weeks = arts.map(m => m.year * 52 + m.week).sort((a, b) => a - b), gaps = weeks.slice(1).map((w, i) => w - weeks[i]);
  const P = state.league.players, sig = JSON.stringify([state.stats, Object.keys(P).sort().slice(0, 60).map(id => P[id].stats), (state.career.seasons || []).map(s => [s.rank, s.titles])]);
  return JSON.stringify({ swaps: swaps.length, ex: swaps.filter((s, i) => i % 7 === 0).slice(0, 4), arts: arts.length, artEx: arts.slice(0, 1).map(m => m.title + " / " + m.text), minGap: gaps.length ? Math.min.apply(null, gaps) : 99, sig });
})`;
for (const pos of ["top", "jungle", "mid", "adc", "support"]) {
  const on = JSON.parse(vm.runInContext(RUN, create(81))(pos, 2, false));
  const offR = JSON.parse(vm.runInContext(RUN, create(81))(pos, 2, true));
  console.log("== " + pos + ": 바뀐 SNS 글 " + on.swaps + "개 · 분석 기사 " + on.arts + "개");
  on.ex.forEach(x => console.log("   " + x));
  on.artEx.forEach(x => console.log("   📰 " + x));
  ok(on.swaps > 0, pos + " SNS 글이 내 장면으로 바뀜");
  ok(on.minGap >= 4, pos + " 기사는 4주에 1번 이하 (가장 가까운 간격 " + on.minGap + "주)");
  ok(on.sig === offR.sig, pos + " 껐을 때와 게임 결과 같음");
}
console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
