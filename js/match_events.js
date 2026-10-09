// ===== 경기 이벤트: 세트마다 사건(스틸·슈퍼플레이·실수·심리)이 일어나 팀 점수를 흔듦 =====
// 사건 목록과 규칙은 data/match_events.js. playSet(js/matchsim.js)에서 부름.
// 사건 기록 하나 = { t 분, e 사건 id, s 주인공 팀(0 = a팀, 1 = b팀), p 주인공 id, pp 포지션,
//                    v 당한 선수 id, vp 포지션, x 점수(주인공 팀 기준 ±), k 종류, a(1이면 세트 뒤 심리 변화) }
//   e가 "solo"면 라인전 솔로킬, "auto:…"면 세트 뒤 심리 변화, "fin:…"면 마무리 장면

// 시리즈(경기 하나) 심리 상태: p[선수] = 자신감(+)/위축(−), t[팀] = 분위기, lose[팀] = 연속 세트 패배
function newSeriesMood() {
  return { p: {}, t: {}, lose: {}, init: {} };
}

function findMatchEvent(id) {
  return MATCH_EVENTS.find(function (e) { return e.id === id; }) || null;
}

// 사건 관련 스탯 평균 (해외 가상 팀 선수는 경기력으로 대신)
function evStatOf(p, ids) {
  const st = p.id ? statsOfId(p.id) : null;
  if (!st || !ids || !ids.length) return p.power;
  let sum = 0;
  ids.forEach(function (id) { sum += st[id]; });
  return sum / ids.length;
}

function moodKey(p, side) {
  return p.id || "x" + side + p.pos; // 해외 선수는 팀·포지션으로
}

function clampMood(v) {
  const M = MATCH_EVENT_RULES.moodMax;
  return Math.max(-M, Math.min(M, v));
}

// 심리 상태 배율: 좋은 사건이면 자신감이 높을수록 ↑, 실수면 위축될수록 ↑
function moodMult(series, p, side, teamId, good) {
  const R = MATCH_EVENT_RULES;
  let m = (series.p[moodKey(p, side)] || 0) + (series.t[teamId] || 0) * 0.5;
  if (m < 0) {
    const st = p.id ? statsOfId(p.id) : null;
    const mental = st ? st.mental : 60;
    m *= Math.max(R.mentalMin, Math.min(1, 1 - (mental - 50) / 80)); // 멘탈이 높으면 덜 흔들림
    if (p.id) m *= 1 + traitSumOf(matchTraitsOf(p.id), "psychFragile"); // 유리멘탈: 더 흔들림
  }
  return Math.max(0.2, good ? 1 + m * R.moodGood : 1 - m * R.moodBad);
}

// ----- 특성 → 사건 (data/traits.js의 ev… 효과) -----
// 특성 하나가 이 사건의 주인공 확률에 주는 배율. self = 그 특성을 가진 선수가 주인공 후보 본인인가
//   (teamBad·teamCall은 같은 팀 선수 모두에게 적용)
function traitEvFactor(fx, ev, t, ctx, teamId, self, p) {
  let add = 0;
  if (ev.id === "call_clash" && fx.teamCall) return 0;     // 타고난 리더: 콜 충돌 없음
  if (ev.id === "synergy_up" && fx.teamCall) add += fx.teamCall === true ? 1 : fx.teamCall; // 호흡 상승 ↑
  if (ev.kind === "bad") add += fx.teamBad || 0;           // 팀원 실수 ↓
  if (self) {
    if (ev.kind === "good") {
      if (fx.evGood) add += (fx.evGood.all || 0) + (fx.evGood[ev.cat] || 0);
      if (ctx.big) add += fx.evGoodBig || 0;
      if (ctx.deciding || t >= MATCH_EVENT_RULES.clutchFrom) add += fx.evClutch || 0;
      if (ctx.behind === teamId) add += fx.evGoodBehind || 0;
      if (p.sig) add += fx.signatureEv || 0;
    } else if (ev.kind === "bad") {
      if (fx.evBad) add += (fx.evBad.all || 0) + (fx.evBad[ev.cat] || 0) + (ev.greedy ? fx.evBad.greedy || 0 : 0);
      if (ctx.big) add += fx.evBadBig || 0;
      if (ctx.behind === teamId) add += fx.evBadBehind || 0;
    } else if (ev.psy && ev.psy.who === "self" && ev.psy.mood < 0) {
      if (fx.psychImmune) return 0;                          // 강철 멘탈: 흔들리지 않음
      add += fx.psychFragile || 0;                           // 유리멘탈
    }
  }
  return Math.max(0, 1 + add);
}

