// ===== js/rivals.js — 맞대결 전적·구단별 빅게임 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 js/h2h.js) ━━━━━
// ===== 맞대결 전적 (170, 로드맵 ②) — 값은 data/records.js =====
// state.league.h2h = {
//   teams: { "A|B": { g: [A승, B승], s: [A세트, B세트], f: [A결승승, B결승승], st: [연승 팀 0/1, n], last: [[연도, 주, 이긴쪽 0/1, A세트, B세트, 결승 1/0], …최근이 앞] } }
//   me:    { 상대 id: { n: 이름, p: 포지션, t: 마지막 팀 이름, s: [세트 승, 패], l: [라인전 우세, 열세], k: [솔로킬, 당함], r: [내 평점 합, 상대 평점 합], g: [경기 승, 패], y: 마지막 연도 } }
// }
// 기록: js/matchsim.js playMatch → 세트마다 h2hOnSet, 경기 끝에 h2hOnMatch
// 화면: [구단 탐색] 구단 펼치기 · 대시보드 '이번 주' 경기 줄 · [선수 정보] ⚔️ 맞수 탭 · [선수 검색] 상세

function h2hData() {
  const L = state.league;
  if (!L.h2h) L.h2h = { teams: {}, me: {}, since: state.year };
  return L.h2h;
}
function h2hKey(x, y) { return x < y ? x + "|" + y : y + "|" + x; }

// ----- 기록 -----
function h2hOnSet(set, m, userIn) {
  if (!userIn) return;
  const H = h2hData();
  [[set.la, set.lb, m.a, m.b], [set.lb, set.la, m.b, m.a]].forEach(function (side) {
    const i = side[0].findIndex(function (p) { return p.id === USER_ID; });
    if (i === -1) return;
    const me = side[0][i], opp = side[1][i];
    if (!opp || !opp.id) return; // 해외 가상 팀(선수 없음)
    const won = set.winner === side[2];
    const lane = set.lanes && set.lanes[i];
    const laneWon = lane ? (side[0] === set.la ? lane.aWon : !lane.aWon) : null;
    const op = findPlayer(opp.id);
    const r = H.me[opp.id] || (H.me[opp.id] = { n: "", p: "", t: "", s: [0, 0], l: [0, 0], k: [0, 0], r: [0, 0], g: [0, 0], y: 0 });
    r.n = op ? op.name : r.n || "?";
    r.p = op ? op.pos : r.p;
    r.t = teamName(side[3]);
    r.y = state.year;
    r.s[won ? 0 : 1]++;
    if (laneWon !== null) {
      r.l[laneWon ? 0 : 1]++;
      if (lane.solo) r.k[laneWon ? 0 : 1]++;
    }
    r.r[0] += setRatingOf(set, me, opp, won);
    r.r[1] += setRatingOf(set, opp, me, !won);
    if (!m.h2hOpps) m.h2hOpps = [];
    if (m.h2hOpps.indexOf(opp.id) === -1) m.h2hOpps.push(opp.id);
  });
}

function h2hOnMatch(m) {
  const H = h2hData();
  // 내 맞수: 이 경기에서 만난 상대마다 경기 승패 1번
  if (m.h2hOpps) {
    const mine = myTeam();
    const won = mine && m.winner === mine.id;
    m.h2hOpps.forEach(function (id) { if (H.me[id]) H.me[id].g[won ? 0 : 1]++; });
    delete m.h2hOpps; // 경기 기록(세이브)에 남기지 않음
  }
  // 구단: 국내 구단이 하나라도 끼면
  if (!m.a || !m.b || !(findTeam(m.a) || findTeam(m.b))) return;
  const key = h2hKey(m.a, m.b);
  const first = key.split("|")[0];
  const r = H.teams[key] || (H.teams[key] = { g: [0, 0], s: [0, 0], f: [0, 0], st: [0, 0], last: [] });
  const wi = m.winner === first ? 0 : 1;
  const sa = first === m.a ? m.score[0] : m.score[1], sb = first === m.a ? m.score[1] : m.score[0];
  const final = m.label.indexOf("결승") !== -1 ? 1 : 0;
  r.g[wi]++;
  r.s[0] += sa; r.s[1] += sb;
  if (final) r.f[wi]++;
  r.st = r.st[1] && r.st[0] === wi ? [wi, r.st[1] + 1] : [wi, 1];
  r.last.unshift([state.year, m.week, wi, sa, sb, final]);
  if (r.last.length > H2H_RULES.lastKeep) r.last.length = H2H_RULES.lastKeep;
}

