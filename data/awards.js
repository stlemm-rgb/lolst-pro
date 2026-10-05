// 기록·시상 규칙 (6단계)
const RECORDS = {
  // 세트 평점 (1~10) = ratingBase + (내 경기력 − 상대 라이너 경기력) ÷ ratingDiv ± setWinBonus(세트 승/패)
  ratingBase: 6,
  ratingDiv: 6,
  setWinBonus: 1,

  // 시즌 상을 받으려면 정규 시즌에 최소 이만큼 세트를 뛰어야 함
  minSets: { mvp: 20, allPro: 15, rookie: 10 },
  rookieMaxAge: 19,     // 신인왕 후보 나이 (이하)
  pogWeight: 0.05,      // MVP 점수 = 평균 평점 + POG 횟수 × 0.05

  // 상을 받았을 때 내 선수 보너스
  awardBonus: { popularity: 5, reputation: 3 },
};

// 상 이름 (key는 코드에서 쓰는 이름)
const AWARD_NAMES = {
  mvp: "정규 시즌 MVP",
  allpro: "올프로 퍼스트 팀",
  rookie: "신인왕",
  tier2mvp: "2부 리그 MVP",
  cupfmvp: "컵 대회 결승 MVP",
  fmvp: "리그 결승 MVP",
  worldsfmvp: "월드 결승 MVP",
};

// 대회 안내 (대회 일정 화면): 주차와 진출 조건
const COMPETITION_GUIDE = [
  { name: "컵 대회", weeks: "2~9주", who: "1부 10팀", how: "두 조로 나뉜 조별 리그 후 상위 6팀 토너먼트" },
  { name: "정규 시즌", weeks: "13~34주", who: "1부 10팀 · 2부 8팀", how: "전반기(서로 2번씩) → 후반기(1부는 상위 5팀 / 하위 5팀 그룹)" },
  { name: "플레이인", weeks: "35주", who: "1부 상위 그룹 5위 + 하위 그룹 1~3위", how: "승자 2팀이 플레이오프 5·6번 시드" },
  { name: "플레이오프", weeks: "36~38주", who: "1부 6팀", how: "5판 3선승 토너먼트. 결승 2팀 + 4강 패자 2팀이 월드 진출" },
  { name: "승강전", weeks: "39~40주", who: "1부 9·10위 vs 2부 1·2위", how: "이기면 다음 시즌 1부" },
  { name: "월드 챔피언십", weeks: "42~46주", who: "국내 4팀 + 해외 12팀", how: "4개 조 조별 리그 → 8강 → 4강 → 결승" },
];
