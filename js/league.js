// ===== 리그: 구단·선수 생성, 순위 계산, 시즌 넘기기 =====
// 리그 정보는 모두 state.league 안에 있어요.
//   teams:   [{ id, name, short, tier(1 또는 2), roster: [선수 id...] }]
//   players: { 선수 id: { id, name, pos, age, stats, teamId } }   ※ 내 선수는 id "USER" (스탯은 state.stats)
//   freeAgents: [선수 id...]   (소속 없는 선수, 5단계 이적 시장에서 사용)
//   usedNames: [이름...]
//   season:  { year, matches: [...], groups, worlds, promo, ... }  (경기 기록은 js/matchsim.js)

const USER_ID = "USER";

function findTeam(id) {
  return state.league.teams.find(function (t) { return t.id === id; });
}

function findPlayer(id) {
  return state.league.players[id];
}

function myTeam() {
  return state.league.teams.find(function (t) { return t.roster.indexOf(USER_ID) !== -1; });
}

function tierTeams(tier) {
  return state.league.teams.filter(function (t) { return t.tier === tier; });
}

// 스탯 점수 (12개 평균, 포지션 가산점 스탯은 1.5배) — 아무 선수에게나
function statScoreFor(stats, pos) {
  const bonus = findPosition(pos).bonus;
  let sum = 0, weight = 0;
  STATS.forEach(function (s) {
    const w = bonus.indexOf(s.id) !== -1 ? POSITION_BONUS.matchMultiplier : 1;
    sum += stats[s.id] * w;
    weight += w;
  });
  return sum / weight;
}

// 선수 스탯 점수 (내 선수면 state.stats 사용)
function playerScore(id) {
  if (id === USER_ID) return statScoreFor(state.stats, state.player.position);
  const p = findPlayer(id);
  return statScoreFor(p.stats, p.pos);
}

function playerName(id) {
  return id === USER_ID ? state.player.name : findPlayer(id).name;
}

function playerPos(id) {
  return id === USER_ID ? state.player.position : findPlayer(id).pos;
}

function playerAge(id) {
  return id === USER_ID ? state.player.age : findPlayer(id).age;
}

// ----- 선수 만들기 -----
function takeName() {
  const used = state.league.usedNames;
  const free = PLAYER_NAMES.filter(function (n) { return used.indexOf(n) === -1; });
  let name;
  if (free.length) {
    name = pick(free);
  } else {
    // 이름이 다 떨어지면 숫자를 붙여서 (예: Ace2)
    let n = 2;
    do { name = pick(PLAYER_NAMES) + n; n++; } while (used.indexOf(name) !== -1);
  }
  used.push(name);
  return name;
}

let nextPlayerNumber = 1;
function newPlayerId() {
  let id;
  do { id = "P" + (nextPlayerNumber++); } while (state.league.players[id]);
  return id;
}

// 평균 avg ± spread 수준의 선수 하나 만들기
function makeNpc(pos, level, ageRange) {
  const target = level.avg + randInt(-level.spread, level.spread);
  const bonus = findPosition(pos).bonus;
  const stats = {};
  STATS.forEach(function (s) {
    let v = target + randInt(-LEAGUE.npc.statSpread, LEAGUE.npc.statSpread);
    if (bonus.indexOf(s.id) !== -1) v += 4;
    stats[s.id] = Math.max(1, Math.min(99, v));
  });
  const p = {
    id: newPlayerId(),
    name: takeName(),
    pos: pos,
    age: randInt(ageRange[0], ageRange[1]),
    stats: stats,
    teamId: null,
    traits: randomNpcTraits(),
  };
  if (state.year) npcMasteryInit(p); // 챔피언 숙련도 (js/npc_mastery.js)
  state.league.players[p.id] = p;
  return p;
}

// 다른 선수(NPC) 특성 무작위로 (data/traits.js의 NPC_TRAITS)
function randomNpcTraits() {
  let r = Math.random(), count = 0;
  for (let i = 0; i < NPC_TRAITS.goodCount.length; i++) {
    r -= NPC_TRAITS.goodCount[i][1];
    if (r < 0) { count = NPC_TRAITS.goodCount[i][0]; break; }
  }
  const goods = shuffled(TRAITS.filter(function (t) { return t.npc && t.type === "good"; })).slice(0, count);
  const list = goods.map(function (t) { return t.id; });
  if (Math.random() < NPC_TRAITS.badChance) list.push(pick(TRAITS.filter(function (t) { return t.npc && t.type === "bad"; })).id);
  return list;
}

// 예전 세이브: 특성이 없는 선수에게 특성 붙이기
function ensureNpcTraits() {
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (!Array.isArray(p.traits)) p.traits = randomNpcTraits();
    else p.traits = p.traits.filter(function (t) { return !!findTrait(t); });
  });
}

