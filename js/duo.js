// ===== ④ 3단계 (261): 영혼의 듀오 — 규칙·글: data/duo.js =====
// 기억: state.flags.duo = { cur 지금 파트너 id, p: { 선수 id: 기록 }, done: { 경기 키: 1 } (올해 센 경기), doneYear }
//   기록 = { name, sets 같이 출전한 세트, wins 그중 이긴 세트, big 큰 경기 세트, first, last 해, st 단계 번호,
//            titles [우승 이름], nick 별명, left 헤어진 해(0 = 같은 팀), vsDone 헤어진 뒤 맞대결 연락, retired 은퇴한 해 }
// 매주 (js/events.js runWeeklyEvents, timeMemWeekly 다음): 지난 경기 세트를 세고 → 단계·헤어짐·맞대결·다시 한 팀·우승을 queueTrigger로
// 효과 없음(경험만). 연락 선택지는 다른 연락처럼 관계·컨디션 ±2~3 정도

function duoState() {
  if (!state.flags) state.flags = {};
  if (!state.flags.duo) state.flags.duo = { cur: null, p: {}, done: {}, doneYear: 0 };
  return state.flags.duo;
}
function duoPartnerPos() { return DUO_RULES.positions[state.player.position] || null; }
function duoStageOf(rec) {
  const S = DUO_RULES.stages;
  let st = 0;
  for (let i = 1; i < S.length; i++) {
    const s = S[i];
    if (rec.sets < s.sets || (s.big && rec.big < s.big) || (s.rel && relationOf(rec.id) < s.rel)) break;
    st = i;
  }
  return st;
}
function duoNickLine(rec) { return rec.nick ? "팬들은 둘을 「" + rec.nick + "」(이)라고 불렀다." : ""; }
function duoCtx(rec, extra) {
  return Object.assign({ pid: rec.id, player: rec.name, sets: rec.sets, wins: rec.wins, big: rec.big, nickLine: duoNickLine(rec) }, extra || {});
}
// 별명 후보 3개: '{me}·{p} 듀오' + 두 사람 이름으로 정해지는 2개 (다시 와도 같음)
function duoNicks(rec) {
  const fill = function (s) { return s.replace(/\{me\}/g, state.player.name).replace(/\{p\}/g, rec.name); };
  const L = DUO_RULES.nicks, h = voiceHash(state.player.name + "|" + rec.name);
  const a = h % L.length, b = (a + 1 + (Math.floor(h / L.length) % (L.length - 1))) % L.length;
  return [state.player.name + "·" + rec.name + " 듀오", fill(L[a]), fill(L[b])];
}

function duoWeekly() {
  const pp = duoPartnerPos(), t = myTeam();
  if (!pp || !t) return;
  const D = duoState(), y = state.year, me = POSITION_IDS.indexOf(state.player.position), pi = POSITION_IDS.indexOf(pp);
  if (D.doneYear !== y) { D.done = {}; D.doneYear = y; }
  // 1) 지난 경기: 같이 출전한 세트 세기
  userMatches().forEach(function (m) {
    if (!m.winner || !m.detail || !m.detail.sets) return;
    const key = matchKey(m);
    if (D.done[key]) return;
    D.done[key] = 1;
    const side = m.a === t.id ? "a" : m.b === t.id ? "b" : null;
    if (!side) return;
    const big = isBigMatch(m);
    m.detail.sets.forEach(function (sd) {
      if (!sd.lanes || sd.lanes[me][side] !== USER_ID) return;
      const id = sd.lanes[pi][side], p = id && findPlayer(id);
      if (!p) return;
      let rec = D.p[id];
      if (!rec) rec = D.p[id] = { id: id, name: p.name, sets: 0, wins: 0, big: 0, first: y, last: y, st: 0, titles: [], nick: "", left: 0, vsDone: 0, retired: 0 };
      if (rec.left) { // 헤어졌다가 다시 같이 출전
        if (rec.st >= DUO_RULES.storyFrom) queueTrigger("duoBack", duoCtx(rec, { leftYear: rec.left }));
        rec.left = 0; rec.vsDone = 0;
      }
      rec.name = p.name; rec.sets++; rec.last = y;
      if ((sd.w === 0) === (side === "a")) rec.wins++;
      if (big) rec.big++;
      D.cur = id;
    });
  });
  // 2) 단계가 오르면
  Object.keys(D.p).forEach(function (id) {
    const rec = D.p[id];
    if (rec.left || rec.retired) return;
    const st = duoStageOf(rec);
    if (st <= rec.st) return;
    rec.st = st;
    if (DUO_RULES.stages[st].id === "pair") queueTrigger("duoPair", duoCtx(rec));
    if (DUO_RULES.stages[st].id === "soul") {
      const n = duoNicks(rec);
      queueTrigger("duoSoul", duoCtx(rec, { nick1: n[0], nick2: n[1], nick3: n[2] }));
    }
  });
  // 3) 우승: 지금 파트너가 단짝 이상이면
  const w = state.weekCtx || {}, cur = D.cur && D.p[D.cur];
  if (w.champion && cur && !cur.left && cur.st >= DUO_RULES.storyFrom && t.roster.indexOf(cur.id) !== -1) {
    const name = String(w.champion).replace(/ ?우승$/, "");
    cur.titles.push(y + " " + name);
    queueTrigger("duoTitle", duoCtx(cur, { titleName: name }));
  }
  // 4) 헤어짐 · 헤어진 뒤 첫 맞대결
  const nm = nextUserMatch(), opp = nm && nm.week === state.week ? (nm.a === t.id ? nm.b : nm.a) : null;
  Object.keys(D.p).forEach(function (id) {
    const rec = D.p[id], p = findPlayer(id);
    if (rec.st < DUO_RULES.storyFrom || rec.retired || !p) return;
    if (!rec.left && t.roster.indexOf(id) === -1) {
      rec.left = y;
      if (D.cur === id) D.cur = null;
      queueTrigger("duoSplit", duoCtx(rec, { pteam: p.teamId ? teamName(p.teamId) : "FA" }));
      return;
    }
    if (rec.left && !rec.vsDone && opp && p.teamId === opp) {
      rec.vsDone = 1;
      timeMem().seen["v" + id] = 1; // ③ C '옛 동료와 적으로'는 이 사람에게 안 보냄
      queueTrigger("duoVs", duoCtx(rec, { pteam: teamName(opp) }));
    }
  });
}

