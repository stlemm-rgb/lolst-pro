// ===== 연애 요소 (128) — 규칙 data/romance_rules.js, 대상·대사·연락 data/romance.js =====
// 인기도가 오르면 여성 연애 대상이 다가옴. 관심(0~29) → 썸(30~59) → 고백(60↑) 성공 시 연애 → 결별 가능. 결혼 없음 (은퇴 엔딩에 한 줄)
// state.romance = { off, met: {대상 id: { name, aff, exUntil }}, partner, since, secret, decided, annivYear,
//                   yearN: { y, n }, cooldownUntil, threats: { sasaeng, stalker }(해), history: [{ tid, name, from, to }] }
// 효과 키 (js/events.js applyEffects): affection (ctx.tid 호감 ±) · romance: "start" | "end" | "public" | "secret"

function romanceOn() { return typeof ROMANCE_TARGETS !== "undefined" && ROMANCE_TARGETS.length && !(state.romance && state.romance.off); }

function ensureRomance() {
  if (!state.romance) state.romance = { off: false, met: {}, partner: null, since: 0, secret: true, decided: false, annivYear: 0, yearN: { y: 0, n: 0 }, cooldownUntil: 0, threats: {}, history: [] };
  return state.romance;
}

function findTarget(id) { return (typeof ROMANCE_TARGETS !== "undefined" ? ROMANCE_TARGETS : []).find(function (t) { return t.id === id; }); }

// 대상 이름: 게임마다 names 중 하나 (처음 만날 때 정함)
function targetName(tid) {
  const R = ensureRomance();
  if (R.met[tid]) return R.met[tid].name;
  const t = findTarget(tid);
  return t ? pick(t.names) : "";
}

function romanceLine(tid, key) {
  const t = findTarget(tid);
  const list = t && t.lines && t.lines[key];
  return list && list.length ? pick(list) : "";
}

// 연락 ctx: {her} {job} {say} (+ {rival} {rivaljob} {rivalsay})
function romanceCtx(tid, lineKey, rivalId) {
  const t = findTarget(tid);
  const ctx = { tid: tid, her: targetName(tid), job: t ? t.job : "" };
  ctx.say = fillText(romanceLine(tid, lineKey), ctx);
  if (rivalId) {
    const r = findTarget(rivalId);
    const RM = ensureRomance();
    if (!RM.met[rivalId]) RM.met[rivalId] = { name: targetName(rivalId), aff: 0 }; // 이름 고정
    ctx.rtid = rivalId; ctx.rival = RM.met[rivalId].name; ctx.rivaljob = r ? r.job : "";
    ctx.rivalsay = fillText(romanceLine(rivalId, "rivalApproach"), { her: ctx.rival, job: ctx.rivaljob });
  }
  return ctx;
}

function affOf(tid) { const m = ensureRomance().met[tid]; return m ? m.aff : 0; }

function romanceStageName(tid) {
  const R = ensureRomance(), S = ROMANCE_RULES.stage;
  if (R.partner === tid) return "💑 연애 중";
  const a = affOf(tid);
  return a >= S.crush ? "💗 썸" : "👀 관심";
}

// ----- 효과 (js/events.js applyEffects) -----
function changeAffection(tid, n, notes) {
  if (!tid || !n) return;
  const R = ensureRomance();
  if (!R.met[tid]) R.met[tid] = { name: targetName(tid), aff: 0 };
  const m = R.met[tid];
  m.aff = Math.max(0, Math.min(100, m.aff + n));
  if (notes) notes.push((n > 0 ? "💗 " : "💔 ") + m.name + " 호감 " + (n > 0 ? "+" : "") + n + " (" + romanceStageName(tid) + ")");
}

