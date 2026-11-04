// 261 영혼의 듀오 검사: 브라우저 없이 Node로
// 1) 원딜로 5시즌 진행 → 같이 출전 세트가 세지고, 단계·연락이 실제로 오는지 (연락 목록)
// 2) 상황을 직접 만들어: 단계 조건(세트·큰 경기·관계) · 별명 고르기 · 헤어짐 · 맞대결 · 다시 한 팀 · 은퇴 · 선택지 빈칸
// 실행: node tools/test_duo.cjs
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
      nextWeek();
      state.inbox.forEach(m => { if (m.eventId && /^duo_/.test(m.eventId)) { got[m.eventId] = got[m.eventId] || []; if (got[m.eventId].indexOf(m.id) === -1) got[m.eventId].push(m.id, state.year + "년 " + m.week + "주 " + m.title); } });
    }
  }`;
for (const [pos, seed] of [["adc", 61], ["support", 61]]) {
  const ctx = create(seed);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () { begin("${pos}", 2017); const got = {}; play(52 * 5, got);
    const D = duoState(); const recs = Object.values(D.p).sort((a, b) => b.sets - a.sets).slice(0, 3).map(x => x.name + " " + x.sets + "세트 큰" + x.big + " 단계" + x.st + (x.nick ? " 「" + x.nick + "」" : "") + (x.left ? " 헤어짐" + x.left : ""));
    return JSON.stringify({ got: Object.keys(got).map(k => k + " " + got[k].filter((x, i) => i % 2).join(", ")), recs, card: duoCardHTML().length }); })()`, ctx));
  console.log("== " + pos + " 5시즌: " + r.recs.join(" | "));
  r.got.forEach(g => console.log("   " + g));
  ok(r.recs.length && r.card > 100, pos + " 같이 출전 기록·카드");
}
{
  const ctx = create(7);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () {
    const out = {};
    begin("adc", 2017); resetWeekCtx(); play(6, {});
    const D = duoState(), t = myTeam(), sup = starters(t.id).support;
    const rec = D.p[sup]; out.counted = !!rec && rec.sets > 0;
    // 단계: 세트만 160 + 큰 경기 10이어도 관계 30 아래면 단짝까지
    rec.sets = 160; rec.big = 10; state.relations[sup] = 10; rec.st = 1; state.trigQueue = [];
    duoWeekly(); out.pairOnly = rec.st === 2 && state.trigQueue.some(q => q.name === "duoPair") && !state.trigQueue.some(q => q.name === "duoSoul");
    state.relations[sup] = 35; state.trigQueue = []; duoWeekly(); const q = state.trigQueue.find(x => x.name === "duoSoul");
    out.soul = rec.st === 3 && !!q && q.ctx.nick1.indexOf("·") !== -1 && q.ctx.nick2 !== q.ctx.nick3;
    // 별명 고르기: 연락을 보내고 2번 선택지
    runQueuedTriggers(); const msg = state.inbox.find(m => m.eventId === "duo_soul");
    out.label = msg && msg.choices[1].label; out.noBrace = msg && msg.choices.every(c => c.label.indexOf("{") === -1);
    answerMessage(msg.id, 1); out.nick = rec.nick; out.nickOk = rec.nick === q.ctx.nick2;
    // 헤어짐: 파트너를 다른 팀으로
    const other = state.league.teams.find(x => x.id !== t.id && x.tier === 1);
    t.roster.splice(t.roster.indexOf(sup), 1); other.roster.push(sup); findPlayer(sup).teamId = other.id;
    state.trigQueue = []; duoWeekly(); out.split = rec.left === state.year && state.trigQueue.some(x => x.name === "duoSplit");
    // 다시 한 팀 → mateBack은 양보
    out.takeover = duoTakesOver(sup);
    // 은퇴
    state.trigQueue = []; duoOnRetire(findPlayer(sup)); out.retire = rec.retired === state.year && state.trigQueue.some(x => x.name === "duoRetire");
    out.events = ["duo_pair", "duo_soul", "duo_split", "duo_vs", "duo_back", "duo_title", "duo_retire"].filter(id => findEvent(id)).length;
    return JSON.stringify(out);
  })()`, ctx));
  ok(r.counted, "같이 출전한 세트가 세짐");
  ok(r.pairOnly, "관계 30 아래면 영혼의 듀오 안 됨 (단짝까지)");
  ok(r.soul, "관계 30 이상 → 영혼의 듀오 + 별명 후보 3개");
  ok(r.noBrace, "선택지 빈칸이 채워짐 · " + r.label);
  ok(r.nickOk, "별명 고르기 → " + r.nick);
  ok(r.split, "파트너가 다른 팀으로 → 헤어짐 연락");
  ok(r.takeover, "단짝 이상이면 ③ C '다시 한 팀' 대신 듀오 연락");
  ok(r.retire, "파트너 은퇴 연락");
  ok(r.events === 7, "듀오 연락 데이터 7개");
}
console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
