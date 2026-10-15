// ===== 대시보드·진행 개선 (196, 시안 10 — 「풋볼 에이전시」 참고) =====
// 화면만 바꿈: 게임 결과·밸런스·무작위 순서 그대로 (Math.random 안 씀)
//   ① 이번 주 요약 창: [다음 주로 진행] → (대성공 카드) → 요약 창 → 경기 재생   (js/main.js advanceWeek)
//   ② 다음 목표 3칸: 대시보드 맨 위 (다음 일정 · 내 계약 만료 · 다음 패치)
//   ③ 성장 그래프 2칸: [선수 정보] 머리 (종합 능력 · 인기도, 이번 시즌 매주)  기록 = state.career.trend
//   ④ 업적 칭호: 이름 아래. 자동(등급 높은 것 → 최근) 또는 [업적 도감]에서 고르기  저장 = state.career.titlePick
// 값·문구는 data/ui.js (WEEK_SUMMARY · DASH_GOALS · TITLE_RULES · TREND_RULES)

// ----- ① 이번 주 요약 창 -----
function weekSummaryOn() { return !state.settings || state.settings.weekSummary !== false; }

function showWeekSummary(done) {
  const r = state.weekReport;
  if (!weekSummaryOn() || !r || !r.growthBase || r.summarySeen || state.retired) { if (done) done(); return; }
  r.summarySeen = true;
  let el = document.getElementById("ws-overlay");
  if (!el) { el = document.createElement("div"); el.id = "ws-overlay"; document.body.appendChild(el); }
  el.innerHTML = weekSummaryHTML(r);
  el.hidden = false;
  const close = function () {
    el.hidden = true;
    document.removeEventListener("keydown", onKey);
    if (done) done();
  };
  const onKey = function (e) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); close(); } };
  el.onclick = function (e) { if (e.target === el || (e.target.closest && e.target.closest("[data-ws-close]"))) close(); };
  document.addEventListener("keydown", onKey);
}

function weekSummaryHTML(r) {
  const b = r.growthBase;
  const mine = r.userLines.length > 0;
  const rows = (r.teamLines || []).slice(0, WEEK_SUMMARY.maxMatches).map(function (l) {
    return '<div class="ws-match"><span class="rep-tag ' + (l.won ? "win" : "lose") + '">' + (l.won ? "승" : "패") + "</span><span>" + escapeHTML(l.text) + "</span>" +
      (mine ? "" : '<span class="muted small">후보</span>') + "</div>";
  }).join("") || '<div class="ws-match muted">경기가 없는 주예요 · 🏋️ ' + escapeHTML(r.training.name) + "</div>";
  const now = playerScore(USER_ID);
  const kv = [];
  if (Number.isFinite(b.score)) {
    const d = Math.round((now - b.score) * 10) / 10;
    kv.push(["종합 능력", b.score.toFixed(1) + " → " + now.toFixed(1) + " " + signText(d, 1), d > 0 ? "up" : d < 0 ? "down" : ""]);
  }
  kv.push(["체력 · 컨디션", state.stamina + " · " + state.condition, state.stamina < 30 ? "down" : ""]);
  if (Number.isFinite(b.money)) {
    const dm = state.money - b.money;
    kv.push(["돈", (dm >= 0 ? "+" : "−") + moneyText(Math.abs(dm)).replace(" 원", ""), dm > 0 ? "up" : dm < 0 ? "down" : ""]);
  }
  if (Number.isFinite(b.pop)) {
    const dp = state.popularity - b.pop;
    kv.push(["인기도", state.popularity + " " + signText(dp, 0), dp > 0 ? "up" : dp < 0 ? "down" : ""]);
  }
  const msgs = state.inbox.filter(function (m) { return m.id > r.msgFrom && m.tab === "inbox"; }).length;
  const quest = (r.questLines || [])[0];
  kv.push(["새 연락" + (quest ? " · 퀘스트" : ""), msgs + "개" + (quest ? " · " + quest : ""), ""]);
  const kvHTML = kv.map(function (x) { return "<div>" + x[0] + '</div><div class="' + x[2] + '">' + escapeHTML(x[1]) + "</div>"; }).join("");
  const great = r.great ? '<div class="ws-great">🔥 훈련 대성공 · 오른 스탯 ×2</div>' : "";
  const achv = (r.achv || []).map(function (id) {
    const a = ACHIEVEMENTS.find(function (x) { return x.id === id; });
    return a ? '<div class="ws-achv"><span class="ws-achv-ic">' + a.icon + '</span><div><div class="ws-k">ACHIEVEMENT</div><b>업적 달성 · 「' + escapeHTML(a.name) + "」</b>" +
      '<div class="muted small">' + escapeHTML(a.desc) + (titleAuto() && titleAuto().id === a.id ? " · 새 칭호가 이름 아래 붙었어요" : "") + "</div></div></div>" : "";
  }).join("");
  const btn = replayQueue().length ? WEEK_SUMMARY.replayBtn : WEEK_SUMMARY.okBtn;
  return '<div class="ws-sheet" role="dialog" aria-label="이번 주 요약"><div class="ws-grip"></div>' +
    '<div class="ws-top"><b>' + escapeHTML(r.when.replace(/^\d+년 /, "")) + ' 정리</b><span class="muted small">' + state.year + "년 · " + escapeHTML(seasonPhaseName()) + "</span></div>" +
    rows + great + '<div class="ws-kv">' + kvHTML + "</div>" + achv +
    '<button class="primary ws-btn" data-ws-close="1">' + btn + "</button>" +
    '<div class="muted small ws-hint">' + WEEK_SUMMARY.closeHint + "</div></div>";
}

