// ===== 여름 이적·임대 기간 (규칙: data/contracts.js SUMMER_MARKET) =====
// 23~28주(여름 휴식기)에 열리고 29주(후반기 준비)에 반영. 새해 이적 시장보다 작게.
// 임대: 다른 선수는 p.loan = { from: 원래 팀 id, year }, 내 선수는 state.loan = { from, year }
//       시즌이 끝나면(새해) 원래 팀으로 돌아감 (js/contracts.js contractsNewSeason)

function isSummerWindow() {
  return state.week >= SUMMER_MARKET.start && state.week <= SUMMER_MARKET.end;
}

// 새해 이적 시장 또는 여름 이적 기간
function isAnyTransferWindow() {
  return isTransferWindow() || isSummerWindow();
}

// 지금 순위 비율 (0 = 1위, 1 = 꼴찌): 1부는 1·2라운드 순위, 2부는 2부 리그 순위
function currentNeed() {
  const need = {};
  const o1 = standings(["split1"], tier1Ids()).map(function (x) { return x.id; });
  const o2 = standings(["tier2"], tier2Ids()).map(function (x) { return x.id; });
  [o1, o2].forEach(function (order) {
    order.forEach(function (id, i) { need[id] = order.length > 1 ? i / (order.length - 1) : 0; });
  });
  return need;
}

// ----- 내 선수: 여름 제안 (23주) -----
function startSummerWindow() {
  state.transferRequestsLeft = SUMMER_MARKET.requests;
  if (state.retirePlanned || state.pendingMove || state.loan) return;
  const mine = myTeam();
  const me = playerScore(USER_ID);
  const candidates = state.league.teams.filter(function (t) {
    if (t.id === mine.id) return false;
    const starter = starterAt(t.id, state.player.position);
    return !starter || me > playerScore(starter);
  }).sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); });
  if (!candidates.length) return;
  if (state.benched) {
    // 후보(2군): 다른 팀이 남은 시즌 임대 제안
    if (Math.random() >= SUMMER_MARKET.benchedOfferChance) return;
    const t = pick(candidates.slice(0, Math.ceil(candidates.length / 2)));
    const o = makeOffer(t.id, false);
    o.summer = true; o.loan = true; o.salary = state.contract.salary; o.years = 0; o.guarantee = 0;
    sendOffer(o);
    return;
  }
  if (Math.random() >= SUMMER_MARKET.offerChance) return;
  const fee = transferFee(USER_ID);
  const able = candidates.filter(function (t) { return clubRoom(t.id) - fee >= userSalaryFor(t.tier) && teamMoney(t.id) - fee >= debtFloor(t.id); });
  if (!able.length) return;
  const o = makeOffer(pick(able.slice(0, Math.ceil(able.length / 2))).id, false);
  o.summer = true; o.fee = fee;
  sendOffer(o);
}

// ----- 29주: 여름 이적 반영 (main.js nextWeek) -----
function summerMarket() {
  const news = [];
  applySummerUserMove(news);
  // 답하지 않은 여름 제안은 정리
  state.inbox.forEach(function (m) {
    if (m.kind === "offer" && m.answered === null && m.offer && m.offer.summer) {
      m.answered = "ignored"; m.read = true; m.notes.push("여름 이적 기간이 끝났다.");
    }
  });
  // 하위권 팀만 1명씩: 영입(이적료) → 돈이 없으면 임대
  const need = currentNeed();
  const moved = {};
  state.league.teams.filter(function (t) { return (need[t.id] || 0) >= SUMMER_MARKET.needFrom; })
    .sort(function (a, b) { return (need[b.id] - need[a.id]) || (a.tier - b.tier); })
    .forEach(function (t) {
      let done = 0;
      weakPositions(t).forEach(function (pos) {
        if (done >= SUMMER_MARKET.buys) return;
        const text = tryBuy(t, pos, SUMMER_MARKET.margin, moved) || tryLoan(t, pos, SUMMER_MARKET.margin, moved);
        if (text) { done++; news.push(text); }
      });
    });
  fillRosters();
  return news;
}

