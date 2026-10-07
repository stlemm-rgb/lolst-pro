// ===== 경기 이벤트 (세트마다 일어나는 사건: 스틸·슈퍼플레이·실수·심리) — js/match_events.js =====
// 예전의 "운 ±8" 대신, 세트마다 이런 사건이 여러 개 일어나서 팀 점수를 흔들어요.
// 사건마다 주인공 선수가 있고, 경기 결과 화면 '경기 흐름'에 시간 순서로 보여요.
//
// ■ 사건 한 개가 일어나는 방식
//   1) 몇 분에 일어날지 정함 → 그 시간에 일어날 수 있는 사건(t: [시작 분, 끝 분]) 중에서
//      종류(kind) 비율대로 고르고, 그 안에서 w(자주 나오는 정도) 비율대로 고름
//   2) 주인공: 양 팀 10명 중에서 뽑음
//      - pos: 그 사건이 잘 일어나는 포지션과 비중 (없으면 모든 포지션 1)
//      - stats: 관련 스탯. 좋은 사건(good)은 이 스탯이 높을수록, 실수(bad)는 낮을수록 잘 걸림
//      - 자신감·위축(심리 상태)도 반영
//   3) 점수: size(s 작음 / m 중간 / l 큼)만큼
//      - good: 주인공 팀 +, bad: 주인공 팀 −, psych: 점수 대신 심리 상태가 바뀜
//   4) 평점: 주인공 평점 ± (RULES.rating), 당한 선수(vs)는 조금 −
//
// ■ 글자
//   {p} = 주인공 이름, {v} = 당한 상대 선수 이름 (vs가 있을 때)
//   이름 뒤 조사(이/가, 을/를)가 어색하지 않게 "{p}의 …", "{p}, …"처럼 써 주세요.
//
// ■ 칸 설명
//   id: 코드에서 쓰는 이름(영어, 바꾸지 마세요) · cat: 분류(화면 색) · icon · name: 짧은 이름
//   kind: good / bad / psych · size: s / m / l · w: 자주 나오는 정도
//   vs: 당하는 상대 — "lane"(같은 포지션) / "carry"(상대 원딜·미드 중 잘하는 쪽) / "any"(아무나) / 없음
//   psy (psych만): { who: "self"(주인공) 또는 "team"(주인공 팀), mood: +1 자신감·호흡 / −1 위축·불안 }
//   finisher: true → 승부가 정해진 뒤 이긴 팀에만 가끔 붙는 마무리 장면 (점수 없음)

const MATCH_EVENT_RULES = {
  count: [5, 8],          // 세트마다 사건 수 (라인전 솔로킬은 따로)
  timeRange: [2, 40],     // 사건이 일어나는 시간 (분)
  kindWeight: { good: 56, bad: 32, psych: 12 }, // 종류 비율
  // 점수 크기 (범위 안에서 무작위). 팀 점수는 전력 차 1점이 약 3점이라 사건도 이만큼 커야 이변이 남
  //   (2026-10-07 현실형 목표: 전력 차 0~2 → 세트 55% · 4~6 → 70% · 11 이상 → 90%)
  size: { s: [8, 16], m: [21, 34], l: [42, 62] },
  scale: 1,               // 전체 크기 배율 (키우면 이변↑, 줄이면 실력대로)
  statSoft: 22,           // 주인공 뽑기: 스탯이 이만큼 높으면 (좋은 사건) 약 2.7배 잘 뽑힘
  residual: 2,            // 남은 작은 운 (± 이만큼)
  rating: { s: 0.3, m: 0.5, l: 0.9 }, // 주인공 세트 평점 변화 (good +, bad −)
  victimRating: 0.2,      // 당한 상대 선수 평점 −
  // 심리 상태 (경기 하나 = 한 시리즈 안에서 다음 세트까지 이어짐, 최대 ±moodMax)
  //   선수 자신감 1단계당: 좋은 사건 ×(1 + moodGood), 실수 ×(1 − moodBad)  (위축이면 반대)
  //   팀 분위기 1단계당: 그 팀 선수 전체에 같은 효과의 절반
  //   멘탈이 높을수록 위축(−) 효과가 줄어듦: 멘탈 50 → 그대로, 90 → 50% (최소 mentalMin)
  moodGood: 0.25,
  moodBad: 0.2,
  moodMax: 2,
  mentalMin: 0.3,
  finisherChance: 0.15,   // 이긴 팀 마무리 장면이 붙을 확률
  // 세트가 끝난 뒤 자동으로 생기는 심리 변화 (아래 AUTO_PSYCH 글자 사용)
  tiltBadCount: 2,        // 한 세트에 실수 이만큼 → 그 선수 위축
  passiveLosses: 2,       // 세트를 연속으로 이만큼 지면 → 팀 소극적 (팀 평균 멘탈 passiveMental 이상이면 버팀)
  passiveMental: 70,
};

