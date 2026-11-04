// ④ 포지션 경험 측정 (파일은 안 바꿈): 포지션마다 내가 주인공인 경기 장면 · 장면 없는 주 · 밴 · 바텀 파트너
// 실행: node tools/measure_positions.cjs   (5포지션 × 3판 × 3시즌, 2017 1부 중간 팀)
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "measure_health.cjs"), "utf8");
eval(src.split("const POL")[0]); // 게임 불러오기는 measure_health.cjs와 같은 방법
const SEASONS = 3;
const RUN = `(function (pos, seasons) {
  linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
  state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
  const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
  startCareer(true); state.settings.autoSave = false;
  const seen = new Set(), me = POSITION_IDS.indexOf(pos);
  const partnerPos = pos === "adc" ? "support" : pos === "support" ? "adc" : null, pi = POSITION_IDS.indexOf(partnerPos);
  const out = { sets: 0, setsEv: 0, good: 0, bad: 0, other: 0, ids: {}, weeksPlayed: 0, weeksEmpty: 0, banned: 0, partners: {}, changes: 0, last: null };
  for (let w = 0; w < seasons * 52; w++) {
    state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
    state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
    nextWeek();
    const t = myTeam(); let played = false, evWeek = 0;
    userMatches().forEach(m => {
      if (!m.winner || !m.detail || seen.has(m)) return;
      seen.add(m);
      const side = m.a === t.id ? "a" : "b";
      m.detail.sets.forEach(s => {
        if (!s.lanes || s.lanes[me][side] !== USER_ID) return;
        played = true; out.sets++;
        const best = Object.keys(state.mastery).sort((x, y) => state.mastery[y] - state.mastery[x])[0];
        if (s.banned && s.banned.indexOf(best) !== -1) out.banned++;
        const mine = (s.ev || []).filter(e => e.p === USER_ID);
        if (mine.length) out.setsEv++;
        mine.forEach(e => {
          const info = matchEventInfo(e), kind = info && info.kind;
          if (kind === "good") out.good++; else if (kind === "bad") out.bad++; else out.other++;
          evWeek++; out.ids[e.e] = (out.ids[e.e] || 0) + 1;
        });
        if (partnerPos) {
          const p = s.lanes[pi][side];
          out.partners[p] = (out.partners[p] || 0) + 1;
          if (out.last && out.last !== p) out.changes++;
          out.last = p;
        }
      });
    });
    if (played) { out.weeksPlayed++; if (!evWeek) out.weeksEmpty++; }
  }
  return JSON.stringify(out);
})`;
const POS = ["top", "jungle", "mid", "adc", "support"], NAME = { top: "탑", jungle: "정글", mid: "미드", adc: "원딜", support: "서포트" };
const seeds = [21, 22, 23];
if (!process.env.MODE) for (const pos of POS) {
  const all = seeds.map(seed => JSON.parse(vm.runInContext(RUN, create(seed))(pos, SEASONS)));
  const sum = k => all.reduce((s, r) => s + r[k], 0);
  const n = seeds.length * SEASONS, sets = sum("sets");
  const ids = {}; all.forEach(r => Object.keys(r.ids).forEach(k => { ids[k] = (ids[k] || 0) + r.ids[k]; }));
  const top = Object.keys(ids).sort((a, b) => ids[b] - ids[a]).slice(0, 10).map(k => k + " " + (ids[k] / n).toFixed(1));
  console.log("== " + NAME[pos] + " (시즌 평균)");
  console.log("  출전 세트 " + (sets / n).toFixed(0) + " · 내 장면 " + ((sum("good") + sum("bad") + sum("other")) / n).toFixed(1) +
    " (좋은 " + (sum("good") / n).toFixed(1) + " / 실수 " + (sum("bad") / n).toFixed(1) + " / 기타 " + (sum("other") / n).toFixed(1) + ")" +
    " · 내 장면 있는 세트 " + Math.round(sum("setsEv") / sets * 100) + "% · 출전했는데 장면 없는 주 " + Math.round(sum("weeksEmpty") / sum("weeksPlayed") * 100) + "% · 내 최고 숙련 챔피언 밴 " + Math.round(sum("banned") / sets * 100) + "%");
  console.log("  자주 나온 장면: " + top.join(", "));
  if (pos === "adc" || pos === "support") all.forEach((r, i) => {
    const ps = Object.values(r.partners).sort((a, b) => b - a);
    console.log("  판 " + (i + 1) + " 파트너 " + ps.length + "명 (세트 " + ps.join("/") + "), 바뀐 횟수 " + r.changes);
  });
}

