// ===== SNS 화면 =====
// 탭: 받은 연락(선택지) / 소식(읽기만) / 선수 SNS(분위기)
// 읽은 메시지는 흐리게, 선택한 메시지는 고른 답을 표시

let snsTab = "inbox";
let openMsgId = null; // 펼쳐 둔 메시지
let deckIdx = 0;        // 받은 연락 카드: 지금 보는 카드 번호 (197)
let deckLastId = null;  // 받은 연락 카드: 방금 답한 연락 (결과 한 줄)

pages.sns = function () {
  const tabs = [["inbox", "📩 받은 연락"], ["news", "📰 소식"], ["social", "💬 선수 SNS"]];
  const tabHTML = tabs.map(function (t) {
    const n = unreadCount(t[0]);
    return '<button data-snstab="' + t[0] + '"' + (snsTab === t[0] ? ' class="primary"' : "") + ">" + t[1] +
      (n ? ' <span class="badge inline">' + n + "</span>" : "") + "</button>";
  }).join("");

  const list = state.inbox.filter(function (m) { return m.tab === snsTab; });
  let body;
  if (!list.length && snsTab !== "news") {
    body = '<p class="muted">아직 메시지가 없어요. 주를 진행하면 연락과 소식이 와요.</p>';
  } else if (snsTab === "social") {
    // 예전 글(선수 id 없이 저장됨)은 이름으로 선수인지 찾기
    const byName = {};
    Object.keys(state.league.players).forEach(function (id) { byName["@" + state.league.players[id].name] = id; });
    body = list.map(function (m) {
      const fresh = m.mention && !m.read;
      const proId = m.proId || byName[m.title];
      const pro = proId && state.league.players[proId];
      return '<div class="post' + (m.mention ? " mention" : "") + (fresh ? " unread" : "") + (pro ? " has-face" : "") + '">' +
        (pro ? '<span class="post-face">' + portraitImg(proId, { face: true, size: 36 }) + "</span>" : "") +
        (fresh ? '<span class="dot"></span>' : "") +
        '<span class="post-author' + (pro ? " pro" : "") + '">' + escapeHTML(m.title) + "</span>" +
        (pro ? ' <span class="pro-tag">🎮 선수</span> <span class="muted small">' + escapeHTML(proTeamText(pro)) + "</span>" : "") +
        ' <span class="muted small">' +
        m.year + "년 " + m.week + "주차</span>" +
        (m.mention ? ' <span class="mention-tag">📣 나를 언급</span>' : "") +
        "<div>" + escapeHTML(m.text) + "</div></div>";
    }).join("");
  } else if (snsTab === "inbox") {
    // 197 (시안 13 P1): 답장 대기 연락은 맨 위 카드로, 나머지는 '지난 연락' 목록
    const deck = deckMessages();
    const rest = list.filter(function (m) { return deck.indexOf(m) === -1; });
    body = '<div class="inbox-split">' + msgDeckHTML(deck) + inboxListHTML(rest) + "</div>"; // 209: 휴대폰 + 지난 연락
  } else if (snsTab === "news") {
    body = newsPaperHTML(list); // 206: 주간 신문 (js/news.js) — 신문 기사 보관함도 이 안으로
  } else {
    body = list.map(messageHTML).join("");
  }

  const readAll = snsTab === "news" && unreadCount("news")
    ? '<button data-readall="news">모두 읽음</button>' : "";

  return (
    "<h1>SNS</h1>" +
    '<div class="card"><div class="buttons sns-tabs">' + tabHTML + readAll + "</div>" +
      '<p class="muted small">' +
        (snsTab === "inbox" ? "" // 209: 안내는 휴대폰 머리의 ⓘ
          : snsTab === "news" ? "한 주에 신문 한 부. 위 날짜를 눌러 지난 호를 볼 수 있어요."
          : "선수와 팬들의 글이에요. 🎮 선수 = 리그 프로 선수의 글, 📣 = 내 선수를 언급한 글 (보면 읽음 처리).") +
      "</p>" +
      '<div class="messages">' + body + "</div>" +
    "</div>"
  );
};

