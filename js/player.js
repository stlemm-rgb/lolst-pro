// ===== 선수 관련 계산 =====
// 포지션·시작 유형·특성 정보를 찾고, 훈련 보너스 같은 값을 계산합니다.

function findPosition(id) {
  return POSITIONS.find(function (p) { return p.id === id; });
}

function findArchetype(id) {
  return ARCHETYPES.find(function (a) { return a.id === id; });
}

function findTrait(id) {
  return TRAITS.find(function (t) { return t.id === id; });
}

// 이 스탯이 내 포지션의 가산점 스탯인가?
function isBonusStat(statId, positionId) {
  const pos = findPosition(positionId || (state.player && state.player.position));
  return !!pos && pos.bonus.indexOf(statId) !== -1;
}

// 내 특성들의 효과 값을 모두 더하기 (예: trainingAll → 0.2 + -0.2 ...)
function traitEffectSum(key) {
  let sum = 0;
  state.player.traits.forEach(function (id) {
    const trait = findTrait(id);
    if (trait && typeof trait.effects[key] === "number") sum += trait.effects[key];
  });
  return sum;
}

// 스탯 하나의 훈련 보너스 (0.45 = +45%)
// = 시작 유형 보너스 + 특성 보너스 + 포지션 가산점 보너스
function trainingBonusFor(statId) {
  let bonus = findArchetype(state.player.archetype).trainingBonus + traitEffectSum("trainingAll");
  state.player.traits.forEach(function (id) {
    const trait = findTrait(id);
    const perStat = trait && trait.effects.trainingStat;
    if (perStat && perStat[statId]) bonus += perStat[statId];
  });
  if (isBonusStat(statId)) bonus += POSITION_BONUS.trainingBonus;
  return bonus;
}

// 훈련 체력 소모 배율 (0.75 = 25% 덜 소모)
function staminaCostMultiplier() {
  return Math.max(0, 1 + traitEffectSum("staminaCost"));
}

// 인기도 상승 배율
function popularityMultiplier() {
  return Math.max(0, 1 + traitEffectSum("popularityGain"));
}

// 소수점 값을 확률로 반올림 (2.4 → 60% 확률로 2, 40% 확률로 3)
// 스탯은 정수로 보여주지만 보너스가 조금씩이라도 쌓이게 하려고 씁니다.
function roundRandom(value) {
  const whole = Math.floor(value);
  return whole + (Math.random() < value - whole ? 1 : 0);
}

// 0.45 → "+45%"
function percentText(ratio) {
  const n = Math.round(ratio * 100);
  return (n >= 0 ? "+" : "") + n + "%";
}

// 특성 하나를 작은 칩으로 (마우스를 올리면 설명 말풍선)
function traitChipHTML(id) {
  const t = findTrait(id);
  if (!t) return "";
  return '<span class="chip tip ' + t.type + '" tabindex="0" data-tip="' + escapeHTML(t.desc) + '">' + t.name + "</span>";
}

// 성장 곡선 배율: 스탯이 높을수록 덜 오름 (data/growth.js)
function growthMultiplier(value) {
  const row = GROWTH_CURVE.find(function (g) { return value < g.upTo; });
  return row ? row.mult : GROWTH_CURVE[GROWTH_CURVE.length - 1].mult;
}
