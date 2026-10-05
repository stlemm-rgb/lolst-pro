// ===== 리그 화면: 소속팀, 리그 순위, 대회 일정, 대시보드 경기 카드 =====

function tierName(tier) { return tier === 1 ? "1부" : "2부"; }

// 팀 이름 (내 팀이면 강조)
function teamLabel(id) {
  const mine = myTeam();
  const name = escapeHTML(teamName(id));
  return mine && mine.id === id ? '<b class="my-team">' + name + "</b>" : name;
}

// 경기 결과 한 줄 (내 팀 기준 승/패 색)
function matchRowHTML(m, showWeek) {
  const mine = myTeam();
  let result = '<span class="muted">예정</span>';
  if (m.winner) {
    const score = m.score[0] + " : " + m.score[1];
    if (mine && (m.a === mine.id || m.b === mine.id)) {
      result = '<span class="' + (m.winner === mine.id ? "up" : "down") + '">' + score + (m.winner === mine.id ? " 승" : " 패") + "</span>";
    } else {
      result = score;
    }
  }
  return (
    "<tr>" +
      (showWeek ? '<td class="muted">' + m.week + "주</td>" : "") +
      '<td class="muted">' + escapeHTML(m.label) + "</td>" +
      '<td class="r">' + teamLabel(m.a) + "</td>" +
      '<td class="c">' + result + "</td>" +
      "<td>" + teamLabel(m.b) + "</td>" +
    "</tr>"
  );
}

// ----- 대시보드 카드 -----
function leagueDashboardHTML() {
  const mine = myTeam();
  const next = nextUserMatch();
  let nextHTML = '<p class="muted">잡힌 경기가 없어요. (' + escapeHTML(scheduleOfWeek(state.week).name) + ")</p>";
  if (next) {
    const opp = next.a === mine.id ? next.b : next.a;
    nextHTML =
      "<p><b>" + next.week + "주차</b> · " + escapeHTML(next.label) + " (" + next.bo + "판 " + Math.ceil(next.bo / 2) + "선승)</p>" +
      '<p class="big-vs">' + escapeHTML(mine.name) + ' <span class="muted">vs</span> ' + escapeHTML(teamName(opp)) + "</p>" +
      '<p class="muted small">팀 전력 ' + teamStrength(mine.id).toFixed(1) + " vs " + strengthOf(opp).toFixed(1) +
        (next.week === state.week ? " · <b>이번 주 경기!</b>" : "") + "</p>";
  }
  const done = userMatches().filter(function (m) { return m.winner; }).slice(-5).reverse();
  const recent = done.length
    ? '<table class="matches">' + done.map(function (m) { return matchRowHTML(m, true); }).join("") + "</table>"
    : '<p class="muted">아직 경기를 하지 않았어요.</p>';
  return (
    '<div class="card"><h2>경기 <span class="muted small">' + escapeHTML(mine.name) + " (" + tierName(mine.tier) + ")</span></h2>" +
      '<h2 class="sub">다음 경기</h2>' + nextHTML +
      '<h2 class="sub">최근 결과</h2>' + recent +
    "</div>"
  );
}

