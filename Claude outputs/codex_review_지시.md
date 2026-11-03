# Codex 코드 리뷰 지시서 (2026-11-03, 기준 커밋 fd16c51)

롤(리그 오브 레전드) 프로게이머 커리어 게임 「챌린저 로드」 저장소(이 폴더)의 **최근 변경 코드 리뷰**야. **읽기만 해. 파일을 고치거나 커밋하지 마.**

## 게임·기술 규칙 (먼저 읽기: CLAUDE.md, HANDOFF.md 4장, FILEMAP.md)

- 순수 HTML/CSS/JS, `Challenger_Road.html`을 `file://`로 열어 실행. fetch·ES module·외부 라이브러리 금지. `<script src>` 순서대로 로드, **전역 함수 이름이 겹치면 뒤 파일이 덮음**.
- 데이터는 `data/*.js` 상수, 로직은 `js/*.js`.
- **게임 결과용 난수는 `Math.random`, 화면 연출용은 `fxRandom()`** (js/portrait.js). 화면 코드에서 `Math.random`을 쓰면 게임 결과가 밀림.
- 새 최상위 `state` 필드는 js/save.js `SAVED_FIELDS`와 `stateFromSave` 둘 다. 예전 세이브는 `ensureStateReady`·`…State()` 함수가 빈 칸을 채움.
- `confirm()/alert()/prompt()` 금지 (js/main.js `askConfirm`).
- 화면은 PC와 휴대폰(760px 이하) 둘 다. 휴대폰 대시보드는 js/dash_layout.js `dashMobileHTML`, PC는 `dashPcHTML`.

## 리뷰 범위

`git diff 797acd0 HEAD -- js css Challenger_Road.html data/health.js data/ui.js data/shop.js data/guide.js data/room.js` (약 2,000줄)

**빼기:** `data/social_posts.js`, `data/social_posts_pro.js`, `data/mishaps.js` (글 데이터), 문서(*.md), tools/, golden.json.

이 범위의 기능 (PROGRESS.md 230~241):
- 230 이번 주 행동 그림 (js/room.js, data/room.js)
- 231·237 휴대폰 앱: 메시지·SNS(프로피드)·나를 언급 (js/sns_page.js)
- 232·235·236·240 대시보드 PC·휴대폰 (js/dash_layout.js), 바로가기·빠른 선택 창
- 234 SNS 최근 글 피하기 (js/events.js)
- 238 부상·번아웃·합숙 컨디션 (js/health.js, data/health.js, js/main.js nextWeek, js/matchsim.js, js/league.js starterAt/starters, js/shop.js)
- 239 컨디션 바닥 반등 (js/health.js conditionFloorWeek)
- 241 휴대폰 인사 후보 카드 (js/sns_page.js openStaffPick, css)

## 찾을 것 (중요한 순서)

1. **정확성 버그**: 멈춤·오류(undefined 접근 등), 잘못된 계산, 조건 빠짐, 순서 문제. 특히
   - 부상 중 내 선수가 경기에 나가거나 라인업이 비는 경우 (starterAt·starters·playMatch의 userIn, 토너먼트·해외 대회 경로, 올스타 등 `state.benched`만 보고 `userSidelined()`를 안 보는 곳)
   - 예전 세이브(state.health 없음)·은퇴·새해 넘김에서 오류
   - 버튼 이벤트가 안 묶이거나 두 번 묶이는 곳, 다시 그릴 때 사라지는 곳
2. **게임 결과를 몰래 바꾸는 화면 코드**: 화면 함수 안의 `Math.random`, 화면을 그리다가 state를 바꾸는 곳
3. **저장 누락**: 새 state 필드인데 SAVED_FIELDS·stateFromSave에 없음
4. **휴대폰/PC 한쪽만 깨지는 것**: 760px 경계, 한쪽에만 있는 버튼·요소를 다른 쪽 코드가 찾는 경우
5. (여유 있으면) 전역 이름 겹침 위험, 크게 느려지는 반복

스타일·취향(이름, 주석, 줄 길이)은 말하지 마.

## 확인 (읽기 전용으로 돌려도 됨)

- `node tools/test_names.cjs` (전역 이름 겹침), `node tools/test_css.cjs`

## 보고 형식 (한국어, 마크다운)

찾은 것마다:

```
### [심각도: 높음/중간/낮음] 한 줄 제목
- 위치: 파일:줄
- 무슨 일이 생기나: (구체적인 상황 → 잘못된 결과)
- 근거: (코드 몇 줄 인용)
- 고치는 방법 제안: (짧게)
- 확신: 확실 / 아마 / 의심
```

마지막에 "찾은 것 없음"인 부분(확인했는데 괜찮았던 것)도 한 줄씩 적어.
