// ===== 강팀 쏠림 막기 (v1.1): 왕조의 연봉 압박 · 해외 러브콜 · 분석 당하는 챔피언 =====
// 값은 data/dynasty.js. 새 시즌(contractsNewSeason, 계약 만료 처리 전)에 dynastyNewSeason을 부름.
// 집중 견제(C1)는 js/match_events.js, 상금 선수 분배(D)는 js/club_market.js payPrize.

// ----- C2. 🔍 분석 당하는 챔피언 -----
// 월드 결승이 끝나면 (js/matchsim.js koFinal) → 다음 시즌 내내 그 팀 경기력 −SCOUTED.power
function markScouted(teamId) {
  state.league.scouted = { team: teamId, year: state.year + 1, name: teamName(teamId) }; // 해외 팀은 다음 시즌엔 이름을 못 찾을 수 있어서 저장
}
function scoutedMult(teamId) {
  const sc = state.league && state.league.scouted;
  return sc && sc.team === teamId && sc.year === state.year ? 1 - SCOUTED.power : 1;
}

// ----- 새 시즌 -----
// news: 이적 소식 목록 (contractsNewSeason의 moves와 같은 곳, "🔁 "로 시작하면 [이적 시장] 소식으로 감)
function dynastyNewSeason(news) {
  const L = state.league;
  const lc = L.lastChamps;
  if (!lc || lc.year !== state.year - 1) return;
  // 분석 대상 소식
  const sc = L.scouted;
  if (sc && sc.year === state.year) {
    const mine = myTeam() && sc.team === myTeam().id;
    addNews("분석 대상", "🔍 지난 시즌 월드 챔피언 " + (sc.name || teamName(sc.team)) + ", 올 시즌 모든 팀의 분석 대상이 됐다. 시즌 내내 경기력 −" + Math.round(SCOUTED.power * 100) + "%" +
      (mine ? " (우리 팀이에요!)" : "."));
  }
  dynastyPayRaise(lc.ids, news);
  abroadMoves(lc.ids, news);
  overseasDynastyMoves(lc.ids, news);
}

// 이 선수가 지난 시즌 우승 팀에서 FA로 나갔으면 그해에는 원래 팀이 다시 못 데려감 (js/club_market.js sellable)
function leftThisYear(p, buyer) {
  return p.leftFrom === buyer.id && p.leftYear === state.year;
}

// ----- A. 💸 왕조의 연봉 압박 -----
function dynastyPayRaise(champs, news) {
  const D = DYNASTY;
  const raiseOf = {};
  Object.keys(champs).forEach(function (key) {
    const id = champs[key];
    if (!findTeam(id) || !D.raise[key]) return; // 해외 팀은 빼고
    raiseOf[id] = (raiseOf[id] || 0) + D.raise[key];
  });
  Object.keys(raiseOf).forEach(function (teamId) {
    const t = findTeam(teamId);
    const st = starters(teamId);
    const raised = [];
    let before = 0, after = 0;
    POSITION_IDS.forEach(function (pos) {
      const id = st[pos];
      const p = id && id !== USER_ID ? findPlayer(id) : null;
      if (!p || p.loan) return;
      const n = sCountOfId(id);
      const r = Math.min(D.max, raiseOf[teamId] + D.perS * n);
      const base = Math.max(p.salary || 0, npcContractSalary(id, t.tier));
      before += p.salary || 0;
      p.salary = Math.round(base * (1 + r) / 1000000) * 1000000;
      after += p.salary;
      if (!p.contractEnd || p.contractEnd < state.year) p.contractEnd = state.year; // 올해까지는 이 연봉 (계약 만료 처리에서 덮어쓰지 않게)
      raised.push({ id: id, n: n });
    });
    if (!raised.length) return;
    news.push("🔁 💸 " + t.name + ", 우승 뒤 주전 " + raised.length + "명 연봉 인상 (합계 " + moneyText(before) + " → " + moneyText(after) + ")");
    // 더 좋은 조건을 찾아 떠나거나, 구단이 감당 못 하면 협상 결렬
    let left = 0;
    shuffled(raised).forEach(function (x) {
      if (left >= D.maxLeave || Math.random() >= D.leave + D.leavePerS * x.n) return;
      dynastyLeave(x.id, t, "더 좋은 조건을 찾아 FA 선언", news);
      left++;
    });
    let guard = D.maxLeave;
    while (left < D.maxLeave && guard-- > 0 && clubRoom(t.id) < 0) {
      const stay = raised.filter(function (x) { return findPlayer(x.id) && findPlayer(x.id).teamId === t.id; })
        .sort(function (a, b) { return (findPlayer(b.id).salary || 0) - (findPlayer(a.id).salary || 0); })[0];
      if (!stay) break;
      dynastyLeave(stay.id, t, "연봉 협상 결렬로 FA", news);
      left++;
    }
  });
}

