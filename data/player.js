// ===== data/player.js — 내 선수 기본 규칙: 스탯·성장 곡선·포지션·유형·커리어 (R2: 파일 5개를 합침) =====

// ━━━━━ (예전 data/stats.js) ━━━━━
// 선수 실력 스탯 12개 (0 ~ 100)
// - id: 코드에서 쓰는 이름 (영어, 바꾸지 마세요)
// - name: 화면에 보이는 이름
// - desc: 짧은 설명 (마우스를 올리면 보여요)
// - roles: 게임 안에서 실제로 쓰이는 곳 ("각 스탯이 하는 일" 표에 나와요. 규칙을 바꾸면 같이 고쳐 주세요)
//   ※ 모든 스탯은 "종합 능력(스탯 점수)"에 들어가요 → 경기력·주전 경쟁·연봉·이적 제안의 바탕
//   ※ 단계 스탯(data/match.js PHASES): 라인전(라인전·반응속도·입력 정확도) · 운영(운영·시야·오더) · 한타(한타·거리 조절·집중력)
//      단계 스탯 9개 평균보다 그 단계 스탯이 높은 만큼 그 단계에서 유리해요
const STATS = [
  { id: "accuracy",  name: "입력 정확도", desc: "원하는 곳에 정확히 클릭하고 스킬을 맞히는 능력",
    roles: ["라인전 단계 스탯 (비중 30%)", "경기력 흔들림 중 못하는 쪽을 줄임 (90이면 절반)", "캐리형 챔피언 숙련도 성장 보너스", "27세부터 노화로 줄어듦"] },
  { id: "laning",    name: "라인전",     desc: "초반 1:1 싸움과 CS 관리",
    roles: ["라인전 단계 스탯 (비중 40%): 라인 맞대결 경기력에 크게 반영", "라인 맞대결에서 경기력 +(라인전 − 60) × 0.15 (90이면 +4.5)", "공격형 챔피언 숙련도 성장 보너스"] },
  { id: "teamfight", name: "한타",       desc: "5:5 대규모 싸움에서의 위치와 판단",
    roles: ["한타 단계 스탯 (비중 40%, 원딜·미드 비중 큼)", "팀 점수 '운영·한타'", "경기 기록 한타 점수", "지원형 챔피언 숙련도 성장 보너스"] },
  { id: "macro",     name: "운영",       desc: "판 전체를 읽고 오브젝트를 챙기는 능력",
    roles: ["운영 단계 스탯 (비중 35%, 정글·서포트 비중 큼)", "팀 점수 '운영·한타'", "경기 기록 운영 점수", "운영형 챔피언 숙련도 성장 보너스"] },
  { id: "vision",    name: "시야",       desc: "와드 설치와 상대 위치 예측",
    roles: ["운영 단계 스탯 (비중 35%)", "팀 점수 '운영·한타'", "경기 기록 시야 점수·운영 점수", "지원형 챔피언 숙련도 성장 보너스"] },
  { id: "shotcall",  name: "오더",       desc: "팀에게 지시를 내리고 이끄는 능력",
    roles: ["운영 단계 스탯 (비중 30%)", "팀 점수 '운영·한타'", "팀 오더가 높을수록 '메타 카운터' 조합을 잘 씀", "경기 기록 운영 점수", "지원형 챔피언 숙련도 성장 보너스"] },
  { id: "pool",      name: "챔피언 폭",   desc: "다룰 수 있는 챔피언의 다양함",
    roles: ["캐릭터 생성 때 내 포지션 챔피언 처음 숙련도", "운영형 챔피언 숙련도 성장 보너스"] },
  { id: "mental",    name: "멘탈",       desc: "압박과 패배 속에서도 흔들리지 않는 힘",
    roles: ["세트 스코어에서 지고 있을 때 60 미만이면 경기력 감소 (30이면 −12%)", "패배 후 컨디션 하락 감소 (90이면 60%만)", "공격형 챔피언 숙련도 성장 보너스"] },
  { id: "reaction",  name: "반응속도",    desc: "상대 스킬에 빠르게 대응하는 능력",
    roles: ["라인전 단계 스탯 (비중 30%)", "라인전에서 솔로킬 당하기 어려워짐 (90이면 기준 +3)", "공격형 챔피언 숙련도 성장 보너스", "27세부터 노화로 줄어듦"] },
  { id: "spacing",   name: "거리 조절",   desc: "때리고 빠지는 거리 감각",
    roles: ["한타 단계 스탯 (비중 30%)", "팀 점수 '운영·한타'", "경기 기록 한타 점수", "캐리형 챔피언 숙련도 성장 보너스"] },
  { id: "adapt",     name: "적응력",     desc: "새 메타·새 챔피언에 빨리 익숙해지는 능력",
    roles: ["패치 후 4주 동안 메타 페널티 감소 (40 → 그대로, 80 → 절반)", "운영형 챔피언 숙련도 성장 보너스"] },
  { id: "focus",     name: "집중력",     desc: "긴 경기에서도 실수하지 않는 능력",
    roles: ["한타 단계 스탯 (비중 30%)", "3세트부터 경기력 +(집중력 − 60) × 0.4% (90이면 +12%, 30이면 −12%)", "캐리형 챔피언 숙련도 성장 보너스"] },
];

