// ===== js/history_pages.js — 역사관·리그 생태계·트로피 진열장 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 js/history_pages.js) ━━━━━
// ===== 역사관 · 리그 생태계 화면 =====
// 은퇴한 다른 선수 기록: state.league.retirees = [{ year, name, pos, age, team, awards: [상 이름], score }]

// 다른 선수(NPC)가 은퇴할 때 부름 (js/league.js retirePlayer). 상을 받았거나 잘했던 선수만 기록
function recordRetiree(p, team) {
  const awards = (state.league.awards || []).filter(function (a) { return a.id === p.id; }).map(function (a) { return a.year + " " + a.title; });
  const score = statScoreFor(p.stats, p.pos);
  if (!awards.length && score < 72) return;
  if (!state.league.retirees) state.league.retirees = [];
  state.league.retirees.push({
    year: state.year, name: p.name, pos: p.pos, age: p.age,
    team: team ? team.name : "FA", awards: awards, score: Math.round(score * 10) / 10,
  });
  state.league.retirees = state.league.retirees.slice(-60);
}

// ----- 역사관 -----
pages.history = function () {
  ensureCareerRecords();
  const c = state.career;

  // 내 커리어 주요 순간 (데뷔 + 기록된 순간, 최신이 위)
  const moments = [{ year: c.debut.year, week: 1, icon: "🎮", text: c.debut.team + "에서 데뷔 (" + c.debut.age + "세)" }].concat(c.moments || []);
  const timeline = moments.slice().reverse().map(function (m) {
    return '<div class="moment"><span class="moment-when muted small">' + m.year + "년 " + m.week + "주</span> " + m.icon + " " + escapeHTML(m.text) + "</div>";
  }).join("");
  const plan = state.retirePlanned ? '<p class="notice-inline">이번 시즌을 끝으로 은퇴할 예정이에요.</p>' : "";
  const timelineCard = '<div class="card"><h2>내 커리어 주요 순간</h2>' + plan + '<div class="timeline">' + timeline + "</div></div>";

  // 역대 MVP (정규 시즌 MVP · 리그 결승 MVP · 월드 결승 MVP)
  const awards = state.league.awards || [];
  const years = [];
  awards.forEach(function (a) { if (years.indexOf(a.year) === -1) years.push(a.year); });
  years.sort(function (a, b) { return b - a; });
  const cell = function (y, key) {
    const a = awards.find(function (x) { return x.year === y && x.key === key; });
    if (!a) return "<td>-</td>";
    return '<td class="' + (a.id === USER_ID ? "my-team" : "") + '">' + escapeHTML(a.name) + ' <span class="muted small">' + escapeHTML(a.team) + "</span></td>";
  };
  const mvpRows = years.map(function (y) {
    return "<tr><td>" + y + "</td>" + cell(y, "mvp") + cell(y, "fmvp") + cell(y, "worldsfmvp") + "</tr>";
  }).join("");
  const mvpCard = '<div class="card"><h2>역대 MVP</h2>' +
    (mvpRows ? '<table class="roster"><tr><th>시즌</th><th>정규 시즌 MVP</th><th>리그 결승 MVP</th><th>월드 결승 MVP</th></tr>' + mvpRows + "</table>"
             : '<p class="muted">첫 시상이 끝나면 기록돼요.</p>') + "</div>";

  // 은퇴한 스타 선수들
  const retirees = (state.league.retirees || []).slice().reverse();
  const retRows = retirees.slice(0, 20).map(function (r) {
    return "<tr><td>" + r.year + "</td><td><b>" + escapeHTML(r.name) + '</b> <span class="muted small">' + findPosition(r.pos).name + " · " + r.age + "세 · " + escapeHTML(r.team) + "</span></td>" +
      '<td class="r">' + r.score + '</td><td class="small">' + (r.awards.length ? r.awards.map(escapeHTML).join(", ") : "-") + "</td></tr>";
  }).join("");
  const retCard = '<div class="card"><h2>은퇴한 스타 선수</h2>' +
    (retRows ? '<table class="roster"><tr><th>은퇴</th><th>선수</th><th class="r">마지막 능력</th><th>수상</th></tr>' + retRows + "</table>"
             : '<p class="muted">상을 받았거나 뛰어났던 선수가 은퇴하면 기록돼요.</p>') + "</div>";

  return (
    "<h1>역사관</h1>" + timelineCard + sTraitLogHTML() + championsHistoryHTML() + mvpCard + retCard +
    '<div class="card"><h2>🏛 명예의 전당 <span class="muted small">은퇴한 내 선수들 · 새 게임을 해도 남아요</span></h2>' + hallOfFameHTML() + "</div>"
  );
};

