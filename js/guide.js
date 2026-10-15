// ===== 초보자 도움: 튜토리얼 · 지금 목표 · 이번 주 추천 · 게임 방법 (글은 data/guide.js) =====
// state.tutorial = { on: true/false, done: { plan: true, ... }, visited: { schedule: true, ... }, restDone }

function tutorialState() {
  if (!state.tutorial) state.tutorial = { on: false, done: {}, visited: {} };
  const t = state.tutorial;
  t.done = t.done || {}; t.visited = t.visited || {};
  return t;
}

// 단계 완료 확인 (지금 상태를 보고 자동으로)
function tutorialChecks(check) {
  const t = tutorialState();
  switch (check) {
    case "plan": return !!state.plan && state.plan !== t.startPlan; // 처음 골라져 있는 솔로 랭크에서 다른 훈련으로 바꿔 봐야 완료 (v1.1)
    case "advance": return !!state.weekReport;
    case "sns": return state.inbox.some(function (m) { return m.tab === "inbox" && m.choices && m.answered !== null && m.answered !== "ignored"; });
    case "schedule": return !!t.visited.schedule;
    case "rest": return !!t.restDone;
    case "shop": return !!t.visited.shop;
    default: return false;
  }
}

// 매번 화면을 그릴 때: 끝난 단계 표시, 다 끝나면 자동으로 끔
function updateTutorial() {
  const t = tutorialState();
  if (!t.on) return;
  TUTORIAL_STEPS.forEach(function (s) { if (!t.done[s.check] && tutorialChecks(s.check)) t.done[s.check] = true; });
  if (TUTORIAL_STEPS.every(function (s) { return t.done[s.check]; })) {
    t.on = false;
    t.finished = true;
    state.notice = "🎉 처음 안내를 모두 마쳤어요! 이제 대시보드 오른쪽 🎯 목표와 '이번 주' 카드의 💡 추천을 따라가 보세요. (게임 규칙은 왼쪽 아래 ❓ 게임 방법)";
  }
}

// 메뉴를 열 때 (main.js selectMenu에서)
function tutorialVisit(id) {
  if (state && state.tutorial) state.tutorial.visited[id] = true;
}

// 📘 처음이라면: 평소엔 지금 단계 한 줄만, [전체 보기 ▾]를 누르면 6단계 모두 (2026-10-07 대시보드 정리)
let tutorialExpanded = false;
function tutorialCardHTML() {
  const t = tutorialState();
  if (!t.on) return "";
  let current = -1;
  const rows = TUTORIAL_STEPS.map(function (s, i) {
    const ok = !!t.done[s.check];
    if (!ok && current === -1) current = i;
    const now = !ok && current === i;
    // 아직 안 한 단계는 모두 설명과 [열기] 버튼 (지금 단계는 진하게)
    const go = s.go ? ' <button class="small-btn" data-tutgo="' + s.go + '">' + s.goLabel + " ▶</button>" : "";
    return '<li class="' + (ok ? "done" : now ? "now" : "") + '">' + (ok ? "✅" : now ? "▶" : "⬜") + " " + s.title +
      (!ok ? '<div class="tut-hint' + (now ? "" : " later") + '">' + s.hint + go + "</div>" : "") + "</li>";
  }).join("");
  const doneCount = TUTORIAL_STEPS.filter(function (s) { return t.done[s.check]; }).length;
  const step = TUTORIAL_STEPS[current];
  const head = '<div class="tut-line"><b>📘 처음이라면</b> <span class="muted small">' + doneCount + " / " + TUTORIAL_STEPS.length + "</span>" +
    (step && !tutorialExpanded
      ? ' <span class="tut-now tip" tabindex="0" data-tip="' + escapeHTML(step.hint) + '">▶ ' + step.title + "</span>" +
        (step.go ? ' <button class="small-btn" data-tutgo="' + step.go + '">' + step.goLabel + " ▶</button>" : "")
      : "") +
    '<span class="tut-btns"><button class="small-btn" data-tutexpand="1">' + (tutorialExpanded ? "접기 ▴" : "전체 보기 ▾") + "</button>" +
    '<button class="small-btn" data-tutorial="off">안내 끄기</button></span></div>';
  return '<div class="card tutorial compact">' + head + (tutorialExpanded ? '<ol class="tut-steps">' + rows + "</ol>" : "") + "</div>";
}