// 특성이 바꾸는 내 사건 점수 크기: evSwing(기복, 모두) × evPower(좋은 사건: all·분류별 / 실수: bad)
function evSizeMult(traits, ev) {
  let m = 1 + traitSumOf(traits, "evSwing");
  if (ev.kind === "good") m *= 1 + traitKeyOf(traits, "evPower", "all") + traitKeyOf(traits, "evPower", ev.cat);
  else if (ev.kind === "bad") m *= 1 + traitKeyOf(traits, "evPower", "bad");
  return Math.max(0.2, m);
}

// 후보 선수의 특성 배율 합계 + 가장 크게 작용한 특성 (타임라인 [특성] 표시용)
function traitEvMult(ev, p, team, t, ctx, teamId) {
  let mult = 1, best = null, bestF = 1;
  team.forEach(function (q) {
    if (!q.id) return;
    matchTraitsOf(q.id).forEach(function (tid) {
      const tr = findTrait(tid);
      if (!tr) return;
      const f = traitEvFactor(tr.effects, ev, t, ctx, teamId, q === p, p);
      mult *= f;
      if (f > bestF) { bestF = f; best = tid; }
    });
  });
  return { mult: mult, tr: best };
}

// 이 사건의 주인공이 될 가능성 (높을수록 잘 뽑힘)
function evActorWeight(ev, p, side, teamId, series) {
  const R = MATCH_EVENT_RULES;
  const posW = ev.pos ? (ev.pos[p.pos] || 0) : 1;
  if (!posW) return 0;
  let w = posW;
  if (ev.power) w *= Math.exp((p.power - 60) / R.statSoft); // 잘하는 선수가 표적
  if (ev.stats) {
    const v = evStatOf(p, ev.stats);
    const low = ev.kind === "bad" || ev.low; // 실수는 스탯이 낮을수록
    w *= Math.exp((low ? 60 - v : v - 60) / R.statSoft);
  }
  if (ev.kind === "good") w *= moodMult(series, p, side, teamId, true);
  if (ev.kind === "bad") w *= moodMult(series, p, side, teamId, false);
  // 챔피언 손맛 (v1.1, data/match.js CHAMP_EV): 숙련도·메타 배율(cf)이 높을수록 좋은 장면 ↑ 실수 ↓
  if (CHAMP_EV.pow && p.cf && (ev.kind === "good" || ev.kind === "bad")) w *= Math.pow(p.cf, ev.kind === "good" ? CHAMP_EV.pow : -CHAMP_EV.pow);
  return w;
}

// 당한 상대 선수 고르기
function evVictim(ev, opp, pos) {
  if (!ev.vs) return null;
  if (ev.vs === "lane") return opp.find(function (q) { return q.pos === pos; }) || null;
  if (ev.vs === "carry") {
    const c = opp.filter(function (q) { return q.pos === "adc" || q.pos === "mid"; });
    return c[0].power >= c[1].power ? c[0] : c[1];
  }
  return pick(opp.filter(function (q) { return q.pos !== pos || Math.random() < 0.5; }));
}

function weightedPick(list, weightOf) {
  const ws = list.map(weightOf);
  const total = ws.reduce(function (s, w) { return s + w; }, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= ws[i];
    if (r < 0) return list[i];
  }
  return list[list.length - 1];
}

function addRate(rate, id, v) {
  if (id) rate[id] = (rate[id] || 0) + v;
}

