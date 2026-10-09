// ===== 기록: 세트 평점, POG, 시즌 기록, 시상, 커리어 시즌 기록 =====
// 선수별 시즌 기록: state.league.season.playerStats[선수 id] =
//   { g: 세트, w: 세트 승, r: 평점 합, solo: 솔로킬, soloLost, pog: POG 수,
//     rg / rw / rr / rpog: 정규 시즌(전·후반기, 2부 리그)만 따로, team: 마지막 팀 }
// 역대 시상: state.league.awards = [{ year, key, title, id, name, team, pos, value }]
// 내 시즌 기록: state.career.seasons = [{ year, team, tier, ... }]

const REGULAR_COMPS = ["split1", "split2", "tier2", "tier2b"];

function seasonPlayerStats(id) {
  const season = state.league.season;
  if (!season.playerStats) season.playerStats = {};
  if (!season.playerStats[id]) {
    season.playerStats[id] = { g: 0, w: 0, r: 0, solo: 0, soloLost: 0, pog: 0, rg: 0, rw: 0, rr: 0, rpog: 0, team: null };
  }
  return season.playerStats[id];
}

function setRating(myPower, oppPower, won) {
  const v = RECORDS.ratingBase + (myPower - oppPower) / RECORDS.ratingDiv + (won ? RECORDS.setWinBonus : -RECORDS.setWinBonus);
  return Math.max(1, Math.min(10, v));
}

// 세트 평점 + 경기 흐름 사건 (슈퍼플레이 +, 실수 −, js/match_events.js)
function setRatingOf(set, p, opp, won) {
  const v = setRating(p.power, opp.power, won) + (set.evRate && p.id ? set.evRate[p.id] || 0 : 0);
  return Math.max(1, Math.min(10, v));
}

// 한 세트 기록 (playMatch에서 세트마다 부름)
function recordSet(set, m, perf) {
  const regular = REGULAR_COMPS.indexOf(m.comp) !== -1;
  [[set.la, set.lb, m.a], [set.lb, set.la, m.b]].forEach(function (side) {
    const mine = side[0], theirs = side[1], teamId = side[2];
    const wonSet = set.winner === teamId;
    mine.forEach(function (p, i) {
      if (!p.id) return; // 해외 가상 팀 선수는 기록 안 함
      const opp = theirs[i];
      const rating = setRatingOf(set, p, opp, wonSet);
      const solo = p.power - opp.power >= TEAM_MATCH.soloKillGap;
      const soloLost = opp.power - p.power >= TEAM_MATCH.soloKillGap;
      const st = seasonPlayerStats(p.id);
      st.g++; st.r += rating; if (wonSet) st.w++;
      if (solo) st.solo++;
      if (soloLost) st.soloLost++;
      st.team = teamId;
      if (regular) { st.rg++; st.rr += rating; if (wonSet) st.rw++; }
      if (!perf[p.id]) perf[p.id] = { g: 0, r: 0, team: teamId };
      perf[p.id].g++;
      perf[p.id].r += rating;
    });
  });
}

// 경기 끝: 이긴 팀에서 평균 평점이 가장 높은 선수가 POG
function finishSeriesRecord(m, perf) {
  let best = null, bestAvg = -1;
  Object.keys(perf).forEach(function (id) {
    const p = perf[id];
    if (p.team !== m.winner) return;
    const avg = p.r / p.g;
    if (avg > bestAvg) { best = id; bestAvg = avg; }
  });
  if (!best) return;
  m.pog = best;
  m.pogName = playerName(best);
  const st = seasonPlayerStats(best);
  st.pog++;
  if (REGULAR_COMPS.indexOf(m.comp) !== -1) st.rpog++;
}

// ----- 시상 -----
function giveAward(key, id, value, extraTitle) {
  const title = AWARD_NAMES[key] + (extraTitle ? " (" + extraTitle + ")" : "");
  const teamId = id === USER_ID ? myTeam().id : (findPlayer(id) ? findPlayer(id).teamId || worldTeamIdOf(id) : null); // 해외 선수면 해외 팀 (v1.1)
  const entry = {
    year: state.year, key: key, title: title, id: id, name: playerName(id),
    team: teamId ? teamName(teamId) : "FA", pos: playerPos(id), value: value,
  };
  if (!state.league.awards) state.league.awards = [];
  state.league.awards.push(entry);
  sTraitsOnAward(id, key); // 불사대마왕·철의 의지 (js/straits.js)
  if (id === USER_ID) {
    if (!state.career.awards) state.career.awards = [];
    state.career.awards.push({ year: state.year, title: title, key: key });
    addMoment("🏅", title + " 수상");
    state.popularity = clamp(state.popularity + RECORDS.awardBonus.popularity);
    state.reputation = Math.min(100, state.reputation + RECORDS.awardBonus.reputation);
    postMessage("news", "🏆 수상: " + title, state.player.name + "이(가) " + state.year + " " + title + "을(를) 받았다!", {
      notes: ["인기도 +" + RECORDS.awardBonus.popularity + ", 평판 +" + RECORDS.awardBonus.reputation],
    });
  }
  return entry;
}

// 결승 MVP: 결승전 POG
function finalsMvp(champKey, f) {
  const key = { cup: "cupfmvp", playoffs: "fmvp", worlds: "worldsfmvp", firststand: "fsfmvp", msi: "msifmvp" }[champKey];
  if (!key || !f.pog) return;
  giveAward(key, f.pog, null);
  addNews(AWARD_NAMES[key], f.pogName + " (" + teamName(f.winner) + ")");
  if (champKey === "playoffs") seasonAwards(); // 리그 결승이 끝나면 정규 시즌 상도 발표
}

