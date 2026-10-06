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

// ----- 회복·힐링: 바로 효과. 횟수 제한 없음 (돈만 있으면 언제든) -----
// offseason: true → 우리 팀 시즌이 끝난 뒤(비시즌)에만
const SHOP_CARE = [
  { id: "massage", icon: "💆", name: "마사지·한의원", price: 500000,  desc: "체력 +15",                 effects: { stamina: 15 } },
  { id: "dinner",  icon: "🍖", name: "맛집 회식",     price: 300000,  desc: "컨디션 +10",               effects: { condition: 10 } },
  { id: "trip",    icon: "🚗", name: "주말 여행",     price: 1500000, desc: "체력 +10, 컨디션 +15",     effects: { stamina: 10, condition: 15 } },
  { id: "abroad",  icon: "✈️", name: "해외여행",      price: 5000000, desc: "컨디션 +40, 멘탈 +1 (머리를 식히고 옴 · 비시즌만)", effects: { condition: 40, mental: 1 }, offseason: true },
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