function romanceEffect(v, ctx, notes) {
  const R = ensureRomance();
  const tid = ctx && ctx.tid;
  if (v === "start" && tid) {
    if (R.partner && R.partner !== tid) romanceEnd(notes, true);
    R.partner = tid; R.since = absWeek(); R.secret = true; R.decided = false; R.annivYear = 0;
    if (!R.met[tid]) R.met[tid] = { name: targetName(tid), aff: 0 };
    R.met[tid].aff = Math.max(R.met[tid].aff, 60);
    notes.push("💑 " + R.met[tid].name + "와(과) 연애를 시작했다 (지금은 비밀 연애)");
    addMoment("💑", findTarget(tid).job + " " + R.met[tid].name + "와(과) 연애 시작");
  } else if (v === "end") {
    romanceEnd(notes, false);
    if (ctx && ctx.rtid) changeAffection(ctx.rtid, 20, notes); // 다른 대상에게 흔들림
  } else if (v === "public" && R.partner) {
    R.secret = false; R.decided = true;
    notes.push("📢 연애를 공개했다");
    if (ROMANCE_RULES.officeTargets.indexOf(R.partner) !== -1) notes.push("🏠 사내 연애가 알려져 팀 내 입지 −" + ROMANCE_RULES.officePenalty);
  } else if (v === "secret" && R.partner) {
    R.secret = true; R.decided = true;
    notes.push("🤫 당분간 비밀 연애");
  }
}

function romanceEnd(notes, quiet) {
  const R = ensureRomance();
  if (!R.partner) return;
  const tid = R.partner, m = R.met[tid];
  R.history.push({ tid: tid, name: m.name, from: R.since, to: absWeek() });
  m.aff = 10;
  m.exUntil = absWeek() + ROMANCE_RULES.exLockWeeks;
  R.partner = null;
  R.cooldownUntil = absWeek() + ROMANCE_RULES.breakupCooldown;
  if (!quiet && notes) notes.push("💔 " + m.name + "와(과) 헤어졌다");
  addMoment("💔", m.name + "와(과) 이별");
}

// 사내 연애 공개 → 팀 내 입지 − (js/standing.js)
function romanceStandingPenalty() {
  const R = state.romance;
  if (!R || !R.partner || R.secret || ROMANCE_RULES.officeTargets.indexOf(R.partner) === -1) return 0;
  return -ROMANCE_RULES.officePenalty;
}

// ----- 매주 (js/events.js runWeeklyEvents) -----
// inboxFired: 이번 주에 이미 선택지 연락이 있으면 연애 연락은 안 옴. 돌려주는 값: 보냈는지
function romanceWeekly(inboxFired) {
  if (!romanceOn()) return false;
  const R = ensureRomance(), RR = ROMANCE_RULES;
  // 답하지 않고 지나간 연애 연락 → 호감 −
  state.inbox.forEach(function (m) {
    if (m.answered === "ignored" && !m.rmIgn && m.eventId && m.eventId.indexOf("rm_") === 0 && m.ctx && m.ctx.tid) {
      m.rmIgn = true;
      changeAffection(m.ctx.tid, -RR.ignorePenalty, null);
    }
  });
  if (inboxFired || state.retired || absWeek() < R.cooldownUntil) return false;
  if (R.yearN.y !== state.year) R.yearN = { y: state.year, n: 0 };
  if (R.yearN.n >= RR.perYear) return false;
  if (!R.partner && state.popularity < RR.minPopularity) return false;
  if (Math.random() >= RR.weeklyChance) return false;
  const pickEv = romancePickEvent();
  if (!pickEv) return false;
  const pool = EVENTS.filter(function (ev) { return ev.trigger === pickEv.trigger; });
  if (!pool.length) return false;
  R.yearN.n++;
  if (pickEv.ctx.tid && R.met[pickEv.ctx.tid]) R.met[pickEv.ctx.tid].lastW = absWeek(); // 같은 사람 연속 연락 방지
  fireEvent(pick(pool), pickEv.ctx);
  return true;
}

