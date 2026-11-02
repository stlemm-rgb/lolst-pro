// ===== 체력·컨디션 불이익: 부상 · 번아웃 (238) — 규칙과 글은 data/health.js =====
// state.health = { fatigue: 피로 누적(숨은 값), burnout: null 또는 { weeks }, injury: null 또는 { left, total, heavy }, floor: 컨디션 바닥 반등 중 }

function healthState() {
  if (!state.health || typeof state.health !== "object") state.health = { fatigue: 0, burnout: null, injury: null };
  return state.health;
}
function isInjured() { return !!healthState().injury; }
function isBurnedOut() { return !!healthState().burnout; }
// 이번 주 경기에 못 나감: 후보(2군)이거나 부상
function userSidelined() { return !!state.benched || isInjured(); }

// 부상 중 훈련 = 재활 (휴식처럼 체력·컨디션만 회복, 스탯 변화 없음). id는 rest 그대로 (방 그림·대성공·퀘스트가 휴식으로 봄)
function rehabTraining() {
  const rest = findTraining("rest");
  const effects = {};
  ["stamina", "condition"].forEach(function (k) { if (rest.effects[k]) effects[k] = rest.effects[k]; });
  return Object.assign({}, rest, { name: HEALTH_TEXTS.rehabName, effects: effects, messages: HEALTH_TEXTS.rehabMessages, rehab: true });
}

// 번아웃이면 훈련 효과 배율 (main.js nextWeek)
function burnoutTrainingMult() { return isBurnedOut() ? 1 - HEALTH_RULES.burnout.trainingCut : 1; }
// 번아웃이면 경기력 배율 (matchsim.js userMatchContext)
function burnoutPowerMult() { return isBurnedOut() ? 1 - HEALTH_RULES.burnout.powerCut : 1; }

// 바닥 반등 (239): 컨디션이 30 아래면 매주 +4 (main.js nextWeek, 집 효과 다음). 처음 떨어질 때만 소식
function conditionFloorWeek() {
  const F = HEALTH_RULES.conditionFloor, H = healthState();
  if (state.condition >= F.below) { H.floor = false; return; }
  state.condition = clamp(state.condition + F.regen);
  if (!H.floor) addNews("바닥 반등", HEALTH_TEXTS.floorStart.replace("{below}", F.below).replace("{regen}", F.regen));
  H.floor = true;
}

// 이번 주 끝 체력으로 부상 확률
function injuryChance() {
  const R = HEALTH_RULES.injury;
  let p = state.stamina < R.badBelow ? R.badChance : state.stamina < R.below ? R.chance : 0;
  return p * Math.max(1, traitSumOf(state.player.traits, "injuryRate")); // 부상 잦음 2배
}
// 치료 지원으로 줄어드는 주 수: 구단 시설 등급 + 상점 트레이너 (data/shop.js injuryCut)
function injuryCutWeeks() {
  const t = myTeam();
  const fac = t ? HEALTH_RULES.injury.facilityCut[staffG(t.id, "facility")] || 0 : 0;
  return fac + shopEffectSum("injuryCut");
}

// 매주 끝 (main.js nextWeek): 부상 회복·새 부상, 피로 누적·번아웃
// training = 이번 주에 한 훈련 (휴식·재활이면 쉬는 주)
function healthWeekEnd(training) {
  const H = healthState(), B = HEALTH_RULES.burnout, R = HEALTH_RULES.injury;
  const rested = training.id === "rest";

  // 피로 누적
  if (rested) H.fatigue -= B.restSub;
  else {
    let add = 0;
    if (state.stamina < B.lowStamina) add += B.staminaAdd;
    if (state.condition < B.lowCondition) add += B.conditionAdd;
    H.fatigue += add || -B.otherSub;
  }
  H.fatigue = Math.max(0, H.fatigue);

  // 번아웃
  if (H.burnout) {
    H.burnout.weeks++;
    if (H.burnout.weeks >= B.minWeeks && H.fatigue < B.end) {
      H.burnout = null;
      addNews("번아웃 회복", HEALTH_TEXTS.burnoutEnd);
    }
  } else if (H.fatigue >= B.start) {
    H.burnout = { weeks: 0 };
    addNews("번아웃", HEALTH_TEXTS.burnoutStart);
  }

  // 부상: 이미 다쳤으면 한 주 회복, 아니면 체력이 낮게 끝난 주에 굴림
  if (H.injury) {
    H.injury.left--;
    if (H.injury.left <= 0) {
      H.injury = null;
      addNews("부상 복귀", HEALTH_TEXTS.healed);
    }
  } else {
    const p = injuryChance();
    if (p > 0 && Math.random() < p) {
      const heavy = Math.random() >= R.lightRate;
      const range = heavy ? R.heavy : R.light;
      const raw = randInt(range[0], range[1]);
      const weeks = Math.max(R.minWeeks, raw - injuryCutWeeks());
      H.injury = { left: weeks, total: weeks, heavy: heavy };
      addNews("부상", (heavy ? HEALTH_TEXTS.injuryHeavy : HEALTH_TEXTS.injuryLight).replace("{weeks}", weeks) +
        (raw > weeks ? HEALTH_TEXTS.injuryCut.replace("{cut}", raw - weeks) : ""));
    }
  }
}

// 상단바: 부상·번아웃 표시 (main.js staminaBadgeHTML 옆)
function healthBadgeHTML() {
  const H = healthState();
  let out = "";
  if (H.injury) out += '<span class="stamina-badge tip down" tabindex="0" data-tip="부상: 경기는 후보가 대신 나가고 훈련 대신 재활을 해요. ' + H.injury.left + '주 뒤 복귀">🩹 부상 <b>' + H.injury.left + "주</b></span>";
  if (H.burnout) out += '<span class="stamina-badge tip down" tabindex="0" data-tip="번아웃: 훈련 효과 −' + Math.round(HEALTH_RULES.burnout.trainingCut * 100) + '%, 대성공 없음, 경기력 −' + Math.round(HEALTH_RULES.burnout.powerCut * 100) + '%. 휴식 주를 몇 번 가지면 풀려요">🥵 번아웃</span>';
  return out;
}
