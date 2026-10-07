// ===== 구단 자금 · 이적료 · 비시즌 리빌딩 (규칙: data/contracts.js CLUB_MARKET) =====
// team.money: 구단 자금 (이적료로 늘고 줄어요, 빚이면 −)
// state.league.marketSnap: 비시즌 시작(47주)에 저장한 지난 시즌 정보 { year, need: {팀: 0~1}, ratings: {선수: [평점, 세트]}, awards: {선수: [상 key]} }

// ----- 구단 수입 (data/contracts.js CLUB_INCOME) -----
// t.incomeLog = { 연도: { prize, sponsor, save, promo } } (최근 2년만)
function addClubIncome(t, kind, amount) {
  if (!t || !amount) return;
  if (!Number.isFinite(t.money)) t.money = 0;
  t.money = Math.round(t.money + amount);
  const log = t.incomeLog = t.incomeLog || {};
  const y = log[state.year] = log[state.year] || { prize: 0, sponsor: 0, save: 0, promo: 0 };
  y[kind] = (y[kind] || 0) + Math.round(amount);
  Object.keys(log).forEach(function (k) { if (Number(k) < state.year - 1) delete log[k]; });
}

// ----- 비시즌 정산 (47주, 이적 시장이 열릴 때 — js/main.js) -----
// 지난 시즌 순위·평점 저장 + 스폰서 수입 + 저축·빚 정산 + 승격/강등 지원금. state.league.settledYear로 한 번만
function settleSeasonClubs() {
  if (state.league.settledYear === state.year) return;
  state.league.settledYear = state.year;
  snapshotSeasonForMarket();
  state.league.season.promo.forEach(function (p) {
    if (p.winner !== p.tier2) return;
    addClubIncome(findTeam(p.tier2), "promo", CLUB_INCOME.promotion * eraMoney());  // 승격 지원금 (시대 배율)
    addClubIncome(findTeam(p.tier1), "promo", CLUB_INCOME.relegation * eraMoney()); // 강등 낙하산 지원금
  });
}

// 다음 시즌 리그 (비시즌에는 승강전 결과 반영: 승격 팀 = 1부, 강등 팀 = 2부). 1부/2부 표시는 새해에 바뀜
// 이적 시장 예산·제안 연봉·출전 보장은 이 값으로 계산
function nextTier(teamId) {
  const t = findTeam(teamId);
  if (!t) return 2;
  if (state.week < CONTRACT.windowStart || !state.league.season || !state.league.season.promo) return t.tier;
  const p = state.league.season.promo.find(function (x) { return x.winner === x.tier2 && (x.tier1 === teamId || x.tier2 === teamId); });
  return p ? (p.tier2 === teamId ? 1 : 2) : t.tier;
}

// 리그 이름 + (승격/강등 예정)
function nextTierName(teamId) {
  const t = findTeam(teamId), n = nextTier(teamId);
  return tierName(n) + (n !== t.tier ? (n < t.tier ? " · 승격 예정" : " · 강등 예정") : "");
}

// 결승이 끝나면 상금 (js/matchsim.js koFinal에서 부름)
function payPrize(champKey, final, semis) {
  const P = CLUB_INCOME.prize[champKey];
  if (!P) return;
  const era = eraMoney(); // 시대 배율 (data/era.js)
  const list = [[final.winner, P[0] * era], [final.loser, P[1] * era]].concat(semis.map(function (m) { return [m.loser, P[2] * era]; }));
  list.forEach(function (x) {
    const t = findTeam(x[0]);
    if (!t) return; // 해외 팀
    addClubIncome(t, "prize", x[1]);
    if (myTeam() && t.id === myTeam().id) addNews("💰 구단 상금", t.name + " 구단이 상금 " + moneyText(x[1]) + "을(를) 받았다.");
  });
}

