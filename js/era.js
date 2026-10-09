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
function makeWorldPlayer(pos, avg, ageRange, origin) {
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
  const p = { id: "X" + W.seq, name: worldNick(), pos: pos, age: randInt(ageRange[0], ageRange[1]), stats: stats, traits: randomNpcTraits(), style: pickStyle(pos), origin: origin || null };
  applyStyle(p);
  shapeNpcStats(p); // 스탯 차이 키우기·포지션 중요 스탯 (js/league.js)
  npcMasteryInit(p); // 챔피언 숙련도 (국제대회에서 국내 선수와 같은 밴픽·숙련도 규칙, v1.1)
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
    POSITION_IDS.forEach(function (pos) { team.roster.push(makeWorldPlayer(pos, goal, LEAGUE.npc.ageRange, region.id).id); });
    for (let k = 0; k < WORLD_RULES.rosterSize - 5; k++) team.roster.push(makeWorldPlayer(pick(POSITION_IDS), goal - 6, LEAGUE.npc.ageRange, region.id).id);
    // 목표 전력과 차이만큼 모든 선수 스탯을 조금 옮김
    const diff = Math.round(goal - worldTeamStrength(team));
    if (diff) team.roster.forEach(function (id) { const p = worldPlayer(id); STATS.forEach(function (s) { p.stats[s.id] = Math.max(1, Math.min(99, p.stats[s.id] + diff)); }); });
    W.teams.push(team);
  }
}

// 해외 리그 준비: 없으면 만들고, 올해 새로 참가하는 지역 추가 (새 게임·불러오기·새 시즌)
function ensureWorld() {
  if (!state.league) return [];
  if (!state.world) state.world = { teams: [], players: {}, seq: 0, tseq: 0, names: [], tierDone: true };
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
    // 은퇴한 자리 신인: 그 팀의 '그 지역 출신' 선수 평균 기준 (한국인 용병 같은 다른 출신 선수 실력은 빼고, v1.1)
    const locals = team.roster.map(worldPlayer).filter(function (q) { return q && q.origin === team.region; });
    const avg = locals.length ? average(locals.map(worldScore)) : worldTeamStrength(team);
    team.roster = team.roster.map(function (id) {
      const p = worldPlayer(id);
      if (!p) return id;
      p.age += 1;
      const tr = p.traits || [];
      const retireAge = LEAGUE.retireFromAge + traitSumOf(tr, "agingDelay") + traitSumOf(tr, "maxAgeBonus");
      if (p.age >= retireAge && Math.random() < (p.age - retireAge + 1) * LEAGUE.retireChancePerYear) {
        delete W.players[id];
        return makeWorldPlayer(p.pos, avg - WORLD_RULES.rookieBelow, LEAGUE.rookie.ageRange, team.region).id;
      }
      return id;
    });
  });
  normalizeWorldTiers(WORLD_RULES.tierPull); // 지역 수준 3단계 유지 (v1.1)
}

// 해외 선수가 속한 팀 id (없으면 null)
function worldTeamIdOf(id) {
  if (!state.world) return null;
  const t = state.world.teams.find(function (x) { return x.roster.indexOf(id) !== -1; });
  return t ? t.id : null;
}

// ----- 출신 리그 (v1.1, data/era.js HOME_ORIGIN · REGION_LANG) -----
function originOf(p) {
  if (!p) return null;
  return p.origin || (state.world && state.world.players[p.id] ? null : HOME_ORIGIN.id);
}
function originName(o) { return o === HOME_ORIGIN.id ? HOME_ORIGIN.name : (findRegion(o) || {}).name || "?"; }
function originShort(o) { return o === HOME_ORIGIN.id ? HOME_ORIGIN.short : REGION_SHORT[o] || "?"; }
function langOf(p) { const o = originOf(p); return o === HOME_ORIGIN.id ? HOME_ORIGIN.lang : REGION_LANG[o] || "en"; }
function langName(code) { return LANGUAGES[code] || code; }

// 지역 수준 맞추기 (v1.1): '그 지역 출신' 주전 평균을 '1부 평균 × strength' 쪽으로 pull만큼 (그 출신 선수 스탯만 한꺼번에 옮김)
//   해외로 간 국내 선수(출신 한국)는 건드리지 않아요 → 실력 그대로, 그 팀이 강해짐
function normalizeWorldTiers(pull) {
  if (!state.world) return;
  const base = domesticBase();
  const W = state.world;
  activeRegions().forEach(function (r) {
    const starterScores = [];
    W.teams.filter(function (t) { return t.region === r.id; }).forEach(function (t) {
      const st = worldStarters(t);
      POSITION_IDS.forEach(function (pos) { const q = st[pos] && worldPlayer(st[pos]); if (q && q.origin === r.id) starterScores.push(worldScore(q)); });
    });
    if (!starterScores.length) return;
    const shift = Math.round((base * r.strength - average(starterScores)) * pull);
    if (!shift) return;
    Object.keys(W.players).forEach(function (id) {
      const p = W.players[id];
      if (p.origin === r.id) STATS.forEach(function (s) { p.stats[s.id] = Math.max(1, Math.min(100, p.stats[s.id] + shift)); });
    });
  });
}

// 예전 세이브: 해외 선수 숙련도 · 지역 3단계 수준 한 번 맞추기
function ensureWorldV11() {
  const W = state.world;
  if (!W) return;
  Object.keys(W.players).forEach(function (id) { if (!W.players[id].mastery) npcMasteryInit(W.players[id]); });
  // 출신 리그: 국내 선수는 한국, 해외 선수는 지금 팀 지역 (국내에서 해외로 간 선수는 한국)
  Object.keys(state.league.players).forEach(function (id) { if (!state.league.players[id].origin) state.league.players[id].origin = HOME_ORIGIN.id; });
  W.teams.forEach(function (t) { t.roster.forEach(function (id) { const p = W.players[id]; if (p && !p.origin) p.origin = p.fromLeague ? HOME_ORIGIN.id : t.region; }); });
  if (!W.tierDone) { normalizeWorldTiers(1); W.tierDone = true; }
}

