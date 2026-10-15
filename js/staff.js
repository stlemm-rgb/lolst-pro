// ===== 구단 스태프 (173, 로드맵 ④) — 값은 data/staff.js =====
// team.staff = { manager: {name, g, since, friend?}, coach: {...}, analyst: {...}, facility: {g} }  (g = 0 S ~ 4 D)
// state.league 안이라 저장 자동. 예전 세이브는 renderAll → ensureStaff에서 채움
// 부르는 곳: main.js nextWeek(staffWeekly) · 새해 contractsNewSeason(staffNewSeason) · matchsim.js lineup(staffPowerMult)·playMatch(분석 리포트 계획)
//            league.js npcYearGrowth(staffGrowthBonus) · player.js trainingBonusFor(staffTrainingBonus) · 화면 4곳

function staffRole(id) { return STAFF_ROLES.find(function (r) { return r.id === id; }); }
function gradeName(g) { return STAFF_GRADES[Math.max(0, Math.min(4, g))]; }
function gradeTag(g) { return '<span class="staff-g g' + gradeName(g) + '">' + gradeName(g) + "</span>"; }
function rollGrade(tier) {
  const odds = STAFF_RULES.startOdds;
  let r = Math.random(), g = 0;
  while (g < 4 && r >= odds[g]) { r -= odds[g]; g++; }
  return Math.min(4, g + (tier === 2 ? 1 : 0));
}
function staffName() {
  const used = [];
  (state.league.teams || []).forEach(function (t) { if (t.staff) STAFF_ROLES.forEach(function (r) { if (t.staff[r.id] && t.staff[r.id].name) used.push(t.staff[r.id].name); }); });
  const list = PLAYER_NAMES.filter(function (n) { return used.indexOf(n) === -1; });
  return pick(list.length ? list : PLAYER_NAMES);
}
function newStaff(role, g) {
  return staffRole(role).person ? { name: staffName(), g: g, since: state.year } : { g: g };
}

// 새 게임·예전 세이브·신생 구단: 스태프 채우기
function ensureStaff() {
  if (!state.league || !state.league.teams) return;
  state.league.teams.forEach(function (t) {
    if (!t.staff) t.staff = {};
    STAFF_ROLES.forEach(function (r) { if (!t.staff[r.id]) t.staff[r.id] = newStaff(r.id, rollGrade(t.tier)); });
  });
  syncFriendStaff();
}
function teamStaff(teamId) {
  const t = findTeam(teamId);
  if (!t) return null;
  if (!t.staff) ensureStaff();
  return t.staff;
}
function staffG(teamId, role) {
  const s = teamStaff(teamId);
  return s && s[role] ? s[role].g : 2;
}
function staffEff(teamId, role, key) { return STAFF_EFFECTS[role][key][staffG(teamId, role)]; }

// ----- 효과 -----
function staffPowerMult(teamId) { return findTeam(teamId) ? 1 + staffEff(teamId, "manager", "power") : 1; }
function staffGrowthBonus(teamId) { return teamId && findTeam(teamId) ? staffEff(teamId, "coach", "growth") : 0; }
function staffTrainingBonus() { const t = myTeam(); return t ? staffEff(t.id, "coach", "training") : 0; }
function staffStaminaRegen() { const t = myTeam(); return t ? staffEff(t.id, "facility", "stamina") : 0; }
function personalAnalyst() { return !!(state.shop && state.shop.staff && state.shop.staff.analyst); }
function analystAccuracy(teamId) {
  return Math.min(STAFF_RULES.accuracyMax, staffEff(teamId, "analyst", "accuracy") + (personalAnalyst() ? STAFF_RULES.personalAnalyst : 0));
}

// ----- 은퇴한 친구 코치·감독 = S급 (js/retirement.js state.friends.coach) -----
function syncFriendStaff() {
  const c = state.friends && state.friends.coach;
  const t = c && findTeam(c.teamId);
  if (!t || !t.staff) return;
  const role = c.role === "감독" ? "manager" : "coach";
  const cur = t.staff[role];
  if (!(cur && cur.friend && cur.name === c.name)) t.staff[role] = { name: c.name, g: 0, since: state.year, friend: true };
  // 코치에서 감독이 됐으면 코치 자리는 새 사람
  if (role === "manager" && t.staff.coach && t.staff.coach.friend && t.staff.coach.name === c.name) t.staff.coach = newStaff("coach", 2);
}

