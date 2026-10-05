// 특성 목록
// - type: "good"(좋은 특성) 또는 "bad"(나쁜 특성)
//   좋은 특성은 캐릭터 생성 때 무작위로, 나쁜 특성은 이벤트로만 생겨요(최대 5%). 나쁜 특성마다 극복 이벤트가 있어요.
// - desc: 화면에 보이는 설명 (효과 숫자를 바꾸면 설명도 같이 바꿔 주세요)
// - effects: 실제 효과 (✅ 지금 적용, ⏳ 나중 단계)
//   [훈련]
//     ✅ trainingAll: 모든 훈련 효과 (0.2 = +20%)      ✅ trainingStat: 특정 스탯 훈련 효과 ({ laning: 0.3 })
//     ✅ staminaCost: 훈련·경기 체력 소모 (-0.25 = 25% 덜)  ✅ restBonus: 휴식 체력 회복 (0.5 = +50%)
//     ✅ staminaRegen: 매주 체력 자연 회복 (+n)
//   [챔피언]
//     ✅ masteryGrowth: 모든 챔피언 숙련도 성장           ✅ metaMastery: 메타 챔피언 숙련도 성장
//     ✅ typeMastery: 유형별 숙련도 성장 ({ carry: 0.3 })  ✅ signature: 숙련도 1위 챔피언을 고르면 경기력 +n
//   [경기]
//     ✅ bigMatch: 결승·플레이오프·월드 토너먼트·승강전 경기력 (0.06 = +6%)
//     ✅ clutch: 마지막 세트(풀세트) 경기력              ✅ variance: 세트마다 경기력이 ±n 흔들림
//     ✅ earlyPenalty: 시즌 초(1~12주) 경기력 −n           ✅ metaPenalty: 패치 후 4주 메타 페널티 +n
//     ✅ teamMood: 한타 때 우리 팀 전력 +n                 ✅ lossMental: 패배 후 컨디션 하락 배율
//   [솔로 랭크]
//     ✅ ladderGames: 랭크 판 수 (0.5 = +50%)            ✅ ladderWin: 랭크 승률 +n
//     ✅ tilt: 랭크에서 진 판이 더 많은 주에 컨디션 −n
//   [인기·돈·기타]
//     ✅ popularityGain: 인기도 상승                     ✅ winPopularity: 이긴 경기마다 인기도 +n
//     ✅ questBonus: 퀘스트 보상 (0.5 = +50%)             ✅ negotiate: 계약 협상 성공률 +n
//     ✅ salaryBonus: 연봉 +n                            ✅ spend: 주급 중 n만큼 써 버림
//     ✅ injuryRate / scandalRate: 이벤트 확률 배율        ⏳ agingDelay: 노화가 늦게 시작 (7단계)
const TRAITS = [
  // ===== 좋은 특성: 훈련 =====
  { id: "genius",       type: "good", name: "천재적 감각",   desc: "모든 훈련 효과 +20%",                                  effects: { trainingAll: 0.2 } },
  { id: "lane_monster", type: "good", name: "라인전 괴물",   desc: "라인전 훈련 효과 +30%, 반응속도 +15%",                  effects: { trainingStat: { laning: 0.3, reaction: 0.15 } } },
  { id: "fast_hands",   type: "good", name: "빠른 손",       desc: "반응속도·입력 정확도 훈련 효과 +20%",                    effects: { trainingStat: { reaction: 0.2, accuracy: 0.2 } } },
  { id: "cool_head",    type: "good", name: "냉철한 판단",   desc: "운영·시야 훈련 효과 +20%",                              effects: { trainingStat: { macro: 0.2, vision: 0.2 } } },
  { id: "iron_body",    type: "good", name: "철인",         desc: "훈련·경기 체력 소모 −25%",                              effects: { staminaCost: -0.25 } },
  { id: "fast_recovery", type: "good", name: "회복력",       desc: "휴식 체력 회복 +50%, 매주 체력 +3 자연 회복",            effects: { restBonus: 0.5, staminaRegen: 3 } },
  { id: "diligent",     type: "good", name: "모범생",        desc: "퀘스트 보상 +50%",                                     effects: { questBonus: 0.5 } },

  // ===== 좋은 특성: 챔피언 =====
  { id: "champ_lab",    type: "good", name: "챔피언 연구가", desc: "챔피언 폭 훈련 +30%, 모든 챔피언 숙련도 성장 +50%",        effects: { trainingStat: { pool: 0.3 }, masteryGrowth: 0.5 } },
  { id: "meta_reader",  type: "good", name: "메타 리더",     desc: "메타 챔피언 숙련도 성장 +40%",                           effects: { metaMastery: 0.4 } },
  { id: "one_trick",    type: "good", name: "장인",         desc: "숙련도 1위 챔피언을 고르면 경기력 +5%",                   effects: { signature: 0.05 } },
  { id: "carry_instinct", type: "good", name: "캐리 본능",   desc: "캐리형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { carry: 0.3 } } },
  { id: "support_sense", type: "good", name: "서포트 감각",  desc: "지원형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { utility: 0.3 } } },
  { id: "aggro_instinct", type: "good", name: "공격 본능",   desc: "공격형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { aggro: 0.3 } } },
  { id: "macro_mind",   type: "good", name: "판짜기 달인",   desc: "운영형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { macro: 0.3 } } },

  // ===== 좋은 특성: 경기 =====
  { id: "big_stage",    type: "good", name: "큰 무대 체질",  desc: "결승·플레이오프·월드 토너먼트·승강전 경기력 +6%",          effects: { bigMatch: 0.06 } },
  { id: "clutch",       type: "good", name: "클러치",        desc: "마지막 세트(풀세트) 경기력 +8%",                         effects: { clutch: 0.08 } },
  { id: "steel_mental", type: "good", name: "강철 멘탈",     desc: "패배 후 컨디션 하락 절반, 비난 소식 영향 없음",            effects: { lossMental: -0.5 } },
  { id: "born_leader",  type: "good", name: "타고난 리더",   desc: "오더 훈련 효과 +30%, 한타 때 우리 팀 전력 +1.5",          effects: { trainingStat: { shotcall: 0.3 }, teamMood: 1.5 } },

  // ===== 좋은 특성: 솔로 랭크·인기·돈 =====
  { id: "ladder_addict", type: "good", name: "솔랭 중독자",  desc: "훈련 중 솔로 랭크 판 수 +50%, 랭크 승률 +5%",              effects: { ladderGames: 0.5, ladderWin: 0.05 } },
  { id: "fan_service",  type: "good", name: "팬서비스",      desc: "인기도 상승 +50%",                                     effects: { popularityGain: 0.5 } },
  { id: "star_power",   type: "good", name: "스타성",        desc: "이긴 경기마다 인기도 +1 추가",                            effects: { winPopularity: 1 } },
  { id: "negotiator",   type: "good", name: "협상가",        desc: "계약 협상 성공률 +20%, 연봉 +10%",                        effects: { negotiate: 0.2, salaryBonus: 0.1 } },
  { id: "late_bloomer", type: "good", name: "늦게 피는 꽃",  desc: "노화가 2년 늦게 시작 (7단계 노화에서 적용)",               effects: { agingDelay: 2 } },

  // ===== 나쁜 특성 (이벤트로만 생김, 극복 이벤트 있음) =====
  { id: "glass_mental", type: "bad", name: "유리멘탈",     desc: "패배 후 컨디션 하락 1.5배",                          effects: { lossMental: 0.5 } },
  { id: "injury_prone", type: "bad", name: "부상 잦음",    desc: "손목 통증 이벤트 확률 2배",                          effects: { injuryRate: 2 } },
  { id: "lazy",         type: "bad", name: "게으름",       desc: "모든 훈련 효과 −20%",                                effects: { trainingAll: -0.2 } },
  { id: "stubborn",     type: "bad", name: "고집",         desc: "패치 후 4주 동안 메타 페널티 +5",                     effects: { metaPenalty: 5 } },
  { id: "stage_fright", type: "bad", name: "무대 공포증",  desc: "결승·플레이오프·월드 토너먼트·승강전 경기력 −6%",       effects: { bigMatch: -0.06 } },
  { id: "scandal",      type: "bad", name: "구설수",       desc: "악성 루머 이벤트 확률 2배",                          effects: { scandalRate: 2 } },
  { id: "inconsistent", type: "bad", name: "기복",         desc: "세트마다 경기력이 ±10% 흔들림",                      effects: { variance: 0.1 } },
  { id: "slow_starter", type: "bad", name: "슬로 스타터",   desc: "시즌 초(1~12주) 경기력 −4%",                         effects: { earlyPenalty: 0.04 } },
  { id: "tilt",         type: "bad", name: "랭크 틸트",     desc: "솔로 랭크에서 진 판이 더 많은 주에 컨디션 −3",          effects: { tilt: 3 } },
  { id: "spender",      type: "bad", name: "낭비벽",       desc: "주급의 20%를 써 버림",                               effects: { spend: 0.2 } },
  { id: "night_owl",    type: "bad", name: "올빼미",       desc: "휴식 체력 회복 −30%",                                effects: { restBonus: -0.3 } },
];