// 해외 선수 1년 성장·노화 (js/league.js npcYearGrowth에서 같은 규칙으로)
function worldPlayersList() {
  return state.world ? Object.keys(state.world.players).map(function (id) { return state.world.players[id]; }) : [];
}

// ----- 2012년 시작: 2주차 리그 규모 소개 기사 (v1.1, data/era.js ERA_INTRO) -----
// main.js nextWeek에서 주를 넘긴 뒤 부름. 2012년 2주차에 한 번 (state.league.eraIntroDone)
function eraIntroArticle() {
  const L = state.league, r = state.weekReport;
  if (!L || L.eraIntroDone || state.year !== 2012 || state.week !== 2 || !r) return;
  L.eraIntroDone = true;
  const y = state.year, n = y + 1, I = ERA_INTRO;
  const now = eraTeams(y), nx = eraTeams(n);
  const regs = activeRegions(y);
  const fullYear = ERA.money[ERA.money.length - 1][0];
  const v = {
    year: y, next: n, t1: now[1], t2: now[2], players: Object.keys(L.players).length,
    b1: moneyText(teamBudgetOf(1, y)), b2: moneyText(teamBudgetOf(2, y)), pct: Math.round(eraMoney(y) * 100),
    regions: regs.map(function (x) { return x.name; }).join("·"), rcount: regs.length,
    wteams: regs.reduce(function (sum, x) { return sum + x.teams; }, 0), fullYear: fullYear,
  };
  const fill = function (t) { return t.replace(/\{(\w+)\}/g, function (all, k) { return v[k] !== undefined ? v[k] : all; }); };
  // 내년에 달라지는 것
  const next = [];
  if (eraMoney(n) > eraMoney(y)) next.push("  · 💰 돈 규모 " + v.pct + "% → " + Math.round(eraMoney(n) * 100) + "%: 1부 구단 예산 " + v.b1 + " → " + moneyText(teamBudgetOf(1, n)) + ", 연봉·상금도 함께 오른다");
  if (eraPop(n) > eraPop(y)) next.push("  · ⭐ 관심이 늘어 인기도가 오르는 속도 " + Math.round(eraPop(y) * 100) + "% → " + Math.round(eraPop(n) * 100) + "%");
  if (nx[1] !== now[1] || nx[2] !== now[2]) next.push("  · 🏟️ 리그 확장: 1부 " + now[1] + " → " + nx[1] + "팀, 2부 " + now[2] + " → " + nx[2] + "팀");
  else {
    const grow = ERA.teams.find(function (row) { return row[0] > y; });
    if (grow) next.push("  · 🏟️ 리그 확장은 " + grow[0] + "년 예정 (1부 " + grow[1] + "팀 · 2부 " + grow[2] + "팀)");
  }
  const joins = WORLD_REGIONS.filter(function (x) { return x.from === n; });
  if (joins.length) next.push("  · 🌏 " + joins.map(function (x) { return x.name; }).join("·") + " 지역이 월드 챔피언십에 새로 참가 (" + joins.reduce(function (s2, x) { return s2 + x.teams; }, 0) + "팀)");
  if (ERA.msiFrom === n) next.push("  · 🏆 새 국제대회 MSI 시작");
  else if (ERA.msiFrom > n) next.push("  · 🏆 새 국제대회 MSI는 " + ERA.msiFrom + "년 시작 예정");
  const body = I.lines.map(fill).concat(next.length ? next : [I.noChange]);
  r.headlines = r.headlines || [];
  r.headlines.push({ key: "eraIntro", headline: fill(I.headline), body: body.join("\n"), mine: false });
  r.headlinesSeen = false;
  addNews("리그 소개", "📰 " + fill(I.headline) + " (대시보드 [📰 NEWS])");
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
        if (!p) return "-";
        const o = originOf(p), foreign = o && o !== t.region; // 다른 출신 (예: 한국인 용병)
        return '<span class="tip" tabindex="0" data-tip="' + escapeHTML(findPosition(pos).name + " · " + p.age + "세 · 종합 " + worldScore(p).toFixed(1) + " · 출신 " + originName(o) + " · 모국어 " + langName(langOf(p))) + '">' + escapeHTML(p.name) + "</span>" +
          (foreign ? ' <span class="chip meta" title="' + escapeHTML(originName(o)) + ' 출신">' + originShort(o) + "</span>" : "");
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
      '<p class="muted small">지역 수준은 3단계: 우리 리그가 가장 강하고, 중국·북미·유럽이 그다음(약 94%), 나머지 지역이 가장 아래(약 86%)예요. 국제대회에서는 해외 팀도 실제 선수 5명이 뛰어서 경기 결과에 이름·평점·POG가 나와요. 수준은 선수의 <b>출신 리그</b> 기준이라, 해외로 간 우리 리그 선수(KR 표시)는 실력이 그대로예요. 이름에 마우스를 올리면 출신·모국어가 보여요.</p>' +
      (future.length ? '<p class="muted small">앞으로 참가할 지역: ' + future.map(function (r) { return r.name + "(" + r.from + ")"; }).join(", ") + "</p>" : "") +
      '<p class="muted small">MSI ' + ERA.msiFrom + "년부터 · First Stand " + ERA.firstStandFrom + "년부터</p></div>" + cards;
};
