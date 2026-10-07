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
// - need: 추가 조건 { minPopularity, maxPopularity, minReputation, maxReputation, minAge, minWeek(이 주차 이후), trait(이 특성이 있어야), noTrait(이 특성이 없어야) }
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

// ----- 2026-10-08 리뉴얼 (js/events.js · js/stories.js) -----
// - seasonMax: 이 연락이 한 시즌에 올 수 있는 최대 횟수 (없으면 EVENT_RULES.seasonMax)
// - always: true → 한 시즌 연락 수 상한(inboxPerSeason)·한 주 1개 제한과 상관없이 옴 (시즌 흐름·연작 이야기)
// - 선택지 result: 고른 뒤 나오는 결과 이야기 (배열이면 하나를 무작위로)
// - 선택지 check: { stat, diff } → 능력치 판정 🎲. 성공 확률 = 50% + (내 값 − diff) × 2.5% (10%~95%)
//     stat: 스탯 id(mental, shotcall …) 또는 reputation · popularity · condition · score(스탯 점수)
//     success / fail: { effects, result, risk, cure, followUp } — 성공·실패 때 따로 (선택지 effects는 둘 다 적용)
// - 효과 flag: { 이름: 값 } → 이야기 기억 (need.flag / need.noFlag로 다음 연락 조건)
// - 효과 relation: n → 나온 선수({player})와 관계 ±n,  teamRelation: n → 우리 팀 동료 모두 ±n
// - 효과 salaryRaise: 0.1 → 지금 계약 연봉 +10%
// - need 추가: minScore · maxScore · tier(1/2) · weeks: [시작 주, 끝 주] · flag · noFlag · benched(true/false) · titleThisYear(true/false) · minSalary
// - who 추가: "friend" 관계 40 이상 동료 · "foe" 관계 −30 이하 선수
// - trigger 추가 (js/stories.js): mediaDay(12주) · seasonGoal(2주) · msiDepart(25주) · worldsDepart(42주) · promotion(39주) · contractYear(30주)
//     allStarVote(48주) · seasonReview(47주) · offseasonPlan(50주) · birthday(생일 주)
//     rivalSigned(경쟁자 합류) · fameUp(스타 등급 상승) · skinMade(우승 스킨) · benchedNow(2군행) · friendLeft(친한 동료 이적)
const EVENT_RULES = {
  seasonMax: 1,         // 같은 연락은 한 시즌에 1번까지 (데이터 seasonMax로 바꿀 수 있음)
  inboxPerSeason: 10,   // 한 시즌 받은 연락 상한 (always 연락·후속 연락은 빼고 셈 → 전체는 1년 약 15~18개)
  freshWeight: 3,       // 아직 한 번도 안 온 무작위 연락은 3배 잘 뽑힘
  check: { per: 0.025, min: 0.1, max: 0.95 }, // 능력치 판정
  relation: { friendFrom: 50, foeFrom: -50, per: 0.005, max: 0.02 }, // 주전 동료 중 절친 +0.5%, 앙숙 −0.5% (내 경기력, 최대 ±2%)
  randomChance: 0.22,   // 매주 무작위 이벤트가 올 확률 (그 주에 다른 연락이 없을 때만)
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
  endorse: { icon: "💼", name: "대형 브랜드 개인 스폰서", desc: "시즌 끝까지 매주 연봉의 1% 수입 · 인기도 60 아래로 떨어지면 해지(평판 −5)",
    weekly: { moneySalaryPct: 0.01 }, untilSeasonEnd: true, failIf: { popularityBelow: 60 }, failEffects: { reputation: -5 } },
  rival: { icon: "🔥", name: "라이벌 선언", desc: "시즌 끝까지 {player}({pteam})의 팀과 경기할 때 경기력 +5%",
    matchBoostVs: 0.05, untilSeasonEnd: true },
};

