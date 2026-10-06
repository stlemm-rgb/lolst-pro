// ===== 챔피언 · 숙련도 · 메타(패치) =====

const POSITION_IDS = ["top", "jungle", "mid", "adc", "support"];

function findChampion(name) {
  return CHAMPIONS.find(function (c) { return c.name === name; });
}

// 그 해 그 주차의 마지막 날 ("2012-01-07" 같은 글자). 1주차 = 1월 1일 ~ 7일
function weekEndDate(year, week) {
  const d = new Date(Date.UTC(year, 0, 1 + week * 7 - 1));
  if (d.getUTCFullYear() > year) return year + "-12-31"; // 52주차는 연말까지
  return d.toISOString().slice(0, 10);
}

// 그 주까지 출시된 챔피언 목록
function releasedChampions(year, week) {
  const until = week >= 52 ? year + "-12-31" : weekEndDate(year, week);
  return CHAMPIONS.filter(function (c) { return c.released <= until; });
}

// 이번 주에 새로 출시된 챔피언 (지난주까지는 없었던)
function newlyReleased(year, week) {
  const before = week === 1 ? (year - 1) + "-12-31" : weekEndDate(year, week - 1);
  const until = week >= 52 ? year + "-12-31" : weekEndDate(year, week);
  return CHAMPIONS.filter(function (c) { return c.released > before && c.released <= until; });
}

// 캐릭터 생성 때 처음 숙련도 정하기 (챔피언 폭이 높을수록 내 포지션 챔피언을 잘 다룸)
function startMastery(stats, position, year, week) {
  const mastery = {};
  releasedChampions(year, week).forEach(function (c) {
    let value;
    if (c.positions.indexOf(position) !== -1) {
      const center = stats.pool * MASTERY.startMainRatio;
      value = Math.round(center + randInt(-MASTERY.startMainSpread, MASTERY.startMainSpread));
    } else {
      value = randInt(MASTERY.min, MASTERY.startOffMax);
    }
    mastery[c.name] = Math.max(MASTERY.min, Math.min(MASTERY.max, value));
  });
  return mastery;
}

// 새 패치: 포지션마다 메타 챔피언을 무작위로 뽑음
function makePatch(year, week) {
  const pool = releasedChampions(year, week);
  const champs = {};
  const theme = pick(COMPS).id; // 이번 패치 테마 성향 (js/comps.js) → 메타 챔피언을 그 성향 위주로
  POSITION_IDS.forEach(function (pos) {
    const list = pool.filter(function (c) { return c.positions.indexOf(pos) !== -1; });
    champs[pos] = pickThemedMeta(list, theme, MASTERY.metaPerPosition).map(function (c) { return c.name; });
  });
  // 메타 조합 = 메타 챔피언들 성향 중 가장 많은 것
  const all = [];
  POSITION_IDS.forEach(function (pos) { champs[pos].forEach(function (n) { all.push(n); }); });
  const comp = countComps(all, theme).main || theme;
  // 포지션마다 메타 중 1명은 S급 (맨 앞)
  const s = {};
  POSITION_IDS.forEach(function (pos) { s[pos] = champs[pos][0]; });
  const number = MASTERY.patchWeeks.indexOf(week) + 1;
  return { label: year + "년 " + (number > 0 ? number + "차" : "") + " 패치", champs: champs, s: s, comp: comp };
}

// 메타 챔피언인가? pos를 안 주면 "내 포지션" 기준
// (다른 포지션에서만 메타인 챔피언은 내 메타가 아님 — 예: 서포트 메타 판테온은 탑 판테온에게 메타 보너스 없음)
function metaPos(pos) {
  if (typeof pos === "string" && state.meta.champs[pos]) return pos; // filter(isMeta)처럼 숫자가 들어와도 무시
  return (state.player && state.player.position) || null;
}

function isMeta(name, pos) {
  if (!state.meta) return false;
  const p = metaPos(pos);
  if (!p) return POSITION_IDS.some(function (x) { return state.meta.champs[x].indexOf(name) !== -1; });
  return state.meta.champs[p].indexOf(name) !== -1;
}

