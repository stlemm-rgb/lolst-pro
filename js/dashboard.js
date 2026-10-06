// ===== 대시보드 위쪽: 지난주 결과, 커리어 요약, 솔로 랭크 =====

// ----- 솔로 랭크 (가상 래더) -----
function ladderTier(points) {
  let tier = LADDER.tiers[0];
  LADDER.tiers.forEach(function (t) { if (points >= t.min) tier = t; });
  return tier.name;
}

// 랭크 한 판: 점수와 실력(종합 능력)으로 승패 → { points: 새 점수, won }
// (나와 다른 선수 모두 같은 규칙. winBonus = 솔랭 중독자 승률 보너스)
function ladderGame(points, skill, winBonus) {
  const fast = points < LADDER.fastUntil; // 다이아몬드 아래: 프로라서 쉽게 이김
  const skillHere = LADDER.skillBase + points / LADDER.skillPer;
  let chance = Math.max(LADDER.minChance, Math.min(LADDER.maxChance, 0.5 + (skill - skillHere) / LADDER.winSpread));
  if (fast) chance = Math.max(chance, LADDER.fastWinChance);
  chance = Math.min(0.97, chance + (winBonus || 0));
  const winRange = fast ? LADDER.fastPointsWin : LADDER.pointsPerGame;
  const lossRange = fast ? LADDER.fastPointsLoss : LADDER.pointsPerGame;
  if (Math.random() < chance) return { points: points + randInt(winRange[0], winRange[1]), won: true };
  return { points: Math.max(0, points - randInt(lossRange[0], lossRange[1])), won: false };
}

// ----- 리그 솔로 랭크: 다른 선수들 (국내 1부·2부 구단 소속) -----
function ladderPlayerIds() {
  return Object.keys(state.league.players).filter(function (id) {
    const p = state.league.players[id];
    const t = p.teamId && findTeam(p.teamId);
    return t && (t.tier === 1 || t.tier === 2);
  });
}

// 다른 선수 솔로 랭크 정보 (없으면 새로 만듦): { points, peak, grind }
function npcSolo(p) {
  if (!p.solo) p.solo = { points: LADDER.startPoints, peak: LADDER.startPoints, grind: Math.round((LADDER.npcGrind[0] + Math.random() * (LADDER.npcGrind[1] - LADDER.npcGrind[0])) * 100) / 100 };
  return p.solo;
}

// 매주: 다른 선수들도 랭크 게임 (main.js의 nextWeek에서 부름)
function playNpcLadder() {
  ladderPlayerIds().forEach(function (id) {
    const p = state.league.players[id];
    const so = npcSolo(p);
    const games = Math.round(randInt(LADDER.npcGames[0], LADDER.npcGames[1]) * so.grind);
    const skill = playerScore(id);
    for (let i = 0; i < games; i++) so.points = ladderGame(so.points, skill, 0).points;
    so.peak = Math.max(so.peak, so.points);
  });
}

// 리그 솔로 랭크 순위표: [{ id, points }] 점수 높은 순 (나 포함)
function leagueLadder() {
  const rows = ladderPlayerIds().map(function (id) { return { id: id, points: npcSolo(state.league.players[id]).points }; });
  rows.push({ id: USER_ID, points: (state.soloRank || { points: LADDER.startPoints }).points });
  rows.sort(function (a, b) { return b.points - a.points || playerScore(b.id) - playerScore(a.id); });
  return rows;
}

