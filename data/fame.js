// ===== 인기도 · 평판 (js/fame.js) — 2026-10-07 =====

const FAME = {
  // 팬 수 = 인기도² × fansSquare + 인기도 × fansLinear  (인기도 10 → 약 4만, 50 → 80만, 100 → 310만 명)
  fansSquare: 300,
  fansLinear: 1000,
  // 스타 등급 (인기도 기준). 오르면 소식·주요 순간
  tiers: [
    { min: 0,  icon: "🙂", name: "무명" },
    { min: 20, icon: "🌱", name: "유망주" },
    { min: 40, icon: "⭐", name: "인기 선수" },
    { min: 60, icon: "🌟", name: "스타" },
    { min: 80, icon: "👑", name: "슈퍼스타" },
  ],
  // 자연 감소: 그 주에 내가 경기에 안 나왔으면(비시즌·후보·경기 없는 주) 인기도 −(인기도 − floor) × perWeek
  //   예: 인기도 80 → 주 −0.36 (비시즌 6주 약 −2), 개인 방송 중이면 감소 없음
  decay: { floor: 20, perWeek: 0.006 },
};

// 평판 등급 (−100 ~ +100)
//   trust: 감독 신뢰 — 2군행 판정에서 경쟁 선수와의 점수 차이에 더함 (+면 주전 자리를 지키기 쉬움)
const REP_TIERS = [
  { min: -100, icon: "😈", name: "악동",          trust: -3 },
  { min: -59,  icon: "😒", name: "논란의 선수",   trust: -1.5 },
  { min: -19,  icon: "🙂", name: "보통",          trust: 0 },
  { min: 20,   icon: "😇", name: "모범 선수",     trust: 1.5 },
  { min: 60,   icon: "🏅", name: "리그의 얼굴",   trust: 3 },
];

const REPUTATION = {
  // 평판 제자리 찾기: 매주 평판 × driftPerWeek 만큼 0 쪽으로 (50이면 주 −0.3, 1년 약 −13)
  driftPerWeek: 0.006,
  // 등급이 오르면 이만큼(주) 동안 평판이 떨어져도 등급이 안 내려감 (하락 유예, 1개월)
  holdWeeks: 4,
  // 엔딩 커리어 점수: 커리어 평균 평판 ÷ endingDiv (최대 ±endingMax) — '인성 점수'
  endingDiv: 4,
  endingMax: 25,
};

// 올스타전 (비시즌 allStar.week주): 포지션마다 팬 투표 상위 2명 → 두 팀으로 나눠 이벤트 경기
// 다른 선수의 '팬 인기' = 20 + (종합 능력 − 1부 주전 평균) × 4 + 올해 개인상 × 15 + 네임드 15 + 올해 우승 팀 10 (0~100)
// 내 선수는 인기도 그대로. 투표 수 = 팬 인기² × votesPer (+ 무작위 ±10%)
const ALL_STAR = {
  week: 49,
  votesPer: 900,
  selected: { popularity: 5, reputation: 2, money: 3000000 }, // 뽑히면 (money는 연봉 3,000만 기준, 이벤트 돈처럼 커짐)
  mvp: { popularity: 4, money: 2000000 },                     // 올스타전 MVP면 추가
  fromYear: 2013,                                            // 이 해부터 올스타전
};