// 다른 팀 후보를 시즌 끝까지 임대 (이적료 없음, 연봉은 빌린 팀이 냄)
function tryLoan(t, pos, margin, moved) {
  const starter = starterAt(t.id, pos);
  const base = starter ? playerScore(starter) : 0;
  const best = Object.keys(state.league.players).filter(function (id) {
    const p = state.league.players[id];
    if (p.pos !== pos || !p.teamId || p.teamId === t.id || p.loan || moved[id]) return false;
    if (starterAt(p.teamId, pos) === id) return false; // 원래 팀 주전은 안 빌려줌
    return playerScore(id) >= base + margin && clubRoom(t.id) >= payrollDelta(t, id, p.salary || 0);
  }).sort(function (a, b) { return playerScore(b) - playerScore(a); })[0];
  if (!best) return null;
  const p = findPlayer(best);
  const from = findTeam(p.teamId);
  from.roster.splice(from.roster.indexOf(best), 1);
  p.loan = { from: from.id, year: state.year };
  p.teamId = t.id;
  t.roster.push(best);
  while (t.roster.length > LEAGUE.rosterSize) {
    const w = t.roster.filter(function (x) { return x !== USER_ID && x !== best && !findPlayer(x).loan; })
      .sort(function (a, b) { return playerScore(a) - playerScore(b); })[0];
    if (!w) break;
    releaseToFA(w);
  }
  moved[best] = true;
  return "🤝 " + t.name + ", " + from.name + "의 " + p.name + "(" + findPosition(pos).name + ") 임대 (시즌 끝까지)";
}

// 내 선수: 여름에 합의한 이적·임대 반영
function applySummerUserMove(news) {
  const mv = state.pendingMove;
  if (!mv || !mv.summer) return;
  const old = myTeam();
  const team = findTeam(mv.teamId);
  if (mv.loan) {
    state.loan = { from: old.id, year: state.year };
    moveUserTo(team.id);
    news.push("🤝 " + state.player.name + ", " + old.name + "에서 " + team.name + "(으)로 임대 (시즌 끝까지)");
    addMoment("🤝", team.name + "(으)로 임대");
  } else {
    const fee = mv.fee !== undefined ? mv.fee : transferFee(USER_ID);
    if (fee) {
      old.money = teamMoney(old.id) + fee;
      team.money = teamMoney(team.id) - fee;
    }
    moveUserTo(team.id);
    state.contract = { teamId: team.id, salary: mv.salary, endYear: mv.endYear, guarantee: mv.guarantee };
    news.push("🔁 " + team.name + ", " + old.name + "의 " + state.player.name + " 영입" + (fee ? " · 이적료 " + moneyText(fee) : ""));
    addMoment("✈️", team.name + "(으)로 여름 이적");
  }
  state.pendingMove = null;
  state.benched = false;
  state.benchWeeks = 0;
}

// 새해: 임대 갔던 선수들 원래 팀으로 (js/contracts.js contractsNewSeason 맨 처음)
function returnLoans(news) {
  if (state.loan) {
    const home = findTeam(state.loan.from);
    if (home && myTeam() && home.id !== myTeam().id) {
      moveUserTo(home.id);
      news.push(state.player.name + ", 임대를 마치고 " + home.name + " 복귀");
    }
    state.loan = null;
  }
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (!p.loan) return;
    const now = p.teamId && findTeam(p.teamId);
    if (now) now.roster.splice(now.roster.indexOf(id), 1);
    const home = findTeam(p.loan.from);
    delete p.loan;
    if (home) { p.teamId = home.id; home.roster.push(id); }
    else { p.teamId = null; if (state.league.freeAgents.indexOf(id) === -1) state.league.freeAgents.push(id); }
  });
}
