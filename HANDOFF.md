# 다음 세션 이어가기 — 2026-10-09, PROGRESS 146까지 (ver 1.1 작업 중)

새 세션(Claude Code·Codex 등 이 PC의 로컬 AI)은 **이 파일 → PROGRESS.md(맨 아래 121~133) → CLAUDE.md → 필요하면 GAME_PLAN.md** 순서로 읽고, 실제 git 상태부터 확인한다.

## 1. 프로젝트와 사용자 작업 방식

- 게임: 오프라인 텍스트 시뮬레이션 「프로게이머 커리어」. 저장소 `C:\Project\Game` (2026-10-09에 `C:\Project\Game\Game`에서 옮김), `index.html`을 브라우저에서 직접 열어 실행.
- 사용자(Shane)는 코딩 초보. **항상 짧고 쉬운 한국어 + 표**로 설명 (영어로 답하면 "한글로 다시"라고 함).
- 명확한 수정 요청·버그 신고·"~를 삭제해 줘" 같은 요청은 바로 진행한다.
- 큰 기능이나 "왜 이렇지?" 같은 원인 질문: 먼저 시뮬레이션으로 원인을 측정 → 표로 설명 → 고칠 범위를 여러 개 고를 수 있게 선택지로 묻는다. 사용자는 추천안을 대부분 전부 고르는 편이다.
- 아이디어 질문("~할 만한 게 있을지?")이면 표로 후보를 제시하고 사용자가 고르게 한다.
- 새 화면은 숨겨진 탭보다 **왼쪽 메뉴**에서 바로 보이게 한다 (기존 화면에 카드를 추가하는 건 괜찮음).
- **커밋은 사용자가 직접** 한다. 직접 커밋하지 말고 답변 끝에 아래 형식으로 준다 (CLAUDE.md의 자동 커밋 규칙보다 이 방식이 우선).

```powershell
cd C:\Project\Game
git add -A
git commit -m "이번 변경을 설명하는 한국어 메시지"
```

- 커밋 여부는 `git status --short`, `git log`로 확인. PROGRESS.md의 `(커밋 필요)` 표시는 커밋 뒤에도 남아 있으므로 믿지 않는다.
- "검토만" 요청이면 결과만 설명. 다른 AI·도구의 검토 결과를 붙이면 코드로 확인해서 답한다.

### ⭐ '작업완료' 규칙 (사용자 요청, 2026-10-09)

사용자가 **"작업완료"**라고 하면, 그 작업의 답변 끝에 **항상 아래 체크리스트를 다시 알려 준다** (짧은 한국어 + 표). 두 PC에서 git으로 원본을 최신으로 맞추고, 웹 주소(GitHub Pages)도 같이 업데이트하기 위해서다.

| 순서 | 할 일 | 명령 |
|---|---|---|
| 1 | 커밋 | `git add -A` → `git commit -m "..."` |
| 2 | GitHub에 올리기 (웹 주소도 1분 뒤 자동 업데이트) | `git push` |
| 3 | 다른 PC에서 작업을 시작할 때는 먼저 받아 오기 | `git pull` |

- push가 `rejected`면 → `git pull` 후 다시 `git push`. 충돌(conflict)이 나면 화면을 보여 달라고 안내.
- 한 번에 한 PC에서만 작업하는 게 가장 안전하다고 함께 알려 준다.
- 세이브(브라우저 localStorage)는 git으로 옮겨지지 않음 → 세이브 내보내기·가져오기.

## 2. git 상태와 GitHub (작성 시점)

