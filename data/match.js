// 경기력 계산 규칙 (밴픽 + 메타 페널티)
//
// 1) 스탯 점수 = 실력 스탯 12개의 평균 (포지션 가산점 스탯은 1.5배로 계산)
// 2) 밴: 상대가 내 챔피언 중 "숙련도 + 메타 보너스"가 높은 챔피언을 bansAgainstMe 명 금지
// 3) 픽: 남은 챔피언 중 "숙련도 + 메타 보너스"가 가장 높은 챔피언을 고름
// 4) 숙련도 배율 = masteryBase + 숙련도 ÷ masteryScale  (숙련도 1 → 약 0.8배, 100 → 1.2배)
// 5) 메타 페널티 = (metaPenaltyBase − 내 포지션 메타 챔피언 평균 숙련도) ÷ metaPenaltyDiv  (0보다 클 때만)
//    - 패치 후 adaptWeeks 주 동안: 적응력이 높을수록 페널티 감소
//      (적응력 adaptFrom 이하 → 그대로, 적응력이 높을수록 줄어서 adaptFrom + adaptRange 이면 절반)
//    - 같은 기간 '고집' 특성이 있으면 페널티 추가
// 경기력 = 스탯 점수 × 숙련도 배율 − 메타 페널티
//
// ※ 위 계산(밴픽·숙련도·메타 페널티)은 내 선수(유저)만 해당.
//    다른 선수들은 경기마다 경기력 = 스탯 점수 × npcMultiplier 사이 무작위 값
const MATCH = {
  npcMultiplier: [0.8, 1.2],
  bansAgainstMe: 2,
  metaPickBonus: 15,
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
// 2) 한타: 팀 전력 = 5명 평균 + 라인전 보너스 합 + 무작위(±teamRandom)
//    → 전력이 높은 팀이 그 세트 승리
// 3) 3판 2선승 / 5판 3선승은 세트마다 따로 판정
// 내 선수만: 컨디션·체력 영향
//    경기력 × (conditionBase + 컨디션 ÷ conditionDiv)   (컨디션 0 → 0.9배, 50 → 1.0배, 100 → 1.1배)
//    체력이 lowStaminaLimit 미만이면 경기력 × (1 − lowStaminaCut)
//    경기마다 체력 소모: 3판 2선승 staminaCostBo3, 5판 3선승 staminaCostBo5
const TEAM_MATCH = {
  laneWinBonus: 3,
  soloKillGap: 15,
  soloKillBonus: 2,
  teamRandom: 8,
  conditionBase: 0.9,
  conditionDiv: 500,
  lowStaminaLimit: 30,
  lowStaminaCut: 0.1,
  staminaCostBo3: 8,
  staminaCostBo5: 12,
};
