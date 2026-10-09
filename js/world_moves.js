// ===== ③ 선수 오가기 + 외국인 수 제한 + 언어 소통 (v1.1) =====
// 값: data/era.js WORLD_MOVES · LANG_RULES. 새 시즌 비시즌(js/contracts.js contractsNewSeason)에서 부름.
// 국내 선수 = state.league.players (id "P…"), 해외 선수 = state.world.players (id "X…")

// ----- 외국인 -----
// 팀의 '현지 출신' (국내 팀 = 한국, 해외 팀 = 그 지역)
function homeOriginOfTeam(teamId) {
  if (findTeam(teamId)) return HOME_ORIGIN.id;
  const wt = findWorldTeam(teamId);
  return wt ? wt.region : null;
}
function isForeignIn(p, teamId) {
  const o = originOf(p);
  return !!o && o !== homeOriginOfTeam(teamId);
}
// 팀의 외국인 수 (내 선수는 한국 출신)
function foreignCount(teamId) {
  const t = findTeam(teamId) || findWorldTeam(teamId);
  if (!t) return 0;
  return t.roster.filter(function (id) { return id !== USER_ID && isForeignIn(findPlayer(id), teamId); }).length;
}
function foreignRoom(teamId) { return foreignCount(teamId) < WORLD_MOVES.foreignMax; }
// 이 선수를 이 팀이 데려와도 되나 (외국인이면 자리가 있어야, 같은 팀 안 이동은 그대로)
function foreignOk(id, teamId) {
  const p = findPlayer(id);
  if (!p || p.teamId === teamId || !isForeignIn(p, teamId)) return true;
  return foreignRoom(teamId);
}

// ----- 언어 -----
function teamLangOf(teamId) {
  if (findTeam(teamId)) return HOME_ORIGIN.lang;
  const wt = findWorldTeam(teamId);
  return wt ? REGION_LANG[wt.region] || "en" : HOME_ORIGIN.lang;
}
// 선수의 그 언어 실력 0~100 (모국어 100)
function langSkill(p, code) {
  if (!p) return 100;
  if (langOf(p) === code) return 100;
  const v = p.langs && p.langs[code];
  return v !== undefined ? v : (code === "en" ? LANG_RULES.startEn : LANG_RULES.start);
}
// 팀에 들어갈 때 언어 실력 시작값 기록
function noteLangJoin(p, teamId) {
  const code = teamLangOf(teamId);
  if (langOf(p) === code) return;
  p.langs = p.langs || {};
  if (p.langs[code] === undefined) p.langs[code] = code === "en" ? LANG_RULES.startEn : LANG_RULES.start;
}
// 새해: 팀 언어가 모국어가 아닌 선수는 실력 +perYear
function langNewSeason() {
  const grow = function (p, teamId) {
    if (!p || !teamId) return;
    const code = teamLangOf(teamId);
    if (langOf(p) === code) return;
    p.langs = p.langs || {};
    p.langs[code] = Math.min(100, langSkill(p, code) + LANG_RULES.perYear);
  };
  Object.keys(state.league.players).forEach(function (id) { const p = state.league.players[id]; grow(p, p.teamId); });
  if (state.world) state.world.teams.forEach(function (t) { t.roster.forEach(function (id) { grow(state.world.players[id], t.id); }); });
}
// 이번 세트 라인업의 언어 틈: 주전마다 (1 − 팀 언어 실력/100)을 더함 (해외 가상 선수·내 선수는 0)
function langGapOf(list, teamId) {
  const code = teamLangOf(teamId);
  return list.reduce(function (sum, q) {
    if (!q.id || q.id === USER_ID) return sum;
    return sum + (1 - langSkill(findPlayer(q.id), code) / 100);
  }, 0);
}

