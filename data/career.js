// 나이 · 노화 · 은퇴 · 엔딩 규칙 (7단계)

const CAREER = {
  // ----- 노화 -----
  // 새해(나이가 1살 늘 때)마다 아래 값이 줄어요. 운영·오더·시야 같은 머리 스탯은 그대로 (훈련으로 계속 오름)
  // "늦게 피는 꽃" 특성이 있으면 시작 나이가 agingDelay만큼 늦어져요.
  agingStartAge: 27,
  aging: [
    { maxAge: 29, reaction: [2, 3], accuracy: [1, 3], staminaMax: 3 },  // 27~29세
    { maxAge: 32, reaction: [3, 5], accuracy: [2, 4], staminaMax: 4 },  // 30~32세
    { maxAge: 99, reaction: [4, 6], accuracy: [3, 5], staminaMax: 5 },  // 33세~
  ],
  minStaminaMax: 50,   // 체력 최대치는 이 아래로 내려가지 않음
  // 노화가 시작되면 반응속도·입력 정확도 훈련 효과도 해마다 15%씩 줄어요 (최소 20%까지)
  agingTrainingCut: 0.15,
  agingTrainingMin: 0.2,

  // ----- 은퇴 -----
  avgRetireAge: 31,     // 평균 은퇴 나이 (안내용)
  retireAskAge: 29,     // 이 나이부터 비시즌(47주)마다 감독이 "은퇴할까?" 하고 물어봄
  maxAge: 35,           // 이 나이 시즌이 끝나면 무조건 은퇴
  forcedRetireAge: 29,  // 이 나이 이상에서 계약이 끝났는데 받아 줄 팀이 없으면 은퇴

  // ----- 엔딩 등급 -----
  // 커리어 점수 = 우승·수상 점수 합 + 최고 종합 능력 보너스 + 1부 시즌 수 × tier1Season
  points: {
    worlds: 30, msi: 15, playoffs: 15, firststand: 8, cup: 8, // 우승 (우리 팀)
    mvp: 12, worldsfmvp: 10, fmvp: 6, allpro: 5,       // 수상
    cupfmvp: 4, rookie: 4, tier2mvp: 2, msifmvp: 6, fsfmvp: 3,
    peakFrom: 60,        // 최고 종합 능력이 이 값을 넘은 만큼 1점씩
    tier1Season: 2,      // 1부에서 보낸 시즌 1개당
    allstar: 3,          // 올스타 선정 1번당 (js/fame.js)
    // + 인성 점수: 커리어 평균 평판 ÷ 4 (−25 ~ +25, data/fame.js REPUTATION)
  },
  grades: [
    { min: 500, name: "전설",   stars: 5, text: "e스포츠 역사에 이름을 새긴 선수. 모두가 그의 시대를 기억한다." },
    { min: 280, name: "레전드", stars: 4, text: "한 시대를 이끈 최고의 선수 중 한 명." },
    { min: 130, name: "스타",   stars: 3, text: "팬들의 사랑을 받은 실력파 스타." },
    { min: 50,  name: "베테랑", stars: 2, text: "오랫동안 프로 무대를 지킨 믿음직한 선수." },
    { min: 0,   name: "평범",   stars: 1, text: "꿈을 좇아 끝까지 달린 선수. 그것만으로도 충분하다." },
  ],
  hallOfFameKey: "progamer-career-hof", // 명예의 전당 저장 이름 (새 게임을 해도 남음)
  hallOfFameMax: 50,
};

// 은퇴 권유 연락 (29세 이상, 비시즌 시작 주)
const RETIRE_TEXTS = {
  askTitle: "감독: 다음 시즌 이야기",
  ask: "감독: \"{age}세, 프로 {years}년차구나. 요즘 몸은 좀 어때? 다음 시즌에도 함께 뛸 건지, 이번 시즌을 마지막으로 할 건지 네 생각을 듣고 싶다.\"",
  stay: "한 시즌 더 뛴다",
  retire: "이번 시즌을 끝으로 은퇴한다",
  stayNote: "한 시즌 더 도전하기로 했다.",
  retireNote: "이번 시즌이 끝나면 은퇴한다. 남은 경기를 후회 없이 치르자.",
  maxAgeTitle: "마지막 시즌",
  maxAge: "{age}세. 이번 시즌이 선수로서 마지막 시즌이다. 시즌이 끝나면 은퇴한다.",
  agingTitle: "노화",
  aging: "손이 예전 같지 않다... 반응속도와 입력 정확도, 체력이 조금 떨어졌다. 손 훈련도 예전만큼 늘지 않는다. 그래도 경기를 읽는 눈은 더 깊어졌다.",
};
