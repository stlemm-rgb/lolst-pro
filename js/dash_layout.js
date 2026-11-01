// ===== 대시보드 PC · 휴대폰 따로 (232, 시안 24 ② · Codex 토론) =====
// 휴대폰(760px 이하): 행동 그림 → 📱 새 연락 알림 → 이번 주 경기 한 줄 → 상태 4칸 → 지금 필요한 경고 → 퀘스트 → [더 보기]
// PC: [이번 주 칸: 행동 그림 + 할 일 + 경기 한 줄 | 📱 내 휴대폰 + 내 선수 카드] → 지난주·퀘스트·챔피언 → 조합 전략·최근 경기·솔랭 → 스탯
// 보이는 쪽 하나만 그림 (폭이 760px을 넘나들면 다시 그림). 조각은 js/dashboard.js·dash_plus.js·room.js·sns_page.js 것을 그대로 씀
// 화면만 바꿈: 게임 결과 그대로 (Math.random 안 씀)
const dashOpen = {}; // 펼쳐 둔 칸 (다시 그려도 유지): 경기 m0·m1 · 더 보기 more

function dashIsMobile() { return !!(window.matchMedia && window.matchMedia("(max-width: 760px)").matches); }
function dashboardHTML() { return dashIsMobile() ? dashMobileHTML() : dashPcHTML(); }

// 이번 주 경기: 이미 잡힌 경기 + 토너먼트는 이번 주에 정해질 대진을 미리 계산 (js/matchsim.js userWeekMatches)
function dashWeek() {
  const mine = myTeam(), wk = userWeekMatches(state.week);
  return { mine: mine, wk: wk, matches: wk.matches.concat(wk.preview) };
}
function dashDetails(key, cls, summary, body) {
  return '<details class="' + cls + '" data-dopen="' + key + '"' + (dashOpen[key] ? " open" : "") + "><summary>" + summary + "</summary>" + body + "</details>";
}

// ----- 이번 주 경기: 한 줄 (누르면 원래 경기 카드: 얼굴·전적·분석 리포트) -----
function dashMatchRowsHTML(w) {
  if (!w.matches.length) {
    const later = nextUserMatch(), week = state.week;
    const ko = ["cup_po", "first_stand", "road_to_msi", "msi", "playin", "playoffs", "promotion", "worlds"].some(function (id) { return scheduleOfWeek(week).id.indexOf(id) === 0; });
    return '<div class="wc-nomatch"><b>이번 주 경기 없음</b><span class="muted small">' + (ko ? "우리 팀은 이번 라운드에 나가지 않아요" : "훈련에 집중하는 주예요") +
      (later ? " · 다음 경기 " + later.week + "주차 " + escapeHTML(later.label) + " vs " + escapeHTML(teamName(later.a === w.mine.id ? later.b : later.a)) : "") + "</span></div>";
  }
  return w.matches.map(function (m, i) {
    const opp = m.a === w.mine.id ? m.b : m.a, big = bigGameOf(w.mine.id, opp);
    const wt = findWorldTeam(opp), os = wt ? worldStarters(wt) : findTeam(opp) ? starters(opp) : null;
    const mate = os && os[state.player.position];
    const sum = '<span class="rep-tag win">경기</span><span class="dm-mt"><b>' + escapeHTML(w.mine.name) + " vs " + escapeHTML(teamName(opp)) + "</b>" +
      "<small>" + (big ? "🔥 빅게임 · " : "") + escapeHTML(m.label) + " · 전력 " + strengthOf(opp).toFixed(1) + (mate ? " · 맞수 " + escapeHTML(playerName(mate)) : "") + "</small></span>" +
      '<span class="dm-arr">준비 ▾</span>';
    return dashDetails("m" + i, "dm-match", sum, matchCardHTML(m, w.mine, opp, big));
  }).join("") +
  (w.wk.sameWeekFinal ? '<div class="rep-row muted small">4강을 이기면 같은 주에 LCK 컵 결승 (' + LEAGUE.bestOf.cup_final + "판 " + Math.ceil(LEAGUE.bestOf.cup_final / 2) + "선승)도 치러요.</div>" : "");
}