// ----- 원인 측정 (MODE=cause): 연차·점수에 따라 좋은 장면 : 실수 비율, 리그 선수 점수대별 비율 -----
// 실행: MODE=cause node tools/measure_positions.cjs   (5포지션 × 1판 × 8시즌)
if (process.env.MODE === "cause") {
  const CAUSE = `(function (pos, seasons) {
    linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
    state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
    const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
    startCareer(true); state.settings.autoSave = false;
    const seen = new Set(), years = [], buckets = {};
    let cur = null;
    for (let w = 0; w < seasons * 52; w++) {
      state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : (state.week % 2 ? "scrim" : "replay");
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
      nextWeek();
      if (!cur || cur.y !== state.year) { cur = { y: state.year, cy: careerYears(), score: 0, good: 0, bad: 0, sets: 0 }; years.push(cur); }
      cur.score = Math.round(playerScore(USER_ID));
      userMatches().forEach(m => {
        if (!m.winner || !m.detail || seen.has(m)) return;
        seen.add(m);
        m.detail.sets.forEach(s => {
          const ids = {}; (s.lanes || []).forEach(l => { ids[l.a] = 1; ids[l.b] = 1; });
          if (ids[USER_ID]) cur.sets++;
          (s.ev || []).forEach(e => {
            const info = matchEventInfo(e), kind = info && info.kind;
            if (kind !== "good" && kind !== "bad" || !e.p) return;
            if (e.p === USER_ID) cur[kind]++;
            const sc = e.p === USER_ID ? playerScore(USER_ID) : findPlayer(e.p) ? playerScore(e.p) : null;
            if (sc === null) return;
            const b = Math.floor(sc / 5) * 5, B = buckets[b] = buckets[b] || { good: 0, bad: 0 };
            B[kind]++;
          });
        });
      });
    }
    return JSON.stringify({ years, buckets });
  })`;
  const all = {};
  for (const pos of POS) {
    const r = JSON.parse(vm.runInContext(CAUSE, create(31))(pos, 8));
    console.log("== " + NAME[pos] + " 연차별 (점수 · 좋은 : 실수 · 출전 세트)");
    console.log("  " + r.years.map(y => y.cy + "년차 " + y.score + "점 " + y.good + ":" + y.bad + " (" + y.sets + ")").join(" / "));
    Object.keys(r.buckets).forEach(b => { const A = all[b] = all[b] || { good: 0, bad: 0 }; A.good += r.buckets[b].good; A.bad += r.buckets[b].bad; });
  }
  console.log("== 리그 선수 전체 (내 경기에 나온 사건, 점수대별 좋은 : 실수)");
  Object.keys(all).map(Number).sort((a, b) => a - b).forEach(b => console.log("  " + b + "~" + (b + 4) + "점: " + all[b].good + " : " + all[b].bad + " (실수 비율 " + Math.round(all[b].bad / (all[b].good + all[b].bad) * 100) + "%)"));
  process.exit(0);
}

// ----- 원인 2 (MODE=cause2): 같은 점수대에서 내 선수 vs 리그 선수 — 챔피언 배율 cf · 전력-점수 · 스탯 고르기 -----
// 실행: MODE=cause2 node tools/measure_positions.cjs   (PLAN=mix → 솔랭·스크림·리플레이·챔피언 연습 돌아가며, PLAN=champ → 챔피언 연습·집중 75%)
if (process.env.MODE === "cause2") {
  const C2 = `(function (pos, seasons) {
    linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
    state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = pos; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
    const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
    startCareer(true); state.settings.autoSave = false;
    const rows = { me: {}, npc: {} };
    const orig = rollSetEvents;
    rollSetEvents = function (la, lb) {
      la.concat(lb).forEach(p => {
        if (!p.id) return;
        const me = p.id === USER_ID, sc = playerScore(p.id);
        if (sc < 65 || sc >= 75) return; // 같은 점수대만 (65~74)
        const st = statsOfId(p.id), vals = Object.keys(st).filter(k => typeof st[k] === "number").map(k => st[k]);
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length, low = Math.min.apply(null, vals);
        const R = rows[me ? "me" : "npc"], b = Math.floor(sc / 5) * 5, B = R[b] = R[b] || { n: 0, cf: 0, gap: 0, avg: 0, low: 0, score: 0 };
        B.n++; B.cf += p.cf || 1; B.gap += p.power - sc; B.avg += avg; B.low += low; B.score += sc;
        const ms = me ? state.mastery : findPlayer(p.id).mastery || {}, mv = Object.values(ms); B.mmax = (B.mmax || 0) + Math.max.apply(null, mv); B.mavg = (B.mavg || 0) + mv.reduce((s, v) => s + v, 0) / mv.length; B.meta = (B.meta || 0) + (me ? metaPenaltyInfo().avg : npcMetaAvg(findPlayer(p.id)));
      });
      return orig.apply(this, arguments);
    };
    for (let w = 0; w < seasons * 52; w++) {
      state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : PLANS[state.week % PLANS.length];
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
      nextWeek();
    }
    return JSON.stringify(rows);
  })`;
  const tot = { me: {}, npc: {} };
  for (const pos of POS) {
    const ctx = create(31); vm.runInContext("var PLANS = " + JSON.stringify(process.env.PLAN === "mix" ? ["solo_rank", "scrim", "replay", "champion"] : process.env.PLAN === "champ" ? ["champion", "champ_focus", "scrim", "champion"] : ["replay", "scrim"]), ctx);
    const r = JSON.parse(vm.runInContext(C2, ctx)(pos, 8));
    ["me", "npc"].forEach(k => Object.keys(r[k]).forEach(b => { const T = tot[k][b] = tot[k][b] || { n: 0, cf: 0, gap: 0, avg: 0, low: 0, score: 0, mmax: 0, mavg: 0, meta: 0 }; Object.keys(T).forEach(f => { T[f] += r[k][b][f]; }); }));
  }
  console.log("점수대 | 누구 | 세트 수 | 평균 점수 | 챔피언 배율 cf | 전력 − 점수 | 스탯 전체 평균 | 가장 낮은 스탯 | 숙련도 최고 | 숙련도 평균 | 메타 챔피언 숙련도");
  ["65", "70"].forEach(b => ["me", "npc"].forEach(k => { const T = tot[k][b]; if (!T) return; const f = x => (T[x] / T.n).toFixed(2);
    console.log(b + "~" + (+b + 4) + " | " + (k === "me" ? "내 선수" : "리그") + " | " + T.n + " | " + f("score") + " | " + f("cf") + " | " + f("gap") + " | " + f("avg") + " | " + f("low") + " | " + f("mmax") + " | " + f("mavg") + " | " + f("meta")); }));
  process.exit(0);
}