// ----- 읽기 (x 쪽에서 본 전적) -----
function h2hTeam(x, y) {
  const H = state.league && state.league.h2h;
  const r = H && H.teams[h2hKey(x, y)];
  if (!r) return null;
  const me = h2hKey(x, y).split("|")[0] === x ? 0 : 1, op = 1 - me;
  return {
    w: r.g[me], l: r.g[op], sw: r.s[me], sl: r.s[op], fw: r.f[me], fl: r.f[op],
    streak: r.st[1] ? (r.st[0] === me ? r.st[1] : -r.st[1]) : 0, // + 연승, − 연패
    last: r.last.map(function (e) { return { year: e[0], week: e[1], won: e[2] === me, my: me === 0 ? e[3] : e[4], opp: me === 0 ? e[4] : e[3], final: !!e[5] }; }),
  };
}
// 이 구단의 모든 맞대결 (경기 많은 순)
function h2hTeamList(x) {
  const H = state.league && state.league.h2h;
  if (!H) return [];
  return Object.keys(H.teams).filter(function (k) { return k.split("|").indexOf(x) !== -1; }).map(function (k) {
    const p = k.split("|"), y = p[0] === x ? p[1] : p[0];
    return Object.assign({ id: y }, h2hTeam(x, y));
  }).sort(function (a, b) { return (b.w + b.l) - (a.w + a.l) || (b.w - b.l) - (a.w - a.l); });
}
function h2hMe(id) {
  const H = state.league && state.league.h2h;
  return H && H.me[id] ? H.me[id] : null;
}

// ----- 화면 조각 -----
function h2hDotsHTML(last) {
  return '<span class="h2h-dots">' + last.slice().reverse().map(function (e) {
    return '<span class="' + (e.won ? "up" : "down") + '" title="' + e.year + "년 " + e.week + "주 " + e.my + ":" + e.opp + (e.final ? " (결승)" : "") + '">' + (e.won ? "●" : "○") + "</span>";
  }).join("") + "</span>";
}
function h2hStreakText(n) {
  if (n >= 2) return '<span class="up">' + n + "연승</span>";
  if (n <= -2) return '<span class="down">' + (-n) + "연패</span>";
  return "";
}
function h2hRecordText(r) {
  return "<b>" + r.w + "승 " + r.l + "패</b> (세트 " + r.sw + ":" + r.sl + ")";
}

// 대시보드 '이번 주' 경기 줄 아래: 상대 전적 + 내 맞수
function h2hPreviewHTML(oppId) {
  const mine = myTeam();
  if (!mine) return "";
  const parts = [];
  const r = h2hTeam(mine.id, oppId);
  parts.push(r ? "📊 상대 전적 " + h2hRecordText(r) + " · 최근 " + h2hDotsHTML(r.last) + (h2hStreakText(r.streak) ? " · " + h2hStreakText(r.streak) : "") +
    (r.fw + r.fl ? " · 결승 " + r.fw + "승 " + r.fl + "패" : "") : "📊 첫 맞대결");
  const wt = findWorldTeam(oppId);
  const os = wt ? worldStarters(wt) : findTeam(oppId) ? starters(oppId) : null;
  const oppMate = os && os[state.player.position];
  if (oppMate && !state.benched) {
    const me = h2hMe(oppMate);
    parts.push("⚔️ 맞수 " + portraitImg(oppMate, { face: true, size: 18 }) + " " + escapeHTML(playerName(oppMate)) + (me ? " 세트 " + me.s[0] + "승 " + me.s[1] + "패 · 라인전 " + me.l[0] + ":" + me.l[1] : " (첫 맞대결)"));
  }
  return '<div class="rep-row muted small h2h-row">' + parts.join(" &nbsp;|&nbsp; ") + "</div>";
}

