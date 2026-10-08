// ===== 은퇴 이야기 (메타 적응 은퇴 인터뷰·기사 · 은퇴 상담 연락 · 코치/감독 소식) — 엔진 js/retirement.js =====

const META_RETIRE_INTERVIEWS = [
  "패치 하나를 익히기도 전에 다음 변화가 와서, 그 속도를 따라가며 경기를 준비하기가 버거워진 만큼 선수 생활을 여기서 마치려고 해요. 늦은 시간까지 제 경기와 방송을 지켜봐 주셔서 감사합니다.",
  "새로운 싸움 방식을 머리로 이해해도 손이 생각만큼 빠르게 움직이지 않아서, 예전 감각만 믿고 버티기보다는 지금 은퇴하는 게 제게 맞는 선택 같아요. 좋은 날도 아쉬운 날도 함께해 주셔서 감사합니다.",
  "요즘 자신 있게 고를 수 있는 챔피언이 점점 줄어들고 팀에 필요한 준비도 충분히 해내기 어려워서 은퇴를 결정했어요. 제가 잘하던 모습도 서툴던 모습도 응원해 주셔서 감사합니다.",
  "팀이 함께 움직이는 방식이 바뀌었는데 저는 자꾸 예전 타이밍에 멈춰 서게 돼서, 선수 생활은 여기까지 하고 잠시 떨어져 게임을 바라보려고 해요. 제 판단을 믿고 함께 뛰어 준 동료들과 팬 여러분께 감사합니다.",
  "다음 패치에는 잘하겠다는 약속을 지키지 못해 팬 여러분께 미안했고, 이제는 메타를 따라갈 자신이 줄어든 걸 숨기지 않고 은퇴 소식을 직접 전하고 싶었어요. 끝까지 기다리고 응원해 주셔서 정말 감사합니다.",
];

NEWS_ARTICLES.meta_retire = [
  {
    who: "any", headline: "{player}, 개인 방송서 은퇴",
    body: "{year}년 비시즌 이적 시장 도중, {pteam}의 {pos} 선수 {player}이(가) 메타 적응의 어려움을 밝히며 개인 방송에서 은퇴를 발표했다. \"{interview}\" 새 시즌 구상을 바꾸게 된 {pteam}은(는) 빈자리를 맡을 대체 선수를 급히 찾아야 한다.",
  },
  {
    who: "any", headline: "{player}, 메타 변화 끝 은퇴",
    body: "{year}년 비시즌 이적 시장이 진행되는 가운데 {pteam}의 {player}이(가) 개인 방송을 켜고 메타 적응을 이유로 선수 생활을 마치겠다고 밝혔다. \"{interview}\" 갑작스러운 은퇴로 {pteam}은(는) 남은 시장 기간에 대체 선수를 서둘러 찾아야 하는 상황에 놓였다.",
  },
  {
    who: "any", headline: "{player} 은퇴, 대체 선수 급구",
    body: "{year}년 비시즌 이적 시장 도중 {pteam}의 {player}이(가) 개인 방송에서 메타를 따라가기 어려워 은퇴한다고 전했다. \"{interview}\" {pteam}은(는) 새 시즌 준비에 차질이 없도록 대체 선수를 급히 찾아야 한다.",
  },
];

