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
