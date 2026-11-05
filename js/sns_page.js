// ===== SNS 화면 =====
// 탭: 받은 연락(선택지) / 소식(읽기만) / 선수 SNS(분위기)
// 읽은 메시지는 흐리게, 선택한 메시지는 고른 답을 표시

let snsTab = "inbox";
let openMsgId = null; // 펼쳐 둔 메시지
let deckOpenId = null;  // 223: 휴대폰에서 열어 둔 대화 (null = 대화 목록, 연락이 1개면 바로 그 대화)
let deckLastId = null;  // 받은 연락 카드: 방금 답한 연락 (결과 한 줄)

pages.sns = function () {
  const tabs = [["inbox", "📩 받은 연락"], ["news", "📰 소식"], ["social", "💬 선수 SNS"]];
  const tabHTML = tabs.map(function (t) {
    const n = unreadCount(t[0]);
    return '<button data-snstab="' + t[0] + '"' + (snsTab === t[0] ? ' class="primary"' : "") + ">" + t[1] +
      (n ? ' <span class="badge inline">' + n + "</span>" : "") + "</button>";
  }).join("");

  const list = snsTab === "social" ? socialFeedPosts() : state.inbox.filter(function (m) { return m.tab === snsTab; }); // 234: 선수 SNS 탭에는 😂 해프닝도
  let body;
  if (!list.length && snsTab !== "news") {
    body = '<p class="muted">아직 메시지가 없어요. 주를 진행하면 연락과 소식이 와요.</p>';
  } else if (snsTab === "social") {
    // 231: 휴대폰 SNS 앱과 같은 글 카드 (얼굴·✔ 프로·시간·❤). 이 탭은 글을 전부 보여 주므로 열면 전부 읽음 (bindSns)
    const byName = socialByName();
    body = '<div class="sp-wide">' + list.map(function (m) { return socialPostHTML(m, byName); }).join("") + "</div>";
  } else if (snsTab === "inbox") {
    // 220: 받은 연락 탭은 휴대폰을 화면 맨 위 왼쪽에 (선택지까지 스크롤 없이), 제목·탭·지난 연락은 휴대폰 오른쪽
    const deck = deckMessages();
    const rest = list.filter(function (m) { return deck.indexOf(m) === -1; });
    return '<div class="sns-ib">' +
      '<div class="sns-ib-head">' + pageHeadHTML("sns", "SNS") + '<div class="buttons sns-tabs">' + tabHTML + "</div></div>" +
      phoneScreenHTML(deck) + // 231: 휴대폰 앱 바 (메시지·SNS·알림)
      '<div class="card sns-ib-list">' + inboxListHTML(rest) + "</div>" +
    "</div>";
  } else if (snsTab === "news") {
    body = newsPaperHTML(list); // 206: 주간 신문 (js/news.js) — 신문 기사 보관함도 이 안으로
  } else {
    body = list.map(messageHTML).join("");
  }

  const readAll = snsTab === "news" && unreadCount("news")
    ? '<button data-readall="news">모두 읽음</button>' : "";

  return (
    "<h1>SNS</h1>" +
    '<div class="card"><div class="buttons sns-tabs">' + tabHTML + readAll + // 280: 탭 안내는 탭 줄 끝 ⓘ (받은 연락은 휴대폰 머리의 ⓘ, 209)
        (snsTab === "news" ? helpBtnHTML(HELP_TIPS.snsNews) : snsTab === "inbox" ? "" : helpBtnHTML(HELP_TIPS.snsSocial)) + "</div>" +
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
// 218 (시안 20 가 '메신저 앱'): 휴대폰 몸체(카메라 섬·옆 버튼) + 상태 줄 + 앱 머리(보낸 사람) + 말풍선 + 아래 '답장 고르기' 칸
// 217: 방금 답한 연락은 결과만 따로 보여 주고, [다음 연락 보기]를 눌러야 다음 연락이 나옴
// 223: 연락이 2개 이상이면 휴대폰 첫 화면 = 대화 목록 (몇 개가 와 있는지 한눈에), 계약 제안이 2개 이상이면 맨 위에 비교표.
//      대화를 누르면 열리고 ‹ 로 목록으로. 계약 제안 대화에는 '수락하면 다른 제안 n개는 정리돼요' 경고
function msgDeckHTML(deck) {
  const last = deckLastId !== null ? state.inbox.find(function (m) { return m.id === deckLastId; }) : null;
  const lastOk = last && last.choices && last.answered !== null && last.answered !== "ignored";
  let m = deckOpenId !== null ? deck.find(function (x) { return x.id === deckOpenId; }) : null;
  if (!m) deckOpenId = null;
  if (!m && deck.length === 1) m = deck[0];
  const listView = !lastOk && !m && deck.length > 1;
  const shown = lastOk ? last : m; // 앱 머리에 나오는 연락
  const tipText = MSG_DECK.later + " · " + EVENT_RULES.ignoreAfterWeeks + "주 안에 답하지 않으면 그냥 지나가요. " + MSG_DECK.legend + (phoneOpen ? " · " + PHONE_APPS.swipeHint : "");
  const avHTML = function (x) { return '<span class="ph-av">' + msgAvatar(x).icon + "</span>"; };
  const offers = deck.filter(function (x) { return x.kind === "offer" && x.offer && x.choices; });
  const leftWeeks = function (x) { return Math.max(0, EVENT_RULES.ignoreAfterWeeks - ((state.year - x.year) * CREATION.weeksPerSeason + state.week - x.week)); };
  const inBub = function (x) {
    const av = msgAvatar(x), ch = changesText(x.changes);
    const isOffer = x.kind === "offer" && x.offer; // 220: 계약 제안은 계약 조건 글 + 연봉 계산 내역
    const notes = x.notes && x.notes.length && (!x.choices || isOffer) ? '<div class="msg-notes">' + x.notes.map(escapeHTML).join("<br>") + "</div>" : ""; // 223: 협상 결과도 보이게
    return '<div class="ph-in">' + avHTML(x) + '<div class="ph-bub"><b class="ph-bt">' + escapeHTML(av.title) + "</b>" + escapeHTML(isOffer ? offerText(x.offer) : x.text) +
      (isOffer ? offerBreakdownHTML(x.offer) : "") +
      (!x.choices && ch ? '<div class="log-changes">' + ch + "</div>" : "") + notes + "</div></div>";
  };
  const dateChip = function (x) { return '<span class="ph-date">' + x.year + "년 " + x.week + "주차</span>"; };
  let chat, sheet = "";
  if (listView) {
    // 계약 제안 비교표 (2개 이상일 때)
    const cmp = offers.length > 1 ? '<div class="ph-cmp"><div class="ph-cmp-h">📝 계약 제안 ' + offers.length + "개 · 하나를 수락하면 나머지는 정리돼요</div>" +
      '<table><tr><th>구단</th><th>연봉</th><th>기간</th><th>출전 보장</th></tr>' + offers.map(function (x) {
        const o = x.offer, t = findTeam(o.teamId);
        return '<tr data-deckopen="' + x.id + '"><td><b>' + escapeHTML(t ? t.short : "?") + "</b>" + (o.renewal ? ' <span class="ph-tag">재계약</span>' : "") + "<br><small>" + (t ? nextTierName(t.id) + " · 전력 " + teamStrength(t.id).toFixed(1) : "") + "</small></td>" +
          "<td>" + moneyText(o.salary) + "</td><td>" + (o.loan ? "임대" : o.years + "년") + "</td><td>" + (o.guarantee ? o.guarantee + "경기" : "없음") + "</td></tr>";
      }).join("") + "</table></div>" : "";
    chat = cmp + '<div class="ph-list">' + deck.map(function (x) {
      const isOffer = x.kind === "offer" && x.offer;
      const pre = String(isOffer ? offerText(x.offer) : x.text || "").split("\n")[0];
      const left = leftWeeks(x);
      return '<button class="ph-row' + (x.read ? "" : " new") + '" data-deckopen="' + x.id + '">' + avHTML(x) +
        '<span class="ph-row-t"><b>' + escapeHTML(msgAvatar(x).title) + "</b><span>" + escapeHTML(pre) + "</span></span>" +
        '<span class="ph-row-r">' + (x.choices ? '<span class="ph-due' + (left <= 1 ? " last" : "") + '">' + (left ? left + "주" : "이번 주") + "</span>" : "") + (x.read ? "" : '<i class="ph-dot"></i>') + "</span></button>";
    }).join("") + "</div>";
  } else if (lastOk) {
    const ch = changesText(last.changes);
    chat = dateChip(last) + inBub(last) +
      '<div class="ph-out"><span class="ph-read">읽음</span><div class="ph-me">' + escapeHTML(last.choices[last.answered].label) + "</div></div>" +
      (last.result || ch || (last.notes && last.notes.length) ? '<div class="ph-sys">' + (last.result ? escapeHTML(last.result) : "") + (ch ? '<div class="log-changes">' + ch + "</div>" : "") +
        (last.notes && last.notes.length ? '<div class="msg-notes">' + last.notes.map(escapeHTML).join("<br>") + "</div>" : "") + "</div>" : ""); // 220: 계약 결과(재계약 완료 등)는 notes
    const nx = deck[0];
    sheet = deck.length > 1
      ? '<button class="ph-next" data-decknext="1"><span class="ph-av">💬</span><span class="ph-next-t"><b>대화 목록으로</b><span>남은 연락 ' + deck.length + "개</span></span>▶</button>"
      : nx ? '<button class="ph-next" data-decknext="1">' + avHTML(nx) + '<span class="ph-next-t"><b>다음 연락 보기</b><span>' + escapeHTML(msgAvatar(nx).title) + " (1개 남음)</span></span>▶</button>"
      : '<button class="primary ph-next solo" data-decknext="1">확인</button>';
  } else if (m && !m.choices) { // 210: 일반 연락 — 읽고 [확인]
    const plain = deck.filter(function (x) { return !x.choices; }).length;
    chat = dateChip(m) + inBub(m);
    sheet = '<div class="deck-choices"><button class="primary ph-ok" data-msgok="' + m.id + '">' + MSG_DECK.okLabel + "</button>" +
      (plain > 1 ? '<button class="ph-okall" data-msgok="all">' + MSG_DECK.okAllLabel + " (" + plain + ")</button>" : "") + "</div>";
  } else if (m) {
    m.read = true;
    const left = leftWeeks(m);
    const others = m.kind === "offer" ? offers.filter(function (x) { return x !== m; }).length : 0;
    chat = dateChip(m) + inBub(m) +
      '<div class="ph-time' + (left <= 1 ? " last" : "") + '">⏳ ' + (left ? left + "주 안에 답하기" : "이번 주가 마지막") + "</div>" +
      (others ? '<div class="ph-note warn">⚠️ 다른 계약 제안이 ' + others + "개 더 있어요. 수락하면 나머지는 정리돼요. ‹ 목록에서 비교해 보세요.</div>" : "");
    sheet = '<div class="ph-sh"><span>답장 고르기</span><span>' + m.choices.length + "개</span></div>" +
      '<div class="deck-choices">' + choiceButtonsHTML(m) + "</div>" +
      '<div class="ph-input" aria-hidden="true"><i>＋</i><span>위에서 답장을 골라요</span><i>➤</i></div>';
  } else {
    chat = '<div class="ph-empty"><b>📭</b>' + MSG_DECK.empty + "</div>";
  }
  const sp = !lastOk && state.inbox.find(function (x) { return x.kind === "staffPick" && x.answered === null; });
  if (sp) chat = '<button class="ph-note ph-staff" data-staffopen="' + sp.id + '">' + MSG_DECK.staffNote + "</button>" + chat; // 누르면 지난 연락의 인사 카드로 이동
  const back = !listView && !lastOk && deck.length > 1 ? '<button class="ph-back" data-deckback="1" title="대화 목록">‹</button>' : "";
  const who = listView ? '<span class="ph-who"><b>' + MSG_DECK.phoneTitle + "</b><span>답할 연락 " + deck.length + "개" + (offers.length ? " · 계약 제안 " + offers.length + "개" : "") + "</span></span>"
    : shown ? avHTML(shown) + '<span class="ph-who"><b>' + escapeHTML(msgAvatar(shown).title) + "</b><span>" + (lastOk ? "답장함" : deck.length > 1 ? deck.length + "개 중 " + (deck.indexOf(shown) + 1) + "번째 연락" : MSG_DECK.phoneTitle) + "</span></span>"
    : '<span class="ph-who"><b>' + MSG_DECK.phoneTitle + "</b></span>";
  return '<div class="phone"><i class="ph-island"></i><div class="ph-scr deck">' +
    '<div class="ph-bar"><span>' + state.year + "년 " + state.week + '주차</span><span class="ph-icons"><span class="ph-sig"><i></i><i></i><i></i><i></i></span><span class="ph-bat"></span></span></div>' +
    '<div class="ph-hd">' + back + who + '<span class="tip" tabindex="0" data-tip="' + escapeHTML(tipText) + '">ⓘ</span></div>' +
    '<div class="ph-chat">' + chat + "</div>" +
    (sheet ? '<div class="ph-sheet">' + sheet + "</div>" : "") + phoneDockHTML() + '<div class="ph-home"></div>' +
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
    else if (/↑$/.test(p)) chip("up", p); // 264 의도 힌트
    else if (/↓$/.test(p)) chip("down", p);
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
  page.querySelectorAll("[data-ibf]").forEach(function (btn) {
    btn.onclick = function () { inboxFilter = btn.getAttribute("data-ibf"); renderPage(); };
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
  bindPhoneDeck(page); // 휴대폰 안 버튼 (221: 대시보드 휴대폰 창과 같이 씀)
  const readAll = page.querySelector("[data-readall]");
  if (readAll) readAll.onclick = function () {
    state.inbox.forEach(function (m) { if (m.tab === "news") m.read = true; });
    if (state.settings.autoSave) saveGame();
    renderMenu();
    renderPage();
  };
}

// ----- 휴대폰 버튼 (SNS 화면·휴대폰 창 같이 씀, 221) -----
function bindPhoneDeck(root) {
  root.querySelectorAll("[data-msgok]").forEach(function (btn) { // 210: 일반 연락 확인 → 지난 연락으로
    btn.onclick = function () {
      const v = btn.getAttribute("data-msgok");
      state.inbox.forEach(function (m) { if (m.tab === "inbox" && !m.choices && (v === "all" || m.id === Number(v))) m.read = true; });
      deckLastId = null;
      if (state.settings.autoSave) saveGame();
      renderAll();
    };
  });
  root.querySelectorAll("[data-decknext]").forEach(function (btn) { // 217: 결과를 보고 다음 연락(1개 남음)·대화 목록(2개 이상)으로, 휴대폰 창에서 남은 게 없으면 닫기
    btn.onclick = function () {
      deckLastId = null; deckOpenId = null;
      if (phoneOpen && !deckMessages().length) { closePhone(); return; }
      renderPage();
    };
  });
  root.querySelectorAll("[data-deckopen]").forEach(function (el) { // 223: 대화 목록·비교표에서 열기
    el.onclick = function () { deckOpenId = Number(el.getAttribute("data-deckopen")); deckLastId = null; renderPage(); };
  });
  root.querySelectorAll("[data-staffopen]").forEach(function (btn) { // 인사 후보 카드 연락을 펼치고 그 자리로 (휴대폰 창에서도)
    btn.onclick = function () { openStaffPick(Number(btn.getAttribute("data-staffopen"))); };
  });
  root.querySelectorAll("[data-deckback]").forEach(function (btn) { // 223: ‹ 대화 목록으로
    btn.onclick = function () { deckOpenId = null; deckLastId = null; renderPage(); };
  });
  root.querySelectorAll("[data-answer]").forEach(function (btn) {
    btn.onclick = function () {
      const parts = btn.getAttribute("data-answer").split(":");
      const id = Number(parts[0]);
      if (btn.closest(".deck")) { deckLastId = id; deckOpenId = id; } // 카드에서 답함 → 결과 화면 (217), 협상처럼 답이 안 끝나면 그 대화 그대로 (223)
      answerMessage(id, Number(parts[1]));
      if (state.settings.autoSave) saveGame();
      renderAll();
    };
  });
  bindPhoneApps(root); // 231: 앱 바 · SNS · 알림 · 프로필
}

// 인사 후보 카드 연락 열기: SNS 받은 연락으로 가서 지난 연락 목록의 그 연락을 펼치고, 카드가 보이게 스크롤
function openStaffPick(id) {
  const m = state.inbox.find(function (x) { return x.id === id; });
  if (m) m.read = true;
  openMsgId = id; inboxFilter = "all"; snsTab = "inbox"; deckLastId = null;
  if (phoneOpen) { phoneOpen = false; const ov = document.getElementById("phone-overlay"); if (ov) { ov.hidden = true; ov.innerHTML = ""; } }
  selectMenu("sns");
  const el = document.getElementById("spdeck" + id);
  if (el) el.scrollIntoView({ block: "center" });
}

// ----- 휴대폰 창 (221): 대시보드 등에서 [📱 휴대폰 열기] → SNS 메뉴로 가지 않고 그 자리에서 답하기 -----
// 화면을 다시 그릴 때마다(renderPage 끝) 열려 있으면 다시 그림 → 답하면 결과·다음 연락이 바로 보임
let phoneOpen = false;
function openPhone(app) { // app: "msg"(기본) · "sns" · "noti"(= SNS의 📣 나를 언급) · "me" (231, 237)
  phoneOpen = true; deckOpenId = null; deckLastId = null;
  phoneApp = typeof app === "string" && app ? app : "msg"; phoneFeedPages = 1; phoneSnsFilter = "all";
  if (phoneApp === "noti") { phoneApp = "sns"; phoneSnsFilter = "mention"; }
  renderPhoneOverlay(true);
}
function closePhone() {
  phoneOpen = false; deckLastId = null;
  phoneApp = "msg"; Object.keys(phoneFresh).forEach(function (k) { delete phoneFresh[k]; });
  const el = document.getElementById("phone-overlay");
  if (el) { el.hidden = true; el.innerHTML = ""; }
  renderAll(); // 대시보드 숫자·배지 새로
}
function renderPhoneOverlay(opening) { // opening: 처음 열 때만 떠오르는 움직임 (다시 그릴 때마다 깜빡이지 않게)
  let el = document.getElementById("phone-overlay");
  const layout = document.getElementById("layout");
  if (!phoneOpen || !state.player || !layout || layout.hidden) { if (el) el.hidden = true; return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "phone-overlay";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target === el || e.target.closest("[data-phoneclose]")) closePhone(); });
    el.addEventListener("touchstart", phoneSwipeStart, { passive: true }); // 275: 옆으로 밀어 앱 바꾸기
    el.addEventListener("touchend", phoneSwipeEnd);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && phoneOpen) closePhone(); });
  }
  el.innerHTML = '<div class="po-wrap' + (opening ? " po-anim" : phoneSlide ? " po-slide-" + phoneSlide : "") + '"><button class="po-close" data-phoneclose="1" title="닫기 (Esc)">✕</button>' + phoneScreenHTML(deckMessages()) + "</div>";
  el.hidden = false;
  phoneSlide = "";
  bindPhoneDeck(el);
  linkifyNames(el);
}

