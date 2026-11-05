// 277 검사: 받은 연락 선택지의 관계 효과가 '조용히 안 먹는' 일이 없는지 (Codex 조사 → 사용자: 은퇴한 친구는 연락에 더 안 나오게)
// 1) 은퇴한 친구 연락(작별·코치 재회·해설자)이 안 옴  2) 후속 연락을 기다리는 동안 그 선수가 은퇴하면 안 오고, 기다리던 이야기 기억(flag)은 풀림
// 3) 그때 동료가 다 은퇴하면 우승 3주년 사진 연락이 안 옴  4) 실제 진행 5포지션 × 5시즌: 고른 관계 효과의 대상이 늘 살아 있는 선수
// 실행: node tools/test_effect_targets.cjs (약 1분)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const START = `linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = POS; draft.startYear = YEAR; draft.teams = makeTeamDefs(YEAR);
  draft.teamChoice = draft.teams.findIndex(d => d.tier === 1); startCareer(true); state.settings.autoSave = false;`;

// 1)~3) 조건
const r1 = JSON.parse(vm.runInContext(`(function () { const POS = "mid", YEAR = 2017; ${START}
  for (let i = 0; i < 10; i++) nextWeek();
  const out = {};
  const mate = myTeam().roster.find(id => id !== USER_ID);
  // 1) 친한 동료 은퇴 → 작별 연락 대기열에 안 들어감, 은퇴 기록은 남음
  if (!state.relations) state.relations = {}; if (!state.flags) state.flags = {};
  state.relations[mate] = 60; state.trigQueue = [];
  const p = state.league.players[mate];
  retirePlayer(p);
  out.noFarewell = !(state.trigQueue || []).some(q => q.name === "friendRetire");
  out.recorded = state.friends.retired.some(x => x.pid === mate);
  out.noRetiredWho = friendWhoContext("retiredFriend") === null;
  // 2) 후속 대기 중 은퇴 → 안 옴 + flag 풀림 / 살아 있는 선수면 옴
  const send = (id, pid) => { state.pendingEvents = [{ event: id, at: absWeek(), ctx: { pid: pid, player: "X" } }]; const b = state.msgSeq; firePendingEvents(); return state.msgSeq - b; };
  state.flags.fr_contract_pending = true;
  out.goneSent = send("fr_contract_walk", mate);
  out.flagFreed = !state.flags.fr_contract_pending;
  const alive = myTeam().roster.find(id => id !== USER_ID);
  state.flags.fr_contract_pending = true;
  out.aliveSent = send("fr_contract_walk", alive);
  // 3) 우승 3주년: 그때 동료가 다 없으면 안 옴
  state.timeMem = state.timeMem || {};
  return JSON.stringify(out);
})()`, create(3)));
ok(r1.noFarewell, "친한 동료가 은퇴해도 작별 연락(이미 은퇴한 뒤 도착)은 안 옴");
ok(r1.recorded, "은퇴한 친구 기록은 친구 화면용으로 남음");
ok(r1.noRetiredWho, "은퇴한 친구가 나오는 연락(코치·해설자 재회)은 대상을 못 골라 안 옴");
ok(r1.goneSent === 0 && r1.flagFreed, "후속을 기다리는 동안 은퇴한 선수 → 후속 안 옴, 기다리던 이야기 기억은 풀림");
ok(r1.aliveSent === 1, "살아 있는 선수의 후속은 그대로 옴");

// 4) 실제 진행: 관계 효과를 고른 연락의 대상이 늘 있는 선수인지 (changeRelation이 조용히 무시한 횟수)
const POSS = ["top", "jungle", "mid", "adc", "support"];
let ignored = 0, applied = 0;
const ids = {};
POSS.forEach(function (pos, k) {
  const r = JSON.parse(vm.runInContext(`(function () { const POS = "${pos}", YEAR = ${k % 2 ? 2012 : 2017}; ${START}
    let ig = 0, ap = 0; const who = {};
    const orig = changeRelation;
    changeRelation = function (id, n, notes) { if (n) { if (state.league.players[id]) ap++; else { ig++; who[CUR] = (who[CUR] || 0) + 1; } } return orig(id, n, notes); };
    let CUR = "";
    const origAns = answerMessage;
    answerMessage = function (id, c) { const m = state.inbox.find(x => x.id === id); CUR = m ? m.eventId || "?" : "?"; const r = origAns(id, c); CUR = ""; return r; };
    for (let i = 0; i < 52 * 5; i++) {
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, (state.week + m.id) % m.choices.length));
      nextWeek();
    }
    return JSON.stringify({ ig: ig, ap: ap, who: who });
  })()`, create(11 + k)));
  ignored += r.ig; applied += r.ap; Object.keys(r.who).forEach(function (e) { ids[e] = (ids[e] || 0) + r.who[e]; });
});
ok(applied > 50, "실제 진행 25시즌: 연락 답의 관계 효과가 " + applied + "번 먹음");
ok(ignored === 0, "대상이 없어 조용히 무시된 관계 효과 " + ignored + "번" + (ignored ? " (" + JSON.stringify(ids) + ")" : ""));

console.log(fail ? "\n❌ " + fail + "개 실패" : "\n전체 통과");
process.exit(fail ? 1 : 0);
