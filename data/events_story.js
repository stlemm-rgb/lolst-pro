// ===== 받은 연락 리뉴얼 ① 시즌 흐름 · 새 시스템 연결 · 이어지는 이야기 (2026-10-08) =====
// 모양은 data/events.js 맨 위 설명과 같아요. 여기서는 EVENTS 목록에 더해요.
// 트리거 설명: data/events.js 맨 위 '2026-10-08 리뉴얼' (주차 트리거는 js/friends.js storyTriggerContext)

EVENTS.push(
  // ===== K. 시즌 흐름 (그 시기에만, always: 연락 수 상한과 상관없이) =====
  {
    id: "season_goal", tab: "inbox", trigger: "seasonGoal", always: true,
    title: "🗓️ {year}시즌, 나의 목표",
    text: "새 시즌이 시작됐다. 연습실 화이트보드에 각자 올해 목표를 적기로 했다. 펜을 들었다.",
    choices: [
      { label: "\"우승\" 두 글자를 크게 적는다", effects: { flag: { goalTitle: true }, matchBoost: 0.03 }, note: "시즌이 끝날 때 우승했는지 돌아봐요",
        result: "동료들이 휘파람을 불었다. 이제 말한 만큼 해내야 한다." },
      { label: "\"작년보다 성장하기\"", effects: { flag: { goalGrowth: true }, focus: 1 }, note: "시즌이 끝날 때 성장을 돌아봐요",
        result: "작지만 확실한 목표. 매일 1%씩." },
      { label: "\"즐겁게, 다치지 않고\"", effects: { flag: { goalFun: true }, condition: 6 }, result: "감독님이 웃으며 밑에 한 줄을 보탰다. \"그리고 이기면 더 즐겁다.\"" },
    ],
  },
  {
    id: "media_day", tab: "inbox", trigger: "mediaDay", always: true, chance: 0.8,
    title: "🎤 정규 시즌 미디어데이",
    text: "정규 시즌 개막을 앞두고 미디어데이가 열렸다. 사회자가 {name}에게 마이크를 넘겼다. \"올 시즌 각오 한마디!\"",
    choices: [
      { label: "\"올해는 저희가 우승합니다.\"", followUp: [{ event: "media_vow_high", weeks: [10, 14] }, { event: "media_vow_low", weeks: [10, 14] }], check: { stat: "popularity", diff: 45 },
        success: { effects: { popularity: 5, matchBoost: 0.04 }, result: "객석에서 함성이 터졌다. 오늘의 헤드라인은 {team}." },
        fail: { effects: { popularity: 1, reputation: -2 }, result: "객석이 조용하다. 누군가 \"작년 순위는요?\"라고 외쳤다." } },
      { label: "\"한 경기 한 경기 최선을 다하겠습니다.\"", effects: { reputation: 3 }, result: "모범 답안. 기자들은 조금 아쉬워했다." },
      { label: "다른 팀 선수를 지목해 도발한다", followUp: { event: "media_taunt_reply", weeks: [3, 6], chance: 0.8 }, effects: { popularity: 4, reputation: -3 }, risk: { trait: "scandal", chance: 0.02 }, result: "지목당한 선수가 웃으며 손가락으로 나를 가리켰다. 시즌이 재밌어지겠다." },
    ],
  },
  {
    id: "msi_depart", tab: "inbox", trigger: "msiDepart", always: true,
    title: "✈️ MSI 출국 전날",
    text: "내일 MSI 출국이다. 세계 각 지역 챔피언들이 모인다. 짐을 싸다 말고 생각에 잠긴다.",
    choices: [
      { label: "해외 팀 경기 영상을 몰아 본다", effects: { masteryMetaAll: 3, stamina: -5 }, result: "낯선 스타일의 정글 동선. 미리 봐 두길 잘했다." },
      { label: "가족과 영상 통화를 한다", effects: { condition: 10 }, result: "어머니: \"밥 잘 챙겨 먹고, 다치지 말고.\" 늘 같은 말이 오늘따라 든든하다." },
      { label: "공항에 나온 팬들에게 인사한다", effects: { popularity: 4, stamina: -3 }, result: "새벽 공항에 팬 백 명이 나왔다. 플래카드에 내 이름이 있었다." },
    ],
  },
  {
    id: "worlds_depart", tab: "inbox", trigger: "worldsDepart", always: true,
    title: "🌍 월드 챔피언십 출국",
    text: "꿈의 무대, 월드 챔피언십. 출국 전 마지막 팀 미팅에서 감독님이 한 사람씩 각오를 물었다.",
    choices: [
      { label: "\"트로피를 들고 돌아오겠습니다.\"", check: { stat: "mental", diff: 60 },
        success: { effects: { matchBoost: 0.07, popularity: 3 }, result: "말하고 나니 정말 그렇게 될 것 같다. 손끝이 뜨겁다." },
        fail: { effects: { condition: -1, popularity: 2 }, result: "말은 했지만 밤새 잠이 오지 않았다. 부담이 어깨를 누른다." } },
      { label: "\"우리 다섯 명이면 됩니다.\"", effects: { teamRelation: 6, condition: 4 }, result: "다섯 손이 가운데로 모였다. \"하나, 둘, 셋!\"" },
      { label: "말없이 고개만 끄덕인다", effects: { focus: 1 }, result: "말보다 경기로. 비행기에서 상대 분석 노트를 다시 펼쳤다." },
    ],
  },
  {
    id: "promotion_eve", tab: "inbox", trigger: "promotion", always: true,
    title: "⚔️ 승강전을 앞두고",
    text: "다음 주는 승강전이다. 이기면 다음 시즌 1부, 지면 2부. 숙소 분위기가 무겁다.",
    choices: [
      { label: "동료들을 모아 다독인다", check: { stat: "shotcall", diff: 55 },
        success: { effects: { teamRelation: 6, matchBoost: 0.06 }, result: "\"우리가 여기까지 어떻게 왔는지 생각해.\" 다들 눈빛이 달라졌다." },
        fail: { effects: { teamRelation: 2, condition: -3 }, result: "말이 생각만큼 나오지 않았다. 그래도 다들 고개를 끄덕였다." } },
      { label: "밤새 상대를 분석한다", effects: { masteryMetaAll: 3, stamina: -10 }, result: "상대 탑의 버릇을 찾았다. 3레벨 타이밍." },
      { label: "평소처럼 지낸다", effects: { condition: 6 }, result: "특별한 경기일수록 평범하게." },
    ],
  },
  {
    id: "contract_year", tab: "inbox", trigger: "contractYear", always: true,
    title: "📝 계약 마지막 해",
    text: "올 시즌으로 계약이 끝난다. 비시즌({window}주차)부터 재계약과 다른 팀 제안이 온다. 단장이 지나가며 어깨를 두드렸다. \"생각해 둔 거 있나?\"",
    choices: [
      { label: "\"여기서 계속 뛰고 싶습니다.\"", followUp: { event: "contract_stay_word", weeks: [14, 16] }, effects: { reputation: 3, teamRelation: 3 }, result: "단장: \"좋은 소리 들으니 기분 좋네.\" 구단 분위기가 훈훈하다." },
      { label: "\"시장 평가를 받아 보고 싶습니다.\"", effects: { transferListed: true }, note: "비시즌 이적 제안이 늘어남", result: "단장이 잠시 멈칫했다. \"...프로답네.\"" },
      { label: "\"남은 경기로 보여 드리겠습니다.\"", followUp: [{ event: "contract_prove_good", weeks: [15, 16] }, { event: "contract_prove_bad", weeks: [15, 16] }], effects: { matchBoost: 0.05, mental: 1 }, result: "말보다 숫자로. 남은 시즌이 곧 협상 테이블이다." },
    ],
  },
  {
    id: "allstar_vote", tab: "inbox", trigger: "allStarVote", always: true,
    title: "⭐ 올스타 팬 투표 마감 직전",
    text: "다음 주 올스타전 팬 투표가 곧 마감된다. 구단 SNS 담당자가 투표 독려 글을 올려 달라고 부탁했다.",
    choices: [
      { label: "직접 투표 독려 영상을 찍는다", followUp: [{ event: "allstar_picked_after", weeks: [2, 2] }, { event: "allstar_missed_after", weeks: [2, 2] }], effects: { popularity: 4, stamina: -3 }, result: "\"한 표만 주세요!\" 어색한 하트 포즈가 밈이 됐다." },
      { label: "\"투표는 팬분들 몫이죠.\"", followUp: [{ event: "allstar_picked_after", weeks: [2, 2] }, { event: "allstar_missed_after", weeks: [2, 2] }], effects: { reputation: 3 }, result: "담담한 한마디에 오히려 팬들이 더 열심히 투표했다는 후문." },
      { label: "팬 감사 라이브 방송을 켠다", followUp: [{ event: "allstar_picked_after", weeks: [2, 2] }, { event: "allstar_missed_after", weeks: [2, 2] }], check: { stat: "popularity", diff: 50 },
        success: { effects: { popularity: 6, condition: 4 }, result: "동시 시청자 3만 명. 채팅창이 응원으로 가득 찼다." },
        fail: { effects: { popularity: 2, stamina: -4 }, result: "시청자가 생각보다 적었다. 그래도 와 준 팬들과 오래 이야기했다." } },
    ],
  },
  // 시즌 돌아보기 (비시즌 첫 주): 시즌 목표에 따라
  {
    id: "review_title_ok", tab: "news", trigger: "seasonReview", always: true, need: { flag: "goalTitle", titleThisYear: true },
    title: "🏆 목표 달성: \"우승\"",
    text: "시즌 초 화이트보드에 적었던 두 글자. {name}은(는) 그 약속을 지켰다. 팬들은 \"말한 대로 해내는 선수\"라며 열광했다.",
    effects: { popularity: 5, reputation: 4, unflag: ["goalTitle", "goalGrowth", "goalFun"] },
  },
  {
    id: "review_title_fail", tab: "inbox", trigger: "seasonReview", always: true, need: { flag: "goalTitle", titleThisYear: false },
    title: "지키지 못한 약속",
    text: "시즌 초 \"우승\"이라고 적었던 화이트보드가 아직 연습실에 걸려 있다. 커뮤니티에서는 그 사진이 돌고 있다.",
    choices: [
      { label: "팬들에게 사과 글을 올린다", effects: { reputation: 4, popularity: 1, unflag: ["goalTitle", "goalGrowth", "goalFun"] }, result: "\"내년엔 꼭.\" 짧은 글에 응원 댓글이 달렸다." },
      { label: "화이트보드를 그대로 둔다", effects: { mental: 2, unflag: ["goalTitle", "goalGrowth", "goalFun"] }, result: "지우지 않았다. 내년에 그 글자 옆에 체크 표시를 하기 위해." },
    ],
  },
  {
    id: "review_growth", tab: "news", trigger: "seasonReview", always: true, need: { flag: "goalGrowth" },
    title: "📈 한 시즌을 돌아보며",
    text: "\"작년보다 성장하기.\" 시즌 기록을 정리하던 코치가 {name}의 데이터를 보고 고개를 끄덕였다. \"작년의 너였으면 못 했을 플레이가 많아.\"",
    effects: { condition: 8, mental: 1, unflag: ["goalTitle", "goalGrowth", "goalFun"] },
  },
  {
    id: "review_fun", tab: "news", trigger: "seasonReview", always: true, need: { flag: "goalFun" },
    title: "😊 즐거웠던 한 시즌",
    text: "\"즐겁게, 다치지 않고.\" 시즌을 마친 {name}이(가) 웃었다. 결과와 상관없이 후회 없는 한 해였다.",
    effects: { condition: 12, stamina: 10, unflag: ["goalTitle", "goalGrowth", "goalFun"] },
  },
  {
    id: "offseason_plan", tab: "inbox", trigger: "offseasonPlan", always: true,
    title: "🏖️ 비시즌 계획",
    text: "시즌이 끝났다. 다음 시즌까지 남은 시간을 어떻게 쓸까?",
    choices: [
      { label: "고향에 내려가 푹 쉰다", followUp: { event: "home_rest_after", weeks: [4, 7], chance: 0.7 }, effects: { condition: 15, stamina: 20 }, result: "어머니가 해 준 밥을 먹고 열두 시간을 잤다." },
      { label: "해외 부트캠프에 참가한다", followUp: { event: "bootcamp_memory", weeks: [4, 7], chance: 0.8 }, effects: { money: -3000000, laning: 2, macro: 1, stamina: -8 }, result: "다른 지역의 랭크는 확실히 스타일이 달랐다. 새로운 시야가 생겼다." },
      { label: "개인 방송으로 팬들과 보낸다", followUp: { event: "offseason_stream_after", weeks: [4, 7], chance: 0.7 }, effects: { popularity: 5, stamina: -5 }, result: "비시즌에도 나를 기다려 주는 사람들이 있었다." },
    ],
  },

  // ===== L. 새 시스템과 연결 (그 일이 생긴 주에) =====
  {
    id: "rival_signed", tab: "inbox", trigger: "rivalSigned", always: true,
    title: "⚔️ {player} 선수가 왔다",
    text: "같은 포지션의 {player} 선수(스탯 점수 {score})가 팀에 합류했다. 첫 훈련 날, 연습실 문 앞에서 마주쳤다. 서로 어색하게 고개를 숙였다.\n(이 선수의 스탯 점수가 나보다 {gap} 이상 높아지면 2군으로 밀려요. 4주마다 판정)",
    choices: [
      { label: "먼저 다가가 반갑게 맞는다", followUp: { event: "rival_practice", weeks: [5, 8] }, effects: { relation: 25, reputation: 3 }, result: "\"잘 부탁해. 서로 좋은 자극이 되자.\" {player}가 환하게 웃었다." },
      { label: "경쟁자로 선을 긋는다", followUp: [{ event: "rival_held", weeks: [8, 8] }, { event: "rival_close", weeks: [8, 8] }], check: { stat: "mental", diff: 55 },
        success: { effects: { relation: -15, laning: 2, focus: 1 }, result: "자리를 내줄 생각은 없다. 그날부터 연습량을 두 배로 늘렸다." },
        fail: { effects: { relation: -20, condition: -6 }, result: "신경이 쓰여 연습이 손에 안 잡힌다. {player}의 랭크 점수만 자꾸 확인하게 된다." } },
      { label: "신경 쓰지 않는다", effects: { condition: 2 }, result: "내가 할 일만 하면 된다." },
    ],
  },
  {
    id: "fame_up", tab: "inbox", trigger: "fameUp", always: true,
    title: "🌟 이제 '{tier}'",
    text: "팬이 {fans}을(를) 넘었다. 길에서 알아보는 사람도, 사인 요청도 부쩍 늘었다. 구단에서 팬 이벤트를 열어 보자고 한다.",
    choices: [
      { label: "팬 사인회를 연다", effects: { popularity: 4, stamina: -6 }, result: "세 시간 동안 사인을 했다. 손목이 얼얼하지만 마음은 꽉 찼다." },
      { label: "감사 손편지를 SNS에 올린다", effects: { reputation: 3, popularity: 2 }, result: "삐뚤빼뚤한 손글씨가 오히려 진심 같다는 반응." },
      { label: "\"아직 갈 길이 멀다\"며 연습실로", effects: { mental: 1, focus: 1 }, result: "인기는 성적을 따라온다. 오늘도 연습실 불을 켰다." },
    ],
  },
  {
    id: "skin_made", tab: "inbox", trigger: "skinMade", always: true,
    title: "🎨 우승 스킨 디자인 회의",
    text: "게임사 디자이너들이 숙소를 찾아왔다. 월드 우승 스킨 '{champ}'의 컨셉을 정하는 자리다. \"선수님이 원하는 걸 최대한 담을게요.\"",
    choices: [
      { label: "결승 마지막 장면을 담아 달라고 한다", effects: { popularity: 4 }, result: "디자이너가 눈을 반짝였다. \"그 장면, 우리도 수십 번 돌려 봤어요.\"" },
      { label: "팀원들과 맞춘 컨셉을 제안한다", effects: { teamRelation: 6, reputation: 2 }, result: "다섯 스킨에 같은 문양을 넣기로 했다. 영원히 함께 기억될 팀." },
      { label: "가족 이름 이니셜을 숨겨 달라고 한다", effects: { condition: 10, reputation: 2 }, result: "스킨 어딘가에 작은 글자가 숨었다. 나와 가족만 아는 비밀." },
    ],
  },
  {
    id: "benched_now", tab: "inbox", trigger: "benchedNow", always: true,
    title: "📋 2군 통보",
    text: "감독: \"다음 경기부터는 {player}가 나간다. 미안하지만 지금은 그게 팀에 맞다.\" 짧은 면담이 끝났다.",
    choices: [
      { label: "받아들이고 이를 간다", effects: { mental: 2, laning: 1, condition: -4 }, result: "대기실 모니터 앞에서 노트를 폈다. 다시 돌아갈 자리를 위해." },
      { label: "감독에게 이유를 묻는다", check: { stat: "reputation", diff: 10 },
        success: { effects: { condition: 3, focus: 1 }, result: "감독이 부족한 부분을 하나하나 짚어 줬다. 무엇을 고쳐야 하는지 분명해졌다." },
        fail: { effects: { condition: -3, mental: 1 }, result: "\"결정은 내가 한다.\" 문이 닫혔다. 그래도 무엇을 보여 줘야 하는지는 알 것 같다." } },
      { label: "{player}에게 축하를 건넨다", effects: { relation: 15, reputation: 3, condition: -2 }, result: "{player}: \"...고마워. 금방 다시 경쟁하자.\"" },
    ],
  },
  {
    id: "friend_left", tab: "inbox", trigger: "friendLeft", always: true,
    title: "👋 {player}의 이적",
    text: "친하게 지내던 {player} 선수가 팀을 떠나 {pteam}(으)로 간다. 짐을 싸는 뒷모습이 낯설다.",
    choices: [
      { label: "조촐한 송별회를 연다", effects: { relation: 10, teamRelation: 3, condition: 3, money: -300000 }, result: "{player}: \"다른 팀 가도 연락할게. 너랑 붙으면 안 봐준다.\"" },
      { label: "\"다음에 적으로 만나자\"며 웃는다", effects: { relation: 5, matchBoost: 0.03 }, result: "주먹을 맞부딪쳤다. 다음 맞대결이 벌써 기다려진다." },
      { label: "담담하게 보낸다", effects: {}, result: "프로의 세계에서 이별은 일상이다. 그래도 빈 자리가 크다." },
    ],
  },

  // ===== M. 이어지는 이야기 (연작) =====
  // ① 해외 구단의 러브콜 (3단계)
  {
    id: "overseas_offer", tab: "inbox", trigger: "random", need: { minScore: 72, tier: 1, minPopularity: 40, noFlag: "overseasDone" }, seasonMax: 1,
    title: "📨 해외 구단의 비밀 접촉",
    text: "모르는 번호로 메시지가 왔다. 중국 리그 명문 구단의 관계자라고 한다. \"지금 연봉의 두 배 이상을 생각하고 있습니다. 한번 만나시죠.\"",
    choices: [
      { label: "관심을 보인다", effects: { flag: { overseasTalk: true } }, result: "\"다음 주에 에이전트가 연락드릴 겁니다.\" 심장이 빠르게 뛴다.",
        followUp: { event: "overseas_meeting", weeks: [2, 4] } },
      { label: "구단에 바로 알린다", effects: { reputation: 3, salaryRaise: 0.05, flag: { overseasDone: true } }, result: "단장이 놀라더니 다음 날 연봉 인상안을 들고 왔다. \"우리 선수 뺏길 수 없지.\"" },
      { label: "단호히 거절한다", effects: { reputation: 4, teamRelation: 3, flag: { overseasDone: true } }, result: "\"저는 여기서 이루고 싶은 게 있습니다.\" 이 말이 어떻게 새어 나갔는지 팬들 사이에 퍼졌다." },
    ],
  },
  {
    id: "overseas_meeting", tab: "inbox", trigger: "followUp",
    title: "🤝 에이전트와의 만남",
    text: "호텔 라운지. 해외 구단 에이전트가 계약서 초안을 내밀었다. 숫자가 비현실적이다. \"결정은 천천히 하셔도 됩니다. 다만 이 제안이 영원하진 않아요.\"",
    choices: [
      { label: "제안을 언론에 흘려 몸값을 올린다", check: { stat: "popularity", diff: 60 },
        success: { effects: { salaryRaise: 0.15, reputation: -3, flag: { overseasDone: true } }, gain: { trait: "negotiator", chance: 0.25 },
          result: "기사가 나가자 구단이 다급해졌다. 연봉 인상안이 그날 밤 도착했다." },
        fail: { effects: { reputation: -7, teamRelation: -5, flag: { overseasDone: true } }, result: "\"돈만 보는 선수\"라는 기사가 났다. 구단도, 팬도 차갑다." } },
      { label: "정중히 거절하고 돌아온다", effects: { reputation: 3, condition: 3, flag: { overseasDone: true } }, result: "계약서를 돌려주고 나오는 길, 이상하게 마음이 가벼웠다." },
      { label: "\"가고 싶다\"고 구단에 알린다", effects: { transferListed: true, teamRelation: -4, flag: { overseasDone: true } }, note: "비시즌 이적 제안이 늘어남",
        result: "단장이 한참 말이 없었다. \"...알겠다. 네 뜻은 존중하마.\"", followUp: { event: "overseas_rumor", weeks: [1, 3] } },
    ],
  },
  {
    id: "overseas_rumor", tab: "news", trigger: "followUp",
    title: "📰 \"{name}, 해외 진출설\"",
    text: "{name}의 해외 리그 이적설이 보도됐다. 팬들 사이에서는 \"가지 마\"와 \"더 큰 무대로\"가 팽팽하다.",
    effects: { popularity: 4 },
  },
  // ② 승부조작 브로커 (2~3단계)
  {
    id: "fixer", tab: "inbox", trigger: "random", need: { minWeek: 13, minScore: 55, noFlag: "fixerDone" }, seasonMax: 1,
    title: "⚠️ 수상한 메시지",
    text: "익명 계정에서 메시지가 왔다. \"다음 경기 첫 세트만 '살짝' 져 주시면 됩니다. 아무도 모를 거예요. 사례는 충분히.\"",
    choices: [
      { label: "바로 리그에 신고한다", effects: { reputation: 6, flag: { fixerDone: true } }, result: "캡처와 함께 신고서를 보냈다. 리그 담당자: \"용기 내 주셔서 감사합니다.\"",
        followUp: { event: "fixer_caught", weeks: [3, 6], chance: 0.8 } },
      { label: "대화를 캡처해 구단에 알린다", effects: { reputation: 4, teamRelation: 2, flag: { fixerDone: true } }, result: "단장의 얼굴이 굳었다. \"잘했다. 나머지는 우리가 처리하마.\"",
        followUp: { event: "fixer_caught", weeks: [4, 8], chance: 0.6 } },
      { label: "무시하고 차단한다", effects: { flag: { fixerDone: true } }, result: "차단 버튼을 눌렀다. 찜찜함이 남는다.",
        followUp: { event: "fixer_probe", weeks: [4, 8], chance: 0.5 } },
    ],
  },
  {
    id: "fixer_caught", tab: "news", trigger: "followUp",
    title: "📰 승부조작 브로커 검거",
    text: "e스포츠 승부조작 브로커 일당이 검거됐다. 수사 관계자는 \"{name} 선수의 제보가 결정적이었다\"고 밝혔다. 리그는 {name}에게 감사패를 전달하기로 했다.",
    effects: { reputation: 6, popularity: 4 },
  },
  {
    id: "fixer_probe", tab: "inbox", trigger: "followUp",
    title: "🔍 리그 조사관의 연락",
    text: "리그 조사관: \"브로커 일당의 휴대폰에서 {name} 선수에게 보낸 메시지가 나왔습니다. 혹시 기억나는 게 있으신가요?\"",
    choices: [
      { label: "받은 메시지를 모두 제출한다", effects: { reputation: 4, stamina: -4 }, result: "조사관: \"신고하지 않은 건 아쉽지만, 협조 감사합니다.\"" },
      { label: "\"기억나지 않는다\"고 한다", check: { stat: "reputation", diff: 20 },
        success: { effects: { condition: -3 }, result: "조사관이 고개를 끄덕였다. 의심받지는 않았다. 그래도 마음이 무겁다." },
        fail: { effects: { reputation: -10, condition: -8 }, risk: { trait: "scandal", chance: 0.05 }, result: "\"기록에는 읽음 표시가 있던데요.\" 의혹 기사가 나기 시작했다." } },
    ],
  },
  // ③ 병원의 꼬마 팬 (약속 → 우승하면 결말)
  {
    id: "sick_fan", tab: "inbox", trigger: "random", need: { minPopularity: 30, noFlag: "fanPromise" }, cooldown: 52,
    title: "💌 병원에서 온 편지",
    text: "구단으로 손편지가 왔다. 소아 병동에 있는 열 살 팬이라고 한다. \"{name} 선수 경기 보는 게 제일 좋아요. 우승하는 거 꼭 보고 싶어요.\"",
    choices: [
      { label: "영상 편지를 보낸다", effects: { reputation: 3, popularity: 2 }, result: "\"빨리 나아서 경기장에 놀러 와!\" 촬영하다 목이 메었다." },
      { label: "직접 병원에 찾아간다", effects: { reputation: 5, condition: 6, stamina: -6, flag: { fanPromise: true } }, result: "아이는 나를 보자마자 울음을 터뜨렸다. 새끼손가락을 걸었다. \"우승하면 트로피 들고 다시 올게.\"",
        followUp: { event: "sick_fan_reply", weeks: [6, 12], chance: 0.8 } },
      { label: "\"우승 트로피를 보여 줄게\"라고 답장한다", effects: { matchBoost: 0.05, flag: { fanPromise: true } }, result: "답장을 부치고 나니 이번 시즌이 조금 더 무거워졌다. 좋은 무게다." },
    ],
  },
  {
    id: "sick_fan_reply", tab: "news", trigger: "followUp",
    title: "💌 꼬마 팬의 답장",
    text: "병원의 꼬마 팬에게서 다시 편지가 왔다. \"선수님 덕분에 주사도 안 무서워요. 경기 있는 날은 병실 친구들이랑 다 같이 봐요!\"",
    effects: { condition: 8, mental: 1 },
  },
  {
    id: "fan_promise_kept", tab: "news", trigger: "champion", need: { flag: "fanPromise" }, cooldown: 1, always: true,
    title: "🏆 약속을 지켰다",
    text: "우승 다음 날, {name}은(는) 트로피를 들고 소아 병동을 찾았다. 꼬마 팬과의 약속을 지킨 이야기가 알려지며 리그 전체가 따뜻해졌다.",
    effects: { reputation: 7, popularity: 5, condition: 10, unflag: "fanPromise" },
  },
  // ④ 베테랑의 고민 (27세부터)
  {
    id: "veteran_doubt", tab: "inbox", trigger: "random", need: { minAge: 27, noFlag: "vetDone" }, seasonMax: 1,
    title: "🌙 베테랑의 밤",
    text: "새로 들어온 신인의 반응속도를 보고 놀랐다. 나도 저랬던 때가 있었다. 언제까지 뛸 수 있을까.",
    choices: [
      { label: "\"아직 할 수 있다.\"", effects: { mental: 2, condition: 5 }, result: "손은 조금 느려졌지만, 판을 읽는 눈은 그때보다 훨씬 좋다." },
      { label: "은퇴한 선배에게 전화한다", effects: { condition: 3 }, result: "선배: \"야, 오랜만이다! 밥이나 먹자.\"", followUp: { event: "senior_advice", weeks: [1, 3] } },
      { label: "코치진과 진로 상담을 한다", effects: { reputation: 2 }, result: "감독: \"네 경험은 팀의 자산이야. 천천히 생각해 보자.\"", followUp: { event: "coach_offer", weeks: [6, 12], chance: 0.8 } },
    ],
  },
  {
    id: "senior_advice", tab: "inbox", trigger: "followUp",
    title: "🍲 선배와의 저녁",
    text: "은퇴한 선배가 국밥을 앞에 두고 말했다. \"나 은퇴하고 제일 후회되는 게 뭔지 알아? 몸 관리 안 한 거. 그리고... 즐기지 못한 거.\"",
    choices: [
      { label: "몸 관리 루틴을 배운다", effects: { stamina: 10, flag: { vetDone: true } }, gain: { trait: "iron_body", chance: 0.2 }, result: "다음 날부터 아침 스트레칭 30분. 몸이 확실히 다르다." },
      { label: "\"즐기는 법\"을 다시 생각한다", effects: { condition: 12, mental: 1, flag: { vetDone: true } }, result: "이기기 위해서만 하던 게임. 처음 게임이 좋았던 이유가 떠올랐다." },
    ],
  },
  {
    id: "coach_offer", tab: "inbox", trigger: "followUp",
    title: "📋 코치 제의",
    text: "감독: \"은퇴하면 우리 팀 코치로 오면 좋겠다. 지금 당장은 아니고, 언젠가.\"",
    choices: [
      { label: "\"언젠가 꼭 그러겠습니다.\"", effects: { reputation: 4, teamRelation: 4, flag: { vetDone: true } }, result: "미래가 하나 생겼다. 그래서인지 오늘 경기가 더 소중하다." },
      { label: "\"아직은 현역입니다.\"", effects: { mental: 2, matchBoost: 0.05, flag: { vetDone: true } }, result: "감독이 웃었다. \"그래, 그 눈빛이면 몇 년은 더 뛰겠다.\"" },
    ],
  },
  // ⑤ 해설 게스트 제의
  {
    id: "caster_offer", tab: "inbox", trigger: "random", need: { minAge: 24, minPopularity: 45 }, cooldown: 30,
    title: "🎙️ 해설 게스트 제의",
    text: "경기가 없는 주에 중계 해설 게스트로 나와 달라는 연락이 왔다. 다른 팀 경기를 분석해야 한다.",
    choices: [
      { label: "출연한다", check: { stat: "shotcall", diff: 60 },
        success: { effects: { popularity: 4, reputation: 3, macro: 1 }, result: "\"저 타이밍엔 바론이 아니라 미드 2차입니다.\" 예측이 그대로 맞았다. 해설진이 박수를 쳤다." },
        fail: { effects: { popularity: 2, stamina: -4 }, result: "말이 자꾸 꼬였다. 그래도 \"선수 시점 이야기가 신선하다\"는 반응." } },
      { label: "선수로만 경기장에 서고 싶다", effects: { condition: 2 } },
    ],
  },
  // 솔로 랭크 시즌 1위 (js/dashboard.js crownLadderKing → queueTrigger ladderKing)
  {
    id: "ladder_king", tab: "inbox", trigger: "ladderKing", always: true,
    title: "👑 솔로 랭크 시즌 1위!",
    text: "랭크 초기화 직전, 순위표 맨 위에 내 이름이 찍혀 있었다. {points}점. 프로 선수들이 모인 구간에서 끝까지 버텼다. 휴대폰에는 축하 메시지가 쏟아지고, 커뮤니티에는 '랭크 1위 인증' 글이 올라왔다.",
    choices: [
      { label: "1위 인증 방송을 켠다", effects: { popularity: 4, stamina: -3 }, result: "마지막 판 다시 보기를 틀자 채팅창이 왕관 이모티콘으로 가득 찼다." },
      { label: "팀원들에게 한턱낸다", effects: { teamRelation: 4, money: -300000, condition: 4 }, result: "\"다음 시즌엔 내가 1위 한다.\" 고기 굽는 소리 사이로 도발이 오갔다." },
      { label: "다음 시즌도 1위를 노린다", effects: { focus: 1, condition: 2 }, result: "왕관은 잠깐이다. 초기화된 점수판을 보며 다시 큐를 잡았다." },
    ],
  },
);