// ----- 구단 이름 정하기 -----
// 1부: 고정 기업명 10개 + 무작위 서브 브랜드 / 2부: 무작위 영문 2글자 + 서브 브랜드
// 결과: [{ name: "T1 VANGUARD", short: "T1", tier: 1 }, ...]
function makeTeamDefs() {
  const brands = shuffled(TEAM_BRANDS.map(function (b) { return b[0]; }));
  const defs = [];
  TIER1_ORGS.slice(0, LEAGUE.tier1Teams).forEach(function (org) {
    defs.push({ name: org + " " + brands.pop(), short: org, tier: 1 });
  });
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const taken = TIER1_ORGS.slice();
  for (let i = 0; i < LEAGUE.tier2Teams; i++) {
    let tag;
    do { tag = letters[randInt(0, 25)] + letters[randInt(0, 25)]; } while (taken.indexOf(tag) !== -1);
    taken.push(tag);
    defs.push({ name: tag + " " + brands.pop(), short: tag, tier: 2 });
  }
  return defs;
}

// ----- 리그 만들기 (새 게임) -----
// defs: 구단 이름 목록 (없으면 새로 만듦), chosenIndex: 내가 고른 구단 번호 (-1이면 무작위)
function makeLeague(defs, chosenIndex) {
  state.league = { teams: [], players: {}, freeAgents: [], usedNames: [], season: null };
  const names = defs || makeTeamDefs();
  names.forEach(function (n, i) {
    const tier = n.tier;
    const team = { id: "T" + (i + 1), name: n.name, short: n.short, tier: tier, roster: [] };
    const npc = LEAGUE.npc;
    // 주전 5명 (포지션마다 1명)
    POSITION_IDS.forEach(function (pos) {
      const p = makeNpc(pos, tier === 1 ? npc.tier1Starter : npc.tier2Starter, npc.ageRange);
      p.teamId = team.id;
      team.roster.push(p.id);
    });
    // 후보 2명 (포지션 무작위)
    for (let k = 0; k < LEAGUE.rosterSize - 5; k++) {
      const p = makeNpc(pick(POSITION_IDS), tier === 1 ? npc.tier1Sub : npc.tier2Sub, npc.ageRange);
      p.teamId = team.id;
      team.roster.push(p.id);
    }
    state.league.teams.push(team);
  });
  placeUser(chosenIndex >= 0 ? "T" + (chosenIndex + 1) : null);
  placeNamedPlayers(); // 네임드 선수 (data/named_players.js)
  startSeason();
  initContracts(); // 선수들 연봉·계약 기간, 내 첫 계약 (2년)
}

// ----- 네임드 선수 (data/named_players.js): 1부 강팀 주전 자리에 넣기 -----
// 그 자리에 있던 선수를 네임드 선수로 바꿔요 (이름·나이·스탯·특성). 선수마다 한 번만 (state.league.namedDone)
// 목록에 나중에 추가한 선수는 예전 세이브를 불러올 때 들어와요
function placeNamedPlayers() {
  const L = state.league;
  if (!L.namedDone) L.namedDone = L.namedAdded ? ["Ego", "Chen", "Sking", "Hwansam"] : []; // 이전 버전(4명) 세이브
  L.namedAdded = true;
  const todo = NAMED_PLAYERS.filter(function (n) { return L.namedDone.indexOf(n.name) === -1; });
  if (!todo.length) return;
  const mine = myTeam();
  const pool = tierTeams(1).filter(function (t) { return !mine || t.id !== mine.id; })
    .sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); }).slice(0, NAMED_RULES.teamPool);
  const teams = shuffled(pool);
  // 이미 네임드 선수가 있는 팀은 뒤로 (서로 다른 팀에 가도록)
  const hasNamed = function (t) { return t.roster.some(function (id) { const p = findPlayer(id); return p && p.named; }); };
  teams.sort(function (a, b) { return hasNamed(a) - hasNamed(b); });
  todo.forEach(function (n, i) {
    L.namedDone.push(n.name);
    const team = teams[i % teams.length];
    if (!team) return;
    const id = starterAt(team.id, n.pos);
    const p = id && id !== USER_ID ? findPlayer(id) : null;
    if (!p) return;
    // 같은 이름을 쓰던 다른 선수는 이름을 바꿔 줌
    Object.keys(state.league.players).forEach(function (oid) {
      const o = state.league.players[oid];
      if (o !== p && o.name === n.name) o.name = takeName();
    });
    if (state.league.usedNames.indexOf(n.name) === -1) state.league.usedNames.push(n.name);
    const gap = randInt(NAMED_RULES.ageGap[0], NAMED_RULES.ageGap[1]) * (Math.random() < 0.5 ? -1 : 1);
    p.name = n.name;
    p.named = true;
    p.age = Math.max(17, Math.min(27, state.player.age + gap));
    const range = NAMED_RULES.score.find(function (r) { return p.age <= r[0]; })[1];
    const target = randInt(range[0], range[1]);
    // 스탯: 고르게 만든 뒤 목표 종합 능력에 맞게 한꺼번에 올리거나 내림
    const bonus = findPosition(n.pos).bonus;
    STATS.forEach(function (st) { p.stats[st.id] = target + randInt(-5, 5) + (bonus.indexOf(st.id) !== -1 ? 4 : 0); });
    const shift = Math.round(target - statScoreFor(p.stats, n.pos));
    STATS.forEach(function (st) { p.stats[st.id] = Math.max(1, Math.min(90, p.stats[st.id] + shift)); });
    // 좋은 특성 (다른 선수가 가질 수 있는 것 중 무작위)
    p.traits = shuffled(TRAITS.filter(function (t) { return t.npc && t.type === "good"; })).slice(0, NAMED_RULES.traits).map(function (t) { return t.id; });
    npcMasteryInit(p); // 바뀐 스탯(챔피언 폭)에 맞게 숙련도 다시
  });
}

