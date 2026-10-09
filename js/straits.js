// ===== S급 특성: 얻는 조건 확인과 지급 (나와 다른 선수 모두) =====
// 조건은 data/traits.js의 S_TRAIT_RULES
// 선수별 커리어 기록: 내 선수 state.career.rec / 다른 선수 p.rec = { worlds, reverseSweeps, clubTeam, clubYears }
// 지급 기록: state.league.sTraitLog = [{ year, week, id, name, team, trait }]

function sRule(traitId) {
  return S_TRAIT_RULES.find(function (r) { return r.trait === traitId; });
}

function recOf(id) {
  if (id === USER_ID) {
    if (!state.career.rec) state.career.rec = {};
    return state.career.rec;
  }
  const p = findPlayer(id);
  if (!p) return null;
  if (!p.rec) p.rec = {};
  return p.rec;
}

function traitListOf(id) {
  if (id === USER_ID) return state.player.traits;
  const p = findPlayer(id);
  if (!p) return null;
  if (!p.traits) p.traits = [];
  return p.traits;
}

// S급 특성 주기 (이미 있거나 조건 대상이 아니면 무시)
function grantSTrait(id, traitId) {
  const rule = sRule(traitId);
  const list = traitListOf(id);
  if (!rule || !list || list.indexOf(traitId) !== -1) return;
  if (rule.who === "user" && id !== USER_ID) return;
  if (rule.who === "npc" && id === USER_ID) return; // 라이벌 전용 (124)
  list.push(traitId);
  const t = findTrait(traitId);
  const teamId = id === USER_ID ? myTeam().id : findPlayer(id).teamId || worldTeamIdOf(id); // 해외 선수면 해외 팀 (v1.1)
  const team = teamId ? teamName(teamId) : "FA";
  if (!state.league.sTraitLog) state.league.sTraitLog = [];
  state.league.sTraitLog.push({ year: state.year, week: state.week, id: id, name: playerName(id), team: team, trait: traitId });
  state.league.sTraitLog = state.league.sTraitLog.slice(-100);

  if (id === USER_ID) {
    const why = traitId === "s_comeback" && recOf(USER_ID).reverseList ? "\n역전 기록: " + recOf(USER_ID).reverseList.join(" · ") : ""; // 어떤 경기로 얻었는지 (v1.1)
    postMessage("news", "🌟 S급 특성 획득: " + t.name, rule.text + "!\n" + t.desc + why, { notes: ["S급 특성 '" + t.name + "'을(를) 얻었다!"] });
    addMoment("🌟", "S급 특성 '" + t.name + "' 획득 (" + rule.text + ")");
  } else if (traitId === "r_nemesis") {
    // 숙명의 라이벌: 나를 겨냥하는 상대라 연락으로 알림
    postMessage("news", "⚔️ 숙명의 라이벌: " + playerName(id), team + "의 " + findPosition(findPlayer(id).pos).name + " " + playerName(id) + "이(가) 인터뷰에서 " + state.player.name + "을(를) 이기는 게 목표라고 밝혔다. 우리 팀과 만날 때마다 이를 갈고 나올 것이다.",
      { notes: [t.desc, "선수가 은퇴하거나 2부로 내려가면 다른 선수가 이어받을 수 있어요"] });
  } else {
    addNews("S급 특성", playerName(id) + "(" + team + ")이(가) " + (t.rival ? "라이벌 전용 " : "") + "S급 특성 '" + t.name + "'을(를) 얻었다! (" + rule.text + ")");
  }

  // GOAT: S급 특성이 일정 개수 이상
  const goat = sRule("s_goat");
  if (traitId !== "s_goat" && goat) {
    const count = list.filter(function (x) { const t = findTrait(x); return t && t.type === "s" && !t.rival && x !== "s_goat"; }).length; // 라이벌 전용은 세지 않음
    if (count >= goat.sCount) grantSTrait(id, "s_goat");
  }
}

// 한계 돌파 기준(S_TRAIT_RULES의 atLeast, 없으면 상한선)에 닿은 스탯 개수
function statsAtCap(id) {
  const stats = id === USER_ID ? state.stats : findPlayer(id).stats;
  const tr = traitsOf(id);
  const need = (sRule("s_breakthrough") || {}).atLeast;
  return STATS.filter(function (s) { return stats[s.id] >= (need || statCapOf(tr, s.id)); }).length;
}

// ----- 기록 시점마다 부르는 확인 -----

