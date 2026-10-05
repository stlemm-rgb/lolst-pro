// 퀘스트: 코치·감독이 주는 과제. {need}회 완료하면 보너스 스탯
// - giver: "coach"(코치) 또는 "manager"(감독)
// - kind: "training"  → training(훈련 id)을 {need}회
//         "metaS"     → 이번 패치 내 포지션 S급 메타 챔피언({champ})을 {need}회 연습 (챔피언 연습·집중 연습으로 숙련도가 오른 주)
//         "metaAny"   → 내 포지션 메타 챔피언 아무나 {need}회 연습
// - need: [최소, 최대] 횟수 (없으면 QUEST_RULES.need)
// - reward: 완료 보상 (data/events.js의 효과 이름과 같음: 스탯 id, condition, masteryChamp, masteryMetaAll ...)
// - 글자 바꾸기: {need} 횟수, {champ} 챔피언, {pos} 내 포지션
const QUEST_RULES = {
  maxActive: 2,       // 동시에 받을 수 있는 퀘스트 수
  newChance: 0.5,     // 자리가 비었을 때 매주 새 퀘스트가 올 확률
  deadlineWeeks: 10,  // 기한 (주)
  need: [3, 5],       // 기본 횟수
};

const QUEST_GIVERS = { coach: "🧑‍🏫 코치", manager: "👔 감독" };

const QUESTS = [
  { id: "q_solo",  giver: "coach",   kind: "training", training: "solo_rank",  title: "라인전 감각 끌어올리기", desc: "솔로 랭크 훈련을 {need}회 해 와라.",       reward: { laning: 2, reaction: 1 } },
  { id: "q_scrim", giver: "coach",   kind: "training", training: "scrim",      title: "팀 합 맞추기",           desc: "팀 스크림을 {need}회 소화해라.",            reward: { teamfight: 2, shotcall: 1 } },
  { id: "q_replay", giver: "coach",  kind: "training", training: "replay",     title: "리플레이 숙제",           desc: "리플레이 분석을 {need}회 해 와라.",          reward: { vision: 2, focus: 1 } },
  { id: "q_focus", giver: "coach",   kind: "training", training: "champ_focus", title: "주력 챔피언 만들기",     desc: "챔피언 집중 연습을 {need}회 해라.",          reward: { accuracy: 1, spacing: 1, pool: 1 } },
  { id: "q_meta_s", giver: "manager", kind: "metaS",                            title: "S급 메타 장악",           desc: "이번 패치 S급 '{champ}'을(를) {need}회 연습해라.", reward: { masteryChamp: 10, adapt: 2 } },
  { id: "q_meta_any", giver: "coach", kind: "metaAny",                          title: "메타 챔피언 준비",        desc: "{pos} 메타 챔피언을 {need}회 연습해라.",     reward: { masteryMetaAll: 4, pool: 2 } },
  { id: "q_rest",  giver: "manager", kind: "training", training: "rest", need: [2, 3], title: "컨디션 관리", desc: "무리하지 말고 {need}회 쉬어라.",           reward: { mental: 2, condition: 8 } },
];
