// ===== 선수 검색 · 구단 탐색 · 이적 시장 화면 =====

// 화면에서만 쓰는 값 (저장 안 함)
const searchFilter = { q: "", pos: "", team: "", sort: "score" };
let selectedPlayer = null;
let openClubId = null;

// 선수 한 명 정보 (내 선수 포함)
function playerInfo(id) {
  if (id === USER_ID) {
    const t = myTeam();
    return { id: id, name: state.player.name, pos: state.player.position, age: state.player.age, stats: state.stats,
      teamId: t ? t.id : null, salary: state.contract ? state.contract.salary : 0, contractEnd: state.contract ? state.contract.endYear : null };
  }
  return findPlayer(id);
}

function allPlayerIds() {
  return [USER_ID].concat(Object.keys(state.league.players));
}

// ----- 선수 검색 -----
pages.search = function () {
  const q = searchFilter.q.trim().toLowerCase();
  let ids = allPlayerIds().filter(function (id) {
    const p = playerInfo(id);
    if (q && p.name.toLowerCase().indexOf(q) === -1) return false;
    if (searchFilter.pos && p.pos !== searchFilter.pos) return false;
    if (searchFilter.team === "FA" && p.teamId) return false;
    if (searchFilter.team === "T1ER" && !(p.teamId && findTeam(p.teamId).tier === 1)) return false;
    if (searchFilter.team === "T2ER" && !(p.teamId && findTeam(p.teamId).tier === 2)) return false;
    if (searchFilter.team && searchFilter.team.charAt(0) === "T" && searchFilter.team.length < 4 && p.teamId !== searchFilter.team) return false;
    return true;
  });
  const sorters = {
    score: function (a, b) { return playerScore(b) - playerScore(a); },
    age: function (a, b) { return playerInfo(a).age - playerInfo(b).age; },
    salary: function (a, b) { return (playerInfo(b).salary || 0) - (playerInfo(a).salary || 0); },
    name: function (a, b) { return playerInfo(a).name.localeCompare(playerInfo(b).name); },
  };
  ids.sort(sorters[searchFilter.sort]);
  const total = ids.length;
  ids = ids.slice(0, 80);

  const posOpts = '<option value="">전체 포지션</option>' + POSITIONS.map(function (p) {
    return '<option value="' + p.id + '"' + (searchFilter.pos === p.id ? " selected" : "") + ">" + p.name + "</option>";
  }).join("");
  const teamOpts = [["", "전체 선수"], ["T1ER", "1부 리그"], ["T2ER", "2부 리그"], ["FA", "FA (소속 없음)"]].map(function (o) {
    return '<option value="' + o[0] + '"' + (searchFilter.team === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
  }).join("") + state.league.teams.map(function (t) {
    return '<option value="' + t.id + '"' + (searchFilter.team === t.id ? " selected" : "") + ">" + escapeHTML(t.name) + "</option>";
  }).join("");
  const sortOpts = [["score", "스탯 점수 높은 순"], ["age", "나이 어린 순"], ["salary", "연봉 높은 순"], ["name", "이름순"]].map(function (o) {
    return '<option value="' + o[0] + '"' + (searchFilter.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
  }).join("");

  const rows = ids.map(function (id) {
    const p = playerInfo(id);
    const team = p.teamId ? findTeam(p.teamId) : null;
    return (
      '<tr class="click' + (id === USER_ID ? " me" : "") + (selectedPlayer === id ? " sel" : "") + '" data-player="' + id + '">' +
        "<td>" + escapeHTML(p.name) + (id !== USER_ID && findPlayer(id) && findPlayer(id).named ? ' <span title="네임드 선수">⭐</span>' : "") +
          (id !== USER_ID && findPlayer(id) && findPlayer(id).bigRookie ? ' <span title="' + findPlayer(id).bigRookie + '년 대형 신인">🌟</span>' : "") + "</td>" +
        "<td>" + findPosition(p.pos).name + "</td>" +
        "<td>" + (team ? escapeHTML(team.name) + ' <span class="muted small">' + tierName(team.tier) + "</span>" : '<span class="muted">FA</span>') + "</td>" +
        '<td class="small">' + topChampList(id, 2).map(function (c) { return escapeHTML(c.name) + ' <span class="muted">' + c.v + "</span>"; }).join(" · ") + "</td>" +
        '<td class="r">' + p.age + "</td>" +
        '<td class="r"><b>' + playerScore(id).toFixed(1) + "</b></td>" +
        '<td class="r">' + (p.salary ? moneyText(p.salary) : "-") + "</td>" +
        '<td class="r">' + (p.teamId && p.contractEnd ? p.contractEnd + "년" : "-") + "</td>" +
      "</tr>"
    );
  }).join("");

  return (
    "<h1>선수 검색</h1>" +
    '<div class="card">' +
      '<div class="filters">' +
        '<input type="text" id="s-q" placeholder="이름 검색 (Enter)" value="' + escapeHTML(searchFilter.q) + '">' +
        '<select id="s-pos">' + posOpts + "</select>" +
        '<select id="s-team">' + teamOpts + "</select>" +
        '<select id="s-sort">' + sortOpts + "</select>" +
      "</div>" +
      '<p class="muted small">' + total + "명" + (total > 80 ? " 중 80명 표시" : "") + " · 줄을 누르면 상세 스탯이 나와요.</p>" +
      (selectedPlayer && (selectedPlayer === USER_ID || findPlayer(selectedPlayer)) ? playerDetailHTML(selectedPlayer) : "") +
      '<table class="roster"><tr><th>이름</th><th>포지션</th><th>소속</th><th>주력 챔피언</th><th class="r">나이</th><th class="r">스탯 점수</th><th class="r">연봉</th><th class="r">계약 만료</th></tr>' + rows + "</table>" +
    "</div>"
  );
};

function playerDetailHTML(id) {
  const p = playerInfo(id);
  const bonus = findPosition(p.pos).bonus;
  const bars = STATS.map(function (s) {
    const cap = statCapOf(traitsOf(id), s.id);
    return barHTML(s.name, p.stats[s.id], s.desc + (cap < 100 ? " (상한선 " + cap + ")" : ""), bonus.indexOf(s.id) !== -1, cap);
  }).join("");
  const team = p.teamId ? findTeam(p.teamId) : null;
  const traits = traitsOf(id);
  return (
    '<div class="card detail">' +
      "<h2>" + escapeHTML(p.name) + ' <span class="muted small">' + findPosition(p.pos).name + " · " + p.age + "세 · " +
        (team ? escapeHTML(team.name) : "FA") + '</span> <span class="detail-score">스탯 점수 <b>' + playerScore(id).toFixed(1) + "</b></span></h2>" +
      posScoresHTML(id, p) +
      '<div class="chips">' + styleChipHTML(id) + (traits.length ? traits.map(traitChipHTML).join("") : '<span class="muted small">특성 없음</span>') + "</div>" +
      strengthLineHTML(p) +
      champLineHTML(id) +
      '<div class="stat-columns">' + bars + "</div>" +
    "</div>"
  );
}

// 강점·약점: 가장 높은 스탯 3개 / 가장 낮은 스탯 2개
function strengthLineHTML(p) {
  const list = STATS.map(function (s) { return { name: s.name, v: p.stats[s.id] }; }).sort(function (a, b) { return b.v - a.v; });
  const fmtS = function (x) { return x.name + " " + x.v; };
  return '<p class="small strength-line">💪 강점: <span class="up">' + list.slice(0, 3).map(fmtS).join(" · ") + '</span> &nbsp; 🩹 약점: <span class="down">' + list.slice(-2).reverse().map(fmtS).join(" · ") + "</span></p>";
}

// 포지션별 점수: 그 포지션 가산점 스탯(★)을 1.5배로 쳤을 때의 스탯 점수 (지금 포지션은 굵게)
function posScoresHTML(id, p) {
  const best = POSITION_IDS.slice().sort(function (a, b) { return statScoreFor(p.stats, b) - statScoreFor(p.stats, a); })[0];
  const parts = POSITION_IDS.map(function (pos) {
    const v = statScoreFor(p.stats, pos).toFixed(1);
    const name = findPosition(pos).name;
    return pos === p.pos ? '<b class="pos-now">' + name + " " + v + "</b>" : name + " " + v + (pos === best ? ' <span class="up small">▲최고</span>' : "");
  });
  return '<p class="small pos-scores"><span class="tip" tabindex="0" data-tip="포지션마다 가산점 스탯(★)이 달라서, 같은 스탯이라도 포지션에 따라 점수가 달라요. 굵은 글씨 = 지금 포지션">📐 포지션별 점수</span>: ' + parts.join(" · ") + "</p>";
}

// 주력 챔피언(숙련도 상위 3) + 이번 패치 메타 챔피언 평균 숙련도 (js/npc_mastery.js)
function champLineHTML(id) {
  const champs = topChampsHTML(id, 3);
  if (!champs) return "";
  const p = id === USER_ID ? null : findPlayer(id);
  const avg = id === USER_ID ? metaPenaltyInfo().avg : p && p.mastery ? npcMetaAvg(p) : null;
  return '<p class="small champ-line">⚔️ 주력 챔피언: ' + champs +
    (avg !== null ? ' <span class="muted">· 이번 메타 평균 숙련도 ' + Math.round(avg) + "</span>" : "") + "</p>";
}

// ----- 구단 탐색 -----
pages.clubs = function () {
  const mine = myTeam();
  const cards = [1, 2].map(function (tier) {
    const list = tierTeams(tier).slice().sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); });
    return '<h2 class="sub">' + tierName(tier) + " 리그</h2>" + list.map(function (t, i) {
      const s = starters(t.id);
      const lineup = POSITION_IDS.map(function (pos) {
        return s[pos] ? findPosition(pos).name + " " + escapeHTML(playerName(s[pos])) : "";
      }).join(" · ");
      const open = openClubId === t.id;
      return (
        '<div class="club' + (t.id === mine.id ? " mine" : "") + '">' +
          '<div class="club-head" data-club="' + t.id + '">' +
            '<span class="club-rank">' + (i + 1) + "</span>" +
            '<span class="club-name">' + escapeHTML(t.name) + (t.id === mine.id ? ' <span class="now-tag">내 팀</span>' : "") + "</span>" +
            '<span class="muted small">전력 <b>' + teamStrength(t.id).toFixed(1) + "</b> · 연봉 " + moneyText(teamPayroll(t.id)) + " / 예산 " + moneyText(CONTRACT.teamBudget[t.tier]) + " · " + clubMoneyText(t.id) + "</span>" +
          "</div>" +
          '<div class="muted small club-lineup">' + lineup + "</div>" +
          (clubIncomeText(t.id) ? '<div class="muted small club-lineup">💰 ' + clubIncomeText(t.id) + "</div>" : "") +
          (open ? clubRosterHTML(t.id) : "") +
        "</div>"
      );
    }).join("");
  }).join("");
  return "<h1>구단 탐색</h1>" + '<div class="card"><p class="muted small">구단을 누르면 선수단이 나와요. 순서는 리그 안 전력 순위예요.</p>' + cards + "</div>";
};

