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
  const key = m.detail ? matchKey(m) : "";
  return (
    "<tr" + (key ? ' class="click" data-mdetail="' + key + '" title="눌러서 [경기 결과]에서 자세히 보기"' : "") + ">" +
      (showWeek ? '<td class="muted">' + m.week + "주</td>" : "") +
      '<td class="muted">' + escapeHTML(m.label) + "</td>" +
      '<td class="r">' + teamLabel(m.a) + "</td>" +
      '<td class="c">' + result + "</td>" +
      "<td>" + teamLabel(m.b) + "</td>" +
      '<td class="muted small">' + (m.pogName ? "POG " + escapeHTML(m.pogName) : "") + (key ? ' <span class="detail-mark">경기 결과 ▶</span>' : "") + "</td>" +
    "</tr>"
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
      '<tr class="' + (me ? "me" : "") + '">' + faceTd(id) + // 얼굴 (js/portrait.js)
        "<td>" + findPosition(playerPos(id)).name + "</td>" +
        "<td>" + escapeHTML(playerName(id)) + (me ? ' <span class="now-tag">나</span>' : "") + traitChipsMini(id) + "</td>" +
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
    "<h1>소속팀</h1>" + standingCardHTML() + // 팀 내 입지 (js/standing.js)
    '<div class="grid">' +
      '<div class="card"><h2>' + escapeHTML(team.name) + ' <span class="muted small">' + team.short + "</span></h2>" +
        "<p>" + tierName(team.tier) + " 리그 · 현재 <b>" + rank + "위</b></p>" +
        "<p>팀 전력 <b>" + teamStrength(team.id).toFixed(1) + "</b> <span class=\"muted small\">(주전 5명 스탯 점수 평균)</span></p>" +
        "<p>이번 시즌 <b>" + rec.w + "승 " + rec.l + "패</b> <span class=\"muted small\">(세트 " + rec.sw + ":" + rec.sl + ")</span></p>" +
      "</div>" +
      '<div class="card"><h2>리그 내 전력 순위</h2>' + strengthRankHTML(team.tier) + "</div>" +
    "</div>" + staffCardHTML(team.id) + // 구단 스태프 (js/staff.js)
    '<div class="card"><h2>선수단</h2>' +
      '<p class="muted small">주전은 포지션마다 스탯 점수가 가장 높은 선수예요. 내 선수는 항상 주전.</p>' +
      '<table class="roster"><tr><th></th><th>포지션</th><th>이름</th><th>나이</th><th class="r">스탯 점수</th><th></th></tr>' + rows + "</table>" +
    "</div>" + relationsCardHTML() // 선수 관계 (js/stories.js)
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
  const tabs = [["tier1", "1부 정규 시즌"], ["cup", "LCK 컵"], ["tier2", "2부 리그"], ["worlds", "월드 조별 리그"]];
  const tabHTML = tabs.map(function (t) {
    return '<button data-stab="' + t[0] + '"' + (standingsTab === t[0] ? ' class="primary"' : "") + ">" + t[1] + "</button>";
  }).join("");

  let body = "";
  if (standingsTab === "tier1") {
    if (season.groups) {
      const top = standings(["split1", "split2"], season.groups.legend);
      const low = standings(["split1", "split2"], season.groups.rise);
      const n1 = top.length + low.length;
      const tags = []; // 최종 순위별 표시 (1부 10팀: 1~4 직행·5~8 플레이인 / 8팀: 1~6 직행)
      for (let i = 0; i < n1; i++) tags.push(i >= n1 - 2 ? "승강전" : playinOn() ? (i < 4 ? "플레이오프" : "플레이인") : "플레이오프");
      body = '<p class="muted small">전반기 + 후반기 합산. ' + (playinOn() ? "최종 1~4위는 플레이오프 직행, 5~8위는 플레이인." : "1부 " + n1 + "팀이라 플레이인 없이 최종 1~6위가 플레이오프.") + " 최종 " + (n1 - 1) + "·" + n1 + "위는 승강전.</p>" +
        "<h2 class=\"sub\">상위 그룹</h2>" + standingsTableHTML(top, tags.slice(0, top.length)) +
        "<h2 class=\"sub\">하위 그룹</h2>" + standingsTableHTML(low, tags.slice(top.length));
    } else {
      body = '<p class="muted small">전반기 순위. 30주차에 상위 5팀 / 하위 5팀으로 나뉘어 후반기를 치러요.</p>' +
        standingsTableHTML(standings("split1", tier1Ids()), ["상위 그룹", "상위 그룹", "상위 그룹", "상위 그룹", "상위 그룹", "하위 그룹", "하위 그룹", "하위 그룹", "하위 그룹", "하위 그룹"]);
    }
  } else if (standingsTab === "cup") {
    body = '<p class="muted small">그룹 배틀 전체 성적 상위 6팀이 LCK 컵 플레이오프에 진출해요.</p>' +
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
  const champ = season.champions;
  const champHTML = [["cup", "LCK 컵"], ["firststand", "First Stand 🌏"], ["msi", "MSI 🌏"], ["playoffs", "리그 (플레이오프)"], ["worlds", "월드 챔피언십 🌏"]].map(function (c) {
    const off = scheduleOffReason(c[0]); // 올해 안 열리는 대회는 반투명 (js/main.js)
    return '<tr' + (off ? ' class="off"' : "") + "><td>" + c[1] + offTagHTML(off) + "</td><td>" + (champ[c[0]] ? "🏆 " + teamLabel(champ[c[0]]) : '<span class="muted">' + (off ? "-" : "미정") + "</span>") + "</td></tr>";
  }).join("");

  // 토너먼트 대회는 대진표, 승강전은 경기 목록
  const promo = season.matches.filter(function (m) { return m.comp === "promotion"; });
  const promoHTML = '<div class="card"><h2>승강전 <span class="muted small">1부 꼴찌·끝에서 2번째 vs 2부 1·2위 · 5판 3선승</span></h2>' +
    (promo.length ? '<table class="matches">' + promo.map(function (m) { return matchRowHTML(m, true); }).join("") + "</table>"
      : '<p class="muted small">아직 대진이 정해지지 않았어요. (39·40주차)</p>') + "</div>";

  // Road to MSI: 계단식이라 경기 목록으로 (js/intl.js)
  const rtm = season.matches.filter(function (m) { return m.comp === "rtmsi"; });
  const rtmOff = scheduleOffReason("rtmsi");
  const rtmHTML = '<div class="card' + (rtmOff ? " off" : "") + '"><h2>Road to MSI' + offTagHTML(rtmOff) + ' <span class="muted small">1·2라운드 상위 6팀 · 5판 3선승 · MSI 대표 2팀 결정</span></h2>' +
    (rtm.length ? '<table class="matches">' + rtm.map(function (m) { return matchRowHTML(m, true); }).join("") + "</table>" +
      (season.msiTeams ? '<p class="small">MSI 대표: 1번 시드 ' + teamLabel(season.msiTeams[0]) + " · 2번 시드 " + teamLabel(season.msiTeams[1]) + "</p>" : "")
      : '<p class="muted small">아직 대진이 정해지지 않았어요. (23·24주차)</p>') + "</div>";
  const bonus = [];
  if (season.fsBonus) bonus.push("🌏 First Stand 우승 → MSI 국내 2팀 본선 직행");
  if (season.msiBonus) bonus.push("🌏 MSI 우승 → 월드 국내 출전 " + worldsSeedCount() + "팀");

  return (
    "<h1>대회 일정</h1>" +
    '<div class="card"><h2>' + state.year + '년 우승</h2><table class="mini">' + champHTML + "</table>" +
      (bonus.length ? '<p class="small up">' + bonus.join(" · ") + "</p>" : "") + "</div>" +
    TOURNAMENT_BRACKETS.slice(0, 2).map(offBracketHTML).join("") + rtmHTML +
    TOURNAMENT_BRACKETS.slice(2).map(offBracketHTML).join("") +
    promoHTML + competitionGuideHTML() +
    '<p class="muted small">역대 우승 기록은 [역사관]에서 볼 수 있어요.</p>'
  );
};

// 올해 안 열리는 대회(First Stand·MSI)의 대진표는 반투명 + '올해 없음'
function offBracketHTML(def) {
  const off = scheduleOffReason(def.champKey);
  const html = bracketHTML(def);
  return off ? '<div class="off-wrap"><div class="off-note">' + offTagHTML(off) + "</div>" + html + "</div>" : html;
}

// ----- 토너먼트 대진표 -----
// 대회마다 라운드(열) 목록. 아직 열리지 않은 경기는 "미정" 칸으로 보여 줌
// - pick(season): 그 라운드 경기들 (보여 줄 순서대로)
// - slots(season): 아직 경기가 없을 때 칸에 미리 넣을 팀 [[팀 id 또는 null, 팀 id 또는 null], ...]
const TOURNAMENT_BRACKETS = [
  {
    title: "LCK 컵 플레이오프", sub: "그룹 배틀 전체 성적 상위 6팀 · 1·2위는 4강 직행 · 결승 5판 3선승", champKey: "cup", when: "8주차",
    seeds: function (s) { return s.cupSeeds; },
    rounds: [
      { name: "1라운드", pick: function (s) { return koMatches(s, "cup_po", "1라운드"); }, size: 2,
        slots: function (s, seeds) { return seeds ? [[seeds[2], seeds[5]], [seeds[3], seeds[4]]] : null; } },
      { name: "4강", pick: function (s) { return koMatches(s, "cup_po", "4강"); }, size: 2,
        slots: function (s, seeds) { return seeds ? [[seeds[0], null], [seeds[1], null]] : null; } },
      { name: "결승", pick: function (s) { return koMatches(s, "cup_po", "결승"); }, size: 1 },
    ],
  },
  {
    title: "First Stand 🌏", sub: "LCK 컵 우승팀 + 해외 4팀 · 조별 리그 상위 4팀 · 5판 3선승", champKey: "firststand", when: "11주차",
    seeds: function (s) { return s.fs ? s.fs.seeds || null : null; },
    rounds: [
      { name: "4강", pick: function (s) { return koMatches(s, "fs_ko", "4강"); }, size: 2,
        slots: function (s) {
          if (!s.fs) return null;
          const t = standings("fs_group", s.fs.teams).map(function (r) { return r.id; });
          return s.matches.some(function (m) { return m.comp === "fs_group" && m.winner; }) ? [[t[0], t[3]], [t[1], t[2]]] : null;
        } },
      { name: "결승", pick: function (s) { return koMatches(s, "fs_ko", "결승"); }, size: 1 },
    ],
  },
  {
    title: "MSI 🌏", sub: "국내 2팀 + 해외 8팀 · 플레이인 4팀 → 8강 · 5판 3선승", champKey: "msi", when: "24주차",
    seeds: function (s) { return s.msiTeams || null; },
    rounds: [
      { name: "플레이인", pick: function (s) { return koMatches(s, "msi_playin", ""); }, size: 2 },
      { name: "8강", pick: function (s) { return koMatches(s, "msi_ko", "8강"); }, size: 4,
        slots: function (s) { const d = s.msi && s.msi.direct; return d ? [[d[0], null], [d[2], d[4]], [d[1], null], [d[3], d[5]]] : null; } },
      { name: "4강", pick: function (s) { return koMatches(s, "msi_ko", "4강"); }, size: 2 },
      { name: "결승", pick: function (s) { return koMatches(s, "msi_ko", "결승"); }, size: 1 },
    ],
  },
  {
    title: "플레이인 · 플레이오프", sub: "1부 최종 순위 · 1~4위 직행, 5~8위 플레이인 (1부 8팀이면 1~6위 직행) · 5판 3선승", champKey: "playoffs", when: "35주차",
    seeds: function (s) { return s.seeds || s.finalOrder; },
    rounds: [
      { name: "플레이인", pick: function (s) { return koMatches(s, "playin", "").slice().reverse(); }, size: 2,
        slots: function (s) { const o = s.finalOrder; return o ? [[o[5], o[6]], [o[4], o[7]]] : null; } },
      { name: "1라운드", pick: function (s) { return koMatches(s, "playoffs", "1라운드"); }, size: 2,
        slots: function (s) { const o = s.finalOrder; return o ? [[o[2], null], [o[3], null]] : null; } },
      { name: "4강", pick: function (s) { return koMatches(s, "playoffs", "4강"); }, size: 2,
        slots: function (s) { const o = s.finalOrder; return o ? [[o[0], null], [o[1], null]] : null; } },
      { name: "결승", pick: function (s) { return koMatches(s, "playoffs", "결승"); }, size: 1 },
    ],
  },
  {
    title: "월드 챔피언십 토너먼트", sub: "조별 리그 각 조 1·2위 8팀 · 5판 3선승", champKey: "worlds", when: "44주차",
    seeds: function () { return null; },
    rounds: [
      { name: "8강", size: 4, pick: function (s) {
        const q = koMatches(s, "worlds_ko", "8강");
        return q.length === 4 ? [q[0], q[2], q[1], q[3]] : q; // 4강에서 만나는 경기끼리 붙여서
      } },
      { name: "4강", pick: function (s) { return koMatches(s, "worlds_ko", "4강"); }, size: 2 },
      { name: "결승", pick: function (s) { return koMatches(s, "worlds_ko", "결승"); }, size: 1 },
    ],
  },
];

// 대회(comp)에서 이름에 word가 들어간 경기
function koMatches(season, comp, word) {
  return season.matches.filter(function (m) { return m.comp === comp && (!word || m.label.indexOf(word) !== -1); });
}

// 대진표 칸 안의 팀 한 줄
function bracketTeamHTML(id, m, side, seeds) {
  const mine = myTeam();
  if (!id) return '<div class="bk-team tbd"><span class="bk-name">미정</span></div>';
  const won = m && m.winner === id, lost = m && m.winner && m.winner !== id;
  const seed = seeds ? seeds.indexOf(id) : -1;
  return '<div class="bk-team' + (won ? " won" : "") + (lost ? " lost" : "") + (mine && mine.id === id ? " mine" : "") + '">' +
    (seed !== -1 ? '<span class="bk-seed">' + (seed + 1) + "</span>" : "") +
    '<span class="bk-name">' + escapeHTML(teamName(id)) + "</span>" +
    '<span class="bk-score">' + (m && m.winner ? m.score[side] : "") + "</span></div>";
}

function bracketHTML(def) {
  const season = seasonOf();
  const seeds = def.seeds(season);
  const started = def.rounds.some(function (r) { return r.pick(season).length; }) || (def.rounds[0].slots && def.rounds[0].slots(season, seeds));
  if (!started) {
    return '<div class="card"><h2>' + def.title + ' <span class="muted small">' + def.sub + "</span></h2>" +
      '<p class="muted small">아직 대진이 정해지지 않았어요. (' + def.when + "에 정해져요)</p></div>";
  }
  // 1부 8팀(플레이인 없음)인 해: 플레이인 칸은 빼고 그림
  const rounds = def.rounds.filter(function (r) { return r.name !== "플레이인" || playinOn() || r.pick(season).length; });
  const cols = rounds.map(function (r) {
    const list = r.pick(season);
    const pre = r.slots ? r.slots(season, seeds) : null;
    const boxes = [];
    for (let i = 0; i < r.size; i++) {
      const m = list[i];
      if (m) {
        boxes.push('<div class="bk-match' + (m.detail ? " has-detail" : "") + '"' + (m.detail ? ' data-mdetail="' + matchKey(m) + '" title="눌러서 경기 결과 보기"' : "") + ">" +
          bracketTeamHTML(m.a, m, 0, seeds) + bracketTeamHTML(m.b, m, 1, seeds) +
          '<div class="bk-info">' + m.week + "주차 · " + m.bo + "판" + (m.winner ? "" : " · 예정") + "</div></div>");
      } else {
        const p = (pre && pre[i]) || [null, null];
        boxes.push('<div class="bk-match tbd">' + bracketTeamHTML(p[0], null, 0, seeds) + bracketTeamHTML(p[1], null, 1, seeds) + "</div>");
      }
    }
    return '<div class="bk-col"><div class="bk-round">' + r.name + '</div><div class="bk-boxes">' + boxes.join("") + "</div></div>";
  });
  const winner = season.champions[def.champKey];
  cols.push('<div class="bk-col bk-champ-col"><div class="bk-round">우승</div><div class="bk-boxes"><div class="bk-champ' + (winner ? "" : " tbd") + '">' +
    (winner ? "🏆 " + teamLabel(winner) : "🏆 ?") + "</div></div></div>");
  return (
    '<div class="card"><h2>' + def.title + ' <span class="muted small">' + def.sub + "</span></h2>" +
      '<div class="bracket">' + cols.join("") + "</div>" +
      '<p class="muted small">숫자 = 시드 · 굵은 글씨 = 이긴 팀 · 파란 테두리 = 우리 팀 · 우리 팀 경기와 결승은 눌러서 경기 결과를 볼 수 있어요.</p>' +
    "</div>"
  );
}

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
