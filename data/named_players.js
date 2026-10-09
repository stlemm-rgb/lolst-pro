// ===== 네임드 선수: 새 게임마다 항상 등장하는 선수 (js/league.js placeNamedPlayers) =====
// - 1부 강팀의 주전으로 들어가요 (내 팀 제외, 되도록 서로 다른 팀. 팀이 모자라면 같은 포지션 네임드가 없는 팀에)
// - 나이: 내 선수 나이 ± ageGap 사이 (17~27세 안으로)
// - 실력(종합 능력): 나이에 따라 score 범위에서 정해요. 어릴수록 낮게 시작해서 성장해요
// - 좋은 특성 traits개 (다른 선수가 가질 수 있는 특성 중 무작위). 나쁜 특성은 없음
// - 다른 선수처럼 성장하고 늙고 은퇴해요
// - 예전 세이브를 불러와도 한 번은 들어와요 (목록에 새로 넣은 선수도 다음에 불러올 때 들어와요)
const NAMED_PLAYERS = [
  { name: "Ego",     pos: "top" },
  { name: "Chen",    pos: "jungle" },
  { name: "Sking",   pos: "mid" },
  { name: "Hwansam", pos: "adc" },
  { name: "Runa",    pos: "support" },
  { name: "Jimul",   pos: "adc" },      // v1.1 추가
  { name: "Kibai",   pos: "top" },      // v1.1 추가
];

const NAMED_RULES = {
  ageGap: [1, 3],              // 내 선수와 1~3살 차이 (위·아래 무작위)
  score: [                     // [이 나이까지, [최소, 최대]]
    [18, [66, 70]],
    [21, [70, 74]],
    [99, [73, 78]],
  ],
  traits: 2,
  teamPool: 6,                 // 1부 전력 상위 몇 팀 중에서 고를지
};