// [구단 탐색] 구단 펼치기: 맞대결 표
function clubH2HHTML(teamId) {
  const list = h2hTeamList(teamId);
  const mine = myTeam();
  if (!list.length) return '<p class="muted small">⚔️ 맞대결 기록이 아직 없어요 (기록은 ' + (h2hData().since || state.year) + "년부터 쌓여요).</p>";
  const rows = list.slice(0, H2H_RULES.clubRows);
  const mineRow = mine && teamId !== mine.id && rows.every(function (x) { return x.id !== mine.id; }) ? list.find(function (x) { return x.id === mine.id; }) : null;
  if (mineRow) rows.push(mineRow);
  return '<h3 class="sub">⚔️ 맞대결 전적 <span class="muted small">경기 많은 순 ' + Math.min(H2H_RULES.clubRows, list.length) + "팀 · " + (h2hData().since || "") + "년부터</span></h3>" +
    '<table class="roster club-roster"><tr><th>상대</th><th class="r">경기</th><th class="r">세트</th><th>최근</th><th>연속</th><th class="r">결승</th></tr>' +
    rows.map(function (x) {
      return '<tr class="' + (mine && x.id === mine.id ? "me" : "") + '"><td>' + escapeHTML(teamName(x.id)) + '</td><td class="r">' + x.w + "승 " + x.l + "패</td><td class=\"r\">" + x.sw + ":" + x.sl +
        "</td><td>" + h2hDotsHTML(x.last) + "</td><td>" + h2hStreakText(x.streak) + '</td><td class="r">' + (x.fw + x.fl ? x.fw + "승 " + x.fl + "패" : "") + "</td></tr>";
    }).join("") + "</table>";
}
// [구단 탐색] 접힌 줄: 우리 팀 상대 전적 한 줄
function clubVsMineText(teamId) {
  const mine = myTeam();
  if (!mine || teamId === mine.id) return "";
  const r = h2hTeam(mine.id, teamId);
  return r ? "우리 팀 상대 " + r.w + "승 " + r.l + "패" + (h2hStreakText(r.streak) ? " (" + h2hStreakText(r.streak) + ")" : "") : "";
}

