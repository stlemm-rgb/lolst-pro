# 밸런스 조절 값 목록 (2026-10-08, PROGRESS 126 기준)

게임 숫자를 바꿀 땐 **이 표에서 위치를 찾고**, 먼저 `tools/` 측정 도구에 `--set 경로=값`으로 넣어 비교한 뒤, 좋은 값만 파일에 반영한다.
값은 모두 `data/*.js` 상수 (코드 `js/*.js`는 고칠 필요 없음). 값을 바꾸면 이 표의 "지금 값"도 같이 고친다.

## 1. 경기 승패 · 전승 방지

| 경로 | 지금 값 | 뜻 | 측정 도구 |
|---|---|---|---|
| `FOCUS_RULES.userPerS` | 0.15 | 🎯 집중 견제: 내 S급 1개마다 내 좋은 장면 확률 −15% | seasons |
| `FOCUS_RULES.userMin` | 0.35 | 집중 견제 하한 (×0.35 아래로 안 내려감) | seasons |
| `FOCUS_RULES.matePerS` | 0.06 | S급 1개마다 동료 좋은 장면 +6% | seasons |
| `SLUMP_RULES.winRate` | 0.8 | 컨디션 난조(숨김) 조건: 정규 시즌 최근 10경기 승률 | seasons |
| `SLUMP_RULES.chance` | 0.5 | 조건을 채우면 경기마다 난조 확률 | seasons |
| `SLUMP_RULES.goodMult` | 0.2 | 난조 경기 내 좋은 장면 확률 배율 | seasons |
| `MATCH.npcMultiplier` | [0.9, 1.1] | 다른 선수 세트마다 흔들림 | traits |
| `MATCH.metaPowerBonus` | S 0.08 / A 0.03 | 메타 챔피언 경기력 보너스 | traits |
| `MATCH.focusBan` | from 80, base 0.25, per 0.015 | 숙련도 높은 메타 챔피언 견제 밴 | — |
| `TEAM_MATCH.*` | data/match.js | 라인전·운영·한타 점수 가중치 | traits |
| `MATCH_EVENT_RULES.*` | data/match_events.js | 경기 흐름 사건 수·크기 | traits |

측정 기준 (124): 강한 미드(77~82점, 1부 1위 팀) + 3년차 S급 3개 → S급 시즌 시리즈 승률 **약 85%** (77~94%).

## 2. 특성

| 경로 | 지금 값 | 뜻 | 측정 도구 |
|---|---|---|---|
| `TRAIT_FIT.offMult` | 0.5 | 어울리지 않는 포지션의 경기 특성 효과 배율 | traits |
| `TRAIT_FIT.matchLimit` | 1 | 캐릭터 생성 때 경기 특성 수 | — |
| `TRAITS` 각 `fit` | data/traits.js | 경기 특성 8개의 어울리는 포지션 | traits |
| `TRAITS` 각 `effects` | data/traits.js | 특성 효과 숫자 (설명 desc도 같이 고치기) | traits |
| `TRAIT_RECOMMEND` | 포지션별 3개 | 캐릭터 생성 추천 | — |
| `S_TRAIT_RULES` | data/traits.js | S급·라이벌 S급 얻는 조건 (worlds 3, solo 80, top 3, userScore 72 등) | seasons |
| `NPC_TRAITS.goodCount` | 없음 45% · 1개 40% · 2개 15% | 다른 선수 좋은 특성 수 | — |
| `ARCHETYPES[유망주].startTraitSeasons` | 2 | 🌱 유망주 특성 기간 | — |

측정 기준 (124): 경기 특성 맞는 포지션 **+4.1%p** / 안 맞는 포지션 **+1.1%p** (5포지션 평균, 500경기).

## 3. 리그 · 은퇴 · 이적

