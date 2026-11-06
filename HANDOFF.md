# 다음 세션 이어가기 — 2026-11-06 갱신 (307 사운드 · 299~306 사기 챔피언(패치 실수)·미니맵 움직임·밴 이유 태그·밴픽 화면 클릭 대기) / 이전: 2026-11-05 (298)

새 세션(Claude Code·Codex·Claude 클라우드 세션 무엇이든)은 **이 파일 → CLAUDE.md → FILEMAP.md(파일 위치) → PROGRESS.md 최근 항목 → 필요하면 GAME_PLAN.md** 순서로 읽고, 먼저 실제 git 상태(`git status --short`, `git log --oneline -10`)를 확인한다.
예전 기록: ver 1.0(1~133번)은 [docs/PROGRESS_1-133.md](docs/PROGRESS_1-133.md), 뉴스 개편 검증 요청문(끝난 일)은 [docs/AI_REVIEW_HANDOFF.md](docs/AI_REVIEW_HANDOFF.md), 뉴스 검증 결과는 [tools/NEWS_VALIDATION.md](tools/NEWS_VALIDATION.md).

## 0. 지금 상태 한눈에

| 항목 | 상태 |
|---|---|
| 저장소 폴더 | **`C:\project\Game`** (명령 안내도 이 경로. 예전 `C:\Project\Game\Game`은 틀림) |
| 출시 | ver 1.2.1 (태그 v1.2.1) 공개 중. 화면 왼쪽 위 `ver 1.2.1` (Challenger_Road.html 로고) |
| ⚠️ 공개 배포 (2026-11-05 사용자 결정) | 월즈 기간 동안 일반 공개(무료·수익 없음), **이후 업데이트 없음 · 라이엇 공식 요청 오면 바로 내림 · 2026 월즈 끝나면 공개 중단** (설정 화면 ABOUT_NOTICE). 라이엇 정책 3항은 게임에 IP 사용 금지라 위험은 남음(PROGRESS 282). 내리는 법: 저장소 Settings → Pages에서 끄기 또는 .github/workflows/pages.yml 끄기 — 사용자와 같이 |
| 지금 작업 | **307까지 끝, push 끝** (2026-11-06). 오늘: 299~303 사기 챔피언(패치 실수로 SS·SSS, 다음 정기 패치까지 유지, SSS 글로벌 밴, 사과 인터뷰·SNS·기사 — data/op_patch.js·js/op_patch.js, 보너스 크게 = 사용자 가안) · 미니맵 자연스러운 움직임+경기 끝 배치(data/replay.js REPLAY_DOTS) · 밴픽 화면은 클릭해야 다음 · 밴 이유 태그(가안, REPLAY_BAN_WHY) · 306 휴대폰 내 선수 카드 중복 · 307 소리(효과음 레트로 게임기·배경 음악 소환, data/sound.js·js/sound.js, 설정은 세이브와 따로). 경기 재생 점검(4경력 92경기 223세트 프레임 1.6만 개) 오류 0. **다음 후보 (사용자에게 고르기)**: ① 🔴 공개 사이트 내리는 날짜 정하기(2026 월즈 끝나면, 사용자와 같이) ② 🔴 경기 재생 자동 검사를 check_all에 넣기(미니맵 버그가 일부 경력에서만 나서 기존 검사가 놓침 — scratchpad replay_smoke 방식: 45주 진행 → 모든 세트 t 0.37씩) ③ ✅ 사기 챔피언 영향 측정(308: 시즌 성적 차이 오차 안 → 사용자: 그대로 둠) ④ 소리 기본 켜짐 괜찮은지·실제 아이폰 소리 확인(이 PC WebKit은 AudioContext 없음) ⑤ 숙련도 비대칭 A/B 결정 ⑥ 폴리싱(화면 직접 보기, pixelfx — Codex용 목록 docs/CODEX_POLISH.md P1~P8, 한 번에 하나 — 309에서 P1·P2 끝, 311·312에서 P3 전부 끝(22화면), **다음 P4**. Codex는 샌드박스에서 브라우저가 안 떠서 촬영 스크립트만 쓰게 하고 Claude가 돌림) ⑦ 밴 이유 나/다안·경기 상세 포지션 해설·위기 기사 더. 후반 쉬움(247)은 사용자 "일단 둠". Codex는 토큰 없음 → 직접 진행 |
| 방금 (2026-11-02) | 238 체력·컨디션 불이익(부상·번아웃·합숙 매주 컨디션 −2) → 239 컨디션 바닥 반등(30 아래면 매주 +4, 연패 문제) → 240 PC 대시보드 빈칸 정리(바로가기 6칸·미니 스탯·빈틈 없이 쌓기·중복 정리, 시안 26 A) |
| 그다음 (사용자 결정 2026-11-03) | ① 네임드 선수 정리 → ② 실제 LoL 역사에 맞춘 진행 → ③ 시간 진행에 따른 이벤트 추가 → ④ 5개 포지션별 플레이 경험 차별화 → ④-2 받은 연락 선택지 효과 리뉴얼 → ⑤ 전체 페이지·휴대폰 폴리싱 (7장). **내 선수 해외 진출은 사용자가 꺼낼 때까지 보류** |
| 알려진 위험 | ✅ 283에서 고침: js/links.js 앞쪽 살피기 정규식(iOS 16.3 이하 Safari 오류). 새 정규식에 (?<= (?<! 쓰지 말 것 — node tools/test_old_safari.cjs가 잡음 |

## 1. 사용자와 작업 방식

- 게임: 오프라인 텍스트 시뮬레이션 「챌린저 로드」(옛 이름 프로게이머 커리어). `Challenger_Road.html`을 더블클릭해 실행. 친구들은 웹 주소로 플레이.
- 사용자(Shane)는 코딩 초보. **항상 짧고 쉬운 한국어 + 표** (영어로 답하면 "한글로"라고 함).
- **커밋·push는 Claude가 직접** (사용자 2026-11-06: "앞으로도 네가 git push해줘"). 기능이 끝나고 검사를 통과하면 바로 `git add -A` → commit → push 하고 결과를 알린다. 예전 안내 형식(참고):

```powershell
cd C:\project\Game
git add -A
git commit -m "이번 변경을 설명하는 한국어 메시지"
git push
```

- 큰 기능·"왜 이렇지?" 질문: **먼저 측정(시뮬레이션) → 표로 원인 → 선택지(여러 개 고를 수 있게)로 묻기.** 사용자는 추천안을 자주 고르지만 "각 선택지 자세히", "측정부터 다시"처럼 되묻기도 함 → 후보별 숫자 비교표.
- 디자인은 HTML 시안 2~3개 → 사용자가 고름 → 적용 (D0~D6 때 방식). 시안 18부터 **frontend-design 플러그인**(사용자가 켬) 지침으로: 화면마다 눈에 띄는 것 하나, 게임 안에 있는 것(티어·등록증·도트 얼굴)에서 출발, 똑같은 카드 나열·대문자 라벨·가운뎃점 나열 피하기.
- 명확한 수정 요청·버그 신고(스크린샷 포함)는 바로 진행.
- 새 화면은 숨은 탭보다 **왼쪽 메뉴**에 바로 보이게. 메뉴 칸에는 icon 필수 (224, data/menus.js). 대시보드는 225에서 이번 주 중심으로 바꿈 (pages.dashboard, js/dashboard.js weekCommandHTML). PC 대시보드는 240에서 바로가기 6칸(data/ui.js QUICK_ACTIONS.pcIcons, 왼쪽 메뉴·위 막대·휴대폰과 안 겹치게, 271에서 휴식 주·지난 신문 → 퀘스트·지난 경기) + 아래 빈틈 없이 쌓기(.dmas) — 새 칸은 .dmas 안 순서로 높이를 맞출 것. 대시보드에 같은 정보를 두 번 넣지 않기 (사용자 2026-11-02: 휴대폰 칸·언급 알림 줄·진행 버튼 중복 정리).
- PC에서 **Claude Code도 같이 쓴다** → 작업 전 `git status`/`git diff`로 최신 상태를 보고 파일을 다시 읽기.
- **PC 연결이 끊기면 채팅에 파일을 첨부하지 않는다** (사용자가 받아 저장하면 '-1' 사본이 커밋됨). 다시 연결될 때까지 기다리거나 그렇게 알리기.
- 다른 AI의 검토 결과를 붙여 주면 코드로 확인해서 답한다.
- 웹(claude.ai) Claude 세션도 같은 저장소를 고침 (241: PR #1). 시작 전 `git fetch` → 새 브랜치·PR이 있는지 확인. 웹 세션 push가 403이면 claude.ai/connect-github 재연결 또는 패치 파일.
- Codex CLI: 이 PC는 VS Code 확장 안 `%USERPROFILE%\.vscode\extensions\openai.chatgpt-*in\windows-x86_64\codex.exe` (PATH에 없음).
- 밸런스 측정은 두 단계: ① 후보를 넓게 씨앗 2개(3연도 × 2)로 거르기 → ② 유력 2~3개 + '지금'만 180시즌(3연도 × 씨앗 6, 오차 ±3.5%p).

### ⭐ '작업완료' 규칙

사용자가 **"작업완료"**라고 하면 답변 끝에 항상 다시 알려 준다:

| 순서 | 할 일 | 명령 |
|---|---|---|
| 1 | 커밋 | `git add -A` → `git commit -m "..."` |
| 2 | GitHub에 올리기 (웹 주소도 1~2분 뒤 자동, Actions 탭 초록 체크) | `git push` |
| 2-1 | 태그를 만들었으면 태그도 | `git push --tags` (`git push`만으로는 안 올라감) |
| 3 | 다른 PC에서 작업 시작 전 | `git pull` |

- push가 `rejected`면 `git pull` 후 다시 push. 충돌이 나면 화면을 보여 달라고 안내. 한 번에 한 PC에서만 작업 권장.
- 세이브(브라우저 localStorage)는 git으로 안 옮겨짐 → 설정의 세이브 내보내기·가져오기.

## 2. GitHub · 웹

- 저장소: https://github.com/stlemm-rgb/lolst-pro (공개, 브랜치 **master**, remote `origin`).
- 웹 주소: **https://stlemm-rgb.github.io/lolst-pro/**
- **배포 (R7)**: push하면 GitHub Actions(`.github/workflows/pages.yml`)가 `tools/bundle.py`로 스크립트 83개를 `game.js` 하나로 묶어 올림 (공개 사이트에는 Challenger_Road.html·game.js·css만, 1.6MB). 저장소 Settings → Pages → Source = **GitHub Actions** (설정 끝남). 실패하면 Actions 탭 → '공개 사이트 올리기' → Run workflow.
- 새 버전을 올리면 `?v=해시`가 바뀌어 브라우저가 바로 새 파일을 받음. 친구 세이브는 주소가 같으면 유지.
- `.github/` 폴더는 클라우드 세션의 device_commit_files로 못 씀(보호 파일) → device_bash로 써야 함.

## 3. 파일 구조 (R2 이후)

- **어느 파일에 무엇이 있는지는 FILEMAP.md** (`python3 tools/filemap.py`로 다시 만들기). 새 파일을 만들면 Challenger_Road.html에 넣고 지도도 다시 만들 것.
- 스크립트 83개 (data 33 · js 50). R2에서 작은 파일을 주제별로 합침 — 파일 안 `━━━━━ (예전 파일 이름) ━━━━━` 머리로 구분. 옛 문서의 `data/stats.js`·`js/trophies.js` 같은 이름은 지금 없음 → FILEMAP에서 찾기.
- 문서: CLAUDE.md(규칙) · HANDOFF.md(이 파일) · PROGRESS.md(134번부터) · GAME_PLAN.md(기획) · FILEMAP.md · tools/README.md(도구) · tools/BALANCE.md(밸런스 값·측정) · docs/(예전 기록).

## 4. 기술 규칙과 코드 위치

### 공통
- 순수 HTML/CSS/JS. 외부 라이브러리·CDN 금지. `file://` 실행 → fetch·ES module 금지. 차트·그림은 SVG·캔버스 직접. 빌드 도구는 공개 사이트 배포(R7)만 예외.
- 데이터는 data/*.js 상수, 로직은 js/*.js. Challenger_Road.html script 순서 유지, 새 js는 start.js 앞에. `pages.x = ...`를 하는 파일은 main.js 뒤.
- **전역 함수 이름이 겹치면 뒤 파일이 앞 파일을 덮음** (D5 때 miniBarHTML·pctText 겹침으로 화면 깨짐) → `node tools/test_names.cjs`로 확인.
- **confirm()/alert()/prompt() 금지** (웹에서 막힘) → js/main.js `askConfirm(문장, 예일때함수, "예 버튼 글자")`.
- 화면 안 버튼은 renderPage의 `querySelectorAll("[data-…]")` 묶음에 추가.
- 특성: traitSumOf / traitKeyOf / traitsOf / matchTraitsOf. 내 선수 ID는 USER_ID.
- **화면 연출용 무작위는 `fxRandom()`** (js/portrait.js). `Math.random`을 쓰면 게임 결과용 난수가 밀려 정답지(golden)가 달라짐.
- 정렬에 값 계산이 무거우면 `sortDescBy(list, valueOf)` (js/champions.js, 값 한 번만 계산).
- 주간 흐름 js/main.js nextWeek: 훈련(대성공 rollGreat) → 경기 → 급여·활동·인기도·업적 → 주 넘김(새해면 saveSeasonHistory → newSeasonLeague → contractsNewSeason → addBigRookies → initContracts → refillRivalAces) → 대진 미리 만들기 → 시대 기사 → 새 챔피언·패치 → 시장 → 받은 연락 → 퀘스트 → `saveGameSoon()`(30ms 뒤 저장).

### 저장 (js/save.js)
- localStorage 키 `progamer-career-save`. 저장 글자 = `"LZ1|" + 압축(JSON)` (R5). 읽기·가져오기는 압축/일반 둘 다 받음, 내보내기 파일은 일반 JSON.
- **새 최상위 state 필드는 SAVED_FIELDS와 stateFromSave 둘 다.** state.league·state.world는 통째로 저장 (안의 새 필드는 등록 불필요).
- 예전 세이브 처리: js/save.js 맨 위 '예전 세이브 처리 지도' + `ensureStateReady()` (불러오기 뒤 한 번). 새 보완 함수는 여기에 넣고 `python3 tools/test_oldsaves.py`.
- 얼굴(look)은 stateFromSave에서 cleanLook으로 복원 (184 버그 원인).

### 뉴스
- 신문은 `publishHeadline(article, {id|variant|first})`, 단신은 `addNews`. weekReport.headlines에 직접 push 금지. 같은 주 같은 key 기사가 여럿이면 variant나 id.
- 뉴스 함수는 **표시·보관만**. 경기·팬·돈 효과는 원래 계산 경로에 (재열기·불러오기로 보상 중복 방지).
- 프랜차이즈(253): 2021~ 1부 = 구단 열쇠 10개(t.org), 2부 = 2군(t.academyOf·t.parent), 해체 팀은 state.league.oldTeams (findTeam이 찾음, 명단 빈 팀). 새 팀 목록 반복 코드는 state.league.teams만 보면 됨.
- 실제 역사 결과를 게임 일정·승강제에 적용하지 않음. 2027년 이후 가짜 역사 추가 금지. '실제 역사와 게임은 다르다'는 안내문은 넣지 않기 (248 사용자 요청으로 삭제). ⚠️ 로드맵 ②(실제 LoL 역사에 맞춘 진행, 사용자 2026-11-03)에서 이 규칙을 바꿀 예정 — 어디까지 맞출지는 ② 시작 때 측정·선택지로 정하고, 그 전까지는 지금 규칙 그대로.

### 경기
- 리그 대진: js/matchsim.js PRE_WEEK_EVENTS + prepareWeek. 토너먼트: WEEK_EVENTS + koPreview/intlPreview.
- 세트 점수 = 선수 경기력 평균 + 라인전 + 운영·한타(+언어 소통 −) + 조합 + **경기 흐름 사건** + 운. 승패는 대부분 사건이 정함 → 사건 주인공 가중치 js/match_events.js evActorWeight.
- 경기 재생(js/replay.js)은 경기 흐름 기록을 다시 보여 주기만 함. 자동 재생 기본값 REPLAY_RULES.defaultAuto. 200: 세트·경기 끝은 화면을 가리지 않는 아래 안내(replayEndBar), 내 장면 금색·내 장면만 보기, 빠르기 1배 = 경기 1분 1.2초.

### 이적 시장
- 비시즌 contractsNewSeason 순서: 내 이동 → dynastyNewSeason → langNewSeason → returnHomeMoves → foreignReturnMoves → 계약 만료 → importMoves → offseasonRebuild → fillRosters → faAbroadMoves → FA 정리.
- 내보낼 선수는 `surplusPlayer(teamId, 새로 온 id)`, 채우기는 fillRosters. **외국인 1명 제한**: 모든 영입 경로에서 `foreignOk`/`foreignRoom`. 새 영입 경로를 만들면 꼭 넣을 것.
- 모든 이동은 logTransfer → state.league.transferLog.

### 해외 리그
- state.world = { teams[{id 'O…', region, roster}], players{ 'X…': {...origin, langs, abroadYear} }, history[], … }.
- 국내 ↔ 해외 변환: js/world_moves.js worldToLeague / leagueFAToWorld, js/dynasty.js moveAbroad. 변환 때 국내 선수는 league.players에서 삭제 → 남은 id는 playerName 전에 존재 확인.
- 언어: langSkill(p, code), teamLangOf(teamId), langGapOf(lineup, teamId). 모국어 100, 처음 0(영어 30), 새해 +35.

### 기타
- **인기도는 꼭 addPopularity(v)** (팬 수 같이 움직임).
- **글 빈칸 뒤 조사(279)**: `{player}가`처럼 고정 조사 금지 → `{player}이(가)`·`을(를)`·`은(는)`·`와(과)`·`(으)로`·`(이)지`, 어색하면 문장을 바꿈. `node tools/test_josa.cjs`가 잡음 (숫자 빈칸은 목록으로 뺌).
- 친구·동료 글(204): 남자 선수끼리 연애·성적 비유로 읽힐 말투 금지 (밤·잠자리·몸 접촉·눈 맞춤, 살살·끼우기 같은 이중 의미, '곁에 두고 싶다'류). 친구 말투 = 단톡방·내기·놀리기.
- 코치 안내·팁(215): 글 data/guide.js COACH_TOUR·COACH_TIPS, 로직 js/guide.js (renderCoach는 renderPage 끝). 새 기능이 생기면 처음 볼 때 팁 한 줄을 COACH_TIPS에 + coachTipWhen에 조건. 단계 target은 PC·휴대폰 둘 다 적기 (예: #next-week, .mnav-go), 휴대폰만 다르면 targetM. 단계는 wait 조건으로 저절로 넘어가게 (버튼만으로 넘기는 단계는 만들지 않기, 사용자 요청 216).
- 업적 보상 없음 (다시 넣지 말 것). 받은 연락: data/events*.js + js/events.js·js/friends.js, 새 트리거는 queueTrigger + QUEUE_TRIGGERS.
- 구단 스태프: team.staff[role].g (0=S ~ 4=D). 분석 리포트의 상대 계획은 m.scout → playMatch가 그대로 씀.
- 받은 연락 휴대폰(218~221): msgDeckHTML 하나를 SNS 화면 왼쪽과 휴대폰 창(openPhone, 대시보드 [📱 휴대폰 열기])이 같이 씀, 버튼은 bindPhoneDeck. "SNS 열기" 대신 휴대폰 창을 여는 게 기본. 연락 2개 이상 = 대화 목록(deckOpenId null) + 계약 제안 비교표(223).
- 경기 화면 팀 색(219): 우리 팀 하늘 · 상대 분홍 = css --side-a/--side-b, 우리 팀이 b면 sideSwapClass(m). 새 경기 화면 요소도 .a/.b·s0/s1에 이 변수를 쓸 것 (--accent/--bad 직접 쓰지 말기).
- 빅게임: bigGameOf(x, y), 쌍 추가는 data/club.js BIG_GAMES 한 줄.
- **보안(286)**: 화면에 넣는 글은 escapeHTML, 글 속 실행 코드(onclick="…")·eval·바깥 불러오기 금지 — 공개 사이트 CSP(tools/bundle.py)가 막고 `node tools/test_security.cjs`가 잡음. 세이브는 불러올 때 cleanSaveText(모든 글 < > ` 지움, 287)·cleanSaveNames — 새 저장 칸에 < > `를 쓰는 글을 넣지 말 것(지워짐).
- **뒤로 가기·탭 밀기(285, js/nav.js)**: 새 겹창은 Esc로 닫히게 만들 것 (뒤로 가기가 Esc를 보냄) + shortcuts.js popupOpen 목록에 id.
- **경기 재생 연출 단계 태그 (289~)**: replay-0-before(A 전) · replay-A · replay-B · replay-C — 되돌리려면 `git revert` 또는 태그 비교. 사용자: 전부 하되 A→B→C 순서, 단계마다 되돌리기 쉽게.
- **ⓘ 설명 창(274)**: 매주 볼 필요 없는 고정 설명은 늘 보이는 글 대신 `helpBtnHTML(글)` (js/ui.js, 글은 data/ui.js HELP_TIPS, 줄바꿈 
). 휴대폰에서도 화면 안에 뜨고 닫힘. 버튼 안에는 넣지 말 것(제목 줄 옆에만). 탭으로 묶인 화면은 h1이 지워지니 카드 안에(280). 예전 CSS 툴팁 .tip은 짧은 이름표용으로 그대로.
- 디자인 부품: 새 화면도 pageHeadHTML·teamMarkHTML·rankBadgeHTML·emptyBoxHTML·portraitImg/faceTd 쓰기 (data/ui.js·js/ui.js·js/portrait.js). 색은 css/style.css 맨 위 변수만.
- 훈련 대성공: data/great.js GREAT_RULES (228: 기본 2%·최대 10%, 유망주 7%·15%), 저장 칸 state.great.
- 시작 화면·캐릭터 생성(212·213, js/creation.js): 캐릭터가 없으면 renderCreation → 시작 화면(startScreenDone=false) → [선수 등록하기] → 7단계(CREATION_STEPS, data/ui.js). 시작 화면 검사는 **구단 목록 맞추기 뒤**에 있어야 함 (측정 도구 sim_lib.new_career가 draft.startYear만 바꾸고 renderCreation을 불러서, 앞에 두면 정답지가 달라짐). 단계 화면 버튼은 그 단계에만 있으니 묶을 때 없으면 건너뜀. 도트 글자 로고 = js/portrait.js pixelLogoHTML. 버전 글자는 Challenger_Road.html 로고 한 곳.
- 단축키(198·199, 사용자 지정 Space 다음 주·F 휴식·A(ㅁ) 요약 확인·D·S·T·/ 목록): data/ui.js SHORTCUTS, js/shortcuts.js. 새 겹창을 만들면 shortcuts.js popupOpen() 목록에 id를 넣을 것 (창이 열려 있을 때 N으로 주가 넘어가지 않게).

## 5. 검사 (코드를 바꾸면)

| 명령 | 하는 일 | 시간 |
|---|---|---|
| `python3 tools/check_all.py` | 자동 검사 전부 (*.cjs, 예전 세이브 4가지, 정답지) | 약 3분 |
| `python3 tools/golden.py check` | 시나리오 5 × 10시즌 결과가 정답지와 같은지 (일부러 결과를 바꿨으면 `make`로 새 정답지) | 약 2분 |
| `python3 tools/shots.py` | 화면 79장 비교 (기준 폴더와) | 약 4분 |
| `node tools/test_names.cjs` | 전역 이름 겹침 | 1초 |
| `python3 tools/bundle.py /tmp/site` + `GAME_INDEX=/tmp/site/index.html python3 tools/golden.py check` | 공개 사이트 묶음도 같은지 | 2분 |
| `python3 tools/profile_week.py` | 한 주 진행 속도 (R6 뒤 약 50ms) | 1분 |

- 밸런스 측정: tools/README.md, tools/BALANCE.md, `tools/measure_worlds.py`. 같은 씨앗 = 같은 결과.
- Playwright(Chromium)는 클라우드 세션에 있음. 새 게임: `draft.name='테스트'; draft.startYear=2012; renderCreation(); startCareer(true);` / state.plan이 있어야 nextWeek 진행 / 게임마다 페이지를 새로 열기.
- 클라우드 Bash는 한 번에 10분 제한 → check_all과 shots는 따로 실행.

## 6. ⚠️ 클라우드 세션(Claude Cowork)에서 PC 파일을 고칠 때

PC에서 직접 작업하는 AI(Claude Code 등)는 해당 없음.

1. 문서·작은 수정은 **device_bash로 PC 파일을 바로** 고친다 (python으로 읽고 고쳐 쓰기, 줄바꿈 CRLF/LF 그대로 유지).
   - device_bash가 없는 세션도 있음 (2026-10-30): 그때는 `.git/index`를 stage해서 파일 크기·수정 시각과 비교하면 git status 대신 확인 가능. 게임 코드는 GitHub에서 clone(공개)해 같은 커밋에서 고치고, PC 파일은 CRLF라 보낼 때 CRLF로 바꿔서 device_commit_files (expectedMtimeMs로 덮어쓰기 막기).
2. 게임 코드 수정·검사가 필요하면 클라우드 사본에서:
   - PC: `git diff <기준 커밋> HEAD --binary > _sync/base.patch` → stage (`_sync/`는 git 무시).
   - 클라우드: 같은 기준 커밋에 patch 적용 → `git rev-parse HEAD^{tree}`가 PC와 같은지 확인 → 고치고 검사.
   - 돌려보낼 때는 **바뀐 파일 통째로** /mnt/user-data/outputs/<새 폴더>/…에 복사 → device_commit_files(force). (PC 파일 일부가 CRLF라 patch 적용은 실패함)
   - 확인: 양쪽에서 `for f in …; do tr -d '\r' < $f | sha1sum | cut -c1-12; done | sha1sum` 이 같은지.
   - 끝나면 클라우드 사본을 기준 커밋으로 되돌리기 (커밋 안 된 변경이 남으면 stop hook 경고).
3. 같은 stagedPath를 다시 쓰면 옛 내용이 들어간 적이 있음 → 넘길 때마다 새 폴더.
4. PC 파일이 읽기 전용일 때: device_bash에서 `chmod u+w 파일`.
5. PC 폴더 파일 삭제는 사용자 허락이 필요 (device_request_delete_permission).
6. 끝나면 Claude 프로젝트에도 claude/HANDOFF.md, claude/PROGRESS.md를 올린다.

## 7. 로드맵

**🧹 코드 정리 R0~R9 (사용자 결정 2026-10-15: 전부)** — 원칙: 게임 결과·화면은 하나도 안 바뀌게.

| 단계 | 작업 | 상태 |
|---|---|---|
| R0 안전망 | 정답지(golden)·스크린샷 비교(shots)·이름 겹침 검사, 연출 무작위 fxRandom 분리 | ✅ 186 |
| R1 안 쓰는 것 지우기 | 안 쓰는 함수 7개·CSS·`typeof` 59곳, anti-slop 쓸 만한 것 | ✅ 187 |
| R2 파일 합치기 | 111 → 83, FILEMAP.md | ✅ 188 |
| R3 세이브 호환 한곳에 | 처리 지도 + ensureStateReady + test_oldsaves | ✅ 189 |
| R4 CSS 정리 | 목차, 선택자 10개 합침, 색 58곳 변수로 | ✅ 190 |
| R5 세이브 다이어트 | 압축 저장 10시즌 0.72MB → 0.13MB | ✅ 191 |
| R6 속도 | 한 주 169ms → 약 50ms | ✅ 192 |
| R7 배포 정리 | GitHub Actions 묶음 배포 6.3MB → 1.6MB | ✅ 193 |
| R8 문서 정리 | PROGRESS 1~133 보관, HANDOFF 새로, GAME_PLAN 번호·요약 | ✅ 194 |
| R9 마무리 | 전체 검사 통과, 휴대폰 4폭 × 22메뉴 가로 넘침 0, ver 1.2.1 | ✅ 195 |

**✅ 끝(238): 체력·컨디션 불이익** — 아래 표대로 넣음. 합숙은 −3 대신 **매주 컨디션 −2** (사용자 결정 2026-11-02). 측정 = `node tools/measure_health.cjs` (8장). 연패 때 컨디션 바닥 문제는 **239 바닥 반등(HEALTH_RULES.conditionFloor: 30 아래면 매주 +4)**으로 해결 (사용자 A안 선택, 측정은 PROGRESS 239).

| 항목 | 정한 규칙 |
|---|---|
| 부상 (보통) | 체력 20 아래로 끝난 주에만 매주 10% (체력 10 아래면 20%). 부상 = 가벼움 1~2주(70%) / 심함 3~4주(30%). 부상 중: 경기 못 나감(후보가 대신), 훈련은 '재활'(체력 회복, 스탯 변화 없음). '부상 잦음' 특성 2배, 구단 시설 등급·상점 트레이너는 기간 단축. 위 막대·코치 팁·기사·SNS로 보이게 |
| 번아웃 (느슨하게, 기준 100) | 숨은 값 '피로 누적': 체력 30 아래로 끝난 주 +15, 컨디션 30 아래 주 +10, 쉬는 주 −30, 그 외 −5. 100 넘으면 번아웃(최소 3주): 훈련 효과 −40%, 대성공 없음, 경기력 −5%. 피로 40 아래면 풀림 |
| 합숙 컨디션 | 상한 40을 없애고 합숙이면 매주 컨디션 **−2** (HOUSING.dormConditionLoss, 처음 정한 −3은 2부 번아웃 과다). 훈련 +25%는 그대로 |
| 쉬는 대가 | 따로 안 줌 (사용자 선택) |

**① 다음(바로): 네임드 선수 정리 (사용자 요청 2026-11-03)** — 게임 결과가 바뀌니 정답지 새로 만들기. 순서: 4번(대형 신인 측정)을 먼저 → 같은 기준으로 네임드 능력치 정하기.

| # | 할 일 | 메모 |
|---|---|---|
| 1 | 기존 네임드 선수 삭제 | data/names.js NAMED_PLAYERS · js/league.js placeNamedPlayers (지금 7명: Ego·Chen·Sking·Hwansam·Runa·Jimul·Kibai, GAME_PLAN 44·PROGRESS 136). 지우기 전에 어디서 쓰이는지 확인 (배치 규칙·우승 기록·역사관·뉴스). 주의: 예전 세이브를 불러오면 목록의 네임드가 한 번 들어오는 규칙이 있음 → 예전 세이브의 옛 네임드를 어떻게 할지 정하기 |
| 2 | 실제 레전드 선수 20명 추리기 | 포지션별 배분(예: 4명씩)은 후보 표를 보여 주고 사용자가 고르기 |
| 3 | 이름을 1글자 바꿔서 네임드로 넣기 | 실제 이름과 똑같지 않게. 이름 후보도 표로 확인받기 |
| 4 | 대형 신인 능력치가 너무 높은 문제 | 먼저 측정: 대형 신인 나이별 점수 vs 1부 평균·내 선수 성장 목표(8장: 유망주 80은 20~21세, 90은 23~25세) → 낮출 값 후보 숫자 비교 → 선택지로 묻기 (addBigRookies, js/league.js) |

**① 진행 계획 (2026-11-03 사용자 결정)**

측정 (node, 2012 시작 2판 + 2017 시작 1판 × 6~7시즌): 대형 신인은 입단 때부터 1부 주전 평균 +2~4 (17~19세에 67~75), 거의 다 리그 상위 30명에 남아 6년차엔 상위 30명의 절반(12~17명)이 대형 신인. 기존 네임드 7명은 시작 연도와 상관없이 첫해 전원 등장, 나이는 내 선수 ±1~3, 강팀 6곳 무작위.

| 단계 | 할 일 | 결정 |
|---|---|---|
| 1 | ✅ 대형 신인 조정 (243) | B 선택: 입단 1부 평균 −2~0, 해마다 1~2명, 1부 직행 1명. 7년차 상위 30명 중 대형 신인 14 → 8명. 측정 node tools/measure_rookies.cjs |
| 2 | 레전드 넣는 방식 | **실제로 활동한 해에 등장**: 시작 해가 활동 기간 안 → 첫해부터 실제 나이로 / 데뷔 전 → 데뷔 해 새 시즌에 '레전드 신인'(대형 신인 기사와 같이) / 은퇴 뒤 → **등장 안 함**(데이터는 남겨 ③ 해설·코치 등에 쓸 수 있게). 은퇴는 실제 은퇴 연도쯤(일찍 은퇴 방지). 데이터 한 줄 = 바꾼 이름·포지션·데뷔·은퇴·출생 연도·데뷔 팀·강함 등급 (data/names.js) |
| 3 | 레전드 20명 후보 표 | **시대별로 고르게** (2012~15 / 2016~19 / 2020~ 시대마다 나눔, 포지션은 조금 달라도 됨). 실제 이름 → 1글자 바꾼 이름 후보, 실제 데뷔·은퇴 연도·데뷔 팀 표 → 사용자가 고름. 연도·팀은 확인이 필요하면 '확인 필요' 표시 |
| 4 | 기존 7명 삭제 + 레전드 넣기 | 소속팀 = **실제 데뷔 팀** (게임에 있는 팀이면, 없으면 비슷한 강팀) + 한 팀 레전드 최대 인원 제한. **예전 세이브에서도 기존 7명 삭제** (사용자 선택): ensureStateReady에서 한 번, 그 자리에 같은 포지션·비슷한 점수의 일반 선수(이름 새로)로 바꿔 넣기 → 로스터 수·주전 유지, 지난 기록(역사관·이적 목록·수상)의 이름 글자는 그대로 둠. 새 레전드는 예전 세이브에도 활동 연도 규칙대로 들어옴. js/retirement.js addVeterans의 NAMED_PLAYERS 이름 목록도 새 목록으로 |
| 2~4 | ✅ 레전드 30명 (244) | 사용자가 20 → 30명. data/names.js LEGENDS·LEGEND_RULES, js/league.js placeLegends·legendTeamFor·legendRetireRule·retireOldNamed |
| 4-2 | ✅ 리그 전체 스탯 낮추기 (246, G1+L) | 레전드를 넣으니 6년차 상위 10명 중 4~7명·상위 30명 중 14~18명이 레전드. 무엇을 낮출지(NPC 시작 수준 LEAGUE.npc·해마다 성장 LEAGUE.npcGrowth·1부 평균 상승) 측정 → 숫자 비교 → 선택지. 내 선수 성장 목표(8장)와 같이 보기 |
| 5 | ✅ 검사 (243~246에서 매번) | 정답지·예전 세이브·화면(⭐ 레전드)·measure_league |
| 6 | ✅ 유형 균형 측정 (247) — 그대로 두기로 | 노력형이 유망주보다 훨씬 빨리 큼 (리그 미드 순위 5년차 1.7위 vs 3.7위, 7년차 86점 vs 81점). 유형 4개(유망주·노력형·레전드·살아있는 레전드, data/player.js ARCHETYPES) 비교 측정 → 선택지. ARCH=grinder node tools/measure_league.cjs |

- 지금 규칙: 실제 리그 결과를 게임 일정에 맞추지 않음 (레전드가 실제 우승한 해에 우승하도록 하지 않음), 2027년 이후 가짜 역사 금지. 단, 바로 다음 ②에서 '실제 LoL 역사에 맞춘 진행'으로 바꿀 예정이니 ①의 네임드 배치·나이는 ②와 같이 생각하기 (예: 레전드가 실제로 활동한 해에 등장).

**② 진행 단계 (사용자 결정 2026-11-03)**: ✅ P1 월즈 개최지·2020 MSI 취소(249) → ✅ P2 대회 이름 시대별·2021~24 컵 없음·2025 전 Road to MSI 없음(250) → ✅ P3 국내 구단 실제 이름·2012~14 챔피언스 예선(251) → ✅ P4 해외 리그 실제(252) → ✅ P5 2021 프랜차이즈(253, js/franchise.js). **② 끝** → 다음 ③ 시간 진행 이벤트(2021 프랜차이즈: 승강전 없음 + 2부 = 1부 10구단 2군 LCK CL + 콜업, 2020 말 독립 2부 구단 해체, 실제 10구단으로 1부 맞추기) (2012~14 OGN 챔피언스, 2015~ LCK, LCK 컵 2025~, 2부 = 챌린저스 코리아 2015~20 → LCK CL 2021~, 형식은 그대로) → P3 국내 구단 이름 연도별 실제 (후보 표 확인) → P4 해외 리그 실제 (지역 이름 LPL·LCS·LEC 등 + 연도별 팀 이름, 후보 표 확인) → P5 2021 승강제 폐지(프랜차이즈) — 내 선수가 2부에서 올라가는 길 측정 → 선택지. 우승 결과를 실제에 맞추는 것(⑥)은 안 함.

**② 실제 LoL 역사에 맞춘 진행 (사용자 결정 2026-11-03, ① 다음)** — 지금 실제 역사를 쓰는 곳(예: 시대 기사 HISTORICAL_NEWS·연도별 리그 크기 eraTeams·월즈 개최지)과 안 쓰는 곳을 먼저 조사. 어디까지 맞출지 정하기 (예: 연도별 리그 구조·대회 일정·국제대회 결과·레전드 선수의 활동 시기·팀 이름). 시작 전에 지금 무엇이 실제 역사와 다른지 표로 → 선택지로 묻기. 4장 뉴스 규칙(실제 결과 미적용·2027년 이후 가짜 역사 금지)을 바꾸는 일.

**✅ 끝(256): 이번 주 요약 창 리뉴얼 (사용자 요청 2026-11-04)** — 가운데 창 + 지난주에 한 일 도트 장면 + 다다닥 + 큰 점수판 + 우승 그림 2종. 자세한 건 PROGRESS 256. 새 경기 화면 요소처럼 요약 창 그림도 연출 무작위는 fxRandom·자리/장 번호만. 2단계(pixelfx 효과)는 ⑤ 폴리싱 때 결정.

**✅ 끝(258): ③ D 경력에 따라 역할이 바뀜** — 사용자: E(시즌 회고를 실제 숫자로)는 '굳이 바꿀 필요 없음' → 안 함. D1 첫 후배 · D2 팀의 기둥 · D3 성장 정체 · D4 베테랑의 한마디(2년 쉼) 모두 넣음. 자세한 건 PROGRESS 258. 측정 도구 `node tools/measure_de.cjs`는 남겨 둠. 같이 고친 버그: 2021 전환 때 이적할 팀이 해체되면 멈추던 것 (js/franchise.js).

**③ 진행 (2026-11-04, Codex 상담)**: 방향 A 시대 변화가 내 진로에 · B 내 기록 회상 · C 같은 사람이 다른 역할로 재등장 · D 경력 역할 변화 · E 시즌 목표를 다음 시즌에 실제 숫자로 평가(review_growth가 성장을 안 봄). 순서 = ✅ A+B(255) → ✅ C 4개(257: 다시 한 팀·후배가 컸다·옛 동료와 적으로·친정팀 넓히기, C4 레전드 마지막 시즌은 안 넣음) → ✅ D 4개(258, E는 안 함). **③ 끝.** 먼저 측정할 것(Codex): 조건 성립→실제 발송 도달률, 연차별 새 연락 수, 연락 몰림·자동 무시 비율. 주의: 연락 목록 길이만 바뀌어도 shuffled(EVENTS) 때문에 정답지가 바뀜 / queueTrigger는 조건·상한에 걸리면 사라짐 / firePendingEvents는 조건 재검사 안 함.

**③ 시간 진행에 따른 이벤트 추가 (사용자 결정 2026-11-03)** — 연도·시즌·나이·경력에 따라 일어나는 이벤트 (data/events*.js, js/events.js; 새 트리거는 queueTrigger + QUEUE_TRIGGERS). ②의 역사 연표와 연결. 시작 전에 지금 시간 조건 이벤트가 몇 개인지 측정.

**④ 포지션 경험 (2026-11-04 계획 합의, Codex 토론 2번)** — 사용자 목표: **승률·시스템이 아니라 '내 포지션이 겪는 일'이 실제 그 포지션 선수의 경험처럼 보이게.** 원칙: 실제로 일어난 내 경기 장면만 근거(없으면 생략, 갱 기록 없음 ≠ "정글이 안 옴"), 포지션마다 보람·팀과 맞추기·실패 3결, 연출(재생·요약·훈련 설명·SNS)은 효과 0·난수 0(경기 키+세트+사건 순번으로 글 고르기 → 정답지 그대로), 연락은 작은 효과(관계·컨디션 ±2~4, 스탯 +1은 처음엔 안 함), 카운터 픽은 근거 없음(조합 상성만 있음)이라 안 씀.
| 단계 | 내용 |
|---|---|
| 0 ✅ 측정 | `node tools/measure_positions.cjs` (5포지션 × 3판 × 3시즌, 2017 1부 중간 팀). 결과 아래 |
| 1 ✅ (259) | 경기 재생 내 장면에 포지션 해설 한 줄 — data/position_voice.js · js/position_voice.js, 원인 한마디(숙련도·신인). 경기 기록 화면(js/match_detail.js 타임라인)에는 아직 안 붙임 |
| 2 ✅ (260) | 주간 요약 '이번 주 내 역할' 한 줄 + 포지션 핵심 기록 2개(박스 스코어: 서폿 시야·킬 관여, 정글 킬 관여, 원딜 DPM, 탑 CS·솔로킬, 미드 DPM) + 내 최고 숙련 챔피언 밴 (js/dash_plus.js weekSummaryHTML) |
| 3 ✅ (261) | **영혼의 듀오 (사용자 2026-11-04)** — 조건은 기록 + 관계 30 (사용자 선택), data/duo.js · js/duo.js ·: 원딜·서포트만, **경험만(새 승률 효과 없음, 기존 팀 케미 그대로)**, 조건이 되면 연락(팬 별명 → 받아들일지 고름). 근거 = 실제 같이 출전한 세트(m.detail.sets[].lanes, timeMem.mates 같은 팀 주 수는 벤치도 세서 안 씀)·같이 이긴 경기·우승·관계. 단계 새 파트너 → 손발 맞는 중 → 단짝 → 영혼의 듀오, 소속팀 화면 듀오 카드, 재생 해설, 이어지는 이야기(파트너 이적 제안·헤어진 뒤 맞대결·은퇴·다시 한 팀) |
| 4 ✅ (262) | 포지션 연락 10개 (data/position_events.js, 같은 연락 2년에 한 번): 내 장면이 쌓였을 때만(최근 4주 같은 장면 2번 등), 포지션·듀오 연락 합쳐 시즌 최대 2개(always는 seasonMax를 건너뛰니 공통 상한 직접), 처음 10묶음 |
| 5 ✖ | 훈련 설명 포지션별 — 사용자: 안 해도 됨 (2026-11-04) |
| 6 ✅ (263) | 같은 장면을 팬·동료·상대 선수·분석 기사가 다르게 + 듀오 별명 (data/position_social.js) |

0단계 측정 (시즌 평균): 출전 세트 48~72 · 내 장면 탑 38 / 정글 67 / 미드 31 / 원딜 21 / 서폿 40 · **실수가 좋은 장면의 2~4배** (탑 6:26, 정글 15:42, 미드 11:16, 원딜 5:11, 서폿 7:28) · 내 장면 있는 세트 34~64% · 출전했는데 장면 없는 주 6~20% (원딜 20%) · 내 최고 숙련 챔피언 밴 8~19% · 바텀 파트너: 3시즌에 2~3명, 바뀜 1~2번 (주 파트너와 세트 55~175). 자주 나온 장면: 탑 flash_fail·tp_misuse·top_caught / 정글 jungle_death·smite_lose / 미드 carry_burst / 원딜 carry_caught / 서폿 ward_death·facecheck.
원인 측정 (`MODE=cause node tools/measure_positions.cjs`, 5포지션 × 8시즌): **실수 비율은 실력(점수) 때문** — 리그 전체 점수대별 실수 비율 40점대 86~94% · 50~54점 68% · 55~59점 53% · 60~64점 43% · 65~69점 31% · 70~74점 27%. 내 선수 1년차 52점(1부 평균보다 낮음)이라 실수 85~97%, 5년차(약 70점)부터 거의 1:1. 다만 같은 70점대에서도 내 선수는 실수 약 45%로 리그(27%)보다 높음 — 이유 미확인(사건마다 쓰는 스탯이 내 선수는 고르지 않아서일 수도). → 원인 2 (`MODE=cause2 [PLAN=mix|champ] node tools/measure_positions.cjs`, 65~74점끼리): **챔피언 숙련도 차이** — 장면 주인공 고르기에 cf(숙련도·메타 배율)가 세제곱(CHAMP_EV.pow 3)으로 들어감. 스크림·리플레이만: 내 cf 0.81 vs 리그 1.07 / 챔피언 연습 25%: 0.88~0.93 vs 1.06~1.09 (최고 숙련 46~49 vs 70~73) / 챔피언 연습 75%: 내 cf 1.13 > 리그 1.07 (최고 숙련 88) 대신 8시즌에 70점 못 감. 즉 **버그가 아니라 '스탯 훈련 vs 챔피언 연습' 선택의 결과** (계산식은 내 선수·NPC 같음, js/champions.js matchPower · js/npc_mastery.js applyNpcChampPower). 측정 도구 기본 플레이(스크림·리플레이만)가 실제 플레이보다 숙련도가 낮았음. **사용자 결정: 원인을 말해 주는 해설** — 장면은 실제 그대로, 실수 해설에 실제 원인이 있으면 한마디(숙련도 낮음 → 손에 안 익은 챔피언, 신인 → 배우는 중), 주간 요약 한 줄은 좋은 장면 먼저, 밸런스 그대로.

**④-2 진행 (2026-11-04, Codex 토론 2번, 원문은 PROGRESS 264)** — 사용자: "효과가 의미 없거나 불쾌한 효과가 많음, 선택이 재밌게". 기준 = 고를 이유·예측 가능성·결과의 기억 (보상 유무가 아니라). 힌트 = 아이콘+방향+대상(숫자는 결과에서만, 사용자 선택). 정중한 거절은 손해 없음(보상 남발도 금지), 내가 고른 나쁜 태도의 손해는 유지, 뻔한 오답은 역할 주거나 없앰.
| 단계 | 내용 |
|---|---|
| 1 ✅ (264) | 의도 힌트 + ifTired·ifSlump + 버그 3개(matchBoost·관계/호감 표시·글자 고친 선택지) + 연락 9개 고침 (15개 검토) |
| 2 ✅ (266) | 같은 기준으로 연애(rm_* 거절 호감 −1~−3 등)·친구(fr_*) 연락까지, 판정 실패를 '작은 성과는 남는 실패'로. 손해만 49·효과 없음 24 목록은 node로 다시 뽑기 |
| 3 ✅ (267·268) | 후속 연락 규칙(보낼 때 need 다시 봄) + 자주 오는 연락 6개에 후속 13개 (미디어데이·계약 마지막 해·비시즌 계획·인터뷰·새 챔피언·생일). |
| 3-2 ✅ (269) | 남은 후속 4개에 10개: 슈퍼 세이브 2·경쟁자 3(같은 팀 + 점수 비교)·올스타 2(답 상관없이 뽑힘/못 뽑힘)·손목 3(체력에 따라). 새 need: mateHere·pidAboveMe(ctx.pid 기준)·allStarPicked·maxStamina·minStamina — storyNeedOk(need, ctx). 후속 시즌당 약 4개 |
| 메모 | ✅ 267 후속 연락은 보낼 때 need만 다시 봄(eventNeedOk, 사용자 선택). 3단계 = 자주 오는 연락 6~10개에 후속 연락 추가(사용자 선택, 후보 표 먼저). 힌트는 받을 때 저장, 판정 확률은 답할 때 다시 계산(작은 차이) |

**④-2 받은 연락 선택지 효과 리뉴얼 (사용자 결정 2026-11-03, ⑤ 폴리싱 바로 앞)** — 받은 연락(data/events*.js, js/events.js·js/friends.js)의 선택지 효과가 '정상적으로' 작동하고 보이게 다시 정리. 시작 전에 조사: 선택지마다 효과 글(보이는 것)과 실제로 바뀌는 값이 같은지, 효과가 없거나 너무 작은·큰 선택지, 같은 연락의 선택지끼리 차이가 없는 것, 효과가 화면(결과 카드·휴대폰)에 안 보이는 것 → 문제 목록 표 → 선택지로 묻기. 사용자가 생각하는 '비정상'이 무엇인지 먼저 물어보기.

**⑤ 전체 페이지·휴대폰 폴리싱 (사용자 결정 2026-11-03, ④ 다음 = 마지막)** — ①~④가 다 들어간 뒤 모든 화면(왼쪽 메뉴 13칸·탭)을 PC·휴대폰(390·760px 등)에서 다듬기: 넘침·꺾임·빈칸·겹치는 정보·버튼 크기·글자. 시작 전에 `python tools/shots.py`로 전체 화면을 찍어 문제 목록 표 → 우선순위 선택지로 묻기.

**⑤ 때 결정할 것: pixelfx(https://github.com/patch-gg/pixelfx) · 규칙 바꾸기 (사용자 2026-11-04: 지금은 설치 없이, 폴리싱 때 결정)** — pixelfx = MIT 픽셀 효과 244개(캔버스 2D, 의존성 없음, 효과 코드 약 2MB, gallery 글꼴은 MIT 아님), **ES 모듈 + npm 설치**라 지금 규칙(npm·import·외부 라이브러리 금지)에 그대로 걸림. 캐릭터는 3D 뼈대 로봇이 마법·칼 공격 → 연습·휴식·무대 장면은 없음, 쓸 만한 건 ui(level-up·confetti·achievement·crit-number·combo-counter·coin-collect)·transitions·weather. 후보: 가(추천) 내 PC에서 tools/render.mjs로 효과를 그림 띠 PNG로 한 번 뽑아 게임에는 그림만(규칙 그대로, bundle.py에 그림 복사 추가) / 나 쓸 효과만 import·export 빼서 vendor/pixelfx.js(외부 라이브러리 예외 필요) / 다 Claude Code 플러그인 `/plugin marketplace add patch-gg/pixelfx`(제작 참고용). 규칙을 버리면: 웹 유저는 '우리 사이트에 다 묶기'면 거의 차이 없음, CDN이면 막힘·고장 위험 / 더블클릭 실행 불가(세이브는 내보내기·가져오기로 옮김, 로컬은 http 서버 필요) / 옛 휴대폰 오류 위험↑ / 검사 도구(golden·shots·oldsaves)가 file://로 열어서 서버 방식으로 바꿔야 함.

**✅ 281: 후반 '위기감' 기사 (A안 ①②③④, js/news.js crisisNewsWeek)** — 아래는 처음 메모. 더 넣을 후보(Codex): ⑤ 라이벌의 다음 약속 ⑥ 신인의 첫 도전 ⑦ 읽힌 챔피언 ⑧ 세대 차이. **위기감 글은 단신(addNews) 말고 신문(publishHeadline)** — 단신은 받은 연락 보관 칸을 같이 써서 연락 흐름이 바뀜.
**나중에 (사용자 요청 2026-11-03): 후반 '위기감' 연출** — 후반 난이도(247: 5~9년 뒤 리그 1위)는 그대로 두고, 승률이 높아지면 **실제 난이도는 그대로 둔 채 위기감만** 주는 이벤트·뉴스를 추가. 이겨도 '운이 좋아서 이겼다'고 느끼게. 예: 해외 리그에서 파죽지세로 연승 중인 1위 팀 특별 뉴스, '우리 팀 약점이 분석됐다' 기사, 라이벌의 도발, 접전 끝 승리 강조. 언제 넣을지는 사용자와 정하기 (③ 시간 진행 이벤트와 같이 해도 좋음). 경기 결과·밸런스는 건드리지 않음(뉴스 함수는 표시·보관만, 4장 뉴스 규칙).

**✅ 끝(301): 패치 사고 '사기 챔피언' SS·SSS** (js/op_patch.js · data/op_patch.js, 자세한 건 PROGRESS 301) — **302: 게임사가 바로 안 고침, SS·SSS 모두 다음 정기 패치까지** · **303: 세기 SS +40%·SSS +60%** (뽑은 세트 승률 약 59~60%, 밴 SS 70%·SSS 79%) (아래 '지속' 숫자는 301 때 것) — Codex 검토 원문 Claude outputs/codex_op_dots_결과.md (나안 '사고 패치 사건'). 정한 것: 빈도 **시즌당 30%, 최대 1번** (SS 80%·SSS 20%) · 세기 **SS 경기력 +23%·SSS +32%** (픽 가치 +35·+45, 측정해 보고 너무 세면 +20·+25) · 지속 SS 4주·SSS 2주(+사용 금지 1주) · 글로벌 밴 = **아예 사용 금지**(밴 칸을 안 씀, 국내·해외·국제대회·대체 픽 모두) + **SS·SSS 챔피언은 밴될 확률이 높게**(사용자 추가 요청) · 발생 연도는 묻지 않음 → 2027년 이후 가짜 역사 금지 규칙대로 **2026년까지** (사용자가 바꾸면 따름). 뉴스 순서: 발견 기사 → 팬·선수 SNS → 실제 경기 기록으로 픽률·승률 → (SSS) 게임사 사과 인터뷰 → 사용 금지·종료 기사. 글은 '게임사'로(실제 회사 이름 금지). 주의(Codex): 사건 추첨은 게임 규칙이라 fxRandom 금지 → 저장되는 전용 씨앗, postSocial은 게임 난수를 써서 필수 글은 사건 id·단계로 고르는 따로 길, state.meta.op에 저장(makePatch가 새 객체를 만드니 넘겨 주기), 예전 세이브는 사고 없음. 게임 결과가 바뀌니 정답지 새로(golden make) + 밸런스 측정.

**✅ 끝(307): 사운드** (data/sound.js · js/sound.js, 자세한 건 PROGRESS 307 — 효과음 레트로 게임기 + 배경 음악 '소환', 새 소리 자리는 sfx("id") 한 줄, 설정은 localStorage progamer-sound) — 처음 메모: — 방법 = **코드로 만든 8비트 효과음**(Web Audio, 소리 파일 0개·인터넷 필요 없음·저작권 걱정 없음, LoL 소리 따오기 금지), 범위 = **효과음부터**(배경 음악은 나중), 기본값 = **켜짐(중간 크기)** + 설정에 켜기·끄기·크기. 시안 = Claude outputs/sound_mockup_1.html (소리 12개 × 가 가볍고 귀여움 / 나 묵직한 e스포츠 / 다 레트로 게임기) → **사용자: 다 레트로 게임기** (단, 시안 1 '다' 우승 소리는 유명한 게임 승리 음악과 음 배열이 비슷해서 시안 2의 새 팡파레로 바꿈 — 유명 곡과 닮은 음 배열 금지). **배경 음악도 넣기로 (사용자)**: 시안 = Claude outputs/sound_mockup_2.html (가 설레는 출발 128BPM 장조 / 나 차분한 숙소 92BPM / 다 결전의 무대 140BPM 단조, 모두 새 곡, 8마디 반복) → 고르면 data/sound.js(소리 목록·값) + js/sound.js(엔진). 주의: 브라우저는 화면을 한 번 누른 뒤부터 소리 남(AudioContext resume), 소리 기능 없는 브라우저(윈도우 Playwright WebKit 등)에서는 조용히 넘어가게, 연출 무작위는 fxRandom·게임 난수 금지(정답지 그대로), 경기 재생 2·3배속엔 소리 겹침 줄이기, 아이폰 무음 스위치.

**보류 (사용자가 꺼낼 때까지 시작 금지): ver 1.2 내 선수 해외 진출 + 내 언어 실력**
(보류 메모) — 비시즌 해외 구단 제안 → 수락 시 해외 리그에서 뜀. 필요한 것: 해외 리그 정규 시즌 경기 실제 진행(지금은 지역 순위를 전력+운으로만 정함), 내 계약·연봉, 내 언어 실력(훈련·상점 어학·이벤트), 국내 복귀, 119의 '해외 구단 러브콜' 연작과 연결. **시작 전에 측정 → 표 → 선택지로 묻기.**

「풋볼 에이전시」 참고 UI 남은 것 (196 때 제안, 사용자가 고르면, ⑤⑥은 197에서 함): ⑦ 상대·신인 능력을 범위로(분석관 정확도 연결) ⑧ 재계약·이적 협상 대화(해외 진출 때 같이 추천) ⑨ 팀 고르기 사연 한 줄 ⑩ 스탯 등급 글자. 디자인은 참고 게임과 너무 똑같지 않게 (197 때 사용자 지적: 금색 다이아몬드 진행 버튼 → 우리 네온 막대로 바꿈). 참고: 사용자 PC 저장소 경로는 `C:\Project\Game` (2026-10-16 Game\Game에서 옮김).

그 밖에 (사용자가 고르기 전 시작 금지): 퀘스트 횟수에 따른 팀 내부 평가 / 해외 리그 경기 기록 화면 / 관계를 다른 화면에도, 연락 도감, 시즌 선수 카드, 12각형 다른 선수 비교.

지난 일 (자세한 건 PROGRESS): ver 1.1 로드맵 ①~④(해외 월드 우승 밸런스 169·맞대결 전적 171·빅게임 172·구단 스태프 173) 끝 / 디자인 리뉴얼 D0~D6(174~180) 끝 — 색 = 네온 + 둥근 모서리, 32×32 도트 얼굴(최대 3배), 경기 재생 '다' 안(자동 재생, 반응 보고 '가' 안으로 바꿀 수 있게) / 훈련 대성공 182 / 버그·얼굴 바꾸기 183~185.

## 8. 밸런스 메모

- **238 뒤 측정 (2026-11-02, node tools/measure_health.cjs, 미드 씨앗 3 × 2시즌)**: 1부 2017 — 기본(30↓ 휴식)·관리(50↓) 부상·번아웃 0, 성장 15.1·14.8 / 안 쉼(솔랭만) 부상 7.7회·번아웃 82%의 주·성장 9.2(전 10.3). 2부 2012(합숙 −2) — 기본 컨디션 평균 63(전 39)·번아웃 13%의 주 / 관리 번아웃 0 / 안 쉼 부상 7.3회·번아웃 53%. 합숙 −3이면 기본 43%·관리 21%, −1이면 컨디션 87(원룸 상한 80보다 높아 집 살 이유 없음). 세트 승률은 이 크기에서 ±15%p라 판단에 안 씀.
- JUNG PC·이 PC(dhlth): Playwright WebKit(아이폰 사파리 엔진) 설치됨 (2026-11-05) → `pw.webkit.launch()` + `pw.devices["iPhone 13"]`로 아이폰 흉내 시험. 휴대폰 화면은 겹창 안 버튼이 화면 밖으로 나가지 않는지 꼭 볼 것(291).
- JUNG PC: PIL이 없어 `shots.py diff`가 안 됨 → cmp로 바뀐 사진 찾기. 휴대폰 검사는 터치 흉내(CDP Emulation.setTouchEmulationEnabled + pointer coarse)로 해야 맞음 (PROGRESS 272).
- JUNG PC(2026-11-04): Git Bash에서 `python`(Python310)에 Playwright가 이미 있음 → `PYTHONIOENCODING=utf-8 python tools/golden.py check` 바로 됨.
- 이 PC(Windows)에서 파이썬 도구를 돌릴 때: Git Bash에서는 `python`도 스토어 바로가기가 먼저 잡힘 → `/c/Users/dhlth/AppData/Local/Python/bin/python` (Playwright는 2026-11-04 이 파이썬에 다시 설치) + 출력 글자 때문에 `PYTHONIOENCODING=utf-8`. Playwright는 2026-11-02 설치함.

- **체력·컨디션 측정 (2026-10-31, tools/measure_fatigue.py, 씨앗 3 × 2시즌)**: 지금 불이익 = 체력 20↓ 훈련 절반·대성공 확률↓, 체력 30↓ 경기력 −10%, 컨디션 0→×0.9·100→×1.1 (합숙 상한 40), 이벤트(손목 통증 lowStamina 40%, 연패 슬럼프). 결과: 안 쉬는 플레이는 체력 평균 9~11(80%+ 주가 20↓), 2시즌 성장 −37%(18.9→11.9 / 15.1→10.4), 세트 승률 2부 −2~4%p·1부 −17~25%p(28.9 vs 53.7). 50↓에서 쉬어도 성장 손해 없음(19.1 vs 18.9) → 쉬는 데 대가가 없음. 2부(합숙)는 컨디션이 98% 주에서 50↓라 컨디션이 선택이 아니라 고정값.

- 내 선수 성장(201): 훈련 스탯 ×0.5 (USER_TRAINING_SCALE), 유망주 +15%. 목표 = 유망주 80은 20~21세, 90은 23~25세. 성장 측정은 /tmp 스크립트 방식(유망주 2부 2012 × 씨앗 3, 가장 높은 스탯 3개 평균).

- 1부 평균 전력 2013 약 64.8 → 2026 약 74.4 (사용자 수용). 246 뒤 7년차 1부 평균 약 68.7.
- 247 유형 측정(node tools/measure_archetypes.cjs): 같은 나이면 노력형 ≈ 유망주 (노력형은 2살 많게 시작해서 같은 해엔 앞섬). 어느 유형이든 5~9년 뒤 리그 미드 1위 → 85~91점까지 계속 오름 (리그 1위 약 79). 사용자: 지금은 그대로. 후반이 쉽다는 피드백이 오면 여기부터 (높은 스탯 성장 둔화·노화·레전드·라이벌).
- 월드 국내 우승: 246 뒤 68%, 252(해외 참가 연도 당김) 뒤 67% — 목표 70~80%의 아래 경계. 해외가 너무 이긴다는 피드백이 오면 WORLD_REGIONS strength(0.92/0.86)부터.
- 국제대회: 169 뒤 세트 70.0%, 월드 국내 우승 80%, 같은 해외 팀 연속 우승 0/18 (목표 70~80%). 너무 국내 쪽이라는 피드백이 오면 지역 수준 0.93 또는 OVERSEAS_DYNASTY.moves 1을 먼저 측정.
- 숙련도 20→100 = 세트 승률 +19.7%p, 메타 위주 vs 비메타 +8.9%p. 조절은 data/match.js CHAMP_EV.pow·metaPowerBonus·metaPenaltyDiv·jokerPowerBonus.
- 국내 리그 외국인 선수 6시즌 동안 7~10명에서 안정.
- **숙련도 비대칭 (2026-11-04 측정, 사용자: 일단 그대로)**: 다른 선수는 매주 자동으로 챔피언 2명 +2~4(js/npc_mastery.js npcPractice)·스탯은 나이로만, 내 선수는 챔피언 연습 주에만 +3~5. 1부 주전 메타 숙련도 56~71 vs 나(챔피언 연습 25%) 38~50, 대신 내 스탯 점수는 7시즌에 84(리그 70). 실제 선수와 다른 점: 스크림·솔랭으로는 숙련도가 안 오름. 바꾸려면 측정부터 (`MODE=league node tools/measure_positions.cjs`).
- 연락이 많다면 EVENT_RULES.inboxPerSeason. 팬 선물 밸런스는 사용자가 먼저 꺼내기 전엔 언급하지 않음.
- 뉴스 평가 때 발견(미수정): 리그 성장 팬 1.2배로 팬 돌파가 조금 빨라짐 / 게임 방법의 '+15%' 문구보다 실제 효과가 작음.

## 9. 다음 세션 시작 시

1. **`git pull` 먼저** (다른 PC에서 올린 커밋 받기) → `git status --short`, `git log --oneline -10`으로 현재 상태 확인. 미커밋 변경은 보존.
   - 새 PC에서 측정·정답지 도구를 쓰려면: `python -m pip install playwright` → `python -m playwright install chromium` (Windows는 `python`, 출력 글자 때문에 `PYTHONIOENCODING=utf-8`). 브라우저 없이 빠른 체력·컨디션 측정은 `node tools/measure_health.cjs`.
2. 새 사용자 요청 우선. 없으면 7장 순서대로: ① 네임드 선수 정리(대형 신인 측정부터) → ② 실제 LoL 역사 → ③ 시간 진행 이벤트 → ④ 포지션 차별화 → ④-2 받은 연락 선택지 효과 리뉴얼 → ⑤ 전체 페이지·휴대폰 폴리싱. 해외 진출은 보류.
3. 큰 변경 뒤에는 PROGRESS.md 맨 아래에 번호를 이어 기록(**다음 번호 314**)하고 이 파일도 갱신. Claude 프로젝트에도 올린다.