// [선수 정보] ⚔️ 맞수 탭
function playerRivalsHTML() {
  const H = state.league && state.league.h2h;
  const ids = H ? Object.keys(H.me) : [];
  const since = H && H.since ? H.since + "년부터" : "";
  if (!ids.length) return '<div class="card"><h2>⚔️ 맞수</h2><p class="muted">아직 기록이 없어요. 경기에 나가면 같은 라인 상대 선수와의 맞대결이 여기에 쌓여요.</p></div>';
  const list = ids.map(function (id) { return Object.assign({ id: id, sets: H.me[id].s[0] + H.me[id].s[1] }, H.me[id]); })
    .sort(function (a, b) { return b.sets - a.sets || b.y - a.y; });
  const min = H2H_RULES.nemesisMinSets;
  const rated = list.filter(function (x) { return x.sets >= min; });
  const rate = function (x) { return x.s[0] / x.sets; };
  const nemesis = rated.slice().sort(function (a, b) { return rate(a) - rate(b) || b.sets - a.sets; })[0];
  const prey = rated.slice().sort(function (a, b) { return rate(b) - rate(a) || b.sets - a.sets; })[0];
  const nameOf = function (x) { return findPlayer(x.id) ? escapeHTML(x.n) : escapeHTML(x.n) + ' <span class="muted small">(은퇴·이적)</span>'; };
  const tot = list.reduce(function (a, x) { a[0] += x.s[0]; a[1] += x.s[1]; a[2] += x.l[0]; a[3] += x.l[1]; return a; }, [0, 0, 0, 0]);
  const badge = function (label, x, cls) {
    return x ? '<div class="rep-row"><span class="rep-tag ' + cls + '">' + label + "</span>" + nameOf(x) + " · 세트 " + x.s[0] + "승 " + x.s[1] + "패 (" + Math.round(rate(x) * 100) + "%) · 라인전 " + x.l[0] + ":" + x.l[1] + "</div>" : "";
  };
  const rows = list.slice(0, H2H_RULES.meRows).map(function (x) {
    const avg = function (v) { return (v / Math.max(1, x.sets)).toFixed(1); };
    return "<tr><td>" + nameOf(x) + '</td><td class="muted small">' + (x.p ? findPosition(x.p).name : "") + " · " + escapeHTML(x.t || "") + '</td><td class="r">' + x.g[0] + "승 " + x.g[1] + "패</td>" +
      '<td class="r"><b>' + x.s[0] + ":" + x.s[1] + '</b></td><td class="r">' + x.l[0] + ":" + x.l[1] + '</td><td class="r">' + x.k[0] + " / " + x.k[1] + "</td>" +
      '<td class="r">' + avg(x.r[0]) + " vs " + avg(x.r[1]) + '</td><td class="r muted">' + x.y + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>⚔️ 맞수 <span class="muted small">같은 라인에서 만난 상대 선수 · ' + since + "</span></h2>" +
    '<p class="muted small">전체 ' + list.length + "명 · 세트 " + tot[0] + "승 " + tot[1] + "패 · 라인전 우세 " + tot[2] + ":" + tot[3] + " · 천적·단골 손님은 " + min + "세트 이상 만난 상대 중에서</p>" +
    badge("😈 천적", nemesis, "") + (prey && prey !== nemesis ? badge("😎 단골 손님", prey, "win") : "") +
    '<table class="roster"><tr><th>상대</th><th>포지션 · 마지막 팀</th><th class="r">경기</th><th class="r">세트</th><th class="r">라인전</th><th class="r">솔로킬 했/당함</th><th class="r">평균 평점 나 vs 상대</th><th class="r">마지막</th></tr>' + rows + "</table>" +
    (list.length > H2H_RULES.meRows ? '<p class="muted small">세트 많은 순 ' + H2H_RULES.meRows + "명까지 보여요.</p>" : "") +
  "</div>";
}

// [선수 검색] 상세: 나와의 전적 한 줄
function h2hDetailLineHTML(id) {
  if (id === USER_ID) return "";
  const x = h2hMe(id);
  if (!x) return "";
  return '<p class="small">⚔️ <b>나와의 전적</b> · 경기 ' + x.g[0] + "승 " + x.g[1] + "패 · 세트 " + x.s[0] + ":" + x.s[1] + " · 라인전 " + x.l[0] + ":" + x.l[1] + " · 솔로킬 " + x.k[0] + "/" + x.k[1] + " (" + x.y + "년 마지막)</p>";
}

// ━━━━━ (예전 js/biggame.js) ━━━━━
// ===== 구단별 빅게임 (172, 로드맵 ③) — 값·기사는 data/club.js =====
// 전적은 맞대결 기록(js/rivals.js h2hTeam)을 그대로 씀
// 내 기록: state.career.bigGames = { w, l, st: { 빅게임 id: 연승(+)/연패(−) }, best: 같은 라이벌 최다 연승 }
// 부르는 곳: js/main.js nextWeek(bigGameWeek, 대진 미리 만들기 뒤) · js/matchsim.js playMatch(bigGameOnMatch) · js/dashboard.js 경기 줄

// 두 구단이 고정 라이벌이면 그 빅게임 (해외 팀·없는 팀이면 null)
function bigGameOf(x, y) {
  const a = findTeam(x), b = findTeam(y);
  if (!a || !b) return null;
  return BIG_GAMES.find(function (g) { return (g.a === a.short && g.b === b.short) || (g.a === b.short && g.b === a.short); }) || null;
}
function bigGameTagHTML(g) {
  return '<span class="rep-tag biggame" title="빅게임: 이기면 인기도 보너스">🔥 ' + escapeHTML(g.name) + "</span> ";
}
function bigGameStats() {
  const c = state.career;
  if (!c.bigGames) c.bigGames = { w: 0, l: 0, st: {}, best: 0 };
  return c.bigGames;
}
function bigRecordText(r) { return r ? r.w + "승 " + r.l + "패" : "첫 맞대결"; }
function bigStreakNote(r, before) {
  if (!r) return "";
  const n = r.streak;
  if (before) {
    if (n >= 2) return "최근 맞대결은 " + n + "연승 중이다. ";
    if (n <= -2) return "최근 " + (-n) + "연패에 빠져 있어 설욕이 필요하다. ";
    return "";
  }
  if (n >= 3) return "맞대결 " + n + "연승을 이어 갔다. ";
  if (n <= -3) return "맞대결 " + (-n) + "연패의 늪에 빠졌다. ";
  return "";
}

// 새 주 시작 (대진을 만든 뒤): 우리 팀 빅게임이 있으면 예고 기사 + 감독 퀘스트
function bigGameWeek() {
  const mine = myTeam();
  if (!mine || !state.league || !state.league.season || state.retired) return;
  const wk = userWeekMatches(state.week);
  wk.matches.concat(wk.preview).forEach(function (m) {
    const opp = m.a === mine.id ? m.b : m.a;
    const g = bigGameOf(mine.id, opp);
    if (!g) return;
    const r = h2hTeam(mine.id, opp);
    queueHeadline("biggame_preview", "myPreview", { derby: g.name, icon: g.icon, opp: teamName(opp), label: m.label, record: bigRecordText(r), recordLine: r ? "두 팀의 상대 전적은 " + r.w + "승 " + r.l + "패다. " : "두 팀의 공식 첫 맞대결이다. ", streakNote: bigStreakNote(r, true) });
    giveBigGameQuest(g, opp);
  });
}

// 빅게임 퀘스트: 그 주에만 (퀘스트 2개 제한과 별도). 후보면 안 줌
function giveBigGameQuest(g, opp) {
  if (state.benched) return;
  const tpl = findQuest(BIG_GAME_RULES.quest);
  if (!tpl) return;
  if (!state.quests) state.quests = [];
  if (state.quests.some(function (q) { return q.id === tpl.id; })) return;
  state.questSeq = (state.questSeq || 0) + 1;
  const q = { uid: state.questSeq, id: tpl.id, need: 1, progress: 0, champ: null, deadline: absWeek(), opp: opp, derby: g.name };
  state.quests.push(q);
  state.career.questsGiven = (state.career.questsGiven || 0) + 1;
  postMessage("inbox", "📋 새 퀘스트: " + tpl.title, QUEST_GIVERS[tpl.giver] + ": \"" + questText(q, tpl.desc) + "\"\n보상: " + rewardText(q) + "\n기한: 이번 주", {});
}

// 경기가 끝난 뒤 (js/matchsim.js playMatch, h2hOnMatch 다음·afterUserMatch 다음)
function bigGameOnMatch(m, userIn) {
  const g = bigGameOf(m.a, m.b);
  if (!g) return;
  const mine = myTeam();
  const score = Math.max(m.score[0], m.score[1]) + ":" + Math.min(m.score[0], m.score[1]);
  if (!mine || (m.a !== mine.id && m.b !== mine.id)) {
    const rw = h2hTeam(m.winner, m.loser);
    addNews(g.icon + " " + g.name, fillNews(teamName(m.winner) + "이(가) " + m.label + "에서 " + teamName(m.loser) + "을(를) " + score + "로 꺾었다. (상대 전적 " + bigRecordText(rw) + ")", {}));
    return;
  }
  const won = m.winner === mine.id;
  const opp = won ? m.loser : m.winner;
  const r = h2hTeam(mine.id, opp);
  if (m.label.indexOf("결승") === -1) {
    queueHeadline("biggame_result", won ? "myWin" : "myLoss", { derby: g.name, icon: g.icon, opp: teamName(opp), label: m.label, score: score, record: bigRecordText(r), streakNote: bigStreakNote(r, false) });
  }
  const quest = (state.quests || []).find(function (q) { return q.id === BIG_GAME_RULES.quest && q.opp === opp; });
  if (!userIn) {
    if (quest) state.quests.splice(state.quests.indexOf(quest), 1);
    return;
  }
  // 내 기록
  const B = bigGameStats();
  if (won) B.w++; else B.l++;
  const s = B.st[g.id] || 0;
  B.st[g.id] = won ? Math.max(0, s) + 1 : Math.min(0, s) - 1;
  if (B.st[g.id] > B.best) B.best = B.st[g.id];
  // 인기도 (이번 경기 줄에 더해서 보여 줌)
  const pop = won ? roundRandom(BIG_GAME_RULES.winPopularity * popularityMultiplier()) : BIG_GAME_RULES.lossPopularity;
  const d = addPopularity(pop);
  const lines = state.weekReport && state.weekReport.userLines;
  const line = lines && lines[lines.length - 1];
  const note = " · " + g.icon + " " + g.name + (won ? " 승리! 인기도 +" + d : " 패배… 인기도 " + d);
  if (line && line.matchKey === matchKey(m)) {
    line.text += note;
    if (d) line.changes.popularity = (line.changes.popularity || 0) + d;
  }
  const log = state.log[0];
  if (log && log.match) {
    log.message += note;
    if (d && (!line || log.changes !== line.changes)) log.changes.popularity = (log.changes.popularity || 0) + d; // 경기 줄과 같은 변화 기록이면 한 번만
  }
  if (won && B.st[g.id] >= 3) addMoment(g.icon, g.name + " " + B.st[g.id] + "연승 (vs " + teamName(opp) + ")");
  // 퀘스트
  if (quest) {
    if (won) completeQuest(quest);
    else {
      state.quests.splice(state.quests.indexOf(quest), 1);
      postMessage("news", "❌ 퀘스트 실패: " + findQuest(quest.id).title, QUEST_GIVERS[findQuest(quest.id).giver] + ": \"졌지만 고개 숙이지 마라. 다음 " + g.name + "에서 갚아 주면 된다.\"", {});
    }
  }
}
