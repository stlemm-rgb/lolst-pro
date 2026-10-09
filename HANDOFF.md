# 다음 세션 이어가기 — 2026-10-09 작성, PROGRESS 163까지 (ver 1.1 작업 중, 아직 push 전)

새 세션(Claude Code·Codex·Claude 클라우드 세션 무엇이든)은 **이 파일 → PROGRESS.md 134~163 항목 → CLAUDE.md → 필요하면 GAME_PLAN.md** 순서로 읽고, 먼저 실제 git 상태를 확인한다.

## 0. 지금 상태 한눈에

| 항목 | 상태 |
|---|---|
| 저장소 폴더 | **`C:\Project\Game\Game`** (한 단계 안쪽. 명령 안내도 이 경로로) |
| GitHub에 올라간 것 | 133까지 = **ver 1.0** (git 태그 `v1.0`, 아직 태그는 push 안 됨) |
| 지금 작업 | **ver 1.1** = 친구 피드백 수정 + 해외 리그 ①~③단계. PROGRESS 134~161. 사용자가 커밋은 하고 있지만 **push는 ver 1.1이 다 끝나면 한 번에** (사용자 결정) |
| 화면 버전 표시 | index.html 로고 아래 `ver 1.1` (버전을 올리면 같이 바꿈) |
| 다음 버전 ver 1.2 | **④ 내 선수 해외 진출 + 내 언어 실력** (사용자 결정으로 미룸) |
| 마지막 요청 | 149 평판 등급 하락 유예 · 150 월드 우승 스킨 고르기 · 151 대시보드 훈련 줄 삭제 · 152 리핏 기사 · 153 종합 능력 칸 이번 주 변화 · 154 솔로 랭크 칸 이번 주 결과 · 155 트로피 말풍선 · 156 안 열리는 일정 반투명 · 157 퀘스트 보상 실제 값 표시 · 158 팬 수 리뉴얼 · 159 팬 돌파 기사 교체(다른 AI 글) · 160 후보 구성 규칙 — 끝남. 161 뉴스 공통 처리 2단계 완료. 163 리그 성장 뉴스·팬 유입 4단계 완료, 최신 인계는 12장 |

## 1. 사용자와 작업 방식

- 게임: 오프라인 텍스트 시뮬레이션 「프로게이머 커리어」. `index.html`을 브라우저에서 직접 열어 실행. 친구들은 웹 주소로 플레이.
- 사용자(Shane)는 코딩 초보. **항상 짧고 쉬운 한국어 + 표**로 설명 (영어로 답하면 "한글로 다시"라고 함).
- PC에서 **Claude Code도 같이 쓴다.** 두 AI가 번갈아 같은 파일을 고치면 한쪽 수정이 옛 내용으로 덮일 수 있음 (135 때 실제로 있었음). 작업 시작 전 `git status`/`git diff`로 최신 상태를 보고 파일을 다시 읽는다.
- 명확한 수정 요청·버그 신고는 바로 진행.
- 큰 기능·"왜 이렇지?" 질문: **먼저 시뮬레이션으로 측정 → 표로 원인 설명 → 선택지(여러 개 고를 수 있게)로 묻기.** 사용자는 추천안을 대부분 고르지만, "각 선택지별로 자세히 설명", "수치 측정부터 다시"처럼 되묻기도 한다 → 그때는 후보별로 숫자 비교표를 만들어 다시 묻는다.
- 아이디어 질문이면 표로 후보 제시 → 사용자가 고름. 사용자가 다른 청사진을 요청하기도 함 (플레이를 막는 제한보다 자연스러운 장치를 선호, 134).
- 새 화면은 숨은 탭보다 **왼쪽 메뉴**에 바로 보이게.
- **커밋은 사용자가 직접.** 답변 끝에 아래 형식으로 준다 (CLAUDE.md의 자동 커밋 규칙보다 우선).

```powershell
cd C:\Project\Game\Game
git add -A
git commit -m "ver 1.1: 이번 변경을 설명하는 한국어 메시지"
```

- 커밋 여부는 `git status --short`, `git log`로 확인 (PROGRESS.md의 `(커밋 필요)` 표시는 믿지 않음).
- 다른 AI의 검토 결과를 붙여 주면 코드로 확인해서 답한다.

### ⭐ '작업완료' 규칙

사용자가 **"작업완료"**라고 하면 답변 끝에 항상 다시 알려 준다 (짧은 한국어 + 표):

| 순서 | 할 일 | 명령 |
|---|---|---|
| 1 | 커밋 | `git add -A` → `git commit -m "..."` |
| 2 | GitHub에 올리기 (웹 주소도 1분 뒤 자동 업데이트) | `git push` |
| 2-1 | **태그도 올리기 (v1.0, 이후 v1.1 등)** | `git push --tags` (`git push`만으로는 태그가 안 올라감) |
| 3 | 다른 PC에서 작업 시작 전 | `git pull` |

- push가 `rejected`면 `git pull` 후 다시 push. 충돌이 나면 화면을 보여 달라고 안내. 한 번에 한 PC에서만 작업 권장.
- 세이브(브라우저 localStorage)는 git으로 안 옮겨짐 → 세이브 내보내기·가져오기.
- ver 1.1을 올릴 때 권장: 마지막 커밋 뒤 `git tag v1.1` → `git push` → `git push --tags`.

