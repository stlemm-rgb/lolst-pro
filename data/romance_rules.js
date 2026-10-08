// ===== 연애 요소 규칙 (128) — 엔진 js/romance.js, 대상·대사·연락 글은 data/romance.js =====
// 부가 재미 요소: 연락 수·효과를 작게. 설정에서 끌 수 있음 (state.romance.off)
const ROMANCE_RULES = {
  minPopularity: 40,     // 이 인기도부터 다가옴 (대상마다 unlock이 따로 있음)
  perYear: 6,            // 1년 연애 연락 최대 수 (사생팬·스토커 포함)
  weeklyChance: 0.2,     // 연락이 올 수 있는 주에 실제로 올 확률 (그 주에 다른 선택지 연락이 없을 때만)
  newPerYear: 2,         // 1년에 새로 다가오는 사람 수
  warmFrom: 10,          // 호감 이 이상인 사람과는 관계를 이어 가는 연락(데이트·선물)이 먼저
  warmChance: 0.7,       // 새 만남이 가능해도 이 확률로 기존 관계를 이어 감
  sameGap: 4,            // 같은 사람의 연락은 최소 이 주 간격
  stage: { crush: 30, confess: 60, crisis: 25 },  // 썸 30↑ · 고백 60↑ · 연애 중 25 아래면 이별 위기
  ignorePenalty: 5,      // 답하지 않고 지나간 연애 연락마다 호감 −
  breakupCooldown: 12,   // 결별 뒤 이 주 동안 새 연애 연락 없음
  exLockWeeks: 52,       // 헤어진 상대는 1년 동안 다시 안 다가옴
  rivalChance: 0.25,     // 연애 중 다른 대상 공세 확률 (연애 중 연락 고를 때)
  rumorChance: 0.3,      // 몰래 연애 중 열애설 확률
  annivWeeks: 26,        // 사귄 지 이 주가 지나면 기념일
  sasaeng: { pop: 60, chance: 0.08 },  // 사생팬 (연애 대상 아님)
  stalker: { pop: 70, chance: 0.04 },  // 스토커 (연애 대상 아님)
  officeTargets: ["manager", "trainer"], // 사내 연애: 공개되면(열애설 포함) 팀 내 입지 −officePenalty (그 팀에 있는 동안)
  officePenalty: 5,
};