| 경로 | 지금 값 | 뜻 | 측정 도구 |
|---|---|---|---|
| `LEAGUE.npc.*` | 1부 주전 62±10 등 | 처음 리그 선수 실력 | — |
| `BIG_ROOKIE.tier1Count` | 1 | 해마다 1부로 바로 가는 대형 신인 수 |
| `LEAGUE.veterans` | 팀마다 70%, 28~31세 | 새 게임 노장 | seasons (은퇴 수) |
| `LEAGUE.retireFromAge` / `retireChancePerYear` | 29 / 0.25 | 다른 선수 은퇴 나이·확률 | seasons (은퇴 수) |
| `LEAGUE.npcGrowth` | 나이별 스탯 변화 | 다른 선수 성장·노화 | — |
| `NPC_STAT_SHAPE` | widen 1.6, noise 4, 중요 스탯 평균 +5~+11 | 다른 선수 스탯 차이 크기·포지션 중요 스탯 (점수는 그대로) | traits (기준 승률) |
| `RETIRE_RULES.metaWeek` / `counselWeek` | 50 / 51 | 메타 은퇴 기사 / 은퇴 상담 주 (메타 친구 상담은 49) | — |
| `RETIRE_RULES.counselChance` | 0.2 | 은퇴 상담 확률 | — |
| `RETIRE_RULES.coach` | 훈련 +5%, 2년 뒤 감독, 신뢰 +2 | 친구 코치·감독 효과 | — |
| `CLUB_MARKET.*` | data/contracts.js | 구단 영입·이적료·주전 이적·경쟁 후보 | seasons |
| `CONTRACT.*` | data/contracts.js | 내 계약·제안·2군 | — |

## 4. 연락 · 친구 · 인기

| 경로 | 지금 값 | 뜻 | 측정 도구 |
|---|---|---|---|
| `EVENT_RULES.inboxPerSeason` | 10 | 1년 받은 연락 상한 (always·후속 제외 → 전체 16~19개) | seasons (연락 수) |
| `EVENT_RULES.randomChance` | 0.22 | 연락 없는 주 무작위 연락 확률 | seasons |
| `EVENT_RULES.check` | per 0.025, 10~95% | 🎲 판정 성공 확률 = 50% + (값 − diff) × 2.5% | — |
| `EVENT_RULES.relation` | 절친 50 +0.5%, 최대 ±2% | 주전 동료 케미 | — |
| `FRIEND_RULES.quarters` | 3·16·29·49주 | 분기 친구 활동 | seasons (절친 수) |
| `FRIEND_RULES.friendFrom` / `bestFrom` / `bestMax` | 25 / 50 / 3 | 친구·절친 기준, 절친 칸 | — |
| `FRIEND_ACTIVITIES[].relation` | 6~22 | 활동별 관계 상승 | — |
| `FAME.decay` | floor 20, 주 0.006 | 인기도 자연 감소 | — |
| `REP_TIERS[].trust` | −3 ~ +3 | 평판 등급별 감독 신뢰 | — |

## 5. 팀 내 입지 (data/standing.js)

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `STANDING_RULES.base` | 50 | 기본 |
| `STANDING_RULES.quest` | 완료 +3 / 만료 −4, 최근 10개, ±15 | 퀘스트 |
| `STANDING_RULES.trustMult` | 4 | 평판 등급 감독 신뢰(−3~+3) × 4 |
| `STANDING_RULES.career` | 4강 2 / 준우승 3 / 우승 5, 국제 ×1.5, 최대 15 | 경력 (리그·컵·국제대회 4강 이상, 커리어 전체) |
| `STANDING_RULES.form` | (내 평점 − 동료 평균) × 8, ±10 | 이번 시즌 경기력 |
| `STANDING_RULES.tenure` | 시즌 × 2, 최대 6 | 근속 |
| `STANDING_RULES.captain` | 80 이상 제안, 60 아래 해제, 분위기 +1, +4 − 최근 5경기 패배 × 3, 후보 3명 | 주장 |
| `STANDING_RULES.grades` | 80 +15%·조기 / 60 +5% / 40 0 / 20 −10% / 0 −10%·재계약 없음 | 재계약 연봉·제안 |

측정 기준 (126): 보통 진행(퀘스트 신경 안 씀) 38~52, 강한 선수 50~67. 주장(80+)은 평판·퀘스트·동료 관계를 같이 챙겨야 닿음.

## 6. 연애 (data/romance_rules.js)

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `ROMANCE_RULES.perYear` / `weeklyChance` | 6 / 0.2 | 1년 연애 연락 상한 / 주마다 확률 |
| `ROMANCE_RULES.newPerYear` / `warmChance` / `sameGap` | 2 / 0.7 / 4주 | 새 만남 수 / 기존 관계 이어 가기 / 같은 사람 간격 |
| `ROMANCE_RULES.stage` | 썸 30 · 고백 60 · 위기 25 | 호감 단계 |
| `ROMANCE_RULES.rivalChance` / `rumorChance` | 0.25 / 0.3 | 다른 대상 공세 / 열애설 |
| `ROMANCE_RULES.officePenalty` | 5 | 사내 연애 공개 시 팀 내 입지 − |