// ----- 리그 생태계 -----
// 리그에 있는 모든 선수 (내 선수 포함): [{ id, pos, age, score, tier(1·2·0=FA), team }]
function allPlayersInfo() {
  const list = [];
  state.league.teams.forEach(function (t) {
    t.roster.forEach(function (id) {
      list.push({ id: id, pos: playerPos(id), age: playerAge(id), score: playerScore(id), tier: t.tier, team: t.name });
    });
  });
  (state.league.freeAgents || []).forEach(function (id) {
    if (findPlayer(id)) list.push({ id: id, pos: playerPos(id), age: playerAge(id), score: playerScore(id), tier: 0, team: "FA" });
  });
  return list;
}

function avgOf(list, fn) {
  return list.length ? list.reduce(function (s, x) { return s + fn(x); }, 0) / list.length : 0;
}

pages.ecosystem = function () {
  const all = allPlayersInfo();
  const starterIds = [];
  state.league.teams.forEach(function (t) {
    const s = starters(t.id);
    POSITION_IDS.forEach(function (pos) { if (s[pos]) starterIds.push(s[pos]); });
  });
  const isStarter = function (x) { return starterIds.indexOf(x.id) !== -1; };
  const score = function (x) { return x.score; };

  // 리그별 평균
  const t1 = all.filter(function (x) { return x.tier === 1; });
  const t2 = all.filter(function (x) { return x.tier === 2; });
  const fa = all.filter(function (x) { return x.tier === 0; });
  const worlds = state.league.season.worlds;
  const overseasAvg = worlds ? avgOf(worlds.overseas, function (o) { return o.power; }) : 0;
  const box = function (label, main, sub) {
    return '<div><div class="sum-label">' + label + '</div><div class="sum-main">' + main + '</div><div class="sum-sub muted">' + sub + "</div></div>";
  };
  const me = all.find(function (x) { return x.id === USER_ID; });
  const overall = all.slice().sort(function (a, b) { return b.score - a.score; });
  const myPosList = overall.filter(function (x) { return x.pos === me.pos && x.tier > 0; });
  const summary =
    '<div class="card"><h2>리그 한눈에 보기</h2><div class="summary-row">' +
      box("1부 리그", avgOf(t1.filter(isStarter), score).toFixed(1), "주전 평균 · 전체 " + t1.length + "명 평균 " + avgOf(t1, score).toFixed(1)) +
      box("2부 리그", avgOf(t2.filter(isStarter), score).toFixed(1), "주전 평균 · 전체 " + t2.length + "명 평균 " + avgOf(t2, score).toFixed(1)) +
      box("해외 팀", overseasAvg ? overseasAvg.toFixed(1) : "-", overseasAvg ? "월드 참가 팀 전력 평균" : "월드 챔피언십(42주) 때 공개") +
      box("FA 선수", fa.length + "명", fa.length ? "평균 " + avgOf(fa, score).toFixed(1) : "없음") +
    "</div>" +
    '<div class="summary-row">' +
      box("내 위치 (포지션)", myPosList.indexOf(me) + 1 + "위", findPosition(me.pos).name + " " + myPosList.length + "명 중 (팀 소속 선수)") +
      box("내 위치 (전체)", overall.indexOf(me) + 1 + "위", "리그 전체 " + all.length + "명 중 · 종합 " + me.score.toFixed(1)) +
      box("평균 나이", avgOf(all, function (x) { return x.age; }).toFixed(1) + "세", "나: " + state.player.age + "세") +
    "</div></div>";

  // 포지션별 TOP 5
  const topCards = POSITION_IDS.map(function (pos) {
    const rows = overall.filter(function (x) { return x.pos === pos; }).slice(0, 5).map(function (x, i) {
      return '<tr class="' + (x.id === USER_ID ? "me" : "") + '"><td>' + (i + 1) + "</td><td>" + escapeHTML(playerName(x.id)) +
        ' <span class="muted small">' + escapeHTML(x.team) + " · " + x.age + '세</span></td><td class="r"><b>' + x.score.toFixed(1) + "</b></td></tr>";
    }).join("");
    return '<div class="card"><h2>' + findPosition(pos).name + ' TOP 5</h2><table class="mini">' + rows + "</table></div>";
  }).join("");

  // 나이 분포
  const groups = [[17, 19], [20, 22], [23, 25], [26, 28], [29, 99]];
  const maxCount = Math.max.apply(null, groups.map(function (g) {
    return all.filter(function (x) { return x.age >= g[0] && x.age <= g[1]; }).length;
  }).concat([1]));
  const ageBars = groups.map(function (g) {
    const list = all.filter(function (x) { return x.age >= g[0] && x.age <= g[1]; });
    const mine = state.player.age >= g[0] && state.player.age <= g[1];
    const label = g[1] === 99 ? g[0] + "세 이상" : g[0] + "~" + g[1] + "세";
    return '<div class="stat"><div class="stat-label' + (mine ? " bonus" : "") + '">' + (mine ? "★ " : "") + label + "</div>" +
      '<div class="bar"><div class="bar-fill' + (mine ? " gold" : "") + '" style="width:' + (list.length / maxCount * 100) + '%"></div></div>' +
      '<div class="stat-value">' + list.length + "명</div></div>";
  }).join("");

  // 팀 전력 순위
  const teamBars = function (tier) {
    return tierTeams(tier).slice().sort(function (a, b) { return teamStrength(b.id) - teamStrength(a.id); }).map(function (t) {
      const mine = t.id === myTeam().id;
      const v = teamStrength(t.id);
      return '<div class="stat"><div class="stat-label' + (mine ? " bonus" : "") + '">' + escapeHTML(t.name) + "</div>" +
        '<div class="bar"><div class="bar-fill' + (mine ? " gold" : "") + '" style="width:' + v + '%"></div></div><div class="stat-value">' + v.toFixed(1) + "</div></div>";
    }).join("");
  };

  return (
    "<h1>리그 생태계</h1>" + summary +
    '<div class="grid">' + topCards + "</div>" +
    '<div class="grid">' +
      '<div class="card"><h2>나이 분포 <span class="muted small">리그 전체 선수</span></h2>' + ageBars +
        '<p class="muted small">' + CAREER.agingStartAge + "세부터 노화, 평균 " + CAREER.avgRetireAge + "세에 은퇴해요.</p></div>" +
      '<div class="card"><h2>1부 팀 전력</h2>' + teamBars(1) + "</div>" +
      '<div class="card"><h2>2부 팀 전력</h2>' + teamBars(2) + "</div>" +
    "</div>"
  );
};

