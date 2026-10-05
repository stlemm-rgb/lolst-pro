# Project Rules

A text career simulation game. Double-clicking `index.html` in the browser runs it, with no internet connection (offline, local only).

## Working Rules

1. **Explain in plain Korean.** The user is a coding beginner. Explain without jargon, or briefly explain jargon when you use it.
2. **Commit each time a feature is finished.** Work in small units, and once one feature works, make a git commit.
3. **Keep event data separate from code.** Write event content (text, choices, effects) in a separate data file, not inside the game-logic code.

## Technical Constraints

- Opening `index.html` directly (`file://`) must work, so `fetch()` cannot load JSON files.
  → Write data files as `.js` files such as `data/events.js` (e.g., `const EVENTS = [...]`) and load them with a `<script>` tag.
- No `<script type="module">` / `import` either (also blocked on `file://`). Load files in order with plain `<script src>`.
- No external libraries, CDNs, or web fonts (no internet use).
- No build tools (npm, etc.). Plain HTML, CSS, and JavaScript only.
