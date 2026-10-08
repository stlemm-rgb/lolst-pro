// ===== 친구 시스템 (121) — 데이터: data/friends.js (FRIEND_ACTIVITIES · FRIEND_STAGE_STORIES · FRIEND_RULES · 친구 연락 EVENTS) =====
// 1) 분기(3·16·29·49주)마다 친구 활동 연락: 후보 3명 × 활동 → 고르면 함께한 이야기 + 관계 +
// 2) 관계 단계: 친구 25↑, 절친 50↑ (절친 최대 3명, 칸이 차면 49에서 멈춤) → 단계 이야기 소식
// 3) 친구 연락 who: bestFriend · friendMate · friendOther · retiredFriend (js/events.js whoContext에서 부름)
// 4) 시스템 트리거: friendVs(친구 팀과 맞대결) · friendTitle(다른 팀 친구 우승) · friendRetire(친구 은퇴)
// 5) 효과 friendTip: 다른 팀 친구가 이적 정보 → 그 구단 영입 제안
// state.friends = { met: {id: {kind, since, acts, stage, lastAct, lastY, lastW}}, best: [id], retired: [{pid, name, pos, year, role}],
//                   log: [{y, w, pid, name, act, ok}], exMates: {id: 1}, done: {"2013q1": 1}, titles: {키: 1}, tip: {teamId} }

function ensureFriends() {
  if (state.friends && state.friends.met) return state.friends;
  const F = { met: {}, best: [], retired: [], log: [], exMates: {}, done: {}, titles: {}, tip: null };
  state.friends = F;
  // 예전 세이브: 관계 50 이상인 선수 중 높은 3명이 절친, 나머지는 49로
  const R = FRIEND_RULES;
  const high = Object.keys(state.relations || {}).filter(function (id) { return state.league.players[id] && relationOf(id) >= R.bestFrom; })
    .sort(function (a, b) { return relationOf(b) - relationOf(a); });
  high.forEach(function (id, i) {
    if (i < R.bestMax) F.best.push(id);
    else state.relations[id] = R.bestFrom - 1;
  });
  friendSeenTitles(true);
  return F;
}

function isBestFriend(id) { return ensureFriends().best.indexOf(id) !== -1; }

// 친구 연락에 쓰는 ctx
function friendCtx(id) {
  const p = state.league.players[id];
  if (!p) return null;
  const t = p.teamId && findTeam(p.teamId);
  return { pid: id, player: p.name, pteam: t ? t.name : "FA", pos: findPosition(p.pos).name };
}

// ----- 관계 변화 때 (js/stories.js changeRelation에서 부름) -----
// 절친 칸 관리: 돌려주는 값 = 실제로 저장할 관계 점수
function friendGate(id, before, after) {
  const F = ensureFriends(), R = FRIEND_RULES;
  const i = F.best.indexOf(id);
  if (after >= R.bestFrom && i === -1) {
    F.best = F.best.filter(function (b) { return state.league.players[b]; }); // 은퇴·삭제된 선수 정리
    if (F.best.length >= R.bestMax) {
      if (before < R.bestFrom) friendStageNews(id, "bestFull");
      return R.bestFrom - 1;
    }
    F.best.push(id);
  } else if (after < R.bestFrom && i !== -1) {
    F.best.splice(i, 1);
  }
  return after;
}

// 단계가 처음 올랐을 때 이야기 (direct = 이 선수에게 직접 생긴 변화일 때만, 팀 전체 관계 변화는 조용히)
function friendStageCheck(id, after, direct) {
  if (!direct) return;
  const F = ensureFriends(), R = FRIEND_RULES;
  const stage = after >= R.bestFrom && isBestFriend(id) ? 2 : after >= R.friendFrom ? 1 : 0;
  const m = friendMet(id);
  if (stage > (m.stage || 0)) {
    m.stage = stage;
    friendStageNews(id, stage === 2 ? "best" : "friend");
  }
}

