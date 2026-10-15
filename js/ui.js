// ===== js/ui.js — 화면 공통: 뒤집는 카드·페이지 머리·팀 배지·움직임 설정 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 js/cards.js) ━━━━━
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
    const a = fxRandom() * Math.PI * 2, d = 60 + fxRandom() * 90;
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

// ━━━━━ (예전 js/pagehead.js) ━━━━━
// ===== D5 화면 통일 (179): 페이지 머리 · 팀 배지 · 순위 메달 · 최근 승패 =====
// 설명·아이콘은 data/ui.js

// 페이지 머리 오른쪽 요약 숫자: [작은 글씨, 큰 글씨] (없으면 null)
const PAGE_HEAD_SIDE = {
  training: function () { return ["체력", state.stamina + " / " + state.staminaMax]; },
  sns: function () { const n = unreadCount("inbox") + unreadCount("news") + unreadCount("social"); return n ? ["안 읽음", n + "개"] : null; },
  career: function () { return ["종합 능력", playerScore(USER_ID).toFixed(1)]; },
  shop: function () { return ["💰 자금", moneyText(state.money)]; },
  team: function () { return ["팀 내 입지", String(standingValue())]; },
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
function pwBarHTML(frac, text) { // (이름 주의: miniBarHTML은 대시보드 막대 — js/dashboard.js)
  const p = Math.max(0, Math.min(100, Math.round(frac * 100)));
  return '<span class="pwbar"><span class="pwbar-in"><span style="width:' + p + '%"></span></span>' + (text !== undefined ? "<small>" + text + "</small>" : "") + "</span>";
}
// 빈 칸 상자
function emptyBoxHTML(icon, text) {
  return '<div class="empty-box"><span class="e">' + icon + "</span>" + text + "</div>";
}

// ===== D6 움직임 켜기·끄기 (180) =====
// 끄면: 포트레잇 점프, 카드 뒤집기·반짝임, 경기 재생 배너·꽃가루, 신문 팝업 등장 등 모든 CSS 애니메이션 없음 (경기 재생 자체는 그대로)
function motionOff() { return !!(typeof state !== "undefined" && state && state.settings && state.settings.motion === "off"); }
function applyMotion() { if (document.documentElement) document.documentElement.classList.toggle("no-motion", motionOff()); }
function motionSettingHTML() {
  const off = motionOff();
  return '<div class="setting-row">움직임 <select id="motion-set"><option value="on"' + (off ? "" : " selected") + '>켜기</option><option value="off"' + (off ? " selected" : "") + ">끄기</option></select>" +
    ' <span class="muted small">끄면 포트레잇 점프·카드 뒤집기·반짝임·꽃가루 같은 움직임이 없어져요 (느린 기기나 어지러울 때)</span></div>';
}
function bindMotionSetting(page) {
  const sel = page.querySelector("#motion-set");
  if (sel) sel.onchange = function () { state.settings.motion = sel.value; applyMotion(); showNotice("움직임: " + (sel.value === "off" ? "끄기" : "켜기")); };
}
