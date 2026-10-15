// ===== 훈련 대성공 (182, 사용자 피드백 '도파민용 대성공') — 코드는 js/great.js =====
// 시안 9 (Claude outputs/design_mockup_9.html) 사용자 확정
const GREAT_RULES = {
  base: 0.07,            // 기본 확률
  condMin: 80,           // 컨디션이 이 이상이면
  condBonus: 0.02,       //   +2%
  coach: [0.03, 0.02, 0.01, 0.005, 0], // 구단 코치 등급 S·A·B·C·D
  gearPer: 0.003,        // 장비 단계 합 1당 +0.3%
  streakBonus: 0.03,     // 불타는 손(2주 연속 대성공 뒤)이면 +3%
  max: 0.15,             // 최대 (불타는 손 제외)
  tiredMult: 0.5,        // 너무 지친 주(훈련 효과 절반)는 확률 절반
  mult: 2,               // 대성공이면 그 주 오른 스탯·숙련도 ×2
};
const GREAT_TEXTS = {
  title: "대성공!",
  sub: "오른 스탯 2배",
  report: "🔥 손이 미친 듯이 풀린 한 주! 오른 스탯이 2배.",
  streak: "🔥 불타는 손! {n}주 연속 대성공 · 다음 주 확률 +3%",
  fireTip: "{n}주 연속 대성공 · 이번 주 대성공 확률 +3% (대성공이 끊기면 사라져요)",
  ok: "좋아! ▶",
};
