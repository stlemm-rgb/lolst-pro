// ===== 상점 ([상점] 메뉴) — 모은 돈을 쓰는 곳 =====
// 돈 단위: 원 (3000000 = 300만 원)
// 효과 이름은 특성(data/traits.js)과 같아요:
//   trainingStat: { 스탯 id: 훈련 효과 } (0.05 = +5%)   staminaCost: 훈련·경기 체력 소모 (−0.05 = 5% 덜)
//   staminaRegen: 매주 체력 자연 회복 +n                  lossMental: 패배 후 컨디션 하락 배율 (−0.5 = 절반)
//   agingCut: 노화로 줄어드는 양 (0.2 = 20% 덜)            popularityGain: 인기도 상승 (0.2 = +20%)

// ----- 장비: 한 번 사면 계속. 단계(Lv)마다 효과가 커지고 값도 비싸져요 -----
// levels[i] = { price: 값, effects: 그 단계의 효과 (앞 단계 효과에 더하지 않고 이걸로 바뀜) }
const SHOP_GEAR = [
  { id: "keyboard", icon: "⌨️", name: "기계식 키보드", what: "입력 정확도 훈련",
    levels: [
      { price: 3000000,  effects: { trainingStat: { accuracy: 0.05 } } },
      { price: 15000000, effects: { trainingStat: { accuracy: 0.10 } } },
      { price: 50000000, effects: { trainingStat: { accuracy: 0.15 } } },
    ] },
  { id: "mouse", icon: "🖱️", name: "게이밍 마우스", what: "반응속도 훈련",
    levels: [
      { price: 3000000,  effects: { trainingStat: { reaction: 0.05 } } },
      { price: 15000000, effects: { trainingStat: { reaction: 0.10 } } },
      { price: 50000000, effects: { trainingStat: { reaction: 0.15 } } },
    ] },
  { id: "monitor", icon: "🖥️", name: "고주사율 모니터", what: "시야·거리 조절 훈련",
    levels: [
      { price: 4000000,  effects: { trainingStat: { vision: 0.05, spacing: 0.05 } } },
      { price: 20000000, effects: { trainingStat: { vision: 0.10, spacing: 0.10 } } },
      { price: 60000000, effects: { trainingStat: { vision: 0.15, spacing: 0.15 } } },
    ] },
  { id: "headset", icon: "🎧", name: "헤드셋", what: "오더·한타 훈련",
    levels: [
      { price: 3000000,  effects: { trainingStat: { shotcall: 0.05, teamfight: 0.05 } } },
      { price: 15000000, effects: { trainingStat: { shotcall: 0.10, teamfight: 0.10 } } },
      { price: 50000000, effects: { trainingStat: { shotcall: 0.15, teamfight: 0.15 } } },
    ] },
  { id: "chair", icon: "🪑", name: "게이밍 의자", what: "훈련·경기 체력 소모",
    levels: [
      { price: 5000000,  effects: { staminaCost: -0.05 } },
      { price: 20000000, effects: { staminaCost: -0.10 } },
      { price: 60000000, effects: { staminaCost: -0.15 } },
    ] },
];

// ----- 개인 고용: 매주 돈을 내는 동안만 효과. 언제든 해지. 돈이 모자라면 자동 해지 -----
const SHOP_STAFF = [
  { id: "analyst",   icon: "📊", name: "개인 분석가",  weekly: 300000, desc: "운영·시야·오더 훈련 +15%",        effects: { trainingStat: { macro: 0.15, vision: 0.15, shotcall: 0.15 } } },
  { id: "physical",  icon: "⚡", name: "피지컬 코치",  weekly: 300000, desc: "반응속도·입력 정확도 훈련 +15%",   effects: { trainingStat: { reaction: 0.15, accuracy: 0.15 } } },
  { id: "mental",    icon: "🧘", name: "멘탈 코치",    weekly: 200000, desc: "패배 후 컨디션 하락 절반",          effects: { lossMental: -0.5 } },
  { id: "trainer",   icon: "💪", name: "트레이너",     weekly: 200000, desc: "매주 체력 +3 회복",                 effects: { staminaRegen: 3 } },
  { id: "nutrition", icon: "🥗", name: "영양사",       weekly: 150000, desc: "노화로 줄어드는 양 −20%",           effects: { agingCut: 0.2 } },
];

// ----- 팬·명성 -----
// perSeason: 한 시즌에 몇 번까지 / once: 한 번만 사면 영구 / 둘 다 없으면 제한 없음
const SHOP_FAME = [
  { id: "gift",    icon: "🎁", name: "팬 선물 이벤트", price: 1000000,  desc: "인기도 +2",                 effects: { popularity: 2 } },
  { id: "fanmeet", icon: "🤝", name: "팬미팅 개최",    price: 3000000,  desc: "인기도 +5",                 effects: { popularity: 5 }, perSeason: 2 },
  { id: "donate",  icon: "💝", name: "기부",           price: 5000000,  desc: "평판 +5",                   effects: { reputation: 5 }, perSeason: 2 },
  { id: "stream",  icon: "🎥", name: "개인 방송 장비", price: 20000000, desc: "인기도 상승 +20% (영구)",   effects: { popularityGain: 0.2 }, once: true },
];