// 메타 등급: "S", "A" 또는 null (pos 기준, 기본은 내 포지션)
function metaTier(name, pos) {
  if (!isMeta(name, pos)) return null;
  const p = metaPos(pos);
  const s = state.meta.s || {};
  if (!p) return POSITION_IDS.some(function (x) { return (s[x] || state.meta.champs[x][0]) === name; }) ? "S" : "A";
  return (s[p] || state.meta.champs[p][0]) === name ? "S" : "A";
}

// 내 포지션 S급 메타 챔피언
function mySMeta() {
  const pos = state.player.position;
  return (state.meta.s && state.meta.s[pos]) || state.meta.champs[pos][0];
}

// 화면용 등급 표시
function metaTagHTML(name, pos) {
  const t = metaTier(name, pos);
  return t ? ' <span class="meta-tag tier-' + t + '">' + t + "</span>" : "";
}

// 내 포지션 챔피언 (출시된 것만), 메타 → 숙련도 높은 순
function myPositionChampions() {
  const pos = state.player.position;
  return Object.keys(state.mastery)
    .filter(function (name) { const c = findChampion(name); return c && c.positions.indexOf(pos) !== -1; })
    .sort(function (a, b) {
      const rank = function (n) { const t = metaTier(n); return t === "S" ? 2 : t === "A" ? 1 : 0; };
      const ma = rank(a), mb = rank(b);
      if (ma !== mb) return mb - ma;
      return state.mastery[b] - state.mastery[a];
    });
}

function findChampionType(id) {
  return CHAMPION_TYPES.find(function (t) { return t.id === id; });
}

// 유형 스탯 (예: 캐리형 = 입력 정확도·거리 조절·집중력 평균)
function typeScore(typeId, stats) {
  const t = findChampionType(typeId);
  const s = stats || state.stats;
  let sum = 0;
  t.stats.forEach(function (id) { sum += s[id]; });
  return Math.round(sum / t.stats.length);
}

// 유형 스탯이 높으면 그 유형 챔피언 숙련도 성장 보너스 (0.3 = +30%)
function typeMasteryBonus(typeId) {
  return Math.max(0, (typeScore(typeId) - MASTERY.typeBonusPivot) / MASTERY.typeBonusScale);
}

// 숙련도 성장 배율 = 시작 유형(레전드 0.5) × (1 + 특성 보너스 + 챔피언 유형 보너스)
// champName을 안 주면 유형 보너스는 빼고 계산
function masteryGrowthMultiplier(champName) {
  const c = champName && findChampion(champName);
  const typeBonus = c ? typeMasteryBonus(c.type) : 0;
  let traitBonus = traitEffectSum("masteryGrowth");
  if (c) traitBonus += traitEffectKey("typeMastery", c.type);          // 유형별 특성 (캐리 본능 등)
  if (champName && isMeta(champName)) traitBonus += traitEffectSum("metaMastery"); // 메타 리더
  return findArchetype(state.player.archetype).masteryGrowth * Math.max(0, 1 + traitBonus + typeBonus + dormTrainingBonus()); // 합숙 +50%
}

// 챔피언 연습: 숙련도 올리기. 바뀐 값을 { 이름: +n } 으로 돌려줌
// - 특정 챔피언을 골랐으면 그 챔피언만 크게
// - "자동"이면 내 포지션의 메타 챔피언 중 숙련도 낮은 순으로 3명에게 나눠서
function practiceChampions(range, tired) {
  let targets, share;
  if (state.practiceChamp && state.mastery[state.practiceChamp] !== undefined) {
    targets = [state.practiceChamp];
    share = 1;
  } else {
    const mine = myPositionChampions();
    const meta = mine.filter(isMeta).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
    const rest = mine.filter(function (n) { return !isMeta(n); }).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
    targets = meta.concat(rest).slice(0, 3);
    share = 0.5;
  }
  const result = {};
  targets.forEach(function (name) {
    const now = state.mastery[name];
    // 숙련도가 높을수록 조금씩 덜 오름
    let gain = randInt(range[0], range[1]) * share * masteryGrowthMultiplier(name) * Math.max(0.3, 1 - now / 125);
    if (tired) gain *= 0.5;
    gain = roundRandom(gain);
    state.mastery[name] = Math.min(MASTERY.max, now + gain);
    result[name] = state.mastery[name] - now;
  });
  return result;
}

