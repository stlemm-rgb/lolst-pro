// 솔로 랭크 (가상 래더)
// - 훈련할 때마다 data/training.js의 ladderGames 만큼 랭크 게임을 하고, 이긴 판은 점수 +, 진 판은 점수 −
// - 프로 선수는 최상위 실력이라 다이아몬드(fastUntil)까지는 빠르게 올라감 (솔로 랭크 훈련 기준 2~3주)
// - 패치(메타 변화) 때마다 점수가 resetPoints로 초기화
// - 이길 확률 = 50% + (내 종합 능력 − 그 점수대 평균 실력) ÷ winSpread   (최소 10%, 최대 90%)
//   그 점수대 평균 실력 = skillBase + 점수 ÷ skillPer   (예: 2,000점 → 20 + 40 = 60)
const LADDER = {
  startPoints: 1200,       // 처음 점수
  resetPoints: 1200,       // 패치 때 초기화되는 점수
  // 다이아몬드 아래 구간: 실력과 상관없이 잘 이기고 많이 오름
  fastUntil: 2300,
  fastWinChance: 0.92,
  fastPointsWin: [50, 60],
  fastPointsLoss: [12, 18],
  skillBase: 20,
  skillPer: 50,
  winSpread: 40,
  minChance: 0.1,
  maxChance: 0.9,
  pointsPerGame: [18, 22], // 다이아몬드부터 한 판에 오르내리는 점수
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
