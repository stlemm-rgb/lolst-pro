// 선수 스탯 목록
// - id: 코드에서 쓰는 이름 (영어, 바꾸지 마세요)
// - name: 화면에 보이는 이름
// - start: 게임 시작 때 값 (0 ~ 100)
// - desc: 짧은 설명
const STATS = [
  { id: "physical",   name: "피지컬",  start: 40, desc: "반응속도와 손놀림" },
  { id: "strategy",   name: "운영",    start: 35, desc: "판을 읽고 이끄는 능력" },
  { id: "mental",     name: "멘탈",    start: 50, desc: "압박 속에서도 흔들리지 않는 힘" },
  { id: "stamina",    name: "체력",    start: 60, desc: "오래 집중할 수 있는 몸 상태" },
  { id: "popularity", name: "인기도",  start: 10, desc: "팬과 업계의 관심" },
];

// 컨디션: 스탯과 달리 매주 오르내리는 값 (0 ~ 100)
const CONDITION_START = 80;
