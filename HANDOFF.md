# 다음 세션 이어가기 — 2026-10-08, PROGRESS 120까지

새 세션(Claude Code·Codex 등 이 PC의 로컬 AI)은 **이 파일 → PROGRESS.md(맨 아래 114~120) → CLAUDE.md → 필요하면 GAME_PLAN.md** 순서로 읽고, 실제 git 상태부터 확인한다.

## 1. 프로젝트와 사용자 작업 방식

- 게임: 오프라인 텍스트 시뮬레이션 「프로게이머 커리어」. 저장소 `C:\Project\Game\Game`, `index.html`을 브라우저에서 직접 열어 실행.
- 사용자(Shane)는 코딩 초보. **항상 짧고 쉬운 한국어 + 표**로 설명 (영어로 답하면 "한글로 다시"라고 함).
- 명확한 수정 요청·버그 신고·"~를 삭제해 줘" 같은 요청은 바로 진행한다.
- 큰 기능이나 "왜 이렇지?" 같은 원인 질문: 먼저 시뮬레이션으로 원인을 측정 → 표로 설명 → 고칠 범위를 여러 개 고를 수 있게 선택지로 묻는다. 사용자는 추천안을 대부분 전부 고르는 편이다.
- 아이디어 질문("~할 만한 게 있을지?")이면 표로 후보를 제시하고 사용자가 고르게 한다.
- 새 화면은 숨겨진 탭보다 **왼쪽 메뉴**에서 바로 보이게 한다 (기존 화면에 카드를 추가하는 건 괜찮음).
- **커밋은 사용자가 직접** 한다. 직접 커밋하지 말고 답변 끝에 아래 형식으로 준다 (CLAUDE.md의 자동 커밋 규칙보다 이 방식이 우선).

```powershell
cd C:\Project\Game\Game
git add -A
git commit -m "이번 변경을 설명하는 한국어 메시지"
```

- 커밋 여부는 `git status --short`, `git log`로 확인. PROGRESS.md의 `(커밋 필요)` 표시는 커밋 뒤에도 남아 있으므로 믿지 않는다.
- "검토만" 요청이면 결과만 설명. 다른 AI·도구의 검토 결과를 붙이면 코드로 확인해서 답한다.

## 2. git 상태 (작성 시점)

- 113 + 이전 HANDOFF.md까지는 커밋된 것으로 확인했다.
- **114~120과 이 HANDOFF.md는 작성 시점에 커밋 여부 미확인** (사용자가 중간에 했을 수 있음). 새 세션에서 반드시 `git status`로 확인할 것.

## 3. 최근 변경 (114~120, Claude 클라우드 세션에서 작업)

| 번호 | 내용 | 주요 파일 |
|---|---|---|
| 114 | 조커픽 2명 제한 + ✒️ 시그니처 픽 (숙련도 100 독백 → 선택, 좋은 장면 1번 보장, 선밴, 대격변 보호) | data/match.js, js/signature.js, js/champions.js, js/npc_mastery.js |
| 115 | 버그: 대회 시작 주 '이번 주 경기 없음' → 대진 미리 만들기 PRE_WEEK_EVENTS/prepareWeek | js/matchsim.js, js/main.js |
| 116 | [선수 정보] 능력 탭 스탯 12각형 (리그 평균 / 같은 포지션 평균 비교) | js/player_page.js, css |
| 117 | 이적 시장 활성화: 💥 1부 팀끼리 주전 이적, 🧩 경쟁 후보 영입(내 포지션 포함), 📋 이적 목록 | js/club_market.js, data/contracts.js(CLUB_MARKET.star·depth), js/market_pages.js |
| 118 | 수집·강화: 🎨 월드 우승 스킨(경기력 +2%), ✒️ 시그니처 ★1~★5 성장, 🏅 업적 도감 47개. 왼쪽 메뉴 '수집' 묶음 | data/collection.js, js/collection.js |
| 119 | **받은 연락 리뉴얼**: 반복·개수 조절, 결과 이야기, 🎲 능력치 판정, 연작, 시즌 흐름 연락, 시스템 연결 연락, 🤝 선수 관계·팀 케미, 선수 생활 연락 (연락 60 → 109개) | data/events.js, data/events_story.js, data/events_life.js, js/events.js, js/stories.js |
| 120 | 업적 보상(인기도·평판·돈) 삭제 — 업적은 소식만, 동·은·금은 난이도 표시 | data/collection.js, js/collection.js |

자세한 수치·측정은 PROGRESS.md 114~120 참고.

## 4. 기술 규칙과 코드 위치

