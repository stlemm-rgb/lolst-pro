// ===== 인기도 · 평판 (값: data/fame.js) =====
// - 팬 수·스타 등급, 평판 등급 (등급이 바뀌면 소식·주요 순간)
// - 매주: 인기도 자연 감소(경기에 안 나온 주), 평판 제자리 찾기, 커리어 평균 평판 기록
// - 감독 신뢰 (평판 등급 → 2군행 판정, js/contracts.js checkBench)
// - 올스타전 (비시즌 팬 투표)
// 저장: state.fame = { tier, repTier }, state.career.repSum·repWeeks·allstars

function fameTier(pop) {
  const p = pop === undefined ? state.popularity : pop;
  let t = FAME.tiers[0];
  FAME.tiers.forEach(function (x) { if (p >= x.min) t = x; });
  return t;
}
function fameTierIndex(pop) { return FAME.tiers.indexOf(fameTier(pop)); }

function repTier(rep) {
  const r = rep === undefined ? state.reputation : rep;
  let t = REP_TIERS[0];
  REP_TIERS.forEach(function (x) { if (r >= x.min) t = x; });
  return t;
}

// 감독 신뢰: 2군행 판정에서 경쟁 선수와 점수 차이에 더하는 값
function managerTrust() { return repTier().trust; }

function fansCount(pop) {
  const p = pop === undefined ? state.popularity : pop;
  return Math.round(p * p * FAME.fansSquare + p * FAME.fansLinear);
}
// "62만 명", "290만 명", "3,500명"
function peopleText(n) {
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + "만 명";
  return n.toLocaleString() + "명";
}

// 상태 칸 아래 한 줄: ⭐ 인기 선수 · 팬 62만 명 · 😇 모범 선수 (감독 신뢰 +1.5)
function fameLineHTML() {
  const f = fameTier(), r = repTier();
  const nextF = FAME.tiers[FAME.tiers.indexOf(f) + 1];
  const tipF = "스타 등급 (인기도로 정해짐). " + (nextF ? "인기도 " + nextF.min + "이면 " + nextF.icon + " " + nextF.name + "." : "최고 등급!") +
    " 등급이 오르면 광고·개인 스폰서 제의가 와요. 경기에 안 나오는 주에는 인기도가 조금씩 줄어요.";
  const tipR = "평판 등급. 감독 신뢰 " + (r.trust > 0 ? "+" : "") + r.trust + " (주전 경쟁에서 이만큼 유리/불리). 등급에 따라 오는 연락이 달라요. 평판은 시간이 지나면 천천히 0 쪽으로 돌아와요.";
  return '<div class="sum-sub fame-line"><span class="tip" tabindex="0" data-tip="' + escapeHTML(tipF) + '">' + f.icon + " " + f.name + " · 팬 " + peopleText(fansCount()) + "</span> · " +
    '<span class="tip" tabindex="0" data-tip="' + escapeHTML(tipR) + '">' + r.icon + " " + r.name + "</span></div>";
}

// 매주 (main.js nextWeek, 활동 효과 다음)
function weeklyFame() {
  const w = state.weekCtx || {};
  const played = w.results && w.results.length;
  // 1) 인기도 자연 감소: 이번 주 경기에 안 나왔고 개인 방송도 안 하면
  if (!played && !(typeof hasActivity === "function" && hasActivity("stream"))) {
    const d = (state.popularity - FAME.decay.floor) * FAME.decay.perWeek;
    if (d > 0) state.popularity = clamp(state.popularity - roundRandom(d));
  }
  // 2) 평판 제자리 찾기 (0 쪽으로 아주 천천히)
  const drift = state.reputation * REPUTATION.driftPerWeek;
  if (drift) state.reputation = Math.max(-100, Math.min(100, state.reputation - (drift > 0 ? roundRandom(drift) : -roundRandom(-drift))));
  // 3) 커리어 평균 평판 (엔딩 '인성 점수')
  const c = state.career;
  c.repSum = (c.repSum || 0) + state.reputation;
  c.repWeeks = (c.repWeeks || 0) + 1;
  checkFameTiers();
}

// 등급이 바뀌었으면 소식 (처음엔 기록만)
function checkFameTiers() {
  const fi = fameTierIndex(), ri = REP_TIERS.indexOf(repTier());
  if (!state.fame) { state.fame = { tier: fi, repTier: ri, best: fi }; return; }
  const F = state.fame;
  if (fi !== F.tier) {
    const t = FAME.tiers[fi];
    if (fi > F.tier) {
      addNews("스타 등급", t.icon + " " + state.player.name + ", 이제 '" + t.name + "'! 팬 " + peopleText(fansCount()) + ".");
      if (fi > (F.best || 0)) { addMoment(t.icon, "스타 등급 '" + t.name + "' 달성 (팬 " + peopleText(fansCount()) + ")"); F.best = fi; }
    } else addNews("스타 등급", "인기가 조금 식었다. 스타 등급이 '" + t.name + "'(으)로 내려갔다.");
    F.tier = fi;
  }
  if (ri !== F.repTier) {
    const r = REP_TIERS[ri];
    addNews("평판", r.icon + " 평판 등급이 '" + r.name + "'(으)로 " + (ri > F.repTier ? "올랐다" : "떨어졌다") + ". 감독 신뢰 " + (r.trust > 0 ? "+" : "") + r.trust + ".");
    F.repTier = ri;
  }
}

