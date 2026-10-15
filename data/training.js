// ===== data/training.js — 훈련: 퀘스트·훈련 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 data/quests.js) ━━━━━
// 퀘스트: 코치·감독이 주는 과제. {need}회 완료하면 보너스 스탯
// - giver: "coach"(코치) 또는 "manager"(감독)
// - kind: "training"  → training(훈련 id)을 {need}회
//         "metaS"     → 이번 패치 내 포지션 S급 메타 챔피언({champ})을 {need}회 연습 (챔피언 연습·집중 연습으로 숙련도가 오른 주)
//         "metaAny"   → 내 포지션 메타 챔피언 아무나 {need}회 연습
//         "ladderTop" → 리그 솔로 랭크 {need}위 안에 들기 (진행 = 지금 순위, {start} = 받을 때 순위)
// - offseason: true → 평소에는 안 나오고, 우리 팀 시즌이 끝난 주에 바로 받음 (기한: 그 시즌 마지막 주)
// - need: [최소, 최대] 횟수 (없으면 QUEST_RULES.need)
// - maxStamina: 체력이 이 값 이하일 때만 나옴 (예: 컨디션 관리 = 체력 40 이하)
// - reward: 완료 보상 (data/events.js의 효과 이름과 같음: 스탯 id, condition, masteryChamp, masteryMetaAll ...)
// - 글자 바꾸기: {need} 횟수, {champ} 챔피언, {pos} 내 포지션
const QUEST_RULES = {
  maxActive: 2,       // 동시에 받을 수 있는 퀘스트 수
  newChance: 0.5,     // 자리가 비었을 때 매주 새 퀘스트가 올 확률
  deadlineWeeks: 10,  // 기한 (주)
  need: [3, 5],       // 기본 횟수
  bigNeed: 5,         // 지금 받은 퀘스트 중 이 횟수 이상짜리가 있으면
  capAfterBig: 3,     // 새 퀘스트 횟수는 최대 이만큼 (5회 퀘스트 두 개가 겹치지 않게)
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
  { id: "q_biggame", giver: "manager", kind: "bigWin", special: true, title: "빅게임 승리", desc: "이번 주는 {derby}! {opp}만큼은 꼭 이겨라.", reward: { mental: 2, focus: 1 } }, // 빅게임 주에만 (js/rivals.js)
  { id: "q_rest",  giver: "manager", kind: "training", training: "rest", need: [2, 2], maxStamina: 40, title: "컨디션 관리", desc: "무리하지 말고 {need}회 쉬어라.",           reward: { mental: 2, condition: 8 } },
];