// ----- 새해 (contractsNewSeason, 연봉 압박 다음) -----
function staffNewSeason(news) {
  ensureStaff();
  const R = STAFF_RULES;
  const L = state.league;
  const mine = myTeam();
  // 1) 우승팀 스태프 빼 가기 (리그·월드)
  const lc = L.lastChamps;
  if (lc && lc.year === state.year - 1) {
    [lc.ids.playoffs, lc.ids.worlds].filter(function (id, i, a) { return id && findTeam(id) && a.indexOf(id) === i; }).forEach(function (champId) {
      const champ = findTeam(champId);
      ["manager", "coach", "analyst"].forEach(function (role) {
        const s = champ.staff[role];
        if (!s || s.g > 1 || s.friend || Math.random() >= R.poachChance) return;
        const buyers = tierTeams(1).filter(function (t) { return t.id !== champId && t.staff[role].g > s.g && !t.staff[role].friend; });
        if (!buyers.length) return;
        const to = pick(buyers);
        const back = to.staff[role];
        to.staff[role] = Object.assign({}, s, { since: state.year });
        champ.staff[role] = Object.assign({}, back, { since: state.year });
        const line = "🧑‍💼 " + champ.name + "의 " + gradeName(s.g) + "급 " + staffRole(role).name + " " + s.name + ", " + to.name + "(으)로 이적 — " + champ.name + "은(는) " + back.name + "(" + gradeName(back.g) + "급)을(를) 데려왔다";
        news.push("🔁 " + line);
        if (mine && (mine.id === champId || mine.id === to.id)) addNews("구단 스태프", line);
      });
    });
  }
  // 2) 구단마다: 유지비 → 빚이면 하락 / 여유 있으면 투자 / 자연 변동
  L.teams.forEach(function (t) {
    const budget = teamBudgetOf(t.tier);
    const isMine = mine && t.id === mine.id;
    const report = [];
    STAFF_ROLES.forEach(function (r) {
      const s = t.staff[r.id];
      const cost = Math.round(budget * R.upkeep[s.g]);
      if (cost) t.money = teamMoney(t.id) - cost;
    });
    if (teamMoney(t.id) < 0 && Math.random() < R.debtDownChance) {
      const roles = STAFF_ROLES.filter(function (r) { return t.staff[r.id].g < 4 && !t.staff[r.id].friend; });
      if (roles.length) {
        const r = pick(roles);
        t.staff[r.id] = newStaff(r.id, t.staff[r.id].g + 1);
        report.push(r.icon + " " + r.name + " " + gradeName(t.staff[r.id].g + -1) + " → " + gradeName(t.staff[r.id].g) + " (자금난)");
      }
    } else if (Math.random() < R.upgradeChance) {
      // 가장 낮은 칸부터 1칸
      const r = STAFF_ROLES.slice().sort(function (a, b) { return t.staff[b.id].g - t.staff[a.id].g; })[0];
      const g = t.staff[r.id].g;
      const cost = g > 0 ? Math.round(budget * R.upgradeCost[g - 1]) : 0;
      if (g > 0 && !t.staff[r.id].friend && teamMoney(t.id) - cost >= budget * R.upgradeKeep) {
        t.money = teamMoney(t.id) - cost;
        t.staff[r.id] = newStaff(r.id, g - 1);
        report.push(r.icon + " " + r.name + " " + gradeName(g) + " → " + gradeName(g - 1) + " (투자 " + moneyText(cost) + ")");
      }
    }
    STAFF_ROLES.forEach(function (r) {
      const s = t.staff[r.id];
      if (s.friend || Math.random() >= R.drift) return;
      const g = Math.max(0, Math.min(4, s.g + (Math.random() < 0.5 ? -1 : 1)));
      if (g === s.g) return;
      t.staff[r.id] = newStaff(r.id, g);
      report.push(r.icon + " " + r.name + " " + gradeName(s.g) + " → " + gradeName(g) + (r.person ? " (" + s.name + " → " + t.staff[r.id].name + ")" : ""));
    });
    if (report.length) {
      t.staffLog = { year: state.year, lines: report };
      if (isMine) addNews("구단 스태프", t.name + " 스태프 변화: " + report.join(" · "));
    }
  });
}