// ----- 전승 방지 (124, data/match.js FOCUS_RULES · SLUMP_RULES) -----
// 내 S급 특성 수 (라이벌 전용·GOAT 제외)
function userSCount() {
  return state.player.traits.filter(function (x) { const t = findTrait(x); return t && t.type === "s" && !t.rival && x !== "s_goat"; }).length;
}
// 선수 누구든 S급 특성 수 (v1.1: 집중 견제를 다른 선수도 받음). 해외 가상 선수(id 없음)는 0
function sCountOfId(id) {
  if (!id) return 0;
  if (id === USER_ID) return userSCount();
  const p = findPlayer(id);
  // 다른 선수는 라이벌 전용(🔥 리그의 에이스 등)도 셈 — 리그 최고 선수일수록 집중 견제 대상 (GOAT만 제외, 내 선수 규칙과 같음)
  return p ? (p.traits || []).filter(function (x) { const t = findTrait(x); return t && t.type === "s" && x !== "s_goat"; }).length : 0;
}
function focusSelfMult(n) { return n ? Math.max(FOCUS_RULES.userMin, 1 - FOCUS_RULES.userPerS * n) : 1; }
function focusUserMult() { return focusSelfMult(userSCount()); }
function focusMateMult(n) { return 1 + FOCUS_RULES.matePerS * (n === undefined ? userSCount() : n); }
function isDecoyEvent(ev) { return typeof DECOY !== "undefined" && DECOY.events.indexOf(ev.id) !== -1; }
// 좋은 장면 주인공 배율: 집중 견제(본인 −, 동료 +) · 미끼 장면(견제받는 본인 +) · 컨디션 난조(나만, 숨김)
//   v1.1: 나만이 아니라 S급을 가진 모든 선수에게 (모든 대회). focus = 이 세트 선수별 S급 수 { id: n }
function userFocusMult(ev, p, side, teamId, ctx) {
  if (ev.kind !== "good") return 1;
  const F = ctx.focus || {};
  const own = p.id ? F[p.id] || 0 : 0;
  let m = 1;
  if (own) m *= isDecoyEvent(ev) ? 1 + DECOY.perS * own : focusSelfMult(own); // 견제를 받으면 도주·생존 같은 '미끼' 장면은 오히려 늘어남
  const mate = side.reduce(function (mx, q) { return q !== p && q.id ? Math.max(mx, F[q.id] || 0) : mx; }, 0);
  if (mate) m *= focusMateMult(mate);
  if (p.id === USER_ID && ctx.slump) m *= SLUMP_RULES.goodMult;
  return m;
}
// 이번 경기를 컨디션 난조로 할지 (js/matchsim.js playMatch): 정규 시즌 + 최근 승률이 너무 높을 때만
function rollSlump(m) {
  if (REGULAR_COMPS.indexOf(m.comp) === -1) return false;
  const mine = myTeam();
  const done = userMatches().filter(function (x) { return x.winner && REGULAR_COMPS.indexOf(x.comp) !== -1; }).slice(-SLUMP_RULES.recent);
  if (done.length < SLUMP_RULES.minGames) return false;
  const rate = done.filter(function (x) { return x.winner === mine.id; }).length / done.length;
  if (rate < SLUMP_RULES.winRate || Math.random() >= SLUMP_RULES.chance) return false;
  state.career.slumps = (state.career.slumps || 0) + 1; // 측정용 (화면에는 안 보임)
  return true;
}

