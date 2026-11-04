// ===== ④ 3단계 (261): 영혼의 듀오 — 원딜·서포트만, 경험만(새 승률 효과 없음, 기존 팀 케미 그대로) — 코드 js/duo.js =====
// 사용자 결정 (2026-11-04): 단계 = 같이 출전한 기록 + 관계, 별명 = 팬 후보 3개 중 고름, 카드 = 소속팀 화면,
//   이야기 = 헤어짐 + 첫 맞대결 · 다시 한 팀 · 함께 우승 · 파트너 은퇴 (단짝 듀오 이상일 때만)
// 근거 = 실제로 같이 출전한 세트 (경기 기록 m.detail.sets[].lanes). 같은 팀이어도 벤치에 있으면 안 셈
// 측정 (원딜·서폿 × 2판 × 5시즌): 주 파트너와 한 시즌 약 80세트, 보통 1~3시즌 뒤 헤어짐, 관계 10~48
const DUO_RULES = {
  positions: { adc: "support", support: "adc" }, // 내 포지션 → 파트너 포지션
  stages: [
    { id: "new",  icon: "🆕", name: "새 파트너" },
    { id: "sync", icon: "🔗", name: "손발 맞는 중", sets: 40 },
    { id: "pair", icon: "🤝", name: "단짝 듀오",   sets: 100 },
    { id: "soul", icon: "💞", name: "영혼의 듀오", sets: 160, big: 10, rel: 30 }, // big = 같이 뛴 큰 경기(결승·플레이오프·월즈 등) 세트
  ],
  storyFrom: 2,   // 이 단계(단짝 듀오)부터 헤어짐·맞대결·다시 한 팀·우승·은퇴 연락
  pastMax: 3,     // 카드에 보여 줄 지난 파트너 수
  // 별명 후보: 첫 번째는 늘 '{me}·{p} 듀오', 나머지 2개는 아래에서 (두 사람 이름으로 정해짐)
  nicks: ["바텀 수호신", "환상의 짝꿍", "2인 1조", "쌍둥이 바텀", "바텀의 심장", "봇 듀오 장인", "{me}-{p} 라인", "바텀 콤비 {me}&{p}", "한 몸 바텀", "눈빛 듀오"],
};

const DUO_TEXTS = {
  cardTitle: "💞 바텀 듀오",
  none: "아직 같이 출전한 바텀 파트너가 없어요. 원딜·서포트는 같이 뛴 기록이 쌓이면 단짝 듀오, 영혼의 듀오가 돼요.",
  next: "다음 단계 '{name}'까지: {need}",
  needSets: "같이 {n}세트 더",
  needBig: "큰 경기 {n}세트 더",
  needRel: "관계 {n} 이상 (지금 {now})",
  past: "지난 파트너",
  left: "{year}년 헤어짐",
  retired: "{year}년 은퇴",
  noNick: "별명 없음",
};