// 시즌 끝 스폰서 수입 (snapshotSeasonForMarket에서, 순위가 정해진 뒤)
function paySponsors() {
  const S = CLUB_INCOME.sponsor;
  const scores = [];
  tierTeams(1).forEach(function (t) {
    const st = starters(t.id);
    Object.keys(st).forEach(function (pos) { if (st[pos] && st[pos] !== USER_ID) scores.push(playerScore(st[pos])); });
  });
  const avg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : 60;
  [[1, tier1FinalOrder()], [2, standings(["tier2", "tier2b"], tier2Ids()).map(function (x) { return x.id; })]].forEach(function (pair) {
    const order = pair[1];
    order.forEach(function (id, i) {
      const t = findTeam(id);
      if (!t) return;
      const mult = S.rankMult[0] + (S.rankMult[1] - S.rankMult[0]) * (order.length > 1 ? i / (order.length - 1) : 0);
      const stars = t.roster.filter(function (pid) { return playerScore(pid) >= avg + S.starMargin; }).length;
      const mine = myTeam() && t.id === myTeam().id;
      const amount = (S.base[pair[0]] * mult + stars * S.starBonus + (mine ? state.popularity * S.userPopularity : 0)) * eraMoney(); // 시대 배율
      addClubIncome(t, "sponsor", amount);
      if (mine) addNews("💰 구단 스폰서", t.name + " 구단 스폰서 수입 " + moneyText(Math.round(amount)) + " (리그 " + (i + 1) + "위 · 스타 선수 " + stars + "명 · 내 인기도 " + state.popularity + ")");
    });
  });
}

// [구단 탐색]용: 올해(없으면 지난해) 수입 글
function clubIncomeText(teamId) {
  const t = findTeam(teamId);
  const log = t && t.incomeLog;
  if (!log) return "";
  const y = log[state.year] ? state.year : log[state.year - 1] ? state.year - 1 : null;
  if (!y) return "";
  const r = log[y];
  const parts = [["상금", r.prize], ["스폰서", r.sponsor], ["저축", r.save], ["승강 지원금", r.promo]].filter(function (x) { return x[1] > 0; })
    .map(function (x) { return x[0] + " " + moneyText(x[1]); });
  return parts.length ? y + "년 수입: " + parts.join(" · ") : "";
}

function teamMoney(teamId) {
  const t = findTeam(teamId);
  return t && Number.isFinite(t.money) ? t.money : 0;
}

// 구단 여유 = 예산 × (1 + 빚 한도) + 구단 자금 − 연봉 총액
function clubRoom(teamId) {
  const t = findTeam(teamId);
  return teamBudgetOf(nextTier(teamId), contractYear()) * (1 + CLUB_MARKET.debtLimit) + teamMoney(teamId) - teamPayroll(teamId); // 비시즌엔 다음 시즌 리그 예산
}

// 빚 한도 (구단 자금이 이 아래로 내려가면 안 됨)
function debtFloor(teamId) {
  return -teamBudgetOf(findTeam(teamId).tier) * CLUB_MARKET.debtLimit;
}

