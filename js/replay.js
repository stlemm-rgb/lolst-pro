// ===== 경기 다시 보기 · 자동 재생 (177, 디자인 D3) — 값은 data/replay.js =====
// openReplay(keys) : 경기 key 목록을 차례로 재생 (화면 위에 덮는 창 #replay-overlay)
// afterWeekReplay() : [다음 주로 진행]·[휴식 주] 버튼 뒤 (js/main.js advanceWeek) — 이번 주 내 경기를 설정대로 자동 재생
// 측정 도구·자동 진행은 nextWeek만 불러서 재생 창이 안 뜸
let RP = null; // 재생 상태 (화면에서만, 저장 안 함)

function replayAutoSetting() { return (state.settings && state.settings.replayAuto) || REPLAY_RULES.defaultAuto; }
function replaySpeedSetting() { const s = state.settings && state.settings.replaySpeed; return REPLAY_RULES.speeds.indexOf(s) !== -1 ? s : REPLAY_RULES.defaultSpeed; }
function isReplayBig(m) {
  return m.label.indexOf("결승") !== -1 || !!bigGameOf(m.a, m.b);
}

function afterWeekReplay() {
  const list = replayQueue();
  if (list.length) openReplay(list);
}
// 진행 직후 자동으로 재생할 경기 (이번 주 요약 창 버튼 글자도 이걸로, js/dash_plus.js)
function replayQueue() {
  const mode = replayAutoSetting();
  const r = state.weekReport;
  if (mode === "off" || !r) return [];
  const keys = (r.userLines || []).concat(r.teamLines || []).map(function (l) { return l.matchKey; }).filter(function (k, i, a) { return k && a.indexOf(k) === i; });
  return keys.filter(function (k) { const m = findMatchByKey(k); return m && m.detail && (mode === "all" || isReplayBig(m)); });
}

// ----- 창 열기·닫기 -----
function openReplay(keys) {
  const list = (Array.isArray(keys) ? keys : [keys]).filter(function (k) { const m = findMatchByKey(k); return m && m.detail && m.detail.sets && m.detail.sets.length; });
  if (!list.length) return;
  let el = document.getElementById("replay-overlay");
  if (!el) { el = document.createElement("div"); el.id = "replay-overlay"; document.body.appendChild(el); }
  RP = { queue: list, qi: 0, setIdx: 0, t: 0, playing: false, speed: replaySpeedSetting(), last: 0, shown: 0 };
  el.hidden = false;
  if (!el._esc) { el._esc = true; document.addEventListener("keydown", function (e) { if (e.key === "Escape" && RP) closeReplay(); }); }
  startReplayMatch();
}
function closeReplay() {
  if (RP) RP.playing = false;
  RP = null;
  const el = document.getElementById("replay-overlay");
  if (el) { el.hidden = true; el.innerHTML = ""; }
}
function rpMatch() { return findMatchByKey(RP.queue[RP.qi]); }
function rpSet() { return rpMatch().detail.sets[RP.setIdx]; }
function rpEvents(s) { return (s.ev || []).filter(function (e) { return e.e.indexOf("auto:") !== 0; }); } // 세트 뒤 심리 변화는 빼기

function startReplayMatch() {
  const m = rpMatch();
  RP.setIdx = 0; RP.t = 0; RP.shown = 0; RP.playing = false;
  document.getElementById("replay-overlay").innerHTML = replayShellHTML(m);
  bindReplay();
  drawReplay(true);
  if (isReplayBig(m)) replayBanner(replayIntroHTML(m), "", function () { hideReplayBanner(); replayPlay(true); });
  else replayPlay(true);
}