// ----- 📱 새 연락 알림 (잠금화면 알림처럼). 누르면 휴대폰 창 (js/sns_page.js openPhone) -----
function dashPhoneHTML() {
  const deck = deckMessages(), mentions = unreadCount("social");
  const out = [];
  if (deck.length) {
    const m = deck[deck.length - 1], av = msgAvatar(m);
    const pre = String(m.kind === "offer" && m.offer ? offerText(m.offer) : m.text || "").split("\n")[0];
    out.push('<button class="dphone" data-openphone="msg"><span class="dph-ic">' + av.icon + "<em>" + deck.length + '</em></span><span class="dph-tx"><span class="dph-h">💬 메시지 · ' + socialAgo(m) + "</span>" +
      '<b class="one">' + escapeHTML(av.title) + '</b><span class="one">' + escapeHTML(pre) + '</span><span class="dph-n">답할 연락 ' + deck.length + (mentions ? " · 📸 나를 언급 " + mentions : "") + '</span></span><span class="dph-go">열기 ›</span></button>');
  }
  if (mentions) {
    const p = socialPosts().find(function (x) { return x.mention && !x.read; });
    if (p) out.push('<button class="dphone sns" data-openphone="noti"><span class="dph-ic">📸<em>' + mentions + '</em></span><span class="dph-tx"><span class="dph-h">' + PHONE_APPS.snsName + " · " + socialAgo(p) + "</span>" +
      '<b class="one">' + escapeHTML(String(p.title || "").replace(/^@/, "")) + PHONE_APPS.notiText + '</b><span class="one">' + escapeHTML(p.text) + '</span></span><span class="dph-go">보기 ›</span></button>');
  }
  if (!out.length) out.push('<button class="dphone quiet" data-openphone="sns"><span class="dph-ic">📱</span><span class="dph-tx"><b>새 연락 없음</b><span class="one">' + PHONE_APPS.snsName + "에서 선수들 글 보기</span></span><span class=\"dph-go\">열기 ›</span></button>");
  return out.join("");
}

// ----- 상태 4칸 (휴대폰) -----
function dashTilesHTML() {
  const cap = conditionCap(), low = state.stamina < TEAM_MATCH.lowStaminaLimit, pr = positionRank(), c = state.contract;
  const tile = function (k, v, sub, cls) { return '<div class="dm-tile"><span class="k">' + k + '</span><b class="' + (cls || "") + '">' + v + "</b>" + sub + "</div>"; };
  const bar = function (v, max, cls) { return '<span class="bar"><span class="bar-fill ' + (cls || "") + '" style="width:' + Math.max(0, Math.min(100, v / max * 100)) + '%"></span></span>'; };
  return '<div class="dm-tiles">' +
    tile("체력", state.stamina + '<small>/' + state.staminaMax + "</small>", bar(state.stamina, state.staminaMax, low ? "neg" : ""), low ? "down" : "") +
    tile("컨디션", state.condition + (cap < 100 ? "<small>/" + cap + "</small>" : ""), bar(state.condition, 100)) +
    tile("종합 능력", playerScore(USER_ID).toFixed(1), '<span class="one small muted">리그 ' + findPosition(state.player.position).name + " " + pr.rank + "위</span>") +
    tile("돈", escapeHTML(moneyText(state.money)), '<span class="one small muted">' + (c ? "연봉 " + escapeHTML(moneyText(c.salary)) : "계약 없음") + "</span>") +
  "</div>";
}

// 지금 필요한 경고·추천 (있을 때만 카드로)
function dashAdviceMobileHTML() {
  const rows = adviceRowsHTML(true, true) + ladderResetNoticeHTML();
  return rows ? '<div class="card dm-advice">' + rows + "</div>" : "";
}

