// ===== ④ 포지션 경험 1단계 (259): 내 장면의 포지션다운 해설 — 글: data/position_voice.js =====
// 경기 재생(js/replay.js rpAddEvent)에서 부름. 효과·무작위 없음: 경기·세트·장면 번호로 글을 고름 (다시 열어도 같은 글)

function voiceHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function voicePick(list, key) {
  return list && list.length ? list[voiceHash(key) % list.length] : "";
}

// 돌려주는 값: { text, cause } 또는 null (내 장면이 아니거나 글이 없음)
function positionVoice(m, setIdx, e, i) {
  if (e.k === "psych") return null;
  const mineDid = e.p === USER_ID, hit = !mineDid && e.v === USER_ID && e.k === "good";
  if (!mineDid && !hit) return null;
  if (hit && e.e !== "solo" && ((matchEventInfo(e) || {}).size || "s") === "s") return null; // 당한 장면은 솔로킬·중간 이상만
  if (hit && e.e === "solo") { // 솔로킬 당함은 한 경기에 처음 한 번만 (신인 때는 거의 매 세트)
    const before = (m.detail ? m.detail.sets.slice(0, setIdx) : []).some(function (sd) { return (sd.ev || []).some(function (x) { return x.e === "solo" && x.v === USER_ID; }); });
    if (before) return null;
  }
  const V = POSITION_VOICE[mineDid ? e.pp : e.vp];
  if (!V) return null;
  const good = e.e === "solo" || e.k === "good";
  const key = [m.week, m.comp, m.a, m.b, setIdx, i, e.e].join("|");
  const text = voicePick(hit ? V["hit_" + e.e] || V._hit : V[e.e] || (good ? V._good : V._bad), key);
  if (!text) return null;
  let cause = "";
  if (mineDid && e.k === "bad") {
    const sd = m.detail && m.detail.sets[setIdx], R = POSITION_VOICE_RULES;
    if (sd && sd.pm !== undefined && sd.pm < R.lowMastery) cause = voicePick(POSITION_VOICE_CAUSE.mastery, key).replace(/\{champ\}/g, sd.pick || "챔피언").replace(/\{mastery\}/g, sd.pm);
    else if (careerYears() <= R.rookieYears) cause = voicePick(POSITION_VOICE_CAUSE.rookie, key);
  }
  return { text: text, cause: cause };
}

function positionVoiceHTML(m, setIdx, e, i) {
  const v = positionVoice(m, setIdx, e, i);
  if (!v) return "";
  return '<div class="rp-voice">💬 ' + escapeHTML(v.text) + (v.cause ? ' <span class="rp-cause">' + escapeHTML(v.cause) + "</span>" : "") + "</div>";
}

