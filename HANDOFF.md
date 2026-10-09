# 다음 세션 이어가기 — 2026-10-09 작성, PROGRESS 148까지 (ver 1.1 작업 중, 아직 push 전)

새 세션(Claude Code·Codex·Claude 클라우드 세션 무엇이든)은 **이 파일 → PROGRESS.md 맨 아래(134~148) → CLAUDE.md → 필요하면 GAME_PLAN.md** 순서로 읽고, 먼저 실제 git 상태를 확인한다.

## 0. 지금 상태 한눈에

| 항목 | 상태 |
|---|---|
| 저장소 폴더 | **`C:\Project\Game\Game`** (한 단계 안쪽. 명령 안내도 이 경로로) |
| GitHub에 올라간 것 | 133까지 = **ver 1.0** (git 태그 `v1.0`, 아직 태그는 push 안 됨) |
| 지금 작업 | **ver 1.1** = 친구 피드백 수정 + 해외 리그 ①~③단계. PROGRESS 134~148. 사용자가 커밋은 하고 있지만 **push는 ver 1.1이 다 끝나면 한 번에** (사용자 결정) |
| 화면 버전 표시 | index.html 로고 아래 `ver 1.1` (버전을 올리면 같이 바꿈) |
| 다음 버전 ver 1.2 | **④ 내 선수 해외 진출 + 내 언어 실력** (사용자 결정으로 미룸) |
| 마지막 요청 | 148 역전의 명수 확인 — 끝남. 대기 중인 요청 없음 |

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

## 3. ver 1.1 변경 (134~148) — 자세한 수치는 PROGRESS.md

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
- 신문 기사 팝업은 `state.weekReport.headlines`에 push (그 주를 진행할 때 만들어진 report). 기사 데이터는 data/news_articles.js, `queueHeadline(key, who, vars)`.

### 경기 일정
- 리그 대진(LCK 컵 2주·정규 13주·후반기 30주)은 js/matchsim.js PRE_WEEK_EVENTS + prepareWeek. 토너먼트는 WEEK_EVENTS + koPreview/intlPreview. 38주 WEEK_EVENTS에 리그 결승 + worldSeasonStory(해외 리그 결산).

### 경기 판정과 경기 흐름
- 세트 점수 = 선수 경기력 평균 + 라인전 + 운영·한타(+언어 소통 −) + 조합 + **경기 흐름 사건** + 운. 승패는 대부분 사건이 정함 → 사건 주인공 확률에 들어가야 체감됨 (147에서 확인).
- 사건 주인공 가중치 js/match_events.js evActorWeight: 스탯 · 심리 · 특성 · 집중 견제(userFocusMult, ctx.focus) · 🎮손맛(p.cf) · 언어(콜 충돌).
- cf(챔피언 배율): 내 선수는 userMatchContext가 m.power/m.score, 다른 선수는 applyNpcChampPower가 npcChampMult − 페널티 비율.
- 경기 결과 화면 js/match_detail.js: 팀 점수 줄에 언어 소통, '집중 견제' 카드, 미끼 장면 해설 줄.

### 이적 시장
- 비시즌(새해) contractsNewSeason 순서: 내 이동 → **1.5) dynastyNewSeason(연봉 압박·해외 러브콜) → langNewSeason → returnHomeMoves → foreignReturnMoves** → 계약 만료 → **importMoves** → offseasonRebuild(fireSale → starTransfers → tryBuy → depthSignings) → fillRosters → **faAbroadMoves** → FA 정리.
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

1. `git pull`(다른 PC 작업이 있을 수 있음, 단 ver 1.1은 아직 push 전이라 이 PC가 최신) → `git status --short`, `git log --oneline -15`. 커밋 안 된 변경이 있으면 무엇인지 먼저 확인.
2. 새 사용자 요청 우선. 지금은 **ver 1.1 마무리 단계** — 친구 피드백·사용자 플레이 피드백을 하나씩 받아 고치는 중. 사용자가 "작업완료"라고 하면 1장의 체크리스트(태그 포함)를 알려 준다.
3. 큰 변경 뒤에는 PROGRESS.md 맨 아래에 번호를 이어 기록(**다음 번호 149**, `[ver 1.1]` 표시)하고 이 HANDOFF.md도 갱신. Claude 프로젝트에도 같은 내용(claude/HANDOFF.md, claude/PROGRESS.md)을 올린다.