// ----- 🎯 지금 목표 -----
function currentGoal() {
  const team = myTeam();
  if (!team) return null;
  const fill = function (g, extra) {
    let text = g.text;
    Object.keys(extra).forEach(function (k) { text = text.replace(new RegExp("\\{" + k + "\\}", "g"), extra[k]); });
    return { title: g.title, text: text };
  };
  const rankList = team.tier === 1 ? tier1FinalOrder() : standings(["tier2", "tier2b"], tier2Ids()).map(function (x) { return x.id; });
  // 리그 경기를 아직 안 했으면 순위 대신 "아직 리그 경기 전"
  const leagueComps = team.tier === 1 ? ["split1", "split2"] : ["tier2", "tier2b"];
  const played = userMatches().some(function (m) { return m.winner && leagueComps.indexOf(m.comp) !== -1; });
  const rank = played ? (rankList.indexOf(team.id) + 1) + "위" : "아직 리그 경기 전";
  const score = playerScore(USER_ID).toFixed(1);
  let step;
  if (state.benched) {
    const rival = benchRival();
    return Object.assign(fill(GOAL_TEXT.bench, { score: score, rival: rival ? playerName(rival) + " " + playerScore(rival).toFixed(1) : "-" }), { step: 0 });
  }
  if (team.tier === 2) return Object.assign(fill(GOAL_TEXT.tier2, { rank: rank }), { step: 1 });
  const sum = careerSummary(true);
  if (!sum.titles.playoffs) step = 2;
  else if (!sum.titles.worlds) step = 3;
  else step = 4;
  const key = ["bench", "tier2", "league", "worlds", "legend"][step];
  return Object.assign(fill(GOAL_TEXT[key], { rank: rank, points: sum.points, grade: sum.grade }), { step: step });
}

// ----- 💡 이번 주 추천: [{ text, label, act }] 중요한 것부터 최대 3개 -----
let adviceActions = [];
function weekAdvice(noQuest) {
  const list = [];
  const wk = userWeekMatches(state.week);
  const hasMatch = wk.matches.length + wk.preview.length > 0 && !state.benched;
  // 1) 훈련을 안 골랐음
  if (!state.plan) list.push({ text: "이번 주 훈련을 아직 안 골랐어요.", label: "훈련 고르기", act: { go: "training" } });
  // 2) 체력
  if (state.stamina < TIRED_LIMIT) {
    list.push({ text: "체력 " + state.stamina + " → 20 아래라서 훈련 효과가 절반이에요" + (hasMatch ? " (이번 주 경기도 있어요)" : "") + ".", label: "휴식 주로 진행", act: { rest: true } });
  } else if (hasMatch && state.stamina < TEAM_MATCH.lowStaminaLimit) {
    list.push({ text: "이번 주 경기가 있는데 체력 " + state.stamina + ". " + TEAM_MATCH.lowStaminaLimit + " 미만이면 경기력 −" + Math.round(TEAM_MATCH.lowStaminaCut * 100) + "%. 쉬면 경기 전에 회복돼요.", label: "휴식 주로 진행", act: { rest: true } });
  }
  // 2-1) 패치 전 주: 솔로 랭크 초기화 예고 (이번 주만 의미 있으니 앞쪽에)
  if (isPrePatchWeek(state.week)) {
    const r = myLadderRank();
    list.push({ text: "이번 주가 끝나면 솔로 랭크가 초기화돼요. 지금 리그 " + r + "위" + (r <= 3 ? " — 1위면 👑 칭호(경기력 +3%)!" : "."),
      label: state.plan === "solo_rank" ? "솔로 랭크 선택됨" : "솔로 랭크로 선택", act: { plan: "solo_rank" } });
  }
  // 2-2) 월드 우승 스킨 챔피언 고르기 (js/collection.js)
  if (pendingSkins().length) list.push({ text: "🎨 월드 우승 스킨으로 만들 챔피언을 골라 주세요.", label: "컬렉션 열기", act: { go: "collection" } });
  // 3) 답하지 않은 연락
  const waiting = state.inbox.filter(function (m) { return m.tab === "inbox" && m.choices && m.answered === null; }).length;
  if (waiting) list.push({ text: "답하지 않은 연락이 " + waiting + "개 있어요. 4주가 지나면 그냥 지나가요.", label: "SNS 열기", act: { sns: true } });
  // 4) 지금 훈련이 채우지 않는 퀘스트
  const q = (state.quests || []).find(function (x) { return questPlan(x) && !questPlanActive(x); });
  if (q && !noQuest) list.push({ text: "퀘스트 '" + findQuest(q.id).title + "' (" + Math.max(0, q.deadline - absWeek()) + "주 남음)", label: questPlanLabel(q) + "(으)로 선택", act: { quest: q.uid } });
  // 5) 메타 챔피언 숙련도가 낮음
  const meta = state.meta.champs[state.player.position];
  const avg = meta.reduce(function (a, n) { return a + (state.mastery[n] || 0); }, 0) / meta.length;
  if (avg < MATCH.metaPenaltyBase && state.plan !== "champion" && state.plan !== "champ_focus") {
    list.push({ text: "이번 패치 메타 챔피언 숙련도 평균 " + Math.round(avg) + " → 경기력이 깎여요 (" + MATCH.metaPenaltyBase + " 이상이면 괜찮아요).", label: "챔피언 연습으로 선택", act: { plan: "champion" } });
  }
  // 6) 컨디션
  if (state.condition < 40) list.push({ text: "컨디션 " + state.condition + " → 낮으면 경기력이 떨어져요. 쉬거나 이기면 올라요.", label: "휴식 주로 진행", act: { rest: true } });
  // 7) 돈이 쌓였는데 장비가 없음
  const s = state.shop || {};
  const gearCount = Object.keys(s.gear || {}).filter(function (k) { return s.gear[k] > 0; }).length;
  if (state.money >= 10000000 && gearCount === 0) list.push({ text: "자금이 " + moneyText(state.money) + " 쌓였어요. 장비를 사면 훈련 효과가 영구로 올라요.", label: "상점 가기", act: { go: "shop" } });
  // 8) 이적 시장 기간 + 제안
  if (isAnyTransferWindow() && state.inbox.some(function (m) { return m.kind === "offer" && m.answered === null; })) {
    list.push({ text: "이적 시장 기간이에요. 계약 제안을 확인해 보세요.", label: "SNS 열기", act: { sns: true } });
  }
  return list.slice(0, 3);
}

