// CSS 검사 (R4, 2026-10-15): node tools/test_css.cjs
// 같은 화면 폭 조건(@media) 안에서 같은 선택자를 두 번 쓰면 실패 → 앞 것이 뒤 것에 몰래 덮이는 일 막기
const fs = require("fs");
const path = require("path");
const css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const seen = {};
const dup = [];
let i = 0, media = [""];
let buf = "";
while (i < css.length) {
  const c = css[i];
  if (c === "{") {
    const head = buf.trim().replace(/\s+/g, " ");
    buf = "";
    if (/^@media/.test(head)) { media.push(head); i++; continue; }
    if (/^@(keyframes|font-face|supports)/.test(head)) { // 통째로 건너뛰기
      let depth = 1; i++;
      while (i < css.length && depth) { if (css[i] === "{") depth++; else if (css[i] === "}") depth--; i++; }
      continue;
    }
    const key = media[media.length - 1] + " | " + head;
    if (seen[key]) dup.push(key); else seen[key] = 1;
    while (i < css.length && css[i] !== "}") i++; // 선언 건너뛰기
    i++; continue;
  }
  if (c === "}") { if (media.length > 1) media.pop(); buf = ""; i++; continue; }
  buf += c; i++;
}
console.log("CSS 규칙 " + Object.keys(seen).length + "개 · 같은 선택자 겹침 " + dup.length + "개");
if (dup.length) { console.log("❌ " + dup.slice(0, 10).join(" / ")); process.exit(1); }
console.log("✅ 통과");
