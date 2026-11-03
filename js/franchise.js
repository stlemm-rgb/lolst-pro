// ===== 프랜차이즈 (253, ② P5 · 사용자 결정 2026-11-03) — 실제 LCK처럼 2021년부터 =====
// - 1부 = 실제 10개 구단(TIER1_ORGS, 구단 열쇠 t.org), 승강전 없음
// - 2부 = 10개 구단의 2군(LCK CL): team.academyOf = 구단 열쇠, team.parent = 1군 팀 id. 독립 2부 구단은 해체 (state.league.oldTeams에 보관 → 지난 기록 이름)
// - 콜업: 4주마다 2군 선수가 같은 포지션 1군 주전보다 강하면 서로 바꿈 (내 선수는 감독 신뢰만큼 일찍)
// - 언제: 새 게임이 2021년 이후면 처음부터(makeLeague), 아니면 2021년 새 시즌(main.js nextWeek). 예전 세이브도 다음 새 시즌에 (시즌 중간엔 잡힌 경기가 깨져서)
// 이름·규칙: data/era.js ERA.franchiseFrom, data/names.js ACADEMY_NAMES

function franchiseOn(year) { return eraYear(year) >= ERA.franchiseFrom; }
function franchiseActive() { return !!(state.league && state.league.franchise); }

// 2군 이름: 표(ACADEMY_NAMES)에 있으면 그 이름, 없으면 '1군 그해 이름 + Challengers'
function academyName(org, year) {
  const rows = ACADEMY_NAMES[org];
  if (rows) { let row = rows[0]; rows.forEach(function (r) { if (r[0] <= year) row = r; }); return [row[1], row[2]]; }
  const r = realTeamName(org, year);
  return [(r ? r[1] : org) + " Challengers", (r ? r[2] : org) + "C"];
}

// 2군 팀 하나 만들기 (선수는 나중에 채움)
function newAcademy(parent, org) {
  const L = state.league;
  let n = L.teams.length + 1;
  while (findTeam("T" + n)) n++;
  const nm = academyName(org, state.year);
  return { id: "T" + n, name: nm[0], short: nm[1], tier: 2, roster: [], academyOf: org, parent: parent.id, founded: state.year };
}

// 해체: 팀을 목록에서 빼고 보관 (선수는 먼저 비워야 함)
function disbandTeam(t) {
  const L = state.league;
  L.oldTeams = L.oldTeams || [];
  L.oldTeams.push(Object.assign({}, t, { tier: 0, roster: [], disbanded: state.year })); // 팀 정보는 그대로(스태프·돈 등), 명단만 비움 — 지난 우승팀 계산 등이 그냥 건너감
  L.teams.splice(L.teams.indexOf(t), 1);
}

