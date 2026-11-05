// 286 보안 검사 (공개 사이트 배포 전): 서버 없는 정적 게임이라 볼 것은 '글 속에 숨은 코드가 실행되는 길'과 '바깥에서 불러오는 것'
// 1) 글 속 실행 코드(onclick="…" 같은 속성)·eval·new Function 없음 → 공개 사이트 CSP(script-src 'self')와 맞음
// 2) 바깥 주소에서 스크립트·데이터를 불러오지 않음 (fetch·XMLHttpRequest·WebSocket·외부 script src)
// 3) tools/bundle.py가 공개 사이트 index.html에 CSP를 넣음
// 4) 가져온 세이브의 구단·선수 이름에서 HTML 기호를 지움 (js/save.js cleanSaveNames)
// 실행: node tools/test_security.cjs (1초)
const fs = require("fs"), path = require("path"), vm = require("vm");
let fail = 0;
function ok(cond, msg) { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) fail++; }
const root = path.join(__dirname, "..");
const files = [];
["js", "data"].forEach(function (d) { fs.readdirSync(path.join(root, d)).filter(function (f) { return f.endsWith(".js"); }).forEach(function (f) { files.push(d + "/" + f); }); });
files.push("Challenger_Road.html");
const scan = function (re) {
  const out = [];
  files.forEach(function (f) {
    fs.readFileSync(path.join(root, f), "utf8").split(/\r?\n/).forEach(function (ln, i) {
      const code = ln.replace(/^\s*\/\/.*$/, "");
      if (re.test(code)) out.push(f + ":" + (i + 1));
    });
  });
  return out;
};
const inl = scan(/<[a-z][^>]*\son[a-z]{3,15}\s*=|['"]\s*on[a-z]{3,15}=["\\]/i);
ok(!inl.length, "글 속 실행 코드(on…= 속성) 없음" + (inl.length ? " — " + inl.join(", ") : ""));
const ev = scan(/\beval\s*\(|new Function\s*\(|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`]/);
ok(!ev.length, "eval·new Function·문자열 타이머 없음" + (ev.length ? " — " + ev.join(", ") : ""));
const net = scan(/\bfetch\s*\(|XMLHttpRequest|WebSocket|<script[^>]+src=["']https?:/);
ok(!net.length, "바깥 주소에서 불러오기 없음" + (net.length ? " — " + net.join(", ") : ""));
const bundle = fs.readFileSync(path.join(root, "tools", "bundle.py"), "utf8");
ok(/Content-Security-Policy/.test(bundle) && /script-src 'self'/.test(bundle) && /connect-src 'none'/.test(bundle), "공개 사이트 묶음에 CSP (script-src 'self' · connect-src 'none')");

const save = fs.readFileSync(path.join(root, "js", "save.js"), "utf8");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(save.slice(save.indexOf("function cleanName"), save.indexOf("function ensureStateReady")), ctx);
const st = { player: { name: '<img src=x onerror="a()">나' }, league: { teams: [{ name: "Anyone's Legend", short: "<b>AL</b>" }], oldTeams: [], players: { P1: { name: "Fa`ker&" } } },
  world: { teams: [{ name: "W<", short: "W\"" }], players: { X1: { name: "<svg>" } } }, romance: { met: { a: { name: "<i>" } } }, friends: { retired: [{ name: "<u>" }] } };
ctx.cleanSaveNames(st);
const all = JSON.stringify(st);
ok(!/[<>`&]/.test(all.replace(/\\"/g, "")) && st.league.teams[0].name === "Anyone's Legend", "가져온 세이브 이름에서 < > \" & ` 지움 (작은따옴표 이름은 그대로)");

console.log(fail ? "\n❌ " + fail + "개 실패" : "\n전체 통과");
process.exit(fail ? 1 : 0);