function signText(d, digits) {
  if (!d) return "±0";
  return (d > 0 ? "▲" : "▼") + Math.abs(d).toFixed(digits);
}

// 지금 주가 속한 일정 이름 (data/schedule.js) — 주를 넘긴 뒤라 지난주(state.week - 1) 기준
function seasonPhaseName() {
  const w = Math.max(1, state.week - 1);
  const s = SCHEDULE.find(function (x) { return w >= x.from && w <= x.to; });
  return s ? s.name : "";
}

function weekSummarySettingHTML() {
  return '<div class="setting-row">' + WEEK_SUMMARY.settingText + ' <select id="ws-setting"><option value="on"' + (weekSummaryOn() ? " selected" : "") + '>켜기</option><option value="off"' + (weekSummaryOn() ? "" : " selected") + ">끄기</option></select></div>";
}
function bindWeekSummarySetting(page) {
  const s = page.querySelector("#ws-setting");
  if (s) s.onchange = function () { state.settings.weekSummary = this.value === "on"; showNotice("이번 주 요약 창: " + (this.value === "on" ? "켜기" : "끄기")); };
}

// ----- ② 다음 목표 3칸 -----
function dashGoalsHTML() {
  if (!state.player || state.retired) return "";
  const goals = [nextScheduleGoal(), contractGoal(), patchGoal()].filter(Boolean);
  if (!goals.length) return "";
  return '<div class="dgoals">' + goals.map(function (g, i) {
    return '<button class="dgoal' + (i === 0 ? " main" : "") + (g.warn ? " warn" : "") + '" data-go="' + g.go + '"><span class="dg-txt"><span class="dg-t">' + escapeHTML(g.label) + '</span><span class="dg-name">' +
      escapeHTML(g.name) + '</span></span><span class="dg-num">' + g.num + "<small>" + g.unit + "</small></span></button>";
  }).join("") + "</div>";
}

function nextScheduleGoal() {
  const w = state.week;
  const ok = function (s) { return DASH_GOALS.scheduleIds.indexOf(s.id) !== -1 && !scheduleOffReason(s.id); };
  let s = SCHEDULE.find(function (x) { return x.from > w && ok(x); });
  let num = s ? s.from - w : 0;
  if (!s) { // 비시즌 끝: 다음 해 첫 일정
    s = SCHEDULE.find(ok);
    num = s ? CREATION.weeksPerSeason - w + s.from : 0;
  }
  if (!s) return null;
  return { label: "다음 일정", name: DASH_GOALS.startWords[s.id] || s.name + " 개막", num: num, unit: "주", go: "schedule" };
}

function contractGoal() {
  const c = state.contract;
  if (!c || !Number.isFinite(c.endYear)) return null;
  const endWeek = c.endWeek || SCHEDULE.find(function (x) { return x.id === "offseason"; }).from;
  const weeks = (c.endYear - state.year) * CREATION.weeksPerSeason + endWeek - state.week;
  if (weeks < 0) return null;
  const team = myTeam();
  if (weeks > CREATION.weeksPerSeason) return { label: "내 계약 만료", name: team ? teamName(team.id) : "", num: c.endYear - state.year, unit: "년", go: "transfer" };
  return { label: "내 계약 만료", name: team ? teamName(team.id) : "", num: weeks, unit: "주", go: "transfer", warn: weeks <= DASH_GOALS.contractWarn };
}

function patchGoal() {
  const w = state.week;
  const pw = MASTERY.patchWeeks.find(function (x) { return x > w; });
  const num = pw ? pw - w : CREATION.weeksPerSeason - w + MASTERY.patchWeeks[0];
  return { label: "다음 패치", name: DASH_GOALS.patchText, num: num, unit: "주", go: "training" };
}

