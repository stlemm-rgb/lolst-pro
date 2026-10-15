# 다음 세션 이어가기 — 2026-10-14 갱신, PROGRESS 173까지 (해외 월드 우승 밸런스 · 측정 도구 빠르게 · 맞대결 전적 · 빅게임 · 구단 스태프)

새 세션(Claude Code·Codex·Claude 클라우드 세션 무엇이든)은 **이 파일 → PROGRESS.md 134~173 항목 → CLAUDE.md → 필요하면 GAME_PLAN.md** 순서로 읽고, 먼저 실제 git 상태를 확인한다. **뉴스 개편은 10장에 요약했으며, 다른 AI 검증·재개용 설명과 복사할 요청문은 [AI_REVIEW_HANDOFF.md](AI_REVIEW_HANDOFF.md), 검증 결과는 [tools/NEWS_VALIDATION.md](tools/NEWS_VALIDATION.md)에 있다.**

## 0. 지금 상태 한눈에

| 항목 | 상태 |
|---|---|
| 저장소 폴더 | **`C:\Project\Game\Game`** (한 단계 안쪽. 명령 안내도 이 경로로) |
| 원격 배포 상태 | 과거 기록은 133까지 ver 1.0. 이번 인계에서는 원격 상태를 재확인하지 않음. 현재 사실로 단정하지 말 것 |
| 지금 작업 | **ver 1.1** 업로드 끝남 (2026-10-14 확인: master = origin/master = 태그 v1.1 = bdd6f1a, PC 작업 폴더 변경 없음 — 줄바꿈 차이만). **7장 로드맵 ① 해외 월드 우승 밸런스**: 168 측정 → 사용자 선택 A(지역 0.92)+C(해외 왕조 압박) → 169 적용·재측정 끝 (국내 우승 80%). 170 측정 도구 2.5배 빠르게·같은 씨앗 = 같은 결과, 171 **② 맞대결 전적** 끝, 172 **③ 구단별 빅게임** 끝(커밋됨), 173 **④ 구단 능력치(구단 스태프)** 끝 (커밋 필요). 로드맵 ①~④ 완료 → 다음은 사용자에게 물을 것 (ver 1.2 내 선수 해외 진출 등) |
| 화면 버전 표시 | index.html 로고 아래 `ver 1.1` (버전을 올리면 같이 바꿈) |
| 다음 버전 ver 1.2 | **④ 내 선수 해외 진출 + 내 언어 실력** (사용자 결정으로 미룸) |
| 마지막 요청 | 149 평판 등급 하락 유예 · 150 월드 우승 스킨 고르기 · 151 대시보드 훈련 줄 삭제 · 152 리핏 기사 · 153 종합 능력 칸 이번 주 변화 · 154 솔로 랭크 칸 이번 주 결과 · 155 트로피 말풍선 · 156 안 열리는 일정 반투명 · 157 퀘스트 보상 실제 값 표시 · 158 팬 수 리뉴얼 · 159 팬 돌파 기사 교체(다른 AI 글) · 160 후보 구성 규칙 — 끝남. 161 뉴스 공통 처리 2단계 완료. 161~167 뉴스 개편(10장). 마지막: HANDOFF 10~17장 요약 + ver 1.1 업로드 안내 |

## 1. 사용자와 작업 방식