// ----- 휴대폰 대시보드 (235, 시안 25): 그림 오른쪽 바로가기 아이콘 · 미니 스탯 · 퀘스트 한 줄씩 -----
// 아이콘: 📱 휴대폰 창(배지 = 답할 연락 + 안 읽은 언급) · 🏋️ 훈련 빠른 선택(안 골랐을 때만 !) · 📋 퀘스트 빠른 선택(배지 = 퀘스트 수) · 👤 선수 정보
function dashRailHTML() {
  const n = { phone: deckMessages().length + unreadCount("social"), train: state.plan ? 0 : "!", quest: (state.quests || []).length, me: 0 };
  return '<div class="dm-rail">' + QUICK_ACTIONS.icons.map(function (x) {
    return '<button class="dm-ic" ' + (x[0] === "me" ? 'data-go="career"' : 'data-quick="' + x[0] + '"') + ' title="' + x[2] + '" aria-label="' + x[2] + '">' + x[1] +
      (n[x[0]] ? "<em>" + n[x[0]] + "</em>" : "") + "</button>";
  }).join("") + "</div>";
}
// 미니 스탯: 12개 숫자, 이번 주 오른 스탯 ▲ (진행 전 스탯 = weekReport.growthBase), 포지션 가산점 ★. 누르면 [선수 정보 → 능력]
function dashMiniStatsHTML() {
  const base = state.weekReport && state.weekReport.growthBase && state.weekReport.growthBase.stats;
  let ups = 0;
  const cells = STATS.map(function (s) {
    const v = state.stats[s.id], up = base && base[s.id] < v, star = isBonusStat(s.id, state.player.position);
    if (up) ups++;
    return '<span class="' + (star ? "star" : "") + '"><i class="one">' + (star ? "★" : "") + escapeHTML(s.name) + '</i><b class="' + (up ? "up" : "") + '">' + v + "</b></span>";
  }).join("");
  return '<button class="dm-stats" data-go="career" data-ptabgo="ability"><span class="h"><b>' + QUICK_ACTIONS.statsTitle + "</b><span>" + (ups ? "이번 주 ▲ " + ups + "개 · " : "") + QUICK_ACTIONS.statsMore + '</span></span><span class="g">' + cells + "</span></button>";
}
// 퀘스트 한 줄씩 (누르면 📋 빠른 선택 창)
function dashQuestLinesHTML() {
  const list = state.quests || [];
  if (!list.length) return "";
  const now = absWeek();
  return '<button class="card dm-quests" data-quick="quest">' + list.map(function (q) {
    const tpl = findQuest(q.id);
    return '<span class="dm-ql"><b class="one">📋 ' + escapeHTML(tpl.title) + '</b><span class="nw">' + dashQuestProgress(q) + " · " + (q.deadline > now ? (q.deadline - now) + "주" : "이번 주") + "</span></span>";
  }).join("") + "</button>";
}
function dashQuestProgress(q) {
  const tpl = findQuest(q.id);
  return tpl.kind === "ladderTop" ? myLadderRank() + "위→" + q.need + "위" : q.progress + "/" + q.need;
}

// 그림 아래 솔로 랭크 (236): 랭크 그림 · 티어 · 점수 · 리그 순위 · 이번 주 변화 (훈련 이름은 위쪽 막대에 있어서 뺌)
function dashLadderLineHTML() {
  const sr = state.soloRank || { points: LADDER.startPoints };
  const board = leagueLadder(), rank = board.findIndex(function (x) { return x.id === USER_ID; }) + 1;
  const l = state.weekReport && state.weekReport.ladder, d = l && l.games ? l.delta : null;
  return '<span class="dm-ladder">' + tierEmblemSVG(sr.points, 26) + '<b style="color:' + ladderTierInfo(sr.points).color + '">' + ladderTier(sr.points) + "</b>" +
    "<b>" + sr.points.toLocaleString() + "점</b>" + '<span class="muted">솔랭 ' + rank + "위</span>" +
    (d !== null ? '<span class="' + (d >= 0 ? "up" : "down") + '">' + (d >= 0 ? "▲" : "▼") + Math.abs(d) + "</span>" : "") + "</span>";
}

// ----- 휴대폰 대시보드 -----
function dashMobileHTML() {
  const w = dashWeek();
  return '<div class="dm">' + rookieCardsHTML() +
    '<div class="card dm-scene">' + roomBlockHTML(w.matches.length, dashLadderLineHTML()) + dashRailHTML() + "</div>" +
    dashMatchRowsHTML(w) +
    dashTilesHTML() +
    dashMiniStatsHTML() +
    dashAdviceMobileHTML() +
    dashQuestLinesHTML() +
    dashDetails("more", "card dm-more", '더 보기 <span class="muted small">지난주 결과 · 내 선수 · 챔피언 · 목표 · 조합 전략 · 최근 경기</span>',
      weekReportHTML() + heroCardHTML(true) + championCardHTML() + dashGoalsHTML() + '<div class="card">' + compPlanHTML() + "</div>" + recentMatchesHTML()) +
  "</div>";
}