## 7. 수집 · 성장

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `WORLDS_SKIN.powerBonus` | 0.02 | 월드 우승 스킨 경기력 |
| `SIGNATURE_GROWTH.stars` / `perStar` | 0·15·40·80·140 / +3·+1%·+5% | 시그니처 ★ |
| `CAREER.aging*` | 27세부터 | 내 선수 노화 |
| `MASTERY.metaKeep` / `metaKeepMine` | 0.25 / 0.5 | 패치 때 메타 챔피언이 남을 확률 / 내 숙련도 1위가 메타였으면 |
| `MASTERY.*` | data/champions.js | 숙련도 성장 |

## 8. 강팀 쏠림 막기 (134, ver 1.1) — data/dynasty.js

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `DYNASTY.raise` | 월드 0.35 · MSI 0.15 · 리그 0.2 · FS 0.1 · 컵 0.05 | 우승 팀 주전 새 시즌 연봉 인상 (더함) |
| `DYNASTY.perS` / `max` | 0.1 / 0.8 | S급 1개당 추가 / 최대 인상 |
| `DYNASTY.leave` / `leavePerS` / `maxLeave` | 0.12 / 0.05 / 2 | FA 선언 확률 / 팀당 최대 (구단 여유 < 0이면 협상 결렬) |
| `ABROAD.base` / `perS` / `champ` / `max` | 0.04 / 0.06 / 0.08 / 0.35 | 해외 진출 확률 |
| `ABROAD.perYear` / `perTeam` / `maxAge` | 3 / 1 / 29 | 한 해·팀당 최대, 나이 |
| `SCOUTED.power` | 0.03 | 지난 월드 우승 팀 다음 시즌 경기력 − |
| `OVERSEAS_DYNASTY.moves` | 2 | 🌏 해외 팀이 월드 우승하면 새 시즌에 그 팀 주전 중 강한 n명을 같은 지역 다른 팀 주전과 맞바꿈 (169) |
| `PRIZE_SHARE.share` | 0.5 | 상금 중 선수단 몫 |
| `DECOY.perS` | 0.25 | 견제받는 선수의 미끼 장면(도주·생존·존야…) 배율 S급당 |
| `FOCUS_RULES` (data/match.js) | userPerS 0.15 · userMin 0.35 · matePerS 0.06 | 집중 견제 — 이제 다른 선수도 받음 |

측정 기준 (유망주 2부 2012 시작, 10시즌 × 씨앗 11·22·33): 한 선수 S급 최대 3~6, 같은 국내 팀 월드 최다 2회, 1위 구단 자금 16~20억, 10년 FA 선언 10~13명·해외 진출 6~13명.

## 9. 챔피언 숙련도·메타 (147, ver 1.1) — data/match.js

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `CHAMP_EV.pow` | 3 | 손맛: 좋은 장면 × cf^3, 실수 × cf^−3 (cf = 숙련도 배율 × 메타 보너스 × 조커·시그니처 − 메타 페널티 비율) |
| `MATCH.metaPowerBonus` | S 0.15 · A 0.08 | 메타 챔피언 경기력 (예전 0.08 · 0.03) |
| `MATCH.metaPenaltyDiv` | 2 | 메타 페널티 = (60 − 메타 평균 숙련도) ÷ 이 값 (예전 4) |
| `MATCH.jokerPowerBonus` | 0.03 | 조커픽 경기력 (예전 0.05) |

측정 기준: 미드 종합 70, 1부 가운데 팀, 씨앗 1·3·5 × 1,000경기, 컨디션 난조 끔. 숙련도 20→100 +19.7%p, 메타 90·나머지 40 vs 메타 40·나머지 90 +8.9%p (예전 +6.8 / −2.1).

