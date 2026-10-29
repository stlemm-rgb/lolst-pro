// ===== data/ui.js — 화면: 도트 포트레잇·페이지 머리 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 data/portrait.js) ━━━━━
// ===== 2D 도트 포트레잇 (175, 디자인 D1) — 코드는 js/portrait.js =====
// 32×32 도트. 내 선수는 캐릭터 만들 때 고른 얼굴(state.player.look), 다른 선수는 선수 id로 정해지는 얼굴 (저장 안 함)
// 크기: 최대 3배(96px) (사용자 결정), 표에는 얼굴만 잘라서
const PORTRAIT = {
  skins: [
    { name: "아주 밝게", c: "#f6d7c3" }, { name: "밝게", c: "#eec1a0" }, { name: "보통", c: "#d9a27f" },
    { name: "조금 어둡게", c: "#b97a57" }, { name: "어둡게", c: "#8d5a3b" },
  ],
  hairStyles: ["짧은 앞머리", "덮은 머리", "옆으로 넘김", "긴 머리", "뾰족 머리", "대머리", "아프로"],
  hairColors: [
    { name: "검정", c: "#1d1a1f" }, { name: "갈색", c: "#6b4226" }, { name: "금발", c: "#c7923e" }, { name: "은발", c: "#e7e1d4" },
    { name: "파랑", c: "#2f4a8a" }, { name: "빨강", c: "#c8322b" }, { name: "주황", c: "#e8792a" },
  ],
  eyes: ["점 눈", "반짝 눈"],
  faces: ["보통", "갸름", "넓적"],   // 얼굴 너비 12 · 11 · 13 도트
  headsetChance: 0.55,
  glassesChance: 0.18,
  // 움직임: 크게 보이는 그림(.pf-jump)만 가끔 1~5px 점프
  jump: { minGap: 3000, maxGap: 7000, minPx: 1, maxPx: 5 },
  tiredStamina: 30, // 내 선수 체력이 이 아래면 지친 표정
};

// 구단 유니폼 [바탕, 포인트(깃·줄)] — 1부 기업 10곳 고정 (사용자 확인 시안 3)
const TEAM_UNIFORMS = {
  "T1": ["#e2012d", "#141414"], "KT": ["#f2f2f2", "#e1251b"], "GEN.G": ["#a98b46", "#1b1b1b"], "Hanwha": ["#ff6a13", "#2a2a2a"],
  "Dplus": ["#1b1b1b", "#4fd1c5"], "BNK": ["#f5c400", "#1f2a44"], "BRION": ["#1fae5c", "#f2f2f2"], "NS": ["#8e1c2b", "#e8dcc2"],
  "KW": ["#1e3a8a", "#7cc4ff"], "DN": ["#6b2fbf", "#f2f2f2"],
};
// 2부·신생 구단: 기업명으로 정해지는 색 (이 중 하나)
const UNIFORM_POOL = [
  ["#3b82f6", "#f2f2f2"], ["#14b8a6", "#111827"], ["#a3e635", "#1f2937"], ["#f472b6", "#1f2937"], ["#64748b", "#f8fafc"], ["#f59e0b", "#7c2d12"],
  ["#0ea5e9", "#0f172a"], ["#ef4444", "#fde68a"], ["#8b5cf6", "#fde68a"], ["#10b981", "#064e3b"], ["#e11d48", "#f1f5f9"], ["#facc15", "#111111"],
];
// 해외 팀: 지역마다 2~3가지 중 팀 id로
const REGION_UNIFORMS = {
  na: [["#1d4ed8", "#f8fafc"], ["#0f766e", "#f8fafc"], ["#111827", "#60a5fa"]],
  eu: [["#f8fafc", "#1e3a8a"], ["#7c3aed", "#f8fafc"], ["#111827", "#f59e0b"]],
  cn: [["#dc2626", "#facc15"], ["#111827", "#ef4444"], ["#f8fafc", "#dc2626"]],
};
const FREE_AGENT_UNIFORM = ["#4b5563", "#9ca3af"]; // 소속 없음