function friendStageNews(id, key) {
  const ctx = friendCtx(id);
  const list = FRIEND_STAGE_STORIES[key];
  if (!ctx || !list || !list.length) return;
  const m = friendMet(id);
  if (key === "bestFull") {
    if (m.fullYear === state.year) return; // 같은 선수는 1년에 1번만
    m.fullYear = state.year;
  }
  const title = key === "best" ? "💙 " + ctx.player + ", 나의 절친" : key === "friend" ? "🙂 " + ctx.player + "와(과) 친구가 됐다" : "🤝 " + ctx.player + "와(과) 가까워졌다";
  const note = key === "best" ? "절친 " + ensureFriends().best.length + " / " + FRIEND_RULES.bestMax + " (같은 팀 주전이면 내 경기력 +0.5%)"
    : key === "bestFull" ? "절친 칸이 가득 차서 관계가 " + (FRIEND_RULES.bestFrom - 1) + "에서 멈췄다" : "관계 " + FRIEND_RULES.friendFrom + " 이상 = 친구";
  postMessage("news", title, fillText(pick(list), ctx), { notes: [note] });
  if (key === "best") addMoment("💙", ctx.player + "와(과) 절친");
}

function friendMet(id, kind) {
  const F = ensureFriends();
  if (!F.met[id]) F.met[id] = { kind: kind || "peer", since: state.year, acts: 0, stage: 0 };
  return F.met[id];
}

// ----- 매주 (js/events.js runWeeklyEvents 맨 앞) -----
// 돌려주는 값: 선택지 연락(분기 친구 활동)을 보냈는지
function friendWeekly() {
  const F = ensureFriends();
  const mine = myTeam();
  if (!mine) return false;
  mine.roster.forEach(function (id) { if (id !== USER_ID) F.exMates[id] = 1; }); // 예전 동료 기억
  const P = state.league.players;
  // 친구 팀과 맞대결
  const w = state.weekCtx;
  if (w && w.opp && w.opp !== mine.id) {
    const t = findTeam(w.opp);
    const f = t ? t.roster.filter(function (id) { return P[id] && relationOf(id) >= FRIEND_RULES.friendFrom; }) : [];
    if (f.length) queueTrigger("friendVs", friendCtx(pick(f)));
  }
  // 다른 팀 친구 우승
  friendSeenTitles(false).forEach(function (teamId) {
    const t = findTeam(teamId);
    const f = t ? t.roster.filter(function (id) { return P[id] && relationOf(id) >= FRIEND_RULES.friendFrom; }) : [];
    if (f.length) queueTrigger("friendTitle", friendCtx(pick(f)));
  });
  // 분기 친구 활동
  const q = FRIEND_RULES.quarters[state.week];
  if (!q || F.done[state.year + q] || state.retired) return false;
  F.done[state.year + q] = 1;
  return postFriendQuarter(q);
}

// 이번 시즌 새로 나온 우승 팀 (내 팀 제외). first = 처음엔 기록만
function friendSeenTitles(first) {
  const F = state.friends;
  const s = state.league.season;
  if (!s || !s.champions) return [];
  const mine = myTeam();
  const out = [];
  Object.keys(s.champions).forEach(function (k) {
    const key = (s.year || state.year) + ":" + k + ":" + s.champions[k];
    if (F.titles[key]) return;
    F.titles[key] = 1;
    if (!first && s.champions[k] && (!mine || s.champions[k] !== mine.id)) out.push(s.champions[k]);
  });
  return out;
}

