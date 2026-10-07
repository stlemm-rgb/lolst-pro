// 경기 기록(박스 스코어) 만들기 규칙
// 경기 판정(라인 맞대결·팀 점수)이 끝난 뒤, 그 결과에 어울리는 킬/데스/어시스트, CS, 피해량, 시야 점수를 만들어요.
// 우리 팀 경기와 결승전만 만들어서 저장해요. 숫자를 바꾸면 기록 분위기가 바뀌어요 (승패에는 영향 없음).
const BOXSCORE = {
  // 경기 시간 (분): 기본 범위에서, 팀 점수 차이가 클수록 짧아짐
  // 팀 점수 차는 gapScale을 곱해서 씀 (2026-10-07 경기 흐름 사건이 생겨 점수 차가 약 3배 커짐)
  gapScale: 0.35,
  minutes: [27, 38],
  minutesMin: 21,
  minutesPerGap: 0.35,       // 팀 점수 차 1당 경기 시간 −0.35분

  // 팀 킬 수: 이긴 팀 / 진 팀 (팀 점수 차가 클수록 차이가 벌어짐)
  winnerKills: [12, 22],
  loserKills: [4, 14],
  killsPerGap: 0.25,

  // 포지션별 성향
  // kill: 킬 가져가는 비중, death: 죽는 비중, kp: 킬 관여율, cs: 분당 CS, dpm: 분당 피해량, vision: 분당 시야 점수
  pos: {
    top:     { kill: 1.0,  death: 1.0, kp: 0.55, cs: 7.6, dpm: 560, vision: 0.8 },
    jungle:  { kill: 1.1,  death: 1.0, kp: 0.70, cs: 5.6, dpm: 420, vision: 1.3 },
    mid:     { kill: 1.35, death: 1.0, kp: 0.65, cs: 8.2, dpm: 660, vision: 0.9 },
    adc:     { kill: 1.5,  death: 1.1, kp: 0.65, cs: 8.8, dpm: 720, vision: 0.8 },
    support: { kill: 0.25, death: 1.25, kp: 0.75, cs: 1.3, dpm: 210, vision: 2.6 },
  },

  // 다른 선수가 고르는 챔피언: 이 확률로 그 패치 메타 챔피언, 아니면 그 포지션 아무 챔피언
  npcMetaPick: 0.6,
};