// 내 선수를 구단에 넣기. 그 팀의 같은 포지션 주전은 자유 계약으로
// - chosenId: 캐릭터 생성 때 고른 구단
// - 안 골랐으면(무작위): 실력이 되면 1부 하위권 팀, 아니면 2부 팀
function placeUser(chosenId) {
  let team = chosenId ? findTeam(chosenId) : null;
  if (!team) {
    const score = statScoreFor(state.stats, state.player.position);
    let candidates;
    if (score >= LEAGUE.userTier1Score) {
      candidates = tierTeams(1).sort(function (a, b) { return teamStrength(a.id) - teamStrength(b.id); }).slice(0, 5);
    } else {
      candidates = tierTeams(2);
    }
    team = pick(candidates);
  }
  const old = starterAt(team.id, state.player.position);
  if (old) {
    team.roster.splice(team.roster.indexOf(old), 1);
    findPlayer(old).teamId = null;
    state.league.freeAgents.push(old);
  }
  team.roster.unshift(USER_ID);
  state.team = team.name;
}

// 그 팀 그 포지션의 주전 (내 선수는 항상 주전, 아니면 스탯 점수가 가장 높은 선수)
function starterAt(teamId, pos) {
  const team = findTeam(teamId);
  // 내 선수는 후보(2군행)가 아니면 주전
  if (team.roster.indexOf(USER_ID) !== -1 && state.player.position === pos && !state.benched) return USER_ID;
  let best = null, bestScore = -1;
  team.roster.forEach(function (id) {
    if (id === USER_ID || playerPos(id) !== pos) return;
    const s = playerScore(id);
    if (s > bestScore) { best = id; bestScore = s; }
  });
  return best;
}

// 주전 5명 { top: id, jungle: id, ... } — 그 포지션 선수가 없으면 후보 중 가장 잘하는 선수
function starters(teamId) {
  const team = findTeam(teamId);
  const result = {};
  const used = [];
  POSITION_IDS.forEach(function (pos) {
    const id = starterAt(teamId, pos);
    if (id) { result[pos] = id; used.push(id); }
  });
  POSITION_IDS.forEach(function (pos) {
    if (result[pos]) return;
    const rest = team.roster.filter(function (id) { return used.indexOf(id) === -1; })
      .sort(function (a, b) { return playerScore(b) - playerScore(a); });
    if (rest.length) { result[pos] = rest[0]; used.push(rest[0]); }
  });
  return result;
}

// 팀 전력 (주전 5명 스탯 점수 평균) — 화면 표시와 대진 정리용
function teamStrength(teamId) {
  const s = starters(teamId);
  let sum = 0, n = 0;
  POSITION_IDS.forEach(function (pos) { if (s[pos]) { sum += playerScore(s[pos]); n++; } });
  return n ? sum / n : 0;
}

// 국내 팀이면 팀 전력, 해외 가상 팀이면 정해진 전력
function strengthOf(id) {
  if (findTeam(id)) return teamStrength(id);
  const o = findOverseas(id);
  return o ? o.power : 0;
}