// ===== 254 ③ 시간 진행: A 시대 변화가 내 진로에 · B 내 기록 회상 (always: 연락 수 상한 밖, 트리거: js/friends.js timeTriggerContext) =====
EVENTS.push(
  // A1. 2015 리그제 (2014년 이전 데뷔)
  {
    id: "era_league_2015", tab: "inbox", trigger: "eraLeague", always: true,
    title: "📅 단판에서 리그로",
    text: "토너먼트 몇 판으로 끝나던 시즌이 이제 매주 경기를 치르는 리그가 됐다. 코치가 새 일정표를 붙이며 말했다. \"이제 한 번 잘하는 걸로는 안 돼. 일 년 내내 잘해야 한다.\"",
    choices: [
      { label: "긴 시즌에 맞춰 체력 관리 루틴을 짠다", effects: { stamina: 10 }, result: "수면 시간, 식사, 스트레칭. 화이트보드 한쪽이 내 생활 계획표로 채워졌다." },
      { label: "매주 상대 분석 노트를 쓰기로 한다", effects: { masteryMetaOne: 2, stamina: -4 }, result: "노트 첫 장에 다음 주 상대 팀 이름을 적었다. 이제 이게 매주 반복된다." },
    ],
  },
  // A2. 2020 무관중 경기
  {
    id: "era_empty_2020", tab: "inbox", trigger: "eraEmpty", always: true,
    title: "🏟️ 관중석이 비었다",
    text: "팬데믹으로 경기장에 관중이 들어오지 못하게 됐다. 함성이 사라진 경기장에는 키보드 소리와 팀 보이스만 울린다.",
    choices: [
      { label: "개인 방송으로 팬들과 소통한다", effects: { popularity: 2, stamina: -2 }, result: "\"경기장 대신 채팅으로 응원할게요!\" 채팅창이 응원 문구로 가득 찼다." },
      { label: "조용한 경기장에 맞춰 팀 보이스를 연습한다", effects: { teamRelation: 2 }, result: "함성에 묻히던 콜이 이제 또렷하게 들린다. 서로 말끝을 맞추는 연습을 했다." },
      { label: "하던 대로 한다", effects: { condition: 5 }, result: "관중이 있든 없든 협곡은 똑같다. 마음이 오히려 편하다." },
    ],
  },
  // A3. 2021 프랜차이즈 — 2군(콜업) / 1군 두 가지 글
  {
    id: "era_franchise_academy", tab: "inbox", trigger: "eraFranchise", always: true, need: { tier: 2 },
    title: "🔼 이제 올라가는 길은 콜업",
    text: "승강전이 사라졌다. 우리 팀은 이제 1군 구단의 2군이다. 코치가 1군의 같은 포지션 선수 자료를 건넸다. \"이제 올라가는 길은 이쪽이다. 저 자리보다 잘하면 부른다.\"",
    choices: [
      { label: "1군 경기를 집중해서 분석한다", effects: { masteryMetaOne: 2, stamina: -4 }, result: "1군 경기 다시 보기를 틀었다. 내가 저 자리에 있었다면 어떻게 했을지 적어 봤다." },
      { label: "2군 동료들과 호흡부터 맞춘다", effects: { teamRelation: 3 }, result: "\"어차피 올라갈 거면 같이 잘해서 올라가자.\" 처음 보는 동료들과 늦게까지 스크림을 돌렸다." },
    ],
  },
  {
    id: "era_franchise_main", tab: "inbox", trigger: "eraFranchise", always: true, need: { tier: 1 },
    title: "🏛️ 강등 없는 리그",
    text: "프랜차이즈 시대가 열렸다. 이제 성적이 나빠도 떨어지지 않는다. 대신 각 구단 2군에서 누가 치고 올라올지 모른다.",
    choices: [
      { label: "몇 년짜리 긴 계획을 세운다", effects: { mental: 1 }, result: "올해만 보지 않기로 했다. 노트에 3년 뒤의 나를 적어 봤다." },
      { label: "2군 선수들 경기도 챙겨 본다", effects: { condition: 5 }, result: "2군 경기에 같은 포지션 신인이 보였다. 아직 거칠지만 손이 빠르다. 긴장을 늦추면 안 되겠다." },
    ],
  },
  // B1. 데뷔 5년차 · 10년차
  {
    id: "career_anniv", tab: "inbox", trigger: "careerAnniv", always: true,
    title: "🎂 데뷔 {years}년차",
    text: "{debutYear}년 {debutTeam}, {debutAge}세. 프로 무대에 처음 섰던 그날로부터 {years}번째 시즌이다. 그때 점수 {debutScore}, 지금 {nowScore}.",
    choices: [
      { label: "데뷔 때 경기 영상을 다시 본다", effects: { mental: 1 }, result: "어설픈 동선, 떨리던 손. 그래도 그때의 나는 겁이 없었다." },
      { label: "팬들에게 그때 이야기를 남긴다", effects: { popularity: 1 }, result: "\"처음부터 봤어요\"라는 댓글이 생각보다 많았다." },
    ],
  },
  // B2. 첫 우승 3년 뒤
  {
    id: "title_anniv", tab: "inbox", trigger: "titleAnniv", always: true,
    title: "📸 첫 우승에서 3년",
    text: "구단이 {titleYear}년 {titleTeam}의 {titleName} 우승 사진을 보내왔다. 트로피를 든 다섯 명. 지금은 다른 유니폼을 입은 사람도 있다.",
    choices: [
      { label: "그때 동료들 단톡방에 사진을 올린다", effects: { relation: 3 }, result: "\"누구 머리 저게 뭐냐\" \"너 그날 울었잖아\" 오랜만에 단톡방이 시끄러웠다." },
      { label: "혼자 간직한다", effects: { condition: 5 }, result: "사진을 휴대폰 배경 화면으로 바꿨다. 다시 저 자리에 서고 싶다." },
    ],
  },
  // B3. 친정팀과 경기하는 주 (옛 동료가 그 팀에 있을 때, 1년에 한 번쯤)
  {
    id: "home_team", tab: "inbox", trigger: "homeTeam", always: true, cooldown: 52,
    title: "🏠 친정팀과 다시",
    text: "이번 주 상대는 {sinceYear}년부터 뛰었던 {oldteam}. 숙소 가는 길도, 연습실 자리도 아직 기억난다. 거기엔 {player}이(가) 아직 있다.",
    choices: [
      { label: "경기 전 {player}에게 연락한다", effects: { relation: 2 }, result: "\"오늘 지면 밥 사라\" \"너나 지갑 챙겨 와라\" 짧은 메시지 끝에 내기가 걸렸다." },
      { label: "말없이 경기로 보여 준다", effects: { condition: 3 }, result: "연락은 경기 끝나고 해도 된다. 오늘은 이기는 게 먼저다." },
    ],
  },
);