// ----- 국내 ↔ 해외 선수 바꾸기 -----
// 해외 선수 → 국내 선수(FA)로 (새 id, 이름·스탯·특성·숙련도·출신·언어 그대로). 해외 팀 빈자리는 현지 신인으로
function worldToLeague(wid) {
  const W = state.world, w = W.players[wid];
  const wt = findWorldTeam(worldTeamIdOf(wid));
  const p = { id: newPlayerId(), name: w.name, pos: w.pos, age: w.age, stats: Object.assign({}, w.stats), teamId: null,
    traits: (w.traits || []).slice(), style: w.style, origin: originOf(w), mastery: w.mastery ? Object.assign({}, w.mastery) : null, langs: w.langs ? Object.assign({}, w.langs) : undefined,
    fromWorld: wt ? wt.name : null };
  if (!p.mastery) npcMasteryInit(p);
  state.league.players[p.id] = p;
  state.league.freeAgents.push(p.id);
  if (wt) {
    wt.roster.splice(wt.roster.indexOf(wid), 1);
    const locals = wt.roster.map(worldPlayer).filter(function (q) { return q && q.origin === wt.region; });
    const avg = locals.length ? average(locals.map(worldScore)) : worldTeamStrength(wt);
    wt.roster.push(makeWorldPlayer(w.pos, avg - WORLD_RULES.rookieBelow / 2, LEAGUE.rookie.ageRange, wt.region).id);
  }
  delete W.players[wid];
  return p;
}
// 국내 FA → 해외 팀으로 (해외 선수로 다시 만듦, 그 팀 같은 포지션 가장 약한 선수와 바꿈)
function leagueFAToWorld(id, wt) {
  const W = state.world, p = findPlayer(id);
  W.seq = (W.seq || 0) + 1;
  const np = { id: "X" + W.seq, name: p.name, pos: p.pos, age: p.age, stats: Object.assign({}, p.stats),
    traits: (p.traits || []).filter(function (x) { const t = findTrait(x); return t && !t.rival; }), style: p.style,
    origin: originOf(p) || HOME_ORIGIN.id, mastery: p.mastery, langs: p.langs, abroadYear: state.year, fromLeague: "FA" };
  W.players[np.id] = np;
  if (W.names && W.names.indexOf(p.name) === -1) W.names.push(p.name);
  const same = wt.roster.filter(function (x) { return worldPlayer(x) && worldPlayer(x).pos === p.pos; })
    .sort(function (a, b) { return worldScore(worldPlayer(a)) - worldScore(worldPlayer(b)); });
  if (same.length) { wt.roster.splice(wt.roster.indexOf(same[0]), 1); delete W.players[same[0]]; }
  wt.roster.push(np.id);
  noteLangJoin(np, wt.id);
  if (state.friends && state.friends.best) { const i = state.friends.best.indexOf(id); if (i !== -1) state.friends.best.splice(i, 1); }
  const fa = state.league.freeAgents.indexOf(id);
  if (fa !== -1) state.league.freeAgents.splice(fa, 1);
  delete state.league.players[id];
  return np;
}
function regionNameOf(wt) { return (findRegion(wt.region) || {}).name || "해외"; }

// ----- 새 시즌: 비시즌 이적 (contractsNewSeason에서) -----
// 1) 해외에 간 한국 선수 복귀 (국내 FA로) — 국내 보강 라운드 전에
function returnHomeMoves(news) {
  const R = WORLD_MOVES.returnHome;
  if (!state.world) return;
  let n = 0;
  shuffled(Object.keys(state.world.players)).forEach(function (wid) {
    const w = state.world.players[wid];
    if (n >= R.perYear || originOf(w) !== HOME_ORIGIN.id) return;
    if (!w.abroadYear) w.abroadYear = state.year - 1; // 예전 세이브
    if (state.year - w.abroadYear < R.minYears || Math.random() >= R.chance) return;
    const wt = findWorldTeam(worldTeamIdOf(wid));
    const p = worldToLeague(wid);
    logTransfer({ kind: "return", team: null, from: null, fromName: wt ? wt.name + " (" + regionNameOf(wt) + ")" : "해외", id: p.id, name: p.name, pos: p.pos, score: Math.round(playerScore(p.id) * 10) / 10, age: p.age, fee: 0, origin: p.origin });
    news.push("🔁 🏠 " + p.name + "(" + findPosition(p.pos).name + ", " + playerScore(p.id).toFixed(1) + "), " + (wt ? wt.name + "에서 " : "") + "해외 생활을 마치고 국내 복귀 — FA 시장에");
    n++;
  });
}

// 1-2) 우리 리그에서 뛰던 외국인 선수도 몇 년 뒤 고향 리그로 (같은 returnHome 규칙)
function foreignReturnMoves(news) {
  const R = WORLD_MOVES.returnHome;
  if (!state.world) return;
  let n = 0;
  shuffled(Object.keys(state.league.players)).forEach(function (id) {
    const p = state.league.players[id];
    const o = originOf(p);
    if (n >= R.perYear || !o || o === HOME_ORIGIN.id || p.loan) return;
    if (!p.importYear) p.importYear = state.year - 1;
    if (state.year - p.importYear < R.minYears || Math.random() >= R.chance) return;
    const dest = shuffled(state.world.teams.filter(function (wt) { return wt.region === o; }))[0];
    if (!dest) return;
    const from = p.teamId ? findTeam(p.teamId) : null;
    const score = playerScore(id);
    if (p.teamId) releaseToFA(id);
    leagueFAToWorld(id, dest);
    logTransfer({ kind: "return", team: null, from: from ? from.id : null, id: id, name: p.name, pos: p.pos, score: Math.round(score * 10) / 10, age: p.age, fee: 0, to: dest.name + " (" + regionNameOf(dest) + ")", origin: o });
    news.push("🔁 🏠 외국인 선수 " + p.name + "(" + (from ? from.name + " " : "") + findPosition(p.pos).name + "), 고향 " + regionNameOf(dest) + " " + dest.name + "(으)로 돌아감");
    n++;
  });
}