// ----- 휴대폰 창 옆으로 밀기 (275, 사용자 요청): 💬 메시지에서 왼쪽으로 밀면 📸 SNS, SNS에서 오른쪽으로 밀면 메시지 (프로필은 SNS로) -----
// 위아래 스크롤로 보이는 밀기(세로가 더 긴 것)와, 옆으로 넘기는 줄(SNS 얼굴 줄·비교표) 안에서 민 것은 무시. 앱 바 버튼과 같은 일만 함
let phoneTouch = null;
let phoneSlide = ""; // 다음에 그릴 때 한 번만 미끄러지는 움직임 ("l" 왼쪽으로 밀었음 · "r" 오른쪽)
function inSideScroll(el) {
  for (; el && el.id !== "phone-overlay"; el = el.parentElement) {
    const o = getComputedStyle(el).overflowX;
    if ((o === "auto" || o === "scroll") && el.scrollWidth > el.clientWidth + 1) return true;
  }
  return false;
}
function phoneSwipeStart(e) {
  if (e.touches.length !== 1) { phoneTouch = null; return; }
  const t = e.touches[0];
  phoneTouch = { x: t.clientX, y: t.clientY, skip: inSideScroll(e.target) };
}
function phoneSwipeEnd(e) {
  const s = phoneTouch; phoneTouch = null;
  if (!s || s.skip || !phoneOpen || !e.changedTouches.length) return;
  const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
  if (Math.abs(dx) < PHONE_APPS.swipeMin || Math.abs(dy) > Math.abs(dx) * 0.6) return;
  const to = dx < 0 ? (phoneApp === "msg" ? "sns" : null) : (phoneApp === "me" ? "sns" : phoneApp === "sns" ? "msg" : null);
  if (!to) return;
  phoneSlide = dx < 0 ? "l" : "r";
  phoneApp = to; phoneFeedPages = 1; phoneSnsFilter = "all"; deckOpenId = null; deckLastId = null;
  phoneRerender(false);
}