- 게임: 오프라인 텍스트 시뮬레이션 「프로게이머 커리어」. `index.html`을 브라우저에서 직접 열어 실행. 친구들은 웹 주소로 플레이.
- 사용자(Shane)는 코딩 초보. **항상 짧고 쉬운 한국어 + 표**로 설명 (영어로 답하면 "한글로 다시"라고 함).
- PC에서 **Claude Code도 같이 쓴다.** 두 AI가 번갈아 같은 파일을 고치면 한쪽 수정이 옛 내용으로 덮일 수 있음 (135 때 실제로 있었음). 작업 시작 전 `git status`/`git diff`로 최신 상태를 보고 파일을 다시 읽는다.
- 명확한 수정 요청·버그 신고는 바로 진행.
- **밸런스 측정은 두 단계 (사용자 결정 170)**: ① 후보를 넓게 씨앗 2개(3연도 × 2 = 6판)로 거르기 → ② 유력한 2~3개 + '지금'만 180시즌(3연도 × 씨앗 6). 오차는 180시즌에 ±3.5%p.
- **PC 연결이 끊기면 채팅에 파일을 첨부하지 않는다** (사용자가 게임 폴더에 저장하면 '-1' 사본이 커밋됨, 171 전 실제로 있었음). 다시 연결될 때까지 기다렸다 게임 폴더에 직접 넣고, 안 되면 그렇게 알리기.
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

## 3. ver 1.1 변경 (134~160, 161~167 뉴스 개편은 10장) — 자세한 수치는 PROGRESS.md

| 번호 | 내용 | 주요 파일 |
|---|---|---|
| 134 | 친구 피드백 '강팀 쏠림': 🔥리그의 에이스·🏰왕조의 심장 1년짜리, 🎯집중 견제를 S급 가진 다른 선수에게도(+미끼 장면·해설 외침), 🔍월드 우승팀 다음 시즌 −3%, 💸왕조 연봉 압박(FA 선언·협상 결렬), ✈️해외 러브콜, 💰상금 절반 선수 몫. 🐞평판이 나빠 커리어 점수 음수면 매주 멈추던 버그 | data/dynasty.js, js/dynasty.js, js/straits.js, js/match_events.js, js/match_detail.js |
| 135 | 새 게임 훈련 기본값 솔로 랭크, 처음 안내 1단계 '훈련 바꿔 보기'(다른 훈련으로 바꿔야 완료, tutorial.startPlan) | js/main.js, js/guide.js, data/guide.js, js/creation.js |
| 136 | 네임드 선수 Jimul(원딜)·Kibai(탑) 추가 → 7명. 같은 포지션 네임드는 다른 팀 | data/named_players.js, js/league.js |
| 137 | 훈련 특성: 천재적 감각 +12%, 전문 특성 = 훈련 하나의 스탯 3개 +30% (라인전 괴물=솔랭, 냉철한 판단=스크림, 분석의 눈(예전 빠른 손, id fast_hands)=리플레이) | data/traits.js |
| 138 | 2012년 시작 2주차 리그 규모 소개 신문 기사 | data/era.js ERA_INTRO, js/era.js |
| 139 | 해외 리그 ①: 국제대회 해외 팀도 실제 선수 5명, findPlayer가 해외 선수(id 'X…')도 찾음, 해외 선수 숙련도. 지역 3단계 수준 (우리 리그 1.0 > 중국·북미·유럽 0.94(169에서 0.92) > 나머지 0.86) | js/matchsim.js, js/era.js, js/league.js, js/npc_mastery.js |
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
| 168 | 해외 월드 우승 측정 도구 tools/measure_worlds.py (국내 우승 59%) | tools/ |
| 169 | 해외 월드 우승 밸런스: 중국·북미·유럽 0.94 → 0.92, 🌏 해외 왕조 압박(해외 월드 우승팀 주전 강한 2명 같은 지역 다른 팀으로) → 국내 80%, 같은 해외 팀 연속 우승 0 | data/era.js, data/dynasty.js OVERSEAS_DYNASTY, js/dynasty.js overseasDynastyMoves, data/guide.js |
| 170 | 측정 도구 빠르게(52주씩 페이지 안·화면 그리기 끔, 약 2.5배) + 씨앗을 게임 파일 읽기 전에 고정(같은 씨앗 = 같은 결과) | tools/sim_lib.py |
| 171 | ⚔️ 맞대결 전적: 구단끼리(구단 탐색·대시보드 경기 줄) + 내 선수 vs 같은 라인 상대([선수 정보] ⚔️ 맞수 탭·선수 검색 상세) | data/h2h.js, js/h2h.js, js/matchsim.js, js/dashboard.js, js/market_pages.js, js/player_page.js |
| 172 | 🔥 구단별 빅게임: 고정 라이벌 📡 통신사 더비(T1·KT)·👑 왕좌의 전쟁(T1·GEN.G). 예고·결과 기사, 내가 뛰면 인기도 승 +3/패 −1, 그 주 감독 퀘스트 '빅게임 승리', 업적 3개, 대시보드 🔥 표시. 경기 결과는 안 바뀜 | data/biggame.js, js/biggame.js, js/quests.js completeQuest, js/matchsim.js, js/main.js, js/dashboard.js |
| 173 | 🧑‍💼 구단 스태프: 감독(경기력 ±1%)·코치(성장 ±, 내 훈련 ±)·전략 분석관(분석 리포트 정확도)·시설(내 체력) S~D. 새해 자금 투자·유지비·우승팀 스태프 이적, 인사 추천권(48주) + 🎫 스카우트 티켓, 친구 코치 S급. 대시보드 📊 분석 리포트(상대 조합 예측 + 추천 전략) | data/staff.js, js/staff.js, js/matchsim.js, js/league.js, js/player.js, js/contracts.js, js/dashboard.js |
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
- 구단 스태프(173): team.staff[role].g (0=S ~ 4=D). 효과 읽기는 staffPowerMult·staffGrowthBonus·staffTrainingBonus·analystAccuracy. 상대 조합 계획은 m.scout에 미리 정해 두고 playMatch가 scoutedPlan으로 씀 — 리포트를 바꾸면 경기 계획과 어긋나지 않게 주의. 인사 연락 kind staffPick (events.js answerMessage에서 분기).
- 빅게임(172): bigGameOf(x, y)는 team.short(기업명)로 BIG_GAMES 찾음. 특별 퀘스트는 data/quests.js `special: true` (일반 퀘스트 뽑기에서 빠짐, 완료는 completeQuest(q)).
- 은퇴 기사: js/retirement.js metaRetire (점수는 retirePlayer 전에 기록해야 함 — 삭제 뒤엔 playerScore 오류).

