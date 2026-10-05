// ===== SNS 화면 =====
// 탭: 받은 연락(선택지) / 소식(읽기만) / 선수 SNS(분위기)
// 읽은 메시지는 흐리게, 선택한 메시지는 고른 답을 표시

let snsTab = "inbox";
let openMsgId = null; // 펼쳐 둔 메시지

pages.sns = function () {
  const tabs = [["inbox", "📩 받은 연락"], ["news", "📰 소식"], ["social", "💬 선수 SNS"]];
  const tabHTML = tabs.map(function (t) {
    const n = t[0] === "social" ? 0 : unreadCount(t[0]);
    return '<button data-snstab="' + t[0] + '"' + (snsTab === t[0] ? ' class="primary"' : "") + ">" + t[1] +
      (n ? ' <span class="badge inline">' + n + "</span>" : "") + "</button>";
  }).join("");

  const list = state.inbox.filter(function (m) { return m.tab === snsTab; });
  let body;
  if (!list.length) {
    body = '<p class="muted">아직 메시지가 없어요. 주를 진행하면 연락과 소식이 와요.</p>';
  } else if (snsTab === "social") {
    body = list.map(function (m) {
      return '<div class="post"><span class="post-author">' + escapeHTML(m.title) + '</span> <span class="muted small">' +
        m.year + "년 " + m.week + "주차</span><div>" + escapeHTML(m.text) + "</div></div>";
    }).join("");
  } else {
    body = list.map(messageHTML).join("");
  }

  const readAll = snsTab === "news" && unreadCount("news")
    ? '<button data-readall="news">모두 읽음</button>' : "";

  return (
    "<h1>SNS</h1>" +
    '<div class="card"><div class="buttons sns-tabs">' + tabHTML + readAll + "</div>" +
      '<p class="muted small">' +
        (snsTab === "inbox" ? "선택지가 있는 연락이에요. " + EVENT_RULES.ignoreAfterWeeks + "주 안에 답하지 않으면 그냥 지나가요. ⚠️는 낮은 확률로 나쁜 특성, 💚는 나쁜 특성 극복이에요."
          : snsTab === "news" ? "기사와 커뮤니티 소식이에요. 읽기만 하면 돼요."
          : "선수와 팬들의 글이에요.") +
      "</p>" +
      '<div class="messages">' + body + "</div>" +
    "</div>"
  );
};

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
    inner += '<div class="msg-text">' + escapeHTML(m.text) + "</div>";
    if (waiting) {
      inner += '<div class="msg-choices">' + m.choices.map(function (c, i) {
        const poor = choiceTooExpensive(m, i);
        const hint = [c.hint, poor ? "자금이 부족해요" : ""].filter(Boolean).join(" · ");
        return '<button data-answer="' + m.id + ":" + i + '"' + (poor ? " disabled" : "") + ">" + escapeHTML(c.label) + "</button>" +
          (hint ? '<div class="hint">' + escapeHTML(hint) + "</div>" : "");
      }).join("") + "</div>";
    } else if (m.choices && m.answered !== "ignored") {
      inner += '<div class="msg-answer">선택: <b>' + escapeHTML(m.choices[m.answered].label) + "</b></div>";
    }
    const changes = changesText(m.changes);
    if (changes) inner += '<div class="log-changes">' + changes + "</div>";
    if (m.notes && m.notes.length) inner += '<div class="msg-notes">' + m.notes.map(escapeHTML).join("<br>") + "</div>";
  }

  return (
    '<div class="msg' + (unread ? " unread" : " read") + (open ? " open" : "") + '">' +
      '<div class="msg-head" data-msg="' + m.id + '">' +
        (unread ? '<span class="dot"></span>' : "") +
        '<span class="msg-title">' + escapeHTML(m.title) + "</span>" +
        '<span class="muted small">' + m.year + "년 " + m.week + "주차</span>" + status +
      "</div>" + inner +
    "</div>"
  );
}

// SNS 화면 버튼 연결 (main.js의 renderPage에서 부름)
function bindSns(page) {
  page.querySelectorAll("[data-snstab]").forEach(function (btn) {
    btn.onclick = function () { snsTab = btn.getAttribute("data-snstab"); openMsgId = null; renderPage(); };
  });
  page.querySelectorAll("[data-msg]").forEach(function (el) {
    el.onclick = function () {
      const id = Number(el.getAttribute("data-msg"));
      const m = state.inbox.find(function (x) { return x.id === id; });
      openMsgId = openMsgId === id ? null : id;
      if (m) m.read = true; // 펼치면 읽음
      renderMenu();
      renderPage();
    };
  });
  page.querySelectorAll("[data-answer]").forEach(function (btn) {
    btn.onclick = function () {
      const parts = btn.getAttribute("data-answer").split(":");
      answerMessage(Number(parts[0]), Number(parts[1]));
      if (state.settings.autoSave) saveGame();
      renderAll();
    };
  });
  const readAll = page.querySelector("[data-readall]");
  if (readAll) readAll.onclick = function () {
    state.inbox.forEach(function (m) { if (m.tab === "news") m.read = true; });
    renderMenu();
    renderPage();
  };
}
