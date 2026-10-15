// ===== 기록 화면: 선수 정보 기록(위쪽), 개인 시상, 대회 일정(아래쪽) =====

// ----- 선수 정보(예전 나의 커리어): 요약·시즌별 기록·능력 변화 -----

// [선수 정보] 탭마다 나눠 쓰기: summary 커리어 요약 / season 시즌별 기록 / growth 능력 변화
function careerRecordParts() {
  ensureCareerRecords();
  const c = state.career;
  const now = currentSeasonRecord();
  const rows = c.seasons.concat([now]);

  // 통산
  let sets = 0, setWins = 0, ratingSum = 0, solo = 0, pog = 0, series = 0, seriesWins = 0;
  const titles = [];
  rows.forEach(function (r) {
    sets += r.sets; setWins += r.setWins; ratingSum += r.rating * r.sets; solo += r.solo; pog += r.pog;
    series += r.series; seriesWins += r.seriesWins;
    r.titles.forEach(function (t) { titles.push(r.year + " " + t); });
  });
  const years = state.year - c.debut.year + 1;
  const awardChips = (c.awards || []).map(function (a) { return '<span class="chip good">' + a.year + " " + escapeHTML(a.title) + "</span>"; }).join("") || '<span class="muted">아직 없음</span>';
  const titleChips = titles.map(function (t) { return '<span class="chip meta">🏆 ' + escapeHTML(t) + "</span>"; }).join("") || '<span class="muted">아직 없음</span>';

  const summary =
    '<div class="card"><h2>커리어 요약</h2>' +
      '<div class="summary-row">' +
        '<div><div class="sum-label">데뷔</div><div class="sum-main">' + c.debut.year + "년</div>" +
          '<div class="sum-sub muted">' + escapeHTML(c.debut.team) + " · " + c.debut.age + "세 · 종합 " + c.debut.score.toFixed(1) + "</div></div>" +
        '<div><div class="sum-label">프로 경력</div><div class="sum-main">' + years + "년차</div>" +
          '<div class="sum-sub muted">통산 ' + series + "경기 " + seriesWins + "승 " + (series - seriesWins) + "패" +
          (series ? " (" + Math.round(seriesWins / series * 100) + "%)" : "") + "</div></div>" +
        '<div><div class="sum-label">통산 평점</div><div class="sum-main">' + (sets ? (ratingSum / sets).toFixed(2) : "-") + "</div>" +
          '<div class="sum-sub muted">' + sets + "세트 · POG " + pog + "회 · 솔로킬 " + solo + "회</div></div>" +
      "</div>" +
      '<h2 class="sub">우승</h2><div class="chips">' + titleChips + "</div>" +
      '<h2 class="sub">수상</h2><div class="chips">' + awardChips + "</div>" +
    "</div>";

  // 시즌별 기록
  const seasonRows = rows.slice().reverse().map(function (r, i) {
    const live = i === 0;
    return (
      '<tr class="' + (live ? "me" : "") + '">' +
        "<td>" + r.year + (live ? ' <span class="now-tag">진행 중</span>' : "") + "</td>" +
        "<td>" + escapeHTML(r.team) + ' <span class="muted small">' + tierName(r.tier) + "</span></td>" +
        '<td class="r">' + r.rank + "위</td>" +
        '<td class="r">' + r.seriesWins + "-" + (r.series - r.seriesWins) + "</td>" +
        '<td class="r">' + (r.sets ? r.rating.toFixed(2) : "-") + "</td>" +
        '<td class="r">' + r.pog + "</td>" +
        '<td class="r">' + r.solo + "</td>" +
        '<td class="r"><b>' + r.score.toFixed(1) + "</b></td>" +
        '<td class="small">' + r.titles.concat(r.awards).map(escapeHTML).join(", ") + "</td>" +
      "</tr>"
    );
  }).join("");
  const seasonCard =
    '<div class="card"><h2>시즌별 기록</h2>' +
      '<table class="roster"><tr><th>시즌</th><th>소속</th><th class="r">팀 순위</th><th class="r">경기 승-패</th><th class="r">평점</th><th class="r">POG</th><th class="r">솔로킬</th><th class="r">종합 능력</th><th>우승·수상</th></tr>' +
      seasonRows + "</table>" +
      '<p class="muted small">팀 순위는 정규 시즌 기준, 평점은 세트 평균 (1~10). 종합 능력은 시즌이 끝날 때 값이에요.</p>' +
    "</div>";

  // 능력 변화: 시즌별 종합 능력 막대 + 데뷔 대비 스탯 변화
  const maxScore = 100;
  const bars = [{ label: "데뷔", score: c.debut.score }].concat(rows.map(function (r) { return { label: String(r.year), score: r.score }; }))
    .map(function (b) {
      return '<div class="stat"><div class="stat-label">' + b.label + '</div><div class="bar"><div class="bar-fill" style="width:' + (b.score / maxScore * 100) + '%"></div></div><div class="stat-value">' + b.score.toFixed(1) + "</div></div>";
    }).join("");
  const statRows = STATS.map(function (s) {
    const from = c.statStart[s.id], to = state.stats[s.id];
    const d = to - from;
    return "<tr><td>" + s.name + '</td><td class="r">' + from + '</td><td class="r"><b>' + to + '</b></td><td class="r ' + (d > 0 ? "up" : d < 0 ? "down" : "") + '">' + (d > 0 ? "+" : "") + d + "</td></tr>";
  }).join("");
  const growthCard =
    '<div class="grid">' +
      '<div class="card"><h2>종합 능력 변화</h2>' + bars + "</div>" +
      '<div class="card"><h2>스탯 변화 <span class="muted small">데뷔 → 지금</span></h2><table class="mini">' + statRows + "</table></div>" +
    "</div>";

  return { summary: summary, season: seasonCard, growth: growthCard, scoreBars: bars };
}