## 5. ⚠️ 클라우드 세션(Claude Cowork)에서 PC 파일을 고칠 때

이 PC에서 직접 작업하는 AI(Claude Code 등)는 해당 없음.

1. 고치기 전에 PC 파일을 stage해서 최신 내용으로 작업 (Claude Code가 고쳤을 수 있음).
2. **줄바꿈**: PC 파일 중 CRLF인 것이 있음 (data/era.js, js/era.js, js/creation.js, js/intl.js, js/records.js, js/boxscore.js, js/links.js, js/summer_market.js, js/npc_mastery.js, js/retirement.js 등). 원래 CRLF였던 파일은 CRLF로 맞춰서 넣기.
3. **device_commit_files가 같은 stagedPath를 다시 쓰면 옛 내용을 넣는 경우가 있었음** (140 때 data/era.js가 옛 내용으로 들어가 게임이 빈 화면, 142 때도 재발). → **넘길 때마다 새 폴더(/mnt/user-data/outputs/c<시간>/…)에 복사해서 넘기고, 넘긴 직후 다시 stage해서 cmp로 같은지 확인.** 그리고 PC 파일 묶음으로 게임을 띄워 오류가 없는지 확인.
4. expectedMtimeMs로 넘겨서 그사이 PC 파일이 바뀌었으면 덮어쓰지 않게.
5. **PC 파일 일부가 읽기 전용일 때가 있음** (172: js/matchsim.js·index.html·css/style.css 쓰기 거부). device_bash에서 `chmod u+w 파일`로 풀린다.

## 6. 검증 방법

