// ===== 경기 이벤트: 세트마다 사건(스틸·슈퍼플레이·실수·심리)이 일어나 팀 점수를 흔듦 =====
// 사건 목록과 규칙은 data/match_events.js. playSet(js/matchsim.js)에서 부름.
// 사건 기록 하나 = { t 분, e 사건 id, s 주인공 팀(0 = a팀, 1 = b팀), p 주인공 id, pp 포지션,
//                    v 당한 선수 id, vp 포지션, x 점수(주인공 팀 기준 ±), k 종류, a(1이면 세트 뒤 심리 변화) }
//   e가 "solo"면 라인전 솔로킬, "auto:…"면 세트 뒤 심리 변화, "fin:…"면 마무리 장면

// 시리즈(경기 하나) 심리 상태: p[선수] = 자신감(+)/위축(−), t[팀] = 분위기, lose[팀] = 연속 세트 패배
function newSeriesMood() {
  return { p: {}, t: {}, lose: {} };
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
  }
  return Math.max(0.2, good ? 1 + m * R.moodGood : 1 - m * R.moodBad);
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

// 한 세트 사건 굴리기 → { list, a(a팀 점수 합), b, rate(선수별 평점 ±) }
function rollSetEvents(la, lb, teamA, teamB, laneResults, series) {
  const R = MATCH_EVENT_RULES;
  const out = { list: [], a: 0, b: 0, rate: {} };
  const sides = [la, lb], teams = [teamA, teamB];

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
      ev = weightedPick(pool, function (e) { return e.w; });
    }
    if (!ev) return;
    // 주인공: 양 팀 10명 중에서
    const cands = [];
    [0, 1].forEach(function (s) { sides[s].forEach(function (p) { cands.push({ p: p, s: s }); }); });
    const who = weightedPick(cands, function (c) { return evActorWeight(ev, c.p, c.s, teams[c.s], series); });
    if (!who) return;
    const p = who.p, s = who.s;
    const victim = evVictim(ev, sides[1 - s], p.pos);
    let x = 0;
    if (ev.kind !== "psych") {
      const r = R.size[ev.size];
      x = Math.round(randFloat(r[0], r[1]) * R.scale * 10) / 10;
      if (ev.kind === "bad") x = -x;
      if (s === 0) out.a += x; else out.b += x;
      addRate(out.rate, p.id, (ev.kind === "good" ? 1 : -1) * R.rating[ev.size]);
      if (ev.kind === "good" && victim) addRate(out.rate, victim.id, -R.victimRating);
    } else if (ev.psy) {
      // 심리: 지금부터(이번 세트 남은 사건 + 다음 세트) 판단·실수 확률이 바뀜
      if (ev.psy.who === "team") series.t[teams[s]] = clampMood((series.t[teams[s]] || 0) + ev.psy.mood);
      else series.p[moodKey(p, s)] = clampMood((series.p[moodKey(p, s)] || 0) + ev.psy.mood);
    }
    out.list.push({ t: t, e: ev.id, s: s, p: p.id, pp: p.pos, v: victim ? victim.id : null, vp: victim ? victim.pos : null, x: x, k: ev.kind });
  });
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
      else if (bad >= R.tiltBadCount && (series.p[key] || 0) > -R.moodMax) { series.p[key] = clampMood((series.p[key] || 0) - 1); push("tilted", s, p); }
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