// 선수 SNS 글쓴이가 프로 선수일 때: "T1 · 미드" (팀이 없으면 "FA")
function proTeamText(p) {
  const t = p.teamId && findTeam(p.teamId);
  return (t ? t.short : "FA") + " · " + findPosition(p.pos).name;
}

// 메시지 하나 (받은 연락·소식)
function messageHTML(m) {
  const waiting = m.choices && m.answered === null;
  const unread = !m.read || waiting;
  const open = openMsgId === m.id;
  let status = "";
  if (waiting) status = '<span class="status wait">답장 대기</span>';
  else if (m.answered === "ignored") status = '<span class="status">지나감</span>';
  else if (m.choices) status = '<span class="status done">답함</span>';
  else if (m.read) status = '<span class="status">읽음</span>';

  let inner = "";
  if (open) {
    // 계약 제안: 기본은 계약·연봉만, 연봉 계산 내역은 접는 칸 (js/contracts.js)
    const text = m.kind === "offer" && m.offer ? offerText(m.offer) : m.text;
    inner += '<div class="msg-text">' + escapeHTML(text) + "</div>";
    if (m.kind === "offer" && m.offer) inner += '<div class="msg-text">' + offerBreakdownHTML(m.offer) + "</div>";
    if (waiting && m.kind === "staffPick" && m.staffPick) inner += staffPickDeckHTML(m); // 인사 후보 카드 뒤집기 (js/ui.js)
    else if (waiting) {
      inner += '<div class="msg-choices">' + choiceButtonsHTML(m) + "</div>";
    } else if (m.choices && m.answered !== "ignored") {
      inner += '<div class="msg-answer">선택: <b>' + escapeHTML(m.choices[m.answered].label) + "</b></div>";
      if (m.result) inner += '<div class="msg-result">' + escapeHTML(m.result) + "</div>"; // 결과 이야기 (js/events.js answerMessage)
    }
    const changes = changesText(m.changes);
    if (changes) inner += '<div class="log-changes">' + changes + "</div>";
    if (m.notes && m.notes.length) inner += '<div class="msg-notes">' + m.notes.map(escapeHTML).join("<br>") + "</div>";
  }

  // 디자인 D5: 왼쪽 아이콘(제목 앞 그림 글자 또는 선수 얼굴) + 제목 + 첫 줄 미리보기
  const av = msgAvatar(m);
  const answeredLabel = m.choices && typeof m.answered === "number" && m.choices[m.answered] ? "↳ " + m.choices[m.answered].label : ""; // 209: 답한 연락은 고른 답을 미리보기로
  const preview = open ? "" : answeredLabel || String(m.kind === "offer" && m.offer ? offerText(m.offer) : m.text || "").split("\n")[0];
  return (
    '<div class="msg' + (unread ? " unread" : " read") + (open ? " open" : "") + '">' +
      '<div class="msg-head" data-msg="' + m.id + '">' +
        '<span class="msg-av">' + av.icon + "</span>" +
        '<span class="msg-tt"><span class="msg-title">' + (unread ? '<span class="dot"></span>' : "") + escapeHTML(av.title) + "</span>" +
          (preview ? '<span class="msg-pre">' + escapeHTML(preview) + "</span>" : "") + "</span>" +
        '<span class="msg-when"><span class="muted small">' + m.year + "년 " + m.week + "주차</span>" + status + "</span>" +
      "</div>" + inner +
    "</div>"
  );
}

// ----- 받은 연락 카드 (197, 시안 13 P1: PC = 카드 왼쪽·버튼 오른쪽, 휴대폰 = 카드 아래 세로 버튼) -----
function deckMessages() {
  return state.inbox.filter(function (m) {
    if (m.tab !== "inbox") return false;
    if (!m.choices) return !m.read; // 210: 선택지 없는 연락도 안 읽었으면 휴대폰으로 → [확인]하면 지난 연락으로
    return m.answered === null && MSG_DECK.skipKinds.indexOf(m.kind) === -1;
  }).sort(function (a, b) { return a.id - b.id; }); // 오래된(곧 지나가는) 연락부터
}

