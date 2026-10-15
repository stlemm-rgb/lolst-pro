// ===== data/records.js — 기록: 왕조·맞대결·솔로 랭크·시상 (R2: 파일 4개를 합침) =====

// ━━━━━ (예전 data/dynasty.js) ━━━━━
// ===== 강팀 쏠림 막기 (v1.1) — js/dynasty.js =====
// 한 팀이 월드 우승을 반복하며 S급 선수·돈을 끌어모아 아무도 못 이기게 되던 문제 (친구 피드백).
// 플레이를 막는 제한 대신, 실제 e스포츠처럼 강팀이 자연스럽게 흩어지게 함.
//
// A. 💸 왕조의 연봉 압박 — 새 시즌, 지난 시즌 우승 팀 주전(다른 선수)의 연봉이 오름
//    raise: 우승한 대회마다 연봉 인상률 (여러 개면 더함) · perS: S급 특성(라이벌 전용 제외) 1개당 추가 · max: 최대
//    leave / leavePerS: 오른 선수마다 '더 좋은 조건을 찾아' FA로 나갈 확률 · maxLeave: 한 팀에서 최대 몇 명
//    구단 여유(clubRoom)가 0 아래로 내려가면 가장 비싼 선수부터 '연봉 협상 결렬'로 FA (이것도 maxLeave 안에서)
//    FA로 나간 선수는 그해 원래 팀이 다시 데려갈 수 없음 → 다른 팀(우리 팀 포함)이 데려갈 기회
const DYNASTY = {
  raise: { worlds: 0.35, msi: 0.15, playoffs: 0.2, firststand: 0.1, cup: 0.05 },
  perS: 0.1,
  max: 0.8,
  leave: 0.12,
  leavePerS: 0.05,
  maxLeave: 2,
};

// B. ✈️ 해외 러브콜 — 새 시즌, 1부 스타(S급 특성 보유 또는 지난 월드 우승 주전)가 해외 리그로 이적
//    확률 = base + perS × S급 수 + champ(지난 월드 우승 팀 주전이면), 최대 max · 나이 maxAge 이하만
//    한 해 최대 perYear명, 한 팀에서 최대 perTeam명. 가는 곳: 강한 지역 상위 topRegions곳의 팀 (같은 포지션 가장 약한 선수와 바뀜)
const ABROAD = {
  base: 0.04,
  perS: 0.06,
  champ: 0.08,
  max: 0.35,
  maxAge: 29,
  perYear: 3,
  perTeam: 1,
  topRegions: 3,
};

// B2. 🌏 해외 왕조 압박 (168) — 해외 팀이 월드 우승하면 새 시즌에 그 팀 주전 중 강한 moves명이 같은 지역 다른 팀으로
//    (국내 우승팀만 연봉 압박·해외 러브콜로 흩어지고 해외 우승팀은 그대로라 같은 해외 팀이 월드를 반복 우승하던 문제)
//    가는 팀은 같은 지역에서 무작위, 그 팀의 같은 포지션 주전과 맞바꿈. 그 지역 출신 선수끼리만 (외국인 1명 제한 그대로)
const OVERSEAS_DYNASTY = { moves: 2 };

// C1. 🎯 집중 견제는 data/match.js FOCUS_RULES (S급을 가진 다른 선수도 받음, 모든 대회)
// C2. 🔍 분석 당하는 챔피언 — 지난 시즌 월드 우승 팀(해외 팀 포함)은 다음 시즌 내내 상대가 연구해서 경기력 −power
const SCOUTED = { power: 0.03 };

// D. 💰 상금 선수 분배 — 대회 상금의 share만큼은 선수 몫 (선수단 인원으로 나눔). 나머지만 구단 자금으로
//    내 선수가 그 팀이면 내 몫이 자금에 들어옴
const PRIZE_SHARE = { share: 0.5 };

// 집중 견제 '미끼' 장면 (C1 안내) — 견제를 받는 선수(S급 1개 이상)가 이런 장면(도주·생존·존야·점멸·궁 회피)의 주인공이 되면
//   그 선수는 이 장면에 더 잘 뽑히고(decoyMult, S급 1개당), 해설 외침이 붙음
const DECOY = {
  events: ["escape", "survive_1v3", "zhonya", "flash_react", "dodge_ult"],
  perS: 0.25,
  calls: [
    "🎙️ \"세계 최고의 미끼!\" 해설진의 외침이 경기장에 울려 퍼졌다",
    "🎙️ \"상대 다섯 명이 전부 저 선수만 보고 있어요!\" 해설의 외침",
    "🎙️ \"이게 바로 집중 견제를 역이용하는 법입니다!\" 해설이 소리쳤다",
    "🎙️ \"미끼가 살아서 돌아왔어요! 그 사이 반대편이 다 터졌습니다!\"",
    "🎙️ \"혼자서 셋을 끌고 다닙니다! 세계 최고의 미끼!\"",
  ],
};

