// ===== 팀 내 입지 (126) — 엔진 js/standing.js =====
// 입지 = 기본 + 요소들 (0~100). 매주 다시 계산, 팀을 옮기면 처음부터 (퀘스트·근속·주장 초기화)
// 효과: 재계약 연봉·제안 (grades), 주장 (captain)
const STANDING_RULES = {
  base: 50,
  quest: { done: 3, fail: -4, min: -15, max: 15, recent: 10 }, // 이 팀에서 최근 10개 퀘스트: 완료 +3, 기한 만료 −4
  trustMult: 4,                                            // 평판 등급 감독 신뢰(−3~+3) × 4 → −12~+12
  mates: { mult: 0.24, max: 12 },                          // 지금 동료 관계 평균(−100~100) × 0.24 → ±12
  form: { mult: 8, max: 10, minSets: 6 },                  // 이번 시즌 평점 − 팀 동료 평점 평균, × 8 → ±10 (세트 6개부터)
  tenure: { perSeason: 2, max: 6 },                        // 이 팀에서 보낸 시즌 × 2
  // 주장: 입지 askFrom 이상이면 감독이 주장 제안 (시즌 1번). loseBelow 아래로 떨어지면 주장 해제
  //   주장 효과: 경기 시작 때 팀 분위기 +teamMood, 입지 +bonus − 최근 recent경기 중 진 경기 × lossPenalty
  //   이적 시즌(47주, 성장 뒤): 우리 팀에 보강할 포지션이 있으면 감독이 영입 후보 3명을 물어봄
  captain: { askFrom: 80, loseBelow: 60, teamMood: 1, bonus: 4, recent: 5, lossPenalty: 3, pickCount: 3 },
  // 등급 (위에서부터). salary: 재계약 연봉 배율, renew: false면 재계약 제안 없음, early: 계약 마지막 해 30주에 조기 재계약
  grades: [
    { min: 80, icon: "👑", name: "팀의 중심",  salary: 0.15, early: true },
    { min: 60, icon: "💪", name: "핵심 선수",  salary: 0.05 },
    { min: 40, icon: "🙂", name: "주전",       salary: 0 },
    { min: 20, icon: "😟", name: "입지 불안",  salary: -0.10 },
    { min: 0,  icon: "⚠️", name: "방출 위기",  salary: -0.10, renew: false },
  ],
  earlyRenewWeek: 30,
};

const STANDING_TEXTS = {
  captainTitle: "👔 감독: 주장 제안",
  captain: "감독: \"요즘 팀이 너를 중심으로 돌아간다. 이번 시즌부터 주장 완장을 차 줄 수 있겠나? 대신 팀이 흔들리면 그 책임도 네 몫이다.\"",
  captainYes: "주장 완장을 받았다. 라커룸 분위기가 한결 단단해졌다.",
  captainNo: "\"아직은 제 플레이에 집중하고 싶습니다.\" 감독은 고개를 끄덕였다.",
  captainLostTitle: "👔 주장 교체",
  captainLost: "최근 팀 안에서 입지가 흔들리자, 감독이 주장 완장을 다른 선수에게 넘겼다.",
  pickTitle: "👔 감독: {pos} 보강, 누구를 데려올까?",
  pick: "감독: \"주장으로서 의견을 듣고 싶다. 이번 이적 시장에서 {pos} 자리를 보강하려고 한다. 지금 주전은 {starter}(점수 {starterScore})다. 후보 셋 중 누가 좋겠나?\"\n선수 이름을 누르면 선수 검색에서 자세히 볼 수 있어요.",
  pickDone: "감독: \"좋아, {player}(으)로 가자.\" 구단이 곧바로 {from}에 연락했다.",
  pickFail: "감독: \"미안하다, {player} 쪽 협상이 틀어졌다. 시장 상황을 보고 다시 움직이겠다.\"",
  pickSkip: "감독: \"알겠다. 구단과 상의해서 정하겠다.\"",
  earlyTitle: "👔 조기 재계약 제안",
};
