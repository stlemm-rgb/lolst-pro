// 특성 목록
// - type: "good"(좋은 특성), "bad"(나쁜 특성), "s"(S급 특성: 게임 중 큰 업적으로만 얻음, 아래 S_TRAIT_RULES),
//         "title"(칭호: 잠깐만 붙는 특성. 예: 솔랭 1위 — 랭크 초기화 때 다음 1위에게 넘어감)
//   좋은 특성은 캐릭터 생성 때 직접 골라요(유형별 개수만큼). 나쁜 특성은 이벤트로만 생겨요(최대 5%). 나쁜 특성마다 극복 이벤트가 있어요.
// - group: 캐릭터 생성 화면에서 묶어서 보여줄 분류 (좋은 특성만)
// - npc: true면 다른 선수(NPC)도 가질 수 있음 (경기·성장·노화에 영향을 주는 특성만. 훈련·돈·인기 특성은 NPC에게 의미가 없어서 제외)
// - desc: 화면에 보이는 설명 (효과 숫자를 바꾸면 설명도 같이 바꿔 주세요)
// - impact / when: 캐릭터 생성 화면에 보이는 경기 영향 (세트 승률 +n%p, 측정값 2026-10-07) / 언제 효과가 있는지
// - effects: 실제 효과 (모두 적용됨. ★ = 다른 선수에게도 적용)
//   [훈련]
//     ★ trainingAll: 모든 훈련 효과 (0.2 = +20%)      ★ trainingStat: 특정 스탯 훈련 효과 ({ laning: 0.3 })  (NPC는 시즌 성장에 적용)
//     ★ topGrowth: 85 이상 스탯의 성장 배율 ({ reaction: 1 } 또는 { all: 0.5 }, 1 = ×2). 시작 값은 data/growth.js의 TOP_GROWTH_FROM
//       (예전 statCap(상한선 +n)은 2026-10-07에 상한 100 통일로 없앰. 코드는 남아 있어서 써도 100을 넘지는 않음)
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
//   [경기 흐름 사건] (data/match_events.js) — 숫자는 "그 사건의 주인공이 될 확률" 배율에 더함 (0.6 = ×1.6, −0.4 = ×0.6)
//     ★ evGood: 좋은 사건 ({ all, early 초반, object 오브젝트, macro 운영, fight 한타, play 슈퍼플레이 })
//     ★ evBad: 실수 사건 ({ all, object…, greedy 무리하다 생기는 실수 })
//     ★ evGoodBig / evBadBig: 큰 경기에서 좋은 사건 / 실수    ★ evClutch: 승부처(풀세트 또는 경기 후반) 좋은 사건
//     ★ evGoodBehind / evBadBehind: 세트 스코어에서 지고 있을 때 좋은 사건 / 실수   ★ evSwing: 내 사건 점수 크기 (0.3 = 1.3배, 좋은 것·나쁜 것 모두)
//     ★ psychImmune: 위축·멘탈 흔들림·집중 견제에 안 걸림      ★ psychFragile: 위축이 더 잘 걸리고 더 크게 흔들림
//     ★ teamCall: 우리 팀 콜 충돌 없음 + 호흡 상승 확률 ×(1+n)  ★ teamBad: 우리 팀 모두 실수 확률
//     ★ teamStartMood: 경기 시작 때 팀 분위기 +n             ✅ signatureEv: 숙련도 1위 챔피언을 고르면 좋은 사건
//     ★ evPower: 내 사건 점수 크기 ({ all 좋은 사건 모두, object… 분류별, bad 실수(−면 작아짐) }, 0.3 = 1.3배)
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
  { id: "one_trick",    type: "good", group: "챔피언", name: "장인",         desc: "숙련도 1위 챔피언을 고르면 경기력 +8%, 좋은 장면 ×1.5",      effects: { signature: 0.08, signatureEv: 0.5 } },
  { id: "carry_instinct", type: "good", group: "챔피언", name: "캐리 본능",   desc: "캐리형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { carry: 0.3 } } },
  { id: "support_sense", type: "good", group: "챔피언", name: "서포트 감각",  desc: "지원형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { utility: 0.3 } } },
  { id: "aggro_instinct", type: "good", group: "챔피언", name: "공격 본능",   desc: "공격형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { aggro: 0.3 } } },
  { id: "macro_mind",   type: "good", group: "챔피언", name: "판짜기 달인",   desc: "운영형 챔피언 숙련도 성장 +30%",                         effects: { typeMastery: { macro: 0.3 } } },

  // ===== 좋은 특성: 경기 =====
  // (2026-10-07 리뉴얼) 경기 특성은 경기 흐름 사건(슈퍼플레이·실수·심리)과 연결 — 경기 결과 타임라인에 [특성]으로 표시
  { id: "big_stage",    type: "good", npc: true, group: "경기", name: "큰 무대 체질",  impact: 2.2, when: "큰 경기", desc: "큰 경기(결승·플레이오프·월드 토너먼트·승강전)에서 좋은 장면 ×1.6, 실수 −40%, 경기력 +6%", effects: { bigMatch: 0.06, evGoodBig: 0.6, evBadBig: -0.4 } },
  { id: "clutch",       type: "good", npc: true, group: "경기", name: "클러치",        impact: 2.8, when: "풀세트·경기 후반", desc: "승부처(풀세트, 경기 후반)에서 좋은 장면 ×1.9, 풀세트 경기력 +10%",   effects: { clutch: 0.1, evClutch: 0.9 } },
  { id: "steel_mental", type: "good", npc: true, group: "경기", name: "강철 멘탈",     impact: 1.4, when: "지고 있을 때", desc: "경기 중 위축·멘탈 흔들림·집중 견제에 안 흔들림, 지고 있을 때 좋은 장면 ×1.5, 패배 후 컨디션 하락 절반", effects: { lossMental: -0.5, psychImmune: true, evGoodBehind: 0.5 } },
  { id: "born_leader",  type: "good", npc: true, group: "경기", name: "타고난 리더",   impact: 4.1, when: "항상", desc: "우리 팀 콜 충돌 없음, 팀 호흡 상승 ×2, 팀원 모두 실수 −35%, 오더 훈련 +30%", effects: { trainingStat: { shotcall: 0.3 }, teamCall: 1, teamBad: -0.35 } },
  { id: "steal_master", type: "good", npc: true, group: "경기", name: "스틸 장인",     impact: 3.7, when: "항상 · 정글 기준", desc: "오브젝트 장면(바론·드래곤 스틸, 몰래 바론 등) ×2.5, 장면 크기 +40%, 오브젝트 실수 −50%", effects: { evGood: { object: 1.5 }, evBad: { object: -0.5 }, evPower: { object: 0.4 } } },
  { id: "highlight",    type: "good", npc: true, group: "경기", name: "하이라이트 메이커", impact: 2.9, when: "항상", desc: "개인 슈퍼플레이(1대2, 블라인드 스킬샷, 슈퍼 세이브 등) ×3.2, 장면 크기 2배",         effects: { evGood: { play: 2.2 }, evPower: { play: 1.0 } } },
  { id: "machine",      type: "good", npc: true, group: "경기", name: "기계 같은 정확함", impact: 2.7, when: "항상", desc: "실수(페이스체크, 궁 허공, 플래시 실수 등) −80%, 실수해도 피해 −60%, 정교한 슈퍼플레이 ×2",                  effects: { evBad: { all: -0.8 }, evPower: { bad: -0.6 }, evGood: { play: 1.0 } } },
  { id: "map_reader",   type: "good", npc: true, group: "경기", name: "맵 리더",        impact: 2.9, when: "항상 · 탑 기준", desc: "운영 장면(뒷텔, 1-3-1, 시야 장악 후 픽 등) ×4, 장면 크기 2배, 초반 장면 ×1.8",   effects: { evGood: { macro: 3.0, early: 0.8 }, evPower: { macro: 1.0, early: 0.3 } } },

  // ===== 좋은 특성: 솔로 랭크·인기·돈 =====
  { id: "ladder_addict", type: "good", group: "솔로 랭크·인기·돈", name: "솔랭 중독자",  desc: "훈련 중 솔로 랭크 판 수 +50%, 랭크 승률 +5%",              effects: { ladderGames: 0.5, ladderWin: 0.05 } },
  { id: "fan_service",  type: "good", group: "솔로 랭크·인기·돈", name: "팬서비스",      desc: "인기도 상승 +50%",                                     effects: { popularityGain: 0.5 } },
  { id: "star_power",   type: "good", group: "솔로 랭크·인기·돈", name: "스타성",        desc: "이긴 경기마다 인기도 +1 추가",                            effects: { winPopularity: 1 } },
  { id: "negotiator",   type: "good", group: "솔로 랭크·인기·돈", name: "협상가",        desc: "계약 협상 성공률 +20%, 연봉 +10%",                        effects: { negotiate: 0.2, salaryBonus: 0.1 } },
  { id: "late_bloomer", type: "good", npc: true, group: "솔로 랭크·인기·돈", name: "늦게 피는 꽃",  desc: "노화가 2년 늦게 시작 (29세부터)",                       effects: { agingDelay: 2 } },

  // ===== 좋은 특성: 한계 (85 이상 높은 구간에서 더 잘 오름) =====
  { id: "god_hands",    type: "good", group: "한계", npc: true, name: "신의 손",       desc: "반응속도·입력 정확도가 85 이상일 때 성장 ×2",            effects: { topGrowth: { reaction: 1, accuracy: 1 } } },
  { id: "tactician",    type: "good", group: "한계", npc: true, name: "전술 두뇌",     desc: "운영·시야·오더가 85 이상일 때 성장 ×2",                  effects: { topGrowth: { macro: 1, vision: 1, shotcall: 1 } } },
  { id: "battle_sense", type: "good", group: "한계", npc: true, name: "전장의 감각",   desc: "한타·거리 조절이 85 이상일 때 성장 ×2",                  effects: { topGrowth: { teamfight: 1, spacing: 1 } } },
  { id: "lane_king",    type: "good", group: "한계", npc: true, name: "라인의 왕",     desc: "라인전·챔피언 폭이 85 이상일 때 성장 ×2",                effects: { topGrowth: { laning: 1, pool: 1 } } },
  { id: "iron_heart",   type: "good", group: "한계", npc: true, name: "강심장",        desc: "멘탈·집중력·적응력이 85 이상일 때 성장 ×2",              effects: { topGrowth: { mental: 1, focus: 1, adapt: 1 } } },
  { id: "potential",    type: "good", group: "한계", npc: true, name: "무한한 잠재력", desc: "모든 스탯이 85 이상일 때 성장 ×1.5",                     effects: { topGrowth: { all: 0.5 } } },

  // ===== 나쁜 특성 (이벤트로만 생김, 극복 이벤트 있음) =====
  { id: "glass_mental", type: "bad", npc: true, name: "유리멘탈",     desc: "패배 후 컨디션 하락 1.5배, 경기 중 위축이 잘 걸리고 크게 흔들림, 지고 있을 때 실수 ×2", effects: { lossMental: 0.5, psychFragile: 0.6, evBadBehind: 1.0 } },
  { id: "injury_prone", type: "bad", name: "부상 잦음",    desc: "손목 통증 이벤트 확률 2배",                          effects: { injuryRate: 2 } },
  { id: "lazy",         type: "bad", npc: true, name: "게으름",       desc: "모든 훈련 효과 −20%",                                effects: { trainingAll: -0.2 } },
  { id: "stubborn",     type: "bad", name: "고집",         desc: "패치 후 4주 동안 메타 페널티 +8",                     effects: { metaPenalty: 8 } },
  { id: "stage_fright", type: "bad", npc: true, name: "무대 공포증",  desc: "큰 경기에서 실수 ×2, 좋은 장면 −40%, 경기력 −6%",       effects: { bigMatch: -0.06, evBadBig: 1.0, evGoodBig: -0.4 } },
  { id: "scandal",      type: "bad", name: "구설수",       desc: "악성 루머 이벤트 확률 2배",                          effects: { scandalRate: 2 } },
  { id: "inconsistent", type: "bad", npc: true, name: "기복",         desc: "모 아니면 도: 장면 크기 +30%, 좋은 장면 ×1.2지만 실수 ×2.5, 세트마다 경기력 ±10%", effects: { variance: 0.1, evSwing: 0.3, evGood: { all: 0.2 }, evBad: { all: 1.5 }, evPower: { bad: 0.3 } } },
  { id: "slow_starter", type: "bad", npc: true, name: "슬로 스타터",   desc: "시즌 초(1~12주) 경기력 −8%",                         effects: { earlyPenalty: 0.08 } },
  { id: "greedy",       type: "bad", npc: true, name: "과욕",         desc: "무리하다 생기는 실수(바론 버프 들고 무리, 추격하다 역전, 다이브 실패 등) ×8, 실수 크기 +50%", effects: { evBad: { greedy: 7.0 }, evPower: { bad: 0.5 } } },
  { id: "tilt",         type: "bad", name: "랭크 틸트",     desc: "솔로 랭크에서 진 판이 더 많은 주에 컨디션 −3",          effects: { tilt: 3 } },
  { id: "spender",      type: "bad", name: "낭비벽",       desc: "주급의 20%를 써 버림",                               effects: { spend: 0.2 } },
  // ===== 다른 선수 전용 🔒 나쁜 특성 (지울 수 없음, 선수를 만들 때 NPC_TRAITS.lockedChance 확률로 1개) =====
  //   npcLocked: true → 다른 선수 전용, 동료 돕기 이벤트(cureOther)로도 안 없어짐. 화면에 🔒 표시
  //   새 효과: soloWeak(솔로킬을 당하는 기준이 n만큼 쉬워짐) · pickyGrowth(강점 스탯 성장 +n, 약점 스탯 성장 없음)
  //           metaFocus(메타 챔피언 연습 확률 배율, −0.5 = 절반) · offSigGrowth(숙련도 상위 3명 말고는 숙련도 성장 배율)
  { id: "dullard",      type: "bad", npcLocked: true, name: "둔재",        desc: "능력 성장 −50%",                                         effects: { trainingAll: -0.5 } },
  { id: "early_decline", type: "bad", npcLocked: true, name: "조기 노쇠",   desc: "노화가 2년 일찍 시작, 은퇴도 빨라짐",                       effects: { agingDelay: -2 } },
  { id: "glass_body",   type: "bad", npcLocked: true, name: "유리몸",      desc: "노화로 줄어드는 능력 1.5배",                                effects: { agingCut: -0.5 } },
  { id: "hard_ceiling", type: "bad", npcLocked: true, name: "뚜렷한 한계", desc: "85 이상 스탯은 거의 안 오름 (성장 ×0.3)",                    effects: { topGrowth: { all: -0.7 } } },
  { id: "picky_growth", type: "bad", npcLocked: true, name: "편식 성장",   desc: "강점 스탯 성장 +30%, 약점 스탯은 성장 없음",                  effects: { pickyGrowth: 0.3 } },
  { id: "reckless",     type: "bad", npcLocked: true, name: "급발진",      desc: "무리하다 생기는 실수 ×5, 대신 초반 좋은 장면 +30%",            effects: { evBad: { greedy: 4.0 }, evGood: { early: 0.3 } } },
  { id: "chicken_heart", type: "bad", npcLocked: true, name: "새가슴",     desc: "승부처(풀세트·경기 후반) 좋은 장면 −50%, 큰 경기 경기력 −3%",  effects: { evClutch: -0.5, bigMatch: -0.03 } },
  { id: "quitter",      type: "bad", npcLocked: true, name: "쉽게 포기",   desc: "세트 스코어에서 지고 있을 때 경기력 −5%",                    effects: { comeback: -0.05 } },
  { id: "low_stamina",  type: "bad", npcLocked: true, name: "저질 체력",   desc: "풀세트(마지막 세트) 경기력 −8%",                             effects: { clutch: -0.08 } },
  { id: "fight_fear",   type: "bad", npcLocked: true, name: "한타 공포",   desc: "한타 실수 ×2, 한타 좋은 장면 −50%",                          effects: { evBad: { fight: 1.0 }, evGood: { fight: -0.5 } } },
  { id: "weak_laner",   type: "bad", npcLocked: true, name: "초반 약골",   desc: "초반 실수 ×2, 라인전에서 솔로킬을 더 잘 당함",                 effects: { evBad: { early: 1.0 }, soloWeak: 4 } },
  { id: "vision_blind", type: "bad", npcLocked: true, name: "시야 맹",     desc: "오브젝트 싸움 실수 ×2",                                     effects: { evBad: { object: 1.0 } } },
  { id: "call_ignore",  type: "bad", npcLocked: true, name: "콜 무시",     desc: "팀 오더를 안 따름: 우리 팀 전체 실수 확률 +15%",               effects: { teamBad: 0.15 } },
  { id: "meta_slow",    type: "bad", npcLocked: true, name: "메타 부적응", desc: "패치 후 4주 메타 페널티 +8, 메타 챔피언 연습 확률 절반",        effects: { metaPenalty: 8, metaFocus: -0.5 } },
  { id: "one_champ",    type: "bad", npcLocked: true, name: "원챔 의존",   desc: "숙련도 상위 3명 말고는 챔피언 숙련도 성장 −50%",               effects: { offSigGrowth: -0.5 } },
  { id: "night_owl",    type: "bad", name: "올빼미",       desc: "휴식 체력 회복 −30%",                                effects: { restBonus: -0.3 } },

  // ===== 시작 유형 전용 특성 (data/archetypes.js의 startTrait, 정해진 시즌 동안만) =====
  { id: "rookie_bloom", type: "title", name: "🌱 유망주", desc: "유망주 전용 (데뷔 후 2시즌). 모든 훈련 효과 +30%, 모든 챔피언 숙련도 성장 +30%. 3년차 시즌이 시작되면 사라져요", effects: { trainingAll: 0.3, masteryGrowth: 0.3 } },

  // ===== 칭호 (잠깐만 붙는 특성) =====
  { id: "ladder_king", type: "title", npc: true, name: "👑 솔랭 1위", desc: "지난 랭크 시즌 리그 솔로 랭크 1위. 경기력 +3%, 좋은 장면 ×1.15 (다음 랭크 초기화 때 새 1위에게 넘어감)", effects: { power: 0.03, evGood: { all: 0.15 } } },

  // ===== S급 특성 (게임 중 큰 업적으로만 얻음. 다른 선수도 조건을 채우면 얻음) =====
  { id: "s_emperor",   type: "s", npc: true, name: "황제",           desc: "좋은 장면 ×1.9, 장면 크기 +70%, 모든 경기 경기력 +5%, 인기도 상승 +50%",          effects: { power: 0.05, evGood: { all: 0.9 }, evPower: { all: 0.7 }, popularityGain: 0.5 } },
  { id: "s_demon",     type: "s", npc: true, name: "불사대마왕",     desc: "큰 경기에서 좋은 장면 ×2.2, 실수 −70%, 경기력 +12%",            effects: { bigMatch: 0.12, evGoodBig: 1.2, evBadBig: -0.7 } },
  { id: "s_lane_lord", type: "s", npc: true, name: "라인 지배자",    desc: "라인전에서 이기면 팀 보너스 +3, 솔로킬 기준 5 쉬워짐, 초반 장면 ×4(크기 3배), 슈퍼플레이 ×2", effects: { laneBonus: 3, soloEasy: 5, evGood: { early: 3.0, play: 1.0 }, evPower: { early: 2.0, play: 0.5 } } },
  { id: "s_comeback",  type: "s", npc: true, name: "역전의 명수",    desc: "세트 스코어에서 지고 있을 때 좋은 장면 ×2.5, 경기력 +12%",           effects: { comeback: 0.12, evGoodBehind: 1.5 } },
  { id: "s_iron_will", type: "s", npc: true, name: "철의 의지",      desc: "노화로 줄어드는 양 절반, 최대 은퇴 나이 +3",                    effects: { agingCut: 0.5, maxAgeBonus: 3 } },
  { id: "s_one_club",  type: "s", npc: true, name: "원클럽맨",       desc: "경기 시작부터 팀 분위기 +1, 팀원 모두 실수 −15%, 한타 때 팀 전력 +3, 연봉 +30%", effects: { teamMood: 3, teamStartMood: 1, teamBad: -0.15, salaryBonus: 0.3 } },
  { id: "s_breakthrough", type: "s", npc: true, name: "한계 돌파",   desc: "85 이상 스탯 성장 ×2, 노화로 줄어드는 양 −30%",                effects: { topGrowth: { all: 1 }, agingCut: 0.3 } },
  { id: "s_champ_master", type: "s", name: "챔피언 마스터",          desc: "모든 챔피언 숙련도 성장 2배, 메타 페널티 없음",                effects: { masteryGrowth: 1, noMetaPenalty: true } },
  { id: "s_rank_god",  type: "s", name: "랭크의 신",                 desc: "솔로 랭크 승률 +10%, 챌린저인 주마다 인기도 +1",               effects: { ladderWin: 0.1, challengerPopularity: 1 } },
  { id: "s_weed",      type: "s", name: "잡초",                      desc: "나쁜 특성이 생기지 않음, 패배해도 컨디션이 떨어지지 않음",       effects: { badImmune: true, lossMental: -1 } },
  { id: "s_goat",      type: "s", npc: true, name: "GOAT",           desc: "역대 최고. 좋은 장면 ×1.8(크기 +60%), 실수 −60%, 모든 훈련 +30%, 경기력 +3%, 85 이상 스탯 성장 ×1.5", effects: { trainingAll: 0.3, power: 0.03, topGrowth: { all: 0.5 }, evGood: { all: 0.8 }, evBad: { all: -0.6 }, evPower: { all: 0.6, bad: -0.4 } } },
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
  { trait: "s_breakthrough", who: "all",  text: "스탯 6개를 95 이상으로",                       atCap: 6, atLeast: 95 },
  { trait: "s_champ_master", who: "user", text: "숙련도 100인 챔피언 10명",                     mastered: 10 },
  { trait: "s_rank_god",     who: "user", text: "솔로 랭크 3,500점 달성",                       ladder: 3500 },
  { trait: "s_weed",         who: "user", text: "2군(후보)에 내려간 시즌에 우승" },
  { trait: "s_goat",         who: "all",  text: "S급 특성 4개 이상 얻기",                       sCount: 4 },
];

// 다른 선수(NPC) 특성: 선수를 만들 때 무작위로 (npc: true인 특성 중에서)
const NPC_TRAITS = {
  goodCount: [[0, 0.45], [1, 0.4], [2, 0.15]], // [개수, 확률]: 45% 없음, 40% 1개, 15% 2개
  badChance: 0.12,                              // 나쁜 특성 1개가 붙을 확률
  lockedChance: 0.10,                           // 🔒 지울 수 없는 다른 선수 전용 나쁜 특성 1개가 붙을 확률 (위와 따로)
};

// 캐릭터 생성 화면: 포지션마다 추천하는 특성 (⭐ 추천 표시, 순서대로)
const TRAIT_RECOMMEND = {
  top:     ["map_reader", "highlight", "clutch"],
  jungle:  ["steal_master", "born_leader", "map_reader"],
  mid:     ["highlight", "machine", "clutch"],
  adc:     ["machine", "highlight", "clutch"],
  support: ["born_leader", "map_reader", "machine"],
};