// 이번에 보낼 연애 연락 고르기 → { trigger, ctx }
function romancePickEvent() {
  const R = ensureRomance(), RR = ROMANCE_RULES, S = RR.stage;
  const now = absWeek();
  const unlocked = ROMANCE_TARGETS.filter(function (t) {
    const m = R.met[t.id];
    return state.popularity >= t.unlock && !(m && m.exUntil && m.exUntil > now);
  });
  // 위협 이벤트 (연애 대상 아님, 해마다 1번까지)
  if (state.popularity >= RR.stalker.pop && R.threats.stalker !== state.year && Math.random() < RR.stalker.chance) { R.threats.stalker = state.year; return { trigger: "rm_stalker", ctx: {} }; }
  if (state.popularity >= RR.sasaeng.pop && R.threats.sasaeng !== state.year && Math.random() < RR.sasaeng.chance) { R.threats.sasaeng = state.year; return { trigger: "rm_sasaeng", ctx: {} }; }

  if (R.partner) {
    const p = R.partner;
    if (affOf(p) < S.crisis) return { trigger: "rm_crisis", ctx: romanceCtx(p, "crisis") };
    if (R.met[p].lastW && now - R.met[p].lastW < RR.sameGap) return null; // 연인 연락도 최소 간격
    if (R.secret && R.decided && Math.random() < RR.rumorChance) return { trigger: "rm_rumor", ctx: romanceCtx(p, "secret") };
    if (!R.decided) return { trigger: "rm_public", ctx: romanceCtx(p, "public") };
    if (bigMatchSoon() && Math.random() < 0.6) return { trigger: "rm_cheer", ctx: romanceCtx(p, "cheer") };
    if (now - R.since >= RR.annivWeeks && R.annivYear !== state.year) { R.annivYear = state.year; return { trigger: "rm_anniv", ctx: romanceCtx(p, "anniv") }; }
    const rivals = unlocked.filter(function (t) { return t.id !== p; });
    const r = Math.random();
    if (rivals.length && r < RR.rivalChance) return { trigger: "rm_rival", ctx: romanceCtx(p, "jealous", pick(rivals).id) };
    if (r < RR.rivalChance + 0.3) return { trigger: "rm_gift", ctx: romanceCtx(p, "gift") }; // 연인의 선물
    return { trigger: "rm_date", ctx: romanceCtx(p, "date") };
  }
  // 연애 중이 아닐 때: 고백 → 이미 호감 있는 사람과 이어 가기 → 새 만남(1년 newPerYear명까지)
  const met = unlocked.filter(function (t) { return R.met[t.id]; });
  const confess = met.filter(function (t) { return affOf(t.id) >= S.confess; });
  if (confess.length) return { trigger: "rm_confess", ctx: romanceCtx(pick(confess).id, "date") };
  const warm = met.filter(function (t) { return affOf(t.id) >= RR.warmFrom && !(R.met[t.id].lastW && now - R.met[t.id].lastW < RR.sameGap); });
  const fresh = unlocked.filter(function (t) { return !R.met[t.id]; });
  if (!R.newYear || R.newYear.y !== state.year) R.newYear = { y: state.year, n: 0 };
  const canMeet = fresh.length && R.newYear.n < RR.newPerYear;
  if (warm.length && (!canMeet || Math.random() < RR.warmChance)) {
    // 호감이 높을수록 잘 뽑힘
    const t = weightedPickBy(warm, function (x) { return affOf(x.id); });
    const dateP = affOf(t.id) >= S.crush ? 0.6 : 0.4;
    return Math.random() < dateP ? { trigger: "rm_date", ctx: romanceCtx(t.id, "date") } : { trigger: "rm_gift", ctx: romanceCtx(t.id, "gift") };
  }
  if (canMeet) {
    const t = pick(fresh);
    R.newYear.n++;
    R.met[t.id] = { name: pick(t.names), aff: 0 }; // 처음 만남: 이름 정하기
    return { trigger: "rm_meet", ctx: romanceCtx(t.id, "meet") };
  }
  return null;
}