- 문법: 바뀐 JS마다 `node --check`.
- 밸런스 측정 `tools/` (README.md 사용법, BALANCE.md 조절 값·측정 기준 — 8장 강팀 쏠림, 9장 숙련도·메타 추가됨). `--set 경로=값`으로 값 후보 비교.
- 월드 우승 국내/해외: `tools/measure_worlds.py` (BALANCE.md 10장). 170 이후 10시즌 1판 ≈ 35초, 변형 1개(3연도 × 씨앗 6) ≈ 6분 (`--jobs 2`). 클라우드에서는 `setsid nohup … &`로 띄우고 `--out` 파일을 읽기.
- **측정 도구는 같은 씨앗 = 같은 결과 (170).** 예전 방식과 비교하려면 `--slow`. 도구를 고치면 같은 씨앗으로 전후 결과가 같은지 먼저 확인.
- Playwright(Chromium)로 실제 화면·시즌 진행 확인 (클라우드 세션에 있음, PC에서는 Edge headless가 불안정했던 기록):
  - 새 게임: `draft.name='테스트'; draft.startYear=2012; renderCreation(); startCareer(true);` (시작 연도는 2012·2017·2022만). 1부 팀: startCareer 전에 `draft.teamChoice = draft.teams.findIndex(d=>d.tier===1)`.
  - **state.plan이 있어야 nextWeek()가 진행됨** (새 게임은 이제 기본 'solo_rank').
  - 연락 자동 답: `state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id,0))`.
  - 한 페이지에서 새 게임을 두 번 만들면 draft가 null이라 오류 → 게임마다 페이지를 새로 연다.
  - 1시즌 ≈ 20초~1분. 승률 측정은 같은 씨앗끼리 비교하고 n=1,000 이상 (리그마다 기준 승률이 크게 다름).
- 세이브 크기: 해외 선수 숙련도로 약 +140KB (새 게임 약 360KB). localStorage 한도 안이지만 큰 데이터를 더 넣을 땐 확인.

## 7. 로드맵

**다음 작업 순서 (사용자 결정 2026-10-14)** — 하나씩 끝내고 다음으로. 각 단계는 먼저 측정·선택지로 묻고 시작.

| 순서 | 작업 | 메모 |
|---|---|---|
| ① | ~~해외 월드 우승 밸런스~~ ✅ | 168 측정 → 169 적용 (A 지역 0.92 + C 해외 왕조 압박): 국내 59% → 80%, 같은 해외 팀 연속 우승 7 → 0판 |
| ② | ~~라이벌 맞대결 전적~~ ✅ | 171: 구단 쌍 + 내 선수 vs 상대 (state.league.h2h, js/h2h.js h2hTeam·h2hTeamList·h2hMe). 다른 선수끼리·전적 기사는 사용자가 안 고름 |
| ③ | ~~구단별 빅게임~~ ✅ | 172: 고정 라이벌 2쌍만(사용자 선택), 기사·인기도·퀘스트·업적. 경기 긴장감(심리)·전적으로 생기는 라이벌은 사용자가 안 고름. 쌍 추가는 data/biggame.js BIG_GAMES 한 줄 |
| ④ | ~~구단 능력치 (감독·코치·시설)~~ ✅ | 173: 구단 스태프 4칸 + 분석 리포트 + 인사 추천권·티켓. 측정상 강팀 쏠림 차이 없음 (BALANCE.md 11장) |

**🎨 디자인 리뉴얼 (사용자 결정 2026-10-15: 해외 진출보다 먼저)** — 단계마다 HTML 시안 2~3개 → 사용자 고르기 → 적용. 게임 규칙·밸런스는 안 바꿈. 외부 라이브러리 없이 SVG·CSS·캔버스로.