### 공통
- 순수 HTML/CSS/JS. 외부 라이브러리·CDN·웹 폰트·빌드 도구 금지. `file://` 실행 유지 → fetch·ES module 금지. 차트는 SVG 직접.
- 데이터는 data/*.js 상수, 로직은 js/*.js. index.html script 순서를 지키고 새 js는 start.js 앞에. `pages`는 main.js에서 만들어지므로 `pages.x = ...`를 하는 파일은 main.js 뒤.
- 저장은 localStorage. **새 최상위 필드는 js/save.js의 SAVED_FIELDS와 stateFromSave 둘 다** 수정. state.league·soloRank·contract는 통째로 저장 (league 안에 넣은 필드는 따로 등록 불필요). career 숫자 필드는 stateFromSave 숫자 키 목록에.
  - 최근 추가된 최상위 필드: signature·sig100 (114), sigGrowth·achievements (118), eventLog·flags·relations·trigQueue (119).
- 초기 상태 createNewState는 js/main.js, 캐릭터 생성·첫 계약은 js/creation.js. 화면 pages.<id>, 메뉴 data/menus.js MENU_GROUPS (내 선수 / 경기 / 수집 / 이적 / 기록), 이동은 selectMenu.
- 화면 안 버튼 클릭은 js/main.js renderPage 안의 `querySelectorAll("[data-…]")` 묶음에 추가 (예: data-radar, data-tlog-year).
- 특성: traitSumOf / traitKeyOf / traitsOf. 내 선수 ID는 USER_ID.
- 주간 흐름은 js/main.js nextWeek: 훈련 → 경기 → 급여·활동·인기도·업적 → 주 넘김(새해면 새 시즌) → 대진 미리 만들기 → 새 챔피언·패치 → 2군 판정·올스타·여름/비시즌 시장 → 시그니처 체크 → 받은 연락(runWeeklyEvents) → 퀘스트.

### 경기 일정
- 리그 대진 짜기(LCK 컵 2주·정규 시즌 13주·후반기 30주)는 js/matchsim.js PRE_WEEK_EVENTS + prepareWeek(week) — 그 주와 다음 주를 미리 만든다. 앞 라운드 결과가 필요한 토너먼트는 WEEK_EVENTS + koPreview/intlPreview. 새 대회를 추가할 때 이 규칙을 지켜야 '이번 주 경기 없음' 버그가 안 생긴다.

### 이적 시장 (117)
- js/club_market.js, 값 data/contracts.js CLUB_MARKET. 비시즌: offseasonRebuild = fireSale → starTransfers(1부 주전 이적) → 보강 라운드 tryBuy → depthSignings(경쟁 후보, 내 포지션 포함) → fillRosters.
- 여름(23~28주, 29주 적용)은 js/summer_market.js. 모든 NPC 이동은 npcTransfer/tryLoan에서 logTransfer → state.league.transferLog → [이적 시장] 📋 이적 목록.
- 47주 순서: NPC 성장 → 구단 정산 → 내 계약 제안 (다음 시즌 리그는 nextTier/nextTierName, 계약 연도는 contractYear).

### 수집·강화 (118, 120)
- 월드 우승 스킨: state.league.worldsSkins (playMatch가 '월드 결승' 세트 픽을 m.finalPicks에 남김 → koFinal에서 recordWorldsSkins). mySkins / skinPowerBonus.
- 시그니처 성장: state.sigGrowth {xp, sets, wins}. 보너스 값은 반드시 sigValue(key) 사용 (MATCH.signaturePick을 직접 쓰지 말 것).
- 업적: state.achievements {id: {y, w}}, checkAchievements 매주. **보상 없음 (사용자 요청으로 120에서 삭제) — 다시 넣지 말 것.**

### 받은 연락 (119)
- 데이터: data/events.js(EVENT_RULES·ACTIVITIES·기본 연락) + data/events_story.js(시즌 흐름·시스템 연결·연작) + data/events_life.js(선수 생활·관계). 모두 EVENTS 배열에 들어간다. 맨 위 주석에 모든 키 설명이 있다.
- 엔진: js/events.js(eventReady·fireEvent·runWeeklyEvents·answerMessage·applyEffects·choiceHint·whoContext·fillText) + js/stories.js(연락 기록·능력치 판정·조건·관계·시즌 트리거·시스템 트리거 큐).
- 횟수: 같은 연락은 한 시즌 seasonMax(기본 1)번, 시즌 받은 연락 상한 inboxPerSeason 10 (always·followUp·signature 제외), 한 주 선택지 연락 1개. 결과적으로 1년 약 16~19개.
- 선택지: `result`(결과 이야기), `check {stat, diff}` + `success/fail`(능력치 판정), `followUp {event, weeks, chance}`(ctx가 그대로 넘어가 연작에서 {player} 유지). 효과 키 추가: flag / unflag / relation / teamRelation / salaryRaise.
- 새 트리거: 주차형은 stories.js storyTriggerContext, 시스템형은 다른 코드에서 `queueTrigger(name, ctx)` (경쟁자 합류·스타 등급·우승 스킨·2군 통보·친한 동료 이적). 새 시스템형은 QUEUE_TRIGGERS에 이름 추가.
- 관계: state.relations {선수 id: −100~100}. 주전 동료 절친(50↑) +0.5%, 앙숙(−50↓) −0.5% 내 경기력 (최대 ±2%). [소속팀] 화면 맨 아래 🤝 선수 관계 카드.
- 데이터 파일 작성 뒤 확인할 것: `node --check`, EVENTS id 중복 없음, followUp 대상 id가 존재, check.stat이 스탯 id 또는 reputation·popularity·condition·stamina·score.

## 5. 실행 환경과 검증

- 이 PC에서는 PowerShell·Node로 저장소 파일을 직접 수정하면 된다 (클라우드 세션의 업로드/커밋 절차는 필요 없음).
- 문법 검사: 바뀐 JS마다 `node --check`, 변경 내용은 `git diff --check`.
- 이전 Codex 세션 메모: Playwright + Edge headless가 중간에 종료되어 화면 검증을 못 했고, 대신 Node vm으로 index.html 순서대로 스크립트(start.js 제외)를 불러 게임 함수를 실행했다 (DOM 렌더링만 대체).
- 클라우드 세션에서는 Playwright(Chromium)로 화면까지 확인했다. 쓸 수 있으면 이 방법이 가장 확실하다:
  - 새 게임: `draft.name='테스트'; draft.startYear=2012; renderCreation(); startCareer();` (**시작 연도는 2012·2017·2022만** 가능). 1부 팀: `draft.teamChoice = draft.teams.findIndex(d=>d.tier===1)` (startCareer 전).
  - 강한 내 선수: startCareer 뒤 `Object.keys(state.stats).forEach(k=>state.stats[k]+=33)`.
  - **state.plan이 있어야 nextWeek()가 진행된다** (`state.plan='scrim'`, 체력 30 미만이면 'rest').
  - 연락 자동 답: `state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id, 0))`.
  - 새 시즌 소식 팝업(#news-popup)이 클릭을 가리면 제거. 저장 확인은 `saveGame(); loadGame();` 전후 비교.
  - 1시즌 시뮬 ≈ 1~2분.
- 은퇴·삭제된 선수 id가 relations 등에 남을 수 있다 → playerName 전에 `state.league.players[id]` 확인.
- 무작위 시뮬레이션 결과(순위·금액)를 고정 기대값으로 쓰지 않는다.

## 6. 로드맵 (사용자가 고르기 전 큰 확장 시작 금지)

1. ~~받은 연락 선택지 이벤트~~ → 119에서 완료.
2. **퀘스트 완료 횟수에 따른 팀 내부 평가** (managerTrust·relations와 함께 설계 여지).
3. **구단 능력치**: 감독·코치 점수, 시설, 구단 평가. (이전 추천: 2와 묶어서)
4. **해외 리그 확장**은 사용자 요청 시: 국제대회 해외 선수 이름·평점·POG → 지역 순위 → 해외 영입·이적 → 내 선수 해외 진출. (119의 '해외 구단 러브콜' 연작은 아직 실제 이적이 없음 — 확장 때 연결)

원하면 제안할 수 있는 작은 아이디어:
- 연락: 관계를 다른 화면에도 표시, 라이벌 맞대결 전적, 연작 추가, 연락 도감.
- 이적: 후보 생성 수준 올리기(LEAGUE.npc.tier1Sub 52, rookie 46 — 117 때 사용자가 선택 안 함).
- 수집: 시즌 선수 카드, 칭호, 장비 Lv4~5 튜닝, 숙련도 배지 (118 때 선택 안 함).
- 12각형: 다른 선수와 비교.

## 7. 밸런스 메모

- 1부 평균 전력 2013 약 64.8 → 2020 약 72.7 → 2026 약 74.4 (사용자 수용).
- 인기도가 너무 쉽게 오른다고 하면: 연락의 popularity 값, 경기 승리 인기도, 자연 감소를 검토 (업적 보상은 이미 삭제).
- 117 이후 비시즌 직후 빚 있는 구단 2~5팀 (한도 안). 많으면 CLUB_MARKET.depth.chance 낮추기.
- 연락이 많다고 하면 EVENT_RULES.inboxPerSeason, media_day chance 줄이기.
- 대격변·합숙·특성·새 챔피언·성장·엔딩 난이도·내 선수가 너무 강한지는 실제 플레이 피드백으로 조정.
- 팬 선물 이벤트 밸런스는 사용자가 추후 언급 예정이므로 먼저 꺼내지 않는다.

## 8. 다음 세션 시작 시

1. `git status --short`, `git log --oneline -10`으로 114~120·HANDOFF 커밋 여부 확인.
2. 새 사용자 요청을 우선한다. 현재 요청된 작업은 모두 끝났고, 로드맵의 다음 기능은 미선택 상태다.
3. 큰 변경 뒤에는 PROGRESS.md 맨 아래에 번호를 이어 붙여 기록하고(다음 번호 121), 이 HANDOFF.md도 갱신한다.
