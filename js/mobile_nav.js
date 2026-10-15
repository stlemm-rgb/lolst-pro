// ===== 휴대폰 아래 탭 + 진행 막대 (197, 시안 12 A1) =====
// 휴대폰 폭(760px 이하)에서만 보임 (css 23부분). PC는 왼쪽 메뉴·위쪽 버튼 그대로.
//   진행 막대: [▶ 다음 주 · n주차 진행 · 경기 k · 시즌 n/52] + [💤 휴식]  → advanceWeek (js/main.js)
//   아래 탭: 대시보드 · 훈련 · SNS · ☰ 전체(아래에서 올라오는 메뉴판)
// 화면만 바꿈: 게임 결과 그대로 (Math.random 안 씀). 값·문구는 data/ui.js MOBILE_NAV
let mnavSheetOpen = false;

function renderMobileNav() {
  let el = document.getElementById("mnav");
  if (!el) {
    el = document.createElement("div");
    el.id = "mnav";
    document.body.appendChild(el);
    el.addEventListener("click", onMobileNavClick);
  }
  const layout = document.getElementById("layout");
  el.hidden = !state.player || state.retired || !layout || layout.hidden;
  document.body.classList.toggle("has-mnav", !el.hidden); // 휴대폰: 아래 탭 높이만큼 본문 아래 여백 (css)
  if (el.hidden) return;
  const week = state.week, total = CREATION.weeksPerSeason;
  const mine = myTeam();
  const games = mine ? seasonOf().matches.filter(function (m) { return m.week === week && !m.winner && (m.a === mine.id || m.b === mine.id); }).length : 0;
  const low = state.stamina < TIRED_LIMIT;
  const cur = currentMenuParent();
  const tabs = MOBILE_NAV.tabs.map(function (t) {
    const on = t.id === "more" ? mnavSheetOpen : !mnavSheetOpen && cur === t.id;
    const badge = t.id === "sns" ? unreadCount("inbox") + unreadCount("social") : 0;
    return '<button class="mnav-tab' + (on ? " on" : "") + '" data-mnav="' + t.id + '">' + (badge ? '<span class="mnav-badge">' + badge + "</span>" : "") +
      '<span class="mnav-ic">' + t.icon + "</span>" + t.name + "</button>";
  }).join("");
  el.innerHTML = (mnavSheetOpen ? mobileSheetHTML() : "") +
    '<div class="mnav-bar' + (low ? " low" : "") + '">' +
      '<button class="mnav-go" data-mnav="go"><span class="mnav-big">' + MOBILE_NAV.goText + '</span><span class="mnav-sub">' + week + "주차 진행" + (games ? " · 경기 " + games : "") + (low ? " · 체력 낮음" : "") + "</span></button>" +
      '<span class="mnav-season">시즌 ' + week + "/" + total + '<span class="mnav-track"><i style="width:' + Math.round(week / total * 100) + '%"></i></span></span>' +
      '<button class="mnav-rest" data-mnav="rest">' + MOBILE_NAV.restText + "</button>" +
    "</div>" +
    '<div class="mnav-tabs">' + tabs + "</div>";
}

// 지금 화면이 속한 메뉴 (합친 메뉴의 탭이면 부모 id)
function currentMenuParent() {
  const m = MENUS.find(function (x) { return x.id === state.currentMenu; });
  return m && m.parent ? m.parent : state.currentMenu;
}

function mobileSheetHTML() {
  const icon = function (id) { return MOBILE_NAV.sheetIcons[id] || (PAGE_HEADS[id] ? PAGE_HEADS[id].icon : "•"); };
  const item = function (it) {
    return '<button class="mnav-item' + (currentMenuParent() === it.id ? " on" : "") + '" data-mnav-go="' + it.id + '"><span class="mnav-ic">' + icon(it.id) + "</span>" + escapeHTML(it.name.replace(/^[^\s가-힣A-Za-z]+\s*/, "")) + "</button>";
  };
  return '<div class="mnav-dim" data-mnav="close"></div><div class="mnav-sheet">' +
    MENU_GROUPS.map(function (g) { return '<div class="mnav-gt">' + escapeHTML(g.title) + '</div><div class="mnav-grid">' + g.items.map(item).join("") + "</div>"; }).join("") +
    '<div class="mnav-gt">그 밖</div><div class="mnav-grid">' + MENU_BOTTOM.map(item).join("") + "</div></div>";
}

function onMobileNavClick(e) {
  const go = e.target.closest ? e.target.closest("[data-mnav-go]") : null;
  if (go) { mnavSheetOpen = false; selectMenu(go.getAttribute("data-mnav-go")); window.scrollTo(0, 0); return; }
  const b = e.target.closest ? e.target.closest("[data-mnav]") : null;
  if (!b) return;
  const id = b.getAttribute("data-mnav");
  if (id === "go" || id === "rest") { mnavSheetOpen = false; advanceWeek(id === "rest"); return; }
  if (id === "more") { mnavSheetOpen = !mnavSheetOpen; renderMobileNav(); return; }
  if (id === "close") { mnavSheetOpen = false; renderMobileNav(); return; }
  mnavSheetOpen = false;
  selectMenu(id);
  window.scrollTo(0, 0);
}