// 결승에서 이긴 팀 (koFinal에서 부름). 월드 우승은 주전으로 뛴 선수만 셈
function sTraitsOnTitle(teamId, champKey) {
  const team = findTeam(teamId);
  if (!team) return; // 해외 팀
  const st = starters(teamId);
  POSITION_IDS.map(function (pos) { return st[pos]; }).forEach(function (id) { // 주전만 (후보·2군은 제외)
    if (!id || (id === USER_ID && state.benched)) return;
    const rec = recOf(id);
    if (!rec) return;
    if (champKey === "worlds") {
      rec.worlds = (rec.worlds || 0) + 1;
      if (rec.worlds >= sRule("s_emperor").worlds) grantSTrait(id, "s_emperor");
    }
  });
  // 잡초: 2군에 내려갔던 시즌에 우리 팀 우승
  if (team.roster.indexOf(USER_ID) !== -1 && state.career.benchedYear === state.year) grantSTrait(USER_ID, "s_weed");
}

// 경기 하나가 끝났을 때 (playMatch에서 부름). downTwo: 0:2로 몰렸던 팀 id 목록
// 5판 경기에서 0:2를 3:2로 뒤집은 팀 선수들 기록 (역전의 명수)
function sTraitsOnMatch(m, perf, downTwo) {
  if (m.bo !== 5 || downTwo.indexOf(m.winner) === -1) return;
  Object.keys(perf).forEach(function (id) {
    if (perf[id].team !== m.winner) return;
    const rec = recOf(id);
    if (!rec) return;
    rec.reverseSweeps = (rec.reverseSweeps || 0) + 1;
    // 어떤 경기였는지 기록 (v1.1: 확인용) — 예: "2017 플레이오프 4강 vs KT HYDRA"
    rec.reverseList = (rec.reverseList || []).concat([state.year + " " + m.label + " vs " + teamName(m.loser)]).slice(-5);
    if (id === USER_ID) addNews("역전승", "🔥 0:2에서 3:2 역전승! (" + m.label + " vs " + teamName(m.loser) + ") — 역전의 명수 " + Math.min(rec.reverseSweeps, sRule("s_comeback").reverseSweeps) + "/" + sRule("s_comeback").reverseSweeps);
    if (rec.reverseSweeps >= sRule("s_comeback").reverseSweeps) grantSTrait(id, "s_comeback");
  });
}

// 상을 받았을 때 (giveAward에서 부름)
function sTraitsOnAward(id, key) {
  if (key === "fmvp" || key === "worldsfmvp") {
    const other = key === "fmvp" ? "worldsfmvp" : "fmvp";
    const both = (state.league.awards || []).some(function (a) { return a.id === id && a.year === state.year && a.key === other; });
    if (both) grantSTrait(id, "s_demon");
  }
  if (key === "mvp" && playerAge(id) >= sRule("s_iron_will").age) grantSTrait(id, "s_iron_will");
  if (key === "fmvp") { // 라이벌 전용: 국내(리그) 결승 MVP — 1년짜리, 다음 해 결승 MVP에게 넘어감 (v1.1)
    const give = id !== USER_ID && rivalScale().dynasty; // 내 S급이 없으면 왕조의 심장 없음 (v1.1)
    clearRivalTitle("r_dynasty", give ? id : []);
    if (give) grantSTrait(id, "r_dynasty");
  }
}

// 내 S급 특성 수에 따른 라이벌 전용 특성 규모 (data/traits.js RIVAL_SCALE)
function rivalScale() {
  const i = Math.min(userSCount(), RIVAL_SCALE.aceTop.length - 1);
  return { aceTop: RIVAL_SCALE.aceTop[i], dynasty: RIVAL_SCALE.dynasty[Math.min(i, RIVAL_SCALE.dynasty.length - 1)] };
}

// 지금 내 S급 수보다 많이 퍼져 있는 라이벌 특성 정리 (불러올 때·매주): 에이스는 점수 높은 순으로 aceTop명만, 왕조의 심장은 없어야 하면 모두
function enforceRivalScale() {
  if (!state.league || !state.player) return;
  const sc = rivalScale();
  const P = state.league.players;
  const aces = Object.keys(P).filter(function (id) { return (P[id].traits || []).indexOf("r_ace") !== -1; })
    .sort(function (a, b) { return playerScore(b) - playerScore(a); });
  if (aces.length > sc.aceTop) clearRivalTitle("r_ace", aces.slice(0, sc.aceTop));
  if (!sc.dynasty) clearRivalTitle("r_dynasty", []);
}