// ----- 매주 (nextWeek 끝): 친구 코치 반영 · 분석 리포트 · 인사 추천권 -----
function staffWeekly() {
  ensureStaff();
  staffReports();
  if (state.week === STAFF_RULES.pickWeek) postStaffPick();
  const regen = staffStaminaRegen();
  if (regen > 0 && state.stamina < state.staminaMax) state.stamina = Math.min(state.staminaMax, state.stamina + regen);
}

// 분석 리포트: 이번 주 우리 팀 경기(대진이 잡힌 것)마다 상대 조합 계획을 미리 정하고, 분석관 정확도만큼 맞게 알려 줌
function staffReports() {
  const mine = myTeam();
  if (!mine || !state.league.season) return;
  const wk = userWeekMatches(state.week);
  wk.matches.forEach(function (m) {
    if (m.scout && m.scout.y === state.year) return;
    const opp = m.a === mine.id ? m.b : m.a;
    const plan = teamCompPlan(opp);
    const acc = analystAccuracy(mine.id);
    const right = Math.random() < acc;
    const shown = right ? plan.target : pick(COMPS.filter(function (c) { return c.id !== plan.target; })).id;
    m.scout = { y: state.year, opp: opp, plan: plan.plan, target: plan.target, shown: shown, acc: acc, right: right };
  });
}
// 경기 때 상대 계획 (js/matchsim.js playMatch)
function scoutedPlan(m, teamId) {
  return m.scout && m.scout.opp === teamId && m.scout.y === state.year ? { plan: m.scout.plan, target: m.scout.target } : null;
}
// 내 선택지별 기대 상성 (리포트의 예상 조합 기준): +1 우위 / −1 열세
function compEdge(mine, opp) {
  const a = COMPS.find(function (c) { return c.id === mine; }), b = COMPS.find(function (c) { return c.id === opp; });
  if (!a || !b) return 0;
  return a.beats.indexOf(opp) !== -1 ? 1 : b.beats.indexOf(mine) !== -1 ? -1 : 0;
}
function scoutOptions(shown) {
  const meta = metaComp();
  const cs = countersOf(meta);
  const opts = [
    { id: "meta", v: compEdge(meta, shown) },
    { id: "counter", v: cs.reduce(function (s, c) { return s + compEdge(c, shown); }, 0) / cs.length },
  ];
  return opts.sort(function (a, b) { return b.v - a.v; });
}
// 이번 주 리포트들을 합쳐 더 나은 전략 (대시보드 조합 전략 '📊 추천' 표시, js/comps.js). 차이 없으면 null
function scoutBestPlan() {
  const mine = myTeam();
  if (!mine || !state.league.season) return null;
  const sum = { meta: 0, counter: 0 };
  let n = 0;
  userWeekMatches(state.week).matches.forEach(function (m) {
    if (!m.scout || m.scout.y !== state.year) return;
    scoutOptions(m.scout.shown).forEach(function (o) { sum[o.id] += o.v; });
    n++;
  });
  if (!n || sum.meta === sum.counter) return null;
  return sum.meta > sum.counter ? "meta" : "counter";
}
function scoutAdvice(shown) {
  const opts = scoutOptions(shown);
  if (opts[0].v === opts[1].v) return "두 전략 차이 없음";
  const p = COMP_PLANS.find(function (x) { return x.id === opts[0].id; });
  return "추천: <b>" + p.name + "</b>" + (opts[0].v > 0 ? " (상성 우위 기대)" : " (상성 열세를 피함)");
}
function compLabel(id) { const c = COMPS.find(function (x) { return x.id === id; }); return c ? c.icon + " " + c.name : id; }
// 대시보드 경기 줄 아래
function scoutReportHTML(m) {
  const mine = myTeam();
  if (!mine || !m.scout || m.scout.y !== state.year) return '<div class="rep-row muted small h2h-row">📊 분석 리포트: 대진이 정해지면 분석관이 상대를 분석해요.</div>';
  const s = m.scout;
  const an = teamStaff(mine.id).analyst;
  return '<div class="rep-row small h2h-row">📊 분석 리포트 <span class="muted">(분석관 ' + escapeHTML(an.name) + " " + gradeTag(an.g) + " · 정확도 " + Math.round(s.acc * 100) + "%" + (personalAnalyst() ? " · 개인 분석가 +" + Math.round(STAFF_RULES.personalAnalyst * 100) + "%p" : "") + ")</span>: " +
    escapeHTML(teamName(s.opp)) + "은(는) <b>" + compLabel(s.shown) + "</b> 조합을 노릴 듯 → " + scoutAdvice(s.shown) + "</div>";
}
// 경기 결과 줄에 붙이는 한 줄 (리포트가 맞았는지)
function scoutResultText(m) {
  if (!m.scout || m.scout.y !== state.year) return "";
  return m.scout.right ? "📊 분석 적중 (" + compLabel(m.scout.target) + ")" : "📊 분석 빗나감 (실제 " + compLabel(m.scout.target) + ")";
}

