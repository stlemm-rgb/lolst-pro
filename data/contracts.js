// 연봉·계약·이적 규칙 (5단계)
const CONTRACT = {
  // 연봉 = 기본급 + (스탯 점수 − scorePivot) × perScorePoint + 인기도 × perPopularity  (원)
  baseSalary: { 1: 30000000, 2: 10000000 },  // 1부 3,000만 / 2부 1,000만
  scorePivot: 50,
  perScorePoint: 2000000,                     // 스탯 점수 1점당 200만
  perPopularity: 500000,                      // 인기도 1당 50만 (내 선수만)
  minSalary: 5000000,                         // 최저 연봉 500만

  teamBudget: { 1: 600000000, 2: 200000000 }, // 구단 연봉 예산 (1부 6억 / 2부 2억)
  years: [1, 3],                              // 계약 기간 (년)

  // 이적 시장
  windowStart: 47,          // 비시즌 시작 주 (재계약·이적 제안이 오는 주)
  windowEnd: 52,            // 이적 시장 마감
  maxOffers: 3,             // 다른 구단 제안 최대 개수
  offerSalaryBonus: [1.0, 1.2], // 다른 구단은 공식 연봉의 1.0~1.2배를 제안
  myRequests: 3,            // 비시즌마다 내가 보낼 수 있는 이적 요청 횟수
  requestMargin: 0,         // 이적 요청: 그 팀 주전보다 스탯 점수가 이만큼 이상 높아야 받아줌
  noRenewalReputation: -30, // 평판이 이보다 낮으면 재계약 제안이 안 올 수 있음

  // 협상
  raiseRate: [0.1, 0.15],   // 연봉 인상 요청이 받아들여지면 10~15% 인상
  negotiateBase: 0.4,       // 협상 성공률 = 40% + 평판 ÷ 200  (평판 60이면 70%)

  // ----- 내 연봉 책정 (재계약·영입 제안·이적 요청) — 제안 글에 계산 내역이 보여요 -----
  // 연봉 = (기본급 + 실력 + 인기도) × (1 + 평판 보정 + 시즌 성적 프리미엄 + 특성) × (영입이면 구단 보너스)
  reputationPct: 0.1,       // 평판 100이면 +10%, −100이면 −10%
  // 시즌 성적 프리미엄/역프리미엄 (이번 시즌 기록 기준. 합계는 premiumClamp 안으로)
  premium: {
    titles: { worlds: 0.20, playoffs: 0.12, cup: 0.05 },               // 우승
    awards: { mvp: 0.20, worldsfmvp: 0.12, tier2mvp: 0.10, fmvp: 0.08, allpro: 0.08, rookie: 0.05, cupfmvp: 0.04 }, // 개인상
    rank: { 1: [[2, 0.05], [8, 0], [10, -0.08]], 2: [[2, 0.05], [6, 0], [8, -0.05]] }, // 팀 최종 순위: [이 순위까지, 값] (우승 못 했을 때)
    ratingPivot: 6.0,        // 시즌 평균 평점이 이보다 높으면 +, 낮으면 −
    ratingPer: 0.10,         // 평점 1점당 ±10%
    ratingMax: 0.15,         // 평점 프리미엄 최대 ±15%
    minSets: 10,             // 평점은 이 세트 이상 뛰었을 때만 반영
    benched: -0.10,          // 지금 2군(후보)이면
    fewGames: -0.05,         // 시즌 세트가 minSets보다 적으면 (출전 부족)
  },
  premiumClamp: [-0.30, 0.60],

  // 출전 보장 조항: 이 경기 수를 채울 때까지 2군행 없음
  guaranteeGames: { 1: 20, 2: 12 }, // 1부 시즌 20경기 / 2부 12경기
  guaranteeChance: 0.3,             // 구단 제안에 처음부터 들어 있을 확률

  // 주전 ↔ 후보 (2군행 / 승격)
  benchCheckEvery: 4,       // 4주마다 판정
  benchGap: 5,              // 같은 포지션 팀원이 스탯 점수 5 이상 높으면 2군행
  benchTalkWeeks: 8,        // 후보로 8주 넘으면 이적 상담 이벤트
  benchPopularityLoss: 1,   // 후보일 때 4주마다 인기도 −1

  // 다른 선수(NPC) 계약
  npcRenewChance: 0.7,      // 계약이 끝난 NPC가 같은 팀과 재계약할 확률
};

// 감독·구단 메시지 문장 ({name} 내 선수, {rival} 경쟁 선수, {team} 팀)
const CONTRACT_TEXTS = {
  benchTitle: "감독: 후보 통보 (2군행)",
  bench: "감독: \"다음 경기부터는 {rival}이(가) 주전으로 나간다. 너는 당분간 후보로 준비해라.\"",
  promoteTitle: "감독: 주전 복귀 (승격)",
  promote: "감독: \"요즘 폼이 좋다. 다음 경기부터 다시 주전이다.\"",
  noRenewalTitle: "재계약 제안 없음",
  noRenewal: "{team}에서 재계약 이야기가 없다. 이번 시즌이 끝나면 FA가 된다. 다른 구단의 제안이나 이적 요청을 알아보자.",
  forcedTitle: "FA 계약",
  forced: "새 시즌까지 계약이 정해지지 않아, {team}과(와) 1년 계약을 맺었다.",
};