// 이번 주 훈련에 딸린 랭크 게임 진행. 결과 { games, wins, losses, delta }
function playLadder(training) {
  if (!state.soloRank) state.soloRank = { points: LADDER.startPoints, wins: 0, losses: 0, peak: LADDER.startPoints };
  const r = state.soloRank;
  const games = Math.round((training.ladderGames || 0) * (1 + traitEffectSum("ladderGames"))); // 솔랭 중독자
  const before = r.points;
  let wins = 0;
  const me = playerScore(USER_ID);
  for (let i = 0; i < games; i++) {
    const g = ladderGame(r.points, me, traitEffectSum("ladderWin"));
    r.points = g.points;
    if (g.won) wins++;
  }
  r.patchPeak = Math.max(r.patchPeak || 0, r.points);
  // 랭크 틸트: 진 판이 더 많으면 컨디션 하락
  const tilt = traitEffectSum("tilt");
  if (tilt && games - wins > wins) state.condition = clamp(state.condition - tilt);
  r.wins += wins;
  r.losses += games - wins;
  if (r.peak < 3200 && r.points >= 3200 && !state.career.challenger) {
    state.career.challenger = true;
    addMoment("👑", "솔로 랭크 첫 챌린저 달성");
  }
  r.peak = Math.max(r.peak, r.points);
  // 랭크의 신: 챌린저인 주마다 인기도
  const cp = traitEffectSum("challengerPopularity");
  if (cp && r.points >= 3200) state.popularity = clamp(state.popularity + cp);
  return { games: games, wins: wins, losses: games - wins, delta: r.points - before };
}

// ----- 지난주 결과 (주가 넘어갈 때 만들어 둠) -----
function startWeekReport(training, message, changes, ladder) {
  state.weekReport = {
    when: state.year + "년 " + state.week + "주차",
    training: { name: training.name, message: message, changes: changes },
    ladder: ladder,
    userLines: [],   // 내가 뛴 경기 (afterUserMatch에서 채움)
    questLines: [],  // 퀘스트 진행·완료
    teamLines: [],   // 내 팀 경기 결과 (후보일 때도)
    news: [],
    messages: [],
    msgFrom: state.msgSeq || 0,
  };
}

function finishWeekReport(playedWeek, seasonMatches) {
  const r = state.weekReport;
  if (!r) return;
  const mine = myTeam();
  r.teamLines = seasonMatches.filter(function (m) {
    return m.week === playedWeek && m.winner && mine && (m.a === mine.id || m.b === mine.id);
  }).map(function (m) {
    const won = m.winner === mine.id;
    const opp = m.a === mine.id ? m.b : m.a;
    const my = m.a === mine.id ? m.score[0] : m.score[1];
    const their = m.a === mine.id ? m.score[1] : m.score[0];
    return { won: won, matchKey: matchKey(m), text: m.label + " · vs " + teamName(opp) + " " + my + ":" + their };
  });
}

function weekReportHTML() {
  const r = state.weekReport;
  if (!r) {
    return '<div class="card report"><h2>📅 지난주 결과</h2><p class="muted">훈련을 고르고 [다음 주로 진행] 또는 [휴식 주]를 누르면 여기에 한 주 결과가 나와요.</p></div>';
  }
  let html = "";

  // 경기
  if (r.userLines.length) {
    html += r.userLines.map(function (l) {
      return '<div class="rep-row"><span class="rep-tag ' + (l.won ? "win" : "lose") + '">' + (l.won ? "승" : "패") + "</span>" +
        escapeHTML(l.text) + (l.changes ? ' <span class="log-changes">' + changesText(l.changes) + "</span>" : "") + detailButtonHTML(l.matchKey) + "</div>";
    }).join("");
  } else if (r.teamLines.length) {
    html += r.teamLines.map(function (l) {
      return '<div class="rep-row"><span class="rep-tag ' + (l.won ? "win" : "lose") + '">' + (l.won ? "승" : "패") + "</span>" +
        escapeHTML(l.text) + ' <span class="muted small">(후보라서 출전하지 않음)</span>' + detailButtonHTML(l.matchKey) + "</div>";
    }).join("");
  } else {
    html += '<div class="rep-row muted">이번 주는 경기가 없었어요.</div>';
  }

  // 훈련 + 솔로 랭크
  const t = r.training;
  html += '<div class="rep-row"><span class="rep-tag train">훈련</span><b>' + escapeHTML(t.name) + "</b> · " + escapeHTML(t.message) +
    ' <span class="log-changes">' + changesText(t.changes) + "</span></div>";
  (r.questLines || []).forEach(function (q) {
    html += '<div class="rep-row"><span class="rep-tag rank">퀘스트</span>' + escapeHTML(q) + "</div>";
  });
  if (r.ladder && r.ladder.games) {
    const d = r.ladder.delta;
    html += '<div class="rep-row"><span class="rep-tag rank">랭크</span>솔로 랭크 ' + r.ladder.wins + "승 " + r.ladder.losses + "패 · " +
      '<span class="' + (d >= 0 ? "up" : "down") + '">' + (d >= 0 ? "+" : "") + d + "점</span></div>";
  }

  // 연락·소식 (이번에 새로 온 받은 연락)
  const msgs = state.inbox.filter(function (m) { return m.id > r.msgFrom && m.tab === "inbox"; });
  if (msgs.length) {
    html += '<div class="rep-row"><span class="rep-tag msg">연락</span>새 연락 ' + msgs.length + "건: " +
      msgs.map(function (m) { return escapeHTML(m.title); }).join(", ") + ' <button class="small-btn" data-go-sns="1">SNS 열기</button></div>';
  }
  if (r.news.length) {
    html += '<div class="rep-row"><span class="rep-tag news">소식</span>' + r.news.map(escapeHTML).join(" · ") + "</div>";
  }

  return '<div class="card report"><h2>📅 지난주 결과 <span class="muted small">' + escapeHTML(r.when) + "</span></h2>" + html + "</div>";
}