// 209 (시안 16 A안): 왼쪽 '내 휴대폰' = 답장 대기 연락을 대화처럼 하나씩, 오른쪽 = 끝난 연락 한 줄 목록
function msgDeckHTML(deck) {
  const last = deckLastId !== null ? state.inbox.find(function (m) { return m.id === deckLastId; }) : null;
  const lastHTML = last && last.choices && last.answered !== null && last.answered !== "ignored"
    ? '<div class="ph-me">' + escapeHTML(last.choices[last.answered].label) + "</div>" +
      (last.result || changesText(last.changes) ? '<div class="ph-bub res">' + (last.result ? escapeHTML(last.result) : "") + (changesText(last.changes) ? '<div class="log-changes">' + changesText(last.changes) + "</div>" : "") + "</div>" : "")
    : "";
  if (deckIdx >= deck.length) deckIdx = Math.max(0, deck.length - 1);
  if (deckIdx < 0) deckIdx = 0;
  const m = deck[deckIdx];
  const nav = deck.length > 1 ? '<button data-deck="-1"' + (deckIdx === 0 ? " disabled" : "") + '>◀</button><span>' + (deckIdx + 1) + " / " + deck.length + '</span><button data-deck="1"' + (deckIdx === deck.length - 1 ? " disabled" : "") + ">▶</button>" : (deck.length ? "<span>1 / 1</span>" : "");
  const tipText = MSG_DECK.later + " · " + EVENT_RULES.ignoreAfterWeeks + "주 안에 답하지 않으면 그냥 지나가요. " + MSG_DECK.legend;
  let chat;
  if (m && !m.choices) { // 210: 일반 연락 — 읽고 [확인]
    const av = msgAvatar(m);
    const plain = deck.filter(function (x) { return !x.choices; }).length;
    const ch = changesText(m.changes);
    chat = lastHTML +
      '<div class="ph-bub"><div class="ph-bt"><span class="ph-ic">' + av.icon + "</span><b>" + escapeHTML(av.title) + "</b></div>" + escapeHTML(m.text) +
        (ch ? '<div class="log-changes">' + ch + "</div>" : "") + (m.notes && m.notes.length ? '<div class="msg-notes">' + m.notes.map(escapeHTML).join("<br>") + "</div>" : "") + "</div>" +
      '<div class="deck-choices"><button class="primary ph-ok" data-msgok="' + m.id + '">' + MSG_DECK.okLabel + "</button>" +
        (plain > 1 ? '<button class="ph-okall" data-msgok="all">' + MSG_DECK.okAllLabel + " (" + plain + ")</button>" : "") + "</div>";
  } else if (m) {
    m.read = true;
    const av = msgAvatar(m);
    const age = (state.year - m.year) * CREATION.weeksPerSeason + state.week - m.week;
    const left = Math.max(0, EVENT_RULES.ignoreAfterWeeks - age);
    chat = lastHTML +
      '<div class="ph-bub"><div class="ph-bt"><span class="ph-ic">' + av.icon + "</span><b>" + escapeHTML(av.title) + "</b></div>" + escapeHTML(m.text) + "</div>" + // 아이콘은 말풍선 제목 줄 안 (왼쪽 빈 칸 없음)
      '<div class="ph-time' + (left <= 1 ? " last" : "") + '">⏳ ' + (left ? left + "주 안에 답하기" : "이번 주가 마지막") + "</div>" +
      '<div class="deck-choices">' + choiceButtonsHTML(m) + "</div>";
  } else {
    chat = lastHTML + '<div class="ph-empty"><b>📭</b>' + MSG_DECK.empty + "</div>";
  }
  const dots = deck.length > 1 ? '<div class="ph-dots">' + deck.map(function (x, i) { return "<i" + (i === deckIdx ? ' class="on"' : "") + "></i>"; }).join("") + "</div>" : "";
  return '<div class="phone"><div class="ph-scr">' +
    '<div class="ph-bar"><span>' + state.year + "년 " + state.week + "주차</span><span>📶 🔋</span></div>" +
    '<div class="ph-hd">💬 <b>' + MSG_DECK.phoneTitle + '</b> <span class="tip" tabindex="0" data-tip="' + escapeHTML(tipText) + '">ⓘ</span><span class="ph-nav">' + nav + "</span></div>" +
    '<div class="ph-chat deck">' + chat + "</div>" + dots + '<div class="ph-home"></div>' +
  "</div></div>";
}

