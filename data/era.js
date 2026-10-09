// ===== 시대별 리그 성장 (js/era.js) — 2026-10-07 =====
// 2012년에는 리그가 작고 돈도 적어요. 해마다 커져서 2017년쯤 지금 규모가 돼요.
// 표 모양: [연도, 값] — 그 연도부터 적용 (표의 첫 연도보다 이르면 첫 값, 마지막 연도 뒤는 마지막 값)
const ERA = {
  // 돈 배율: 연봉(기본급·실력·인기도·최저 연봉)·구단 예산·상금·스폰서·승강 지원금·이적료 (상점 물가·월세는 그대로)
  money: [[2012, 0.4], [2013, 0.5], [2014, 0.6], [2015, 0.75], [2016, 0.9], [2017, 1.0]],
  // 인기도 상승 배율 (관심이 적은 초창기엔 인기도가 천천히 오름)
  popularity: [[2012, 0.5], [2013, 0.6], [2014, 0.7], [2015, 0.8], [2016, 0.9], [2017, 1.0]],
  // 구단 수 [연도, 1부, 2부] — 늘어나는 해 새 시즌에 2부 상위 팀 확장 승격 + 신생 구단 창단(2부)
  //   1부는 8 또는 10만 (짝수, 컵 대회 두 조), 1부 10팀부터 플레이인이 생겨요 (8팀이면 상위 6팀 바로 플레이오프)
  teams: [[2012, 8, 6], [2014, 10, 6], [2016, 10, 8]],
  // 국제대회 시작 연도 (그 전에는 그 주에 리그 경기가 없어요)
  msiFrom: 2015,        // Road to MSI · MSI
  firstStandFrom: 2025, // First Stand
};

// 2012년 시작 게임: 2주차에 들어가면 리그 규모 소개 신문 기사 (js/era.js eraIntroArticle)
//   빈칸: {year} {next} {t1} {t2} {players} {b1} {b2} {pct} {regions} {rcount} {wteams} {fullYear} {nextLines}
const ERA_INTRO = {
  headline: "{year}년, 걸음마를 뗀 프로 리그 — 해마다 커진다",
  lines: [
    "🏟️ 리그 규모: 1부 {t1}팀 · 2부 {t2}팀, 선수 약 {players}명이 뛰고 있다.",
    "💰 구단 예산: 1부 구단 한 해 {b1} · 2부 {b2} 정도. 연봉·상금·스폰서도 아직 완성된 시장의 {pct}% 수준이다.",
    "🌏 해외 리그: {regions} — {rcount}개 지역 {wteams}팀이 월드 챔피언십에 도전한다. 국제대회는 아직 월드 챔피언십 하나뿐.",
    "📈 e스포츠 인기가 빠르게 오르면서 리그는 해마다 커지는 추세다. {fullYear}년쯤이면 지금의 완성된 리그 규모가 될 전망이다.",
    "🔜 내년({next}년)에는:",
  ],
  noChange: "  · 큰 변화 없이 올해 규모가 이어진다",
};

// 출신 리그 (v1.1): 선수마다 p.origin. 수준은 출신 기준으로 맞춤 (팀을 옮겨도 출신 수준 그대로 → 해외로 간 국내 스타는 실력 유지)
//   우리 리그 출신 = "kr", 해외 출신 = 지역 id (아래 WORLD_REGIONS). lang = 모국어 (언어 소통 효과는 ③단계 선수 오가기 때 연결 예정, 지금은 표시만)
const HOME_ORIGIN = { id: "kr", name: "한국", short: "KR", lang: "ko" };
const LANGUAGES = { ko: "한국어", zh: "중국어", en: "영어", pt: "포르투갈어", tr: "터키어", ru: "러시아어", ja: "일본어", es: "스페인어", vi: "베트남어", th: "태국어" };
const REGION_LANG = { na: "en", eu: "en", cn: "zh", tw: "zh", sea: "th", br: "pt", tr: "tr", cis: "ru", jp: "ja", lat: "es", vn: "vi", oce: "en" };
const REGION_SHORT = { na: "NA", eu: "EU", cn: "CN", tw: "TW", sea: "SEA", br: "BR", tr: "TR", cis: "CIS", jp: "JP", lat: "LAT", vn: "VN", oce: "OCE" };

