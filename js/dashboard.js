// ===== 대시보드 위쪽: 지난주 결과, 커리어 요약, 솔로 랭크 =====

// ----- 솔로 랭크 (가상 래더) -----
function ladderTier(points) {
  let tier = LADDER.tiers[0];
  LADDER.tiers.forEach(function (t) { if (points >= t.min) tier = t; });
  return tier.name;
}

// 이번 주 훈련에 딸린 랭크 게임 진행. 결과 { games, wins, losses, delta }
function playLadder(training) {
  if (!state.soloRank) state.soloRank = { points: LADDER.startPoints, wins: 0, losses: 0, peak: LADDER.startPoints };
  const r = state.soloRank;
  const games = training.ladderGames || 0;
  const before = r.points;
  let wins = 0;
  const me = playerScore(USER_ID);
  for (let i = 0; i < games; i++) {
    const fast = r.points < LADDER.fastUntil; // 다이아몬드 아래: 프로라서 쉽게 이김
    const skillHere = LADDER.skillBase + r.points / LADDER.skillPer;
    let chance = Math.max(LADDER.minChance, Math.min(LADDER.maxChance, 0.5 + (me - skillHere) / LADDER.winSpread));
    if (fast) chance = Math.max(chance, LADDER.fastWinChance);
    const winRange = fast ? LADDER.fastPointsWin : LADDER.pointsPerGame;
    const lossRange = fast ? LADDER.fastPointsLoss : LADDER.pointsPerGame;
    if (Math.random() < chance) { r.points += randInt(winRange[0], winRange[1]); wins++; }
    else r.points = Math.max(0, r.points - randInt(lossRange[0], lossRange[1]));
  }
  r.patchPeak = Math.max(r.patchPeak || 0, r.points);
  r.wins += wins;
  r.losses += games - wins;
  r.peak = Math.max(r.peak, r.points);
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
    return { won: won, text: m.label + " · vs " + teamName(opp) + " " + my + ":" + their };
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
        escapeHTML(l.text) + (l.changes ? ' <span class="log-changes">' + changesText(l.changes) + "</span>" : "") + "</div>";
    }).join("");
  } else if (r.teamLines.length) {
    html += r.teamLines.map(function (l) {
      return '<div class="rep-row"><span class="rep-tag ' + (l.won ? "win" : "lose") + '">' + (l.won ? "승" : "패") + "</span>" +
        escapeHTML(l.text) + ' <span class="muted small">(후보라서 출전하지 않음)</span></div>';
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

// ----- 커리어 단계 · 종합 능력 · 솔로 랭크 -----
function positionRank() {
  const pos = state.player.position;
  const ids = [USER_ID].concat(Object.keys(state.league.players).filter(function (id) {
    const p = state.league.players[id];
    return p.pos === pos && p.teamId;
  }));
  ids.sort(function (a, b) { return playerScore(b) - playerScore(a); });
  return { rank: ids.indexOf(USER_ID) + 1, total: ids.length };
}

function summaryRowHTML() {
  const team = myTeam();
  const rankList = team.tier === 1 ? tier1FinalOrder() : standings(["tier2", "tier2b"], tier2Ids()).map(function (x) { return x.id; });
  const leagueRank = rankList.indexOf(team.id) + 1;
  const role = state.benched ? '<span class="down">2군 (후보)</span>' : '<span class="up">1군 (주전)</span>';
  const score = playerScore(USER_ID);
  const pr = positionRank();
  const sr = state.soloRank || { points: LADDER.startPoints, wins: 0, losses: 0, peak: LADDER.startPoints };

  return (
    '<div class="summary-row">' +
      '<div class="card sum"><div class="sum-label">커리어 단계</div>' +
        '<div class="sum-main">' + escapeHTML(team.name) + "</div>" +
        '<div class="sum-sub">' + tierName(team.tier) + " 리그 · " + role + " · 팀 순위 " + leagueRank + "위</div>" +
        '<div class="sum-sub muted">' + state.player.age + "세 · " + findPosition(state.player.position).name + " · 연봉 " +
          (state.contract ? moneyText(state.contract.salary) : "-") + "</div>" +
      "</div>" +
      '<div class="card sum"><div class="sum-label tip" tabindex="0" data-tip="스탯 12개 평균 (포지션 가산점 스탯은 1.5배). 경기력의 바탕이 돼요.">종합 능력</div>' +
        '<div class="sum-main big">' + score.toFixed(1) + "</div>" +
        '<div class="sum-sub">리그 ' + findPosition(state.player.position).name + " " + pr.total + "명 중 <b>" + pr.rank + "위</b></div>" +
      "</div>" +
      '<div class="card sum"><div class="sum-label tip" tabindex="0" data-tip="훈련할 때마다 랭크 게임을 하고, 승패에 따라 점수가 오르내려요. 솔로 랭크 훈련이 가장 많이 해요.">솔로 랭크</div>' +
        '<div class="sum-main">' + ladderTier(sr.points) + ' <span class="sum-points">' + sr.points.toLocaleString() + "점</span></div>" +
        '<div class="sum-sub">이번 패치 최고 ' + (sr.patchPeak || sr.points).toLocaleString() + "점 · 통산 " + sr.wins + "승 " + sr.losses + "패</div>" +
        '<div class="sum-sub muted">역대 최고 ' + sr.peak.toLocaleString() + "점 (" + ladderTier(sr.peak) + ") · 패치마다 초기화</div>" +
      "</div>" +
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
  return before;
}

// ----- 다음 진행 주: 경기와 메타 챔피언 -----
function upcomingHTML() {
  const mine = myTeam();
  const week = state.week;
  const matches = state.league.season.matches.filter(function (m) {
    return m.week === week && !m.winner && (m.a === mine.id || m.b === mine.id);
  });
  let matchHTML;
  if (matches.length) {
    matchHTML = matches.map(function (m) {
      const opp = m.a === mine.id ? m.b : m.a;
      return '<div class="rep-row"><span class="rep-tag train">경기</span>' + escapeHTML(m.label) + " · vs <b>" + escapeHTML(teamName(opp)) + "</b>" +
        ' <span class="muted small">(' + m.bo + "판 " + Math.ceil(m.bo / 2) + "선승 · 상대 전력 " + strengthOf(opp).toFixed(1) + " / 우리 " + teamStrength(mine.id).toFixed(1) + ")</span>" +
        (state.benched ? ' <span class="down small">후보라서 출전 안 함</span>' : "") + "</div>";
    }).join("");
  } else {
    const later = nextUserMatch();
    const ko = ["cup_po", "playin", "playoffs", "promotion", "worlds"].some(function (id) { return scheduleOfWeek(week).id.indexOf(id) === 0; });
    matchHTML = '<div class="rep-row muted">이번 주는 잡힌 경기가 없어요' +
      (ko ? " (토너먼트 대진은 경기 주에 정해져요)" : "") +
      (later ? ". 다음 경기: " + later.week + "주차 " + escapeHTML(later.label) + " vs " + escapeHTML(teamName(later.a === mine.id ? later.b : later.a)) : "") + ".</div>";
  }

  // 메타 챔피언: 내 포지션은 숙련도와 함께, 다른 포지션은 이름만
  const myPos = state.player.position;
  const myMeta = state.meta.champs[myPos].slice().sort(function (a, b) { return (metaTier(b) === "S") - (metaTier(a) === "S"); }).map(function (name) {
    const v = state.mastery[name] || 1;
    const t = metaTier(name);
    return '<span class="chip meta tier-' + t + '"><span class="tier-badge">' + t + "</span> " + name + " <b>" + v + "</b></span>";
  }).join("");
  const others = POSITION_IDS.filter(function (p) { return p !== myPos; }).map(function (p) {
    const sName = (state.meta.s && state.meta.s[p]) || state.meta.champs[p][0];
    return '<div class="muted small">' + findPosition(p).name + ": " + state.meta.champs[p].map(function (n) { return n === sName ? n + "(S)" : n; }).join(", ") + "</div>";
  }).join("");

  return (
    '<div class="card upcoming"><h2>▶ 다음 진행 주 <span class="muted small">' + state.year + "년 " + week + "주차 · " + escapeHTML(scheduleOfWeek(week).name) + "</span></h2>" +
      matchHTML +
      '<h2 class="sub">메타 챔피언 <span class="muted small">' + escapeHTML(state.meta.label) + " · 숫자 = 내 숙련도</span></h2>" +
      '<div class="chips">' + myMeta + "</div>" +
      '<div class="other-meta">' + others + "</div>" +
      '<p class="muted small">S급: 픽 우선 +' + MATCH.metaPickBonus.S + ", 경기력 +" + Math.round(MATCH.metaPowerBonus.S * 100) + "% · A급: 픽 우선 +" + MATCH.metaPickBonus.A + ", 경기력 +" + Math.round(MATCH.metaPowerBonus.A * 100) + "%</p>" +
      questsHTML(true) +
    "</div>"
  );
}
