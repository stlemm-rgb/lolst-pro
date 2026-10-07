// ===== 대회 결과 뉴스 (화면에 뜨는 신문 기사) — js/news_popup.js =====
// 대회 결과가 나오는 주에 [다음 주로 진행]을 누르면 화면 가운데에 신문처럼 떠요.
// 아무 곳이나 누르면 닫히고, 대시보드 '지난주 결과' 오른쪽 위 [📰 NEWS]를 누르면 다시 볼 수 있어요.
//
// 모양: 키(어떤 결과) → 기사 목록. 기사마다
//   who:      어떤 상황일 때 나오는 기사인지 (아래 '키별 who' 참고, "any"는 상황 상관없이)
//   headline: 큰 제목 (한 줄, 30자 안쪽)
//   body:     본문 (2~4문장)
// 같은 키·같은 who 기사가 여러 개면 무작위로 하나. 맞는 who가 없으면 "any" 기사.
//
// 글자 바꾸기 (기사 안에 그대로 쓰면 실제 값으로 바뀜)
//   공통: {year} 연도, {me} 내 선수 이름, {myTeam} 우리 팀 이름
//   결승 (cup_final · firststand_final · msi_final · playoffs_final · worlds_final):
//         {event} 대회 이름, {winner} 우승 팀, {loser} 준우승 팀, {score} 결승 스코어(예: 3:1), {mvp} 결승 MVP 선수
//   rtmsi_result: {seed1} MSI 1번 시드 팀, {seed2} 2번 시드 팀
//   worlds_qualify: {teams} 월드 진출 국내 팀들(쉼표로), {count} 팀 수
//   promotion: {tier1} 1부 팀, {tier2} 2부 팀, {winner} 이긴 팀, {score} 스코어
//
// 키별 who
//   cup_final, playoffs_final (국내 대회): myTeam 우리 팀 우승 / myRunnerUp 우리 팀 준우승 / other 다른 팀끼리 결승
//   firststand_final, msi_final, worlds_final (국제대회): myTeam / myRunnerUp / domestic 우리 리그 다른 팀 우승 / overseas 해외 팀 우승
//   rtmsi_result: myTeam 우리 팀이 MSI 진출 / other 못 나감
//   worlds_qualify: myTeam 우리 팀 월드 진출 / other 못 나감
//   promotion: myUp 우리(2부) 승격 / myFail 우리(2부) 승격 실패 / myStay 우리(1부) 잔류 / myDown 우리(1부) 강등 / up 다른 2부 팀 승격 / stay 다른 1부 팀 잔류
const NEWS_ARTICLES = {
  cup_final: [
    { who: "myTeam", headline: "{myTeam}, 컵 대회 정상!", body: "{myTeam}이(가) 결승에서 {loser}을(를) {score}로 꺾고 {year} 컵 대회 우승을 차지했다. 결승 MVP는 {mvp}. 시즌 첫 트로피와 함께 국제대회 First Stand 출전권도 손에 넣었다." },
    { who: "myRunnerUp", headline: "아쉬운 준우승, {myTeam}", body: "{myTeam}이(가) 컵 대회 결승에서 {winner}에게 {score}로 무릎을 꿇었다. 결승 MVP는 {mvp}. {me}은(는) \"다음 대회에서 꼭 갚겠다\"고 말했다." },
    { who: "other", headline: "{winner}, 컵 대회 우승", body: "{winner}이(가) {loser}을(를) {score}로 꺾고 {year} 컵 대회 정상에 올랐다. 결승 MVP는 {mvp}. {winner}은(는) 국제대회 First Stand에 나간다." },
  ],
  firststand_final: [
    { who: "myTeam", headline: "세계가 놀랐다, {myTeam} First Stand 제패", body: "{myTeam}이(가) First Stand 결승에서 {loser}을(를) {score}로 꺾었다. 결승 MVP {mvp}. 이번 우승으로 우리 리그는 MSI에서 두 팀 모두 본선에 바로 오른다." },
    { who: "myRunnerUp", headline: "{myTeam}, First Stand 준우승", body: "{myTeam}이(가) First Stand 결승에서 {winner}에게 {score}로 졌다. 결승 MVP는 {mvp}. 세계 무대의 벽을 실감한 한 주였다." },
    { who: "domestic", headline: "{winner}, First Stand 우승", body: "우리 리그의 {winner}이(가) First Stand에서 {loser}을(를) {score}로 꺾고 우승했다. 덕분에 MSI에서 우리 리그 두 팀이 본선 직행." },
    { who: "overseas", headline: "First Stand 트로피는 {winner}에게", body: "해외 팀 {winner}이(가) 결승에서 {loser}을(를) {score}로 꺾고 First Stand를 가져갔다. 결승 MVP는 {mvp}." },
  ],
  rtmsi_result: [
    { who: "myTeam", headline: "{myTeam}, MSI 간다!", body: "Road to MSI가 끝났다. 1번 시드 {seed1}, 2번 시드 {seed2}. {myTeam}이(가) 국제 무대 MSI에 나선다." },
    { who: "other", headline: "MSI 대표 확정: {seed1}·{seed2}", body: "Road to MSI 결과 {seed1}이(가) 1번 시드, {seed2}이(가) 2번 시드로 MSI에 나간다." },
  ],
  msi_final: [
    { who: "myTeam", headline: "{myTeam}, MSI 우승! 세계 정상", body: "{myTeam}이(가) MSI 결승에서 {loser}을(를) {score}로 제압했다. 결승 MVP {mvp}. 우리 리그는 올해 월드 챔피언십에 한 팀을 더 보낸다." },
    { who: "myRunnerUp", headline: "{myTeam}, MSI 준우승", body: "{myTeam}이(가) MSI 결승에서 {winner}에게 {score}로 졌다. 결승 MVP는 {mvp}. 월드에서 다시 만날 수 있을까." },
    { who: "domestic", headline: "{winner}, MSI 우승", body: "우리 리그의 {winner}이(가) MSI 결승에서 {loser}을(를) {score}로 꺾었다. 월드 챔피언십 우리 리그 출전 팀이 하나 늘었다." },
    { who: "overseas", headline: "MSI는 {winner}의 것", body: "해외 팀 {winner}이(가) MSI 결승에서 {loser}을(를) {score}로 꺾고 우승했다. 결승 MVP는 {mvp}." },
  ],
  playoffs_final: [
    { who: "myTeam", headline: "{myTeam}, {year} 리그 챔피언!", body: "{myTeam}이(가) 리그 결승에서 {loser}을(를) {score}로 꺾고 정상에 올랐다. 결승 MVP {mvp}. 이제 목표는 월드 챔피언십." },
    { who: "myRunnerUp", headline: "{myTeam}, 결승에서 멈췄다", body: "{myTeam}이(가) 리그 결승에서 {winner}에게 {score}로 졌다. 결승 MVP는 {mvp}. 그래도 월드 진출권은 지켰다." },
    { who: "other", headline: "{winner}, {year} 리그 우승", body: "{winner}이(가) 결승에서 {loser}을(를) {score}로 꺾고 리그 정상에 올랐다. 결승 MVP는 {mvp}." },
  ],
  worlds_qualify: [
    { who: "myTeam", headline: "{myTeam}, 월드 챔피언십 진출", body: "올해 월드 챔피언십에 나가는 우리 리그 팀은 {teams} ({count}팀). {myTeam}도 세계 무대에 선다." },
    { who: "other", headline: "월드 대표 {count}팀 확정", body: "올해 월드 챔피언십에 나가는 우리 리그 팀은 {teams}." },
  ],
  promotion: [
    { who: "myUp", headline: "{myTeam}, 1부 승격!", body: "{myTeam}이(가) 승강전에서 {tier1}을(를) {score}로 꺾었다. 다음 시즌은 1부 리그다." },
    { who: "myFail", headline: "{myTeam}, 승격 문턱에서 좌절", body: "{myTeam}이(가) 승강전에서 {tier1}에게 {score}로 졌다. 다음 시즌도 2부에서 다시 도전한다." },
    { who: "myStay", headline: "{myTeam}, 1부 잔류 성공", body: "{myTeam}이(가) 승강전에서 {tier2}을(를) {score}로 꺾고 1부에 남았다." },
    { who: "myDown", headline: "충격의 강등, {myTeam}", body: "{myTeam}이(가) 승강전에서 {tier2}에게 {score}로 졌다. 다음 시즌은 2부 리그에서 뛴다." },
    { who: "up", headline: "{tier2}, 1부 승격", body: "{tier2}이(가) 승강전에서 {tier1}을(를) {score}로 꺾고 1부로 올라갔다." },
    { who: "stay", headline: "{tier1}, 1부 잔류", body: "{tier1}이(가) 승강전에서 {tier2}을(를) {score}로 꺾고 1부를 지켰다." },
  ],
  worlds_final: [
    { who: "myTeam", headline: "{myTeam}, 세계 최강!", body: "{myTeam}이(가) 월드 챔피언십 결승에서 {loser}을(를) {score}로 꺾었다. 결승 MVP {mvp}. {me}의 이름이 세계에 새겨졌다." },
    { who: "myRunnerUp", headline: "{myTeam}, 월드 준우승", body: "{myTeam}이(가) 월드 결승에서 {winner}에게 {score}로 졌다. 결승 MVP는 {mvp}. 한 걸음이 모자랐다." },
    { who: "domestic", headline: "{winner}, 월드 챔피언", body: "우리 리그의 {winner}이(가) 월드 결승에서 {loser}을(를) {score}로 꺾고 세계 정상에 올랐다. 결승 MVP {mvp}." },
    { who: "overseas", headline: "월드 챔피언은 {winner}", body: "해외 팀 {winner}이(가) 월드 결승에서 {loser}을(를) {score}로 꺾었다. 결승 MVP는 {mvp}." },
  ],
};