// 은퇴 (js/league.js retirePlayer → js/friends.js friendOnRetire 옆에서)
function duoOnRetire(p) {
  if (!state.flags || !state.flags.duo || !state.player) return;
  const D = state.flags.duo, rec = D.p[p.id];
  if (!rec || rec.retired) return;
  rec.retired = state.year;
  if (D.cur === p.id) D.cur = null;
  if (rec.st >= DUO_RULES.storyFrom) queueTrigger("duoRetire", duoCtx(rec));
}
// ③ C '다시 한 팀'(mateBack)은 단짝 이상 듀오면 duo_back이 대신 (js/friends.js timeTriggerContext)
function duoTakesOver(id) {
  const rec = state.flags && state.flags.duo && state.flags.duo.p[id];
  return !!(rec && rec.st >= DUO_RULES.storyFrom);
}
// 효과 duoNick: n → 별명 후보 n번 (0 = 별명 없음) (js/events.js applyEffects)
function applyDuoNick(v, ctx) {
  const rec = ctx && ctx.pid && state.flags && state.flags.duo && state.flags.duo.p[ctx.pid];
  if (!rec) return "";
  rec.nick = v ? ctx["nick" + v] || "" : "";
  return rec.nick ? "듀오 별명: 「" + rec.nick + "」" : "";
}

// ----- 소속팀 화면 카드 (js/league_pages.js) -----
function duoCardHTML() {
  if (!duoPartnerPos()) return "";
  const D = duoState(), T = DUO_TEXTS, S = DUO_RULES.stages;
  const cur = D.cur && D.p[D.cur] && !D.p[D.cur].left && !D.p[D.cur].retired ? D.p[D.cur] : null;
  let body = "";
  if (cur) {
    const st = S[cur.st], nx = S[cur.st + 1];
    const need = [];
    if (nx) {
      if (cur.sets < nx.sets) need.push(T.needSets.replace("{n}", nx.sets - cur.sets));
      if (nx.big && cur.big < nx.big) need.push(T.needBig.replace("{n}", nx.big - cur.big));
      if (nx.rel && relationOf(cur.id) < nx.rel) need.push(T.needRel.replace("{n}", nx.rel).replace("{now}", relationOf(cur.id)));
    }
    body = '<div class="duo-cur">' + (findPlayer(cur.id) ? portraitImg(cur.id, { face: true, size: 40 }) : "") +
      '<div><b>' + escapeHTML(cur.name) + '</b> <span class="duo-st">' + st.icon + " " + escapeHTML(st.name) + "</span>" + (cur.nick ? ' <span class="duo-nick">「' + escapeHTML(cur.nick) + "」</span>" : "") +
      '<div class="muted small">' + cur.first + "년부터 · 같이 " + cur.sets + "세트 · 세트 승률 " + Math.round(cur.wins / Math.max(1, cur.sets) * 100) + "% · 큰 경기 " + cur.big + "세트 · 관계 " + relationOf(cur.id) +
      (cur.titles.length ? " · 🏆 " + escapeHTML(cur.titles.join(", ")) : "") + "</div>" +
      (nx && need.length ? '<div class="muted small">' + escapeHTML(T.next.replace("{name}", nx.icon + " " + nx.name).replace("{need}", need.join(" · "))) + "</div>" : "") + "</div></div>";
  }
  const past = Object.keys(D.p).map(function (id) { return D.p[id]; }).filter(function (r) { return r !== cur && r.st >= 1; })
    .sort(function (a, b) { return b.sets - a.sets; }).slice(0, DUO_RULES.pastMax);
  const pastHTML = past.length ? '<div class="duo-past"><span class="muted small">' + T.past + "</span>" + past.map(function (r) {
    const st = S[r.st];
    return '<div class="small">' + st.icon + " <b>" + escapeHTML(r.name) + "</b>" + (r.nick ? " 「" + escapeHTML(r.nick) + "」" : "") + ' <span class="muted">' + r.first + "~" + (r.retired || r.left || r.last) + "년 · " + r.sets + "세트" +
      (r.titles.length ? " · 🏆 " + r.titles.length : "") + (r.retired ? " · " + T.retired.replace("{year}", r.retired) : r.left ? " · " + T.left.replace("{year}", r.left) : "") + "</span></div>";
  }).join("") + "</div>" : "";
  if (!body && !pastHTML) body = '<p class="muted">' + T.none + "</p>";
  return '<div class="card duo-card"><h2>' + T.cardTitle + "</h2>" + body + pastHTML + "</div>";
}
