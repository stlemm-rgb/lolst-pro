// 스토브 리그 측정 (320 다음, 0단계): 실제 게임 코드는 안 바꾸고 측정만
// 실행: node tools/measure_stove.cjs            (약 3분)
//       SEEDS=2 SEASONS=3 node tools/measure_stove.cjs   (빠르게)
// 상황: 2017 시작, 1부 중간 팀 미드 (measure_transfers.cjs와 같은 방식)
//
// A. 찌라시가 맞을 수 있나 — 47주에 '움직일 만한 선수'(FA · 계약 올해 끝 · 2부에서 1부 주전급)를 뽑고
//    예상 행선지(그 포지션 주전보다 2점 이상 낫고 돈이 되는 1부 팀 중 가장 차이가 큰 곳)를 정한 뒤, 새해 1주에 실제로 어디 갔는지 비교
// B. 우리 팀 영입 0 / 1 / 2명 — 52주에 우리 팀 약한 자리(내 포지션 빼고)에 지금 주전보다 3점 이상 나은 선수를
//    어느 팀에서든(가장 센 경우) 데려옴 (외국인 제한·구단 돈 지킴, 다음 시즌까지 보호 capKeep) → 다음 시즌 결과 비교
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.resolve(path.join(__dirname, "..")) + "/";
const scripts = [...fs.readFileSync(root + "Challenger_Road.html", "utf8").matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => x !== "js/start.js");
const CODE = scripts.map(s => [s, fs.readFileSync(root + s, "utf8")]);

function create(seed) {
  const M = Object.create(globalThis.Math);
  M.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const element = { innerHTML: "", hidden: false, value: "", style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, addEventListener() {}, remove() {}, focus() {}, scrollIntoView() {}, setAttribute() {}, getAttribute() { return ""; }, querySelectorAll() { return []; }, querySelector() { return element; } };
  const ctx = vm.createContext({ console, Math: M, Date, setTimeout() {}, clearTimeout() {},
    document: { getElementById() { return element; }, querySelectorAll() { return []; }, querySelector() { return element; }, createElement() { return { ...element }; }, addEventListener() {}, removeEventListener() {}, body: { appendChild() {} } },
    window: { scrollTo() {}, addEventListener() {}, scrollY: 0, innerWidth: 1200, matchMedia() { return { matches: false, addEventListener() {} }; } }, URL, Blob,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, navigator: { userAgent: "node" }, location: { href: "" } });
  ctx.window.document = ctx.document;
  for (const [s, code] of CODE) vm.runInContext(code, ctx, { filename: s });
  return ctx;
}

