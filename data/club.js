// ===== data/club.js — 구단: 빅게임 라이벌·구단 스태프 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 data/biggame.js) ━━━━━
// ===== 구단별 빅게임 (172, 로드맵 ③) — 코드는 js/rivals.js =====
// 고정 라이벌 두 구단이 만나면 빅게임 (리그·컵·국제대회 어디서든). 구단은 기업명(team.short)으로 찾음
// - 우리 팀 경기: 그 주 예고 기사 + 결과 기사(결승은 결승 기사로 대신), 대시보드 경기 줄에 🔥 표시
// - 내가 뛰면: 감독 퀘스트 '빅게임 승리', 이기면 인기도 보너스·지면 조금 깎임, 업적
// - 다른 팀끼리 빅게임: 결과 단신만
const BIG_GAMES = [
  { id: "telecom", a: "T1", b: "KT",    name: "통신사 더비",  icon: "📡" },
  { id: "throne",  a: "T1", b: "GEN.G", name: "왕좌의 전쟁", icon: "👑" },
];

const BIG_GAME_RULES = {
  winPopularity: 3,   // 내가 뛴 빅게임 승리: 인기도 +3 (평소 승리 +1~2에 더해서, 인기 배율 적용)
  lossPopularity: -1, // 내가 뛴 빅게임 패배: 인기도 −1
  quest: "q_biggame", // 빅게임 주에 감독이 주는 퀘스트 (data/training.js, 퀘스트 2개 제한과 별도)
};

// 기사 (data/news_articles.js와 같은 모양). 바꾸기: {recordLine}(예고: '두 팀의 상대 전적은 3승 2패다. ' / 첫 맞대결) {derby} {icon} {opp} {label} {record} {score} {streakNote} {myTeam} {me}
NEWS_ARTICLES.biggame_preview = [
  { who: "myPreview", headline: "{icon} 이번 주 {derby}! {myTeam} vs {opp}", body: "{label}에서 {myTeam}과(와) {opp}이(가) 맞붙는다. {recordLine}{streakNote}팬들의 시선이 벌써 경기장으로 쏠리고 있다." },
  { who: "myPreview", headline: "{derby} 다가온다… {myTeam}, {opp}과(와) 격돌", body: "리그에서 가장 뜨거운 맞대결 {derby}! 이번 주 {label}에서 열린다. {recordLine}{streakNote}{me}의 활약에 관심이 모인다." },
  { who: "myPreview", headline: "{icon} 자존심 대결 {derby}, 예매 열리자마자 매진", body: "{myTeam}과(와) {opp}의 {derby}. 이번 주 {label}에서 펼쳐진다. {recordLine}{streakNote}선수들도 \"이 경기만큼은 질 수 없다\"며 각오를 다졌다." },
];
NEWS_ARTICLES.biggame_result = [
  { who: "myWin", headline: "{icon} {derby}의 승자는 {myTeam}", body: "{myTeam}이(가) {label}에서 {opp}을(를) {score}로 꺾었다. 상대 전적은 {record}. {streakNote}" },
  { who: "myWin", headline: "{myTeam}, {derby}서 {opp} 제압", body: "{derby}에서 웃은 쪽은 {myTeam}이었다. {score} 승리로 상대 전적 {record}. {streakNote}{me}도 팬들의 환호를 받았다." },
  { who: "myWin", headline: "{icon} 라이벌을 눌렀다! {myTeam} {score} 승", body: "{myTeam}이(가) {opp}과(와)의 {derby}에서 {score}로 이겼다. 상대 전적 {record}. {streakNote}" },
  { who: "myLoss", headline: "{icon} {derby}, {opp}이(가) 웃었다", body: "{myTeam}이(가) {label}에서 {opp}에게 {score}로 졌다. 상대 전적은 {record}. {streakNote}다음 {derby}에서의 설욕을 다짐했다." },
  { who: "myLoss", headline: "{myTeam}, {derby}서 {opp}에 무릎", body: "자존심이 걸린 {derby}에서 {myTeam}이(가) {score}로 패했다. 상대 전적 {record}. {streakNote}팬들의 아쉬움이 크다." },
  { who: "myLoss", headline: "{icon} 라이벌에 일격… {myTeam} {score} 패", body: "{opp}이(가) {derby}에서 {myTeam}을(를) {score}로 꺾었다. 상대 전적 {record}. {streakNote}" },
];