// ===== 경기력 계산 (밴픽 + 메타 페널티, 규칙은 data/match.js) =====

// 스탯 점수: 12개 평균, 포지션 가산점 스탯은 1.5배
function statScore() {
  let sum = 0, weight = 0;
  STATS.forEach(function (s) {
    const w = isBonusStat(s.id) ? POSITION_BONUS.matchMultiplier : 1;
    sum += state.stats[s.id] * w;
    weight += w;
  });
  return sum / weight;
}

// 밴픽에서 챔피언 가치 = 숙련도 + (메타면 보너스)
function pickValue(name) {
  const t = metaTier(name);
  return state.mastery[name] + (t ? MATCH.metaPickBonus[t] : 0);
}

// 상대가 밴할 때 보는 가치: 메타가 아닌 챔피언은 덜 경계함 (조커픽이 살아남기 쉬움)
function banValue(name) {
  return pickValue(name) - (isMeta(name) ? 0 : MATCH.jokerBanDiscount);
}

// 숙련도 배율: data/match.js masteryCurve 점들을 직선으로 이은 값
function masteryMult(m) {
  const c = MATCH.masteryCurve;
  if (m <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    if (m <= c[i][0]) return c[i - 1][1] + (c[i][1] - c[i - 1][1]) * (m - c[i - 1][0]) / (c[i][0] - c[i - 1][0]);
  }
  return c[c.length - 1][1];
}

// 조커픽 보너스 비율 0~1: 메타가 아니고 숙련도 jokerFrom → jokerFull 사이에서 서서히 커짐
function jokerFactor(m, meta) {
  if (meta) return 0;
  return Math.max(0, Math.min(1, (m - MATCH.jokerFrom) / (MATCH.jokerFull - MATCH.jokerFrom)));
}

// 조커픽(🃏 표시): 메타가 아닌데 숙련도가 높은 챔피언 (data/match.js)
function isJoker(name) {
  const c = findChampion(name);
  return !!c && c.positions.indexOf(state.player.position) !== -1 && !isMeta(name) && state.mastery[name] >= MATCH.jokerMinMastery;
}

// 내가 고를 때 가치 = 밴 가치 + 조커픽 보너스 (+ 우리 팀이 노리는 조합 성향이면 보너스)
function myPickValue(name, target) {
  const c = findChampion(name);
  const mine = !!c && c.positions.indexOf(state.player.position) !== -1;
  return pickValue(name) + (mine ? MATCH.jokerPickBonus * jokerFactor(state.mastery[name], isMeta(name)) : 0) +
    (target && champComps(name).indexOf(target) !== -1 ? COMP_RULES.myPickBonus : 0);
}

// 패치 후 몇 주째인지 (1 = 패치 주)
function weeksSincePatch() {
  let last = 1;
  MASTERY.patchWeeks.forEach(function (w) { if (w <= state.week) last = w; });
  return state.week - last + 1;
}

// 메타 페널티와 그 계산 과정
function metaPenaltyInfo() {
  const names = state.meta.champs[state.player.position];
  let sum = 0, weight = 0;
  names.forEach(function (n) {
    const w = metaTier(n) === "S" ? MATCH.metaSWeight : 1; // S급은 더 중요
    sum += (state.mastery[n] || MASTERY.min) * w;
    weight += w;
  });
  const avg = weight ? sum / weight : MASTERY.max;
  let penalty = Math.max(0, (MATCH.metaPenaltyBase - avg) / MATCH.metaPenaltyDiv);
  const adapting = weeksSincePatch() <= MATCH.adaptWeeks;
  let adaptCut = 0, stubborn = 0;
  if (adapting) {
    // 적응력이 높을수록 줄어듦 (최대 절반)
    adaptCut = Math.min(0.5, Math.max(0, (state.stats.adapt - MATCH.adaptFrom) / MATCH.adaptRange * 0.5));
    penalty *= 1 - adaptCut;
    stubborn = Math.max(0, traitEffectSum("metaPenalty"));
    penalty += stubborn;
  }
  if (traitEffectSum("noMetaPenalty")) penalty = 0; // 챔피언 마스터
  return { avg: avg, penalty: penalty, adapting: adapting, adaptCut: adaptCut, stubborn: stubborn };
}