// ===== 휴대폰 앱 (231, 시안 24): 아래 앱 바 💬 메시지 · 📸 SNS, SNS 머리의 내 캐릭터 = 내 프로필 =====
// 237: 🔔 알림 앱을 SNS 안 [전체 | 📣 나를 언급] 탭으로 합침
// 글·숫자는 data/ui.js PHONE_APPS. 화면만 바꿈 (선수 SNS 글은 js/events.js가 만드는 그대로)
// 읽음: SNS·프로필에서 화면에 나온 '나를 언급한 글'만 읽음 (예전엔 SNS 탭을 열면 전부), 📣 나를 언급 탭을 열면 언급 전부 읽음
// 하트: 글 번호로 정해지는 화면용 숫자, 누르면 +1 (저장 안 함, 게임 결과와 관계없음)
let phoneApp = "msg";
let phoneFeedPages = 1;     // SNS 피드: 몇 쪽까지 보여 줄지 (한 쪽 = PHONE_APPS.feedPage개)
let phoneSnsFilter = "all"; // SNS 위쪽 탭: "all" 전체 · "mention" 📣 나를 언급 (237)
let phoneFocusId = null;    // 얼굴 줄·알림을 누르면 그 글로 스크롤
let phoneMarked = false;    // 이번에 그리면서 읽음 처리한 글이 있음 → 메뉴 배지 새로
const phoneFresh = {};      // 이번에 열어서 읽은 언급 (휴대폰을 닫을 때까지 '새 알림'으로 표시)
const phoneLikes = {};      // 내가 누른 하트 (저장 안 함)

