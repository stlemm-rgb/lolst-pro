// ===== 시대별 리그 성장 · 해외 리그 (값: data/era.js) =====
// - 돈·인기도 배율 (eraMoney, eraPop)
// - 구단 수 (eraTeams) → 새 시즌에 확장 승격·신생 구단 창단 (expandLeague)
// - 국제대회 연도 (msiOn, firstStandOn)
// - 해외 리그 (state.world): 지역·팀·선수 명단. 가벼운 버전 — 팀 전력은 선수로 계산, 경기 화면에는 아직 안 나옴
//   state.world = { teams: [{ id, name, short, region, roster: [선수 id] }], players: { id: 선수 }, seq, names: [쓴 닉네임] }

// [연도, 값...] 표에서 그해 값 (그해 이하 중 가장 최근)
function eraRow(table, year) {
  let row = table[0];
  table.forEach(function (r) { if (r[0] <= year) row = r; });
  return row;
}
function eraYear(year) { return year || (typeof state !== "undefined" && state && state.year) || 2017; }
function eraMoney(year) { return eraRow(ERA.money, eraYear(year))[1]; }
function eraPop(year) { return eraRow(ERA.popularity, eraYear(year))[1]; }
function eraTeams(year) { const r = eraRow(ERA.teams, eraYear(year)); return { 1: r[1], 2: r[2] }; }
function msiOn(year) { return eraYear(year) >= ERA.msiFrom; }
function firstStandOn(year) { return eraYear(year) >= ERA.firstStandFrom; }

// 계약용 연도: 비시즌(47주~)에 맺는 계약은 다음 시즌 돈 기준
function contractYear() {
  return state.week >= CONTRACT.windowStart ? state.year + 1 : state.year;
}
// 구단 연봉 예산 (시대 배율 반영). year를 안 주면 올해
function teamBudgetOf(tier, year) {
  return Math.round(CONTRACT.teamBudget[tier] * eraMoney(year));
}
// 최저 연봉은 시대 배율과 관계없이 보장.
function minSalaryNow(year) {
  return CONTRACT.minSalary;
}

// ----- 구단 수 늘리기 (새 시즌, js/league.js newSeasonLeague에서 승강 반영 뒤) -----
// 1부가 목표보다 적으면: 지난 시즌 2부 순위 높은 팀부터 확장 승격 (이번 승강전에서 강등된 팀은 빼고)
// 2부가 목표보다 적으면: 신생 구단 창단 (선수 7명, 지금 2부 주전 평균보다 조금 약하게)
function expandLeague(lastSeason) {
  const target = eraTeams(state.year);
  const news = [];
  const relegated = (lastSeason.promo || []).filter(function (p) { return p.winner === p.tier2; }).map(function (p) { return p.tier1; });
  if (tierTeams(1).length < target[1]) {
    const order = standings(["tier2", "tier2b"], tierTeams(2).map(function (t) { return t.id; }))
      .map(function (r) { return r.id; }).filter(function (id) { return relegated.indexOf(id) === -1; });
    while (tierTeams(1).length < target[1] && order.length) {
      const t = findTeam(order.shift());
      t.tier = 1;
      if (myTeam() && t.id === myTeam().id) addMoment("⬆️", t.name + " 1부 확장 승격");
      news.push("📈 1부 리그 확장: " + t.name + " 승격 (1부 " + tierTeams(1).length + "팀)");
    }
  }
  while (tierTeams(2).length < target[2]) {
    const t = foundClub();
    news.push("🆕 신생 구단 창단: " + t.name + " (2부 " + tierTeams(2).length + "팀)");
  }
  return news;
}

// 신생 구단 하나 만들기 (2부)
function foundClub() {
  const L = state.league;
  const usedShort = L.teams.map(function (t) { return t.short; });
  const usedBrand = L.teams.map(function (t) { return t.name.split(" ").slice(1).join(" "); });
  let short = TIER1_ORGS.find(function (o) { return usedShort.indexOf(o) === -1; }); // 아직 안 나온 기업 먼저
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (!short || usedShort.indexOf(short) !== -1) short = letters[randInt(0, 25)] + letters[randInt(0, 25)];
  const brands = TEAM_BRANDS.map(function (b) { return b[0]; }).filter(function (b) { return usedBrand.indexOf(b) === -1; });
  const brand = brands.length ? pick(brands) : "NEW";
  let n = L.teams.length + 1;
  while (findTeam("T" + n)) n++;
  const team = { id: "T" + n, name: short + " " + brand, short: short, tier: 2, roster: [], founded: state.year };
  // 지금 2부 주전 평균보다 2 낮게 (리그가 성장해 있어서 고정값 대신 지금 수준에 맞춤)
  const scores = [];
  tierTeams(2).forEach(function (t) { const s = starters(t.id); Object.keys(s).forEach(function (p) { if (s[p] && s[p] !== USER_ID) scores.push(playerScore(s[p])); }); });
  const avg = scores.length ? Math.round(average(scores)) - 2 : LEAGUE.npc.tier2Starter.avg;
  POSITION_IDS.forEach(function (pos) {
    const p = makeNpc(pos, { avg: avg, spread: 6 }, LEAGUE.npc.ageRange);
    p.teamId = team.id;
    team.roster.push(p.id);
  });
  for (let k = 0; k < LEAGUE.rosterSize - 5; k++) {
    const p = makeNpc(pick(POSITION_IDS), { avg: avg - 6, spread: 6 }, LEAGUE.npc.ageRange);
    p.teamId = team.id;
    team.roster.push(p.id);
  }
  L.teams.push(team);
  return team;
}

