# Codex 작업 목록 (2026-11-04, Claude가 정리)

저장소: `C:\project\Game` — 오프라인 텍스트 LoL 프로게이머 커리어 시뮬레이션 「챌린저 로드」.
같은 시간에 Claude가 **④-2 3단계(선택이 나중에 다시 언급되게: 후속 연락 followUp·flag 회수)** 를 작업한다.
아래 작업은 그것과 파일이 겹치지 않게 나눴다. 작업마다 "바꿔도 되는 파일"을 지켜 줘.

## 모든 작업 공통 규칙

1. 시작 전에 `git pull` → `git status --short`. 남의 미커밋 변경은 건드리지 않는다.
2. 먼저 읽기: `CLAUDE.md`(규칙), `FILEMAP.md`(파일 위치), `HANDOFF.md` 7장(지금 계획).
3. 게임 규칙 (CLAUDE.md):
   - `Challenger_Road.html`을 더블클릭(file://)으로 열어 돌아가야 한다 → `fetch()`·`import`·`<script type="module">`·외부 라이브러리·CDN·npm 금지.
   - 글·숫자(연락 내용, 선택지, 효과)는 `data/*.js`, 코드는 `js/*.js`. 섞지 않는다.
   - 새 파일을 만들면 `Challenger_Road.html`에 `<script src>`로 넣고 `python tools/filemap.py`로 지도를 다시 만든다.
   - 웹에서 `confirm()`·`alert()`·`prompt()`가 막힌다 → `js/main.js`의 `askConfirm`을 쓴다.
4. 검사 (Windows Git Bash. 파이썬은 `python`, 출력 글자 때문에 앞에 `PYTHONIOENCODING=utf-8`):
   - Node 검사: `node tools/test_*.cjs` (한 번에: `PYTHONIOENCODING=utf-8 python tools/check_all.py`)
   - 정답지(같은 씨앗 = 같은 결과): `PYTHONIOENCODING=utf-8 python tools/golden.py check`
     - **게임 결과를 바꾸면 안 되는 작업**은 정답지가 그대로여야 한다.
     - 결과가 바뀌는 게 맞는 작업이면 다른 점을 확인한 뒤 `python tools/golden.py make`로 새로 저장.
   - 예전 세이브: `PYTHONIOENCODING=utf-8 python tools/test_oldsaves.py`
   - 공개 사이트 묶음(새 스크립트를 넣었을 때): `python tools/bundle.py <임시 폴더>` 후 `GAME_INDEX=<임시 폴더>/index.html python tools/golden.py check`
5. 기록: **`PROGRESS.md`·`HANDOFF.md`는 고치지 않는다** (Claude와 번호가 겹침). 대신 작업마다 보고서를 `docs/codex/작업번호_짧은이름.md`로 쓴다 (무엇을 했는지·검사 결과·사용자에게 물어볼 것).
6. 커밋: 작업 하나가 끝나면 커밋 (`git add <바꾼 파일>` → `git commit -m "Codex 작업 N: ..."`). **push는 하지 않는다** (사용자가 한다).
7. 사용자는 코딩 초보다. 보고서의 '사용자에게 할 말'은 쉬운 한국어 + 표로.
8. 사용자 결정이 필요한 것(밸런스 숫자, 새 기능 여부)은 **바꾸지 말고 보고서에 선택지로** 적는다.

---

## 작업 1. 선택지 효과가 조용히 안 먹는 곳 찾기 (조사 + 작은 버그 수정)

- 배경: 효과 `relation`은 연락에 `ctx.pid`(나온 선수)가 있어야, `affection`은 `ctx.tid`가 있어야 적용된다 (`js/events.js` applyEffects). 연락에 `who`나 트리거 ctx가 없으면 선택지를 골라도 아무 일도 안 일어난다.
- 할 일:
  1. `EVENTS` 전체에서 선택지(성공·실패 포함)에 `relation`·`affection`·`relationPos`·`cureOther`·`otherRisk`·`masteryChamp`가 있는 연락을 모으고, 그 연락이 실제로 `pid`/`tid`/`champ`를 받는지 (who, trigger 문맥, queueTrigger ctx, followUp ctx) 따라가서 표로.
  2. 못 받는 것이 있으면: 연락 데이터에 `who`를 붙이거나 트리거 ctx를 채워서 고친다.
- 바꿔도 되는 파일: `data/events.js`·`data/events_life.js`·`data/friends.js`·`data/romance.js`(연락 데이터의 who·need만), 검사 파일 새로 만들기 `tools/test_effect_targets.cjs`
- 바꾸면 안 되는 것: 선택지 글·효과 숫자, `followUp` (Claude 작업 중)
- 검사: 새 검사 통과 + check_all. 정답지는 바뀔 수 있음(효과가 원래 의도대로 먹으니까) → 다른 점을 보고서에.

## 작업 2. 연락 글 조사(이/가·을/를) 깨짐 찾기

- 배경: 빈칸 `{player}` `{name}` `{team}` `{champ}` `{scene}` 등 뒤에 고정 조사(예: `{player}을`, `{team}이`)가 붙으면 이름에 따라 어색하다. 이 게임 규칙은 `이(가)`·`을(를)`·`와(과)`·`(으)로`처럼 쓰거나 문장을 바꿔 피하는 것.
- 할 일:
  1. `data/*.js` 모든 글(title·text·label·result·note·SNS 글·기사)에서 `}` 바로 뒤 고정 조사를 찾는 검사 `tools/test_josa.cjs`를 만든다 (괄호 조사는 통과).
  2. 찾은 곳을 고친다 (뜻은 그대로).
- 바꿔도 되는 파일: `data/*.js`의 글자만 (효과·조건·id 금지), `tools/test_josa.cjs`
- 주의: 선택지 `label`을 고치면 예전 세이브의 답 안 한 연락은 순서로 찾으니 괜찮다 (264에서 처리함).
- 검사: 정답지 **요약은 그대로**여야 한다 (`golden.py check --loose`). 글만 바뀌므로 전체 해시가 다르면 make.

## 작업 3. 전체 화면 문제 목록 (⑤ 폴리싱 준비, 조사만)

- 할 일: `PYTHONIOENCODING=utf-8 python tools/shots.py take <임시 폴더>` (22화면 × 폭 1400·768·390) → 화면마다 넘침·잘림·겹침·빈칸·너무 작은 글자·버튼 크기 문제를 표로. 그리고 아래 두 개는 따로 재 봐 줘:
  - 이번 주 요약 창 (`js/dash_plus.js` weekSummaryHTML): 우승·업적 줄이 같이 뜨는 주에 1280×720에서 내용 893px > 창 694px → 버튼이 스크롤 아래로. 해결안 2~3개.
  - 휴대폰 받은 연락의 선택지 칩(264 의도 힌트)이 390px에서 몇 줄이 되는지.
- 바꿔도 되는 파일: 없음 (보고서만). 스크린샷은 저장소에 넣지 않는다.
- 보고서: 문제 표(화면·폭·문제·심각도) + 고칠 순서 추천.

## 작업 4. 영혼의 듀오 도달률 측정 (조사만)

- 배경: 영혼의 듀오 = 같이 출전 160세트 + 큰 경기 10세트 + 관계 30 (`data/duo.js` DUO_RULES). 5시즌 2판에서는 못 갔고 3시즌 판 하나에서 갔다.
- 할 일: 원딜·서포트 × 씨앗 6개 × 10시즌을 돌려 (`tools/test_duo.cjs` 진행 방식 참고) 단짝·영혼의 듀오 도달률, 걸린 시즌, 못 간 이유(세트·큰 경기·관계 중 무엇이 모자랐는지) 표. 선택지 답을 '항상 0번'과 '관계를 올리는 쪽'으로 나눠서.
- 측정 도구는 `tools/measure_duo.cjs`로 남긴다 (게임 파일은 안 바꿈).
- 보고서: 숫자 표 + 조건을 바꾼다면 후보 2~3개 (바꾸지는 말 것).

## 작업 5. 노드 검사 한 번에 + 빠른 검사

- 할 일: `tools/check_all.py`가 지금 `test_*.cjs`를 전부 도는데 오래 걸린다. 검사별 걸린 시간을 표로 재고, `--quick` 옵션(오래 걸리는 실제 진행 검사는 건너뜀)을 추가. 각 `test_*.cjs` 맨 위 설명에 걸리는 시간이 없으면 적는다.
- 바꿔도 되는 파일: `tools/check_all.py`, `tools/test_*.cjs` 맨 위 주석만
- 검사: `python tools/check_all.py`와 `--quick` 둘 다 통과.

## 작업 6. 경기 장면 해설·SNS 글 다양성 조사 (조사 + 글 추가)

- 배경: 259~263에서 포지션 해설(`data/position_voice.js` POSITION_VOICE), SNS 반응(`data/position_social.js`)을 넣었다. 같은 글이 너무 자주 반복되는지 모른다.
- 할 일:
  1. 5포지션 × 2시즌 실제 진행에서 해설·SNS 글이 몇 번씩 나왔는지 세는 측정 `tools/measure_voice.cjs` (재생 해설은 `positionVoice(m, setIdx, e, i)`를 경기 기록에 대고 부르면 된다 — `tools/test_position_social.cjs` 참고).
  2. 한 시즌에 같은 문장이 5번 넘게 나오는 키(포지션·장면)에 문장을 1~2개 더 쓴다. 말투: 실제 그 포지션 선수의 경험처럼, 없는 일 지어내지 않기(장면에 나온 것만), 조사 규칙은 작업 2와 같음.
- 바꿔도 되는 파일: `data/position_voice.js`·`data/position_social.js`의 글 배열만, `tools/measure_voice.cjs`
- 검사: 정답지 요약 그대로 (`--loose`). check_all 통과.

## 작업 7. iOS 옛 Safari 정규식 오류 조사 (조사만)

- 배경: `js/links.js`의 lookbehind 정규식이 iOS 16.3 이하 Safari에서 오류 (사용자가 전에는 안 고치기로 함).
- 할 일: 그 정규식이 몇 군데인지, lookbehind 없이 같은 결과를 내는 대안 코드, 바꾸면 무엇이 달라질 수 있는지. 그리고 저장소 전체에서 옛 브라우저에서 안 되는 문법(`?.`, `??`, `replaceAll`, lookbehind 등)을 찾아 표.
- 바꿔도 되는 파일: 없음 (보고서만, 대안 코드는 보고서 안에).

## 작업 8. 후반 '위기감' 연출 아이디어 (기획만)

- 배경 (HANDOFF 7장 '나중에'): 5~9년 차에 내 선수가 리그 1위가 되면 쉬워진다. **난이도·승률은 그대로** 두고, '운이 좋아서 이겼다'고 느끼게 하는 뉴스·연락 아이디어.
- 할 일: 지금 뉴스·SNS·연락 구조(`js/news.js`, `js/events.js` postSocial, `data/news.js`)를 보고, 데이터만 추가해서 할 수 있는 안 6~10개를 표로 (조건·글 예시·나오는 빈도·필요한 코드). 근거 데이터가 있는 것만 (예: 상대 팀 연승, 우리 팀 약점 = 실제 경기 기록에서 많이 진 단계).
- 바꿔도 되는 파일: 없음 (보고서만).

---

### 순서 추천
작업 1·2는 실제 버그·글 품질이라 먼저. 3·4·7·8은 조사라 아무 때나. 5는 다른 작업 검사를 빠르게 해 주니 일찍 해도 좋음. 6은 2 다음 (조사 규칙 같이 쓰려고).

### 겹치지 않게 (Claude가 지금 만지는 곳)
`data/events*.js`의 `followUp`·`flag` 연결, `js/events.js`의 후속 연락(scheduleFollowUps·firePendingEvents), 새 후속 연락 데이터. 작업 1·2가 같은 데이터 파일을 만지면 **작은 커밋으로 자주** 하고, 충돌하면 멈추고 보고서에 적어 줘.
