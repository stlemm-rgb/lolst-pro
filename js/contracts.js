// ===== 연봉 · 계약 · 2군행 · 이적 =====
// 내 계약: state.contract = { teamId, salary, endYear, guarantee }
//   endYear: 이 해 시즌이 끝나면 계약 만료, guarantee: 출전 보장 경기 수 (0이면 없음)
// 이적 확정(새 시즌에 이동): state.pendingMove = { teamId, salary, years, guarantee, endYear }
// NPC 계약: 선수마다 salary, contractEnd

// ----- 연봉 -----
// 시대 배율(data/era.js ERA.money)을 곱함: 2012년 40% → 2017년 100%. 비시즌 계약은 다음 시즌 기준
function salaryFor(score, tier, popularity) {
  const y = contractYear();
  const s = (CONTRACT.baseSalary[tier] + (score - CONTRACT.scorePivot) * CONTRACT.perScorePoint + (popularity || 0) * CONTRACT.perPopularity) * eraMoney(y);
  return Math.max(minSalaryNow(y), Math.round(s / 1000000) * 1000000); // 100만 원 단위
}

function userSalaryFor(tier) {
  return salaryBreakdown(tier).total;
}

// ----- 내 연봉 계산 내역 (제안 글에 보여 줌) -----
// 돌려주는 값: { base, skill, pop, score, popularity, reputation, repPct, premium: { pct, parts: [{label, pct}] }, traitPct, total }
function salaryBreakdown(tier) {
  const score = playerScore(USER_ID);
  const y = contractYear();
  const era = eraMoney(y); // 시대 배율 (data/era.js)
  const base = CONTRACT.baseSalary[tier] * era;
  const skill = (score - CONTRACT.scorePivot) * CONTRACT.perScorePoint * era;
  const pop = state.popularity * CONTRACT.perPopularity * era;
  const repPct = state.reputation / 100 * CONTRACT.reputationPct;
  const premium = seasonPremium();
  const traitPct = traitEffectSum("salaryBonus"); // 협상가
  const raw = Math.max(minSalaryNow(y), base + skill + pop) * (1 + repPct + premium.pct + traitPct);
  const total = Math.max(minSalaryNow(y), Math.round(raw / 1000000) * 1000000);
  return { base: base, skill: skill, pop: pop, score: score, popularity: state.popularity, reputation: state.reputation,
    repPct: repPct, premium: premium, traitPct: traitPct, total: total };
}

// 이번 시즌 성적에 따른 프리미엄(+) / 역프리미엄(−)
function seasonPremium() {
  const P = CONTRACT.premium;
  const parts = [];
  const r = currentSeasonRecord();
  const titleKeys = { "월드 우승": "worlds", "MSI 우승": "msi", "리그 우승": "playoffs", "First Stand 우승": "firststand", "LCK 컵 우승": "cup", "컵 대회 우승": "cup" };
  r.titles.forEach(function (t) { const k = titleKeys[t]; if (k) parts.push({ label: t, pct: P.titles[k] }); });
  if (!r.titles.length && r.rank > 0 && r.sets > 0) {
    const row = (P.rank[r.tier] || []).find(function (x) { return r.rank <= x[0]; });
    if (row && row[1]) parts.push({ label: "팀 " + r.rank + "위", pct: row[1] });
  }
  (state.career.awards || []).filter(function (a) { return a.year === state.year; }).forEach(function (a) {
    if (P.awards[a.key]) parts.push({ label: a.title, pct: P.awards[a.key] });
  });
  if (r.sets >= P.minSets) {
    const pct = Math.max(-P.ratingMax, Math.min(P.ratingMax, (r.rating - P.ratingPivot) * P.ratingPer));
    if (Math.abs(pct) >= 0.005) parts.push({ label: "평균 평점 " + r.rating.toFixed(2), pct: pct });
  } else if (state.week >= CONTRACT.windowStart) {
    parts.push({ label: "출전 부족 (" + r.sets + "세트)", pct: P.fewGames });
  }
  if (state.benched) parts.push({ label: "2군(후보)", pct: P.benched });
  const rawPct = parts.reduce(function (a, p) { return a + p.pct; }, 0);
  const pct = Math.max(CONTRACT.premiumClamp[0], Math.min(CONTRACT.premiumClamp[1], rawPct));
  return { pct: pct, rawPct: rawPct, parts: parts };
}