// ━━━━━ (예전 data/h2h.js) ━━━━━
// ===== 맞대결 전적 (170, 로드맵 ②) — 코드는 js/rivals.js =====
// 구단 맞대결: 국내 구단이 끼는 모든 경기(리그·컵·국제대회)를 구단 쌍마다 기록
// 내 선수 맞대결: 내가 뛴 세트마다 같은 라인 상대 선수와의 기록 (세트·라인전·솔로킬·평점·경기)
// 기록은 state.league.h2h에 (세이브에 자동 포함). 예전 세이브는 이 버전부터 쌓임
const H2H_RULES = {
  lastKeep: 5,        // 구단 쌍마다 최근 경기 몇 개까지 기억
  clubRows: 10,       // [구단 탐색] 맞대결 표에 보일 상대 수 (경기 많은 순)
  meRows: 20,         // [선수 정보] 맞수 표에 보일 상대 수 (세트 많은 순)
  nemesisMinSets: 6,  // '천적'·'단골 손님'으로 부를 최소 세트 수
};

// ━━━━━ (예전 data/ladder.js) ━━━━━
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

// ━━━━━ (예전 data/awards.js) ━━━━━
// 기록·시상 규칙 (6단계)
const RECORDS = {
  // 세트 평점 (1~10) = ratingBase + (내 경기력 − 상대 라이너 경기력) ÷ ratingDiv ± setWinBonus(세트 승/패)
  ratingBase: 6,
  ratingDiv: 6,
  setWinBonus: 1,

  // 시즌 상을 받으려면 정규 시즌에 최소 이만큼 세트를 뛰어야 함
  minSets: { mvp: 20, allPro: 15, rookie: 10 },
  rookieMaxAge: 19,     // 신인왕 후보 나이 (이하)
  pogWeight: 0.05,      // MVP 점수 = 평균 평점 + POG 횟수 × 0.05

  // 상을 받았을 때 내 선수 보너스
  awardBonus: { popularity: 5, reputation: 3 },
};

// 상 이름 (key는 코드에서 쓰는 이름)
const AWARD_NAMES = {
  mvp: "정규 시즌 MVP",
  allpro: "올프로 퍼스트 팀",
  rookie: "신인왕",
  tier2mvp: "2부 리그 MVP",
  cupfmvp: "LCK 컵 결승 MVP",
  fmvp: "리그 결승 MVP",
  worldsfmvp: "월드 결승 MVP",
  fsfmvp: "First Stand 결승 MVP",
  msifmvp: "MSI 결승 MVP",
};

// 대회 안내 (대회 일정 화면): 주차와 진출 조건
const COMPETITION_GUIDE = [
  { name: "LCK 컵", weeks: "2~9주", who: "1부 전체 (2012~2013년 8팀, 2014년부터 10팀)", how: "두 조의 그룹 배틀 후 전체 성적 상위 6팀 플레이오프" },
  { name: "First Stand", weeks: "10~11주", who: "LCK 컵 우승팀 + 해외 4팀 (2025년부터)", how: "국제대회. 조별 리그(한 번씩) → 상위 4팀 4강·결승. 우리 리그가 우승하면 MSI에서 2팀 모두 본선 직행" },
  { name: "정규 시즌", weeks: "13~34주", who: "1부 · 2부 (2012년 8·6팀 → 2014년 10·6 → 2016년 10·8)", how: "전반기(서로 2번씩) → 후반기(1부는 상위 절반 / 하위 절반 그룹)" },
  { name: "Road to MSI", weeks: "23~24주", who: "1·2라운드(전반기) 상위 6팀 (2015년부터)", how: "5·6위 → 4위 → 3위 계단식, 1위 vs 2위 승자가 1번 시드, 패자와 계단 승자의 최종전 승자가 2번 시드 (5판 3선승)" },
  { name: "MSI", weeks: "25~28주", who: "국내 2팀 + 해외 8팀 (2015년부터)", how: "국제대회. 플레이인(4팀) → 8강 → 4강 → 결승. 우리 리그가 우승하면 월드 진출 +1팀" },
  { name: "플레이인", weeks: "35주", who: "1부 최종 5~8위 (1부 10팀일 때만)", how: "5위 vs 8위, 6위 vs 7위 승자가 플레이오프 5·6번 시드" },
  { name: "플레이오프", weeks: "36~38주", who: "1부 6팀", how: "5판 3선승 토너먼트. 우승·준우승 + 4강 패자 중 정규 순위가 높은 팀이 월드 진출 (MSI 우승 시 4강 패자 둘 다)" },
  { name: "승강전", weeks: "39~40주", who: "1부 꼴찌·끝에서 2번째 vs 2부 1·2위", how: "이기면 다음 시즌 1부" },
  { name: "월드 챔피언십", weeks: "42~46주", who: "국내 3팀(MSI 우승 시 4팀) + 해외 지역 팀 = 16팀 (2012년 북미·유럽 → 2017년 12개 지역, 강한 지역 1위부터 + 4자리는 전력 순)", how: "4개 조 조별 리그 → 8강 → 4강 → 결승" },
];
