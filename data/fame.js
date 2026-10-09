// ===== 인기도 · 평판 (js/fame.js) — 2026-10-07 =====

const FAME = {
  // 팬 수 = 인기도² × fansSquare + 인기도 × fansLinear  (인기도 10 → 약 4만, 50 → 80만, 100 → 310만 명)
  fansSquare: 300,
  fansLinear: 1000,
  // (158) 팬 수는 따로 쌓임 (state.fame.fans): 인기도가 오를 때마다 늘고, 인기도 100이어도 오르는 만큼 계속 늘어남
  //   인기도 1 오를 때 팬 = max(인기도×600+1000, 지금 팬 × perPointPct)  → 팬이 많을수록 더 빨리 늘어남 (팬이 팬을 부름)
  //   인기도가 떨어지면 그만큼의 lossShare만 줄어듦 (단, 위 공식의 '인기도 기준 팬 수' 아래로는 안 내려감)
  //   1억(softCap)을 넘으면 늘어나는 양 × (1억 ÷ 지금 팬)² → 완만해짐
  perPointPct: 0.002,
  lossShare: 0.5,
  softCap: 100000000,
  // 우승하면 팬 추가: 지금 팬의 pct 또는 인기도 pts만큼 중 큰 쪽 (국제대회가 더 큼)
  titleFans: {
    cup:        { pct: 0.03, pts: 5 },
    playoffs:   { pct: 0.06, pts: 15 },
    firststand: { pct: 0.06, pts: 15 },
    msi:        { pct: 0.10, pts: 20 },
    worlds:     { pct: 0.15, pts: 30 },
  },
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

// ----- 팬 수 돌파 공중파 뉴스 (158) — 신문 기사 팝업 (js/fame.js checkFanMilestones) -----
// 팬 수가 at을 처음 넘은 주에 기사 1개 (articles 중 무작위). 다른 AI가 글을 더 써 넣어도 됨 (같은 모양으로 articles에 추가)
// 글자 바꾸기: {me} 내 선수 이름, {myTeam} 우리 팀, {fans} 지금 팬 수(예: 1,024만 명), {year} 연도, {pos} 포지션, {titles} 우승 횟수 요약
const FAN_MILESTONES = [
  { at: 10000000, label: "1,000만", icon: "📺", articles: [
    { headline: "📺 저녁 뉴스에 나온 프로게이머, 팬 1,000만 돌파", body: "{me}의 팬이 {fans}을 넘어섰다. 공중파 저녁 뉴스는 '게임 하나로 1,000만 명을 모은 청년'이라며 {myTeam}의 {pos} {me}을(를) 3분 넘게 소개했다. 경기장 밖에서도 그를 알아보는 사람이 부쩍 늘었다." },
  ] },
  { at: 50000000, label: "5,000만", icon: "📡", articles: [
    { headline: "📡 9시 뉴스 톱기사: {me} 팬 5,000만 명", body: "공중파 9시 뉴스가 첫 꼭지로 {me}을(를) 다뤘다. 팬 수 {fans}, 국내 인구에 맞먹는 숫자다. 앵커는 '이제 e스포츠 선수가 아니라 국민 스타'라고 표현했다. {titles}" },
  ] },
  { at: 100000000, label: "1억", icon: "🌐", articles: [
    { headline: "🌐 전 세계 팬 1억 명, {me} 특집 다큐 방영", body: "{me}의 팬이 마침내 {fans}을 돌파했다. 공중파 방송사는 특집 다큐멘터리를 편성했고, 해외 언론도 '한 시대를 상징하는 선수'라며 앞다퉈 보도했다. 이제부터 팬 수는 천천히 늘어나지만, 이름은 이미 역사에 남았다." },
  ] },
];