// ----- 소속팀 -----
pages.team = function () {
  const team = myTeam();
  const s = starters(team.id);
  const starterIds = POSITION_IDS.map(function (pos) { return s[pos]; });
  const order = starterIds.concat(team.roster.filter(function (id) { return starterIds.indexOf(id) === -1; }));
  const rows = order.map(function (id) {
    const isStarter = starterIds.indexOf(id) !== -1;
    const me = id === USER_ID;
    return (
      '<tr class="' + (me ? "me" : "") + '">' +
        "<td>" + findPosition(playerPos(id)).name + "</td>" +
        "<td>" + escapeHTML(playerName(id)) + (me ? ' <span class="now-tag">나</span>' : "") + "</td>" +
        "<td>" + playerAge(id) + "세</td>" +
        '<td class="r"><b>' + playerScore(id).toFixed(1) + "</b></td>" +
        "<td>" + (isStarter ? "주전" : '<span class="muted">후보</span>') + "</td>" +
      "</tr>"
    );
  }).join("");

  const comps = team.tier === 1 ? ["cup", "split1", "split2"] : ["tier2", "tier2b"];
  const rec = standings(comps, [team.id])[0];
  const rankList = team.tier === 1 ? tier1FinalOrder() : standings(["tier2", "tier2b"], tier2Ids()).map(function (r) { return r.id; });
  const rank = rankList.indexOf(team.id) + 1;

  return (
    "<h1>소속팀</h1>" +
    '<div class="grid">' +
      '<div class="card"><h2>' + escapeHTML(team.name) + ' <span class="muted small">' + team.short + "</span></h2>" +
        "<p>" + tierName(team.tier) + " 리그 · 현재 <b>" + rank + "위</b></p>" +
        "<p>팀 전력 <b>" + teamStrength(team.id).toFixed(1) + "</b> <span class=\"muted small\">(주전 5명 스탯 점수 평균)</span></p>" +
        "<p>이번 시즌 <b>" + rec.w + "승 " + rec.l + "패</b> <span class=\"muted small\">(세트 " + rec.sw + ":" + rec.sl + ")</span></p>" +
      "</div>" +
      '<div class="card"><h2>리그 내 전력 순위</h2>' + strengthRankHTML(team.tier) + "</div>" +
    "</div>" +
    '<div class="card"><h2>선수단</h2>' +
      '<p class="muted small">주전은 포지션마다 스탯 점수가 가장 높은 선수예요. 내 선수는 항상 주전.</p>' +
      '<table class="roster"><tr><th>포지션</th><th>이름</th><th>나이</th><th class="r">스탯 점수</th><th></th></tr>' + rows + "</table>" +
    "</div>"
  );
};

function strengthRankHTML(tier) {
  const mine = myTeam();
  const list = tierTeams(tier).slice().sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); });
  return '<table class="mini">' + list.map(function (t, i) {
    return '<tr class="' + (t.id === mine.id ? "me" : "") + '"><td>' + (i + 1) + "</td><td>" + escapeHTML(t.name) + '</td><td class="r">' + teamStrength(t.id).toFixed(1) + "</td></tr>";
  }).join("") + "</table>";
}

// ----- 리그 순위 -----
let standingsTab = "tier1";

function standingsTableHTML(rows, notes) {
  const mine = myTeam();
  return (
    '<table class="standings"><tr><th>순위</th><th>팀</th><th class="r">승</th><th class="r">패</th><th class="r">세트 득실</th><th class="r">전력</th><th></th></tr>' +
    rows.map(function (r, i) {
      const diff = r.sw - r.sl;
      return (
        '<tr class="' + (mine && r.id === mine.id ? "me" : "") + '">' +
          "<td>" + (i + 1) + "</td>" +
          "<td>" + escapeHTML(teamName(r.id)) + "</td>" +
          '<td class="r">' + r.w + '</td><td class="r">' + r.l + "</td>" +
          '<td class="r">' + (diff > 0 ? "+" : "") + diff + "</td>" +
          '<td class="r muted">' + strengthOf(r.id).toFixed(1) + "</td>" +
          '<td class="muted small">' + ((notes && notes[i]) || "") + "</td>" +
        "</tr>"
      );
    }).join("") + "</table>"
  );
}