// ----- 2단계 (260): 이번 주 요약 창 '이번 주 내 역할' (js/dash_plus.js weekSummaryHTML에서) -----
// r = state.weekReport. 지난주 우리 팀 경기 중 내가 뛴 세트만. 없으면 "" (후보·경기 없는 주)
function positionWeekInfo(r) {
  const t = myTeam(), pos = state.player.position, me = POSITION_IDS.indexOf(pos);
  if (!t || !r || me === -1) return null;
  const sets = [], scenes = [];
  (r.teamLines || []).forEach(function (l) {
    const m = l.matchKey && findMatchByKey(l.matchKey);
    if (!m || !m.detail || !m.detail.sets) return;
    const side = m.a === t.id ? "a" : m.b === t.id ? "b" : null;
    if (!side) return;
    m.detail.sets.forEach(function (sd, si) {
      if (!sd.lanes || sd.lanes[me][side] !== USER_ID || !sd.box) return;
      sets.push({ m: m, sd: sd, side: side });
      rpEvents(sd).forEach(function (e, i) {
        if (e.p !== USER_ID || e.k === "psych") return;
        const v = positionVoice(m, si, e, i);
        if (v) scenes.push({ e: e, v: v, good: e.e === "solo" || e.k === "good", size: (matchEventInfo(e) || {}).size || "s" });
      });
    });
  });
  if (!sets.length) return null;
  // 한 줄: 좋은 장면(큰 것 먼저) → 실수 → 없음
  const rank = { l: 3, m: 2, s: 1 };
  const pickOf = function (list) { return list.slice().sort(function (x, y) { return rank[y.size] - rank[x.size]; })[0]; };
  const good = scenes.filter(function (s) { return s.good; }), bad = scenes.filter(function (s) { return !s.good; });
  const best = good.length ? pickOf(good) : bad.length ? pickOf(bad) : null;
  // 핵심 기록 2개
  let k = 0, a = 0, teamK = 0, cspm = 0, dmg = 0, min = 0, vs = 0, share = 0, solo = 0;
  sets.forEach(function (x) {
    const p = x.sd.box[x.side][me], s = x.side === "a" ? 0 : 1;
    k += p.k; a += p.a; teamK += x.sd.box.kills[s]; cspm += p.cspm; dmg += p.dmg; min += x.sd.box.min; vs += p.vs; share += p.share;
    solo += (x.sd.ev || []).filter(function (e) { return e.e === "solo" && e.p === USER_ID; }).length;
  });
  const n = sets.length;
  const val = {
    cspm: (cspm / n).toFixed(1), solo: solo + "번", kp: (teamK ? Math.round((k + a) / teamK * 100) : 0) + "%",
    vs: Math.round(vs / n), dpm: Math.round(dmg / Math.max(1, min)), share: Math.round(share / n) + "%",
  };
  const W = POSITION_WEEK;
  const stats = (W.stats[pos] || []).map(function (id) { return [W.statNames[id], val[id]]; });
  // 주력 챔피언 밴 (지금 숙련도 1위 = 이번 주 경기 때와 거의 같음)
  const top = myPositionChampions().slice().sort(function (x, y) { return (state.mastery[y] || 0) - (state.mastery[x] || 0); })[0];
  const banned = sets.filter(function (x) { return x.sd.banned && x.sd.banned.indexOf(top) !== -1; }).length;
  return { best: best, stats: stats, ban: banned ? W.ban.replace("{champ}", top).replace("{n}", banned).replace("{sets}", n) : "" };
}
function positionWeekHTML(r) {
  const x = positionWeekInfo(r);
  if (!x) return "";
  const W = POSITION_WEEK, b = x.best;
  const line = b ? escapeHTML((matchEventInfo(b.e) || {}).name || "") + " — " + escapeHTML(b.v.text) + (b.v.cause ? ' <span class="muted">' + escapeHTML(b.v.cause) + "</span>" : "") : escapeHTML(W.quiet[state.player.position] || "");
  return '<div class="ws-role"><div class="ws-role-h">' + W.title + '<span class="ws-role-st">' +
    x.stats.map(function (s) { return "<span>" + escapeHTML(s[0]) + " <b>" + escapeHTML(String(s[1])) + "</b></span>"; }).join("") + "</span></div>" +
    '<div class="ws-role-t' + (b && !b.good ? " bad" : "") + '">' + line + "</div>" + (x.ban ? '<div class="ws-role-ban">' + escapeHTML(x.ban) + "</div>" : "") + "</div>";
}

