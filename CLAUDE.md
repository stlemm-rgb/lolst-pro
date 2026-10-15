# Project Rules

A text career simulation game. Double-clicking `index.html` in the browser runs it, with no internet connection (offline, local only).

## Working Rules

1. **Explain in plain Korean.** The user is a coding beginner. Explain without jargon, or briefly explain jargon when you use it.
2. **Commit each time a feature is finished.** Work in small units, and once one feature works, make a git commit.
3. **Keep event data separate from code.** Write event content (text, choices, effects) in a separate data file, not inside the game-logic code.

## 파일 찾기

- 어느 파일에 무엇이 있는지: **`FILEMAP.md`** (`python3 tools/filemap.py`로 다시 만들기). 새 파일을 만들면 index.html에 넣고 지도도 다시 만들 것.

## Technical Constraints

- Opening `index.html` directly (`file://`) must work, so `fetch()` cannot load JSON files.
  → Write data files as `.js` files such as `data/events.js` (e.g., `const EVENTS = [...]`) and load them with a `<script>` tag.
- No `<script type="module">` / `import` either (also blocked on `file://`). Load files in order with plain `<script src>`.
- No external libraries, CDNs, or web fonts (no internet use).
- No build tools (npm, etc.). Plain HTML, CSS, and JavaScript only.
  - 예외 하나 (R7, 사용자 결정 C안): 공개 사이트에 올릴 때만 GitHub Actions(.github/workflows/pages.yml)가 `tools/bundle.py`(파이썬, 패키지 없음)로 스크립트를 game.js 하나로 묶는다. 개발·로컬 플레이는 지금처럼 파일 그대로, 새 스크립트는 index.html에만 넣으면 묶음에도 자동으로 들어감. 묶음 확인: `python3 tools/bundle.py /tmp/site` 후 `GAME_INDEX=/tmp/site/index.html python3 tools/golden.py check`

## "작업완료" 리마인드 (사용자 요청)

사용자가 "작업완료"라고 하면 답변 끝에 항상 다시 알려 줄 것 (한국어, 표):
1. 커밋: `git add -A` → `git commit -m "..."`
2. GitHub에 올리기: `git push` (웹 주소 https://stlemm-rgb.github.io/lolst-pro/ 도 1~2분 뒤 자동 업데이트 — GitHub Actions가 묶어서 올림, 저장소 Actions 탭에서 초록 체크 확인)
3. 다른 PC에서 작업 시작 전: `git pull`
- push가 rejected면 `git pull` 후 다시 push. 충돌이 나면 화면을 보여 달라고 안내. 한 번에 한 PC에서만 작업 권장.
- 웹 링크에서 confirm()/alert()/prompt()는 막히므로 쓰지 말고 js/main.js askConfirm 사용.
