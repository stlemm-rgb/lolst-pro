// ===== 은퇴·세대교체 (122) — 값: data/league.js LEAGUE.veterans · RETIRE_RULES, 글: data/retire_stories.js =====
// 1) 새 게임에 나이 많은 선수 섞기 (addVeterans, js/league.js makeLeague)
// 2) 은퇴도 이적 목록에 (logRetire, js/league.js retirePlayer) — 메타 적응 은퇴는 '메타 적응 불가' 표시
// 3) 비시즌 이적 시장 중간(50주): 1부 선수 1명 '메타 적응이 힘들다' 은퇴 기사 (1년 1번, 1부 주전 평균보다 잘하는 선수만, 이름 옆에 종합 능력)
// 4) 은퇴 전주(51주): 관계 25 이상 선수가 있으면 20% 확률로 은퇴 상담 연락 → 효과 counsel: retire / stay / coach
// 5) 은퇴한 친구가 우리 팀 코치 → 2년 뒤 감독 (state.friends.coach)

// ----- 1) 나이 많은 선수 -----
function addVeterans() {
  const V = LEAGUE.veterans;
  if (!V) return;
  const named = (typeof NAMED_PLAYERS !== "undefined" ? NAMED_PLAYERS : []).map(function (n) { return n.name; });
  state.league.teams.forEach(function (t) {
    if (Math.random() >= V.chancePerTeam) return;
    const pool = t.roster.filter(function (id) { const p = state.league.players[id]; return id !== USER_ID && p && named.indexOf(p.name) === -1; });
    if (!pool.length) return;
    state.league.players[pick(pool)].age = randInt(V.ageRange[0], V.ageRange[1]);
  });
}

// ----- 2) 은퇴 기록 (이적 목록) -----
function logRetire(p, team) {
  if (typeof logTransfer !== "function") return;
  logTransfer({ kind: "retire", team: null, from: team ? team.id : null, id: p.id, name: p.name, pos: p.pos,
    score: Math.round(playerScore(p.id) * 10) / 10, age: p.age, fee: 0, tag: p.retireTag || null });
}

// 새 시즌 은퇴 판정 앞 (js/league.js newSeasonLeague): true = 이번엔 은퇴 안 함, "now" = 무조건 은퇴
function retireOverride(p) {
  if (p.noRetire === state.year) { delete p.noRetire; return "stay"; }
  if (p.retireNow) return "now";
  return null;
}

// ----- 매주 (js/events.js runWeeklyEvents, friendWeekly 다음) -----
function retirementWeekly() {
  if (state.week === RETIRE_RULES.metaWeek && state.league.metaRetireYear !== state.year) {
    state.league.metaRetireYear = state.year;
    metaRetire();
  }
  let fired = false;
  if (state.week === RETIRE_RULES.counselWeek && state.league.counselYear !== state.year) {
    state.league.counselYear = state.year;
    if (Math.random() < RETIRE_RULES.counselChance) fired = retireCounsel();
  }
  coachWeekly();
  return fired;
}

// ----- 3) 메타 적응 은퇴 -----
function metaRetire() {
  const P = state.league.players;
  const list = [];
  const avg = domesticBase(); // 1부 주전 평균 — 이보다 잘하는 선수만 기사로 (v1.1: 하위 선수 은퇴는 뉴스로 안 냄)
  state.league.teams.forEach(function (t) {
    if (t.tier !== 1) return;
    t.roster.forEach(function (id) {
      const p = P[id];
      if (id === USER_ID || !p || p.retireNow || playerScore(id) <= avg) return;
      list.push({ id: id, w: (100 - (p.stats.adapt || 50)) + Math.max(0, p.age - 20) * 4 }); // 적응력 낮고 나이 많을수록
    });
  });
  if (!list.length) return;
  list.sort(function (a, b) { return b.w - a.w; });
  const p = P[pick(list.slice(0, 6)).id];
  const team = findTeam(p.teamId);
  const score = playerScore(p.id).toFixed(1); // 은퇴 처리(선수 삭제) 전에 기록
  const ctx = { player: p.name + "(" + score + ")", pteam: team ? team.name : "FA", pos: findPosition(p.pos).name, age: p.age }; // 이름(종합 능력) 예: Jar(77.2)
  const ints = typeof META_RETIRE_INTERVIEWS !== "undefined" ? META_RETIRE_INTERVIEWS : [];
  ctx.interview = ints.length ? fillText(pick(ints), ctx) : "요즘 메타를 따라가기가 너무 힘들어요. 여기까지인 것 같습니다.";
  p.retireTag = "meta";
  retirePlayer(p); // 자리는 신인이 채움 (js/league.js)
  addNews("은퇴", ctx.pteam + "의 " + ctx.pos + " " + p.name + "(" + score + ", " + ctx.age + "세)이(가) 개인 방송에서 은퇴를 발표했다. \"" + ctx.interview + "\"");
  if (typeof NEWS_ARTICLES !== "undefined" && NEWS_ARTICLES.meta_retire) queueHeadline("meta_retire", "any", ctx);
}

// ----- 4) 은퇴 상담 -----
function retireCounsel() {
  const P = state.league.players;
  const ids = Object.keys(state.relations || {}).filter(function (id) {
    return id !== USER_ID && P[id] && !P[id].retireNow && relationOf(id) >= FRIEND_RULES.friendFrom;
  });
  const pool = EVENTS.filter(function (ev) { return ev.trigger === "retireCounsel" && storyNeedOk(ev.need || {}); });
  if (!ids.length || !pool.length) return false;
  // 나이가 많을수록 잘 고름
  const weighted = [];
  ids.forEach(function (id) { for (let i = 0; i < Math.max(1, P[id].age - 22); i++) weighted.push(id); });
  const id = pick(weighted);
  P[id].counselled = state.year;
  const ctx = Object.assign(friendCtx(id), { age: P[id].age });
  fireEvent(pick(pool), ctx);
  return true;
}

