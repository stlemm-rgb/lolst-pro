// ===== 구단별 빅게임 (172, 로드맵 ③) — 값·기사는 data/biggame.js =====
// 전적은 맞대결 기록(js/h2h.js h2hTeam)을 그대로 씀
// 내 기록: state.career.bigGames = { w, l, st: { 빅게임 id: 연승(+)/연패(−) }, best: 같은 라이벌 최다 연승 }
// 부르는 곳: js/main.js nextWeek(bigGameWeek, 대진 미리 만들기 뒤) · js/matchsim.js playMatch(bigGameOnMatch) · js/dashboard.js 경기 줄

// 두 구단이 고정 라이벌이면 그 빅게임 (해외 팀·없는 팀이면 null)
function bigGameOf(x, y) {
  if (typeof BIG_GAMES === "undefined") return null;
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