- **버전**: GitHub에 올라간 133까지가 **ver 1.0** (git 태그 `v1.0`). 지금은 **ver 1.1** 작업 중 — 사용자 요청: **이번 버전 업데이트(친구 피드백 수정)가 모두 끝날 때까지 push하지 않음.** 화면 왼쪽 위 로고 아래에 'ver 1.1' 표시(index.html). 버전을 올리면 이 글자도 바꾼다.
- 실제 저장소 폴더는 **`C:\Project\Game\Game`** (아래 '옮김' 기록과 달리 아직 한 단계 안쪽). 명령 안내도 이 경로로.
- 134~139 (ver 1.1 수정)는 push 전. 해외 리그 확장은 ①단계(국제대회 해외 선수 등장) + 출신 리그 태그·모국어(140) + ② 시즌 이야기(141) + ③ 선수 오가기·외국인 1명·언어(144)까지 완료, ②지역 리그 이야기 ③선수 오가기 ④내 선수 해외 진출은 미착수.
- 주의: PC 저장소 파일은 줄바꿈이 CRLF(윈도우식)인 것이 있음. 클라우드에서 고쳐 넣을 때 원래 CRLF였던 파일은 CRLF로 맞춰서 넣기 (줄바꿈만 바뀌면 diff가 파일 전체로 보임).

