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
const MATCH = {
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