pages.standings = function () {
  const season = seasonOf();
  const tabs = [["tier1", "1부 정규 시즌"], ["cup", "1부 컵 대회"], ["tier2", "2부 리그"], ["worlds", "월드 조별 리그"]];
  const tabHTML = tabs.map(function (t) {
    return '<button data-stab="' + t[0] + '"' + (standingsTab === t[0] ? ' class="primary"' : "") + ">" + t[1] + "</button>";
  }).join("");

  let body = "";
  if (standingsTab === "tier1") {
    if (season.groups) {
      const top = standings(["split1", "split2"], season.groups.legend);
      const low = standings(["split1", "split2"], season.groups.rise);
      body = '<p class="muted small">전반기 + 후반기 합산. 후반기 상위 그룹 1~4위는 플레이오프 직행, 5위와 하위 그룹 1~3위는 플레이인. 하위 그룹 4·5위는 승강전.</p>' +
        "<h2 class=\"sub\">상위 그룹</h2>" + standingsTableHTML(top, ["플레이오프", "플레이오프", "플레이오프", "플레이오프", "플레이인"]) +
        "<h2 class=\"sub\">하위 그룹</h2>" + standingsTableHTML(low, ["플레이인", "플레이인", "플레이인", "승강전", "승강전"]);
    } else {
      body = '<p class="muted small">전반기 순위. 30주차에 상위 5팀 / 하위 5팀으로 나뉘어 후반기를 치러요.</p>' +
        standingsTableHTML(standings("split1", tier1Ids()), ["상위 그룹", "상위 그룹", "상위 그룹", "상위 그룹", "상위 그룹", "하위 그룹", "하위 그룹", "하위 그룹", "하위 그룹", "하위 그룹"]);
    }
  } else if (standingsTab === "cup") {
    body = '<p class="muted small">상위 6팀이 컵 플레이오프에 진출해요.</p>' +
      standingsTableHTML(standings("cup", tier1Ids()), ["플레이오프", "플레이오프", "플레이오프", "플레이오프", "플레이오프", "플레이오프"]);
  } else if (standingsTab === "tier2") {
    body = '<p class="muted small">전반기 + 후반기 합산. 1·2위는 승강전에 나가요.</p>' +
      standingsTableHTML(standings(["tier2", "tier2b"], tier2Ids()), ["승강전", "승강전"]);
  } else {
    if (!season.worlds) {
      body = '<p class="muted">월드 챔피언십 조 편성은 41주차에 발표돼요.</p>';
    } else {
      body = season.worlds.groups.map(function (ids, gi) {
        return '<h2 class="sub">' + "ABCD"[gi] + "조</h2>" + standingsTableHTML(standings("worlds_group", ids), ["8강", "8강"]);
      }).join("");
    }
  }
  return "<h1>리그 순위</h1>" + '<div class="card"><div class="buttons">' + tabHTML + "</div>" + body + "</div>";
};

// ----- 대회 일정 (토너먼트 결과) -----
pages.tournament = function () {
  const season = seasonOf();
  const sections = [
    ["컵 대회 플레이오프", ["cup_po"]],
    ["플레이인 · 플레이오프", ["playin", "playoffs"]],
    ["승강전", ["promotion"]],
    ["월드 챔피언십 토너먼트", ["worlds_ko"]],
  ];
  const champ = season.champions;
  const champHTML = [["cup", "컵 대회"], ["playoffs", "리그 (플레이오프)"], ["worlds", "월드 챔피언십"]].map(function (c) {
    return "<tr><td>" + c[1] + "</td><td>" + (champ[c[0]] ? "🏆 " + teamLabel(champ[c[0]]) : '<span class="muted">미정</span>') + "</td></tr>";
  }).join("");

  const body = sections.map(function (s) {
    const list = season.matches.filter(function (m) { return s[1].indexOf(m.comp) !== -1; });
    const inner = list.length
      ? '<table class="matches">' + list.map(function (m) { return matchRowHTML(m, true); }).join("") + "</table>"
      : '<p class="muted small">아직 대진이 정해지지 않았어요.</p>';
    return '<div class="card"><h2>' + s[0] + "</h2>" + inner + "</div>";
  }).join("");

  return (
    "<h1>대회 일정</h1>" +
    '<div class="card"><h2>' + state.year + '년 우승</h2><table class="mini">' + champHTML + "</table></div>" +
    body
  );
};

// 시즌 일정 화면 아래에 붙는 "우리 팀 경기" 표
function userScheduleHTML() {
  const list = userMatches().slice().sort(function (x, y) { return x.week - y.week; });
  return (
    '<div class="card"><h2>우리 팀 경기 <span class="muted small">' + escapeHTML(myTeam().name) + "</span></h2>" +
      (list.length
        ? '<table class="matches">' + list.map(function (m) { return matchRowHTML(m, true); }).join("") + "</table>"
        : '<p class="muted small">아직 잡힌 경기가 없어요. 경기 일정은 각 대회가 시작될 때 정해져요.</p>') +
    "</div>"
  );
}