function phoneScreenHTML(deck) {
  if (phoneApp === "sns") return phoneAppShellHTML(socialFeedHeadHTML(), socialFeedHTML());
  if (phoneApp === "me") return phoneAppShellHTML('<button class="ph-back" data-phoneapp="sns" title="' + PHONE_APPS.snsName + '">‹</button><span class="ph-who"><b>' + PHONE_APPS.meTitle + "</b></span>", socialMeHTML());
  return msgDeckHTML(deck);
}
function phoneAppShellHTML(head, body) {
  return '<div class="phone"><i class="ph-island"></i><div class="ph-scr app">' +
    '<div class="ph-bar"><span>' + state.year + "년 " + state.week + '주차</span><span class="ph-icons"><span class="ph-sig"><i></i><i></i><i></i><i></i></span><span class="ph-bat"></span></span></div>' +
    '<div class="ph-hd">' + head + "</div>" +
    '<div class="ph-feed">' + body + "</div>" + phoneDockHTML() + '<div class="ph-home"></div></div></div>';
}
function phoneDockHTML() {
  const n = { msg: deckMessages().length, sns: unreadCount("social") }; // 237: SNS 배지 = 안 읽은 언급
  return '<div class="ph-dock">' + PHONE_APPS.dock.map(function (d) {
    const on = phoneApp === d[0] || (d[0] === "sns" && phoneApp === "me");
    return '<button class="' + (on ? "on" : "") + '" data-phoneapp="' + d[0] + '"><b>' + d[1] + "</b>" + d[2] + (n[d[0]] ? "<em>" + n[d[0]] + "</em>" : "") + "</button>";
  }).join("") + "</div>";
}