function clubRosterHTML(teamId) {
  const s = starters(teamId);
  const starterIds = POSITION_IDS.map(function (pos) { return s[pos]; });
  const team = findTeam(teamId);
  const rows = team.roster.slice().sort(function (a, b) {
    return (starterIds.indexOf(b) !== -1) - (starterIds.indexOf(a) !== -1) || POSITION_IDS.indexOf(playerPos(a)) - POSITION_IDS.indexOf(playerPos(b));
  }).map(function (id) {
    const p = playerInfo(id);
    const mainText = topChampList(id, 2).map(function (c) { return escapeHTML(c.name); }).join(" · ");
    return '<tr class="' + (id === USER_ID ? "me" : "") + '"><td>' + findPosition(p.pos).name + "</td><td>" + escapeHTML(p.name) + (id === USER_ID ? "" : " " + styleIconHTML(id)) + traitChipsMini(id) +
      (mainText ? ' <span class="muted small">⚔️ ' + mainText + "</span>" : "") + "</td><td>" + p.age + '세</td><td class="r"><b>' +
      playerScore(id).toFixed(1) + '</b></td><td class="r">' + moneyText(p.salary || 0) + "</td><td>" + (starterIds.indexOf(id) !== -1 ? "주전" : '<span class="muted">후보</span>') + "</td></tr>";
  }).join("");
  return '<table class="roster club-roster">' + rows + "</table>";
}

