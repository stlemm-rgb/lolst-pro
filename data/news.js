// ===== data/news.js — 뉴스 기사: 신문 팝업·월즈 특집·역사 뉴스 (R2: 파일 3개를 합침) =====

// ━━━━━ (예전 data/news_articles.js) ━━━━━
// ===== 대회 결과 뉴스 (화면에 뜨는 신문 기사) — js/news.js =====
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
    { who: "myTeam", headline: "{myTeam}, {event} 정상 등극", body: "{myTeam}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 우승을 차지했다. 결승 MVP는 {mvp}이(가) 선정됐다. {firstStandNote}" },
    { who: "myTeam", headline: "{myTeam}, 컵 우승 확정", body: "{myTeam}이(가) {loser}을(를) {score}로 제압하며 {event}의 주인이 됐다. {mvp}이(가) 결승 MVP에 올랐다. {firstStandNote}" },
    { who: "myTeam", headline: "{myTeam}, 첫 관문을 넘었다", body: "{year} 시즌 첫 우승컵은 {myTeam}의 차지가 됐다. {event} 결승에서 {loser}을(를) {score}로 꺾었고, {mvp}이(가) MVP를 차지했다. {firstStandNote}" },

    { who: "myRunnerUp", headline: "{myTeam}, 우승 문턱서 멈췄다", body: "{myTeam}이(가) {event} 결승에서 {winner}에게 {score}로 패하며 준우승에 머물렀다. 결승 MVP는 {mvp}이(가) 차지했다. {me}에게는 아쉬움을 씻을 다음 무대가 남아 있다." },
    { who: "myRunnerUp", headline: "{myTeam}, 아쉬운 결승 패배", body: "{event} 우승컵을 눈앞에 뒀던 {myTeam}이(가) {winner}에게 {score}로 패했다. {mvp}이(가) 결승 MVP에 선정됐다. {myTeam}은(는) 첫 우승 기회를 놓치며 다음 대회를 기약했다." },
    { who: "myRunnerUp", headline: "{myTeam}, 준우승으로 대회 마감", body: "{myTeam}이(가) {year} {event} 결승에서 {winner}의 벽을 넘지 못했다. 최종 스코어는 {score}, 결승 MVP는 {mvp}(이)었다. 정상까지 한 걸음이 부족했던 결과였다." },

    { who: "other", headline: "{winner}, {event} 우승", body: "{winner}이(가) {event} 결승에서 {loser}을(를) {score}로 꺾고 정상에 올랐다. 결승 MVP는 {mvp}이(가) 선정됐다. {firstStandNote}" },
    { who: "other", headline: "{winner}, LCK 컵 정상 등극", body: "{year} {event}의 우승팀은 {winner}(으)로 결정됐다. {winner}이(가) 결승에서 {loser}을(를) {score}로 제압했고, {mvp}이(가) MVP를 차지했다. {firstStandNote}" },
    { who: "other", headline: "{event} 챔피언은 {winner}", body: "{winner}이(가) {loser}을(를) 상대로 {score} 승리를 거두며 {event} 우승컵을 들어 올렸다. 결승 MVP는 {mvp}(이)었다. {firstStandNote}" },
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