// 분류 이름 (화면 표시)
const MATCH_EVENT_CATS = {
  early:  "초반",
  object: "오브젝트",
  macro:  "운영",
  fight:  "한타",
  play:   "슈퍼플레이",
  mistake: "실수",
  psych:  "심리",
  lane:   "라인전",
};

const MATCH_EVENTS = [
  // ----- 6. 초반 -----
  { id: "lv1_invade",      cat: "early", icon: "⚡", name: "레벨 1 인베이드 성공", kind: "good", size: "s", w: 1, t: [1, 3], pos: { jungle: 2, support: 2, mid: 1 }, stats: ["shotcall", "vision"], text: "{p}의 콜로 레벨 1 인베이드 성공" },
  { id: "lv1_invade_fail", cat: "early", icon: "⚡", name: "레벨 1 인베이드 실패", kind: "bad",  size: "s", w: 1, t: [1, 3], pos: { jungle: 2, support: 2, mid: 1 }, stats: ["shotcall", "vision"], text: "레벨 1 인베이드 실패, {p}의 점멸이 빠짐" },
  { id: "first_blood",     cat: "early", icon: "🩸", name: "퍼스트 블러드", kind: "good", size: "s", w: 2, t: [2, 8], stats: ["laning", "reaction"], vs: "lane", text: "{p}, {v} 상대로 퍼스트 블러드" },
  { id: "buff_steal",      cat: "early", icon: "⚡", name: "정글 버프 카정", kind: "good", size: "s", w: 1, t: [3, 10], pos: { jungle: 4, mid: 1 }, stats: ["macro", "vision"], text: "{p}의 정글 버프 카정" },
  { id: "three_buff",      cat: "early", icon: "⚡", name: "3버프 컨트롤", kind: "good", size: "s", w: 1, t: [5, 12], pos: { jungle: 1 }, stats: ["macro", "vision"], text: "{p}, 상대 정글을 장악하며 3버프 컨트롤" },
  { id: "lv2_gank",        cat: "early", icon: "⚡", name: "레벨 2 갱 성공", kind: "good", size: "s", w: 1, t: [2, 4], pos: { jungle: 1 }, stats: ["macro", "reaction"], vs: "any", text: "{p}의 레벨 2 갱, {v} 사망" },
  { id: "counter_gank",    cat: "early", icon: "⚡", name: "역갱 성공", kind: "good", size: "s", w: 1.5, t: [4, 13], pos: { jungle: 3, mid: 1, top: 1 }, stats: ["vision", "reaction"], text: "{p}, 갱킹을 읽고 역갱 성공" },
  { id: "top_dive",        cat: "early", icon: "⚡", name: "탑 다이브 성공", kind: "good", size: "s", w: 1, t: [6, 14], pos: { jungle: 2, top: 1 }, stats: ["macro", "teamfight"], vs: "lane", text: "{p}의 탑 다이브 성공" },
  { id: "bot_dive",        cat: "early", icon: "⚡", name: "바텀 4인 다이브", kind: "good", size: "m", w: 0.8, t: [7, 15], pos: { jungle: 2, support: 2, adc: 1, mid: 1 }, stats: ["shotcall", "teamfight"], text: "{p}의 콜로 바텀 4인 다이브, 2킬 + 포탑" },
  { id: "first_dragon",    cat: "early", icon: "🐲", name: "첫 용 독식", kind: "good", size: "s", w: 1.5, t: [5, 10], pos: { jungle: 3, support: 1, mid: 1 }, stats: ["macro"], text: "{p} 주도로 첫 용 독식" },
  { id: "first_herald",    cat: "early", icon: "🦀", name: "첫 전령 획득", kind: "good", size: "s", w: 1, t: [8, 14], pos: { jungle: 3, top: 2, mid: 1 }, stats: ["macro"], text: "{p}의 첫 전령 획득" },
  { id: "first_tower",     cat: "early", icon: "🏰", name: "첫 포탑 획득", kind: "good", size: "s", w: 1.5, t: [10, 15], pos: { top: 2, mid: 2, adc: 2 }, stats: ["laning"], text: "{p}, 첫 포탑 파괴" },
  { id: "jungle_death",    cat: "early", icon: "💀", name: "정글러 초반 사망", kind: "bad", size: "m", w: 1, t: [3, 10], pos: { jungle: 1 }, stats: ["vision", "reaction"], text: "{p} 초반 사망, 정글 동선이 무너짐" },

  // ----- 1. 오브젝트 -----
  { id: "baron_steal",     cat: "object", icon: "🐉", name: "바론 스틸", kind: "good", size: "l", w: 1.2, t: [22, 40], pos: { jungle: 6, mid: 1, adc: 1 }, stats: ["reaction", "accuracy"], vs: "lane", text: "{p}의 바론 스틸!" },
  { id: "elder_steal",     cat: "object", icon: "🐉", name: "장로 스틸", kind: "good", size: "l", w: 0.6, t: [32, 40], pos: { jungle: 6, mid: 1 }, stats: ["reaction", "accuracy"], vs: "lane", text: "{p}의 장로 드래곤 스틸!" },
  { id: "dragon_steal",    cat: "object", icon: "🐲", name: "드래곤 스틸", kind: "good", size: "m", w: 1.2, t: [8, 30], pos: { jungle: 5, mid: 1 }, stats: ["reaction", "accuracy"], vs: "lane", text: "{p}, 드래곤 스틸" },
  { id: "herald_steal",    cat: "object", icon: "🦀", name: "전령 스틸", kind: "good", size: "s", w: 1, t: [8, 16], pos: { jungle: 5, top: 1 }, stats: ["reaction"], vs: "lane", text: "{p}, 전령 스틸" },
  { id: "smite_lose",      cat: "object", icon: "🐲", name: "스마이트 싸움 패배", kind: "bad", size: "m", w: 1.2, t: [8, 38], pos: { jungle: 1 }, stats: ["reaction"], vs: "lane", text: "{p}, 스마이트 싸움에서 {v}에게 패배" },
  { id: "obj_burst",       cat: "object", icon: "🐉", name: "오브젝트 버스트", kind: "good", size: "m", w: 1, t: [15, 38], pos: { jungle: 2, mid: 1, adc: 2 }, stats: ["macro", "teamfight"], text: "{p} 주도로 바론 순삭 (오브젝트 버스트)" },
  { id: "obj_wipe",        cat: "object", icon: "☠️", name: "오브젝트 치다 전멸", kind: "bad", size: "l", w: 0.6, t: [20, 38], pos: { jungle: 2, support: 2, mid: 1 }, stats: ["shotcall", "vision"], text: "{p}의 콜로 바론을 치다가 전멸" },
  { id: "baron_throw",     cat: "object", icon: "☠️", name: "바론 먹고 대량 사망", kind: "bad", size: "l", w: 0.5, t: [25, 40], stats: ["focus", "mental"], text: "바론을 먹고도 {p} 앞장서다 3~4명 사망" },
  { id: "sneaky_baron",    cat: "object", icon: "🐉", name: "몰래 바론", kind: "good", size: "m", w: 0.8, t: [22, 38], pos: { jungle: 3, support: 2, mid: 1 }, stats: ["macro", "vision"], text: "{p}의 판단으로 몰래 바론 성공" },
  { id: "sneaky_elder",    cat: "object", icon: "🐉", name: "몰래 장로", kind: "good", size: "l", w: 0.4, t: [32, 40], pos: { jungle: 3, support: 2 }, stats: ["macro", "vision"], text: "{p}의 판단으로 몰래 장로 성공" },
  { id: "obj_fake",        cat: "object", icon: "🎭", name: "오브젝트 페이크 매복", kind: "good", size: "m", w: 0.8, t: [15, 36], pos: { support: 3, jungle: 3, mid: 1 }, stats: ["shotcall", "vision"], text: "{p}의 오브젝트 페이크, 매복 성공" },

  // ----- 2. 운영·맵 -----
  { id: "tp_flank",        cat: "macro", icon: "🌀", name: "뒷텔 성공", kind: "good", size: "m", w: 1, t: [14, 35], pos: { top: 5, mid: 1 }, stats: ["macro", "shotcall"], text: "{p}의 뒷텔 성공, 한타 대승" },
  { id: "tp_flank_fail",   cat: "macro", icon: "🌀", name: "뒷텔 발각", kind: "bad", size: "m", w: 0.8, t: [14, 35], pos: { top: 5, mid: 1 }, stats: ["macro", "vision"], text: "{p}의 뒷텔이 들켜 혼자 사망" },
  { id: "backdoor_stop",   cat: "macro", icon: "🛡️", name: "백도어 저지", kind: "good", size: "m", w: 0.5, t: [28, 40], stats: ["reaction", "vision"], vs: "any", text: "{p}, {v}의 백도어 저지" },
  { id: "side_inhib",      cat: "macro", icon: "🏰", name: "사이드 억제기 철거", kind: "good", size: "s", w: 1, t: [24, 40], pos: { top: 3, mid: 1, adc: 1 }, stats: ["macro"], text: "{p}, 사이드 억제기 철거" },
  { id: "split_131",       cat: "macro", icon: "🗺️", name: "1-3-1 운영", kind: "good", size: "m", w: 0.8, t: [20, 38], pos: { top: 4, mid: 1 }, stats: ["macro", "laning"], text: "{p} 중심 1-3-1 운영으로 포탑 연속 철거" },
  { id: "split_pull",      cat: "macro", icon: "🗺️", name: "스플릿으로 2명 끌어냄", kind: "good", size: "s", w: 1, t: [18, 36], pos: { top: 4, mid: 1 }, stats: ["macro", "reaction"], text: "{p}, 사이드에서 상대 2명을 묶어 둠" },
  { id: "no_tp_force",     cat: "macro", icon: "🗺️", name: "텔포 없는 타이밍 강제 한타", kind: "good", size: "m", w: 0.8, t: [18, 34], pos: { jungle: 2, support: 2, mid: 1 }, stats: ["shotcall", "macro"], text: "상대 텔포가 없는 걸 본 {p}의 콜, 강제 한타 승리" },
  { id: "wave_fail",       cat: "macro", icon: "🏚️", name: "라인 관리 실패", kind: "bad", size: "s", w: 1.2, t: [14, 34], pos: { top: 1, mid: 1, adc: 1 }, stats: ["macro"], text: "{p}의 라인 관리 실패로 포탑 손실" },
  { id: "big_wave",        cat: "macro", icon: "🏚️", name: "대형 웨이브 방치", kind: "bad", size: "s", w: 1, t: [22, 38], stats: ["macro", "vision"], text: "대형 웨이브를 방치, {p}의 판단 실수로 억제기 위기" },
  { id: "vision_pick",     cat: "macro", icon: "👁️", name: "시야 장악 후 픽", kind: "good", size: "m", w: 1.2, t: [15, 35], pos: { support: 4, jungle: 3, mid: 1 }, stats: ["vision", "macro"], vs: "any", text: "{p}의 시야 장악, {v} 끊어냄" },

  // ----- 3. 한타 -----
  { id: "five_ult",        cat: "fight", icon: "💥", name: "5인 궁 적중", kind: "good", size: "m", w: 0.7, t: [18, 40], pos: { mid: 2, top: 2, support: 1, jungle: 1 }, stats: ["teamfight", "accuracy"], text: "{p}의 궁극기, 5명 적중!" },
  { id: "big_init",        cat: "fight", icon: "💥", name: "대박 이니시", kind: "good", size: "m", w: 1.2, t: [15, 40], pos: { support: 3, top: 2, jungle: 2 }, stats: ["teamfight", "shotcall"], text: "{p}의 대박 이니시" },
  { id: "counter_init",    cat: "fight", icon: "💥", name: "역이니시", kind: "good", size: "m", w: 1, t: [15, 40], pos: { mid: 2, support: 2, adc: 1 }, stats: ["reaction", "spacing"], text: "{p}의 역이니시 성공" },
  { id: "free_dps",        cat: "fight", icon: "🏹", name: "원딜 프리딜", kind: "good", size: "m", w: 1, t: [18, 40], pos: { adc: 1 }, stats: ["spacing", "teamfight"], text: "{p}, 프리딜 구도로 한타 지배" },
  { id: "carry_burst",     cat: "fight", icon: "💀", name: "딜러 초반 폭사", kind: "bad", size: "m", w: 1.2, t: [15, 40], pos: { adc: 3, mid: 2 }, stats: ["spacing", "focus"], text: "{p}, 한타 시작하자마자 폭사" },
  { id: "tank_reach",      cat: "fight", icon: "🛡️", name: "딜러에게 진입 성공", kind: "good", size: "m", w: 1, t: [15, 40], pos: { top: 2, jungle: 2, support: 2 }, stats: ["teamfight", "reaction"], vs: "carry", text: "{p}, {v}에게 진입 성공" },
  { id: "skill_miss",      cat: "fight", icon: "❌", name: "핵심 스킬 미스", kind: "bad", size: "m", w: 1.2, t: [12, 40], stats: ["accuracy", "focus"], text: "{p}의 핵심 스킬이 빗나감" },
  { id: "zhonya",          cat: "fight", icon: "⏳", name: "존야 슈퍼플레이", kind: "good", size: "s", w: 1, t: [15, 40], pos: { mid: 3, adc: 1, top: 1 }, stats: ["reaction", "spacing"], text: "{p}의 존야 타이밍, 스킬을 전부 받아냄" },
  { id: "flash_react",     cat: "fight", icon: "⚡", name: "점멸 반응", kind: "good", size: "s", w: 1, t: [10, 40], stats: ["reaction"], text: "{p}, 점멸 반응으로 이니시 회피" },
  { id: "carry_survive",   cat: "fight", icon: "🏹", name: "딜러 끝까지 생존", kind: "good", size: "s", w: 1, t: [18, 40], pos: { adc: 3, mid: 2 }, stats: ["spacing", "focus"], text: "{p}, 한타 끝까지 살아남아 딜 마무리" },
  { id: "fight_4v5",       cat: "fight", icon: "🔥", name: "4:5 한타 승리", kind: "good", size: "l", w: 0.5, t: [18, 40], pos: { adc: 2, mid: 2, top: 1, jungle: 1, support: 1 }, stats: ["teamfight", "focus"], text: "4:5 한타 승리! {p} 중심" },
  { id: "fight_reverse",   cat: "fight", icon: "🔥", name: "불리한 한타 역전", kind: "good", size: "l", w: 0.5, t: [20, 40], stats: ["teamfight", "mental"], text: "불리한 한타를 뒤집음, {p}의 활약" },
  { id: "ace",             cat: "fight", icon: "🏆", name: "에이스", kind: "good", size: "m", w: 0.8, t: [20, 40], pos: { adc: 2, mid: 2, jungle: 1, top: 1 }, stats: ["teamfight"], text: "{p}의 마무리로 에이스!" },
  { id: "nodeath_fight",   cat: "fight", icon: "✨", name: "노데스 한타", kind: "good", size: "m", w: 0.7, t: [18, 40], pos: { support: 2, top: 2, jungle: 1 }, stats: ["teamfight", "shotcall"], text: "{p}의 이니시로 노데스 한타 승리" },
  { id: "pick_reverse",    cat: "fight", icon: "🔥", name: "끊긴 뒤 역한타", kind: "good", size: "m", w: 0.7, t: [18, 40], stats: ["teamfight", "mental"], text: "한 명이 끊겼지만 {p} 중심으로 역으로 한타 승리" },

  // ----- 4. 개인 슈퍼플레이 (솔킬은 라인전 결과에서 따로) -----
  { id: "duel_1v2",        cat: "play", icon: "⭐", name: "1대2 승리", kind: "good", size: "m", w: 0.8, t: [6, 32], pos: { top: 2, mid: 2, adc: 1, jungle: 1 }, stats: ["reaction", "accuracy"], text: "{p}, 1대2 승리!" },
  { id: "survive_1v3",     cat: "play", icon: "⭐", name: "1대3 생존", kind: "good", size: "s", w: 0.8, t: [10, 38], stats: ["reaction", "spacing"], text: "{p}, 1대3에서 살아나감" },
  { id: "escape",          cat: "play", icon: "🏃", name: "도주 성공", kind: "good", size: "s", w: 1, t: [5, 38], stats: ["reaction"], text: "{p}, 아슬아슬하게 도주 성공" },
  { id: "super_save",      cat: "play", icon: "🛟", name: "슈퍼 세이브", kind: "good", size: "m", w: 1, t: [12, 40], pos: { support: 4, jungle: 1, top: 1 }, stats: ["reaction", "teamfight"], text: "{p}의 슈퍼 세이브" },
  { id: "dying_kill",      cat: "play", icon: "⭐", name: "죽기 직전 딜러 처치", kind: "good", size: "s", w: 0.8, t: [15, 40], stats: ["teamfight", "focus"], vs: "carry", text: "{p}, 쓰러지기 직전 {v} 처치" },
  { id: "dodge_ult",       cat: "play", icon: "⭐", name: "궁극기 회피", kind: "good", size: "s", w: 1, t: [8, 40], stats: ["reaction"], vs: "any", text: "{p}, {v}의 궁극기를 피함" },
  { id: "cleanse",         cat: "play", icon: "⭐", name: "CC 해제", kind: "good", size: "s", w: 0.8, t: [12, 40], pos: { adc: 3, mid: 2 }, stats: ["reaction", "focus"], text: "{p}, 결정적인 CC를 정화로 해제" },
  { id: "blind_shot",      cat: "play", icon: "🎯", name: "블라인드 스킬샷", kind: "good", size: "s", w: 1, t: [8, 40], pos: { mid: 2, adc: 2, support: 2 }, stats: ["accuracy"], vs: "any", text: "{p}의 블라인드 스킬샷, {v} 적중" },
  { id: "predict_flash",   cat: "play", icon: "🎯", name: "예측 점멸 적중", kind: "good", size: "s", w: 0.8, t: [6, 40], stats: ["accuracy", "reaction"], vs: "any", text: "{p}, {v}의 점멸 위치를 읽고 스킬 적중" },
  { id: "burst_carry",     cat: "play", icon: "🗡️", name: "순간 폭딜로 캐리 제거", kind: "good", size: "m", w: 1, t: [15, 40], pos: { mid: 2, jungle: 2, top: 1 }, stats: ["accuracy", "reaction"], vs: "carry", text: "{p}의 순간 폭딜, {v} 순삭" },

  // ----- 5. 실수·사고 -----
  { id: "facecheck",       cat: "mistake", icon: "💀", name: "페이스체크 사망", kind: "bad", size: "s", w: 1.5, t: [10, 40], pos: { support: 2, jungle: 2, top: 1, mid: 1, adc: 1 }, stats: ["vision", "focus"], text: "{p}, 풀숲 페이스체크하다 사망" },
  { id: "carry_caught",    cat: "mistake", icon: "💀", name: "딜러 혼자 잘림", kind: "bad", size: "m", w: 1.2, t: [15, 40], pos: { adc: 3, mid: 2 }, stats: ["vision", "spacing"], text: "{p}, 혼자 있다가 잘림" },
  { id: "top_caught",      cat: "mistake", icon: "💀", name: "사이드에서 잘림", kind: "bad", size: "s", w: 1.2, t: [15, 40], pos: { top: 4, mid: 1 }, stats: ["vision", "macro"], text: "{p}, 사이드 라인에서 잘림" },
  { id: "ward_death",      cat: "mistake", icon: "💀", name: "시야 잡다 사망", kind: "bad", size: "s", w: 1.2, t: [12, 40], pos: { support: 4, jungle: 1 }, stats: ["vision", "focus"], text: "{p}, 와드를 박으러 갔다가 사망" },
  { id: "tp_misuse",       cat: "mistake", icon: "🌀", name: "텔포 잘못 사용", kind: "bad", size: "s", w: 0.8, t: [10, 35], pos: { top: 4, mid: 1 }, stats: ["macro", "focus"], text: "{p}의 텔포 판단 실수" },
  { id: "flash_fail",      cat: "mistake", icon: "😵", name: "플래시 실수", kind: "bad", size: "s", w: 1, t: [5, 40], stats: ["accuracy", "focus"], text: "{p}의 점멸이 벽을 못 넘음" },
  { id: "ult_whiff",       cat: "mistake", icon: "❌", name: "궁극기 허공", kind: "bad", size: "m", w: 1, t: [12, 40], stats: ["accuracy", "focus"], text: "{p}, 궁극기를 허공에 사용" },
  { id: "no_smite",        cat: "mistake", icon: "🐲", name: "스마이트 없음", kind: "bad", size: "m", w: 0.6, t: [15, 40], pos: { jungle: 1 }, stats: ["focus", "macro"], text: "오브젝트 싸움인데 {p}의 스마이트가 없음" },
  { id: "recall_miss",     cat: "mistake", icon: "😵", name: "귀환 타이밍 실수", kind: "bad", size: "s", w: 1, t: [8, 36], stats: ["macro"], text: "{p}의 귀환 타이밍 실수, 한타 합류 실패" },
  { id: "baron_overstay",  cat: "mistake", icon: "💀", name: "바론 버프 들고 무리", kind: "bad", size: "m", w: 0.8, t: [25, 40], stats: ["focus", "mental"], text: "{p}, 바론 버프를 믿고 무리하다 사망" },
  { id: "bounty",          cat: "mistake", icon: "💰", name: "현상금 헌납", kind: "bad", size: "m", w: 0.8, t: [18, 38], pos: { adc: 2, mid: 2, top: 2 }, stats: ["focus", "vision"], text: "{p}, 쌓인 현상금을 헌납" },
  { id: "invade_fail",     cat: "mistake", icon: "💀", name: "정글 침범하다 사망", kind: "bad", size: "s", w: 1, t: [6, 30], pos: { jungle: 3, support: 1, mid: 1 }, stats: ["vision", "macro"], text: "{p}, 상대 정글에 들어갔다가 역으로 사망" },
  { id: "dive_fail",       cat: "mistake", icon: "💀", name: "다이브 실패", kind: "bad", size: "m", w: 0.8, t: [6, 30], pos: { jungle: 3, top: 2, support: 1 }, stats: ["shotcall", "macro"], text: "{p} 주도 다이브 실패, 2명 사망" },
  { id: "chase_reverse",   cat: "mistake", icon: "😵", name: "추격하다 역전당함", kind: "bad", size: "s", w: 1, t: [8, 40], stats: ["focus", "mental"], text: "{p}, 무리하게 쫓다가 역으로 당함" },

  // ----- 7. 심리·팀 상태 (점수 대신 다음 판단·한타·실수 확률이 바뀜) -----
  { id: "call_clash",      cat: "psych", icon: "🗯️", name: "팀 콜 충돌", kind: "psych", size: "s", w: 1, t: [12, 36], stats: ["shotcall"], low: true, psy: { who: "team", mood: -1 }, text: "{p}의 팀, 콜이 엇갈리며 우왕좌왕" },
  { id: "obj_call_fail",   cat: "psych", icon: "🗯️", name: "오브젝트 콜 실패", kind: "bad", size: "s", w: 1, t: [10, 36], pos: { jungle: 2, support: 2, mid: 1 }, stats: ["shotcall"], text: "{p}의 오브젝트 콜 실패, 용을 내줌" },
  { id: "synergy_up",      cat: "psych", icon: "🤝", name: "팀 호흡 상승", kind: "psych", size: "s", w: 1, t: [10, 36], stats: ["shotcall"], psy: { who: "team", mood: 1 }, text: "{p}의 콜에 팀원들이 척척 맞춤, 호흡 상승" },
  { id: "focus_target",    cat: "psych", icon: "🎯", name: "집중 견제", kind: "psych", size: "s", w: 0.8, t: [5, 30], power: true, psy: { who: "self", mood: -1 }, text: "{p}, 상대의 집중 견제를 받음" },
  { id: "star_tilt",       cat: "psych", icon: "😰", name: "핵심 선수 멘탈 흔들림", kind: "psych", size: "s", w: 0.8, t: [10, 36], power: true, stats: ["mental"], low: true, psy: { who: "self", mood: -1 }, text: "{p}, 멘탈이 흔들림" },
];

// 세트가 끝난 뒤 자동으로 생기는 심리 변화 (다음 세트부터 적용)
const AUTO_PSYCH = {
  confident: { icon: "😎", name: "자신감 상승", text: "{p}, 슈퍼플레이 이후 자신감 상승" },
  tilted:    { icon: "😣", name: "플레이 위축", text: "{p}, 연속 데스로 플레이 위축" },
  passive:   { icon: "🐢", name: "소극적 운영", text: "연속 세트 패배로 팀이 소극적으로 변함" },
  momentum:  { icon: "🌊", name: "분위기 반전", text: "대역전 이후 팀 분위기 반전" },
};

// 이긴 팀 마무리 장면 (점수 없음, 가끔)
const MATCH_FINISHERS = [
  { id: "backdoor",   cat: "macro", icon: "🚪", name: "백도어", text: "{p}의 백도어로 넥서스 파괴!" },
  { id: "nexus_race", cat: "macro", icon: "🏁", name: "넥서스 레이스", text: "넥서스 레이스 승리, 마지막 일격은 {p}" },
];