// 새해 은퇴·해외 진출 뒤: 에이스가 은퇴해서 모자라면 지난 시즌 평점 다음 순위 선수로 채움 (main.js 새해)
function refillRivalAces() {
  const L = state.league, snap = L.marketSnap;
  if (!snap || !snap.ratings) return;
  const need = rivalScale().aceTop;
  const P = L.players;
  const have = Object.keys(P).filter(function (id) { return (P[id].traits || []).indexOf("r_ace") !== -1; });
  if (have.length >= need) return;
  const t1 = {};
  tierTeams(1).forEach(function (t) { t1[t.id] = true; });
  Object.keys(snap.ratings).filter(function (id) { return P[id] && t1[P[id].teamId] && have.indexOf(id) === -1 && snap.ratings[id][1] >= 20; })
    .sort(function (a, b) { return snap.ratings[b][0] - snap.ratings[a][0]; })
    .slice(0, need - have.length).forEach(function (id) { grantSTrait(id, "r_ace"); });
}

// 1년짜리 라이벌 특성 (v1.1): 지금 가진 선수에게서 떼어 냄 (keep: 남길 선수 id 또는 id 목록)
//   🔥 리그의 에이스(해마다 시즌 끝) · 🏰 왕조의 심장(해마다 리그 결승) — 한 번 받으면 영원히 쌓이던 문제
function clearRivalTitle(traitId, keep) {
  const P = state.league.players;
  const keepIds = Array.isArray(keep) ? keep : [keep];
  Object.keys(P).forEach(function (pid) {
    const list = P[pid].traits;
    if (keepIds.indexOf(pid) !== -1 || !list) return;
    const i = list.indexOf(traitId);
    if (i !== -1) list.splice(i, 1);
  });
}

// 예전 세이브 (v1.0): 쌓여 있던 1년짜리 라이벌 특성을 가장 최근에 받은 선수들만 남기고 정리 (한 번만)
function trimRivalTitles() {
  const L = state.league;
  if (!L || L.rivalYearDone) return;
  const log = L.sTraitLog || [];
  ["r_ace", "r_dynasty"].forEach(function (traitId) {
    const mine = log.filter(function (e) { return e.trait === traitId; });
    const lastYear = mine.reduce(function (m, e) { return Math.max(m, e.year); }, 0);
    const keep = mine.filter(function (e) { return e.year === lastYear && lastYear >= state.year - 1; }).map(function (e) { return e.id; });
    Object.keys(L.players).forEach(function (pid) {
      const list = L.players[pid].traits;
      const i = list ? list.indexOf(traitId) : -1;
      if (i !== -1 && keep.indexOf(pid) === -1) list.splice(i, 1);
    });
  });
  L.rivalYearDone = true;
}

// 시즌이 끝날 때 (새해 직전, 이번 시즌 기록이 남아 있을 때)
function sTraitsOnSeasonEnd() {
  const stats = state.league.season.playerStats || {};
  state.league.teams.forEach(function (t) {
    const s = starters(t.id);
    const starterIds = POSITION_IDS.map(function (pos) { return s[pos]; });
    t.roster.forEach(function (id) {
      const rec = recOf(id);
      if (!rec) return;
      // 원클럽맨: 같은 팀에서 1부 주전으로 보낸 시즌 (팀을 옮기면 처음부터)
      if (rec.clubTeam !== t.id) { rec.clubTeam = t.id; rec.clubYears = 0; }
      const benched = id === USER_ID ? state.benched : starterIds.indexOf(id) === -1;
      if (t.tier === 1 && !benched) rec.clubYears = (rec.clubYears || 0) + 1;
      if (rec.clubYears >= sRule("s_one_club").seasons) grantSTrait(id, "s_one_club");
      // 라인 지배자: 한 시즌 솔로킬
      const st = stats[id];
      if (st && st.solo >= sRule("s_lane_lord").solo) grantSTrait(id, "s_lane_lord");
      // 한계 돌파: 95 이상 스탯
      if (statsAtCap(id) >= sRule("s_breakthrough").atCap) grantSTrait(id, "s_breakthrough");
      // 라이벌 전용 베테랑: 1부 주전 시즌 수 (팀을 옮겨도 이어짐)
      if (t.tier === 1 && !benched && id !== USER_ID) rec.t1Years = (rec.t1Years || 0) + 1;
      const vet = sRule("r_veteran");
      if (vet && id !== USER_ID && rec.t1Years >= vet.seasons && playerAge(id) >= vet.age) grantSTrait(id, "r_veteran");
    });
  });
  rivalSTraitsOnSeasonEnd(stats);
}