// ===== 257 ③ C 같은 사람이 다시 나옴 (always: 연락 수 상한 밖, 트리거: js/friends.js timeTriggerContext, 동료 기억 timeMatesWeekly) =====
const TIME_EVENT_RULES = {
  fullSeasonWeeks: 40,   // C3: 이만큼 같이 뛴 옛 동료만 (한 시즌쯤)
  juniorAge: 20,         // C2: 같이 뛸 때 이 나이 이하 + 나보다 어린 후배
  juniorTop: 30,         // C2: 리그 상위 몇 명에 들면
  juniorWeeks: [3, 30],  // C2: 확인하는 주 (점수 순위를 매주 다 세지 않게)
  homeCooldown: 52,      // 친정팀 연락 2가지가 같이 쉬는 주
};
EVENTS.push(
  // C1. 다시 한 팀 (한 해 넘게 떨어져 있던 옛 동료가 같은 팀에)
  {
    id: "mate_back", tab: "inbox", trigger: "mateBack", always: true, cooldown: 4,
    title: "🔁 다시 한 팀",
    text: "{leftYear}년에 팀을 떠났던 {player}이(가) 다시 같은 유니폼을 입었다. 숙소 문을 열자마자 한마디. \"내 자리 아직 있냐?\"",
    choices: [
      { label: "환영 회식을 연다", effects: { teamRelation: 2, money: -200000 }, result: "고기 굽는 소리 사이로 옛날 얘기가 끝없이 나왔다. 처음 보는 동료들도 금방 웃었다." },
      { label: "옛날처럼 듀오 랭크부터 돌린다", effects: { relation: 4, stamina: -2 }, result: "\"손은 안 녹슬었네.\" \"너는 그대로 못하네.\" 첫 판부터 내기가 걸렸다." },
      { label: "\"주전 자리는 양보 못 해\"", effects: { focus: 1 }, result: "{player}이(가) 웃으며 엄지를 들었다. \"그래야 재밌지.\"" },
    ],
  },
  // C2. 그 후배가 이렇게 컸다 (같이 뛸 때 20세 이하 후배가 다른 팀에서 리그 상위 30명) — 후배 멘토를 했으면 글이 다름
  {
    id: "junior_star", tab: "inbox", trigger: "juniorStar", always: true, cooldown: 4, need: { noFlag: "mentee" },
    title: "🌱 그 후배가 이렇게 컸다",
    text: "{togetherYear}년 같은 팀에서 {age}세 신인이던 {player}. 지금은 {pteam}의 주전으로 리그 상위 30명에 이름을 올렸다. 숙소 구석에서 라면 끓이던 모습이 아직 생생하다.",
    choices: [
      { label: "축하 메시지를 보낸다", effects: { relation: 3 }, result: "\"형도 보고 있었어요?\" \"밥은 이제 네가 사라.\" 답장이 바로 왔다." },
      { label: "\"아직 멀었다\" 다음 맞대결을 기다린다", effects: { condition: 3 }, result: "기사 캡처를 단톡방에 올리고 한 줄 적었다. \"다음에 붙으면 보자.\"" },
    ],
  },
  {
    id: "junior_star_mentor", tab: "inbox", trigger: "juniorStar", always: true, cooldown: 4, need: { flag: "mentee" },
    title: "🌱 그 후배가 이렇게 컸다",
    text: "{togetherYear}년 같은 팀에서 {age}세 신인이던 {player}이(가) {pteam}의 주전으로 리그 상위 30명에 들었다. 인터뷰에서 이렇게 말했다. \"신인 때 {name} 선배가 복기를 같이 봐 줬어요.\"",
    choices: [
      { label: "인터뷰 기사를 공유하며 축하한다", effects: { relation: 3, popularity: 1 }, result: "\"선배 덕분이에요.\" 댓글에 팬들이 '사제 관계'라는 말을 붙였다." },
      { label: "\"이제 배운 걸로 나를 이겨 봐\"", effects: { condition: 3, reputation: 1 }, result: "{player}이(가) 바로 답했다. \"이번 시즌에 꼭 이길게요.\"" },
    ],
  },
  // C3. 옛 동료와 적으로 (친구가 아닌 옛 동료와 떠난 뒤 첫 맞대결)
  {
    id: "exmate_vs", tab: "inbox", trigger: "exMateVs", always: true, cooldown: 4,
    title: "⚔️ 옛 동료와 적으로",
    text: "이번 주 상대 {pteam}에는 {untilYear}년까지 같은 팀이던 {player}이(가) 있다. 같이 스크림을 돌리던 시절, 그 선수의 버릇은 누구보다 잘 안다.",
    choices: [
      { label: "경기 전에 인사를 건넨다", effects: { relation: 2 }, result: "\"오랜만이다. 봐주는 거 없다.\" \"나도.\" 짧은 메시지에 웃음이 났다." },
      { label: "그 선수의 버릇을 분석한다", effects: { masteryMetaOne: 1 }, result: "예전 스크림 기록을 꺼냈다. 불리할 때마다 늘 같은 쪽으로 움직였다." },
    ],
  },
  // C5. 친정팀 (옛 동료가 남아 있지 않을 때 — 있으면 home_team)
  {
    id: "home_team_solo", tab: "inbox", trigger: "homeTeamSolo", always: true, cooldown: 52,
    title: "🏠 친정팀과 다시",
    text: "이번 주 상대는 {sinceYear}년부터 뛰었던 {oldteam}. 아는 얼굴은 거의 남지 않았지만, 경기장 가는 길은 아직 익숙하다.",
    choices: [
      { label: "예전 팬들에게 인사 영상을 올린다", effects: { popularity: 1 }, result: "\"그때 응원해 주신 분들, 오늘은 조금만 덜 응원해 주세요.\" 댓글이 웃음으로 가득 찼다." },
      { label: "말없이 경기로 보여 준다", effects: { condition: 3 }, result: "옛 팀과의 경기도 결국 한 경기다. 오늘은 이기는 게 먼저다." },
    ],
  },
);

