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
| `LEAGUE.veterans` | 팀마다 70%, 28~31세 | 새 게임 노장 | seasons (은퇴 수) |
| `LEAGUE.retireFromAge` / `retireChancePerYear` | 29 / 0.25 | 다른 선수 은퇴 나이·확률 | seasons (은퇴 수) |
| `LEAGUE.npcGrowth` | 나이별 스탯 변화 | 다른 선수 성장·노화 | — |
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
| `STANDING_RULES.mates` | 관계 평균 × 0.24, ±12 | 동료 관계 |
| `STANDING_RULES.form` | (내 평점 − 동료 평균) × 8, ±10 | 이번 시즌 경기력 |
| `STANDING_RULES.tenure` | 시즌 × 2, 최대 6 | 근속 |
| `STANDING_RULES.captain` | 80 이상 제안, 60 아래 해제, 분위기 +1, +4 − 최근 5경기 패배 × 3, 후보 3명 | 주장 |
| `STANDING_RULES.grades` | 80 +15%·조기 / 60 +5% / 40 0 / 20 −10% / 0 −10%·재계약 없음 | 재계약 연봉·제안 |

측정 기준 (126): 보통 진행(퀘스트 신경 안 씀) 38~52, 강한 선수 50~67. 주장(80+)은 평판·퀘스트·동료 관계를 같이 챙겨야 닿음.

## 6. 수집 · 성장

| 경로 | 지금 값 | 뜻 |
|---|---|---|
| `WORLDS_SKIN.powerBonus` | 0.02 | 월드 우승 스킨 경기력 |
| `SIGNATURE_GROWTH.stars` / `perStar` | 0·15·40·80·140 / +3·+1%·+5% | 시그니처 ★ |
| `CAREER.aging*` | 27세부터 | 내 선수 노화 |
| `MASTERY.*` | data/champions.js | 숙련도 성장 |