// ━━━━━ (예전 js/trophies.js) ━━━━━
// ===== 우승 트로피 진열장 (대시보드 제목 옆) =====
// 대회마다 트로피 1개 + 2번 이상이면 ×횟수 (아무리 많이 우승해도 최대 5개라 넘치지 않음)
// 크기: 월드 > MSI > First Stand > 리그 > 컵. 마우스를 올리면 우승한 연도
// 그림은 SVG로 직접 그림 (그림 파일 없음). 우승 기록은 js/retire.js careerSummary

const TROPHY_TYPES = [
  // key: careerSummary().titles 이름, word: 우승 기록 글자 앞부분, h: 높이(px)
  { key: "worlds",     word: "월드",        name: "월드 챔피언십", h: 46 },
  { key: "msi",        word: "MSI",         name: "MSI",           h: 38 },
  { key: "firststand", word: "First Stand", name: "First Stand",   h: 34 },
  { key: "playoffs",   word: "리그",        name: "리그",          h: 31 },
  { key: "cup",        word: "LCK 컵",          name: "LCK 컵",       h: 26 },
];

// 대회별 트로피 그림 (viewBox 0 0 40 48, 바닥 = 48)
const TROPHY_SVG = {
  // 월드: 크고 넓은 소환사의 컵 모양 — 큰 사발 + 길게 휘는 손잡이 + 3단 받침
  worlds:
    '<defs><linearGradient id="tg-w" x1="0" x2="1"><stop offset="0" stop-color="#9a6b12"/><stop offset=".45" stop-color="#ffe9a3"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>' +
    '<path d="M6 6 Q1 7 2 14 Q3 21 12 22" fill="none" stroke="url(#tg-w)" stroke-width="2.4"/>' +
    '<path d="M34 6 Q39 7 38 14 Q37 21 28 22" fill="none" stroke="url(#tg-w)" stroke-width="2.4"/>' +
    '<path d="M5 4 H35 Q35 22 20 27 Q5 22 5 4 Z" fill="url(#tg-w)"/>' +
    '<ellipse cx="20" cy="4" rx="15" ry="2.2" fill="#fff3c4"/>' +
    '<path d="M11 10 Q20 14 29 10" fill="none" stroke="#9a6b12" stroke-width=".8" opacity=".6"/>' +
    '<rect x="17.5" y="27" width="5" height="8" fill="url(#tg-w)"/>' +
    '<rect x="11" y="35" width="18" height="4" rx="1" fill="url(#tg-w)"/>' +
    '<rect x="8" y="39" width="24" height="4" rx="1" fill="#7a5410"/>' +
    '<rect x="6" y="43" width="28" height="5" rx="1" fill="url(#tg-w)"/>',
  // MSI: 받침 위에 둥근 구슬 — 기둥 + 구 + 고리
  msi:
    '<defs><radialGradient id="tg-m" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#9fd8ff"/><stop offset="1" stop-color="#2a6fb0"/></radialGradient>' +
    '<linearGradient id="tg-m2" x1="0" x2="1"><stop offset="0" stop-color="#9a6b12"/><stop offset=".5" stop-color="#ffe9a3"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>' +
    '<circle cx="20" cy="13" r="11" fill="url(#tg-m)"/>' +
    '<ellipse cx="20" cy="13" rx="14" ry="4" fill="none" stroke="url(#tg-m2)" stroke-width="2"/>' +
    '<path d="M15 24 L25 24 L23 36 L17 36 Z" fill="url(#tg-m2)"/>' +
    '<rect x="11" y="36" width="18" height="5" rx="1" fill="url(#tg-m2)"/>' +
    '<rect x="8" y="41" width="24" height="7" rx="1.5" fill="#7a5410"/>',
  // First Stand: 은색 별 트로피
  firststand:
    '<defs><linearGradient id="tg-f" x1="0" x2="1"><stop offset="0" stop-color="#7d8794"/><stop offset=".5" stop-color="#f4f7fb"/><stop offset="1" stop-color="#9aa4b1"/></linearGradient></defs>' +
    '<path d="M20 1 L24.5 11 L35 12 L27 19 L29.5 30 L20 24.5 L10.5 30 L13 19 L5 12 L15.5 11 Z" fill="url(#tg-f)" stroke="#5f6874" stroke-width=".8"/>' +
    '<rect x="17.5" y="28" width="5" height="9" fill="url(#tg-f)"/>' +
    '<rect x="11" y="37" width="18" height="4" rx="1" fill="url(#tg-f)"/>' +
    '<rect x="9" y="41" width="22" height="7" rx="1.5" fill="#4b5563"/>',
  // 리그: 손잡이 두 개 달린 뚜껑 컵 (금)
  playoffs:
    '<defs><linearGradient id="tg-l" x1="0" x2="1"><stop offset="0" stop-color="#a87412"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#c08a14"/></linearGradient></defs>' +
    '<circle cx="20" cy="3.5" r="2.5" fill="url(#tg-l)"/>' +
    '<path d="M11 9 Q20 3 29 9 Z" fill="url(#tg-l)"/>' +
    '<path d="M10 9 Q4 9 4 15 Q4 21 12 22" fill="none" stroke="url(#tg-l)" stroke-width="2.6"/>' +
    '<path d="M30 9 Q36 9 36 15 Q36 21 28 22" fill="none" stroke="url(#tg-l)" stroke-width="2.6"/>' +
    '<path d="M10 9 H30 V18 Q30 28 20 29 Q10 28 10 18 Z" fill="url(#tg-l)"/>' +
    '<rect x="17.5" y="29" width="5" height="7" fill="url(#tg-l)"/>' +
    '<rect x="12" y="36" width="16" height="4" rx="1" fill="url(#tg-l)"/>' +
    '<rect x="10" y="40" width="20" height="8" rx="1.5" fill="#6b4a12"/>',
  // LCK 컵: 작은 동색 사발 컵
  cup:
    '<defs><linearGradient id="tg-c" x1="0" x2="1"><stop offset="0" stop-color="#7a4a24"/><stop offset=".5" stop-color="#f0b98a"/><stop offset="1" stop-color="#9c5f2e"/></linearGradient></defs>' +
    '<path d="M7 10 H33 Q33 26 20 30 Q7 26 7 10 Z" fill="url(#tg-c)"/>' +
    '<ellipse cx="20" cy="10" rx="13" ry="2" fill="#f7d3b2"/>' +
    '<rect x="17.5" y="30" width="5" height="7" fill="url(#tg-c)"/>' +
    '<rect x="11" y="37" width="18" height="11" rx="1.5" fill="#5a3a1e"/>',
};

function trophyShelfHTML() {
  if (!state.career || !state.player) return "";
  const s = careerSummary(true);
  const items = TROPHY_TYPES.filter(function (t) { return s.titles[t.key] > 0; }).map(function (t) {
    const n = s.titles[t.key];
    const years = s.titleList.filter(function (x) { return x.split(" ").slice(1).join(" ").replace(/^컵 대회/, "LCK 컵").indexOf(t.word) === 0; })
      .map(function (x) { return x.split(" ")[0]; });
    const w = Math.round(t.h * 40 / 48);
    return '<span class="trophy tip" tabindex="0" data-tip="' + t.name + " 우승 " + n + "회 · " + years.join(", ") + '">' +
      '<svg viewBox="0 0 40 48" width="' + w + '" height="' + t.h + '" aria-label="' + t.name + ' 트로피">' + TROPHY_SVG[t.key] + "</svg>" +
      (n > 1 ? '<span class="trophy-n">×' + n + "</span>" : "") + "</span>";
  });
  return items.length ? '<span class="trophy-shelf">' + items.join("") + "</span>" : "";
}
