// 이름 겹침 검사 (R0, 2026-10-15): node tools/test_names.cjs
// 모든 js/*.js · data/*.js 의 맨 바깥 function·const·let·var 이름이 겹치면 실패.
// 왜: 파일을 <script>로 차례로 읽으므로, 같은 이름이 두 번 나오면 뒤 파일이 앞 파일 것을 몰래 덮어씀
//     (실제 사고: 183 대시보드 막대 깨짐 miniBarHTML, 연봉 내역 pctText)
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const files = ["js", "data"].flatMap(function (dir) {
  return fs.readdirSync(path.join(root, dir)).filter(function (f) { return f.endsWith(".js"); }).map(function (f) { return dir + "/" + f; });
});
const seen = {};
const dup = [];
files.forEach(function (f) {
  const text = fs.readFileSync(path.join(root, f), "utf8");
  const re = /^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1];
    if (seen[name] && seen[name] !== f) dup.push(name + ": " + seen[name] + " · " + f);
    else seen[name] = f;
  }
});
// 알려진 겹침 (일부러 둔 것만): 없음 (R1에서 starsText 정리)
const KNOWN = [];
const real = dup.filter(function (d) { return KNOWN.indexOf(d.split(":")[0]) === -1; });
console.log("이름 " + Object.keys(seen).length + "개 검사 · 겹침 " + dup.length + "개" + (dup.length ? " (" + dup.join(" / ") + ")" : ""));
if (real.length) { console.log("❌ 새 이름 겹침: " + real.join(" / ")); process.exit(1); }
console.log("✅ 통과");
