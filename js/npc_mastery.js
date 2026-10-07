// ===== 다른 선수(NPC) 챔피언 숙련도: 만들기 · 매주 연습 · 밴픽 · 경기력 =====
// 규칙: data/champions.js NPC_MASTERY, 경기력 계산은 내 선수와 같은 data/match.js MATCH
// 선수마다 p.mastery = { 챔피언 이름: 1 ~ 100 } (자기 포지션 챔피언만)

function clampMastery(v) {
  return Math.max(MASTERY.min, Math.min(MASTERY.max, Math.round(v)));
}

// 처음 숙련도: 챔피언 폭 × 0.7 ± 15 (내 선수와 같은 규칙) + 시그니처 챔피언 몇 명은 크게
function npcMasteryInit(p) {
  p.mastery = {};
  releasedChampions(state.year, state.week).forEach(function (c) {
    if (c.positions.indexOf(p.pos) === -1) return;
    p.mastery[c.name] = clampMastery(p.stats.pool * MASTERY.startMainRatio + randInt(-MASTERY.startMainSpread, MASTERY.startMainSpread));
  });
  const R = NPC_MASTERY;
  shuffled(Object.keys(p.mastery)).slice(0, randInt(R.signatureCount[0], R.signatureCount[1])).forEach(function (name) {
    p.mastery[name] = clampMastery(p.mastery[name] + randInt(R.signatureBonus[0], R.signatureBonus[1]));
  });
}

// 숙련도가 없는 선수(예전 세이브·새로 들어온 선수)는 만들고, 새로 출시된 챔피언은 1부터
function ensureNpcMastery() {
  if (!state.league || !state.year) return;
  const released = releasedChampions(state.year, state.week);
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (!p.mastery) { npcMasteryInit(p); return; }
    released.forEach(function (c) {
      if (c.positions.indexOf(p.pos) !== -1 && p.mastery[c.name] === undefined) p.mastery[c.name] = MASTERY.min;
    });
  });
}

// 매주 챔피언 연습: 적응력이 높을수록 메타 챔피언(숙련도 낮은 순)을 더 자주 연습
function npcPractice() {
  const R = NPC_MASTERY;
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (!p.mastery) npcMasteryInit(p);
    const names = Object.keys(p.mastery);
    if (!names.length) return;
    const focus = (R.metaFocusBase + (p.stats.adapt - 50) * R.metaFocusPerAdapt) * Math.max(0, 1 + traitSumOf(p.traits, "metaFocus")); // 메타 부적응: 절반
    const offSig = traitSumOf(p.traits, "offSigGrowth"); // 원챔 의존: 숙련도 상위 3명 말고는 성장 ↓
    const top3 = offSig ? names.slice().sort(function (a, b) { return p.mastery[b] - p.mastery[a]; }).slice(0, 3) : null;
    const meta = (state.meta.champs[p.pos] || []).filter(function (n) { return p.mastery[n] !== undefined; })
      .sort(function (a, b) { return p.mastery[a] - p.mastery[b]; });
    for (let k = 0; k < R.practiceCount; k++) {
      const name = meta.length && Math.random() < focus ? meta[Math.min(k, meta.length - 1)] : pick(names);
      const now = p.mastery[name];
      const gain = randInt(R.practiceGain[0], R.practiceGain[1]) * Math.max(0.3, 1 - now / 125) * (top3 && top3.indexOf(name) === -1 ? Math.max(0, 1 + offSig) : 1);
      p.mastery[name] = Math.min(MASTERY.max, now + roundRandom(gain));
    }
  });
}

// 다른 선수 조커픽 후보: 비메타 챔피언 중 숙련도 상위 MATCH.jokerSlots명 (주마다·패치마다 다시 계산, 저장 안 함)
const npcJokerCache = {};
function npcJokers(p) {
  const key = absWeek() + "|" + (state.meta ? state.meta.label : "");
  const c = npcJokerCache[p.id];
  if (c && c.key === key) return c.list;
  const list = Object.keys(p.mastery).filter(function (n) { return !isMeta(n, p.pos) && p.mastery[n] >= MATCH.jokerFrom; })
    .sort(function (a, b) { return p.mastery[b] - p.mastery[a]; }).slice(0, MATCH.jokerSlots);
  npcJokerCache[p.id] = { key: key, list: list };
  return list;
}
function npcJokerFactor(p, name, meta) {
  return npcJokers(p).indexOf(name) !== -1 ? jokerFactor(p.mastery[name], meta) : 0;
}

