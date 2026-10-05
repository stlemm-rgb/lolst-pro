// 한 시즌(52주) 일정표
// 2026년 실제 한국 1부 리그 일정을 바탕으로 만들었어요.
// - from ~ to: 주차
// - id: 코드에서 쓰는 이름 (영어, 바꾸지 마세요)
// - name / desc: 화면에 보이는 이름과 설명
// - league: 이 기간에 리그 경기가 있는지 (3단계에서 사용)
// - empty: 국제대회를 나중에 추가할 수 있게 비워 둔 기간
const SCHEDULE = [
  { from: 1,  to: 1,  id: "preseason",  name: "프리시즌",            desc: "새 시즌 준비. 패치 적용." },
  { from: 2,  to: 7,  id: "cup",        name: "컵 대회 조별 리그",     desc: "1부 10팀이 두 조로 나뉘어 상대 조 팀과 한 번씩 경기.", league: true },
  { from: 8,  to: 9,  id: "cup_po",     name: "컵 대회 플레이오프",    desc: "상위 6팀 토너먼트.", league: true },
  { from: 10, to: 12, id: "break1",     name: "휴식기",              desc: "국제대회를 나중에 추가할 수 있는 자리.", empty: true },
  { from: 13, to: 22, id: "split1",     name: "정규 시즌 1·2라운드",   desc: "1부 10팀, 2부 8팀이 서로 두 번씩 경기 (3판 2선승).", league: true },
  { from: 23, to: 28, id: "break2",     name: "여름 휴식기",          desc: "국제대회를 나중에 추가할 수 있는 자리.", empty: true },
  { from: 29, to: 29, id: "summer_prep", name: "후반기 준비",         desc: "패치 적용. 후반기 준비." },
  { from: 30, to: 34, id: "split2",     name: "정규 시즌 3·4라운드",   desc: "1부는 상위 5팀 / 하위 5팀으로 나뉘어 두 번씩 경기.", league: true },
  { from: 35, to: 35, id: "playin",     name: "플레이인",             desc: "플레이오프 5·6번 자리를 두고 4팀이 경기.", league: true },
  { from: 36, to: 38, id: "playoffs",   name: "플레이오프",           desc: "6팀 토너먼트, 전부 5판 3선승. 상위 4팀 월드 진출.", league: true },
  { from: 39, to: 40, id: "promotion",  name: "승강전",              desc: "1부 하위 팀과 2부 상위 팀이 다음 시즌 1부 자리를 두고 경기.", league: true },
  { from: 41, to: 41, id: "worlds_prep", name: "월드 준비",           desc: "월드 챔피언십 출전 팀 부트캠프." },
  { from: 42, to: 46, id: "worlds",     name: "월드 챔피언십",        desc: "국내 상위 4팀 + 해외 가상 팀 12팀.", international: true },
  { from: 47, to: 52, id: "offseason",  name: "비시즌 (이적 시장)",    desc: "계약 만료, 이적, 재계약." },
];

// 월드 챔피언십 (지금 유일한 국제대회)
// 해외 지역은 이름과 전력만 있는 가상 팀으로 간단히 만들어요 (3단계).
const WORLDS = {
  myRegionSlots: 4,     // 우리 리그에서 나가는 팀 수
  // 해외 가상 지역: 지역 이름과 전력 수준 (우리 리그 평균 = 1.0)
  regions: [
    { name: "동부 지역", strength: 1.0,  teams: 4 },
    { name: "서부 지역", strength: 0.9,  teams: 4 },
    { name: "남부 지역", strength: 0.85, teams: 4 },
  ],
  // 진행 방식: 16팀 → 4팀씩 4개 조 조별 리그 → 각 조 상위 2팀 8강 → 4강 → 결승
  format: "16팀 조별 리그(4조) → 8강 → 4강 → 결승",
};

// 지금 주차의 일정 찾기
function scheduleOfWeek(week) {
  return SCHEDULE.find(function (s) { return week >= s.from && week <= s.to; });
}