// ━━━━━ (예전 data/pagehead.js) ━━━━━
// ===== 페이지 머리 (179, 디자인 D5) — 코드는 js/ui.js =====
// 화면 맨 위 제목을 카드로: 아이콘 + 제목 + 한 줄 설명 (+ 오른쪽 요약 숫자는 js/ui.js PAGE_HEAD_SIDE)
// 합친 메뉴(일정·이적 시장·기록실)는 부모 메뉴 id로 찾아요. 대시보드는 따로 (히어로 카드)
const PAGE_HEADS = {
  training:     { icon: "🏋️", desc: "이번 주 할 훈련을 골라요. [다음 주로 진행]을 누르면 훈련해요" },
  sns:          { icon: "📱", desc: "받은 연락에 답하고, 기사와 선수들의 글을 봐요" },
  friends:      { icon: "🤝", desc: "친구와 함께하면 관계가 깊어지고, 절친은 경기에서 힘이 돼요" },
  career:       { icon: "🧑‍💻", desc: "내 선수의 능력·특성·챔피언·기록을 한눈에" },
  shop:         { icon: "🛍️", desc: "모은 돈으로 집·장비·개인 고용·투자" },
  team:         { icon: "🏠", desc: "팀 내 입지, 우리 팀 전력, 선수단과 스태프" },
  results:      { icon: "📺", desc: "지난 경기 기록과 다시 보기" },
  calendar:     { icon: "🗓️", desc: "올해 시즌 흐름과 대회 대진표" },
  standings:    { icon: "🏆", desc: "리그별 순위표 · 세트 득실과 최근 5경기" },
  world:        { icon: "🌏", desc: "해외 지역 리그 순위와 스타 선수" },
  achievements: { icon: "🎖️", desc: "커리어·우승·개인상·명장면 업적 모음" },
  collection:   { icon: "🎨", desc: "시그니처 픽과 월드 우승 스킨" },
  market:       { icon: "💼", desc: "내 계약, 이적 요청, 선수 검색과 구단 탐색" },
  records:      { icon: "📚", desc: "개인 시상 레이스, 역사관, 리그 생태계" },
  howto:        { icon: "❓", desc: "게임 규칙과 화면 설명" },
  settings:     { icon: "⚙️", desc: "저장·불러오기와 게임 설정" },
};

// ━━━━━ 대시보드·진행 개선 (196, 시안 10: ① 요약 창 · ② 다음 목표 · ③ 성장 그래프 · ④ 칭호) ━━━━━
// 화면만 바꿈 (게임 결과·밸런스 그대로). 코드는 js/dash_plus.js
const WEEK_SUMMARY = {
  maxMatches: 4,                    // 요약 창에 보이는 경기 줄 최대
  closeHint: "A(ㅁ)·Enter·Esc 또는 바깥을 누르면 닫혀요 · 자세히는 대시보드 '지난주 결과'",
  replayBtn: "경기 재생 보기 ▶",
  okBtn: "확인",
  settingText: "진행 직후 '이번 주 요약' 창",
};
const DASH_GOALS = {
  // 다음 일정으로 보여 줄 일정 id (data/schedule.js SCHEDULE). 준비·휴식 주는 뺌
  scheduleIds: ["cup", "first_stand", "split1", "road_to_msi", "msi", "split2", "playin", "playoffs", "promotion", "worlds", "offseason"],
  startWords: { offseason: "이적 시장 열림" }, // 기본: '○○ 개막'
  contractWarn: 8,                  // 계약 만료가 이 주 이하로 남으면 빨간색
  patchText: "메타가 바뀌어요",
};
const TITLE_RULES = {
  gradeRank: { g: 3, s: 2, b: 1 },  // 자동 칭호: 등급이 높은 것 → 같은 등급이면 최근에 딴 것
  autoName: "자동 (가장 높은 등급 · 최근)",
};
const TREND_RULES = {
  minPoints: 2,                     // 이만큼 쌓여야 그래프를 그림
};

