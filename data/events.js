// ===== 이벤트 (SNS로 오는 연락과 소식) =====
//
// 이벤트 하나의 모양
// - id: 코드에서 쓰는 이름 (영어, 겹치면 안 돼요)
// - tab: "inbox"(받은 연락, 선택지 있음) 또는 "news"(소식, 읽기만)
// - title / text: 화면에 보이는 제목과 내용. 아래 글자는 자동으로 바뀌어요.
//     {name} 내 선수 이름, {team} 내 팀, {pos} 내 포지션, {champ} 관련 챔피언, {opp} 상대 팀
// - trigger: 언제 오는지
//     "random"       매주 정해진 확률(EVENT_RULES.randomChance)로 무작위 이벤트 중 하나
//     "afterWin"     내 팀이 이긴 주
//     "soloKills"    한 주에 솔로킬 2회 이상
//     "loseStreak3"  3연패가 된 주       "loseStreak4" 4연패 이상인 주
//     "preFinal"     4강에서 이겨 다음 주 결승이 정해졌을 때 (컵 대회는 같은 주라 제외)
//     "champion"     내 팀이 우승한 주
//     "newChamp"     내 포지션 새 챔피언이 나온 주
//     "patch"        패치 주           "patchNerf" 패치로 내 숙련도 1위 챔피언이 메타에서 빠졌을 때
//     "lowCondition" 컨디션 30 이하     "highCondition" 컨디션 90 이상
//     "lowStamina"   체력 20 이하
// - chance: 조건이 맞을 때 실제로 올 확률 (0.3 = 30%). 없으면 100%
// - need: 추가 조건 { minPopularity, minAge, trait(이 특성이 있어야), noTrait(이 특성이 없어야) }
// - cooldown: 같은 이벤트가 다시 오기까지 쉬는 주 (없으면 EVENT_RULES.cooldown)
// - effects: (소식) 읽으면 바로 적용되는 효과
// - choices: (받은 연락) 선택지 [{ label, effects, risk, cure, note }]
//
// 효과(effects)에 쓸 수 있는 것
//   스탯 id(accuracy, laning, ... mental ...), stamina, condition, popularity, reputation
//   money: 자금(원)
//   masteryMetaAll: 내 포지션 메타 챔피언 전부 숙련도 +n
//   masteryMetaOne: 내 포지션 메타 챔피언 중 숙련도가 가장 낮은 1명 +n
//   masteryChamp:   이벤트에 나온 챔피언({champ}) 숙련도 +n
//   skipTraining: true  → 다음 주 훈련 없음 (쉼)
//   matchBoost: 0.05    → 다음 경기 경기력 +5%
// risk: { trait, chance }  나쁜 특성이 생길 확률 (⚠️ 최대 0.05)
// cure: { trait, chance }  나쁜 특성이 없어질 확률 (💚)
// gain: { trait, chance }  좋은 특성을 얻을 확률

const EVENT_RULES = {
  randomChance: 0.25,   // 매주 무작위 이벤트가 올 확률
  cooldown: 8,          // 같은 이벤트가 다시 오기까지 최소 주
  ignoreAfterWeeks: 4,  // 답하지 않으면 이 주 뒤에 자동으로 "무시"
  maxRisk: 0.05,        // 나쁜 특성 확률 상한 (데이터에 더 높게 적어도 이 값으로 잘림)
  keepMessages: 120,    // SNS에 남겨 둘 메시지 수
};