function dynastyLeave(id, team, why, news) {
  const p = findPlayer(id);
  logTransfer({ kind: "leave", team: null, from: team.id, id: id, name: p.name, pos: p.pos, score: Math.round(playerScore(id) * 10) / 10, age: p.age, fee: 0 });
  noteFriendLeaving(id, team, null); // 친한 동료면 작별 연락 (js/stories.js)
  releaseToFA(id);
  p.leftFrom = team.id;
  p.leftYear = state.year;
  news.push("🔁 💸 " + p.name + "(" + team.name + " " + findPosition(p.pos).name + ", " + playerScore(id).toFixed(1) + "), " + why + " — 다른 팀이 데려갈 기회");
}

// ----- B. ✈️ 해외 러브콜 -----
function abroadMoves(champs, news) {
  const A = ABROAD;
  const W = state.world;
  if (!W || !W.teams || !W.teams.length) return;
  const regions = activeRegions().slice().sort(function (a, b) { return b.strength - a.strength; }).slice(0, A.topRegions).map(function (r) { return r.id; });
  const dest = W.teams.filter(function (t) { return regions.indexOf(t.region) !== -1 && foreignRoom(t.id); }); // 외국인 1명까지 (js/world_moves.js)
  if (!dest.length) return;
  const champTeam = champs.worlds && findTeam(champs.worlds) ? champs.worlds : null;
  const champStarters = champTeam ? POSITION_IDS.map(function (pos) { return starters(champTeam)[pos]; }) : [];
  const cands = [];
  tierTeams(1).forEach(function (t) {
    t.roster.forEach(function (id) {
      if (id === USER_ID) return;
      const p = findPlayer(id);
      if (!p || p.loan || p.age > A.maxAge) return;
      const n = sCountOfId(id);
      const champ = champStarters.indexOf(id) !== -1;
      if (!n && !champ) return; // 스타만 (S급 보유 또는 월드 우승 주전)
      cands.push({ id: id, team: t, chance: Math.min(A.max, A.base + A.perS * n + (champ ? A.champ : 0)) });
    });
  });
  const perTeam = {};
  let count = 0;
  shuffled(cands).forEach(function (c) {
    if (count >= A.perYear || (perTeam[c.team.id] || 0) >= A.perTeam || Math.random() >= c.chance) return;
    if (!findPlayer(c.id) || findPlayer(c.id).teamId !== c.team.id) return; // 이미 떠남
    const open = dest.filter(function (t) { return foreignRoom(t.id); }); // 이번 해에 이미 외국인이 들어간 팀은 빼고
    if (!open.length) return;
    moveAbroad(c.id, c.team, pick(open), news);
    perTeam[c.team.id] = (perTeam[c.team.id] || 0) + 1;
    count++;
  });
}