// ----- 분기 친구 활동 연락 -----
function friendCandidates() {
  const F = ensureFriends();
  const mine = myTeam();
  const P = state.league.players;
  const kindOf = {};
  const add = function (id, kind) { if (id !== USER_ID && P[id] && !kindOf[id]) kindOf[id] = kind; };
  mine.roster.forEach(function (id) { add(id, "mate"); });
  Object.keys(F.exMates).forEach(function (id) { if (P[id] && P[id].teamId !== mine.id) add(id, "old"); });
  Object.keys(P).forEach(function (id) {
    const p = P[id], t = p.teamId && findTeam(p.teamId);
    if (!t || t.id === mine.id || (t.tier !== 1 && t.tier !== 2)) return;
    if (p.pos === state.player.position && t.tier === mine.tier) add(id, "rival");
  });
  Object.keys(P).forEach(function (id) {
    const p = P[id], t = p.teamId && findTeam(p.teamId);
    if (!t || t.id === mine.id || (t.tier !== 1 && t.tier !== 2)) return;
    if (Math.abs(p.age - state.player.age) <= 1) add(id, "peer");
  });
  const ids = Object.keys(kindOf);
  const chosen = [];
  // ① 이미 가까운 선수 1명 (관계가 높을수록 잘 나옴)
  const known = ids.filter(function (id) { return relationOf(id) >= 10; }).sort(function (a, b) { return relationOf(b) - relationOf(a); }).slice(0, 4);
  if (known.length) chosen.push(pick(known));
  // ② 나머지는 종류가 겹치지 않게
  shuffled(["mate", "rival", "old", "peer"]).forEach(function (kind) {
    if (chosen.length >= 3 || chosen.some(function (id) { return kindOf[id] === kind; })) return;
    const pool = ids.filter(function (id) { return kindOf[id] === kind && chosen.indexOf(id) === -1 && relationOf(id) > -25; });
    if (pool.length) chosen.push(pick(pool));
  });
  while (chosen.length < 3) {
    const pool = ids.filter(function (id) { return chosen.indexOf(id) === -1 && relationOf(id) > -25; });
    if (!pool.length) break;
    chosen.push(pick(pool));
  }
  return chosen.map(function (id) { return { pid: id, kind: kindOf[id] }; });
}

function postFriendQuarter(q) {
  const cands = friendCandidates();
  if (!cands.length) return false;
  const used = [];
  const opts = [];
  cands.forEach(function (c) {
    let pool = FRIEND_ACTIVITIES.filter(function (a) { return a.when.indexOf(q) !== -1 && a.kinds.indexOf(c.kind) !== -1 && used.indexOf(a.id) === -1; });
    if (!pool.length) pool = FRIEND_ACTIVITIES.filter(function (a) { return a.when.indexOf(q) !== -1 && used.indexOf(a.id) === -1; });
    if (!pool.length) return;
    const a = pick(pool);
    used.push(a.id);
    opts.push({ pid: c.pid, kind: c.kind, act: a.id });
  });
  opts.push({ rest: true });
  const choices = opts.map(function (o) { return { label: friendOptLabel(o), hint: friendOptHint(o) }; });
  postMessage("inbox", "🤝 " + FRIEND_RULES.quarterNames[q] + " · 누구와 시간을 보낼까?", FRIEND_RULES.intro[q], {
    kind: "friend", friend: { q: q, opts: opts }, ctx: {}, choices: choices,
  });
  return true;
}

function findFriendActivity(id) { return FRIEND_ACTIVITIES.find(function (a) { return a.id === id; }); }

function friendOptLabel(o) {
  if (o.rest) return FRIEND_RULES.rest.label;
  const a = findFriendActivity(o.act);
  return a.icon + " " + playerName(o.pid) + "와(과) " + a.label;
}

function friendOptHint(o) {
  if (o.rest) return "컨디션·체력 조금 회복";
  const a = findFriendActivity(o.act);
  const v = relationOf(o.pid);
  const parts = [FRIEND_RULES.kindNames[o.kind] + " · " + friendTeamText(o.pid), "지금 관계 " + v + " (" + relationLabel(v).name + ")", "관계 +" + a.relation];
  if (a.check) parts.push("🎲 성공 확률 " + Math.round(checkChance(a.check) * 100) + "% (" + checkStatName(a.check.stat) + ") · 실패하면 관계 +" + (a.failRelation || 0));
  if (a.effects && a.effects.money && eventMoney(a.effects.money)) parts.push("자금 −" + moneyText(Math.abs(eventMoney(a.effects.money))));
  return parts.join(" · ");
}

function friendTeamText(id) {
  const p = state.league.players[id];
  if (!p) return "은퇴";
  const t = p.teamId && findTeam(p.teamId);
  return (t ? t.name : "FA") + " " + findPosition(p.pos).name;
}

function friendChoiceTooExpensive(msg, index) {
  const o = msg.friend && msg.friend.opts[index];
  const a = o && !o.rest && findFriendActivity(o.act);
  return !!(a && a.effects && a.effects.money < 0 && state.money < -eventMoney(a.effects.money));
}

