// ===== 조합 성향: 메타 조합 · 조합 전략 · 밴픽 · 상성 · 시너지 =====
// 규칙과 챔피언별 성향은 data/comps.js

function findComp(id) {
  return COMPS.find(function (c) { return c.id === id; });
}

function champComps(name) {
  return CHAMPION_COMPS[name] || [];
}

function compBeats(a, b) {
  const c = findComp(a);
  return !!c && c.beats.indexOf(b) !== -1;
}

// 이 성향을 이기는 성향들
function countersOf(id) {
  return COMPS.filter(function (c) { return c.beats.indexOf(id) !== -1; }).map(function (c) { return c.id; });
}

function compChipHTML(id, extra) {
  const c = findComp(id);
  if (!c) return "";
  return '<span class="comp-tag comp-' + c.id + ' tip" tabindex="0" data-tip="' + escapeHTML(c.desc + " · 강함: " + c.beats.map(function (b) { return findComp(b).name; }).join("·") +
    " · 약함: " + countersOf(c.id).map(function (b) { return findComp(b).name; }).join("·") + " · 시너지(3명+): " + c.synergy) + '">' + c.icon + " " + c.name + (extra || "") + "</span>";
}

function champCompsHTML(name) {
  return champComps(name).map(function (id) { return compChipHTML(id); }).join("");
}

// 성향 개수 세기 → { counts: { dive: 3, ... }, main, n }
function countComps(picks, prefer) {
  const counts = {};
  picks.forEach(function (name) {
    champComps(name).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
  });
  let main = null;
  Object.keys(counts).forEach(function (id) {
    if (!main || counts[id] > counts[main] || (counts[id] === counts[main] && id === prefer)) main = id;
  });
  return { counts: counts, main: main, n: main ? counts[main] : 0 };
}

// ----- 메타 조합 -----
// 지금 패치의 메타 조합 (예전 세이브는 메타 챔피언에서 계산)
function metaComp() {
  if (!state.meta) return null;
  if (!state.meta.comp) {
    const all = [];
    POSITION_IDS.forEach(function (pos) { state.meta.champs[pos].forEach(function (n) { all.push(n); }); });
    state.meta.comp = countComps(all).main || "dive";
  }
  return state.meta.comp;
}

// 패치 때 메타 챔피언 뽑기: 테마(메타 조합) 성향 챔피언을 우선 (champions.js makePatch에서 부름)
function pickThemedMeta(list, theme, count) {
  const themed = shuffled(list.filter(function (c) { return champComps(c.name).indexOf(theme) !== -1; }));
  const others = shuffled(list.filter(function (c) { return champComps(c.name).indexOf(theme) === -1; }));
  const result = [];
  while (result.length < count && (themed.length || others.length)) {
    // 첫 자리(S급)는 테마 챔피언이 있으면 무조건 테마
    const useTheme = themed.length && (result.length === 0 || !others.length || Math.random() < COMP_RULES.metaThemeChance);
    result.push((useTheme ? themed : others).shift());
  }
  return result;
}

// ----- 조합 전략 (경기마다) -----
// 결과: { plan: "meta"|"counter"|"free", target: 성향 id }
function teamCompPlan(teamId) {
  const meta = metaComp();
  const mine = myTeam();
  let plan = null;
  if (mine && teamId === mine.id && state.compPlan && state.compPlan !== "auto") plan = state.compPlan;
  if (!plan) {
    // 다른 팀 (또는 감독에게 맡김): 오더가 좋은 팀일수록 카운터를 잘 씀
    const s = findTeam(teamId) ? starters(teamId) : null;
    let shot = 60;
    if (s) {
      const vals = POSITION_IDS.map(function (pos) { const st = s[pos] && statsOfId(s[pos]); return st ? st.shotcall : 60; });
      shot = average(vals);
    }
    const counter = Math.max(0.05, Math.min(0.6, COMP_RULES.counterBase + (shot - 60) * COMP_RULES.counterPerShotcall));
    const r = Math.random();
    plan = r < counter ? "counter" : r < counter + COMP_RULES.freeChance ? "free" : "meta";
  }
  let target = meta;
  if (plan === "counter") target = pick(countersOf(meta));
  if (plan === "free") target = pick(COMPS).id;
  return { plan: plan, target: target };
}

// 한 팀 5명 픽 (used: 이번 세트에 이미 나온 챔피언, 함께 갱신)
function pickLineup(list, target, used, userPick) {
  return list.map(function (p) {
    let champ;
    const npc = npcMasteryPlayer(p); // 숙련도가 있는 다른 선수: 밴 → 가치 높은 챔피언 (js/npc_mastery.js)
    if (p.id === USER_ID && userPick) champ = userPick;
    else if (npc && (champ = npcPickChamp(npc, target, used))) { /* 골랐음 */ }
    else {
      const released = Object.keys(state.mastery).filter(function (n) {
        return used.indexOf(n) === -1 && findChampion(n).positions.indexOf(p.pos) !== -1;
      });
      const themed = released.filter(function (n) { return champComps(n).indexOf(target) !== -1; });
      const meta = released.filter(function (n) { return state.meta.champs[p.pos].indexOf(n) !== -1; });
      let pool;
      if (themed.length && Math.random() < COMP_RULES.followPlan) {
        const themedMeta = themed.filter(function (n) { return meta.indexOf(n) !== -1; });
        pool = themedMeta.length && Math.random() < 0.5 ? themedMeta : themed;
      } else pool = meta.length && Math.random() < COMP_RULES.otherMetaPick ? meta : released;
      champ = pool.length ? pick(pool) : "?";
    }
    used.push(champ);
    return champ;
  });
}