// ② 해외 리그 시즌 이야기 (v1.1, js/era.js worldSeasonStory): 우리 리그 결승 주(38주)에 지역 리그 결산
//   mvpRankBonus: 지역 MVP 고를 때 팀 순위 보너스 [1위, 2위, 3위] (종합 능력에 더함) · historyKeep: 지역마다 기록 보관 연수 · stars: 화면 스타 선수 수
const WORLD_STORY = {
  mvpRankBonus: [3, 1.5, 0.5],
  historyKeep: 15,
  stars: 3,
  headline: "🌏 {year} 해외 리그 결산 — 지역 우승팀 확정",
  intro: "월드 챔피언십을 앞두고 해외 각 지역 리그의 우승팀과 MVP가 정해졌다.",
  kr: " (한국 출신!)",
};

// ③ 선수 오가기 (v1.1, js/world_moves.js) — 새 시즌 비시즌 이적 때
//   foreignMax: 한 팀의 외국인(다른 출신) 선수 최대 수 (국내·해외 팀 공통, 사용자 결정 1명)
//   import: 국내 구단의 해외 선수 영입 — 외국인이 없는 팀마다 chance 확률로, 가장 약한 주전 포지션에 margin 이상 나은 해외 선수(나이 maxAge 이하)를 이적료(1부 기준 연봉 × feeMult)로. 한 해 최대 perYear명
//   faAbroad: 국내에서 팀을 못 구한 FA(종합 능력이 2부 주전 평균 − below 이상, 나이 maxAge 이하)가 chance 확률로 해외 팀으로 (외국인이 없고 그 포지션 주전보다 잘하는 팀). 한 해 최대 perYear명
//   returnHome: 해외에 간 지 minYears년 넘은 한국 출신 선수가 chance 확률로 국내 FA로 돌아옴 (국내 구단들이 이어서 영입). 한 해 최대 perYear명
const WORLD_MOVES = {
  foreignMax: 1,
  import: { chance: 0.2, margin: 3, maxAge: 28, feeMult: 1.2, perYear: 3 },
  faAbroad: { chance: 0.5, below: 2, maxAge: 29, perYear: 4 },
  returnHome: { minYears: 2, chance: 0.3, perYear: 2 },
};

// 언어 소통 (v1.1, 사용자 결정 '보통') — 팀 언어: 국내 팀 한국어, 해외 팀은 그 지역 언어 (REGION_LANG)
//   선수마다 팀 언어 실력 0~100 (모국어 100, 처음 가면 start, 영어 팀이면 startEn). 새해마다 그 팀에 있으면 +perYear (3년이면 거의 적응)
//   팀 점수: (1 − 실력/100)을 주전끼리 더한 값 × teamplay 만큼 운영·한타 점수 −
//   콜 충돌·오브젝트 콜 실패 사건: 그 팀 쪽 주인공 확률 × (1 + clash × 같은 값)
const LANG_RULES = {
  start: 0,
  startEn: 30,
  perYear: 35,
  teamplay: 2,
  clash: 0.5,
  clashEvents: ["call_clash", "obj_call_fail"],
};

// 월드 챔피언십 지역 (우리 리그 = 한국은 여기 없음). from: 처음 참가하는 해
// strength: 우리 리그 1부 평균 대비 전력 (1.0 = 같음), teams: 그 지역 팀 수 (선수 명단을 가진 가상 팀)
//   v1.1 (사용자 결정): 3단계 — 우리 리그(LCK) 1.0 > 중국·북미·유럽 0.94 > 나머지 0.86. 해마다 새해에 이 수준 쪽으로 반쯤 맞춤 (WORLD_RULES.tierPull)
// 월드 자리: 강한 지역 1위부터 자리를 받고(전력 순 자리 openSlots개는 남겨 둠 → 약한 지역은 못 나갈 수도), 나머지는 전력 순
const WORLD_REGIONS = [
  { id: "na",  name: "북미",       from: 2012, strength: 0.94, teams: 8 },
  { id: "eu",  name: "유럽",       from: 2012, strength: 0.94, teams: 8 },
  { id: "cn",  name: "중국",       from: 2013, strength: 0.94,  teams: 8 },
  { id: "tw",  name: "대만·홍콩",  from: 2013, strength: 0.86, teams: 6 },
  { id: "sea", name: "동남아시아", from: 2014, strength: 0.86, teams: 4 },
  { id: "br",  name: "브라질",     from: 2015, strength: 0.86, teams: 4 },
  { id: "tr",  name: "터키",       from: 2015, strength: 0.86, teams: 4 },
  { id: "cis", name: "CIS",        from: 2016, strength: 0.86, teams: 4 },
  { id: "jp",  name: "일본",       from: 2016, strength: 0.86, teams: 4 },
  { id: "lat", name: "중남미",     from: 2016, strength: 0.86, teams: 4 },
  { id: "vn",  name: "베트남",     from: 2017, strength: 0.86, teams: 4 },
  { id: "oce", name: "오세아니아", from: 2017, strength: 0.86, teams: 4 },
];

