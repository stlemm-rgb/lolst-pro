// 리그 규칙 (3단계)
const LEAGUE = {
  tier1Teams: 10,     // 1부 구단 수
  tier2Teams: 8,      // 2부 구단 수
  rosterSize: 7,      // 구단당 선수 (주전 5 + 후보 2)

  // 다른 선수(NPC) 실력: 스탯 점수 평균과 흩어짐 (±spread)
  npc: {
    tier1Starter: { avg: 62, spread: 10 },
    tier1Sub:     { avg: 52, spread: 8 },
    tier2Starter: { avg: 46, spread: 8 },
    tier2Sub:     { avg: 40, spread: 6 },
    statSpread: 8,        // 같은 선수 안에서 스탯마다 ±8
    ageRange: [17, 27],   // 처음 생성할 때 나이
  },

  // 내 선수 첫 소속: 스탯 점수가 이 값 이상이면 1부 하위 팀, 아니면 2부 팀
  userTier1Score: 55,

  // 시즌이 바뀔 때 NPC 성장/노화 (스탯마다 [최소, 최대] 변화)
  npcGrowth: [
    { maxAge: 21, change: [1, 5] },
    { maxAge: 25, change: [-1, 3] },
    { maxAge: 28, change: [-3, 1] },
    { maxAge: 99, change: [-5, -1] },
  ],
  retireFromAge: 29,       // 이 나이부터 은퇴 가능
  retireChancePerYear: 0.25, // 29세 25%, 30세 50%, 31세 75%...
  rookie: { avg: 40, spread: 6, ageRange: [17, 19] }, // 은퇴한 자리를 채우는 신인

  // 대회별 경기 방식 (bestOf: 3 = 3판 2선승, 5 = 5판 3선승, 1 = 단판)
  bestOf: {
    cup: 3, cup_po: 3, cup_final: 5,
    split1: 3, split2: 3, tier2: 3,
    playin: 3, playoffs: 5, promotion: 5,
    worlds_group: 1, worlds_ko: 5,
  },

  // 경기 후 내 선수 변화
  afterWin:  { condition: [3, 6],  popularity: [1, 2] },
  afterLoss: { condition: [-6, -3], popularity: [0, 0] },
};