// ----- 순위 계산 -----
// comp: 대회 id (예: "split1"), teamIds: 순위에 넣을 팀
// 정렬: 승 → 세트 득실 → 팀 전력
function standings(comps, teamIds) {
  const list = Array.isArray(comps) ? comps : [comps];
  const rows = {};
  teamIds.forEach(function (id) { rows[id] = { id: id, w: 0, l: 0, sw: 0, sl: 0 }; });
  state.league.season.matches.forEach(function (m) {
    if (list.indexOf(m.comp) === -1 || !m.winner) return;
    [[m.a, 0], [m.b, 1]].forEach(function (pair) {
      const r = rows[pair[0]];
      if (!r) return;
      const mine = m.score[pair[1]], theirs = m.score[1 - pair[1]];
      if (m.winner === pair[0]) r.w++; else r.l++;
      r.sw += mine; r.sl += theirs;
    });
  });
  return Object.keys(rows).map(function (id) { return rows[id]; }).sort(function (a, b) {
    return (b.w - a.w) || ((b.sw - b.sl) - (a.sw - a.sl)) || (strengthOf(b.id) - strengthOf(a.id));
  });
}

// 1부 정규 시즌 최종 순위: 후반기 상위 그룹 5팀(전·후반 합산 순) → 하위 그룹 5팀
function tier1FinalOrder() {
  const g = state.league.season.groups;
  if (!g) return standings("split1", tierTeams(1).map(function (t) { return t.id; })).map(function (r) { return r.id; });
  const top = standings(["split1", "split2"], g.legend).map(function (r) { return r.id; });
  const low = standings(["split1", "split2"], g.rise).map(function (r) { return r.id; });
  return top.concat(low);
}

// ----- 시즌 넘기기 -----
function startSeason() {
  state.league.season = {
    year: state.year,
    matches: [],     // 모든 경기 기록
    cupGroups: null, // 컵 대회 두 조
    groups: null,    // 후반기 상위/하위 그룹
    seeds: null,     // 플레이오프 시드
    promo: [],       // 승강전 결과 [{ tier1, tier2, winner }]
    worlds: null,    // 월드 챔피언십 정보
    champions: {},   // 대회별 우승 팀 { cup, playoffs, worlds }
  };
}

// 새해: 승강, NPC 성장·노화·은퇴, 새 시즌
function newSeasonLeague() {
  const season = state.league.season;
  const news = [];

  // 승강전 결과 반영
  season.promo.forEach(function (p) {
    if (p.winner === p.tier2) {
      findTeam(p.tier2).tier = 1;
      findTeam(p.tier1).tier = 2;
      if (p.tier2 === myTeam().id) addMoment("⬆️", myTeam().name + " 1부 승격");
      if (p.tier1 === myTeam().id) addMoment("⬇️", myTeam().name + " 2부 강등");
      news.push(findTeam(p.tier2).name + " 1부 승격, " + findTeam(p.tier1).name + " 2부 강등");
    }
  });

  // NPC 성장·노화·은퇴 (특성: 훈련 효과 = 성장, 늦게 피는 꽃 = 노화 늦게, 철의 의지 = 노화 절반, 상한선)
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    const tr = p.traits || [];
    p.age += 1;
    const bodyAge = p.age - traitSumOf(tr, "agingDelay");
    const rule = LEAGUE.npcGrowth.find(function (g) { return bodyAge <= g.maxAge; });
    STATS.forEach(function (s) {
      let d = randInt(rule.change[0], rule.change[1]);
      if (d > 0) d = roundRandom(d * growthMultiplier(p.stats[s.id]) * Math.max(0, 1 + traitSumOf(tr, "trainingAll") + traitKeyOf(tr, "trainingStat", s.id)));
      else if (d < 0) d = -roundRandom(-d * Math.max(0, 1 - traitSumOf(tr, "agingCut")));
      const before = p.stats[s.id];
      p.stats[s.id] = Math.max(1, capRise(before, Math.min(99, before + d), statCapOf(tr, s.id)));
    });
    const retireAge = LEAGUE.retireFromAge + traitSumOf(tr, "agingDelay") + traitSumOf(tr, "maxAgeBonus");
    if (p.age >= retireAge && Math.random() < (p.age - retireAge + 1) * LEAGUE.retireChancePerYear) {
      retirePlayer(p);
    }
  });

  startSeason();
  return news;
}

// 은퇴: 팀에서 빠지고 같은 포지션 신인이 들어옴
function retirePlayer(p) {
  const team = p.teamId && findTeam(p.teamId);
  recordRetiree(p, team);
  delete state.league.players[p.id];
  const fa = state.league.freeAgents.indexOf(p.id);
  if (fa !== -1) state.league.freeAgents.splice(fa, 1);
  if (!team) return;
  team.roster.splice(team.roster.indexOf(p.id), 1);
  const rookie = makeNpc(p.pos, LEAGUE.rookie, LEAGUE.rookie.ageRange);
  rookie.teamId = team.id;
  team.roster.push(rookie.id);
}