// 2) 국내 구단의 해외 선수 영입 — 국내 보강 라운드 전에 (외국인이 없는 팀만)
function importMoves(moved, news) {
  const R = WORLD_MOVES.import;
  if (!state.world) return;
  let n = 0;
  shuffled(state.league.teams.slice()).forEach(function (t) {
    if (n >= R.perYear || !foreignRoom(t.id) || Math.random() >= R.chance) return;
    const pos = weakPositions(t)[0];
    if (!pos) return;
    const starter = starterAt(t.id, pos);
    const base = starter ? playerScore(starter) : 0;
    const salaryOf = function (w) { return Math.max(minSalaryNow(contractYear()), Math.round(salaryFor(worldScore(w), t.tier, 0) / 1000000) * 1000000); };
    const best = Object.keys(state.world.players).map(function (wid) { return state.world.players[wid]; }).filter(function (w) {
      return w.pos === pos && originOf(w) !== HOME_ORIGIN.id && w.age <= R.maxAge && worldScore(w) >= base + R.margin;
    }).map(function (w) {
      return { w: w, fee: Math.round(salaryFor(worldScore(w), 1, 0) * R.feeMult / 1000000) * 1000000, salary: salaryOf(w) };
    }).filter(function (c) {
      return teamMoney(t.id) - c.fee >= debtFloor(t.id) && clubRoom(t.id) - c.fee >= c.salary;
    }).sort(function (a, b) { return worldScore(b.w) - worldScore(a.w); })[0];
    if (!best) return;
    const wt = findWorldTeam(worldTeamIdOf(best.w.id));
    const fromName = wt ? wt.name + " (" + regionNameOf(wt) + ")" : "해외";
    const p = worldToLeague(best.w.id);
    npcTransfer(p.id, t, best.fee, best.salary, "import"); // 이적료는 해외 구단으로 (국내 어디에도 안 들어감)
    const last = state.league.transferLog[state.league.transferLog.length - 1];
    if (last && last.id === p.id) last.fromName = fromName;
    noteLangJoin(p, t.id);
    p.importYear = state.year;
    moved[p.id] = true;
    news.push("🔁 🌏 " + t.name + ", " + fromName + "의 " + p.name + "(" + findPosition(pos).name + ", " + playerScore(p.id).toFixed(1) + ") 영입 — 외국인 선수 (모국어 " + langName(langOf(p)) + ", 한국어 " + langSkill(p, HOME_ORIGIN.lang) + ")" +
      (best.fee ? " · 이적료 " + moneyText(best.fee) : ""));
    n++;
  });
}

// 3) 국내에서 팀을 못 구한 FA → 해외 팀 (외국인이 없고, 그 포지션 주전보다 잘하는 팀) — 국내 보강·선수단 채우기 뒤
function faAbroadMoves(news) {
  const R = WORLD_MOVES.faAbroad;
  if (!state.world) return;
  const t2 = [];
  tierTeams(2).forEach(function (t) { const s = starters(t.id); POSITION_IDS.forEach(function (pos) { if (s[pos] && s[pos] !== USER_ID) t2.push(playerScore(s[pos])); }); });
  const floor = (t2.length ? average(t2) : 55) - R.below;
  let n = 0;
  state.league.freeAgents.slice().sort(function (a, b) { return playerScore(b) - playerScore(a); }).forEach(function (id) {
    const p = findPlayer(id);
    if (n >= R.perYear || !p || p.age > R.maxAge || playerScore(id) < floor || Math.random() >= R.chance) return;
    const dest = shuffled(state.world.teams.filter(function (wt) {
      if (!foreignRoom(wt.id) && originOf(p) !== wt.region) return false;
      const st = worldStarters(wt)[p.pos];
      return !st || worldScore(worldPlayer(st)) < playerScore(id);
    }))[0];
    if (!dest) return;
    const score = playerScore(id);
    leagueFAToWorld(id, dest);
    logTransfer({ kind: "abroad", team: null, from: null, id: id, name: p.name, pos: p.pos, score: Math.round(score * 10) / 10, age: p.age, fee: 0, to: dest.name + " (" + regionNameOf(dest) + ")", origin: originOf(p) });
    news.push("🔁 ✈️ FA " + p.name + "(" + findPosition(p.pos).name + ", " + score.toFixed(1) + "), 국내 팀을 못 찾고 " + regionNameOf(dest) + " " + dest.name + " 입단");
    n++;
  });
}