// ----- 화면 틀 -----
function rpUni(u) { return '<span class="uni-sw"><i style="background:' + u[0] + '"></i><i style="background:' + u[1] + '"></i></span>'; }
function replayShellHTML(m) {
  const mine = myTeam();
  const mid = function (side) { const l = m.detail.sets[0].lanes[2]; return side === 0 ? l.a : l.b; };
  const pf = function (side) {
    const id = mid(side), team = side === 0 ? m.a : m.b;
    return '<span class="pf-frame">' + (id ? portraitImg(id, { scale: 2, teamId: team }) : portraitHTMLFrom(randomLook(team), uniformOfTeam(team), { scale: 2 })) + "</span>";
  };
  const tm = function (side) {
    const id = side === 0 ? m.a : m.b;
    return '<div class="rp-tm' + (side ? " b" : "") + '">' + pf(side) + '<div><div class="rp-nm">' + (side ? "" : rpUni(uniformOfTeam(id)) + " ") + escapeHTML(teamName(id)) + (side ? " " + rpUni(uniformOfTeam(id)) : "") + "</div>" +
      (mine && id === mine.id ? '<div class="rp-mine">우리 팀</div>' : "") + "</div></div>";
  };
  const speeds = REPLAY_RULES.speeds.map(function (s) { return '<button data-rpsp="' + s + '"' + (s === RP.speed ? ' class="on"' : "") + ">" + s + "배</button>"; }).join("");
  return '<div class="rp-box">' +
    '<div class="rp-board">' + tm(0) + '<div class="rp-score"><div class="muted small">' + escapeHTML(m.label) + " · " + m.bo + "판 " + Math.ceil(m.bo / 2) + '선승' +
      (RP.queue.length > 1 ? " · 이번 주 " + (RP.qi + 1) + "/" + RP.queue.length + "경기" : "") + '</div><div class="rp-big" id="rp-score">0 : 0</div></div>' + tm(1) +
      '<button class="rp-close" data-rpclose="1" title="닫기">✕</button></div>' +
    '<div class="rp-setbar" id="rp-setbar"></div>' +
    '<div class="rp-stage"><div>' +
      '<div class="rp-map" id="rp-map"></div>' +
      '<div class="rp-mom"><div class="rp-mom-bar"><i id="rp-mom"></i><b></b></div><div class="rp-mom-lbl"><span>' + escapeHTML(teamShort(m.a)) + '</span><span>경기 흐름</span><span>' + escapeHTML(teamShort(m.b)) + "</span></div></div>" +
      '<div class="rp-tl" id="rp-tl"><div class="rp-fill" id="rp-fill"></div><div class="rp-head" id="rp-head"></div></div>' +
      '<div class="rp-ctrl"><button class="primary" data-rpplay="1" id="rp-play">▶ 재생</button>' + speeds + '<button data-rpskip="1">⏭ 결과 보기</button></div>' +
    '</div><div class="rp-side"><div class="rp-lanes" id="rp-lanes"></div><div class="rp-feed" id="rp-feed"></div></div></div>' +
    '<div class="rp-hint muted small">' + escapeHTML(REPLAY_TEXTS.hint) + "</div>" +
    '<div class="rp-banner" id="rp-banner" hidden></div>' +
  "</div>";
}
// 미니맵: 강·라인·포탑·본진·바론·용 + 정글 캠프 (정글 삼각형마다 위아래 끝에 1개씩, 사용자 요청)
const REPLAY_MAP_SVG = '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0f2219"/>' +
  '<path d="M0 100 L100 0" stroke="#163b55" stroke-width="16" opacity=".55"/>' +
  '<path d="M10 92 L10 10 L92 10" stroke="#3b4a3a" stroke-width="5" fill="none"/><path d="M8 90 L90 8" stroke="#3b4a3a" stroke-width="5"/><path d="M10 90 L90 90 L90 10" stroke="#3b4a3a" stroke-width="5" fill="none"/>' +
  [[62, 23], [23, 62], [77, 38], [38, 77]].map(function (p) { return '<g transform="translate(' + p[0] + " " + p[1] + ')"><circle r="3.2" fill="#2d3b26" stroke="#8fbf6a" stroke-width=".8"/><circle cx="-1" cy="-.6" r=".7" fill="#cfe8a8"/><circle cx="1" cy="-.6" r=".7" fill="#cfe8a8"/></g>'; }).join("") +
  '<circle cx="34" cy="31" r="4" fill="#4a2b6b"/><circle cx="67" cy="70" r="4" fill="#5a3a1a"/>' +
  '<rect x="2" y="84" width="14" height="14" rx="3" fill="#0a3a5a" stroke="#00e0ff"/><rect x="84" y="2" width="14" height="14" rx="3" fill="#5a0a22" stroke="#ff3d71"/>' +
  [[10, 60, 0], [10, 35, 1], [40, 10, 1], [65, 10, 1], [30, 70, 0], [70, 30, 1], [40, 90, 0], [65, 90, 0], [90, 60, 1], [90, 35, 1]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="' + (p[2] ? "#ff3d71" : "#00e0ff") + '" opacity=".8"/>'; }).join("") +
  '<text x="34" y="25" font-size="4" fill="#b98bff" text-anchor="middle">바론</text><text x="67" y="79" font-size="4" fill="#ffb26b" text-anchor="middle">용</text></svg>';

function rpJit(n) { const x = Math.sin(n * 999) * 10000; return x - Math.floor(x); }
function rpPos(e, i) {
  const j = function (r) { return (rpJit(i * 7 + r) - 0.5) * 12; };
  if (/dragon|elder|soul/.test(e.e)) return [67 + j(1) / 3, 70 + j(2) / 3];
  if (/baron|herald/.test(e.e)) return [34 + j(1) / 3, 31 + j(2) / 3];
  const info = matchEventInfo(e) || {};
  if (info.cat === "fight") return [50 + j(1) * 1.5, 50 + j(2) * 1.5];
  const push = e.s === 0 ? -1 : 1;
  if (e.pp === "top") return [14 + j(1) / 2, 30 - push * 8 + j(2)];
  if (e.pp === "mid") return [50 + push * 6 + j(1) / 2, 50 - push * 6 + j(2) / 2];
  if (e.pp === "adc" || e.pp === "support") return [70 + push * 8 + j(1), 86 + j(2) / 2];
  if (e.pp === "jungle") return e.s === 0 ? [62 + j(1), 38 + j(2)] : [36 + j(1), 64 + j(2)];
  return [50 + j(1), 50 + j(2)];
}
function rpName(m) { return function (id, side, pos) { return id ? "<b" + (id === USER_ID ? ' class="my-team"' : "") + ">" + escapeHTML(playerName(id)) + "</b>" : escapeHTML(teamShort(side === 0 ? m.a : m.b)) + " " + findPosition(pos).name; }; }

// ----- 그리기 -----
function rpWins(upto) { const w = [0, 0]; rpMatch().detail.sets.slice(0, upto).forEach(function (s) { w[s.w]++; }); return w; }
function drawReplay(reset) {
  if (!RP) return;
  const m = rpMatch(), s = rpSet(), min = s.box.min;
  if (reset) {
    document.getElementById("rp-map").innerHTML = REPLAY_MAP_SVG;
    document.getElementById("rp-feed").innerHTML = "";
    RP.shown = 0;
    const tl = document.getElementById("rp-tl");
    tl.querySelectorAll(".rp-tick").forEach(function (x) { x.remove(); });
    rpEvents(s).forEach(function (e) {
      const info = matchEventInfo(e) || {};
      const x = document.createElement("i");
      x.className = "rp-tick " + ((e.k === "bad" ? 1 - e.s : e.s) ? "b" : "a") + (info.size === "l" ? " big" : "");
      x.style.left = Math.min(100, e.t / min * 100) + "%";
      tl.appendChild(x);
    });
  }
  const evs = rpEvents(s), done = evs.filter(function (e) { return e.t <= RP.t; });
  if (RP.shown > done.length) { document.getElementById("rp-map").innerHTML = REPLAY_MAP_SVG; document.getElementById("rp-feed").innerHTML = ""; RP.shown = 0; }
  for (let i = RP.shown; i < done.length; i++) rpAddEvent(m, done[i], i);
  RP.shown = done.length;
  let mom = 0;
  done.forEach(function (e) { mom += e.s === 0 ? e.x : -e.x; });
  document.getElementById("rp-mom").style.width = (50 + Math.max(-1, Math.min(1, mom / REPLAY_RULES.momentumScale)) * 50) + "%";
  const pct = Math.min(100, RP.t / min * 100);
  document.getElementById("rp-fill").style.width = pct + "%";
  document.getElementById("rp-head").style.left = pct + "%";
  const w = rpWins(RP.setIdx + (RP.t >= min ? 1 : 0));
  document.getElementById("rp-score").textContent = w[0] + " : " + w[1];
  const k = Math.min(1, RP.t / min), kills = [Math.round(s.box.kills[0] * k), Math.round(s.box.kills[1] * k)];
  const mm = Math.floor(RP.t), ss = Math.floor((RP.t - mm) * 60), tm = Math.floor(min), ts = Math.round((min - tm) * 60);
  document.getElementById("rp-setbar").innerHTML = m.detail.sets.map(function (x, i) {
    const fin = i < RP.setIdx || (i === RP.setIdx && RP.t >= x.box.min);
    return '<span class="rp-st' + (i === RP.setIdx ? " on" : "") + '" data-rpset="' + i + '">' + (i + 1) + "세트" + (fin ? " · " + escapeHTML(teamShort(x.w === 0 ? m.a : m.b)) + " 승" : "") + "</span>";
  }).join("") + '<span class="rp-clock">⏱ ' + mm + ":" + String(ss).padStart(2, "0") + " / " + tm + ":" + String(ts).padStart(2, "0") + ' · ⚔ <b>' + kills[0] + " : " + kills[1] + "</b></span>";
  document.querySelectorAll("[data-rpset]").forEach(function (el) { el.onclick = function () { replayPlay(false); RP.setIdx = Number(el.getAttribute("data-rpset")); RP.t = 0; hideReplayBanner(); drawReplay(true); }; });
  drawReplayLanes(m, s);
}
function drawReplayLanes(m, s) {
  const rev = RP.t >= REPLAY_RULES.laneRevealMin;
  const who = function (id, side, pos, right) {
    const nm = id ? escapeHTML(playerName(id)) : escapeHTML(teamShort(side ? m.b : m.a)) + " " + findPosition(pos).name;
    return '<span class="rp-who' + (right ? " r" : "") + '">' + (id ? portraitImg(id, { face: true, size: 18 }) : "") + '<span class="' + (id === USER_ID ? "my-team" : "") + '">' + nm + "</span></span>";
  };
  document.getElementById("rp-lanes").innerHTML = '<div class="muted small">라인전 ' + (rev ? "결과" : "진행 중 (" + REPLAY_RULES.laneRevealMin + "분에 공개)") + "</div>" +
    s.lanes.map(function (l, i) {
      const pos = POSITION_IDS[i];
      return '<div class="rp-lane"><span class="muted">' + findPosition(pos).name + "</span>" + who(l.a, 0, pos) +
        '<span class="rp-res ' + (rev ? (l.aWon ? "wa" : "wb") : "") + '">' + (rev ? (l.aWon ? "◀" : "▶") + (l.solo ? "💥" : "") : "···") + "</span>" + who(l.b, 1, pos, true) + "</div>";
    }).join("");
}
function rpAddEvent(m, e, i) {
  const info = matchEventInfo(e) || { icon: "•", size: "s" };
  const side = e.k === "bad" ? 1 - e.s : e.s; // 실수는 상대에게 이득
  const map = document.getElementById("rp-map");
  map.querySelectorAll(".rp-ping").forEach(function (p) { p.classList.add("old"); });
  const old = map.querySelectorAll(".rp-ping");
  if (old.length > 6) old[0].remove();
  const p = rpPos(e, i), el = document.createElement("div");
  el.className = "rp-ping " + (side ? "b" : "a");
  el.style.left = p[0] + "%"; el.style.top = p[1] + "%";
  el.innerHTML = '<span class="ring"></span><span class="ic">' + (info.icon || "•") + "</span>";
  map.appendChild(el);
  const mine = e.p === USER_ID || e.v === USER_ID;
  const f = document.createElement("div");
  f.className = "rp-fe " + (e.s ? "b" : "a") + (info.size === "l" ? " big" : "") + (mine ? " mine" : "");
  f.innerHTML = '<span class="t">' + e.t + "분</span><span>" + (e.p ? portraitImg(e.p, { face: true, size: 18 }) : "") + '</span><span class="' + (e.k === "bad" ? "down" : e.k === "psych" ? "rp-psych" : "") + '">' +
    (info.icon || "") + " " + matchEventText(e, rpName(m)) + "</span>";
  const feed = document.getElementById("rp-feed");
  feed.insertBefore(f, feed.firstChild);
}

// ----- 재생 -----
function replayPlay(on) {
  if (!RP) return;
  RP.playing = on;
  const b = document.getElementById("rp-play");
  if (b) b.textContent = on ? "⏸ 일시정지" : "▶ 재생";
  if (on) { RP.last = performance.now(); requestAnimationFrame(replayTick); }
}
function replayTick(now) {
  if (!RP || !RP.playing) return;
  const dt = (now - RP.last) / 1000;
  RP.last = now;
  RP.t += dt * RP.speed / REPLAY_RULES.secPerMinute;
  const min = rpSet().box.min;
  if (RP.t >= min) { RP.t = min; drawReplay(); replayPlay(false); setTimeout(replaySetEnd, 300); return; }
  drawReplay();
  requestAnimationFrame(replayTick);
}
function replaySetEnd() {
  if (!RP) return;
  const m = rpMatch(), s = rpSet(), w = rpWins(RP.setIdx + 1), need = Math.ceil(m.bo / 2);
  const winId = s.w === 0 ? m.a : m.b;
  const over = w[0] >= need || w[1] >= need || RP.setIdx >= m.detail.sets.length - 1;
  replayBanner('<div class="muted">' + (RP.setIdx + 1) + '세트 종료</div><div class="rp-bbig">' + rpUni(uniformOfTeam(winId)) + " " + escapeHTML(teamName(winId)) + ' 승리</div><div class="muted">세트 ' + w[0] + " : " + w[1] + "</div>" +
    (over ? '<button class="primary" data-rpnext="1">경기 결과 보기 ▶</button>' : '<div class="rp-ctrl"><button class="primary" data-rpnext="1">' + (RP.setIdx + 2) + '세트 시작 ▶</button><button data-rpskip="1">⏭ 결과 바로 보기</button></div>'), "",
    function () { if (over) replayFinal(); else { RP.setIdx++; RP.t = 0; hideReplayBanner(); drawReplay(true); replayPlay(true); } });
}
function replaySkip() {
  if (!RP) return;
  replayPlay(false);
  RP.setIdx = rpMatch().detail.sets.length - 1;
  RP.t = rpSet().box.min;
  drawReplay(true);
  drawReplay();
  replayFinal();
}
function replayFinal() {
  const m = rpMatch(), mine = myTeam();
  const mineIn = mine && (m.a === mine.id || m.b === mine.id);
  const won = mineIn && m.winner === mine.id;
  const more = RP.qi < RP.queue.length - 1;
  const hi = Math.max(m.score[0], m.score[1]), lo = Math.min(m.score[0], m.score[1]);
  replayBanner((mineIn ? (won ? '<div class="rp-bbig win">승리!</div>' : '<div class="rp-bbig down">패배</div>') : '<div class="rp-bbig">경기 종료</div>') +
    '<div class="rp-bmid">' + rpUni(uniformOfTeam(m.winner)) + " " + escapeHTML(teamName(m.winner)) + " " + hi + " : " + lo + "</div>" +
    (m.pogName ? '<div class="muted">🏅 POG ' + escapeHTML(m.pogName) + "</div>" : "") +
    '<div class="rp-ctrl">' + (more ? '<button class="primary" data-rpnext="1">다음 경기 ▶</button>' : "") + '<button data-rpclose="1">닫기</button></div>', won ? "win" : "",
    function () { RP.qi++; startReplayMatch(); });
  if (won) replayConfetti(uniformOfTeam(m.winner));
}
function replayIntroHTML(m) {
  const big = bigGameOf(m.a, m.b);
  return '<span class="rp-tag">' + (big ? "🔥 " + escapeHTML(big.name) : "🏆 " + escapeHTML(m.label)) + '</span><div class="rp-vs"><span>' + rpUni(uniformOfTeam(m.a)) + " " + escapeHTML(teamName(m.a)) +
    '</span><span class="rp-vsx">VS</span><span>' + escapeHTML(teamName(m.b)) + " " + rpUni(uniformOfTeam(m.b)) + '</span></div><div class="muted">' + escapeHTML(m.label) + " · " + m.bo + "판 " + Math.ceil(m.bo / 2) + '선승</div><button class="primary" data-rpnext="1">경기 시작 ▶</button>';
}
function replayBanner(html, cls, onNext) {
  const b = document.getElementById("rp-banner");
  if (!b) return;
  b.className = "rp-banner " + (cls || "");
  b.innerHTML = html;
  b.hidden = false;
  RP.onNext = onNext;
  b.querySelectorAll("[data-rpnext]").forEach(function (x) { x.onclick = function () { const f = RP.onNext; if (f) f(); }; });
  b.querySelectorAll("[data-rpskip]").forEach(function (x) { x.onclick = replaySkip; });
  b.querySelectorAll("[data-rpclose]").forEach(function (x) { x.onclick = closeReplay; });
}
function hideReplayBanner() { const b = document.getElementById("rp-banner"); if (b) { b.hidden = true; b.innerHTML = ""; } }
function replayConfetti(u) {
  const box = document.querySelector("#replay-overlay .rp-box");
  if (!box || motionOff()) return; // 움직임 끄기면 꽃가루 없음 (디자인 D6)
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.className = "rp-confetti";
    c.style.left = fxRandom() * 100 + "%";
    c.style.background = [u[0], u[1], "#ffd23f", "#00e0ff"][i % 4];
    c.style.animationDuration = (1.6 + fxRandom() * 1.6) + "s";
    c.style.animationDelay = fxRandom() * 0.6 + "s";
    box.appendChild(c);
    setTimeout(function () { c.remove(); }, 4200);
  }
}
function bindReplay() {
  const el = document.getElementById("replay-overlay");
  el.querySelectorAll("[data-rpclose]").forEach(function (b) { b.onclick = closeReplay; });
  el.querySelector("[data-rpplay]").onclick = function () { if (RP.t >= rpSet().box.min) return; replayPlay(!RP.playing); };
  el.querySelectorAll("[data-rpsp]").forEach(function (b) {
    b.onclick = function () {
      RP.speed = Number(b.getAttribute("data-rpsp"));
      state.settings.replaySpeed = RP.speed; // 고른 빠르기를 다음에도
      el.querySelectorAll("[data-rpsp]").forEach(function (x) { x.classList.toggle("on", x === b); });
    };
  });
  el.querySelectorAll(".rp-ctrl [data-rpskip]").forEach(function (b) { b.onclick = replaySkip; });
  document.getElementById("rp-tl").onclick = function (e) {
    const r = this.getBoundingClientRect(), min = rpSet().box.min;
    RP.t = Math.max(0, Math.min(min, (e.clientX - r.left) / r.width * min));
    drawReplay();
  };
}
// [설정] 화면 줄
function replaySettingsHTML() {
  const cur = replayAutoSetting();
  return '<div class="setting-row">경기 자동 재생 (내 경기가 있는 주에 진행하면 바로 보기) ' +
    '<select id="replay-auto">' + REPLAY_AUTO_OPTIONS.map(function (o) { return '<option value="' + o.id + '"' + (o.id === cur ? " selected" : "") + ">" + escapeHTML(o.name) + "</option>"; }).join("") + "</select>" +
    ' 빠르기 <select id="replay-speed">' + REPLAY_RULES.speeds.map(function (s) { return '<option value="' + s + '"' + (s === replaySpeedSetting() ? " selected" : "") + ">" + s + "배</option>"; }).join("") + "</select></div>" +
    '<div class="muted small">지난 경기는 [경기 결과]에서 ▶ 다시 보기로 언제든 볼 수 있어요. 결과는 같고 보여 주는 방식만 달라요.</div>';
}
function bindReplaySettings(page) {
  const a = page.querySelector("#replay-auto"), s = page.querySelector("#replay-speed");
  if (a) a.onchange = function () { state.settings.replayAuto = this.value; showNotice("경기 자동 재생: " + REPLAY_AUTO_OPTIONS.find(function (o) { return o.id === a.value; }).name); };
  if (s) s.onchange = function () { state.settings.replaySpeed = Number(this.value); };
}