// 고르기 (js/events.js answerMessage에서 부름)
function answerFriend(msg, index) {
  const o = msg.friend && msg.friend.opts[index];
  if (!o || friendChoiceTooExpensive(msg, index)) return;
  const F = ensureFriends();
  let r, result;
  if (o.rest) {
    r = applyEffects(FRIEND_RULES.rest.effects, {});
    result = FRIEND_RULES.rest.result;
  } else {
    const ctx = friendCtx(o.pid);
    const a = findFriendActivity(o.act);
    if (!ctx || !a) {
      r = { changes: {}, notes: [] };
      result = "약속 날, 그 선수는 이미 다른 곳으로 떠난 뒤였다.";
    } else {
      const ok = !a.check || Math.random() < checkChance(a.check);
      const eff = Object.assign({}, ok ? a.effects : (a.failEffects || {}));
      if (eff.money && !eventMoney(eff.money)) delete eff.money; // 초창기엔 작은 돈이 0원 → 빼기
      r = applyEffects(eff, ctx);
      if (a.check) r.notes.unshift(ok ? "🎲 성공!" : "🎲 실패…");
      const m = friendMet(o.pid, o.kind);
      m.acts = (m.acts || 0) + 1;
      m.lastAct = a.id; m.lastY = state.year; m.lastW = state.week;
      changeRelation(o.pid, ok ? a.relation : (a.failRelation || 0), r.notes); // 단계 이야기는 여기서 (friendStageCheck)
      result = fillText(pick(ok ? a.stories : (a.failStories || a.stories)), ctx);
      F.log.unshift({ y: state.year, w: state.week, pid: o.pid, name: ctx.player, act: a.id, ok: ok });
      F.log = F.log.slice(0, 40);
      msg.checkOk = ok;
    }
  }
  msg.result = result;
  msg.answered = index;
  msg.read = true;
  msg.changes = r.changes;
  msg.notes = r.notes;
  state.log.unshift({
    when: state.year + "년 " + state.week + "주차",
    training: "친구 · " + msg.choices[index].label,
    message: result + (r.notes.length ? " · " + r.notes.join(", ") : ""),
    changes: r.changes,
  });
  state.log = state.log.slice(0, 30);
}

// ----- 친구 연락 who (js/events.js whoContext) — 친구 종류가 아니면 undefined -----
function friendWhoContext(who) {
  if (["bestFriend", "friendMate", "friendOther", "retiredFriend"].indexOf(who) === -1) return undefined;
  const F = ensureFriends();
  const mine = myTeam();
  const P = state.league.players;
  const R = FRIEND_RULES;
  let ids = [];
  if (who === "bestFriend") ids = F.best.filter(function (id) { return P[id] && relationOf(id) >= R.bestFrom; });
  if (who === "friendMate") ids = mine.roster.filter(function (id) { return id !== USER_ID && P[id] && relationOf(id) >= R.friendFrom; });
  if (who === "friendOther") ids = Object.keys(state.relations || {}).filter(function (id) { return P[id] && P[id].teamId && P[id].teamId !== mine.id && relationOf(id) >= R.friendFrom; });
  if (who === "retiredFriend") {
    if (!F.retired.length) return null;
    const x = pick(F.retired);
    return { pid: x.pid, player: x.name, pteam: x.role, pos: findPosition(x.pos).name, role: x.role };
  }
  return ids.length ? friendCtx(pick(ids)) : null;
}

// ----- 친구 은퇴 (js/league.js retirePlayer에서 부름) -----
function friendOnRetire(p) {
  if (!state.friends || !state.player || relationOf(p.id) < FRIEND_RULES.friendFrom) return;
  const F = state.friends;
  const role = pick(FRIEND_RULES.roles);
  F.retired.unshift({ pid: p.id, name: p.name, pos: p.pos, year: state.year, role: role, rel: relationOf(p.id) });
  F.retired = F.retired.slice(0, 12);
  const i = F.best.indexOf(p.id);
  if (i !== -1) F.best.splice(i, 1);
  const t = p.teamId && findTeam(p.teamId);
  queueTrigger("friendRetire", { pid: p.id, player: p.name, pteam: t ? t.name : "FA", pos: findPosition(p.pos).name, role: role });
}