function pctText(p) {
  return (p >= 0 ? "+" : "−") + Math.abs(Math.round(p * 100)) + "%";
}

// 제안 연락 아래 접는 칸: 연봉 계산 내역 (SNS 화면에서 눌러야 펼쳐짐)
function offerBreakdownHTML(o) {
  if (!o || !o.breakdown) return "";
  return '<details class="salary-details"><summary>💰 연봉 계산 내역 보기</summary><div class="salary-breakdown">' +
    escapeHTML(salaryBreakdownText(o.breakdown, o.clubPct)) + (o.raised ? "\n  └ 연봉 인상 협상 성공 → " + moneyText(o.salary) : "") + "</div></details>";
}

// 계산 내역 글 (제안 글·이적 시장 화면)
function salaryBreakdownText(b, clubPct) {
  const lines = [];
  lines.push("  └ 기본 " + moneyText(b.base) + " + 실력 " + (b.skill >= 0 ? "" : "−") + moneyText(Math.abs(b.skill)) + " (종합 능력 " + b.score.toFixed(1) + ")" +
    " + 인기도 " + moneyText(b.pop) + " (인기도 " + b.popularity + ")");
  const mods = ["평판 " + pctText(b.repPct) + " (평판 " + (b.reputation > 0 ? "+" : "") + b.reputation + ")"];
  if (b.traitPct) mods.push("협상가 " + pctText(b.traitPct));
  if (clubPct) mods.push("영입 프리미엄 " + pctText(clubPct));
  lines.push("  └ " + mods.join(" · "));
  const pr = b.premium;
  const capped = pr.rawPct !== undefined && Math.abs(pr.rawPct - pr.pct) > 0.001;
  lines.push("  └ 시즌 성적 " + pctText(pr.pct) + (capped ? " (최대치 · 합계 " + pctText(pr.rawPct) + ")" : "") +
    (pr.parts.length ? ": " + pr.parts.map(function (p) { return p.label + " " + pctText(p.pct); }).join(", ") : ": 해당 없음"));
  return lines.join("\n");
}

function moneyText(won) {
  const man = Math.round(won / 10000);
  if (man >= 10000) {
    const eok = Math.floor(man / 10000), rest = man % 10000;
    return eok + "억" + (rest ? " " + rest.toLocaleString() + "만" : "") + " 원";
  }
  return man.toLocaleString() + "만 원";
}

// 구단 연봉 총액 (내 선수 포함)
function teamPayroll(teamId) {
  const team = findTeam(teamId);
  let sum = 0;
  team.roster.forEach(function (id) {
    if (id === USER_ID) sum += state.contract ? state.contract.salary : 0;
    else sum += findPlayer(id).salary || 0;
  });
  return sum;
}

// 구단이 더 쓸 수 있는 돈 (예산의 50%까지 빚 + 구단 자금, js/club_market.js)
function teamBudgetLeft(teamId) {
  return clubRoom(teamId);
}

// 계약 정보가 없는 선수·내 선수에게 계약 만들기 (새 게임, 예전 세이브)
function initContracts() {
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (p.contractEnd) return;
    const team = p.teamId && findTeam(p.teamId);
    p.salary = salaryFor(statScoreFor(p.stats, p.pos), team ? team.tier : 2, 0);
    p.contractEnd = state.year + randInt(0, 2);
  });
  if (!state.contract && myTeam()) {
    const team = myTeam();
    state.contract = { teamId: team.id, salary: userSalaryFor(team.tier), endYear: state.year + 1, guarantee: 0 };
  }
}