// ----- 밴픽 -----
// 상대가 경계하는 가치 = 숙련도 + 메타 보너스 (메타가 아니면 덜 경계)
function npcBanValue(p, name) {
  const t = metaTier(name, p.pos);
  return p.mastery[name] + (t ? MATCH.metaPickBonus[t] : 0) - (t ? 0 : MATCH.jokerBanDiscount);
}

// 고를 때 가치 = 숙련도 + 메타 보너스 + 조커픽 보너스 + 팀이 노리는 조합 성향 보너스
function npcPickValue(p, name, target) {
  const t = metaTier(name, p.pos);
  return p.mastery[name] + (t ? MATCH.metaPickBonus[t] : 0) + newChampPick(name, t) + MATCH.jokerPickBonus * npcJokerFactor(p, name, !!t) +
    (target && champComps(name).indexOf(target) !== -1 ? COMP_RULES.myPickBonus : 0);
}

// 밴 당하기: 내 선수와 같은 규칙 (견제 밴 + 0~3명, 상대가 경계하는 상위 5명 중에서)
function npcBans(p, exclude) {
  const ranked = Object.keys(p.mastery).filter(function (n) { return exclude.indexOf(n) === -1; })
    .sort(function (a, b) { return npcBanValue(p, b) - npcBanValue(p, a); });
  const topMeta = ranked.filter(function (n) { return isMeta(n, p.pos); }).sort(function (a, b) { return p.mastery[b] - p.mastery[a]; })[0];
  return rollBanList(ranked, topMeta, topMeta ? p.mastery[topMeta] : 0); // 견제 밴 포함 (js/champions.js)
}

// 이 라인업 자리(lane pos)에서 숙련도를 쓰는 선수인가? (자기 포지션에 섰을 때만)
function npcMasteryPlayer(entry) {
  if (!entry.id || entry.id === USER_ID) return null;
  const p = findPlayer(entry.id);
  return p && p.mastery && p.pos === entry.pos ? p : null;
}

// 픽: 밴 당하지 않은 챔피언 중 가치 상위 3명에서 (팀 조합 계획을 따를 때는 그 성향 챔피언 위주)
function npcPickChamp(p, target, used) {
  const banned = npcBans(p, used);
  const cand = Object.keys(p.mastery).filter(function (n) { return used.indexOf(n) === -1 && banned.indexOf(n) === -1; });
  if (!cand.length) return null;
  const themed = cand.filter(function (n) { return champComps(n).indexOf(target) !== -1; });
  const pool = (themed.length && Math.random() < COMP_RULES.followPlan ? themed : cand)
    .sort(function (a, b) { return npcPickValue(p, b, target) - npcPickValue(p, a, target); });
  const weights = NPC_MASTERY.pickWeights.slice(0, pool.length);
  return pool[weightedIndex(weights)];
}

// ----- 경기력 -----
// 숙련도 배율 × 메타 등급 보너스 × 조커픽 보너스 (내 선수와 같은 식)
function npcChampMult(p, name) {
  const t = metaTier(name, p.pos);
  const m = p.mastery[name] || MASTERY.min;
  return masteryMult(m) * (1 + (t ? MATCH.metaPowerBonus[t] : 0) + newChampPower(name, t)) * (1 + MATCH.jokerPowerBonus * npcJokerFactor(p, name, !!t));
}

// 메타 챔피언 평균 숙련도 (S급은 2배로 셈)
function npcMetaAvg(p) {
  let sum = 0, weight = 0;
  (state.meta.champs[p.pos] || []).forEach(function (n) {
    const w = metaTier(n, p.pos) === "S" ? MATCH.metaSWeight : 1;
    sum += (p.mastery[n] || MASTERY.min) * w;
    weight += w;
  });
  return weight ? sum / weight : MASTERY.max;
}

