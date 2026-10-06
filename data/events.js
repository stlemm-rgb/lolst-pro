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
//     "benchLong"    후보로 8주 이상
// - chance: 조건이 맞을 때 실제로 올 확률 (0.3 = 30%). 없으면 100%
// - need: 추가 조건 { minPopularity, minAge, minWeek(이 주차 이후), trait(이 특성이 있어야), noTrait(이 특성이 없어야) }
// - cooldown: 같은 이벤트가 다시 오기까지 쉬는 주 (없으면 EVENT_RULES.cooldown)
// - effects: (소식) 읽으면 바로 적용되는 효과
// - choices: (받은 연락) 선택지 [{ label, effects, risk, cure, note, followUp }]
// - who: 다른 선수가 나오는 연락 (2026-10-06). 맞는 선수가 없으면 이 연락은 안 와요
//     "rival"       다른 팀의 같은 포지션 선수 중 가장 잘하는 선수 (같은 리그)
//     "otherPro"    다른 팀 선수 아무나
//     "teammate"    우리 팀 동료 아무나
//     "teammateBad" 나쁜 특성(게으름·무대 공포증·기복·슬로 스타터)이 있는 우리 팀 동료
//   글자: {player} 그 선수 이름, {pteam} 그 선수 팀, {trait} 그 선수의 나쁜 특성 이름
// - trigger "followUp": 다른 연락의 선택지(followUp)로만 몇 주 뒤에 오는 후속 연락
//
// 효과(effects)에 쓸 수 있는 것
//   스탯 id(accuracy, laning, ... mental ...), stamina, condition, popularity, reputation
//   money: 자금(원)
//   masteryMetaAll: 내 포지션 메타 챔피언 전부 숙련도 +n
//   masteryMetaOne: 내 포지션 메타 챔피언 중 숙련도가 가장 낮은 1명 +n
//   masteryChamp:   이벤트에 나온 챔피언({champ}) 숙련도 +n
//   skipTraining: true  → 다음 주 훈련 없음 (쉼)
//   matchBoost: 0.05    → 다음 경기 경기력 +5%
//   transferListed: true → 비시즌 이적 제안이 늘어남
//   ※ money는 "연봉 3,000만 원 선수" 기준 값이에요. 연봉이 더 높으면 그만큼 커져요 (EVENT_RULES.moneyBaseSalary)
//   activity: "sponsor" → 오래 가는 계약·활동 시작 (아래 ACTIVITIES)
//   cureOther: 0.4     → 나온 선수({player})의 나쁜 특성을 40% 확률로 없애 줌
//   otherRisk: { trait, chance } → 나온 선수에게 나쁜 특성이 생길 확률 (사고를 못 막음)
// followUp: { event, weeks: [최소, 최대], chance } → 몇 주 뒤 후속 연락 (여러 개면 배열)
// risk: { trait, chance }  나쁜 특성이 생길 확률 (⚠️ 최대 0.05)
// cure: { trait, chance }  나쁜 특성이 없어질 확률 (💚)
// gain: { trait, chance }  좋은 특성을 얻을 확률

const EVENT_RULES = {
  randomChance: 0.25,   // 매주 무작위 이벤트가 올 확률
  cooldown: 8,          // 같은 이벤트가 다시 오기까지 최소 주
  ignoreAfterWeeks: 4,  // 답하지 않으면 이 주 뒤에 자동으로 "무시"
  readAfterWeeks: 4,    // 안 읽은 소식·연락은 이 주 뒤에 자동으로 "읽음" (알림 배지에서 빠짐)
  maxRisk: 0.05,        // 나쁜 특성 확률 상한 (데이터에 더 높게 적어도 이 값으로 잘림)
  keepMessages: 120,    // SNS에 남겨 둘 메시지 수
  moneyBaseSalary: 30000000, // 이벤트의 money 값 기준 연봉. 내 연봉이 이보다 높으면 money를 그 비율만큼 키움 (1억 → 약 3.3배)
};

