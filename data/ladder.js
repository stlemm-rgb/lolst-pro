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
  // 다른 선수(국내 1부·2부 구단 선수)도 매주 솔로 랭크를 함 → 대시보드 "리그 솔로 랭크" 순위
  // 한 주 판 수 = npcGames 사이 무작위 × 선수마다 정해진 "솔랭 성향" (npcGrind 사이, 처음 한 번 정함)
  npcGames: [2, 8],
  npcGrind: [0.5, 1.6],
  boardTop: 10,            // 대시보드에 보여 줄 상위 몇 명
  // 티어 (이 점수 이상이면 그 티어). color = 대시보드 티어 로고 색
  tiers: [
    { min: 0,    name: "아이언",       color: "#7d7a78" },
    { min: 800,  name: "브론즈",       color: "#b0703f" },
    { min: 1100, name: "실버",         color: "#a9b6c6" },
    { min: 1400, name: "골드",         color: "#e2b34c" },
    { min: 1700, name: "플래티넘",     color: "#3fbfae" },
    { min: 2000, name: "에메랄드",     color: "#2fbf71" },
    { min: 2300, name: "다이아몬드",   color: "#6b9cff" },
    { min: 2600, name: "마스터",       color: "#b569e8" },
    { min: 2900, name: "그랜드마스터", color: "#e8524a" },
    { min: 3200, name: "챌린저",       color: "#f4d35e" },
  ],
  // 랭크 시즌 1위: 패치 전 주(랭크 초기화 직전) 리그 솔로 랭크 1위가 '솔랭 1위' 특성(data/traits.js ladder_king)을 받음
  // 다음 초기화 때 다음 1위에게 넘어감
  kingTrait: "ladder_king",
};