| 단계 | 내용 |
|---|---|
| D0 | 디자인 기반: 색·글자·간격·카드·버튼·등급 색을 CSS 변수로 정리 + 새 색감, 테마 2~3개 |
| D1 | 2D 포트레잇: 파츠 조합(선수 id로 같은 얼굴, 세이브 0), 팀 유니폼 색, 내 캐릭터는 생성 화면에서 고르기, 가끔 1~5px 점프·눈 깜빡임, 기분 표정 |
| D2 | 대시보드 리뉴얼: 맨 위 내 선수 카드(포트레잇·종합 능력·상태), 이번 주 정리, 휴대폰 폭 가로 넘침 해결 |
| D3 | 경기 연출: 경기 흐름 기록으로 세트 재생(미니맵·사건·점수바), 건너뛰기·2배속, 빅게임·결승 특별 연출 |
| D4 | 뽑기 연출: 스카우트 티켓 카드 뒤집기·등급 빛, 대형 신인·우승 스킨에 재사용 |
| D5 | 나머지 화면 통일 (신문·선수 정보·이적·기록실·트로피) |
| D6 | 마무리: 휴대폰·태블릿, 애니메이션 끄기 설정, 속도, 브라우저 확인 |

- **사용자 결정 (2026-10-15)**: 색 = 시안 1의 **B(e스포츠 네온) 색 + C 둥근 모서리** / 포트레잇 = **32×32 픽셀 아트** (시안 2 그림 그대로, "귀엽다"), **최대 3배(96px)까지만** 키움 (저화질 도트를 크게 보일 필요 없음), **선수단 표에는 얼굴만 잘라서** (사용자가 아주 마음에 들어 함). 시안: `Claude outputs/design_mockup_1.html`, `design_mockup_2.html` (포트레잇 그리기 코드 draw32·face 그대로 옮겨 쓸 것).
- D0 끝 (PROGRESS 174, css/style.css만). 다음 D1 포트레잇.
- **D1 파츠 확정 (사용자, 시안 3·4)**: 피부 5 · 머리 모양 7 (짧은 앞머리·덮은 머리·옆으로 넘김·긴 머리·뾰족 머리·**대머리·아프로**, 쉼표 머리 뺌) · 머리색 7 (검정·갈색·금발·은발·파랑·**빨강·주황**, 진갈색·와인 뺌) · 눈 2 · 얼굴 너비 3 · 헤드셋 55% (**귀 이어컵이 보이게**, 팀색 안쪽 + 마이크) · 안경 18% · 표정 4 · 유니폼 = 팀 색. 수염·주근깨·머리띠·모자는 **안 넣음**. 구단 유니폼 색은 시안 3 표 그대로 OK (KT는 흰 바탕+빨강). 팀 고르기 카드에 유니폼 입은 내 캐릭터 + 색 두 칸. 그리기 코드는 `Claude outputs/design_mockup_4.html` draw32 (얼굴 x는 Math.floor — 홀수 너비가 흐려지던 문제 고침). 시안 4 사용자 OK ("최고").
- D1 끝 (PROGRESS 175: data/portrait.js·js/portrait.js, portraitImg/faceTd로 어디서나 얼굴).
- D2 끝 (PROGRESS 176, 사용자 선택 A안 + 퀘스트 1줄 2칸): heroCardHTML·matchCardHTML·questCardsHTML, 휴대폰 ☰ 메뉴 (남은 숙제였던 휴대폰 가로 넘침 해결). 
- D3 끝 (PROGRESS 177): js/replay.js. **'다' 안(자동 재생 + 설정 끄기)으로 시작, 유저 반응을 보고 '가' 안(다시 보기만)으로 바꿀 수 있게 남겨 둠** → REPLAY_RULES.defaultAuto = "off" 한 줄. 
- D4 끝 (PROGRESS 178): js/cards.js 뒤집는 카드 (인사 후보·대형 신인·우승 스킨).
- D5 끝 (PROGRESS 179, 시안 8): 페이지 머리 A안 카드형(data/pagehead.js·js/pagehead.js) + 팀 배지·순위 메달·최근 5경기·구단 카드·거주지 2줄 카드·SNS 아이콘·수상 카드·계약 카드. 새 화면을 만들 때도 teamMarkHTML·rankBadgeHTML·emptyBoxHTML 쓰기. 다음 D6 마무리 (휴대폰·태블릿, 애니메이션 끄기 설정, 속도, 브라우저 확인).