// ----- 인사 추천권 (C안) -----
function staffPickRoles() {
  const S = ensureStanding();
  const v = standingValue();
  const tenure = state.year - (S.since || state.year);
  if (v < STAFF_RULES.pickStanding && tenure < STAFF_RULES.pickTenure) return [];
  return ["coach", "analyst"].concat(v >= STAFF_RULES.pickManagerStanding ? ["manager"] : []);
}
function postStaffPick() {
  const t = myTeam();
  if (!t || state.benched || state.retirePlanned || state.retired) return;
  const S = ensureStanding();
  if (S.staffPickYear === state.year) return;
  const roles = staffPickRoles().filter(function (r) { return !t.staff[r].friend; });
  if (!roles.length) return;
  S.staffPickYear = state.year;
  const role = shuffled(roles).sort(function (a, b) { return t.staff[b].g - t.staff[a].g; })[0]; // 가장 낮은 칸
  const cur = t.staff[role];
  const R = STAFF_RULES;
  const sh = shopState();
  const ticket = (sh.tickets || 0) > 0;
  if (ticket) sh.tickets--;
  const cands = [];
  for (let i = 0; i < R.pickCount; i++) {
    let g = Math.max(0, Math.min(4, cur.g - pick(R.candShift)));
    if (ticket && i === 0) g = Math.random() < R.ticket.sChance ? 0 : 1;
    cands.push({ name: staffName(), g: g, ticket: ticket && i === 0 }); // 티켓 카드는 뒷면부터 금빛 (js/cards.js)
  }
  cands.sort(function (a, b) { return a.g - b.g; });
  const rr = staffRole(role);
  const last = rr.name.charCodeAt(rr.name.length - 1);
  const vars = { role: rr.name, roleObj: rr.name + ((last - 0xac00) % 28 ? "을" : "를"), cur: cur.name + " (" + gradeName(cur.g) + "급)" };
  const fill = function (s) { return s.replace(/\{(\w+)\}/g, function (a, k) { return vars[k] !== undefined ? vars[k] : a; }); };
  postMessage("inbox", fill(STAFF_TEXTS.pickTitle), fill(STAFF_TEXTS.pick) + (ticket ? "\n" + STAFF_TEXTS.pickTicket : ""), {
    kind: "staffPick", staffPick: { role: role, cands: cands },
    choices: cands.map(function (c) { return { label: c.name + " (" + gradeName(c.g) + "급 " + rr.name + ")", hint: staffEffectText(role, c.g) + " · 지금 " + gradeName(cur.g) + "급: " + staffEffectText(role, cur.g) }; })
      .concat([{ label: "지금 " + rr.name + " 그대로", hint: cur.name + " (" + gradeName(cur.g) + "급)" }]),
  });
}
function answerStaffPick(msg, index) {
  const p = msg.staffPick, t = myTeam();
  const c = p && p.cands[index];
  let result;
  if (c && t) {
    t.staff[p.role] = { name: c.name, g: c.g, since: state.year };
    result = STAFF_TEXTS.hired.replace("{name}", c.name).replace("{grade}", gradeName(c.g));
    addNews("구단 스태프", "🧑‍💼 " + state.player.name + "의 추천으로 " + t.name + "이(가) " + gradeName(c.g) + "급 " + staffRole(p.role).name + " " + c.name + "을(를) 데려왔다.");
  } else result = STAFF_TEXTS.keep;
  msg.answered = index; msg.read = true; msg.result = result; msg.notes = []; msg.changes = {};
}