// ===== 258 ③ D 경력에 따라 역할이 바뀜 (always: 연락 수 상한 밖, 트리거: js/friends.js timeTriggerContext) =====
Object.assign(TIME_EVENT_RULES, {
  rookieYears: [3, 5],   // D1: 데뷔 몇 년차에
  rookieAge: 19,         // D1: 우리 팀에 이 나이 이하 신인 (한 번)
  rookieWeeks: [3, 30],  // D1: 확인하는 주 (사이)
  pillarFrom: 6,         // D2: 이 연차부터
  pillarStanding: 60,    // D2: 팀 내 입지가 이 이상 (한 팀에 한 번)
  pillarWeeks: [5, 30],  // D2: 확인하는 주 (사이)
  stallFrom: 7,          // D3: 이 연차부터
  stallGrowth: 0.5,      // D3: 지난 2시즌 연속 점수 성장이 이것보다 작으면
  stallWeek: 4,          // D3: 새 시즌 이 주에
  stallGap: 3,           // D3: 한 번 받으면 몇 년 쉼
  veteranFrom: 9,        // D4: 이 연차부터, 팀 3연패 때
  veteranGap: 2,         // D4: 한 번 받으면 몇 년 쉼 (측정: 9년차부터 거의 해마다 3연패가 있음)
});
EVENTS.push(
  // D1. 첫 후배 (3~5년차, 우리 팀에 19세 이하 신인)
  {
    id: "first_junior", tab: "inbox", trigger: "firstJunior", always: true,
    title: "🐣 첫 후배",
    text: "{age}세 신인 {player}이(가) 쭈뼛거리며 다가왔다. \"선배는 하루를 어떻게 보내세요? 저도 따라 해 보고 싶어요.\" 어느새 {name}에게도 '선배'라는 말이 붙었다.",
    choices: [
      { label: "내 하루 루틴을 알려 준다", effects: { relation: 4, shotcall: 1, flag: { mentee: true } }, result: "아침 솔랭 두 판, 점심 뒤 복기, 스크림 전 손 풀기. 받아 적는 후배를 보니 내가 왜 이렇게 하는지 다시 정리됐다." },
      { label: "\"각자 자기 방식이 있어\" 내 연습에 집중한다", effects: { focus: 1 }, result: "후배는 고개를 끄덕이고 돌아갔다. 그날 연습은 유난히 잘 풀렸다." },
    ],
  },
  // D2. 팀의 기둥 (6년차+, 팀 내 입지가 높을 때)
  {
    id: "team_pillar", tab: "inbox", trigger: "teamPillar", always: true,
    title: "🏛️ 팀의 기둥",
    text: "감독이 {name}을(를) 따로 불렀다. \"다음 주부터 코치진 운영 회의에 같이 들어와 줄래? 선수들 생각을 제일 잘 아는 게 너야.\"",
    choices: [
      { label: "회의에 들어간다", effects: { reputation: 3, shotcall: 1 }, result: "밴픽 회의, 연습 일정, 신인 기용까지. 선수 자리에서는 보이지 않던 고민이 많았다." },
      { label: "\"저는 선수로만 집중하고 싶어요\"", effects: { condition: 5 }, result: "감독은 웃었다. \"그것도 답이다. 대신 경기장에서 보여 줘.\"" },
    ],
  },
  // D3. 성장 정체 (7년차+, 2시즌 연속 점수가 거의 그대로)
  {
    id: "growth_stall", tab: "inbox", trigger: "growthStall", always: true,
    title: "📉 멈춘 숫자",
    text: "{year1}년 {score1}점, {year2}년 {score2}점, {year3}년 {score3}점. 시즌 기록을 넘기던 {name}이(가) 손을 멈췄다. 두 시즌째 숫자가 움직이지 않는다.",
    choices: [
      { label: "안 하던 챔피언까지 폭을 넓힌다", effects: { masteryMetaAll: 2 }, result: "손에 안 익은 챔피언으로 솔랭을 돌렸다. 지는 판이 늘었지만, 오랜만에 배우는 게 재밌었다." },
      { label: "기본기부터 다시 한다", effects: { focus: 1 }, result: "CS 연습 모드를 켰다. 신인 때 하던 그 연습. 숫자가 조금씩 다시 올라가기 시작했다." },
      { label: "받아들이고 경험으로 싸운다", effects: { mental: 2 }, result: "손이 예전만큼 빠르지 않다는 걸 인정했다. 대신 상대가 무엇을 할지 먼저 보인다." },
    ],
  },
  // D4. 베테랑의 한마디 (9년차+, 팀 3연패)
  {
    id: "veteran_word", tab: "inbox", trigger: "veteranWord", always: true,
    title: "🗣️ 베테랑의 한마디",
    text: "3연패. 연습실이 조용하다. 누구도 먼저 입을 열지 않는다. 동료들의 눈이 팀에서 제일 오래 뛴 {name}에게 모였다.",
    choices: [
      { label: "팀 미팅을 연다", check: { stat: "shotcall", diff: 70 },
        success: { effects: { teamRelation: 4 }, result: "\"우리 연패한 거 처음 아니잖아.\" 지난 연패를 어떻게 끊었는지 이야기하자 굳어 있던 얼굴들이 풀렸다." },
        fail: { effects: { teamRelation: -1, condition: -3 }, result: "말이 길어질수록 분위기가 무거워졌다. 미팅은 아무 결론 없이 끝났다." } },
      { label: "말 대신 묵묵히 연습한다", effects: { mental: 1 }, result: "가장 먼저 출근해 가장 늦게 퇴근했다. 아무 말도 하지 않았지만, 다음 날 연습실 불이 일찍 켜졌다." },
    ],
  },
);