## 2. GitHub · 웹

- 저장소: https://github.com/stlemm-rgb/lolst-pro (공개, 브랜치 `master`, remote `origin`).
- 웹 주소 (GitHub Pages, 친구 플레이용): **https://stlemm-rgb.github.io/lolst-pro/** — push 1분쯤 뒤 반영. 친구는 새로고침(이상하면 Ctrl+F5). 세이브는 주소가 같으면 유지됨. GitHub Pages 캐시가 약 10분이라 옛 파일·새 파일이 섞이면 Ctrl+F5.
- 소스 보기 감추기(난독화)는 공개 저장소라 의미가 거의 없다고 안내함. 원하면 비공개 저장소(유료 Pages) 등 선택지를 설명했음 — 사용자가 고르지 않음.
- Claude 아티팩트 링크(https://claude.ai/artifact/VS5wFNae86znoPr7vjp7UQ)는 로그인이 필요하고 자동 업데이트 안 됨.

## 3. ver 1.1 변경 (134~160) — 자세한 수치는 PROGRESS.md

| 번호 | 내용 | 주요 파일 |
|---|---|---|
| 134 | 친구 피드백 '강팀 쏠림': 🔥리그의 에이스·🏰왕조의 심장 1년짜리, 🎯집중 견제를 S급 가진 다른 선수에게도(+미끼 장면·해설 외침), 🔍월드 우승팀 다음 시즌 −3%, 💸왕조 연봉 압박(FA 선언·협상 결렬), ✈️해외 러브콜, 💰상금 절반 선수 몫. 🐞평판이 나빠 커리어 점수 음수면 매주 멈추던 버그 | data/dynasty.js, js/dynasty.js, js/straits.js, js/match_events.js, js/match_detail.js |
| 135 | 새 게임 훈련 기본값 솔로 랭크, 처음 안내 1단계 '훈련 바꿔 보기'(다른 훈련으로 바꿔야 완료, tutorial.startPlan) | js/main.js, js/guide.js, data/guide.js, js/creation.js |
| 136 | 네임드 선수 Jimul(원딜)·Kibai(탑) 추가 → 7명. 같은 포지션 네임드는 다른 팀 | data/named_players.js, js/league.js |
| 137 | 훈련 특성: 천재적 감각 +12%, 전문 특성 = 훈련 하나의 스탯 3개 +30% (라인전 괴물=솔랭, 냉철한 판단=스크림, 분석의 눈(예전 빠른 손, id fast_hands)=리플레이) | data/traits.js |
| 138 | 2012년 시작 2주차 리그 규모 소개 신문 기사 | data/era.js ERA_INTRO, js/era.js |
| 139 | 해외 리그 ①: 국제대회 해외 팀도 실제 선수 5명, findPlayer가 해외 선수(id 'X…')도 찾음, 해외 선수 숙련도. 지역 3단계 수준 (우리 리그 1.0 > 중국·북미·유럽 0.94 > 나머지 0.86) | js/matchsim.js, js/era.js, js/league.js, js/npc_mastery.js |
| 140 | 출신 리그 태그 p.origin('kr' 또는 지역 id)·모국어. 수준 맞추기를 출신 기준으로 (해외로 간 한국 선수는 실력 유지) | data/era.js, js/era.js |
| 141 | 해외 리그 ②: 38주 지역 우승·MVP 기사, [해외 리그] 화면 스타·역대 우승, 해외 선수 이름 링크, 지역 순위 운 ±4 | js/era.js, js/links.js, js/market_pages.js |
| 142 | [선수 검색] 출신 칸·출신 필터·'🌏 해외 리그' 검색, 이적 목록 출신 칸 | js/market_pages.js, js/club_market.js |
| 143 | 라이벌 전용 특성 규모 = 내 S급 수 (0개 → 에이스·왕조 없음 / 1개 → 에이스 1명+왕조 / 2개 이상 → 에이스 3명+왕조) | data/traits.js RIVAL_SCALE, js/straits.js |
| 144 | 해외 리그 ③: 외국인 1명 제한, 국내 구단 해외 선수 영입, 국내 FA 해외행, 해외 진출 한국 선수 복귀·외국인 선수 고향행, 🗣️언어 소통(운영·한타 −, 콜 충돌 ↑, 해마다 +35) | js/world_moves.js(새), data/era.js WORLD_MOVES·LANG_RULES |
| 145 | 해외 지역 간판 스타(지역 상위 5명)는 국내 영입 불가 | js/world_moves.js, data/era.js |
| 146 | 50주 메타 적응 은퇴 기사: 1부 주전 평균보다 잘하는 선수만, 이름(종합 능력) 표시 | js/retirement.js |
| 147 | 숙련도·메타 강화 (사용자 선택 D): 🎮손맛(챔피언 배율 cf → 좋은 장면 ×cf³·실수 ×cf⁻³), 메타 S15%/A8%, 메타 페널티 ÷2, 조커 3% | data/match.js CHAMP_EV, js/match_events.js, js/matchsim.js, js/npc_mastery.js |
| 148 | 역전의 명수: 판정은 정확(5,500경기 시험). 역전마다 소식 '역전의 명수 n/2', 획득 연락·선수 정보에 어떤 경기였는지 | js/straits.js, js/player_page.js |
| 149 | 평판 등급이 오르면 4주 하락 유예 (state.fame.repHold, REPUTATION.holdWeeks) | js/fame.js, data/fame.js |
| 150 | 월드 우승 스킨: 결승 모든 세트 기록, 다른 선수는 결승 챔피언 중 무작위, 내 선수는 [컬렉션]에서 직접 고름 | js/collection.js, js/matchsim.js, js/main.js |
| 151 | 대시보드 '이번 주' 훈련 줄 삭제 (미선택이면 💡 추천 줄) | js/dashboard.js, js/guide.js |
| 152 | 연속 우승 결승 기사 리핏·쓰리핏… (state.league.titleStreaks, REPEAT_NEWS) | js/news_popup.js, data/news_articles.js |
| 153 | 대시보드 종합 능력 칸: 이번 주 스탯·특성 변화만 (weekReport.growthBase) | js/dashboard.js, js/main.js |
| 154 | 솔로 랭크 이번 주 결과를 대시보드 솔로 랭크 칸으로 옮김 | js/dashboard.js, css/style.css |
| 155 | 트로피 말풍선 아래로 (상단바에 가려짐) | css/style.css |
| 156 | 올해 안 열리는 일정·대회 반투명 + '올해 없음' (scheduleOffReason) | js/main.js, js/league_pages.js, js/records_pages.js |
| 157 | 퀘스트 완료 줄에 실제 오른 값(모범생·90 이상 보상 감소 반영), 이번 주 변화에 전후 값 | js/quests.js, js/dashboard.js |
| 158 | 팬 수 따로 쌓기(addPopularity, 인기도 100 넘게 오른 만큼도), 우승 팬 보너스, 1억부터 완만, 1,000만·5,000만·1억 공중파 기사 | js/fame.js, data/fame.js + 인기도 바꾸는 11곳 |
| 159 | 팬 돌파 공중파 기사 단계마다 4개 (다른 AI 작성) | data/fame.js |
| 160 | 후보 구성 규칙: 포지션당 후보 1명, 가장 강한 포지션 후보 X, 가장 약한 포지션 후보 필수 (surplusPlayer·fixBench) | js/contracts.js, js/club_market.js, js/summer_market.js, js/league.js, js/era.js, js/main.js |

## 4. 기술 규칙과 코드 위치

### 공통
- 순수 HTML/CSS/JS. 외부 라이브러리·CDN·빌드 도구 금지. `file://` 실행 → fetch·ES module 금지. 차트는 SVG 직접.
- 데이터는 data/*.js 상수, 로직은 js/*.js. index.html script 순서 유지, 새 js는 start.js 앞에. `pages.x = ...`를 하는 파일은 main.js 뒤.
- 저장은 localStorage. **새 최상위 state 필드는 js/save.js SAVED_FIELDS와 stateFromSave 둘 다.** state.league·state.world는 통째로 저장 (그 안의 새 필드는 등록 불필요).
- 예전 세이브 호환: 불러올 때 renderAll(js/main.js)에서 ensure… 함수들이 실행됨 (ensureNpcTraits → trimRivalTitles·enforceRivalScale, ensureWorld, ensureWorldV11(해외 숙련도·출신·수준) 등). loadGame만으로는 안 돌고 renderAll에서 돈다.
- **confirm()/alert()/prompt() 금지** → js/main.js `askConfirm(문장, 예일때함수, "예 버튼 글자")`.
- 화면 안 버튼은 renderPage의 `querySelectorAll("[data-…]")` 묶음에 추가.
- 특성: traitSumOf / traitKeyOf / traitsOf / matchTraitsOf. 내 선수 ID는 USER_ID.
- 주간 흐름 js/main.js nextWeek: 훈련 → 경기 → 급여·활동·인기도·업적 → 주 넘김(새해면 saveSeasonHistory → newSeasonLeague → contractsNewSeason → addBigRookies → initContracts → refillRivalAces) → 대진 미리 만들기 → eraIntroArticle → 새 챔피언·패치 → 시장 → 받은 연락 → 퀘스트.
- 신문 기사 등록은 js/news.js `publishHeadline`을 사용한다(배열 직접 push 금지). 템플릿은 data/news_articles.js와 `queueHeadline(key, who, vars)`. 보관·중복 방지·구버전 호환은 10장 참고.

### 경기 일정
- 리그 대진(LCK 컵 2주·정규 13주·후반기 30주)은 js/matchsim.js PRE_WEEK_EVENTS + prepareWeek. 토너먼트는 WEEK_EVENTS + koPreview/intlPreview. 38주 WEEK_EVENTS에 리그 결승 + worldSeasonStory(해외 리그 결산).

### 경기 판정과 경기 흐름
- 세트 점수 = 선수 경기력 평균 + 라인전 + 운영·한타(+언어 소통 −) + 조합 + **경기 흐름 사건** + 운. 승패는 대부분 사건이 정함 → 사건 주인공 확률에 들어가야 체감됨 (147에서 확인).
- 사건 주인공 가중치 js/match_events.js evActorWeight: 스탯 · 심리 · 특성 · 집중 견제(userFocusMult, ctx.focus) · 🎮손맛(p.cf) · 언어(콜 충돌).
- cf(챔피언 배율): 내 선수는 userMatchContext가 m.power/m.score, 다른 선수는 applyNpcChampPower가 npcChampMult − 페널티 비율.
- 경기 결과 화면 js/match_detail.js: 팀 점수 줄에 언어 소통, '집중 견제' 카드, 미끼 장면 해설 줄.

### 이적 시장
- 비시즌(새해) contractsNewSeason 순서: 내 이동 → **1.5) dynastyNewSeason(연봉 압박·해외 러브콜) → langNewSeason → returnHomeMoves → foreignReturnMoves** → 계약 만료 → **importMoves** → offseasonRebuild(fireSale → starTransfers → tryBuy → depthSignings) → fillRosters → **faAbroadMoves** → FA 정리.
- **후보 구성 규칙 (160)**: 선수단이 넘쳐 내보낼 때는 weakestPlayer가 아니라 `surplusPlayer(teamId, 새로 온 id)`, 채울 때는 fillRosters (benchWanted 순서). 새 영입 경로도 이것을 쓸 것.
- **외국인 1명 제한**: 모든 영입 경로에서 `foreignOk(id, teamId)` / `foreignRoom(teamId)` 확인 (sellable, starTransfers, depthSignings, tryLoan, fillPosition, fillRosters, 해외 러브콜). 새 영입 경로를 만들면 꼭 넣을 것.
- 여름(23~28주) js/summer_market.js. 모든 이동은 logTransfer → state.league.transferLog (e.origin 자동 기록). kind: buy·star·depth·loan·leave·import·abroad·return·retire.

### 해외 리그 (139~145)
- state.world = { teams[{id 'O…', region, roster}], players{ 'X…': {name,pos,age,stats,traits,style,mastery,origin,langs,abroadYear} }, history[], storyYear, tierDone }.
- 국내 ↔ 해외 변환: js/world_moves.js worldToLeague(새 P id로) / leagueFAToWorld, js/dynasty.js moveAbroad. 변환할 때 국내 선수는 league.players에서 삭제 (은퇴처럼) → 삭제된 id가 relations 등에 남을 수 있으니 playerName 전에 존재 확인.
- 지역 수준: normalizeWorldTiers(새해, 출신 주전 평균을 1부 평균 × strength 쪽으로 50%).
- 언어: langSkill(p, code), teamLangOf(teamId), langGapOf(lineup, teamId). 모국어 100, 처음 0(영어 30), 새해 +35.
- 해외 선수 상세는 [선수 검색] 상세(playerDetailHTML)에서 해외 팀·출신·모국어·팀 언어 실력.

### 강팀 쏠림 막기 (134, 143)
- 값 data/dynasty.js. 새해 lastChamps 기준 연봉 압박, p.leftFrom/leftYear로 원래 팀 재영입 막음.
- 집중 견제: sCountOfId(내 선수 = userSCount; 다른 선수는 라이벌 전용도 셈, GOAT 제외).
- 라이벌 1년짜리: clearRivalTitle. 규모는 RIVAL_SCALE(내 S급 수). 은퇴로 빈 에이스는 refillRivalAces.

### 수집·연락·기타 (이전 기록)
- 업적 보상 없음 (120, 다시 넣지 말 것). 시그니처 보너스는 sigValue(key).
- 받은 연락: data/events*.js + js/events.js·js/stories.js. 새 시스템 트리거는 queueTrigger + QUEUE_TRIGGERS.
- **인기도는 꼭 addPopularity(v)로 바꿀 것** (팬 수 state.fame.fans가 같이 움직임, js/fame.js). state.popularity에 직접 넣지 말 것.
- 은퇴 기사: js/retirement.js metaRetire (점수는 retirePlayer 전에 기록해야 함 — 삭제 뒤엔 playerScore 오류).

## 5. ⚠️ 클라우드 세션(Claude Cowork)에서 PC 파일을 고칠 때

이 PC에서 직접 작업하는 AI(Claude Code 등)는 해당 없음.

1. 고치기 전에 PC 파일을 stage해서 최신 내용으로 작업 (Claude Code가 고쳤을 수 있음).
2. **줄바꿈**: PC 파일 중 CRLF인 것이 있음 (data/era.js, js/era.js, js/creation.js, js/intl.js, js/records.js, js/boxscore.js, js/links.js, js/summer_market.js, js/npc_mastery.js, js/retirement.js 등). 원래 CRLF였던 파일은 CRLF로 맞춰서 넣기.
3. **device_commit_files가 같은 stagedPath를 다시 쓰면 옛 내용을 넣는 경우가 있었음** (140 때 data/era.js가 옛 내용으로 들어가 게임이 빈 화면, 142 때도 재발). → **넘길 때마다 새 폴더(/mnt/user-data/outputs/c<시간>/…)에 복사해서 넘기고, 넘긴 직후 다시 stage해서 cmp로 같은지 확인.** 그리고 PC 파일 묶음으로 게임을 띄워 오류가 없는지 확인.
4. expectedMtimeMs로 넘겨서 그사이 PC 파일이 바뀌었으면 덮어쓰지 않게.

## 6. 검증 방법

- 문법: 바뀐 JS마다 `node --check`.
- 밸런스 측정 `tools/` (README.md 사용법, BALANCE.md 조절 값·측정 기준 — 8장 강팀 쏠림, 9장 숙련도·메타 추가됨). `--set 경로=값`으로 값 후보 비교.
- Playwright(Chromium)로 실제 화면·시즌 진행 확인 (클라우드 세션에 있음, PC에서는 Edge headless가 불안정했던 기록):
  - 새 게임: `draft.name='테스트'; draft.startYear=2012; renderCreation(); startCareer(true);` (시작 연도는 2012·2017·2022만). 1부 팀: startCareer 전에 `draft.teamChoice = draft.teams.findIndex(d=>d.tier===1)`.
  - **state.plan이 있어야 nextWeek()가 진행됨** (새 게임은 이제 기본 'solo_rank').
  - 연락 자동 답: `state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id,0))`.
  - 한 페이지에서 새 게임을 두 번 만들면 draft가 null이라 오류 → 게임마다 페이지를 새로 연다.
  - 1시즌 ≈ 20초~1분. 승률 측정은 같은 씨앗끼리 비교하고 n=1,000 이상 (리그마다 기준 승률이 크게 다름).
- 세이브 크기: 해외 선수 숙련도로 약 +140KB (새 게임 약 360KB). localStorage 한도 안이지만 큰 데이터를 더 넣을 땐 확인.

## 7. 로드맵

- **ver 1.2: ④ 내 선수 해외 진출** — 비시즌 해외 구단 제안 → 수락 시 해외 리그에서 뜀. 필요한 것: 해외 리그 정규 시즌 경기 실제 진행(지금은 지역 순위를 전력+운으로만 정함), 내 계약·연봉, 내 언어 실력(훈련·상점 어학·이벤트), 국내 복귀, 119의 '해외 구단 러브콜' 연작과 연결. 시작 전에 선택지로 물을 것.
- 그 밖에 (사용자가 고르기 전 시작 금지): 퀘스트 횟수에 따른 팀 내부 평가 / 구단 능력치(감독·코치·시설) / 해외 선수 이름 외 해외 리그 경기 기록 화면.
- 작은 아이디어: 관계를 다른 화면에도, 라이벌 맞대결 전적, 연락 도감, 시즌 선수 카드, 12각형 다른 선수 비교.

## 8. 밸런스 메모

- 1부 평균 전력 2013 약 64.8 → 2026 약 74.4 (사용자 수용).
- 강팀 쏠림 측정(134): 같은 국내 팀 월드 최다 5~6회 → 2회, 1위 구단 자금 26~55억 → 16~20억.
- 국제대회 국내 vs 해외 승률 약 65~77%, 월드 우승 국내 약 3/4. 해외 팀이 월드를 여러 번 가져가는 판이 가끔 있음 (사용자에게 알렸고 아직 손대지 않음).
- 국내 리그 외국인 선수는 6시즌 동안 7~10명에서 안정.
- 147 이후 숙련도 20→100 = 세트 승률 +19.7%p, 메타 위주 vs 비메타 위주 +8.9%p. 너무 세다/약하다는 피드백이 오면 data/match.js CHAMP_EV.pow·metaPowerBonus·metaPenaltyDiv·jokerPowerBonus 4개로 조절.
- 연락이 많다면 EVENT_RULES.inboxPerSeason. 팬 선물 밸런스는 사용자가 먼저 꺼내기 전엔 언급하지 않음.

## 9. 다음 세션 시작 시

1. `git status --short`, `git log --oneline -15`, `git diff`로 현재 변경부터 확인. 현재 미커밋 변경을 보존하고, 다른 PC 동기화가 필요하면 작업 상태를 확인한 뒤 진행한다.
2. 새 사용자 요청 우선. 지금은 **ver 1.1 마무리 단계** — 친구 피드백·사용자 플레이 피드백을 하나씩 받아 고치는 중. 사용자가 "작업완료"라고 하면 1장의 체크리스트(태그 포함)를 알려 준다.
3. 큰 변경 뒤에는 PROGRESS.md 맨 아래에 번호를 이어 기록(**다음 번호 164**, `[ver 1.1]` 표시)하고 이 HANDOFF.md도 갱신. Claude 프로젝트에도 같은 내용(claude/HANDOFF.md, claude/PROGRESS.md)을 올린다.

## 10. 뉴스 개편 인계 — 1·2단계 완료 시점의 기록 (최신 상태는 11장)

### 10-1. 사용자 의도와 범위

- 현재 육성·계약·승강전·52주 일정의 큰 방향은 유지한다. 뉴스와 간단한 엔진·수치 변화로 시대와 월즈의 분위기를 살리는 것이 목적이다.
- 사용자 구상: 매년 연초 실제 역사 기반 뉴스, 해당 시기의 작은 패치 변화, 리그 규모 확대 시 인기·투자 뉴스와 팬 유입 증가, 41주 월즈 준비 특집.
- **이번까지 승인·완료한 것은 1단계 조사와 2단계 공통 처리다.** 3단계 이후는 청사진이며 자동으로 착수하지 않는다. 최신 요청은 1·2단계 HANDOFF 정리다.
- 실존 우승팀·선수의 결과를 강제하지 않는다. 기사 속 우승·MVP·이적은 현재 게임 기록을 따른다. 피어리스·승강전 폐지·대회 포맷 변경은 이번 범위에서 제외한다.

### 10-2. 1단계 — 조사 완료, 게임 코드 변경 없음

- 23개 코드 파일에서 뉴스 등록·호출 위치 86곳을 조사했다. 이 숫자는 기사 수나 시즌 발생 건수가 아니라 코드 위치 수다.
- 경로: addNews 단신 → 로그·SNS 소식·주간 결과 / queueHeadline 및 직접 등록 → 신문 / postMessage 직접 소식 / postSocial 선수·팬 반응.
- 효과가 있는 news 이벤트 21개를 확인했다. fireEvent는 소식 생성 때 효과를 적용한다. 기사 읽기·재열기로 효과를 적용하는 구조가 아니다. **중복 문구를 줄이더라도 이벤트 효과·쿨다운·후속 상태를 없애지 않는다.**
- 유지 대상: 실제 결과·개인 진로·효과 이벤트·선수와 팬 반응. 통합 후보: 결승 묶음, 패치 묶음, 대격변 상세/요약, 올스타 상세/요약, 신년·리그 성장 안내. 사건 자체를 통째로 삭제하는 확정 대상은 없다.
- 발견 사항: 컵 기사에 First Stand 개최 전 출전권 오안내, 주간 보고서 날짜와 새해/패치 발생 날짜 혼재, 신문 원문이 다음 주 교체되는 문제, 뉴스 증가 시 미응답 연락이 120개 보관 한도에서 잘릴 위험.
- 재사용 자료: 신년 종합 기사 이미 있음. 해외 MVP는 38주 world.history, 국내 MVP는 league.awards의 해당 연도 key=mvp. 해외 MVP를 월즈 특집 때 다시 선정하지 않는다.
- 조사 보고서: C:/Users/dhlth/Documents/Codex/2026-10-07/c-project-game-game-hand-off-2/outputs/뉴스_1단계_조사보고서.md
- 원본 위치 목록: 같은 outputs 폴더의 뉴스_발생위치_목록.csv. 두 파일은 이 PC의 조사 산출물이며 저장소에 포함되지 않는다. 다른 PC에서 파일이 없어도 본 절과 실제 코드로 이어갈 수 있다.

### 10-3. 2단계 — 구현 완료 (PROGRESS 161)

| 변경 | 구현 위치·주의사항 |
|---|---|
| 공통 신문 등록 | js/news.js publishHeadline. 기존 직접 push/unshift 경로를 전부 이 함수로 연결 |
| 공통 단신 | main.js addNews → publishNotice. 같은 연도·주차·제목·본문의 반복 등록 방지. 다른 주의 같은 소식은 허용 |
| 신문 중복 방지 | 기본 ID는 연도·주차·key·variant. 같은 주 같은 종류에 여러 사건이 있으면 variant 또는 명시 id 필요. 팬 돌파는 문턱값으로 구분 |
| 템플릿 기사 | queueHeadline은 key·상황·vars로 ID를 만들고 중복이면 문구 재추첨 전에 종료 |
| 표시·우선순위 | 기사별 발생 연도·주차 표시. publishHeadline에서 priority 지정 가능, 기본은 내 관련 기사 우선. 미래의 세부 중요도 규칙을 추가할 수 있는 상태 |
| 신문 보관함 | SNS → 소식 상단의 접는 보관함. 최근 160개 원문을 보관. 신문 등록 시 SNS에 같은 장문을 추가 발송하지 않음 |
| 세이브 | state.newsState={articles, notices}. articles 160개, 단신 중복 ID notices 400개. createNewState·SAVED_FIELDS·stateFromSave 등록 |
| 구버전 호환 | renderAll → migrateCurrentNews. 현재 보고서에 남은 예전 기사는 원래 when을 보존해 이관. 이미 사라진 과거 원문을 복원하지 않음 |
| 미응답 연락 보호 | trimMessages: 답장 대기 연락은 일반 메시지 120개 한도와 별도로 보존. postMessage와 불러오기 양쪽 적용 |
| 읽음 상태 | 신문 닫기·SNS 소식 펼치기/모두 읽음에서 자동저장 설정이 켜졌을 때 저장 |
| 결승 기록 분리 | titleStreak를 js/records.js로 이동. matchsim.js에서 기록 확정 후 queueFinalNews(champKey, title, f, st)에 전달. 같은 연도 재처리 시 연속 우승 수 유지 |
| 결승 기사 보호 | f.newsPublished로 중복 처리 방지. repeatNews는 마지막 배열 원소가 아니라 생성한 기사 객체를 직접 받음 |
| 문구 수정 | data/news_articles.js 컵 우승 기사에 firstStandNote 사용. 2025년 이전에는 출전 확정 문구를 넣지 않음 |

- 게임 효과는 기존 fireEvent·경기 결과·팬 계산·정산 함수에 남겼다. 공통 뉴스 함수는 표시·보관만 담당한다.
- 기존 선수·팬 SNS와 효과 이벤트의 발생 규칙은 유지했다. **같은 사건의 결승 기사·MVP·팬 반응을 의미상 모두 하나로 합치는 작업까지 끝난 것은 아니다.** 공통 등록 기반과 동일 등록 중복 방지가 완료된 상태다.
- 월즈 개최지·주제곡·MV 데이터, 리그 성장 팬 배율, 역사 뉴스 데이터는 아직 없다.

### 10-4. 검증과 한계

- 재실행: 프로젝트 폴더에서 node tools/test_news.cjs.
- Node 내장 VM으로 실제 게임 스크립트를 로드하며 DOM만 대체 객체를 사용한다. 외부 패키지가 필요 없다.
- 회귀 검사 14개 통과: 소개 기사, 발생 날짜, 다른 제목의 동일 사건 중복, 단신 중복, 효과 유지, 재열기 무효과, First Stand 연도 조건 전후, 결승 재처리, 저장 왕복, 다음 주 원문 보관, 예전 저장 이관, 미응답 연락 보호, 보관함 HTML 생성.
- 2012·2017·2022 시작 각각 53주 진행 및 이후 저장·불러오기 통과. JS 문법과 git diff --check 통과.
- **실제 브라우저 화면 배치는 미확인.** Playwright로 Edge 실행을 시도했으나 브라우저가 시작 직후 종료됐다. VM 검사를 브라우저 UI 검사로 설명하지 않는다.
- 다음 UI 확인 항목: SNS 소식 보관함 펼치기, 긴 기사 줄바꿈, 신문 날짜, 닫기 후 재로드 읽음 상태, 구버전 세이브 화면.

### 10-5. Git 상태 — 이번 인계 작성 때 확인

- HEAD: a4fbb0e (ver 1.1: 후보 구성 규칙). 2단계 변경은 아직 커밋되지 않았다. 자동 커밋·push하지 않았다.
- 수정 파일: HANDOFF.md, PROGRESS.md, data/events.js, data/news_articles.js, index.html, js/dashboard.js, js/era.js, js/events.js, js/fame.js, js/main.js, js/matchsim.js, js/news_popup.js, js/records.js, js/save.js, js/shakeup.js, js/sns_page.js, tools/README.md.
- 신규 파일: js/news.js, tools/test_news.cjs. 다음 작업자가 이 변경을 기존 사용자 작업으로 보존해야 한다.
- 현재 claude/ 폴더는 없어 복사본을 만들지 않았다. PROGRESS는 161까지이며 이번 인계 문서 정리만으로 새 기능 번호를 추가하지 않는다. 다음 실제 기능 번호는 162.
- 이후 상태는 바뀔 수 있으므로 시작할 때 git status·git log·git diff를 다시 확인한다.

### 10-6. 다음 단계 청사진 — 아직 미착수

1. **3단계 월즈 특집:** 매년 41주에 다음 주 개막 안내. 2012년 미국 고정, 이후 활성 리그가 있는 국가의 수도 중 무작위. 2012년 미국 내 도시와 유럽·동남아 등 광역 리그의 국가 후보는 별도 결정 필요.
2. 같은 특집에 주제곡·뮤직비디오 공개 소식, 선수 리스펙·영상미·시즌 최고 장면 설명, 지역별 MVP를 묶는다. 실제 음원·영상 제작은 범위에 없음. 2013년부터 전년도 게임상 월즈 우승팀과 주요 장면을 반영한다.
3. **41주 시점 주의:** 현재 setupWorlds는 41주를 진행할 때 실행되므로 다음 화면은 42주다. 41주 진입 안내와 실제 편성을 구분해야 한다. 조 편성을 중복 실행하지 않는다. 38주 국내 대표는 41주 해외 참가팀 부족 시 늘어날 수 있다.
4. **기록 주의:** 전년도 우승팀은 league.history.champions.worlds 등을 사용. 역대 전체 경기 장면은 그대로 보관되지 않으므로 저장된 사실만 묘사하거나 별도 요약 저장을 설계한다. 2017/2022 새 시작처럼 전년도 기록이 없으면 없는 장면을 만들어내지 않는다. MVP와 실제 월즈 출전 여부도 구분한다.
5. **4단계 리그 성장:** 기존 규모 확대 기사에 인기 상승·기업/방송사/중동 투자자 관심을 연결. 팬 증가 배율은 규모 단계별 교체 방식 검토. eraPop·popularityMultiplier·addPopularity와 직접 팬 추가 titleFans의 중복 적용을 먼저 확인. 투자 관심과 실제 계약 체결·입금은 구분한다.
6. **5단계 역사 뉴스:** 연초 시대 소개, 중간 패치, 연말 다음 시즌 예고를 구분. 실제 제도와 게임 규칙이 다르면 운영 공지처럼 쓰지 않는다.
7. **6단계 작은 효과:** 2016 오브젝트·2022 한타·2024 새 오브젝트 등이 후보. 확정 수치가 아니며 아직 적용하지 않았다. **7단계**는 전체 노출·저장·시대 조건·밸런스 검증.

현재 사용자가 승인한 1·2단계는 완료했다. 다음 요청이 3단계라면 이 절을 바탕으로 이어간다.

## 11. 뉴스 개편 3단계 완료 — PROGRESS 162

- 사용자 승인으로 3단계 월즈 특집까지 구현. 4단계 팬 성장·투자 기사와 5단계 역사 뉴스는 아직 시작하지 않음.
- 시작 시 HEAD edee383 (2단계 커밋 완료), 기존 HANDOFF 수정만 미커밋이었다. 이 문서 수정은 보존했다. 3단계는 아직 커밋·push하지 않음. 10장의 Git·미착수 상태는 당시 기록이며 현재는 이 절을 우선한다.
- **41주 진입:** worldsNewsForWeek가 공통 publishHeadline으로 특집 등록. 개최지, 창작 곡 제목과 MV 연출, 현재 시즌 주요 경기, 지역 MVP 소개. MVP는 실제 기록 사용, 월즈 최종 출전 명단과 별개임을 명시.
- **42주 진입:** 기존 setupWorlds의 조 편성 이후 개막 단신과 내 팀 참가 안내. setupWorlds 실행 시점을 앞당기거나 두 번 실행하지 않음.
- 개최지: 2012 미국 로스앤젤레스 고정. 이후 WORLDS_NEWS.hosts에서 kr+activeRegions의 국가 수도 후보를 동일 확률 추첨. 광역 리그는 대표 국가 후보 목록으로 단순화(실제 역사 개최 일정 재현 아님).
- 곡·영상은 설명형 창작 콘텐츠이며 실제 음원·영상 재생 없음. 직전 시즌 곡 연속 재사용은 막음. 기사 데이터는 data/worlds_news.js, 처리 js/worlds_news.js.
- 저장: league.season.worldsFeature에 host/song/headline/body/mine/previewSent/openingSent. league가 통째로 저장되어 최상위 필드 추가 없음. 구버전 41/42주 로드시 renderAll에서 누락 안내를 생성하고 자동저장 설정이 켜져 있으면 저장.
- 시즌 종료 saveSeasonHistory에서 buildWorldsRecap 호출: league.history[].worldsRecap={year,song,scenes}. 월즈 토너먼트 최신 경기부터 최대 3개, 실제 스코어와 저장된 큰 활약 장면의 선수 이름을 문자열로 보존. 2013 이후 전년도 우승팀과 이 요약을 영상 묘사에 사용. 기록이 없으면 가공의 우승자/장면을 넣지 않음.
- 현재 시즌 영상 장면은 41주 전 결승 최대 2개에서 실제 기록을 선택. 국내 MVP=league.awards key mvp, 해외 MVP=world.history 해당 연도/지역. 기록이 없으면 수상 기록 없음 표시.
- 중복 방지: season의 발행 플래그와 연도별 기사 ID. 기사 재열기·로드로 개최지/곡 재추첨 없음. 팬·능력·상금·경기 규칙 변경 없음.
- 테스트: node tools/test_worlds_news.cjs — 월즈 19개 검사(2012→2013 41주 진행 포함), 2017/2022 옛 저장 대체 문구. node tools/test_news.cjs — 기존 14개와 3개 시작 연도 53주. Node VM의 DOM 대체 객체 검사이며 실제 화면 배치는 미확인.
- 다음 실제 기능 번호 163. 다음 작업은 사용자 요청 시 4단계 리그 성장 뉴스·팬 증가율.

## 12. 뉴스 개편 4단계 완료 — PROGRESS 163

- 시작 시 HEAD d4104f8 (3단계 커밋 완료), 작업 트리 깨끗함. 이번 4단계는 아직 커밋·push하지 않음. 이전 절의 미착수/미커밋 표기는 당시 기록이며 현재는 이 절을 우선.
- 사용자 승인으로 국내 리그 규모 확대 시 인기 상승·투자 관심 기사와 신규 팬 배율까지 구현. 5단계 역사 뉴스는 미착수.
- data/era.js LEAGUE_GROWTH: fansPerExpansion=0.10, 인기·투자 문구. ERA.teams의 총 팀 수가 증가한 단계마다 +0.1, 2012~13 1.0배 / 2014~15 1.1배 / 2016 이후 1.2배. 해외 지역 개설마다 추가 증가시키지는 않음.
- js/era.js leagueExpansionCount/leagueFanMultiplier: 현재 연도에서 배율 계산, 저장값 반복 곱셈 없음. leagueGrowthNews는 그해 국내 팀 수가 증가할 때만 두 문단 반환. main.js 새해 기사 배열에 연결해 신년 기사 하나에 합침. 기업·방송사·중동 자산가/투자자 관심을 표현하며 실제 후원 계약·입금 처리는 추가하지 않음.
- js/fame.js addFans: n>0일 때만 n×leagueFanMultiplier 한 번 적용. addPopularity와 titleFans 모두 이 경로를 사용. 인기도 획득 배율 eraPop는 기존 위치 그대로이며 새 팬 배율을 거기에도 곱하지 말 것. 음수 감소와 팬 바닥값·1억 이후 완화 공식은 유지.
- 기존 팬 수를 소급 증가시키지 않음. 인기도100에서도 팬 증가, 우승 보너스에도 적용. 중간 연도 시작/옛 저장은 즉시 해당 연도 배율을 사용하되 별도 과거 뉴스 재생·보상 없음. 팬 말풍선에 현재 배율을 표시.
- 검증: node tools/test_league_growth.cjs — 16개 회귀 및 2012→2014/2016 1주 실제 진행. 신년 성장 기사 각각 1개, 실제 팀 수10/6·10/8 확인. 팬 감소·기존 저장 팬 수·입금 없음·1억 이후 완화 검사. 고정조건(인기도100,팬310만) 1점 유입61000/67100/73200, 월즈 우승183만/201.3만/219.6만. 문법·diff 검사 통과. Node VM 기반이라 실제 브라우저 화면 배치 미확인.
- 주요 변경 파일: data/era.js, js/era.js, js/fame.js, js/main.js, tools/test_league_growth.cjs, tools/README.md, PROGRESS.md, HANDOFF.md. 새 저장 필드·외부 의존성 없음.
- 다음 실제 기능 번호164. 다음 단계는 사용자 요청 시 5단계 연도별 역사 뉴스. 팬 배율은 현재 확장 단계당10%p로 구현했으며, 추가 장기 플레이 피드백에 따라 data의 값을 조절 가능.