// 효과 글
function staffEffectText(role, g) {
  const E = STAFF_EFFECTS[role];
  const pct = function (v) { return (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(Math.round(v * 1000) / 10) + "%"; };
  if (role === "manager") return "경기력 " + pct(E.power[g]);
  if (role === "coach") return "선수 성장 " + pct(E.growth[g]) + " · 내 훈련 " + pct(E.training[g]);
  if (role === "analyst") return "리포트 정확도 " + Math.round(E.accuracy[g] * 100) + "%";
  return "내 체력 회복 매주 +" + E.stamina[g];
}

// ----- 화면 -----
function staffLineText(teamId) {
  const s = teamStaff(teamId);
  if (!s) return "";
  return STAFF_ROLES.map(function (r) { return r.icon + gradeTag(s[r.id].g); }).join(" ");
}
function staffPlainText(teamId) {
  const s = teamStaff(teamId);
  if (!s) return "";
  return STAFF_ROLES.map(function (r) { return r.name + " " + gradeName(s[r.id].g); }).join(" · ");
}
function staffCardHTML(teamId, title) {
  const s = teamStaff(teamId);
  if (!s) return "";
  const t = findTeam(teamId);
  const rows = STAFF_ROLES.map(function (r) {
    const x = s[r.id];
    return "<tr><td>" + r.icon + " " + r.name + "</td><td>" + gradeTag(x.g) + "</td><td>" + (r.person ? escapeHTML(x.name) + (x.friend ? " 🤝" : "") + ' <span class="muted small">(' + x.since + "년~)</span>" : "") +
      '</td><td class="small">' + staffEffectText(r.id, x.g) + "</td></tr>";
  }).join("");
  const log = t.staffLog && t.staffLog.year === state.year ? '<p class="muted small">올해 변화: ' + t.staffLog.lines.map(escapeHTML).join(" · ") + "</p>" : "";
  const mineCard = myTeam() && myTeam().id === teamId;
  const pickInfo = mineCard ? '<p class="muted small">팀 내 입지 ' + STAFF_RULES.pickStanding + " 이상 또는 이 팀 " + STAFF_RULES.pickTenure + "시즌 이상이면 비시즌(" + STAFF_RULES.pickWeek + "주)에 감독이 코치·분석관 후보를 보여 줘요 (입지 " + STAFF_RULES.pickManagerStanding + " 이상이면 감독도). 🎫 스카우트 티켓(상점)이 있으면 후보 1명은 A급 이상." + ((state.shop && state.shop.tickets) ? " 지금 티켓 " + state.shop.tickets + "장." : "") + "</p>" : "";
  return '<div class="card"><h2>' + (title || "🧑‍💼 구단 스태프") + '</h2><table class="roster"><tr><th>자리</th><th>등급</th><th>이름</th><th>효과</th></tr>' + rows + "</table>" + log + pickInfo + "</div>";
}
// 상점: 스카우트 티켓
function staffShopCardHTML() {
  const T = STAFF_RULES.ticket;
  const have = (state.shop && state.shop.tickets) || 0;
  const can = have < 1 && state.money >= T.price;
  return '<div class="card"><h2>🎫 스태프 스카우트 티켓 <span class="muted small">한 번에 1장</span></h2>' +
    '<p class="small">비시즌 인사 추천 때 후보 1명이 A급 이상 (S급 ' + Math.round(T.sChance * 100) + "%). 추천권(팀 내 입지 " + STAFF_RULES.pickStanding + " 이상 또는 이 팀 " + STAFF_RULES.pickTenure + "시즌 이상)이 있어야 쓰여요.</p>" +
    '<p>가격 <b>' + moneyText(T.price) + "</b> · 가진 티켓 " + have + "장 " +
    '<button class="small-btn" data-staffticket="1"' + (can ? "" : " disabled") + ">사기</button></p></div>";
}
function buyStaffTicket() {
  const sh = shopState();
  const T = STAFF_RULES.ticket;
  if ((sh.tickets || 0) >= 1 || state.money < T.price) return;
  state.money -= T.price;
  sh.tickets = (sh.tickets || 0) + 1;
  shopNotice("🎫 스태프 스카우트 티켓 (" + moneyText(T.price) + ") → 다음 인사 추천 때 써요");
}

// 경기가 끝난 뒤 내 경기 줄에 분석 적중 여부 (js/matchsim.js playMatch, afterUserMatch 다음)
function scoutAfterMatch(m) {
  const t = scoutResultText(m);
  const lines = state.weekReport && state.weekReport.userLines;
  const line = lines && lines[lines.length - 1];
  if (t && line && line.matchKey === matchKey(m)) line.text += " · " + t;
}
