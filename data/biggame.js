// ===== 구단별 빅게임 (172, 로드맵 ③) — 코드는 js/biggame.js =====
// 고정 라이벌 두 구단이 만나면 빅게임 (리그·컵·국제대회 어디서든). 구단은 기업명(team.short)으로 찾음
// - 우리 팀 경기: 그 주 예고 기사 + 결과 기사(결승은 결승 기사로 대신), 대시보드 경기 줄에 🔥 표시
// - 내가 뛰면: 감독 퀘스트 '빅게임 승리', 이기면 인기도 보너스·지면 조금 깎임, 업적
// - 다른 팀끼리 빅게임: 결과 단신만
const BIG_GAMES = [
  { id: "telecom", a: "T1", b: "KT",    name: "통신사 더비",  icon: "📡" },
  { id: "throne",  a: "T1", b: "GEN.G", name: "왕좌의 전쟁", icon: "👑" },
];

const BIG_GAME_RULES = {
  winPopularity: 3,   // 내가 뛴 빅게임 승리: 인기도 +3 (평소 승리 +1~2에 더해서, 인기 배율 적용)
  lossPopularity: -1, // 내가 뛴 빅게임 패배: 인기도 −1
  quest: "q_biggame", // 빅게임 주에 감독이 주는 퀘스트 (data/quests.js, 퀘스트 2개 제한과 별도)
};

// 기사 (data/news_articles.js와 같은 모양). 바꾸기: {recordLine}(예고: '두 팀의 상대 전적은 3승 2패다. ' / 첫 맞대결) {derby} {icon} {opp} {label} {record} {score} {streakNote} {myTeam} {me}
NEWS_ARTICLES.biggame_preview = [
  { who: "myPreview", headline: "{icon} 이번 주 {derby}! {myTeam} vs {opp}", body: "{label}에서 {myTeam}과(와) {opp}이(가) 맞붙는다. {recordLine}{streakNote}팬들의 시선이 벌써 경기장으로 쏠리고 있다." },
  { who: "myPreview", headline: "{derby} 다가온다… {myTeam}, {opp}과(와) 격돌", body: "리그에서 가장 뜨거운 맞대결 {derby}! 이번 주 {label}에서 열린다. {recordLine}{streakNote}{me}의 활약에 관심이 모인다." },
  { who: "myPreview", headline: "{icon} 자존심 대결 {derby}, 예매 열리자마자 매진", body: "{myTeam}과(와) {opp}의 {derby}. 이번 주 {label}에서 펼쳐진다. {recordLine}{streakNote}선수들도 \"이 경기만큼은 질 수 없다\"며 각오를 다졌다." },
];
NEWS_ARTICLES.biggame_result = [
  { who: "myWin", headline: "{icon} {derby}의 승자는 {myTeam}", body: "{myTeam}이(가) {label}에서 {opp}을(를) {score}로 꺾었다. 상대 전적은 {record}. {streakNote}" },
  { who: "myWin", headline: "{myTeam}, {derby}서 {opp} 제압", body: "{derby}에서 웃은 쪽은 {myTeam}이었다. {score} 승리로 상대 전적 {record}. {streakNote}{me}도 팬들의 환호를 받았다." },
  { who: "myWin", headline: "{icon} 라이벌을 눌렀다! {myTeam} {score} 승", body: "{myTeam}이(가) {opp}과(와)의 {derby}에서 {score}로 이겼다. 상대 전적 {record}. {streakNote}" },
  { who: "myLoss", headline: "{icon} {derby}, {opp}이(가) 웃었다", body: "{myTeam}이(가) {label}에서 {opp}에게 {score}로 졌다. 상대 전적은 {record}. {streakNote}다음 {derby}에서의 설욕을 다짐했다." },
  { who: "myLoss", headline: "{myTeam}, {derby}서 {opp}에 무릎", body: "자존심이 걸린 {derby}에서 {myTeam}이(가) {score}로 패했다. 상대 전적 {record}. {streakNote}팬들의 아쉬움이 크다." },
  { who: "myLoss", headline: "{icon} 라이벌에 일격… {myTeam} {score} 패", body: "{opp}이(가) {derby}에서 {myTeam}을(를) {score}로 꺾었다. 상대 전적 {record}. {streakNote}" },
];
