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
  if (RP) { RP.playing = false; clearTimeout(RP.drTimer); }
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
  return '<div class="rp-box' + sideSwapClass(m) + '">' + // 219: 우리 팀 = 하늘색
    '<div class="rp-board">' + tm(0) + '<div class="rp-score"><div class="muted small">' + escapeHTML(m.label) + " · " + m.bo + "판 " + Math.ceil(m.bo / 2) + '선승' +
      (RP.queue.length > 1 ? " · 이번 주 " + (RP.qi + 1) + "/" + RP.queue.length + "경기" : "") + '</div><div class="rp-big" id="rp-score">0 : 0</div></div>' + tm(1) +
      '<button class="rp-close" data-rpclose="1" title="닫기">✕</button></div>' +
    '<div class="rp-setbar" id="rp-setbar"></div>' +
    '<div class="rp-stage"><div>' +
      '<div class="rp-map" id="rp-map"></div>' +
      '<div class="rp-cast" id="rp-cast"><span class="rp-mic">🎙️</span><span id="rp-cast-t"></span></div>' + // 289 ② 캐스터 자막
      '<div class="rp-mom rp-flow" id="rp-flow" title="' + escapeHTML(REPLAY_B_TEXT.flowTitle.replace("{a}", teamShort(m.a)).replace("{b}", teamShort(m.b))) + '">' + // 290 ⑤ 흐름 그래프 (예전 막대 자리)
        '<svg viewBox="0 0 100 40" preserveAspectRatio="none" id="rp-flow-svg"></svg>' +
        '<span class="rp-fl-lbl up">' + escapeHTML(REPLAY_B_TEXT.flowUp.replace("{team}", teamShort(m.a))) + '</span><span class="rp-fl-lbl down">' + escapeHTML(REPLAY_B_TEXT.flowDown.replace("{team}", teamShort(m.b))) + "</span>" +
        '<span class="rp-fl-tip" id="rp-fl-tip" hidden></span></div>' +
      '<div class="rp-tl" id="rp-tl"><div class="rp-fill" id="rp-fill"></div><div class="rp-head" id="rp-head"></div></div>' +
      '<div class="rp-ctrl"><button class="primary" data-rpplay="1" id="rp-play">▶ 재생</button>' + speeds + '<button data-rpskip="1">⏭ 결과 보기</button><button data-rphl="1">' + REPLAY_B_TEXT.hlBtn + "</button></div>" + // 290 ⑧
      '<div class="rp-endbar" id="rp-endbar" hidden></div>' + // 200: 세트·경기 끝 안내 (화면을 가리지 않음)
    '</div><div class="rp-side"><div class="rp-lanes" id="rp-lanes"></div>' +
      '<div class="rp-feedwrap"><div class="rp-feedhd"><span class="muted small">경기 기록 · 새 장면이 위로</span>' + (rpUserPlays(m) ? '<label class="small"><input type="checkbox" id="rp-onlyme"' + (RP.onlyMe ? " checked" : "") + "> " + REPLAY_TEXTS.onlyMe + ' <b id="rp-mecount">0</b></label>' : "") + "</div>" +
      '<div class="rp-feed' + (RP.onlyMe && rpUserPlays(m) ? " only-me" : "") + '" id="rp-feed" data-empty="' + REPLAY_TEXTS.noMine + '"></div></div></div></div>' +
    '<div class="rp-hint muted small">' + escapeHTML(REPLAY_TEXTS.hint) + "</div>" +
    '<div class="rp-banner" id="rp-banner" hidden></div>' +
  "</div>";
}
// 미니맵: 강·라인·포탑·본진·바론·용 + 정글 캠프 (정글 삼각형마다 위아래 끝에 1개씩, 사용자 요청)
const REPLAY_MAP_SVG = '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0f2219"/>' +
  '<path d="M0 100 L100 0" stroke="#163b55" stroke-width="16" opacity=".55"/>' +
  '<path d="M10 92 L10 10 L92 10" stroke="#3b4a3a" stroke-width="5" fill="none"/><path d="M8 90 L90 8" stroke="#3b4a3a" stroke-width="5"/><path d="M10 90 L90 90 L90 10" stroke="#3b4a3a" stroke-width="5" fill="none"/>' +
  [[62, 23], [23, 62], [77, 38], [38, 77]].map(function (p) { return '<g transform="translate(' + p[0] + " " + p[1] + ')"><circle r="3.2" fill="#2d3b26" stroke="#8fbf6a" stroke-width=".8"/><circle cx="-1" cy="-.6" r=".7" fill="#cfe8a8"/><circle cx="1" cy="-.6" r=".7" fill="#cfe8a8"/></g>'; }).join("") +
  '<circle class="rp-obj-spot baron" cx="34" cy="31" r="4" fill="#4a2b6b"/><circle class="rp-obj-spot dragon" cx="67" cy="70" r="4" fill="#5a3a1a"/>' + // 293 ⑨ 살아 있으면 빛남
  '<rect class="rp-base sa" x="2" y="84" width="14" height="14" rx="3"/><rect class="rp-base sb" x="84" y="2" width="14" height="14" rx="3"/>' + // 219: 색은 css (--side-a/--side-b)
  [[10, 60, 0], [10, 35, 1], [40, 10, 1], [65, 10, 1], [30, 70, 0], [70, 30, 1], [40, 90, 0], [65, 90, 0], [90, 60, 1], [90, 35, 1]].map(function (p) { return '<circle class="rp-tw ' + (p[2] ? "sb" : "sa") + '" cx="' + p[0] + '" cy="' + p[1] + '" r="1.8"/>'; }).join("") +
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
    rpResetMeCount();
    RP.shown = 0;
    const tl = document.getElementById("rp-tl");
    tl.querySelectorAll(".rp-tick").forEach(function (x) { x.remove(); });
    rpEvents(s).forEach(function (e) {
      const info = matchEventInfo(e) || {};
      const x = document.createElement("i");
      x.className = "rp-tick " + ((e.k === "bad" ? 1 - e.s : e.s) ? "b" : "a") + (info.size === "l" ? " big" : "") + (e.p === USER_ID || e.v === USER_ID ? " me" : ""); // 200: 내 장면은 금색 눈금
      x.style.left = Math.min(100, e.t / min * 100) + "%";
      tl.appendChild(x);
    });
  }
  const evs = rpEvents(s), done = evs.filter(function (e) { return e.t <= RP.t; });
  if (RP.shown > done.length) { document.getElementById("rp-map").innerHTML = REPLAY_MAP_SVG; document.getElementById("rp-feed").innerHTML = ""; rpResetMeCount(); RP.shown = 0; }
  const added = done.length - RP.shown;
  for (let i = RP.shown; i < done.length; i++) rpAddEvent(m, done[i], i);
  RP.shown = done.length;
  // 289 ①② 중계: 새 장면이 나오면 그 장면 한 줄 + (재생 중이고 한꺼번에 많이 건너뛴 게 아니면) 승부처 큰 글씨, 한동안 없으면 시간대 중계
  if (reset) { RP.castT = 0; rpCast(rpIdleLine(0)); }
  if (added > 0) {
    const li = done.length - 1;
    rpCast(rpCasterLine(m, done[li], li)); RP.castT = RP.t;
    if (RP.playing && added <= 2) rpCallout(m, done[li]);
  } else if (RP.playing && RP.t - (RP.castT || 0) >= REPLAY_SHOW.idleMin) { rpCast(rpIdleLine(RP.t)); RP.castT = RP.t; }
  drawReplayFlow(s, done, min); // 290 ⑤
  drawReplayObjects(s, min); // 293 ⑨
  drawReplayKillFeed(m, s, Math.min(RP.t, min)); // 294 ④
  drawReplayDots(m, s, Math.min(RP.t, min)); // 295 ③
  const pct = Math.min(100, RP.t / min * 100);
  document.getElementById("rp-fill").style.width = pct + "%";
  document.getElementById("rp-head").style.left = pct + "%";
  const w = rpWins(RP.setIdx + (RP.t >= min ? 1 : 0));
  document.getElementById("rp-score").textContent = w[0] + " : " + w[1];
  const kills = rpKillsAt(s, Math.min(RP.t, min)); // 294 ④ 장면과 맞는 킬 수 (예전: 최종 킬 × 시간 비율)
  const mm = Math.floor(RP.t), ss = Math.floor((RP.t - mm) * 60), tm = Math.floor(min), ts = Math.round((min - tm) * 60);
  // 291: 세트 탭은 내용이 바뀔 때만 다시 그림 (매 순간 새로 그리면 휴대폰에서 손가락을 떼기 전에 버튼이 바뀌어 탭을 놓침), 시계만 매번
  const bar = document.getElementById("rp-setbar");
  const tabsHTML = m.detail.sets.map(function (x, i) {
    const fin = i < RP.setIdx || (i === RP.setIdx && RP.t >= x.box.min);
    return '<span class="rp-st' + (i === RP.setIdx ? " on" : "") + '" data-rpset="' + i + '">' + (i + 1) + "세트" + (fin ? " · " + escapeHTML(teamShort(x.w === 0 ? m.a : m.b)) + " 승" : "") + "</span>";
  }).join("");
  if (RP.tabsHTML !== tabsHTML || !document.getElementById("rp-clock")) {
    RP.tabsHTML = tabsHTML;
    bar.innerHTML = tabsHTML + '<span class="rp-clock" id="rp-clock"></span>';
    document.querySelectorAll("[data-rpset]").forEach(function (el) { el.onclick = function () { RP.hl = null; replayPlay(false); RP.setIdx = Number(el.getAttribute("data-rpset")); RP.t = 0; hideReplayBanner(); hideReplayEndBar(); drawReplay(true); }; });
  }
  document.getElementById("rp-clock").innerHTML = (RP.hl ? '<span class="rp-hltag">' + REPLAY_B_TEXT.hlTag.replace("{k}", RP.hl.k + 1).replace("{n}", RP.hl.list.length) + "</span> " : "") + (RP.slow ? '<span class="rp-slowtag">' + REPLAY_B_TEXT.slowTag + "</span> " : "") + // 290 ⑥⑧
    "⏱ " + mm + ":" + String(ss).padStart(2, "0") + " / " + tm + ":" + String(ts).padStart(2, "0") + ' · ⚔ <b>' + kills[0] + " : " + kills[1] + "</b>";
  drawReplayLanes(m, s);
}
function drawReplayLanes(m, s) {
  const rev = RP.t >= REPLAY_RULES.laneRevealMin;
  const who = function (id, side, pos, right) {
    const nm = id ? escapeHTML(playerName(id)) : escapeHTML(teamShort(side ? m.b : m.a)) + " " + findPosition(pos).name;
    return '<span class="rp-who' + (right ? " r" : "") + '">' + (id ? portraitImg(id, { face: true, size: 18 }) : "") + '<span class="ev-n s' + side + (id === USER_ID ? " me" : "") + '">' + nm + "</span></span>"; // 219: 팀 색
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
  const mine = e.p === USER_ID || e.v === USER_ID; // 내 선수가 주인공이거나 당한 장면 (200: 더 눈에 띄게)
  if (mine) {
    el.classList.add("me");
    const mc = document.getElementById("rp-mecount");
    if (mc) mc.textContent = Number(mc.textContent) + 1;
  }
  const f = document.createElement("div");
  f.className = "rp-fe " + (e.s ? "b" : "a") + (info.size === "l" ? " big" : "") + (mine ? " mine" : "");
  f.setAttribute("data-rpi", i);
  f.innerHTML = '<span class="t">' + e.t + '분</span><span class="ev-tm s' + e.s + '">' + escapeHTML(teamShort(e.s ? m.b : m.a)) + "</span><span>" + (e.p ? portraitImg(e.p, { face: true, size: mine ? 24 : 18 }) : "") + '</span><span class="' + (e.k === "bad" ? "down" : e.k === "psych" ? "rp-psych" : "") + '">' +
    (mine ? '<span class="rp-me">' + REPLAY_TEXTS.meTag + "</span> " : "") + (info.icon || "") + " " + matchEventText(e, rpName(m)) + "</span>" +
    (mine ? positionVoiceHTML(m, RP.setIdx, e, i) : ""); // 259 포지션 해설 (js/position_voice.js)
  f.title = REPLAY_TEXTS.jumpTip;
  f.onclick = function () { replayJumpTo(e, i); }; // 기록 한 줄을 누르면 그 시간으로 + 장소 강조
  const feed = document.getElementById("rp-feed");
  feed.insertBefore(f, feed.firstChild);
}
// 기록에서 고른 장면으로: 재생을 멈추고 그 시간으로 돌아가 미니맵에 강조 고리 + 기록 줄 강조
function replayJumpTo(e, i) {
  if (!RP) return;
  RP.hl = null; // 290: 하이라이트 중이면 끝
  replayPlay(false);
  hideReplayBanner();
  RP.t = e.t;
  drawReplay();
  rpCast(rpCasterLine(rpMatch(), e, i)); // 289: 고른 장면의 중계 한 줄
  const pb = document.getElementById("rp-play");
  if (pb) pb.textContent = "▶ 재생";
  const map = document.getElementById("rp-map");
  map.querySelectorAll(".rp-focus").forEach(function (x) { x.remove(); });
  const p = rpPos(e, i), side = e.k === "bad" ? 1 - e.s : e.s, el = document.createElement("div");
  el.className = "rp-focus " + (side ? "b" : "a");
  el.style.left = p[0] + "%"; el.style.top = p[1] + "%";
  el.innerHTML = '<span class="ring"></span><span class="ring r2"></span>';
  map.appendChild(el);
  document.querySelectorAll("#rp-feed .rp-fe.picked").forEach(function (x) { x.classList.remove("picked"); });
  const row = document.querySelector('#rp-feed .rp-fe[data-rpi="' + i + '"]');
  if (row) row.classList.add("picked");
}

// 내 선수가 이 경기에 나왔나 (세트 라인 중 하나라도)
function rpUserPlays(m) { return (m.detail.sets || []).some(function (s) { return (s.lanes || []).some(function (l) { return l.a === USER_ID || l.b === USER_ID; }); }); }
function rpResetMeCount() { const mc = document.getElementById("rp-mecount"); if (mc) mc.textContent = "0"; }

// ----- 재생 -----
function replayPlay(on) {
  if (!RP) return;
  if (on && rpDraftFirst()) return; // 296 ⑦ 세트 처음 재생이면 밴픽 소개부터
  if (on) document.querySelectorAll("#rp-map .rp-focus, #rp-feed .rp-fe.picked").forEach(function (x) { x.classList.contains("rp-focus") ? x.remove() : x.classList.remove("picked"); });
  if (on) hideReplayEndBar(); // 다시 재생하면 끝 안내는 접기 (200)
  RP.playing = on;
  const b = document.getElementById("rp-play");
  if (b) b.textContent = on ? "⏸ 일시정지" : "▶ 재생";
  if (on) { RP.last = performance.now(); requestAnimationFrame(replayTick); }
}
function replayTick(now) {
  if (!RP || !RP.playing) return;
  const dt = (now - RP.last) / 1000;
  RP.last = now;
  RP.slow = rpSlowNow(); // 290 ⑥ 큰 장면 앞뒤는 느리게
  RP.t += dt * RP.speed * (RP.slow ? REPLAY_SHOW.slow.mult : 1) / REPLAY_RULES.secPerMinute;
  const min = rpSet().box.min;
  if (RP.hl && RP.t >= RP.hl.end) { rpHlNext(); return; } // 290 ⑧ 다음 하이라이트로
  if (RP.t >= min) { RP.t = min; drawReplay(); if (RP.hl) { rpHlNext(); return; } replayPlay(false); replaySetEnd(); return; } // 290: 하이라이트 중엔 세트 끝에서 멈추지 않고 다음 장면으로 // 200: 화면을 가리는 창 대신 아래 안내 (천천히 다시 보기)
  drawReplay();
  requestAnimationFrame(replayTick);
}
function replaySetEnd() {
  if (!RP) return;
  const m = rpMatch(), s = rpSet(), w = rpWins(RP.setIdx + 1), need = Math.ceil(m.bo / 2);
  const winId = s.w === 0 ? m.a : m.b;
  const over = w[0] >= need || w[1] >= need || RP.setIdx >= m.detail.sets.length - 1;
  replayEndBar('<div><b>' + (RP.setIdx + 1) + "세트 종료</b> · " + rpUni(uniformOfTeam(winId)) + " " + escapeHTML(teamName(winId)) + " 승리 · 세트 " + w[0] + " : " + w[1] + "</div>" +
    '<div class="rp-ctrl">' + (over ? '<button class="primary" data-rpnext="1">경기 결과 보기 ▶</button>' : '<button class="primary" data-rpnext="1">' + (RP.setIdx + 2) + '세트 시작 ▶</button><button data-rpskip="1">⏭ 결과 바로 보기</button>') + "</div>", "",
    function () { if (over) replayFinal(); else { RP.setIdx++; RP.t = 0; hideReplayEndBar(); drawReplay(true); replayPlay(true); } });
}
function replaySkip() {
  if (!RP) return;
  RP.hl = null;
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
  replayEndBar('<div class="rp-endres">' + (mineIn ? (won ? '<b class="up">승리!</b>' : '<b class="down">패배</b>') : "<b>경기 종료</b>") + " · " + rpUni(uniformOfTeam(m.winner)) + " " + escapeHTML(teamName(m.winner)) + " " + hi + " : " + lo +
    (m.pogName ? ' <span class="muted">· 🏅 POG ' + escapeHTML(m.pogName) + "</span>" : "") + "</div>" + rpPogCardHTML(m) + // 289 ⑩
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
  b.onclick = function (ev) { if (ev.target === b) hideReplayBanner(); }; // 가운데 안내 밖 아무 데나 누르면 접고 화면을 둘러보기 (재생 버튼으로 시작)
}
// 200: 세트·경기 끝 안내 — 미니맵·기록을 가리지 않고 재생 버튼 아래에. 그대로 두고 타임라인·기록을 천천히 다시 볼 수 있음
function replayEndBar(html, cls, onNext) {
  const b = document.getElementById("rp-endbar");
  if (!b) return;
  b.className = "rp-endbar " + (cls || "");
  b.innerHTML = html + '<div class="muted small">' + REPLAY_TEXTS.endHint + "</div>";
  b.hidden = false;
  RP.onNext = onNext;
  b.querySelectorAll("[data-rpnext]").forEach(function (x) { x.onclick = function () { const f = RP.onNext; if (f) f(); }; });
  b.querySelectorAll("[data-rpskip]").forEach(function (x) { x.onclick = replaySkip; });
  b.querySelectorAll("[data-rpclose]").forEach(function (x) { x.onclick = closeReplay; });
  const pb = document.getElementById("rp-play");
  if (pb) pb.textContent = "↺ 다시 보기";
}
function hideReplayEndBar() { const b = document.getElementById("rp-endbar"); if (b) { b.hidden = true; b.innerHTML = ""; } }
function hideReplayBanner() { if (RP) clearTimeout(RP.drTimer); const b = document.getElementById("rp-banner"); if (b) { b.hidden = true; b.innerHTML = ""; } } // 296: 밴픽 자동 시작 타이머도 같이 (다른 방법으로 닫은 뒤 늦게 실행되지 않게)
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
  el.querySelector("[data-rpplay]").onclick = function () {
    RP.hl = null; // 290: 직접 재생하면 하이라이트 끝
    if (RP.t >= rpSet().box.min) { RP.t = 0; drawReplay(true); replayPlay(true); return; } // 끝까지 봤으면 이 세트를 처음부터 다시 (200)
    replayPlay(!RP.playing);
  };
  const onlyMe = el.querySelector("#rp-onlyme");
  if (onlyMe) onlyMe.onchange = function () { RP.onlyMe = this.checked; document.getElementById("rp-feed").classList.toggle("only-me", this.checked); };
  el.querySelectorAll("[data-rpsp]").forEach(function (b) {
    b.onclick = function () {
      RP.speed = Number(b.getAttribute("data-rpsp"));
      state.settings.replaySpeed = RP.speed; // 고른 빠르기를 다음에도
      el.querySelectorAll("[data-rpsp]").forEach(function (x) { x.classList.toggle("on", x === b); });
    };
  });
  el.querySelectorAll(".rp-ctrl [data-rpskip]").forEach(function (b) { b.onclick = replaySkip; });
  const hlb = el.querySelector("[data-rphl]");
  if (hlb) hlb.onclick = rpHlStart; // 290 ⑧
  const flow = document.getElementById("rp-flow"); // 290 ⑤ 흐름 그래프: 올리면 그 시간 우세, 누르면 그 시간으로
  if (flow) {
    flow.onmousemove = function (e) { rpFlowTip(e, false); };
    flow.onmouseleave = function () { const t = document.getElementById("rp-fl-tip"); if (t) t.hidden = true; const x = document.getElementById("rp-fl-x"); if (x) x.setAttribute("opacity", "0"); };
    flow.onclick = function (e) { rpFlowTip(e, true); };
  }
  document.getElementById("rp-tl").onclick = function (e) {
    RP.hl = null;
    const r = this.getBoundingClientRect(), min = rpSet().box.min;
    RP.t = Math.max(0, Math.min(min, (e.clientX - r.left) / r.width * min));
    drawReplay();
  };
}
// ----- 289 중계 연출 A (글: data/replay.js REPLAY_CASTER·REPLAY_IDLE·REPLAY_CALL·REPLAY_POG) — 무작위 없이 세트·장면 번호로 고름 -----
function rpCast(text) {
  const t = document.getElementById("rp-cast-t"), box = document.getElementById("rp-cast");
  if (!t || !box) return;
  t.textContent = text;
  box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop"); // 바뀔 때마다 살짝 반짝
}
function rpPick(list, n) { return list[((n % list.length) + list.length) % list.length]; }
function rpIdleLine(t) {
  const P = REPLAY_SHOW.phase, key = t < P[0] ? "lane" : t < P[1] ? "mid" : "late";
  return rpPick(REPLAY_IDLE[key], (RP ? RP.setIdx * 5 : 0) + Math.floor(t / REPLAY_SHOW.idleMin));
}
function rpCasterLine(m, e, i) {
  const info = matchEventInfo(e) || {};
  const cat = e.e === "solo" ? "lane" : e.e.indexOf("fin:") === 0 ? "fin" : info.cat;
  const g = REPLAY_CASTER[cat] || REPLAY_CASTER.play;
  const kind = e.k === "psych" ? (info.psy ? (info.psy.mood > 0 ? "good" : "bad") : "psych") : e.k;
  const list = g[kind] || g.good;
  const who = function (id, side, pos) { return id ? playerName(id) : teamShort(side ? m.b : m.a) + " " + (pos ? findPosition(pos).name : ""); };
  return rpPick(list, RP.setIdx * 31 + i * 7).split("{p}").join(who(e.p, e.s, e.pp)).split("{v}").join(e.v || e.vp ? who(e.v, 1 - e.s, e.vp) : "상대")
    .split("{team}").join(teamShort(e.s ? m.b : m.a));
}
// ① 승부처 큰 글씨: 크기 '대' 사건, 내 선수의 '중' 이상 좋은 장면, 마무리 장면
function rpCallout(m, e) {
  const info = matchEventInfo(e) || {};
  const fin = e.e.indexOf("fin:") === 0;
  if (!rpIsBig(e)) return; // 290: ⑥ 느린 화면·⑧ 하이라이트와 같은 기준
  const map = document.getElementById("rp-map");
  if (!map) return;
  map.querySelectorAll(".rp-call").forEach(function (x) { x.remove(); });
  const side = e.k === "bad" ? 1 - e.s : e.s;
  const el = document.createElement("div");
  el.className = "rp-call " + (side ? "b" : "a") + (e.p === USER_ID ? " me" : "");
  el.style.setProperty("--rp-call-ms", REPLAY_SHOW.callMs + "ms");
  el.innerHTML = (e.p ? portraitImg(e.p, { face: true, size: 44 }) : "") + "<b>" + (info.icon || "") + " " + escapeHTML(info.name || "") + (fin ? REPLAY_CALL.fin : e.k === "bad" ? REPLAY_CALL.bad : REPLAY_CALL.good) + "</b>" +
    (e.p ? "<span>" + escapeHTML(playerName(e.p)) + " · " + escapeHTML(teamShort(e.s ? m.b : m.a)) + "</span>" : "");
  map.appendChild(el);
  setTimeout(function () { el.remove(); }, REPLAY_SHOW.callMs);
}
// ⑩ 경기 끝 POG 카드: 도트 얼굴 · 경기 합계 K/D/A · 대표 장면(POG의 가장 큰 좋은 장면)
function rpPogCardHTML(m) {
  const id = m.pog;
  if (!id) return "";
  let k = 0, d = 0, a = 0, side = 0, best = null, bestSet = 0;
  m.detail.sets.forEach(function (s, si) {
    (s.lanes || []).forEach(function (l, i) {
      const b = l.a === id ? s.box.a[i] : l.b === id ? s.box.b[i] : null;
      if (b) { k += b.k; d += b.d; a += b.a; side = l.a === id ? 0 : 1; }
    });
    rpEvents(s).forEach(function (e) { if (e.p === id && e.k === "good" && (!best || Math.abs(e.x) > Math.abs(best.x))) { best = e; bestSet = si; } });
  });
  const scene = best ? ((matchEventInfo(best) || {}).icon || "") + " " + (bestSet + 1) + "세트 " + best.t + "분 · " + matchEventText(best, rpName(m)) : "";
  return '<div class="rp-pog"><span class="pf-frame">' + portraitImg(id, { scale: 2, teamId: side ? m.b : m.a }) + "</span><div>" +
    '<div class="rp-pog-h">' + REPLAY_POG.title + " · <b>" + escapeHTML(playerName(id)) + '</b> <span class="muted small">' + escapeHTML(teamShort(side ? m.b : m.a)) + "</span></div>" +
    '<div class="small">' + REPLAY_POG.kda + " <b>" + k + " / " + d + " / " + a + "</b></div>" +
    (scene ? '<div class="small">' + REPLAY_POG.scene + ": " + scene + "</div>" : "") + "</div></div>";
}
// ----- 290 중계 연출 B: ⑤ 흐름 그래프 · ⑥ 승부처 느린 화면 · ⑧ 하이라이트 (값·글: data/replay.js REPLAY_SHOW·REPLAY_B_TEXT) -----
// 큰 장면 = 크기 '대' 사건 · 마무리 장면 · 내 선수의 '중' 이상 좋은 장면 (① 큰 글씨·⑥·⑧이 같이 씀)
function rpIsBig(e) {
  const info = matchEventInfo(e) || {};
  return info.size === "l" || e.e.indexOf("fin:") === 0 || (e.p === USER_ID && e.k === "good" && info.size === "m");
}
// ⑤ 흐름 = 지금까지 사건 점수 합 (위 = 왼쪽 팀 우세). 골드가 아니라 경기 판정 점수 흐름 (Codex 주의)
function rpFlowPoints(s, upto) {
  const pts = [[0, 0]]; let mom = 0;
  rpEvents(s).forEach(function (e) { if (e.t > upto) return; pts.push([e.t, mom]); mom += e.s === 0 ? e.x : -e.x; pts.push([e.t, mom]); });
  pts.push([upto, mom]);
  return pts;
}
// 높이 = 이 세트에서 가장 크게 벌어진 만큼 (세트 전체 기준이라 재생 중에 크기가 안 바뀜, 최소 flowMin)
function rpFlowScale(s) {
  let mx = REPLAY_SHOW.flowMin;
  rpFlowPoints(s, s.box.min).forEach(function (p) { mx = Math.max(mx, Math.abs(p[1])); });
  return mx * 1.1;
}
function rpFlowY(v, sc) { return 20 - Math.max(-1, Math.min(1, v / sc)) * 18; }
function drawReplayFlow(s, done, min) {
  const svg = document.getElementById("rp-flow-svg");
  if (!svg) return;
  const pts = rpFlowPoints(s, Math.min(RP.t, min)), sc = rpFlowScale(s);
  const xy = pts.map(function (p) { return (p[0] / min * 100).toFixed(2) + " " + rpFlowY(p[1], sc).toFixed(2); });
  const area = "M0 20 L" + xy.join(" L") + " L" + (Math.min(RP.t, min) / min * 100).toFixed(2) + " 20 Z";
  svg.innerHTML = '<defs><clipPath id="rp-fl-up"><rect x="0" y="0" width="100" height="20"/></clipPath><clipPath id="rp-fl-dn"><rect x="0" y="20" width="100" height="20"/></clipPath></defs>' +
    '<line class="rp-fl-mid" x1="0" y1="20" x2="100" y2="20"/>' +
    '<path class="rp-fl-a" d="' + area + '" clip-path="url(#rp-fl-up)"/><path class="rp-fl-b" d="' + area + '" clip-path="url(#rp-fl-dn)"/>' +
    '<polyline class="rp-fl-line" points="' + xy.join(" ") + '"/>' +
    '<line class="rp-fl-x" id="rp-fl-x" x1="0" y1="0" x2="0" y2="40" opacity="0"/>';
}
function rpFlowTip(e, jump) {
  if (!RP) return;
  const box = document.getElementById("rp-flow"), tip = document.getElementById("rp-fl-tip"), x = document.getElementById("rp-fl-x");
  const r = box.getBoundingClientRect(), m = rpMatch(), s = rpSet(), min = s.box.min;
  const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), t = f * min;
  if (jump) { RP.hl = null; replayPlay(false); RP.t = Math.round(t * 10) / 10; drawReplay(); return; }
  const pts = rpFlowPoints(s, min); let v = 0;
  pts.forEach(function (p) { if (p[0] <= t) v = p[1]; });
  const lead = Math.abs(v) < 4 ? null : v > 0 ? m.a : m.b;
  tip.textContent = (lead ? REPLAY_B_TEXT.flowTip.replace("{team}", teamShort(lead)) : REPLAY_B_TEXT.flowEven).replace("{t}", Math.floor(t));
  tip.hidden = false;
  tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, f * r.width - tip.offsetWidth / 2)) + "px";
  if (x) { x.setAttribute("x1", f * 100); x.setAttribute("x2", f * 100); x.setAttribute("opacity", "1"); }
}
// ⑥ 지금이 큰 장면 앞뒤인가
function rpSlowNow() {
  const S = REPLAY_SHOW.slow;
  return rpEvents(rpSet()).some(function (e) { return rpIsBig(e) && RP.t >= e.t - S.before && RP.t <= e.t + S.after; });
}
// ⑧ 하이라이트: 모든 세트의 큰 장면 + 내 장면을 차례로
function rpHlStart() {
  if (!RP) return;
  const list = [];
  rpMatch().detail.sets.forEach(function (s, si) {
    rpEvents(s).forEach(function (e) { if (rpIsBig(e) || e.p === USER_ID || e.v === USER_ID) list.push({ si: si, t: e.t }); });
  });
  hideReplayEndBar(); hideReplayBanner();
  if (!list.length) { rpCast(REPLAY_B_TEXT.hlNone); return; }
  RP.hl = { list: list, k: -1, end: 0 };
  rpHlNext();
}
function rpHlNext() {
  const H = RP.hl, L = REPLAY_SHOW.hl;
  H.k++;
  if (H.k >= H.list.length) {
    RP.hl = null; replayPlay(false); drawReplay();
    replayEndBar("<div><b>" + REPLAY_B_TEXT.hlEnd + "</b></div>", "", null);
    return;
  }
  const h = H.list[H.k], start = Math.max(0, h.t - L.lead);
  if (h.si !== RP.setIdx || RP.t > start + 0.01 && RP.t > h.t) { RP.setIdx = h.si; RP.t = start; drawReplay(true); }
  else if (RP.t < start) RP.t = start;
  H.end = h.t + L.tail;
  drawReplay();
  if (!RP.playing) replayPlay(true); else requestAnimationFrame(replayTick);
}
// ----- 296 C ⑦ 밴픽·라인업 소개 (data/replay.js REPLAY_DRAFT) — 세트마다 처음 재생할 때 한 번 (하이라이트·중간부터는 안 나옴) -----
function rpDraftFirst() {
  if (RP.hl || RP.t > 0.01) return false;
  RP.drSeen = RP.drSeen || {};
  const key = RP.qi + ":" + RP.setIdx;
  if (RP.drSeen[key]) return false;
  RP.drSeen[key] = true;
  const go = function () { clearTimeout(RP.drTimer); hideReplayBanner(); replayPlay(true); };
  replayBanner(replayDraftHTML(rpMatch(), rpSet()), "draft", go);
  RP.drTimer = setTimeout(function () { if (RP && RP.onNext === go) go(); }, REPLAY_DRAFT.autoMs);
  return true;
}
function replayDraftHTML(m, s) {
  const D = REPLAY_DRAFT;
  const col = function (side) {
    const team = side ? m.b : m.a;
    return '<div class="rp-dr-col ' + (side ? "b" : "a") + '"><div class="rp-dr-tm">' + rpUni(uniformOfTeam(team)) + " " + escapeHTML(teamShort(team)) + "</div>" +
      (s.lanes || []).map(function (l, i) {
        const id = side ? l.b : l.a, bx = (side ? s.box.b : s.box.a)[i] || {};
        return '<div class="rp-dr-row' + (id === USER_ID ? " me" : "") + '" style="--d:' + (i * 2 + side) + '"><span class="muted">' + findPosition(POSITION_IDS[i]).name + "</span>" +
          (id ? portraitImg(id, { face: true, size: 22 }) : "") + "<b>" + escapeHTML(id ? playerName(id) : "") + '</b><span class="rp-dr-ch">' + escapeHTML(bx.c || "") + "</span></div>";
      }).join("") + "</div>";
  };
  const ban = s.banned && s.banned.length ? '<div class="rp-dr-ban">' + escapeHTML(D.ban.replace("{me}", state.player.name)) + ": " + s.banned.map(escapeHTML).join(" · ") + "</div>" : "";
  return '<span class="rp-tag">' + escapeHTML(D.title.replace("{n}", RP.setIdx + 1)) + "</span>" + ban +
    '<div class="rp-dr" style="--step:' + D.stepS + 's">' + col(0) + col(1) + "</div>" +
    '<button class="primary" data-rpnext="1">' + D.go + "</button>";
}
// ----- 295 C ③ 움직이는 미니맵: 선수 10명 도트 얼굴 (data/replay.js REPLAY_DOTS) -----
// 300: 걸어서 움직이게 — 위치는 경기 시각 t만으로 계산 (되감기·하이라이트·세트 클릭에도 같은 자리, 게임 난수 안 씀)
//  평소 길(시간대 자리 사이를 천천히 걸어감 + 라인 밀고 당기기 + 정글 캠프 사이 곡선) → 장면에 낀 선수만 거리에 맞춰 일찍 출발해 모였다 흩어짐
//  → 경기 끝 배치(이긴 팀 상대 본진 앞, 진 팀 자기 본진) → 죽음(그 자리에서 흐려짐 → 본진에서 다시 걸어 나옴)
function rpSmooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
function rpLerp(p, q, w) { return [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w]; }
function rpSide(p, side) { return side ? [p[1], p[0]] : p; } // 오른쪽 팀 = x·y 바꿈 (맵 대각선 대칭)
function rpDist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
function rpHomeAt(kind, side, i, t, set) {
  const D = REPLAY_DOTS, h = D.home[kind][i];
  if (i !== 1) return rpSide(h, side);
  // 정글: 두 캠프 사이를 곡선으로 오감 (캠프에서 잠깐 머물고 다음 캠프로)
  const u = (t + side * 1.3 + set * 0.7) / D.jungle.period, k = Math.floor(u), f = rpSmooth((u - k) * 1.25);
  const from = h[k % 2], to = h[(k + 1) % 2], p = rpLerp(from, to, f);
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1, b = Math.sin(f * Math.PI) * D.jungle.bend * (k % 2 ? 1 : -1);
  return rpSide([p[0] - dy / len * b, p[1] + dx / len * b], side);
}
function rpDotHome(side, i, t, set) {
  const D = REPLAY_DOTS, P = REPLAY_SHOW.phase, S = D.shift;
  const lag = (rpJit(set * 13 + side * 7 + i * 3) - 0.5) * 2 * S.jitter; // 포지션마다 출발 시각이 조금씩 다름
  const w1 = rpSmooth((t - (P[0] + lag - S.half)) / (2 * S.half)), w2 = rpSmooth((t - (P[1] + lag - S.half)) / (2 * S.half));
  let p = rpHomeAt("lane", side, i, t, set);
  if (w1 > 0) p = rpLerp(p, rpHomeAt("mid", side, i, t, set), w1);
  if (w2 > 0) p = rpLerp(p, rpHomeAt("late", side, i, t, set), w2);
  if (!motionOff()) {
    const dir = D.laneDir[i];
    if (dir && w1 < 1) { // 라인전: 라인 방향으로 밀고 당기기 (서폿은 원딜과 같이)
      const d = rpSide(dir, side), wv = Math.sin((t + (i === 4 ? 3 : i) * 0.37 + side * 0.8 + set) / D.wave.period * Math.PI * 2) * D.wave.amp * (1 - w1);
      p = [p[0] + d[0] * wv, p[1] + d[1] * wv];
    }
    const wd = D.wander, sw = D.sway;
    p = [p[0] + Math.sin(t * 0.41 + i * 1.9 + side * 2.3 + set) * wd + Math.sin(t * 1.7 + i * 2 + side) * sw,
         p[1] + Math.cos(t * 0.37 + i * 2.7 + side * 1.1 + set) * wd + Math.cos(t * 1.3 + i * 3 + side) * sw];
  }
  return p;
}
// 세트마다 한 번: 장면별로 누가 어디로 언제 가는지 (화면용 임시 — 경기 기록 객체에 붙이면 세이브에 들어가서 WeakMap)
const RP_GO = new WeakMap();
function rpGoPlan(s, setIdx) {
  if (RP_GO.has(s)) return RP_GO.get(s);
  const D = REPLAY_DOTS, G = D.go, plan = [[], [], [], [], [], [], [], [], [], []]; // 0~4 왼쪽 팀, 5~9 오른쪽 팀
  const idOf = function (side, i) { const l = s.lanes[i]; return l ? (side ? l.b : l.a) : null; };
  rpEvents(s).forEach(function (e, j) {
    const info = matchEventInfo(e) || {}, q = rpPos(e, j);
    const near = function (side, n) { // 장면 자리에서 가까운 n명
      return [0, 1, 2, 3, 4].map(function (i) { return { i: i, d: rpDist(rpDotHome(side, i, e.t, setIdx), q) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, n).map(function (x) { return x.i; });
    };
    [0, 1].forEach(function (side) {
      let who = [];
      if (info.cat === "fight") who = info.size === "l" ? [0, 1, 2, 3, 4] : near(side, D.fight[info.size] || D.fight.s);
      else if (info.cat === "object") who = info.size === "l" ? near(side, D.fight.m).concat([1]) : [1, 4];
      [0, 1, 2, 3, 4].forEach(function (i) { const id = idOf(side, i); if (id && (e.p === id || e.v === id) && who.indexOf(i) === -1) who.push(i); });
      who.forEach(function (i) {
        if (plan[side * 5 + i].some(function (g) { return g.j === j; })) return; // 정글이 near와 [1]에 둘 다 들어간 경우
        const o = [(rpJit(j * 11 + side * 5 + i) - 0.5) * 2 * D.spot, (rpJit(j * 7 + side * 3 + i * 2) - 0.5) * 2 * D.spot];
        const at = [q[0] + o[0], q[1] + o[1]];
        const go = Math.max(G.min, Math.min(G.max, rpDist(rpDotHome(side, i, e.t, setIdx), at) / D.speed)); // 멀면 일찍 출발
        plan[side * 5 + i].push({ j: j, q: at, a: e.t - G.before - go, b: e.t - G.before, c: e.t + G.after, d: e.t + G.after + go });
      });
    });
  });
  RP_GO.set(s, plan);
  return plan;
}
function rpDotPath(s, side, i, t, setIdx) {
  const D = REPLAY_DOTS, home = rpDotHome(side, i, t, setIdx);
  // 장면들: 겹치면 무게대로 섞음 (순서와 상관없이 같은 자리, 끊김 없음)
  let sw = 0, sx = 0, sy = 0;
  rpGoPlan(s, setIdx)[side * 5 + i].forEach(function (g) {
    if (t <= g.a || t >= g.d) return;
    const w = t < g.b ? rpSmooth((t - g.a) / (g.b - g.a)) : t <= g.c ? 1 : 1 - rpSmooth((t - g.c) / (g.d - g.c));
    sw += w; sx += g.q[0] * w; sy += g.q[1] * w;
  });
  let p = home;
  if (sw > 0) { const k = Math.max(1, sw), h = 1 - Math.min(1, sw); p = [home[0] * h + sx / k, home[1] * h + sy / k]; }
  // 경기 끝: 마지막 lead분 동안 끝 배치로
  const E = D.end, min = s.box.min, we = rpSmooth((t - (min - E.lead)) / E.lead);
  if (we > 0) {
    const winA = s.w === 0, won = side === 0 ? winA : !winA; // 이 팀이 이겼나
    p = rpLerp(p, rpSide((won ? E.win : E.lose)[i], side), we);
  }
  return p;
}
// 죽음: 가장 최근에 당한 킬 → 쓰러진 자리에서 흐려짐 → 본진에서 다시 걸어 나옴
// 쓰러진 자리 = 바로 전 순간의 자리 (다시 걸어 나오던 중에 또 죽어도 튀지 않게, 앞의 죽음부터 차례로 따라감)
function rpDotAt(s, side, i, id, t, setIdx, feed) {
  const D = REPLAY_DOTS;
  let last = null;
  if (id) feed.forEach(function (f) { if (f.victim === id && f.t <= t && (!last || f.t > last.t)) last = f; });
  let p = rpDotPath(s, side, i, t, setIdx);
  if (!last) return { p: p, dead: false };
  const back = last.t + D.dead;
  if (t < back) return { p: rpDotAt(s, side, i, id, last.t - 1e-6, setIdx, feed).p, dead: true };
  const base = D.base[side ? "b" : "a"], walk = Math.max(D.go.min, Math.min(D.go.max, rpDist(base, p) / D.speed));
  if (t < back + walk) p = rpLerp(base, p, rpSmooth((t - back) / walk));
  return { p: p, dead: false };
}
function drawReplayDots(m, s, t) {
  const map = document.getElementById("rp-map");
  if (!map || !s.lanes) return;
  let box = map.querySelector(".rp-dots");
  if (!box) {
    box = document.createElement("div"); box.className = "rp-dots"; map.appendChild(box);
    [0, 1].forEach(function (side) {
      s.lanes.forEach(function (l, i) {
        const id = side ? l.b : l.a, d = document.createElement("div");
        d.className = "rp-dot " + (side ? "b" : "a") + (id === USER_ID ? " me" : "");
        d.setAttribute("data-dot", side + ":" + i);
        d.innerHTML = id ? portraitImg(id, { face: true, size: 14 }) : "";
        box.appendChild(d);
      });
    });
  }
  const D = REPLAY_DOTS, feed = rpKillTimeline(s).feed, setIdx = RP.setIdx, min = s.box.min;
  box.querySelectorAll(".rp-dot").forEach(function (d) {
    const k = d.getAttribute("data-dot").split(":"), side = Number(k[0]), i = Number(k[1]), l = s.lanes[i], id = l ? (side ? l.b : l.a) : null;
    const at = rpDotAt(s, side, i, id, t, setIdx, feed), p = at.p, dead = at.dead;
    const lost = t >= min && (s.w === 0 ? side === 1 : side === 0);
    d.classList.toggle("dead", dead);
    d.classList.toggle("lost", lost && !dead);
    d.style.left = p[0].toFixed(1) + "%"; d.style.top = p[1].toFixed(1) + "%";
  });
}
// ----- 294 C ④ 장면과 맞는 킬 수 + 킬 알림 (data/replay.js REPLAY_KILLS) — 화면용 근사: 사건과 최종 킬 수가 따로 만들어져서 (Codex 주의) -----
// 장면에서 나온 킬을 먼저 놓고(최종 킬 수보다 많으면 작은 장면부터 뺌), 모자라면 2분 ~ 끝 1분 전 사이에 고르게 채움 → 세트 끝에는 늘 최종 킬 수
const RP_KT = new WeakMap(); // 세트 → 킬 시간표 (화면용 임시, 경기 기록 객체에 붙이면 세이브에 들어가서 따로)
function rpKillTimeline(s) {
  if (RP_KT.has(s)) return RP_KT.get(s);
  const K = REPLAY_KILLS, min = s.box.min, out = { times: [[], []], feed: [] };
  const anchors = [[], []];
  rpEvents(s).forEach(function (e, i) {
    const info = matchEventInfo(e) || {};
    const side = e.k === "bad" ? 1 - e.s : e.s;
    let n = 0, killer = null, victim = null;
    if (e.e === "solo") { n = 1; killer = e.p; victim = e.v; }
    else if (info.cat === "fight") n = K.fight[info.size] || 1;
    else if (e.k === "good" && e.v && K.killCats.indexOf(info.cat) !== -1) { n = 1; killer = e.p; victim = e.v; }
    else if (e.k === "bad" && info.cat === "mistake" && e.p) { n = 1; victim = e.p; }
    if (n) anchors[side].push({ t: e.t, n: n, i: i, e: e, killer: killer, victim: victim });
  });
  [0, 1].forEach(function (side) {
    const total = s.box.kills[side];
    // 큰 장면부터 최종 킬 수까지만
    const list = anchors[side].slice().sort(function (a, b) { return b.n - a.n || a.t - b.t; });
    let used = 0;
    list.forEach(function (a) { const take = Math.min(a.n, total - used); a.take = take; used += take; });
    list.forEach(function (a) {
      for (let j = 0; j < a.take; j++) out.times[side].push(a.t);
      if (a.take) out.feed.push({ t: a.t, side: side, n: a.take, killer: a.killer, victim: a.victim, e: a.e });
    });
    const rest = total - used, lo = 2, hi = Math.max(lo + 1, min - 1);
    for (let j = 0; j < rest; j++) out.times[side].push(lo + (hi - lo) * (j + 0.5 + (rpJit(side * 97 + j * 13) - 0.5) * 0.6) / rest);
    out.times[side].sort(function (a, b) { return a - b; });
  });
  out.feed.sort(function (a, b) { return a.t - b.t; });
  RP_KT.set(s, out);
  return out;
}
function rpKillsAt(s, t) {
  const T = rpKillTimeline(s);
  return [0, 1].map(function (side) { let n = 0; T.times[side].forEach(function (x) { if (x <= t) n++; }); return n; });
}
function drawReplayKillFeed(m, s, t) {
  const map = document.getElementById("rp-map");
  if (!map) return;
  let box = map.querySelector(".rp-kfeed");
  if (!box) { box = document.createElement("div"); box.className = "rp-kfeed"; map.appendChild(box); }
  const K = REPLAY_KILLS, nm = function (id, side) { return '<b class="ev-n s' + side + (id === USER_ID ? " me" : "") + '">' + escapeHTML(playerName(id)) + "</b>"; };
  const rows = rpKillTimeline(s).feed.filter(function (f) { return f.t <= t && f.t > t - K.feedShow; }).slice(-K.feedMax).map(function (f) {
    const info = matchEventInfo(f.e) || {};
    const body = f.killer && f.victim ? nm(f.killer, f.side) + " ⚔ " + nm(f.victim, 1 - f.side)
      : f.victim ? "⚔ " + nm(f.victim, 1 - f.side) + " " + REPLAY_KILL_TEXT.fell
      : '<b class="ev-n s' + f.side + '">' + escapeHTML(teamShort(f.side ? m.b : m.a)) + "</b> " + REPLAY_KILL_TEXT.fight.replace("{n}", f.n);
    return '<div class="rp-kf ' + (f.side ? "b" : "a") + '">' + (info.icon || "⚔") + " " + body + "</div>";
  }).join("");
  if (box.innerHTML !== rows) box.innerHTML = rows;
}
// ----- 293 C ⑨ 오브젝트 안내 (data/replay.js REPLAY_OBJ) — 등장 알림 + 미니맵 자리 빛남 (잡은 사건 뒤엔 다시 등장까지 어둡게) -----
function rpObjState(s, o, t, min) {
  // 등장·다시 등장 시간도 사건처럼 경기 길이에 맞게 줄임 (evShownT, js/match_detail.js) — 안 줄이면 바론 사건이 바론 등장 전에 나옴
  const end = Math.floor(min), spawn = evShownT(o.spawn, end, true), respawn = evShownT(o.spawn + o.respawn, end, true) - spawn;
  // 잡힌 시각들: 그 오브젝트 사건(성공·실패 상관없이 그 자리에서 싸운 것) — 다시 등장 전에 또 생기면 무시
  const taken = [];
  rpEvents(s).forEach(function (e) {
    if (!o.match.test(e.e) || e.t < spawn - 1) return;
    const last = taken[taken.length - 1];
    if (last === undefined || e.t >= last + respawn) taken.push(e.t);
  });
  let up = t >= spawn, note = null;
  if (t >= spawn && t < spawn + REPLAY_OBJ_TEXT.show && !(taken[0] !== undefined && taken[0] <= t)) note = REPLAY_OBJ_TEXT.up;
  taken.forEach(function (k) {
    if (t >= k && t < k + respawn) up = false;
    const back = k + respawn;
    if (back < min && t >= back && t < back + REPLAY_OBJ_TEXT.show) note = REPLAY_OBJ_TEXT.again;
  });
  return { up: up, note: note ? note.replace("{icon}", o.icon).replace("{name}", o.name) : null };
}
function drawReplayObjects(s, min) {
  const map = document.getElementById("rp-map");
  if (!map) return;
  let box = map.querySelector(".rp-objs");
  if (!box) { box = document.createElement("div"); box.className = "rp-objs"; map.appendChild(box); }
  const notes = [];
  REPLAY_OBJ.forEach(function (o) {
    const st = rpObjState(s, o, Math.min(RP.t, min), min);
    const spot = map.querySelector(".rp-obj-spot." + o.id);
    if (spot) spot.classList.toggle("up", st.up);
    if (st.note) notes.push(st.note);
  });
  const html = notes.map(function (n) { return '<span class="rp-objn">' + escapeHTML(n) + "</span>"; }).join("");
  if (box.innerHTML !== html) box.innerHTML = html;
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
