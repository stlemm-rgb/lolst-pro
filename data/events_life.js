// ===== 받은 연락 리뉴얼 ② 선수 생활·인생 · 동료·라이벌 관계 (2026-10-08) =====
// 관계(relation)는 [소속팀] 화면 '🤝 선수 관계'에서 볼 수 있어요. 주전 동료와 사이가 좋으면 경기력이 조금 올라요 (EVENT_RULES.relation)

EVENTS.push(
  // ===== N. 선수 생활·인생 =====
  {
    id: "birthday", tab: "inbox", trigger: "birthday",
    title: "🎂 {age}번째 생일",
    text: "오늘은 생일이다. 아침부터 팬들의 축하 메시지가 쏟아진다. 지하철역에 생일 축하 광고가 걸렸다는 소식도 들었다.",
    choices: [
      { label: "생일 방송으로 팬들과 보낸다", effects: { popularity: 4, stamina: -3 }, result: "팬들이 준비한 축하 영상에 눈물이 날 뻔했다." },
      { label: "팀원들과 케이크를 자른다", effects: { teamRelation: 5, condition: 6 }, result: "얼굴에 생크림이 묻었다. 범인은 정글러다." },
      { label: "가족과 저녁을 먹는다", effects: { condition: 10 }, result: "아버지가 처음으로 \"자랑스럽다\"고 말했다." },
    ],
  },
  {
    id: "family_call", tab: "inbox", trigger: "random",
    title: "📞 어머니의 전화",
    text: "어머니: \"밥은 잘 먹고 다니니? 요즘 경기 보니까 얼굴이 많이 상했더라.\"",
    choices: [
      { label: "영상 통화로 오래 이야기한다", effects: { condition: 8 }, result: "강아지까지 화면에 나와서 한참을 웃었다." },
      { label: "\"다음 휴가 때 내려갈게요\"", effects: { condition: 4, flag: { homeVisit: true } }, result: "어머니 목소리가 한 톤 올라갔다.", followUp: { event: "home_visit", weeks: [8, 20], chance: 0.8 } },
      { label: "바빠서 짧게 끊는다", effects: { condition: -2 }, result: "끊고 나서야 생각났다. 어머니 생신이 다음 주였다." },
    ],
  },
  {
    id: "home_visit", tab: "news", trigger: "followUp", need: { flag: "homeVisit" },
    title: "🏠 고향 집",
    text: "약속대로 고향 집에 다녀왔다. 동네 PC방 사장님이 내 사진을 벽에 걸어 두었다. 어머니는 반찬을 한 보따리 싸 주셨다.",
    effects: { condition: 12, stamina: 10, unflag: "homeVisit" },
  },
  {
    id: "family_visit", tab: "inbox", trigger: "random", need: { weeks: [13, 34] },
    title: "👨‍👩‍👦 부모님이 경기장에 오신다",
    text: "부모님이 이번 주 경기를 직관하러 오신다고 한다. 처음이다.",
    choices: [
      { label: "가장 좋은 자리를 마련한다", check: { stat: "mental", diff: 50 },
        success: { effects: { matchBoost: 0.07, condition: 6 }, result: "관중석의 부모님이 보였다. 이상하게 손이 가벼웠다." },
        fail: { effects: { condition: -3 }, result: "의식하지 않으려 할수록 의식됐다. 긴장으로 손에 땀이 찼다." } },
      { label: "\"다음에 오세요\"라고 한다", effects: { condition: -1 }, result: "부담을 덜었지만, 조금 미안하다." },
    ],
  },
  {
    id: "first_big_salary", tab: "inbox", trigger: "random", need: { minSalary: 100000000, noFlag: "bigSalary" },
    title: "💰 첫 억대 연봉",
    text: "통장에 찍힌 숫자를 몇 번이나 다시 셌다. 연습생 시절 컵라면으로 버티던 날들이 떠오른다.",
    choices: [
      { label: "부모님께 선물을 한다", effects: { money: -5000000, condition: 10, reputation: 2, flag: { bigSalary: true } }, result: "아버지가 선물 받은 시계를 동네방네 자랑하고 다니신다고 한다." },
      { label: "대부분 저축한다", effects: { flag: { bigSalary: true } }, result: "선수 생활은 짧다. 미래의 나에게 보내는 선물." },
      { label: "꿈에 그리던 차를 산다", effects: { money: -15000000, popularity: 2, condition: 6, flag: { bigSalary: true } }, risk: { trait: "spender", chance: 0.05 }, result: "숙소 주차장에 세워 둔 차를 괜히 한 번 더 보러 나갔다." },
    ],
  },
  {
    id: "health_check", tab: "inbox", trigger: "random",
    title: "🩺 정기 건강검진",
    text: "구단 정기 건강검진 결과가 나왔다. 의사: \"거북목에 손목 건초염 초기네요. 이대로면 몇 년 안에 고생합니다.\"",
    choices: [
      { label: "재활 스트레칭을 루틴으로 만든다", check: { stat: "focus", diff: 50 },
        success: { effects: { stamina: 10, condition: 4 }, gain: { trait: "iron_body", chance: 0.05 }, result: "두 달 꾸준히 했더니 손목이 가볍다. 의사도 놀랐다." },
        fail: { effects: { stamina: 4 }, result: "사흘 하고 잊어버렸다. 그래도 안 한 것보다는 낫다." } },
      { label: "젊으니까 괜찮다", effects: {}, risk: { trait: "injury_prone", chance: 0.03 }, result: "검진 결과지는 서랍 깊숙이 들어갔다." },
    ],
  },
  {
    id: "friend_wedding", tab: "inbox", trigger: "random", need: { minAge: 22 },
    title: "💒 고향 친구의 결혼식",
    text: "중학교 때부터 친구인 녀석이 결혼한다. 하필 스크림이 잡힌 날이다. \"너 안 오면 서운하다?\"",
    choices: [
      { label: "스크림을 빼고 다녀온다", effects: { condition: 8, stamina: -4 }, result: "축사를 부탁받았다. 게임 이야기만 하다가 하객들이 웃었다." },
      { label: "축의금만 보낸다", effects: { money: -300000, condition: -2 }, result: "단톡방에 올라온 결혼식 사진을 한참 봤다." },
    ],
  },
  {
    id: "kid_fan", tab: "inbox", trigger: "random",
    title: "✍️ 꼬마 팬의 사인 요청",
    text: "경기장을 나서는데 초등학생이 쭈뼛쭈뼛 다가왔다. \"저, 저도 프로게이머 될 거예요! 사인 해 주세요!\"",
    choices: [
      { label: "사인에 응원 문구까지 써 준다", effects: { popularity: 2, condition: 4 }, result: "\"연습 열심히 해. 1부에서 만나자!\" 아이가 펄쩍펄쩍 뛰었다." },
      { label: "같이 사진도 찍어 준다", effects: { popularity: 3, reputation: 1 }, result: "그 사진이 아이 아버지의 SNS를 타고 퍼졌다. \"이게 프로다\"" },
    ],
  },
  {
    id: "old_friend", tab: "inbox", trigger: "random", who: "otherPro",
    title: "📱 연습생 동기의 연락",
    text: "연습생 시절 같은 방을 쓰던 {player}({pteam})에게서 오랜만에 연락이 왔다. \"요즘 너 잘하더라. 시간 되면 밥 한번 먹자.\"",
    choices: [
      { label: "만나서 옛날이야기를 한다", effects: { relation: 18, condition: 6 }, result: "컵라면 하나를 나눠 먹던 시절 이야기에 둘 다 한참 웃었다." },
      { label: "\"시즌 끝나고 보자\"", effects: { relation: 3 }, result: "\"그래, 몸 관리 잘해.\"" },
    ],
  },
  {
    id: "team_mt", tab: "inbox", trigger: "random", need: { weeks: [47, 52] },
    title: "🏕️ 팀 MT",
    text: "비시즌을 맞아 구단이 1박 2일 MT를 잡았다. 장기자랑도 있다고 한다.",
    choices: [
      { label: "장기자랑에 나간다", check: { stat: "popularity", diff: 40 },
        success: { effects: { teamRelation: 8, popularity: 3 }, result: "준비한 춤이 대박이 났다. 영상이 구단 공식 채널에 올라갔다." },
        fail: { effects: { teamRelation: 5, condition: -2 }, result: "분위기가 싸해졌다... 그래도 다들 오래오래 놀렸다. 그것도 추억이다." } },
      { label: "캠프파이어에서 속 이야기를 나눈다", effects: { teamRelation: 6, condition: 8 }, result: "\"다음 시즌엔 우리가 우승하자.\" 밤하늘 아래 약속." },
    ],
  },

  // ===== O. 동료·라이벌 관계 =====
  {
    id: "teammate_birthday", tab: "inbox", trigger: "random", who: "teammate",
    title: "🎉 {player} 선수의 생일",
    text: "오늘은 같은 팀 {player} 선수의 생일이다. 다른 팀원들이 몰래 파티를 준비하고 있다.",
    choices: [
      { label: "깜짝 파티 준비에 앞장선다", effects: { relation: 15, teamRelation: 2, stamina: -3 }, result: "{player}가 문을 열자 폭죽이 터졌다. 그 표정, 평생 놀릴 거다." },
      { label: "작은 선물만 건넨다", effects: { relation: 6, money: -200000 }, result: "{player}: \"오, 센스 있는데?\"" },
    ],
  },
  {
    id: "friend_duo", tab: "inbox", trigger: "random", who: "friend",
    title: "🎮 {player}와(과) 합동 방송",
    text: "친한 동료 {player}가 같이 합동 방송을 하자고 한다. \"우리 듀오 케미면 시청자 터진다.\"",
    choices: [
      { label: "한다", effects: { popularity: 4, relation: 6, stamina: -4 }, result: "티격태격하는 둘의 대화가 클립으로 백만 뷰를 넘었다." },
      { label: "연습이 먼저다", effects: { relation: -2, focus: 1 } },
    ],
  },
  {
    id: "friend_advice", tab: "inbox", trigger: "random", who: "friend", need: { minWeek: 13 },
    title: "💬 {player}의 진지한 고민",
    text: "새벽, 친한 동료 {player}가 방문을 두드렸다. \"나... 요즘 그만둘까 생각 중이야. 너한테 처음 말하는 거야.\"",
    choices: [
      { label: "밤새 이야기를 들어 준다", check: { stat: "mental", diff: 50 },
        success: { effects: { relation: 20, teamRelation: 2, stamina: -6 }, result: "해가 뜰 무렵 {player}가 말했다. \"한 시즌만 더 해 볼게. 너랑.\"" },
        fail: { effects: { relation: 10, stamina: -8, condition: -3 }, result: "어떤 말을 해 줘야 할지 몰랐다. 그래도 끝까지 옆에 있었다." } },
      { label: "감독님께 상담을 권한다", effects: { relation: 4 }, result: "{player}: \"...그래, 그게 맞겠다.\" 조금 서운한 눈치였다." },
    ],
  },
  {
    id: "foe_clash", tab: "inbox", trigger: "random", who: "foe",
    title: "💢 {player}와(과) SNS 설전",
    text: "사이가 안 좋은 {pteam}의 {player}가 SNS에 나를 저격하는 듯한 글을 올렸다. 팬들이 캡처를 퍼 나르고 있다.",
    choices: [
      { label: "재치 있게 맞받아친다", check: { stat: "popularity", diff: 50 },
        success: { effects: { popularity: 5, reputation: -2, relation: -5 }, result: "한 줄 답글이 '역대급 받아치기'로 박제됐다." },
        fail: { effects: { reputation: -6, relation: -10 }, risk: { trait: "scandal", chance: 0.03 }, result: "말싸움이 커졌다. 리그 관계자까지 연락이 왔다." } },
      { label: "화해의 메시지를 보낸다", effects: { relation: 25, reputation: 4 }, result: "{player}: \"...나도 좀 유치했다. 경기장에서 보자.\"" },
      { label: "무시한다", effects: { condition: -2 }, result: "보지 않으려 해도 자꾸 눈에 들어온다." },
    ],
  },
  {
    id: "teammate_clutch", tab: "inbox", trigger: "afterWin", who: "teammate", chance: 0.12,
    title: "🙌 {player}의 슈퍼 세이브",
    text: "오늘 경기, 내가 잡히기 직전에 {player}가 몸을 던져 살려 줬다. 그 덕에 이겼다. 경기 후 {player}가 하이파이브를 청했다.",
    choices: [
      { label: "\"오늘 MVP는 너야\"라고 인터뷰한다", effects: { relation: 15, reputation: 3 }, result: "{player}가 쑥스러운 듯 머리를 긁적였다." },
      { label: "다음엔 내가 살려 주겠다고 한다", effects: { relation: 8, teamfight: 1 }, result: "\"약속이다?\" 주먹을 맞댔다." },
    ],
  }
);
