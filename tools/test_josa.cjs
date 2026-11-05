// 279 검사: 글 속 빈칸({player} {team} …) 바로 뒤에 받침에 따라 바뀌는 조사를 고정으로 붙이지 않았는지 (Codex 3번 조사 → 63곳 고침)
// 이름은 받침이 있을 수도 없을 수도 있어서 이(가)·을(를)·은(는)·와(과)·(으)로·(이)지·(이)라처럼 괄호로 쓰거나 문장을 바꿈
// 숫자 빈칸은 뺌: {score}로 = js/news.js fillNews가 읽는 소리에 맞게 고침 · {fans} = 늘 '…명' · {jokerBan} 30 · {curveSlow} 80 · {curveFast} · {penDiv}
// 실행: node tools/test_josa.cjs (1초)
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "data");
const NUMBERS = ["score", "fans", "jokerBan", "curveSlow", "curveFast", "penDiv"];
const PAT = /\{([A-Za-z0-9_]+)\}(이었|이에요|이지|이랑|이라|이나|이야|이네|이다|이고|으로|였|예요|잖|이|가|을|를|은|는|와|과|랑|라|로|야|지|나)(?!\()/g;
const bad = [];
for (const f of fs.readdirSync(dir).filter(function (f) { return f.endsWith(".js"); })) {
  fs.readFileSync(path.join(dir, f), "utf8").split(/\r?\n/).forEach(function (ln, i) {
    if (/^\s*\/\//.test(ln)) return;
    let m; PAT.lastIndex = 0;
    while ((m = PAT.exec(ln))) if (NUMBERS.indexOf(m[1]) === -1) bad.push(f + ":" + (i + 1) + "  " + ln.slice(Math.max(0, m.index - 10), m.index + m[0].length + 6).trim());
  });
}
if (bad.length) { console.log("❌ 빈칸 뒤 고정 조사 " + bad.length + "곳 — 이(가)처럼 괄호로 쓰거나 문장을 바꿔 주세요"); bad.forEach(function (x) { console.log("   " + x); }); }
else console.log("✅ 빈칸 뒤 고정 조사 없음 (data/*.js)");
process.exit(bad.length ? 1 : 0);