// 매주 연봉 1/52
function paySalary() {
  if (!state.contract) return;
  const weekly = Math.round(state.contract.salary / CREATION.weeksPerSeason);
  const net = Math.round(weekly * (1 - traitEffectSum("spend"))); // 낭비벽
  state.money += net;
  state.career.earned = (state.career.earned || 0) + net; // 엔딩의 "번 돈"
}

function isTransferWindow() {
  return state.week >= CONTRACT.windowStart && state.week <= CONTRACT.windowEnd;
}

function contractText(text, extra) {
  let t = text.replace(/\{name\}/g, state.player.name).replace(/\{team\}/g, myTeam() ? myTeam().name : "");
  Object.keys(extra || {}).forEach(function (k) { t = t.replace(new RegExp("\\{" + k + "\\}", "g"), extra[k]); });
  return t;
}

// ----- 주전 ↔ 후보 (2군행 / 승격) -----
// 내 팀에서 같은 포지션 경쟁자 (가장 잘하는 다른 선수)
function benchRival() {
  const team = myTeam();
  let best = null, bestScore = -1;
  team.roster.forEach(function (id) {
    if (id === USER_ID || playerPos(id) !== state.player.position) return;
    const s = playerScore(id);
    if (s > bestScore) { best = id; bestScore = s; }
  });
  return best;
}

function checkBench() {
  if (state.week % CONTRACT.benchCheckEvery !== 0 || state.week >= CONTRACT.windowStart) return;
  const rival = benchRival();
  const me = playerScore(USER_ID);
  if (!state.benched) {
    const protectedByContract = state.career.seasonGames < (state.contract.guarantee || 0);
    // 감독 신뢰 (평판 등급, js/fame.js): 평판이 좋으면 경쟁 선수가 더 잘해야 밀려남
    if (rival && playerScore(rival) >= me + CONTRACT.benchGap + managerTrust() && !protectedByContract) {
      state.benched = true;
      state.career.benchedYear = state.year; // 잡초 (S급 특성) 조건
      state.benchWeeks = 0;
      postMessage("inbox", CONTRACT_TEXTS.benchTitle, contractText(CONTRACT_TEXTS.bench, { rival: playerName(rival) }), {
        notes: ["후보일 때는 경기에 나가지 못해요. 스탯 점수가 " + playerName(rival) + "(" + playerScore(rival).toFixed(1) + ")보다 높아지면 주전으로 돌아가요."],
      });
    }
  } else {
    state.benchWeeks += CONTRACT.benchCheckEvery;
    state.popularity = clamp(state.popularity - CONTRACT.benchPopularityLoss);
    if (!rival || me + managerTrust() > playerScore(rival)) {
      state.benched = false;
      state.benchWeeks = 0;
      postMessage("inbox", CONTRACT_TEXTS.promoteTitle, contractText(CONTRACT_TEXTS.promote), {});
    }
  }
}

// ----- 제안 만들기 -----
function makeOffer(teamId, renewal) {
  const team = findTeam(teamId);
  const tier = nextTier(teamId); // 비시즌엔 다음 시즌 리그 (승격 팀 = 1부 기준, js/club_market.js)
  const breakdown = salaryBreakdown(tier);
  let salary = breakdown.total;
  let clubPct = 0;
  if (!renewal) {
    clubPct = Math.round((randFloat(CONTRACT.offerSalaryBonus[0], CONTRACT.offerSalaryBonus[1]) - 1) * 100) / 100;
    salary = Math.round(salary * (1 + clubPct) / 1000000) * 1000000;
  }
  return {
    teamId: teamId, renewal: renewal, salary: salary, breakdown: breakdown, clubPct: clubPct,
    years: randInt(CONTRACT.years[0], CONTRACT.years[1]),
    guarantee: Math.random() < CONTRACT.guaranteeChance ? CONTRACT.guaranteeGames[tier] : 0,
    negotiated: false, guaranteeAsked: false,
  };
}