## 10. 월드 우승 국내 vs 해외 (168) — tools/measure_worlds.py

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `WORLD_REGIONS[0~2].strength` | 0.92 (169, 예전 0.94) | 북미·유럽·중국 수준 (우리 리그 1부 평균 = 1.0). `--set WORLD_REGIONS.0.strength=0.92` (0 북미 · 1 유럽 · 2 중국) |
| `WORLD_REGIONS[3~].strength` | 0.86 | 나머지 지역 |
| `WORLD_RULES.topBonus` | 1.08 … 0.90 | 지역 안 순위별 처음 전력 (1번 팀이 계속 강하게 남음) |
| `WORLD_RULES.tierPull` | 0.5 | 새해마다 지역 출신 평균을 목표 수준 쪽으로 |
| `ABROAD.*` · `DYNASTY.*` · `SCOUTED.power` · `OVERSEAS_DYNASTY.moves` | 8장 | 우승팀 흩어지기 (해외 우승팀은 SCOUTED + OVERSEAS_DYNASTY) |

아직 코드에 없는 수정안은 변형에 `@이름=값`으로 시험: `@flat=0.3`(새해마다 해외 팀을 지역 평균 쪽으로 30%) · `@noise=2`(해외 팀 전력 ±2 흔들림) · `@ovdyn=2`(해외 월드 우승팀 주전 강한 2명 같은 지역 다른 팀으로).

```
python3 tools/measure_worlds.py --years 2012,2017,2022 --seeds 1,2,3,4,5,6 --seasons 10 --jobs 2 \
  --variant "지금" --variant "지역0.92:WORLD_REGIONS.0.strength=0.92;WORLD_REGIONS.1.strength=0.92;WORLD_REGIONS.2.strength=0.92" \
  --variant "B+C:@flat=0.3;@noise=2;@ovdyn=2" --out /tmp/w.json
python3 tools/measure_worlds.py --report /tmp/w.json          # 저장한 결과로 표만 (쉼표로 여러 파일)
```

측정 기준 (변형마다 180시즌, 국내 우승 % 오차 약 ±3.5%p): 168(적용 전) 국내 59% · 연속 우승 판 7/18 · 국제 세트 64.8% → **169(지금) 국내 80% · 같은 해외 팀 2회+ 판 2/18 · 연속 0/18 · 국제 세트 70.0%**. 목표(사용자): 국내 70~80%, 같은 해외 팀 연속 우승 드물게. `@ovdyn` 시험은 이제 코드에 들어간 C와 겹치니 비교할 땐 `OVERSEAS_DYNASTY.moves=0`으로 끄고 잴 것.

## 11. 구단 스태프 (173) — data/staff.js

| 경로 | 지금 값 (S, A, B, C, D) | 뜻 |
|---|---|---|
| `STAFF_EFFECTS.manager.power` | 0.01 · 0.005 · 0 · −0.005 · −0.01 | 감독: 주전 경기력 배율 |
| `STAFF_EFFECTS.coach.growth` | 0.12 · 0.06 · 0 · −0.05 · −0.10 | 코치: 그 팀 선수 해마다 성장(오르는 쪽) |
| `STAFF_EFFECTS.coach.training` | 0.05 · 0.025 · 0 · −0.025 · −0.05 | 코치: 내 훈련 효과 |
| `STAFF_EFFECTS.analyst.accuracy` | 0.9 · 0.8 · 0.7 · 0.6 · 0.5 | 분석 리포트 적중 확률 (+개인 분석가 0.1, 최대 0.95) |
| `STAFF_EFFECTS.facility.stamina` | 2 · 1 · 0 · 0 · 0 | 내 체력 매주 회복 |
| `STAFF_RULES.upkeep` / `upgradeCost` / `upgradeKeep` / `upgradeChance` | S 0.1·A 0.05 / 0.05~0.4 / 0.3 / 0.6 | 예산 대비 유지비·투자 비용, 투자 조건·확률 |
| `STAFF_RULES.poachChance` / `drift` / `debtDownChance` | 0.5 / 0.08 / 0.5 | 우승팀 스태프 이적, 자연 변동, 빚일 때 하락 |

측정 기준 (2012 2부 유망주 10시즌 × 씨앗 18, 효과 켬 vs 효과 0 `--set STAFF_EFFECTS.manager.power=[0,0,0,0,0]` 등): 리그 최다 우승 3.33 vs 3.06, 월드 최다 2.72 vs 2.72, 월드 국내 69% vs 73%, 상위 3팀 감독+코치 등급 3.89 vs 하위 3팀 3.92, 1·10위 전력 차 4.9 vs 5.2 → 쏠림 차이 없음 (오차 ±0.2~0.3). 효과를 키우면 이 표로 다시 비교할 것.