// 해외 선수 (가벼운 버전: 이름·포지션·나이·스탯만, 경기 화면에는 아직 안 나옴 — 나중에 확장)
const WORLD_RULES = {
  rosterSize: 6,          // 팀마다 선수 수 (주전 5 + 후보 1)
  topBonus: [1.08, 1.04, 1.01, 0.98, 0.96, 0.94, 0.92, 0.9], // 지역 안 순위별 전력 배율 (1위가 가장 강함)
  levelSpread: 5,         // 같은 팀 선수끼리 실력 차이 ±
  rookieBelow: 8,         // 은퇴한 자리를 채우는 신인: 그 팀 평균보다 이만큼 낮게
  rankNoise: 4,           // 시즌마다 지역 순위를 정할 때 전력 흔들림 ± (v1.1: 2 → 4, 작은 지역에서 같은 팀만 우승하던 문제)
  openSlots: 4,           // 월드에서 지역 1위가 아니라 전력 순으로 주는 자리 수
  tierPull: 0.5,          // 새해마다 '그 지역 출신' 주전 평균을 '1부 평균 × strength' 쪽으로 차이의 이만큼 옮김 (다른 출신 선수는 그대로)
};

// 해외 팀 이름 (지역마다 앞에서부터 사용, 모자라면 공용 목록) — 모두 가상의 이름
const WORLD_TEAM_NAMES = {
  na:  ["Liberty Eagles", "Golden Coast", "Bay Titans", "Midwest Storm", "Lone Star", "Harbor Wolves", "Iron City", "Neon Vegas"],
  eu:  ["Royal Lions", "Nordic Wind", "Rhein Guard", "Iberia Sol", "Baltic Frost", "Alpine Peak", "Atlas Union", "Viking Crown"],
  cn:  ["Dragon Gate", "Jade Empire", "Red Lotus", "Panda Kingdom", "Sky Temple", "Golden Phoenix", "River Tigers", "Silk Road"],
  tw:  ["Formosa Flash", "Harbor Lights", "Pearl Dragons", "Typhoon Five", "Neon Bay", "Jade Harbor"],
  sea: ["Lion City", "Tropic Thunder", "Mekong Rush", "Island Kings"],
  br:  ["Samba Storm", "Rio Kings", "Amazon Queens", "Carnival Five"],
  tr:  ["Bosphorus", "Anatolia Fire", "Crescent Blades", "Byzantium"],
  cis: ["Northern Lights", "Red Square", "Siberia Wolves", "Volga Union"],
  jp:  ["Rising Sun", "Sakura Blade", "Tokyo Neon", "Shogun Gaming"],
  lat: ["El Sol", "Andes Condors", "Aztec Fire", "Pampa Riders"],
  vn:  ["Saigon Phantom", "Hanoi Lotus", "Mekong Dragons", "Ha Long Wave"],
  oce: ["Southern Cross", "Coral Reef", "Outback Five", "Kiwi Storm"],
};

// 해외 선수 닉네임 재료 (앞 + 뒤를 붙여 만들어요, 예: "Shadow" + "fox" → "Shadowfox")
const WORLD_NICK_PARTS = {
  head: ["Shadow", "Ice", "Blaze", "Night", "Storm", "Silver", "Dark", "Light", "Iron", "Neo", "Zen", "Swift", "Ghost", "Frost", "Echo",
         "Nova", "Rune", "Void", "Sky", "Wild", "Lucky", "Red", "Blue", "Mad", "Sly", "Dusk", "Dawn", "Star", "Pixel", "Tiger"],
  tail: ["fox", "wolf", "blade", "fang", "hawk", "byte", "king", "lord", "storm", "shot", "zero", "ace", "mind", "heart", "flame",
         "rider", "smith", "jin", "kai", "max", "rex", "boy", "x", "one", "z", "ray", "dash", "nix", "lee", "won"],
};