function offerText(o) {
  const team = findTeam(o.teamId);
  const rank = tierTeams(team.tier).slice().sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); })
    .map(function (t) { return t.id; }).indexOf(team.id) + 1;
  if (o.loan) {
    return "\"남은 시즌 동안 우리 팀에서 주전으로 뛰어 주셨으면 합니다.\" " +
      "\n· 임대: 후반기(" + SUMMER_MARKET.applyWeek + "주)부터 이번 시즌 끝까지, 끝나면 " + myTeam().name + " 복귀" +
      "\n· 연봉·계약은 그대로 (" + moneyText(o.salary) + ")" +
      "\n· " + team.name + " (" + tierName(team.tier) + ", 전력 " + teamStrength(team.id).toFixed(1) + " · 리그 내 " + rank + "위)";
  }
  return (o.renewal ? "\"계속 함께하고 싶습니다.\" " : "\"주전 " + findPosition(state.player.position).name + " 자리를 맡아 주셨으면 합니다.\" ") +
    (o.summer ? "\n· 여름 이적: 후반기(" + SUMMER_MARKET.applyWeek + "주)부터 합류 · 원래 팀에 이적료 " + moneyText(o.fee || 0) : "") +
    "\n· 계약 " + o.years + "년, 연봉 " + moneyText(o.salary) + (o.raised ? " (인상 반영)" : "") +
    "\n· 출전 보장: " + (o.guarantee ? "시즌 " + o.guarantee + "경기" : "없음") +
    "\n· " + team.name + " (" + nextTierName(team.id) + ", 전력 " + teamStrength(team.id).toFixed(1) + " · 리그 내 " + rank + "위)";
}

function offerChoices(o) {
  const list = [{ label: "수락한다", act: "accept" }];
  if (o.loan) return list.concat([{ label: "거절한다", act: "decline" }]);
  if (!o.negotiated) list.push({ label: "연봉 인상을 요청한다", act: "raise", hint: "성공률 " + Math.round(negotiateChance() * 100) + "% (평판이 높을수록 올라감)" });
  if (!o.guarantee && !o.guaranteeAsked) list.push({ label: "출전 보장을 요청한다", act: "guarantee", hint: "성공률 " + Math.round(negotiateChance() * 100) + "%" });
  list.push({ label: o.renewal ? "거절한다 (시즌이 끝나면 FA)" : "거절한다", act: "decline" });
  return list;
}

function negotiateChance() {
  return Math.max(0.05, Math.min(0.95, CONTRACT.negotiateBase + state.reputation / 200 + traitEffectSum("negotiate")));
}

function sendOffer(o) {
  const team = findTeam(o.teamId);
  postMessage("inbox", (o.renewal ? "재계약 제안: " : o.loan ? "임대 제안: " : o.summer ? "여름 영입 제안: " : "영입 제안: ") + team.name, offerText(o), {
    kind: "offer", offer: o, choices: offerChoices(o),
  });
}