// ===== 대시보드 조각들 (main.js의 pages.dashboard에서 조립) =====

// 리그 같은 포지션 안에서 내 종합 능력 순위
function positionRank() {
  const pos = state.player.position;
  const ids = [USER_ID].concat(Object.keys(state.league.players).filter(function (id) {
    const p = state.league.players[id];
    return p.pos === pos && p.teamId;
  }));
  ids.sort(function (a, b) { return playerScore(b) - playerScore(a); });
  return { rank: ids.indexOf(USER_ID) + 1, total: ids.length };
}

// 작은 막대 (요약 칸의 체력·컨디션 등)
function miniBarHTML(label, value, max, cls) {
  const pct = Math.max(0, Math.min(100, value / (max || 100) * 100));
  return '<div class="mini-bar"><span class="mini-label">' + label + '</span>' +
    '<span class="bar"><span class="bar-fill ' + (cls || "") + '" style="width:' + pct + '%"></span></span>' +
    '<span class="mini-value">' + value + (max && max !== 100 ? '<span class="muted">/' + max + "</span>" : "") + "</span></div>";
}

// ----- 맨 위 요약 4칸: 소속 · 종합 능력 · 솔로 랭크 · 상태 -----
function dashStripHTML() {
  const team = myTeam();
  const rankList = team.tier === 1 ? tier1FinalOrder() : standings(["tier2", "tier2b"], tier2Ids()).map(function (x) { return x.id; });
  const leagueRank = rankList.indexOf(team.id) + 1;
  const role = state.benched ? '<span class="down">2군 (후보)</span>' : '<span class="up">1군 (주전)</span>';
  const c = state.contract;
  const score = playerScore(USER_ID);
  const pr = positionRank();
  const sr = state.soloRank || { points: LADDER.startPoints, wins: 0, losses: 0, peak: LADDER.startPoints };
  const board = leagueLadder();
  const myLadderRank = board.findIndex(function (x) { return x.id === USER_ID; }) + 1;
  const staminaCls = state.stamina < 20 ? "neg" : state.stamina < 30 ? "warn" : "";
  const v = state.reputation;

  return (
    '<div class="dash-strip">' +
      '<div class="card sum"><div class="sum-label">소속</div>' +
        '<div class="sum-main">' + escapeHTML(team.name) + "</div>" +
        '<div class="sum-sub">' + tierName(team.tier) + " 리그 · " + role + " · 팀 순위 <b>" + leagueRank + "위</b></div>" +
        '<div class="sum-sub muted">' + (c ? "연봉 " + moneyText(c.salary) + " · 계약 " + c.endYear + "년까지" + (c.guarantee ? " · 출전 보장 " + c.guarantee + "경기" : "") : "계약 없음") + "</div>" +
      "</div>" +
      '<div class="card sum"><div class="sum-label tip" tabindex="0" data-tip="스탯 12개 평균 (포지션 가산점 스탯은 1.5배). 경기력의 바탕이 돼요.">종합 능력</div>' +
        '<div class="sum-main big">' + score.toFixed(1) + "</div>" +
        '<div class="sum-sub">리그 ' + findPosition(state.player.position).name + " " + pr.total + "명 중 <b>" + pr.rank + "위</b></div>" +
      "</div>" +
      '<div class="card sum"><div class="sum-label tip" tabindex="0" data-tip="훈련할 때마다 랭크 게임을 하고, 승패에 따라 점수가 오르내려요. 솔로 랭크 훈련이 가장 많이 해요. 패치마다 초기화.">솔로 랭크</div>' +
        '<div class="sum-main">' + ladderTier(sr.points) + ' <span class="sum-points">' + sr.points.toLocaleString() + "점</span></div>" +
        '<div class="sum-sub">리그 ' + board.length + "명 중 <b>" + myLadderRank + "위</b> · 통산 " + sr.wins + "승 " + sr.losses + "패</div>" +
        '<div class="sum-sub muted">이번 패치 최고 ' + (sr.patchPeak || sr.points).toLocaleString() + " · 역대 최고 " + sr.peak.toLocaleString() + "</div>" +
      "</div>" +
      '<div class="card sum"><div class="sum-label">상태</div>' +
        miniBarHTML("체력", state.stamina, state.staminaMax, staminaCls) +
        miniBarHTML("컨디션", state.condition) +
        miniBarHTML("인기도", state.popularity) +
        '<div class="mini-bar"><span class="mini-label tip" tabindex="0" data-tip="-100 ~ +100. 좋은 이미지인지 나쁜 이미지인지. 구단 제안·이적에 영향">평판</span>' +
          '<span class="bar rep-bar"><span class="rep-mid"></span><span class="bar-fill ' + (v < 0 ? "neg" : "pos") + '" style="margin-left:' + (v < 0 ? 50 + v / 2 : 50) + "%;width:" + Math.abs(v) / 2 + '%"></span></span>' +
          '<span class="mini-value ' + (v < 0 ? "down" : v > 0 ? "up" : "") + '">' + (v > 0 ? "+" : "") + v + "</span></div>" +
      "</div>" +
    "</div>"
  );
}