// 한 세트 조합 효과 계산 (playSet에서 부름)
// 결과 { a: {...}, b: {...} } 각 팀: picks, counts, main, n, plan, target, syn(시너지 단계 0/3/4), match(+2/−2/0), soloEasy, laneExtra, bonus(팀 점수 합)
function setComps(la, lb, setCtx, userPick) {
  const plans = setCtx.plans || {};
  const used = (setCtx.used || []).slice(); // 앞 세트에서 나온 챔피언은 제외 (피어리스)
  if (userPick) used.push(userPick);
  const make = function (list, plan) {
    const p = plan || { plan: "meta", target: metaComp() };
    const picks = pickLineup(list, p.target, used, userPick);
    const c = countComps(picks, p.target);
    return { picks: picks, counts: c.counts, main: c.main, n: c.n, plan: p.plan, target: p.target };
  };
  const A = make(la, plans.a), B = make(lb, plans.b);
  [[A, B, setCtx.teamA], [B, A, setCtx.teamB]].forEach(function (x) {
    const me = x[0], them = x[1];
    me.match = compBeats(me.main, them.main) ? COMP_RULES.matchup : compBeats(them.main, me.main) ? -COMP_RULES.matchup : 0;
    me.syn = me.n >= COMP_RULES.synergyFrom ? Math.min(me.n, 4) : 0;
    const big = me.syn >= 4;
    me.bonus = me.match + (me.syn ? COMP_RULES.synergyBonus[me.syn] : 0);
    me.soloEasy = 0; me.laneExtra = 0;
    if (me.syn) {
      if (me.main === "poke") me.bonus += big ? 3 : 1.5;
      if (me.main === "peel" && setCtx.behind && setCtx.behind === x[2]) me.bonus += big ? 3 : 2;
      if (me.main === "brawl" && setCtx.deciding) me.bonus += big ? 3 : 2;
      if (me.main === "dive") me.soloEasy = big ? 5 : 3;
      if (me.main === "burst") me.laneExtra = big ? 1 : 0.5;
    }
  });
  return { a: A, b: B };
}

// 화면용: 한 팀 조합 요약 한 줄
function compSummaryHTML(c, teamId) {
  if (!c) return "";
  const plan = { meta: "메타 따라가기", counter: "메타 카운터", free: "자유 조합" }[c.plan] || "";
  const parts = [];
  if (c.match > 0) parts.push('<span class="up">상성 우위 +' + c.match + "</span>");
  if (c.match < 0) parts.push('<span class="down">상성 열세 ' + c.match + "</span>");
  if (c.syn) parts.push('<span class="up">시너지 ' + c.n + "명</span>");
  return teamLabel(teamId) + " " + (c.main ? compChipHTML(c.main, " " + c.n) : "") +
    ' <span class="muted small">' + plan + "</span> " + parts.join(" · ") +
    (c.bonus ? ' <span class="muted small">(팀 점수 ' + (c.bonus > 0 ? "+" : "") + c.bonus.toFixed(1) + ")</span>" : "");
}

// [대시보드] 조합 전략 카드
function compPlanHTML() {
  const meta = findComp(metaComp());
  const plan = state.compPlan || "auto";
  const counters = countersOf(meta.id).map(function (id) { return compChipHTML(id); }).join(" ");
  const buttons = COMP_PLANS.map(function (p) {
    return '<button data-compplan="' + p.id + '"' + (plan === p.id ? ' class="primary"' : "") + ' title="' + escapeHTML(p.desc) + '">' + p.name + "</button>";
  }).join("");
  const mine = myPositionChampions().filter(function (n) { return champComps(n).indexOf(meta.id) !== -1; })
    .sort(function (a, b) { return state.mastery[b] - state.mastery[a]; }).slice(0, 3);
  return (
    '<h2 class="sub">조합 전략</h2>' +
    '<p class="small">이번 패치 메타 조합 ' + compChipHTML(meta.id) + " · 메타를 이기는 성향 " + counters + "</p>" +
    '<div class="buttons">' + buttons + "</div>" +
    '<p class="muted small">' + escapeHTML(COMP_PLANS.find(function (p) { return p.id === plan; }).desc) +
      " 같은 성향 3명 이상이면 시너지, 주력 성향 상성에서 이기면 팀 점수 +" + COMP_RULES.matchup + ". " +
      (mine.length ? "내 " + meta.name + " 챔피언: " + mine.map(function (n) { return n + "(" + state.mastery[n] + ")"; }).join(", ") : "") + "</p>"
  );
}

function bindCompPlan(page) {
  page.querySelectorAll("[data-compplan]").forEach(function (btn) {
    btn.onclick = function () {
      state.compPlan = btn.getAttribute("data-compplan");
      renderPage();
    };
  });
}