// ----- 효과 friendTip: 다른 팀 친구의 이적 정보 (js/events.js applyEffects) -----
function friendTip(ctx, notes) {
  const p = ctx && ctx.pid && state.league.players[ctx.pid];
  const team = p && p.teamId && findTeam(p.teamId);
  const mine = myTeam();
  if (!team || (mine && team.id === mine.id)) return;
  if (isTransferWindow() && !state.retirePlanned && friendTipOffer(team.id)) {
    notes.push("📨 " + team.name + "에서 영입 제안이 왔다 (받은 연락 확인)");
    return;
  }
  ensureFriends().tip = { teamId: team.id };
  notes.push("📨 다음 이적 시장에 " + team.name + "이(가) 영입 제안을 보낼 수도 있다");
}

// 친구 구단 제안 보내기 (예산이 되고, 이미 온 제안이 없을 때). 보냈으면 true
function friendTipOffer(teamId) {
  const team = findTeam(teamId);
  const mine = myTeam();
  if (!team || (mine && team.id === mine.id)) return false;
  if (teamBudgetLeft(team.id) < userSalaryFor(nextTier(team.id))) return false;
  const already = state.inbox.some(function (m) { return m.kind === "offer" && m.answered === null && m.offer && m.offer.teamId === team.id; });
  if (already) return false;
  sendOffer(makeOffer(team.id, false));
  return true;
}

// 비시즌 이적 시장 시작 때 (js/contracts.js startTransferWindow): 저장해 둔 친구 정보로 제안 1개 더
function friendTipAtWindow() {
  const F = state.friends;
  if (!F || !F.tip) return;
  const id = F.tip.teamId;
  F.tip = null;
  if (friendTipOffer(id)) addNews("친구의 귀띔", "친구가 말해 준 대로 " + teamName(id) + "에서 영입 제안이 왔다.");
}

// ----- 화면: 친구 -----
function nextFriendWeek() {
  const weeks = Object.keys(FRIEND_RULES.quarters).map(Number).sort(function (a, b) { return a - b; });
  const F = ensureFriends();
  const next = weeks.find(function (w) { return w >= state.week && !F.done[state.year + FRIEND_RULES.quarters[w]]; });
  return next ? { year: state.year, week: next } : { year: state.year + 1, week: weeks[0] };
}

function friendBarHTML(v) {
  const pct = Math.max(0, Math.min(100, v));
  return '<div class="bar"><div class="bar-fill' + (v >= FRIEND_RULES.bestFrom ? " gold" : "") + '" style="width:' + pct + '%"></div></div>';
}

function friendLastText(m) {
  const a = m && m.lastAct && findFriendActivity(m.lastAct);
  return a ? a.icon + " " + a.label + " (" + m.lastY + "년 " + m.lastW + "주)" : "아직 함께한 활동 없음";
}

