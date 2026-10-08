// ===== 받은 연락 리뉴얼 (2026-10-08) — 값: data/events.js EVENT_RULES, 글: data/events.js · data/events_story.js · data/events_life.js =====
// 1) 연락 기록: 한 시즌 같은 연락 횟수·전체 받은 수 (state.eventLog = { y, n, seen: {id: 횟수}, ys: {id: 올해 횟수} })
// 2) 능력치 판정 🎲 (선택지 check)
// 3) 이야기 기억 state.flags, 조건 need.flag / noFlag 등
// 4) 관계 state.relations = { 선수 id: −100~100 } → 절친·앙숙, 주전 동료 케미 (내 경기력 ±2%까지)
// 5) 시즌 흐름 트리거 (주차·상황) + 시스템 트리거 큐 state.trigQueue (경쟁자 합류·스타 등급·우승 스킨·2군행·동료 이적)

// ----- 1) 연락 기록 -----
function eventLog() {
  if (!state.eventLog) state.eventLog = { y: state.year, n: 0, seen: {}, ys: {} };
  const L = state.eventLog;
  if (L.y !== state.year) { L.y = state.year; L.n = 0; L.ys = {}; }
  return L;
}
function logEventFired(ev) {
  const L = eventLog();
  L.seen[ev.id] = (L.seen[ev.id] || 0) + 1;
  L.ys[ev.id] = (L.ys[ev.id] || 0) + 1;
  if (ev.tab === "inbox" && !ev.always && ev.trigger !== "followUp" && ev.trigger !== "signature") L.n++;
}

// ----- 2) 능력치 판정 -----
function checkValue(stat) {
  if (state.stats[stat] !== undefined) return state.stats[stat];
  if (stat === "reputation") return state.reputation;
  if (stat === "popularity") return state.popularity;
  if (stat === "condition") return state.condition;
  if (stat === "stamina") return state.stamina;
  if (stat === "score") return playerScore(USER_ID);
  return 50;
}
function checkStatName(stat) {
  const s = STATS.find(function (x) { return x.id === stat; });
  if (s) return s.name;
  return { reputation: "평판", popularity: "인기도", condition: "컨디션", stamina: "체력", score: "스탯 점수" }[stat] || stat;
}
function checkChance(check) {
  const C = EVENT_RULES.check;
  return Math.max(C.min, Math.min(C.max, 0.5 + (checkValue(check.stat) - check.diff) * C.per));
}

// ----- 3) 조건 -----
function titleThisYear() {
  const t = myTeam();
  const ch = (state.league.season && state.league.season.champions) || {};
  return !!t && Object.keys(ch).some(function (k) { return ch[k] === t.id; });
}
function storyNeedOk(need) {
  const t = myTeam();
  if (need.minScore !== undefined && playerScore(USER_ID) < need.minScore) return false;
  if (need.maxScore !== undefined && playerScore(USER_ID) > need.maxScore) return false;
  if (need.tier !== undefined && (!t || t.tier !== need.tier)) return false;
  if (need.weeks && (state.week < need.weeks[0] || state.week > need.weeks[1])) return false;
  if (need.flag && !(state.flags && state.flags[need.flag])) return false;
  if (need.noFlag && state.flags && state.flags[need.noFlag]) return false;
  if (need.benched !== undefined && !!state.benched !== need.benched) return false;
  if (need.titleThisYear !== undefined && titleThisYear() !== need.titleThisYear) return false;
  if (need.minSalary !== undefined && (!state.contract || state.contract.salary < need.minSalary * eraMoney())) return false;
  return true;
}

// ----- 4) 관계 -----
function relationOf(id) { return (state.relations && state.relations[id]) || 0; }
function changeRelation(id, n, notes) {
  if (!n || !state.league.players[id]) return;
  if (!state.relations) state.relations = {};
  const before = relationOf(id);
  let after = Math.max(-100, Math.min(100, before + n));
  if (typeof friendGate === "function") after = friendGate(id, before, after); // 절친 칸 (js/friends.js)
  state.relations[id] = after;
  if (notes) notes.push((n > 0 ? "🤝 " : "💢 ") + playerName(id) + "와(과)의 관계 " + (n > 0 ? "+" : "") + n + " (" + relationLabel(after).name + ")");
  if (typeof friendStageCheck === "function") friendStageCheck(id, after, !!notes); // 친구·절친 단계 이야기 (js/friends.js)
}
const RELATION_LABELS = [
  { min: 50,   icon: "💙", name: "절친" },
  { min: 25,   icon: "🙂", name: "친함" },
  { min: -24,  icon: "😐", name: "보통" },
  { min: -49,  icon: "😒", name: "불편" },
  { min: -100, icon: "💢", name: "앙숙" },
];
function relationLabel(v) { return RELATION_LABELS.find(function (r) { return v >= r.min; }); }

// 주전 동료 케미: 관계 50 이상 동료마다 +0.5%, −50 이하마다 −0.5% (최대 ±2%) — js/matchsim.js userMatchContext
function chemistryBonus() {
  const t = myTeam();
  if (!t || !state.relations) return 0;
  const R = EVENT_RULES.relation;
  const s = starters(t.id);
  let sum = 0;
  POSITION_IDS.forEach(function (pos) {
    const id = s[pos];
    if (!id || id === USER_ID) return;
    const v = relationOf(id);
    if (v >= R.friendFrom) sum += R.per; else if (v <= R.foeFrom) sum -= R.per;
  });
  return Math.max(-R.max, Math.min(R.max, sum));
}

