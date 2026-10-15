// ===== 단축키 (198) =====
// Space 다음 주 · F 휴식 주 · D 대시보드 · S SNS · T 훈련 · / 목록 (199 사용자 지정) · 요약 창 확인 A(ㅁ) = js/dash_plus.js
// 키 목록은 data/ui.js SHORTCUTS. 자판 자리(e.code)로 봐서 한글 입력 상태에서도 됨.
// 안 먹는 때: 글자 입력 칸·선택 상자에 있을 때, Ctrl/Alt/⌘를 같이 누를 때, 키를 누르고 있을 때(반복), 창(요약·재생·신문·대성공·얼굴·확인)이 열려 있을 때
// 설정에서 끌 수 있음 (state.settings.shortcuts === false)
function shortcutsOn() { return !state.settings || state.settings.shortcuts !== false; }

function popupOpen() {
  return ["ws-overlay", "replay-overlay", "news-popup", "gs-overlay", "look-overlay", "confirm-box", "sc-help"].some(function (id) {
    const el = document.getElementById(id);
    return el && !el.hidden && getComputedStyle(el).display !== "none"; // 창은 position: fixed라 offsetParent로는 못 봄
  });
}

document.addEventListener("keydown", function (e) {
  if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || !shortcutsOn()) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const layout = document.getElementById("layout");
  if (!state.player || state.retired || !layout || layout.hidden) return;
  const sc = SHORTCUTS.find(function (s) { return s.code === e.code; });
  if (!sc) return;
  if (sc.act === "help") { e.preventDefault(); toggleShortcutHelp(); return; }
  if (popupOpen()) return;
  e.preventDefault(); // Space: 화면 스크롤·눌려 있는 버튼 클릭 막기
  if (t && t.blur && t !== document.body) t.blur();
  if (sc.act === "next") advanceWeek(false);
  else if (sc.act === "rest") advanceWeek(true);
  else if (sc.act.indexOf("go:") === 0) { selectMenu(sc.act.slice(3)); window.scrollTo(0, 0); }
});

// ? : 단축키 목록 창 (다시 누르거나 Esc·바깥을 누르면 닫힘)
function toggleShortcutHelp() {
  let el = document.getElementById("sc-help");
  if (el && !el.hidden) { el.hidden = true; return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "sc-help";
    document.body.appendChild(el);
    el.onclick = function (e) { if (e.target === el || e.target.closest("[data-sc-close]")) el.hidden = true; };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.hidden) el.hidden = true; });
  }
  el.innerHTML = '<div class="sc-box" role="dialog" aria-label="단축키"><h2>⌨️ 단축키</h2>' + shortcutTableHTML() +
    '<p class="muted small">Space를 누르면 화면이 내려가는 대신 다음 주로 진행해요. 한글 자판 상태여도 같은 자리 키면 돼요. 글자 칸에 쓰는 중이거나 창이 열려 있으면 안 먹어요. [설정]에서 끌 수 있어요.</p>' +
    '<button class="primary" data-sc-close="1">닫기</button></div>';
  el.hidden = false;
}

function shortcutTableHTML() {
  const row = function (k, n) { return "<tr><td><kbd>" + escapeHTML(k) + "</kbd></td><td>" + escapeHTML(n) + "</td></tr>"; };
  return '<table class="sc-table">' + SHORTCUTS.map(function (s) { return row(s.key, s.name); }).join("") +
    SHORTCUT_POPUP_KEYS.map(function (s) { return row(s.key, s.name); }).join("") + "</table>";
}

// [설정] 줄
function shortcutSettingHTML() {
  return '<div class="setting-row">⌨️ 단축키 (Space 다음 주 · F 휴식 · D·S·T 화면 · / 목록) <select id="sc-setting"><option value="on"' + (shortcutsOn() ? " selected" : "") +
    '>켜기</option><option value="off"' + (shortcutsOn() ? "" : " selected") + '>끄기</option></select> <button class="small-btn" data-sc-open="1">목록 보기</button></div>';
}
function bindShortcutSetting(page) {
  const s = page.querySelector("#sc-setting");
  if (s) s.onchange = function () { state.settings.shortcuts = this.value === "on"; showNotice("단축키: " + (this.value === "on" ? "켜기" : "끄기")); };
  const b = page.querySelector("[data-sc-open]");
  if (b) b.onclick = toggleShortcutHelp;
}

// 버튼 말풍선에 붙일 키 글자: "다음 주로 진행 (N)"
function shortcutKeyOf(act) {
  const s = SHORTCUTS.find(function (x) { return x.act === act; });
  return s && shortcutsOn() ? s.key : "";
}