// ===== ④-2 3단계 (267): 자주 오는 연락의 선택이 몇 주 뒤 다시 언급됨 =====
// 후속 연락은 보낼 때 need를 다시 봄(안 맞으면 안 옴). who가 있으면 보낼 때 그 선수를 고름 (js/events.js firePendingEvents)
// need.topRank: 우리 팀 리그 순위 n위 안 / need.lowRank: n위 아래 (js/friends.js storyNeedOk)
EVENTS.push(
  // 미디어데이 "우승합니다" → 시즌 중반 순위에 따라
  {
    id: "media_vow_high", tab: "news", trigger: "followUp", need: { topRank: 3 },
    title: "📰 '우승합니다', 허세가 아니었다?",
    text: "미디어데이에서 \"올해는 저희가 우승합니다\"라고 했던 {name}. 시즌 중반, {team}은(는) 리그 상위권에 올라 있다. 커뮤니티에 그날 영상이 다시 돌고 있다.",
    effects: { popularity: 2, condition: 2 },
  },
  {
    id: "media_vow_low", tab: "inbox", trigger: "followUp", need: { lowRank: 6 },
    title: "📰 소환된 미디어데이 영상",
    text: "\"올해는 저희가 우승합니다.\" 미디어데이 영상이 커뮤니티에 다시 올라왔다. 지금 {team}의 순위는 아래쪽이다. 댓글이 빠르게 달린다.",
    choices: [
      { label: "\"시즌은 아직 안 끝났습니다.\"", effects: { mental: 1 }, result: "짧은 한 줄을 남겼다. 남은 경기로 답하면 된다." },
      { label: "웃으며 인정하는 글을 올린다", effects: { reputation: 2 }, result: "\"제가 말이 좀 앞섰네요. 그래도 목표는 그대로입니다.\" 의외로 응원 댓글이 많았다." },
      { label: "커뮤니티를 끄고 연습한다", effects: { condition: 2 }, result: "휴대폰을 엎어 두었다. 오늘은 마우스만 잡기로 했다." },
    ],
  },
  // 미디어데이 도발 → 같은 포지션 상대가 받아침
  {
    id: "media_taunt_reply", tab: "inbox", trigger: "followUp", who: "rival",
    title: "🎙️ {player}의 답",
    text: "미디어데이에서 내가 도발했던 일이 다시 화제다. {pteam}의 {player}가 인터뷰에서 웃으며 말했다. \"말은 들었습니다. 경기장에서 보죠.\"",
    choices: [
      { label: "\"기대하겠습니다.\"", effects: { popularity: 2 }, result: "짧은 한마디에 팬들이 맞대결 날짜를 세기 시작했다." },
      { label: "한 번 더 받아친다", effects: { popularity: 3, relation: -5 }, result: "기사 제목이 하나 더 늘었다. {player}는 이번엔 웃지 않았다." },
      { label: "대꾸하지 않는다", effects: { condition: 2 }, result: "말은 한 번이면 충분하다." },
    ],
  },
  // 계약 마지막 해 → 비시즌 직전
  {
    id: "contract_stay_word", tab: "inbox", trigger: "followUp",
    title: "📝 단장의 기억",
    text: "비시즌을 앞두고 단장이 불렀다. \"시즌 초에 여기서 계속 뛰고 싶다고 했지. 그 말, 잊지 않았다.\"",
    choices: [
      { label: "\"그 마음 그대로입니다.\"", effects: { teamRelation: 3 }, result: "단장이 고개를 끄덕였다. \"제안서 곧 보내마.\"" },
      { label: "\"조건은 들어 보고 싶어요.\"", result: "단장: \"당연하지. 그게 프로다.\" 분위기는 나쁘지 않았다." },
    ],
  },
  {
    id: "contract_prove_good", tab: "news", trigger: "followUp", need: { topRank: 4 },
    title: "📝 말보다 숫자로",
    text: "\"남은 경기로 보여 드리겠습니다.\" 계약 마지막 해에 한 말대로 {team}은(는) 상위권으로 시즌을 마쳤다. 단장이 기록지를 넘기며 고개를 끄덕였다.",
    effects: { reputation: 3 },
  },
  {
    id: "contract_prove_bad", tab: "news", trigger: "followUp", need: { lowRank: 5 },
    title: "📝 다 보여 주지 못한 시즌",
    text: "\"남은 경기로 보여 드리겠습니다.\" 팀 순위는 기대보다 아래였다. 그래도 단장은 \"끝까지 버틴 건 봤다\"고 했다.",
    effects: { mental: 1 },
  },
  // 비시즌 계획 → 새 시즌 초
  {
    id: "bootcamp_memory", tab: "inbox", trigger: "followUp",
    title: "✈️ 부트캠프에서 온 메시지",
    text: "비시즌 부트캠프 때 같은 랭크 게임에서 자주 만났던 해외 선수에게서 메시지가 왔다. \"Good luck this season. 대회에서 만나자.\"",
    choices: [
      { label: "반갑게 답장한다", effects: { condition: 3 }, result: "번역기를 두 번 돌려 답장을 보냈다. 이모티콘 하나가 돌아왔다." },
      { label: "그때 적은 노트를 다시 펼친다", effects: { mental: 1 }, result: "낯선 서버에서 적어 둔 메모. 다시 읽으니 놓친 게 보였다." },
    ],
  },
  {
    id: "home_rest_after", tab: "news", trigger: "followUp",
    title: "🏠 고향에서 온 사진",
    text: "비시즌에 고향에서 쉬다 왔더니, 동네 친구들이 개막전 단체 응원 사진을 보내왔다. 현수막 글씨가 삐뚤빼뚤하다.",
    effects: { condition: 3 },
  },
  {
    id: "offseason_stream_after", tab: "news", trigger: "followUp",
    title: "📺 비시즌 방송 시청자들",
    text: "비시즌 방송을 같이 보던 시청자들이 개막전 응원 채팅을 한꺼번에 올렸다. \"방송에서 말한 그 챔피언, 대회에서 보여 줘요!\"",
    effects: { popularity: 2 },
  },
  // 경기 후 인터뷰 "팀원들 덕분이에요" → 동료의 답
  {
    id: "interview_thanks", tab: "inbox", trigger: "followUp", who: "teammate",
    title: "🍖 {player}의 메시지",
    text: "{player}: \"인터뷰 봤다. 팀원들 덕분이라며? 오늘 고기는 내가 산다.\"",
    choices: [
      { label: "고맙게 얻어먹는다", effects: { relation: 4, condition: 2 }, result: "고기를 굽는 내내 {player}가 그 인터뷰 흉내를 냈다." },
      { label: "\"같이 복기나 하자\"", effects: { relation: 3, mental: 1 }, result: "밥 먹고 돌아와 둘이서 그 경기를 처음부터 다시 봤다." },
    ],
  },
  // 새 챔피언 "내가 먼저 파 본다" → 동료가 물어봄
  {
    id: "new_champ_ask", tab: "inbox", trigger: "followUp", who: "teammate",
    title: "🧪 '{champ}' 어떻게 하는 거야?",
    text: "{player}: \"너 {champ} 먼저 팠다며. 그 콤보 나도 좀 알려 줘.\"",
    choices: [
      { label: "콤보를 알려 준다", effects: { relation: 5, stamina: -2 }, result: "한 시간 넘게 붙잡고 알려 줬다. {player}가 처음으로 콤보를 성공하자 둘 다 소리를 질렀다." },
      { label: "같이 연습하자고 한다", effects: { relation: 3, masteryChamp: 5 }, result: "가르치다 보니 나도 몰랐던 틈이 보였다." },
      { label: "\"이건 아직 비밀이야\"", effects: { condition: 2 }, result: "{player}가 웃으며 혀를 찼다. \"치사하다, 진짜.\"" },
    ],
  },
  // 생일 → 다음 생일 언저리 / 가족
  {
    id: "birthday_mate", tab: "inbox", trigger: "followUp", who: "teammate",
    title: "🎂 오늘은 {player}의 생일",
    text: "오늘은 {player}의 생일이다. 내 생일에 다 같이 케이크를 잘랐던 게 생각난다. 그때 내 얼굴에 생크림을 묻힌 범인도 아직 기억난다.",
    choices: [
      { label: "생크림으로 갚아 준다", effects: { relation: 4, condition: 2 }, result: "연습실이 난장판이 됐다. 감독님도 웃으며 사진을 찍었다." },
      { label: "작은 선물을 준비한다", effects: { money: -300000, relation: 6 }, result: "{player}가 선물을 한참 들여다보다가 \"이런 거 처음 받아 본다\"고 했다." },
      { label: "축하 메시지만 보낸다", effects: { relation: 2 }, result: "\"생일 축하해. 오늘은 내가 서폿 해 줄게.\"" },
    ],
  },
  {
    id: "birthday_family_after", tab: "news", trigger: "followUp",
    title: "📱 아버지의 문자",
    text: "생일에 가족과 저녁을 먹은 뒤로, 아버지가 경기가 끝날 때마다 짧은 문자를 보낸다. 오늘은 \"잘했다\" 세 글자였다.",
    effects: { condition: 3 },
  },
);