- **ver 1.2 해외 진출(아래)은 디자인 리뉴얼 뒤로.**
- **ver 1.2: ④ 내 선수 해외 진출** — 비시즌 해외 구단 제안 → 수락 시 해외 리그에서 뜀. 필요한 것: 해외 리그 정규 시즌 경기 실제 진행(지금은 지역 순위를 전력+운으로만 정함), 내 계약·연봉, 내 언어 실력(훈련·상점 어학·이벤트), 국내 복귀, 119의 '해외 구단 러브콜' 연작과 연결. 시작 전에 선택지로 물을 것.
- 그 밖에 (사용자가 고르기 전 시작 금지): 퀘스트 횟수에 따른 팀 내부 평가 / 해외 선수 이름 외 해외 리그 경기 기록 화면.
- 작은 아이디어: 관계를 다른 화면에도, 연락 도감, 시즌 선수 카드, 12각형 다른 선수 비교.

## 8. 밸런스 메모

- 1부 평균 전력 2013 약 64.8 → 2026 약 74.4 (사용자 수용).
- 강팀 쏠림 측정(134): 같은 국내 팀 월드 최다 5~6회 → 2회, 1위 구단 자금 26~55억 → 16~20억.
- 국제대회 국내 vs 해외: 168 측정 = 세트 64.8%, 월드 국내 우승 59%, 같은 해외 팀 연속 우승 판 7/18 → **169 적용 후 세트 70.0%, 국내 80%, 연속 0/18** (사용자 목표 70~80%, 위쪽 끝). 원인: 국내 우승팀만 흩어지고(러브콜·연봉 압박) 해외 팀 서열은 고정. 너무 국내 쪽으로 쏠린다는 피드백이 오면 지역 수준 0.93 또는 OVERSEAS_DYNASTY.moves 1을 먼저 측정. 측정은 `tools/measure_worlds.py`.
- 국내 리그 외국인 선수는 6시즌 동안 7~10명에서 안정.
- 147 이후 숙련도 20→100 = 세트 승률 +19.7%p, 메타 위주 vs 비메타 위주 +8.9%p. 너무 세다/약하다는 피드백이 오면 data/match.js CHAMP_EV.pow·metaPowerBonus·metaPenaltyDiv·jokerPowerBonus 4개로 조절.
- 연락이 많다면 EVENT_RULES.inboxPerSeason. 팬 선물 밸런스는 사용자가 먼저 꺼내기 전엔 언급하지 않음.

## 9. 다음 세션 시작 시

1. `git status --short`, `git log --oneline -15`, `git diff`로 현재 변경부터 확인. 현재 미커밋 변경을 보존하고, 다른 PC 동기화가 필요하면 작업 상태를 확인한 뒤 진행한다.
2. 새 사용자 요청 우선. 지금은 **7장 로드맵 ①~④를 순서대로** (①~④ 모두 끝: 169·171·172·173 → 다음 할 일은 사용자에게 선택지로 묻기, ver 1.2 해외 진출이 후보). 사용자가 "작업완료"라고 하면 1장의 체크리스트(태그 포함)를 알려 준다.
3. 큰 변경 뒤에는 PROGRESS.md 맨 아래에 번호를 이어 기록(**다음 번호 179**, `[ver 1.1]` 표시)하고 이 HANDOFF.md도 갱신. Claude 프로젝트에도 같은 내용(claude/HANDOFF.md, claude/PROGRESS.md)을 올린다.

## 10. 뉴스 개편 (161~167) — 요약

예전 10~17장에 흩어졌던 뉴스 개편 기록을 한 곳으로 줄였다. 자세한 수치는 PROGRESS.md 161~167, 검증 결과는 tools/NEWS_VALIDATION.md, 다른 AI용 설명은 AI_REVIEW_HANDOFF.md.

### 10-1. 무엇을 했나