// 오른쪽 지난 연락: 거르기 + 한 줄 목록 (계약 제안처럼 휴대폰에 안 나오는 답장 대기 연락은 맨 위)
let inboxFilter = "all";
function inboxListHTML(rest) {
  const isQuest = function (m) { return /새 퀘스트|퀘스트/.test(m.title || ""); };
  const F = {
    all: function () { return true; },
    done: function (m) { return m.choices && m.answered !== null && m.answered !== "ignored"; },
    quest: isQuest,
    missed: function (m) { return m.answered === "ignored"; },
  };
  const waitN = rest.filter(function (m) { return m.choices && m.answered === null; }).length;
  const shown = rest.filter(F[inboxFilter] || F.all).sort(function (a, b) {
    return ((b.choices && b.answered === null) - (a.choices && a.answered === null)) || b.id - a.id;
  });
  const chips = MSG_DECK.filters.map(function (f) {
    const n = rest.filter(F[f[0]]).length;
    return '<button class="ib-f' + (inboxFilter === f[0] ? " on" : "") + '" data-ibf="' + f[0] + '">' + f[1] + " " + n + "</button>";
  }).join("");
  return '<div class="inbox-list"><div class="ib-hd"><b>📂 ' + MSG_DECK.pastTitle + '</b> <span class="muted small">' + rest.length + "개" + (waitN ? ' · <span class="up">답장 대기 ' + waitN + "</span>" : "") + "</span></div>" +
    '<div class="ib-filters">' + chips + "</div>" +
    (shown.length ? shown.map(messageHTML).join("") : '<p class="muted">해당하는 연락이 없어요.</p>') + "</div>";
}

// 선택 버튼 (카드·목록 같이 씀): 버튼 + 아래 작은 글씨(🎲 확률 · ⚠️ 위험 · 💚 극복 · 자금 부족)
// 205 (시안 14 A안): 한 줄 = [얼굴] 선택 글 + 설명 줄 + 오른쪽 색 칩 (관계·확률·돈·위험), 전부 버튼 안
function choiceButtonsHTML(m) {
  return m.choices.map(function (c, i) {
    const poor = choiceTooExpensive(m, i);
    const h = choiceHintParts([c.hint, poor ? "자금이 부족해요" : ""].filter(Boolean).join(" · "));
    const o = m.kind === "friend" && m.friend && m.friend.opts && m.friend.opts[i];
    const face = o && o.pid && state.league.players[o.pid] ? portraitImg(o.pid, { face: true, size: 40 }) : "";
    return '<button class="ch-row' + (face ? " has-face" : "") + '" data-answer="' + m.id + ":" + i + '"' + (poor ? " disabled" : "") + ">" +
      (face ? '<span class="ch-face">' + face + "</span>" : "") +
      '<span class="ch-main"><b>' + escapeHTML(c.label) + "</b>" + (h.sub.length ? '<span class="ch-sub">' + escapeHTML(h.sub.join(" · ")) + "</span>" : "") + "</span>" +
      (h.chips.length ? '<span class="ch-chips">' + h.chips.join("") + "</span>" : "") + "</button>";
  }).join("");
}
// 설명 글(예: "팀 동료 · T1 원딜 · 지금 관계 56 (절친) · 관계 +10 · 🎲 성공 확률 95% (체력)")을 설명 줄과 칩으로 나눔. 예전 세이브의 글도 그대로 읽음
function choiceHintParts(hint) {
  const sub = [], chips = [];
  const chip = function (cls, text) { chips.push('<span class="ch-chip ' + cls + '">' + escapeHTML(text) + "</span>"); };
  String(hint || "").split(" · ").forEach(function (p) {
    let x;
    if (!p) return;
    if ((x = /^지금 관계 (-?\d+) \((.+)\)$/.exec(p))) chip(x[2] === "절친" ? "best" : "", x[2] + " " + x[1]);
    else if (/^관계 \+/.test(p) || /^자금 \+/.test(p) || /^(💚|✨|성공하면 ✨)/.test(p) || /회복$/.test(p)) chip("up", p);
    else if (/^관계 [−-]/.test(p) || /^자금 [−-]/.test(p) || p === "자금이 부족해요" || /^(⚠️|실패하면 ⚠️)/.test(p)) chip("down", p.replace(/^자금 /, ""));
    else if ((x = /^🎲 성공 확률 (\d+%) \((.+)\)$/.exec(p))) chip("dice", "🎲 " + x[1] + " (" + x[2] + ")");
    else if (/^실패하면 /.test(p)) chip("", p.replace(/^실패하면 /, "실패 시 "));
    else sub.push(p);
  });
  return { sub: sub, chips: chips };
}