// ----- 연속 우승 (리핏·쓰리핏…) — js/news.js queueFinalNews -----
// 같은 대회를 해마다 연속으로 우승하면 결승 기사 제목을 바꾸고 본문에 한 문장을 더해요.
// 연속 우승 기록이 있던 팀이 결승에서 지면 '도전이 멈췄다' 문장을 더해요.
// 글자 바꾸기: 결승 기사 값 + {peat} 리핏·쓰리핏…, {streak} 연속 우승 횟수, {brokenStreak} 진 팀의 연속 우승 횟수
const REPEAT_NEWS = {
  names: { 2: "리핏", 3: "쓰리핏", 4: "포핏", 5: "파이브핏", 6: "식스핏", 7: "세븐핏", 8: "에잇핏", 9: "나인핏", 10: "텐핏" }, // 그 위는 'n연패'
  headline: {
    myTeam: ["{myTeam}, {event} {peat} 달성!", "{peat}! {myTeam}, {event} {streak}년 연속 정상", "{myTeam} 왕조, {event} {peat}"],
    any: ["{winner}, {event} {peat} 달성", "{peat}! {winner}, {event} {streak}년 연속 정상", "{winner} 왕조, {event} {peat}"],
  },
  body: {
    myTeam: "이번 우승으로 {myTeam}은(는) {event} {streak}년 연속 우승, '{peat}'을(를) 완성했다. {me}의 이름도 왕조의 역사에 새겨졌다.",
    any: "이번 우승으로 {winner}은(는) {event} {streak}년 연속 우승, '{peat}'을(를) 달성했다.",
  },
  broken: {
    myTeam: "{myTeam}이(가) {loser}의 {event} {brokenStreak}년 연속 우승 도전을 막아 세웠다.",
    any: "{loser}의 {event} {brokenStreak}년 연속 우승 도전은 결승에서 멈췄다.",
  },
};

// ━━━━━ (예전 data/worlds_news.js) ━━━━━
// 월즈 기사 전용 자료. 개최 후보는 게임의 지역 구분에 맞춘 대표 국가 목록이다.
// 주제곡 제목과 영상은 게임 내 창작 소개이며 실제 음원·영상 파일을 재생하지 않는다.
const WORLDS_NEWS = {
  firstHost: { country: "미국", city: "로스앤젤레스" },
  hosts: [
    { region: "kr", country: "한국", city: "서울" },
    { region: "na", country: "미국", city: "워싱턴 D.C." },
    { region: "na", country: "캐나다", city: "오타와" },
    { region: "eu", country: "독일", city: "베를린" },
    { region: "eu", country: "프랑스", city: "파리" },
    { region: "eu", country: "영국", city: "런던" },
    { region: "cn", country: "중국", city: "베이징" },
    { region: "tw", country: "대만", city: "타이베이" },
    { region: "sea", country: "태국", city: "방콕" },
    { region: "sea", country: "싱가포르", city: "싱가포르" },
    { region: "br", country: "브라질", city: "브라질리아" },
    { region: "tr", country: "튀르키예", city: "앙카라" },
    { region: "cis", country: "러시아", city: "모스크바" },
    { region: "jp", country: "일본", city: "도쿄" },
    { region: "lat", country: "멕시코", city: "멕시코시티" },
    { region: "lat", country: "칠레", city: "산티아고" },
    { region: "vn", country: "베트남", city: "하노이" },
    { region: "oce", country: "호주", city: "캔버라" },
    { region: "oce", country: "뉴질랜드", city: "웰링턴" },
  ],
  songs: ["정상을 향한 함성", "우리의 불꽃", "경계를 넘어", "마지막 넥서스", "왕관의 무게", "끝나지 않은 도전", "승리의 메아리", "다시 빛날 순간"],
  videos: [
    "도시의 야경이 거대한 협곡으로 바뀌고, 선수들의 실루엣이 챔피언의 모습과 겹친다. 빠른 화면 전환과 후렴의 폭발적인 연출이 압도적인 영상미를 만든다.",
    "훈련실의 작은 모니터에서 시작한 화면이 만원 관중석으로 확장된다. 선수들의 손끝과 눈빛을 따라가며 프로 무대에 바친 시간과 노력을 기린다.",
    "서로 다른 지역에서 출발한 선수들이 하나의 무대로 모인다. 각자의 유니폼과 플레이 스타일을 살린 연출이 지역을 대표하는 선수들에게 경의를 표한다.",
    "패배 뒤 다시 일어서는 선수들의 모습이 음악과 함께 이어진다. 마지막 후렴에서는 트로피를 향해 달려가는 장면으로 도전자들의 열망을 담아낸다.",
  ],
  headline: "{year} 월드 챔피언십, 다음 주 {city}에서 개막",
  intro: "세계 무대가 열린다. {year} 월드 챔피언십은 {country} {city}에서 개최되며, 다음 주인 42주차부터 조별리그가 시작된다.",
  music: "🎵 올해의 주제곡 ‘{song}’ 및 뮤직비디오가 공개됐다. {video}",
  respect: "👑 전년도 챔피언 {champion}에게 보내는 리스펙도 담겼다. 우승팀의 이름과 트로피를 들어 올리는 장면이 영상의 한 축을 이룬다.",
  noHistory: "지난 월즈의 기록이 남아 있지 않아, 이번 영상은 각 지역 선수들의 도전과 새 시즌의 무대에 초점을 맞췄다.",
  current: "🎬 올해 주요 경기 재구성: {scenes}",
  previous: "🎞️ 전년도 월즈 장면 재구성: {scenes}",
  mvpHeading: "⭐ 각 지역 리그 MVP — 아래는 지역 수상자 소개이며, 월즈 최종 출전 명단과는 별개다.",
  mvpMissing: "수상 기록 없음",
  participant: "{team}도 국내 대표로 이름을 올렸다. {me}의 시즌은 이제 세계 무대로 이어진다.",
  observer: "각 지역 강팀의 맞대결을 앞두고 팬들의 기대가 높아지고 있다. 최종 참가팀과 조 편성은 개막 때 공개된다.",
  opening: "{year} 월드 챔피언십이 {country} {city}에서 개막했다. {count}개 팀의 조별리그가 이번 주 시작된다.",
};

