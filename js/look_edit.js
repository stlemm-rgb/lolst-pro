// ===== 내 캐릭터 얼굴 바꾸기 (184) — 대시보드 내 선수 그림 ✏️ · 설정 및 저장 =====
// 파츠 목록은 js/creation.js LOOK_FIELDS, 그림은 js/portrait.js
let lookDraft = null; // 고치는 중인 얼굴 (저장 전)

// 세이브에서 읽은 얼굴 검사: 이상한 값이면 null (js/save.js)
function cleanLook(L) {
  if (!L || typeof L !== "object") return null;
  const P = PORTRAIT;
  const okN = function (v, n) { return Number.isInteger(v) && v >= 0 && v < n; };
  if (!okN(L.skin, P.skins.length) || !okN(L.hairC, P.hairColors.length) || !okN(L.hs, P.hairStyles.length) || !okN(L.eyes, P.eyes.length) || !okN(L.face, P.faces.length)) return null;
  return { skin: L.skin, hairC: L.hairC, hs: L.hs, eyes: L.eyes, face: L.face, headset: !!L.headset, glasses: !!L.glasses };
}

function lookEditorHTML(inModal) {
  if (!lookDraft) lookDraft = Object.assign({}, lookOf(USER_ID));
  const L = lookDraft;
  const changed = JSON.stringify(L) !== JSON.stringify(lookOf(USER_ID));
  const rows = LOOK_FIELDS.map(function (f) {
    const v = typeof L[f.key] === "boolean" ? (L[f.key] ? 1 : 0) : L[f.key];
    return '<div class="look-row"><span>' + f.name + '</span><button data-elook="' + f.key + '" data-d="-1">◀</button><div class="look-val">' + escapeHTML(f.list()[v]) +
      '</div><button data-elook="' + f.key + '" data-d="1">▶</button></div>';
  }).join("");
  const uni = uniformOfTeam(teamIdOfPlayer(USER_ID));
  return '<div class="look-edit">' +
    '<div class="look-edit-pf"><span class="pf-frame">' + portraitHTMLFrom(L, uni, { scale: 3, mood: "normal" }) + "</span>" + // 웃는 표정이면 눈 모양이 안 보여서 보통 표정으로
      '<span class="muted small">' + (changed ? "바꾼 얼굴 미리보기" : "지금 얼굴") + "</span></div>" +
    '<div class="look-edit-r"><div class="look-rows">' + rows + "</div>" +
      '<div class="buttons"><button data-elookrand="1">🎲 무작위</button>' +
      '<button class="primary" data-elooksave="1"' + (changed ? "" : " disabled") + ">✔ 이 얼굴로 바꾸기</button>" +
      (changed || inModal ? '<button data-elookcancel="1">' + (inModal ? "닫기" : "되돌리기") + "</button>" : "") + "</div>" +
      '<p class="muted small">유니폼 색은 소속팀 색이라 바꿀 수 없어요. 얼굴은 기록·능력에 영향이 없어요.</p></div>' +
  "</div>";
}

// 대시보드 ✏️ → 창으로 열기
function openLookEditor() {
  lookDraft = Object.assign({}, lookOf(USER_ID));
  let el = document.getElementById("look-overlay");
  if (!el) {
    el = document.createElement("div"); el.id = "look-overlay"; document.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target === el) closeLookEditor(); });
  }
  el.hidden = false;
  drawLookEditor();
}
function closeLookEditor() {
  const el = document.getElementById("look-overlay");
  if (el) { el.hidden = true; el.innerHTML = ""; }
  lookDraft = null;
}
function drawLookEditor() {
  const el = document.getElementById("look-overlay");
  if (el && !el.hidden) { el.innerHTML = '<div class="look-box"><h2>✏️ 내 캐릭터 얼굴 바꾸기</h2>' + lookEditorHTML(true) + "</div>"; return; }
  const box = document.getElementById("look-settings"); // 설정 및 저장 화면
  if (box) box.innerHTML = lookEditorHTML(false);
}

// 버튼은 한 곳에서 처리 (창·설정 화면 모두)
document.addEventListener("click", function (e) {
  const t = e.target.closest ? e.target.closest("[data-elook],[data-elookrand],[data-elooksave],[data-elookcancel],[data-elookopen]") : null;
  if (!t || typeof state === "undefined" || !state.player) return;
  if (t.hasAttribute("data-elookopen")) { e.preventDefault(); openLookEditor(); return; }
  if (!lookDraft) lookDraft = Object.assign({}, lookOf(USER_ID));
  if (t.hasAttribute("data-elook")) changeLook(lookDraft, t.getAttribute("data-elook"), Number(t.getAttribute("data-d")));
  else if (t.hasAttribute("data-elookrand")) lookDraft = randomLook();
  else if (t.hasAttribute("data-elookcancel")) {
    const modal = document.getElementById("look-overlay");
    if (modal && !modal.hidden) { closeLookEditor(); return; }
    lookDraft = Object.assign({}, lookOf(USER_ID));
  } else if (t.hasAttribute("data-elooksave")) {
    state.player.look = cleanLook(lookDraft) || state.player.look;
    lookDraft = null;
    closeLookEditor();
    if (state.settings && state.settings.autoSave) saveGame(); // 바로 저장 (자동 저장을 켠 경우)
    state.notice = "얼굴을 바꿨어요." + (state.settings && state.settings.autoSave ? " (저장됨)" : " [설정 및 저장]에서 저장해 주세요.");
    renderAll();
    return;
  }
  drawLookEditor();
});
document.addEventListener("keydown", function (e) {
  const el = document.getElementById("look-overlay");
  if (e.key === "Escape" && el && !el.hidden) closeLookEditor();
});