// ----- 개인 시상 -----
let awardsTier = 1;

pages.awards = function () {
  const stats = state.league.season.playerStats || {};
  const ids = Object.keys(stats).filter(function (id) {
    const st = stats[id];
    const t = st.team && findTeam(st.team);
    return t && t.tier === awardsTier && (id === USER_ID || findPlayer(id));
  });
  const race = function (title, list, valueFn, fmt, note) {
    const rows = list.slice(0, 5).map(function (id, i) {
      return '<tr class="' + (id === USER_ID ? "me" : "") + '"><td>' + rankBadgeHTML(i + 1) + "</td>" + faceTd(id) + "<td>" + escapeHTML(playerName(id)) +
        ' <span class="muted small">' + findPosition(playerPos(id)).name + " · " + escapeHTML(teamName(stats[id].team)) + '</span></td><td class="r"><b>' + fmt(valueFn(id)) + "</b></td></tr>";
    }).join("");
    return '<div class="card"><h2>' + title + ' <span class="muted small">' + note + "</span></h2>" +
      (rows ? '<table class="mini">' + rows + "</table>" : emptyBoxHTML("🌱", "아직 기록이 없어요.")) + "</div>";
  };
  const minMvp = RECORDS.minSets.mvp;
  const mvpList = ids.filter(function (id) { return stats[id].rg >= minMvp; }).sort(function (a, b) { return mvpScore(b) - mvpScore(a); });
  const pogList = ids.slice().sort(function (a, b) { return stats[b].pog - stats[a].pog; }).filter(function (id) { return stats[id].pog > 0; });
  const soloList = ids.slice().sort(function (a, b) { return stats[b].solo - stats[a].solo; }).filter(function (id) { return stats[id].solo > 0; });
  const rookieList = ids.filter(function (id) { return stats[id].rg >= RECORDS.minSets.rookie && isRookieEligible(id); })
    .sort(function (a, b) { return avgRating(b, true) - avgRating(a, true); });

  const myStats = stats[USER_ID];
  const myLine = myStats
    ? "내 기록: 정규 시즌 평점 " + (myStats.rg ? (myStats.rr / myStats.rg).toFixed(2) : "-") + " (" + myStats.rg + "세트) · POG " + myStats.pog + " · 솔로킬 " + myStats.solo
    : "이번 시즌 아직 경기 기록이 없어요.";

  const tabs = [1, 2].map(function (t) {
    return '<button data-atier="' + t + '"' + (awardsTier === t ? ' class="primary"' : "") + ">" + tierName(t) + " 리그</button>";
  }).join("");

  // 역대 수상
  const all = (state.league.awards || []).slice().reverse();
  const byYear = {};
  all.forEach(function (a) { (byYear[a.year] = byYear[a.year] || []).push(a); });
  // 디자인 D5: 큰 상(월드·MSI 결승 MVP, 정규 시즌 MVP)은 금색 넓은 카드, 올프로는 얼굴 5명 한 줄
  const BIG_AWARDS = ["worldsfmvp", "msifmvp", "mvp"];
  const face = function (a, size) { const tid = teamIdByName(a.team); return portraitHTMLFrom(lookOf(a.id), tid ? uniformOfTeam(tid) : FREE_AGENT_UNIFORM, { face: true, size: size }); };
  const history = Object.keys(byYear).sort(function (a, b) { return b - a; }).map(function (y) {
    const list = byYear[y];
    const allpro = list.filter(function (a) { return a.key === "allpro"; }).sort(function (a, b) { return POSITION_IDS.indexOf(a.pos) - POSITION_IDS.indexOf(b.pos); });
    const others = list.filter(function (a) { return a.key !== "allpro"; }).sort(function (a, b) {
      const ia = BIG_AWARDS.indexOf(a.key), ib = BIG_AWARDS.indexOf(b.key);
      return (ia === -1 ? 9 : ia) - (ib === -1 ? 9 : ib);
    });
    const cards = others.map(function (a) {
      const big = BIG_AWARDS.indexOf(a.key) !== -1;
      const tid = teamIdByName(a.team);
      return '<div class="aw' + (big ? " big" : "") + (a.id === USER_ID ? " me" : "") + '">' + face(a, big ? 54 : 40) +
        '<div><div class="aw-t">' + (big ? "🏆 " : "") + escapeHTML(a.title) + "</div><b>" + escapeHTML(a.name) + ' <small class="muted">' + findPosition(a.pos).name + "</small></b>" +
        '<div class="small">' + (tid ? teamMarkHTML(tid, escapeHTML(a.team)) : '<span class="muted">' + escapeHTML(a.team) + "</span>") + (a.value ? ' <span class="aw-v">평점 ' + a.value.toFixed(2) + "</span>" : "") + "</div></div></div>";
    }).join("");
    const ap = allpro.length ? '<div class="aw-sub">⭐ 올프로 퍼스트 팀</div><div class="allpro">' + allpro.map(function (a) {
      return '<div class="ap' + (a.id === USER_ID ? " me" : "") + '">' + face(a, 44) + "<b>" + escapeHTML(a.name) + "</b><small>" + findPosition(a.pos).name + (a.value ? " · " + a.value.toFixed(2) : "") + "</small></div>";
    }).join("") + "</div>" : "";
    return '<h2 class="sub">' + y + '년</h2><div class="awards">' + cards + "</div>" + ap;
  }).join("") || emptyBoxHTML("🏅", "아직 시상 기록이 없어요. 정규 시즌 상은 리그 결승(38주차)이 끝나면 발표돼요.");

  return (
    "<h1>개인 시상</h1>" +
    '<div class="card"><div class="buttons">' + tabs + '</div><p class="muted small">' + state.year + " 시즌 레이스 · " + myLine + "</p></div>" +
    '<div class="grid">' +
      race("MVP 레이스", mvpList, function (id) { return mvpScore(id); }, function (v) { return v.toFixed(2); }, "평균 평점 + POG×" + RECORDS.pogWeight + ", 정규 시즌 " + minMvp + "세트 이상") +
      race("POG 순위", pogList, function (id) { return stats[id].pog; }, function (v) { return v + "회"; }, "모든 대회") +
      race("솔로킬 순위", soloList, function (id) { return stats[id].solo; }, function (v) { return v + "회"; }, "모든 대회") +
      race("신인왕 레이스", rookieList, function (id) { return avgRating(id, true); }, function (v) { return v.toFixed(2); }, RECORDS.rookieMaxAge + "세 이하") +
    "</div>" +
    '<div class="card"><h2>역대 수상</h2>' + history + "</div>"
  );
};