// ━━━━━ (예전 data/historical_news.js) ━━━━━
// 1주: 시즌 배경, 29주: 상반기 소식, 49주: 하반기 소식/다음 시즌 예고.
// 주차는 게임용 편성이다. source는 편집·검증용이며 실행 중 네트워크 요청은 없다.
const HISTORICAL_NEWS_NOTE = "실제 LoL 역사에서 전하는 시대 소식입니다. 대회 일정·승강 규칙·경기 수치는 이 게임의 규칙을 따릅니다.";
const HISTORICAL_NEWS = [
  { id: "2012-start", year: 2012, week: 1, title: "새로운 프로 무대를 꿈꾸는 선수들",
    body: "아직 프로 무대의 틀이 만들어지는 시기다. 한국에서도 챔피언스 시대를 맞이할 선수들이 세계 무대에 도전한다. 이 커리어의 우승팀과 스타 선수는 앞으로 펼쳐질 경기에서 결정된다.",
    source: "https://en.wikipedia.org/wiki/League_of_Legends_Champions_Korea" },
  { id: "2012-champions", year: 2012, week: 29, title: "한국 챔피언스의 출발",
    body: "2012년 한국에서 LoL 챔피언스가 출범했다. 훗날 LCK로 이어지는 무대의 시작이다. 당시 대회 중심의 체제는 지금의 정규 리그와 달랐으며, 이 게임에서는 익숙한 연간 일정으로 그 시대를 풀어낸다.",
    source: "https://en.wikipedia.org/wiki/League_of_Legends_Champions_Korea" },
  { id: "2013-start", year: 2013, week: 1, title: "챔피언스, 다음 시즌을 향해",
    body: "지난해 시작된 한국 챔피언스가 새 시즌을 맞는다. 한 대회에서 이름을 알린 뒤에도 다음 무대에서 실력을 증명해야 하는 시기다. 국내 경쟁을 넘어 국제 무대에서도 통하는 팀을 향한 도전이 이어진다.",
    source: "https://en.wikipedia.org/wiki/League_of_Legends_Champions_Korea" },
  { id: "2013-lcs", year: 2013, week: 29, title: "북미·유럽 LCS 시대가 열리다",
    body: "2013년 북미와 유럽에서 LCS가 출범했다. 시즌을 따라 팀을 응원하고 매주 경기를 보는 리그 문화가 자리를 넓힌다. 이 게임의 해외 리그 참가 연도는 자체 일정이며, 실제 출범 연도와는 구분된다.",
    source: "https://lolesports.com/en-US/news/celebrate-the-lcs-10-year-anniversary" },
  { id: "2014-start", year: 2014, week: 1, title: "지역 리그가 쌓아 가는 이야기",
    body: "북미·유럽 LCS가 출범한 지 한 시즌이 지났다. 한국 챔피언스와 함께 각 지역에서 팀의 이름과 경쟁 구도가 쌓여 간다. 국제대회는 서로 다른 무대에서 성장한 팀들이 만나는 자리가 된다.",
    source: "https://lolesports.com/en-US/news/celebrate-the-lcs-10-year-anniversary" },
  { id: "2014-rift", year: 2014, week: 49, title: "새 모습의 소환사의 협곡",
    body: "2014년 소환사의 협곡이 대규모 시각 개편을 거쳤다. 익숙한 세 갈래 라인과 정글이 새로운 풍경으로 바뀌었다. 다음 시즌을 기다리는 선수들에게도 새로운 시대의 첫인상을 남기는 변화다.",
    source: "https://www.leagueoflegends.com/en-gb/news/dev/dev-season-2024-map-changes/" },
  { id: "2015-start", year: 2015, week: 1, title: "LCK, 리그제의 새 출발",
    body: "한국 프로 무대가 2015년 LCK 리그제로 전환한다. 한 대회의 결과뿐 아니라 시즌을 거치며 쌓는 경쟁력이 주목받는 전환점이다. 게임 속 기존 대회와 승강 일정은 그대로 이어진다.",
    source: "https://www.leagueoflegends.com/ko-kr/news/esports/lck-franchise/" },
  { id: "2015-msi", year: 2015, week: 29, title: "새 국제대회 MSI의 등장",
    body: "2015년 첫 미드 시즌 인비테이셔널(MSI)이 개최됐다. 시즌 중반에도 지역의 대표들이 국제 무대에서 실력을 겨루는 계기가 마련됐다. 이 게임에서도 MSI는 2015년부터 열리며, 결과는 실제 플레이에 따라 달라진다.",
    source: "https://lolesports.com/en-US/news/top-moments-in-msi-history" },
  { id: "2016-start", year: 2016, week: 1, title: "MSI와 월즈를 향한 한 시즌",
    body: "지난해 출범한 MSI와 시즌 마지막의 월드 챔피언십. 지역 리그를 넘어 실력을 증명할 국제 무대가 이어진다. 선수들에게는 한 번의 좋은 성적을 다음 대회까지 이어 가는 꾸준함이 과제로 남는다.",
    source: "https://lolesports.com/en-US/news/top-moments-in-msi-history" },
  { id: "2016-dragons", year: 2016, week: 29, title: "6.9 패치, 원소 드래곤의 등장",
    body: "2016년 중간 시즌 업데이트에서 원소 드래곤이 도입됐다. 드래곤 종류마다 다른 보상을 주면서 어떤 오브젝트를 두고 싸울지 판단하는 재미가 커졌다. 게임 반영: 29주부터 양 팀의 운영 스타일 점수 영향이 10% 커진다. 운영에 강한 팀의 장점과 약한 팀의 약점이 조금 더 드러나며, 선수 능력치 자체는 변하지 않는다.",
    source: "https://na.leagueoflegends.com/en/featured/mid-season-magic" },
  { id: "2017-start", year: 2017, week: 1, title: "원소 드래곤과 함께 맞는 새 시즌",
    body: "지난해 등장한 원소 드래곤은 팀이 지도를 읽는 방식에 새로운 질문을 던졌다. 용을 준비할지, 반대편에서 이득을 얻을지. 한 번의 교전뿐 아니라 경기 전체를 설계하는 이야기가 새 시즌에도 이어진다.",
    source: "https://nexus.leagueoflegends.com/en-us/2016/10/dev-on-depth-vs-accessibility/" },
  { id: "2017-runes", year: 2017, week: 49, title: "룬 대격변, 다음 시즌의 준비가 달라진다",
    body: "2017년 프리시즌에 룬과 특성이 새로운 룬 체계로 통합됐다. 챔피언 선택에 맞춰 경기 전 세팅을 고민하는 방식도 크게 달라졌다. 다음 시즌을 앞둔 대격변이지만, 이 게임의 선수 특성과 챔피언 숙련도는 초기화되지 않는다.",
    source: "https://www.riotgames.com/en/news/runes-reforged-technical-retro" },
  { id: "2018-start", year: 2018, week: 1, title: "새 룬 체계로 출발하는 시즌",
    body: "지난 프리시즌의 룬 개편을 바탕으로 2018 시즌이 시작된다. 같은 챔피언도 어떤 핵심 룬을 고르는지에 따라 다른 전략을 보여 줄 수 있다. 새로운 조합을 해석하는 과정이 시대의 화두다.",
    source: "https://www.riotgames.com/en/news/runes-reforged-technical-retro" },
  { id: "2019-start", year: 2019, week: 1, title: "유럽, LEC라는 이름으로",
    body: "유럽 최상위 무대가 2019년 LEC라는 이름으로 새 출발한다. 지역 리그의 정체성과 파트너십을 강조하는 변화다. 이 게임의 유럽 팀 구성과 국제대회 참가 방식은 자체 규칙을 유지한다.",
    source: "https://preprod2-press.kia.com/ie/en/home/media-resouces/press-releases/2019/Kia_enters_e-sports_arena_as_League_of_Legends_European_Championship_sponsor.html" },
  { id: "2019-elements", year: 2019, week: 49, title: "9.23 패치, 원소의 협곡과 드래곤 영혼",
    body: "2020 시즌을 앞둔 2019년 프리시즌, 원소에 따라 지형이 바뀌는 협곡과 드래곤 영혼이 등장했다. 용을 쌓아 강력한 보상으로 연결하는 목표가 더해지며 다음 시즌의 오브젝트 싸움이 관심을 모은다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-9-23-notes/" },
  { id: "2020-start", year: 2020, week: 1, title: "원소의 협곡에서 시작하는 시즌",
    body: "지난 프리시즌에 바뀐 협곡과 드래곤 영혼이 새 시즌을 맞는다. 지형 변화와 장기 목표를 함께 읽는 전략이 화두다. 실제 패치의 아이템·지형 수치를 이 게임의 경기 계산에 그대로 옮기지는 않는다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-9-23-notes/" },
  { id: "2020-msc", year: 2020, week: 29, title: "팬데믹 속 달라진 국제대회",
    body: "현실의 2020 MSI는 코로나19 여파로 취소됐고, 한국·중국 팀이 만나는 미드 시즌 컵(MSC)이 열렸다. 국경을 넘는 대회 운영이 큰 어려움을 겪은 시기다. 이 게임에서는 MSI를 취소하거나 MSC로 교체하지 않고 기존 일정을 진행한다.",
    source: "https://lolesports.com/en-US/news/introducing-the-2020-mid-season-cup-an-lck-vs-lpl-showdown" },
  { id: "2020-mythic", year: 2020, week: 49, title: "10.23 패치, 신화급 아이템 시대 예고",
    body: "2021 시즌을 준비하는 2020년 프리시즌에 아이템 체계가 크게 개편됐다. 신화급 아이템을 중심으로 장비를 구성하는 방식과 상점 개편이 등장했다. 익숙한 챔피언의 빌드를 다시 연구할 계기다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-10-23-notes/" },
  { id: "2021-start", year: 2021, week: 1, title: "LCK 프랜차이즈 시대",
    body: "현실의 LCK가 2021년 프랜차이즈 모델로 전환한다. 리그와 구단이 장기적으로 함께 성장하는 구조를 지향하는 변화다. 이 게임의 승강제와 구단 운영 규칙은 계속 유지된다.",
    source: "https://www.leagueoflegends.com/ko-kr/news/esports/lck-franchise/" },
  { id: "2022-start", year: 2022, week: 1, title: "신화급 아이템 체계에서 쌓이는 연구",
    body: "2021 시즌부터 이어진 신화급 아이템 체계 속에서 새 시즌이 시작된다. 챔피언과 아이템의 조합을 연구하는 흐름이 계속된다. 익숙한 빌드를 더 다듬을지, 새로운 조합을 찾을지 선수들의 준비가 이어진다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-10-23-notes/" },
  { id: "2022-durability", year: 2022, week: 29, title: "12.10 패치, 내구도 대격변",
    body: "2022년 5월 챔피언 전반의 내구도를 높이는 대규모 업데이트가 적용됐다. 순간 화력에 쓰러지는 속도를 늦추고 교전 중 대응할 여지를 넓히려는 변화다. 게임 반영: 29주부터 양 팀의 한타 스타일 점수 영향이 10% 커진다. 선수 능력치나 경기 시간은 직접 바꾸지 않는다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-12-10-notes/" },
  { id: "2023-start", year: 2023, week: 1, title: "국제대회 형식 개편 예고",
    body: "2023 시즌 소식으로 MSI 더블 엘리미네이션과 월즈 스위스 스테이지 도입이 발표됐다. 지역 대표들이 만나는 방식 자체를 바꾸려는 시도다. 이 게임의 대진표에는 해당 형식을 자동 적용하지 않는다.",
    source: "https://lolesports.com/news/state-of-the-game-lol-esports-in-2023" },
  { id: "2023-swiss", year: 2023, week: 49, title: "월즈, 스위스 스테이지의 첫해",
    body: "현실의 2023 월즈는 기존 그룹 스테이지 대신 스위스 스테이지를 도입했다. 같은 승패를 기록한 팀끼리 맞붙으며 진출 경쟁을 이어 가는 방식이다. 이 커리어의 월즈 우승과 경기 장면은 게임에서 실제로 기록한 결과를 따른다.",
    source: "https://lolesports.com/en-GB/news/worlds-2023-primer" },
  { id: "2024-start", year: 2024, week: 1, title: "14.1 패치, 달라지는 지형과 공허 유충",
    body: "2024 시즌은 신화급 아이템 체계를 없애고, 협곡 지형을 개편하며, 공허 유충을 추가하는 변화로 출발한다. 새로운 동선과 초반 오브젝트 선택이 연구 대상이다. 게임 반영: 양 팀의 운영 스타일 점수 영향이 기본보다 15% 커진다(종전 10%를 교체). 한타 영향 10%는 유지하며, 별도 오브젝트 전투는 추가하지 않는다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-14-1-notes/" },
  { id: "2025-start", year: 2025, week: 1, title: "First Stand와 새 국제대회 연간 체계",
    body: "2025년 First Stand 신설과 함께 국제대회 연간 체계가 바뀐다. 실제 지역 리그도 새 체계에 맞춰 변화한다. 이 게임에서는 기존에 정해진 규칙대로 2025년부터 First Stand가 열리며, 지역 통합이나 시즌 형식까지 일괄 변경하지 않는다.",
    source: "https://lolesports.com/news/lol-esports-in-2025" },
  { id: "2026-start", year: 2026, week: 1, title: "26.1 패치, 포지션별 퀘스트",
    body: "2026 시즌에는 포지션별 역할 퀘스트가 도입되고 기존 정글·서포터 퀘스트도 조정된다. 맡은 역할의 플레이에 보상을 연결하는 변화다. 이는 실제 LoL의 패치 소식으로, 이 게임의 감독 퀘스트에 새로운 보상을 지급한다는 뜻은 아니다.",
    source: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-1-notes/" }
];