// ----- 오른쪽: 프로필 (이름·나이·포지션·유형·특성) -----
function profileCardHTML() {
  const p = state.player;
  const traits = p.traits.map(traitChipHTML).join("") || '<span class="muted">없음</span>';
  return (
    '<div class="card"><h2>👤 ' + escapeHTML(p.name) + ' <span class="muted small">' + p.age + "세 · " + findPosition(p.position).name + " · " + findArchetype(p.archetype).name + "</span></h2>" +
      '<div class="chips">' + traits + "</div>" +
    "</div>"
  );
}

// ----- 오른쪽: 챔피언 (이번 패치 메타 + 내 숙련도 상위 5) -----
function championCardHTML() {
  const myPos = state.player.position;
  const myMeta = state.meta.champs[myPos].slice().sort(function (a, b) { return (metaTier(b) === "S") - (metaTier(a) === "S"); }).map(function (name) {
    const v = state.mastery[name] || 1;
    const t = metaTier(name);
    return '<span class="chip meta tier-' + t + '"><span class="tier-badge">' + t + "</span> " + name + " <b>" + v + "</b>" + champComps(name).map(function (id) { return " " + findComp(id).icon; }).join("") + "</span>";
  }).join("");
  const others = POSITION_IDS.filter(function (p) { return p !== myPos; }).map(function (p) {
    const sName = (state.meta.s && state.meta.s[p]) || state.meta.champs[p][0];
    return "<div>" + findPosition(p).name + ": " + state.meta.champs[p].map(function (n) { return n === sName ? n + "(S)" : n; }).join(", ") + "</div>";
  }).join("");
  const top5 = myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; }).slice(0, 5);
  return (
    '<div class="card"><h2>⚔️ 챔피언 <span class="muted small">' + escapeHTML(state.meta.label) + "</span></h2>" +
      '<p class="muted small">' + findPosition(myPos).name + " 메타 챔피언 · 숫자 = 내 숙련도</p>" +
      '<div class="chips">' + myMeta + "</div>" +
      '<p class="muted small">S급: 픽 우선 +' + MATCH.metaPickBonus.S + ", 경기력 +" + Math.round(MATCH.metaPowerBonus.S * 100) + "% · A급: 픽 우선 +" + MATCH.metaPickBonus.A + ", 경기력 +" + Math.round(MATCH.metaPowerBonus.A * 100) + "%</p>" +
      '<details class="other-meta"><summary class="muted small">다른 포지션 메타 보기</summary><div class="muted small">' + others + "</div></details>" +
      '<h2 class="sub">내 숙련도 상위 5</h2>' + top5.map(function (n) { return masteryRowHTML(n); }).join("") +
      '<p class="muted small">전체 목록은 [나의 커리어]에서 볼 수 있어요.</p>' +
    "</div>"
  );
}