// ----- 비시즌 시작: 재계약·영입 제안 -----
function startTransferWindow() {
  state.transferRequestsLeft = CONTRACT.myRequests;
  if (state.retirePlanned) { state.transferRequestsLeft = 0; return; } // 은퇴 예정이면 제안 없음
  const mine = myTeam();
  const me = playerScore(USER_ID);

  // 재계약 (계약이 이번 시즌에 끝날 때)
  if (state.contract.endYear <= state.year) {
    const rival = benchRival();
    const wanted = state.reputation >= CONTRACT.noRenewalReputation && !(rival && playerScore(rival) >= me + 10);
    if (wanted) sendOffer(makeOffer(mine.id, true));
    else postMessage("inbox", CONTRACT_TEXTS.noRenewalTitle, contractText(CONTRACT_TEXTS.noRenewal), {});
  }

  // 다른 구단 영입 제안: 그 팀 같은 포지션 주전보다 내가 잘하고, 예산이 될 때
  const candidates = state.league.teams.filter(function (t) {
    if (t.id === mine.id) return false;
    const starter = starterAt(t.id, state.player.position);
    const better = !starter || me > playerScore(starter);
    return better && teamBudgetLeft(t.id) >= userSalaryFor(nextTier(t.id));
  }).sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); });
  let count = 1 + Math.floor(state.popularity / 40) + (state.transferListed ? 1 : 0) + (state.benched ? 1 : 0);
  if (state.reputation < 0) count -= 1;
  count = Math.max(0, Math.min(CONTRACT.maxOffers, count, candidates.length));
  // 강한 팀일수록 조금 더 잘 뽑히게: 앞쪽 절반에서 먼저 고름
  const picked = shuffled(candidates.slice(0, Math.max(count, Math.ceil(candidates.length / 2)))).slice(0, count);
  picked.forEach(function (t) { sendOffer(makeOffer(t.id, false)); });
}

// ----- 제안에 답하기 (events.js의 answerMessage에서 부름) -----
function answerOffer(msg, index) {
  const o = msg.offer;
  const choice = msg.choices[index];
  if (!choice) return;
  const team = findTeam(o.teamId);
  msg.read = true;

  if (choice.act === "raise" || choice.act === "guarantee") {
    const ok = Math.random() < negotiateChance();
    if (choice.act === "raise") {
      o.negotiated = true;
      if (ok) {
        o.salary = Math.round(o.salary * (1 + randFloat(CONTRACT.raiseRate[0], CONTRACT.raiseRate[1])) / 1000000) * 1000000;
        o.raised = true;
        msg.notes.push("연봉 인상 요청 성공! 새 조건: " + moneyText(o.salary));
      } else msg.notes.push("연봉 인상 요청은 거절됐다. 원래 조건은 그대로다.");
    } else {
      o.guaranteeAsked = true;
      if (ok) {
        o.guarantee = CONTRACT.guaranteeGames[nextTier(team.id)];
        msg.notes.push("출전 보장 요청 성공! 시즌 " + o.guarantee + "경기 보장");
      } else msg.notes.push("출전 보장 요청은 거절됐다.");
    }
    msg.text = offerText(o);
    msg.choices = offerChoices(o);
    return; // 아직 답하지 않은 상태로 남음
  }

  msg.answered = index;
  if (choice.act === "decline") {
    msg.notes.push(o.renewal ? "재계약을 거절했다. 시즌이 끝나면 FA가 된다." : "제안을 거절했다.");
    return;
  }

  // 수락: 다른 제안은 정리
  state.inbox.forEach(function (m) {
    if (m !== msg && m.kind === "offer" && m.answered === null) {
      m.answered = "ignored";
      m.read = true;
      m.notes.push("다른 계약을 맺어서 정리됐다.");
    }
  });
  if (o.renewal) {
    state.contract = { teamId: team.id, salary: o.salary, endYear: state.year + o.years, guarantee: o.guarantee };
    msg.notes.push("재계약 완료! " + (state.year + 1) + "~" + (state.year + o.years) + "년, 연봉 " + moneyText(o.salary));
  } else if (o.summer) {
    // 여름 이적·임대: 29주에 반영 (js/summer_market.js)
    state.pendingMove = { teamId: team.id, salary: o.salary, endYear: o.loan ? state.contract.endYear : state.year + Math.max(1, o.years), guarantee: o.guarantee, summer: true, loan: !!o.loan, fee: o.fee };
    msg.notes.push((o.loan ? "임대 합의! " : "이적 합의! ") + "후반기(" + SUMMER_MARKET.applyWeek + "주)부터 " + team.name + "에서 뛴다." + (o.loan ? " 시즌이 끝나면 원래 팀으로 돌아온다." : ""));
  } else {
    state.pendingMove = { teamId: team.id, salary: o.salary, endYear: state.year + o.years, guarantee: o.guarantee };
    msg.notes.push("이적 합의! 새 시즌부터 " + team.name + " 소속이 된다.");
  }
  state.log.unshift({ when: state.year + "년 " + state.week + "주차", training: "계약", message: msg.notes[msg.notes.length - 1], changes: {} });
}