// 2020년 → 2021년 전환 (또는 예전 세이브의 다음 새 시즌). 돌려주는 값: 신년 기사 줄
function convertToFranchise() {
  const L = state.league;
  if (L.franchise || !franchiseOn(state.year)) return [];
  const news = [];
  // ① 실제 10개 구단: 없으면 만들고(신생 구단 방식), 전부 1부로
  const orgTeams = TIER1_ORGS.map(function (org) {
    let t = L.teams.find(function (x) { return teamOrg(x) === org; });
    if (!t) { t = foundClub(); t.org = org; }
    t.org = org;
    if (t.tier !== 1) news.push("🏛️ 프랜차이즈 가입: " + t.name + " — 다음 시즌부터 LCK");
    t.tier = 1;
    return t;
  });
  applyRealTeamNames(state.year);
  // ② 나머지(게임용) 팀은 해체 → 선수는 2군·FA로
  const gone = L.teams.filter(function (t) { return orgTeams.indexOf(t) === -1; });
  const pool = [];
  let userTeam = null;
  gone.forEach(function (t) {
    t.roster.forEach(function (id) { if (id === USER_ID) userTeam = t; else pool.push(id); });
    news.push("🏛️ " + t.name + " 해체 (" + (t.tier === 1 ? "프랜차이즈 미가입" : "독립 2부 리그 폐지") + ")");
    t.roster = [];
  });
  // ③ 구단마다 2군 창단
  const academies = orgTeams.map(function (p) { const a = newAcademy(p, p.org); L.teams.push(a); return a; });
  news.push("🏛️ LCK 프랜차이즈 출범 — 승강전이 없어지고, 10개 구단이 2군(" + eraNames(state.year).tier2 + ")을 운영한다.");
  // ④ 해체한 팀 선수로 2군 채우기: 포지션마다 1명씩 강한 순 → 후보 2명 → 남은 선수는 FA
  pool.sort(function (a, b) { return playerScore(b) - playerScore(a); });
  const take = function (a, pos) {
    const i = pool.findIndex(function (id) { return !pos || playerPos(id) === pos; });
    if (i === -1) return;
    const id = pool.splice(i, 1)[0];
    findPlayer(id).teamId = a.id;
    a.roster.push(id);
  };
  POSITION_IDS.forEach(function (pos) { shuffled(academies).forEach(function (a) { take(a, pos); }); });
  academies.forEach(function (a) { while (a.roster.length < LEAGUE.rosterSize && pool.length) take(a, null); });
  pool.forEach(function (id) { const p = findPlayer(id); p.teamId = null; if (L.freeAgents.indexOf(id) === -1) L.freeAgents.push(id); });
  // ⑤ 내 팀이 해체되면: 1군 주전보다 강하면 그 구단 1군, 아니면 내 포지션 주전이 가장 약한 2군
  if (userTeam) {
    const pos = state.player.position, me = playerScore(USER_ID);
    const weakest = function (list) { return list.slice().sort(function (a, b) { const sa = starterAt(a.id, pos), sb = starterAt(b.id, pos); return (sa ? playerScore(sa) : 0) - (sb ? playerScore(sb) : 0); })[0]; };
    const t1 = weakest(orgTeams), st = starterAt(t1.id, pos);
    const dest = st && me > playerScore(st) ? t1 : weakest(academies);
    dest.roster.push(USER_ID);
    state.contract.teamId = dest.id;
    state.team = dest.name;
    state.benched = false;
    const out = surplusPlayer(dest.id, USER_ID); // 인원이 넘치면 후보 규칙대로 1명 FA
    if (out) releaseToFA(out);
    postMessage("inbox", "🏛️ 프랜차이즈 출범 — " + dest.name + " 입단", userTeam.name + "이(가) 해체되면서 " + dest.name + (dest.tier === 1 ? "(1군)" : "(2군)") + "에 들어갔다. 계약 조건은 그대로다." +
      (dest.tier === 2 ? " 2군에서 1군 주전보다 강해지면 콜업된다." : ""), {});
  }
  gone.forEach(disbandTeam);
  fillRosters();
  ensureStaff();
  L.franchise = state.year;
  return news;
}

// 4주마다 (main.js nextWeek, checkBench 다음): 2군 → 1군 콜업
function callupWeekly() {
  if (!franchiseActive() || state.week % CONTRACT.benchCheckEvery !== 0 || state.week >= CONTRACT.windowStart) return;
  const mine = myTeam();
  state.league.teams.filter(function (t) { return t.academyOf; }).forEach(function (a) {
    const parent = findTeam(a.parent);
    if (!parent) return;
    POSITION_IDS.forEach(function (pos) {
      const st = starterAt(parent.id, pos);
      if (!st || st === USER_ID) return;
      const userHere = a.roster.indexOf(USER_ID) !== -1 && state.player.position === pos;
      const best = userHere ? USER_ID : a.roster.filter(function (id) { return id !== USER_ID && playerPos(id) === pos; })
        .sort(function (x, y) { return playerScore(y) - playerScore(x); })[0];
      if (!best) return;
      const bonus = best === USER_ID ? managerTrust() : 0; // 감독 신뢰 (js/fame.js)
      if (playerScore(best) + bonus <= playerScore(st)) return;
      swapCallup(best, a, st, parent);
    });
  });
  if (mine && myTeam() && myTeam().id !== mine.id) renderTopbar();
}

function swapCallup(upId, academy, downId, parent) {
  academy.roster.splice(academy.roster.indexOf(upId), 1);
  parent.roster.splice(parent.roster.indexOf(downId), 1);
  parent.roster.push(upId);
  academy.roster.push(downId);
  const down = findPlayer(downId);
  down.teamId = academy.id;
  logTransfer({ kind: "senddown", team: academy.id, from: parent.id, id: downId, name: down.name, pos: down.pos, score: Math.round(playerScore(downId) * 10) / 10, age: down.age, fee: 0 });
  if (upId === USER_ID) {
    state.contract.teamId = parent.id;
    state.team = parent.name;
    state.benched = false;
    addMoment("⬆️", parent.name + " 1군 콜업");
    postMessage("inbox", "⬆️ 1군 콜업!", parent.name + " 1군으로 올라왔다. " + playerName(downId) + "이(가) 2군으로 내려간다. 이제 " + eraNames(state.year).league + " 무대다.", {});
    addNews("콜업", escapeHTML(state.player.name) + ", " + academy.name + "에서 " + parent.name + " 1군으로 콜업");
    return;
  }
  const up = findPlayer(upId);
  up.teamId = parent.id;
  logTransfer({ kind: "callup", team: parent.id, from: academy.id, id: upId, name: up.name, pos: up.pos, score: Math.round(playerScore(upId) * 10) / 10, age: up.age, fee: 0 });
}