// ----- 해외 리그 (state.world) -----
function activeRegions(year) {
  const y = eraYear(year);
  return WORLD_REGIONS.filter(function (r) { return r.from <= y; });
}
function findRegion(id) { return WORLD_REGIONS.find(function (r) { return r.id === id; }) || null; }
function findWorldTeam(id) { return state.world ? state.world.teams.find(function (t) { return t.id === id; }) || null : null; }
function worldPlayer(id) { return state.world ? state.world.players[id] || null : null; }
function worldScore(p) { return statScoreFor(p.stats, p.pos); }

// 해외 선수 닉네임 (겹치지 않게)
function worldNick() {
  const W = state.world, P = WORLD_NICK_PARTS;
  let name, guard = 0;
  do {
    name = pick(P.head) + pick(P.tail);
    if (guard++ > 50) name += randInt(2, 99);
  } while (W.names.indexOf(name) !== -1);
  W.names.push(name);
  return name;
}

// 해외 선수 하나 (리그 선수 목록에는 안 들어감)
function makeWorldPlayer(pos, avg, ageRange) {
  const W = state.world;
  const target = avg + randInt(-WORLD_RULES.levelSpread, WORLD_RULES.levelSpread);
  const bonus = findPosition(pos).bonus;
  const stats = {};
  STATS.forEach(function (s) {
    let v = target + randInt(-LEAGUE.npc.statSpread, LEAGUE.npc.statSpread);
    if (bonus.indexOf(s.id) !== -1) v += 4;
    stats[s.id] = Math.max(1, Math.min(99, v));
  });
  W.seq = (W.seq || 0) + 1;
  const p = { id: "X" + W.seq, name: worldNick(), pos: pos, age: randInt(ageRange[0], ageRange[1]), stats: stats, traits: randomNpcTraits(), style: pickStyle(pos) };
  applyStyle(p);
  W.players[p.id] = p;
  return p;
}

// 팀 주전 (포지션마다 가장 잘하는 선수)
function worldStarters(team) {
  const out = {};
  team.roster.forEach(function (id) {
    const p = worldPlayer(id);
    if (!p) return;
    if (!out[p.pos] || worldScore(p) > worldScore(worldPlayer(out[p.pos]))) out[p.pos] = id;
  });
  return out;
}
function worldTeamStrength(team) {
  const s = worldStarters(team);
  const list = POSITION_IDS.map(function (pos) { return s[pos] ? worldScore(worldPlayer(s[pos])) : null; }).filter(function (v) { return v !== null; });
  return list.length ? average(list) : 0;
}

// 우리 리그 1부 평균 전력 (해외 팀 수준의 기준)
function domesticBase() {
  const list = tierTeams(1).map(function (t) { return teamStrength(t.id); }).filter(function (v) { return v > 0; });
  return list.length ? average(list) : LEAGUE.npc.tier1Starter.avg;
}

// 지역 하나 만들기: 팀 n개, 순위별 목표 전력에 맞춰 선수 생성 후 평균 맞춤
function addWorldRegion(region) {
  const W = state.world;
  const base = domesticBase();
  const names = (WORLD_TEAM_NAMES[region.id] || []).slice();
  for (let i = 0; i < region.teams; i++) {
    const goal = base * region.strength * (WORLD_RULES.topBonus[i] || 0.9);
    const name = names[i] || (region.name + " " + (i + 1));
    W.tseq = (W.tseq || 0) + 1;
    const team = { id: "O" + W.tseq, name: name, short: name.split(" ").map(function (w) { return w[0]; }).join("").toUpperCase().slice(0, 3), region: region.id, roster: [] };
    POSITION_IDS.forEach(function (pos) { team.roster.push(makeWorldPlayer(pos, goal, LEAGUE.npc.ageRange).id); });
    for (let k = 0; k < WORLD_RULES.rosterSize - 5; k++) team.roster.push(makeWorldPlayer(pick(POSITION_IDS), goal - 6, LEAGUE.npc.ageRange).id);
    // 목표 전력과 차이만큼 모든 선수 스탯을 조금 옮김
    const diff = Math.round(goal - worldTeamStrength(team));
    if (diff) team.roster.forEach(function (id) { const p = worldPlayer(id); STATS.forEach(function (s) { p.stats[s.id] = Math.max(1, Math.min(99, p.stats[s.id] + diff)); }); });
    W.teams.push(team);
  }
}