// ━━━━━ 휴대폰 아래 탭 + 진행 막대 (197, 시안 12 A1) · 받은 연락 카드 (197, 시안 13 P1) ━━━━━
// 휴대폰 폭(760px 이하)에서만 보임. 코드는 js/mobile_nav.js, 연락 카드는 js/sns_page.js
const MOBILE_NAV = {
  tabs: [
    { id: "dashboard", icon: "🏠", name: "대시보드" },
    { id: "training",  icon: "🏋️", name: "훈련" },
    { id: "sns",       icon: "📱", name: "SNS" },
    { id: "more",      icon: "☰",  name: "전체" },   // 나머지 메뉴판
  ],
  sheetIcons: { dashboard: "🏠", team: "🛡️" },      // 메뉴판 아이콘 (나머지는 PAGE_HEADS 아이콘)
  goText: "▶ 다음 주",
  restText: "💤 휴식",
};
// 206: SNS 소식 탭 주간 신문 (js/news.js newsPaperHTML)
const NEWS_PAPER = {
  title: "📰 e스포츠 데일리",
  mineTitle: "★ 내 소식",
  briefShow: 3, // 분야마다 바로 보이는 단신 수 (나머지는 더 보기)
  icons: { "여름 이적 시장": "🔁", "이적 시장": "🔁", "이적 합의": "🔁", "임대": "🤝", "패치": "⚔️", "대격변 패치": "⚔️", "패치 전망": "⚔️", "새 챔피언": "🆕",
    "은퇴": "👋", "구단 스태프": "📋", "해외 리그": "🌏", "새 시즌": "🌱", "시즌 종료": "🏁", "시즌 시상": "🏅", "승강전": "⚖️", "랭크 초기화": "🔄", "랭크 초기화 예고": "🔄",
    "MSI": "🏆", "First Stand": "🏆", "Road to MSI": "🏆", "월즈 개막": "🏆", "월즈 개막 예고": "🏆", "연속 우승": "🏆", "올스타전": "⭐", "팬": "💬", "선수 구설수": "📢" },
};

const MSG_DECK = {
  skipKinds: ["offer", "staffPick", "retire"],      // 카드로 안 보여 주는 연락 (계약 제안·인사 카드·은퇴는 지금처럼 목록에서)
  title: "답장 대기",
  pastTitle: "지난 연락",
  phoneTitle: "받은 연락",
  okLabel: "✓ 확인",           // 210: 선택지 없는 연락
  okAllLabel: "모두 확인",   // 209: 휴대폰 화면 머리
  empty: "새 연락이 없어요. 주를 진행하면 연락이 와요.",
  filters: [["all", "전체"], ["done", "✅ 답함"], ["quest", "📋 퀘스트"], ["missed", "💤 지나감"]],
  later: "◀ ▶로 넘겨 보고, 지금 안 답해도 돼요",
  legend: "⚠️ 낮은 확률로 나쁜 특성 · 💚 나쁜 특성 극복 · ✨ 좋은 특성 · 🎲 능력치로 성공·실패가 갈림", // 205: 카드 ⓘ 안내
};

// ━━━━━ 단축키 (198) ━━━━━ 코드는 js/shortcuts.js
// code = 키보드 자리 이름 (한글 자판이어도 같은 자리면 됨). 글자 입력 칸에 있을 때·창이 열려 있을 때는 안 먹음
const SHORTCUTS = [   // 199: 사용자가 정한 키
  { code: "Space",  key: "Space", act: "next",  name: "다음 주로 진행" },
  { code: "KeyF",   key: "F",     act: "rest",  name: "휴식 주로 진행" },
  { code: "KeyD",   key: "D",     act: "go:dashboard", name: "대시보드" },
  { code: "KeyS",   key: "S",     act: "go:sns",       name: "SNS" },
  { code: "KeyT",   key: "T",     act: "go:training",  name: "훈련" },
  { code: "Slash",  key: "/",     act: "help",  name: "단축키 목록" },
];
// 창 안에서 쓰는 키 (따로 처리): 이번 주 요약 창 = A(한글 ㅁ)·Enter·Esc 로 확인, 경기 재생·신문·대성공 카드 = Esc
const SUMMARY_OK_CODES = ["KeyA", "Enter", "NumpadEnter", "Escape"];
const SHORTCUT_POPUP_KEYS = [
  { key: "A (ㅁ)", name: "'○주차 정리' 창 확인 (다음은 경기 재생) · Enter·Esc도 됨" },
  { key: "Esc",    name: "열린 창 닫기 (경기 재생·신문·대성공·목록)" },
];
