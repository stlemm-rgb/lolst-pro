// ===== 초보자 도움: 코치 안내 · 그때그때 팁 · 지금 목표 · 이번 주 추천 · 게임 방법 (글은 data/guide.js) =====
// state.tutorial = { on: 코치 안내 중, step: 지금 단계(COACH_TOUR 번호), startPlan, tips: { id: true(본 팁) }, tipsOn }
// 화면만 바꿈: 게임 결과와 무관 (Math.random 안 씀)

function tutorialState() {
  if (!state.tutorial) state.tutorial = { on: false, done: {}, visited: {} };
  const t = state.tutorial;
  if (t.step === undefined) { // 예전 세이브(체크리스트 시절, 214 이전): 코치 안내는 끝난 것으로, 팁은 안내를 켜 두었던 사람만
    t.step = COACH_TOUR.length;
    t.tipsOn = !!t.on;
    t.on = false;
    delete t.done; delete t.visited; delete t.restDone; delete t.finished;
  }
  t.tips = t.tips || {};
  return t;
}

// 코치 안내·팁을 처음부터 다시 ([설정·저장], ❓ 게임 방법)
function restartCoach() {
  const t = tutorialState();
  t.on = true; t.step = 0; t.tips = {}; t.tipsOn = true;
  delete t.planTouched; delete t.lastWeek; delete t.lastSawDash;
  t.startPlan = state.plan;
  t.startAbs = absWeek();
  coachScrolledStep = -1;
}

// ----- 코치 안내: 단계가 끝났나 (data/guide.js COACH_TOUR wait) — 지시대로 하면 저절로 넘어감 (216) -----
function coachStepDone(wait) {
  const t = tutorialState();
  switch (wait) {
    case "trainingOpen": return state.currentMenu === "training";
    case "planPicked": return !!t.planTouched || (!!state.plan && state.plan !== t.startPlan); // 훈련 버튼을 한 번이라도 누름 (지금 훈련 다시 눌러도)
    case "advanced": return t.startAbs !== undefined ? absWeek() !== t.startAbs : !!state.weekReport; // 처음부터 다시 볼 때는 그때부터 한 주
    case "moved": // 마지막 단계: 대시보드를 본 뒤 다른 화면으로 가거나 한 주를 더 넘기면 끝
      return t.lastWeek !== undefined && (state.week !== t.lastWeek || (t.lastSawDash && state.currentMenu !== "dashboard"));
    default: return false;
  }
}

// 매번 화면을 그릴 때 (main.js renderPage): 끝난 단계는 넘기고, 진행했으면 마지막 단계로
function updateTutorial() {
  const t = tutorialState();
  if (!t.on) return;
  const last = COACH_TOUR.length - 1;
  if (t.step < last && coachStepDone("advanced")) t.step = last; // 안내 중간에 이미 한 주를 넘겼으면 마무리 단계로
  while (t.step < COACH_TOUR.length && COACH_TOUR[t.step].wait && coachStepDone(COACH_TOUR[t.step].wait)) t.step++;
  if (t.step >= COACH_TOUR.length) { endCoachTour(); return; }
  if (t.step === last) { // 마지막 단계 들어온 주·대시보드를 봤는지
    if (t.lastWeek === undefined) t.lastWeek = state.week;
    if (state.currentMenu === "dashboard") t.lastSawDash = true;
  }
}
function endCoachTour() {
  const t = tutorialState();
  t.on = false; t.step = COACH_TOUR.length; t.tipsOn = true;
  delete t.planTouched; delete t.lastWeek; delete t.lastSawDash; delete t.startAbs;
}
// 훈련 버튼을 누른 것 (지금 훈련을 다시 눌러도 '골랐다'로): 화면이 다시 그려지기 전에 잡으려고 capture
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("click", function (e) {
    if (!state || !state.tutorial || !state.tutorial.on || !e.target.closest) return;
    if (e.target.closest("[data-plan]")) state.tutorial.planTouched = true;
  }, true);
}

