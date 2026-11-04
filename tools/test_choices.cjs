// 264 받은 연락 선택지 리뉴얼 1단계 검사: 브라우저 없이 Node로
// 의도 힌트 · 상황별 효과(ifTired) · 경기 버프 덮어쓰기 버그 · 관계 실제 증감 표시 · 글자를 고친 선택지(예전 세이브) · 1단계 연락의 불쾌한 벌점이 없어졌는지
// 실행: node tools/test_choices.cjs
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]);
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const r = JSON.parse(vm.runInContext(`(function () {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
  draft.teamChoice = draft.teams.findIndex(d => d.tier === 1); startCareer(true); state.settings.autoSave = false;
  for (let i = 0; i < 5; i++) nextWeek();
  const out = {}, mate = myTeam().roster.find(id => id !== USER_ID);
  if (!state.relations) state.relations = {};
  // 힌트
  state.stamina = 30; fireEvent(findEvent("call_conflict"), { pid: mate, player: playerName(mate) });
  out.hint = state.inbox[0].choices[0].hint;
  fireEvent(findEvent("pre_final"), {}); out.tiredHint = state.inbox[0].choices[2].hint;
  // 상황별 효과: 지쳐 있으면 체력 +12 +8, 아니면 +12
  state.stamina = 30; applyEffects({ stamina: 12, ifTired: { stamina: 8 } }, {}); out.tired = state.stamina;
  state.stamina = 60; applyEffects({ stamina: 12, ifTired: { stamina: 8 } }, {}); out.fresh = state.stamina;
  // 경기 버프: 큰 쪽 유지, 나쁜 버프는 더함
  state.matchBoost = 0.06; applyEffects({ matchBoost: 0.03 }, {}); out.boostKeep = state.matchBoost;
  state.matchBoost = 0.03; applyEffects({ matchBoost: 0.05 }, {}); out.boostUp = state.matchBoost;
  // 관계 표시 = 실제 증감
  state.relations[mate] = 98; out.relNote = applyEffects({ relation: 6 }, { pid: mate }).notes.join("");
  // 글자를 고친 선택지: 예전 글자로 온 연락도 순서로 답할 수 있음
  fireEvent(findEvent("mentor"), {}); const m = state.inbox[0]; m.choices[1].label = "바빠서 거절한다"; const c0 = state.condition;
  answerMessage(m.id, 1); out.oldLabel = m.answered === 1;
  // 3단계: 후속 연락은 보낼 때 조건(need)을 다시 봄 — 기억(flag)이 지워졌으면 안 옴, 남아 있으면 옴
  const fu = n => { state.pendingEvents = [{ event: "home_visit", at: absWeek(), ctx: {} }]; const b = state.msgSeq; firePendingEvents(); return state.msgSeq - b; };
  if (!state.flags) state.flags = {}; state.flags.homeVisit = true; out.fuOn = fu();
  delete state.flags.homeVisit; out.fuOff = fu();
  return JSON.stringify(out);
})()`, (() => { const c = create(5); return c; })()));
ok(/🏅 평판↑/.test(r.hint) && /관계↑/.test(r.hint), "의도 힌트 · " + r.hint);
ok(/지금 지쳐 있어서 더 회복↑/.test(r.tiredHint), "지쳐 있을 때 힌트 · " + r.tiredHint);
ok(r.tired === 50 && r.fresh === 72, "지쳐 있으면 더 회복 (30→" + r.tired + ", 60→" + r.fresh + ")");
ok(r.boostKeep === 0.06 && r.boostUp === 0.05, "경기 버프: 더 큰 쪽 유지 (" + r.boostKeep + ", " + r.boostUp + ")");
ok(/\+2 /.test(r.relNote) || /관계 \+2/.test(r.relNote), "관계 표시 = 실제로 오른 만큼 · " + r.relNote);
ok(r.oldLabel, "예전 글자로 온 연락도 답할 수 있음");
ok(r.fuOn === 1 && r.fuOff === 0, "후속 연락: 조건이 맞으면 옴, 기억이 지워졌으면 안 옴 (" + r.fuOn + ", " + r.fuOff + ")");
// 1단계 연락에 손해만 있는 선택지·이유 없는 벌점이 없어졌는지
const c = { console }; vm.createContext(c);
const html = fs.readFileSync(path.join(__dirname, "..", "Challenger_Road.html"), "utf8");
for (const f of [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1])) { try { vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8").replace(/^const /gm, "var "), c); } catch (e) {} }
const STEP1 = ["family_call", "team_dinner", "rumor", "call_conflict", "mentor", "review_title_fail", "pre_final"];
const bad = [];
STEP1.forEach(id => c.EVENTS.find(e => e.id === id).choices.forEach(ch => {
  const e = ch.effects || {}, nums = Object.keys(e).filter(k => typeof e[k] === "number");
  if (nums.length && nums.every(k => e[k] <= 0) && !ch.check && !ch.cure) bad.push(id + " " + ch.label);
}));
ok(!bad.length, "1단계 연락에 손해만 있는 선택지 없음" + (bad.length ? " · " + bad.join(", ") : ""));
const pf = c.EVENTS.find(e => e.id === "pre_final").choices;
ok(pf[0].effects.mental && pf[2].effects.ifTired, "결승 전날: '평소대로' 멘탈 / '일찍 잔다' 지쳐 있으면 더 — 서로 다른 이유");
// 265 2단계: 노력·용기의 실패는 작은 성과가 남거나 덜 아프게, 연애 미루기·무대응·친구 사과는 손해 없음
const ev = id => c.EVENTS.find(e => e.id === id);
const failOf = (id, i) => (ev(id).choices.filter(ch => ch.check)[i || 0].fail || {}).effects || {};
const soft = ["slump", "coach_talk", "rank_grind", "benched_now", "family_visit"].filter(id => { const f = failOf(id); return Object.keys(f).some(k => f[k] > 0); });
ok(soft.length === 5, "노력의 실패에 작은 성과가 남음 (" + soft.join(", ") + ")");
ok(["rm_cheer_seat", "rm_cheer_banner"].every(id => failOf(id).matchBoost === undefined), "응원 부탁 실패에 경기 벌점 없음");
const noLoss = [["rm_meet_dm", "읽고 넘긴다"], ["rm_date_cafe", "다음에 만나자고 한다"], ["rm_rumor_photo", "대응하지 않는다"], ["fr_clip_misunderstanding", "상처 준 말을 인정하고 만나자고 한다"]]
  .filter(x => { const e = ev(x[0]).choices.find(ch => ch.label === x[1]).effects || {}; return Object.keys(e).every(k => typeof e[k] !== "number" || e[k] >= 0); });
ok(noLoss.length === 4, "연애 미루기·무대응·친구 사과는 손해 없음");
ok(ev("rm_rumor_photo").choices.find(ch => ch.label === "연애를 부인한다").effects.reputation === undefined, "열애설 부인에 평판 벌점 없음 (상대 서운함만)");
console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