// ----- 선수 SNS 글 -----
function socialPosts() { return state.inbox.filter(function (m) { return m.tab === "social"; }); }
// 예전 글(선수 id 없이 저장됨)은 이름으로 선수인지 찾기
function socialByName() {
  const b = {};
  Object.keys(state.league.players).forEach(function (id) { b["@" + state.league.players[id].name] = id; });
  return b;
}
function socialAbsWeek(m) { return m.year * CREATION.weeksPerSeason + m.week; }
// 글은 지난주(방금 진행한 주) 날짜로 올라옴 → 가장 새 글 = '이번 주'
function socialAgo(m) {
  const d = Math.max(0, state.year * CREATION.weeksPerSeason + state.week - socialAbsWeek(m) - 1);
  return d === 0 ? "이번 주" : d < CREATION.weeksPerSeason ? d + "주 전" : Math.floor(d / CREATION.weeksPerSeason) + "년 전";
}
function socialHeartBase(m, pro) {
  const r = PHONE_APPS.hearts[pro ? "pro" : "fan"];
  return r[0] + pfSeed(m.id + ":" + m.title) % Math.max(1, r[1]);
}
function socialCountText(n) { return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "만" : n.toLocaleString(); }
function socialFaceHTML(m, byName) {
  const proId = m.proId || byName[m.title];
  if (proId && state.league.players[proId]) return portraitImg(proId, { face: true, size: 36 });
  const name = String(m.title || "").replace(/^@/, "");
  return '<span class="sp-ini" style="--h:' + (pfSeed(name) % 360) + '">' + escapeHTML(name.charAt(0)) + "</span>";
}
function socialPostHTML(m, byName) {
  const proId = m.proId || byName[m.title];
  const pro = proId && state.league.players[proId];
  const name = String(m.title || "").replace(/^@/, "");
  const me = escapeHTML(state.player.name);
  const body = escapeHTML(m.text).split(me).join('<b class="sp-me">' + me + "</b>");
  const fresh = !!phoneFresh[m.id] || (m.mention && !m.read);
  const liked = !!phoneLikes[m.id], base = socialHeartBase(m, !!pro);
  return '<div class="sp-post' + (m.mention ? " mention" : "") + (fresh ? " new" : "") + '" data-post="' + m.id + '">' +
    '<div class="sp-hd"><span class="sp-face">' + socialFaceHTML(m, byName) + '</span><span class="sp-who"><b>' + escapeHTML(name) + "</b>" +
      (pro ? ' <i class="sp-vf" title="프로 선수">✔</i>' : "") + "<small>" + (pro ? escapeHTML(proTeamText(pro)) + " · " : "") + socialAgo(m) + "</small></span></div>" +
    '<div class="sp-body">' + body + "</div>" +
    '<div class="sp-act"><button class="sp-heart' + (liked ? " on" : "") + '" data-like="' + m.id + '" data-n="' + base + '"><b>' + (liked ? "♥" : "♡") + "</b><span>" + socialCountText(base + (liked ? 1 : 0)) + "</span></button>" +
      (m.mention ? '<span class="sp-tag">' + PHONE_APPS.mentionTag + "</span>" : "") + (m.mishap ? '<span class="sp-tag mh">' + MISHAP_RULES.tag + "</span>" : "") + "</div></div>";
}
// 화면에 나온 언급은 읽음 (그린 뒤에 표시 → 이번 화면에는 '새' 표시가 남음)
function socialMarkShown(list) {
  list.forEach(function (m) { if (m.mention && !m.read) { m.read = true; phoneFresh[m.id] = true; phoneMarked = true; } });
}