// 메타 페널티 (내 선수와 같은 식: 패치 후 몇 주는 적응력으로 줄고, 고집이면 늘어남)
function npcMetaPenalty(p) {
  const tr = p.traits || [];
  if (traitSumOf(tr, "noMetaPenalty")) return 0;
  let penalty = Math.max(0, (MATCH.metaPenaltyBase - npcMetaAvg(p)) / MATCH.metaPenaltyDiv);
  if (weeksSincePatch() <= MATCH.adaptWeeks) {
    penalty *= 1 - Math.min(0.5, Math.max(0, (p.stats.adapt - MATCH.adaptFrom) / MATCH.adaptRange * 0.5));
    penalty += Math.max(0, traitSumOf(tr, "metaPenalty"));
  }
  return penalty;
}

// 세트 픽이 정해진 뒤: 다른 선수 경기력에 숙련도·메타 반영 (js/matchsim.js playSet)
function applyNpcChampPower(list, picks) {
  list.forEach(function (entry, i) {
    const p = npcMasteryPlayer(entry);
    if (!p || p.mastery[picks[i]] === undefined) return;
    entry.power = entry.power * npcChampMult(p, picks[i]) - npcMetaPenalty(p);
  });
}

// 1부 주전(다른 선수)들의 숙련도·메타로 인한 평균 경기력 비율 (해외 팀 전력 맞추기용, js/matchsim.js setupWorlds)
// 선수마다 가치 상위 3명 챔피언 배율 평균 − 메타 페널티 비율
function npcPowerFactor() {
  const list = [];
  tierTeams(1).forEach(function (t) {
    const s = starters(t.id);
    POSITION_IDS.forEach(function (pos) {
      const p = s[pos] && s[pos] !== USER_ID ? findPlayer(s[pos]) : null;
      if (!p || !p.mastery || p.pos !== pos) return;
      const top = Object.keys(p.mastery).sort(function (a, b) { return npcPickValue(p, b) - npcPickValue(p, a); }).slice(0, 3);
      if (!top.length) return;
      list.push(average(top.map(function (n) { return npcChampMult(p, n); })) - npcMetaPenalty(p) / playerScore(p.id));
    });
  });
  return list.length ? average(list) : 1;
}

// ----- 화면용 -----
// 숙련도 상위 n명 [{ name, v }]
function npcTopChamps(id, n) {
  const p = findPlayer(id);
  if (!p || !p.mastery) return [];
  return Object.keys(p.mastery).sort(function (a, b) { return p.mastery[b] - p.mastery[a]; }).slice(0, n || 3)
    .map(function (name) { return { name: name, v: p.mastery[name] }; });
}

// 나 또는 다른 선수의 숙련도 상위 n명 [{ name, v }]
function topChampList(id, n) {
  if (id !== USER_ID) return npcTopChamps(id, n);
  return myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; }).slice(0, n || 3)
    .map(function (name) { return { name: name, v: state.mastery[name] }; });
}

function topChampsHTML(id, n) {
  const list = topChampList(id, n);
  const pos = playerPos(id);
  return list.map(function (c) { return escapeHTML(c.name) + metaTagHTML(c.name, pos) + ' <span class="muted small">' + c.v + "</span>"; }).join(" · ");
}

// 패치 소식: 1부 주전 중 새 메타 숙련도가 높은/낮은 선수
function npcPatchNews() {
  const list = [];
  tierTeams(1).forEach(function (t) {
    const s = starters(t.id);
    POSITION_IDS.forEach(function (pos) {
      const p = s[pos] && s[pos] !== USER_ID ? findPlayer(s[pos]) : null;
      if (p && p.mastery && p.pos === pos) list.push({ p: p, avg: npcMetaAvg(p) });
    });
  });
  if (!list.length) return null;
  list.sort(function (a, b) { return b.avg - a.avg; });
  const n = NPC_MASTERY.patchNewsCount;
  const fmt = function (x) { return x.p.name + "(" + findPosition(x.p.pos).name + " " + Math.round(x.avg) + ")"; };
  return "새 메타에 강한 선수: " + list.slice(0, n).map(fmt).join(", ") +
    " / 고전할 선수: " + list.slice(-n).reverse().map(fmt).join(", ") + ". (괄호 = 메타 챔피언 평균 숙련도)";
}