// ----- 내가 이적 요청 보내기 (이적 시장 화면) -----
function canRequestTransfer(teamId) {
  if (!isAnyTransferWindow()) return "이적은 여름(" + SUMMER_MARKET.start + "~" + SUMMER_MARKET.end + "주)과 비시즌(" + CONTRACT.windowStart + "~" + CONTRACT.windowEnd + "주)에만 할 수 있어요.";
  if (state.loan) return "임대 중에는 이적할 수 없어요.";
  if (state.retirePlanned) return "은퇴 예정이라 이적할 수 없어요.";
  if (state.pendingMove) return "이미 이적이 정해졌어요.";
  if (!state.transferRequestsLeft) return "이번 비시즌 이적 요청 횟수를 다 썼어요.";
  if (teamId === myTeam().id) return "지금 소속팀이에요.";
  return "";
}

function requestTransfer(teamId) {
  if (canRequestTransfer(teamId)) return;
  state.transferRequestsLeft -= 1;
  const team = findTeam(teamId);
  const starter = starterAt(teamId, state.player.position);
  const me = playerScore(USER_ID);
  const salary = userSalaryFor(nextTier(teamId));
  const summer = isSummerWindow();
  const fee = summer ? transferFee(USER_ID) : 0; // 여름엔 계약 기간이 남아 있어서 원래 팀에 이적료
  const okSkill = !starter || me >= playerScore(starter) + CONTRACT.requestMargin;
  const okBudget = teamBudgetLeft(teamId) - fee >= salary && teamMoney(teamId) - fee >= debtFloor(teamId);
  if (okSkill && okBudget) {
    const years = randInt(CONTRACT.years[0], CONTRACT.years[1]);
    state.pendingMove = summer
      ? { teamId: teamId, salary: salary, endYear: state.year + years, guarantee: 0, summer: true, fee: fee }
      : { teamId: teamId, salary: salary, endYear: state.year + years, guarantee: 0 };
    state.inbox.forEach(function (m) {
      if (m.kind === "offer" && m.answered === null) { m.answered = "ignored"; m.read = true; m.notes.push("다른 계약을 맺어서 정리됐다."); }
    });
    const when = summer ? "후반기(" + SUMMER_MARKET.applyWeek + "주)부터" : "새 시즌부터";
    postMessage("inbox", "이적 요청 수락: " + team.name, team.name + "이(가) 이적 요청을 받아들였다. " + years + "년 계약, 연봉 " + moneyText(salary) + (fee ? ", 원래 팀에 이적료 " + moneyText(fee) : "") + ". " + when + " 합류한다.", { read: true });
    addNews("이적 합의", state.player.name + ", " + when + " " + team.name + " 합류");
  } else {
    const why = !okSkill ? "그 팀 " + findPosition(state.player.position).name + " 주전(" + playerName(starter) + ", " + playerScore(starter).toFixed(1) + ")보다 실력이 부족" : "구단 예산 부족";
    postMessage("inbox", "이적 요청 거절: " + team.name, team.name + "이(가) 이적 요청을 거절했다. (" + why + ")", { read: true });
  }
}

// ----- 선수 이동 -----
function releaseToFA(id) {
  const p = findPlayer(id);
  const team = p.teamId && findTeam(p.teamId);
  if (team) team.roster.splice(team.roster.indexOf(id), 1);
  p.teamId = null;
  if (state.league.freeAgents.indexOf(id) === -1) state.league.freeAgents.push(id);
}