const EVENTS = [
  // ===== A. 경기·성적 =====
  {
    id: "interview", tab: "inbox", trigger: "afterWin", chance: 0.3, seasonMax: 2,
    title: "경기 후 인터뷰 요청",
    text: "기자: \"{name} 선수, 오늘 경기 정말 인상적이었는데요. 한마디 해 주시겠어요?\"",
    choices: [
      { label: "\"팀원들 덕분이에요.\"", effects: { reputation: 4, teamRelation: 3 },
        result: ["동료들이 인터뷰 영상을 돌려 보며 웃었다. \"야, 오늘 밥은 네가 사.\"", "겸손한 한마디에 팬들의 반응이 좋다. 팀 분위기도 한층 밝아졌다."] },
      { label: "\"상대가 생각보다 약하던데요?\" (도발)", check: { stat: "popularity", diff: 50 },
        success: { effects: { popularity: 6, reputation: -3 }, result: "\"건방지지만 실력으로 증명했다\" — 커뮤니티가 들끓는다. 팬이 확 늘었다." },
        fail: { effects: { popularity: 1, reputation: -8 }, result: "\"무명이 뭘 믿고?\" — 역풍이 거세다. 상대 팀 팬들이 벼르고 있다.", risk: { trait: "scandal", chance: 0.04 } } },
      { label: "정중히 거절한다", effects: { condition: 3 }, result: "조용히 숙소로 돌아와 푹 쉬었다." },
    ],
  },
  {
    id: "solo_praise", tab: "news", trigger: "soloKills",
    title: "커뮤니티: \"{name} 라인전 미쳤다\"",
    text: "이번 주 경기에서 나온 솔로킬 장면이 커뮤니티 인기 글에 올랐다. \"{pos} 라인전은 {name}이 리그 최고\"라는 반응.",
    effects: { popularity: 3 },
  },
  {
    id: "lose_blame", tab: "news", trigger: "loseStreak3", need: { noTrait: "steel_mental" },
    title: "커뮤니티: \"{team} 이대로 괜찮나\"",
    text: "3연패에 빠진 {team}. 커뮤니티에는 날 선 비판 글이 이어지고 있다. 일부는 {name}의 경기력을 문제 삼았다.",
    effects: { condition: -5 },
  },
  {
    id: "slump", tab: "inbox", trigger: "loseStreak4",
    title: "슬럼프",
    text: "요즘 손이 안 풀린다. 연습을 해도 결과가 안 나온다. 경기 영상을 다시 보면 실수만 눈에 들어온다.",
    choices: [
      { label: "이를 악물고 더 연습한다", check: { stat: "mental", diff: 55 },
        success: { effects: { stamina: -12, mental: 2, matchBoost: 0.05 }, result: "새벽 4시. 드디어 손이 기억을 되찾았다. 다음 경기가 기다려진다." },
        fail: { effects: { stamina: -15, condition: -8 }, result: "연습할수록 꼬인다. 모니터 앞에서 한참을 멍하니 앉아 있었다.", risk: { trait: "glass_mental", chance: 0.04 } } },
      { label: "감독님과 상담한다", effects: { condition: 12 }, result: "감독: \"너 원래 잘하는 거 알아. 하던 대로만 해.\" 짧은 말이 오래 남았다.",
        followUp: { event: "slump_video", weeks: [2, 4], chance: 0.6 } },
      { label: "며칠 완전히 쉰다", effects: { stamina: 25, condition: 8, skipTraining: true }, note: "다음 주 훈련 없음",
        result: "게임을 끄고 바다를 보러 갔다. 돌아오는 길, 이상하게 다시 하고 싶어졌다." },
    ],
  },
  {
    id: "pre_final", tab: "inbox", trigger: "preFinal", cooldown: 1, always: true, seasonMax: 4,
    title: "결승 전날 밤",
    text: "내일은 결승이다. 숙소가 조용하다. 오늘 밤 어떻게 보낼까?",
    choices: [
      { label: "평소대로 보낸다", effects: { condition: 4 }, result: "평소처럼 랭크 두 판, 샤워, 잠. 특별한 날일수록 평범하게." },
      { label: "밤새 상대를 연구한다", check: { stat: "focus", diff: 55 },
        success: { effects: { masteryMetaAll: 3, matchBoost: 0.06, stamina: -8 }, result: "상대 정글러의 동선 습관을 찾아냈다. 내일은 보인다." },
        fail: { effects: { masteryMetaAll: 2, stamina: -15, condition: -5 }, result: "영상만 보다 날이 밝았다. 눈이 뻑뻑하다." } },
      { label: "일찍 잔다", effects: { condition: 10, stamina: 10 }, result: "알람보다 먼저 눈이 떠졌다. 몸이 가볍다." },
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
    id: "new_champ", tab: "inbox", trigger: "newChamp", cooldown: 1, seasonMax: 2,
    title: "새 챔피언 '{champ}' 연구",
    text: "새 챔피언 '{champ}'이(가) 나왔다. 출시 직후라 다음 패치 전까지는 꽤 세다는 평가다 (메타가 아니어도 픽 가치 +15·경기력 +6%). 다음 패치 때 메타에 들어갈 가능성도 높다. 팀에서 먼저 연구해 보자는 말이 나온다.",
    choices: [
      { label: "내가 먼저 파 본다", check: { stat: "adapt", diff: 50 },
        success: { effects: { masteryChamp: 35, adapt: 1, stamina: -5 }, result: "사흘 만에 숨은 콤보를 찾아냈다. 다른 팀 코치들이 내 경기 영상을 돌려 본다는 소문." },
        fail: { effects: { masteryChamp: 18, stamina: -8 }, result: "생각보다 손에 안 붙는다. 그래도 기본기는 익혔다." } },
      { label: "팀과 같이 연구한다", effects: { masteryChamp: 15, reputation: 2, teamRelation: 2 }, result: "화이트보드 앞에서 다섯 명이 머리를 맞댔다. 팀 전체의 이해도가 올라갔다." },
      { label: "지금 하던 챔피언에 집중한다", effects: { masteryMetaAll: 3 }, result: "유행은 돌고 돈다. 지금 메타를 더 단단히 다졌다." },
    ],
  },
  {
    id: "patch_study", tab: "inbox", trigger: "patch", chance: 0.6, cooldown: 1, seasonMax: 2,
    title: "패치 분석 회의",
    text: "새 패치가 나왔다. 코치진이 분석 회의를 연다고 한다.",
    choices: [
      { label: "회의에 참석해 의견을 낸다", check: { stat: "shotcall", diff: 55 },
        success: { effects: { adapt: 2, reputation: 3 }, result: "내 분석이 팀 밴픽 전략에 그대로 채택됐다. 코치: \"좋은 눈이야.\"" },
        fail: { effects: { adapt: 1 }, result: "열심히 말했지만 코치진은 다른 쪽을 골랐다. 그래도 많이 배웠다." } },
      { label: "혼자 메타 챔피언을 판다", effects: { masteryMetaOne: 6, stamina: -6 }, result: "회의록은 나중에 읽기로 하고 랭크를 켰다. 새 메타 챔피언이 손에 익어 간다." },
    ],
  },
  {
    id: "patch_nerf", tab: "news", trigger: "patchNerf", chance: 0.2, cooldown: 1,
    title: "📰 '{champ}' 너프",
    text: "이번 패치에서 {name}의 주력 챔피언 '{champ}'이(가) 약해졌다는 분석이 나왔다.",
    effects: { condition: -4 },
  },

  // ===== C. 팀 생활 =====
  {
    id: "call_conflict", tab: "inbox", trigger: "random", who: "teammate",
    title: "콜 문제로 갈등",
    text: "스크림 도중 콜 문제로 {player} 선수와 언성이 높아졌다. 다른 팀원들은 눈치만 보고 있다.",
    choices: [
      { label: "먼저 사과한다", effects: { reputation: 3, condition: -3, relation: 15 }, result: "{player}: \"아냐, 나도 예민했어.\" 둘이 편의점에서 컵라면을 먹었다." },
      { label: "내 의견을 끝까지 주장한다", check: { stat: "shotcall", diff: 60 },
        success: { effects: { shotcall: 2, relation: -5 }, result: "리플레이를 돌려 보니 내 콜이 맞았다. {player}도 마지못해 인정했다." },
        fail: { effects: { relation: -20, reputation: -3 }, result: "리플레이를 보니... 내가 틀렸다. 분위기가 싸늘하다.", risk: { trait: "stubborn", chance: 0.04 },
          followUp: { event: "conflict_after", weeks: [3, 6], chance: 0.7 } } },
      { label: "감독에게 맡긴다", effects: { relation: -3 }, result: "감독이 둘을 불러 정리했다. 일은 끝났지만 어색함은 남았다." },
    ],
  },
  {
    id: "mentor_rookie", tab: "inbox", trigger: "random", need: { minAge: 22 },
    title: "신인 멘토 요청",
    text: "새로 들어온 연습생이 {name}에게 이것저것 배우고 싶다며 찾아왔다. 눈빛이 반짝인다.",
    choices: [
      { label: "흔쾌히 가르쳐 준다", effects: { shotcall: 2, stamina: -6, reputation: 4, flag: { mentee: true } },
        result: "가르치다 보니 내가 왜 그렇게 플레이하는지 다시 정리됐다.", followUp: { event: "mentee_debut", weeks: [16, 30], chance: 0.7 } },
      { label: "지금은 여유가 없다", effects: { condition: 2 }, result: "연습생은 꾸벅 인사하고 돌아갔다. 조금 마음에 걸린다." },
    ],
  },
  {
    id: "team_dinner", tab: "inbox", trigger: "random",
    title: "팀 회식",
    text: "오늘 저녁 팀 회식이 있다고 한다. 감독님이 고기를 산다고 한다.",
    choices: [
      { label: "참석한다", effects: { condition: 8, teamRelation: 4 }, result: "고기 굽는 담당이 됐다. 다들 웃으며 이번 시즌 이야기를 했다." },
      { label: "2차, 3차까지 달린다", effects: { condition: 14, stamina: -12, teamRelation: 8 }, risk: { trait: "lazy", chance: 0.03 },
        result: "노래방에서 정글러의 숨은 재능을 발견했다. 다음 날 아침 스크림은... 묻지 말자." },
      { label: "빠지고 연습한다", effects: { laning: 2, condition: -3, teamRelation: -3 }, result: "텅 빈 연습실. 손은 늘었지만 단톡방 사진을 보니 조금 쓸쓸하다." },
    ],
  },
  {
    id: "coach_talk", tab: "inbox", trigger: "lowCondition", chance: 0.5,
    title: "감독 면담",
    text: "감독: \"요즘 많이 지쳐 보이는데, 괜찮나?\"",
    choices: [
      { label: "휴식을 요청한다", effects: { stamina: 15, condition: 10 }, result: "감독: \"그래, 이틀 쉬어.\" 생각보다 쉽게 허락해 줬다." },
      { label: "괜찮다고 말한다", check: { stat: "mental", diff: 60 },
        success: { effects: { mental: 2, condition: 5 }, result: "말하고 나니 정말 괜찮아졌다. 마음먹기 나름이다." },
        fail: { effects: { condition: -5 }, result: "괜찮다고 했지만... 사실 괜찮지 않다." } },
    ],
  },

  // ===== D. 팬·미디어·돈 =====
  {
    id: "ad_offer", tab: "inbox", trigger: "random", need: { minPopularity: 40 },
    title: "광고 모델 제안",
    text: "게이밍 기어 브랜드에서 {name}에게 광고 모델을 제안했다.",
    choices: [
      { label: "수락한다", effects: { money: 4000000, popularity: 3, stamina: -10 }, risk: { trait: "spender", chance: 0.03 }, result: "촬영장 조명이 뜨겁다. 웃는 연습만 두 시간 했다." },
      { label: "거절하고 연습에 집중한다", effects: { reputation: 2, condition: 2 }, result: "\"시즌 끝나고 다시 연락드릴게요.\" 브랜드 담당자도 아쉬워했다." },
    ],
  },
  {
    id: "stream_offer", tab: "inbox", trigger: "random", need: { minPopularity: 25 },
    title: "개인 방송 제안",
    text: "방송 플랫폼에서 개인 방송을 해 보지 않겠냐는 연락이 왔다.",
    choices: [
      { label: "해 본다 (꾸준히)", effects: { popularity: 3, activity: "stream" }, risk: { trait: "scandal", chance: 0.02 }, result: "첫 방송 시청자 3천 명. 채팅창이 너무 빨라서 읽을 수가 없다.",
        followUp: [{ event: "stream_milestone", weeks: [8, 14], chance: 0.6 }, { event: "stream_accident", weeks: [5, 12], chance: 0.25 }] },
      { label: "한 번만 해 본다", effects: { popularity: 5, stamina: -8 }, result: "한 번의 방송으로 클립 열두 개가 돌아다닌다." },
      { label: "하지 않는다", effects: {}, result: "아직은 경기에만 집중하고 싶다." },
    ],
  },
  {
    id: "fan_gift", tab: "news", trigger: "random",
    title: "팬 선물 도착",
    text: "숙소로 팬들이 보낸 선물과 손편지가 도착했다. \"{name} 선수 늘 응원해요!\"",
    effects: { condition: 5 },
  },
  {
    id: "rumor", tab: "inbox", trigger: "random", weightTrait: "scandal",
    title: "악성 루머",
    text: "{name}에 대한 근거 없는 루머가 커뮤니티에 퍼지고 있다. '연습을 안 한다', '팀원과 싸웠다'는 내용이다.",
    choices: [
      { label: "직접 해명한다", check: { stat: "reputation", diff: 10 },
        success: { effects: { reputation: 5, condition: 2 }, result: "연습실 영상을 올리자 분위기가 반전됐다. \"이걸 보고도 루머를 믿냐\"" },
        fail: { effects: { reputation: -2, condition: -5 }, result: "해명할수록 말꼬리를 잡힌다. 차라리 가만히 있을 걸.", followUp: { event: "rumor_spread", weeks: [3, 6], chance: 0.5 } } },
      { label: "무시한다", effects: { reputation: -3 }, result: "며칠 지나면 잊히겠지...", followUp: { event: "rumor_spread", weeks: [3, 6], chance: 0.5 } },
      { label: "법적 대응한다", effects: { money: -1000000, reputation: 5 }, note: "몇 주 뒤 결과가 와요 (사과문·합의금)", result: "변호사 사무실을 다녀왔다. 증거는 충분하다고 한다.",
        followUp: [{ event: "rumor_apology", weeks: [3, 6], chance: 0.6 }, { event: "rumor_settlement", weeks: [6, 10], chance: 0.5 }] },
    ],
  },
  {
    id: "volunteer", tab: "inbox", trigger: "random",
    title: "봉사 활동 초대",
    text: "구단에서 지역 연탄 나눔 봉사에 함께하자는 연락이 왔다.",
    choices: [
      { label: "참여한다", effects: { reputation: 7, stamina: -8, teamRelation: 2 }, result: "얼굴에 검댕을 묻힌 사진이 구단 SNS에 올라갔다. 반응이 뜨겁다." },
      { label: "거절한다", effects: {}, result: "이번에는 연습을 택했다." },
    ],
  },

  // ===== E. 몸 상태 =====
  {
    id: "wrist_pain", tab: "inbox", trigger: "lowStamina", chance: 0.4, weightTrait: "injury_prone",
    title: "손목 통증",
    text: "무리한 탓인지 손목이 욱신거린다. 마우스를 잡을 때마다 찌릿하다.",
    choices: [
      { label: "병원에 간다", effects: { stamina: 15, skipTraining: true }, note: "다음 주 훈련 없음", result: "의사: \"초기라 다행이에요. 일주일만 쉬세요.\"" },
      { label: "테이핑하고 계속한다", check: { stat: "stamina", diff: 15 },
        success: { effects: { condition: -3 }, result: "테이핑이 생각보다 효과가 있다. 통증이 가라앉았다." },
        fail: { effects: { reaction: -3, stamina: -5 }, result: "참을수록 심해진다. 결국 반응속도가 떨어졌다.", risk: { trait: "injury_prone", chance: 0.05 } } },
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
    text: "오늘 솔로 랭크에서 5연패 중이다. 화면을 보니 열이 오른다.",
    choices: [
      { label: "이길 때까지 돌린다", check: { stat: "mental", diff: 55 },
        success: { effects: { reaction: 2, condition: 2 }, result: "새벽 3시, 5연승으로 마무리. 오늘의 나는 꺾이지 않았다." },
        fail: { effects: { condition: -8, stamina: -5 }, result: "10연패. 키보드를 내려치려다 겨우 참았다.", risk: { trait: "tilt", chance: 0.04 } } },
      { label: "오늘은 접는다", effects: { condition: 4 }, result: "산책하고 돌아와 일찍 잤다. 내일의 나는 이길 것이다." },
    ],
  },
  {
    id: "late_night", tab: "inbox", trigger: "random",
    title: "무너진 생활 패턴",
    text: "새벽까지 영상을 보다 잠드는 날이 이어지고 있다. 아침 스크림에 자꾸 늦는다.",
    choices: [
      { label: "알람을 맞추고 패턴을 고친다", check: { stat: "focus", diff: 50 },
        success: { effects: { condition: 6, focus: 1 }, result: "일주일 만에 아침형 인간이 됐다. 스크림 집중력이 확 올랐다." },
        fail: { effects: { condition: -4 }, result: "알람 다섯 개를 다 끄고 잤다. 패턴 고치기는 생각보다 어렵다." } },
      { label: "그냥 이대로 지낸다", effects: { stamina: 5, teamRelation: -2 }, risk: { trait: "night_owl", chance: 0.04 }, result: "동료들이 아침마다 나를 깨우러 온다. 슬슬 눈치가 보인다." },
    ],
  },
  {
    id: "offseason_trip", tab: "inbox", trigger: "random", need: { minWeek: 47 },
    title: "비시즌 여행",
    text: "친구들이 비시즌에 해외 여행을 가자고 한다.",
    choices: [
      { label: "다녀온다", effects: { condition: 15, stamina: 15 }, risk: { trait: "slow_starter", chance: 0.04 }, result: "일주일 동안 게임 생각을 한 번도 안 했다. 완전히 충전됐다." },
      { label: "연습실에 남는다", effects: { laning: 2, condition: -3 }, result: "다들 떠난 연습실. 남들이 쉴 때 한 걸음 더." },
    ],
  },
  {
    id: "form_swing", tab: "inbox", trigger: "afterWin", chance: 0.15,
    title: "들쭉날쭉한 손감",
    text: "이긴 경기에서도 잘 될 때와 안 될 때가 크게 갈렸다.",
    choices: [
      { label: "감에 맡기고 그대로 간다", effects: { matchBoost: 0.04 }, risk: { trait: "inconsistent", chance: 0.03 }, result: "감이 좋을 때는 좋을 때를 즐기자." },
      { label: "기본기 연습으로 다진다", effects: { focus: 2, stamina: -5 }, result: "막타 연습 1시간. 지루하지만 확실한 길." },
    ],
  },

  // ===== 후보 생활 =====
  {
    id: "bench_long", tab: "inbox", trigger: "benchLong", cooldown: 12,
    title: "길어지는 후보 생활",
    text: "후보로 지낸 지 꽤 됐다. 경기장 대기실에서 동료들의 경기를 모니터로만 본다.",
    choices: [
      { label: "비시즌에 이적하고 싶다고 말한다", effects: { transferListed: true }, note: "비시즌 이적 제안이 늘어남", result: "단장: \"알겠다. 좋은 팀을 알아봐 주마.\"" },
      { label: "주전을 되찾을 때까지 버틴다", effects: { mental: 2, condition: -2 }, result: "오늘도 가장 늦게까지 연습실 불을 켜 두었다." },
    ],
  },

  // ===== F. 나쁜 특성 극복 (그 특성이 있을 때만) =====
  {
    id: "fix_glass", tab: "inbox", trigger: "random", need: { trait: "glass_mental" },
    title: "멘탈 상담 프로그램",
    text: "구단 심리 상담사가 멘탈 관리 프로그램을 권했다.",
    choices: [
      { label: "참여한다", effects: { money: -2000000 }, cure: { trait: "glass_mental", chance: 0.4 }, result: "상담사: \"실수한 장면 말고, 잘한 장면부터 떠올려 보세요.\"" },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_injury", tab: "inbox", trigger: "random", need: { trait: "injury_prone" },
    title: "재활 프로그램",
    text: "트레이너가 손목·허리 재활 프로그램을 제안했다.",
    choices: [
      { label: "참여한다", effects: { stamina: -10 }, cure: { trait: "injury_prone", chance: 0.4 }, result: "고무줄 운동이 이렇게 힘든 줄 몰랐다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_scandal", tab: "inbox", trigger: "random", need: { trait: "scandal" },
    title: "이미지 개선 제안",
    text: "구단 홍보팀이 이미지 개선을 위해 봉사 활동을 제안했다.",
    choices: [
      { label: "참여한다", effects: { reputation: 5 }, cure: { trait: "scandal", chance: 0.3 }, result: "카메라가 꺼진 뒤에도 끝까지 남아 정리를 도왔다. 누군가 그걸 보고 있었다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_lazy", tab: "inbox", trigger: "random", need: { trait: "lazy" },
    title: "루틴 코치",
    text: "생활 루틴을 잡아 주는 코치를 붙여 주겠다고 한다.",
    choices: [
      { label: "받아들인다", effects: { stamina: -5 }, cure: { trait: "lazy", chance: 0.4 }, result: "아침 7시 기상, 8시 스트레칭. 첫 주는 지옥이었다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_stubborn", tab: "inbox", trigger: "random", need: { trait: "stubborn" },
    title: "메타 공부 모임",
    text: "팀원들이 새 메타를 같이 공부하자고 한다.",
    choices: [
      { label: "참여한다", effects: { adapt: 2, teamRelation: 3 }, cure: { trait: "stubborn", chance: 0.4 }, result: "남의 말을 듣는 것도 실력이라는 걸 알게 됐다." },
      { label: "내 방식대로 한다", effects: {} },
    ],
  },
  {
    id: "fix_inconsistent", tab: "inbox", trigger: "random", need: { trait: "inconsistent" },
    title: "경기 루틴 만들기",
    text: "코치가 경기 전 루틴을 같이 만들어 보자고 한다.",
    choices: [
      { label: "루틴을 만든다", effects: { focus: 1 }, cure: { trait: "inconsistent", chance: 0.4 }, result: "물 한 잔, 손목 스트레칭, 심호흡 세 번. 나만의 의식이 생겼다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_slow", tab: "inbox", trigger: "random", need: { trait: "slow_starter" },
    title: "비시즌 개인 훈련 캠프",
    text: "시즌 초에 몸이 늦게 풀리는 문제를 잡아 주는 캠프가 있다.",
    choices: [
      { label: "참가한다", effects: { money: -1000000, stamina: -5 }, cure: { trait: "slow_starter", chance: 0.4 }, result: "남들보다 2주 먼저 시즌 모드에 들어갔다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_tilt", tab: "inbox", trigger: "random", need: { trait: "tilt" },
    title: "랭크 휴식 선언",
    text: "한동안 랭크를 쉬며 마음을 다잡아 보면 어떨까?",
    choices: [
      { label: "일주일 랭크를 끊는다", effects: { condition: 3 }, cure: { trait: "tilt", chance: 0.4 }, result: "랭크 없이 보낸 일주일. 생각보다 마음이 편하다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_spender", tab: "inbox", trigger: "random", need: { trait: "spender" },
    title: "재무 상담",
    text: "구단이 선수들을 위한 재무 상담을 연다고 한다.",
    choices: [
      { label: "상담을 받는다", effects: {}, cure: { trait: "spender", chance: 0.5 }, result: "지난달 카드 내역을 보고 할 말을 잃었다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_night", tab: "inbox", trigger: "random", need: { trait: "night_owl" },
    title: "수면 클리닉",
    text: "수면 패턴을 바로잡아 주는 클리닉을 소개받았다.",
    choices: [
      { label: "다닌다", effects: { money: -500000 }, cure: { trait: "night_owl", chance: 0.4 }, result: "자기 전 휴대폰 금지. 그게 가장 어려웠다." },
      { label: "괜찮다", effects: {} },
    ],
  },
  {
    id: "fix_stage", tab: "news", trigger: "champion", need: { trait: "stage_fright" }, cooldown: 1,
    title: "큰 무대를 이겨냈다",
    text: "결승 무대를 겪고 나니 긴장이 한결 덜하다.",
    effects: {}, cure: { trait: "stage_fright", chance: 0.5 },
  },

  // ===== G. 오래 가는 계약·활동 / 후속 연락 =====
  {
    id: "sponsor_offer", tab: "inbox", trigger: "random", need: { minPopularity: 50 }, cooldown: 26,
    title: "개인 스폰서 제안",
    text: "게이밍 기어 회사에서 {name}에게 시즌 스폰서 계약을 제안했다. \"인기만 유지해 주시면 됩니다.\"",
    choices: [
      { label: "계약한다", effects: { activity: "sponsor", popularity: 2 }, result: "계약서에 사인했다. 이제 인기 관리도 일이다." },
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
      { label: "바로 사과 방송을 한다", check: { stat: "reputation", diff: 0 },
        success: { effects: { reputation: 1, condition: -3 }, result: "진심 어린 사과에 \"이 정도면 됐다\"는 반응. 오히려 호감이 늘었다." },
        fail: { effects: { reputation: -4, condition: -6 }, result: "사과문 문장 하나가 또 논란이 됐다. 한동안 방송을 쉬기로 했다." } },
      { label: "별일 아니라며 넘긴다", effects: { reputation: -7 }, risk: { trait: "scandal", chance: 0.05 }, result: "\"별일 아니다\"라는 말이 더 큰 별일이 됐다." },
    ],
  },
  {
    id: "rumor_spread", tab: "inbox", trigger: "followUp",
    title: "루머가 더 퍼졌다",
    text: "루머가 기사로까지 나왔다. 팬들이 해명을 기다리고 있다.",
    choices: [
      { label: "지금이라도 해명한다", effects: { reputation: 2, condition: -5 }, result: "늦었지만 진심은 통했다. 기사에 정정 문구가 붙었다." },
      { label: "법적 대응한다", effects: { money: -2000000, reputation: 4 }, note: "몇 주 뒤 결과가 와요 (사과문·합의금)", result: "이번엔 끝까지 간다.",
        followUp: [{ event: "rumor_apology", weeks: [3, 6], chance: 0.7 }, { event: "rumor_settlement", weeks: [6, 10], chance: 0.6 }] },
      { label: "계속 무시한다", effects: { reputation: -6, popularity: -3 }, result: "침묵이 인정처럼 보이기 시작했다." },
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
  {
    id: "slump_video", tab: "inbox", trigger: "followUp",
    title: "감독님의 영상 편집본",
    text: "감독님이 USB 하나를 건넸다. \"네가 제일 잘했던 경기들만 모아 놨다. 한번 봐라.\"",
    choices: [
      { label: "밤새 돌려 본다", effects: { condition: 10, mental: 2 }, result: "화면 속의 나는 두려움이 없었다. 그때의 감각이 조금씩 돌아온다." },
      { label: "감독님과 같이 본다", effects: { condition: 8, shotcall: 1, reputation: 2 }, result: "감독: \"여기 봐, 이 판단. 이게 너야.\" 장면마다 설명을 들으니 더 와닿는다." },
    ],
  },
  {
    id: "conflict_after", tab: "inbox", trigger: "followUp",
    title: "{player} 선수와의 어색한 공기",
    text: "지난번 다툼 이후 {player} 선수와 말을 거의 안 한다. 게임 중 콜도 짧아졌다. 다른 팀원들도 눈치를 본다.",
    choices: [
      { label: "밥 한번 먹자고 한다", check: { stat: "reputation", diff: 0 },
        success: { effects: { relation: 30, teamRelation: 2 }, result: "{player}: \"...사실 나도 먼저 말 걸고 싶었어.\" 그날 국밥이 유난히 맛있었다." },
        fail: { effects: { relation: 5 }, result: "{player}: \"다음에.\" 짧은 대답. 그래도 말은 걸었다." } },
      { label: "경기로만 소통한다", effects: { relation: -10, focus: 1 }, result: "프로는 실력으로 말한다. ...그런데 팀 게임이다." },
    ],
  },
  {
    id: "mentee_debut", tab: "news", trigger: "followUp", need: { flag: "mentee" },
    title: "📰 '{name}의 제자' 1군 데뷔",
    text: "{name}에게 배운 연습생이 1군 무대에 데뷔했다. 데뷔 인터뷰에서 그는 \"{name} 선배가 가르쳐 준 대로 했다\"며 고개를 숙였다.",
    effects: { reputation: 5, popularity: 2, unflag: "mentee" },
  },

  // ===== I. 스타 등급·평판 등급 (data/fame.js) =====
  {
    id: "ad_local", tab: "inbox", trigger: "random", need: { minPopularity: 40, maxPopularity: 59 }, cooldown: 16,
    title: "광고 촬영 제의",
    text: "PC방 체인에서 {name}을(를) 모델로 지역 광고를 찍고 싶다고 연락이 왔다. 촬영은 하루면 끝난다고 한다.",
    choices: [
      { label: "촬영한다", effects: { money: 3000000, stamina: -6, popularity: 2 }, result: "동네 PC방마다 내 얼굴이 붙었다. 어머니가 사진을 찍어 보냈다." },
      { label: "연습이 먼저다", effects: { condition: 2 } },
    ],
  },
  {
    id: "ad_gear", tab: "inbox", trigger: "random", need: { minPopularity: 60, maxPopularity: 79 }, cooldown: 16,
    title: "광고 모델 제의",
    text: "게이밍 기어 브랜드에서 {name}을(를) 신제품 광고 모델로 쓰고 싶어 한다. \"요즘 가장 뜨는 {pos}잖아요.\"",
    choices: [
      { label: "모델이 된다", effects: { money: 10000000, stamina: -8, popularity: 3 }, result: "내 이름이 박힌 마우스패드가 나왔다. 하나는 숙소 책상에." },
      { label: "정중히 거절한다", effects: { reputation: 1 } },
    ],
  },
  {
    id: "ad_cf", tab: "inbox", trigger: "random", need: { minPopularity: 80 }, cooldown: 16,
    title: "대기업 CF 모델 제의",
    text: "대기업 광고 에이전시에서 연락이 왔다. TV 광고 모델 제의다. e스포츠 선수로는 이례적인 일이라며 기사도 날 거라고 한다.",
    choices: [
      { label: "CF를 찍는다", effects: { money: 30000000, stamina: -10, popularity: 4, condition: 3 }, result: "지하철 광고판에 내 얼굴. 모르는 사람들이 사진을 찍는다." },
      { label: "시즌에 집중한다", effects: { reputation: 3 }, result: "\"선수는 경기장에서 빛나야죠.\" 이 말이 기사 제목이 됐다." },
    ],
  },
  {
    id: "endorse_offer", tab: "inbox", trigger: "random", need: { minPopularity: 70 }, cooldown: 40,
    title: "대형 브랜드 개인 스폰서 제안",
    text: "글로벌 브랜드에서 {name}에게 개인 스폰서 계약을 제안했다. 조건은 단 하나, \"지금 인기를 유지해 주세요.\"",
    choices: [
      { label: "계약한다", effects: { activity: "endorse", popularity: 2 }, result: "계약금보다 무거운 건 '인기를 유지하라'는 그 한 줄이다." },
      { label: "거절한다", effects: {} },
    ],
  },
  {
    id: "variety_show", tab: "inbox", trigger: "random", need: { minPopularity: 45 }, cooldown: 20,
    title: "예능 출연 제의",
    text: "인기 예능 프로그램에서 프로게이머 특집에 {name}을(를) 섭외하고 싶다고 한다.",
    choices: [
      { label: "출연한다", check: { stat: "popularity", diff: 55 },
        success: { effects: { popularity: 7, condition: 4, stamina: -6 }, result: "MC의 질문에 받아친 한마디가 '오늘의 명장면'으로 뽑혔다." },
        fail: { effects: { popularity: 2, stamina: -6 }, result: "긴장해서 말을 더듬었다. 편집에서 거의 다 잘렸다.", risk: { trait: "scandal", chance: 0.02 } } },
      { label: "거절한다", effects: {} },
    ],
  },
  {
    id: "ambassador", tab: "inbox", trigger: "random", need: { minReputation: 40 }, cooldown: 30,
    title: "리그 홍보대사 제안",
    text: "리그 사무국에서 {name}에게 올 시즌 리그 홍보대사를 맡아 달라고 했다. \"선수들의 모범이 되어 주셨으면 합니다.\"",
    choices: [
      { label: "맡는다", effects: { reputation: 6, popularity: 3, stamina: -5 }, result: "개막 행사 무대에 섰다. 리그의 얼굴이 된다는 건 이런 기분이구나." },
      { label: "경기에 집중하고 싶다", effects: { condition: 2 } },
    ],
  },
  {
    id: "charity", tab: "inbox", trigger: "random", need: { minReputation: 20 }, cooldown: 20,
    title: "자선 행사 초대",
    text: "소아 병동 아이들과 게임을 하는 자선 행사에 {name}을(를) 초대하고 싶다는 연락이 왔다.",
    choices: [
      { label: "참석하고 기부도 한다", effects: { reputation: 5, condition: 5, money: -500000 }, result: "한 아이가 사인 대신 같이 사진을 찍자고 했다. 그 사진을 휴대폰 배경으로 했다." },
      { label: "일정이 맞지 않는다", effects: {} },
    ],
  },
  {
    id: "mentor", tab: "inbox", trigger: "random", need: { minReputation: 30 }, cooldown: 20,
    title: "유망주 멘토링 요청",
    text: "2부의 한 유망주가 {name}에게 조언을 구하고 싶다며 연락해 왔다. \"한 번만 시간 내 주실 수 있을까요?\"",
    choices: [
      { label: "시간을 내서 돕는다", effects: { reputation: 4, shotcall: 1, stamina: -4 }, result: "\"선배님 말씀 다 적어 갑니다!\" 노트를 세 장이나 채웠다." },
      { label: "바빠서 거절한다", effects: { reputation: -1 } },
    ],
  },
  {
    id: "discipline", tab: "inbox", trigger: "random", need: { maxReputation: -20 }, cooldown: 16,
    title: "리그 징계 위원회 소환",
    text: "최근 언행이 문제가 되어 리그 징계 위원회가 {name}을(를) 불렀다. 해명할 기회를 준다고 한다.",
    choices: [
      { label: "공식 사과한다", effects: { reputation: 7, popularity: -2 }, result: "고개를 숙였다. 위원회는 경고로 마무리했다." },
      { label: "해명 없이 버틴다 (벌금)", effects: { reputation: -5, money: -2000000, condition: -5 }, result: "벌금 고지서가 날아왔다. 기사 댓글은 보지 않기로 했다." },
    ],
  },
  {
    id: "hate_flood", tab: "news", trigger: "random", need: { maxReputation: -30 }, cooldown: 12,
    title: "📰 {name} SNS에 악플 폭주",
    text: "{name}의 SNS에 비난 댓글이 쏟아지고 있다. 커뮤니티에서도 연일 논란이 이어지는 중이다.",
    effects: { condition: -6 },
  },
  {
    id: "team_warning", tab: "inbox", trigger: "random", need: { maxReputation: -40 }, cooldown: 16,
    title: "구단 경고",
    text: "단장: \"{name}, 요즘 구단으로 항의 전화가 너무 많이 온다. 계속 이러면 감독님도 너를 쓰기 어렵다.\"",
    choices: [
      { label: "반성하고 조심하겠다고 한다", effects: { reputation: 5, condition: -2 }, result: "단장: \"말뿐이 아니길 바란다.\"" },
      { label: "내 실력으로 보여주겠다고 받아친다", check: { stat: "score", diff: 70 },
        success: { effects: { reputation: -2, popularity: 3, matchBoost: 0.05 }, result: "단장이 한숨을 쉬었다. \"...그래, 보여 줘 봐.\"" },
        fail: { effects: { reputation: -6, condition: -5 }, result: "단장: \"그 실력이 어디 있는데?\" 할 말이 없었다." } },
    ],
  },
  {
    id: "villain_fans", tab: "news", trigger: "random", need: { maxReputation: -60, minPopularity: 40 }, cooldown: 26,
    title: "📰 '악동' {name}에 열광하는 팬들",
    text: "논란이 끊이지 않지만, 거침없는 {name}의 캐릭터를 좋아하는 팬들도 늘고 있다. \"악역이 있어야 리그가 재밌다\"는 반응.",
    effects: { popularity: 2 },
  },

  // ===== J. 시그니처 픽 (js/signature.js) — 숙련도 100이 된 주에만 =====
  {
    id: "signature_found", tab: "inbox", trigger: "signature", cooldown: 0,
    title: "✒️ 혼잣말: '{champ}'",
    text: "(연습이 끝난 밤, 모니터를 끄지 못한 채 중얼거린다)\n\"...이상하네. '{champ}'만 잡으면 손이 먼저 움직여. 상대가 뭘 할지 보이고, 스킬이 내가 생각한 자리에 정확히 떨어져.\"\n\"이렇게까지 손에 맞는 챔피언은 처음이야. 혹시... 이게 내 시그니처 픽일까?\"",
    choices: [
      { label: "맞다. 이게 내 시그니처 픽이다", effects: { setSignature: true }, result: "모니터 속 '{champ}'을(를) 한참 바라봤다. 이제 이 챔피언은 나의 이름이다." },
      { label: "아니다. 아직 더 맞는 챔피언이 있을 거야", effects: {}, result: "아직은 이르다. 더 손에 맞는 챔피언이 어딘가 있을 것이다." },
    ],
  },

  // ===== H. 다른 선수가 나오는 연락 =====
  {
    id: "rival_taunt", tab: "inbox", trigger: "random", who: "rival", need: { minWeek: 13 }, cooldown: 26,
    title: "{player}의 도발",
    text: "{pteam}의 {player} 선수가 인터뷰에서 말했다. \"{name} 선수랑 붙으면 라인전은 제가 이길 것 같네요.\"",
    choices: [
      { label: "맞받아친다 (라이벌 선언)", effects: { activity: "rival", popularity: 3, relation: -25, flag: { rivalStory: true } }, note: "시즌 끝까지 그 팀과 경기할 때 경기력 +5%",
        result: "\"그 말, 경기장에서 그대로 돌려 드릴게요.\" 기사 댓글이 천 개를 넘었다.",
        followUp: { event: "rival_presser", weeks: [4, 8], chance: 0.8 } },
      { label: "점잖게 넘긴다", effects: { reputation: 3, relation: 5 }, result: "\"좋은 선수죠. 경기장에서 뵙겠습니다.\" 어른스러운 대응이라는 평가." },
    ],
  },
  {
    id: "rival_presser", tab: "inbox", trigger: "followUp", need: { flag: "rivalStory" },
    title: "🎤 라이벌 매치 기자회견",
    text: "{player}와(과)의 라이벌 구도가 화제가 되면서 리그가 특별 기자회견을 열었다. 둘이 나란히 앉았다. 기자: \"서로에게 한마디씩 부탁드립니다.\"",
    choices: [
      { label: "웃으며 악수를 청한다", effects: { reputation: 5, relation: 20, unflag: "rivalStory" }, result: "{player}도 피식 웃었다. \"코트 밖에서는 친구로 하죠.\" 훈훈한 장면이 하이라이트로 돌았다." },
      { label: "끝까지 눈을 피하지 않는다", check: { stat: "mental", diff: 60 },
        success: { effects: { popularity: 6, matchBoost: 0.06, relation: -10 }, result: "먼저 눈을 피한 쪽은 {player}였다. 커뮤니티: \"기 싸움 승리\"" },
        fail: { effects: { popularity: 2, condition: -5, relation: -10 }, result: "{player}가 여유롭게 웃었다. 괜히 내가 긴장했다." } },
    ],
  },
  {
    id: "duo_offer", tab: "inbox", trigger: "random", who: "otherPro",
    title: "{player}의 솔랭 듀오 제안",
    text: "{pteam}의 {player} 선수가 솔로 랭크 듀오를 하자고 연락해 왔다.",
    choices: [
      { label: "같이 한다", effects: { reaction: 1, popularity: 2, stamina: -5, relation: 12 }, result: "듀오 12연승. 방송 클립이 커뮤니티에 올라왔다." },
      { label: "같이 하면서 메타 이야기도 나눈다", effects: { masteryMetaOne: 4, stamina: -8, relation: 8 }, result: "{player}의 팀이 요즘 연습하는 챔피언 이야기를 들었다. 쏠쏠하다." },
      { label: "정중히 거절한다", effects: {} },
    ],
  },
  {
    id: "teammate_slump", tab: "inbox", trigger: "random", who: "teammateBad",
    title: "{player} 선수의 고민",
    text: "같은 팀 {player} 선수가 요즘 '{trait}' 때문에 힘들어한다. 팀 성적에도 영향이 있는 것 같다.",
    choices: [
      { label: "따로 시간을 내서 돕는다", effects: { cureOther: 0.4, stamina: -10, reputation: 3, relation: 20 }, result: "새벽까지 이야기를 들어 줬다. {player}: \"고맙다, 진짜.\"" },
      { label: "감독님께 이야기한다", effects: { cureOther: 0.2, relation: 5 }, result: "감독님이 따로 면담을 잡았다." },
      { label: "내 연습에 집중한다", effects: { relation: -5 } },
    ],
  },
  {
    id: "teammate_trouble", tab: "inbox", trigger: "random", who: "teammate", cooldown: 16,
    title: "{player} 선수가 사고를 칠 것 같다",
    text: "새벽에 술을 마신 {player} 선수가 방송을 켜서 다른 팀 험담을 하겠다고 한다.",
    choices: [
      { label: "말린다", check: { stat: "shotcall", diff: 50 },
        success: { effects: { reputation: 4, relation: 15 }, result: "휴대폰을 뺏어 들고 라면을 끓여 줬다. 다음 날 {player}: \"어제 고마웠다...\"" },
        fail: { effects: { relation: -10, otherRisk: { trait: "scandal", chance: 0.4 } }, result: "\"네가 뭔데?\" 말리다 오히려 싸움이 됐다." } },
      { label: "같이 어울린다", effects: { condition: 5, relation: 10, otherRisk: { trait: "scandal", chance: 0.6 } }, risk: { trait: "scandal", chance: 0.04 }, result: "그날 밤은 즐거웠다. 아침이 오기 전까지는." },
      { label: "모른 척한다", effects: { otherRisk: { trait: "scandal", chance: 0.5 } } },
    ],
  },
  {
    id: "friend_trouble", tab: "inbox", trigger: "random", who: "otherPro", cooldown: 16,
    title: "{player} 선수에게서 온 메시지",
    text: "친분이 있는 {pteam}의 {player} 선수가 심판 판정을 비난하는 글을 올리려 한다며 의견을 물어 왔다.",
    choices: [
      { label: "올리지 말라고 설득한다", effects: { reputation: 3, relation: 8 }, result: "{player}: \"네 말이 맞다. 지웠어.\"" },
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
