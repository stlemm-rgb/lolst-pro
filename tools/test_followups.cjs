// 267 ④-2 3단계 검사: 자주 오는 연락 6개의 선택이 몇 주 뒤 후속 연락으로 다시 언급되는지 (브라우저 없이 Node로, 약 1분)
// 1) 조건: 순위(topRank·lowRank)·나올 선수(who)를 보낼 때 다시 봄  2) 실제 진행 5포지션 × 4시즌: 후속이 오고, 빈칸({player} 등)이 다 채워짐
// 실행: node tools/test_followups.cjs
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const NEW = ["media_vow_high", "media_vow_low", "media_taunt_reply", "contract_stay_word", "contract_prove_good", "contract_prove_bad",
  "bootcamp_memory", "home_rest_after", "offseason_stream_after", "interview_thanks", "new_champ_ask", "birthday_mate", "birthday_family_after",
  "clutch_profile", "clutch_promise", "rival_practice", "rival_held", "rival_close", "allstar_picked_after", "allstar_missed_after", "wrist_routine", "wrist_back", "wrist_fine"]; // 269: 남은 후속 4개
const START = `linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = POS; draft.startYear = YEAR; draft.teams = makeTeamDefs(YEAR);
  draft.teamChoice = draft.teams.findIndex(d => d.tier === 1); startCareer(true); state.settings.autoSave = false;`;

// 1) 조건
const r1 = JSON.parse(vm.runInContext(`(function () { const POS = "mid", YEAR = 2017; ${START}
  for (let i = 0; i < 20; i++) nextWeek();
  const out = {}, send = (id, ctx) => { state.pendingEvents = [{ event: id, at: absWeek(), ctx: ctx || {} }]; const b = state.msgSeq; firePendingEvents(); return state.msgSeq - b; };
  myLeagueRank = () => 2; out.highTop = send("media_vow_high"); out.lowTop = send("media_vow_low");
  myLeagueRank = () => 8; out.highLow = send("media_vow_high"); out.lowLow = send("media_vow_low");
  out.good = send("contract_prove_good"); out.bad = send("contract_prove_bad");
  send("interview_thanks"); const m = state.inbox[0]; out.who = m.eventId === "interview_thanks" && myTeam().roster.indexOf(m.ctx.pid) !== -1 && m.ctx.pid !== USER_ID;
  send("new_champ_ask", { champ: "아리" }); out.champ = state.inbox[0].title;
  const solo = myTeam().roster.slice(); myTeam().roster = [USER_ID]; out.noMate = send("birthday_mate"); myTeam().roster = solo;
  return JSON.stringify(out);
})()`, create(3)));
ok(r1.highTop === 1 && r1.lowTop === 0 && r1.highLow === 0 && r1.lowLow === 1, "미디어데이 '우승합니다': 2위면 기사, 8위면 소환 연락 (" + [r1.highTop, r1.lowTop, r1.highLow, r1.lowLow] + ")");
ok(r1.good === 0 && r1.bad === 1, "'남은 경기로 보여 드리겠습니다': 8위면 아쉬운 시즌 소식만");
ok(r1.who, "동료가 나오는 후속: 보낼 때 우리 팀 동료를 고름");
ok(/아리/.test(r1.champ), "새 챔피언 이름이 후속 연락까지 이어짐 · " + r1.champ);
ok(r1.noMate === 0, "나올 동료가 없으면 안 보냄");