// 실력 스탯과 따로 관리하는 특수 스탯
// - 체력 (0 ~ 최대치): 훈련·경기로 줄고 휴식으로 회복. 최대치는 시작 유형에 따라 다르고, 나이가 들면 줄어요.
// - 컨디션 (0 ~ 100): 그 주의 몸과 마음 상태
// - 인기도 (0 ~ 100): 얼마나 유명한가
// - 평판 (-100 ~ +100): 좋은 이미지인가 나쁜 이미지인가. 논란이면 내려가고 모범적이면 올라감
const GAUGES = [
  { id: "stamina",    name: "체력",   desc: "훈련·경기로 줄고 휴식으로 회복",
    roles: ["20 미만이면 훈련 효과 절반", "30 미만이면 경기력 −10%", "최대치는 나이가 들면 줄어듦"] },
  { id: "condition",  name: "컨디션", desc: "이번 주의 몸과 마음 상태",
    roles: ["경기력 0.9배(0) ~ 1.1배(100)", "경기에서 이기면 오르고 지면 내려감"] },
  { id: "popularity", name: "인기도", desc: "팬과 업계의 관심",
    roles: ["연봉 (1당 50만 원)", "비시즌 영입 제안 수", "일부 이벤트·특성 조건"] },
  { id: "reputation", name: "평판",   desc: "-100 ~ +100. 좋은 이미지인지 나쁜 이미지인지. 구단 제안·이적에 영향",
    roles: ["계약 협상 성공률", "−30 미만이면 재계약 제안이 안 올 수 있음", "0 미만이면 영입 제안이 줄어듦"] },
];

const CONDITION_START = 80;   // 처음 컨디션
const POPULARITY_START = 5;   // 처음 인기도
const REPUTATION_START = 0;   // 처음 평판 (-100 ~ +100)
const TIRED_LIMIT = 20;       // 체력이 이보다 낮으면 훈련 효과가 절반

// ━━━━━ (예전 data/growth.js) ━━━━━
// 성장 곡선: 스탯이 높을수록 훈련으로 덜 오름
// - 훈련으로 스탯이 오를 때, 지금 그 스탯 값에 따라 아래 배율을 곱해요.
// - upTo: 이 값 "미만"이면 mult 배율 (위에서부터 처음 맞는 줄)
// - 다른 선수(NPC)의 시즌 성장에도 똑같이 적용돼요.
const GROWTH_CURVE = [
  { upTo: 50,  mult: 1.0  },  // 50 미만: 그대로
  { upTo: 65,  mult: 0.7  },  // 50~64: 70%
  { upTo: 75,  mult: 0.45 },  // 65~74: 45%
  { upTo: 85,  mult: 0.25 },  // 75~84: 25%
  { upTo: 90,  mult: 0.10 },  // 85~89: 10%
  { upTo: 93,  mult: 0.03 },  // 90~92: 3%
  { upTo: 96,  mult: 0.006 }, // 93~95: 0.6%
  { upTo: 101, mult: 0.002 }, // 96 이상: 0.2% (한계 특성 없이는 거의 안 오름, 100은 아주 특별한 숫자)
];

// 퀘스트·이벤트로 스탯이 바로 오를 때(+2 같은 보상)도 높은 스탯은 덜 오름
// from 이상이면 보상 × mult (한계 특성의 85 이상 성장 배율도 같이 곱해요)
const REWARD_CURVE = [
  { from: 96, mult: 0.02 },
  { from: 93, mult: 0.1 },
  { from: 90, mult: 0.3 },
];

// 스탯 상한선: 모든 스탯 100 (나와 다른 선수 모두). (2026-10-07: 90 → 100으로 통일)
// 높은 숫자는 위 성장 곡선으로만 느려져요.
const STAT_CAP = 100;

// 한계 특성(신의 손, 무한한 잠재력 등)의 '높은 구간 성장' 효과가 시작되는 스탯 값
// 이 값 이상인 스탯이 오를 때 성장 곡선 배율에 ×(1 + topGrowth)를 곱해요.
const TOP_GROWTH_FROM = 85;

// ━━━━━ (예전 data/positions.js) ━━━━━
// 포지션 5개
// - bonus: 가산점을 받는 스탯 id (data/player.js 참고)
const POSITIONS = [
  { id: "top",     name: "탑",     bonus: ["laning", "mental"],    desc: "외딴 라인에서 버티며 1:1을 이겨내는 포지션" },
  { id: "jungle",  name: "정글",   bonus: ["macro", "vision"],     desc: "맵 전체를 돌며 판을 설계하는 포지션" },
  { id: "mid",     name: "미드",   bonus: ["reaction", "pool"],    desc: "맵 한가운데에서 가장 많은 챔피언을 다루는 포지션" },
  { id: "adc",     name: "원딜",   bonus: ["accuracy", "spacing"], desc: "뒤에서 꾸준히 피해를 넣는 팀의 주포" },
  { id: "support", name: "서포트", bonus: ["shotcall", "teamfight"], desc: "시야를 밝히고 팀을 이끄는 포지션" },
];

