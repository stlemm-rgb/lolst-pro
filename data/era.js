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
  rankNoise: 2,           // 시즌마다 지역 순위를 정할 때 전력 흔들림 ±
  openSlots: 4,           // 월드에서 지역 1위가 아니라 전력 순으로 주는 자리 수
  tierPull: 0.5,          // 새해마다 지역 주전 평균을 '1부 평균 × strength' 쪽으로 차이의 이만큼 옮김 (스타 유입·성장으로 수준이 흐트러지지 않게)
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
