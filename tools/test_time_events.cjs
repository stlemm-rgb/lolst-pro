// 254 ③ 시간 진행 연락 (A 시대 변화 · B 내 기록 회상) 검사: 브라우저 없이 Node로
// 1) 2012 1부로 시작해 10시즌 진행 → 2015 리그제 · 2020 무관중 · 2021 프랜차이즈(1부) · 데뷔 5년차 연락이 실제로 오는지
// 2) 상황을 직접 만들어 트리거 조건 확인 (2부 2군 콜업 글, 첫 우승 3년 뒤, 친정팀 경기, 2015 이후 데뷔면 리그제 연락 없음)
// 3) ③ C (257): 다시 한 팀 · 후배가 컸다 · 옛 동료와 적으로 · 친정팀(옛 동료 없음)
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

// 3) ③ C 같은 사람이 다시 나옴 (257): 상황을 직접 만들어 조건 확인
{
  const ctx = create(11);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () {
    const out = {};
    begin(2017, 1); resetWeekCtx(); play(3, {});
    const M = timeMem(), t = myTeam(), P = state.league.players;
    // C1 다시 한 팀: 2년 전에 떠났던 동료로 기억 → 매주 기억 갱신 때 '다시 한 팀' 후보
    const mate = t.roster.find(id => id !== USER_ID);
    M.mates[mate] = [state.year - 3, state.year - 2, 20, 21, 50, state.year - 2]; M.back = null;
    timeMemWeekly(); out.back = triggerContext("mateBack"); out.backTwice = !!triggerContext("mateBack");
    // 같은 해 안에 잠깐 떨어진 동료(콜업 등)는 아님
    M.mates[mate][5] = state.year; timeMemWeekly(); out.backSameYear = !!triggerContext("mateBack");
    // C2 후배: 다른 팀 리그 1위 선수를 '같이 뛸 때 18세 후배'로 기억
    const star = sortDescBy(Object.keys(P).filter(id => P[id].teamId && P[id].teamId !== t.id), playerScore)[0];
    M.mates[star] = [2015, 2016, 18, 22, 60, 2016];
    state.week = 4; out.juniorOff = !!triggerContext("juniorStar");
    state.week = 3; out.junior = triggerContext("juniorStar"); out.juniorTwice = !!triggerContext("juniorStar");
    // C3 옛 동료와 적으로: 이번 주 상대 팀 선수를 '한 시즌 같이 뛴 옛 동료'로 기억
    state.week = 20; const m = nextUserMatch(); state.week = m.week;
    const opp = m.a === t.id ? m.b : m.a, foe = findTeam(opp).roster[0];
    M.mates[foe] = [2015, 2016, 22, 22, 30, 2016]; out.vsShort = !!triggerContext("exMateVs"); // 30주 = 짧음
    M.mates[foe][4] = 45; out.vs = triggerContext("exMateVs"); out.vsTwice = !!triggerContext("exMateVs");
    // C5 친정팀: 상대 팀을 예전 팀으로 기억, 옛 동료(exMates) 없음 → 글 없는 쪽
    M.teams[opp] = 2015; M.vsYear = 0; delete M.seen["v" + foe];
    out.vsHome = !!triggerContext("exMateVs"); // 친정팀이면 C3 대신 친정팀 연락
    ensureFriends().exMates = {};
    out.solo = triggerContext("homeTeamSolo"); out.homeWithMate = !!triggerContext("homeTeam");
    state.eventCooldown.home_team = absWeek(); out.soloCool = !!triggerContext("homeTeamSolo"); // 옛 동료 있는 쪽을 막 받았으면 1년 같이 쉼
    out.events = ["mate_back", "junior_star", "junior_star_mentor", "exmate_vs", "home_team_solo"].filter(id => findEvent(id)).length;
    return JSON.stringify(out);
  })()`, ctx));
  ok(r.back && !!r.back.player && !r.backTwice, "C1 다시 한 팀 · " + (r.back && r.back.player + " (" + r.back.leftYear + "년에 떠남)"));
  ok(!r.backSameYear, "C1 같은 해 안에 잠깐 떨어진 동료는 아님");
  ok(!r.juniorOff && r.junior && r.junior.age === 18 && !r.juniorTwice, "C2 후배가 컸다 · " + (r.junior && r.junior.player + " · " + r.junior.pteam) + " (3·30주만, 한 사람 1번)");
  ok(!r.vsShort && r.vs && r.vs.untilYear === 2016 && !r.vsTwice, "C3 옛 동료와 적으로 · " + (r.vs && r.vs.player + " · " + r.vs.pteam) + " (한 시즌 이상만, 시즌 1번)");
  ok(!r.vsHome, "C3 친정팀 경기면 C3 대신 친정팀 연락");
  ok(r.solo && !r.solo.player && !r.homeWithMate && !r.soloCool, "C5 친정팀 (옛 동료 없음) · " + (r.solo && r.solo.oldteam) + " · 1년 쉼");
  ok(r.events === 5, "C 연락 데이터 5개");
}

// 4) ③ D 경력에 따라 역할이 바뀜 (258): 상황을 직접 만들어 조건 확인
{
  const ctx = create(13);
  vm.runInContext(SETUP, ctx);
  const r = JSON.parse(vm.runInContext(`(function () {
    const out = {};
    begin(2017, 1); resetWeekCtx(); play(3, {});
    while (userMatches().filter(m => m.winner).length < 3 && state.week < 30) play(1, {}); // D4용 경기 3개
    const M = timeMem(), t = myTeam(), P = state.league.players, d = state.career.debut;
    // D1 첫 후배: 4년차 + 우리 팀 동료 한 명을 18세로
    const kid = t.roster.find(id => id !== USER_ID);
    const age0 = P[kid].age; P[kid].age = 18;
    state.week = 10; d.year = state.year - 1; out.j2 = !!triggerContext("firstJunior"); // 2년차 = 아직
    d.year = state.year - 3; out.j = triggerContext("firstJunior"); out.jTwice = !!triggerContext("firstJunior");
    P[kid].age = age0;
    // D2 팀의 기둥: 6년차 + 입지 (standingValue를 잠깐 바꿔서)
    const sv = standingValue; d.year = state.year - 5;
    standingValue = () => 50; out.p50 = !!triggerContext("teamPillar");
    standingValue = () => 70; out.p = !!triggerContext("teamPillar"); out.pTwice = !!triggerContext("teamPillar");
    standingValue = sv;
    // D3 성장 정체: 7년차 + 지난 3시즌 기록 점수
    d.year = state.year - 6; const y = state.year;
    state.career.seasons = [{ year: y - 3, score: 80.1 }, { year: y - 2, score: 80.4 }, { year: y - 1, score: 80.6 }];
    state.week = 5; out.sWeek = !!triggerContext("growthStall");
    state.week = 4; out.s = triggerContext("growthStall"); out.sTwice = !!triggerContext("growthStall");
    M.stallYear = 0; state.career.seasons[1].score = 79; out.sGrow = !!triggerContext("growthStall"); // 한 번은 1점 넘게 큼 → 아님
    // D4 베테랑의 한마디: 9년차 + 3연패
    d.year = state.year - 8; const done = userMatches().filter(m => m.winner);
    out.hasGames = done.length >= 3;
    const keep = done.slice(-3).map(m => m.winner), opp = m => (m.a === t.id ? m.b : m.a);
    done.slice(-3).forEach(m => { m.winner = opp(m); });
    state.weekCtx.losses = 0; out.vNoLoss = !!triggerContext("veteranWord"); // 이번 주 진 경기가 없으면 아님
    state.weekCtx.losses = 1; out.v = !!triggerContext("veteranWord"); out.vTwice = !!triggerContext("veteranWord");
    done.slice(-3).forEach((m, i) => { m.winner = keep[i]; });
    out.events = ["first_junior", "team_pillar", "growth_stall", "veteran_word"].filter(id => findEvent(id)).length;
    return JSON.stringify(out);
  })()`, ctx));
  ok(!r.j2 && r.j && r.j.age === 18 && !r.jTwice, "D1 첫 후배 · " + (r.j && r.j.player + " " + r.j.age + "세") + " (3~5년차, 한 번)");
  ok(!r.p50 && r.p && !r.pTwice, "D2 팀의 기둥 (입지 60 이상, 한 팀에 한 번)");
  ok(!r.sWeek && r.s && r.s.score3 === 81 && !r.sTwice && !r.sGrow, "D3 성장 정체 · " + (r.s && r.s.score1 + "→" + r.s.score2 + "→" + r.s.score3) + " (4주만, 3년 쉼, 크면 아님)");
  ok(r.hasGames && !r.vNoLoss && r.v && !r.vTwice, "D4 베테랑의 한마디 (3연패 주, 2년 쉼)");
  ok(r.events === 4, "D 연락 데이터 4개");
}

console.log(fail ? "❌ 실패 " + fail + "개" : "✅ 통과");
process.exit(fail ? 1 : 0);