// ----- 📸 SNS 피드 -----
function socialFeedHeadHTML() {
  return '<span class="ph-who"><b class="sp-logo">' + PHONE_APPS.snsName + "</b></span>" +
    '<button class="sp-meb" data-phoneapp="me" title="' + PHONE_APPS.meTitle + '">' + roomFigureHTML(2) + "</button>";
}
function socialFeedHTML() {
  const mentions = socialPosts().filter(function (m) { return m.mention; });
  const unread = mentions.filter(function (m) { return !m.read; }).length;
  const tabs = '<div class="sp-filter"><button class="' + (phoneSnsFilter === "all" ? "on" : "") + '" data-snsfilter="all">' + PHONE_APPS.filterAll + "</button>" +
    '<button class="' + (phoneSnsFilter === "mention" ? "on" : "") + '" data-snsfilter="mention">' + PHONE_APPS.filterMention + (unread ? " <em>" + unread + "</em>" : "") + "</button></div>";
  if (phoneSnsFilter === "mention") { // 237: 예전 🔔 알림 앱 — 나를 언급한 글 전부 (열면 읽음)
    const byName = socialByName();
    const html = tabs + (mentions.length ? mentions.map(function (m) { return socialPostHTML(m, byName); }).join("") : '<div class="ph-empty"><b>📣</b>' + PHONE_APPS.notiEmpty + "</div>");
    socialMarkShown(mentions);
    return html;
  }
  const all = socialFeedPosts(); // 234: 😂 해프닝 섞어서
  if (!all.length) return tabs + '<div class="ph-empty"><b>📸</b>' + PHONE_APPS.feedEmpty + "</div>";
  const byName = socialByName();
  const shown = all.slice(0, PHONE_APPS.feedPage * phoneFeedPages);
  // 맨 위 얼굴 줄: 최근 1주 안에 글을 올린 프로 선수 (누르면 그 글로)
  const now = state.year * CREATION.weeksPerSeason + state.week, seen = {};
  const stories = all.filter(function (m) {
    const id = m.proId || byName[m.title];
    if (!id || !state.league.players[id] || seen[id] || now - socialAbsWeek(m) > 2) return false;
    seen[id] = true; return true;
  }).slice(0, PHONE_APPS.storyMax);
  const storyHTML = stories.length ? '<div class="sp-stories">' + stories.map(function (m) {
    const id = m.proId || byName[m.title];
    return '<button class="sp-story" data-story="' + m.id + '"><span class="sp-ring">' + portraitImg(id, { face: true, size: 36 }) + "</span><span>" + escapeHTML(state.league.players[id].name) + "</span></button>";
  }).join("") + "</div>" : "";
  const html = tabs + storyHTML + shown.map(function (m) { return socialPostHTML(m, byName); }).join("") +
    (all.length > shown.length ? '<button class="sp-more" data-feedmore="1">' + PHONE_APPS.more + " (" + (all.length - shown.length) + ")</button>" : "");
  socialMarkShown(shown);
  return html;
}