// 1-2) 269 조건: 같은 팀 동료·경쟁자 점수·올스타·체력
const r2 = JSON.parse(vm.runInContext(`(function () { const POS = "mid", YEAR = 2017; ${START}
  for (let i = 0; i < 20; i++) nextWeek();
  const out = {}, send = (id, ctx) => { state.pendingEvents = [{ event: id, at: absWeek(), ctx: ctx || {} }]; const b = state.msgSeq; firePendingEvents(); return state.msgSeq - b; };
  const mate = myTeam().roster.find(id => id !== USER_ID), P = state.league.players[mate];
  const other = Object.keys(state.league.players).find(id => state.league.players[id].teamId && state.league.players[id].teamId !== myTeam().id);
  out.mate = send("clutch_promise", { pid: mate, player: P.name }); out.gone = send("clutch_promise", { pid: other, player: "x" }); out.noPid = send("clutch_profile");
  const ps = playerScore; playerScore = id => id === USER_ID ? 60 : 70;
  out.closeUp = send("rival_close", { pid: mate, player: P.name }); out.heldUp = send("rival_held", { pid: mate, player: P.name });
  playerScore = id => id === USER_ID ? 70 : 60;
  out.closeDn = send("rival_close", { pid: mate, player: P.name }); out.heldDn = send("rival_held", { pid: mate, player: P.name }); playerScore = ps;
  state.career.allStarYear = state.year; state.career.allStarPickYear = state.year;
  out.pk1 = send("allstar_picked_after"); out.ms1 = send("allstar_missed_after");
  state.career.allStarPickYear = 0; out.pk2 = send("allstar_picked_after"); out.ms2 = send("allstar_missed_after");
  state.career.allStarYear = 0; out.ms3 = send("allstar_missed_after");
  state.stamina = 20; out.back1 = send("wrist_back"); out.fine1 = send("wrist_fine");
  state.stamina = 60; out.back2 = send("wrist_back"); out.fine2 = send("wrist_fine");
  return JSON.stringify(out);
})()`, create(5)));
ok(r2.mate === 1 && r2.gone === 0 && r2.noPid === 0, "슈퍼 세이브 후속: 그 동료가 같은 팀일 때만 (" + [r2.mate, r2.gone, r2.noPid] + ")");
ok(r2.closeUp === 1 && r2.heldUp === 0 && r2.closeDn === 0 && r2.heldDn === 1, "경쟁자 후속: 경쟁자가 앞서면 '쫓아왔다', 뒤지면 '자리 그대로'");
ok(r2.pk1 === 1 && r2.ms1 === 0 && r2.pk2 === 0 && r2.ms2 === 1 && r2.ms3 === 0, "올스타 후속: 뽑힘/못 뽑힘 하나만, 올스타가 안 열렸으면 안 옴");
ok(r2.back1 === 1 && r2.fine1 === 0 && r2.back2 === 0 && r2.fine2 === 1, "손목 후속: 체력 30 이하면 '다시 욱신', 아니면 '테이핑 졸업'");

// 2) 실제 진행: 선택지를 돌아가며 고름
const got = {}; const bad = [];
["top", "jungle", "mid", "adc", "support"].forEach((pos, k) => {
  const r = JSON.parse(vm.runInContext(`(function () { const POS = "${pos}", YEAR = ${k % 2 ? 2017 : 2012}; ${START}
    const seen = {}, bad = [], NEW = ${JSON.stringify(NEW)};
    for (let i = 0; i < 52 * 4; i++) {
      state.retirePlanned = false; state.plan = state.stamina < 35 ? "rest" : (state.week % 2 ? "scrim" : "replay");
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, (state.week + m.id) % m.choices.length));
      const b = state.msgSeq; nextWeek();
      state.inbox.filter(m => m.id > b && NEW.indexOf(m.eventId) !== -1).forEach(m => {
        seen[m.eventId] = (seen[m.eventId] || 0) + 1;
        const all = [m.title, m.text].concat((m.choices || []).map(c => c.label)).join(" ");
        if (/\{[a-z]+\}/.test(all)) bad.push(m.eventId + ": " + all.slice(0, 60));
      });
    }
    return JSON.stringify({ seen, bad });
  })()`, create(11 + k)));
  Object.keys(r.seen).forEach(id => { got[id] = (got[id] || 0) + r.seen[id]; });
  bad.push(...r.bad);
});
const total = Object.values(got).reduce((a, b) => a + b, 0);
console.log("   20시즌 동안 온 후속: " + total + "개 (시즌당 " + (total / 20).toFixed(1) + ") · " + Object.keys(got).map(k => k + " " + got[k]).join(", "));
ok(Object.keys(got).length >= 14, "후속 연락 " + NEW.length + "종 중 " + Object.keys(got).length + "종이 실제로 옴 (14종 이상)");
ok(total / 20 <= 5, "시즌당 5개 이하");
ok(!bad.length, "빈칸이 남은 글 없음" + (bad.length ? " · " + bad.join(" / ") : ""));
console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