// 메시지 아이콘: 선수 글이면 얼굴, 제목이 그림 글자로 시작하면 그 글자 (제목에서는 뺌)
function msgAvatar(m) {
  if (m.proId && state.league.players[m.proId]) return { icon: portraitImg(m.proId, { face: true, size: 36 }), title: m.title };
  const hit = /^(\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)\s*/u.exec(m.title || "");
  if (hit) return { icon: hit[1], title: m.title.slice(hit[0].length) };
  return { icon: m.kind === "offer" ? "📩" : m.tab === "news" ? "📰" : "✉️", title: m.title };
}

// SNS 화면 버튼 연결 (main.js의 renderPage에서 부름)
function bindSns(page) {
  // 선수 SNS 탭을 보면 멘션 알림은 읽음 처리 (이번 화면에서는 새 글 표시가 그대로 보임)
  if (snsTab === "social" && unreadCount("social")) {
    state.inbox.forEach(function (m) { if (m.tab === "social") m.read = true; });
    renderMenu();
  }
  if (snsTab === "news" && markEditionRead()) renderMenu(); // 206: 보고 있는 호는 읽음 (화면의 새 소식 점은 그대로)
  page.querySelectorAll("[data-edition]").forEach(function (btn) {
    btn.onclick = function () { newsEdition = btn.getAttribute("data-edition"); newsEditionAt = state.year + "-" + state.week; renderPage(); };
  });
  page.querySelectorAll("[data-snstab]").forEach(function (btn) {
    btn.onclick = function () { snsTab = btn.getAttribute("data-snstab"); openMsgId = null; deckLastId = null; newsEdition = null; selectMenu("sns"); }; // 210: 소식 탭은 늘 최신 호부터
  });
  page.querySelectorAll("[data-msgok]").forEach(function (btn) { // 210: 일반 연락 확인 → 지난 연락으로
    btn.onclick = function () {
      const v = btn.getAttribute("data-msgok");
      state.inbox.forEach(function (m) { if (m.tab === "inbox" && !m.choices && (v === "all" || m.id === Number(v))) m.read = true; });
      deckLastId = null;
      if (state.settings.autoSave) saveGame();
      renderAll();
    };
  });
  page.querySelectorAll("[data-ibf]").forEach(function (btn) {
    btn.onclick = function () { inboxFilter = btn.getAttribute("data-ibf"); renderPage(); };
  });
  page.querySelectorAll("[data-deck]").forEach(function (btn) {
    btn.onclick = function () { deckIdx += Number(btn.getAttribute("data-deck")); deckLastId = null; renderPage(); };
  });
  page.querySelectorAll("[data-msg]").forEach(function (el) {
    el.onclick = function () {
      const id = Number(el.getAttribute("data-msg"));
      const m = state.inbox.find(function (x) { return x.id === id; });
      openMsgId = openMsgId === id ? null : id;
      if (m) m.read = true; // 펼치면 읽음
      if (state.settings.autoSave) saveGame();
      renderMenu();
      renderPage();
    };
  });
  page.querySelectorAll("[data-answer]").forEach(function (btn) {
    btn.onclick = function () {
      const parts = btn.getAttribute("data-answer").split(":");
      if (btn.closest(".deck")) deckLastId = Number(parts[0]); // 카드에서 답함 → 결과 한 줄 + 다음 카드 (197)
      answerMessage(Number(parts[0]), Number(parts[1]));
      if (state.settings.autoSave) saveGame();
      renderAll();
    };
  });
  const readAll = page.querySelector("[data-readall]");
  if (readAll) readAll.onclick = function () {
    state.inbox.forEach(function (m) { if (m.tab === "news") m.read = true; });
    if (state.settings.autoSave) saveGame();
    renderMenu();
    renderPage();
  };
}