const EVENTS = [
  // ===== A. 경기·성적 =====
  {
    id: "interview", tab: "inbox", trigger: "afterWin", chance: 0.3,
    title: "경기 후 인터뷰 요청",
    text: "기자: \"{name} 선수, 오늘 경기 정말 인상적이었는데요. 한마디 해 주시겠어요?\"",
    choices: [
      { label: "\"팀원들 덕분이에요.\"", effects: { reputation: 3 } },
      { label: "\"상대가 생각보다 약하던데요?\"", effects: { popularity: 4, reputation: -5 }, risk: { trait: "scandal", chance: 0.03 } },
      { label: "정중히 거절한다", effects: {} },
    ],
  },
  {
    id: "solo_praise", tab: "news", trigger: "soloKills",
    title: "커뮤니티: \"{name} 라인전 미쳤다\"",
    text: "이번 주 경기에서 나온 솔로킬 장면이 커뮤니티 인기 글에 올랐다. \"{pos} 라인전은 {name}이 리그 최고\"라는 반응.",
    effects: { popularity: 2 },
  },
  {
    id: "lose_blame", tab: "news", trigger: "loseStreak3", need: { noTrait: "steel_mental" },
    title: "커뮤니티: \"{team} 이대로 괜찮나\"",
    text: "3연패에 빠진 {team}. 커뮤니티에는 날 선 비판 글이 이어지고 있다. 일부는 {name}의 경기력을 문제 삼았다.",
    effects: { condition: -3 },
  },
  {
    id: "slump", tab: "inbox", trigger: "loseStreak4",
    title: "슬럼프",
    text: "요즘 손이 안 풀린다. 연습을 해도 결과가 안 나온다. 어떻게 할까?",
    choices: [
      { label: "이를 악물고 더 연습한다", effects: { stamina: -15, mental: 2 }, risk: { trait: "glass_mental", chance: 0.03 } },
      { label: "감독님과 상담한다", effects: { condition: 10 } },
      { label: "며칠 완전히 쉰다", effects: { stamina: 20, condition: 5, skipTraining: true }, note: "다음 주 훈련 없음" },
    ],
  },
  {
    id: "pre_final", tab: "inbox", trigger: "preFinal", cooldown: 1,
    title: "결승 전날 밤",
    text: "내일은 결승이다. 숙소가 조용하다. 오늘 밤 어떻게 보낼까?",
    choices: [
      { label: "평소대로 보낸다", effects: {} },
      { label: "밤새 상대를 연구한다", effects: { masteryMetaAll: 5, stamina: -10 } },
      { label: "일찍 잔다", effects: { condition: 8 } },
    ],
  },
  {
    id: "champion_news", tab: "news", trigger: "champion", cooldown: 1,
    title: "📰 {team}, 우승!",
    text: "{team}이(가) 정상에 올랐다. 팬들은 {name}의 이름을 연호했다.",
    effects: { popularity: 5, reputation: 3 },
  },

  // ===== B. 챔피언·메타 =====
  {
    id: "new_champ", tab: "inbox", trigger: "newChamp", cooldown: 1,
    title: "새 챔피언 '{champ}' 연구",
    text: "새 챔피언 '{champ}'이(가) 나왔다. 팀에서 먼저 연구해 보자는 말이 나온다.",
    choices: [
      { label: "내가 먼저 파 본다", effects: { masteryChamp: 15, stamina: -8 } },
      { label: "지금 하던 챔피언에 집중한다", effects: { masteryMetaAll: 5 } },
    ],
  },
  {
    id: "patch_study", tab: "inbox", trigger: "patch", chance: 0.6, cooldown: 1,
    title: "패치 분석 회의",
    text: "새 패치가 나왔다. 코치진이 분석 회의를 연다고 한다.",
    choices: [
      { label: "회의에 참석한다", effects: { adapt: 2 } },
      { label: "혼자 메타 챔피언을 판다", effects: { masteryMetaOne: 8, stamina: -5 } },
    ],
  },
  {
    id: "patch_nerf", tab: "news", trigger: "patchNerf", chance: 0.2, cooldown: 1,
    title: "📰 '{champ}' 너프",
    text: "이번 패치에서 {name}의 주력 챔피언 '{champ}'이(가) 약해졌다는 분석이 나왔다.",
    effects: { condition: -3 },
  },

  // ===== C. 팀 생활 =====
  {
    id: "call_conflict", tab: "inbox", trigger: "random",
    title: "콜 문제로 갈등",
    text: "스크림 도중 콜 문제로 팀원과 언성이 높아졌다.",
    choices: [
      { label: "먼저 사과한다", effects: { reputation: 3, condition: -3 } },
      { label: "내 의견을 끝까지 주장한다", effects: { shotcall: 2, reputation: -3 } },
      { label: "감독에게 맡긴다", effects: {} },
    ],
  },
  {
    id: "mentor", tab: "inbox", trigger: "random", need: { minAge: 22 },
    title: "신인 멘토 요청",
    text: "새로 들어온 연습생이 {name}에게 이것저것 배우고 싶다며 찾아왔다.",
    choices: [
      { label: "흔쾌히 가르쳐 준다", effects: { shotcall: 2, stamina: -5, reputation: 3 } },
      { label: "지금은 여유가 없다", effects: {} },
    ],
  },
  {
    id: "team_dinner", tab: "inbox", trigger: "random",
    title: "팀 회식",
    text: "오늘 저녁 팀 회식이 있다고 한다.",
    choices: [
      { label: "참석한다", effects: { condition: 6 } },
      { label: "빠지고 연습한다", effects: { laning: 1, condition: -2 } },
    ],
  },
  {
    id: "coach_talk", tab: "inbox", trigger: "lowCondition", chance: 0.5,
    title: "감독 면담",
    text: "감독: \"요즘 많이 지쳐 보이는데, 괜찮나?\"",
    choices: [
      { label: "휴식을 요청한다", effects: { stamina: 15 } },
      { label: "괜찮다고 말한다", effects: { mental: 1 } },
    ],
  },

  // ===== D. 팬·미디어·돈 =====
  {
    id: "ad_offer", tab: "inbox", trigger: "random", need: { minPopularity: 40 },
    title: "광고 모델 제안",
    text: "게이밍 기어 브랜드에서 {name}에게 광고 모델을 제안했다.",
    choices: [
      { label: "수락한다", effects: { money: 3000000, popularity: 3, stamina: -10 } },
      { label: "거절하고 연습에 집중한다", effects: { reputation: 2 } },
    ],
  },
  {
    id: "stream_offer", tab: "inbox", trigger: "random", need: { minPopularity: 25 },
    title: "개인 방송 제안",
    text: "방송 플랫폼에서 개인 방송을 해 보지 않겠냐는 연락이 왔다.",
    choices: [
      { label: "해 본다", effects: { popularity: 5, stamina: -8 }, risk: { trait: "scandal", chance: 0.02 } },
      { label: "하지 않는다", effects: {} },
    ],
  },
  {
    id: "fan_gift", tab: "news", trigger: "random",
    title: "팬 선물 도착",
    text: "숙소로 팬들이 보낸 선물과 손편지가 도착했다. \"{name} 선수 늘 응원해요!\"",
    effects: { condition: 3 },
  },
  {
    id: "rumor", tab: "inbox", trigger: "random", weightTrait: "scandal",
    title: "악성 루머",
    text: "{name}에 대한 근거 없는 루머가 커뮤니티에 퍼지고 있다.",
    choices: [
      { label: "직접 해명한다", effects: { reputation: 2, condition: -3 } },
      { label: "무시한다", effects: { reputation: -3 } },
      { label: "법적 대응한다 (자금 −100만)", effects: { money: -1000000, reputation: 5 } },
    ],
  },
  {
    id: "volunteer", tab: "inbox", trigger: "random",
    title: "봉사 활동 초대",
    text: "구단에서 지역 봉사 활동에 함께하자는 연락이 왔다.",
    choices: [
      { label: "참여한다", effects: { reputation: 6, stamina: -5 } },
      { label: "거절한다", effects: {} },
    ],
  },

  // ===== E. 몸 상태 =====
  {
    id: "wrist_pain", tab: "inbox", trigger: "lowStamina", chance: 0.3, weightTrait: "injury_prone",
    title: "손목 통증",
    text: "무리한 탓인지 손목이 욱신거린다.",
    choices: [
      { label: "병원에 간다", effects: { stamina: 10, skipTraining: true }, note: "다음 주 훈련 없음" },
      { label: "참고 계속한다", effects: { reaction: -2 }, risk: { trait: "injury_prone", chance: 0.03 } },
    ],
  },
  {
    id: "peak_condition", tab: "news", trigger: "highCondition", chance: 0.3,
    title: "컨디션 최고조",
    text: "요즘 {name}의 몸 상태가 최고다. 손이 가볍다.",
    effects: { matchBoost: 0.05 },
  },

  // ===== F. 나쁜 특성 극복 (그 특성이 있을 때만) =====
  {
    id: "fix_glass", tab: "inbox", trigger: "random", need: { trait: "glass_mental" },
    title: "멘탈 상담 프로그램",
    text: "구단 심리 상담사가 멘탈 관리 프로그램을 권했다.",
    choices: [
      { label: "참여한다 (자금 −200만)", effects: { money: -2000000 }, cure: { trait: "glass_mental", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_injury", tab: "inbox", trigger: "random", need: { trait: "injury_prone" },
    title: "재활 프로그램",
    text: "트레이너가 손목·허리 재활 프로그램을 제안했다.",
    choices: [
      { label: "참여한다", effects: { stamina: -10 }, cure: { trait: "injury_prone", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_scandal", tab: "inbox", trigger: "random", need: { trait: "scandal" },
    title: "이미지 개선 제안",
    text: "구단 홍보팀이 이미지 개선을 위해 봉사 활동을 제안했다.",
    choices: [
      { label: "참여한다", effects: { reputation: 5 }, cure: { trait: "scandal", chance: 0.3 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_lazy", tab: "inbox", trigger: "random", need: { trait: "lazy" },
    title: "루틴 코치",
    text: "생활 루틴을 잡아 주는 코치를 붙여 주겠다고 한다.",
    choices: [
      { label: "받아들인다", effects: { stamina: -5 }, cure: { trait: "lazy", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_stubborn", tab: "inbox", trigger: "random", need: { trait: "stubborn" },
    title: "메타 공부 모임",
    text: "팀원들이 새 메타를 같이 공부하자고 한다.",
    choices: [
      { label: "참여한다", effects: { adapt: 2 }, cure: { trait: "stubborn", chance: 0.4 } },
      { label: "내 방식대로 한다", effects: {} },
    ],
  },
  {
    id: "fix_stage", tab: "news", trigger: "champion", need: { trait: "stage_fright" }, cooldown: 1,
    title: "큰 무대를 이겨냈다",
    text: "결승 무대를 겪고 나니 긴장이 한결 덜하다.",
    effects: {}, cure: { trait: "stage_fright", chance: 0.5 },
  },
];

// 좋은 특성 얻기 (조건이 처음 맞았을 때 한 번 시도)
const TRAIT_GAINS = [
  { id: "gain_big_stage", trait: "big_stage",  when: "finalsWon2",  chance: 0.5, text: "결승을 두 번이나 이겼다. 큰 무대가 오히려 편하다." },
  { id: "gain_champ_lab", trait: "champ_lab",  when: "mastery100",  chance: 0.3, text: "한 챔피언을 완벽하게 다루게 되면서 챔피언을 보는 눈이 달라졌다." },
  { id: "gain_fan",       trait: "fan_service", when: "popularity80", chance: 0.3, text: "팬들과의 소통이 즐거워졌다." },
];

// 선수 SNS 글 (분위기용). {name} 내 선수, {team} 내 팀, {opp} 상대 팀
const SOCIAL_POSTS = {
  win: [
    "오늘 {team} 경기 봤냐 ㄷㄷ {name} 폼 미쳤다",
    "{opp} 상대로 저렇게 이기네… {team} 이번 시즌 기대된다",
    "{name} 오늘 MVP 줘야 함",
    "직관 갔는데 {name} 플레이 보고 소리 질렀음",
  ],
  loss: [
    "{team} 오늘은 좀 아쉽네",
    "{name} 오늘 컨디션 안 좋아 보이던데",
    "{opp} 진짜 잘한다… 인정",
    "다음 경기는 이기자 {team} 화이팅",
  ],
  general: [
    "요즘 솔랭에서 {name} 만났는데 진짜 잘하더라",
    "이번 패치 메타 너무 어렵다",
    "{team} 유니폼 새로 샀다 ㅎㅎ",
    "프로들은 하루에 몇 시간 연습하는 거지",
    "{name} 팬미팅 언제 하나요",
  ],
};
