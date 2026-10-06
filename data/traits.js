// 특성 목록
// - type: "good"(좋은 특성), "bad"(나쁜 특성), "s"(S급 특성: 게임 중 큰 업적으로만 얻음, 아래 S_TRAIT_RULES)
//   좋은 특성은 캐릭터 생성 때 직접 골라요(유형별 개수만큼). 나쁜 특성은 이벤트로만 생겨요(최대 5%). 나쁜 특성마다 극복 이벤트가 있어요.
// - group: 캐릭터 생성 화면에서 묶어서 보여줄 분류 (좋은 특성만)
// - npc: true면 다른 선수(NPC)도 가질 수 있음 (경기·성장·노화에 영향을 주는 특성만. 훈련·돈·인기 특성은 NPC에게 의미가 없어서 제외)
// - desc: 화면에 보이는 설명 (효과 숫자를 바꾸면 설명도 같이 바꿔 주세요)
// - effects: 실제 효과 (모두 적용됨. ★ = 다른 선수에게도 적용)
//   [훈련]
//     ★ trainingAll: 모든 훈련 효과 (0.2 = +20%)      ★ trainingStat: 특정 스탯 훈련 효과 ({ laning: 0.3 })  (NPC는 시즌 성장에 적용)
//     ★ statCap: 스탯 상한선 +n ({ reaction: 10 } 또는 { all: 5 }). 기본 상한은 data/growth.js의 STAT_CAP
//     ✅ staminaCost: 훈련·경기 체력 소모 (-0.25 = 25% 덜)  ✅ restBonus: 휴식 체력 회복 (0.5 = +50%)
//     ✅ staminaRegen: 매주 체력 자연 회복 (+n)
//   [챔피언]
//     ✅ masteryGrowth: 모든 챔피언 숙련도 성장           ✅ metaMastery: 메타 챔피언 숙련도 성장
//     ✅ typeMastery: 유형별 숙련도 성장 ({ carry: 0.3 })  ✅ signature: 숙련도 1위 챔피언을 고르면 경기력 +n
//   [경기]
//     ★ power: 모든 경기 경기력 (0.05 = +5%)
//     ★ bigMatch: 결승·플레이오프·월드 토너먼트·승강전 경기력 (0.06 = +6%)
//     ★ clutch: 마지막 세트(풀세트) 경기력              ★ variance: 세트마다 경기력이 ±n 흔들림
//     ★ comeback: 세트 스코어에서 지고 있을 때 경기력    ★ earlyPenalty: 시즌 초(1~12주) 경기력 −n
//     ★ laneBonus: 라인전에서 이기면 팀 보너스 +n         ★ soloEasy: 솔로킬 기준이 n만큼 쉬워짐
//     ★ teamMood: 한타 때 우리 팀 전력 +n                 ✅ lossMental: 패배 후 컨디션 하락 배율
//     ✅ metaPenalty: 패치 후 4주 메타 페널티 +n           ✅ noMetaPenalty: 메타 페널티 없음
//   [솔로 랭크]
//     ✅ ladderGames: 랭크 판 수 (0.5 = +50%)            ✅ ladderWin: 랭크 승률 +n
//     ✅ tilt: 랭크에서 진 판이 더 많은 주에 컨디션 −n      ✅ challengerPopularity: 챌린저인 주마다 인기도 +n
//   [인기·돈·기타]
//     ✅ popularityGain: 인기도 상승                     ✅ winPopularity: 이긴 경기마다 인기도 +n
//     ✅ questBonus: 퀘스트 보상 (0.5 = +50%)             ✅ negotiate: 계약 협상 성공률 +n
//     ✅ salaryBonus: 연봉 +n                            ✅ spend: 주급 중 n만큼 써 버림
//     ✅ injuryRate / scandalRate: 이벤트 확률 배율        ✅ badImmune: 나쁜 특성이 생기지 않음
//   [노화·은퇴]
//     ★ agingDelay: 노화가 늦게 시작 (n년)              ★ agingCut: 노화로 줄어드는 양 −n (0.5 = 절반)
//     ✅ maxAgeBonus: 최대 은퇴 나이 +n
const TRAITS = [
  // ===== 좋은 특성: 훈련 =====
  { id: "genius",       type: "good", npc: true, group: "훈련", name: "천재적 감각",   desc: "모든 훈련 효과 +20%",                                  effects: { trainingAll: 0.2 } },
  { id: "lane_monster", type: "good", npc: true, group: "훈련", name: "라인전 괴물",   desc: "라인전 훈련 효과 +30%, 반응속도 +15%",                  effects: { trainingStat: { laning: 0.3, reaction: 0.15 } } },
  { id: "fast_hands",   type: "good", npc: true, group: "훈련", name: "빠른 손",       desc: "반응속도·입력 정확도 훈련 효과 +20%",                    effects: { trainingStat: { reaction: 0.2, accuracy: 0.2 } } },
  { id: "cool_head",    type: "good", npc: true, group: "훈련", name: "냉철한 판단",   desc: "운영·시야 훈련 효과 +20%",                              effects: { trainingStat: { macro: 0.2, vision: 0.2 } } },
  { id: "iron_body",    type: "good", group: "훈련", name: "철인",         desc: "훈련·경기 체력 소모 −25%",                              effects: { staminaCost: -0.25 } },
  { id: "fast_recovery", type: "good", group: "훈련", name: "회복력",       desc: "휴식 체력 회복 +50%, 매주 체력 +3 자연 회복",            effects: { restBonus: 0.5, staminaRegen: 3 } },
  { id: "diligent",     type: "good", group: "훈련", name: "모범생",        desc: "퀘스트 보상 +50%",                                     effects: { questBonus: 0.5 } },

  // ===== 좋은 특성: 챔피언 =====
  { id: "champ_lab",    type: "good", group: "챔피언", name: "챔피언 연구가", desc: "챔피언 폭 훈련 +30%, 모든 챔피언 숙련도 성장 +20%",        effects: { trainingStat: { pool: 0.3 }, masteryGrowth: 0.2 } },
  { id: "meta_reader",  type: "good", group: "챔피언", name: "메타 리더",     desc: "메타 챔피언 숙련도 성장 +40%",                           effects: { metaMastery: 0.4 } },
  { id: "one_trick",    type: "good", group: "챔피언", name: "장인",         desc: "숙련도 1위 챔피언을 고르면 경기력 +5%",                   effects: { signature: 0.05 } },
  { id: "carry_instinct", type: "good", group: "챔피언", name: "캐리 본능",   desc: "캐리형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { carry: 0.3 } } },
  { id: "support_sense", type: "good", group: "챔피언", name: "서포트 감각",  desc: "지원형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { utility: 0.3 } } },
  { id: "aggro_instinct", type: "good", group: "챔피언", name: "공격 본능",   desc: "공격형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { aggro: 0.3 } } },
  { id: "macro_mind",   type: "good", group: "챔피언", name: "판짜기 달인",   desc: "운영형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { macro: 0.3 } } },

  // ===== 좋은 특성: 경기 =====
  { id: "big_stage",    type: "good", npc: true, group: "경기", name: "큰 무대 체질",  desc: "결승·플레이오프·월드 토너먼트·승강전 경기력 +6%",          effects: { bigMatch: 0.06 } },
  { id: "clutch",       type: "good", npc: true, group: "경기", name: "클러치",        desc: "마지막 세트(풀세트) 경기력 +8%",                         effects: { clutch: 0.08 } },
  { id: "steel_mental", type: "good", group: "경기", name: "강철 멘탈",     desc: "패배 후 컨디션 하락 절반, 비난 소식 영향 없음",            effects: { lossMental: -0.5 } },
  { id: "born_leader",  type: "good", npc: true, group: "경기", name: "타고난 리더",   desc: "오더 훈련 효과 +30%, 한타 때 우리 팀 전력 +1.5",          effects: { trainingStat: { shotcall: 0.3 }, teamMood: 1.5 } },

  // ===== 좋은 특성: 솔로 랭크·인기·돈 =====
  { id: "ladder_addict", type: "good", group: "솔로 랭크·인기·돈", name: "솔랭 중독자",  desc: "훈련 중 솔로 랭크 판 수 +50%, 랭크 승률 +5%",              effects: { ladderGames: 0.5, ladderWin: 0.05 } },
  { id: "fan_service",  type: "good", group: "솔로 랭크·인기·돈", name: "팬서비스",      desc: "인기도 상승 +50%",                                     effects: { popularityGain: 0.5 } },
  { id: "star_power",   type: "good", group: "솔로 랭크·인기·돈", name: "스타성",        desc: "이긴 경기마다 인기도 +1 추가",                            effects: { winPopularity: 1 } },
  { id: "negotiator",   type: "good", group: "솔로 랭크·인기·돈", name: "협상가",        desc: "계약 협상 성공률 +20%, 연봉 +10%",                        effects: { negotiate: 0.2, salaryBonus: 0.1 } },
  { id: "late_bloomer", type: "good", npc: true, group: "솔로 랭크·인기·돈", name: "늦게 피는 꽃",  desc: "노화가 2년 늦게 시작 (29세부터)",                       effects: { agingDelay: 2 } },

  // ===== 좋은 특성: 한계 (스탯 상한선을 올림) =====
  { id: "god_hands",    type: "good", group: "한계", npc: true, name: "신의 손",       desc: "반응속도·입력 정확도 상한선 +10",                        effects: { statCap: { reaction: 10, accuracy: 10 } } },
  { id: "tactician",    type: "good", group: "한계", npc: true, name: "전술 두뇌",     desc: "운영·시야·오더 상한선 +10",                              effects: { statCap: { macro: 10, vision: 10, shotcall: 10 } } },
  { id: "battle_sense", type: "good", group: "한계", npc: true, name: "전장의 감각",   desc: "한타·거리 조절 상한선 +10",                              effects: { statCap: { teamfight: 10, spacing: 10 } } },
  { id: "lane_king",    type: "good", group: "한계", npc: true, name: "라인의 왕",     desc: "라인전·챔피언 폭 상한선 +10",                            effects: { statCap: { laning: 10, pool: 10 } } },
  { id: "iron_heart",   type: "good", group: "한계", npc: true, name: "강심장",        desc: "멘탈·집중력·적응력 상한선 +10",                          effects: { statCap: { mental: 10, focus: 10, adapt: 10 } } },
  { id: "potential",    type: "good", group: "한계", npc: true, name: "무한한 잠재력", desc: "모든 스탯 상한선 +5",                                    effects: { statCap: { all: 5 } } },

  // ===== 나쁜 특성 (이벤트로만 생김, 극복 이벤트 있음) =====
  { id: "glass_mental", type: "bad", name: "유리멘탈",     desc: "패배 후 컨디션 하락 1.5배",                          effects: { lossMental: 0.5 } },
  { id: "injury_prone", type: "bad", name: "부상 잦음",    desc: "손목 통증 이벤트 확률 2배",                          effects: { injuryRate: 2 } },
  { id: "lazy",         type: "bad", npc: true, name: "게으름",       desc: "모든 훈련 효과 −20%",                                effects: { trainingAll: -0.2 } },
  { id: "stubborn",     type: "bad", name: "고집",         desc: "패치 후 4주 동안 메타 페널티 +5",                     effects: { metaPenalty: 5 } },
  { id: "stage_fright", type: "bad", npc: true, name: "무대 공포증",  desc: "결승·플레이오프·월드 토너먼트·승강전 경기력 −6%",       effects: { bigMatch: -0.06 } },
  { id: "scandal",      type: "bad", name: "구설수",       desc: "악성 루머 이벤트 확률 2배",                          effects: { scandalRate: 2 } },
  { id: "inconsistent", type: "bad", npc: true, name: "기복",         desc: "세트마다 경기력이 ±10% 흔들림",                      effects: { variance: 0.1 } },
  { id: "slow_starter", type: "bad", npc: true, name: "슬로 스타터",   desc: "시즌 초(1~12주) 경기력 −4%",                         effects: { earlyPenalty: 0.04 } },
  { id: "tilt",         type: "bad", name: "랭크 틸트",     desc: "솔로 랭크에서 진 판이 더 많은 주에 컨디션 −3",          effects: { tilt: 3 } },
  { id: "spender",      type: "bad", name: "낭비벽",       desc: "주급의 20%를 써 버림",                               effects: { spend: 0.2 } },
  { id: "night_owl",    type: "bad", name: "올빼미",       desc: "휴식 체력 회복 −30%",                                effects: { restBonus: -0.3 } },

  // ===== S급 특성 (게임 중 큰 업적으로만 얻음. 다른 선수도 조건을 채우면 얻음) =====
  { id: "s_emperor",   type: "s", npc: true, name: "황제",           desc: "모든 경기 경기력 +5%, 인기도 상승 +50%",                        effects: { power: 0.05, popularityGain: 0.5 } },
  { id: "s_demon",     type: "s", npc: true, name: "불사대마왕",     desc: "결승·플레이오프·월드 토너먼트·승강전 경기력 +10%",              effects: { bigMatch: 0.1 } },
  { id: "s_lane_lord", type: "s", npc: true, name: "라인 지배자",    desc: "라인전에서 이기면 팀 보너스 +2, 솔로킬 기준 3 쉬워짐",          effects: { laneBonus: 2, soloEasy: 3 } },
  { id: "s_comeback",  type: "s", npc: true, name: "역전의 명수",    desc: "세트 스코어에서 지고 있을 때 경기력 +10%",                      effects: { comeback: 0.1 } },
  { id: "s_iron_will", type: "s", npc: true, name: "철의 의지",      desc: "노화로 줄어드는 양 절반, 최대 은퇴 나이 +3",                    effects: { agingCut: 0.5, maxAgeBonus: 3 } },
  { id: "s_one_club",  type: "s", npc: true, name: "원클럽맨",       desc: "한타 때 우리 팀 전력 +3, 연봉 +30%",                           effects: { teamMood: 3, salaryBonus: 0.3 } },
  { id: "s_breakthrough", type: "s", npc: true, name: "한계 돌파",   desc: "모든 스탯 상한선 +5",                                          effects: { statCap: { all: 5 } } },
  { id: "s_champ_master", type: "s", name: "챔피언 마스터",          desc: "모든 챔피언 숙련도 성장 2배, 메타 페널티 없음",                effects: { masteryGrowth: 1, noMetaPenalty: true } },
  { id: "s_rank_god",  type: "s", name: "랭크의 신",                 desc: "솔로 랭크 승률 +10%, 챌린저인 주마다 인기도 +1",               effects: { ladderWin: 0.1, challengerPopularity: 1 } },
  { id: "s_weed",      type: "s", name: "잡초",                      desc: "나쁜 특성이 생기지 않음, 패배해도 컨디션이 떨어지지 않음",       effects: { badImmune: true, lossMental: -1 } },
  { id: "s_goat",      type: "s", npc: true, name: "GOAT",           desc: "역대 최고. 모든 훈련 효과 +30%, 모든 경기력 +3%, 모든 스탯 상한선 +5", effects: { trainingAll: 0.3, power: 0.03, statCap: { all: 5 } } },
];

// S급 특성 얻는 조건 (숫자는 바꿔도 돼요)
// - who: "all"(나와 다른 선수 모두) 또는 "user"(내 선수만: 솔로 랭크·숙련도·2군처럼 나만 있는 기록)
const S_TRAIT_RULES = [
  { trait: "s_emperor",      who: "all",  text: "월드 챔피언십 3번 우승 (주전으로)",            worlds: 3 },
  { trait: "s_demon",        who: "all",  text: "같은 해에 리그 결승 MVP와 월드 결승 MVP" },
  { trait: "s_lane_lord",    who: "all",  text: "한 시즌 솔로킬 80회 이상",                     solo: 80 },
  { trait: "s_comeback",     who: "all",  text: "5판 경기에서 0:2를 3:2로 뒤집기 2번",            reverseSweeps: 2 },
  { trait: "s_iron_will",    who: "all",  text: "30세 이후 정규 시즌 MVP",                      age: 30 },
  { trait: "s_one_club",     who: "all",  text: "한 팀에서 1부 주전으로 8시즌 (다른 팀으로 가면 처음부터)", seasons: 8 },
  { trait: "s_breakthrough", who: "all",  text: "스탯 6개가 상한선에 닿기",                     atCap: 6 },
  { trait: "s_champ_master", who: "user", text: "숙련도 100인 챔피언 10명",                     mastered: 10 },
  { trait: "s_rank_god",     who: "user", text: "솔로 랭크 3,500점 달성",                       ladder: 3500 },
  { trait: "s_weed",         who: "user", text: "2군(후보)에 내려간 시즌에 우승" },
  { trait: "s_goat",         who: "all",  text: "S급 특성 4개 이상 얻기",                       sCount: 4 },
];

// 다른 선수(NPC) 특성: 선수를 만들 때 무작위로 (npc: true인 특성 중에서)
const NPC_TRAITS = {
  goodCount: [[0, 0.45], [1, 0.4], [2, 0.15]], // [개수, 확률]: 45% 없음, 40% 1개, 15% 2개
  badChance: 0.12,                              // 나쁜 특성 1개가 붙을 확률
};
