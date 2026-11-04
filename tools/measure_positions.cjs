// ④ 포지션 경험 측정 (파일은 안 바꿈): 포지션마다 내가 주인공인 경기 장면 · 장면 없는 주 · 밴 · 바텀 파트너
// 실행: node tools/measure_positions.cjs   (5포지션 × 3판 × 3시즌, 2017 1부 중간 팀)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법
const SEASONS = 3;
const RUN = `(function (pos, seasons) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const seen = new Set(), me = POSITION_IDS.indexOf(pos);
  const partnerPos = pos === "adc" ? "support" : pos === "support" ? "adc" : null, pi = POSITION_IDS.indexOf(partnerPos);
  const out = { sets: 0, setsEv: 0, good: 0, bad: 0, other: 0, ids: {}, weeksPlayed: 0, weeksEmpty: 0, banned: 0, partners: {}, changes: 0, last: null };
  for (let w = 0; w < seasons * 52; w++) {
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
    const t = myTeam(); let played = false, evWeek = 0;
    userMatches().forEach(m => {
      if (!m.winner || !m.detail || seen.has(m)) return;
      seen.add(m);
      const side = m.a === t.id ? "a" : "b";
      m.detail.sets.forEach(s => {
        if (!s.lanes || s.lanes[me][side] !== USER_ID) return;
        played = true; out.sets++;
        const best = Object.keys(state.mastery).sort((x, y) => state.mastery[y] - state.mastery[x])[0];
        if (s.banned && s.banned.indexOf(best) !== -1) out.banned++;
        const mine = (s.ev || []).filter(e => e.p === USER_ID);
        if (mine.length) out.setsEv++;
        mine.forEach(e => {
          const info = matchEventInfo(e), kind = info && info.kind;
          if (kind === "good") out.good++; else if (kind === "bad") out.bad++; else out.other++;
          evWeek++; out.ids[e.e] = (out.ids[e.e] || 0) + 1;
        });
        if (partnerPos) {
          const p = s.lanes[pi][side];
          out.partners[p] = (out.partners[p] || 0) + 1;
          if (out.last && out.last !== p) out.changes++;
          out.last = p;
        }
      });
    });
    if (played) { out.weeksPlayed++; if (!evWeek) out.weeksEmpty++; }
  }
  return JSON.stringify(out);
})`;
const POS = ["top", "jungle", "mid", "adc", "support"], NAME = { top: "탑", jungle: "정글", mid: "미드", adc: "원딜", support: "서포트" };
const seeds = [21, 22, 23];
for (const pos of POS) {
  const all = seeds.map(seed => JSON.parse(vm.runInContext(RUN, create(seed))(pos, SEASONS)));
  const sum = k => all.reduce((s, r) => s + r[k], 0);
  const n = seeds.length * SEASONS, sets = sum("sets");
  const ids = {}; all.forEach(r => Object.keys(r.ids).forEach(k => { ids[k] = (ids[k] || 0) + r.ids[k]; }));
  const top = Object.keys(ids).sort((a, b) => ids[b] - ids[a]).slice(0, 10).map(k => k + " " + (ids[k] / n).toFixed(1));
  console.log("== " + NAME[pos] + " (시즌 평균)");
  console.log("  출전 세트 " + (sets / n).toFixed(0) + " · 내 장면 " + ((sum("good") + sum("bad") + sum("other")) / n).toFixed(1) +
    " (좋은 " + (sum("good") / n).toFixed(1) + " / 실수 " + (sum("bad") / n).toFixed(1) + " / 기타 " + (sum("other") / n).toFixed(1) + ")" +
    " · 내 장면 있는 세트 " + Math.round(sum("setsEv") / sets * 100) + "% · 출전했는데 장면 없는 주 " + Math.round(sum("weeksEmpty") / sum("weeksPlayed") * 100) + "% · 내 최고 숙련 챔피언 밴 " + Math.round(sum("banned") / sets * 100) + "%");
  console.log("  자주 나온 장면: " + top.join(", "));
  if (pos === "adc" || pos === "support") all.forEach((r, i) => {
    const ps = Object.values(r.partners).sort((a, b) => b - a);
    console.log("  판 " + (i + 1) + " 파트너 " + ps.length + "명 (세트 " + ps.join("/") + "), 바뀐 횟수 " + r.changes);
  });
}