// 🎯 지금 목표 한 줄 (오른쪽 프로필 카드 안, js/dashboard.js) — 긴 설명은 마우스를 올리면
function goalLineHTML() {
  const goal = currentGoal();
  if (!goal) return "";
  const ladder = GOAL_LADDER.map(function (name, i) {
    return '<span class="goal-step' + (i < goal.step ? " passed" : i === goal.step ? " now" : "") + '">' + (i < goal.step ? "✓" : "") + name + "</span>";
  }).join('<span class="muted">→</span>');
  return '<div class="goal-line"><span class="tip tip-down" tabindex="0" data-tip="' + escapeHTML(goal.text) + '">🎯 <b>' + goal.title + '</b> <span class="tip-mark">ⓘ</span></span>' +
    '<div class="goal-ladder small">' + ladder + "</div></div>";
}

// 💡 이번 주 추천 줄들 ('이번 주' 카드 맨 위, js/dashboard.js). 훈련 미선택도 여기서 알려 줌 (훈련 줄은 없앰)
function adviceRowsHTML(noQuest) {
  const advice = weekAdvice(noQuest);
  adviceActions = advice.map(function (a) { return a.act; });
  return advice.map(function (a, i) {
    return '<div class="rep-row advice"><span class="rep-tag tip-tag">💡</span><span>' + escapeHTML(a.text) + '</span><button class="small-btn" data-advice="' + i + '">' + escapeHTML(a.label) + "</button></div>";
  }).join("");
}

function bindGuide(page) {
  page.querySelectorAll("[data-advice]").forEach(function (b) {
    b.onclick = function () {
      const a = adviceActions[Number(b.getAttribute("data-advice"))];
      if (!a) return;
      if (a.go) selectMenu(a.go);
      else if (a.rest) advanceWeek(true);
      else if (a.sns) { snsTab = "inbox"; selectMenu("sns"); }
      else if (a.plan) { state.plan = a.plan; if (a.plan === "champion") state.practiceChamp = ""; state.notice = "이번 주 훈련을 <b>" + findTraining(a.plan).name + "</b>(으)로 골랐어요."; renderPage(); }
      else if (a.quest) {
        const q = (state.quests || []).find(function (x) { return x.uid === a.quest; });
        const qp = q && questPlan(q);
        if (!qp) return;
        state.plan = qp.plan;
        if (qp.focusChamp !== undefined) state.focusChamp = qp.focusChamp;
        if (qp.practiceChamp !== undefined) state.practiceChamp = qp.practiceChamp;
        state.notice = "이번 주 훈련을 <b>" + escapeHTML(questPlanLabel(q)) + "</b>(으)로 골랐어요.";
        renderPage();
      }
    };
  });
  page.querySelectorAll("[data-tutexpand]").forEach(function (btn) {
    btn.onclick = function () { tutorialExpanded = !tutorialExpanded; renderPage(); };
  });
  page.querySelectorAll("[data-tutgo]").forEach(function (btn) {
    btn.onclick = function () { selectMenu(btn.getAttribute("data-tutgo")); };
  });
  const off = page.querySelector("[data-tutorial]");
  if (off) off.onclick = function () {
    tutorialState().on = off.getAttribute("data-tutorial") === "on";
    if (tutorialState().on) { tutorialState().done = {}; }
    renderPage();
  };
}

