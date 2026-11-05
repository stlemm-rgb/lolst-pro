// ===== 대시보드·진행 개선 (196, 시안 10 — 「풋볼 에이전시」 참고) =====
// 화면만 바꿈: 게임 결과·밸런스·무작위 순서 그대로 (Math.random 안 씀)
//   ① 이번 주 요약 창: [다음 주로 진행] → (대성공 카드) → 요약 창 → 경기 재생   (js/main.js advanceWeek)
//   ② 다음 목표 3칸: 대시보드 맨 위 (다음 일정 · 내 계약 만료 · 다음 패치)
//   ③ 성장 그래프 2칸: [선수 정보] 머리 (종합 능력 · 인기도, 이번 시즌 매주)  기록 = state.career.trend
//   ④ 업적 칭호: 이름 아래. 자동(등급 높은 것 → 최근) 또는 [업적 도감]에서 고르기  저장 = state.career.titlePick
// 값·문구는 data/ui.js (WEEK_SUMMARY · DASH_GOALS · TITLE_RULES · TREND_RULES)

// ----- ① 이번 주 요약 창 -----
function weekSummaryOn() { return !state.settings || state.settings.weekSummary !== false; }

let wsBusy = false; // 211: 진행 직후 요약 창이 뜰 차례면 신문 팝업은 요약 창을 닫은 뒤에 (겹쳐 뜨지 않게)
function showWeekSummary(done) {
  const r = state.weekReport;
  const finish = function (noReplay) { wsBusy = false; maybeShowNews(); if (done && !noReplay) done(); }; // 292: [닫기]면 경기 재생 건너뜀
  if (!weekSummaryOn() || !r || !r.growthBase || r.summarySeen || state.retired) { finish(); return; }
  r.summarySeen = true;
  let el = document.getElementById("ws-overlay");
  if (!el) { el = document.createElement("div"); el.id = "ws-overlay"; document.body.appendChild(el); }
  const kind = roomWeekKind(r);
  el.innerHTML = weekSummaryHTML(r, kind);
  el.hidden = false;
  const box = el.querySelector(".ws-box");
  const close = function (noReplay) {
    wsStop();
    el.hidden = true;
    document.removeEventListener("keydown", onKey);
    finish(noReplay);
  };
  // 클릭·Space·A(ㅁ)·Enter: 다다닥 중이면 바로 끝까지, 다 나왔으면 닫기(재생할 경기가 있으면 재생) / Esc·[닫기]: 재생 없이 닫기 (단축키 199, data/ui.js SUMMARY_OK_CODES)
  const press = function () { if (wsRun && !wsRun.done) wsSkip(); else close(); };
  const onKey = function (e) {
    if (e.key === "Escape") { e.preventDefault(); close(true); return; } // 292: Esc = [닫기]와 같게 (재생 안 봄)
    if (SUMMARY_OK_CODES.indexOf(e.code) !== -1 || e.key === "Enter" || e.code === "Space") { e.preventDefault(); press(); }
  };
  el.onclick = function (e) {
    if (e.target.closest && e.target.closest("[data-ws-noreplay]")) close(true); // 292: 재생 안 보고 닫기
    else if (e.target.closest && e.target.closest("[data-ws-close]")) close();
    else press();
  };
  document.addEventListener("keydown", onKey);
  wsPlay(box, r);
}