// ----- 내 프로필: 방 그림의 작은 내 캐릭터 + 팔로워(= 팬 수) -----
function socialMeHTML() {
  const team = myTeam(), byName = socialByName();
  const mentions = socialPosts().filter(function (m) { return m.mention; }).slice(0, PHONE_APPS.feedPage);
  const html = '<div class="sp-prof"><div class="sp-pa"><span>' + roomFigureHTML(6) + "</span></div>" +
    '<b class="sp-pn">' + escapeHTML(state.player.name) + ' <i class="sp-vf">✔</i></b>' +
    "<small>" + escapeHTML((team ? team.short : "FA") + " · " + findPosition(state.player.position).name + " · " + state.player.age + "세") + "</small>" +
    '<div class="sp-nums"><span><b>' + socialCountText(fansCount()) + "</b>" + PHONE_APPS.followers + "</span>" +
      "<span><b>" + playerScore(USER_ID).toFixed(1) + "</b>종합 능력</span><span><b>" + escapeHTML(fameTier().name) + "</b>스타 등급</span></div></div>" +
    '<div class="sp-sub">' + PHONE_APPS.meMentions + " " + mentions.length + "</div>" +
    (mentions.length ? mentions.map(function (m) { return socialPostHTML(m, byName); }).join("") : '<div class="ph-empty">' + PHONE_APPS.notiEmpty + "</div>");
  socialMarkShown(mentions);
  return html;
}

