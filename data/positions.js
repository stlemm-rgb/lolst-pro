// 포지션 5개
// - bonus: 가산점을 받는 스탯 id (data/stats.js 참고)
const POSITIONS = [
  { id: "top",     name: "탑",     bonus: ["laning", "mental"],    desc: "외딴 라인에서 버티며 1:1을 이겨내는 포지션" },
  { id: "jungle",  name: "정글",   bonus: ["macro", "vision"],     desc: "맵 전체를 돌며 판을 설계하는 포지션" },
  { id: "mid",     name: "미드",   bonus: ["reaction", "pool"],    desc: "맵 한가운데에서 가장 많은 챔피언을 다루는 포지션" },
  { id: "adc",     name: "원딜",   bonus: ["accuracy", "spacing"], desc: "뒤에서 꾸준히 피해를 넣는 팀의 주포" },
  { id: "support", name: "서포트", bonus: ["shotcall", "teamfight"], desc: "시야를 밝히고 팀을 이끄는 포지션" },
];

// 가산점 효과
const POSITION_BONUS = {
  startBonus: 8,          // 캐릭터 생성 때 시작값 +8
  trainingBonus: 0.2,     // 훈련 효과 +20%
  matchMultiplier: 1.5,   // 경기 판정 때 1.5배로 계산 (3단계에서 사용)
};