function signFA(id, teamId) {
  const p = findPlayer(id);
  const team = findTeam(teamId);
  const i = state.league.freeAgents.indexOf(id);
  if (i !== -1) state.league.freeAgents.splice(i, 1);
  p.teamId = teamId;
  p.salary = npcContractSalary(id, team.tier); // 지난 시즌 성적 프리미엄 포함 (js/club_market.js)
  p.contractEnd = state.year - 1 + randInt(CONTRACT.years[0], CONTRACT.years[1]);
  team.roster.push(id);
}

// 팀에서 가장 약한 선수 (내 선수 제외)
function weakestPlayer(teamId) {
  const list = findTeam(teamId).roster.filter(function (id) { return id !== USER_ID && !findPlayer(id).loan; }) // 임대 온 선수는 빼고
    .sort(function (a, b) { return playerScore(a) - playerScore(b); });
  return list[0];
}

// 포지션이 비면 FA 중 가장 잘하는 선수, 없으면 신인으로 채움
function fillPosition(teamId, pos) {
  const fa = state.league.freeAgents.filter(function (id) { return findPlayer(id).pos === pos; })
    .sort(function (a, b) { return playerScore(b) - playerScore(a); });
  if (fa.length) { signFA(fa[0], teamId); return; }
  const rookie = makeNpc(pos, LEAGUE.rookie, LEAGUE.rookie.ageRange);
  state.league.freeAgents.push(rookie.id);
  signFA(rookie.id, teamId);
}

function moveUserTo(teamId) {
  const old = myTeam();
  if (old && old.id !== teamId) {
    old.roster.splice(old.roster.indexOf(USER_ID), 1);
    fillPosition(old.id, state.player.position);
  }
  const team = findTeam(teamId);
  if (team.roster.indexOf(USER_ID) === -1) team.roster.unshift(USER_ID);
  while (team.roster.length > LEAGUE.rosterSize) releaseToFA(weakestPlayer(team.id));
  state.team = team.name;
}

// 빈 포지션 채우기 (FA 또는 신인), 선수단 인원 맞추기 (새해·여름 이적 뒤)
function fillRosters() {
  const order = state.league.teams.slice().sort(function (a, b) { return (a.tier - b.tier) || (teamStrength(b.id) - teamStrength(a.id)); });
  order.forEach(function (t) {
    POSITION_IDS.forEach(function (pos) {
      const has = t.roster.some(function (id) { return playerPos(id) === pos; });
      if (!has) fillPosition(t.id, pos);
    });
    while (t.roster.length < LEAGUE.rosterSize && state.league.freeAgents.length) {
      const best = state.league.freeAgents.slice().sort(function (a, b) { return playerScore(b) - playerScore(a); })[0];
      signFA(best, t.id);
    }
    while (t.roster.length > LEAGUE.rosterSize) {
      const w = weakestPlayer(t.id);
      if (!w) break;
      releaseToFA(w);
    }
  });
}

