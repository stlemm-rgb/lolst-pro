// ===== D5 화면 통일 (179): 페이지 머리 · 팀 배지 · 순위 메달 · 최근 승패 =====
// 설명·아이콘은 data/pagehead.js

// 페이지 머리 오른쪽 요약 숫자: [작은 글씨, 큰 글씨] (없으면 null)
const PAGE_HEAD_SIDE = {
  training: function () { return ["체력", state.stamina + " / " + state.staminaMax]; },
  sns: function () { const n = unreadCount("inbox") + unreadCount("news") + unreadCount("social"); return n ? ["안 읽음", n + "개"] : null; },
  career: function () { return ["종합 능력", playerScore(USER_ID).toFixed(1)]; },
  shop: function () { return ["💰 자금", moneyText(state.money)]; },
  team: function () { return typeof standingValue === "function" ? ["팀 내 입지", String(standingValue())] : null; },
  calendar: function () { return ["지금", state.week + "주차"]; },
  standings: function () { const r = myLeagueRank(); return r ? ["우리 팀", r + "위"] : null; },
  achievements: function () { return ["달성", achDoneCount() + " / " + ACHIEVEMENTS.length]; },
  market: function () { return state.contract ? ["내 연봉", moneyText(state.contract.salary)] : null; },
  records: function () { const n = (state.career.awards || []).length; return n ? ["내 수상", n + "회"] : null; },
};

function pageHeadHTML(key, title) {
  const h = PAGE_HEADS[key];
  if (!h) return "<h1>" + title + "</h1>";
  let side = null;
  try { side = PAGE_HEAD_SIDE[key] ? PAGE_HEAD_SIDE[key]() : null; } catch (e) { side = null; }
  return '<div class="pgh"><div class="pgh-ic">' + h.icon + '</div><div class="pgh-t"><h1>' + title + "</h1><p>" + h.desc + "</p></div>" +
    (side ? '<div class="pgh-side">' + side[0] + "<b>" + side[1] + "</b></div>" : "") + "</div>";
}
// renderPage에서: 맨 앞 <h1>제목</h1>을 페이지 머리로 바꾸기
function applyPageHead(html, key) {
  return html.replace(/^(\s*)<h1>([\s\S]*?)<\/h1>/, function (all, sp, title) { return sp + pageHeadHTML(key, title); });
}

// 우리 팀 리그 순위 (1부는 정규 시즌 합산, 2부는 2부 합산)
function myLeagueRank() {
  const t = myTeam();
  if (!t) return 0;
  if (t.tier === 1) return tier1FinalOrder().indexOf(t.id) + 1;
  return standings(["tier2", "tier2b"], tier2Ids()).map(function (r) { return r.id; }).indexOf(t.id) + 1;
}

// 팀 배지: 유니폼 2색 네모 + 이름 (국내·해외 모두)
function teamMarkHTML(teamId, label) {
  const u = uniformOfTeam(teamId);
  return '<span class="tmark"><i style="background:linear-gradient(135deg,' + u[0] + " 55%," + u[1] + ' 55%)"></i>' + (label !== undefined ? label : escapeHTML(teamName(teamId))) + "</span>";
}
// 이름으로 팀 찾기 (기록에 이름만 남은 경우)
function teamIdByName(name) {
  const t = state.league.teams.find(function (x) { return x.name === name; });
  return t ? t.id : null;
}
// 순위 메달: 1·2·3위 금·은·동, hi = 강조(하늘)
function rankBadgeHTML(n, hi) {
  return '<span class="rk' + (n <= 3 ? " g" + n : hi ? " hi" : "") + '">' + n + "</span>";
}
// 최근 승패 칸 (list: "w"/"l" 배열, 오래된 것 → 최근)
function recentWLHTML(list) {
  if (!list || !list.length) return '<span class="muted small">-</span>';
  return '<span class="wl5">' + list.slice(-5).map(function (r) { return '<i class="' + r + '">' + (r === "w" ? "승" : "패") + "</i>"; }).join("") + "</span>";
}
// 작은 막대 (0~1)
function miniBarHTML(frac, text) {
  const p = Math.max(0, Math.min(100, Math.round(frac * 100)));
  return '<span class="pwbar"><span class="pwbar-in"><span style="width:' + p + '%"></span></span>' + (text !== undefined ? "<small>" + text + "</small>" : "") + "</span>";
}
// 빈 칸 상자
function emptyBoxHTML(icon, text) {
  return '<div class="empty-box"><span class="e">' + icon + "</span>" + text + "</div>";
}