// 효과 counsel (js/events.js applyEffects): "retire" 은퇴 / "stay" 한 시즌 더 / "coach" 은퇴 후 우리 팀 코치
function counselEffect(v, ctx, notes) {
  const p = ctx && ctx.pid && state.league.players[ctx.pid];
  if (!p) return;
  if (v === "stay") {
    delete p.retireNow; delete p.coachFor;
    p.noRetire = state.year + 1;
    notes.push("💪 " + p.name + "은(는) 한 시즌 더 뛰기로 했다 (이번 겨울 은퇴 없음)");
  } else if (v === "retire") {
    p.retireNow = true; delete p.coachFor;
    notes.push("🎓 " + p.name + "은(는) 이번 시즌을 끝으로 은퇴한다");
  } else if (v === "coach") {
    const t = myTeam();
    p.retireNow = true;
    p.coachFor = t ? t.id : null;
    notes.push("🧑‍🏫 " + p.name + "은(는) 은퇴 후 " + (t ? t.name : "우리 팀") + " 코치로 온다 (내 훈련 효과 +" + Math.round(RETIRE_RULES.coach.trainingBonus * 100) + "%)");
  }
}

// ----- 5) 코치 → 감독 -----
// 은퇴할 때 (js/friends.js friendOnRetire에서): 우리 팀 코치로 오기로 한 선수
function coachJoin(p) {
  if (!p.coachFor) return false;
  const F = ensureFriends();
  const old = F.coach;
  F.coach = { pid: p.id, name: p.name, pos: p.pos, teamId: p.coachFor, since: state.year, role: "코치" };
  const ctx = { player: p.name, pteam: teamName(p.coachFor), pos: findPosition(p.pos).name, old: old ? old.name : "" };
  const S = typeof COACH_STORIES !== "undefined" ? COACH_STORIES : {};
  postMessage("news", "🧑‍🏫 " + p.name + ", " + ctx.pteam + " 코치로", fillText(S.join && S.join.length ? pick(S.join) : "{player}이(가) 선수 생활을 마치고 {pteam} 코치로 새 출발을 했다.", ctx),
    { notes: ["우리 팀에 있는 동안 내 훈련 효과 +" + Math.round(RETIRE_RULES.coach.trainingBonus * 100) + "%", RETIRE_RULES.coach.toManagerYears + "년 뒤 감독이 될 수 있어요"].concat(old ? [old.name + " 코치는 다른 길을 찾아 떠났다"] : []) });
  addMoment("🧑‍🏫", p.name + " 코치 합류");
  return true;
}

function coachWeekly() {
  const c = state.friends && state.friends.coach;
  if (!c || c.role !== "코치" || state.week !== 1 || state.year - c.since < RETIRE_RULES.coach.toManagerYears) return;
  c.role = "감독";
  c.managerSince = state.year;
  const ctx = { player: c.name, pteam: teamName(c.teamId) };
  const S = typeof COACH_STORIES !== "undefined" ? COACH_STORIES : {};
  postMessage("news", "📋 " + c.name + " 코치, " + ctx.pteam + " 감독으로", fillText(S.promote && S.promote.length ? pick(S.promote) : "{player} 코치가 {pteam}의 새 감독이 됐다.", ctx),
    { notes: ["우리 팀에 있는 동안 감독 신뢰 +" + RETIRE_RULES.coach.managerTrust + " (주전 경쟁에서 유리)"] });
  addMoment("📋", c.name + " 감독 취임");
}

function coachActive() {
  const c = state.friends && state.friends.coach;
  const t = myTeam();
  return c && t && c.teamId === t.id ? c : null;
}
function coachTrainingBonus() { return coachActive() ? RETIRE_RULES.coach.trainingBonus : 0; }
function coachTrust() { const c = coachActive(); return c && c.role === "감독" ? RETIRE_RULES.coach.managerTrust : 0; }

function coachCardHTML() {
  const c = state.friends && state.friends.coach;
  if (!c) return "";
  const on = coachActive();
  const eff = "훈련 효과 +" + Math.round(RETIRE_RULES.coach.trainingBonus * 100) + "%" + (c.role === "감독" ? " · 감독 신뢰 +" + RETIRE_RULES.coach.managerTrust : "");
  return '<div class="card"><h2>' + (c.role === "감독" ? "📋 친구 감독" : "🧑‍🏫 친구 코치") + "</h2>" +
    "<p><b>" + escapeHTML(c.name) + '</b> <span class="muted small">' + findPosition(c.pos).name + " 출신 · " + escapeHTML(teamName(c.teamId)) + " " + c.role + " (" + c.since + "년~)</span></p>" +
    (on ? '<p class="up">' + eff + "</p>" : '<p class="muted">다른 팀에 있어서 지금은 효과가 없어요. (' + escapeHTML(teamName(c.teamId)) + "에 있을 때 " + eff + ")</p>") +
    (c.role === "코치" ? '<p class="muted small">' + (c.since + RETIRE_RULES.coach.toManagerYears) + "년 시즌 시작에 감독이 돼요.</p>" : "") + "</div>";
}
