// ===== 화면 이동 편의 (285, 사용자 선택 1·3·6·7) — 글: data/ui.js NAV_TEXT =====
// 1) 휴대폰·브라우저 '뒤로 가기': 설명 창 → 휴대폰 메뉴 → 열린 창(Esc와 같은 동작) → 이전 화면 → 대시보드 순서로 처리.
//    대시보드에서 더 누르면 "한 번 더 누르면 나가요" 안내 (그다음 뒤로 가기는 브라우저 그대로 = 사이트를 나감)
//    방법: 화면을 누를 때 history에 빈 칸 하나를 넣어 두고(navArm), 뒤로 가기(popstate)로 그 칸이 빠지면 처리 뒤 다시 넣음
// 3) 맨 위로 ▲ 버튼: 많이 내려갔을 때만 보임
// 6) 탭이 있는 화면(일정·순위·이적 시장·수집·기록실)을 손가락으로 좌우로 밀면 옆 탭 (화면 가장자리·옆으로 넘기는 칸 안은 무시)
// 7) 마지막에 본 화면: 브라우저에 따로 기억(세이브와 별개) → 다시 들어오면 그 화면부터
// 모두 화면용 (게임 값·난수 안 건드림)
const NAV_LAST_KEY = "challenger-last-menu";
let navStack = [], navArmed = false, navBacking = false;

function navArm() {
  if (navArmed || !window.history || !history.pushState) return;
  try { history.pushState({ cr: 1 }, ""); navArmed = true; } catch (e) { /* file:// 등에서 막히면 그냥 브라우저 기본 */ }
}
// selectMenu에서 부름: 이전 화면 쌓기 + 마지막 화면 기억
function navRemember(prev, next) {
  if (!navBacking && prev && prev !== next) { navStack.push(prev); if (navStack.length > 30) navStack.shift(); }
  try { localStorage.setItem(NAV_LAST_KEY, next); } catch (e) { /* 저장 공간이 막혀도 게임은 그대로 */ }
}
// 7) start.js에서 처음 그리기 전에
function navRestoreLast() {
  if (!state.player || state.retired) return;
  let id = null;
  try { id = localStorage.getItem(NAV_LAST_KEY); } catch (e) { return; }
  if (id && MENUS.some(function (m) { return m.id === id; })) state.currentMenu = id;
}
function navGo(id) { navBacking = true; selectMenu(id); navBacking = false; window.scrollTo(0, 0); }
function navBack() {
  const lay = document.getElementById("layout");
  if (!state.player || state.retired || !lay || lay.hidden) return false; // 캐릭터 만들기 화면은 브라우저 그대로
  if (helpFor) { hideHelp(); return true; }
  if (lay.classList.contains("menu-open")) { lay.classList.remove("menu-open"); return true; }
  if (popupOpen()) { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return true; }
  while (navStack.length) { const id = navStack.pop(); if (id !== state.currentMenu) { navGo(id); return true; } }
  if (state.currentMenu !== "dashboard") { navGo("dashboard"); return true; }
  return false;
}
window.addEventListener("popstate", function () {
  navArmed = false;
  if (navBack()) navArm(); else showNotice(NAV_TEXT.exitHint);
});
// 사용자가 화면을 누를 때 빈 칸을 넣음 (누르기 없이 넣은 칸은 브라우저가 건너뛸 수 있어서)
document.addEventListener("click", navArm, true);
document.addEventListener("touchend", navArm, true);

// ----- 3) 맨 위로 -----
let navTopBtn = null;
function navTopUpdate() {
  const lay = document.getElementById("layout");
  const show = !!(state && state.player && lay && !lay.hidden && window.scrollY > NAV_TEXT.topFrom && !popupOpen());
  if (!navTopBtn) {
    if (!show) return;
    navTopBtn = document.createElement("button");
    navTopBtn.id = "to-top"; navTopBtn.type = "button"; navTopBtn.textContent = "▲";
    navTopBtn.setAttribute("aria-label", NAV_TEXT.toTop); navTopBtn.title = NAV_TEXT.toTop;
    navTopBtn.onclick = function () { window.scrollTo({ top: 0, behavior: motionOff() ? "auto" : "smooth" }); };
    document.body.appendChild(navTopBtn);
  }
  navTopBtn.classList.toggle("show", show);
}
window.addEventListener("scroll", navTopUpdate, { passive: true });

// ----- 6) 탭 화면 옆으로 밀기 -----
function navTabParent() {
  for (let g = 0; g < MENU_GROUPS.length; g++) for (let i = 0; i < MENU_GROUPS[g].items.length; i++) {
    const it = MENU_GROUPS[g].items[i];
    if (it.tabs && it.tabs.some(function (t) { return t.id === state.currentMenu; })) return it;
  }
  return null;
}
let navTouch = null;
document.addEventListener("touchstart", function (e) {
  navTouch = null;
  if (e.touches.length !== 1 || !state || !state.player || popupOpen() || !navTabParent()) return;
  const t = e.touches[0], el = e.target;
  if (!el || !el.closest || !el.closest("#page") || el.closest("input, textarea, select")) return;
  if (t.clientX < NAV_TEXT.edge || t.clientX > window.innerWidth - NAV_TEXT.edge) return; // 화면 가장자리 = 아이폰 뒤로 가기 동작
  if (inSideScroll(el)) return; // 옆으로 넘기는 표·칩 줄 (js/sns_page.js)
  navTouch = { x: t.clientX, y: t.clientY };
}, { passive: true });
document.addEventListener("touchend", function (e) {
  const s = navTouch; navTouch = null;
  if (!s || !e.changedTouches.length) return;
  const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
  if (Math.abs(dx) < PHONE_APPS.swipeMin || Math.abs(dy) > Math.abs(dx) * 0.6) return;
  const parent = navTabParent();
  if (!parent) return;
  const ids = parent.tabs.map(function (x) { return x.id; }), i = ids.indexOf(state.currentMenu);
  const j = dx < 0 ? i + 1 : i - 1;
  if (j < 0 || j >= ids.length) return;
  selectMenu(ids[j]);
  window.scrollTo(0, 0);
});