| 번호 | 내용 | 주요 파일 |
|---|---|---|
| 161 | 뉴스 공통 등록: 신문 `publishHeadline`, 단신 `publishNotice`(addNews). 같은 주 같은 사건 중복 방지, 기사별 발생 날짜, SNS 소식 맨 위 **신문 기사 보관함**(최근 160건), 답 안 한 연락은 보관 한도와 별도로 보존(trimMessages) | js/news.js, js/news_popup.js, js/sns_page.js, js/save.js |
| 162 | **월즈 특집**: 41주 진입 시 다음 주 개막 예고(개최지·창작 주제곡/MV·올해 주요 경기·지역 MVP·전년도 우승팀/장면), 42주 개막 단신. 2012 LA 고정, 이후 활성 지역 수도 무작위 | data/worlds_news.js, js/worlds_news.js |
| 163 | **리그 성장**: 국내 리그 확대(2014·2016) 때 인기·투자 관심 기사, 새로 늘어나는 팬 1.0 → 1.1 → 1.2배 (addFans 양수에 한 번) | data/era.js LEAGUE_GROWTH, js/era.js, js/fame.js |
| 164 | **역사 뉴스** 2012~2026 26건: 1주 시대 소개(신년 기사에 합침), 29주·49주 소식. 게임 규칙은 바꾸지 않음 | data/historical_news.js, js/historical_news.js |
| 165 | **작은 시대 효과**: 운영·한타 스타일 점수 배율 2016 29주 운영 1.10 / 2022 29주 +한타 1.10 / 2024 1주 운영 1.15 (교체, 양 팀 같게). 게임 방법에 '현재 경기 환경' | data/era_match.js, js/era_match.js, js/matchsim.js phaseTeamScore |
| 166 | 자동 검사 8개 (tools/test_*.cjs) | tools/ |
| 167 | 실제 화면 검증 (클라우드 Chromium) + 휴대폰 폭 CSS 2건 | css/style.css |

### 10-2. 꼭 지킬 규칙

- 신문은 반드시 `publishHeadline(article, {id|variant|first})`, 단신은 `addNews`. weekReport.headlines에 직접 push하지 말 것. 같은 주에 같은 key 기사가 여러 개면 variant나 id를 줄 것.
- 뉴스 함수는 **표시·보관만**. 경기·팬·돈 효과는 원래 계산 경로에 둔다(재열기·불러오기로 보상 중복 방지).
- 저장: 최상위 `newsState`, `league.season.worldsFeature`·`historicalNewsSent`, `league.history[].worldsRecap`.
- renderAll이 `migrateCurrentNews`·`historicalNewsForWeek(true)`·`worldsNewsForWeek(true)`를 부른다(예전 저장 보완). 중복 방지 플래그가 있어 여러 번 불려도 안전 — 이 플래그를 지우지 말 것.
- 실제 역사 결과(우승팀·MSI 취소·프랜차이즈·스위스 등)를 게임 일정·승강제에 적용하지 않는다. 2027년 이후 가짜 역사 추가 금지.

### 10-3. 검증 결과와 남은 것

- 자동 8개 통과(5포지션 832주·저장 왕복 80회, 1,000세트 중 시대 효과로 승패 바뀐 것 1건).
- 화면(167): 보관함·29/41/42/49주·새해 신문·스크롤·클릭/ESC 닫기·저장 후 새로고침·NEWS 재열기·현재 경기 환경 경계·예전(160) 저장 40/41/42주 모두 통과.
- 남은 것: 휴대폰 폭 대시보드 가로 넘침(뉴스 이전부터 있던 레이아웃, 고치려면 메뉴 접기 등 — 사용자에게 먼저 물을 것), 실제 터치 기기·Edge/Firefox·file:// 직접 실행·사용자 실제 저장은 미확인.
- 참고(평가 때 발견, 미수정): 리그 성장 팬 1.2배가 158 팬 증가 속도에 곱해져 팬 돌파가 조금 빨라짐 / 게임 방법의 '+15%' 문구에 비해 실제 효과는 매우 작음 / historical_news 출처 링크 2개(2014 협곡, 2015 LCK)가 다른 글을 가리킴(화면에는 안 보임).
- 다음 번호 179.
