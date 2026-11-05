// ===== 301 패치 사고 '사기 챔피언' SS·SSS (규칙·글: data/op_patch.js OP_PATCH_RULES·OP_PATCH_TEXT) =====
// 시즌마다 OP_PATCH_RULES.chance 확률로 한 번: 챔피언 하나가 한 포지션에서 SS(4주) 또는 SSS(2주 → 사과 → 절반은 대회 사용 금지 1주)
// 저장 칸 state.opPatch = { seed, planYear, plan: { week, tier } | null, cur: 사고 | null, history: [] }
//   cur = { id, champ, pos, tier, s, live, ban, end, picks, wins, bans, pub: { 단계: true } } — s·live·ban·end는 absWeek
// 사고를 정하는 추첨은 저장되는 전용 씨앗으로 (게임 난수 Math.random을 쓰지 않음 → 사고가 없는 시즌은 결과가 그대로)
// 효과: metaTier가 사고 챔피언을 SS·SSS로 돌려줌 (js/champions.js) · 밴 확률 올림 opForceBan · 사용 금지 주엔 경기마다 처음부터 '이미 쓴 챔피언'에 넣음 opBannedChamps

function opHash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function opRng(seed) { // 작은 고정 난수 (mulberry32)
  let a = seed >>> 0;
  return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function ensureOpPatch() {
  if (!state.opPatch || typeof state.opPatch !== "object") {
    const who = (state.player && state.player.name) || "";
    state.opPatch = { seed: opHash(who + "|" + state.year + "|" + state.week), planYear: null, plan: null, cur: null, history: [] };
  }
  if (!Array.isArray(state.opPatch.history)) state.opPatch.history = [];
  return state.opPatch;
}
function opCur() { return state.opPatch && state.opPatch.cur ? state.opPatch.cur : null; }
// 지금 SS·SSS로 센 챔피언인가 → 등급 (없으면 null)
function opLiveTier(name, pos) {
  const c = opCur();
  if (!c || c.champ !== name || c.pos !== pos) return null;
  const now = absWeek();
  return now >= c.s && now < c.live ? c.tier : null;
}
function opIsBanned(name) { const c = opCur(); return !!(c && c.ban !== null && c.champ === name && absWeek() === c.ban); }
function opBannedChamps() { const c = opCur(); return c && c.ban !== null && absWeek() === c.ban ? [c.champ] : []; }
// 밴: 사고 챔피언은 상대가 먼저 밴하기 쉬움 (게임 난수는 사고 중에만 씀). 밴된 수도 셈 (기사용)
function opForceBan(ranked, banned, pos) {
  const c = opCur();
  if (!c || c.pos !== pos) return banned;
  const t = opLiveTier(c.champ, pos);
  if (!t) return banned;
  if (ranked.indexOf(c.champ) !== -1 && banned.indexOf(c.champ) === -1 && Math.random() < OP_PATCH_RULES.focusBan[t]) {
    banned.unshift(c.champ);
    if (banned.length > 3) banned.pop();
  }
  if (banned.indexOf(c.champ) !== -1) c.banMark = true; // 이 세트에서 밴됨 (세트가 끝나면 opCountSet이 한 번만 셈)
  return banned;
}
// 세트가 끝나면: 사고 챔피언을 고른 세트·이긴 세트 (기사용, js/matchsim.js playMatch)
function opCountSet(picksA, picksB, aWon) {
  const c = opCur();
  if (!c || !opLiveTier(c.champ, c.pos)) return;
  if (c.banMark) { c.bans++; c.banMark = false; }
  const inA = picksA.indexOf(c.champ) !== -1, inB = picksB.indexOf(c.champ) !== -1;
  if (inA || inB) { c.picks++; if ((inA && aWon) || (inB && !aWon)) c.wins++; }
}

// ----- 매주 (js/main.js nextWeek, 패치 다음) -----
function opPatchWeek() {
  const O = ensureOpPatch(), R = OP_PATCH_RULES, now = absWeek();
  if (O.planYear !== state.year) { // 시즌마다 한 번: 이번 시즌에 사고가 날지, 언제
    O.planYear = state.year;
    O.plan = null;
    const rnd = opRng(O.seed ^ Math.imul(state.year, 7919));
    if (state.year <= R.lastYear && rnd() < R.chance) {
      const weeks = [];
      R.startWeeks.forEach(function (w) { for (let k = w[0]; k <= w[1]; k++) weeks.push(k); });
      const week = weeks[Math.floor(rnd() * weeks.length)];
      if (week > state.week) O.plan = { week: week, tier: rnd() < R.sssShare ? "SSS" : "SS", roll: Math.floor(rnd() * 1e9) };
    }
  }
  if (O.plan && !O.cur && state.week === O.plan.week) opStart(O, O.plan);
  const c = O.cur;
  if (!c) return;
  if (now === c.s + R.statsAfter) opNews(c, "stats");
  if (c.tier === "SSS" && now === c.live) { opNews(c, "apology"); if (c.ban !== null) opNews(c, "ban"); }
  if (now >= c.end) { opNews(c, "end"); O.history.push({ year: state.year, week: state.week, champ: c.champ, pos: c.pos, tier: c.tier, picks: c.picks, wins: c.wins, bans: c.bans, banned: c.ban !== null }); O.cur = null; O.plan = null; }
}
function opStart(O, plan) {
  const R = OP_PATCH_RULES, rnd = opRng(plan.roll ^ 0x9e3779b9), now = absWeek();
  const pos = POSITION_IDS[Math.floor(rnd() * POSITION_IDS.length)];
  const sNow = state.meta && state.meta.s ? state.meta.s[pos] : null;
  const pool = releasedChampions(state.year, state.week).filter(function (ch) { return ch.positions.indexOf(pos) !== -1 && ch.name !== sNow; });
  if (!pool.length) { O.plan = null; return; }
  const champ = pool[Math.floor(rnd() * pool.length)].name, tier = plan.tier;
  const live = now + R.weeks[tier];
  const ban = tier === "SSS" && rnd() < R.banShare ? live : null;
  O.cur = { id: state.year + "-" + state.week + "-" + champ, champ: champ, pos: pos, tier: tier, s: now, live: live, ban: ban, end: ban !== null ? ban + R.banWeeks : live, picks: 0, wins: 0, bans: 0, pub: {}, n: Math.floor(rnd() * 1e6) };
  opNews(O.cur, "start");
  if (state.player && state.player.position === pos) opCoach(O.cur);
}

// ----- 글 (고르는 것도 사고 번호 n으로 — 게임 난수 안 씀) -----
function opPick(list, c, k) { return list && list.length ? list[(c.n + k * 7) % list.length] : null; }
function opFill(text, c) {
  const mine = myTeam();
  const v = {
    champ: c.champ, pos: findPosition(c.pos).name, tier: c.tier, weeks: Math.max(0, c.live - absWeek()) || OP_PATCH_RULES.weeks[c.tier],
    picks: c.picks, wins: c.wins, rate: c.picks ? Math.round(c.wins / c.picks * 100) : 0, bans: c.bans,
    me: state.player ? state.player.name : "", myTeam: mine ? mine.name : "", mastery: state.mastery ? (state.mastery[c.champ] || 0) : 0,
  };
  return String(text).replace(/\{(\w+)\}/g, function (all, k) { return v[k] !== undefined ? String(v[k]) : all; });
}
function opNews(c, stage) {
  if (c.pub[stage]) return;
  c.pub[stage] = true;
  const T = OP_PATCH_TEXT;
  let list = null, fan = null, pro = null;
  if (stage === "start") { list = T.start[c.tier]; fan = "start"; pro = "start"; }
  else if (stage === "stats") { list = c.picks ? T.stats : T.statsNone; fan = "during"; }
  else if (stage === "apology") list = T.apology;
  else if (stage === "ban") { list = T.ban; fan = "ban"; pro = "ban"; }
  else if (stage === "end") { list = T.end[c.tier]; fan = "end"; }
  const art = opPick(list, c, stage.length);
  if (art) publishHeadline({ key: "op_" + stage, headline: (c.tier === "SSS" ? "🚨 " : "⚠️ ") + opFill(art.headline, c), body: opFill(art.body, c), mine: false, priority: c.tier === "SSS" ? 70 : 50 }, { id: "op:" + c.id + ":" + stage });
  if (fan) opSocial(c, T.fan[fan], stage, false);
  if (pro) opSocial(c, T.pro[pro], stage, true);
}
function opSocial(c, list, stage, isPro) {
  const text = opPick(list, c, stage.length + (isPro ? 3 : 0));
  if (!text) return;
  let title = "@" + (opPick(SOCIAL_FAN_NAMES, c, stage.length) || "팬") + (1000 + (c.n + stage.length * 131) % 9000), proId = null;
  if (isPro) {
    const mine = myTeam(), ids = Object.keys(state.league.players).filter(function (id) { const t = state.league.players[id].teamId; return t && (!mine || t !== mine.id) && state.league.players[id].pos === c.pos; });
    if (!ids.length) return;
    proId = ids[(c.n + stage.length) % ids.length];
    title = "@" + state.league.players[proId].name;
  }
  postMessage("social", title, opFill(text, c), { read: true, proId: proId });
}
function opCoach(c) {
  const T = OP_PATCH_TEXT.coach, high = (state.mastery[c.champ] || 0) >= OP_PATCH_RULES.coachHigh;
  const msg = opPick(high ? T.high : T.low, c, 1);
  if (msg) postMessage("news", opFill(msg.title, c), opFill(msg.text, c));
}
// 화면용 메타 목록: 원래 메타 + 사고 챔피언(센 동안·사용 금지 주) — 대시보드 챔피언 칸
function opMetaList(pos) {
  const list = (state.meta.champs[pos] || []).slice(), c = opCur();
  if (c && c.pos === pos && (opLiveTier(c.champ, pos) || opIsBanned(c.champ)) && list.indexOf(c.champ) === -1) list.unshift(c.champ);
  return list;
}
// 화면 배지: 사용 금지 (metaTagHTML에서)
function opBanTagHTML(name) { return opIsBanned(name) ? ' <span class="meta-tag tier-ban">' + escapeHTML(OP_PATCH_TEXT.tag.banned) + "</span>" : ""; }