// ----- 요약 창 모양 (시안 27 C2): 그림 위 제목·오른 스탯 → 그림 아래 경기 결과 → 체력·컨디션 | 종합·돈·인기도·연락 → 특별한 일 → 버튼 -----
function weekSummaryHTML(r, kind) {
  const W = WEEK_SUMMARY, R = ROOM_RULES, b = r.growthBase;
  const k = window.innerWidth < W.narrowAt ? W.scaleNarrow : W.scale, w = R.w * k, h = R.h * k, url = roomWeekStripURL(kind);
  const pic = url ? '<div class="ws-pic" style="width:' + w + "px;height:" + h + "px;background-image:url(" + url + ");background-size:" + (w * R.frames) + "px " + h + "px;--ws-end:-" + (w * R.frames) +
    "px;animation-duration:" + (R.frames * R.frameMs) + "ms;animation-timing-function:steps(" + R.frames + ')"></div>' : "";
  const head = '<div class="ws-head"><b>' + escapeHTML(r.when.replace(/^\d+년 /, "")) + ' 정리</b><span>' + state.year + "년 · " + escapeHTML(seasonPhaseName()) + "</span></div>";
  const lines = (r.teamLines || []).slice(0, W.maxMatches), wins = lines.filter(function (l) { return l.won; }).length;
  const cap = wsFill(W.caps[kind], { training: r.training.name, n: lines.length, w: wins, l: lines.length - wins, title: r.title ? wsTitleName(r.title) : "" });
  const ups = Object.keys(state.stats).map(function (id) { return [id, Math.round((state.stats[id] - (b.stats[id] || 0)) * 10) / 10]; })
    .filter(function (x) { return x[1] > 0; }).sort(function (x, y) { return y[1] - x[1]; }).slice(0, W.maxChips);
  const chips = '<div class="ws-chips">' + ups.map(function (x) { return '<span class="ws-chip' + (x[1] >= W.bigChip ? " big" : "") + '">' + escapeHTML(statName(x[0])) + " <b>+" + x[1] + "</b></span>"; }).join("") + "</div>";
  const mine = (r.userLines || []).length > 0;
  const rows = lines.map(function (l, i) { return '<div class="ws-mrow" data-m="' + i + '">' + wsRowInner(l, mine, false) + "</div>"; }).join("") ||
    '<div class="ws-mrow none">' + W.noMatch + " · 🏋️ " + escapeHTML(r.training.name) + "</div>";
  const st0 = Number.isFinite(b.st) ? b.st : state.stamina, cd0 = Number.isFinite(b.cd) ? b.cd : state.condition;
  const bar = function (key, name, v, max) { return '<div class="ws-bar ' + key + '" data-to="' + Math.round(v[1] / max * 100) + '" data-n="' + v[1] + '"><span>' + name + '</span><div class="t"><div class="f" style="width:' + Math.round(v[0] / max * 100) + '%"></div></div><span class="n">' + v[0] + "</span></div>"; };
  const bars = bar("st", "체력", [st0, state.stamina], state.staminaMax || 100) + bar("cd", "컨디션", [cd0, state.condition], 100);
  const now = playerScore(USER_ID), kv = [];
  if (Number.isFinite(b.score)) { const d = Math.round((now - b.score) * 10) / 10; kv.push(["종합 능력", b.score.toFixed(1) + " → " + now.toFixed(1) + (d ? " " + signText(d, 1) : ""), d > 0 ? "up" : d < 0 ? "down" : ""]); }
  const dm = Number.isFinite(b.money) ? state.money - b.money : 0, dp = Number.isFinite(b.pop) ? state.popularity - b.pop : 0;
  kv.push(["돈 · 인기도", '<span class="' + (dm > 0 ? "up" : dm < 0 ? "down" : "") + '">' + (dm >= 0 ? "+" : "−") + escapeHTML(moneyText(Math.abs(dm)).replace(" 원", "")) + "</span> · " + state.popularity +
    (dp ? ' <span class="' + (dp > 0 ? "up" : "down") + '">' + (dp > 0 ? "+" : "") + dp + "</span>" : ""), "", true]);
  const msgs = state.inbox.filter(function (m) { return m.id > r.msgFrom && m.tab === "inbox"; }).length, quest = (r.questLines || [])[0];
  kv.push(["새 연락" + (quest ? " · 퀘스트" : ""), msgs + "개" + (quest ? " · " + quest.split(" → ")[0] : ""), ""]); // 211: 퀘스트는 제목만
  const kvHTML = '<div class="ws-kv">' + kv.map(function (x) { return "<div>" + x[0] + '</div><div class="' + x[2] + '">' + (x[3] ? x[1] : escapeHTML(x[1])) + "</div>"; }).join("") + "</div>";
  const sp = [];
  if (r.title) sp.push(["🏆", escapeHTML(wsTitleName(r.title)) + " 우승!", ""]);
  if (r.great) sp.push(["🔥", W.greatText, ""]);
  // 298: 업적이 여러 개면 한 덩어리로 ("업적 달성 2개 · 「A」 · 「B」"), 하나면 예전처럼 설명까지
  const achv = (r.achv || []).map(function (id) { return ACHIEVEMENTS.find(function (x) { return x.id === id; }); }).filter(Boolean);
  if (achv.length === 1) {
    const a = achv[0];
    sp.push([a.icon, "업적 달성 · 「" + escapeHTML(a.name) + "」", escapeHTML(a.desc) + (titleAuto() && titleAuto().id === a.id ? " · 새 칭호가 이름 아래 붙었어요" : "")]);
  } else if (achv.length > 1) {
    const newTitle = achv.some(function (a) { return titleAuto() && titleAuto().id === a.id; });
    sp.push([achv[0].icon, "업적 달성 " + achv.length + "개 · " + achv.map(function (a) { return "「" + escapeHTML(a.name) + "」"; }).join(" · "), newTitle ? "새 칭호가 이름 아래 붙었어요" : ""]);
  }
  const special = sp.map(function (x) { return '<div class="ws-special"><span class="ic">' + x[0] + "</span><div>" + x[1] + (x[2] ? '<div class="muted small">' + x[2] + "</div>" : "") + "</div></div>"; }).join("");
  const btn = replayQueue().length ? W.replayBtn : W.okBtn;
  return '<div class="ws-box' + (kind.indexOf("title") === 0 ? " champ" : "") + '" role="dialog" aria-label="이번 주 요약">' +
    '<div class="ws-screen">' + pic + head + '<div class="ws-cap">' + escapeHTML(cap) + '</div><div class="ws-rows ws-ovl">' + chips + "</div></div>" +
    '<div class="ws-rest ws-rows">' + rows + positionWeekHTML(r) + '<div class="ws-two"><div>' + bars + "</div>" + kvHTML + "</div>" + special +
    '<div class="ws-foot"><div class="ws-btns"><button class="primary ws-btn" data-ws-close="1">' + btn + "</button>" +
      (replayQueue().length ? '<button class="ws-btn ws-noreplay" data-ws-noreplay="1">' + W.noReplayBtn + "</button>" : "") + // 292
      '</div><div class="muted small ws-hint">' + W.closeHint + "</div></div></div>" +
    '<div class="ws-flash"></div><span class="ws-skip">' + W.skipHint + "</span></div>";
}
function wsFill(text, v) { return String(text || "").replace(/\{(\w+)\}/g, function (all, k) { return v[k] !== undefined ? v[k] : all; }); }
function wsTitleName(t) { return String(t.name).replace(/ ?우승$/, ""); }
// 경기 줄 안: 점수판(가) + 상대 + 승패. 예전 세이브의 지난주 기록(점수 없음)은 글 그대로
function wsRowInner(l, mine, done) {
  if (l.my === undefined) return '<span class="ws-res ' + (l.won ? "win" : "lose") + '">' + (l.won ? "승" : "패") + '</span><span class="ws-mtxt">' + escapeHTML(l.text) + "</span>";
  return '<span class="ws-flip"><b class="d">' + (done ? l.my : 0) + '</b><span>:</span><b class="d">' + (done ? l.their : 0) + '</b></span><span class="ws-mtxt">' + escapeHTML(l.label + " · vs " + l.opp) +
    (mine ? "" : ' <span class="muted small">' + WEEK_SUMMARY.benched + "</span>") + '</span><span class="ws-res">' + (done ? (l.won ? "승리" : "패배") : "") + "</span>";
}