// 한 경기 경기력 계산. bans = 밴 당하는 수 (기본 data/match.js)
// 실제 경기 밴: 밴 수와 대상을 무작위로 (data/match.js의 banCount, banWeights)
// exclude: 이번 경기 앞 세트에서 이미 나온 챔피언 (피어리스: 다시 못 나오니 밴할 필요도 없음)
function rollBans(exclude) {
  exclude = exclude || [];
  const ranked = myPositionChampions().filter(function (n) { return exclude.indexOf(n) === -1; })
    .sort(function (a, b) { return banValue(b) - banValue(a); });
  const topMeta = ranked.filter(function (n) { return isMeta(n); }).sort(function (a, b) { return state.mastery[b] - state.mastery[a]; })[0];
  return rollBanList(ranked, topMeta, topMeta ? state.mastery[topMeta] : 0);
}

// 견제 밴 확률: 숙련도가 가장 높은 메타 챔피언 (data/match.js focusBan)
function focusBanChance(mastery) {
  const F = MATCH.focusBan;
  return mastery >= F.from ? F.base + (mastery - F.from) * F.per : 0;
}

// 밴 목록 정하기 (나와 다른 선수 공통)
// ranked: 상대가 경계하는 순서, topMeta: 숙련도 가장 높은 메타 챔피언 → 견제 밴 먼저
function rollBanList(ranked, topMeta, topMastery) {
  let r = Math.random(), count = 0;
  for (let i = 0; i < MATCH.banCount.length; i++) {
    r -= MATCH.banCount[i][1];
    if (r < 0) { count = MATCH.banCount[i][0]; break; }
  }
  const banned = [];
  if (topMeta && Math.random() < focusBanChance(topMastery)) {
    banned.push(topMeta);
    count = Math.max(count, 1);
  }
  const pool = ranked.filter(function (n) { return banned.indexOf(n) === -1; }).slice(0, MATCH.banWeights.length);
  const weights = MATCH.banWeights.slice(0, pool.length);
  while (banned.length < count && pool.length) {
    const i = weightedIndex(weights);
    banned.push(pool.splice(i, 1)[0]);
    weights.splice(i, 1);
  }
  return banned;
}

// bans: 밴 당하는 수(숫자, 미리보기용 — 상대가 가장 경계하는 챔피언부터) 또는 밴 당한 챔피언 목록(실제 경기)
// target: 우리 팀이 이번 경기에 노리는 조합 성향 (있으면 그 성향 챔피언을 더 잘 고름)
// exclude: 이번 경기 앞 세트에서 이미 나온 챔피언 (다시 고를 수 없음)
function matchPower(bans, target, exclude) {
  exclude = exclude || [];
  const ranked = myPositionChampions().slice().sort(function (a, b) { return banValue(b) - banValue(a); });
  const banned = Array.isArray(bans) ? bans : ranked.filter(function (n) { return exclude.indexOf(n) === -1; }).slice(0, bans === undefined ? MATCH.bansAgainstMe : bans);
  // 남은 챔피언 중 내 가치(조커픽 보너스 포함)가 가장 높은 챔피언
  const left = ranked.filter(function (n) { return banned.indexOf(n) === -1 && exclude.indexOf(n) === -1; });
  const pick = left.slice().sort(function (a, b) { return myPickValue(b, target) - myPickValue(a, target); })[0] || ranked[0];
  const joker = isJoker(pick);
  const score = statScore();
  const tier = metaTier(pick);
  const mult = masteryMult(state.mastery[pick]) * (1 + (tier ? MATCH.metaPowerBonus[tier] : 0));
  const jokerBonus = MATCH.jokerPowerBonus * jokerFactor(state.mastery[pick], !!tier);
  const meta = metaPenaltyInfo();
  return {
    score: score,
    banned: banned,
    pick: pick,
    multiplier: mult,
    meta: meta,
    joker: joker,
    jokerBonus: jokerBonus,
    power: score * mult * (1 + signatureBonus(pick)) * (1 + jokerBonus) - meta.penalty,
  };
}

// 장인 특성: 숙련도 1위 챔피언을 고르면 경기력 보너스
function signatureBonus(pick) {
  const bonus = traitEffectSum("signature");
  if (!bonus) return 0;
  const top = myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; })[0];
  return top === pick ? bonus : 0;
}
