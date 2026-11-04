// ===== ④ 4단계 (262): 포지션 연락 — 내 실제 장면이 최근 몇 주에 쌓였을 때만 — 코드 js/position_voice.js posSceneContext =====
// 사용자 결정 (2026-11-04): 10개 모두 (포지션마다 실패·팀과 맞추기 1개 + 보람 1개), 듀오 연락(inbox)과 합쳐 한 시즌 최대 2개
// POSITION_EVENT_RULES.events[열쇠]: pos 내 포지션 · ids 셀 장면(hit_solo = 솔로킬 당함) · n 몇 번 · noPog 그 기간에 내 POG 0번이어야
//   mate: 연락에 나오는 동료 ({player}) = 우리 팀 그 포지션 주전 (relation 효과 대상)
// 연락 id = "pos_" + 열쇠, trigger = "pos:" + 열쇠. 근거가 된 장면은 다시 안 셈. 같은 연락은 한 시즌 1번
// 빈칸: {player} 동료 · {n} 장면 수 · {cause} 실패 원인 한마디 (data/position_voice.js POSITION_VOICE_CAUSE, 없으면 빈칸)
const POSITION_EVENT_RULES = {
  weeks: 4,         // 최근 몇 주의 장면을 셈
  seasonMax: 2,     // 포지션 연락 + 듀오 연락(소식 duo_pair 빼고) 합쳐 한 시즌 최대
  relationPos: 3,   // 효과 relationPos(포지션 동료 관계) 크기
  gapYears: 2,      // 같은 연락은 이만큼 해마다 한 번 (측정: 탑·정글은 해마다 같은 실패 연락이 옴)
  events: {
    top_island:   { pos: "top",     ids: ["top_caught", "hit_solo"], n: 3, mate: "jungle" },
    top_tp:       { pos: "top",     ids: ["tp_flank"], n: 2 },
    jungle_smite: { pos: "jungle",  ids: ["smite_lose", "no_smite"], n: 2 },
    jungle_lanes: { pos: "jungle",  ids: ["jungle_death", "invade_fail", "lv1_invade_fail"], n: 3 },
    mid_wave:     { pos: "mid",     ids: ["wave_fail", "big_wave", "top_caught"], n: 2 },
    mid_diff:     { pos: "mid",     ids: ["solo", "burst_carry"], n: 3 },
    adc_burst:    { pos: "adc",     ids: ["carry_burst", "carry_caught"], n: 2, mate: "support" },
    adc_frontline:{ pos: "adc",     ids: ["free_dps", "carry_survive"], n: 3 },
    sup_ward:     { pos: "support", ids: ["ward_death", "facecheck"], n: 3, mate: "jungle" },
    sup_unseen:   { pos: "support", ids: ["vision_pick", "super_save"], n: 2, noPog: true },
  },
};

