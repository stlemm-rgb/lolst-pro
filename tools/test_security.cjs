// 286 보안 검사 (공개 사이트 배포 전): 서버 없는 정적 게임이라 볼 것은 '글 속에 숨은 코드가 실행되는 길'과 '바깥에서 불러오는 것'
// 1) 글 속 실행 코드(onclick="…" 같은 속성)·eval·new Function 없음 → 공개 사이트 CSP(script-src 'self')와 맞음
// 2) 바깥 주소에서 스크립트·데이터를 불러오지 않음 (fetch·XMLHttpRequest·WebSocket·외부 script src)
// 3) tools/bundle.py가 공개 사이트 index.html에 CSP를 넣음
// 4) 가져온 세이브의 구단·선수 이름에서 HTML 기호를 지움 (js/save.js cleanSaveNames)
// 5) (287) 세이브 안 모든 글·이름표에서 < > ` 를 지움 (cleanSaveText), 가져오기 파일 크기 제한, 이름 입력칸도 정리
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
const verLine = (function () { const ls = fs.readFileSync(path.join(root, "js", "save.js"), "utf8").split(/\r?\n/); const i = ls.findIndex(function (l) { return /fetch\("version\.json\?t="/.test(l); }); return i === -1 ? null : "js/save.js:" + (i + 1); })(); // 315 새 버전 알림 (같은 사이트 파일)
const inl = scan(/<[a-z][^>]*\son[a-z]{3,15}\s*=|['"]\s*on[a-z]{3,15}=["\\]/i);
ok(!inl.length, "글 속 실행 코드(on…= 속성) 없음" + (inl.length ? " — " + inl.join(", ") : ""));
const ev = scan(/\beval\s*\(|new Function\s*\(|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`]/);
ok(!ev.length, "eval·new Function·문자열 타이머 없음" + (ev.length ? " — " + ev.join(", ") : ""));
const net = scan(/\bfetch\s*\(|XMLHttpRequest|WebSocket|<script[^>]+src=["']https?:/).filter(function (x) { return x !== verLine; });
ok(!net.length, "바깥 주소에서 불러오기 없음 (315: 같은 사이트 version.json 읽기 한 곳만)" + (net.length ? " — " + net.join(", ") : ""));
const bundle = fs.readFileSync(path.join(root, "tools", "bundle.py"), "utf8");
ok(/Content-Security-Policy/.test(bundle) && /script-src 'self'/.test(bundle) && /connect-src 'self'/.test(bundle) && !/connect-src[^;]*(https?:|\*)/.test(bundle), "공개 사이트 묶음에 CSP (script-src 'self' · connect-src 'self' — 바깥 주소 없음)");

const save = fs.readFileSync(path.join(root, "js", "save.js"), "utf8");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(save.slice(save.indexOf("const SAVE_IMPORT_MAX"), save.indexOf("function ensureStateReady")), ctx);
const st = { player: { name: '<img src=x onerror="a()">나' }, league: { teams: [{ name: "Anyone's Legend", short: "<b>AL</b>" }], oldTeams: [], players: { P1: { name: "Fa`ker&" } } },
  world: { teams: [{ name: "W<", short: "W\"" }], players: { X1: { name: "<svg>" } } }, romance: { met: { a: { name: "<i>" } } }, friends: { retired: [{ name: "<u>" }] } };
ctx.cleanSaveNames(st);
const all = JSON.stringify(st);
ok(!/[<>`&]/.test(all.replace(/\\"/g, "")) && st.league.teams[0].name === "Anyone's Legend", "가져온 세이브 이름에서 < > \" & ` 지움 (작은따옴표 이름은 그대로)");

const deep = { a: ["x<img src=y>", { b: "`ok`", "<k>": 1 }], c: "\"대사\" Anyone's" };
ctx.cleanSaveText(deep);
ok(deep.a[0] === "ximg src=y" && deep.a[1].b === "ok" && !("<k>" in deep.a[1]) && deep.c === "\"대사\" Anyone's", "세이브 안 모든 글·이름표에서 < > ` 지움 (큰따옴표·작은따옴표는 남김)");
ok(/file\.size > SAVE_IMPORT_MAX/.test(save), "가져오기 파일 크기 제한");
const cr = fs.readFileSync(path.join(root, "js", "creation.js"), "utf8"), mn = fs.readFileSync(path.join(root, "js", "main.js"), "utf8");
ok(/draft\.name = cleanName\(/.test(cr) && /cleanName\(document\.getElementById\("player-name"\)/.test(mn), "선수 이름 입력칸(만들 때·바꿀 때)도 기호 정리");

console.log(fail ? "\n❌ " + fail + "개 실패" : "\n전체 통과");
process.exit(fail ? 1 : 0);
