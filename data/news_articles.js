// ===== 대회 결과 뉴스 (화면에 뜨는 신문 기사) — js/news_popup.js =====
// 대회 결과가 나오는 주에 [다음 주로 진행]을 누르면 화면 가운데에 신문처럼 떠요.
// 아무 곳이나 누르면 닫히고, 대시보드 '지난주 결과' 오른쪽 위 [📰 NEWS]를 누르면 다시 볼 수 있어요.
//
// 모양: 키(어떤 결과) → 기사 목록. 기사마다
//   who:      어떤 상황일 때 나오는 기사인지 (아래 '키별 who' 참고, "any"는 상황 상관없이)
//   headline: 큰 제목 (한 줄, 30자 안쪽)
//   body:     본문 (2~4문장)
// 같은 키·같은 who 기사가 여러 개면 무작위로 하나. 맞는 who가 없으면 "any" 기사.
// (2026-10-07 다른 AI가 쓴 기사로 교체: 키·상황마다 3개씩. 받침 상관없게 '(이)었다', '(으)로', '(이)다'로 고침)
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
    { who: "myTeam", headline: "{myTeam}, {event} 정상 등극", body: "{myTeam}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승을 차지했다. 결승 MVP는 {mvp}이(가) 선정됐다. 시즌 첫 트로피와 함께 First Stand 출전권까지 손에 넣었다." },
    { who: "myTeam", headline: "{myTeam}, 우승과 세계행 확정", body: "{myTeam}이(가) {loser}을(를) {score}로 제압하며 {event}의 주인이 됐다. {mvp}이(가) 결승 MVP에 올랐다. {me}은(는) 우승의 기쁨을 안고 First Stand 무대로 향하게 됐다." },
    { who: "myTeam", headline: "{myTeam}, 첫 관문을 넘었다", body: "{year} 시즌 첫 우승컵은 {myTeam}의 차지가 됐다. {event} 결승에서 {loser}을(를) {score}로 꺾었고, {mvp}이(가) MVP를 차지했다. 이제 {myTeam}의 시선은 First Stand로 향한다." },

    { who: "myRunnerUp", headline: "{myTeam}, 우승 문턱서 멈췄다", body: "{myTeam}이(가) {event} 결승에서 {winner}에게 {score}로 패하며 준우승에 머물렀다. 결승 MVP는 {mvp}이(가) 차지했다. {me}에게는 아쉬움을 씻을 다음 무대가 남아 있다." },
    { who: "myRunnerUp", headline: "{myTeam}, 아쉬운 결승 패배", body: "{event} 우승컵을 눈앞에 뒀던 {myTeam}이(가) {winner}에게 {score}로 패했다. {mvp}이(가) 결승 MVP에 선정됐다. {myTeam}은(는) 첫 우승 기회를 놓치며 다음 대회를 기약했다." },
    { who: "myRunnerUp", headline: "{myTeam}, 준우승으로 대회 마감", body: "{myTeam}이(가) {year} {event} 결승에서 {winner}의 벽을 넘지 못했다. 최종 스코어는 {score}, 결승 MVP는 {mvp}(이)었다. 정상까지 한 걸음이 부족했던 결과였다." },

    { who: "other", headline: "{winner}, {event} 우승", body: "{winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 정상에 올랐다. 결승 MVP는 {mvp}이(가) 선정됐다. {winner}은(는) 우승팀 자격으로 First Stand에 출전한다." },
    { who: "other", headline: "{winner}, 컵 정상과 세계행", body: "{year} {event}의 우승팀은 {winner}(으)로 결정됐다. {winner}이(가) 결승에서 {loser}을(를) {score}로 제압했고, {mvp}이(가) MVP를 차지했다. 다음 무대는 국제대회 First Stand다." },
    { who: "other", headline: "{event} 챔피언은 {winner}", body: "{winner}이(가) {loser}을(를) 상대로 {score} 승리를 거두며 {event} 우승컵을 들어 올렸다. 결승 MVP는 {mvp}(이)었다. 이로써 First Stand에 나설 팀도 {winner}(으)로 확정됐다." },
  ],

  firststand_final: [
    { who: "myTeam", headline: "{myTeam}, 세계 첫 정상 정복", body: "{myTeam}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 국제대회 우승을 차지했다. 결승 MVP는 {mvp}이(가) 선정됐다. 이번 우승으로 우리 리그의 MSI 진출 두 팀은 모두 본선에 직행한다." },
    { who: "myTeam", headline: "{myTeam}, First Stand 제패", body: "{myTeam}이(가) 세계 무대에서도 정상에 섰다. {event} 결승에서 {loser}을(를) {score}로 제압했고 {mvp}이(가) 결승 MVP를 차지했다. {me}의 우승과 함께 우리 리그도 MSI 본선 직행권 두 장을 확보했다." },
    { who: "myTeam", headline: "{myTeam}, 세계에 이름 새겼다", body: "{year} {event}의 마지막 승자는 {myTeam}(이)었다. {loser}을(를) {score}로 꺾으며 우승했고, 결승 MVP는 {mvp}(이)었다. {myTeam}의 우승은 우리 리그의 MSI 일정에도 큰 이점을 안겼다." },

    { who: "myRunnerUp", headline: "{myTeam}, 세계 정상 앞서 좌절", body: "{myTeam}이(가) {event} 결승에서 {winner}에게 {score}로 패하며 준우승에 머물렀다. 결승 MVP는 {mvp}(이)었다. {me}과(와) {myTeam}에게는 세계 정상까지 마지막 한 걸음이 남았다." },
    { who: "myRunnerUp", headline: "{myTeam}, 국제대회 준우승", body: "{myTeam}의 첫 국제대회 우승 도전이 결승에서 멈췄다. {winner}이(가) {score}로 승리했고 {mvp}이(가) MVP를 차지했다. 아쉬움은 컸지만 {myTeam}은(는) 준우승으로 대회를 마쳤다." },
    { who: "myRunnerUp", headline: "{myTeam}, 끝내 넘지 못한 결승", body: "{event} 결승에서 {myTeam}이(가) {winner}에게 {score}로 무릎을 꿇었다. 결승 MVP는 {mvp}이(가) 선정됐다. 세계 정상에 가까이 다가갔던 만큼 패배의 여운도 컸다." },

    { who: "domestic", headline: "{winner}, First Stand 우승", body: "우리 리그의 {winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승했다. 결승 MVP는 {mvp}(이)었다. 이 결과로 우리 리그의 MSI 대표 두 팀은 모두 본선에 직행한다." },
    { who: "domestic", headline: "우리 리그 {winner}, 세계 제패", body: "{winner}이(가) {year} {event} 정상에 올랐다. 결승에서 {loser}을(를) {score}로 제압했고 {mvp}이(가) MVP를 차지했다. 우승에 힘입어 우리 리그는 MSI 본선 직행권 두 장을 확보했다." },
    { who: "domestic", headline: "{winner} 우승, MSI에도 호재", body: "우리 리그 대표 {winner}이(가) {event} 우승컵을 들어 올렸다. {loser}을(를) {score}로 꺾었으며 결승 MVP는 {mvp}(이)었다. 우리 리그의 두 MSI 대표팀은 예선 없이 본선으로 향한다." },

    { who: "overseas", headline: "{winner}, First Stand 정상", body: "해외 팀 {winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승했다. 결승 MVP는 {mvp}이(가) 선정됐다. {year} 첫 국제대회의 주인공은 {winner}(이)었다." },
    { who: "overseas", headline: "{event} 우승컵은 {winner}", body: "{winner}이(가) 결승에서 {loser}을(를) {score}로 제압했다. {mvp}이(가) 결승 MVP에 오르며 우승을 이끌었다. 해외 팀이 {event}의 정상에 서며 대회가 막을 내렸다." },
    { who: "overseas", headline: "세계 첫 왕좌, {winner} 차지", body: "{year} {event} 결승은 {winner}의 승리로 끝났다. {winner}이(가) {loser}을(를) {score}로 꺾었고, 결승 MVP는 {mvp}(이)었다. 우승컵은 해외 리그로 향했다." },
  ],

  rtmsi_result: [
    { who: "myTeam", headline: "{myTeam}, MSI 출전 확정", body: "Road to MSI가 종료되며 {seed1}이(가) 1번 시드, {seed2}이(가) 2번 시드를 차지했다. {myTeam}도 대표 자격을 확보하며 MSI 무대에 나서게 됐다. {me}에게 또 하나의 국제대회가 기다리고 있다." },
    { who: "myTeam", headline: "{myTeam}, MSI로 향한다", body: "우리 리그의 MSI 대표는 {seed1}와(과) {seed2}(으)로 확정됐다. 그 가운데 {myTeam}이(가) 포함되며 국제 무대 도전을 이어간다. {year} 시즌의 다음 목표는 MSI 정상이다." },
    { who: "myTeam", headline: "{myTeam}, 국제무대 티켓 확보", body: "Road to MSI 결과 {seed1}이(가) 1번 시드, {seed2}이(가) 2번 시드를 얻었다. {myTeam}은(는) 치열한 경쟁을 통과해 MSI 출전권을 손에 넣었다. {me}의 시즌도 다시 세계 무대로 이어진다." },

    { who: "other", headline: "MSI 대표 {seed1}·{seed2}", body: "Road to MSI가 마무리됐다. {seed1}이(가) 1번 시드, {seed2}이(가) 2번 시드로 MSI에 출전한다. {myTeam}은(는) 이번 대표 명단에 들지 못했다." },
    { who: "other", headline: "{myTeam}, MSI 진출 실패", body: "우리 리그의 MSI 출전권은 {seed1}와(과) {seed2}에게 돌아갔다. {myTeam}은(는) Road to MSI를 통과하지 못했다. 국제대회 복귀는 다음 기회를 기다리게 됐다." },
    { who: "other", headline: "MSI 두 자리 주인 확정", body: "{year} MSI에 나설 우리 리그 대표가 확정됐다. 1번 시드는 {seed1}, 2번 시드는 {seed2}(이)다. {myTeam}은(는) 두 자리 안에 이름을 올리지 못했다." },
  ],

  msi_final: [
    { who: "myTeam", headline: "{myTeam}, MSI 세계 정상", body: "{myTeam}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승을 차지했다. 결승 MVP는 {mvp}이(가) 선정됐다. {me}의 우승과 함께 우리 리그는 월드 챔피언십 출전권을 한 장 더 확보했다." },
    { who: "myTeam", headline: "{myTeam}, MSI 우승컵 들었다", body: "{event} 마지막 무대에서 {myTeam}이(가) 웃었다. {loser}을(를) {score}로 제압했고 {mvp}이(가) 결승 MVP에 올랐다. 우리 리그의 월드 출전 팀도 기본 3팀에서 4팀으로 늘어난다." },
    { who: "myTeam", headline: "{myTeam}, 세계 왕좌에 올랐다", body: "{year} {event} 챔피언은 {myTeam}(이)었다. 결승에서 {loser}을(를) {score}로 꺾었고, MVP는 {mvp}이(가) 차지했다. 우승의 보상으로 우리 리그에는 추가 월드 출전권까지 주어졌다." },

    { who: "myRunnerUp", headline: "{myTeam}, MSI 준우승", body: "{myTeam}이(가) {event} 결승에서 {winner}에게 {score}로 패했다. 결승 MVP는 {mvp}이(가) 선정됐다. {me}과(와) {myTeam}의 세계 정상 도전은 준우승으로 막을 내렸다." },
    { who: "myRunnerUp", headline: "{myTeam}, 세계 정상 직전 좌절", body: "{event} 결승에서 {myTeam}이(가) {winner}의 벽을 넘지 못했다. 최종 스코어는 {score}, 결승 MVP는 {mvp}(이)었다. 우승컵을 놓친 {myTeam}은(는) 월드에서의 재도전을 바라보게 됐다." },
    { who: "myRunnerUp", headline: "{myTeam}, 한 걸음 모자랐다", body: "{myTeam}이(가) {year} {event} 결승에서 {winner}에게 {score}로 졌다. {mvp}이(가) 결승 MVP를 차지했다. 국제대회 정상까지 단 한 경기를 남겨뒀던 만큼 아쉬움이 큰 결과였다." },

    { who: "domestic", headline: "{winner}, MSI 우승", body: "우리 리그의 {winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 세계 정상에 올랐다. 결승 MVP는 {mvp}(이)었다. 우리 리그는 월드 챔피언십 출전권을 추가로 확보했다." },
    { who: "domestic", headline: "우리 리그 {winner}, MSI 제패", body: "{winner}이(가) {loser}을(를) {score}로 제압하며 {event} 우승컵을 차지했다. {mvp}이(가) 결승 MVP로 선정됐다. 이에 따라 우리 리그는 월드에 총 4팀을 보낼 수 있게 됐다." },
    { who: "domestic", headline: "{winner} 세계 제패, 월드 4장", body: "{year} {event}의 승자는 우리 리그의 {winner}(이)었다. 결승에서 {loser}을(를) {score}로 꺾었고 MVP는 {mvp}(이)었다. 우승으로 우리 리그의 월드 출전권은 한 장 늘어났다." },

    { who: "overseas", headline: "{winner}, MSI 정상 등극", body: "해외 팀 {winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승했다. 결승 MVP는 {mvp}이(가) 선정됐다. {year} MSI의 우승컵은 해외 리그로 향했다." },
    { who: "overseas", headline: "MSI 챔피언은 {winner}", body: "{winner}이(가) 결승에서 {loser}을(를) {score}로 제압하며 {event} 정상에 올랐다. {mvp}이(가) 결승 MVP를 차지했다. 대회는 {winner}의 우승으로 막을 내렸다." },
    { who: "overseas", headline: "{winner}, 세계 왕좌 차지", body: "{event} 결승의 승자는 {winner}(이)었다. {loser}을(를) 상대로 {score} 승리를 거뒀고, 결승 MVP는 {mvp}(이)었다. 해외 팀이 시즌 두 번째 국제대회 정상에 섰다." },
  ],

  playoffs_final: [
    { who: "myTeam", headline: "{myTeam}, {year} 리그 우승", body: "{myTeam}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 국내 정상에 올랐다. 결승 MVP는 {mvp}이(가) 선정됐다. {me}과(와) {myTeam}은(는) 챔피언 자격으로 월드 챔피언십을 준비한다." },
    { who: "myTeam", headline: "{myTeam}, 국내 왕좌 차지", body: "{event} 마지막 승자는 {myTeam}(이)었다. 결승에서 {loser}을(를) {score}로 제압했고 {mvp}이(가) MVP를 차지했다. 길었던 국내 시즌을 우승으로 끝낸 {myTeam}의 시선은 이제 월드로 향한다." },
    { who: "myTeam", headline: "{myTeam}, 리그 챔피언 등극", body: "{myTeam}이(가) {year} 시즌 국내 최강팀으로 이름을 올렸다. {loser}을(를) {score}로 꺾었고 결승 MVP는 {mvp}(이)었다. {me}에게는 우승컵과 함께 세계 무대를 향한 도전이 남았다." },

    { who: "myRunnerUp", headline: "{myTeam}, 결승에서 멈췄다", body: "{myTeam}이(가) {event} 결승에서 {winner}에게 {score}로 패하며 준우승을 기록했다. 결승 MVP는 {mvp}(이)었다. {me}과(와) {myTeam}은(는) 국내 우승의 아쉬움을 뒤로하고 시즌의 다음 목표를 바라본다." },
    { who: "myRunnerUp", headline: "{myTeam}, 리그 준우승", body: "{year} {event} 우승컵은 {winner}에게 돌아갔다. {myTeam}은(는) 결승에서 {score}로 패했고 {mvp}이(가) MVP를 차지했다. 정상에 닿지는 못했지만 {myTeam}의 시즌은 아직 끝나지 않았다." },
    { who: "myRunnerUp", headline: "{myTeam}, 국내 정상 놓쳤다", body: "{myTeam}의 우승 도전이 마지막 경기에서 좌절됐다. {winner}이(가) {score}로 승리했고 결승 MVP는 {mvp}(이)었다. 결승 패배의 아쉬움을 털어내는 일이 다음 과제가 됐다." },

    { who: "other", headline: "{winner}, {year} 리그 제패", body: "{winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승했다. 결승 MVP는 {mvp}이(가) 선정됐다. {winner}은(는) 국내 챔피언으로 시즌을 마무리했다." },
    { who: "other", headline: "리그 왕좌는 {winner}", body: "{event} 결승에서 {winner}이(가) {loser}을(를) {score}로 제압했다. {mvp}이(가) 결승 MVP에 오르며 우승을 이끌었다. {year} 국내 리그의 최종 승자는 {winner}(이)었다." },
    { who: "other", headline: "{winner}, 결승 승리로 우승", body: "{winner}이(가) {loser}과(와)의 결승전을 {score}로 마무리하며 정상에 올랐다. 결승 MVP는 {mvp}(이)었다. 치열했던 {event}은(는) {winner}의 우승으로 막을 내렸다." },
  ],

  worlds_qualify: [
    { who: "myTeam", headline: "{myTeam}, 월드 진출 확정", body: "{year} 월드 챔피언십에 나설 우리 리그 {count}팀이 모두 정해졌다. 진출팀은 {teams}(이)다. {myTeam}도 이름을 올리며 {me}의 세계 무대 도전이 이어지게 됐다." },
    { who: "myTeam", headline: "{myTeam}, 월드행 티켓 확보", body: "우리 리그의 월드 챔피언십 대표는 {teams}, 총 {count}팀으로 확정됐다. {myTeam}이(가) 대표 명단에 포함됐다. 시즌 최대 무대를 향한 준비가 시작된다." },
    { who: "myTeam", headline: "{myTeam}, 세계무대로 간다", body: "월드 챔피언십에 출전할 우리 리그 팀은 {teams}(으)로 결정됐다. 출전 규모는 총 {count}팀이다. {myTeam}과(와) {me}도 가장 큰 국제무대를 밟게 됐다." },

    { who: "other", headline: "월드 대표 {count}팀 확정", body: "{year} 월드 챔피언십에 나설 우리 리그 대표팀이 모두 결정됐다. 진출팀은 {teams}, 총 {count}팀이다. {myTeam}은(는) 이번 명단에 포함되지 못했다." },
    { who: "other", headline: "{myTeam}, 월드 진출 실패", body: "우리 리그의 월드 챔피언십 출전팀은 {teams}(으)로 확정됐다. 모두 {count}팀이 세계 무대로 향한다. {myTeam}은(는) 출전권을 얻지 못하며 시즌의 국제대회 일정이 끝났다." },
    { who: "other", headline: "월드행 주인공은 {teams}", body: "{year} 월드 챔피언십에 출전하는 우리 리그 대표는 {teams}(이)다. 총 {count}팀이 출전권을 확보했다. {myTeam}은(는) 월드 무대에 오르지 못했다." },
  ],

  promotion: [
    { who: "myUp", headline: "{myTeam}, 마침내 1부 승격", body: "{myTeam}이(가) 승강전에서 {tier1}을(를) {score}로 꺾고 승격에 성공했다. 승자는 {winner}(이)었다. 다음 시즌부터 {myTeam}은(는) 1부 리그에서 경쟁한다." },
    { who: "myUp", headline: "{myTeam}, 1부행 꿈 이뤘다", body: "2부의 {myTeam}이(가) 1부의 {tier1}을(를) {score}로 제압했다. {winner}이(가) 승강전의 승자가 되면서 승격이 확정됐다. {me}에게도 다음 시즌 새로운 무대가 열린다." },
    { who: "myUp", headline: "{myTeam}, 승강전 승리와 승격", body: "{myTeam}이(가) {tier1}을(를) 상대로 {score} 승리를 거두며 1부 승격권을 손에 넣었다. 최종 승자는 {winner}(이)었다. 기다려 온 1부 도전이 현실이 됐다." },

    { who: "myFail", headline: "{myTeam}, 승격 문턱서 좌절", body: "{myTeam}이(가) 승강전에서 {tier1}에게 {score}로 패했다. 승자는 {winner}(이)었다. 1부 진입에 실패한 {myTeam}은(는) 다음 시즌 다시 2부에서 도전한다." },
    { who: "myFail", headline: "{myTeam}, 1부행 끝내 불발", body: "{tier1}과(와)의 승강전에서 {myTeam}이(가) {score}로 무릎을 꿇었다. {winner}이(가) 승리를 가져갔다. {me}과(와) {myTeam}에게 승격은 다음 기회로 미뤄졌다." },
    { who: "myFail", headline: "{myTeam}, 승강전 패배", body: "1부 승격을 노렸던 {myTeam}이(가) {tier1}의 벽을 넘지 못했다. 경기는 {winner}의 {score} 승리로 끝났다. {myTeam}은(는) 2부에 남아 다시 시즌을 준비한다." },

    { who: "myStay", headline: "{myTeam}, 1부 잔류 성공", body: "{myTeam}이(가) 승강전에서 {tier2}을(를) {score}로 꺾고 1부 자리를 지켰다. 승자는 {winner}(이)었다. 위기의 순간을 넘긴 {myTeam}은(는) 다음 시즌에도 1부에서 뛴다." },
    { who: "myStay", headline: "{myTeam}, 생존전에서 웃었다", body: "1부 잔류가 걸린 경기에서 {myTeam}이(가) {tier2}을(를) {score}로 제압했다. {winner}의 승리로 승강전이 끝났다. {me}과(와) {myTeam}은(는) 강등을 피하며 한숨을 돌렸다." },
    { who: "myStay", headline: "{myTeam}, 1부 자리 지켰다", body: "{myTeam}이(가) {tier2}과(와)의 승강전을 승리로 마무리했다. 최종 스코어는 {score}, 승자는 {winner}(이)었다. {myTeam}은(는) 다음 시즌에도 1부 무대를 누빈다." },

    { who: "myDown", headline: "{myTeam}, 충격의 2부 강등", body: "{myTeam}이(가) 승강전에서 {tier2}에게 {score}로 패하며 2부 강등이 확정됐다. 승자는 {winner}(이)었다. {me}과(와) {myTeam}은(는) 다음 시즌 승격을 목표로 다시 시작해야 한다." },
    { who: "myDown", headline: "{myTeam}, 1부 자리 잃었다", body: "1부의 {myTeam}이(가) 2부의 {tier2}에게 {score}로 패했다. {winner}이(가) 승강전에서 웃으며 {myTeam}의 강등이 결정됐다. 힘겨웠던 시즌의 끝은 2부행이었다." },
    { who: "myDown", headline: "{myTeam}, 승강전 패배로 강등", body: "{myTeam}이(가) {tier2}의 도전을 막아내지 못했다. 경기는 {winner}의 {score} 승리로 끝났고 {myTeam}의 2부 강등이 확정됐다. 다음 시즌에는 1부 복귀를 위한 싸움이 시작된다." },

    { who: "up", headline: "{tier2}, 1부 승격 성공", body: "2부의 {tier2}이(가) 승강전에서 {tier1}을(를) {score}로 꺾었다. 승자는 {winner}(이)었다. {tier2}은(는) 다음 시즌 1부 리그에 합류한다." },
    { who: "up", headline: "{tier2}, 1부행 티켓 확보", body: "{tier2}이(가) 1부 팀 {tier1}을(를) 상대로 {score} 승리를 거뒀다. {winner}이(가) 최종 승자가 되며 승격에 성공했다. 두 팀의 소속 리그는 다음 시즌부터 바뀐다." },
    { who: "up", headline: "{tier2}, 승강전 승리", body: "승강전에서 {tier2}이(가) {tier1}을(를) 제압했다. 최종 스코어는 {score}, 승자는 {winner}(이)었다. {tier2}은(는) 2부를 떠나 1부로 올라간다." },

    { who: "stay", headline: "{tier1}, 1부 잔류 확정", body: "{tier1}이(가) 승강전에서 {tier2}을(를) {score}로 꺾고 잔류에 성공했다. 승자는 {winner}(이)었다. {tier1}은(는) 다음 시즌에도 1부에서 경쟁한다." },
    { who: "stay", headline: "{tier1}, 승강전서 생존", body: "1부 팀 {tier1}이(가) 2부의 {tier2}을(를) 상대로 {score} 승리를 거뒀다. {winner}이(가) 승자가 되면서 {tier1}의 잔류가 확정됐다. {tier2}의 승격 도전은 실패로 끝났다." },
    { who: "stay", headline: "{tier1}, 1부 자리 지켰다", body: "{tier1}이(가) {tier2}과(와)의 승강전을 승리로 마쳤다. 결과는 {winner}의 {score} 승리였다. {tier1}은(는) 강등 위기를 넘기고 1부에 남는다." },
  ],

  worlds_final: [
    { who: "myTeam", headline: "{myTeam}, 세계 챔피언 등극", body: "{myTeam}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 세계 정상에 올랐다. 결승 MVP는 {mvp}이(가) 선정됐다. {me}과(와) {myTeam}의 이름이 {year} 최고의 자리에 새겨졌다." },
    { who: "myTeam", headline: "{myTeam}, 마침내 세계 제패", body: "{year} 시즌의 마지막 우승컵은 {myTeam}이(가) 들어 올렸다. {event} 결승에서 {loser}을(를) {score}로 제압했고 {mvp}이(가) MVP를 차지했다. {me}의 커리어에도 세계 챔피언이라는 가장 빛나는 기록이 추가됐다." },
    { who: "myTeam", headline: "{myTeam}, 월드 왕좌 차지", body: "{myTeam}이(가) 세계 최강의 자리에 섰다. 결승에서 {loser}을(를) {score}로 꺾었으며 결승 MVP는 {mvp}(이)었다. 긴 시즌의 마지막 순간, {me}은(는) 월드 우승컵을 들어 올렸다." },

    { who: "myRunnerUp", headline: "{myTeam}, 월드 준우승", body: "{myTeam}이(가) {event} 결승에서 {winner}에게 {score}로 패하며 준우승에 머물렀다. 결승 MVP는 {mvp}(이)었다. 세계 정상까지 단 한 걸음이었던 만큼 {me}에게도 오래 남을 패배가 됐다." },
    { who: "myRunnerUp", headline: "{myTeam}, 왕좌 앞에서 멈췄다", body: "{year} 세계 챔피언의 자리는 {winner}에게 돌아갔다. {myTeam}은(는) 결승에서 {score}로 패했고 {mvp}이(가) MVP를 차지했다. 긴 여정의 마지막이 준우승으로 끝나며 짙은 아쉬움을 남겼다." },
    { who: "myRunnerUp", headline: "{myTeam}, 마지막 한 걸음 좌절", body: "{event} 결승에서 {myTeam}이(가) {winner}의 벽을 넘지 못했다. 최종 스코어는 {score}, 결승 MVP는 {mvp}(이)었다. {me}과(와) {myTeam}의 세계 정상 도전은 다음 시즌을 기약하게 됐다." },

    { who: "domestic", headline: "{winner}, 세계 챔피언 등극", body: "우리 리그의 {winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 세계 정상에 올랐다. 결승 MVP는 {mvp}(이)었다. {year} 월드 챔피언십 우승컵이 우리 리그로 돌아왔다." },
    { who: "domestic", headline: "우리 리그 {winner}, 월드 제패", body: "{winner}이(가) 결승에서 {loser}을(를) {score}로 제압하며 {event} 우승을 차지했다. {mvp}이(가) 결승 MVP로 선정됐다. 우리 리그 팀이 시즌 마지막 국제대회의 정상에 섰다." },
    { who: "domestic", headline: "{winner}, 세계 왕좌에 올랐다", body: "{year} {event}의 최종 승자는 우리 리그의 {winner}(이)었다. {loser}을(를) {score}로 꺾었고 결승 MVP는 {mvp}(이)었다. 국내 리그는 세계 챔피언을 배출하며 시즌을 마무리했다." },

    { who: "overseas", headline: "{winner}, 월드 우승", body: "해외 팀 {winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 세계 챔피언에 올랐다. 결승 MVP는 {mvp}이(가) 선정됐다. {year} 시즌의 마지막 우승컵은 {winner}에게 돌아갔다." },
    { who: "overseas", headline: "세계 챔피언은 {winner}", body: "{winner}이(가) 결승에서 {loser}을(를) {score}로 제압하며 {event} 정상에 올랐다. {mvp}이(가) 결승 MVP를 차지했다. 해외 리그의 {winner}이(가) 세계 최강팀의 자리를 차지했다." },
    { who: "overseas", headline: "{winner}, 세계 정상 정복", body: "{event}의 마지막 경기는 {winner}의 승리로 끝났다. {winner}이(가) {loser}을(를) {score}로 꺾었고 결승 MVP는 {mvp}(이)었다. 월드 우승컵은 해외 팀의 손에 들어갔다." },
  ],
};
