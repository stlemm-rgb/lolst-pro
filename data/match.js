// 경기력 계산 규칙 (밴픽 + 메타 페널티)
//
// 1) 스탯 점수 = 실력 스탯 12개의 평균 (포지션 가산점 스탯은 1.5배로 계산)
// 2) 밴: 상대가 내 챔피언 중 "숙련도 + 메타 보너스"가 높은 챔피언을 bansAgainstMe 명 금지
// 3) 픽: 남은 챔피언 중 "숙련도 + 메타 보너스"가 가장 높은 챔피언을 고름
//    (메타 보너스는 S급이 더 큼. 메타 챔피언을 고르면 경기력 보너스도 있음: S급 +8%, A급 +3%)
// 4) 숙련도 배율 = masteryBase + 숙련도 ÷ masteryScale  (숙련도 1 → 약 0.8배, 100 → 1.2배)
// 5) 메타 페널티 = (metaPenaltyBase − 내 포지션 메타 챔피언 평균 숙련도) ÷ metaPenaltyDiv  (0보다 클 때만)
//    - 패치 후 adaptWeeks 주 동안: 적응력이 높을수록 페널티 감소
//      (적응력 adaptFrom 이하 → 그대로, 적응력이 높을수록 줄어서 adaptFrom + adaptRange 이면 절반)
//    - 같은 기간 '고집' 특성이 있으면 페널티 추가
// 경기력 = 스탯 점수 × 숙련도 배율 × (1 + 메타 등급 보너스) − 메타 페널티
//
// ※ 다른 선수들도 같은 계산 (자기 숙련도로 밴픽, js/npc_mastery.js)
//    + 세트마다 npcMultiplier 사이 무작위 흔들림
const MATCH = {
  npcMultiplier: [0.9, 1.1],   // 다른 선수 세트마다 흔들림 (숙련도·메타는 따로 계산, js/npc_mastery.js)
  bansAgainstMe: 2,                      // [나의 커리어] 경기력 미리보기에서 가정하는 밴 수
  // 실제 경기의 밴: 경기마다 상대가 내 챔피언을 몇 명 밴할지 [밴 수, 확률]
  banCount: [[0, 0.15], [1, 0.35], [2, 0.35], [3, 0.15]],
  // 밴 대상: 상대가 경계하는 순서(숙련도 + 메타) 상위 5명 중에서, 앞쪽일수록 잘 뽑힘 (비율)
  banWeights: [40, 25, 15, 12, 8],
  // 메타 등급: 포지션마다 메타 5명 중 1명은 S급, 나머지는 A급
  metaPickBonus: { S: 25, A: 15 },      // 밴픽 때 "숙련도 + 이 값"으로 가치를 매김
  metaPowerBonus: { S: 0.08, A: 0.03 }, // 고른 챔피언이 메타면 경기력 +8% / +3%
  metaSWeight: 2,                        // 메타 페널티 계산 때 S급 숙련도는 2배로 셈
  // 조커픽: 메타가 아닌 챔피언인데 숙련도가 jokerMinMastery 이상이면
  //   - 상대가 예상 못 해서 밴에서 빠지기 쉬움 (밴할 때 메타가 아닌 챔피언은 숙련도 −jokerBanDiscount로 봄)
  //   - 고를 때는 가치 +jokerPickBonus, 고르면 경기력 +jokerPowerBonus
  jokerMinMastery: 70,
  jokerPickBonus: 15,
  jokerBanDiscount: 30,
  jokerPowerBonus: 0.05,
  masteryBase: 0.8,
  masteryScale: 250,
  metaPenaltyBase: 60,
  metaPenaltyDiv: 4,
  adaptWeeks: 4,
  adaptFrom: 40,
  adaptRange: 40,
};

// 팀 경기 판정: 라인 맞대결 방식 (3단계에서 사용)
// 1) 라인전: 같은 포지션끼리 경기력 비교 → 이긴 쪽 팀에 laneWinBonus
//    차이가 soloKillGap 이상이면 "솔로킬"로 soloKillBonus 추가
// 2) 운영·한타: 5명의 운영·오더·시야·한타·거리 조절 평균이 teamplayBase보다 높은 만큼 × teamplayWeight
// 3) 팀 전력 = 5명 경기력 평균 + 라인전 보너스 합 + 운영·한타 + 무작위(±teamRandom)
//    → 전력이 높은 팀이 그 세트 승리
// 4) 3판 2선승 / 5판 3선승은 세트마다 따로 판정
// (2026-10-06) 라인전이 너무 중요해서 라인전 보너스를 3 → 1.5, 솔로킬 2 → 1로 줄이고 운영·한타 점수를 추가
// 내 선수만: 컨디션·체력 영향
//    경기력 × (conditionBase + 컨디션 ÷ conditionDiv)   (컨디션 0 → 0.9배, 50 → 1.0배, 100 → 1.1배)
//    체력이 lowStaminaLimit 미만이면 경기력 × (1 − lowStaminaCut)
//    경기마다 체력 소모: 3판 2선승 staminaCostBo3, 5판 3선승 staminaCostBo5
// 스탯별 고유 역할 (경기 판정, 나와 다른 선수 모두) — 기준값(pivot)보다 높으면 좋고 낮으면 나쁨
// - 라인전: 라인 맞대결에서만 경기력 + (라인전 − pivot) × lanePer
// - 반응속도: 솔로킬 당하는 기준이 (반응속도 − pivot) × reactionPer 만큼 어려워짐 (낮으면 쉬워짐)
// - 입력 정확도: 경기력 흔들림 중 "못하는 쪽"을 줄임. (정확도 − 40) ÷ 100 비율만큼 (최대 accuracyMax)
// - 멘탈: 세트 스코어에서 지고 있을 때 경기력 −(pivot − 멘탈) × mentalPer (멘탈이 기준보다 높으면 영향 없음)
//         내 선수는 패배 후 컨디션 하락도 줄어듦: 멘탈 50 → 그대로, 90 → 60%만 (최소 mentalLossMin)
// - 집중력: 3세트부터 경기력 + (집중력 − pivot) × focusPer
const STAT_ROLES = {
  pivot: 60,
  lanePer: 0.15,
  reactionPer: 0.1,
  accuracyMax: 0.5,
  mentalPer: 0.002,
  mentalLossMin: 0.4,
  focusPer: 0.002,
  focusFromSet: 3,
};

const TEAM_MATCH = {
  laneWinBonus: 1.5,
  soloKillGap: 15,
  soloKillBonus: 1,
  teamplayStats: ["macro", "shotcall", "vision", "teamfight", "spacing"],
  teamplayBase: 60,
  teamplayWeight: 0.35,
  teamRandom: 8,
  conditionBase: 0.9,
  conditionDiv: 500,
  lowStaminaLimit: 30,
  lowStaminaCut: 0.1,
  staminaCostBo3: 8,
  staminaCostBo5: 12,
};