// 상담 상대는 retireCounsel 엔진이 정한다. 모든 결과에 counsel을 명시한다.
EVENTS.push(
  {
    id: "rc_tired_hands", tab: "inbox", trigger: "retireCounsel", always: true,
    title: "📞 {player}의 늦은 전화",
    text: "새 시즌을 앞둔 밤, {pteam}의 {player}에게서 전화가 왔다. 손목이 쉽게 지치고 연습 뒤 피로도 오래 남는다며, 책상 위 보호대를 만지작거리는 소리가 들렸다. \"한 판 더 하자는 말이 요즘은 제일 힘들어.\"",
    choices: [
      {
        label: "\"네 몸부터 챙겨, 결정을 응원할게\"",
        note: "{player} 이번 겨울 은퇴",
        effects: { counsel: "retire", relation: 10, condition: 3 },
        result: "수화기 너머로 긴 숨이 들렸다. {player}은(는) 은퇴를 결정하고 나니 내일은 알람 없이 자고 싶다며 조용히 웃었다.",
      },
      {
        label: "\"몸 상태부터 확인하고 한 시즌 계획을 다시 세워 보자\"",
        note: "성공하면 한 시즌 더, 실패하면 은퇴",
        check: { stat: "mental", diff: 50 },
        success: {
          effects: { counsel: "stay", relation: 8 },
          result: "쉬는 시간까지 적은 연습 계획을 함께 살폈다. {player}은(는) 몸 상태를 확인하며 무리하지 않는 조건으로 한 시즌 더 뛰겠다고 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 3 },
          result: "\"그 계획도 이미 해 봤어.\" 낮은 목소리에 더 붙잡지 않고 은퇴 결정을 받아들였다. 통화를 끊기 전 내일 함께 밥을 먹기로 했다.",
        },
      },
      {
        label: "\"선수 생활을 마치면 우리 팀 코치로 와 줘\"",
        note: "성공: 은퇴 후 우리 팀 코치(내 훈련 효과 +5%, 2년 뒤 감독) / 실패: 은퇴",
        check: { stat: "reputation", diff: 40 },
        success: {
          effects: { counsel: "coach", relation: 12, condition: 4 },
          result: "오래 연습하기 어려워도 남의 플레이를 봐 주는 일은 여전히 좋다는 답이 왔다. 은퇴 후 우리 팀 코치로 만나기로 하자, 첫 복기에 가져갈 노트부터 챙기겠다고 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 4 },
          result: "{player}은(는) 은퇴한 뒤에는 일정 없이 충분히 쉬고 싶다고 했다. 코치 제안은 접고, 편해졌을 때 먼저 연락해 달라고 했다.",
        },
      },
    ],
  },
  {
    id: "rc_bench_notebook", tab: "inbox", trigger: "retireCounsel", always: true,
    title: "📒 출전하지 못한 날의 노트",
    text: "{player}와(과) 새 시즌 전에 카페에서 만났다. 후보로 지내며 2군 연습만 하던 때 적었다는 노트를 펼치니, 출전 날짜보다 동료의 경기 기록이 더 많았다. \"다시 기다리기만 하는 시즌이 올까 봐 무서워.\"",
    choices: [
      {
        label: "\"기다린 시간도 네 선수 생활이야, 이제 쉬어도 돼\"",
        note: "{player} 이번 겨울 은퇴",
        effects: { counsel: "retire", relation: 12, condition: 3 },
        result: "노트 마지막 장에 함께 뛰었던 날을 적었다. {player}은(는) 출전 횟수만으로 기억하지 않겠다며 은퇴할 마음을 굳혔다.",
      },
      {
        label: "\"출전 목표를 정하고 한 번 더 도전해 보자\"",
        note: "성공하면 한 시즌 더, 실패하면 은퇴",
        check: { stat: "mental", diff: 55 },
        success: {
          effects: { counsel: "stay", relation: 8 },
          result: "주전 보장 대신 스스로 납득할 목표를 정해 보자고 했다. {player}은(는) 새 페이지에 훈련 목표를 적으며 한 시즌 더 도전하기로 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: -3, condition: -2 },
          result: "\"또 기다리라는 말처럼 들려.\" 노트를 덮는 손을 보고 내 마음만 앞섰다고 사과했다. 더 설득하지 않고 은퇴 결정을 존중했다.",
        },
      },
      {
        label: "\"그 관찰 노트로 우리 팀을 가르쳐 줘\"",
        note: "성공: 은퇴 후 우리 팀 코치(내 훈련 효과 +5%, 2년 뒤 감독) / 실패: 은퇴",
        check: { stat: "shotcall", diff: 45 },
        success: {
          effects: { counsel: "coach", relation: 12 },
          result: "노트에서 내가 놓친 움직임을 하나 골라 설명해 달라고 했다. 설명을 마친 {player}은(는) 은퇴 후 우리 팀 코치로 그 일을 계속해 보고 싶다고 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 4 },
          result: "당분간은 남의 경기까지 챙기지 않고 쉬고 싶다는 답을 들었다. 은퇴 후 첫 휴가에는 노트 없이 만나자며 남은 커피를 마셨다.",
        },
      },
    ],
  },
  {
    id: "rc_meta_crossroads", tab: "inbox", trigger: "retireCounsel", always: true, meta: true,
    title: "🖱️ 익숙한 픽을 지우는 밤",
    text: "{pteam}의 {player}와(과) 공개 경기 영상을 보다가 새 시즌 이야기가 나왔다. \"요즘 메타를 못 따라가겠어. 새 챔피언을 익히기도 전에 운영 방식이 또 바뀌니까, 다음 시즌을 준비할 자신이 없어.\" 익숙한 챔피언 이름을 지운 연습 목록이 화면 옆에 놓여 있었다.",
    choices: [
      {
        label: "\"여기까지 충분히 고민했다면 은퇴도 네 선택이야\"",
        note: "{player} 은퇴 결정, 다음 주 개인 방송에서 발표",
        effects: { counsel: "retire", relation: 10 },
        result: "더 잘하던 시절 이야기로 붙잡지 않고 지금 마음을 들었다. {player}은(는) 은퇴를 결정하고 다음 주 개인 방송에서 팬들에게 직접 설명하겠다며, 함께 감사 인사를 정리해 달라고 했다.",
      },
      {
        label: "\"배울 것을 좁혀서 한 시즌만 더 해 보자\"",
        note: "성공: 한 시즌 더 / 실패: 은퇴 결정, 다음 주 개인 방송에서 발표",
        check: { stat: "shotcall", diff: 50 },
        success: {
          effects: { counsel: "stay", relation: 8, condition: 2 },
          result: "모든 유행을 따라가는 대신 꼭 필요한 역할부터 함께 정리했다. {player}은(는) 그 목록으로 한 시즌 더 준비해 보겠다며 지웠던 제목을 다시 적었다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 3 },
          result: "함께 목록을 줄여 봐도 메타를 따라갈 자신은 돌아오지 않는다고 했다. {player}은(는) 은퇴를 결정하고 다음 주 개인 방송에서 알리겠다며, 팬들에게 전할 첫 문장을 노트에 적었다.",
        },
      },
      {
        label: "\"변화를 읽는 경험을 우리 팀 코치로 나눠 줘\"",
        note: "다음 주 개인 방송에서 은퇴 발표 / 성공: 우리 팀 코치(내 훈련 효과 +5%, 2년 뒤 감독) / 실패: 은퇴",
        check: { stat: "reputation", diff: 45 },
        success: {
          effects: { counsel: "coach", relation: 13 },
          result: "직접 모든 픽을 다루는 일과 선수의 판단을 함께 살피는 일은 다르다는 이야기를 나눴다. {player}은(는) 다음 주 개인 방송에서 선수 은퇴를 발표한 뒤, 우리 팀 코치로 배우면서 돕고 싶다고 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 5 },
          result: "가르치는 자리도 지금은 부담스럽다는 답이 돌아왔다. {player}은(는) 코치 제안은 고맙지만 은퇴 후에는 쉬겠다며, 다음 주 개인 방송에서 팬들에게 직접 인사하기로 했다.",
        },
      },
    ],
  },
  {
    id: "rc_family_calendar", tab: "inbox", trigger: "retireCounsel", always: true,
    title: "🗓️ 가족 약속이 밀린 달력",
    text: "{player}와(과) 식사를 하다가 휴대폰 달력을 함께 봤다. 가족과 만나기로 했다가 옮긴 표시가 몇 달째 남아 있었다. \"새 시즌을 시작하면 또 미안하다는 말만 할 것 같아서, 이번에는 은퇴할까 해.\"",
    choices: [
      {
        label: "\"이번에는 가족과의 약속을 먼저 잡아\"",
        note: "{player} 이번 겨울 은퇴",
        effects: { counsel: "retire", relation: 10, condition: 4 },
        result: "{player}은(는) 은퇴하기로 마음을 정하고 가족에게 전화를 걸었다. 식사가 끝나기 전에 비어 있던 달력에 만날 날짜가 하나 생겼다.",
      },
      {
        label: "\"가족과 상의해서 한 시즌의 계획을 정해 보자\"",
        note: "성공하면 한 시즌 더, 실패하면 은퇴",
        check: { stat: "mental", diff: 45 },
        success: {
          effects: { counsel: "stay", relation: 8 },
          result: "{player}은(는) 잠시 자리를 비워 가족과 통화했다. 꼭 지킬 약속을 함께 정했다며 돌아와 한 시즌 더 뛰겠다고 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 3 },
          result: "이미 가족과 오래 의논한 끝에 꺼낸 말이라는 걸 알았다. 더 붙잡지 않고 은퇴를 응원하며, 다음 만남은 편한 때로 잡자고 했다.",
        },
      },
      {
        label: "\"코치 일정도 살펴보고 우리 팀에 올지 생각해 줘\"",
        note: "성공: 은퇴 후 우리 팀 코치(내 훈련 효과 +5%, 2년 뒤 감독) / 실패: 은퇴",
        check: { stat: "reputation", diff: 50 },
        success: {
          effects: { counsel: "coach", relation: 12 },
          result: "코치도 바쁜 일이라는 점부터 이야기하고 가족과 함께 일정을 검토했다. {player}은(는) 그 생활은 감당할 수 있겠다며 은퇴 후 우리 팀 코치로 오기로 했다.",
        },
        fail: {
          effects: { counsel: "retire", relation: 4 },
          result: "코치 일정까지 듣고 나니 당분간 팀 생활에서 벗어나고 싶다는 마음이 분명해졌다고 했다. 은퇴 후 가족과 찍은 사진을 보내 달라며 식당을 나왔다.",
        },
      },
    ],
  }
);

