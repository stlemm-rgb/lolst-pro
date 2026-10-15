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
      { label: "\"작년보다 성장하기\"", effects: { flag: { goalGrowth: true } }, note: "시즌이 끝날 때 성장을 돌아봐요",
        result: "작지만 확실한 목표. 매일 1%씩." },
      { label: "\"즐겁게, 다치지 않고\"", effects: { flag: { goalFun: true }, condition: 6 }, result: "감독님이 웃으며 밑에 한 줄을 보탰다. \"그리고 이기면 더 즐겁다.\"" },
    ],
  },
  {
    id: "media_day", tab: "inbox", trigger: "mediaDay", always: true, chance: 0.8,
    title: "🎤 정규 시즌 미디어데이",
    text: "정규 시즌 개막을 앞두고 미디어데이가 열렸다. 사회자가 {name}에게 마이크를 넘겼다. \"올 시즌 각오 한마디!\"",
    choices: [
      { label: "\"올해는 저희가 우승합니다.\"", check: { stat: "popularity", diff: 45 },
        success: { effects: { popularity: 5, matchBoost: 0.04 }, result: "객석에서 함성이 터졌다. 오늘의 헤드라인은 {team}." },
        fail: { effects: { popularity: 1, reputation: -2 }, result: "객석이 조용하다. 누군가 \"작년 순위는요?\"라고 외쳤다." } },
      { label: "\"한 경기 한 경기 최선을 다하겠습니다.\"", effects: { reputation: 3 }, result: "모범 답안. 기자들은 조금 아쉬워했다." },
      { label: "다른 팀 선수를 지목해 도발한다", effects: { popularity: 4, reputation: -3 }, risk: { trait: "scandal", chance: 0.02 }, result: "지목당한 선수가 웃으며 손가락으로 나를 가리켰다. 시즌이 재밌어지겠다." },
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
        fail: { effects: { condition: -4, popularity: 2 }, result: "말은 했지만 밤새 잠이 오지 않았다. 부담이 어깨를 누른다." } },
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
      { label: "\"여기서 계속 뛰고 싶습니다.\"", effects: { reputation: 3, teamRelation: 3 }, result: "단장: \"좋은 소리 들으니 기분 좋네.\" 구단 분위기가 훈훈하다." },
      { label: "\"시장 평가를 받아 보고 싶습니다.\"", effects: { transferListed: true }, note: "비시즌 이적 제안이 늘어남", result: "단장이 잠시 멈칫했다. \"...프로답네.\"" },
      { label: "\"남은 경기로 보여 드리겠습니다.\"", effects: { matchBoost: 0.05, mental: 1 }, result: "말보다 숫자로. 남은 시즌이 곧 협상 테이블이다." },
    ],
  },
  {
    id: "allstar_vote", tab: "inbox", trigger: "allStarVote", always: true,
    title: "⭐ 올스타 팬 투표 마감 직전",
    text: "다음 주 올스타전 팬 투표가 곧 마감된다. 구단 SNS 담당자가 투표 독려 글을 올려 달라고 부탁했다.",
    choices: [
      { label: "직접 투표 독려 영상을 찍는다", effects: { popularity: 4, stamina: -3 }, result: "\"한 표만 주세요!\" 어색한 하트 포즈가 밈이 됐다." },
      { label: "\"투표는 팬분들 몫이죠.\"", effects: { reputation: 3 }, result: "담담한 한마디에 오히려 팬들이 더 열심히 투표했다는 후문." },
      { label: "팬 감사 라이브 방송을 켠다", check: { stat: "popularity", diff: 50 },
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
      { label: "팬들에게 사과 글을 올린다", effects: { reputation: 4, condition: -3, unflag: ["goalTitle", "goalGrowth", "goalFun"] }, result: "\"내년엔 꼭.\" 짧은 글에 응원 댓글이 달렸다." },
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
      { label: "고향에 내려가 푹 쉰다", effects: { condition: 15, stamina: 20 }, result: "어머니가 해 준 밥을 먹고 열두 시간을 잤다." },
      { label: "해외 부트캠프에 참가한다", effects: { money: -3000000, laning: 2, macro: 1, stamina: -8 }, result: "다른 지역의 랭크는 확실히 스타일이 달랐다. 새로운 시야가 생겼다." },
      { label: "개인 방송으로 팬들과 보낸다", effects: { popularity: 5, stamina: -5 }, result: "비시즌에도 나를 기다려 주는 사람들이 있었다." },
    ],
  },

  // ===== L. 새 시스템과 연결 (그 일이 생긴 주에) =====
  {
    id: "rival_signed", tab: "inbox", trigger: "rivalSigned", always: true,
    title: "⚔️ {player} 선수가 왔다",
    text: "같은 포지션의 {player} 선수(스탯 점수 {score})가 팀에 합류했다. 첫 훈련 날, 연습실 문 앞에서 마주쳤다. 서로 어색하게 고개를 숙였다.\n(이 선수의 스탯 점수가 나보다 {gap} 이상 높아지면 2군으로 밀려요. 4주마다 판정)",
    choices: [
      { label: "먼저 다가가 반갑게 맞는다", effects: { relation: 25, reputation: 3 }, result: "\"잘 부탁해. 서로 좋은 자극이 되자.\" {player}가 환하게 웃었다." },
      { label: "경쟁자로 선을 긋는다", check: { stat: "mental", diff: 55 },
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
        fail: { effects: { condition: -8, reputation: -2 }, result: "\"결정은 내가 한다.\" 문이 닫혔다." } },
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
