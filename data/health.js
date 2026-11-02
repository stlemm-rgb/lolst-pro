// 체력·컨디션 불이익: 부상 · 번아웃 (238, 사용자 결정 2026-10-31 — 측정은 HANDOFF 8장)
// 로직은 js/health.js. 저장 칸 state.health = { fatigue, burnout, injury }

const HEALTH_RULES = {
  // 🩹 부상: 체력이 낮게 끝난 주에만 굴림
  injury: {
    below: 20, chance: 0.10,        // 체력 20 아래로 끝난 주: 10%
    badBelow: 10, badChance: 0.20,  // 체력 10 아래면 20%
    proneTrait: "injury_prone",     // '부상 잦음' 특성: 확률 2배 (traits.js injuryRate)
    lightRate: 0.7,                 // 가벼운 부상 70% / 심한 부상 30%
    light: [1, 2], heavy: [3, 4],   // 쉬어야 하는 주 수
    facilityCut: [1, 1, 0, 0, 0],   // 구단 시설 등급(S, A, B, C, D)별 기간 −n주
    minWeeks: 1,                    // 줄여도 최소 1주 (상점 트레이너는 data/shop.js injuryCut)
  },
  // 🥵 번아웃: 숨은 값 '피로 누적'이 쌓이면
  burnout: {
    lowStamina: 30, staminaAdd: 15,     // 체력 30 아래로 끝난 주 +15
    lowCondition: 30, conditionAdd: 10, // 컨디션 30 아래로 끝난 주 +10
    restSub: 30,                        // 쉬는 주(휴식·재활) −30
    otherSub: 5,                        // 그 외 주 −5
    start: 100,                         // 100 이상이면 번아웃
    end: 40, minWeeks: 3,               // 최소 3주가 지나고 피로 40 아래면 풀림
    trainingCut: 0.4,                   // 훈련 효과 −40% (스탯·숙련도), 대성공 없음
    powerCut: 0.05,                     // 경기력 −5%
  },
};

const HEALTH_TEXTS = {
  rehabName: "재활",
  rehabMessages: [
    "트레이너와 재활 운동을 했다. 아직은 무리하지 않는다.",
    "치료를 받고 가벼운 스트레칭만 했다. 몸이 조금씩 돌아오고 있다.",
    "재활 프로그램을 따라 했다. 마우스를 잡고 싶어서 손이 근질거린다.",
  ],
  injuryLight: "🩹 손목에 무리가 왔다. 병원에서 {weeks}주 쉬라는 진단을 받았다. 그동안 경기는 후보가 대신 나가고, 훈련 대신 재활을 한다.",
  injuryHeavy: "🩹 손목·허리 통증이 심해져 {weeks}주 진단을 받았다. 그동안 경기는 후보가 대신 나가고, 훈련 대신 재활을 한다.",
  injuryCut: " (치료 지원으로 {cut}주 줄었다)",
  healed: "🩹 부상에서 돌아왔다. 다음 주부터 다시 훈련하고 경기에 나갈 수 있다.",
  burnoutStart: "🥵 쉬지 않고 달린 피로가 한꺼번에 몰려왔다. 번아웃 — 훈련이 손에 안 잡히고(효과 −40%, 대성공 없음) 경기력도 −5%. 며칠 푹 쉬어야 풀린다.",
  burnoutEnd: "🥵 번아웃에서 벗어났다. 다시 연습이 즐겁다.",
};