- 133(`07720a5 확인 창을 화면 안 상자로 교체`)까지 커밋 + GitHub push 완료. 이 HANDOFF.md·CLAUDE.md 수정은 커밋 필요.
- GitHub 저장소: https://github.com/stlemm-rgb/lolst-pro (공개, 브랜치 `master`, remote `origin`).
- 웹 주소 (GitHub Pages, 로그인 없이 친구가 플레이): **https://stlemm-rgb.github.io/lolst-pro/** — Settings → Pages에서 master /(root). `git push`하면 1분쯤 뒤 자동 반영. 무료(사이트 1GB·월 100GB 권장 한도, 게임은 약 1.5MB).
- Claude 아티팩트 링크도 있음(https://claude.ai/artifact/VS5wFNae86znoPr7vjp7UQ) — 로그인이 필요해서 GitHub Pages를 주로 씀. 자동 업데이트 안 됨.
- 다른 PC: `cd C:\Project` → `git clone https://github.com/stlemm-rgb/lolst-pro.git Game` (→ `C:\Project\Game`) 후 위 '작업완료' 규칙대로 pull/push.

## 3. 최근 변경 (114~133, Claude 클라우드 세션에서 작업)

| 번호 | 내용 | 주요 파일 |
|---|---|---|
| 114 | 조커픽 2명 제한 + ✒️ 시그니처 픽 (숙련도 100 독백 → 선택, 좋은 장면 1번 보장, 선밴, 대격변 보호) | data/match.js, js/signature.js, js/champions.js, js/npc_mastery.js |
| 115 | 버그: 대회 시작 주 '이번 주 경기 없음' → 대진 미리 만들기 PRE_WEEK_EVENTS/prepareWeek | js/matchsim.js, js/main.js |
| 116 | [선수 정보] 능력 탭 스탯 12각형 (리그 평균 / 같은 포지션 평균 비교) | js/player_page.js, css |
| 117 | 이적 시장 활성화: 💥 1부 팀끼리 주전 이적, 🧩 경쟁 후보 영입(내 포지션 포함), 📋 이적 목록 | js/club_market.js, data/contracts.js(CLUB_MARKET.star·depth), js/market_pages.js |
| 118 | 수집·강화: 🎨 월드 우승 스킨(경기력 +2%), ✒️ 시그니처 ★1~★5 성장, 🏅 업적 도감 47개. 왼쪽 메뉴 '수집' 묶음 | data/collection.js, js/collection.js |
| 119 | **받은 연락 리뉴얼**: 반복·개수 조절, 결과 이야기, 🎲 능력치 판정, 연작, 시즌 흐름 연락, 시스템 연결 연락, 🤝 선수 관계·팀 케미, 선수 생활 연락 (연락 60 → 109개) | data/events.js, data/events_story.js, data/events_life.js, js/events.js, js/stories.js |
| 120 | 업적 보상(인기도·평판·돈) 삭제 — 업적은 소식만, 동·은·금은 난이도 표시 | data/collection.js, js/collection.js |
| 121 | 🤝 친구 시스템: 분기(3·16·29·49주) 친구 활동 연락, 친구 25·절친 50(최대 3명), 친구 전용 연락, friendTip 이적 제안, 왼쪽 메뉴 '친구' 화면 (state.friends) | data/friends.js, js/friends.js |
| 122 | 은퇴·세대교체: 시작 때 노장 섞기, 은퇴도 이적 목록에, 50주 메타 적응 은퇴 기사('메타 적응 불가'), 51주 은퇴 상담(은퇴/한 시즌 더/우리 팀 코치→2년 뒤 감독) | js/retirement.js, data/league.js, data/retire_stories.js(다른 AI) |
| 123 | 🌱 유망주 특성 2시즌(3년차 시작 때 사라짐) + 불러온 게임에서 안 사라지던 버그 | data/archetypes.js, js/creation.js, js/save.js |
| 124 | 특성 밸런스: 경기 특성 포지션 궁합(안 맞으면 절반)·생성 때 1개 제한, 라이벌 전용 S급 4개, 🎯 집중 견제, 숨은 컨디션 난조 (S급 시즌 시리즈 승률 95~100% → 약 85%) | data/traits.js, data/match.js, js/player.js, js/straits.js, js/match_events.js |
| 125 | 밸런스 측정 도구 tools/ (README·BALANCE.md) | tools/ |
| 126 | 🏠 팀 내 입지 (퀘스트·평판·경력(4강 이상)·경기력·근속 → 재계약 연봉·제안, 🎖️ 주장: 분위기 +1·이적 시장 영입 후보 3명) | data/standing.js, js/standing.js |
| 127 | 다른 선수 스탯 모양: 스탯 차이 크게(표준편차 6→10), 포지션 중요 스탯 3개는 평균보다 꼭 높게, 스탯 점수는 그대로 | data/league.js NPC_STAT_SHAPE, js/league.js shapeNpcStats |
| 128 | 💕 연애 요소 엔진 (인기도 40+, 1년 6개, 관심→썸→연애, 공개·열애설·응원·공세, 사생팬·스토커, 은퇴 엔딩 한 줄) — data/romance.js는 다른 AI | data/romance_rules.js, js/romance.js |
| 129 | 신년 소식 → 신문 기사 하나, 대형 신인 1명 1부 직행, 솔랭 1위 기사·연락, 주력 챔피언 너프 반복 수정(메타 유지 25%/내 주력 50%), 숙명의 라이벌은 리그의 에이스만 | js/main.js, js/league.js, js/dashboard.js, data/champions.js |
| 130 | 퀘스트: 5회짜리가 있으면 다음 퀘스트 최대 3회, 체력 회복 퀘스트는 체력 40 이하일 때만, 상단바 훈련 배지가 퀘스트와 같으면 연한 노란 배경으로 진행 단계 표시 | data/quests.js, js/quests.js, js/main.js planBadgeHTML, css |
| 131 | 지난주 결과에서 스폰서 계약 수입 줄 삭제 | js/dashboard.js |
| 132 | 스크롤해도 상단바가 가려지지 않게 (z-index) | css/style.css |
| 146 | ver 1.1 50주 은퇴 기사: 1부 주전 평균 위 선수만, 이름(종합 능력) | js/retirement.js |
| 145 | ver 1.1 해외 지역 간판 스타(상위 5명) 국내 영입 불가 | data/era.js, js/world_moves.js |
| 144 | ver 1.1 해외 리그 ③: 외국인 1명 제한, 해외 영입·FA 해외행·복귀, 언어 소통 효과 | js/world_moves.js, data/era.js, js/contracts.js, js/club_market.js, js/matchsim.js, js/match_events.js |
| 143 | ver 1.1 라이벌 전용 특성 규모 = 내 S급 수 (0개 없음 / 1개 에이스1+왕조 / 2개+ 예전대로) | data/traits.js RIVAL_SCALE, js/straits.js |
| 142 | ver 1.1 선수 검색·이적 목록에 출신 칸·출신 필터·해외 리그 선수 검색 | js/market_pages.js, js/club_market.js |
| 141 | ver 1.1 해외 리그 ② 시즌 이야기: 38주 지역 우승·MVP 기사, 해외 리그 화면 스타·역대 우승, 해외 선수 링크 | data/era.js, js/era.js, js/matchsim.js, js/links.js, js/market_pages.js |
| 140 | ver 1.1 출신 리그 태그(p.origin)·모국어, 지역 수준을 출신 기준으로 | data/era.js, js/era.js, js/league.js makeNpc, js/dynasty.js |
| 139 | ver 1.1 해외 리그 ①: 국제대회 해외 선수 실명 경기, 지역 3단계 수준(1.0/0.94/0.86) | js/matchsim.js, js/era.js, js/league.js findPlayer, js/npc_mastery.js |
| 138 | ver 1.1 2012년 시작 2주차 리그 규모 소개 기사 | data/era.js, js/era.js, js/main.js |
| 137 | ver 1.1 훈련 특성: 천재적 감각 +12%, 라인전 괴물·냉철한 판단·분석의 눈(예전 빠른 손) = 훈련 하나 스탯 3개 +30% | data/traits.js |
| 136 | ver 1.1 네임드 선수 Jimul(원딜)·Kibai(탑) 추가 (7명, 같은 포지션 네임드는 다른 팀) | data/named_players.js, js/league.js |
| 135 | ver 1.1 새 게임 훈련 기본값 = 솔로 랭크, 처음 안내 1단계 '훈련 바꿔 보기'(다른 훈련으로 바꿔야 완료, tutorial.startPlan) | js/main.js, js/guide.js, data/guide.js, js/creation.js |
| 134 | **ver 1.1** 친구 피드백: 강팀 쏠림 — 라이벌 특성 1년짜리, 집중 견제 NPC에도(+미끼 장면 해설), 월드 우승팀 분석 −3%, 왕조 연봉 압박(FA), 해외 러브콜, 상금 선수 분배, 평판 음수 진행 멈춤 버그 | data/dynasty.js, js/dynasty.js, js/straits.js, js/match_events.js, js/match_detail.js |
| 133 | 웹 공유용: confirm() 6곳 → 화면 안 확인 상자 askConfirm (웹/아티팩트에서 confirm이 막힘), startCareer(sure) | js/main.js, js/creation.js, js/market_pages.js, js/retire.js, css, tools/ |

자세한 수치·측정은 PROGRESS.md 114~133 참고.

## 4. 기술 규칙과 코드 위치

### 공통
- 순수 HTML/CSS/JS. 외부 라이브러리·CDN·웹 폰트·빌드 도구 금지. `file://` 실행 유지 → fetch·ES module 금지. 차트는 SVG 직접.
- 데이터는 data/*.js 상수, 로직은 js/*.js. index.html script 순서를 지키고 새 js는 start.js 앞에. `pages`는 main.js에서 만들어지므로 `pages.x = ...`를 하는 파일은 main.js 뒤.
- 저장은 localStorage. **새 최상위 필드는 js/save.js의 SAVED_FIELDS와 stateFromSave 둘 다** 수정. state.league·soloRank·contract는 통째로 저장 (league 안에 넣은 필드는 따로 등록 불필요). career 숫자 필드는 stateFromSave 숫자 키 목록에.
  - 최근 추가된 최상위 필드: signature·sig100 (114), sigGrowth·achievements (118), eventLog·flags·relations·trigQueue (119).
- 초기 상태 createNewState는 js/main.js, 캐릭터 생성·첫 계약은 js/creation.js. 화면 pages.<id>, 메뉴 data/menus.js MENU_GROUPS (내 선수 / 경기 / 수집 / 이적 / 기록), 이동은 selectMenu.
- **confirm()/alert()/prompt() 금지** — 웹 링크에서 막힘. 확인이 필요하면 js/main.js `askConfirm(문장, 예일때함수, "예 버튼 글자")`.
- 화면 안 버튼 클릭은 js/main.js renderPage 안의 `querySelectorAll("[data-…]")` 묶음에 추가 (예: data-radar, data-tlog-year).
- 특성: traitSumOf / traitKeyOf / traitsOf. 내 선수 ID는 USER_ID.
- 주간 흐름은 js/main.js nextWeek: 훈련 → 경기 → 급여·활동·인기도·업적 → 주 넘김(새해면 새 시즌) → 대진 미리 만들기 → 새 챔피언·패치 → 2군 판정·올스타·여름/비시즌 시장 → 시그니처 체크 → 받은 연락(runWeeklyEvents) → 퀘스트.

### 경기 일정
- 리그 대진 짜기(LCK 컵 2주·정규 시즌 13주·후반기 30주)는 js/matchsim.js PRE_WEEK_EVENTS + prepareWeek(week) — 그 주와 다음 주를 미리 만든다. 앞 라운드 결과가 필요한 토너먼트는 WEEK_EVENTS + koPreview/intlPreview. 새 대회를 추가할 때 이 규칙을 지켜야 '이번 주 경기 없음' 버그가 안 생긴다.

### 이적 시장 (117)
- js/club_market.js, 값 data/contracts.js CLUB_MARKET. 비시즌: offseasonRebuild = fireSale → starTransfers(1부 주전 이적) → 보강 라운드 tryBuy → depthSignings(경쟁 후보, 내 포지션 포함) → fillRosters.
- 여름(23~28주, 29주 적용)은 js/summer_market.js. 모든 NPC 이동은 npcTransfer/tryLoan에서 logTransfer → state.league.transferLog → [이적 시장] 📋 이적 목록.
- 47주 순서: NPC 성장 → 구단 정산 → 내 계약 제안 (다음 시즌 리그는 nextTier/nextTierName, 계약 연도는 contractYear).

### 해외 리그 (139~140, ver 1.1)
- 사용자가 고른 순서: ① 국제대회 해외 선수(완료) → 출신 태그(완료) → ② 지역 리그 시즌 이야기 → ③ 선수 오가기 + 외국인 수 제한 + **언어 소통 효과**(팀 언어 실력 평균 → 운영·한타 −, 콜 충돌 ↑, 해마다 적응) → ④ 내 선수 해외 진출 + 내 언어 실력 → **사용자 결정: 다음 버전(ver 1.2)에서.**
- 지역 수준 3단계 (사용자 결정): 우리 리그 1.0 > 중국·북미·유럽 0.94 > 나머지 0.86. 출신 기준으로 새해마다 50%씩 맞춤.
- 해외 선수는 state.world.players (id 'X…'), findPlayer가 같이 찾음. 이름 링크도 됨 (links.js).
- 파일을 PC로 넘긴 뒤에는 반드시 다시 가져와 내용이 같은지 확인 (140 때 data/era.js가 옛 내용으로 들어가 게임이 빈 화면으로 멈춘 일이 있었음).
  - 원인 추정: 클라우드 세션의 device_commit_files가 같은 stagedPath를 다시 쓰면 예전 내용을 넣는 경우가 있음 → **커밋할 때마다 새 폴더(/mnt/user-data/outputs/c<시간>/…)에 복사해서 넘기고, 넘긴 뒤 다시 stage해서 cmp로 확인.**

### 강팀 쏠림 막기 (134, ver 1.1)
- 값: data/dynasty.js (DYNASTY 연봉 압박 · ABROAD 해외 러브콜 · SCOUTED 분석 −3% · PRIZE_SHARE 상금 절반 선수 몫 · DECOY 미끼 장면·해설 외침). 코드: js/dynasty.js.
- 새해: saveSeasonHistory가 `state.league.lastChamps {year, ids}` 저장 → contractsNewSeason '1.5)'에서 dynastyNewSeason(moves) (계약 만료 처리 전). 연봉이 오른 선수는 contractEnd를 올해 이상으로 (만료 처리에서 덮어쓰지 않게). FA로 나간 선수 p.leftFrom/leftYear → sellable에서 원래 팀 재영입 막음.
- 해외 진출: 국내 선수를 state.world 해외 선수로 다시 만들고 league.players에서 삭제 (은퇴처럼). 이적 목록 kind 'leave'·'abroad'(e.to).
- 집중 견제: js/match_events.js sCountOfId (내 선수 = userSCount, 다른 선수는 라이벌 전용도 셈, GOAT 제외), rollSetEvents에서 ctx.focus·out.focus → set.focus → 세트 상세 fo. 사건 rec.call(해설 외침 번호)·rec.fm(견제받는 동료 덕분). 화면 match_detail.js focusNoteHTML·decoyCallHTML.
- 라이벌 규모(143): RIVAL_SCALE — 내 S급 0개면 에이스·왕조의 심장 없음, 1개면 에이스 1명+왕조, 2개 이상 에이스 3명+왕조. 불러올 때 enforceRivalScale, 새해 refillRivalAces.
- 라이벌 1년짜리: straits.js clearRivalTitle (r_ace는 시즌 끝, r_dynasty는 리그 결승 MVP 때 교체), 예전 세이브 trimRivalTitles (ensureNpcTraits에서, state.league.rivalYearDone).

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

- **밸런스 측정은 `tools/`** (125): `tools/README.md` 사용법, `tools/BALANCE.md` 조절 값 위치·지금 값·측정 기준. `measure_traits.py`(특성 효과, 포지션 궁합 평균) · `measure_seasons.py`(여러 시즌 시리즈 승률·연락·은퇴·절친, `--variant`로 값 후보 비교). 파일을 고치지 않고 `--set 경로=값`으로 바꿔 끼워 비교한 뒤 좋은 값만 data/*.js에 반영하고 BALANCE.md도 고친다.
- 이 PC에서는 PowerShell·Node로 저장소 파일을 직접 수정하면 된다 (클라우드 세션의 업로드/커밋 절차는 필요 없음).
- 문법 검사: 바뀐 JS마다 `node --check`, 변경 내용은 `git diff --check`.
- 이전 Codex 세션 메모: Playwright + Edge headless가 중간에 종료되어 화면 검증을 못 했고, 대신 Node vm으로 index.html 순서대로 스크립트(start.js 제외)를 불러 게임 함수를 실행했다 (DOM 렌더링만 대체).
- 클라우드 세션에서는 Playwright(Chromium)로 화면까지 확인했다. 쓸 수 있으면 이 방법이 가장 확실하다:
  - 새 게임: `draft.name='테스트'; draft.startYear=2012; renderCreation(); startCareer(true);` (true = 남은 포인트 확인 상자 건너뜀) (**시작 연도는 2012·2017·2022만** 가능). 1부 팀: `draft.teamChoice = draft.teams.findIndex(d=>d.tier===1)` (startCareer 전).
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

1. `git pull`(다른 PC에서 올린 게 있을 수 있음) → `git status --short`, `git log --oneline -10`.
2. 새 사용자 요청을 우선한다. 지금은 **ver 1.1: 친구들이 발견한 문제 수정** 단계 — 사용자가 문제를 하나씩 알려 줌. 다 끝나면 커밋 → push(웹 반영). 참고: 해외 팀이 월드를 여러 번 가져가는 판이 있음(134 측정, 아직 손대지 않음).
3. 큰 변경 뒤에는 PROGRESS.md 맨 아래에 번호를 이어 붙여 기록하고(다음 번호 147), 이 HANDOFF.md도 갱신한다.
4. 사용자가 "작업완료"라고 하면 위 '작업완료' 체크리스트(커밋 → push → 다른 PC는 pull)를 다시 알려 준다.
