// ===== 경기 상세: 세트별 라인 맞대결 · 평점 · 발동한 특성 =====
// 우리 팀 경기와 결승전만 상세 기록이 남아요 (m.detail). 시즌이 바뀌면 지난 시즌 상세는 사라져요.
// m.detail = { pick, banned, sets: [{ w(0=a팀 승, 1=b팀 승), deciding, ta, tb(팀 점수 내역),
//   lanes: [{ a, b(선수 id), pa, pb(경기력), aWon, solo, ra, rb(평점), xa, xb(발동한 특성) }] }] }

let openMatchKey = null; // 지금 펼친 경기 (화면에서만 씀, 저장 안 함)

// 경기 고유 이름: "시즌-순번"
function matchKey(m) {
  return state.league.season.year + "-" + state.league.season.matches.indexOf(m);
}

function findMatchByKey(key) {
  if (!key) return null;
  const parts = String(key).replace(/^r/, "").split("-"); // "r"로 시작 = 대시보드 지난주 결과에서 연 것
  const season = state.league.season;
  if (Number(parts[0]) !== season.year) return null;
  return season.matches[Number(parts[1])] || null;
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

// 이번 세트에 효과가 있었던 특성
function activeTraits(id, teamId, setCtx, laneWon) {
  if (!id) return [];
  return traitsOf(id).filter(function (tid) {
    const e = findTrait(tid).effects;
    if (e.power || e.variance || e.teamMood) return true;                       // 늘 적용
    if (e.bigMatch && setCtx.match && isBigMatch(setCtx.match)) return true;     // 큰 경기
    if (e.earlyPenalty && state.week <= 12) return true;                         // 시즌 초
    if (e.clutch && setCtx.deciding) return true;                                // 풀세트
    if (e.comeback && setCtx.behind === teamId) return true;                     // 지고 있을 때
    if ((e.laneBonus || e.soloEasy) && laneWon) return true;                     // 라인전 승리
    return false;
  });
}

// 한 세트 기록 만들기 (playMatch에서 부름)
function setDetail(set, setCtx, m) {
  const team = function (t) { return { avg: round1(t.avg), lane: round1(t.lane), luck: round1(t.luck), mood: round1(t.mood) }; };
  return {
    w: set.winner === m.a ? 0 : 1,
    deciding: !!setCtx.deciding,
    ta: team(set.teamA), tb: team(set.teamB),
    lanes: set.la.map(function (pa, i) {
      const pb = set.lb[i], ln = set.lanes[i];
      return {
        a: pa.id, b: pb.id, pa: round1(pa.power), pb: round1(pb.power), aWon: ln.aWon, solo: ln.solo,
        ra: round1(setRating(pa.power, pb.power, set.winner === m.a)),
        rb: round1(setRating(pb.power, pa.power, set.winner === m.b)),
        xa: activeTraits(pa.id, m.a, setCtx, ln.aWon), xb: activeTraits(pb.id, m.b, setCtx, !ln.aWon),
      };
    }),
  };
}

// 선수 이름 (해외 가상 팀 선수는 "팀 약자 포지션")
function detailName(id, teamId, pos) {
  if (!id) return escapeHTML(teamShort(teamId)) + " " + findPosition(pos).name;
  if (id !== USER_ID && !findPlayer(id)) return '<span class="muted">(떠난 선수)</span>';
  const name = escapeHTML(playerName(id));
  return id === USER_ID ? '<b class="my-team">' + name + "</b>" : name;
}

function miniChips(ids) {
  return ids.length ? ' <span class="mini-chips">' + ids.map(traitChipHTML).join("") + "</span>" : "";
}

// 팀 점수 내역 한 줄
function teamScoreText(t) {
  const total = t.avg + t.lane + t.luck + t.mood;
  return "<b>" + total.toFixed(1) + "</b> " +
    '<span class="muted small">= 선수 평균 ' + t.avg.toFixed(1) + " + 라인전 " + t.lane.toFixed(0) +
    (t.mood ? " + 한타 특성 " + t.mood.toFixed(1) : "") + " " + (t.luck >= 0 ? "+ " : "− ") + "운 " + Math.abs(t.luck).toFixed(1) + "</span>";
}

function matchDetailHTML(m) {
  const d = m.detail;
  if (!d) return "";
  const head =
    '<div class="md-head">' + escapeHTML(m.label) + " · " + teamLabel(m.a) + " <b>" + m.score[0] + " : " + m.score[1] + "</b> " + teamLabel(m.b) +
      (m.pogName ? " · 🏅 POG " + escapeHTML(m.pogName) : "") +
      (d.pick ? '<div class="muted small">내 픽: <b>' + escapeHTML(d.pick) + "</b>" + (d.banned && d.banned.length ? " · 상대가 밴한 내 챔피언: " + d.banned.map(escapeHTML).join(", ") : "") + "</div>" : "") +
    "</div>";

  const sets = d.sets.map(function (s, i) {
    const winner = s.w === 0 ? m.a : m.b;
    const rows = s.lanes.map(function (l, li) {
      const pos = POSITION_IDS[li];
      const mark = (l.solo ? "💥" : "") + (l.aWon ? "◀" : "▶");
      return "<tr>" +
        '<td class="' + (l.aWon ? "lane-win" : "") + '">' + detailName(l.a, m.a, pos) + miniChips(l.xa) + "</td>" +
        '<td class="r muted small">' + l.ra.toFixed(1) + '</td><td class="r">' + l.pa.toFixed(0) + "</td>" +
        '<td class="c lane-mid">' + findPosition(pos).name + '<br><span class="' + (l.solo ? "solo" : "muted") + '">' + mark + "</span></td>" +
        "<td>" + l.pb.toFixed(0) + '</td><td class="muted small">' + l.rb.toFixed(1) + "</td>" +
        '<td class="r ' + (!l.aWon ? "lane-win" : "") + '">' + miniChips(l.xb) + " " + detailName(l.b, m.b, pos) + "</td>" +
      "</tr>";
    }).join("");
    return (
      '<div class="set-card">' +
        '<div class="set-head"><b>' + (i + 1) + "세트</b>" + (s.deciding ? ' <span class="chip meta">풀세트</span>' : "") + " · 승리 " + teamLabel(winner) + "</div>" +
        '<table class="lane-table"><tr><th>' + teamLabel(m.a) + '</th><th class="r small">평점</th><th class="r small">경기력</th><th class="c small">라인</th><th class="small">경기력</th><th class="small">평점</th><th class="r">' + teamLabel(m.b) + "</th></tr>" + rows + "</table>" +
        '<div class="small">' + teamLabel(m.a) + " " + teamScoreText(s.ta) + "</div>" +
        '<div class="small">' + teamLabel(m.b) + " " + teamScoreText(s.tb) + "</div>" +
      "</div>"
    );
  }).join("");

  // 선수별 평균 평점
  const sum = {};
  d.sets.forEach(function (s) {
    s.lanes.forEach(function (l, li) {
      [[l.a, l.ra, m.a], [l.b, l.rb, m.b]].forEach(function (x) {
        const key = x[0] || (x[2] + ":" + li);
        if (!sum[key]) sum[key] = { id: x[0], team: x[2], pos: POSITION_IDS[li], r: 0, g: 0 };
        sum[key].r += x[1];
        sum[key].g++;
      });
    });
  });
  const ratingCol = function (teamId) {
    return Object.keys(sum).map(function (k) { return sum[k]; }).filter(function (p) { return p.team === teamId; })
      .sort(function (x, y) { return POSITION_IDS.indexOf(x.pos) - POSITION_IDS.indexOf(y.pos); })
      .map(function (p) {
        return "<tr><td>" + findPosition(p.pos).name + "</td><td>" + detailName(p.id, teamId, p.pos) + (p.id && p.id === m.pog ? " 🏅" : "") +
          '</td><td class="r"><b>' + (p.r / p.g).toFixed(1) + "</b></td></tr>";
      }).join("");
  };
  const ratings =
    '<div class="grid md-ratings">' +
      '<div><h3 class="small">' + teamLabel(m.a) + ' 평균 평점</h3><table class="mini">' + ratingCol(m.a) + "</table></div>" +
      '<div><h3 class="small">' + teamLabel(m.b) + ' 평균 평점</h3><table class="mini">' + ratingCol(m.b) + "</table></div>" +
    "</div>";

  return (
    '<div class="match-detail">' + head + sets + ratings +
      '<p class="muted small">◀ ▶ = 라인전에서 이긴 쪽, 💥 = 솔로킬. 라인전 보너스는 이길 때 +' + TEAM_MATCH.laneWinBonus + ", 솔로킬이면 +" + TEAM_MATCH.soloKillBonus +
        " 더. 팀 점수가 높은 쪽이 세트 승리. 특성 칩은 그 세트에 효과가 있었던 특성이에요.</p>" +
    "</div>"
  );
}

// 대시보드 "지난주 결과" 줄 옆 버튼과 펼친 상세
function detailButtonHTML(key) {
  const m = findMatchByKey(key);
  if (!m || !m.detail) return "";
  return ' <button class="small-btn" data-mdetail="r' + key + '">' + (openMatchKey === "r" + key ? "닫기 ▲" : "상세 ▼") + "</button>";
}

function openDetailHTML(key) {
  const m = findMatchByKey(key);
  return m && m.detail && openMatchKey === "r" + key ? '<div class="rep-detail">' + matchDetailHTML(m) + "</div>" : "";
}

// 버튼 연결 (main.js renderPage에서 부름)
function bindMatchDetail(page) {
  page.querySelectorAll("[data-mdetail]").forEach(function (el) {
    el.onclick = function () {
      const key = el.getAttribute("data-mdetail");
      openMatchKey = openMatchKey === key ? null : key;
      renderPage();
    };
  });
}
