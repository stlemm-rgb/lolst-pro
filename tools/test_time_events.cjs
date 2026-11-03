// 254 ③ 시간 진행 연락 (A 시대 변화 · B 내 기록 회상) 검사: 브라우저 없이 Node로
// 1) 2012 1부로 시작해 10시즌 진행 → 2015 리그제 · 2020 무관중 · 2021 프랜차이즈(1부) · 데뷔 5년차 연락이 실제로 오는지
// 2) 상황을 직접 만들어 트리거 조건 확인 (2부 2군 콜업 글, 첫 우승 3년 뒤, 친정팀 경기, 2015 이후 데뷔면 리그제 연락 없음)
// 실행: node tools/test_time_events.cjs   (약 1분)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법

let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }

const SETUP = `linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  function begin(year, tier) {
    state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = year; draft.teams = makeTeamDefs(year);
    const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === tier); draft.teamChoice = list[0][1];
    startCareer(true); state.settings.autoSave = false;
  }
  function play(weeks, got) {
    for (let w = 0; w < weeks; w++) {
      state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
      nextWeek();
      state.inbox.forEach(m => { if (m.eventId && !got[m.eventId]) got[m.eventId] = state.year + "년 " + m.week + "주 · " + m.title; });
    }
  }`;

// 1) 실제 진행
{
  const ctx = create(7);
  vm.runInContext(SETUP, ctx);
  const got = JSON.parse(vm.runInContext(`(function () { begin(2012, 1); const got = {}; play(52 * 9 + 3, got); got._won = state.career.finalsWon; got._title = timeMem().title; got._teams = Object.keys(timeMem().teams).length; return JSON.stringify(got); })()`, ctx));
  ["era_league_2015", "era_empty_2020", "career_anniv"].forEach(id => ok(!!got[id], id + (got[id] ? " — " + got[id] : " 안 옴")));
  ok(!!(got.era_franchise_main || got.era_franchise_academy), "2021 프랜차이즈 연락 — " + (got.era_franchise_main || got.era_franchise_academy || "안 옴"));
  ok(!got.promotion_eve || !/202[1-9]/.test(got.promotion_eve), "2021~ 승강전 연락 없음");
  ok(!got._won || (got._title && got._title.mates.length === 4), "첫 우승 기억 (우승 " + got._won + "번" + (got._title ? " · " + got._title.year + " " + got._title.team + " " + got._title.name + " · 동료 " + got._title.mates.length + "명" : "") + ")");
  if (got._title && got._title.year <= 2017) ok(!!got.title_anniv, "첫 우승 3년 뒤 연락 — " + (got.title_anniv || "안 옴"));
}

// 2) 상황 직접 만들기
{
  const ctx = create(9);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () {
    const out = {};
    begin(2017, 1); resetWeekCtx();
    state.year = 2015; state.week = 2; out.leagueLate = !!triggerContext("eraLeague"); // 2017 데뷔 → 리그제 연락 없음
    state.week = 3; state.year = state.career.debut.year + 4; out.anniv = triggerContext("careerAnniv");
    // 첫 우승 3년 뒤: 기억에 그때 동료가 있으면 그 동료 관계
    const t = myTeam(), st = starters(t.id), mate = Object.values(st).find(id => id && id !== USER_ID);
    timeMem().title = { year: 2016, team: t.name, name: "LCK 스프링", mates: [mate] };
    state.year = 2019; state.week = 5; out.title = triggerContext("titleAnniv");
    state.week = 6; out.titleOff = !!triggerContext("titleAnniv");
    // 친정팀: 다른 팀을 예전 팀으로 기억 + 그 팀에 옛 동료
    state.year = 2019; state.week = 20;
    const m = nextUserMatch(); out.hasMatch = !!m;
    if (m) {
      state.week = m.week; const opp = m.a === t.id ? m.b : m.a;
      timeMem().teams[opp] = 2017; const ex = findTeam(opp).roster.find(id => id !== USER_ID);
      out.homeNoMate = !!triggerContext("homeTeam");
      ensureFriends().exMates[ex] = 1; out.home = triggerContext("homeTeam");
    }
    return JSON.stringify(out);
  })()`, ctx));
  ok(!r.leagueLate, "2015 이후 데뷔면 리그제 연락 없음");
  ok(r.anniv && r.anniv.years === 5 && r.anniv.debutYear === 2017, "데뷔 5년차 조건 · 데뷔 연도 " + (r.anniv && r.anniv.debutYear));
  ok(r.title && r.title.titleYear === 2016 && !!r.title.pid, "첫 우승 3년 뒤 · 그때 동료 " + (r.title && r.title.player));
  ok(!r.titleOff, "첫 우승 연락은 5주에만");
  ok(r.hasMatch && !r.homeNoMate, "옛 동료 없는 친정팀이면 안 옴");
  ok(r.home && r.home.sinceYear === 2017 && !!r.home.player, "친정팀 경기 · " + (r.home && r.home.oldteam + " · " + r.home.player));
}
{
  const ctx = create(5);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () { begin(2017, 2); const got = {}; play(52 * 4 + 3, got);
    return JSON.stringify({ year: state.year, tier: myTeam().tier, academy: !!myTeam().academyOf, got: got }); })()`, ctx));
  const g = r.got;
  if (r.tier === 2) ok(!!g.era_franchise_academy && !g.era_franchise_main, "2부(2군) 2021 연락 = 콜업 글 — " + (g.era_franchise_academy || "안 옴"));
  else ok(!!g.era_franchise_main, "2017 2부 시작이 1부로 올라감 → 2021 연락 = 1부 글 — " + (g.era_franchise_main || "안 옴"));
  ok(!!g.era_empty_2020, "2020 무관중 — " + (g.era_empty_2020 || "안 옴"));
}

console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