// ----- 맨 아래: 내 스탯 (12개 + 유형 스탯 + 스탯 설명) -----
function statsCardHTML() {
  let statsHTML = "";
  STATS.forEach(function (s) {
    statsHTML += barHTML(s.name, state.stats[s.id], s.desc + " (상한선 " + userStatCap(s.id) + ") · " + (s.roles || []).join(" · "), isBonusStat(s.id), userStatCap(s.id)); // 값/상한선
  });
  return (
    '<div class="card"><h2>📊 내 스탯 <span class="muted small"><span class="bonus">★</span> 포지션 가산점 · 숫자/상한선</span></h2>' +
      '<div class="stat-columns">' + statsHTML + "</div>" +
      statGuideHTML(state.player.position) +
      '<h2 class="sub">유형 스탯 <span class="muted small">높을수록 그 유형 챔피언 숙련도가 잘 올라요 (괄호 = 숙련도 성장 보너스)</span></h2>' +
      '<div class="stat-columns type-stats">' + typeScoresHTML() + "</div>" +
    "</div>"
  );
}

// ----- 왼쪽: 최근 경기 5개 -----
function recentMatchesHTML() {
  const done = userMatches().filter(function (m) { return m.winner; }).slice(-5).reverse();
  const body = done.length
    ? '<table class="matches">' + done.map(function (m) { return matchRowHTML(m, true); }).join("") + "</table>"
    : '<p class="muted">아직 경기를 하지 않았어요.</p>';
  return '<div class="card"><h2>🗂️ 최근 경기 <span class="muted small">' + escapeHTML(myTeam().name) + " · 전체 기록은 [경기 결과]</span></h2>" + body + "</div>";
}

// ----- 오른쪽: 리그 솔로 랭크 순위표 (TOP 10 + 내 순위, [전체 보기]) -----
let ladderShowAll = false;

