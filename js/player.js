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

// 특성 목록의 효과 값을 모두 더하기 (예: trainingAll → 0.2 + -0.2 ...). true 값은 1로 셈
function traitSumOf(traits, key) {
  let sum = 0;
  (traits || []).forEach(function (id) {
    const trait = findTrait(id);
    const v = trait && trait.effects[key];
    if (typeof v === "number") sum += v;
    else if (v === true) sum += 1;
  });
  return sum;
}

// 특성 효과 중 { 키: 값 } 모양에서 한 키의 합 (특성 목록 지정)
function traitKeyOf(traits, effect, key) {
  let sum = 0;
  (traits || []).forEach(function (id) {
    const t = findTrait(id);
    const obj = t && t.effects[effect];
    if (obj && typeof obj[key] === "number") sum += obj[key];
  });
  return sum;
}

// 내 특성들의 효과 합
function traitEffectSum(key) {
  return traitSumOf(state.player.traits, key);
}

// 선수 id의 특성 목록 (내 선수 포함)
function traitsOf(id) {
  if (id === USER_ID) return state.player.traits;
  const p = findPlayer(id);
  return (p && p.traits) || [];
}

// 스탯 상한선 (기본 STAT_CAP + 한계 특성, 최대 100)
function statCapOf(traits, statId) {
  return Math.min(100, STAT_CAP + traitKeyOf(traits, "statCap", statId) + traitKeyOf(traits, "statCap", "all"));
}

function userStatCap(statId) {
  return statCapOf(state.player.traits, statId);
}

// 스탯이 오를 때 상한선에서 멈추게 (이미 상한보다 높으면 그대로 두고 더 오르지 않음)
function capRise(before, after, cap) {
  if (after <= before) return after;
  return Math.min(after, Math.max(before, cap));
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

// 이름 옆에 붙이는 작은 특성 칩들 (S급 먼저)
function traitChipsMini(id) {
  const list = traitsOf(id).slice().sort(function (a, b) {
    const order = { s: 0, good: 1, bad: 2 };
    return order[findTrait(a).type] - order[findTrait(b).type];
  });
  return list.length ? ' <span class="mini-chips">' + list.map(traitChipHTML).join("") + "</span>" : "";
}

// 성장 곡선 배율: 스탯이 높을수록 덜 오름 (data/growth.js)
function growthMultiplier(value) {
  const row = GROWTH_CURVE.find(function (g) { return value < g.upTo; });
  return row ? row.mult : GROWTH_CURVE[GROWTH_CURVE.length - 1].mult;
}

// 내 특성 효과 중 { 키: 값 } 모양(예: typeMastery: { carry: 0.3 })에서 한 키의 합
function traitEffectKey(effect, key) {
  return traitKeyOf(state.player.traits, effect, key);
}

// "각 스탯이 하는 일" 표 (대시보드·훈련·캐릭터 생성 화면). 펼친 상태는 화면을 다시 그려도 유지
let statGuideOpen = false;
function statGuideHTML(positionId) {
  const pos = positionId && findPosition(positionId);
  const row = function (s, bonus) {
    return "<tr><td><b" + (bonus ? ' class="bonus"' : "") + ">" + (bonus ? "★ " : "") + s.name + '</b></td><td class="small">' + s.desc +
      '</td><td class="small">' + (s.roles || []).join(" · ") + "</td></tr>";
  };
  return (
    '<details class="stat-guide"' + (statGuideOpen ? " open" : "") + ' ontoggle="statGuideOpen = this.open"><summary>❓ 각 스탯이 하는 일</summary>' +
      '<p class="small">모든 실력 스탯은 <b>종합 능력(스탯 점수)</b>에 들어가요. 종합 능력은 경기력의 바탕이고, 주전 경쟁·연봉·이적 제안도 이 값으로 정해져요. ' +
        "★ 포지션 가산점 스탯은 종합 능력에서 " + POSITION_BONUS.matchMultiplier + "배로 계산되고 훈련 효과도 +" + Math.round(POSITION_BONUS.trainingBonus * 100) + "%예요." +
        (pos ? " (" + pos.name + " 가산점: " + pos.bonus.map(function (id) { return STATS.find(function (s) { return s.id === id; }).name; }).join("·") + ")" : "") + "</p>" +
      '<table class="mini"><tr><th>스탯</th><th>뜻</th><th>따로 쓰이는 곳</th></tr>' +
        STATS.map(function (s) { return row(s, pos && pos.bonus.indexOf(s.id) !== -1); }).join("") +
        '<tr><td colspan="3" class="muted small">— 특수 스탯 —</td></tr>' +
        GAUGES.map(function (g) { return row(g, false); }).join("") +
      "</table>" +
      '<p class="muted small">챔피언 유형 숙련도 보너스: 그 유형의 스탯 3개 평균이 50보다 높을수록 그 유형 챔피언 숙련도가 빨리 올라요 (캐리형: 입력 정확도·거리 조절·집중력 / 지원형: 시야·오더·한타 / 공격형: 라인전·반응속도·멘탈 / 운영형: 운영·적응력·챔피언 폭).</p>' +
    "</details>"
  );
}
