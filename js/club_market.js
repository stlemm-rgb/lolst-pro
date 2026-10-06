// ===== 구단 자금 · 이적료 · 비시즌 리빌딩 (규칙: data/contracts.js CLUB_MARKET) =====
// team.money: 구단 자금 (이적료로 늘고 줄어요, 빚이면 −)
// state.league.marketSnap: 새해 직전에 저장한 지난 시즌 정보 { year, need: {팀: 0~1}, ratings: {선수: [평점, 세트]}, awards: {선수: [상 key]} }

function teamMoney(teamId) {
  const t = findTeam(teamId);
  return t && Number.isFinite(t.money) ? t.money : 0;
}

// 구단 여유 = 예산 × (1 + 빚 한도) + 구단 자금 − 연봉 총액
function clubRoom(teamId) {
  const t = findTeam(teamId);
  return CONTRACT.teamBudget[t.tier] * (1 + CLUB_MARKET.debtLimit) + teamMoney(teamId) - teamPayroll(teamId);
}

// 빚 한도 (구단 자금이 이 아래로 내려가면 안 됨)
function debtFloor(teamId) {
  return -CONTRACT.teamBudget[findTeam(teamId).tier] * CLUB_MARKET.debtLimit;
}

// 이적료: 1부 기준 연봉 × 비율 × 나이 배율 × 남은 계약 (계약 없으면 0)
function transferFee(id) {
  const user = id === USER_ID;
  const end = user ? (state.contract ? state.contract.endYear : 0) : findPlayer(id).contractEnd;
  const yearsLeft = (end || 0) - state.year + 1;
  if (!(user ? myTeam() : findPlayer(id).teamId) || yearsLeft <= 0) return 0;
  const age = playerAge(id);
  const ageMult = CLUB_MARKET.feeAge.find(function (r) { return age <= r[0]; })[1];
  const raw = salaryFor(playerScore(id), 1, 0) * CLUB_MARKET.feeRate * ageMult * (0.7 + 0.3 * Math.min(3, yearsLeft));
  return Math.round(raw / 1000000) * 1000000;
}

// ----- 다른 선수 연봉: 지난 시즌 성적 프리미엄 -----
function npcPremium(id) {
  const snap = state.league.marketSnap;
  if (!snap) return 0;
  const P = CONTRACT.premium;
  let pct = 0;
  const r = snap.ratings && snap.ratings[id];
  if (r && r[1] >= P.minSets) pct += Math.max(-P.ratingMax, Math.min(P.ratingMax, (r[0] - P.ratingPivot) * P.ratingPer));
  ((snap.awards && snap.awards[id]) || []).forEach(function (key) { pct += P.awards[key] || 0; });
  return Math.max(CONTRACT.premiumClamp[0], Math.min(CONTRACT.premiumClamp[1], pct));
}

// 다른 선수 새 계약 연봉 = 기본 연봉 × (1 + 성적 프리미엄)
function npcContractSalary(id, tier) {
  const p = findPlayer(id);
  const s = salaryFor(statScoreFor(p.stats, p.pos), tier, 0) * (1 + npcPremium(id));
  return Math.max(CONTRACT.minSalary, Math.round(s / 1000000) * 1000000);
}

// ----- 새해 직전: 지난 시즌 정보 저장 + 구단 자금 정산 (main.js에서 newSeasonLeague 전에 부름) -----
function snapshotSeasonForMarket() {
  const need = {};
  const order1 = tier1FinalOrder();
  const order2 = standings(["tier2", "tier2b"], tier2Ids()).map(function (x) { return x.id; });
  [order1, order2].forEach(function (order) {
    order.forEach(function (id, i) { need[id] = order.length > 1 ? i / (order.length - 1) : 0; });
  });
  const ratings = {};
  const stats = state.league.season.playerStats || {};
  Object.keys(stats).forEach(function (id) {
    const st = stats[id];
    if (st.g) ratings[id] = [Math.round(st.r / st.g * 100) / 100, st.g];
  });
  const awards = {};
  (state.league.awards || []).forEach(function (a) {
    if (a.year !== state.year) return;
    (awards[a.id] = awards[a.id] || []).push(a.key);
  });
  state.league.marketSnap = { year: state.year, need: need, ratings: ratings, awards: awards };

  // 구단 자금 정산: 예산보다 연봉을 많이 썼으면 빚, 빚이 있으면 남는 예산으로 조금씩 갚음
  state.league.teams.forEach(function (t) {
    if (!Number.isFinite(t.money)) t.money = 0;
    const left = CONTRACT.teamBudget[t.tier] - teamPayroll(t.id);
    if (left < 0) t.money += left;
    else if (t.money < 0) t.money = Math.min(0, t.money + left * CLUB_MARKET.repayRate);
    t.money = Math.round(t.money);
  });
}

// ----- 비시즌 리빌딩 -----
function rebuildRule(need) {
  return CLUB_MARKET.rebuild.find(function (r) { return need < r.need; }) || CLUB_MARKET.rebuild[CLUB_MARKET.rebuild.length - 1];
}

// 이 선수를 buyer 팀이 데려올 수 있나? (원래 팀이 내줄지)
function sellable(id, buyer) {
  if (id === USER_ID) return false;
  const p = findPlayer(id);
  if (!p.teamId) return true;                 // FA
  if (p.teamId === buyer.id) return false;
  const seller = findTeam(p.teamId);
  if (seller.tier > buyer.tier) return true;  // 2부 → 1부: 선수가 원해서 팀이 내줌
  return starterAt(seller.id, p.pos) !== id;   // 같은 리그(또는 아래로)는 후보만
}