// 이적료: 1부 기준 연봉 × 비율 × 나이 배율 × 남은 계약 (계약 없으면 0)
function transferFee(id) {
  const user = id === USER_ID;
  // 첫 단기 계약은 여름 합류 시점에 만료되므로 이적료 없음.
  if (user && firstSummerContract() && state.week >= SUMMER_MARKET.start) return 0;
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
  return Math.max(minSalaryNow(contractYear()), Math.round(s / 1000000) * 1000000);
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

  // 스폰서 수입 (순위·스타 선수·내 인기도)
  paySponsors();
  // 구단 자금 정산: 예산보다 연봉을 많이 썼으면 빚, 빚이 있으면 남는 예산으로 조금씩 갚음, 빚이 없으면 남은 돈 일부 저축
  state.league.teams.forEach(function (t) {
    if (!Number.isFinite(t.money)) t.money = 0;
    const left = teamBudgetOf(t.tier) - teamPayroll(t.id);
    if (left < 0) t.money += left;
    else if (t.money < 0) t.money = Math.min(0, t.money + left * CLUB_MARKET.repayRate);
    else addClubIncome(t, "save", left * CLUB_INCOME.saveRate);
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
  if (p.loan) return false;                    // 임대 중인 선수는 못 데려감
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
//   kind: "buy" 보강 · "star" 1부 주전 이적 · "depth" 경쟁 후보 (이적 목록에 기록)
//   선수단이 넘치면 가장 약한 선수를 내보냄 (depth면 주전은 빼고 후보 중에서)
function npcTransfer(id, buyer, fee, salary, kind) {
  const p = findPlayer(id);
  const seller = p.teamId ? findTeam(p.teamId) : null;
  noteFriendLeaving(id, seller, buyer); // 친한 동료가 떠나면 작별 연락 (js/stories.js)
  logTransfer({ kind: kind || "buy", team: buyer.id, from: seller ? seller.id : null, id: id, name: p.name, pos: p.pos, score: Math.round(playerScore(id) * 10) / 10, age: p.age, fee: fee });
  if (seller) {
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
    const s = kind === "depth" ? starters(buyer.id) : {};
    const keep = POSITION_IDS.map(function (pos) { return s[pos]; });
    const w = buyer.roster.filter(function (x) { return x !== USER_ID && x !== id && !findPlayer(x).loan && keep.indexOf(x) === -1; })
      .sort(function (a, b) { return playerScore(a) - playerScore(b); })[0];
    if (!w) break;
    releaseToFA(w);
  }
}

// ----- 이적 목록 (state.league.transferLog, [이적 시장] '이적 목록') -----
// { y, w, kind, team, from, id, name, pos, score, age, fee }  kind: buy·star·depth·loan
function logTransfer(e) {
  const L = state.league;
  if (!L.transferLog) L.transferLog = [];
  e.y = state.year; e.w = state.week;
  L.transferLog.push(e);
  const from = state.year - CLUB_MARKET.logYears + 1;
  L.transferLog = L.transferLog.filter(function (x) { return x.y >= from; });
}

// 빚 한도를 넘은 팀: 연봉 비싼 후보부터 내보냄
function fireSale(t) {
  let guard = 10;
  while (teamMoney(t.id) + teamBudgetOf(t.tier) - teamPayroll(t.id) < debtFloor(t.id) && guard-- > 0) {
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

  // 1부 팀끼리 주전 이적 (판 팀은 아래 영입 라운드에서 받은 이적료로 다시 보강)
  starTransfers(moved, news);

  for (let pass = 0; pass < CLUB_MARKET.passes; pass++) {
    order.forEach(function (t) {
      const rule = rebuildRule(needOf(t));
      weakPositions(t).forEach(function (pos) {
        if (buysLeft[t.id] <= 0) return;
        const text = tryBuy(t, pos, rule.margin, moved);
        if (text) { buysLeft[t.id]--; news.push(text); }
      });
    });
  }
  // 경쟁 후보 영입
  depthSignings(order, moved, news);
}

// 영입할 돈이 되나? (구단 자금 − 이적료가 빚 한도 안 + 시즌 연봉 여유)
function canAfford(t, c) {
  return teamMoney(t.id) - c.fee >= debtFloor(t.id) && clubRoom(t.id) - c.fee >= payrollDelta(t, c.id, c.salary);
}

// 1부 팀끼리 주전 이적: 돈 많은 팀부터, 약한 포지션에 다른 1부 팀 주전(margin 이상 나은)을 이적료 × feeMult로
function starTransfers(moved, news) {
  const S = CLUB_MARKET.star;
  const sold = {};
  let count = 0;
  const buyers = tierTeams(1).slice().sort(function (a, b) { return teamMoney(b.id) - teamMoney(a.id); });
  buyers.forEach(function (t) {
    if (count >= S.maxMoves || sold[t.id] || Math.random() >= S.chance) return;
    let done = false;
    weakPositions(t).forEach(function (pos) {
      if (done) return;
      const starter = starterAt(t.id, pos);
      const base = starter ? playerScore(starter) : 0;
      const best = tierTeams(1).filter(function (o) { return o.id !== t.id && !sold[o.id]; }).map(function (o) {
        const id = starterAt(o.id, pos);
        if (!id || id === USER_ID || moved[id] || findPlayer(id).loan || playerScore(id) < base + S.margin) return null;
        return { id: id, fee: Math.round(transferFee(id) * S.feeMult / 1000000) * 1000000, salary: npcContractSalary(id, 1), score: playerScore(id) };
      }).filter(function (c) {
        return c && teamMoney(t.id) - c.fee >= S.keepMoney && clubRoom(t.id) - c.fee >= payrollDelta(t, c.id, c.salary);
      }).sort(function (a, b) { return b.score - a.score; })[0];
      if (!best) return;
      const p = findPlayer(best.id);
      const from = findTeam(p.teamId);
      npcTransfer(best.id, t, best.fee, best.salary, "star");
      moved[best.id] = true;
      sold[from.id] = true;
      count++;
      done = true;
      news.push("💥 " + t.name + ", " + from.name + " 주전 " + p.name + "(" + findPosition(pos).name + ") 영입" +
        (best.fee ? " · 이적료 " + moneyText(best.fee) : "") + " — " + transferSummary(pos, starter, best.id));
    });
  });
}

// 경쟁 후보 영입: 주전과 후보 차이가 큰 포지션에 '주전보다 조금 약한' 선수 (내 포지션이면 나와 비슷한 선수)
function depthSignings(order, moved, news) {
  const D = CLUB_MARKET.depth;
  order.forEach(function (t) {
    if (Math.random() >= D.chance) return;
    const s = starters(t.id);
    const starterIds = POSITION_IDS.map(function (pos) { return s[pos]; });
    // 포지션별 차이 (주전 − 같은 포지션 가장 좋은 후보)
    const gaps = POSITION_IDS.filter(function (pos) { return s[pos]; }).map(function (pos) {
      const base = playerScore(s[pos]);
      const bench = t.roster.filter(function (id) { return id !== USER_ID && starterIds.indexOf(id) === -1 && playerPos(id) === pos; })
        .map(playerScore).sort(function (a, b) { return b - a; })[0];
      return { pos: pos, base: base, gap: bench === undefined ? 99 : base - bench };
    }).filter(function (g) { return g.gap >= D.gapFrom; }).sort(function (a, b) { return b.gap - a.gap; });
    let done = false;
    gaps.forEach(function (g) {
      if (done) return;
      const user = s[g.pos] === USER_ID;
      const win = user ? D.userWindow : D.window;
      // 내 포지션이면 같은 리그 다른 팀 주전도 후보 (이적료 × star.feeMult) — 내가 잘해도 경쟁자가 올 수 있게
      const rivalStarter = function (id, p) {
        return user && p.teamId && p.teamId !== t.id && !p.loan && findTeam(p.teamId).tier === t.tier && starterAt(p.teamId, p.pos) === id;
      };
      const best = Object.keys(state.league.players).filter(function (id) {
        const p = state.league.players[id];
        if (p.pos !== g.pos || moved[id] || !(sellable(id, t) || rivalStarter(id, p))) return false;
        const sc = playerScore(id);
        return sc >= g.base + win[0] && sc <= g.base + win[1];
      }).map(function (id) {
        const fee = rivalStarter(id, findPlayer(id)) ? Math.round(transferFee(id) * CLUB_MARKET.star.feeMult / 1000000) * 1000000 : transferFee(id);
        return { id: id, fee: fee, salary: npcContractSalary(id, t.tier), score: playerScore(id),
          pickScore: playerScore(id) + Math.max(0, 25 - playerAge(id)) * D.youngBonus };
      }).filter(function (c) { return canAfford(t, c); })
        .sort(function (a, b) { return (b.pickScore - a.pickScore) || (a.fee + a.salary - b.fee - b.salary); })[0];
      if (!best) return;
      const p = findPlayer(best.id);
      const from = p.teamId ? findTeam(p.teamId) : null;
      npcTransfer(best.id, t, best.fee, best.salary, "depth");
      moved[best.id] = true;
      done = true;
      news.push("🧩 " + t.name + ", " + (from ? from.name + "의 " : "FA ") + p.name + "(" + findPosition(g.pos).name + ", " + best.score.toFixed(1) + ") 영입 — 주전 경쟁 체제" +
        (best.fee ? " · 이적료 " + moneyText(best.fee) : ""));
      if (user) {
        queueTrigger("rivalSigned", { pid: best.id, player: p.name, pteam: from ? from.name : "FA", score: best.score.toFixed(1), gap: CONTRACT.benchGap + managerTrust() }); // 반응 연락 (data/events_story.js rival_signed)
      }
    });
  });
}

// 주전이 약한 포지션부터 (내 포지션은 빼고)
function weakPositions(t) {
  const s = starters(t.id);
  return POSITION_IDS.filter(function (pos) { return s[pos] !== USER_ID; })
    .sort(function (a, b) { return (s[a] ? playerScore(s[a]) : 0) - (s[b] ? playerScore(s[b]) : 0); });
}

// 그 포지션에 지금 주전보다 margin 이상 나은 선수를 이적료·연봉을 감당할 수 있으면 영입 → 소식 글 (못 사면 null)
function tryBuy(t, pos, margin, moved) {
  const starter = starterAt(t.id, pos);
  const base = starter ? playerScore(starter) : 0;
  const best = Object.keys(state.league.players).filter(function (id) {
    const p = state.league.players[id];
    return p.pos === pos && !moved[id] && playerScore(id) >= base + margin && sellable(id, t);
  }).map(function (id) {
    const fee = transferFee(id);
    const salary = npcContractSalary(id, t.tier);
    return { id: id, fee: fee, salary: salary, score: playerScore(id) };
  }).filter(function (c) { return canAfford(t, c); }).sort(function (a, b) { return (b.score - a.score) || (a.fee + a.salary - b.fee - b.salary); })[0];
  if (!best) return null;
  const p = findPlayer(best.id);
  const from = p.teamId ? findTeam(p.teamId) : null;
  npcTransfer(best.id, t, best.fee, best.salary);
  moved[best.id] = true;
  return "🔁 " + t.name + ", " + (from ? from.name + "의 " : "FA ") + p.name + "(" + findPosition(pos).name + ") 영입" +
    (best.fee ? " · 이적료 " + moneyText(best.fee) : "") + " — " + transferSummary(pos, starter, best.id);
}

// 이적 소식 짧은 기사: 기존 주전 vs 새 선수 포지션 점수 (data/contracts.js TRANSFER_NEWS)
function transferSummary(pos, oldId, newId) {
  const N = TRANSFER_NEWS;
  const newScore = playerScore(newId);
  const v = { pos: findPosition(pos).name, new: playerName(newId), newScore: newScore.toFixed(1) };
  let text;
  if (!oldId || oldId === newId) text = N.empty;
  else {
    const oldScore = playerScore(oldId);
    const diff = newScore - oldScore;
    v.old = playerName(oldId); v.oldScore = oldScore.toFixed(1); v.diff = diff.toFixed(1);
    text = pick(diff >= N.bigFrom ? N.big : diff >= N.midFrom ? N.mid : N.small);
  }
  return text.replace(/\{(\w+)\}/g, function (all, k) { return v[k] !== undefined ? v[k] : all; });
}

// [구단 탐색]용: 자금 한 줄
function clubMoneyText(teamId) {
  const m = teamMoney(teamId);
  return "자금 " + (m < 0 ? '<span class="down">빚 ' + moneyText(-m) + "</span>" : moneyText(m)) + " · 여유 " + moneyText(Math.max(0, clubRoom(teamId)));
}
