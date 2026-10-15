// ===== 뒤집는 카드 (178, 디자인 D4) — 인사 후보 · 대형 신인 · 월드 우승 스킨 =====
// flipCardHTML(o): o = { key(뒤집힌 상태 기억), grade "S"~"D", ticket, backIcon, backLbl, role, isNew, pf(얼굴 HTML), name, eff(HTML), pick(버튼 HTML), flipped }
// bindFlipCards(root): 카드를 누르면 뒤집기 (renderPage에서 부름). 한 번 뒤집은 카드는 다시 그려도 앞면 (FLIPPED, 화면에서만)
const FLIPPED = {};
function flipCardHTML(o) {
  const open = o.flipped || (o.key && FLIPPED[o.key]);
  return '<div class="fcard g-' + (o.grade || "B") + (o.ticket ? " ticket" : "") + (open ? " flip" : "") + (o.cls ? " " + o.cls : "") + '"' + (o.key ? ' data-fkey="' + escapeHTML(o.key) + '"' : "") + '><div class="fc-inner">' +
    '<div class="fc-face fc-back"><div class="fc-q">' + (o.ticket ? "🎫" : o.backIcon || "?") + '</div><div class="fc-lbl">' + escapeHTML(o.backLbl || "") + "</div></div>" +
    '<div class="fc-face fc-front">' + (o.grade ? '<span class="fc-grade">' + o.grade + "</span>" : "") + (o.role ? '<span class="fc-role">' + escapeHTML(o.role) + "</span>" : "") +
      (o.isNew ? '<span class="fc-new">NEW</span>' : "") + (o.pf ? '<div class="fc-pf">' + o.pf + "</div>" : "") +
      '<div class="fc-nm">' + escapeHTML(o.name) + '</div><div class="fc-eff">' + (o.eff || "") + "</div>" + (o.pick || "") + "</div></div></div>";
}
function flipCard(el) {
  if (el.classList.contains("flip")) return;
  el.classList.add("flip");
  const k = el.getAttribute("data-fkey");
  if (k) FLIPPED[k] = true;
  if (el.classList.contains("g-S")) setTimeout(function () { cardSparks(el, 26); }, 450);
  else if (el.classList.contains("g-A")) setTimeout(function () { cardSparks(el, 10, "#2bff9e"); }, 450);
}
function cardSparks(el, n, col) {
  if (motionOff()) return; // 움직임 끄기 (디자인 D6)
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.className = "fc-spark";
    if (col) s.style.background = col;
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
    s.style.setProperty("--dx", Math.cos(a) * d + "px");
    s.style.setProperty("--dy", Math.sin(a) * d + "px");
    el.appendChild(s);
    setTimeout(function () { s.remove(); }, 1000);
  }
}
function bindFlipCards(root) {
  root.querySelectorAll(".fcard").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (e.target.closest("button")) return; // 앞면 버튼은 각자 동작
      flipCard(el);
    });
  });
  root.querySelectorAll("[data-flipall]").forEach(function (b) {
    b.onclick = function () {
      const box = document.getElementById(b.getAttribute("data-flipall"));
      if (box) box.querySelectorAll(".fcard").forEach(function (el, i) { setTimeout(function () { flipCard(el); }, i * 350); });
    };
  });
  // 처음 보는 대형 신인 카드: 차례로 들어오며 뒤집힘
  root.querySelectorAll(".fc-deal").forEach(function (box) {
    box.querySelectorAll(".fcard:not(.flip)").forEach(function (el, i) { setTimeout(function () { flipCard(el); }, 900 + i * 450); });
  });
}

// ----- 스태프 인사 연락 (js/sns_page.js, kind staffPick) -----
function staffPickDeckHTML(m) {
  const p = m.staffPick, t = myTeam();
  const role = staffRole(p.role);
  const uni = t ? uniformOfTeam(t.id) : FREE_AGENT_UNIFORM;
  const cards = p.cands.map(function (c, i) {
    return flipCardHTML({ key: "sp" + m.id + "-" + i, grade: gradeName(c.g), ticket: !!c.ticket, backLbl: c.ticket ? "스카우트 티켓 후보" : role.name + " 후보", role: role.name,
      pf: portraitHTMLFrom(randomLook("staff:" + c.name), uni, { scale: 3 }), name: c.name, eff: escapeHTML(staffEffectText(p.role, c.g)),
      pick: '<button class="fc-pick" data-answer="' + m.id + ":" + i + '">이 사람으로</button>' });
  }).join("");
  const keep = p.cands.length;
  return '<div class="fc-deck" id="spdeck' + m.id + '">' + cards + "</div>" +
    '<div class="fc-ctrl"><button class="primary" data-flipall="spdeck' + m.id + '">모두 뒤집기</button><button data-answer="' + m.id + ":" + keep + '">' + escapeHTML(m.choices[keep].label) + "</button></div>" +
    '<div class="muted small fc-help">카드를 누르면 뒤집혀요. 등급: S 금빛 · A 초록 · B 하늘 · C 회색 · D 붉은빛' + (p.cands.some(function (c) { return c.ticket; }) ? " · 🎫 티켓 카드는 A급 이상" : "") + "</div>";
}

// ----- 대형 신인 카드 (대시보드, 새 시즌 1~4주) -----
const ROOKIE_CARD = { showWeeks: 4, sAbove: 3 }; // S급 = 1부 주전 평균보다 sAbove 이상
function rookieCardsHTML() {
  const R = state.league && state.league.rookieCards;
  if (!R || R.year !== state.year || state.week > ROOKIE_CARD.showWeeks || !R.ids.length) return "";
  const first = !R.seen;
  R.seen = true;
  const cards = R.ids.map(function (id, i) {
    const p = findPlayer(id);
    if (!p) return "";
    const sc = playerScore(id);
    const t = p.teamId ? findTeam(p.teamId) : null;
    return flipCardHTML({ key: "rk" + R.year + "-" + i, flipped: !first, grade: sc >= R.avg + ROOKIE_CARD.sAbove ? "S" : "A", backIcon: "🌟", backLbl: "대형 신인", role: findPosition(p.pos).name, isNew: true,
      pf: portraitImg(id, { scale: 3 }), name: p.name, eff: "종합 능력 <b>" + sc.toFixed(1) + "</b> · " + p.age + "세<br>" + (t ? escapeHTML(t.name) + (t.tier === 1 ? " · 1부 직행" : "") : "FA") });
  }).join("");
  return '<div class="card rookie-card"><h2>🌟 ' + R.year + '년 대형 신인 <span class="muted small">새 시즌 ' + ROOKIE_CARD.showWeeks + "주차까지 보여요 · [선수 검색]에서 🌟</span></h2>" +
    '<div class="fc-deck' + (first ? " fc-deal" : "") + '">' + cards + "</div></div>";
}