// 영입했을 때 연봉 총액 변화 (선수단이 넘치면 가장 약한 선수를 내보냄)
function payrollDelta(buyer, id, salary) {
  let delta = salary;
  if (buyer.roster.length + 1 > LEAGUE.rosterSize) {
    const w = weakestPlayer(buyer.id);
    if (w && playerScore(w) < playerScore(id)) delta -= findPlayer(w).salary || 0;
  }
  return delta;
}

// 실제 이동: 이적료 주고받기, 새 계약
function npcTransfer(id, buyer, fee, salary) {
  const p = findPlayer(id);
  if (p.teamId) {
    const seller = findTeam(p.teamId);
    seller.roster.splice(seller.roster.indexOf(id), 1);
    seller.money = teamMoney(seller.id) + fee;
  } else {
    const i = state.league.freeAgents.indexOf(id);
    if (i !== -1) state.league.freeAgents.splice(i, 1);
  }
  buyer.money = teamMoney(buyer.id) - fee;
  p.teamId = buyer.id;
  p.salary = salary;
  p.contractEnd = state.year - 1 + randInt(CONTRACT.years[0], CONTRACT.years[1]);
  buyer.roster.push(id);
  while (buyer.roster.length > LEAGUE.rosterSize) {
    const w = buyer.roster.filter(function (x) { return x !== USER_ID && x !== id; })
      .sort(function (a, b) { return playerScore(a) - playerScore(b); })[0];
    if (!w) break;
    releaseToFA(w);
  }
}

// 빚 한도를 넘은 팀: 연봉 비싼 후보부터 내보냄
function fireSale(t) {
  let guard = 10;
  while (teamMoney(t.id) + CONTRACT.teamBudget[t.tier] - teamPayroll(t.id) < debtFloor(t.id) && guard-- > 0) {
    const s = starters(t.id);
    const bench = t.roster.filter(function (id) { return id !== USER_ID && POSITION_IDS.every(function (pos) { return s[pos] !== id; }); })
      .sort(function (a, b) { return (findPlayer(b).salary || 0) - (findPlayer(a).salary || 0); });
    if (!bench.length) break;
    releaseToFA(bench[0]);
  }
}

// 하위 팀부터: 약한 포지션에 더 나은 선수(FA·2부 스타·다른 팀 후보)를 데려옴
function offseasonRebuild(news) {
  const snap = state.league.marketSnap || { need: {} };
  const needOf = function (t) { return snap.need[t.id] !== undefined ? snap.need[t.id] : 0.5; };
  const order = state.league.teams.slice().sort(function (a, b) { return (needOf(b) - needOf(a)) || (a.tier - b.tier); });
  const moved = {};
  const buysLeft = {};
  order.forEach(function (t) { buysLeft[t.id] = rebuildRule(needOf(t)).buys; fireSale(t); });

  for (let pass = 0; pass < CLUB_MARKET.passes; pass++) {
    order.forEach(function (t) {
      const rule = rebuildRule(needOf(t));
      // 주전이 약한 포지션부터
      const s = starters(t.id);
      const posList = POSITION_IDS.filter(function (pos) { return s[pos] !== USER_ID; })
        .sort(function (a, b) { return (s[a] ? playerScore(s[a]) : 0) - (s[b] ? playerScore(s[b]) : 0); });
      posList.forEach(function (pos) {
        if (buysLeft[t.id] <= 0) return;
        const starter = starterAt(t.id, pos);
        const base = starter ? playerScore(starter) : 0;
        const best = Object.keys(state.league.players).filter(function (id) {
          const p = state.league.players[id];
          return p.pos === pos && !moved[id] && playerScore(id) >= base + rule.margin && sellable(id, t);
        }).map(function (id) {
          const fee = transferFee(id);
          const salary = npcContractSalary(id, t.tier);
          return { id: id, fee: fee, salary: salary, score: playerScore(id) };
        }).filter(function (c) {
          // 돈: 구단 자금 − 이적료가 빚 한도 안 + 시즌 연봉 여유
          return teamMoney(t.id) - c.fee >= debtFloor(t.id) && clubRoom(t.id) - c.fee >= payrollDelta(t, c.id, c.salary);
        }).sort(function (a, b) { return (b.score - a.score) || (a.fee + a.salary - b.fee - b.salary); })[0];
        if (!best) return;
        const p = findPlayer(best.id);
        const from = p.teamId ? findTeam(p.teamId) : null;
        npcTransfer(best.id, t, best.fee, best.salary);
        moved[best.id] = true;
        buysLeft[t.id]--;
        news.push("🔁 " + t.name + ", " + (from ? from.name + "의 " : "FA ") + p.name + "(" + findPosition(pos).name + ") 영입" +
          (best.fee ? " · 이적료 " + moneyText(best.fee) : ""));
      });
    });
  }
}

// [구단 탐색]용: 자금 한 줄
function clubMoneyText(teamId) {
  const m = teamMoney(teamId);
  return "자금 " + (m < 0 ? '<span class="down">빚 ' + moneyText(-m) + "</span>" : moneyText(m)) + " · 여유 " + moneyText(Math.max(0, clubRoom(teamId)));
}
