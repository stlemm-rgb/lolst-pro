// 특성 목록
// - type: "good"(좋은 특성) 또는 "bad"(나쁜 특성)
// - desc: 화면에 보이는 설명
// - effects: 실제 효과. 지금 게임에 적용되는 것은 ✅, 나중 단계에서 적용될 것은 ⏳
//     ✅ trainingAll:  모든 훈련 효과 (0.2 = +20%)
//     ✅ trainingStat: 특정 스탯 훈련 효과 (예: { laning: 0.3 })
//     ✅ staminaCost:  훈련 체력 소모 (-0.25 = 25% 덜 소모)
//     ✅ popularityGain: 인기도 상승 (0.5 = +50%)
//     ⏳ masteryGrowth: 챔피언 숙련도 성장 (3단계)
//     ⏳ bigMatch:     결승·큰 경기 경기력 (3단계)
//     ⏳ metaPenalty:  메타 변화 때 경기력 하락 (3단계)
//     ⏳ lossMental:   패배 후 멘탈·컨디션 하락 배율 (3단계)
//     ⏳ teamMood:     팀 분위기 (3단계)
//     ⏳ agingDelay:   노화 시작이 늦어지는 햇수 (7단계)
//     ⏳ injuryRate / scandalRate: 이벤트 확률 배율 (4단계)
const TRAITS = [
  // ===== 좋은 특성 =====
  { id: "genius",       type: "good", name: "천재적 감각",   desc: "모든 훈련 효과 +20%",                    effects: { trainingAll: 0.2 } },
  { id: "steel_mental", type: "good", name: "강철 멘탈",     desc: "패배·악플로 인한 멘탈 하락 절반",          effects: { lossMental: -0.5 } },
  { id: "big_stage",    type: "good", name: "큰 무대 체질",  desc: "결승·큰 경기에서 경기력 +5",              effects: { bigMatch: 5 } },
  { id: "lane_monster", type: "good", name: "라인전 괴물",   desc: "라인전 훈련 효과 +30%",                  effects: { trainingStat: { laning: 0.3 } } },
  { id: "champ_lab",    type: "good", name: "챔피언 연구가", desc: "챔피언 폭 훈련 효과 +30%, 메타 적응 빠름",  effects: { trainingStat: { pool: 0.3 }, masteryGrowth: 0.5 } },
  { id: "iron_body",    type: "good", name: "철인",         desc: "훈련 체력 소모 -25%",                    effects: { staminaCost: -0.25 } },
  { id: "born_leader",  type: "good", name: "타고난 리더",   desc: "오더 훈련 효과 +30%, 팀 분위기 상승",      effects: { trainingStat: { shotcall: 0.3 }, teamMood: 5 } },
  { id: "fan_service",  type: "good", name: "팬서비스",      desc: "인기도 상승 +50%",                       effects: { popularityGain: 0.5 } },
  { id: "late_bloomer", type: "good", name: "늦게 피는 꽃",  desc: "노화가 2년 늦게 시작",                    effects: { agingDelay: 2 } },
  { id: "fast_hands",   type: "good", name: "빠른 손",       desc: "반응속도·입력 정확도 훈련 효과 +20%",      effects: { trainingStat: { reaction: 0.2, accuracy: 0.2 } } },
  { id: "cool_head",    type: "good", name: "냉철한 판단",   desc: "운영·시야 훈련 효과 +20%",                effects: { trainingStat: { macro: 0.2, vision: 0.2 } } },

  // ===== 나쁜 특성 (캐릭터 생성 때는 나오지 않고, 이벤트로 생김) =====
  { id: "glass_mental", type: "bad", name: "유리멘탈",     desc: "패배 후 컨디션이 더 크게 떨어짐",         effects: { lossMental: 0.5 } },
  { id: "injury_prone", type: "bad", name: "부상 잦음",    desc: "부상 이벤트 확률 2배",                  effects: { injuryRate: 2 } },
  { id: "lazy",         type: "bad", name: "게으름",       desc: "모든 훈련 효과 -20%",                    effects: { trainingAll: -0.2 } },
  { id: "stubborn",     type: "bad", name: "고집",         desc: "메타 변화 때 경기력 하락이 큼",           effects: { metaPenalty: 5 } },
  { id: "stage_fright", type: "bad", name: "무대 공포증",  desc: "결승·큰 경기에서 경기력 -5",              effects: { bigMatch: -5 } },
  { id: "scandal",      type: "bad", name: "구설수",       desc: "팬 논란 이벤트 확률 상승",                effects: { scandalRate: 2 } },
];