// ----- PC 대시보드 -----
function dashWeekCardPcHTML(w) {
  const mine = w.mine, week = state.week;
  const t = state.plan ? findTraining(state.plan) : null;
  const low = state.stamina < TIRED_LIMIT, warn = state.stamina < TEAM_MATCH.lowStaminaLimit;
  return '<div class="card upcoming wc"><div class="wc-hd"><b>▶ ' + state.year + "년 " + week + '주차 · 이번 주</b><span class="muted small">' +
      (w.matches.length ? "경기 " + w.matches.length + "개 · 우리 팀 전력 " + teamStrength(mine.id).toFixed(1) : escapeHTML(scheduleOfWeek(week).name)) + "</span></div>" +
    '<div class="dp-wk">' + roomBlockHTML(w.matches.length) + // 이번 주 행동 그림 (js/room.js)
      '<div class="dp-side"><div class="wc-box"><span class="muted small">이번 주 훈련</span><b>' + (t ? escapeHTML(t.name) : '<span class="down">아직 안 골랐어요</span>') + "</b>" +
        '<button class="small-btn" data-go="training">훈련 바꾸기</button></div>' +
        '<div class="wc-box">' + miniBarHTML("체력", state.stamina, state.staminaMax, low ? "neg" : warn ? "warn" : "") + conditionBarHTML() + "</div></div></div>" +
    dashMatchRowsHTML(w) +
    adviceRowsHTML(true, true) + // 💡 이번 주 추천 (js/guide.js) — 퀘스트는 아래 퀘스트 칸
    ladderResetNoticeHTML() + // 패치 전 주: 솔로 랭크 초기화 예고
    '<div class="wc-go"><button data-dashgo="rest">휴식 주 💤</button><button class="primary" data-dashgo="next">다음 주로 진행 ▶</button></div>' +
  "</div>";
}
function dashPcHTML() {
  const w = dashWeek(), deck = deckMessages().length, men = unreadCount("social");
  return '<h1 class="dash-title">대시보드' + trophyShelfHTML() + "</h1>" + // 우승 트로피 진열장 (js/history_pages.js)
    dashGoalsHTML() + // 다음 일정 · 계약 만료 · 다음 패치 (js/dash_plus.js)
    rookieCardsHTML() + // 새 시즌 대형 신인 카드 (js/ui.js)
    '<div class="d2-top"><div class="d2-week">' + dashWeekCardPcHTML(w) + "</div>" +
      '<div class="d2-me dp-stack"><div class="card dp-phone"><div class="dp-ph-hd"><b>📱 내 휴대폰</b><span class="muted small">메시지 ' + deck + " · SNS 언급 " + men + "</span></div>" + dashPhoneHTML() + "</div>" +
        heroCardHTML(true) + "</div></div>" +
    '<div class="d2-row">' + weekReportHTML() + questPanelHTML() + championCardHTML() + "</div>" +
    '<div class="dash">' +
      '<div class="dash-main"><div class="card">' + compPlanHTML() + "</div>" + recentMatchesHTML() + "</div>" +
      '<div class="dash-side">' + leagueLadderHTML() + "</div>" +
    "</div>" +
    statsCardHTML();
}

