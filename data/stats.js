// 선수 실력 스탯 12개 (0 ~ 100)
// - id: 코드에서 쓰는 이름 (영어, 바꾸지 마세요)
// - name: 화면에 보이는 이름
// - desc: 짧은 설명 (마우스를 올리면 보여요)
const STATS = [
  { id: "accuracy",  name: "입력 정확도", desc: "원하는 곳에 정확히 클릭하고 스킬을 맞히는 능력" },
  { id: "laning",    name: "라인전",     desc: "초반 1:1 싸움과 CS 관리" },
  { id: "teamfight", name: "한타",       desc: "5:5 대규모 싸움에서의 위치와 판단" },
  { id: "macro",     name: "운영",       desc: "판 전체를 읽고 오브젝트를 챙기는 능력" },
  { id: "vision",    name: "시야",       desc: "와드 설치와 상대 위치 예측" },
  { id: "shotcall",  name: "오더",       desc: "팀에게 지시를 내리고 이끄는 능력" },
  { id: "pool",      name: "챔피언 폭",   desc: "다룰 수 있는 챔피언의 다양함" },
  { id: "mental",    name: "멘탈",       desc: "압박과 패배 속에서도 흔들리지 않는 힘" },
  { id: "reaction",  name: "반응속도",    desc: "상대 스킬에 빠르게 대응하는 능력" },
  { id: "spacing",   name: "거리 조절",   desc: "때리고 빠지는 거리 감각" },
  { id: "adapt",     name: "적응력",     desc: "새 메타·새 챔피언에 빨리 익숙해지는 능력" },
  { id: "focus",     name: "집중력",     desc: "긴 경기에서도 실수하지 않는 능력" },
];

// 실력 스탯과 따로 관리하는 특수 스탯
// - 체력 (0 ~ 최대치): 훈련·경기로 줄고 휴식으로 회복. 최대치는 시작 유형에 따라 다르고, 나이가 들면 줄어요.
// - 컨디션 (0 ~ 100): 그 주의 몸과 마음 상태
// - 인기도 (0 ~ 100): 얼마나 유명한가
// - 평판 (-100 ~ +100): 좋은 이미지인가 나쁜 이미지인가. 논란이면 내려가고 모범적이면 올라감
const GAUGES = [
  { id: "stamina",    name: "체력",   desc: "훈련·경기로 줄고 휴식으로 회복" },
  { id: "condition",  name: "컨디션", desc: "이번 주의 몸과 마음 상태" },
  { id: "popularity", name: "인기도", desc: "팬과 업계의 관심" },
  { id: "reputation", name: "평판",   desc: "-100 ~ +100. 좋은 이미지인지 나쁜 이미지인지. 구단 제안·이적에 영향" },
];

const CONDITION_START = 80;   // 처음 컨디션
const POPULARITY_START = 5;   // 처음 인기도
const REPUTATION_START = 0;   // 처음 평판 (-100 ~ +100)
const TIRED_LIMIT = 20;       // 체력이 이보다 낮으면 훈련 효과가 절반
