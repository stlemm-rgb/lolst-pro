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
    statSpread: 5,        // 같은 선수 안에서 스탯마다 ±5 (+ 플레이 스타일 NPC_STYLES로 강점·약점)
    ageRange: [17, 27],   // 처음 생성할 때 나이
  },

  // 내 선수 첫 소속: 스탯 점수가 이 값 이상이면 1부 하위 팀, 아니면 2부 팀
  userTier1Score: 55,

  // 시즌이 바뀔 때 NPC 성장/노화 (스탯마다 [최소, 최대] 변화)
  npcGrowth: [
    { maxAge: 21, change: [2, 8] },
    { maxAge: 25, change: [0, 5] },
    { maxAge: 28, change: [-2, 2] },
    { maxAge: 99, change: [-4, 0] },
  ],
  retireFromAge: 29,       // 이 나이부터 은퇴 가능
  retireChancePerYear: 0.25, // 29세 25%, 30세 50%, 31세 75%...
  rookie: { avg: 46, spread: 8, ageRange: [17, 19] }, // 은퇴한 자리를 채우는 신인
  // 새 게임: 처음부터 나이 많은 선수를 섞어서 몇 년 안에 은퇴·세대교체가 일어나게 (능력은 보통 선수와 같은 무작위)
  veterans: { chancePerTeam: 0.7, ageRange: [28, 31] },

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

// ===== 다른 선수 플레이 스타일 (js/league.js) =====
// 선수를 만들 때 하나를 골라 스탯에 mod를 더해요 (더하고 빼는 합이 0이라 스탯 점수 평균은 그대로)
// → 같은 점수라도 라인전이 강한 선수, 운영이 강한 선수처럼 개성이 생겨요
// - weight: 포지션별로 뽑힐 비율 (없으면 1)
// - growth: 해마다 성장할 때 강점(+) 스탯은 +30%, 약점(−) 스탯은 −30% 더 (스타일이 유지되게)
const NPC_STYLES = [
  { id: "laner",     icon: "🗡️", name: "라인전형",   desc: "라인전·반응속도가 강하지만 운영·오더·시야가 약해요",
    mod: { laning: 10, reaction: 7, accuracy: 5, macro: -8, shotcall: -8, vision: -6 }, weight: { top: 3, mid: 2, adc: 2, jungle: 0.5, support: 0.5 } },
  { id: "macro",     icon: "🧠", name: "운영형",     desc: "운영·오더·시야가 강하지만 피지컬과 라인전이 약해요",
    mod: { macro: 10, shotcall: 8, vision: 6, reaction: -8, accuracy: -8, laning: -8 }, weight: { jungle: 3, support: 3, mid: 1, top: 1, adc: 0.5 } },
  { id: "fighter",   icon: "⚔️", name: "한타형",     desc: "한타·거리 조절이 강하지만 라인전·챔피언 폭·시야가 약해요",
    mod: { teamfight: 10, spacing: 8, focus: 4, laning: -6, pool: -8, vision: -8 }, weight: { adc: 2, jungle: 2, support: 2, top: 2, mid: 1 } },
  { id: "mechanic",  icon: "⚡", name: "피지컬형",   desc: "반응속도·입력 정확도가 뛰어나지만 오더·운영·멘탈이 약해요",
    mod: { reaction: 10, accuracy: 10, laning: 4, shotcall: -8, macro: -8, mental: -8 }, weight: { adc: 3, mid: 2, top: 1, jungle: 1, support: 0.5 } },
  { id: "mental",    icon: "🧊", name: "강철 멘탈형", desc: "멘탈·집중력·적응력이 강하지만 피지컬과 거리 조절이 약해요",
    mod: { mental: 10, focus: 8, adapt: 6, reaction: -8, accuracy: -8, spacing: -8 }, weight: { support: 2, jungle: 1, top: 1, mid: 1, adc: 1 } },
  { id: "chameleon", icon: "🦎", name: "카멜레온형", desc: "챔피언 폭·적응력이 넓지만 한타·라인전·집중력이 약해요 (패치에 강함)",
    mod: { pool: 10, adapt: 10, macro: 4, teamfight: -8, laning: -8, focus: -8 }, weight: { mid: 2, top: 1, jungle: 1, support: 1, adc: 0.5 } },
  { id: "allround",  icon: "⚖️", name: "올라운더",   desc: "약점도 강점도 크지 않은 고른 스탯",
    mod: {}, weight: { top: 1, jungle: 1, mid: 1, adc: 1, support: 1 } },
];
const NPC_STYLE_RULES = { growthBias: 0.3 };

// ===== 다른 선수 스탯 모양 (127) — js/league.js spreadNpcStats =====
// 선수를 만들 때 (makeNpc·해외 선수): 스탯 점수는 예전과 똑같이 두고, 스탯끼리의 차이만 크게
// - widen: 그 선수 스탯 평균에서 떨어진 정도 × widen (1 = 예전 그대로)
// - noise: 스탯마다 추가로 ±noise
// - keyStats: 포지션 중요 스탯 → 그 선수 스탯 평균보다 keyAbove + (0~keyExtra) 이상
// 마지막에 전체를 같이 올리고 내려서 스탯 점수(statScoreFor)를 예전 방식 값에 맞춤
const NPC_STAT_SPREAD = {
  widen: 1.6,
  noise: 4,
  keyAbove: 5,
  keyExtra: 6,
  keyStats: {
    top:     ["laning", "mental", "reaction"],
    jungle:  ["macro", "vision", "shotcall"],
    mid:     ["reaction", "pool", "laning"],
    adc:     ["accuracy", "spacing", "teamfight"],
    support: ["shotcall", "teamfight", "vision"],
  },
};

// ===== 대형 신인 (js/league.js addBigRookies) — 2026-10-07 =====
// 해마다 1주차(새 시즌)에 2부 팀에 대형 신인이 count명 입단해요. 포지션은 무작위
// - 종합 능력 = 1부 주전 평균 + scoreAbove (예: 1부 주전 평균 63이면 65~67)
// - 나이 ageRange, 특성은 일반 선수처럼 무작위
// - 들어간 팀은 같은 포지션(또는 선수가 2명 이상인 포지션)에서 가장 약한 선수를 내보내요 (자유 계약)
// - 내 팀에는 안 들어가요
const BIG_ROOKIE = {
  count: [2, 3],
  scoreAbove: [2, 4],
  ageRange: [17, 19],
  contractYears: [2, 3],
  tier1Count: 1,          // 이 중 몇 명은 1부 팀으로 바로 입단 (신문 기사에 '1부 직행')
};

// ===== 은퇴 이야기 (js/retirement.js, 글: data/retire_stories.js) =====
// - metaWeek: 비시즌 이적 시장 중간, 1부 선수 1명이 '메타 적응이 힘들다'며 은퇴 (1년 1번, 기사 + 이적 목록에 '메타 적응 불가')
// - counselWeek / counselChance: 은퇴 전주(새 시즌 직전), 관계 25 이상 선수가 있으면 이 확률로 은퇴 상담 연락
// - coach: 상담에서 '우리 팀 코치로' → 은퇴 후 우리 팀 코치 (내 훈련 효과 +trainingBonus), toManagerYears년 뒤 감독 (감독 신뢰 +managerTrust)
//          내가 다른 팀으로 가면 효과 없음
const RETIRE_RULES = {
  metaWeek: 50,
  counselWeek: 51,
  counselChance: 0.2,
  coach: { trainingBonus: 0.05, toManagerYears: 2, managerTrust: 2 },
};
