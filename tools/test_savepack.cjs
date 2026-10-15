// 세이브 압축 검사 (R5, 2026-10-15): node tools/test_savepack.cjs
// js/save.js의 lzPack·lzUnpack이 어떤 글자(한글·이모지·특수문자·빈 글자)든 그대로 되돌리는지,
// 압축본에 저장소에서 깨질 수 있는 글자(0xD800~0xDFFF)가 없는지 확인
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = vm.createContext({ Math, JSON, String, Map, Set, setTimeout() {}, localStorage: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "save.js"), "utf8"), ctx);
let seed = 7;
const rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const make = function (n, alpha) { let s = ""; for (let i = 0; i < n; i++) s += alpha[Math.floor(rnd() * alpha.length)]; return s; };
const alphas = ["ab", "가나다라마 바사", '{"a":1,"가":[2,3]}🎮🔥\n\t', String.fromCharCode.apply(null, Array.from({ length: 300 }, function (_, i) { return (i * 37) % 55000 + 1; }))];
let bad = 0, maxCode = 0;
const tests = ["", "a", "aa", "가", "🎮", "abababababab"];
for (let t = 0; t < 2000; t++) tests.push(make(Math.floor(rnd() * 500), alphas[t % alphas.length]));
tests.push(make(150000, '가나다{"}:,0123456789abc'));
tests.forEach(function (s) {
  const p = ctx.lzPack(s);
  for (let i = 0; i < p.length; i++) maxCode = Math.max(maxCode, p.charCodeAt(i));
  if (ctx.lzUnpack(p) !== s) bad++;
  const text = ctx.packSaveText(JSON.stringify({ s: s }));
  if (ctx.unpackSaveText(text).s !== s) bad++;
});
const big = tests[tests.length - 1];
console.log("압축 " + tests.length + "가지 · 실패 " + bad + " · 가장 큰 글자 코드 " + maxCode + " · 긴 글 크기 " + Math.round(ctx.lzPack(big).length / big.length * 100) + "%");
if (bad || maxCode >= 0xd800) { console.log("❌ 실패"); process.exit(1); }
console.log("✅ 통과");