// ===== 오래 가는 계약·활동 (이벤트 선택지 activity로 시작, [상점] 화면에서 확인·그만두기) =====
// - weekly: 매주 효과 (moneySalaryPct: 연봉의 n를 매주 받음)
// - untilSeasonEnd: true → 시즌이 끝나면(52주차 다음) 자동 종료
// - stoppable: true → 내가 언제든 그만둘 수 있음
// - failIf: { popularityBelow } → 조건이 깨지면 끝나고 failEffects 적용
// - matchBoostVs: 그 선수의 팀과 경기할 때 경기력 +n (rival)
const ACTIVITIES = {
  sponsor: { icon: "🤝", name: "스폰서 계약", desc: "시즌 끝까지 매주 연봉의 0.4% 수입 · 인기도 50 아래로 떨어지면 해지(평판 −5)",
    weekly: { moneySalaryPct: 0.004 }, untilSeasonEnd: true, failIf: { popularityBelow: 50 }, failEffects: { reputation: -5 } },
  stream: { icon: "🎥", name: "개인 방송", desc: "매주 인기도 +1, 체력 −2 · 언제든 그만둘 수 있음",
    weekly: { popularity: 1, stamina: -2 }, stoppable: true },
  rival: { icon: "🔥", name: "라이벌 선언", desc: "시즌 끝까지 {player}({pteam})의 팀과 경기할 때 경기력 +5%",
    matchBoostVs: 0.05, untilSeasonEnd: true },
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
      { label: "밤새 상대를 연구한다", effects: { masteryMetaAll: 3, stamina: -10 } },
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
      { label: "내가 먼저 파 본다", effects: { masteryChamp: 8, stamina: -8 } },
      { label: "지금 하던 챔피언에 집중한다", effects: { masteryMetaAll: 3 } },
    ],
  },
  {
    id: "patch_study", tab: "inbox", trigger: "patch", chance: 0.6, cooldown: 1,
    title: "패치 분석 회의",
    text: "새 패치가 나왔다. 코치진이 분석 회의를 연다고 한다.",
    choices: [
      { label: "회의에 참석한다", effects: { adapt: 2 } },
      { label: "혼자 메타 챔피언을 판다", effects: { masteryMetaOne: 4, stamina: -5 } },
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
      { label: "내 의견을 끝까지 주장한다", effects: { shotcall: 2, reputation: -3 }, risk: { trait: "stubborn", chance: 0.03 } },
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
      { label: "2차, 3차까지 달린다", effects: { condition: 12, stamina: -10 }, risk: { trait: "lazy", chance: 0.03 } },
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
      { label: "수락한다", effects: { money: 3000000, popularity: 3, stamina: -10 }, risk: { trait: "spender", chance: 0.03 } },
      { label: "거절하고 연습에 집중한다", effects: { reputation: 2 } },
    ],
  },
  {
    id: "stream_offer", tab: "inbox", trigger: "random", need: { minPopularity: 25 },
    title: "개인 방송 제안",
    text: "방송 플랫폼에서 개인 방송을 해 보지 않겠냐는 연락이 왔다.",
    choices: [
      { label: "해 본다 (꾸준히)", effects: { popularity: 3, activity: "stream" }, risk: { trait: "scandal", chance: 0.02 },
        followUp: [{ event: "stream_milestone", weeks: [8, 14], chance: 0.6 }, { event: "stream_accident", weeks: [5, 12], chance: 0.25 }] },
      { label: "한 번만 해 본다", effects: { popularity: 5, stamina: -8 } },
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
      { label: "직접 해명한다", effects: { reputation: 2, condition: -3 }, followUp: { event: "rumor_apology", weeks: [2, 5], chance: 0.3 } },
      { label: "무시한다", effects: { reputation: -3 }, followUp: { event: "rumor_spread", weeks: [3, 6], chance: 0.5 } },
      { label: "법적 대응한다", effects: { money: -1000000, reputation: 5 }, note: "몇 주 뒤 결과가 와요 (사과문·합의금)",
        followUp: [{ event: "rumor_apology", weeks: [3, 6], chance: 0.6 }, { event: "rumor_settlement", weeks: [6, 10], chance: 0.5 }] },
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

  // ===== 생활 습관 (나쁜 특성이 낮은 확률로 생길 수 있음) =====
  {
    id: "rank_grind", tab: "inbox", trigger: "random",
    title: "랭크 연패",
    text: "오늘 솔로 랭크에서 연패 중이다. 화면을 보니 열이 오른다.",
    choices: [
      { label: "이길 때까지 돌린다", effects: { reaction: 1, condition: -3 }, risk: { trait: "tilt", chance: 0.03 } },
      { label: "오늘은 접는다", effects: { condition: 2 } },
    ],
  },
  {
    id: "late_night", tab: "inbox", trigger: "random",
    title: "무너진 생활 패턴",
    text: "새벽까지 영상을 보다 잠드는 날이 이어지고 있다.",
    choices: [
      { label: "알람을 맞추고 패턴을 고친다", effects: { condition: -2 } },
      { label: "그냥 이대로 지낸다", effects: { stamina: 5 }, risk: { trait: "night_owl", chance: 0.04 } },
    ],
  },
  {
    id: "offseason_trip", tab: "inbox", trigger: "random", need: { minWeek: 47 },
    title: "비시즌 여행",
    text: "친구들이 비시즌에 해외 여행을 가자고 한다.",
    choices: [
      { label: "다녀온다", effects: { condition: 10, stamina: 10 }, risk: { trait: "slow_starter", chance: 0.04 } },
      { label: "연습실에 남는다", effects: { laning: 1, condition: -2 } },
    ],
  },
  {
    id: "form_swing", tab: "inbox", trigger: "afterWin", chance: 0.15,
    title: "들쭉날쭉한 손감",
    text: "이긴 경기에서도 잘 될 때와 안 될 때가 크게 갈렸다.",
    choices: [
      { label: "감에 맡기고 그대로 간다", effects: { matchBoost: 0.03 }, risk: { trait: "inconsistent", chance: 0.03 } },
      { label: "기본기 연습으로 다진다", effects: { focus: 1, stamina: -3 } },
    ],
  },

  // ===== 후보 생활 =====
  {
    id: "bench_long", tab: "inbox", trigger: "benchLong", cooldown: 12,
    title: "길어지는 후보 생활",
    text: "후보로 지낸 지 꽤 됐다. 이대로 괜찮을까?",
    choices: [
      { label: "비시즌에 이적하고 싶다고 말한다", effects: { transferListed: true }, note: "비시즌 이적 제안이 늘어남" },
      { label: "주전을 되찾을 때까지 버틴다", effects: { mental: 1, condition: -2 } },
    ],
  },

  // ===== F. 나쁜 특성 극복 (그 특성이 있을 때만) =====
  {
    id: "fix_glass", tab: "inbox", trigger: "random", need: { trait: "glass_mental" },
    title: "멘탈 상담 프로그램",
    text: "구단 심리 상담사가 멘탈 관리 프로그램을 권했다.",
    choices: [
      { label: "참여한다", effects: { money: -2000000 }, cure: { trait: "glass_mental", chance: 0.4 } },
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
    id: "fix_inconsistent", tab: "inbox", trigger: "random", need: { trait: "inconsistent" },
    title: "경기 루틴 만들기",
    text: "코치가 경기 전 루틴을 같이 만들어 보자고 한다.",
    choices: [
      { label: "루틴을 만든다", effects: { focus: 1 }, cure: { trait: "inconsistent", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_slow", tab: "inbox", trigger: "random", need: { trait: "slow_starter" },
    title: "비시즌 개인 훈련 캠프",
    text: "시즌 초에 몸이 늦게 풀리는 문제를 잡아 주는 캠프가 있다.",
    choices: [
      { label: "참가한다", effects: { money: -1000000, stamina: -5 }, cure: { trait: "slow_starter", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_tilt", tab: "inbox", trigger: "random", need: { trait: "tilt" },
    title: "랭크 휴식 선언",
    text: "한동안 랭크를 쉬며 마음을 다잡아 보면 어떨까?",
    choices: [
      { label: "일주일 랭크를 끊는다", effects: { condition: 3 }, cure: { trait: "tilt", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_spender", tab: "inbox", trigger: "random", need: { trait: "spender" },
    title: "재무 상담",
    text: "구단이 선수들을 위한 재무 상담을 연다고 한다.",
    choices: [
      { label: "상담을 받는다", effects: {}, cure: { trait: "spender", chance: 0.5 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_night", tab: "inbox", trigger: "random", need: { trait: "night_owl" },
    title: "수면 클리닉",
    text: "수면 패턴을 바로잡아 주는 클리닉을 소개받았다.",
    choices: [
      { label: "다닌다", effects: { money: -500000 }, cure: { trait: "night_owl", chance: 0.4 } },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_stage", tab: "news", trigger: "champion", need: { trait: "stage_fright" }, cooldown: 1,
    title: "큰 무대를 이겨냈다",
    text: "결승 무대를 겪고 나니 긴장이 한결 덜하다.",
    effects: {}, cure: { trait: "stage_fright", chance: 0.5 },
  },

  // ===== G. 오래 가는 계약·활동 / 후속 연락 (2026-10-06) =====
  {
    id: "sponsor_offer", tab: "inbox", trigger: "random", need: { minPopularity: 50 }, cooldown: 26,
    title: "개인 스폰서 제안",
    text: "게이밍 기어 회사에서 {name}에게 시즌 스폰서 계약을 제안했다. \"인기만 유지해 주시면 됩니다.\"",
    choices: [
      { label: "계약한다", effects: { activity: "sponsor", popularity: 2 } },
      { label: "거절한다", effects: { reputation: 1 } },
    ],
  },
  {
    id: "stream_milestone", tab: "news", trigger: "followUp",
    title: "📺 방송 구독자 10만 돌파!",
    text: "{name}의 개인 방송 구독자가 10만 명을 넘었다. 후원금도 꽤 들어왔다.",
    effects: { popularity: 5, money: 2000000 },
  },
  {
    id: "stream_accident", tab: "inbox", trigger: "followUp",
    title: "방송 사고",
    text: "방송 중 무심코 한 말이 커뮤니티에 퍼지고 있다.",
    choices: [
      { label: "바로 사과 방송을 한다", effects: { reputation: -2, condition: -5 } },
      { label: "별일 아니라며 넘긴다", effects: { reputation: -6 }, risk: { trait: "scandal", chance: 0.05 } },
    ],
  },
  {
    id: "rumor_spread", tab: "inbox", trigger: "followUp",
    title: "루머가 더 퍼졌다",
    text: "무시했던 루머가 기사로까지 나왔다. 팬들이 해명을 기다리고 있다.",
    choices: [
      { label: "지금이라도 해명한다", effects: { reputation: 1, condition: -5 } },
      { label: "법적 대응한다", effects: { money: -2000000, reputation: 4 }, note: "몇 주 뒤 결과가 와요 (사과문·합의금)",
        followUp: [{ event: "rumor_apology", weeks: [3, 6], chance: 0.7 }, { event: "rumor_settlement", weeks: [6, 10], chance: 0.6 }] },
      { label: "계속 무시한다", effects: { reputation: -5, popularity: -3 } },
    ],
  },

  {
    id: "rumor_apology", tab: "news", trigger: "followUp",
    title: "📝 루머 유포자의 사과문",
    text: "{name}에 대한 루머를 처음 퍼뜨린 사람이 커뮤니티에 사과문을 올렸다. \"사실이 아닌 이야기를 퍼뜨려 죄송합니다.\"",
    effects: { reputation: 4, condition: 5 },
  },
  {
    id: "rumor_settlement", tab: "news", trigger: "followUp",
    title: "⚖️ 루머 소송 합의",
    text: "악성 루머 소송이 마무리됐다. 유포자 측이 잘못을 인정하고 합의금을 냈다.",
    effects: { money: 3000000, reputation: 2 },
  },

  // ===== H. 다른 선수가 나오는 연락 (2026-10-06) =====
  {
    id: "rival_taunt", tab: "inbox", trigger: "random", who: "rival", need: { minWeek: 13 }, cooldown: 26,
    title: "{player}의 도발",
    text: "{pteam}의 {player} 선수가 인터뷰에서 말했다. \"{name} 선수랑 붙으면 라인전은 제가 이길 것 같네요.\"",
    choices: [
      { label: "맞받아친다 (라이벌 선언)", effects: { activity: "rival", popularity: 3 }, note: "시즌 끝까지 그 팀과 경기할 때 경기력 +5%" },
      { label: "점잖게 넘긴다", effects: { reputation: 2 } },
    ],
  },
  {
    id: "duo_offer", tab: "inbox", trigger: "random", who: "otherPro",
    title: "{player}의 솔랭 듀오 제안",
    text: "{pteam}의 {player} 선수가 솔로 랭크 듀오를 하자고 연락해 왔다.",
    choices: [
      { label: "같이 한다", effects: { reaction: 1, popularity: 2, stamina: -5 } },
      { label: "같이 하면서 메타 이야기도 나눈다", effects: { masteryMetaOne: 3, stamina: -8 } },
      { label: "정중히 거절한다", effects: {} },
    ],
  },
  {
    id: "teammate_slump", tab: "inbox", trigger: "random", who: "teammateBad",
    title: "{player} 선수의 고민",
    text: "같은 팀 {player} 선수가 요즘 '{trait}' 때문에 힘들어한다. 팀 성적에도 영향이 있는 것 같다.",
    choices: [
      { label: "따로 시간을 내서 돕는다", effects: { cureOther: 0.4, stamina: -10, reputation: 3 } },
      { label: "감독님께 이야기한다", effects: { cureOther: 0.2 } },
      { label: "내 연습에 집중한다", effects: {} },
    ],
  },
  {
    id: "teammate_trouble", tab: "inbox", trigger: "random", who: "teammate", cooldown: 16,
    title: "{player} 선수가 사고를 칠 것 같다",
    text: "새벽에 술을 마신 {player} 선수가 방송을 켜서 다른 팀 험담을 하겠다고 한다.",
    choices: [
      { label: "말린다", effects: { reputation: 4, condition: -2 } },
      { label: "같이 어울린다", effects: { condition: 5, otherRisk: { trait: "scandal", chance: 0.6 } }, risk: { trait: "scandal", chance: 0.04 } },
      { label: "모른 척한다", effects: { otherRisk: { trait: "scandal", chance: 0.5 } } },
    ],
  },
  {
    id: "friend_trouble", tab: "inbox", trigger: "random", who: "otherPro", cooldown: 16,
    title: "{player} 선수에게서 온 메시지",
    text: "친분이 있는 {pteam}의 {player} 선수가 심판 판정을 비난하는 글을 올리려 한다며 의견을 물어 왔다.",
    choices: [
      { label: "올리지 말라고 설득한다", effects: { reputation: 3 } },
      { label: "알아서 하라고 한다", effects: { otherRisk: { trait: "scandal", chance: 0.5 } } },
    ],
  },
];

// 좋은 특성 얻기 (조건이 처음 맞았을 때 한 번 시도)
const TRAIT_GAINS = [
  { id: "gain_big_stage", trait: "big_stage",  when: "finalsWon2",  chance: 0.5, text: "결승을 두 번이나 이겼다. 큰 무대가 오히려 편하다." },
  { id: "gain_champ_lab", trait: "champ_lab",  when: "mastery100",  chance: 0.3, text: "한 챔피언을 완벽하게 다루게 되면서 챔피언을 보는 눈이 달라졌다." },
  { id: "gain_fan",       trait: "fan_service", when: "popularity80", chance: 0.3, text: "팬들과의 소통이 즐거워졌다." },
  { id: "gain_ladder",    trait: "ladder_addict", when: "challenger", chance: 0.4, text: "챌린저를 찍고 나니 랭크가 더 재밌어졌다." },
  { id: "gain_clutch",    trait: "clutch",      when: "finalsWon3",  chance: 0.3, text: "결승을 세 번이나 이기며 마지막 한 판에 강해졌다." },
  { id: "gain_star",      trait: "star_power",  when: "popularity60", chance: 0.25, text: "카메라가 켜지면 더 힘이 난다." },
];

// 선수 SNS 글은 data/social_posts.js 로 옮겼어요.


// ----- 팀은 졌지만 나는 빛난 경기 → 뉴스 기사 (js/matchsim.js afterUserMatch) -----
// 조건: 우리 팀이 진 경기에서 ① 솔로킬을 땄거나 ② 라인전을 절반 넘게 이김
// 글자: {name} 내 선수, {team} 우리 팀, {opp} 상대 팀, {pos} 포지션, {rival} 상대 라인 선수,
//       {solos} 솔로킬 수, {laneWins} 라인전 이긴 세트, {sets} 세트 수
const LOSS_HERO = {
  popularity: 1,          // 기사가 나면 인기도 +1 (인기도 배율 적용)
  // 솔로킬을 딴 경우 (먼저 확인)
  solo: [
    { title: "패배 속 빛난 솔로킬", text: "{team}은(는) {opp}에게 졌지만, {pos} {name}의 솔로킬 {solos}회는 팬들의 뇌리에 남았다. \"팀이 졌으니 의미 없다\"는 {name}의 인터뷰가 오히려 화제." },
    { title: "{name}, 혼자서 {rival}을(를) 잡았다", text: "경기는 {opp}의 승리. 하지만 {name}은(는) {rival}을(를) 상대로 솔로킬 {solos}회를 기록하며 라인에서만큼은 확실한 우위를 보였다." },
    { title: "졌지만 잘 싸웠다: {name}", text: "{team}의 패배에도 커뮤니티는 {name}의 솔로킬 장면으로 뜨겁다. \"저 팀에서 저 정도면 혼자 게임하는 것\"이라는 반응." },
  ],
  // 라인전을 절반 넘게 이긴 경우
  lane: [
    { title: "{name}, 패배에도 라인전 압승", text: "{team}은(는) {opp}에게 무릎 꿇었지만, {pos} 라인은 {sets}세트 중 {laneWins}세트를 {name}이(가) 가져갔다. 해설진: \"라인전만 보면 {name}이(가) 이긴 경기\"." },
    { title: "고군분투한 {name}", text: "{opp}전 패배. 그래도 {name}은(는) 상대 {rival}을(를) 라인에서 꾸준히 압박하며 제 몫을 다했다. 팀 전체의 경기력 보완이 숙제로 남았다." },
    { title: "\"{name} 혼자서는 이길 수 없었다\"", text: "{team}이(가) {opp}에게 졌다. 라인전 {laneWins}/{sets} 세트 우세를 기록한 {name}에게는 아쉬운 결과. 팬들은 구단의 보강을 요구하고 있다." },
  ],
};