// ━━━━━ (예전 data/training.js) ━━━━━
// 훈련 종류
// - id: 코드에서 쓰는 이름 (영어, 바꾸지 마세요)
// - name / desc: 화면에 보이는 이름과 설명
// - effects: 일주일 뒤 바뀌는 값. [최소, 최대] 사이에서 무작위로 정해집니다.
//     스탯 id(accuracy, laning, ... data/player.js 참고) 또는
//     stamina(체력), condition(컨디션), popularity(인기도), reputation(평판),
//     mastery(챔피언 숙련도, 여러 명), masteryFocus(고른 챔피언 1명 숙련도),
//     masteryMeta(메타 챔피언 중 숙련도가 가장 낮은 1명 — 다른 훈련도 메타 챔피언으로 하니까 조금씩)를 쓸 수 있어요.
//     스탯 상승에는 포지션 가산점·시작 유형·특성 보너스가 붙습니다.
// - ladderGames: 그 주에 솔로 랭크(가상 래더)를 몇 판 하는지. 승패에 따라 래더 점수가 오르내려요.
// - messages: 결과 문장 후보. 이 중 하나가 무작위로 나옵니다.
const TRAININGS = [
  {
    id: "solo_rank",
    ladderGames: 12,  // 이번 주 솔로 랭크 판 수 (가상 래더)
    name: "솔로 랭크",
    desc: "랭크 게임을 쉬지 않고 돌리며 손을 단련한다.",
    effects: {
      accuracy: [1, 2],
      reaction: [1, 2],
      laning:   [1, 2],
      masteryMeta: [1, 3],  // 랭크도 메타 챔피언으로 (메타 챔피언 1명 숙련도 조금)
      stamina:  [-8, -5],
    },
    messages: [
      "하루 열 시간씩 랭크를 돌렸다. 손이 조금 더 빨라진 느낌이다.",
      "연패 끝에 연승. 라인전 감각이 살아났다.",
      "새벽까지 이어진 랭크 게임. 피곤하지만 얻은 것이 많다.",
    ],
  },
  {
    id: "scrim",
    ladderGames: 3,  // 이번 주 솔로 랭크 판 수 (가상 래더)
    name: "팀 스크림",
    desc: "다른 팀과 연습 경기를 하며 팀플레이를 맞춘다.",
    effects: {
      teamfight: [1, 2],
      macro:     [1, 2],
      shotcall:  [1, 2],
      masteryMeta: [1, 3],  // 스크림도 메타 챔피언으로
      stamina:   [-8, -5],
    },
    messages: [
      "스크림에서 한타 호흡이 잘 맞았다.",
      "연습 경기에서 크게 졌지만, 운영의 빈틈을 찾았다.",
      "콜을 더 크게, 더 빨리. 목이 쉬도록 소리쳤다.",
    ],
  },
  {
    id: "replay",
    ladderGames: 2,  // 이번 주 솔로 랭크 판 수 (가상 래더)
    name: "리플레이 분석",
    desc: "지난 경기와 상대 경기를 돌려 보며 공부한다.",
    effects: {
      vision:  [1, 2],
      spacing: [1, 2],
      focus:   [1, 2],
      masteryMeta: [1, 2],  // 메타 챔피언 경기를 보며 공부
      stamina: [-4, -3],
    },
    messages: [
      "리플레이를 돌려 보며 실수를 하나씩 고쳤다.",
      "상위 선수의 와드 위치를 전부 노트에 적었다.",
      "한 장면을 스무 번 넘게 돌려 봤다. 거리 감각이 잡힌다.",
    ],
  },
  {
    id: "champion",
    ladderGames: 5,  // 이번 주 솔로 랭크 판 수 (가상 래더)
    name: "챔피언 연습",
    desc: "여러 챔피언을 고루 연습한다. 자동이면 메타 챔피언 3명에게 나눠서, 한 명을 고르면 그 챔피언만.",
    effects: {
      pool:     [1, 3],
      adapt:    [1, 2],
      mastery:  [3, 5],     // 챔피언 숙련도 (2026-10-06 절반으로 낮춤)
      stamina:  [-6, -4],
    },
    messages: [
      "처음 써 보는 챔피언으로 열 판을 했다. 이제 좀 손에 익는다.",
      "요즘 뜨는 챔피언을 미리 연습해 뒀다.",
      "콤보 연습만 수백 번. 손가락이 기억하기 시작했다.",
    ],
  },
  {
    id: "champ_focus",
    ladderGames: 4,  // 이번 주 솔로 랭크 판 수 (가상 래더)
    name: "챔피언 집중 연습",
    desc: "챔피언 한 명만 골라 하루 종일 파고든다. 그 챔피언 숙련도가 크게 오른다.",
    effects: {
      masteryFocus: [6, 9],  // 고른 챔피언 숙련도 (2026-10-06 절반으로 낮춤)
      pool:         [0, 1],
      stamina:      [-6, -4],
    },
    messages: [
      "한 챔피언만 백 판. 이제 눈 감고도 콤보가 나온다.",
      "프로 장인의 영상을 프레임 단위로 따라 했다.",
      "같은 챔피언 상대 매치업을 하나씩 전부 연습했다.",
    ],
  },
  {
    id: "rest",
    ladderGames: 0,  // 이번 주 솔로 랭크 판 수 (가상 래더)
    name: "휴식",
    desc: "푹 쉬면서 체력과 컨디션을 회복한다.",
    effects: {
      stamina:   [25, 35],
      condition: [5, 10],
      mental:    [0, 1],
    },
    messages: [
      "오랜만에 늦잠을 자고 산책을 했다. 머리가 맑아졌다.",
      "친구들과 맛있는 걸 먹으며 기분 전환을 했다.",
      "모니터를 끄고 하루 종일 푹 쉬었다.",
    ],
  },
];