// ===== ④-2 3단계 (269): 남은 후속 4개 — 슈퍼 세이브·경쟁자 합류·올스타·손목 통증 =====
// need.mateHere: 처음 연락의 선수(ctx.pid)가 아직 같은 팀 / pidAboveMe: 그 선수 스탯 점수가 나보다 높음(true)·낮음(false)
// need.allStarPicked: 올해 올스타에 뽑힘(true)·못 뽑힘(false) / maxStamina·minStamina: 지금 체력 (js/friends.js storyNeedOk)
// 짝(경쟁자·올스타·손목)은 같은 주에 둘 다 예약하고 조건이 맞는 하나만 옴
EVENTS.push(
  // 동료 슈퍼 세이브 "오늘 MVP는 너야" → 그 동료의 프로필 사진
  {
    id: "clutch_profile", tab: "news", trigger: "followUp", need: { mateHere: true },
    title: "📸 {player}의 새 프로필 사진",
    text: "{player}의 SNS 프로필 사진이 바뀌었다. 내가 \"오늘 MVP는 너야\"라고 말하던 인터뷰 캡처다. 팬들이 \"본인이 제일 좋아함\"이라며 놀리고 있다.",
    effects: { relation: 3, condition: 2 },
  },
  // "다음엔 내가 살려 줄게" → 약속을 기억하는 동료
  {
    id: "clutch_promise", tab: "inbox", trigger: "followUp", need: { mateHere: true },
    title: "🤝 {player}: \"약속 기억하지?\"",
    text: "{player}: \"저번에 다음엔 네가 살려 준다며. 이번 주 한타 때 내 쪽도 좀 봐 줘. 나 요즘 자꾸 먼저 잡힌다.\"",
    choices: [
      { label: "한타 콜을 같이 맞춰 본다", effects: { relation: 3, teamfight: 1, stamina: -3 }, result: "리플레이를 돌려 가며 누가 먼저 들어갈지 정했다. 연습 판에서 둘 다 살아 나왔다." },
      { label: "\"걱정 마, 약속은 지킨다\"", effects: { relation: 4 }, result: "{player}: \"말만 하지 말고.\" 웃으면서 주먹을 내밀었다." },
      { label: "\"이번엔 네가 알아서 살아\"", effects: { relation: 2, condition: 2 }, result: "{player}: \"치사하다 진짜.\" 단톡방에 내 말이 박제됐다." },
    ],
  },
  // 경쟁자 합류 "반갑게 맞는다" → 같이 연습하자는 부탁
  {
    id: "rival_practice", tab: "inbox", trigger: "followUp", need: { mateHere: true },
    title: "⚔️ {player}의 부탁",
    text: "같은 포지션의 {player}가 연습실에서 말을 걸었다. \"우리 둘이 라인전 연습 한 판 할래? 서로 약점 하나씩 말해 주기.\"",
    choices: [
      { label: "좋지, 한 판 하자", effects: { relation: 4, laning: 1, stamina: -3 }, result: "세 판을 내리 했다. 서로 \"그 타이밍은 반칙이지\"라며 웃었다." },
      { label: "내 약점부터 말해 달라고 한다", effects: { relation: 3, mental: 1 }, result: "{player}: \"너 2레벨 타이밍에 너무 정직해.\" 아프지만 맞는 말이었다." },
      { label: "오늘은 쉬자고 한다", effects: { condition: 2 }, result: "\"다음에 꼭.\" {player}가 손을 흔들었다." },
    ],
  },
  // "경쟁자로 선을 긋는다" → 두 달 뒤 스탯 점수 비교
  {
    id: "rival_held", tab: "news", trigger: "followUp", need: { mateHere: true, pidAboveMe: false },
    title: "⚔️ 주전 자리는 그대로",
    text: "{player}가 합류한 지 두 달. 주전 자리는 여전히 {name}의 것이다. 코치: \"둘 다 독기가 올라서 연습실 불이 꺼질 날이 없어.\"",
    effects: { reputation: 2, mental: 1 },
  },
  {
    id: "rival_close", tab: "inbox", trigger: "followUp", need: { mateHere: true, pidAboveMe: true },
    title: "⚔️ {player}가 바짝 쫓아왔다",
    text: "{player}의 스탯 점수가 나를 넘어섰다. 감독이 둘의 연습 기록을 나란히 놓고 보고 있다. 선을 그었던 그날이 떠오른다.",
    choices: [
      { label: "연습 시간을 늘린다", effects: { focus: 1, stamina: -6 }, result: "마지막으로 연습실 불을 끄고 나왔다. 내일도 그럴 생각이다." },
      { label: "{player}에게 비결을 묻는다", effects: { relation: 8, mental: 1 }, result: "{player}가 잠깐 놀라더니 자기 연습 노트를 보여 줬다." },
      { label: "내 할 일만 한다", effects: { condition: 3 }, result: "숫자는 숫자다. 경기장에서 보여 주면 된다." },
    ],
  },
  // 올스타 투표 (답 상관없이) → 뽑힘 / 못 뽑힘
  {
    id: "allstar_picked_after", tab: "news", trigger: "followUp", need: { allStarPicked: true },
    title: "⭐ \"우리가 보냈다\"",
    text: "올스타전이 끝나자 팬 카페에 투표 인증 글이 줄을 이었다. \"하루에 세 번씩 투표했음\", \"{name} 올스타 만든 사람 손.\" 댓글마다 손이 올라가 있다.",
    effects: { popularity: 2, condition: 2 },
  },
  {
    id: "allstar_missed_after", tab: "inbox", trigger: "followUp", need: { allStarPicked: false },
    title: "⭐ \"내년엔 우리가 보낸다\"",
    text: "올스타에 뽑히지 못했다. 팬 카페에 공지가 하나 올라왔다. \"내년 투표는 지금부터 준비합니다. {name} 올스타 보내기 모임.\"",
    choices: [
      { label: "고맙다는 댓글을 남긴다", effects: { reputation: 2 }, result: "\"모임 회원 1호로 가입합니다.\" 댓글에 좋아요가 수백 개 달렸다." },
      { label: "내년 목표로 적어 둔다", effects: { mental: 1 }, result: "연습실 화이트보드 구석에 작게 적었다. '올스타'." },
      { label: "웃고 넘긴다", effects: { condition: 2 }, result: "올스타보다 다음 시즌이 먼저다. 그래도 기분은 좋았다." },
    ],
  },
  // 손목 통증 "병원에 간다" → 트레이너의 관리 루틴
  {
    id: "wrist_routine", tab: "inbox", trigger: "followUp",
    title: "🩹 트레이너의 손목 루틴",
    text: "병원에 다녀온 뒤로 트레이너가 손목을 매일 체크한다. \"다시 아프기 전에 루틴을 만들자. 경기 전 10분이면 돼.\"",
    choices: [
      { label: "루틴을 따라 한다", effects: { stamina: 6 }, result: "손목 돌리기, 손가락 펴기, 따뜻한 물. 경기 전 의식이 하나 늘었다." },
      { label: "\"이제 괜찮아요\"", effects: { condition: 2 }, result: "트레이너: \"아프면 바로 말해.\" 고개를 끄덕였다." },
    ],
  },
  // "테이핑하고 계속한다" → 4주 뒤 체력에 따라
  {
    id: "wrist_back", tab: "inbox", trigger: "followUp", need: { maxStamina: 30 },
    title: "🩹 손목이 다시 욱신거린다",
    text: "테이핑으로 버티던 손목이 다시 찌릿하다. 요즘 쉬지 못한 탓이다. 트레이너가 테이프를 보더니 한숨을 쉬었다.",
    choices: [
      { label: "이번엔 쉬겠다고 말한다", effects: { stamina: 10, skipTraining: true }, note: "다음 주 훈련 없음", result: "트레이너: \"잘 생각했다.\" 일주일 동안 마우스를 내려놓았다." },
      { label: "테이핑을 더 단단히 감는다", effects: { condition: -2, mental: 1 }, result: "이를 악물었다. 대신 오늘 연습은 평소보다 일찍 끝냈다." },
    ],
  },
  {
    id: "wrist_fine", tab: "news", trigger: "followUp", need: { minStamina: 31 },
    title: "🩹 테이핑 졸업",
    text: "트레이너가 손목을 이리저리 돌려 보더니 테이프를 떼 줬다. \"이제 괜찮다. 대신 무리하면 또 온다.\"",
    effects: { condition: 3 },
  },
);