// ----- 대회 일정: 대회 안내와 역대 우승 -----
function competitionGuideHTML() {
  const rows = COMPETITION_GUIDE.map(function (c) {
    const id = { "First Stand": "first_stand", "Road to MSI": "road_to_msi", "MSI": "msi", "플레이인": "playin" }[c.name];
    const off = id ? scheduleOffReason(id) : ""; // 올해 안 열리면 반투명 (js/main.js)
    return "<tr" + (off ? ' class="off"' : "") + "><td><b>" + c.name + "</b>" + (off ? offTagHTML(off) : "") + '</td><td class="muted">' + c.weeks + "</td><td>" + c.who + '</td><td class="muted small">' + c.how + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>대회 안내</h2><table class="roster"><tr><th>대회</th><th>주차</th><th>참가</th><th>방식·진출 조건</th></tr>' + rows + "</table></div>";
}

function championsHistoryHTML() {
  const list = (state.league.history || []).slice().reverse();
  if (!list.length) return '<div class="card"><h2>역대 우승</h2><p class="muted">첫 시즌이 끝나면 기록돼요.</p></div>';
  const rows = list.map(function (h) {
    const c = h.champions || {};
    const mark = function (name) { return name ? (name === h.myTeam ? '<b class="my-team">' + escapeHTML(name) + "</b>" : escapeHTML(name)) : "-"; };
    return "<tr><td>" + h.year + "</td><td>" + mark(c.cup) + "</td><td>" + mark(c.firststand) + "</td><td>" + mark(c.msi) + "</td><td>" + mark(c.playoffs) + "</td><td>" + mark(c.worlds) + '</td><td class="muted small">' + escapeHTML(h.myTeam) + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>역대 우승</h2><table class="roster"><tr><th>시즌</th><th>LCK 컵</th><th>First Stand</th><th>MSI</th><th>리그</th><th>월드</th><th>내 소속</th></tr>' + rows + "</table></div>";
}

// 버튼 연결 (main.js renderPage에서 부름)
function bindRecords(page) {
  page.querySelectorAll("[data-atier]").forEach(function (btn) {
    btn.onclick = function () { awardsTier = Number(btn.getAttribute("data-atier")); renderPage(); };
  });
}