// ----- 그때그때 팁 (data/guide.js COACH_TIPS when) -----
function coachTipWhen(when) {
  switch (when) {
    case "benched": return !!state.benched;
    case "tired": return state.stamina < TIRED_LIMIT;
    case "matchWeek": { const wk = userWeekMatches(state.week); return !state.benched && wk.matches.length + wk.preview.length > 0; }
    case "inbox": return state.inbox.some(function (m) { return m.tab === "inbox" && m.choices && m.answered === null; });
    case "quest": return (state.quests || []).length > 0;
    case "patch": return !!state.weekReport && MASTERY.patchWeeks.indexOf(state.week) !== -1;
    case "transfer": return isAnyTransferWindow();
    case "rich": return state.money >= 10000000;
    default: return false;
  }
}
function coachTipNow() {
  const t = tutorialState();
  if (t.on || !t.tipsOn) return null;
  return COACH_TIPS.find(function (tip) { return !t.tips[tip.id] && coachTipWhen(tip.when); }) || null;
}

// ----- 코치 말풍선 (#coach-tip): 화면 오른쪽 아래(휴대폰은 아래 탭 위)에 붙고, 가리키는 곳은 빛나는 테두리 -----
function coachFaceHTML() {
  const team = myTeam();
  return portraitHTMLFrom(randomLook("coach:" + (team ? team.id : "fa")), team ? uniformOfTeam(team.id) : FREE_AGENT_UNIFORM, { scale: 1.5 });
}
function coachText(text) {
  const team = myTeam();
  return escapeHTML(text).replace("{name}", escapeHTML(state.player.name)).replace("{team}", team ? escapeHTML(team.name) : "구단");
}
function visibleTarget(list) {
  for (let i = 0; i < (list || []).length; i++) {
    const el = document.querySelector("#layout " + list[i]) || document.querySelector(list[i]);
    if (el && el.getClientRects && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden") return el; // (노드 검사용 가짜 화면엔 없음)
  }
  return null;
}

let coachScrolledStep = -1;
let coachTarget = null; // 지금 가리키는 화면 요소 (말풍선·강조 테두리가 따라감)
function renderCoach() {
  let box = document.getElementById("coach-tip");
  let ring = document.getElementById("coach-ring");
  document.querySelectorAll(".coach-hl").forEach(function (el) { el.classList.remove("coach-hl"); });
  coachTarget = null;
  const layout = document.getElementById("layout");
  const t = state.player && !state.retired && layout && !layout.hidden ? tutorialState() : null;
  const tour = t && t.on ? COACH_TOUR[t.step] : null;
  const tip = t && !tour ? coachTipNow() : null;
  if (!tour && !tip) { if (box) box.hidden = true; if (ring) ring.hidden = true; return; }
  if (!box) {
    box = document.createElement("div");
    box.id = "coach-tip";
    box.setAttribute("role", "status");
    document.body.appendChild(box);
    box.addEventListener("click", onCoachClick);
    ring = document.createElement("div");
    ring.id = "coach-ring";
    document.body.appendChild(ring);
    window.addEventListener("scroll", placeCoach, { passive: true });
    window.addEventListener("resize", placeCoach);
  }
  let buttons = "", head = "";
  if (tour) {
    const wrongPage = tour.menu && state.currentMenu !== tour.menu;
    head = '<span class="coach-step">' + (t.step + 1) + " / " + COACH_TOUR.length + "</span>";
    buttons = (wrongPage ? '<button data-coach="menu">대시보드 열기</button>' : "") +
      (tour.btn ? '<button class="primary" data-coach="next">' + tour.btn + "</button>" : "") +
      (t.step === COACH_TOUR.length - 1 ? "" : '<button class="coach-skip" data-coach="skip">안내 건너뛰기</button>');
    coachTarget = visibleTarget(tour.targetM && window.innerWidth <= 760 ? tour.targetM : tour.target);
    if (coachTarget) {
      coachTarget.classList.add("coach-hl");
      if (coachScrolledStep !== t.step) { // 단계가 바뀐 처음 한 번만: 가리키는 곳이 화면 밖이면 보이게
        coachScrolledStep = t.step;
        const r = coachTarget.getBoundingClientRect();
        if (r.top < 60 || r.bottom > window.innerHeight - 160) coachTarget.scrollIntoView({ block: "center", behavior: "auto" });
      }
    }
  } else {
    buttons = (tip.go ? '<button data-coach="go" data-go="' + tip.go + '">' + tip.goLabel + "</button>" : "") +
      '<button class="primary" data-coach="ok" data-tip="' + tip.id + '">알겠어요</button>' +
      '<button class="coach-skip" data-coach="tipsoff">팁 그만 보기</button>';
  }
  const team = myTeam();
  box.className = tour ? "tour" : "tip";
  box.innerHTML = '<i class="coach-arrow"></i><div class="coach-face">' + coachFaceHTML() + "</div>" +
    '<div class="coach-body"><div class="coach-who">' + (team ? escapeHTML(team.name) + " " : "") + "코치" + head + "</div>" +
    '<p class="coach-text">' + coachText((tour || tip).text) + "</p>" +
    '<div class="coach-btns">' + buttons + "</div></div>";
  box.hidden = false;
  placeCoach();
}

// 말풍선을 가리키는 곳 바로 옆에 (아래 → 위 → 화면 아래쪽 순), 화살표는 가리키는 곳 가운데로.
// 가리키는 곳 둘레는 두꺼운 테두리 + 나머지 화면은 어둡게 (#coach-ring, 누르는 건 그대로 됨)
function placeCoach() {
  const box = document.getElementById("coach-tip"), ring = document.getElementById("coach-ring");
  if (!box || box.hidden) return;
  const arrow = box.querySelector(".coach-arrow");
  const target = coachTarget && document.body.contains && document.body.contains(coachTarget) ? coachTarget : null;
  const r = target ? target.getBoundingClientRect() : null;
  if (!r || (!r.width && !r.height)) {
    box.classList.remove("anchored"); box.style.left = box.style.top = "";
    if (ring) ring.hidden = true;
    return;
  }
  const pad = 6, gap = 16, vw = window.innerWidth, vh = window.innerHeight;
  const bottomSafe = vw <= 760 ? 8 : 12;
  ring.hidden = false;
  ring.style.left = (r.left - pad) + "px"; ring.style.top = (r.top - pad) + "px";
  ring.style.width = (r.width + pad * 2) + "px"; ring.style.height = (r.height + pad * 2) + "px";
  box.classList.add("anchored");
  const w = box.offsetWidth, h = box.offsetHeight;
  let top, side;
  if (r.bottom + pad + gap + h <= vh - bottomSafe) { top = r.bottom + pad + gap; side = "up"; } // 아래에 (화살표는 위를 봄)
  else if (r.top - pad - gap - h >= 8) { top = r.top - pad - gap - h; side = "down"; } // 위에
  else { top = Math.max(8, vh - h - bottomSafe); side = ""; } // 둘 다 안 되면 화면 아래쪽 (큰 카드)
  const cx = r.left + r.width / 2;
  const left = Math.max(10, Math.min(vw - w - 10, cx - w / 2));
  box.style.left = left + "px"; box.style.top = top + "px";
  arrow.className = "coach-arrow" + (side ? " " + side : "");
  arrow.style.left = Math.max(18, Math.min(w - 18, cx - left)) + "px";
}

function onCoachClick(e) {
  const btn = e.target.closest("[data-coach]");
  if (!btn) return;
  const t = tutorialState();
  const act = btn.getAttribute("data-coach");
  if (act === "next") {
    t.step++;
    if (t.step >= COACH_TOUR.length) endCoachTour();
  } else if (act === "skip") endCoachTour();
  else if (act === "ok") t.tips[btn.getAttribute("data-tip")] = true;
  else if (act === "tipsoff") t.tipsOn = false;
  else if (act === "go") {
    const tip = coachTipNow();
    if (tip) t.tips[tip.id] = true;
    if (btn.getAttribute("data-go") === "phone") { renderCoach(); openPhone(); } else selectMenu(btn.getAttribute("data-go"));
    return;
  } else if (act === "menu") { selectMenu("dashboard"); return; }
  updateTutorial();
  renderCoach();
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
  if (waiting) list.push({ text: "답하지 않은 연락이 " + waiting + "개 있어요. 4주가 지나면 그냥 지나가요.", label: "📱 휴대폰 열기", act: { phone: true } });
  // 4) 지금 훈련이 채우지 않는 퀘스트
  const q = (state.quests || []).find(function (x) { return questPlan(x) && !questPlanActive(x); });
  if (q && !noQuest) list.push({ text: "퀘스트 '" + findQuest(q.id).title + "' (" + Math.max(0, q.deadline - absWeek()) + "주 남음)", label: questPlanLabel(q) + "(으)로 선택", act: { quest: q.uid } });
  // 5) 메타 챔피언 숙련도가 낮음
  const meta = state.meta.champs[state.player.position];
  const avg = meta.reduce(function (a, n) { return a + (state.mastery[n] || 0); }, 0) / meta.length;
  if (!noQuest && avg < MATCH.metaPenaltyBase && state.plan !== "champion" && state.plan !== "champ_focus") {
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
    list.push({ text: "이적 시장 기간이에요. 계약 제안을 확인해 보세요.", label: "📱 휴대폰 열기", act: { phone: true } });
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
  page.querySelectorAll("[data-meta-practice]").forEach(function (b) { // 대시보드 챔피언 카드 (203)
    b.onclick = function () { state.plan = "champion"; state.practiceChamp = ""; state.notice = ""; /* 226: 훈련 고른 알림 없음 (위 훈련 배지가 바로 바뀜) */ renderPage(); };
  });
  page.querySelectorAll("[data-advice]").forEach(function (b) {
    b.onclick = function () {
      const a = adviceActions[Number(b.getAttribute("data-advice"))];
      if (!a) return;
      if (a.go) selectMenu(a.go);
      else if (a.rest) advanceWeek(true);
      else if (a.phone) openPhone(); // 221: SNS 메뉴로 가지 않고 휴대폰 창
      else if (a.plan) { state.plan = a.plan; if (a.plan === "champion") state.practiceChamp = ""; state.notice = ""; /* 226: 훈련 고른 알림 없음 (위 훈련 배지가 바로 바뀜) */ renderPage(); }
      else if (a.quest) {
        const q = (state.quests || []).find(function (x) { return x.uid === a.quest; });
        const qp = q && questPlan(q);
        if (!qp) return;
        state.plan = qp.plan;
        if (qp.focusChamp !== undefined) state.focusChamp = qp.focusChamp;
        if (qp.practiceChamp !== undefined) state.practiceChamp = qp.practiceChamp;
        state.notice = ""; /* 226: 훈련 고른 알림 없음 (위 훈련 배지가 바로 바뀜) */ renderPage();
      }
    };
  });
  page.querySelectorAll("[data-coach-restart]").forEach(function (btn) {
    btn.onclick = function () { restartCoach(); state.notice = "코치 안내를 처음부터 다시 보여 줄게요."; selectMenu("dashboard"); };
  });
  page.querySelectorAll("[data-coach-tips]").forEach(function (btn) {
    btn.onclick = function () { tutorialState().tipsOn = btn.getAttribute("data-coach-tips") === "on"; renderPage(); };
  });
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
  // 215: 묶음마다 한두 줄(short)만 보이고, 자세한 줄은 [자세히]를 펼쳐야 보임
  const cards = HOW_TO_PLAY.map(function (h) {
    return '<div class="card howto-card"><h2>' + h.icon + " " + h.title + '</h2><p class="howto-short">' + escapeHTML(h.short) + "</p>" +
      '<details class="howto-more"><summary>자세히</summary><ul class="howto">' + h.lines.map(function (l) { return "<li>" + escapeHTML(l) + "</li>"; }).join("") + "</ul></details></div>";
  }).join("");
  return "<h1>게임 방법</h1>" +
    '<div class="card howto-start"><p>처음이라면 코치 안내를 따라가 보세요. 첫 주에 한 단계씩 알려 주고, 그 뒤에는 처음 생기는 일마다 짧게 알려 줘요.</p>' +
      '<button class="small-btn" data-coach-restart="1">코치 안내 처음부터 다시</button></div>' +
    '<div class="grid">' + cards + "</div>" +
    '<div class="card"><h2>현재 경기 환경</h2><p>' + escapeHTML(eraMatchRule().label) + '</p><p class="muted small">' + escapeHTML(ERA_MATCH_HELP) + "</p></div>" +
    '<div class="card"><h2>⌨️ 단축키 <span class="muted small">PC 키보드 · [설정]에서 끌 수 있어요 · 게임 중 / 를 누르면 이 목록</span></h2>' + shortcutTableHTML() + "</div>" + // 198 (js/shortcuts.js)
    masteryGuideHTML();
};