// ----- B2. 🌏 해외 왕조 압박 (168) -----
// 지난 시즌 월드 우승 팀이 해외 팀이면, 그 팀 주전 중 강한 순으로 OVERSEAS_DYNASTY.moves명을 같은 지역 다른 팀 주전과 맞바꿈
function overseasDynastyMoves(champs, news) {
  const W = state.world;
  const t = champs.worlds && W ? findWorldTeam(champs.worlds) : null;
  if (!t) return;
  const others = W.teams.filter(function (x) { return x.region === t.region && x.id !== t.id; });
  if (!others.length) return;
  const st = worldStarters(t);
  const region = findRegion(t.region);
  const local = function (id) { const q = worldPlayer(id); return q && originOf(q) === t.region; };
  POSITION_IDS.map(function (pos) { return st[pos]; })
    .filter(function (id) { return id && local(id); })
    .sort(function (a, b) { return worldScore(worldPlayer(b)) - worldScore(worldPlayer(a)); })
    .slice(0, OVERSEAS_DYNASTY.moves)
    .forEach(function (id) {
      const p = worldPlayer(id);
      // 같은 포지션 주전이 그 지역 출신(또는 없음)인 팀으로 → 외국인 수가 바뀌지 않음
      const dest = shuffled(others).find(function (o) { const sw = worldStarters(o)[p.pos]; return !sw || local(sw); });
      if (!dest) return;
      const sw = worldStarters(dest)[p.pos];
      t.roster.splice(t.roster.indexOf(id), 1);
      dest.roster.push(id);
      if (sw) { dest.roster.splice(dest.roster.indexOf(sw), 1); t.roster.push(sw); }
      news.push("🔁 🌏 " + (region ? region.name + " " : "") + "월드 챔피언 " + t.name + "의 " + p.name + "(" + findPosition(p.pos).name + ", " + worldScore(p).toFixed(1) + ") → " + dest.name +
        (sw ? " (" + worldPlayer(sw).name + "와(과) 맞트레이드)" : "") + " — 우승팀 해체 바람");
    });
}

// 국내 선수를 해외 팀으로: 해외 선수로 다시 만들고(같은 이름·스탯·특성), 그 팀 같은 포지션 가장 약한 선수와 바꿈
//   원래 팀은 이적료(보통 이적료)를 받고, 빈자리는 이어지는 비시즌 보강·선수단 채우기로 메움
function moveAbroad(id, team, wt, news) {
  const W = state.world;
  const p = findPlayer(id);
  const region = findRegion(wt.region);
  const fee = transferFee(id);
  const score = playerScore(id);
  logTransfer({ kind: "abroad", team: null, from: team.id, id: id, name: p.name, pos: p.pos, score: Math.round(score * 10) / 10, age: p.age, fee: fee, to: wt.name + " (" + (region ? region.name : "해외") + ")" });
  noteFriendLeaving(id, team, { name: wt.name }); // 친한 동료면 작별 연락
  if (state.friends && state.friends.best) { const i = state.friends.best.indexOf(id); if (i !== -1) state.friends.best.splice(i, 1); }
  // 해외 선수로
  W.seq = (W.seq || 0) + 1;
  const np = { id: "X" + W.seq, name: p.name, pos: p.pos, age: p.age, stats: Object.assign({}, p.stats),
    traits: (p.traits || []).filter(function (x) { const t = findTrait(x); return t && !t.rival; }), style: p.style, fromLeague: team.name, origin: p.origin || HOME_ORIGIN.id, mastery: p.mastery, langs: p.langs, abroadYear: state.year };
  W.players[np.id] = np;
  if (W.names && W.names.indexOf(p.name) === -1) W.names.push(p.name);
  const same = wt.roster.filter(function (x) { return worldPlayer(x) && worldPlayer(x).pos === p.pos; })
    .sort(function (a, b) { return worldScore(worldPlayer(a)) - worldScore(worldPlayer(b)); });
  if (same.length) { wt.roster.splice(wt.roster.indexOf(same[0]), 1); delete W.players[same[0]]; }
  wt.roster.push(np.id);
  noteLangJoin(np, wt.id); // 팀 언어 실력 시작 (js/world_moves.js)
  // 국내에서 빠짐
  team.money = teamMoney(team.id) + fee;
  team.roster.splice(team.roster.indexOf(id), 1);
  const fa = state.league.freeAgents.indexOf(id);
  if (fa !== -1) state.league.freeAgents.splice(fa, 1);
  delete state.league.players[id];
  news.push("🔁 ✈️ 해외 러브콜: " + p.name + "(" + team.name + " " + findPosition(p.pos).name + ", " + score.toFixed(1) + ") → " + (region ? region.name + " " : "") + wt.name +
    (fee ? " · 이적료 " + moneyText(fee) : "") + (myTeam() && team.id === myTeam().id ? " (우리 팀 동료)" : ""));
}