// ----- 4단계 (262): 포지션 연락 — 규칙·글: data/position_events.js -----
// 기억: state.flags.posScene = { log: [{ w 절대 주, e 장면 id(hit_solo = 솔로킬 당함), pick, pm 그때 숙련도, used }], pog: [절대 주], done: {경기 키: 1}, doneYear, last: {열쇠: 보낸 해} }
function posSceneState() {
  if (!state.flags) state.flags = {};
  if (!state.flags.posScene) state.flags.posScene = { log: [], pog: [], done: {}, doneYear: 0 };
  return state.flags.posScene;
}
// 매주 (js/events.js runWeeklyEvents, duoWeekly 다음): 지난 경기의 내 장면을 기록, 오래된 기록은 지움
function posSceneWeekly() {
  const t = myTeam(), S = posSceneState(), me = POSITION_IDS.indexOf(state.player.position), now = absWeek();
  if (!t || me === -1) return;
  if (S.doneYear !== state.year) { S.done = {}; S.doneYear = state.year; }
  userMatches().forEach(function (m) {
    if (!m.winner || !m.detail || !m.detail.sets) return;
    const key = matchKey(m);
    if (S.done[key]) return;
    S.done[key] = 1;
    const side = m.a === t.id ? "a" : m.b === t.id ? "b" : null;
    if (!side) return;
    let played = false;
    m.detail.sets.forEach(function (sd) {
      if (!sd.lanes || sd.lanes[me][side] !== USER_ID) return;
      played = true;
      (sd.ev || []).forEach(function (e) {
        const id = e.p === USER_ID ? e.e : e.v === USER_ID && e.e === "solo" ? "hit_solo" : null;
        if (id) S.log.push({ w: now, e: id, pick: sd.pick, pm: sd.pm });
      });
    });
    if (played && m.pog === USER_ID) S.pog.push(now);
  });
  const from = now - POSITION_EVENT_RULES.weeks + 1;
  S.log = S.log.filter(function (x) { return x.w >= from; });
  S.pog = S.pog.filter(function (w) { return w >= from; });
}
// 포지션 연락 + 듀오 연락(inbox, 소식 duo_pair 빼고) 이번 시즌 보낸 수 — 듀오 연락은 trigger로 셈 (원래 있던 duo_offer 같은 연락은 빼려고)
function posSeasonSent() {
  const ys = eventLog().ys;
  return EVENTS.filter(function (ev) { return ev.tab === "inbox" && (ev.trigger.indexOf("pos:") === 0 || /^duo[A-Z]/.test(ev.trigger)); })
    .reduce(function (s, ev) { return s + (ys[ev.id] || 0); }, 0);
}
// trigger "pos:열쇠" (js/friends.js timeTriggerContext에서)
function posSceneContext(key) {
  const R = POSITION_EVENT_RULES, ev = R.events[key];
  if (!ev || ev.pos !== state.player.position || !state.flags || !state.flags.posScene) return null;
  const S = state.flags.posScene;
  if (!S.last) S.last = {};
  if (S.last[key] && state.year - S.last[key] < R.gapYears) return null; // 같은 연락은 2년에 한 번
  if (posSeasonSent() >= R.seasonMax) return null;
  if (ev.noPog && S.pog.length) return null;
  const hits = S.log.filter(function (x) { return !x.used && ev.ids.indexOf(x.e) !== -1; });
  if (hits.length < ev.n) return null;
  const ctx = { n: hits.length, cause: "" };
  if (ev.mate) {
    const t = myTeam(), id = t && starters(t.id)[ev.mate];
    if (!id || id === USER_ID || !findPlayer(id)) return null;
    ctx.pid = id; ctx.player = playerName(id);
  }
  hits.forEach(function (x) { x.used = 1; });
  S.last[key] = state.year;
  const last = hits[hits.length - 1], C = POSITION_VOICE_CAUSE, VR = POSITION_VOICE_RULES, k = key + "|" + absWeek();
  if (last.pm !== undefined && last.pm < VR.lowMastery && last.pick) ctx.cause = voicePick(C.mastery, k).replace(/\{champ\}/g, last.pick).replace(/\{mastery\}/g, last.pm);
  else if (careerYears() <= VR.rookieYears) ctx.cause = voicePick(C.rookie, k);
  return ctx;
}
// 효과 relationPos: "top" → 우리 팀 그 포지션 주전과 관계 + (js/events.js applyEffects)
function applyRelationPos(pos, notes) {
  const t = myTeam(), id = t && starters(t.id)[pos];
  if (id && id !== USER_ID && findPlayer(id)) changeRelation(id, POSITION_EVENT_RULES.relationPos, notes);
}