// ----- 투자: 돈을 넣으면 정해진 주가 지난 뒤 무작위로 불어나거나 줄어요 (완전 운) -----
// - weeks: 결과가 나오기까지 걸리는 주
// - range: [최저, 최고] 수익률. 이 사이에서 완전히 무작위 (−0.4 = 40% 잃음, 0.45 = 45% 벌음)
// - outcomes: 대신 [{ chance, range }] 여러 개 → 먼저 어느 쪽인지 정하고 그 범위에서 무작위 (코인: 반반 대박/쪽박)
// - 평균은 0에 가깝게 맞춰 두었어요 (계속 넣는다고 무조건 불어나지 않게). 평균 = 펀드 +2%, 주식 +2.5%, 코인 +2.5%
const SHOP_INVEST = [
  { id: "fund",  icon: "🏦", name: "안정형 펀드", weeks: 8, range: [-0.08, 0.12], desc: "8주 뒤 −8% ~ +12%" },
  { id: "stock", icon: "📈", name: "주식",        weeks: 4, range: [-0.40, 0.45], desc: "4주 뒤 −40% ~ +45%" },
  { id: "coin",  icon: "🪙", name: "코인",        weeks: 2,
    outcomes: [{ chance: 0.5, range: [-0.90, -0.50] }, { chance: 0.5, range: [0.30, 1.20] }],
    desc: "2주 뒤 반반: 쪽박(−50 ~ −90%) 아니면 대박(+30 ~ +120%)" },
];
const INVEST_AMOUNTS = [0.1, 0.25, 0.5, 1];

// ----- 거주지 (부동산) — js/shop.js -----
// 집이 없으면 '합숙': 모든 훈련 효과 보너스(스탯·챔피언 숙련도), 대신 컨디션이 상한 이상 못 올라가서 경기력이 덜 나와요
// 합숙 피로: 합숙한 기간이 길수록 보너스가 줄어요 (첫해 +25% → 1년마다 −5%p, 최소 +5%. 집에 살다 돌아와도 쌓인 기간은 그대로)
//   (컨디션 100이면 경기력 +10%, 50이면 ±0)
// 다른 선수: 2부는 모두 합숙(해마다 성장 +25%, 경기력 −4%), 1부는 자기 집
// 월세(rent): 매주 나감, 자금이 모자라면 합숙으로 돌아감 / 매매(price): 한 번 사고, 다른 집으로 옮기거나 합숙으로 돌아가면 resale 비율로 팔림
// conditionCap: 그 집에서의 컨디션 상한, effects: 매주 효과 (staminaRegen 체력 +n, conditionRegen 컨디션 +n, popularityGain 인기도 상승 +%)
const HOUSING = {
  dormTraining: 0.25,     // 합숙: 모든 훈련 효과 +25% (첫해) — 2026-10-07 +50%에서 줄임
  dormFatiguePerYear: 0.05, // 합숙 피로: 합숙 1년(52주)마다 보너스 −5%p
  dormTrainingMin: 0.05,  //   최소 +5%
  dormConditionCap: 40,   // 합숙: 컨디션 상한 (2026-10-07 50 → 40, 경기력 ×0.98)
  npcDormPower: -0.04,    // 2부 다른 선수(합숙): 경기력 −4% (컨디션 상한)
  npcDormGrowth: 0.25,    // 2부 다른 선수(합숙): 해마다 스탯 성장 +25% (2026-10-07 +50%에서 줄임 — 리그 전력 인플레이션 완화)
  resale: 0.9,            // 산 집을 팔면 산 값의 90%
};
const SHOP_HOUSING = [
  { id: "oneroom",   icon: "🏠", name: "원룸 (월세)",     rent: 150000,                conditionCap: 80,  desc: "합숙 탈출. 내 방이 생겼다.",               effects: {} },
  { id: "tworoom",   icon: "🏡", name: "투룸 (월세)",     rent: 400000,                conditionCap: 90,  desc: "쉬는 공간이 따로 있다.",                   effects: { staminaRegen: 1 } },
  { id: "apt",       icon: "🏢", name: "아파트",          price: 200000000,            conditionCap: 95,  desc: "내 집 마련.",                              effects: { staminaRegen: 2, conditionRegen: 1 } },
  { id: "luxury",    icon: "🏙️", name: "고급 아파트",     price: 500000000,            conditionCap: 100,  desc: "헬스장·사우나가 딸린 단지.",               effects: { staminaRegen: 3, conditionRegen: 2, popularityGain: 0.05 } },
  { id: "penthouse", icon: "🌆", name: "초고급 아파트",   price: 1200000000,           conditionCap: 100, desc: "한강이 보이는 펜트하우스. 방송에도 나온다.", effects: { staminaRegen: 4, conditionRegen: 3, popularityGain: 0.10 } },
];