// ----- 이적 시장 -----
pages.transfer = function () {
  const c = state.contract;
  const team = myTeam();
  const open = isAnyTransferWindow();
  const summer = isSummerWindow();
  const role = state.benched ? '<span class="down">후보 (2군)</span>' : '<span class="up">주전</span>';
  const guaranteeText = c.guarantee
    ? "시즌 " + c.guarantee + "경기 (" + Math.min(state.career.seasonGames, c.guarantee) + "/" + c.guarantee + (state.career.seasonGames >= c.guarantee ? " 달성" : "") + ")"
    : "없음";

  const contractCard =
    '<div class="card"><h2>내 계약</h2>' +
      '<table class="mini">' +
        "<tr><td>소속</td><td><b>" + escapeHTML(team.name) + "</b> (" + tierName(team.tier) + ") · " + role + "</td></tr>" +
        "<tr><td>연봉</td><td>" + moneyText(c.salary) + ' <span class="muted small">(매주 ' + moneyText(Math.round(c.salary / CREATION.weeksPerSeason)) + ")</span></td></tr>" +
        "<tr><td>계약 만료</td><td>" + c.endYear + "년 시즌 종료" + (c.endYear <= state.year ? ' <span class="down">(이번 시즌)</span>' : "") + "</td></tr>" +
        "<tr><td>출전 보장</td><td>" + guaranteeText + "</td></tr>" +
        "<tr><td>이번 시즌 출전</td><td>" + state.career.seasonGames + "경기</td></tr>" +
        "<tr><td>지금 기준 예상 연봉</td><td>" + moneyText(userSalaryFor(team.tier)) + ' <span class="muted small">(재계약·제안 때 기준, 시즌 성적에 따라 바뀜)</span>' +
          '<div class="salary-breakdown muted small">' + escapeHTML(salaryBreakdownText(salaryBreakdown(team.tier), 0)) + "</div></td></tr>" +
      "</table>" +
      (state.pendingMove ? '<div class="notice">' + (state.pendingMove.loan ? "임대 확정" : "이적 확정") + ": " + (state.pendingMove.summer ? "후반기(" + SUMMER_MARKET.applyWeek + "주)부터" : "새 시즌부터") + " <b>" + escapeHTML(findTeam(state.pendingMove.teamId).name) + "</b> (연봉 " + moneyText(state.pendingMove.salary) + ", " + state.pendingMove.endYear + "년까지)</div>" : "") +
      (state.loan ? '<div class="notice">🤝 임대 중: 이번 시즌이 끝나면 <b>' + escapeHTML(findTeam(state.loan.from) ? findTeam(state.loan.from).name : "원래 팀") + "</b>(으)로 돌아가요.</div>" : "") +
    "</div>";

  const offers = state.inbox.filter(function (m) { return m.kind === "offer" && m.answered === null; });
  const offerCard =
    '<div class="card"><h2>받은 제안</h2>' +
      (offers.length
        ? offers.map(function (m) { return "<p>📩 " + escapeHTML(m.title) + "</p>"; }).join("") + '<button class="primary" data-go-sns="1">SNS에서 답하기</button>'
        : '<p class="muted">' + (open ? "답하지 않은 제안이 없어요." : "제안은 여름(" + SUMMER_MARKET.start + "주차, 0~1개)과 비시즌(" + CONTRACT.windowStart + "주차)에 SNS로 와요.") + "</p>") +
    "</div>";

  // 이적 요청 보낼 수 있는 구단
  const me = playerScore(USER_ID);
  const rows = state.league.teams.filter(function (t) { return t.id !== team.id; })
    .sort(function (a, b) { return (a.tier - b.tier) || (teamStrength(b.id) - teamStrength(a.id)); })
    .map(function (t) {
      const st = starterAt(t.id, state.player.position);
      const stScore = st ? playerScore(st) : 0;
      const why = canRequestTransfer(t.id);
      return (
        "<tr><td>" + escapeHTML(t.name) + ' <span class="muted small">' + tierName(t.tier) + "</span></td>" +
          '<td class="r">' + teamStrength(t.id).toFixed(1) + "</td>" +
          "<td>" + (st ? escapeHTML(playerName(st)) : "-") + "</td>" +
          '<td class="r ' + (me >= stScore ? "up" : "down") + '">' + stScore.toFixed(1) + "</td>" +
          '<td class="r">' + moneyText(Math.max(0, teamBudgetLeft(t.id))) + "</td>" +
          '<td><button data-request="' + t.id + '"' + (why ? " disabled" : "") + ">이적 요청</button></td></tr>"
      );
    }).join("");
  const requestCard =
    '<div class="card"><h2>이적 요청 보내기 <span class="muted small">' +
      (open ? "남은 횟수 " + state.transferRequestsLeft + "회" + (summer ? " · 여름엔 원래 팀에 이적료 " + moneyText(transferFee(USER_ID)) : "") : "여름(" + SUMMER_MARKET.start + "~" + SUMMER_MARKET.end + "주)·비시즌(" + CONTRACT.windowStart + "~" + CONTRACT.windowEnd + "주)에만 가능") + "</span></h2>" +
      '<p class="muted small">그 팀 ' + findPosition(state.player.position).name + " 주전보다 내 스탯 점수(" + me.toFixed(1) + ")가 높고 예산이 되면 받아줘요. 초록색 = 내가 더 높음.</p>" +
      '<table class="roster"><tr><th>구단</th><th class="r">전력</th><th>같은 포지션 주전</th><th class="r">스탯 점수</th><th class="r">남은 예산</th><th></th></tr>' + rows + "</table>" +
    "</div>";

  const fa = state.league.freeAgents.slice().sort(function (a, b) { return playerScore(b) - playerScore(a); }).slice(0, 15);
  const faCard =
    '<div class="card"><h2>FA 선수 (상위 15명)</h2>' +
      (fa.length ? '<table class="roster"><tr><th>이름</th><th>포지션</th><th class="r">나이</th><th class="r">스탯 점수</th></tr>' +
        fa.map(function (id) {
          const p = findPlayer(id);
          return "<tr><td>" + escapeHTML(p.name) + "</td><td>" + findPosition(p.pos).name + '</td><td class="r">' + p.age + '</td><td class="r">' + playerScore(id).toFixed(1) + "</td></tr>";
        }).join("") + "</table>" : '<p class="muted">FA 선수가 없어요.</p>') +
    "</div>";

  return (
    "<h1>이적 시장</h1>" +
    '<div class="notice">' + (summer ? "☀️ 여름 이적·임대 기간이에요 (" + SUMMER_MARKET.end + "주차까지). 정해진 이적은 후반기(" + SUMMER_MARKET.applyWeek + "주)에 반영돼요. 하위권 팀들이 1명씩 보강해요."
      : open ? "🔓 이적 시장이 열려 있어요 (" + CONTRACT.windowEnd + "주차까지). 정해진 이적은 새 시즌에 반영돼요."
      : "🔒 지금은 이적할 수 없어요. 여름 이적 기간은 " + SUMMER_MARKET.start + "~" + SUMMER_MARKET.end + "주, 비시즌 이적 시장은 " + CONTRACT.windowStart + "주차에 열려요.") + "</div>" +
    '<div class="grid">' + contractCard + offerCard + "</div>" + requestCard + faCard
  );
};