const RUN = `(function (seasons, BUY, POOL) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const sc = id => playerScore(id);
  const A = [], B = { buys: [], none: 0, tries: 0 };
  let pred = null;
  const snapStarters = () => { const o = {}; tier1Ids().forEach(id => { const s = starters(id); o[id] = Object.keys(s).map(k => s[k]).filter(Boolean); }); return o; };
  let prevSt = null; const churn = [];
  for (let w = 0; w < seasons * 52 + 34; w++) {
    state.retirePlanned = false;
    state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));

    // B. 52주(새해 직전)에 우리 팀 영입
    if (state.week === 52 && BUY > 0) {
      const t = myTeam(), my = state.player.position;
      const weak = weakPositions(t).filter(pos => pos !== my);
      for (let k = 0; k < BUY && k < weak.length; k++) {
        const pos = weak[k], st = starterAt(t.id, pos), base = st ? sc(st) : 0;
        B.tries++;
        const c = Object.keys(state.league.players).map(id => {
          const p = state.league.players[id];
          if (p.teamId === t.id || p.pos !== pos || p.loan || p.retired || sc(id) < base + 3 || !foreignOk(id, t.id)) return null;
          if (POOL === "free" && p.teamId && p.contractEnd > state.year && findTeam(p.teamId).tier === 1) return null; // 계약 남은 1부 선수는 빼기
          return { id, fee: p.teamId ? transferFee(id) : 0, salary: npcContractSalary(id, t.tier), score: sc(id), tier: p.teamId ? findTeam(p.teamId).tier : 0 };
        }).filter(x => x && canAfford(t, x)).sort((a, b) => b.score - a.score)[0];
        if (!c) { B.none++; continue; }
        B.buys.push({ y: state.year, pos, gain: Math.round((c.score - base) * 10) / 10, from: c.tier, fee: c.fee });
        npcTransfer(c.id, t, c.fee, c.salary, "stove");
        const p = findPlayer(c.id); p.contractEnd += 1; p.capKeep = state.year + 1;
      }
    }

    nextWeek();

    // A. 47주: 예상 리스트
    if (state.week === 47) {
      const avg = {}; POSITION_IDS.forEach(pos => { const v = tier1Ids().map(id => starterAt(id, pos)).filter(Boolean).map(sc); avg[pos] = v.reduce((a, b) => a + b, 0) / v.length; });
      pred = [];
      Object.keys(state.league.players).forEach(id => {
        const p = state.league.players[id]; if (p.retired) return;
        const from = p.teamId ? findTeam(p.teamId) : null;
        const kind = !from ? "fa" : p.contractEnd <= state.year ? "end" : (from.tier === 2 && sc(id) >= avg[p.pos] - 1) ? "up" : null;
        if (!kind) return;
        let best = null;
        tier1Ids().forEach(tid => { if (from && tid === from.id) return; const s = starterAt(tid, p.pos); const gain = sc(id) - (s ? sc(s) : 0);
          if (gain >= 2 && teamMoney(tid) >= 0 && (!best || gain > best.gain)) best = { to: tid, gain }; });
        pred.push({ id, kind, from: p.teamId, to: best ? best.to : null, score: sc(id), tier1from: from && from.tier === 1 });
      });
      pred.year = state.year;
    }
    // A. 새해 1주: 실제 결과
    if (state.week === 1 && pred && state.year === pred.year + 1) {
      const r = { y: pred.year, n: pred.length, withTo: 0, moved: 0, toPred: 0, toTier1: 0, stayed: 0, gone: 0, byKind: {} };
      pred.forEach(x => {
        const p = state.league.players[x.id];
        const k = r.byKind[x.kind] = r.byKind[x.kind] || { n: 0, moved: 0, toPred: 0 };
        k.n++; if (x.to) r.withTo++;
        if (!p || p.retired) { r.gone++; return; }
        if (p.teamId !== x.from) { r.moved++; k.moved++; if (p.teamId && findTeam(p.teamId) && findTeam(p.teamId).tier === 1) r.toTier1++; if (x.to && p.teamId === x.to) { r.toPred++; k.toPred++; } }
        else r.stayed++;
      });
      // 실제로 1부 팀에 새로 들어온 선수 중 리스트에 있던 비율
      const ids = new Set(pred.map(x => x.id));
      const ins = (state.league.transferLog || []).filter(e => e.y === state.year && e.w <= 1 && e.team && findTeam(e.team) && findTeam(e.team).tier === 1 && e.kind !== "retire");
      r.ins = ins.length; r.insInList = ins.filter(e => ids.has(e.id)).length;
      A.push(r); pred = null;
    }
    if (state.week === 33) { const now = snapStarters(); if (prevSt) { let n = 0, t = 0; Object.keys(prevSt).forEach(id => { if (!now[id]) return; t += prevSt[id].length; n += prevSt[id].filter(x => now[id].indexOf(x) === -1).length; }); churn.push(n / t); } prevSt = now; }
  }
  const seas = (state.career.seasons || []).filter(s => s.year > 2017).map(s => ({ y: s.year, rank: s.rank, tier: s.tier, league: s.titles.indexOf("리그 우승") !== -1, worlds: s.titles.indexOf("월드 우승") !== -1, any: s.titles.length }));
  return JSON.stringify({ A, B, seas, churn, str: teamStrength(myTeam().id) });
})`;

const NS = Number(process.env.SEEDS || 6), SEASONS = Number(process.env.SEASONS || 4);
const SEEDS = [7, 21, 42, 77, 101, 133, 177, 211].slice(0, NS);
const pct = (a, b) => b ? Math.round(100 * a / b) + "%" : "-";
const results = {};
const VARS = [[0, "all", "0명"], [1, "all", "1명 (어디서든)"], [2, "all", "2명 (어디서든)"], [1, "free", "1명 (FA·계약 끝·2부만)"], [2, "free", "2명 (FA·계약 끝·2부만)"]];
for (const [BUY, POOL, label] of VARS) {
  const agg = { A: [], B: { buys: [], none: 0, tries: 0 }, seas: [], churn: [] };
  for (const sd of SEEDS) {
    const c = create(sd * 7919);
    const r = JSON.parse(vm.runInContext(RUN, c)(SEASONS, BUY, POOL));
    agg.A.push(...r.A); agg.B.buys.push(...r.B.buys); agg.B.none += r.B.none; agg.B.tries += r.B.tries; agg.seas.push(...r.seas); agg.churn.push(...r.churn);
  }
  results[label] = agg;
  process.stderr.write(label + " 끝\n");
}