// ----- ❓ 게임 방법 -----
// ----- 챔피언 숙련도 설명 (data/guide.js MASTERY_TIP, MASTERY_GUIDE) -----
// {이름} 글자를 실제 규칙 값으로
function masteryText(text) {
  const c = MATCH.masteryCurve, F = MATCH.focusBan;
  const slope = function (i) { return +((c[i][1] - c[i - 1][1]) / (c[i][0] - c[i - 1][0]) * 100).toFixed(2); };
  const v = {
    curveFast: c[1][0], curveSlow: c[2][0], slope1: slope(1), slope2: slope(2), slope3: slope(3),
    metaS: Math.round(MATCH.metaPowerBonus.S * 100), metaA: Math.round(MATCH.metaPowerBonus.A * 100),
    pickS: MATCH.metaPickBonus.S, pickA: MATCH.metaPickBonus.A, jokerBan: MATCH.jokerBanDiscount,
    penBase: MATCH.metaPenaltyBase, penDiv: MATCH.metaPenaltyDiv, adaptWeeks: MATCH.adaptWeeks,
    focusFrom: F.from, focusBase: Math.round(F.base * 100), focusPer: +(F.per * 100).toFixed(1), focusMax: Math.round(focusBanChance(MASTERY.max) * 100),
    jokerFrom: MATCH.jokerFrom, jokerFull: MATCH.jokerFull, jokerPower: Math.round(MATCH.jokerPowerBonus * 100), jokerPick: MATCH.jokerPickBonus, jokerShow: MATCH.jokerMinMastery,
  };
  return text.replace(/\{(\w+)\}/g, function (all, k) { return v[k] !== undefined ? v[k] : all; });
}

function masteryTipText() {
  return masteryText(MASTERY_TIP);
}

// 게임 방법: 숙련도 자세히 (배율 표·성장 속도 표는 실제 계산으로)
function masteryGuideHTML() {
  const points = [1, 30, 50, 60, 70, 80, 90, 100];
  const multRow = points.map(function (m) { return "<td>" + masteryMult(m).toFixed(2) + "배</td>"; }).join("");
  const growRow = points.map(function (m) { return "<td>" + Math.round(Math.max(0.3, 1 - m / 125) * 100) + "%</td>"; }).join("");
  const banRow = points.map(function (m) { const c = focusBanChance(m); return "<td>" + (c ? "+" + Math.round(c * 100) + "%" : "-") + "</td>"; }).join("");
  const sections = MASTERY_GUIDE.map(function (s) {
    return '<h2 class="sub">' + s.title + '</h2><ul class="howto">' + s.lines.map(function (l) { return "<li>" + escapeHTML(masteryText(l)) + "</li>"; }).join("") + "</ul>";
  }).join("");
  return '<div class="card"><h2>⚔️ 챔피언 숙련도 자세히</h2>' + sections +
    '<h2 class="sub">숫자로 보기</h2>' +
    '<table class="calc mastery-table"><tr><th>숙련도</th>' + points.map(function (m) { return "<th>" + m + "</th>"; }).join("") + "</tr>" +
      "<tr><td>경기력 배율</td>" + multRow + "</tr>" +
      "<tr><td>성장 속도</td>" + growRow + "</tr>" +
      "<tr><td>견제 밴 (메타 1위일 때)</td>" + banRow + "</tr>" +
    "</table>" +
    '<p class="muted small">성장 속도 = 연습했을 때 원래 오르는 양의 몇 %가 오르는지. 견제 밴 = 보통 밴에 더해 먼저 밴 당할 확률.</p>' +
  "</div>";
}

pages.howto = function () {
  const cards = HOW_TO_PLAY.map(function (h) {
    return '<div class="card"><h2>' + h.icon + " " + h.title + '</h2><ul class="howto">' + h.lines.map(function (l) { return "<li>" + escapeHTML(l) + "</li>"; }).join("") + "</ul></div>";
  }).join("");
  const t = tutorialState();
  return "<h1>게임 방법</h1>" +
    '<div class="card"><h2>현재 경기 환경</h2><p>' + escapeHTML(eraMatchRule().label) + '</p><p class="muted small">' + escapeHTML(ERA_MATCH_HELP) + '</p></div>' +
    '<div class="card"><p>처음이라면 대시보드의 📘 처음이라면 안내를 따라가 보세요. ' +
      (t.on ? '<span class="up small">(지금 켜져 있어요)</span>' : '<button class="small-btn" data-tutorial="on">처음 안내 다시 켜기</button>') + "</p></div>" +
    '<div class="grid">' + cards + "</div>" +
    '<div class="card"><h2>⌨️ 단축키 <span class="muted small">PC 키보드 · [설정]에서 끌 수 있어요 · 게임 중 / 를 누르면 이 목록</span></h2>' + shortcutTableHTML() + "</div>" + // 198 (js/shortcuts.js)
    masteryGuideHTML();
};