// 한 세트 사건 굴리기 → { list, a(a팀 점수 합), b, rate(선수별 평점 ±) }
// ctx: { big 큰 경기, deciding 풀세트, behind 세트 스코어에서 지고 있는 팀 } — 특성 효과용
function rollSetEvents(la, lb, teamA, teamB, laneResults, series, ctx) {
  const R = MATCH_EVENT_RULES;
  ctx = ctx || {};
  const out = { list: [], a: 0, b: 0, rate: {} };
  const sides = [la, lb], teams = [teamA, teamB];
  // 언어 소통 (v1.1): 팀 언어가 서툰 주전이 많을수록 콜 충돌·오브젝트 콜 실패 ↑ (js/world_moves.js)
  const langGap = [langGapOf(la, teamA), langGapOf(lb, teamB)];
  // 집중 견제 (v1.1): 이 세트 S급 선수 → { id: S급 수 }, 화면용 목록 out.focus [{ s, id, pos, n }]
  ctx.focus = {};
  out.focus = [];
  [0, 1].forEach(function (s) {
    sides[s].forEach(function (p) {
      const n = sCountOfId(p.id);
      if (n) { ctx.focus[p.id] = n; out.focus.push({ s: s, id: p.id, pos: p.pos, n: n }); }
    });
  });
  // 원클럽맨 등: 경기(시리즈) 시작 때 팀 분위기 +
  [0, 1].forEach(function (s) {
    if (series.init[teams[s]]) return;
    series.init[teams[s]] = 1;
    const start = sides[s].reduce(function (sum, q) { return sum + (q.id ? traitSumOf(matchTraitsOf(q.id), "teamStartMood") : 0); }, 0)
      + captainMood(teams[s], sides[s]); // 주장 (js/standing.js)
    if (start) series.t[teams[s]] = clampMood((series.t[teams[s]] || 0) + start);
  });

  // 라인전 솔로킬 (점수는 이미 라인전에 들어 있음 → 보여 주기만)
  laneResults.forEach(function (ln, i) {
    if (!ln.solo) return;
    const s = ln.aWon ? 0 : 1;
    const p = sides[s][i], v = sides[1 - s][i];
    out.list.push({ t: randInt(5, 13), e: "solo", s: s, p: p.id, pp: p.pos, v: v.id, vp: v.pos, x: 0, k: "good" });
  });

  const n = randInt(R.count[0], R.count[1]);
  const times = [];
  for (let i = 0; i < n; i++) times.push(randInt(R.timeRange[0], R.timeRange[1]));
  times.sort(function (x, y) { return x - y; });

  times.forEach(function (t) {
    const kinds = Object.keys(R.kindWeight);
    let ev = null;
    for (let tries = 0; tries < 4 && !ev; tries++) {
      const kind = weightedPick(kinds, function (k) { return R.kindWeight[k]; });
      const pool = MATCH_EVENTS.filter(function (e) { return e.kind === kind && t >= e.t[0] && t <= e.t[1]; });
      ev = weightedPick(pool, function (e) { return e.w * shakeupEvMult(e.cat); }); // 대격변 오브젝트·아이템 개편 (js/shakeup.js)
    }
    if (!ev) return;
    // 주인공: 양 팀 10명 중에서
    const cands = [];
    [0, 1].forEach(function (s) {
      sides[s].forEach(function (p) {
        const tm = traitEvMult(ev, p, sides[s], t, ctx, teams[s]); // 특성 (data/traits.js)
        const lang = LANG_RULES.clashEvents.indexOf(ev.id) !== -1 ? 1 + LANG_RULES.clash * langGap[s] : 1;
        cands.push({ p: p, s: s, w: evActorWeight(ev, p, s, teams[s], series) * tm.mult * userFocusMult(ev, p, sides[s], teams[s], ctx) * lang, tr: tm.tr });
      });
    });
    const who = weightedPick(cands, function (c) { return c.w; });
    if (!who) return;
    const p = who.p, s = who.s;
    const victim = evVictim(ev, sides[1 - s], p.pos);
    let x = 0;
    if (ev.kind !== "psych") {
      const r = R.size[ev.size];
      const swing = p.id ? evSizeMult(matchTraitsOf(p.id), ev) : 1; // 특성: 장면 크기 (evSwing·evPower)
      x = Math.round(randFloat(r[0], r[1]) * R.scale * swing * 10) / 10;
      if (ev.kind === "bad") x = -x;
      if (s === 0) out.a += x; else out.b += x;
      addRate(out.rate, p.id, (ev.kind === "good" ? 1 : -1) * R.rating[ev.size]);
      if (ev.kind === "good" && victim) addRate(out.rate, victim.id, -R.victimRating);
    } else if (ev.psy) {
      // 심리: 지금부터(이번 세트 남은 사건 + 다음 세트) 판단·실수 확률이 바뀜
      if (ev.psy.who === "team") series.t[teams[s]] = clampMood((series.t[teams[s]] || 0) + ev.psy.mood);
      else series.p[moodKey(p, s)] = clampMood((series.p[moodKey(p, s)] || 0) + ev.psy.mood);
    }
    const rec = { t: t, e: ev.id, s: s, p: p.id, pp: p.pos, v: victim ? victim.id : null, vp: victim ? victim.pos : null, x: x, k: ev.kind };
    if (who.tr) rec.tr = who.tr; // 이 사건에 작용한 특성
    if (ev.kind === "good" && p.id && ctx.focus[p.id] && isDecoyEvent(ev)) rec.call = randInt(0, DECOY.calls.length - 1); // 미끼 장면: 해설 외침
    else if (ev.kind === "good" && sides[s].some(function (q) { return q !== p && q.id && ctx.focus[q.id]; })) rec.fm = 1; // 견제받는 동료 덕분에 생긴 기회
    out.list.push(rec);
  });
  if (ctx.sigUser) sigGuaranteedPlay(out, sides, R); // 시그니처 픽: 좋은 장면 1번 보장 (js/signature.js)
  out.list.sort(function (x, y) { return x.t - y.t; });
  return out;
}

