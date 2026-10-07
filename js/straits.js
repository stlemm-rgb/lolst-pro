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
  list.push(traitId);
  const t = findTrait(traitId);
  const teamId = id === USER_ID ? myTeam().id : findPlayer(id).teamId;
  const team = teamId ? teamName(teamId) : "FA";
  if (!state.league.sTraitLog) state.league.sTraitLog = [];
  state.league.sTraitLog.push({ year: state.year, week: state.week, id: id, name: playerName(id), team: team, trait: traitId });
  state.league.sTraitLog = state.league.sTraitLog.slice(-100);

  if (id === USER_ID) {
    postMessage("news", "🌟 S급 특성 획득: " + t.name, rule.text + "!\n" + t.desc, { notes: ["S급 특성 '" + t.name + "'을(를) 얻었다!"] });
    addMoment("🌟", "S급 특성 '" + t.name + "' 획득 (" + rule.text + ")");
  } else {
    addNews("S급 특성", playerName(id) + "(" + team + ")이(가) S급 특성 '" + t.name + "'을(를) 얻었다! (" + rule.text + ")");
  }

  // GOAT: S급 특성이 일정 개수 이상
  const goat = sRule("s_goat");
  if (traitId !== "s_goat" && goat) {
    const count = list.filter(function (x) { return findTrait(x).type === "s" && x !== "s_goat"; }).length;
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
    });
  });
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
      (r.who === "user" ? " (내 선수만)" : "") + "</td></tr>";
  }).join("");
  return (
    '<div class="card"><h2>🌟 S급 특성 기록</h2>' +
      (rows ? '<table class="roster"><tr><th>언제</th><th>선수</th><th>특성</th><th>조건</th></tr>' + rows + "</table>"
            : '<p class="muted">아직 S급 특성을 얻은 선수가 없어요.</p>') +
      '<h2 class="sub">S급 특성 얻는 법</h2><table class="mini">' + guide + "</table>" +
    "</div>"
  );
}