// ----- 다다닥 (그림 → 스탯 → 경기 결과 → 종합 → 특별한 일 → 버튼). 시간 = data/ui.js WEEK_SUMMARY.ms·big, 빠르게 = ×fast -----
let wsRun = null; // { timers, steps, finals, done }
function wsSpeed() { return state.settings && state.settings.wsSpeed === "fast" ? WEEK_SUMMARY.fast : 1; }
function wsShow(el) { if (el) el.classList.add("in"); }
function wsStop() { if (wsRun) wsRun.timers.forEach(clearTimeout); wsRun = null; }
function wsPlay(box, r) {
  wsStop();
  const W = WEEK_SUMMARY, M = W.ms, k = wsSpeed(), run = { timers: [], steps: [], finals: [], done: false, box: box };
  wsRun = run;
  const later = function (at, fn) { run.steps.push({ at: at, fn: fn }); };
  requestAnimationFrame(function () { box.classList.add("open"); });
  let t = M.start * k;
  const chips = box.querySelector(".ws-chips");
  later(t, function () { wsShow(chips); });
  box.querySelectorAll(".ws-chip").forEach(function (c) { later(t, function () { wsShow(c); }); t += M.chip * k; });
  const lines = (r.teamLines || []).slice(0, W.maxMatches), mine = (r.userLines || []).length > 0;
  lines.forEach(function (l, i) {
    const row = box.querySelector('[data-m="' + i + '"]');
    later(t, function () { wsBig(row, l, mine, k); });
    t += (l.my === undefined ? M.chip : wsBigTime(l)) * k;
  });
  if (!lines.length) { const none = box.querySelector(".ws-mrow.none"); later(t, function () { wsShow(none); }); t += M.noMatch * k; }
  box.querySelectorAll(".ws-bar").forEach(function (b) {
    later(t, function () { wsShow(b.closest(".ws-two")); wsShow(b); b.querySelector(".f").style.width = b.dataset.to + "%"; wsCount(b.querySelector(".n"), +b.dataset.n, M.bar * k); });
  });
  t += M.bar * k;
  const kv = box.querySelector(".ws-kv");
  const role = box.querySelector(".ws-role"); // 260 이번 주 내 역할 (js/position_voice.js)
  later(t, function () { wsShow(role); wsShow(kv); });
  t += M.kv * k;
  const sp = box.querySelectorAll(".ws-special");
  if (sp.length) {
    t += M.specialGap * k;
    later(t, function () { sp.forEach(wsShow); wsSparkle(box, k); });
    t += M.special * k;
  }
  later(t, function () { wsShow(box.querySelector(".ws-foot")); wsDone(); });
  if (motionOff() || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) { wsSkip(); return; }
  run.steps.forEach(function (st) { run.timers.push(setTimeout(function () { if (!run.done) { st.ran = true; st.fn(); } }, st.at)); });
}
function wsDone() {
  if (!wsRun) return;
  wsRun.done = true;
  const s = wsRun.box.querySelector(".ws-skip");
  if (s) s.remove();
}
function wsSkip() {
  const run = wsRun;
  if (!run) return;
  run.box.classList.add("instant");
  run.timers.forEach(clearTimeout);
  run.finals.slice().forEach(function (f) { f(); });
  run.steps.forEach(function (st) { if (!st.ran) { st.ran = true; st.fn(); } });
  run.box.querySelectorAll(".ws-rows > *, .ws-chip, .ws-bar").forEach(wsShow);
  run.box.querySelectorAll(".ws-mrow").forEach(function (x) { x.style.visibility = ""; });
  wsDone();
}
function wsCount(el, to, ms) {
  const from = +el.textContent, t0 = performance.now(), run = wsRun;
  (function step(now) {
    const u = Math.min(1, (now - t0) / ms);
    el.textContent = Math.round(from + (to - from) * u);
    if (u < 1 && run && run === wsRun && !run.box.classList.contains("instant")) requestAnimationFrame(step); else el.textContent = to;
  })(t0);
}
// 큰 점수판: 그림 가운데 뜸 → 숫자 넘김(세트마다) → 승리·패배 → 멈춤 → 작아지며 자기 줄로
function wsBigTime(l) { const B = WEEK_SUMMARY.big; return B.pop + Math.max(l.my, l.their) * B.tick + B.flipEnd + B.hold + B.fly + B.gap; }
function wsRowFinal(row, l, mine) {
  row.innerHTML = wsRowInner(l, mine, true);
  if (l.my !== undefined) row.classList.add(l.won ? "win" : "lose");
  wsShow(row);
}
function wsBig(row, l, mine, k) {
  const run = wsRun, box = run.box, B = WEEK_SUMMARY.big;
  if (l.my === undefined || box.classList.contains("instant")) { wsRowFinal(row, l, mine); return; }
  const pic = box.querySelector(".ws-screen"), wr = box.getBoundingClientRect(), pr = pic.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "ws-bigres";
  el.innerHTML = '<div class="bl">' + escapeHTML(l.label + " · vs " + l.opp) + '</div><div class="ws-flip"><b class="d">0</b><span>:</span><b class="d">0</b></div><div class="bw"></div>';
  el.style.left = (pr.left - wr.left + pr.width / 2) + "px";
  el.style.top = (pr.top - wr.top + pr.height / 2) + "px";
  box.appendChild(el);
  let over = false;
  const end = function () { if (over) return; over = true; el.remove(); row.style.visibility = ""; wsRowFinal(row, l, mine); run.finals = run.finals.filter(function (f) { return f !== end; }); };
  run.finals.push(end);
  if (el.animate) el.animate([{ transform: "translate(-50%,-50%) scale(1.4)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 1 }], { duration: B.pop * k, easing: "cubic-bezier(.2,1.4,.4,1)", fill: "forwards" });
  const ds = el.querySelectorAll(".d");
  [l.my, l.their].forEach(function (n, j) {
    for (let v = 1; v <= n; v++) run.timers.push(setTimeout(function () { ds[j].textContent = v; ds[j].classList.remove("tick"); void ds[j].offsetWidth; ds[j].classList.add("tick"); }, (B.pop + v * B.tick) * k));
  });
  const tRes = B.pop + Math.max(l.my, l.their) * B.tick + B.flipEnd;
  run.timers.push(setTimeout(function () { el.classList.add(l.won ? "win" : "lose"); el.querySelector(".bw").textContent = l.won ? "승리" : "패배"; }, tRes * k));
  run.timers.push(setTimeout(function () {
    wsRowFinal(row, l, mine);
    row.style.visibility = "hidden"; // 줄을 먼저 채워 자리를 재고, 큰 판을 그 자리·크기로 줄임
    const a = el.getBoundingClientRect(), c = row.getBoundingClientRect();
    const dx = (c.left + c.width / 2) - (a.left + a.width / 2), dy = (c.top + c.height / 2) - (a.top + a.height / 2), sc = Math.max(0.35, c.height / a.height);
    if (el.animate) el.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(" + sc + ")", opacity: 0.25 }], { duration: B.fly * k, easing: "cubic-bezier(.5,0,.8,.6)", fill: "forwards" });
    run.timers.push(setTimeout(function () {
      end();
      if (row.animate) row.animate([{ transform: "scale(1.04)", filter: "brightness(1.8)" }, { transform: "none", filter: "none" }], { duration: 220 });
    }, B.fly * k));
  }, (tRes + B.hold) * k));
}
// 특별한 일: 창 전체 하얗게 번쩍 → 그림 둘레 하얀 별이 반짝이며 흩어짐 (자리는 fxRandom — 게임 무작위와 따로)
function wsSparkle(box, k) {
  const fl = box.querySelector(".ws-flash");
  fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go");
  const scr = box.querySelector(".ws-screen"), pic = box.querySelector(".ws-pic");
  if (!pic || !pic.animate) return;
  pic.classList.add("glow");
  const w = pic.offsetWidth, h = pic.offsetHeight, ox = pic.offsetLeft, oy = pic.offsetTop;
  for (let i = 0; i < WEEK_SUMMARY.stars; i++) {
    const st = document.createElement("span"), side = i % 4, u = fxRandom();
    st.className = "ws-star";
    const x = side === 0 || side === 2 ? u * w : side === 1 ? w : 0, y = side === 1 || side === 3 ? u * h : side === 2 ? h : 0;
    st.style.left = (ox + x) + "px"; st.style.top = (oy + y) + "px";
    scr.appendChild(st);
    st.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1, offset: 0.3 }, { transform: "translate(" + (x - w / 2) * 0.15 + "px," + (y - h / 2) * 0.15 + "px) scale(0)", opacity: 0 }], { duration: 800 * k, delay: i * 25 * k, fill: "forwards" });
  }
  setTimeout(function () { pic.classList.remove("glow"); }, 900 * k);
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
  const cur = !weekSummaryOn() ? "off" : wsSpeed() === 1 ? "normal" : "fast";
  return '<div class="setting-row">' + WEEK_SUMMARY.settingText + ' <select id="ws-setting">' + WEEK_SUMMARY.speeds.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div>";
}
function bindWeekSummarySetting(page) {
  const s = page.querySelector("#ws-setting");
  if (!s) return;
  s.onchange = function () {
    state.settings.weekSummary = this.value !== "off";
    state.settings.wsSpeed = this.value === "fast" ? "fast" : "normal";
    const o = WEEK_SUMMARY.speeds.find(function (x) { return x[0] === s.value; });
    showNotice("이번 주 요약 창: " + (o ? o[1] : ""));
  };
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
  const name = c.endWeek ? c.endYear + "년 " + c.endWeek + "주차 · 단기" : c.endYear + "년 시즌 끝"; // 203: 팀 이름 대신 계약 끝 (팀은 선수 카드에)
  if (weeks > CREATION.weeksPerSeason) return { label: "내 계약 만료", name: name, num: c.endYear - state.year, unit: "년", go: "transfer" };
  return { label: "내 계약 만료", name: name, num: weeks, unit: "주", go: "transfer", warn: weeks <= DASH_GOALS.contractWarn };
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