// ----- 새 시즌: 계약 만료·이적 반영 -----
function contractsNewSeason() {
  const news = [];
  const lastYear = state.year - 1;

  // 0) 여름에 임대 갔던 선수들 원래 팀으로 (js/summer_market.js)
  returnLoans(news);

  // 1) 내 선수
  if (state.pendingMove) {
    const mv = state.pendingMove;
    // 계약 기간이 남은 채로 옮기면 새 팀이 원래 팀에 이적료를 냄
    const oldTeam = myTeam();
    const fee = state.contract && state.contract.endYear > lastYear && oldTeam && oldTeam.id !== mv.teamId ? transferFee(USER_ID) : 0;
    if (fee) {
      oldTeam.money = teamMoney(oldTeam.id) + fee;
      findTeam(mv.teamId).money = teamMoney(mv.teamId) - fee;
      news.push(findTeam(mv.teamId).name + "이(가) " + oldTeam.name + "에 이적료 " + moneyText(fee) + "을(를) 내고 " + state.player.name + " 영입");
    }
    moveUserTo(mv.teamId);
    state.contract = { teamId: mv.teamId, salary: mv.salary, endYear: mv.endYear, guarantee: mv.guarantee };
    news.push(state.player.name + ", " + findTeam(mv.teamId).name + " 이적 완료");
    addMoment("✈️", findTeam(mv.teamId).name + "(으)로 이적");
    state.pendingMove = null;
  } else if (state.contract.endYear <= lastYear) {
    // 계약이 끝났는데 새 계약이 없음 → 1년 계약으로 어딘가에 들어감 (팀 없는 상태는 만들지 않음)
    const me = playerScore(USER_ID);
    const mine = myTeam();
    const rival = benchRival();
    let team = mine;
    if (state.reputation < CONTRACT.noRenewalReputation || (rival && playerScore(rival) >= me + 10)) {
      const options = state.league.teams.filter(function (t) {
        const s = starterAt(t.id, state.player.position);
        return t.id !== mine.id && (!s || me > playerScore(s));
      });
      team = options.length ? pick(options) : pick(tierTeams(2));
    }
    moveUserTo(team.id);
    state.contract = { teamId: team.id, salary: Math.round(userSalaryFor(team.tier) * 0.8 / 1000000) * 1000000, endYear: state.year, guarantee: 0 };
    postMessage("inbox", CONTRACT_TEXTS.forcedTitle, contractText(CONTRACT_TEXTS.forced), { read: false });
    if (team.id !== mine.id) addMoment("📝", "FA로 " + team.name + "과(와) 1년 계약");
  }
  state.benched = false;
  state.benchWeeks = 0;
  state.transferListed = false;
  state.career.seasonGames = 0;

  // 2) NPC 계약 만료: 재계약(성적 프리미엄 포함) 또는 FA
  //    2부 선수가 1부 주전 평균보다 확실히 잘하면 1부에 가려고 재계약을 거절
  const tier1Avg = average(tierTeams(1).map(function (t) { return teamStrength(t.id); }));
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (!p.teamId || p.contractEnd > lastYear) return;
    const wantsUp = findTeam(p.teamId).tier === 2 && playerScore(id) >= tier1Avg + CLUB_MARKET.tier2Refuse;
    if (!wantsUp && Math.random() < CONTRACT.npcRenewChance) {
      p.contractEnd = lastYear + randInt(CONTRACT.years[0], CONTRACT.years[1]);
      p.salary = npcContractSalary(id, findTeam(p.teamId).tier);
    } else {
      releaseToFA(id);
    }
  });

  // 3) 리빌딩: 지난 시즌 하위 팀부터 FA·2부 스타·다른 팀 후보를 영입 (이적료·빚 50%까지, js/club_market.js)
  const moves = [];
  offseasonRebuild(moves);
  // 4) 빈 포지션 채우기, 선수단 인원 맞추기
  fillRosters();

  // 5) FA가 너무 많으면 실력 낮은 순으로 은퇴 처리 (최대 40명 유지)
  const fa = state.league.freeAgents.slice().sort(function (a, b) { return playerScore(b) - playerScore(a); });
  fa.slice(40).forEach(function (id) {
    state.league.freeAgents.splice(state.league.freeAgents.indexOf(id), 1);
    delete state.league.players[id];
  });
  // 이적 소식: 우리 팀 관련 먼저, 나머지는 이적료 큰 순서 그대로
  const mineName = myTeam().name;
  moves.sort(function (a, b) { return (b.indexOf(mineName) !== -1) - (a.indexOf(mineName) !== -1); });
  return news.slice(0, 6).concat(moves.slice(0, CLUB_MARKET.newsMax));
}