// 세트가 끝난 뒤: 마무리 장면 + 심리 변화 (다음 세트부터)
// win: 이긴 팀 쪽(0/1), flipped: 사건 덕분에 결과가 뒤집혔는지
function afterSetEvents(out, la, lb, teamA, teamB, win, flipped, series) {
  const R = MATCH_EVENT_RULES;
  const sides = [la, lb], teams = [teamA, teamB];
  const END = 99; // 경기 시간에 맞춰 화면에서 줄임

  if (Math.random() < R.finisherChance) {
    const f = pick(MATCH_FINISHERS);
    const p = pick(sides[win].filter(function (q) { return q.pos !== "support"; }));
    out.list.push({ t: END, e: "fin:" + f.id, s: win, p: p.id, pp: p.pos, v: null, vp: null, x: 0, k: "good" });
    addRate(out.rate, p.id, 0.2);
  }

  const push = function (key, s, p) {
    out.list.push({ t: END, e: "auto:" + key, s: s, p: p ? p.id : null, pp: p ? p.pos : null, v: null, vp: null, x: 0, k: "psych", a: 1 });
  };
  // 선수: 큰 슈퍼플레이 → 자신감, 실수 여러 번 → 위축
  [0, 1].forEach(function (s) {
    sides[s].forEach(function (p) {
      const mine = out.list.filter(function (e) { return e.s === s && e.pp === p.pos && !e.a; });
      const big = mine.some(function (e) { const ev = findMatchEvent(e.e); return ev && ev.kind === "good" && ev.size === "l"; });
      const bad = mine.filter(function (e) { return e.k === "bad"; }).length;
      const key = moodKey(p, s);
      if (big && (series.p[key] || 0) < R.moodMax) { series.p[key] = clampMood((series.p[key] || 0) + 1); push("confident", s, p); }
      else if (bad >= R.tiltBadCount && (series.p[key] || 0) > -R.moodMax && !(p.id && traitSumOf(matchTraitsOf(p.id), "psychImmune"))) { series.p[key] = clampMood((series.p[key] || 0) - 1); push("tilted", s, p); }
    });
  });
  // 팀: 연속 패배 → 소극적 / 사건으로 뒤집은 승리 → 분위기 반전
  const lose = 1 - win;
  series.lose[teams[win]] = 0;
  if ((series.t[teams[win]] || 0) < 0) series.t[teams[win]] = 0; // 이기면 나쁜 분위기는 풀림
  series.lose[teams[lose]] = (series.lose[teams[lose]] || 0) + 1;
  if (series.lose[teams[lose]] === R.passiveLosses) {
    const mental = average(sides[lose].map(function (p) { const st = p.id ? statsOfId(p.id) : null; return st ? st.mental : 60; }));
    if (mental < R.passiveMental) { series.t[teams[lose]] = clampMood((series.t[teams[lose]] || 0) - 1); push("passive", lose, null); }
  }
  if (flipped && (series.t[teams[win]] || 0) < R.moodMax) {
    series.t[teams[win]] = clampMood((series.t[teams[win]] || 0) + 1);
    push("momentum", win, null);
  }
}

// ----- 글자 -----
// 사건 정보 (아이콘·이름·문장) — 솔로킬·마무리·심리 변화 포함
// 선수 SNS용: 이번 주 내 선수의 슈퍼플레이(cat play 또는 큰 좋은 장면)·실수(cat mistake 또는 큰 나쁜 장면) 수 → state.weekCtx
function countSocialPlays(list) {
  const w = state.weekCtx;
  if (!w) return;
  list.forEach(function (e) {
    if (e.p !== USER_ID || e.e === "solo" || e.e.indexOf("fin:") === 0 || e.e.indexOf("auto:") === 0) return;
    const info = matchEventInfo(e);
    if (!info) return;
    if (e.k === "good" && (info.cat === "play" || info.size === "l")) w.superPlays = (w.superPlays || 0) + 1;
    if (e.k === "bad" && (info.cat === "mistake" || info.size === "l")) w.blunders = (w.blunders || 0) + 1;
  });
}

function matchEventInfo(e) {
  if (e.e === "solo") return { cat: "lane", icon: "⚔️", name: "솔로킬", text: "{p}의 솔로킬 (상대 {v})" };
  if (e.e.indexOf("auto:") === 0) { const a = AUTO_PSYCH[e.e.slice(5)]; return a ? Object.assign({ cat: "psych" }, a) : null; }
  if (e.e.indexOf("fin:") === 0) return MATCH_FINISHERS.find(function (f) { return "fin:" + f.id === e.e; }) || null;
  return findMatchEvent(e.e);
}

// 사건 문장 (이름은 nameOf(id, 팀쪽, 포지션)으로 바꿈 → 화면마다 다르게)
function matchEventText(e, nameOf) {
  const info = matchEventInfo(e);
  if (!info) return "";
  return escapeHTML(info.text)
    .replace(/\{p\}/g, function () { return e.pp ? nameOf(e.p, e.s, e.pp) : "?"; })
    .replace(/\{v\}/g, function () { return e.vp ? nameOf(e.v, 1 - e.s, e.vp) : "상대"; });
}

// 내 선수 하이라이트 (지난주 결과 한 줄용): 좋은 사건·실수 이름
function userEventHighlights(list) {
  return list.filter(function (e) { return e.p === USER_ID && e.k !== "psych" && e.e !== "solo" && e.e.indexOf("fin:") !== 0; }).map(function (e) {
    const info = matchEventInfo(e);
    return info ? info.icon + " " + info.name : "";
  }).filter(Boolean);
}