EVENTS.push(
  // ----- 탑 -----
  {
    id: "pos_top_island", tab: "inbox", trigger: "pos:top_island", always: true,
    title: "🏝️ 고립된 라인",
    text: "최근 경기에서 탑에서만 {n}번 무너졌다. 미니맵을 보면 늘 혼자였다. 경기 뒤 정글 {player}이(가) 먼저 말을 걸었다. \"탑 많이 힘들었지?\" {cause}",
    choices: [
      { label: "\"정글 동선에 탑도 넣어 줘\"", effects: { relation: 3 }, result: "{player}이(가) 동선표를 꺼냈다. \"3분, 6분. 이때 탑 웨이브 당겨 놔.\" 탑이 혼자가 아니게 됐다." },
      { label: "\"괜찮아, 혼자 버티는 법을 익힐게\"", effects: { condition: 3 }, result: "와드 위치부터 다시 정리했다. 탑은 원래 외로운 자리다. 대신 덜 죽는 법은 배울 수 있다." },
    ],
  },
  {
    id: "pos_top_tp", tab: "inbox", trigger: "pos:top_tp", always: true,
    title: "✨ 텔레포트 한 방",
    text: "최근 뒷텔 성공만 {n}번. 커뮤니티에 '{name} 텔포 각'이라는 제목의 영상 모음이 올라왔다. 코치는 그 영상을 연습실 화면에 띄워 두었다.",
    choices: [
      { label: "인터뷰에서 \"팀이 시간을 벌어 줘서\"라고 말한다", effects: { teamRelation: 2 }, result: "\"텔포는 제가 탔지만, 내릴 자리는 팀이 만들었어요.\" 동료들이 기사 캡처를 돌려 봤다." },
      { label: "그 장면들을 다시 돌려 본다", effects: { condition: 3 }, result: "타이밍이 다 비슷했다. 상대 정글이 반대편에 보인 직후. 이제 이유를 알고 탈 수 있다." },
    ],
  },
  // ----- 정글 -----
  {
    id: "pos_jungle_smite", tab: "inbox", trigger: "pos:jungle_smite", always: true,
    title: "🐉 스마이트 복기",
    text: "최근 스마이트 싸움에서 {n}번 밀렸다. 코치가 오브젝트 장면만 잘라 온 영상을 들고 왔다. \"오늘 저녁에 같이 볼까?\" {cause}",
    choices: [
      { label: "같이 영상을 본다", effects: { condition: -2, mental: 1 }, result: "느린 화면으로 보니 보였다. 오브젝트 체력이 아니라 상대 정글 위치를 먼저 봤어야 했다." },
      { label: "\"스마이트는 감이에요\"", effects: { condition: 3 }, result: "코치는 웃으며 영상을 넣어 두었다. \"그 감, 다음 주에 보여 줘.\"" },
    ],
  },
  {
    id: "pos_jungle_lanes", tab: "inbox", trigger: "pos:jungle_lanes", always: true,
    title: "🗺️ 세 라인의 요구",
    text: "최근 초반에만 {n}번 끊겼다. 팀 미팅에서 라이너들이 동시에 말했다. \"우리 라인 먼저 와 줘.\" 정글은 하나, 라인은 셋이다. {cause}",
    choices: [
      { label: "\"이번 주는 탑부터\"", effects: { relationPos: "top" }, result: "탑이 엄지를 들었다. 나머지 둘은 \"다음 주는 우리\"라며 웃었다." },
      { label: "\"미드 주도권부터\"", effects: { relationPos: "mid" }, result: "미드가 고개를 끄덕였다. \"웨이브 먼저 밀어 둘게.\"" },
      { label: "\"바텀 용 타이밍부터\"", effects: { relationPos: "support" }, result: "서폿이 바로 시야 계획을 꺼냈다. \"용 1분 전에 같이 들어가자.\"" },
    ],
  },
  // ----- 미드 -----
  {
    id: "pos_mid_wave", tab: "inbox", trigger: "pos:mid_wave", always: true,
    title: "🌊 웨이브냐 로밍이냐",
    text: "최근 웨이브를 놓치거나 사이드에서 잘린 게 {n}번. 코치가 미니맵을 멈추고 물었다. \"이때 웨이브를 먹을 거야, 먼저 움직일 거야?\" {cause}",
    choices: [
      { label: "\"웨이브부터 챙기겠습니다\"", effects: { condition: 3 }, result: "CS를 놓치지 않는 미드. 대신 움직일 땐 확실할 때만." },
      { label: "\"먼저 움직이는 미드가 되겠습니다\"", effects: { mental: 1 }, result: "\"좋아. 대신 웨이브를 밀어 두고 가는 것부터.\" 코치가 연습 과제를 적어 줬다." },
    ],
  },
  {
    id: "pos_mid_diff", tab: "inbox", trigger: "pos:mid_diff", always: true,
    title: "🔥 미드 차이",
    text: "최근 라인전 솔로킬과 한타 폭딜로 상대를 {n}번 지웠다. 커뮤니티에 '미드 차이'라는 글이 올라왔다. 상대 미드 팬들의 댓글이 길다.",
    choices: [
      { label: "\"상대가 강해서 더 집중했다\"고 말한다", effects: { popularity: 1 }, result: "겸손한 인터뷰가 오히려 더 퍼졌다. \"말까지 잘하네.\"" },
      { label: "다음 상대 미드 경기를 찾아본다", effects: { condition: 3 }, result: "다음 주 상대 미드의 라인전 습관을 노트에 적었다. 미드 1:1은 모두가 본다." },
    ],
  },
  // ----- 원딜 -----
  {
    id: "pos_adc_burst", tab: "inbox", trigger: "pos:adc_burst", always: true,
    title: "💥 먼저 녹는 원딜",
    text: "최근 한타에서 {n}번 가장 먼저 쓰러졌다. 경기 뒤 서포터 {player}이(가) 옆자리에 앉았다. \"내가 어디 서 있어야 네가 편해?\" {cause}",
    choices: [
      { label: "{player}와(과) 한타 자리 잡기를 맞춘다", effects: { relation: 3 }, result: "둘이 미니맵에 점을 찍었다. \"나는 여기, 너는 내 뒤 두 칸.\" 바텀의 한타가 조금씩 달라졌다." },
      { label: "혼자 한타 영상을 돌려 본다", effects: { mental: 1 }, result: "늘 같은 실수였다. 딜을 넣으려고 한 걸음 더 들어갔다. 원딜은 한 걸음이 생사다." },
    ],
  },
  {
    id: "pos_adc_frontline", tab: "inbox", trigger: "pos:adc_frontline", always: true,
    title: "🎯 앞줄이 만든 딜",
    text: "최근 한타에서 {n}번 끝까지 서서 딜을 넣었다. 딜 그래프 맨 위에 내 이름. 그런데 그 그래프에는 앞줄이 맞아 준 피해가 안 나온다.",
    choices: [
      { label: "앞줄 동료들에게 밥을 산다", effects: { teamRelation: 2, money: -150000 }, result: "\"딜은 내가 넣었지만 버틴 건 너희야.\" 고기가 금방 사라졌다." },
      { label: "딜 그래프를 단톡방에 올린다", effects: { condition: 3 }, result: "\"나 없으면 그 그래프 없다\" 탑의 답장에 모두가 웃었다." },
    ],
  },
  // ----- 서포트 -----
  {
    id: "pos_sup_ward", tab: "inbox", trigger: "pos:sup_ward", always: true,
    title: "👁️ 와드의 대가",
    text: "최근 시야를 잡다가 {n}번 죽었다. 와드 하나에 목숨 하나. 정글 {player}이(가) 말했다. \"깊은 와드는 나랑 같이 가자.\" {cause}",
    choices: [
      { label: "{player}와(과) 시야 동선을 맞춘다", effects: { relation: 3 }, result: "둘이 같이 들어가는 시간표를 짰다. 와드는 늘고, 죽는 일은 줄었다." },
      { label: "깊은 와드는 줄인다", effects: { condition: 3 }, result: "안전한 와드부터. 시야 점수는 조금 줄었지만, 끝까지 살아서 콜을 할 수 있었다." },
    ],
  },
  {
    id: "pos_sup_unseen", tab: "inbox", trigger: "pos:sup_unseen", always: true,
    title: "🕯️ 기록에 안 보이는 일",
    text: "최근 시야로 만든 킬과 아군을 살린 장면이 {n}번. 그런데 POG는 한 번도 없었다. 코치가 따로 불렀다. \"기록은 못 봐도, 우리는 봤어.\"",
    choices: [
      { label: "\"감사합니다\"라고만 한다", effects: { mental: 1 }, result: "짧은 대답. 그래도 그날 숙소로 가는 길이 가벼웠다." },
      { label: "\"팀이 같이 움직여 줘서\"라고 한다", effects: { teamRelation: 2 }, result: "코치가 그 말을 팀 미팅에서 그대로 전했다. 동료들이 서폿 쪽을 보며 박수를 쳤다." },
    ],
  },
);