// 해외 리그 준비: 없으면 만들고, 올해 새로 참가하는 지역 추가 (새 게임·불러오기·새 시즌)
function ensureWorld() {
  if (!state.league) return [];
  if (!state.world) state.world = { teams: [], players: {}, seq: 0, tseq: 0, names: [] };
  const have = {};
  state.world.teams.forEach(function (t) { have[t.region] = true; });
  const news = [];
  activeRegions().forEach(function (r) {
    if (have[r.id]) return;
    addWorldRegion(r);
    if (state.world.started) news.push("🌏 " + r.name + " 지역이 올해부터 국제대회에 참가한다.");
  });
  state.world.started = true;
  return news;
}

// 새해: 해외 선수 나이 +1, 은퇴 → 같은 포지션 신인으로 (성장·노화는 47주 npcYearGrowth에서 같이)
function worldNewSeason() {
  if (!state.world) return;
  const W = state.world;
  W.teams.forEach(function (team) {
    const avg = worldTeamStrength(team);
    team.roster = team.roster.map(function (id) {
      const p = worldPlayer(id);
      if (!p) return id;
      p.age += 1;
      const tr = p.traits || [];
      const retireAge = LEAGUE.retireFromAge + traitSumOf(tr, "agingDelay") + traitSumOf(tr, "maxAgeBonus");
      if (p.age >= retireAge && Math.random() < (p.age - retireAge + 1) * LEAGUE.retireChancePerYear) {
        delete W.players[id];
        return makeWorldPlayer(p.pos, avg - WORLD_RULES.rookieBelow, LEAGUE.rookie.ageRange).id;
      }
      return id;
    });
  });
}

// 해외 선수 1년 성장·노화 (js/league.js npcYearGrowth에서 같은 규칙으로)
function worldPlayersList() {
  return state.world ? Object.keys(state.world.players).map(function (id) { return state.world.players[id]; }) : [];
}

// ----- 화면: [기록실] → 🌏 해외 리그 -----
pages.world = function () {
  ensureWorld();
  const s = state.league.season;
  if (s) ensureOverseasPool(); // 이번 시즌 지역 순위
  const pool = s && s.overseas && s.overseas.length ? s.overseas : null;
  const rankOf = function (id) { const t = pool && pool.find(function (x) { return x.id === id; }); return t ? t.rank : null; };
  const regions = activeRegions();
  const wt = s && s.worlds ? s.worlds.overseas.map(function (t) { return t.id; }) : [];
  const future = WORLD_REGIONS.filter(function (r) { return r.from > state.year; });
  const cards = regions.slice().sort(function (a, b) { return b.strength - a.strength; }).map(function (r) {
    const teams = state.world.teams.filter(function (t) { return t.region === r.id; })
      .sort(function (a, b) { return (rankOf(a.id) || 99) - (rankOf(b.id) || 99) || worldTeamStrength(b) - worldTeamStrength(a); });
    const rows = teams.map(function (t) {
      const st = worldStarters(t);
      const lineup = POSITION_IDS.map(function (pos) {
        const p = st[pos] && worldPlayer(st[pos]);
        return p ? '<span class="tip" tabindex="0" data-tip="' + escapeHTML(findPosition(pos).name + " · " + p.age + "세 · 종합 " + worldScore(p).toFixed(1)) + '">' + escapeHTML(p.name) + "</span>" : "-";
      }).join(" · ");
      const rk = rankOf(t.id);
      return "<tr><td class=\"r\">" + (rk ? rk + "위" : "-") + "</td><td><b>" + escapeHTML(t.name) + "</b>" + (wt.indexOf(t.id) !== -1 ? ' <span class="chip meta">월드</span>' : "") + "</td><td class=\"r\">" + worldTeamStrength(t).toFixed(1) + '</td><td class="small">' + lineup + "</td></tr>";
    }).join("");
    return '<div class="card"><h2>' + escapeHTML(r.name) + ' <span class="muted small">' + r.from + "년부터 참가 · " + teams.length + "팀</span></h2>" +
      '<div class="table-wrap"><table class="roster"><tr><th class="r">순위</th><th>팀</th><th class="r">전력</th><th>주전 (탑 · 정글 · 미드 · 원딜 · 서포트)</th></tr>' + rows + "</table></div></div>";
  }).join("");
  const domestic = domesticBase();
  return "<h1>해외 리그</h1>" +
    '<div class="card"><p class="muted small">국제대회(월드' + (msiOn() ? " · MSI" : "") + (firstStandOn() ? " · First Stand" : "") + ")에 나오는 해외 지역과 팀이에요. 전력 = 주전 5명 종합 능력 평균 (우리 리그 1부 평균 " + domestic.toFixed(1) +
      "). 선수들도 해마다 성장·노화·은퇴해요. 순위는 이번 시즌 지역 순위예요 (전력 + 운).</p>" +
      (future.length ? '<p class="muted small">앞으로 참가할 지역: ' + future.map(function (r) { return r.name + "(" + r.from + ")"; }).join(", ") + "</p>" : "") +
      '<p class="muted small">MSI ' + ERA.msiFrom + "년부터 · First Stand " + ERA.firstStandFrom + "년부터</p></div>" + cards;
};