pages.friends = function () {
  const F = ensureFriends();
  const R = FRIEND_RULES;
  const P = state.league.players;
  const mine = myTeam();
  const nx = nextFriendWeek();
  const sameTeam = function (id) { return mine && P[id] && P[id].teamId === mine.id; };

  // 절친 3칸
  const best = F.best.filter(function (id) { return P[id]; });
  let slots = "";
  for (let i = 0; i < R.bestMax; i++) {
    const id = best[i];
    if (!id) {
      slots += '<div class="friend-slot empty"><div class="muted">빈 칸</div><div class="muted small">관계 ' + R.bestFrom + " 이상이 되면 절친이 돼요</div></div>";
      continue;
    }
    const m = F.met[id] || {};
    slots += '<div class="friend-slot"><div>💙 <b>' + escapeHTML(playerName(id)) + "</b>" + (sameTeam(id) ? ' <span class="joker-tag">동료</span>' : "") + "</div>" +
      '<div class="muted small">' + escapeHTML(friendTeamText(id)) + " · " + playerAge(id) + "세</div>" +
      friendBarHTML(relationOf(id)) + '<div class="small">관계 <b>' + relationOf(id) + "</b> · 함께한 활동 " + (m.acts || 0) + "번</div>" +
      '<div class="muted small">' + friendLastText(m) + "</div></div>";
  }

  // 친구·알고 지내는 선수
  const rowsFor = function (ids) {
    return ids.map(function (id) {
      const m = F.met[id] || {};
      return "<tr" + (sameTeam(id) ? ' class="me"' : "") + "><td>" + relationLabel(relationOf(id)).icon + " <b>" + escapeHTML(playerName(id)) + '</b> <span class="muted small">' + escapeHTML(friendTeamText(id)) + (sameTeam(id) ? " · 동료" : "") + "</span></td>" +
        '<td class="r">' + relationOf(id) + "</td><td>" + (m.acts || 0) + "번</td><td class=\"muted small\">" + friendLastText(m) + "</td></tr>";
    }).join("");
  };
  const ids = Object.keys(state.relations || {}).filter(function (id) { return P[id] && best.indexOf(id) === -1; })
    .sort(function (a, b) { return relationOf(b) - relationOf(a); });
  const friends = ids.filter(function (id) { return relationOf(id) >= R.friendFrom; });
  const known = ids.filter(function (id) { return relationOf(id) < R.friendFrom && relationOf(id) > -25 && F.met[id]; });
  const table = function (list, empty) {
    return list.length ? '<div class="table-wrap"><table class="roster tlog"><tr><th>선수</th><th class="r">관계</th><th>활동</th><th>마지막</th></tr>' + rowsFor(list) + "</table></div>"
      : '<p class="muted small">' + empty + "</p>";
  };

  const retired = F.retired.map(function (x) {
    return "<tr><td>🎓 <b>" + escapeHTML(x.name) + '</b> <span class="muted small">' + findPosition(x.pos).name + "</span></td><td>" + x.year + "년 은퇴</td><td>지금은 " + escapeHTML(x.role) + "</td></tr>";
  }).join("");

  const log = F.log.slice(0, 20).map(function (l) {
    const a = findFriendActivity(l.act);
    return "<tr><td class=\"muted small\">" + l.y + "년 " + l.w + "주</td><td>" + (a ? a.icon + " " : "") + escapeHTML(l.name) + "와(과) " + (a ? escapeHTML(a.label) : "") + "</td><td>" + (l.ok ? "" : '<span class="down small">어색했지만 추억</span>') + "</td></tr>";
  }).join("");

  return "<h1>친구</h1>" +
    '<div class="card"><h2>🤝 친구 활동 <span class="muted small">1년에 4번 (' + Object.keys(R.quarters).join("·") + "주)</span></h2>" +
      "<p>다음 친구 활동: <b>" + (nx.year !== state.year ? nx.year + "년 " : "") + nx.week + "주</b> (" + R.quarterNames[R.quarters[nx.week]] + ")</p>" +
      '<p class="muted small">받은 연락으로 후보 3명과 활동이 와요. 같이 시간을 보낼수록 친해져요. 관계 ' + R.friendFrom + " 이상 = 친구, " + R.bestFrom + " 이상 = 절친 (최대 " + R.bestMax + "명). 같은 팀 주전 절친은 내 경기력 +0.5%, 다른 팀 친구는 이적 소식을 알려 주기도 해요.</p></div>" +
    '<div class="card"><h2>💙 절친 <span class="muted small">' + best.length + " / " + R.bestMax + '</span></h2><div class="friend-slots">' + slots + "</div></div>" +
    '<div class="grid">' +
      '<div class="card"><h2>🙂 친구 <span class="muted small">' + friends.length + "명</span></h2>" + table(friends, "아직 친구가 없어요. 친구 활동으로 관계를 " + R.friendFrom + " 이상 올려 보세요.") + "</div>" +
      '<div class="card"><h2>👋 알고 지내는 선수 <span class="muted small">' + known.length + "명</span></h2>" + table(known, "함께 활동한 선수가 여기에 나와요.") + "</div>" +
    "</div>" +
    (retired ? '<div class="card"><h2>🎓 은퇴한 친구</h2><div class="table-wrap"><table class="roster tlog">' + retired + "</table></div></div>" : "") +
    '<div class="card"><h2>📒 함께한 활동 기록</h2>' + (log ? '<div class="table-wrap"><table class="roster tlog">' + log + "</table></div>" : '<p class="muted small">아직 기록이 없어요.</p>') + "</div>";
};