// ━━━━━ (예전 data/staff.js) ━━━━━
// ===== 구단 스태프 (173, 로드맵 ④ 구단 능력치) — 코드는 js/staff.js =====
// 국내 구단마다 👔 감독 · 🧑‍🏫 코치 · 📊 전략 분석관 (사람, 이름 있음) + 🏢 시설 (등급만). 등급 S·A·B·C·D
// 효과는 작게 (사용자 선택): S와 D 차이가 팀 전력 약 1~1.5
// - 정해지는 방식: 새해마다 구단 자금으로 투자(등급 ↑)·유지비, 자금이 빚이면 ↓, 우승팀의 좋은 스태프는 다른 팀이 빼 감
// - 내 인사(C안 = 추천권 + 티켓): 입지가 높거나 오래 있으면 비시즌에 감독이 후보 3명을 보여 줌, 🎫 스카우트 티켓이 있으면 1명은 A급 이상
// - 은퇴한 친구가 우리 팀 코치로 오면 S급 코치 (2년 뒤 감독이 되면 S급 감독)
// - 분석관: 우리 팀 경기 주에 '분석 리포트' (상대가 노리는 조합, 정확도 = 등급, 상점 개인 분석가 +10%p)
const STAFF_GRADES = ["S", "A", "B", "C", "D"];

const STAFF_ROLES = [
  { id: "manager",  icon: "👔", name: "감독",        person: true,  desc: "경기력 (팀 전체)" },
  { id: "coach",    icon: "🧑‍🏫", name: "코치",        person: true,  desc: "선수 성장 · 내 훈련 효과" },
  { id: "analyst",  icon: "📊", name: "전략 분석관", person: true,  desc: "분석 리포트 정확도" },
  { id: "facility", icon: "🏢", name: "시설",        person: false, desc: "내 체력 회복" },
];

// 등급별 효과 (S, A, B, C, D 순서)
const STAFF_EFFECTS = {
  manager:  { power:    [0.010, 0.005, 0, -0.005, -0.010] }, // 경기력 배율 (주전 5명 모두)
  coach:    { growth:   [0.12, 0.06, 0, -0.05, -0.10],       // 해마다 성장(오르는 쪽) 배율 — 그 팀 선수 (해외 선수 제외)
              training: [0.05, 0.025, 0, -0.025, -0.05] },   // 내 훈련 효과
  analyst:  { accuracy: [0.9, 0.8, 0.7, 0.6, 0.5] },          // 분석 리포트가 맞을 확률
  facility: { stamina:  [2, 1, 0, 0, 0] },                     // 매주 내 체력 회복
};

const STAFF_RULES = {
  // 새 게임 등급 확률 (S, A, B, C, D) — 2부는 한 단계 아래로
  startOdds: [0.06, 0.2, 0.4, 0.24, 0.1],
  // 새해 (구단 예산 = data/contracts.js teamBudget × 시대 배율 기준 비율)
  upkeep: [0.10, 0.05, 0, 0, 0],               // 해마다 유지비 (S·A만)
  upgradeCost: [0, 0.40, 0.20, 0.10, 0.05],    // 그 등급으로 올리는 비용 (A→S 0.4, B→A 0.2, C→B 0.1, D→C 0.05)
  upgradeKeep: 0.3,                            // 올린 뒤에도 자금이 예산 × 이만큼 남을 때만 투자
  upgradeChance: 0.6,                          // 여유가 있을 때 투자할 확률 (한 해 1칸)
  debtDownChance: 0.5,                         // 자금이 빚이면 이 확률로 1칸 내려감 (스태프가 떠남)
  drift: 0.08,                                 // 칸마다 해마다 이 확률로 ±1 (이직·계약 만료)
  poachChance: 0.5,                            // 지난 시즌 리그·월드 우승팀의 A급 이상 스태프를 다른 팀이 빼 갈 확률 (칸마다)
  // 내 인사 추천권 (비시즌 48주, 1년 1번)
  pickWeek: 48,
  pickStanding: 60,       // 팀 내 입지가 이 이상이거나
  pickTenure: 3,          // 이 팀에서 이만큼 시즌을 보냈으면 (감독 칸은 입지 80 이상만)
  pickManagerStanding: 80,
  pickCount: 3,
  candShift: [-1, 0, 0, 1, 1, 2],  // 후보 등급 = 지금 등급에서 이 중 무작위만큼 위로 (S 넘으면 S)
  ticket: { price: 8000000, sChance: 0.3 }, // 🎫 스카우트 티켓: 후보 1명 A급 이상 (S 30%), 한 번에 1장만 가짐
  personalAnalyst: 0.1,   // 상점 '개인 분석가' 고용 중이면 리포트 정확도 +10%p
  accuracyMax: 0.95,
};

const STAFF_TEXTS = {
  pickTitle: "👔 감독: 새 {role} 후보",
  pick: "감독: \"이번 비시즌에 {roleObj} 바꿔 볼까 한다. 지금은 {cur}. 네 생각도 듣고 싶다. 후보는 이 셋이다.\"",
  pickTicket: "(🎫 스카우트 티켓으로 데려온 후보가 한 명 있어요)",
  hired: "감독: \"좋아, {name}({grade}급)을(를) 데려오지.\"",
  keep: "감독: \"알겠다. 지금 체제로 간다.\"",
};