// 이번 주나 다음 주에 우리 팀 큰 경기 (js/matchsim.js isBigMatch)
function bigMatchSoon() {
  const t = myTeam();
  if (!t) return false;
  return userMatches().some(function (m) { return !m.winner && (m.week === state.week || m.week === state.week + 1) && isBigMatch(m); });
}

// ----- 은퇴 엔딩 한 줄 (js/retire.js finishCareer) -----
function romanceEndingLine() {
  const R = state.romance;
  if (!R || !R.partner || R.off) return "";
  return fillText(romanceLine(R.partner, "ending"), { her: R.met[R.partner].name, job: findTarget(R.partner).job });
}

// ----- [친구] 화면 카드 -----
function romanceCardHTML() {
  if (typeof ROMANCE_TARGETS === "undefined" || !ROMANCE_TARGETS.length) return "";
  const R = ensureRomance(), RR = ROMANCE_RULES;
  const toggle = '<button class="small-btn" data-romance-toggle="1">' + (R.off ? "연애 요소 켜기" : "연애 요소 끄기") + "</button>";
  if (R.off) return '<div class="card"><h2>💕 연애 <span class="muted small">꺼짐</span></h2><p class="muted small">연애 연락이 오지 않아요.</p>' + toggle + "</div>";
  const bar = function (v) { return '<div class="bar"><div class="bar-fill" style="width:' + v + '%"></div></div>'; };
  let main;
  if (R.partner) {
    const t = findTarget(R.partner), m = R.met[R.partner];
    const weeks = absWeek() - R.since;
    main = "<p>💑 <b>" + escapeHTML(m.name) + '</b> <span class="muted small">' + t.icon + " " + escapeHTML(t.job) + " · " + weeks + "주째 · " + (R.decided ? (R.secret ? "🤫 비밀 연애" : "📢 공개 연애") : "아직 비밀") + "</span></p>" +
      bar(m.aff) + '<p class="small">호감 ' + m.aff + (m.aff < RR.stage.crisis ? ' <span class="down">⚠️ 이별 위기</span>' : "") + "</p>";
  } else {
    main = state.popularity < RR.minPopularity
      ? '<p class="muted small">인기도 ' + RR.minPopularity + "부터 누군가 다가와요. (지금 " + Math.round(state.popularity) + ")</p>"
      : '<p class="muted small">지금은 연애 중이 아니에요.</p>';
  }
  const others = Object.keys(R.met).filter(function (tid) { return tid !== R.partner && findTarget(tid); }).sort(function (a, b) { return affOf(b) - affOf(a); });
  const rows = others.map(function (tid) {
    const t = findTarget(tid), m = R.met[tid];
    const ex = m.exUntil && m.exUntil > absWeek();
    return "<tr><td>" + t.icon + " <b>" + escapeHTML(m.name) + '</b> <span class="muted small">' + escapeHTML(t.job) + "</span></td><td>" + (ex ? '<span class="muted">💔 헤어짐</span>' : romanceStageName(tid)) + '</td><td class="r">' + m.aff + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>💕 연애 <span class="muted small">부가 요소 · 1년 연락 최대 ' + RR.perYear + "개</span></h2>" + main +
    (rows ? '<h2 class="sub">알고 지내는 사람</h2><div class="table-wrap"><table class="roster tlog">' + rows + "</table></div>" : "") +
    '<p class="muted small">호감 ' + RR.stage.crush + " 이상 썸, " + RR.stage.confess + " 이상이면 고백 연락이 와요. 연애는 한 번에 한 명.</p>" + toggle + "</div>";
}

// 연애 끄기/켜기 버튼 (화면이 그려질 때마다 연결)
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest ? e.target.closest("[data-romance-toggle]") : null;
  if (!b) return;
  const R = ensureRomance();
  R.off = !R.off;
  if (R.off && R.partner) romanceEnd(null, true); // 끄면 조용히 정리
  renderPage();
});
