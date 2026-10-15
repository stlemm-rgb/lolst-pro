// ===== [경기 결과] 화면: 경기 요약 · 세트별 분석 · 선수 기록 =====
// 우리 팀 경기와 결승전만 상세 기록이 남아요 (m.detail). 시즌이 바뀌면 지난 시즌 상세는 사라져요.
// m.detail = { pick, joker, banned, sets: [{ w(0=a팀 승, 1=b팀 승), deciding, ta, tb(팀 점수 내역),
//   lanes: [{ a, b(선수 id), pa, pb(경기력), aWon, solo, ra, rb(평점), xa, xb(발동한 특성) }],
//   box: { min(분), kills: [a, b], a: [선수 5명], b: [...] } }] }   ← box는 js/boxscore.js
//   선수 기록: { c 챔피언, k d a, cs, cspm, dmg, share(피해 비중 %), vs(시야), ls/ms/ts(라인·운영·한타 점수) }

let resultsKey = null;   // [경기 결과]에서 보고 있는 경기 (화면에서만 씀)
let resultsTab = "sum";  // "sum" = 경기 요약, 숫자 = 세트 번호

// 경기 고유 이름: "시즌-순번"
function matchKey(m) {
  return state.league.season.year + "-" + state.league.season.matches.indexOf(m);
}