// ----- ③ 성장 그래프 (이번 시즌 매주) -----
function recordTrend() {
  const c = state.career;
  if (!c.trend || c.trend.y !== state.year) c.trend = { y: state.year, pts: [] };
  const pts = c.trend.pts;
  const row = [state.week, Math.round(playerScore(USER_ID) * 10) / 10, state.popularity];
  if (pts.length && pts[pts.length - 1][0] === state.week) pts[pts.length - 1] = row;
  else pts.push(row);
}

function trendCardsHTML() {
  const t = state.career.trend;
  const pts = t && t.y === state.year ? t.pts : [];
  return '<div class="ptrend">' +
    trendCardHTML("종합 능력 · 이번 시즌", pts, 1, 1, "acc") +
    trendCardHTML("인기도 · 이번 시즌", pts, 2, 0, "gold") +
    "</div>";
}

function trendCardHTML(label, pts, col, digits, cls) {
  if (pts.length < TREND_RULES.minPoints) {
    return '<div class="ptr-card"><div class="sum-label">' + label + '</div><div class="muted small ptr-empty">한 주 더 진행하면 그래프가 그려져요</div></div>';
  }
  const vals = pts.map(function (p) { return p[col]; });
  const last = vals[vals.length - 1], first = vals[0];
  const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  const span = hi - lo || 1;
  const W = 200, H = 46, pad = 5;
  const xy = vals.map(function (v, i) {
    return [Math.round(i / (vals.length - 1) * W * 10) / 10, Math.round((H - pad - (v - lo) / span * (H - pad * 2)) * 10) / 10];
  });
  const d = Math.round((last - first) * 10) / 10;
  const dots = xy.map(function (p, i) {
    return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" class="ptr-hit"><title>' + pts[i][0] + "주 · " + vals[i].toFixed(digits) + "</title></circle>";
  }).join("");
  const end = xy[xy.length - 1];
  return '<div class="ptr-card ' + cls + '"><div class="sum-label">' + label + '</div><div class="ptr-val">' + last.toFixed(digits) +
    ' <span class="small ' + (d > 0 ? "up" : d < 0 ? "down" : "muted") + '">' + signText(d, digits) + "</span></div>" +
    '<svg class="ptr-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none"><polyline points="' + xy.map(function (p) { return p.join(","); }).join(" ") + '"/>' +
    '<circle class="ptr-end" cx="' + end[0] + '" cy="' + end[1] + '" r="3.5"/>' + dots + "</svg>" +
    '<div class="ptr-axis"><span>' + pts[0][0] + "주</span><span>" + pts[pts.length - 1][0] + "주</span></div></div>";
}

// ----- ④ 업적 칭호 -----
function titleAuto() {
  const got = ACHIEVEMENTS.filter(function (a) { return state.achievements && state.achievements[a.id]; });
  if (!got.length) return null;
  const at = function (a) { const x = state.achievements[a.id]; return (x.y || 0) * 100 + (x.w || 0); };
  return got.slice().sort(function (a, b) {
    return (TITLE_RULES.gradeRank[b.grade] || 0) - (TITLE_RULES.gradeRank[a.grade] || 0) || at(b) - at(a);
  })[0];
}
function currentTitle() {
  const pick = state.career && state.career.titlePick;
  if (pick && state.achievements && state.achievements[pick]) {
    const a = ACHIEVEMENTS.find(function (x) { return x.id === pick; });
    if (a) return a;
  }
  return titleAuto();
}
function titleBadgeHTML() {
  const a = currentTitle();
  if (!a) return "";
  return '<span class="ttl-badge tip" tabindex="0" data-tip="' + escapeHTML("칭호 · 업적 '" + a.name + "' — " + a.desc + " · [업적 도감]에서 바꿀 수 있어요") + '">' + a.icon + " 「" + escapeHTML(a.name) + "」</span>";
}
function titlePickerHTML() {
  const got = ACHIEVEMENTS.filter(function (a) { return state.achievements && state.achievements[a.id]; });
  const pick = state.career.titlePick || "";
  const chip = function (id, text, on) { return '<button class="ttl-chip' + (on ? " on" : "") + '" data-title-pick="' + id + '">' + text + "</button>"; };
  return '<div class="card"><h2>🏅 칭호 <span class="muted small">이름 아래 붙는 업적 이름 · 지금 ' + (currentTitle() ? "「" + escapeHTML(currentTitle().name) + "」" : "없음") + "</span></h2>" +
    (got.length ? '<div class="ttl-picker">' + chip("", TITLE_RULES.autoName, !pick) +
      got.map(function (a) { return chip(a.id, a.icon + " 「" + escapeHTML(a.name) + "」", pick === a.id); }).join("") + "</div>"
      : '<p class="muted small">업적을 하나 달성하면 칭호가 생겨요.</p>') + "</div>";
}
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest ? e.target.closest("[data-title-pick]") : null;
  if (!b) return;
  state.career.titlePick = b.getAttribute("data-title-pick") || null;
  if (state.settings.autoSave) saveGame();
  renderAll();
});