// 정규 시즌 기록이 있는 선수 목록 (조건: 그 리그 팀 소속, 최소 세트)
function awardCandidates(tier, minSets) {
  const stats = state.league.season.playerStats || {};
  return Object.keys(stats).filter(function (id) {
    const st = stats[id];
    if (st.rg < minSets) return false;
    if (id !== USER_ID && !findPlayer(id)) return false;
    const t = st.team && findTeam(st.team);
    return t && t.tier === tier;
  });
}

function avgRating(id, regular) {
  const st = (state.league.season.playerStats || {})[id];
  if (!st) return 0;
  return regular ? (st.rg ? st.rr / st.rg : 0) : (st.g ? st.r / st.g : 0);
}

function mvpScore(id) {
  const st = state.league.season.playerStats[id];
  return avgRating(id, true) + st.rpog * RECORDS.pogWeight;
}

// 신인왕 후보: 나이 제한 + 신인왕을 받은 적 없음 + (내 선수는) 이전에 1부 시즌을 보낸 적 없음
function isRookieEligible(id) {
  if (playerAge(id) > RECORDS.rookieMaxAge) return false;
  const won = (state.league.awards || []).some(function (a) { return a.key === "rookie" && a.id === id; });
  if (won) return false;
  if (id === USER_ID) return !(state.career.seasons || []).some(function (r) { return r.tier === 1; });
  return true;
}

function seasonAwards() {
  const news = [];
  // 정규 시즌 MVP (1부)
  const mvp = awardCandidates(1, RECORDS.minSets.mvp).sort(function (a, b) { return mvpScore(b) - mvpScore(a); })[0];
  if (mvp) { giveAward("mvp", mvp, avgRating(mvp, true)); news.push("MVP " + playerName(mvp)); }
  // 올프로 퍼스트 팀: 포지션별 평균 평점 1위
  const allPro = awardCandidates(1, RECORDS.minSets.allPro);
  POSITION_IDS.forEach(function (pos) {
    const best = allPro.filter(function (id) { return playerPos(id) === pos; })
      .sort(function (a, b) { return avgRating(b, true) - avgRating(a, true); })[0];
    if (best) giveAward("allpro", best, avgRating(best, true), findPosition(pos).name);
  });
  // 신인왕 (1부, 나이 제한)
  const rookie = awardCandidates(1, RECORDS.minSets.rookie).filter(isRookieEligible)
    .sort(function (a, b) { return avgRating(b, true) - avgRating(a, true); })[0];
  if (rookie) { giveAward("rookie", rookie, avgRating(rookie, true)); news.push("신인왕 " + playerName(rookie)); }
  // 2부 MVP
  const t2 = awardCandidates(2, RECORDS.minSets.mvp).sort(function (a, b) { return mvpScore(b) - mvpScore(a); })[0];
  if (t2) { giveAward("tier2mvp", t2, avgRating(t2, true)); news.push("2부 MVP " + playerName(t2)); }
  if (news.length) addNews("시즌 시상", state.year + " 시즌 시상: " + news.join(", "));
}

// ----- 내 커리어 기록 -----
function ensureCareerRecords() {
  const c = state.career;
  if (!c.seasons) c.seasons = [];
  if (!c.awards) c.awards = [];
  if (!c.debut && state.player && state.league) {
    c.debut = { year: state.year, team: myTeam().name, age: state.player.age, score: playerScore(USER_ID) };
  }
  if (!c.statStart && state.player) c.statStart = JSON.parse(JSON.stringify(state.stats));
  ensureMoments(); // 커리어 주요 순간 (js/retire.js)
}

// 이번 시즌 내 기록 (진행 중)
function currentSeasonRecord() {
  const team = myTeam();
  const st = (state.league.season.playerStats || {})[USER_ID] || { g: 0, w: 0, r: 0, solo: 0, pog: 0 };
  const titles = [];
  const champ = state.league.season.champions || {};
  [["cup", "LCK 컵"], ["firststand", "First Stand"], ["msi", "MSI"], ["playoffs", "리그"], ["worlds", "월드"]].forEach(function (c) {
    if (champ[c[0]] === team.id) titles.push(c[1] + " 우승");
  });
  const rankList = team.tier === 1 ? tier1FinalOrder() : standings(["tier2", "tier2b"], tier2Ids()).map(function (x) { return x.id; });
  return {
    year: state.year, team: team.name, tier: team.tier, age: state.player.age,
    series: state.career.seasonGames || 0, seriesWins: state.career.seasonWins || 0,
    sets: st.g, setWins: st.w, rating: st.g ? st.r / st.g : 0, solo: st.solo, pog: st.pog,
    rank: rankList.indexOf(team.id) + 1, titles: titles,
    awards: (state.career.awards || []).filter(function (a) { return a.year === state.year; }).map(function (a) { return a.title; }),
    score: playerScore(USER_ID), salary: state.contract ? state.contract.salary : 0,
    soloRankPeak: state.soloRank ? state.soloRank.peak : 0,
  };
}

// 새해 직전: 지난 시즌 기록 저장 (main.js의 saveSeasonHistory에서 부름)
function saveCareerSeason() {
  ensureCareerRecords();
  state.career.seasons.push(currentSeasonRecord());
  state.career.seasonWins = 0;
}