// ----- A 결과 (영입 0명 판) -----
const A = results["0명"].A;
const sum = k => A.reduce((s, r) => s + r[k], 0);
console.log("\n## A. 찌라시가 맞을 수 있나 (영입 0명 판, " + A.length + "번의 비시즌)");
console.log("| 항목 | 값 |\n|---|---|");
console.log("| 47주 '움직일 만한 선수' (한 해 평균) | " + (sum("n") / A.length).toFixed(1) + "명 |");
console.log("| 그중 예상 행선지(1부 팀)를 정할 수 있음 | " + pct(sum("withTo"), sum("n")) + " |");
console.log("| 새해에 실제로 팀이 바뀜 | " + pct(sum("moved"), sum("n")) + " |");
console.log("| 바뀐 선수 중 1부 팀으로 | " + pct(sum("toTier1"), sum("moved")) + " |");
console.log("| **예상 행선지와 실제가 같음** (예상이 있는 선수 기준) | " + pct(sum("toPred"), sum("withTo")) + " |");
console.log("| 은퇴 등으로 사라짐 | " + pct(sum("gone"), sum("n")) + " |");
console.log("| 새해 1부 팀에 새로 들어온 선수 (한 해 평균) | " + (sum("ins") / A.length).toFixed(1) + "명 |");
console.log("| 그중 47주 리스트에 있던 선수 | " + pct(sum("insInList"), sum("ins")) + " |");
const kinds = {}; A.forEach(r => Object.keys(r.byKind).forEach(k => { const o = kinds[k] = kinds[k] || { n: 0, moved: 0, toPred: 0 }; o.n += r.byKind[k].n; o.moved += r.byKind[k].moved; o.toPred += r.byKind[k].toPred; }));
console.log("\n| 종류 | 한 해 평균 | 팀 바뀜 | 예상 팀으로 |\n|---|---|---|---|");
const KN = { fa: "FA", end: "계약 올해 끝", up: "2부 → 1부급" };
Object.keys(kinds).forEach(k => console.log("| " + KN[k] + " | " + (kinds[k].n / A.length).toFixed(1) + "명 | " + pct(kinds[k].moved, kinds[k].n) + " | " + pct(kinds[k].toPred, kinds[k].n) + " |"));

// ----- B 결과 -----
console.log("\n## B. 우리 팀 영입 (52주) — 1부 시즌 " + results["0명"].seas.filter(x => x.tier === 1).length + "개씩");
console.log("| 영입 | 실제 데려옴 (시도 중) | 평균 점수 차 | 다음 시즌 평균 순위 | 리그 우승 | 월드 우승 | 우승 하나라도 | 1부 주전 1년 변동 |\n|---|---|---|---|---|---|---|---|");
VARS.forEach(v => { const n = v[2];
  const g = results[n], s = g.seas.filter(x => x.tier === 1);
  const gain = g.B.buys.length ? (g.B.buys.reduce((a, b) => a + b.gain, 0) / g.B.buys.length).toFixed(1) : "-";
  const rank = s.length ? (s.reduce((a, b) => a + b.rank, 0) / s.length).toFixed(2) : "-";
  const ch = g.churn.length ? Math.round(100 * g.churn.reduce((a, b) => a + b, 0) / g.churn.length) + "%" : "-";
  console.log("| " + n + " | " + g.B.buys.length + " (" + g.B.tries + ") | +" + gain + " | " + rank + "위 | " + pct(s.filter(x => x.league).length, s.length) + " | " + pct(s.filter(x => x.worlds).length, s.length) + " | " + pct(s.filter(x => x.any).length, s.length) + " | " + ch + " |");
});
const from = {}; results["2명 (FA·계약 끝·2부만)"].B.buys.forEach(b => { const k = b.from === 0 ? "FA" : b.from + "부"; from[k] = (from[k] || 0) + 1; });
console.log("\n(2명 판에서 데려온 곳: " + Object.keys(from).map(k => k + " " + from[k]).join(" · ") + ")");
