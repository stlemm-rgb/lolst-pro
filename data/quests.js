// 퀘스트: 코치·감독이 주는 과제. {need}회 완료하면 보너스 스탯
// - giver: "coach"(코치) 또는 "manager"(감독)
// - kind: "training"  → training(훈련 id)을 {need}회
//         "metaS"     → 이번 패치 내 포지션 S급 메타 챔피언({champ})을 {need}회 연습 (챔피언 연습·집중 연습으로 숙련도가 오른 주)
//         "metaAny"   → 내 포지션 메타 챔피언 아무나 {need}회 연습
//         "ladderTop" → 리그 솔로 랭크 {need}위 안에 들기 (진행 = 지금 순위, {start} = 받을 때 순위)
// - offseason: true → 평소에는 안 나오고, 우리 팀 시즌이 끝난 주에 바로 받음 (기한: 그 시즌 마지막 주)
// - need: [최소, 최대] 횟수 (없으면 QUEST_RULES.need)
// - reward: 완료 보상 (data/events.js의 효과 이름과 같음: 스탯 id, condition, masteryChamp, masteryMetaAll ...)
// - 글자 바꾸기: {need} 횟수, {champ} 챔피언, {pos} 내 포지션
const QUEST_RULES = {
  maxActive: 2,       // 동시에 받을 수 있는 퀘스트 수
  newChance: 0.5,     // 자리가 비었을 때 매주 새 퀘스트가 올 확률
  deadlineWeeks: 10,  // 기한 (주)
  need: [3, 5],       // 기본 횟수
  masteryDone: 90,    // 챔피언 숙련도가 이 값 이상이면 그 챔피언 연습 퀘스트는 안 나옴
  // 숙련도가 낮으면 챔피언 퀘스트가 더 잘 나옴 (새 퀘스트를 고를 때 비중, 다른 퀘스트는 1)
  //   비중 = 1 + boost × (pivot − 숙련도) ÷ range  (0 ~ boost 사이)  예: pivot 60, range 30, boost 4 → 숙련도 45면 3배, 30 이하면 5배
  //   - 메타 챔피언 준비(metaAny): 내 포지션 메타 챔피언 평균 숙련도로
  //   - S급 메타 장악(metaS)·주력 챔피언 만들기(챔피언 집중 연습): S급 메타 챔피언 숙련도로
  lowMastery: { pivot: 60, range: 30, boost: 4 },
};

// 시즌 마무리: 비시즌 퀘스트를 받은 시즌이 끝날 때(52주차 다음) 체력 회복 (퀘스트 달성 여부와 상관없이)
// 비시즌 솔랭 퀘스트 목표 = 받을 때 순위에서 climb 계단 위 (내 실력에 맞춤)
//   단, 상위권은 지금 순위의 절반까지만 (예: 103위 → 83위, 50위 → 30위, 30위 → 15위, 10위 → 5위, 1위 → 1위)
const OFFSEASON = {
  quest: "q_offseason_ladder",
  staminaRecover: 20,
  climb: 20,
};

const QUEST_GIVERS = { coach: "🧑‍🏫 코치", manager: "👔 감독" };

const QUESTS = [
  { id: "q_solo",  giver: "coach",   kind: "training", training: "solo_rank",  title: "라인전 감각 끌어올리기", desc: "솔로 랭크 훈련을 {need}회 해 와라.",       reward: { laning: 2, reaction: 1 } },
  { id: "q_scrim", giver: "coach",   kind: "training", training: "scrim",      title: "팀 합 맞추기",           desc: "팀 스크림을 {need}회 소화해라.",            reward: { teamfight: 2, shotcall: 1 } },
  { id: "q_replay", giver: "coach",  kind: "training", training: "replay",     title: "리플레이 숙제",           desc: "리플레이 분석을 {need}회 해 와라.",          reward: { vision: 2, focus: 1 } },
  { id: "q_focus", giver: "coach",   kind: "training", training: "champ_focus", title: "주력 챔피언 만들기",     desc: "챔피언 집중 연습을 {need}회 해라.",          reward: { accuracy: 1, spacing: 1, pool: 1 } },
  { id: "q_meta_s", giver: "manager", kind: "metaS",                            title: "S급 메타 장악",           desc: "이번 패치 S급 '{champ}'을(를) {need}회 연습해라.", reward: { masteryChamp: 5, adapt: 2 } },
  { id: "q_meta_any", giver: "coach", kind: "metaAny",                          title: "메타 챔피언 준비",        desc: "{pos} 메타 챔피언을 {need}회 연습해라.",     reward: { masteryMetaAll: 2, pool: 2 } },
  { id: "q_offseason_ladder", giver: "coach", kind: "ladderTop", offseason: true, title: "비시즌 솔랭 순위 올리기", desc: "시즌은 끝났지만 손은 놀리지 마라. 시즌 마지막 주까지 리그 솔로 랭크 {need}위 안에 들어라. (지금 {start}위)", reward: { reaction: 1, accuracy: 1, laning: 1 } },
  { id: "q_rest",  giver: "manager", kind: "training", training: "rest", need: [2, 2], title: "컨디션 관리", desc: "무리하지 말고 {need}회 쉬어라.",           reward: { mental: 2, condition: 8 } },
];