// ----- 리그 선수 vs 내 선수 (MODE=league): 1부 주전의 스탯·숙련도가 시즌마다 어떻게 되는지 -----
// 실행: MODE=league node tools/measure_positions.cjs   (미드, 2017 1부 중간 팀, 내 선수 훈련 3가지 × 7시즌)
if (process.env.MODE === "league") {
  const LG = `(function (plans, seasons) {
    linkifyNames = function () {}; renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {};
    state = createNewState(); draft = newDraft(); draft.name = "측정"; draft.position = "mid"; draft.startYear = 2017; draft.teams = makeTeamDefs(2017);
    const list = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = list[Math.floor(list.length / 2)][1];
    startCareer(true); state.settings.autoSave = false;
    const snap = () => {
      const ids = []; tier1Ids().forEach(tid => { const s = starters(tid); Object.keys(s).forEach(k => { if (s[k] && s[k] !== USER_ID) ids.push(s[k]); }); });
      const one = id => { const st = statsOfId(id), v = Object.keys(st).filter(k => typeof st[k] === "number").map(k => st[k]);
        const ms = id === USER_ID ? Object.keys(state.mastery).filter(n => myPositionChampions().indexOf(n) !== -1).map(n => state.mastery[n]) : Object.values(findPlayer(id).mastery || {});
        const meta = id === USER_ID ? metaPenaltyInfo().avg : npcMetaAvg(findPlayer(id));
        return [playerScore(id), Math.min.apply(null, v), Math.max.apply(null, v), Math.max.apply(null, ms), ms.reduce((s, x) => s + x, 0) / ms.length, meta, id === USER_ID ? state.player.age : findPlayer(id).age]; };
      const rows = ids.map(one), avg = k => rows.reduce((s, r) => s + r[k], 0) / rows.length;
      return { y: state.year, league: [0, 1, 2, 3, 4, 5, 6].map(avg), me: one(USER_ID) };
    };
    const out = [snap()];
    for (let w = 0; w < seasons * 52; w++) {
      state.retirePlanned = false; state.plan = state.stamina < 30 ? "rest" : plans[state.week % plans.length];
      state.inbox.filter(m => m.tab === "inbox" && m.choices && m.answered === null && m.kind !== "retire" && m.kind !== "offer").forEach(m => answerMessage(m.id, 0));
      nextWeek();
      if (state.week === 47) out.push(snap());
    }
    return JSON.stringify(out);
  })`;
  const f = r => r.map((x, i) => i === 6 ? x.toFixed(0) + "세" : x.toFixed(0)).join(" / ");
  const PL = { "스크림·리플레이만": ["replay", "scrim"], "챔피언 연습 25%": ["solo_rank", "scrim", "replay", "champion"], "챔피언 연습 75%": ["champion", "champ_focus", "scrim", "champion"] };
  console.log("값 = 스탯 점수 / 가장 낮은 스탯 / 가장 높은 스탯 / 숙련도 최고 / 숙련도 평균 / 메타 챔피언 숙련도 / 나이");
  let first = true;
  for (const name of Object.keys(PL)) {
    const r = JSON.parse(vm.runInContext(LG, create(51))(PL[name], 7));
    if (first) { console.log("== 1부 주전 평균 (다른 선수)"); r.forEach(s => console.log("  " + s.y + ": " + f(s.league))); first = false; }
    console.log("== 내 선수 · " + name);
    r.forEach(s => console.log("  " + s.y + ": " + f(s.me)));
  }
  process.exit(0);
}
