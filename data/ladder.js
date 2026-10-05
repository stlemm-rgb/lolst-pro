// 솔로 랭크 (가상 래더)
// - 훈련할 때마다 data/training.js의 ladderGames 만큼 랭크 게임을 하고, 이긴 판은 점수 +, 진 판은 점수 −
// - 이길 확률 = 50% + (내 종합 능력 − 그 점수대 평균 실력) ÷ winSpread   (최소 10%, 최대 90%)
//   그 점수대 평균 실력 = skillBase + 점수 ÷ skillPer   (예: 2,000점 → 20 + 40 = 60)
const LADDER = {
  startPoints: 1200,       // 처음 점수
  skillBase: 20,
  skillPer: 50,
  winSpread: 40,
  minChance: 0.1,
  maxChance: 0.9,
  pointsPerGame: [18, 22], // 한 판에 오르내리는 점수
  // 티어 (이 점수 이상이면 그 티어)
  tiers: [
    { min: 0,    name: "아이언" },
    { min: 800,  name: "브론즈" },
    { min: 1100, name: "실버" },
    { min: 1400, name: "골드" },
    { min: 1700, name: "플래티넘" },
    { min: 2000, name: "에메랄드" },
    { min: 2300, name: "다이아몬드" },
    { min: 2600, name: "마스터" },
    { min: 2900, name: "그랜드마스터" },
    { min: 3200, name: "챌린저" },
  ],
};