EVENTS.push(
  // 단짝 듀오가 됨 (소식)
  {
    id: "duo_pair", tab: "news", trigger: "duoPair", always: true, cooldown: 1,
    title: "🤝 단짝 듀오",
    text: "{player}와(과) 함께 뛴 세트가 어느새 {sets}세트. 이제 눈빛만 봐도 다음 움직임을 안다. 라인전 콜이 점점 짧아지고 있다.",
    effects: {},
  },
  // 영혼의 듀오 — 별명 고르기 (선택지 글자는 그 듀오의 별명 후보)
  {
    id: "duo_soul", tab: "inbox", trigger: "duoSoul", always: true, cooldown: 1,
    title: "💞 영혼의 듀오",
    text: "커뮤니티에서 {me}와(과) {player}의 바텀 이야기가 끊이지 않는다. 함께 {sets}세트, 큰 경기만 {big}세트. 팬들이 듀오 별명 투표를 열었다.",
    choices: [
      { label: "「{nick1}」", effects: { duoNick: 1, popularity: 1 }, result: "\"{nick1}\" — 다음 날부터 중계진도 그렇게 불렀다." },
      { label: "「{nick2}」", effects: { duoNick: 2, popularity: 1 }, result: "\"{nick2}\" — {player}이(가) 그 별명이 마음에 든다며 프로필에 적었다." },
      { label: "「{nick3}」", effects: { duoNick: 3, popularity: 1 }, result: "\"{nick3}\" — 응원 플래카드에 그 글자가 걸리기 시작했다." },
      { label: "별명은 쓰지 말아 달라고 한다", effects: { duoNick: 0, mental: 1 }, result: "\"별명보다 경기로 기억되고 싶어요.\" 팬들은 그 말까지 좋아했다." },
    ],
  },
  // 헤어짐 (단짝 듀오 이상인 파트너가 다른 팀으로, 내가 옮겨도)
  {
    id: "duo_split", tab: "inbox", trigger: "duoSplit", always: true, cooldown: 1,
    title: "👋 바텀이 갈라진다",
    text: "함께 {sets}세트를 뛴 {player}. 이제 다른 유니폼이다. {player}의 다음 팀은 {pteam}. {nickLine}",
    choices: [
      { label: "마지막으로 듀오 랭크를 돌린다", effects: { relation: 3, stamina: -2 }, result: "새벽까지 듀오 랭크. 마지막 판은 둘 다 말없이 이겼다." },
      { label: "\"다음엔 적으로 보자\"", effects: { condition: 3 }, result: "\"봐주는 거 없다.\" \"나도.\" 짧은 메시지 끝에 웃음 이모티콘이 붙었다." },
    ],
  },
  // 헤어진 뒤 첫 맞대결 (③ C '옛 동료와 적으로' 대신)
  {
    id: "duo_vs", tab: "inbox", trigger: "duoVs", always: true, cooldown: 1,
    title: "⚔️ 옛 듀오와 적으로",
    text: "이번 주 상대 {pteam}의 바텀에 {player}이(가) 있다. {sets}세트를 같이 뛰며 라인전 습관, 점멸 타이밍까지 서로 다 안다.",
    choices: [
      { label: "경기 전에 메시지를 보낸다", effects: { relation: 2 }, result: "\"오늘은 바텀에서 보자.\" 답장은 이모티콘 하나였다." },
      { label: "그 습관을 노린다", effects: { condition: 3 }, result: "같이 뛸 때 늘 하던 그 움직임. 이번엔 반대편에서 기다리기로 했다." },
    ],
  },
  // 다시 한 팀 (③ C '다시 한 팀' 대신)
  {
    id: "duo_back", tab: "inbox", trigger: "duoBack", always: true, cooldown: 1,
    title: "💞 바텀 재결합",
    text: "{leftYear}년에 헤어졌던 {player}이(가) 다시 같은 팀이다. 첫 스크림, 말하지 않아도 같은 쪽으로 움직였다. {nickLine}",
    choices: [
      { label: "옛날 콜 사인부터 다시 맞춘다", effects: { relation: 3 }, result: "\"그거 아직 기억해?\" \"당연하지.\" 콜 하나에 둘이 동시에 웃었다." },
      { label: "\"이번엔 더 오래 가자\"", effects: { condition: 3 }, result: "{player}이(가) 고개를 끄덕였다. \"이번엔 트로피까지.\"" },
    ],
  },
  // 함께 우승
  {
    id: "duo_title", tab: "inbox", trigger: "duoTitle", always: true, cooldown: 1,
    title: "🏆 듀오의 트로피",
    text: "{titleName} 우승. 시상대에서 {player}이(가) 먼저 달려와 안겼다. 함께 {sets}세트 만에 든 트로피다. {nickLine}",
    choices: [
      { label: "둘이 트로피를 든 사진을 올린다", effects: { popularity: 1 }, result: "\"바텀이 해냈다.\" 사진 한 장에 댓글이 수천 개 달렸다." },
      { label: "\"다음 트로피도 같이\"", effects: { relation: 2 }, result: "{player}: \"그럼 내년에도 같은 팀이어야겠네.\"" },
    ],
  },
  // 파트너 은퇴
  {
    id: "duo_retire", tab: "inbox", trigger: "duoRetire", always: true, cooldown: 1,
    title: "🕯️ 듀오의 은퇴",
    text: "함께 바텀을 지켰던 {player}이(가) 은퇴를 발표했다. 같이 {sets}세트, 그중 {wins}세트를 이겼다. {nickLine}",
    choices: [
      { label: "SNS에 마지막 인사를 남긴다", effects: { popularity: 1 }, result: "\"내 커리어 최고의 파트너.\" 짧은 글에 팬들이 그때 영상을 하나씩 올렸다." },
      { label: "조용히 전화를 건다", effects: { mental: 1 }, result: "한참 옛날이야기를 했다. 끊기 전 {player}이(가) 말했다. \"바텀은 네가 끝까지 지켜.\"" },
    ],
  },
);