function findMatchByKey(key) {
  if (!key) return null;
  const parts = String(key).split("-");
  const season = state.league.season;
  if (Number(parts[0]) !== season.year) return null;
  return season.matches[Number(parts[1])] || null;
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

// 이번 세트에 효과가 있었던 특성
function activeTraits(id, teamId, setCtx, laneWon) {
  if (!id) return [];
  return traitsOf(id).filter(function (tid) {
    const e = findTrait(tid).effects;
    if (e.power || e.variance || e.teamMood) return true;                       // 늘 적용
    if (e.bigMatch && setCtx.match && isBigMatch(setCtx.match)) return true;     // 큰 경기
    if (e.earlyPenalty && state.week <= 12) return true;                         // 시즌 초
    if (e.clutch && setCtx.deciding) return true;                                // 풀세트
    if (e.comeback && setCtx.behind === teamId) return true;                     // 지고 있을 때
    if ((e.laneBonus || e.soloEasy) && laneWon) return true;                     // 라인전 승리
    return false;
  });
}

// 한 세트 기록 만들기 (playMatch에서 부름)
function setDetail(set, setCtx, m, userPick) {
  const team = function (t) { return { avg: round1(t.avg), lane: round1(t.lane), play: round1(t.play), macro: round1(t.macro || 0), fight: round1(t.fight || 0), comp: round1(t.comp || 0), ev: round1(t.ev || 0), luck: round1(t.luck), mood: round1(t.mood), lang: t.lang ? round1(t.lang) : undefined }; };
  const comp = function (c) { return c ? { main: c.main, n: c.n, plan: c.plan, target: c.target, match: c.match, syn: c.syn, bonus: round1(c.bonus) } : null; };
  const box = makeBoxScore(set, m, userPick);
  const end = Math.floor(box.min);
  // 경기 흐름 사건: 경기 시간 안으로 (마무리·세트 뒤 심리 변화는 마지막 분)
  //   사건 시간(최대 MATCH_EVENT_RULES.timeRange[1]분)을 실제 경기 시간 비율로 줄임
  const maxT = MATCH_EVENT_RULES.timeRange[1];
  const ev = (set.events || []).map(function (e) {
    const t = e.t >= 99 ? end : end - 1 < maxT ? Math.max(1, Math.round(e.t * (end - 1) / maxT)) : e.t;
    return Object.assign({}, e, { t: t });
  }).sort(function (x, y) { return x.t - y.t; });
  return {
    w: set.winner === m.a ? 0 : 1,
    ev: ev, flip: !!set.flipped,
    fo: set.focus && set.focus.length ? set.focus : undefined, // 🎯 집중 견제 받은 선수 (v1.1)
    deciding: !!setCtx.deciding,
    ta: team(set.teamA), tb: team(set.teamB),
    ca: comp(set.comps && set.comps.a), cb: comp(set.comps && set.comps.b), // 조합 (js/comps.js)
    lanes: set.la.map(function (pa, i) {
      const pb = set.lb[i], ln = set.lanes[i];
      return {
        a: pa.id, b: pb.id, pa: round1(lanePower(pa)), pb: round1(lanePower(pb)), aWon: ln.aWon, solo: ln.solo,
        ra: round1(setRatingOf(set, pa, pb, set.winner === m.a)),
        rb: round1(setRatingOf(set, pb, pa, set.winner === m.b)),
        xa: activeTraits(pa.id, m.a, setCtx, ln.aWon), xb: activeTraits(pb.id, m.b, setCtx, !ln.aWon),
      };
    }),
    box: box,
  };
}


// 선수 이름 (해외 가상 팀 선수는 "팀 약자 포지션")
function detailName(id, teamId, pos) {
  if (!id) return escapeHTML(teamShort(teamId)) + " " + findPosition(pos).name;
  if (id !== USER_ID && !findPlayer(id)) return '<span class="muted">(떠난 선수)</span>';
  const name = escapeHTML(playerName(id));
  return id === USER_ID ? '<b class="my-team">' + name + "</b>" : name;
}

function miniChips(ids) {
  return ids && ids.length ? ' <span class="mini-chips">' + ids.map(traitChipHTML).join("") + "</span>" : "";
}

// 팀 점수 내역 한 줄
function teamScoreText(t) {
  const play = t.play || 0; // 예전 기록에는 없음
  const comp = t.comp || 0;
  const ev = t.ev || 0; // 경기 흐름 사건 (예전 기록에는 없음)
  const total = t.avg + t.lane + play + comp + ev + t.luck + t.mood;
  return "<b>" + total.toFixed(1) + "</b> " +
    '<span class="muted small">= 선수 평균 ' + t.avg.toFixed(1) + " + 라인전 " + t.lane.toFixed(1) +
    (t.play !== undefined ? " " + (play >= 0 ? "+ " : "− ") + "운영·한타 " + Math.abs(play).toFixed(1) +
      (t.macro !== undefined && (t.macro || t.fight) ? " (스타일: 운영 " + (t.macro >= 0 ? "+" : "") + t.macro.toFixed(1) + " · 한타 " + (t.fight >= 0 ? "+" : "") + t.fight.toFixed(1) + (t.lang ? ' · <span class="down">🗣️ 언어 소통 ' + t.lang.toFixed(1) + "</span>" : "") + ")" : "") : "") +
    (comp ? " " + (comp >= 0 ? "+ " : "− ") + "조합 " + Math.abs(comp).toFixed(1) : "") +
    (t.mood ? " + 한타 특성 " + t.mood.toFixed(1) : "") +
    (t.ev !== undefined ? " " + (ev >= 0 ? "+ " : "− ") + "<b>경기 흐름 " + Math.abs(ev).toFixed(1) + "</b>" : "") +
    " " + (t.luck >= 0 ? "+ " : "− ") + "운 " + Math.abs(t.luck).toFixed(1) + "</span>";
}

// 🎯 집중 견제 안내 (v1.1): S급 특성을 가진 선수 → 상대가 집중 견제, 대신 동료 활약 기회 ↑
//   sets: 세트 상세 목록 (요약 화면은 전체, 세트 탭은 그 세트 하나)
function focusNoteHTML(m, sets) {
  const teams = [m.a, m.b];
  const acc = {}, order = [];
  sets.forEach(function (s) {
    (s.fo || []).forEach(function (f) {
      const k = f.s + ":" + (f.id || f.pos);
      if (!acc[k]) { acc[k] = { f: f, sets: 0, mates: 0, decoy: 0 }; order.push(k); }
      const a = acc[k];
      a.sets++;
      (s.ev || []).forEach(function (e) {
        if (e.s !== f.s || e.k !== "good") return;
        if (e.fm && e.p !== f.id) a.mates++;
        if (e.p === f.id && e.call !== undefined) a.decoy++;
      });
    });
  });
  if (!order.length) return "";
  const rows = order.map(function (k) {
    const a = acc[k], f = a.f;
    return "<li>🎯 <b>집중 견제</b> · " + escapeHTML(teamShort(teams[f.s])) + " " + detailName(f.id, teams[f.s], f.pos) + ' <span class="muted small">(S급 특성 ' + f.n + "개)</span> — 상대가 집중 견제해서 본인 활약 확률 ×" + focusSelfMult(f.n).toFixed(2) +
      '. <span class="up">그 덕분에 동료들이 활약할 기회가 늘었어요</span>' + ' <span class="muted small">(동료 좋은 장면 ' + a.mates + "번" + (a.decoy ? " · 미끼 장면 " + a.decoy + "번" : "") + (sets.length > 1 ? " · " + a.sets + "세트" : "") + ")</span></li>";
  }).join("");
  return '<ul class="ev-key focus-note">' + rows + "</ul>";
}

// 미끼 장면 해설 외침 한 줄
function decoyCallHTML(e) {
  return e.call !== undefined && typeof DECOY !== "undefined" && DECOY.calls[e.call] ? '<div class="ev-call">' + escapeHTML(DECOY.calls[e.call]) + "</div>" : "";
}

// 경기 흐름 타임라인 (js/match_events.js)
function timelineHTML(m, s) {
  if (!s.ev || !s.ev.length) return "";
  const teams = [m.a, m.b];
  const nameOf = function (id, side, pos) { return detailName(id, teams[side], pos); };
  const rows = s.ev.map(function (e) {
    const info = matchEventInfo(e);
    if (!info) return "";
    const side = e.s === 0 ? "a" : "b";
    const num = e.x ? '<b class="' + (e.x > 0 ? "up" : "down") + '">' + (e.x > 0 ? "+" : "−") + Math.abs(e.x).toFixed(0) + "</b>" :
      e.e === "solo" ? '<span class="muted small">라인전</span>' : e.k === "psych" ? '<span class="muted small">' + (e.a ? "다음 세트" : "심리") + "</span>" : "";
    return '<tr class="ev-row ev-' + side + " ev-" + (info.cat || "") + (e.p === USER_ID ? " me" : "") + '">' +
      '<td class="r muted small">' + (e.t < 10 ? "0" : "") + e.t + "분</td>" +
      '<td class="c">' + info.icon + "</td>" +
      '<td><span class="ev-team">' + escapeHTML(teamShort(teams[e.s])) + "</span> " + matchEventText(e, nameOf) + (e.tr ? miniChips([e.tr]) : "") + (e.sg ? ' <span class="joker-tag sig-tag">✒️ 시그니처</span>' : "") + decoyCallHTML(e) + "</td>" +
      '<td class="r">' + num + "</td></tr>";
  }).join("");
  return '<h2 class="sub">경기 흐름 <span class="muted small">숫자 = 그 팀 점수 ±(실수는 −) · 심리 = 이후 실수·슈퍼플레이 확률이 바뀜' +
    (s.flip ? ' · <b>이 세트는 경기 흐름이 승패를 뒤집었어요</b>' : "") + "</span></h2>" +
    focusNoteHTML(m, [s]) +
    '<table class="ev-table">' + rows + "</table>";
}

function kdaText(k, d, a) {
  return k + " / " + d + " / " + a;
}

function kdaRatio(k, d, a) {
  return d ? ((k + a) / d).toFixed(1) : "Perfect";
}

function scoreCell(v) {
  const cls = v >= 70 ? "up" : v < 40 ? "down" : "";
  return '<td class="r ' + cls + '">' + v + "</td>";
}

// 이 시즌 상세 기록이 있는 경기 (최신이 위)
function detailMatches() {
  return state.league.season.matches.filter(function (m) { return m.winner && m.detail; }).slice().reverse();
}

// 대시보드·일정에서 경기를 누르면 이 화면으로
function goResults(key) {
  resultsKey = key;
  resultsTab = "sum";
  selectMenu("results");
}

// ----- 화면 -----
pages.results = function () {
  const list = detailMatches();
  if (!list.length) {
    return "<h1>경기 결과</h1>" + '<div class="card"><p class="muted">아직 기록된 경기가 없어요. 우리 팀 경기와 결승전은 상세 기록이 남아요. (지난 시즌 기록은 새 시즌에 사라져요)</p></div>';
  }
  let m = findMatchByKey(resultsKey);
  if (!m || !m.detail) { m = list[0]; resultsKey = matchKey(m); }
  const mine = myTeam();

  const items = list.map(function (x) {
    const key = matchKey(x);
    const mineIn = mine && (x.a === mine.id || x.b === mine.id);
    const won = mineIn && x.winner === mine.id;
    const opp = mineIn ? (x.a === mine.id ? x.b : x.a) : null;
    const title = mineIn ? "vs " + escapeHTML(teamName(opp)) : escapeHTML(teamShort(x.a)) + " vs " + escapeHTML(teamShort(x.b));
    const score = mineIn ? (x.a === mine.id ? x.score[0] + ":" + x.score[1] : x.score[1] + ":" + x.score[0]) : x.score[0] + ":" + x.score[1];
    return '<div class="res-item' + (key === resultsKey ? " sel" : "") + '" data-rsel="' + key + '">' +
      '<div class="muted small">' + x.week + "주 · " + escapeHTML(x.label) + "</div>" +
      "<div>" + (mineIn ? '<span class="rep-tag ' + (won ? "win" : "lose") + '">' + (won ? "승" : "패") + "</span> " : '<span class="rep-tag train">결승</span> ') +
        title + " <b>" + score + "</b></div>" +
    "</div>";
  }).join("");

  const tabs = ['<button data-rtab="sum"' + (resultsTab === "sum" ? ' class="primary"' : "") + ">경기 요약</button>"].concat(m.detail.sets.map(function (s, i) {
    const w = s.w === 0 ? m.a : m.b;
    return '<button data-rtab="' + i + '"' + (resultsTab === i ? ' class="primary"' : "") + ">" + (i + 1) + "세트 · " + escapeHTML(teamShort(w)) + "</button>";
  })).join("");

  const body = resultsTab === "sum" || !m.detail.sets[resultsTab] ? seriesSummaryHTML(m) : setAnalysisHTML(m, resultsTab);

  return (
    "<h1>경기 결과</h1>" +
    '<div class="results-layout">' +
      '<div class="card res-list"><h2>' + state.year + " 시즌</h2>" + items + "</div>" +
      '<div class="res-main"><div class="buttons"><button class="primary" data-replay="' + matchKey(m) + '">▶ 다시 보기</button><span class="muted small">경기 흐름을 미니맵으로 재생해요 (결과는 같아요)</span></div>' + matchHeaderHTML(m) + '<div class="buttons res-tabs">' + tabs + "</div>" + body + "</div>" +
    "</div>"
  );
};

function matchHeaderHTML(m) {
  const d = m.detail;
  const sets = d.sets.map(function (s, i) {
    const w = s.w === 0 ? m.a : m.b;
    const comps = s.ca ? " · " + (s.ca.main ? findComp(s.ca.main).icon : "") + " vs " + (s.cb.main ? findComp(s.cb.main).icon : "") : "";
    return '<span class="chip">' + (i + 1) + "세트 " + escapeHTML(teamShort(w)) + (s.box ? " · " + s.box.kills[0] + ":" + s.box.kills[1] + " · " + Math.round(s.box.min) + "분" : "") + comps + "</span>";
  }).join("");
  return (
    '<div class="card res-head">' +
      '<div class="muted small">' + m.week + "주차 · " + escapeHTML(m.label) + " · " + m.bo + "판 " + Math.ceil(m.bo / 2) + "선승</div>" +
      '<div class="res-score">' + teamLabel(m.a) + " <b>" + m.score[0] + " : " + m.score[1] + "</b> " + teamLabel(m.b) + "</div>" +
      '<div class="small">' + (m.pogName ? "🏅 POG <b>" + escapeHTML(m.pogName) + "</b>" : "") +
        (d.sets.some(function (s) { return s.pick; })
          ? " · 내 픽 " + d.sets.map(function (s, i) {
              return (i + 1) + "세트 <b>" + escapeHTML(s.pick || "-") + "</b>" + (s.joker ? ' <span class="joker-tag">🃏</span>' : "") +
                (s.banned && s.banned.length ? ' <span class="muted small">(밴: ' + s.banned.map(escapeHTML).join(", ") + ")</span>" : "");
            }).join(" · ")
          : d.pick ? " · 내 픽 <b>" + escapeHTML(d.pick) + "</b>" + (d.joker ? ' <span class="joker-tag">🃏 조커픽</span>' : "") : "") + "</div>" +
      '<div class="muted small">피어리스 밴픽: 한 번 나온 챔피언은 같은 경기 뒤 세트에서 누구도 고를 수 없어요.</div>' +
      '<div class="chips">' + sets + "</div>" +
    "</div>"
  );
}

// 경기 요약: 선수별 시리즈 합계
function seriesSummaryHTML(m) {
  const d = m.detail;
  const rows = function (side, teamId) {
    return POSITION_IDS.map(function (pos, i) {
      const acc = { k: 0, d: 0, a: 0, cspm: 0, dmg: 0, share: 0, vs: 0, ls: 0, ms: 0, ts: 0, r: 0, n: 0, champs: [], id: null, traits: [] };
      d.sets.forEach(function (s) {
        const ln = s.lanes[i];
        acc.id = side === "a" ? ln.a : ln.b;
        acc.r += side === "a" ? ln.ra : ln.rb;
        (side === "a" ? ln.xa : ln.xb).forEach(function (t) { if (acc.traits.indexOf(t) === -1) acc.traits.push(t); });
        acc.n++;
        const p = s.box && s.box[side][i];
        if (!p) return;
        acc.k += p.k; acc.d += p.d; acc.a += p.a; acc.cspm += p.cspm; acc.dmg += p.dmg; acc.share += p.share; acc.vs += p.vs;
        acc.ls += p.ls; acc.ms += p.ms; acc.ts += p.ts;
        if (acc.champs.indexOf(p.c) === -1) acc.champs.push(p.c);
      });
      const n = acc.n || 1;
      const pog = acc.id && acc.id === m.pog;
      return '<tr class="' + (acc.id === USER_ID ? "me" : "") + '">' +
        "<td>" + findPosition(pos).name + "</td>" +
        "<td>" + detailName(acc.id, teamId, pos) + (pog ? " 🏅" : "") + miniChips(acc.traits) + "</td>" +
        '<td class="small">' + acc.champs.map(escapeHTML).join(", ") + "</td>" +
        '<td class="r">' + kdaText(acc.k, acc.d, acc.a) + '</td><td class="r muted small">' + kdaRatio(acc.k, acc.d, acc.a) + "</td>" +
        '<td class="r">' + (acc.cspm / n).toFixed(1) + "</td>" +
        '<td class="r">' + acc.dmg.toLocaleString() + ' <span class="muted small">' + (acc.share / n).toFixed(0) + "%</span></td>" +
        '<td class="r">' + acc.vs + "</td>" +
        scoreCell(Math.round(acc.ls / n)) + scoreCell(Math.round(acc.ms / n)) + scoreCell(Math.round(acc.ts / n)) +
        '<td class="r"><b>' + (acc.r / n).toFixed(1) + "</b></td>" +
      "</tr>";
    }).join("");
  };
  const head = "<tr><th>포지션</th><th>선수</th><th>챔피언</th><th class=\"r\">K / D / A</th><th class=\"r\">KDA</th><th class=\"r\">CS/분</th><th class=\"r\">피해량 (비중)</th><th class=\"r\">시야</th><th class=\"r\">라인</th><th class=\"r\">운영</th><th class=\"r\">한타</th><th class=\"r\">평점</th></tr>";
  // 주요 장면: 큰 사건·승패를 뒤집은 세트·내 선수 사건
  const key = [];
  d.sets.forEach(function (s, i) {
    (s.ev || []).forEach(function (e) {
      const info = matchEventInfo(e);
      if (!info || e.a) return;
      const big = Math.abs(e.x || 0) >= MATCH_EVENT_RULES.size.l[0] * MATCH_EVENT_RULES.scale;
      if (big || e.call !== undefined || (e.p === USER_ID && e.k !== "psych")) key.push({ set: i, e: e, info: info }); // 미끼 장면(해설 외침)도
    });
  });
  const keyHTML = key.length ? '<div class="card"><h2>주요 장면 <span class="muted small">큰 사건과 내 선수 장면 · 세트 탭에서 경기 흐름 전체</span></h2><ul class="ev-key">' +
    key.slice(0, 10).map(function (k) {
      const teams = [m.a, m.b];
      const nameOf = function (id, side, pos) { return detailName(id, teams[side], pos); };
      return "<li>" + '<span class="muted small">' + (k.set + 1) + "세트 " + k.e.t + "분</span> " + k.info.icon + " " + matchEventText(k.e, nameOf) + (k.e.tr ? miniChips([k.e.tr]) : "") + (k.e.sg ? ' <span class="joker-tag sig-tag">✒️ 시그니처</span>' : "") +
        (k.e.x ? ' <b class="' + (k.e.x > 0 ? "up" : "down") + '">' + (k.e.x > 0 ? "+" : "−") + Math.abs(k.e.x).toFixed(0) + "</b>" : "") + decoyCallHTML(k.e) + "</li>";
    }).join("") + "</ul></div>" : "";
  const focusHTML = focusNoteHTML(m, d.sets);
  return (
    (focusHTML ? '<div class="card"><h2>집중 견제 <span class="muted small">S급 특성을 가진 선수는 상대가 집중해서 막아요 (나와 다른 선수 모두)</span></h2>' + focusHTML + "</div>" : "") +
    keyHTML +
    '<div class="card"><h2>' + teamLabel(m.a) + ' <span class="muted small">시리즈 합계 (CS/분·비중·점수·평점은 평균)</span></h2><div class="table-wrap"><table class="roster box">' + head + rows("a", m.a) + "</table></div></div>" +
    '<div class="card"><h2>' + teamLabel(m.b) + '</h2><div class="table-wrap"><table class="roster box">' + head + rows("b", m.b) + "</table></div></div>" +
    '<p class="muted small">라인·운영·한타 점수는 0~100 (70 이상 초록, 40 미만 빨강). 평점은 세트 평점 평균(1~10). 경기 기록은 판정 결과에 맞춰 만들어진 값이에요.</p>'
  );
}

// 세트별 분석
function setAnalysisHTML(m, idx) {
  const s = m.detail.sets[idx];
  const winner = s.w === 0 ? m.a : m.b;
  const box = s.box;

  // 라인 맞대결 요약
  const lanes = s.lanes.map(function (l, i) {
    const pos = POSITION_IDS[i];
    const ca = box ? escapeHTML(box.a[i].c) : "", cb = box ? escapeHTML(box.b[i].c) : "";
    return "<tr>" +
      '<td class="' + (l.aWon ? "lane-win" : "") + '">' + detailName(l.a, m.a, pos) + ' <span class="muted small">' + ca + "</span>" + miniChips(l.xa) + "</td>" +
      '<td class="r">' + l.pa.toFixed(0) + "</td>" +
      '<td class="c lane-mid">' + findPosition(pos).name + '<br><span class="' + (l.solo ? "solo" : "muted") + '">' + (l.solo ? "💥" : "") + (l.aWon ? "◀" : "▶") + "</span></td>" +
      "<td>" + l.pb.toFixed(0) + "</td>" +
      '<td class="r ' + (!l.aWon ? "lane-win" : "") + '">' + miniChips(l.xb) + ' <span class="muted small">' + cb + "</span> " + detailName(l.b, m.b, pos) + "</td>" +
    "</tr>";
  }).join("");

  const boxRows = function (side, teamId) {
    if (!box) return "";
    return box[side].map(function (p, i) {
      const ln = s.lanes[i];
      const id = side === "a" ? ln.a : ln.b;
      return '<tr class="' + (id === USER_ID ? "me" : "") + '">' +
        "<td>" + findPosition(POSITION_IDS[i]).name + "</td>" +
        "<td>" + detailName(id, teamId, POSITION_IDS[i]) + (id && id === m.pog ? "" : "") + "</td>" +
        "<td>" + escapeHTML(p.c) + " " + champComps(p.c).map(function (id) { return '<span class="muted small">' + findComp(id).icon + "</span>"; }).join("") + "</td>" +
        '<td class="r">' + kdaText(p.k, p.d, p.a) + '</td><td class="r muted small">' + kdaRatio(p.k, p.d, p.a) + "</td>" +
        '<td class="r">' + p.cs + ' <span class="muted small">(' + p.cspm.toFixed(1) + ")</span></td>" +
        '<td class="r">' + p.dmg.toLocaleString() + ' <span class="muted small">' + p.share.toFixed(0) + "%</span></td>" +
        '<td class="r">' + p.vs + "</td>" +
        scoreCell(p.ls) + scoreCell(p.ms) + scoreCell(p.ts) +
        '<td class="r"><b>' + (side === "a" ? ln.ra : ln.rb).toFixed(1) + "</b></td>" +
      "</tr>";
    }).join("");
  };
  const head = "<tr><th>포지션</th><th>선수</th><th>챔피언</th><th class=\"r\">K / D / A</th><th class=\"r\">KDA</th><th class=\"r\">CS (분당)</th><th class=\"r\">피해량 (비중)</th><th class=\"r\">시야</th><th class=\"r\">라인</th><th class=\"r\">운영</th><th class=\"r\">한타</th><th class=\"r\">평점</th></tr>";
  const teamHead = function (side, teamId) {
    const won = teamId === winner;
    return '<h2>' + (won ? '<span class="rep-tag win">승</span> ' : '<span class="rep-tag lose">패</span> ') + teamLabel(teamId) +
      (box ? ' <span class="muted small">킬 ' + box.kills[side === "a" ? 0 : 1] + "</span>" : "") + "</h2>";
  };

  return (
    '<div class="card"><h2>' + (idx + 1) + "세트" + (s.deciding ? ' <span class="chip meta">풀세트</span>' : "") + " · 승리 " + teamLabel(winner) +
      (box ? ' <span class="muted small">' + Math.floor(box.min) + "분 " + Math.round((box.min % 1) * 60) + "초 · 킬 " + box.kills[0] + " : " + box.kills[1] + "</span>" : "") + "</h2>" +
      '<h2 class="sub">라인 맞대결 <span class="muted small">숫자 = 라인 경기력(경기력 + 라인전 스탯), ◀ ▶ = 라인전 이긴 쪽, 💥 = 솔로킬</span></h2>' +
      '<table class="lane-table">' + lanes + "</table>" +
      (s.ca ? '<h2 class="sub">밴픽 조합 <span class="muted small">주력 성향 = 가장 많은 성향</span></h2>' +
        '<div class="small">' + compSummaryHTML(s.ca, m.a) + "</div>" + '<div class="small">' + compSummaryHTML(s.cb, m.b) + "</div>" : "") +
      timelineHTML(m, s) +
      '<h2 class="sub">팀 점수 <span class="muted small">높은 쪽이 승리</span></h2>' +
      '<div class="small">' + teamLabel(m.a) + " " + teamScoreText(s.ta) + "</div>" +
      '<div class="small">' + teamLabel(m.b) + " " + teamScoreText(s.tb) + "</div>" +
    "</div>" +
    (box
      ? '<div class="card">' + teamHead("a", m.a) + '<div class="table-wrap"><table class="roster box">' + head + boxRows("a", m.a) + "</table></div></div>" +
        '<div class="card">' + teamHead("b", m.b) + '<div class="table-wrap"><table class="roster box">' + head + boxRows("b", m.b) + "</table></div></div>"
      : '<div class="card"><p class="muted">이 경기는 선수 기록(KDA 등)이 생기기 전에 치른 경기예요.</p></div>')
  );
}

// 대시보드 "지난주 결과" 줄 옆 버튼
function detailButtonHTML(key) {
  const m = findMatchByKey(key);
  if (!m || !m.detail) return "";
  return ' <button class="small-btn" data-mdetail="' + key + '">경기 결과 ▶</button>';
}

// 버튼 연결 (main.js renderPage에서 부름)
function bindMatchDetail(page) {
  page.querySelectorAll("[data-mdetail]").forEach(function (el) {
    el.onclick = function () { goResults(el.getAttribute("data-mdetail")); };
  });
  page.querySelectorAll("[data-replay]").forEach(function (el) { // ▶ 다시 보기 (js/replay.js)
    el.onclick = function () { openReplay(el.getAttribute("data-replay")); };
  });
  page.querySelectorAll("[data-rsel]").forEach(function (el) {
    el.onclick = function () { resultsKey = el.getAttribute("data-rsel"); resultsTab = "sum"; renderPage(); };
  });
  page.querySelectorAll("[data-rtab]").forEach(function (el) {
    el.onclick = function () {
      const v = el.getAttribute("data-rtab");
      resultsTab = v === "sum" ? "sum" : Number(v);
      renderPage();
    };
  });
}