// [소속팀] 화면 카드: 관계가 있는 선수들
function relationsCardHTML() {
  const ids = Object.keys(state.relations || {}).filter(function (id) { return state.league.players[id] && relationOf(id) !== 0; })
    .sort(function (a, b) { return relationOf(b) - relationOf(a); });
  const chem = chemistryBonus();
  const mine = myTeam();
  const rows = ids.map(function (id) {
    const p = state.league.players[id], v = relationOf(id), L = relationLabel(v);
    const mate = mine && p.teamId === mine.id;
    const w = Math.round(Math.abs(v) / 2); // 막대 반쪽 (0~50%)
    return "<tr" + (mate ? ' class="me"' : "") + "><td>" + L.icon + " <b>" + escapeHTML(p.name) + '</b> <span class="muted small">' + findPosition(p.pos).name + " · " + escapeHTML(p.teamId ? teamName(p.teamId) : "FA") + (mate ? " · 동료" : "") + "</span></td>" +
      '<td class="rel-bar-cell"><div class="rel-bar"><div class="rel-fill ' + (v >= 0 ? "pos" : "neg") + '" style="' + (v >= 0 ? "left:50%" : "right:50%") + ";width:" + w + '%"></div></div></td>' +
      '<td class="r ' + (v >= 0 ? "up" : "down") + '">' + (v > 0 ? "+" : "") + v + "</td><td>" + L.name + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>🤝 선수 관계 <span class="muted small">팀 케미 ' + (chem > 0 ? '<span class="up">+' : chem < 0 ? '<span class="down">' : "<span>") + (chem * 100).toFixed(1) + "%</span> (주전 동료 중 관계 " + EVENT_RULES.relation.friendFrom + " 이상 +0.5%, " + EVENT_RULES.relation.foeFrom + " 이하 −0.5%)</span></h2>" +
    (rows ? '<div class="table-wrap"><table class="roster tlog">' + rows + "</table></div>"
      : '<p class="muted">아직 특별한 관계가 없어요. 받은 연락에서 동료·다른 선수와 얽히는 선택을 하면 관계가 생겨요.</p>') + "</div>";
}

// ----- 5) 시즌 흐름 트리거 (js/events.js triggerContext에서) -----
function birthWeek() {
  let h = 0;
  String(state.player.name).split("").forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) % 1000; });
  return 3 + (h % 44); // 3~46주
}
function inPromotion() {
  const t = myTeam();
  const s = state.league.season;
  if (!t || !s) return false;
  if (t.tier === 1) return !!s.finalOrder && s.finalOrder.slice(-2).indexOf(t.id) !== -1;
  const top = standings(["tier2", "tier2b"], tier2Ids()).slice(0, 2).map(function (r) { return r.id; });
  return top.indexOf(t.id) !== -1;
}
function storyTriggerContext(trigger) {
  const t = myTeam();
  const s = state.league.season || {};
  const w = state.week;
  switch (trigger) {
    case "seasonGoal": return w === 2 ? {} : null;
    case "mediaDay": return w === 12 ? {} : null;
    case "msiDepart": return w === 25 && s.msiTeams && t && s.msiTeams.indexOf(t.id) !== -1 ? {} : null;
    case "worldsDepart": return w === 42 && s.worldsTeams && t && s.worldsTeams.indexOf(t.id) !== -1 ? {} : null;
    case "promotion": return w === 39 && inPromotion() ? {} : null;
    case "contractYear": return w === 30 && state.contract && state.contract.endYear === state.year && !state.pendingMove ? {} : null;
    case "allStarVote": return w === ALL_STAR.week - 1 && state.year >= ALL_STAR.fromYear ? {} : null;
    case "seasonReview": return w === CONTRACT.windowStart ? {} : null;
    case "offseasonPlan": return w === 50 ? {} : null;
    case "birthday": return w === birthWeek() ? { age: state.player.age } : null;
    default: return null;
  }
}

// 시스템 트리거: 다른 코드가 queueTrigger로 넣으면 그 주(또는 다음 주) 연락 처리 때 해당 trigger 연락 하나
const QUEUE_TRIGGERS = ["rivalSigned", "fameUp", "skinMade", "benchedNow", "friendLeft", "friendVs", "friendTitle", "friendRetire", "ladderKing"]; // 친구 트리거: js/friends.js
function queueTrigger(name, ctx) {
  if (!state.trigQueue) state.trigQueue = [];
  state.trigQueue.push({ name: name, ctx: ctx || {} });
}
// 돌려주는 값: always가 아닌 선택지 연락을 보냈는지
function runQueuedTriggers() {
  const q = state.trigQueue || [];
  state.trigQueue = [];
  let fired = false;
  q.forEach(function (item) {
    const pool = EVENTS.filter(function (ev) { return ev.trigger === item.name && eventReady(ev); });
    if (!pool.length) return;
    const ev = pick(pool);
    fireEvent(ev, item.ctx);
    if (ev.tab === "inbox" && !ev.always) fired = true;
  });
  return fired;
}

// 친한 동료(관계 40 이상)가 우리 팀을 떠나면 작별 연락 (js/club_market.js npcTransfer · js/contracts.js releaseToFA)
function noteFriendLeaving(id, fromTeam, toTeam) {
  if (!state || !state.player || !fromTeam) return;
  const mine = myTeam();
  if (!mine || fromTeam.id !== mine.id || relationOf(id) < 40) return;
  queueTrigger("friendLeft", { pid: id, player: playerName(id), pteam: toTeam ? toTeam.name : "FA" });
}
