// 시작 유형 (캐릭터 생성 때 고름)
// - age: 시작 나이
// - statAvg: 실력 스탯 평균 (여기에 ±randomSpread 만큼 무작위가 더해짐)
// - statBonus: 특정 스탯 추가 점수 (예: 노력형 멘탈 +15)
// - staminaMax: 체력 최대치
// - trainingBonus: 훈련 효과 보너스 (0.25 = +25%)
// - goodTraits: 받는 좋은 특성 개수
// - masteryGrowth: 챔피언 숙련도 성장 배율 (0.5 = 절반, 3단계에서 사용)
// - strength / weakness: 화면에 보이는 장점·약점 설명
// - difficulty: 화면에 보이는 난이도 표시 (선택)
// - startTrait / startTraitSeasons: 시작할 때 붙는 전용 특성과 유지 시즌 수 (그다음 시즌이 시작되면 사라짐)
const ARCHETYPES = [
  {
    id: "prospect", name: "유망주",
    desc: "어린 나이에 데뷔한 재능 덩어리.",
    age: 17, statAvg: 30, statBonus: {}, staminaMax: 80,
    trainingBonus: 0, goodTraits: 3, masteryGrowth: 1,
    startTrait: "rookie_bloom", startTraitSeasons: 2,
    strength: "좋은 특성 3개 + 전용 특성 🌱 유망주(2시즌 동안 훈련·숙련도 +30%), 가장 긴 커리어",
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
  {
    id: "living_legend", name: "리빙 레전드", difficulty: "쉬움",
    desc: "어린 나이에 이미 완성된 괴물 신인.",
    age: 17, statAvg: 62, statBonus: {}, staminaMax: 80,
    trainingBonus: 0, goodTraits: 3, masteryGrowth: 1,
    strength: "레전드급 스탯 + 유망주 나이 + 좋은 특성 3개",
    weakness: "없음 (쉬운 난이도)",
  },
];

// 캐릭터 생성 규칙
const CREATION = {
  randomSpread: 5,   // 스탯마다 평균에서 ±5 무작위
  bonusPoints: 10,   // 직접 나눠 줄 보너스 포인트
  minStat: 1,        // 시작 스탯 최소
  maxStat: 90,       // 시작 스탯 최대
  // 시작 연도: 늦게 시작할수록 훈련할 시간이 짧으니 모든 스탯에 보정을 더해 줌
  startYears: [
    { year: 2012, statBonus: 0,  desc: "리그 원년. 가장 긴 커리어" },
    { year: 2017, statBonus: 10, desc: "모든 스탯 +10" },
    { year: 2022, statBonus: 20, desc: "모든 스탯 +20" },
  ],
  weeksPerSeason: 52, // 한 시즌 = 52주 (1년)
  // 스탯 프리셋: 보너스 포인트를 이 스탯들에 고르게 나눔 (앞 스탯부터 남는 점수 하나씩 더)
  //   stats가 "position"이면 지금 고른 포지션의 ★ 가산점 스탯
  presets: [
    { id: "lane",  name: "⚔️ 라인전형", stats: ["laning", "reaction", "accuracy"] },
    { id: "macro", name: "🗺️ 운영형",   stats: ["macro", "vision", "shotcall"] },
    { id: "fight", name: "💥 한타형",   stats: ["teamfight", "spacing", "focus"] },
    { id: "pos",   name: "★ 포지션 맞춤", stats: "position" },
  ],
  // 구단 전력: 구단마다 선수 수준이 이만큼 높거나 낮게 만들어짐 (생성 화면에 ★로 보임)
  teamShift: { 1: [-3, 3], 2: [-2, 2] },
};
