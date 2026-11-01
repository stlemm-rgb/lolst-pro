// 선수 SNS 글·해프닝 데이터 검사 (2026-11-02, SNS 글 두 배 작업)
//   node tools/test_sns_posts.cjs                 → 형식 검사 (빈칸 · 큰따옴표 · 줄바꿈 · 같은 문장 · 해프닝)
//   node tools/test_sns_posts.cjs --base <폴더>   → + 예전 파일(<폴더>/social_posts.js, social_posts_pro.js)과 비교:
//                                                   분류마다 2배 이상 · 예전 글이 그대로 · {name} 비율 ±10%p
// 게임은 tools/를 읽지 않음
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.resolve(__dirname, "..");
function load(dir) {
  const c = {}; vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(dir, "social_posts.js"), "utf8") + ";this.FAN=SOCIAL_POSTS;", c);
  vm.runInContext(fs.readFileSync(path.join(dir, "social_posts_pro.js"), "utf8") + ";this.PRO=SOCIAL_PRO_POSTS;", c);
  return c;
}
const now = load(path.join(root, "data"));
const bi = process.argv.indexOf("--base");
const base = bi !== -1 ? load(process.argv[bi + 1]) : null;

// 분류마다 쓸 수 있는 빈칸 (data/social_posts.js 맨 위 설명, js/events.js postSocial)
const EVERY = ["name", "team", "pos"];
const ONLY = { opp: ["win", "loss", "winSweep", "winClose", "lossSweep", "lossClose", "soloKill", "winStreak", "streakBreak", "superPlay", "blunder"],
  champ: ["patch"], cup: ["champion"], streak: ["winStreak", "streakBreak"], oldteam: ["transfer"], award: ["award"] };
const errs = [], warn = [];
const ratio = (l) => l.length ? Math.round(l.filter((t) => t.indexOf("{name}") !== -1).length / l.length * 100) : 0;
const seen = {};
[["팬", now.FAN, false], ["프로", now.PRO, true]].forEach(function (x) {
  const kind = x[0], posts = x[1], pro = x[2];
  Object.keys(posts).forEach(function (cat) {
    posts[cat].forEach(function (t, i) {
      const at = kind + " " + cat + "[" + i + "]";
      if (typeof t !== "string" || !t.trim()) { errs.push(at + ": 빈 글"); return; }
      if (/["\n\r]/.test(t)) errs.push(at + ": 큰따옴표·줄바꿈 → " + t);
      (t.match(/\{[^}]*\}/g) || []).forEach(function (p) {
        const k = p.slice(1, -1);
        const ok = EVERY.indexOf(k) !== -1 || (ONLY[k] && ONLY[k].indexOf(cat) !== -1) || (k === "proteam" && pro);
        if (!ok) errs.push(at + ": 이 분류에서 못 쓰는 빈칸 " + p + " → " + t);
      });
      if (/\{(name|team)\}(이|가|은|는|을|를)(\s|$|[.,!?])/.test(t)) warn.push(at + ": 받침 따라 어색한 조사 → " + t);
      if (seen[t]) errs.push(at + ": 같은 문장 (" + seen[t] + ") → " + t); else seen[t] = at;
    });
  });
});
// 해프닝 (data/mishaps.js, 있으면)
const mp = path.join(root, "data", "mishaps.js");
if (fs.existsSync(mp)) {
  const c = {}; vm.createContext(c);
  vm.runInContext(fs.readFileSync(mp, "utf8") + ";this.M=MISHAPS;this.R=MISHAP_RULES;", c);
  const ids = {}, props = (c.R.props || []).concat([null]);
  c.M.forEach(function (m, i) {
    const at = "해프닝[" + i + "] " + (m.id || "?");
    if (!m.id || ids[m.id]) errs.push(at + ": id 없음·겹침"); ids[m.id] = 1;
    if (c.R.places.indexOf(m.place) === -1) errs.push(at + ": place가 " + c.R.places.join("/") + " 중 하나가 아님");
    if (props.indexOf(m.prop === undefined ? null : m.prop) === -1) errs.push(at + ": prop이 " + props.join("/") + " 중 하나가 아님");
    ["fan", "pro"].forEach(function (k) {
      const t = m[k];
      if (k === "fan" && (typeof t !== "string" || !t.trim())) { errs.push(at + ": fan 글 없음"); return; }
      if (!t) return;
      if (/["\n\r]/.test(t)) errs.push(at + " " + k + ": 큰따옴표·줄바꿈");
      (t.match(/\{[^}]*\}/g) || []).forEach(function (p) { if (["{name}", "{team}"].indexOf(p) === -1) errs.push(at + " " + k + ": 못 쓰는 빈칸 " + p); });
      if (seen[t]) errs.push(at + " " + k + ": 같은 문장 (" + seen[t] + ")"); else seen[t] = at;
    });
  });
  console.log("해프닝 " + c.M.length + "개 · 장소별 " + JSON.stringify(c.R.places.map((p) => p + " " + c.M.filter((m) => m.place === p).length)) +
    " · 소품 " + c.M.filter((m) => m.prop).length + "개 · {name} 들어간 팬 글 " + Math.round(c.M.filter((m) => /\{name\}/.test(m.fan)).length / Math.max(1, c.M.length) * 100) + "%");
}
// 예전 파일과 비교
if (base) {
  const rows = [];
  [["팬", "FAN"], ["프로", "PRO"]].forEach(function (x) {
    Object.keys(base[x[1]]).forEach(function (cat) {
      const a = base[x[1]][cat], b = now[x[1]][cat] || [];
      a.forEach(function (t) { if (b.indexOf(t) === -1) errs.push(x[0] + " " + cat + ": 예전 글이 없어짐 → " + t); });
      if (b.length < a.length * 2) errs.push(x[0] + " " + cat + ": " + a.length + " → " + b.length + " (2배 " + a.length * 2 + "개 안 됨)");
      const ra = ratio(a), rb = ratio(b);
      if (a.length && Math.abs(ra - rb) > 10) errs.push(x[0] + " " + cat + ": {name} 비율 " + ra + "% → " + rb + "% (±10%p 넘음)");
      rows.push(x[0] + " " + cat + " " + a.length + "→" + b.length + " name " + ra + "→" + rb + "%");
    });
  });
  console.log(rows.join("\n"));
}
const total = (p) => Object.keys(p).reduce((s, k) => s + p[k].length, 0);
console.log("팬 글 " + total(now.FAN) + "개 · 프로 글 " + total(now.PRO) + "개" + (base ? " (예전 " + total(base.FAN) + " · " + total(base.PRO) + ")" : ""));
warn.slice(0, 20).forEach((w) => console.log("⚠️ " + w));
if (errs.length) { errs.slice(0, 60).forEach((e) => console.log("❌ " + e)); console.log("❌ 실패 " + errs.length + "개"); process.exit(1); }
console.log("✅ 통과" + (warn.length ? " (조사 주의 " + warn.length + "개)" : ""));