function leagueLadderHTML() {
  const board = leagueLadder();
  const myIdx = board.findIndex(function (x) { return x.id === USER_ID; });
  const top = LADDER.boardTop;
  // 보여 줄 줄 번호: 전체 / 또는 TOP 10 + 내 앞뒤 1명
  let show = [];
  if (ladderShowAll) {
    show = board.map(function (_, i) { return i; });
  } else {
    for (let i = 0; i < Math.min(top, board.length); i++) show.push(i);
    for (let i = myIdx - 1; i <= myIdx + 1; i++) if (i >= 0 && i < board.length && show.indexOf(i) === -1) show.push(i);
  }
  let rows = "", prev = -1;
  show.forEach(function (i) {
    if (prev !== -1 && i > prev + 1) rows += '<tr class="gap"><td colspan="4">···</td></tr>';
    const x = board[i];
    const me = x.id === USER_ID;
    const team = me ? myTeam() : findTeam(findPlayer(x.id).teamId);
    rows += "<tr" + (me ? ' class="me"' : "") + ' title="' + ladderTier(x.points) + '"><td class="r">' + (i + 1) + "</td>" +
      "<td>" + (me ? "<b>" + escapeHTML(state.player.name) + "</b>" : escapeHTML(playerName(x.id))) + ' <span class="muted small">' + findPosition(playerPos(x.id)).name + "</span></td>" +
      '<td class="muted small">' + escapeHTML(team ? team.short : "-") + "</td>" +
      '<td class="r">' + x.points.toLocaleString() + "</td></tr>";
    prev = i;
  });
  return (
    '<div class="card"><h2>🏆 리그 솔로 랭크 <span class="muted small">' + board.length + "명 · 패치마다 초기화</span></h2>" +
      '<table class="mini ladder-board"><tr><th class="r">#</th><th>선수</th><th>팀</th><th class="r">점수</th></tr>' + rows + "</table>" +
      '<div class="buttons"><button class="small-btn" data-ladderall>' + (ladderShowAll ? "접기" : "전체 보기") + "</button></div>" +
    "</div>"
  );
}

// 패치 때 솔로 랭크 초기화 (main.js의 패치 처리에서 부름)
function resetLadder() {
  const r = state.soloRank;
  if (!r) return;
  const before = r.points;
  r.points = LADDER.resetPoints;
  r.patchPeak = r.points;
  // 다른 선수들도 같이 초기화
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (p.solo) p.solo.points = LADDER.resetPoints;
  });
  return before;
}

// ----- 왼쪽: 이번 주 (훈련 · 경기 · 조합 전략 · 퀘스트) -----
function thisWeekHTML() {
  const mine = myTeam();
  const week = state.week;
  const matches = state.league.season.matches.filter(function (m) {
    return m.week === week && !m.winner && (m.a === mine.id || m.b === mine.id);
  });
  let matchHTML;
  if (matches.length) {
    matchHTML = matches.map(function (m) {
      const opp = m.a === mine.id ? m.b : m.a;
      return '<div class="rep-row"><span class="rep-tag win">경기</span>' + escapeHTML(m.label) + " · vs <b>" + escapeHTML(teamName(opp)) + "</b>" +
        ' <span class="muted small">(' + m.bo + "판 " + Math.ceil(m.bo / 2) + "선승 · 전력 우리 " + teamStrength(mine.id).toFixed(1) + " / 상대 " + strengthOf(opp).toFixed(1) + ")</span>" +
        (state.benched ? ' <span class="down small">후보라서 출전 안 함</span>' : "") + "</div>";
    }).join("");
  } else {
    const later = nextUserMatch();
    const ko = ["cup_po", "playin", "playoffs", "promotion", "worlds"].some(function (id) { return scheduleOfWeek(week).id.indexOf(id) === 0; });
    matchHTML = '<div class="rep-row muted"><span class="rep-tag">경기</span>이번 주는 잡힌 경기가 없어요' +
      (ko ? " (토너먼트 대진은 경기 주에 정해져요)" : "") +
      (later ? ". 다음 경기: " + later.week + "주차 " + escapeHTML(later.label) + " vs " + escapeHTML(teamName(later.a === mine.id ? later.b : later.a)) : "") + ".</div>";
  }
  const plan = state.plan ? findTraining(state.plan).name : '<span class="down">아직 안 정함</span>';
  const trainHTML = '<div class="rep-row"><span class="rep-tag train">훈련</span><b>' + plan + '</b> <button class="small-btn" data-go="training">훈련 바꾸기</button></div>';

  return (
    '<div class="card upcoming"><h2>▶ 이번 주 <span class="muted small">' + state.year + "년 " + week + "주차 · " + escapeHTML(scheduleOfWeek(week).name) + "</span></h2>" +
      trainHTML +
      matchHTML +
      compPlanHTML() + // 조합 전략 (js/comps.js)
      questsHTML(true) +
    "</div>"
  );
}
