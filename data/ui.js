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
  rank:         { icon: "🏆", desc: "국내 리그 순위와 해외 지역 리그" }, // 224: 순위 묶음
  collect:      { icon: "💎", desc: "업적 도감과 컬렉션" }, // 224: 수집 묶음
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
// 이번 주 요약 창 (시안 27, 2026-11-04): 가운데 창 · 그림 위 오른 스탯 · 큰 점수판(가) → 자기 줄로 · 하얀 반짝임 — js/dash_plus.js, 그림 js/room.js roomWeekStripURL
const WEEK_SUMMARY = {
  maxMatches: 4,                    // 요약 창에 보이는 경기 줄 최대
  closeHint: "클릭·Space·A(ㅁ)·Enter = 바로 끝까지, 한 번 더 = 닫기 · Esc = 닫기",
  skipHint: "클릭하면 바로 끝",
  replayBtn: "경기 재생 보기 ▶",
  okBtn: "확인",
  settingText: "진행 직후 '이번 주 요약' 창",
  speeds: [["normal", "보통"], ["fast", "빠르게"], ["off", "끄기"]], // 설정 (끄기 = settings.weekSummary false)
  fast: 0.5,                        // 빠르게 = 시간 × 0.5
  scale: 5, scaleNarrow: 3, narrowAt: 560, // 그림 몇 배 (화면 폭 560px 아래는 3배)
  maxChips: 6, bigChip: 3,          // 오른 스탯 칩 최대 개수 · 이만큼 오르면 하얀 테두리
  ms: { start: 200, chip: 150, bar: 300, kv: 200, noMatch: 150, specialGap: 150, special: 1100 }, // 다다닥 간격 (밀리초)
  big: { pop: 150, tick: 90, flipEnd: 60, hold: 250, fly: 300, gap: 80 },  // 큰 점수판: 뜸 · 세트마다 숫자 · 끝 · 멈춤 · 줄로 들어감 · 다음 경기까지
  stars: 16,                        // 하얀 별 개수
  noMatch: "경기가 없는 주예요",
  benched: "후보",
  greatText: "훈련 대성공 · 오른 스탯 ×2",
  caps: {                           // 그림 아래 한 줄
    train: "🏋️ {training}", great: "🏋️ {training} · 🔥 대성공", rest: "💤 {training}",
    win: "⚔️ 경기 {n}번 · {w}승 {l}패", lose: "⚔️ 경기 {n}번 · {w}승 {l}패", titleLeague: "🏆 {title}", titleBig: "🏆 {title}",
  },
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
    { id: "phone",     icon: "📱", name: "휴대폰" }, // 232: 누르면 휴대폰 창 (SNS 메뉴는 ☰ 전체에)
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
  skipKinds: ["staffPick"],      // 휴대폰에 안 보여 주는 연락 (인사 카드 뒤집기는 오른쪽 목록에서). 220: 계약 제안·은퇴도 휴대폰으로
  staffNote: "🧑‍💼 인사 후보 카드가 와 있어요. 여기를 눌러 골라요 ›", // 휴대폰 화면에서는 지난 연락이 아래에 있어서, 누르면 그 카드로 바로 이동
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

// ----- ⓘ 설명 창 (274): 대시보드에 늘 보이던 고정 설명을 제목 옆 ⓘ로 (js/ui.js helpBtnHTML). 줄바꿈 = \n -----
const HELP_TIPS = {
  label: "설명 보기",
  champNum: "칩의 숫자 = 내 숙련도.",
  champTier: "S급: 픽 우선 +{pS}, 경기력 +{mS}% · A급: 픽 우선 +{pA}, 경기력 +{mA}%",
  champList: "전체 목록은 [선수 정보] → ⚔️ 챔피언에서 볼 수 있어요.",
  comp: "같은 성향 {from}명 이상이면 시너지, 주력 성향 상성에서 이기면 팀 점수 +{bonus}.\n📊 경기 줄 아래 분석 리포트에서 상대가 노리는 조합과 추천 전략을 볼 수 있어요.",
  recent: "전체 기록은 왼쪽 메뉴 [경기 결과]에서 볼 수 있어요.",
  rookie: "다시 보려면 [선수 검색]에서 🌟",
};

// ----- 휴대폰 대시보드 바로가기 아이콘 · 빠른 선택 창 · 미니 스탯 (235, 시안 25 · js/dash_layout.js) -----
const QUICK_ACTIONS = {
  icons: [["phone", "📱", "휴대폰"], ["train", "🏋️", "훈련 고르기"], ["quest", "📋", "퀘스트"], ["me", "👤", "선수 정보"]],
  trainIcons: { solo_rank: "🎮", scrim: "🤝", replay: "🎬", champion: "⚔️", champ_focus: "🎯", rest: "💤" },
  trainTitle: "이번 주 훈련", trainSub: "누르면 바로 바뀌어요", trainMore: "자세한 효과 · 챔피언 고르기는 훈련 화면에서 자세히 ›",
  questTitle: "퀘스트", questSub: "누르면 그 퀘스트 훈련으로", questMore: "보상 · 자세한 내용은 훈련 화면 퀘스트 칸에서 ›",
  questEmpty: "지금 받은 퀘스트가 없어요.", questTag: "📋 퀘스트",
  statsTitle: "📊 내 스탯", statsMore: "자세히 ›",
  // PC 대시보드 바로가기 줄 (240, 시안 26 A): 왼쪽 메뉴에 이미 있는 화면은 넣지 않음 [id, 아이콘, 이름]
  // 271: 휴식 주(위 막대·F 키와 겹침)·지난 신문(휴대폰과 겹침) 빼고 퀘스트·지난 경기 다시 보기 (사용자 B안)
  pcIcons: [["phone", "📱", "휴대폰"], ["train", "🏋️", "훈련 고르기"], ["champ", "⚔️", "챔피언 연습"], ["quest", "📋", "퀘스트"], ["replay", "🎬", "지난 경기"], ["home", "🏠", "집·고용"]],
  replayNone: "아직 다시 볼 경기가 없어요",
  champTitle: "챔피언 연습", champSub: "누르면 '챔피언 연습' 훈련으로 이 챔피언을 연습해요",
  typeTitle: "🧬 유형 스탯", typeSub: "높을수록 그 유형 챔피언 숙련도가 잘 올라요 (괄호 = 숙련도 성장 보너스)", typeMore: "스탯 12개 자세히 ›",
};

// ----- 휴대폰 앱 (231, 시안 24): 아래 앱 바 💬 메시지 · 📸 SNS · 🔔 알림, SNS 머리의 내 얼굴 = 내 프로필 (js/sns_page.js) -----
// 하트 숫자는 화면용 (글 번호로 정해지는 고정 숫자, 저장 안 함, 게임 결과와 관계없음)
const PHONE_APPS = {
  dock: [["msg", "💬", "메시지"], ["sns", "📸", "SNS"]], // 237: 🔔 알림은 SNS 안 📣 나를 언급 탭으로
  snsName: "프로피드",            // 게임 속 SNS 앱 이름 (실제 서비스 흉내 안 냄)
  feedPage: 12,                   // 한 번에 보여 주는 글 수 (아래 [이전 글 더 보기])
  swipeMin: 60,                   // 275: 휴대폰 창을 손가락으로 이만큼(px) 옆으로 밀면 앱 바꾸기 (💬 메시지 ← 왼쪽 / 오른쪽 → 📸 SNS)
  swipeHint: "휴대폰 화면을 왼쪽으로 밀면 📸 SNS, 오른쪽으로 밀면 💬 메시지로 가요.",
  storyMax: 8,                    // 맨 위 얼굴 줄: 최근 1주 안에 글을 올린 프로 선수
  hearts: { pro: [20, 480], fan: [0, 50] }, // [최소, 폭]
  feedEmpty: "아직 올라온 글이 없어요. 주를 진행하면 선수와 팬들이 글을 올려요.",
  more: "이전 글 더 보기",
  filterAll: "전체", filterMention: "📣 나를 언급",
  notiText: "님이 나를 언급했어요",
  notiEmpty: "아직 나를 언급한 글이 없어요.",
  meTitle: "내 프로필",
  meMentions: "📣 나를 언급한 글",
  followers: "팔로워",
  mentionTag: "📣 나를 언급",
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

// ━━━━━ 캐릭터 생성 단계 (213, js/creation.js, 시안 19 가) ━━━━━
// 순서 = 화면 순서. hint = 단계 제목 아래 안내 (pos·trait·stat은 앞에 숫자를 붙여서 씀)
const CREATION_STEPS = [
  { id: "name",  name: "이름과 얼굴", hint: "닉네임과 얼굴을 정해요. 이름은 나중에 설정에서 바꿀 수 있어요." },
  { id: "year",  name: "시작 연도",   hint: "늦게 시작할수록 훈련할 시간이 짧아서 시작 스탯에 보정을 받아요. 한 시즌은 52주예요." },
  { id: "pos",   name: "포지션",      hint: "" },
  { id: "arch",  name: "시작 유형",   hint: "나이, 시작 스탯, 체력, 특성 개수가 달라요." },
  { id: "trait", name: "특성",        hint: "눌러서 고르고, 다시 누르면 빠져요. 덜 고르고 시작하면 남은 칸은 무작위로 채워져요. 나쁜 특성은 게임 중 이벤트로만 생겨요." },
  { id: "stat",  name: "스탯",        hint: "프리셋은 그 스탯들에 고르게 나눠요. ★ = 포지션 가산점 스탯. 스탯 이름에 마우스를 올리면 설명이 나와요." },
  { id: "team",  name: "소속팀",      hint: "뛰고 싶은 팀을 고르세요. 내 선수는 그 팀의 주전이 돼요. ★ = 예상 전력 (팀원 수준, 같은 리그 안에서 비교)." },
];

// 등록 완료 도장 연출 (214, js/creation.js playRegisterStamp): 도장이 닿는 때·전체 길이(ms)
const REGISTER_FX = { stampText: "등록 완료", hitMs: 700, totalMs: 1650 };
