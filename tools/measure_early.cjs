// 288 측정: 경기 시작 3분 이내 사건 (사용자: 3분 이내엔 초반 인베이드(운영 강점)만)
// 3분 이하 사건 종류별 횟수 + 강한 팀(전력 높은 쪽)이 세트를 이기는 비율 + 세트당 사건 수
// 실행: node tools/measure_early.cjs (약 1분)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
const START = `linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = POS; draft.startYear = YEAR; draft.teams = makeTeamDefs(YEAR);
  draft.teamChoice = draft.teams.findIndex(d => d.tier === 1); startCareer(true); state.settings.autoSave = false;`;
const tot = { early: {}, sets: 0, ev: 0, fav: 0, favN: 0, shown: 0, shownBad: 0, shownInv: 0 };
[["mid", 2017, 3], ["top", 2012, 4], ["adc", 2022, 5]].forEach(function (c) {
  const r = JSON.parse(vm.runInContext(`(function () { const POS = "${c[0]}", YEAR = ${c[1]}; ${START}
    const out = { early: {}, sets: 0, ev: 0, fav: 0, favN: 0, shown: 0, shownBad: 0, shownInv: 0 };
    const orig = rollSetEvents;
    rollSetEvents = function () { const r = orig.apply(null, arguments); out.sets++;
      r.list.forEach(function (e) { if (e.e === "solo") return; out.ev++; if (e.t <= 3) out.early[e.e] = (out.early[e.e] || 0) + 1; }); return r; };
    const look = function () {
      state.league.season.matches.forEach(function (m) {
        if (!m.winner || m._seen) return; m._seen = 1;
        // 화면에 보이는 시간(경기 기록 detail, 경기 길이에 맞게 줄인 시간)으로도 3분 안엔 인베이드만인지
        if (m.detail && m.detail.sets) m.detail.sets.forEach(function (st) { (st.ev || []).forEach(function (e) {
          if (e.t > 3 || e.t >= 99) return; out.shown++; if (MATCH_EVENT_RULES.earlyOnly.ids.indexOf(e.e) === -1) out.shownBad++; else out.shownInv++; }); });
        const ta = findTeam(m.a), tb = findTeam(m.b);
        if (!ta || !tb || !ta.roster || !tb.roster || !ta.roster.length || !tb.roster.length) return;
        const sa = teamStrength(m.a), sb = teamStrength(m.b);
        if (Math.abs(sa - sb) >= 2) { out.favN++; if ((m.winner === m.a) === (sa > sb)) out.fav++; }
      });
    };
    for (let i = 0; i < 52 * 3; i++) {
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
      nextWeek(); look();
    }
    return JSON.stringify(out);
  })()`, create(c[2])));
  tot.sets += r.sets; tot.ev += r.ev; tot.fav += r.fav; tot.favN += r.favN; tot.shown += r.shown; tot.shownBad += r.shownBad; tot.shownInv += r.shownInv;
  Object.keys(r.early).forEach(function (k) { tot.early[k] = (tot.early[k] || 0) + r.early[k]; });
});
const early = Object.keys(tot.early).sort(function (a, b) { return tot.early[b] - tot.early[a]; });
console.log("세트 " + tot.sets + "개 · 사건 " + tot.ev + "개 (세트당 " + (tot.ev / tot.sets).toFixed(2) + ")");
console.log("3분 이하 사건 " + early.reduce(function (s, k) { return s + tot.early[k]; }, 0) + "개: " + early.map(function (k) { return k + " " + tot.early[k]; }).join(", "));
console.log("전력 2 이상 차이 경기에서 강한 팀 승률 " + (tot.fav / tot.favN * 100).toFixed(1) + "% (" + tot.favN + "경기)");
console.log("화면 시간 3분 이하 (내 경기 기록): " + tot.shown + "개 중 인베이드 " + tot.shownInv + " · 인베이드 아닌 사건 " + tot.shownBad);
if (tot.shownBad) process.exit(1);
