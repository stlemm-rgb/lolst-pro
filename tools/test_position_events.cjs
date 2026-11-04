// 262 포지션 연락 검사: 브라우저 없이 Node로
// 1) 5포지션 × 2판 × 3시즌 실제 진행 → 시즌마다 어떤 포지션 연락이 몇 개 오는지 (듀오 연락 포함 한도 2 — 듀오 이야기는 막지 않음)
// 2) 상황을 직접 만들어: 장면 수 조건 · 같은 장면 다시 안 셈 · 한 시즌 1번 · 한도 · POG 조건 · 다른 포지션 연락은 안 옴 · 원인 한마디 · relationPos
// 실행: node tools/test_position_events.cjs   (약 3분)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const SETUP = `linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  function begin(pos, year) {
    state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = year; draft.teams = makeTeamDefs(year);
    const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
    startCareer(true); state.settings.autoSave = false;
  }
  function play(weeks, got) {
    for (let w = 0; w < weeks; w++) {
      state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : ["solo_rank", "scrim", "replay", "champion"][state.week % 4];
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
      const before = state.msgSeq || 0;
      nextWeek();
      state.inbox.forEach(m => { const ev = m.id > before && m.eventId && findEvent(m.eventId); if (ev && ev.tab === "inbox" && (ev.trigger.indexOf("pos:") === 0 || /^duo[A-Z]/.test(ev.trigger))) (got[m.year] = got[m.year] || []).push(m.eventId); });
    }
  }`;
const per = {};
for (const pos of ["top", "jungle", "mid", "adc", "support"]) for (const seed of [71, 72]) {
  const ctx = create(seed);
  vm.runInContext(SETUP, ctx);
  const got = JSON.parse(vm.runInContext(`(function () { begin("${pos}", 2017); const got = {}; play(52 * 3, got); return JSON.stringify(got); })()`, ctx));
  const ys = Object.keys(got);
  per[pos] = (per[pos] || []).concat([ys.map(y => y + ": " + got[y].join(", ")).join(" / ") || "없음"]);
  // 한도(듀오 연락 포함 2개)가 찬 뒤에는 포지션 연락이 안 옴 (듀오 이야기 연락은 막지 않아서 드물게 3개)
  ok(ys.every(y => got[y].every((id, i) => id.indexOf("pos_") !== 0 || i < 2)), pos + " 씨앗 " + seed + " 한도가 찬 뒤 포지션 연락 없음");
}
Object.keys(per).forEach(p => console.log("   " + p + " → " + per[p].join("  ||  ")));
{
  const ctx = create(9);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () {
    const out = {};
    begin("jungle", 2017); resetWeekCtx(); play(3, {});
    const S = posSceneState(), w = absWeek(); S.log = []; S.pog = []; S.last = {}; state.eventLog.ys = {};
    S.log.push({ w: w, e: "smite_lose", pick: "리신", pm: 20 });
    out.one = !!triggerContext("pos:jungle_smite");
    S.log.push({ w: w, e: "no_smite", pick: "리신", pm: 20 });
    out.other = !!triggerContext("pos:top_island"); // 다른 포지션 연락은 안 옴
    const c = triggerContext("pos:jungle_smite"); out.two = !!c && c.n === 2; out.cause = c && c.cause;
    out.reuse = !!triggerContext("pos:jungle_smite"); // 같은 장면 다시 안 셈
    // 한 시즌 1번: 연락을 실제로 보냈다고 기록
    logEventFired(findEvent("pos_jungle_smite"));
    S.log.push({ w: w, e: "smite_lose" }, { w: w, e: "smite_lose" });
    out.once = !!triggerContext("pos:jungle_smite");
    S.last.jungle_smite = state.year - 1; out.gap1 = !!triggerContext("pos:jungle_smite"); // 1년 뒤도 아직 아님
    S.last.jungle_smite = state.year;
    // 한도 2: 듀오 연락 1개 + 포지션 1개 = 2 → 다른 포지션 연락도 안 옴
    logEventFired(findEvent("duo_split"));
    S.log.push({ w: w, e: "jungle_death" }, { w: w, e: "jungle_death" }, { w: w, e: "invade_fail" });
    out.cap = !!triggerContext("pos:jungle_lanes");
    // 오래된 장면(4주 전)은 지워짐
    S.log.push({ w: w - 10, e: "jungle_death" }); posSceneWeekly(); out.old = S.log.every(x => x.w >= w - 3);
    // relationPos
    const top = starters(myTeam().id).top, r0 = relationOf(top); applyRelationPos("top", []); out.rel = relationOf(top) - r0;
    // 서폿 POG 조건
    begin("support", 2017); resetWeekCtx(); play(3, {});
    const S2 = posSceneState(), w2 = absWeek(); S2.log = [{ w: w2, e: "vision_pick" }, { w: w2, e: "super_save" }]; S2.pog = [w2];
    out.pog = !!triggerContext("pos:sup_unseen"); S2.pog = []; out.noPog = !!triggerContext("pos:sup_unseen");
    out.events = Object.keys(POSITION_EVENT_RULES.events).filter(k => findEvent("pos_" + k)).length;
    return JSON.stringify(out);
  })()`, ctx));
  ok(!r.one && r.two, "장면 2번이 쌓여야 옴 (1번은 아님)");
  ok(!r.other, "다른 포지션 연락은 안 옴");
  ok(!!r.cause, "원인 한마디 · " + r.cause);
  ok(!r.reuse, "같은 장면으로 두 번 안 옴");
  ok(!r.once && !r.gap1, "같은 연락은 2년에 한 번");
  ok(!r.cap, "듀오 연락과 합쳐 한 시즌 2개까지");
  ok(r.old, "4주 지난 장면은 지움");
  ok(r.rel === 3, "relationPos 관계 +3");
  ok(!r.pog && r.noPog, "'기록에 안 보이는 일'은 그 기간 POG가 없을 때만");
  ok(r.events === 10, "포지션 연락 데이터 10개");
}
console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