// 대시보드용 계약 한 줄
function contractSummaryHTML() {
  const c = state.contract;
  if (!c) return "";
  return '<p class="muted small">' + (state.benched ? '<span class="down">후보 (2군)</span>' : '<span class="up">주전</span>') +
    " · 연봉 " + moneyText(c.salary) + " · 계약 " + c.endYear + "년까지" + (c.guarantee ? " · 출전 보장 " + c.guarantee + "경기" : "") + "</p>";
}

// ----- 버튼 연결 -----
function bindMarket(page) {
  const q = document.getElementById("s-q");
  if (q) {
    q.onkeydown = function (e) { if (e.key === "Enter") { searchFilter.q = q.value; renderPage(); } };
    q.onchange = function () { searchFilter.q = q.value; renderPage(); };
    ["pos", "team", "sort"].forEach(function (k) {
      document.getElementById("s-" + k).onchange = function () { searchFilter[k] = this.value; renderPage(); };
    });
  }
  page.querySelectorAll("[data-player]").forEach(function (tr) {
    tr.onclick = function () {
      const id = tr.getAttribute("data-player");
      selectedPlayer = selectedPlayer === id ? null : id;
      renderPage();
    };
  });
  page.querySelectorAll("[data-club]").forEach(function (el) {
    el.onclick = function () {
      const id = el.getAttribute("data-club");
      openClubId = openClubId === id ? null : id;
      renderPage();
    };
  });
  page.querySelectorAll("[data-request]").forEach(function (btn) {
    btn.onclick = function () {
      const t = findTeam(btn.getAttribute("data-request"));
      if (!confirm(t.name + "에 이적을 요청할까요? (남은 횟수 " + state.transferRequestsLeft + "회)")) return;
      requestTransfer(t.id);
      if (state.settings.autoSave) saveGame();
      renderAll();
    };
  });
  const go = page.querySelector("[data-go-sns]");
  if (go) go.onclick = function () { snsTab = "inbox"; selectMenu("sns"); };
}