// 라이벌 전용 S급 (124): 에이스(평점 상위) · 숙명의 라이벌(나를 겨냥)
function rivalSTraitsOnSeasonEnd(stats) {
  const P = state.league.players;
  const t1 = state.league.teams.filter(function (t) { return t.tier === 1; });
  // 리그의 에이스: 1부 선수 중 시즌 평균 평점 상위 n명 (세트 20개 이상)
  const ace = sRule("r_ace");
  const nem = sRule("r_nemesis");
  if (!ace || !nem) return;
  const ids = [];
  t1.forEach(function (t) { t.roster.forEach(function (id) { if (id !== USER_ID && P[id] && stats[id] && stats[id].g >= 20) ids.push(id); }); });
  ids.sort(function (a, b) { return stats[b].r / stats[b].g - stats[a].r / stats[a].g; });
  const aces = ids.slice(0, rivalScale().aceTop); // 내 S급 수에 따라 0·1·3명 (v1.1)
  clearRivalTitle("r_ace", aces); // 1년짜리: 작년 에이스는 내려놓음 (v1.1)
  aces.forEach(function (id) { grantSTrait(id, "r_ace"); });
  // 숙명의 라이벌: 리그에 1명. 지금 주인이 없거나 1부를 떠났으면, 내 선수가 강할 때 새로
  const mine = myTeam();
  const holder = Object.keys(P).find(function (id) { return (P[id].traits || []).indexOf("r_nemesis") !== -1; });
  const holderOk = holder && P[holder].teamId && findTeam(P[holder].teamId) && findTeam(P[holder].teamId).tier === 1 && P[holder].teamId !== (mine && mine.id);
  if (holder && !holderOk) P[holder].traits.splice(P[holder].traits.indexOf("r_nemesis"), 1); // 2부로 가거나 우리 팀에 오면 내려놓음
  if (holderOk || !mine || mine.tier !== 1 || state.benched || playerScore(USER_ID) < nem.userScore) return;
  const rivals = [];
  t1.forEach(function (t) { if (t.id !== mine.id) t.roster.forEach(function (id) { if (P[id] && P[id].pos === state.player.position && (P[id].traits || []).indexOf("r_ace") !== -1) rivals.push(id); }); }); // 🔥 리그의 에이스만
  rivals.sort(function (a, b) { return playerScore(b) - playerScore(a); });
  if (rivals.length) grantSTrait(rivals[0], "r_nemesis");
}

// 내 선수만: 매주 확인 (events.js checkTraitGains에서 부름)
function sTraitsWeeklyUser() {
  const mastered = Object.keys(state.mastery).filter(function (n) { return state.mastery[n] >= MASTERY.max; }).length;
  if (mastered >= sRule("s_champ_master").mastered) grantSTrait(USER_ID, "s_champ_master");
  if (state.soloRank && state.soloRank.peak >= sRule("s_rank_god").ladder) grantSTrait(USER_ID, "s_rank_god");
  if (statsAtCap(USER_ID) >= sRule("s_breakthrough").atCap) grantSTrait(USER_ID, "s_breakthrough");
}

// [역사관] S급 특성 기록 카드
function sTraitLogHTML() {
  const log = (state.league.sTraitLog || []).slice().reverse();
  const rows = log.slice(0, 30).map(function (e) {
    return '<tr class="' + (e.id === USER_ID ? "me" : "") + '"><td>' + e.year + "년 " + e.week + "주</td><td><b>" + escapeHTML(e.name) + '</b> <span class="muted small">' + escapeHTML(e.team) + "</span></td><td>" +
      traitChipHTML(e.trait) + '</td><td class="muted small">' + escapeHTML(sRule(e.trait).text) + "</td></tr>";
  }).join("");
  const guide = S_TRAIT_RULES.map(function (r) {
    return "<tr><td>" + traitChipHTML(r.trait) + '</td><td class="small">' + escapeHTML(r.text) + '</td><td class="muted small">' + escapeHTML(findTrait(r.trait).desc) +
      (r.who === "user" ? " (내 선수만)" : r.who === "npc" ? " (라이벌 전용 — 다른 선수만)" : "") + "</td></tr>";
  }).join("");
  return (
    '<div class="card"><h2>🌟 S급 특성 기록</h2>' +
      (rows ? '<table class="roster"><tr><th>언제</th><th>선수</th><th>특성</th><th>조건</th></tr>' + rows + "</table>"
            : '<p class="muted">아직 S급 특성을 얻은 선수가 없어요.</p>') +
      '<h2 class="sub">S급 특성 얻는 법</h2><table class="mini">' + guide + "</table>" +
    "</div>"
  );
}
