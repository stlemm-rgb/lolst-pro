// 시작 유형 (캐릭터 생성 때 고름)
// - age: 시작 나이
// - statAvg: 실력 스탯 평균 (여기에 ±randomSpread 만큼 무작위가 더해짐)
// - statBonus: 특정 스탯 추가 점수 (예: 노력형 멘탈 +15)
// - staminaMax: 체력 최대치
// - trainingBonus: 훈련 효과 보너스 (0.25 = +25%)
// - goodTraits: 받는 좋은 특성 개수
// - masteryGrowth: 챔피언 숙련도 성장 배율 (0.5 = 절반, 3단계에서 사용)
// - strength / weakness: 화면에 보이는 장점·약점 설명
const ARCHETYPES = [
  {
    id: "prospect", name: "유망주",
    desc: "어린 나이에 데뷔한 재능 덩어리.",
    age: 17, statAvg: 30, statBonus: {}, staminaMax: 80,
    trainingBonus: 0, goodTraits: 3, masteryGrowth: 1,
    strength: "좋은 특성 3개 확정, 가장 긴 커리어",
    weakness: "시작 스탯이 낮음",
  },
  {
    id: "grinder", name: "노력형",
    desc: "재능보다 땀을 믿는 연습벌레.",
    age: 19, statAvg: 38, statBonus: { mental: 15 }, staminaMax: 95,
    trainingBonus: 0.25, goodTraits: 1, masteryGrowth: 1,
    strength: "멘탈 +15, 체력 최대 95, 훈련 효과 +25%",
    weakness: "특성이 1개뿐",
  },
  {
    id: "legend", name: "레전드",
    desc: "이미 정점을 찍어 본 베테랑.",
    age: 23, statAvg: 62, statBonus: {}, staminaMax: 80,
    trainingBonus: 0, goodTraits: 1, masteryGrowth: 0.5,
    strength: "처음부터 높은 스탯",
    weakness: "메타 변화에 취약 (챔피언 숙련도 성장 절반), 짧은 커리어",
  },
];

// 캐릭터 생성 규칙
const CREATION = {
  randomSpread: 5,   // 스탯마다 평균에서 ±5 무작위
  bonusPoints: 10,   // 직접 나눠 줄 보너스 포인트
  traitRerolls: 3,   // 특성 다시 뽑기 횟수
  minStat: 1,        // 시작 스탯 최소
  maxStat: 90,       // 시작 스탯 최대
  // 시작 연도: 늦게 시작할수록 훈련할 시간이 짧으니 모든 스탯에 보정을 더해 줌
  startYears: [
    { year: 2012, statBonus: 0,  desc: "리그 원년. 가장 긴 커리어" },
    { year: 2017, statBonus: 10, desc: "모든 스탯 +10" },
    { year: 2022, statBonus: 20, desc: "모든 스탯 +20" },
  ],
  weeksPerSeason: 52, // 한 시즌 = 52주 (1년)
};

// 나이와 은퇴 (7단계에서 사용)
const CAREER = {
  agingStartAge: 27,   // 이 나이부터 노화 시작
  avgRetireAge: 31,    // 평균 은퇴 나이
};