const COACH_STORIES = {
  join: [
    "{player}이(가) 선수 생활을 마치고 {pteam} 코치로 첫 출근을 했다. 내 이름인 {me} 옆에 오늘 볼 장면을 적더니, 선수 때 함께 쓰던 노트를 펴고 빈 의자를 당겨 줬다. 나도 그 옆에 앉아 첫 복기를 시작했다.",
    "{pteam} 코치로 합류한 {player}이(가) 연습실 문 앞에서 잠시 멈췄다. {me} 자리에도 예전처럼 간식을 하나 놓더니 이제는 먹고 난 뒤 복기까지 해야 한다며 웃었다. 장난스러운 인사 덕에 첫 수업의 긴장이 풀렸다.",
    "은퇴한 {player}이(가) {pteam} 코치 명찰을 달고 회의실에 들어왔다. 화면 속 {me}의 움직임을 멈추더니 내가 설명할 때까지 기다려 줬다. 친구로서 이야기를 들어 주던 버릇이 코치가 된 뒤에도 남아 있었다.",
    "{player}이(가) {pteam} 코치로 합류해 첫 훈련 계획을 가져왔다. 종이 맨 아래에는 {me}와(과) 함께 복기할 시간이 손글씨로 적혀 있었다. 훈련을 마치고 나란히 앉으니 예전처럼 먼저 물컵을 내 쪽으로 밀어 줬다.",
  ],
  promote: [
    "{pteam}에서 코치로 두 해를 보낸 {player}이(가) 새 감독으로 선임됐다. 첫 회의가 끝난 뒤 {me} 이름이 남아 있는 낡은 복기 노트를 보여 줬다. 직함은 달라져도 내 설명부터 듣겠다는 말에 나도 고개를 끄덕였다.",
    "{player}이(가) 코치로 일한 지 2년 만에 {pteam} 감독이 됐다. 새 명패를 찍어 보냈는데 옆에는 {me}와(과) 함께 찍은 사진이 그대로 놓여 있었다. 축하한다고 답하자 다음에 만나면 밥부터 먹자는 말이 돌아왔다.",
    "코치로 두 시즌을 보낸 {player}이(가) {pteam}의 새 감독으로 첫 인사를 했다. 이어서 {me}에게 따로 전화를 걸어 첫 코치 출근 날처럼 긴장된다고 털어놨다. 함께 연습하던 때의 실수를 하나 꺼내자 전화 너머로 익숙한 웃음이 들렸다.",
  ],
};