// 가산점 효과
const POSITION_BONUS = {
  startBonus: 8,          // 캐릭터 생성 때 시작값 +8
  trainingBonus: 0.2,     // 훈련 효과 +20%
  matchMultiplier: 1.5,   // 경기 판정 때 1.5배로 계산 (3단계에서 사용)
};

// ━━━━━ (예전 data/archetypes.js) ━━━━━
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

// ━━━━━ (예전 data/career.js) ━━━━━
// 나이 · 노화 · 은퇴 · 엔딩 규칙 (7단계)

const CAREER = {
  // ----- 노화 -----
  // 새해(나이가 1살 늘 때)마다 아래 값이 줄어요. 운영·오더·시야 같은 머리 스탯은 그대로 (훈련으로 계속 오름)
  // "늦게 피는 꽃" 특성이 있으면 시작 나이가 agingDelay만큼 늦어져요.
  agingStartAge: 27,
  aging: [
    { maxAge: 29, reaction: [2, 3], accuracy: [1, 3], staminaMax: 3 },  // 27~29세
    { maxAge: 32, reaction: [3, 5], accuracy: [2, 4], staminaMax: 4 },  // 30~32세
    { maxAge: 99, reaction: [4, 6], accuracy: [3, 5], staminaMax: 5 },  // 33세~
  ],
  minStaminaMax: 50,   // 체력 최대치는 이 아래로 내려가지 않음
  // 노화가 시작되면 반응속도·입력 정확도 훈련 효과도 해마다 15%씩 줄어요 (최소 20%까지)
  agingTrainingCut: 0.15,
  agingTrainingMin: 0.2,

  // ----- 은퇴 -----
  avgRetireAge: 31,     // 평균 은퇴 나이 (안내용)
  retireAskAge: 29,     // 이 나이부터 비시즌(47주)마다 감독이 "은퇴할까?" 하고 물어봄
  maxAge: 35,           // 이 나이 시즌이 끝나면 무조건 은퇴
  forcedRetireAge: 29,  // 이 나이 이상에서 계약이 끝났는데 받아 줄 팀이 없으면 은퇴

  // ----- 엔딩 등급 -----
  // 커리어 점수 = 우승·수상 점수 합 + 최고 종합 능력 보너스 + 1부 시즌 수 × tier1Season
  points: {
    worlds: 30, msi: 15, playoffs: 15, firststand: 8, cup: 8, // 우승 (우리 팀)
    mvp: 12, worldsfmvp: 10, fmvp: 6, allpro: 5,       // 수상
    cupfmvp: 4, rookie: 4, tier2mvp: 2, msifmvp: 6, fsfmvp: 3,
    peakFrom: 60,        // 최고 종합 능력이 이 값을 넘은 만큼 1점씩
    tier1Season: 2,      // 1부에서 보낸 시즌 1개당
    allstar: 3,          // 올스타 선정 1번당 (js/fame.js)
    // + 인성 점수: 커리어 평균 평판 ÷ 4 (−25 ~ +25, data/fame.js REPUTATION)
  },
  grades: [
    { min: 500, name: "전설",   stars: 5, text: "e스포츠 역사에 이름을 새긴 선수. 모두가 그의 시대를 기억한다." },
    { min: 280, name: "레전드", stars: 4, text: "한 시대를 이끈 최고의 선수 중 한 명." },
    { min: 130, name: "스타",   stars: 3, text: "팬들의 사랑을 받은 실력파 스타." },
    { min: 50,  name: "베테랑", stars: 2, text: "오랫동안 프로 무대를 지킨 믿음직한 선수." },
    { min: 0,   name: "평범",   stars: 1, text: "꿈을 좇아 끝까지 달린 선수. 그것만으로도 충분하다." },
  ],
  hallOfFameKey: "progamer-career-hof", // 명예의 전당 저장 이름 (새 게임을 해도 남음)
  hallOfFameMax: 50,
};

// 은퇴 권유 연락 (29세 이상, 비시즌 시작 주)
const RETIRE_TEXTS = {
  askTitle: "감독: 다음 시즌 이야기",
  ask: "감독: \"{age}세, 프로 {years}년차구나. 요즘 몸은 좀 어때? 다음 시즌에도 함께 뛸 건지, 이번 시즌을 마지막으로 할 건지 네 생각을 듣고 싶다.\"",
  stay: "한 시즌 더 뛴다",
  retire: "이번 시즌을 끝으로 은퇴한다",
  stayNote: "한 시즌 더 도전하기로 했다.",
  retireNote: "이번 시즌이 끝나면 은퇴한다. 남은 경기를 후회 없이 치르자.",
  maxAgeTitle: "마지막 시즌",
  maxAge: "{age}세. 이번 시즌이 선수로서 마지막 시즌이다. 시즌이 끝나면 은퇴한다.",
  agingTitle: "노화",
  aging: "손이 예전 같지 않다... 반응속도와 입력 정확도, 체력이 조금 떨어졌다. 손 훈련도 예전만큼 늘지 않는다. 그래도 경기를 읽는 눈은 더 깊어졌다.",
};