// 커리어 평균 평판 → 엔딩 '인성 점수' (js/retire.js careerSummary)
function careerAvgReputation() {
  const c = state.career;
  return c.repWeeks ? c.repSum / c.repWeeks : state.reputation;
}
function reputationPoints() {
  const v = Math.round(careerAvgReputation() / REPUTATION.endingDiv);
  return Math.max(-REPUTATION.endingMax, Math.min(REPUTATION.endingMax, v));
}

// ----- 올스타전 -----
// 다른 선수의 팬 인기 (0~100)
function npcFanScore(id, avg) {
  const p = findPlayer(id);
  if (!p) return 0;
  const awards = (state.league.awards || []).filter(function (a) { return a.year === state.year && a.id === id; }).length;
  const champ = state.league.season && state.league.season.champions && (state.league.season.champions.playoffs === p.teamId || state.league.season.champions.worlds === p.teamId);
  return Math.max(0, Math.min(100, 20 + (playerScore(id) - avg) * 4 + awards * 15 + (p.named ? 15 : 0) + (champ ? 10 : 0)));
}

function runAllStar() {
  if (state.year < ALL_STAR.fromYear || state.career.allStarYear === state.year) return;
  state.career.allStarYear = state.year;
  const scores = [];
  tierTeams(1).forEach(function (t) { const s = starters(t.id); Object.keys(s).forEach(function (pos) { if (s[pos] && s[pos] !== USER_ID) scores.push(playerScore(s[pos])); }); });
  const avg = scores.length ? average(scores) : 60;
  const picks = {}; // 포지션 → [{ id, votes }] 상위 2명
  POSITION_IDS.forEach(function (pos) {
    const cands = [];
    tierTeams(1).forEach(function (t) {
      const id = starters(t.id)[pos];
      if (id && id !== USER_ID) cands.push({ id: id, fan: npcFanScore(id, avg) });
    });
    if (state.player.position === pos && !state.benched) cands.push({ id: USER_ID, fan: state.popularity });
    cands.forEach(function (c) { c.votes = Math.round(c.fan * c.fan * ALL_STAR.votesPer * randFloat(0.9, 1.1)); });
    picks[pos] = cands.sort(function (a, b) { return b.votes - a.votes; }).slice(0, 2);
  });
  const teamA = POSITION_IDS.map(function (pos) { return picks[pos][0]; }).filter(Boolean);
  const teamB = POSITION_IDS.map(function (pos) { return picks[pos][1]; }).filter(Boolean);
  const pw = function (list) { return average(list.map(function (c) { return playerScore(c.id); })); };
  const aWins = Math.random() < 0.5 + (pw(teamA) - pw(teamB)) * 0.03;
  const winners = aWins ? teamA : teamB;
  const mvp = pick(winners);
  const name = function (c) { return playerName(c.id) + " (" + c.votes.toLocaleString() + "표)"; };
  const lineup = POSITION_IDS.map(function (pos, i) {
    return findPosition(pos).name + ": " + (teamA[i] ? name(teamA[i]) : "-") + " / " + (teamB[i] ? name(teamB[i]) : "-");
  }).join("\n");
  const me = teamA.concat(teamB).find(function (c) { return c.id === USER_ID; });
  const myRank = (picks[state.player.position] || []).findIndex(function (c) { return c.id === USER_ID; });
  let text = "팬 투표로 뽑힌 포지션별 1위(팀 블루)와 2위(팀 레드)가 맞붙었다.\n" + lineup +
    "\n\n결과: " + (aWins ? "팀 블루" : "팀 레드") + " 승리 · MVP " + playerName(mvp.id);
  const notes = [];
  if (me) {
    state.career.allstars = (state.career.allstars || 0) + 1;
    const S = ALL_STAR.selected;
    state.popularity = clamp(state.popularity + S.popularity);
    state.reputation = Math.min(100, state.reputation + S.reputation);
    const m = eventMoney(S.money);
    state.money += m;
    notes.push("⭐ 올스타 선정 (" + (myRank === 0 ? "포지션 1위" : "포지션 2위") + ", " + me.votes.toLocaleString() + "표) · 인기도 +" + S.popularity + " · 평판 +" + S.reputation + " · 출전 수당 " + moneyText(m));
    addMoment("⭐", state.year + " 올스타 선정 (" + me.votes.toLocaleString() + "표)");
    if (mvp.id === USER_ID) {
      const mm = eventMoney(ALL_STAR.mvp.money);
      state.popularity = clamp(state.popularity + ALL_STAR.mvp.popularity);
      state.money += mm;
      notes.push("🏅 올스타전 MVP! 인기도 +" + ALL_STAR.mvp.popularity + " · 상금 " + moneyText(mm));
      addMoment("🏅", state.year + " 올스타전 MVP");
    }
  } else {
    notes.push("이번 올스타에는 뽑히지 못했다. (팬 투표는 인기도로 정해져요)");
  }
  postMessage("news", "⭐ " + state.year + " 올스타전", text, { notes: notes });
  addNews("올스타전", state.year + " 올스타전: " + (aWins ? "팀 블루" : "팀 레드") + " 승리, MVP " + playerName(mvp.id) + (me ? " · " + state.player.name + " 출전" : ""));
}
