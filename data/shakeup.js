// ===== 대격변 패치 (js/shakeup.js) =====
// 2~3년마다 새 시즌 1주차 패치가 '대격변 패치'가 돼요. 챔피언과 게임이 크게 바뀌고, 신문 기사가 떠요.
//
// ■ 바뀌는 것
//   1) 챔피언 리워크: 포지션마다 rework.perPosition 명이 크게 바뀜
//      → 모든 선수(나·다른 선수)의 그 챔피언 숙련도 × rework.keep (40% 감소)
//      → 리워크 챔피언은 이번 패치 메타에 rework.metaChance 확률로 들어감
//   2) 숙련도 전체 감소: 리워크가 아닌 챔피언도 숙련도가 masteryCut.from 이상이면 × masteryCut.keep (10% 감소)
//   3) 챔피언 포지션 변경: posChange.count 명이 새 포지션에서도 쓸 수 있게 됨 (원래 포지션도 그대로)
//      → 새 포지션 선수들은 숙련도 1부터, 새 포지션 메타에 posChange.metaChance 확률로 들어감
//   4) 메타 판 확대: 대격변이 있는 해(두 패치 모두)는 포지션별 메타 챔피언 metaWide.perPosition 명, S급 metaWide.sCount 명
//   5) 오브젝트·아이템 개편: 아래 SHAKEUP_ITEM_CHANGES 중 하나 → 다음 대격변까지 경기 흐름 사건 분류별 빈도가 바뀜
//      (catW: 분류 → 배율. 분류 이름은 data/match_events.js MATCH_EVENT_CATS)
const SHAKEUP = {
  gapYears: [2, 3],          // 대격변 사이 간격 (년)
  rework: { perPosition: [2, 3], keep: 0.6, metaChance: 0.5 },
  masteryCut: { from: 30, keep: 0.9 },
  posChange: { count: [3, 5], metaChance: 0.4 },
  metaWide: { perPosition: 7, sCount: 2 },
};

const SHAKEUP_ITEM_CHANGES = [
  { id: "object", name: "오브젝트 보상 강화", desc: "드래곤·바론 보상이 커져서 오브젝트 싸움이 훨씬 잦아졌다.",           catW: { object: 1.6, early: 0.8 } },
  { id: "early",  name: "초반 주도권 강화",   desc: "첫 귀환 아이템이 강해져서 초반 싸움과 정글 개입이 늘었다.",          catW: { early: 1.7, macro: 0.8 } },
  { id: "fight",  name: "한타 아이템 강화",   desc: "방어·생존 아이템이 바뀌어 5대5 한타가 길고 중요해졌다.",             catW: { fight: 1.6, object: 0.85 } },
  { id: "macro",  name: "포탑·운영 보상 강화", desc: "포탑 방패와 골드가 늘어 라인 관리와 운영의 가치가 커졌다.",          catW: { macro: 1.6, fight: 0.85 } },
  { id: "chaos",  name: "변수 아이템 등장",   desc: "한 방이 큰 새 아이템들이 나와 슈퍼플레이와 실수가 모두 늘었다.",      catW: { play: 1.4, mistake: 1.4 } },
];

// 신문 기사 (news_popup). 빈칸:
//   {year} 연도 · {item} 개편 이름 · {itemDesc} 개편 설명 · {reworks} 리워크 챔피언(쉼표) · {moves} 포지션 변경(예: "애니(→서포트)")
//   {metaCount} 포지션별 메타 수 · {mine} 내 선수 관련 한 문장 (없으면 빈칸)
const SHAKEUP_ARTICLES = [
  { headline: "{year} 대격변 패치, 협곡이 뒤집혔다", body: "{year} 시즌을 앞두고 대규모 패치가 적용됐다. 리워크 대상은 {reworks}. 포지션 변화로는 {moves}이(가) 새 포지션에서도 쓰일 수 있게 됐다. {item}: {itemDesc} 메타 챔피언도 포지션마다 {metaCount}명으로 늘어 밴픽이 한층 복잡해질 전망이다. {mine}" },
  { headline: "'완전히 새 게임' 대격변 패치 상륙", body: "선수들이 입을 모아 '새 게임 같다'고 말하는 대격변 패치가 나왔다. 리워크 대상은 {reworks}. 포지션 변화로는 {moves}이(가) 눈에 띈다. {item}도 이뤄졌다. {itemDesc} 모든 선수가 숙련도를 다시 쌓아야 하는 상황이다. {mine}" },
  { headline: "대격변 패치, 적응이 곧 실력", body: "{year} 대격변 패치로 리그 판도가 흔들린다. {reworks}의 리워크, {moves}의 포지션 확장, 그리고 {item}까지. {itemDesc} 이번 시즌은 메타 챔피언이 포지션마다 {metaCount}명이라 챔피언 폭이 넓은 선수가 웃을 것으로 보인다. {mine}" },
];

// 기사 끝 '내 선수' 문장 ({champ} 챔피언 이름, {me} 내 선수, {pos} 내 포지션)
const SHAKEUP_MINE = {
  reworked: "{me} 선수의 주력 챔피언 {champ}도 리워크 대상이라 비상이 걸렸다.",
  gained:   "{pos}에 {champ}이(가) 새로 들어오면서 {me} 선수에게 새 무기가 생겼다.",
  none:     "{me} 선수에게도 새 메타 적응이라는 숙제가 주어졌다.",
};