// ----- 빠른 선택 창 (235, 시안 25): 🏋️ 훈련 · 📋 퀘스트를 다른 화면으로 가지 않고 이름만 보고 고르기 (아래에서 올라옴) -----
let quickKind = null;
function quickTrainHTML() {
  const quests = state.quests || [];
  return TRAININGS.map(function (t) {
    const on = state.plan === t.id;
    const sub = t.id === "champ_focus" && on ? (focusIsAuto() ? "자동(" + focusChamp() + ")" : focusChamp()) : t.id === "champion" && on ? (state.practiceChamp || "자동") : "";
    const hasQ = quests.some(function (q) { const qp = questPlan(q); return qp && qp.plan === t.id; });
    return '<button class="qs-opt' + (on ? " on" : "") + '" data-qsplan="' + t.id + '"><span class="ico">' + (QUICK_ACTIONS.trainIcons[t.id] || "🏋️") + '</span><span class="nm">' + escapeHTML(t.name) +
      (sub ? "<small>" + escapeHTML(sub) + "</small>" : "") + "</span>" + (hasQ ? '<span class="q">' + QUICK_ACTIONS.questTag + "</span>" : "") + "</button>";
  }).join("") + '<button class="qs-more" data-qsgo="training">' + QUICK_ACTIONS.trainMore + "</button>";
}
function quickQuestHTML() {
  const list = state.quests || [], now = absWeek();
  if (!list.length) return '<p class="muted">' + QUICK_ACTIONS.questEmpty + "</p>";
  return list.map(function (q) {
    const tpl = findQuest(q.id), qp = questPlan(q), on = questPlanActive(q);
    const pct = tpl.kind === "ladderTop" ? 0 : Math.round(q.progress / q.need * 100);
    return '<button class="qs-opt' + (on ? " on" : "") + '"' + (qp ? ' data-qsquest="' + q.uid + '"' : "") + '><span class="ico">' + QUEST_GIVERS[tpl.giver].split(" ")[0] + '</span><span class="nm">' + escapeHTML(tpl.title) +
      "<small>" + (qp ? "→ " + escapeHTML(findTraining(qp.plan).name) + " · " : "") + (q.deadline > now ? (q.deadline - now) + "주 남음" : "이번 주까지") + "</small></span>" +
      '<span class="pr"><span class="bar"><span class="bar-fill gold" style="width:' + pct + '%"></span></span><span class="small">' + dashQuestProgress(q) + "</span></span></button>";
  }).join("") + '<button class="qs-more" data-qsgo="training">' + QUICK_ACTIONS.questMore + "</button>";
}
function openQuick(kind) { quickKind = kind; renderQuick(true); }
function closeQuick() {
  quickKind = null;
  const el = document.getElementById("qs-overlay");
  if (el) { el.hidden = true; el.innerHTML = ""; }
}
function renderQuick(opening) {
  let el = document.getElementById("qs-overlay");
  if (!quickKind) { if (el) el.hidden = true; return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "qs-overlay";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target === el) closeQuick(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && quickKind) closeQuick(); });
  }
  const train = quickKind === "train";
  el.innerHTML = '<div class="qs-sheet' + (opening ? " qs-anim" : "") + '" role="dialog" aria-label="' + (train ? QUICK_ACTIONS.trainTitle : QUICK_ACTIONS.questTitle) + '"><div class="qs-grip"></div>' +
    '<div class="qs-hd"><b>' + (train ? QUICK_ACTIONS.trainTitle : QUICK_ACTIONS.questTitle) + "</b><span>" + (train ? QUICK_ACTIONS.trainSub : QUICK_ACTIONS.questSub) + "</span></div>" +
    (train ? quickTrainHTML() : quickQuestHTML()) + "</div>";
  el.hidden = false;
  el.querySelectorAll("[data-qsplan]").forEach(function (b) {
    b.onclick = function () { state.plan = b.getAttribute("data-qsplan"); state.notice = ""; closeQuick(); renderAll(); };
  });
  el.querySelectorAll("[data-qsquest]").forEach(function (b) { // js/quests.js bindQuestPlan과 같은 방법
    b.onclick = function () {
      const q = (state.quests || []).find(function (x) { return x.uid === Number(b.getAttribute("data-qsquest")); });
      const qp = q && questPlan(q);
      if (!qp) return;
      state.plan = qp.plan;
      if (qp.focusChamp !== undefined) state.focusChamp = qp.focusChamp;
      if (qp.practiceChamp !== undefined) state.practiceChamp = qp.practiceChamp;
      state.notice = ""; closeQuick(); renderAll();
    };
  });
  el.querySelectorAll("[data-qsgo]").forEach(function (b) { b.onclick = function () { closeQuick(); selectMenu(b.getAttribute("data-qsgo")); }; });
}

// ----- 버튼 (js/main.js renderPage에서 부름) -----
function bindDashLayout(page) {
  page.querySelectorAll("[data-openphone]").forEach(function (b) {
    b.onclick = function () { openPhone(b.getAttribute("data-openphone")); };
  });
  page.querySelectorAll("[data-quick]").forEach(function (b) {
    b.onclick = function () { const k = b.getAttribute("data-quick"); if (k === "phone") openPhone(); else openQuick(k); };
  });
  page.querySelectorAll("[data-ptabgo]").forEach(function (b) { // 미니 스탯 → [선수 정보] 능력 탭 (data-go보다 먼저)
    b.addEventListener("click", function () { playerTab = b.getAttribute("data-ptabgo"); });
  });
  page.querySelectorAll("details[data-dopen]").forEach(function (d) {
    d.addEventListener("toggle", function () { dashOpen[d.getAttribute("data-dopen")] = d.open; });
  });
}
// 폭이 760px을 넘나들면 대시보드를 다시 그림 (PC ↔ 휴대폰 구조)
if (window.matchMedia) {
  const dashMq = window.matchMedia("(max-width: 760px)");
  const dashMqChange = function () { if (state && state.player && state.currentMenu === "dashboard") renderPage(); };
  if (dashMq.addEventListener) dashMq.addEventListener("change", dashMqChange);
}