// ----- 버튼 -----
// 같은 앱 안에서 다시 그릴 때는 피드 스크롤 위치를 그대로 (더 보기 등)
function phoneRerender(keepScroll) {
  const sel = phoneOpen ? "#phone-overlay .ph-feed" : ".ph-feed";
  const box = document.querySelector(sel), top = box ? box.scrollTop : 0;
  renderPage();
  const nb = document.querySelector(sel);
  if (keepScroll && nb) nb.scrollTop = top;
}
function bindPhoneApps(root) {
  root.querySelectorAll("[data-phoneapp]").forEach(function (b) {
    b.onclick = function () { phoneApp = b.getAttribute("data-phoneapp"); phoneFeedPages = 1; phoneSnsFilter = "all"; deckOpenId = null; deckLastId = null; phoneRerender(false); };
  });
  root.querySelectorAll("[data-snsfilter]").forEach(function (b) { // 237: SNS 위쪽 탭
    b.onclick = function () { phoneSnsFilter = b.getAttribute("data-snsfilter"); phoneFeedPages = 1; phoneRerender(false); };
  });
  root.querySelectorAll("[data-like]").forEach(function (b) { // 다시 그리지 않고 그 자리에서 (스크롤이 튀지 않게)
    b.onclick = function () {
      const id = Number(b.getAttribute("data-like")), on = !phoneLikes[id];
      phoneLikes[id] = on;
      b.classList.toggle("on", on);
      b.querySelector("b").textContent = on ? "♥" : "♡";
      b.querySelector("span").textContent = socialCountText(Number(b.getAttribute("data-n")) + (on ? 1 : 0));
    };
  });
  root.querySelectorAll("[data-feedmore]").forEach(function (b) { b.onclick = function () { phoneFeedPages++; phoneRerender(true); }; });
  root.querySelectorAll("[data-story]").forEach(function (b) {
    b.onclick = function () {
      const id = Number(b.getAttribute("data-story"));
      const i = socialFeedPosts().findIndex(function (m) { return m.id === id; });
      phoneApp = "sns"; phoneSnsFilter = "all";
      phoneFeedPages = Math.max(phoneFeedPages, Math.ceil((i + 1) / PHONE_APPS.feedPage));
      phoneFocusId = id;
      phoneRerender(false);
    };
  });
  if (phoneFocusId !== null) {
    const el = root.querySelector('[data-post="' + phoneFocusId + '"]');
    if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("focus"); }
    if (el || phoneApp !== "sns") phoneFocusId = null;
  }
  if (phoneMarked) { phoneMarked = false; renderMenu(); renderMobileNav(); }
}

// ===== 😂 해프닝 (234, data/mishaps.js): 게임 결과·저장과 관계없는 웃긴 사건사고 =====
// 4주 묶음마다 한 번. 어느 주·어느 해프닝인지 = 내 이름 + 묶음 번호로 계산한 고정 번호 (Math.random 안 씀, 저장 안 함 → 다시 열어도 같음)
// 해프닝 목록은 묶음 순서대로 한 바퀴 돌아요 (60개면 60묶음 = 약 4.6년 동안 겹치지 않음). 방 그림 소품은 js/room.js
function mishapGcd(a, b) { return b ? mishapGcd(b, a % b) : a; }
function mishapAt(abs) {
  const R = MISHAP_RULES, n = MISHAPS.length;
  if (!n || !state.player) return null;
  const slot = Math.floor(abs / R.every);
  if (abs % R.every !== pfSeed(state.player.name + "|" + slot) % R.every) return null;
  const step = [7, 11, 13, 17, 19, 23, 29, 31].find(function (k) { return mishapGcd(k, n) === 1; }) || 1;
  return MISHAPS[(slot * step + pfSeed(state.player.name)) % n];
}
// 그 주의 해프닝 글 (글쓴이도 고정 번호로: pro 글이 있으면 절반쯤 다른 팀 프로 선수, 아니면 팬)
function mishapPostOf(abs) {
  const m = mishapAt(abs);
  if (!m) return null;
  const W = CREATION.weeksPerSeason, year = Math.floor((abs - 1) / W), h = pfSeed("mishap|" + state.player.name + "|" + abs);
  let title = "", proId = null, text = m.fan;
  if (m.pro && h % 100 < MISHAP_RULES.proRate * 100) {
    const mine = myTeam() ? myTeam().id : null;
    const ids = Object.keys(state.league.players).filter(function (id) { const t = state.league.players[id].teamId; return t && t !== mine; }).sort();
    if (ids.length) { proId = ids[h % ids.length]; title = "@" + state.league.players[proId].name; text = m.pro; }
  }
  if (!proId) title = "@" + SOCIAL_FAN_NAMES[h % SOCIAL_FAN_NAMES.length] + (1000 + h % 9000);
  return { id: -abs, tab: "social", year: year, week: abs - year * W, title: title, text: fillText(text, {}), proId: proId, mention: false, read: true, mishap: m.id };
}
// SNS 피드 = 저장된 글 + 그 사이 주의 해프닝 (가장 오래된 저장 글 주부터 지난주까지, 같은 주면 해프닝이 위)
function socialFeedPosts() {
  const posts = socialPosts();
  if (!posts.length) return posts;
  const now = absWeek(), oldest = socialAbsWeek(posts[posts.length - 1]), extra = [];
  for (let a = now - 1; a >= oldest; a--) { const p = mishapPostOf(a); if (p) extra.push(p); }
  const out = [];
  let i = 0;
  posts.forEach(function (m) {
    while (i < extra.length && socialAbsWeek(extra[i]) >= socialAbsWeek(m)) out.push(extra[i++]);
    out.push(m);
  });
  return out.concat(extra.slice(i));
}
