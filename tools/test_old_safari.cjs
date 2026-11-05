// 283 검사: iOS 16.3 이하 Safari에서 안 되는 정규식 문법이 없는지 + 이름 링크(js/links.js)가 예전과 같은 결과인지
// 1) js/·data/ 코드(주석 줄 제외)에 앞쪽 살피기 (?<= (?<! 가 없음 (Safari 16.4부터 지원, 옛 아이폰에선 그 자리에서 오류)
// 2) nextNameMatch(새 방식)와 예전 정규식 (?<![A-Za-z0-9])(이름|…)(?![A-Za-z0-9]) 가 무작위 문장 5000개에서 같은 곳을 찾음
// 실행: node tools/test_old_safari.cjs (1초)
const fs = require("fs"), path = require("path"), vm = require("vm");
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const root = path.join(__dirname, "..");

// 1)
const bad = [];
["js", "data"].forEach(function (d) {
  fs.readdirSync(path.join(root, d)).filter(function (f) { return f.endsWith(".js"); }).forEach(function (f) {
    fs.readFileSync(path.join(root, d, f), "utf8").split(/\r?\n/).forEach(function (ln, i) {
      const code = ln.replace(/\/\/.*$/, "");
      if (/\(\?<[=!]/.test(code)) bad.push(d + "/" + f + ":" + (i + 1));
    });
  });
});
ok(!bad.length, "앞쪽 살피기 정규식 (?<= (?<! 없음" + (bad.length ? " — " + bad.join(", ") : ""));

// 2)
const src = fs.readFileSync(path.join(root, "js", "links.js"), "utf8");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf("function escapeRegExp"), src.indexOf("function nameIndex")) +
  src.slice(src.indexOf("function nextNameMatch"), src.indexOf("function linkifyNames")), ctx);
let seed = 7;
const rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const ALPHA = "abAB01 가나,.-_()·";
const word = function (n) { let s = ""; for (let i = 0; i < n; i++) s += ALPHA[Math.floor(rnd() * ALPHA.length)]; return s; };
let same = true, hits = 0, example = "";
for (let t = 0; t < 5000 && same; t++) {
  const names = []; for (let k = 0; k < 1 + Math.floor(rnd() * 4); k++) names.push(word(2 + Math.floor(rnd() * 3)));
  names.sort(function (a, b) { return b.length - a.length; });
  const alt = names.map(ctx.escapeRegExp).join("|");
  const text = word(5 + Math.floor(rnd() * 25)) + names[0] + word(Math.floor(rnd() * 10)) + (rnd() < 0.5 ? names[names.length - 1] : "");
  const oldRe = new RegExp("(?<![A-Za-z0-9])(" + alt + ")(?![A-Za-z0-9])", "g"), newRe = new RegExp("(" + alt + ")(?![A-Za-z0-9])", "g");
  const a = [], b = []; let m;
  while ((m = oldRe.exec(text))) a.push(m.index + ":" + m[1]);
  while ((m = ctx.nextNameMatch(newRe, text))) b.push(m.index + ":" + m[1]);
  hits += a.length;
  if (a.join() !== b.join()) { same = false; example = JSON.stringify({ text: text, names: names, old: a, now: b }); }
}
ok(same && hits > 1000, "새 방식이 예전 정규식과 같은 이름을 찾음 (무작위 문장 5000개, 찾은 이름 " + hits + "개)" + (example ? " " + example : ""));

console.log(fail ? "\n❌ " + fail + "개 실패" : "\n전체 통과");
process.exit(fail ? 1 : 0);
