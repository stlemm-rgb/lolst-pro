// ===== [선수 정보] 내 선수의 모든 것 (2026-10-07, 예전 '나의 커리어'를 바꿈) =====
// 맨 위 선수 카드(늘 보임) + 탭 6개: 능력 · 특성 · 챔피언 · 성장 보너스 · 기록 · 나이·은퇴
// 기록용 데이터:
//   state.career.statLog = [{ y, w, stats, score }]  매주 훈련 뒤 스탯 (최근 10주) → '4주 전' 비교
//   state.career.seasonStart = { year, stats, score }  시즌이 시작될 때 스탯 → '이번 시즌' 비교
//   state.career.ev = { year, season: { 사건 id: 횟수 }, total: {…}, trSeason: { 특성 id: 횟수 }, trTotal: {…} }  경기 흐름 내 장면

let playerTab = "ability";
const PLAYER_TABS = [
  { id: "ability", name: "📊 능력" },
  { id: "traits",  name: "✨ 특성" },
  { id: "champs",  name: "⚔️ 챔피언" },
  { id: "growth",  name: "📈 성장 보너스" },
  { id: "records", name: "🏆 기록" },
  { id: "age",     name: "⏳ 나이·은퇴" },
];

pages.career = function () {
  if (!PLAYER_TABS.some(function (t) { return t.id === playerTab; })) playerTab = "ability";
  const tabs = PLAYER_TABS.map(function (t) {
    return '<button data-ptab="' + t.id + '"' + (playerTab === t.id ? ' class="primary"' : "") + ">" + t.name + "</button>";
  }).join("");
  const body = {
    ability: playerAbilityHTML, traits: playerTraitsHTML, champs: playerChampsHTML,
    growth: playerGrowthHTML, records: playerRecordsHTML, age: playerAgeHTML,
  }[playerTab]();
  return "<h1>선수 정보</h1>" + playerHeaderHTML() + '<div class="buttons ptabs">' + tabs + "</div>" + body;
};

// ----- 기록 쌓기 (js/main.js nextWeek, js/matchsim.js playMatch에서 부름) -----
function recordStatSnapshot() {
  const c = state.career;
  c.statLog = (c.statLog || []).concat([{ y: state.year, w: state.week, stats: JSON.parse(JSON.stringify(state.stats)), score: playerScore(USER_ID) }]).slice(-10);
  if (!c.seasonStart || c.seasonStart.year !== state.year) {
    c.seasonStart = { year: state.year, stats: JSON.parse(JSON.stringify(state.stats)), score: playerScore(USER_ID) };
  }
}

// 내 선수가 주인공인 경기 흐름 장면 세기 (세트 뒤 심리 변화는 뺌)
function tallyUserEvents(list) {
  const c = state.career;
  if (!c.ev || c.ev.year !== state.year) {
    const old = c.ev || {};
    c.ev = { year: state.year, season: {}, total: old.total || {}, trSeason: {}, trTotal: old.trTotal || {} };
  }
  (list || []).forEach(function (e) {
    if (e.p !== USER_ID || e.a) return;
    c.ev.season[e.e] = (c.ev.season[e.e] || 0) + 1;
    c.ev.total[e.e] = (c.ev.total[e.e] || 0) + 1;
    if (e.tr) {
      c.ev.trSeason[e.tr] = (c.ev.trSeason[e.tr] || 0) + 1;
      c.ev.trTotal[e.tr] = (c.ev.trTotal[e.tr] || 0) + 1;
    }
  });
}

// ----- 맨 위 선수 카드 -----
function playerHeaderHTML() {
  const p = state.player;
  const team = myTeam();
  const c = state.contract;
  const pr = positionRank();
  const sr = state.soloRank || { points: LADDER.startPoints };
  const home = currentHome();
  const st = (state.league.season.playerStats || {})[USER_ID];
  ensureCareerRecords();
  return (
    '<div class="card phead">' +
      '<div class="phead-main">' +
        '<div class="phead-name">' + escapeHTML(p.name) + ' <span class="muted small">' + findPosition(p.position).name + " · " + p.age + "세 · " +
          findArchetype(p.archetype).name + " · 프로 " + careerYears() + "년차 (" + state.career.debut.year + "년 데뷔)</span></div>" +
        '<div class="chips">' + (p.traits.length ? p.traits.map(traitChipHTML).join("") : '<span class="muted small">특성 없음</span>') + "</div>" +
        '<div class="small phead-line">' + teamLinkHTML(team.id) + " " + tierName(team.tier) + " · " + (state.benched ? '<span class="down">2군 (후보)</span>' : '<span class="up">1군 (주전)</span>') +
          (c ? " · 연봉 " + moneyText(c.salary) + " · " + c.endYear + "년까지" + (c.guarantee ? " · 출전 보장 " + c.guarantee + "경기" : "") : " · 계약 없음") + "</div>" +
        '<div class="small phead-line">' + (home ? home.icon + " " + home.name : "🛏️ 팀 합숙") + " · 💰 " + moneyText(state.money) + "</div>" +
      "</div>" +
      '<div class="phead-nums">' +
        '<div><div class="sum-label">종합 능력</div><div class="sum-main big">' + playerScore(USER_ID).toFixed(1) + '</div><div class="sum-sub">' + findPosition(p.position).name + " " + pr.total + "명 중 " + pr.rank + "위</div></div>" +
        '<div><div class="sum-label">솔로 랭크</div><div class="sum-main" style="color:' + ladderTierInfo(sr.points).color + '">' + ladderTier(sr.points) + '</div><div class="sum-sub">' + sr.points.toLocaleString() + "점</div></div>" +
        '<div><div class="sum-label">이번 시즌 평점</div><div class="sum-main">' + (st && st.g ? (st.r / st.g).toFixed(2) : "-") + '</div><div class="sum-sub">' + (st ? st.g + "세트 · POG " + st.pog : "경기 전") + "</div></div>" +
      "</div>" +
      '<div class="phead-bars">' +
        miniBarHTML("체력", state.stamina, state.staminaMax, state.stamina < 20 ? "neg" : state.stamina < 30 ? "warn" : "") +
        conditionBarHTML() +
        miniBarHTML("인기도", state.popularity) +
        '<div class="mini-bar"><span class="mini-label">평판</span><span class="bar rep-bar"><span class="rep-mid"></span><span class="bar-fill ' + (state.reputation < 0 ? "neg" : "pos") +
          '" style="margin-left:' + (state.reputation < 0 ? 50 + state.reputation / 2 : 50) + "%;width:" + Math.abs(state.reputation) / 2 + '%"></span></span><span class="mini-value">' +
          (state.reputation > 0 ? "+" : "") + state.reputation + "</span></div>" +
      "</div>" +
    "</div>"
  );
}

// 팀 이름 (구단 탐색 링크가 있으면 그걸로)
function teamLinkHTML(teamId) {
  return "<b>" + escapeHTML(teamName(teamId)) + "</b>";
}

// ----- 📊 능력 -----
function deltaCell(d) {
  if (d === null || d === undefined) return '<td class="r muted">-</td>';
  const v = Math.round(d * 10) / 10;
  return '<td class="r ' + (v > 0 ? "up" : v < 0 ? "down" : "muted") + '">' + (v > 0 ? "+" : "") + (Number.isInteger(v) ? v : v.toFixed(1)) + "</td>";
}

function playerAbilityHTML() {
  const c = state.career;
  const info = playerInfo(USER_ID);
  const bars = STATS.map(function (s) {
    return barHTML(s.name, state.stats[s.id], s.desc + " · " + (s.roles || []).join(" · "), isBonusStat(s.id), userStatCap(s.id));
  }).join("");
  // 변화: 데뷔 · 시즌 시작 · 4주 전 → 지금
  const log = c.statLog || [];
  const ago = log.length >= 5 ? log[log.length - 5] : null;
  const ss = c.seasonStart && c.seasonStart.year === state.year ? c.seasonStart : null;
  const rows = STATS.map(function (s) {
    const now = state.stats[s.id];
    return "<tr><td" + (isBonusStat(s.id) ? ' class="bonus"' : "") + ">" + (isBonusStat(s.id) ? "★ " : "") + s.name + '</td><td class="r"><b>' + now + "</b></td>" +
      deltaCell(now - c.statStart[s.id]) + deltaCell(ss ? now - ss.stats[s.id] : null) + deltaCell(ago ? now - ago.stats[s.id] : null) + "</tr>";
  }).join("");
  const score = playerScore(USER_ID);
  const changeCard =
    '<div class="card"><h2>능력 변화 <span class="muted small">지금 값과 데뷔·이번 시즌 시작·4주 전 대비</span></h2>' +
      '<table class="mini change-table"><tr><th>스탯</th><th class="r">지금</th><th class="r">데뷔 대비</th><th class="r">이번 시즌</th><th class="r">최근 4주</th></tr>' +
        '<tr class="total"><td><b>종합 능력</b></td><td class="r"><b>' + score.toFixed(1) + "</b></td>" + deltaCell(score - c.debut.score) +
          deltaCell(ss ? score - ss.score : null) + deltaCell(ago ? score - ago.score : null) + "</tr>" +
        rows + "</table>" +
      '<p class="muted small">"-"는 아직 기록이 모자란 칸이에요 (최근 4주는 5주 이상 진행하면 보여요). 이벤트·노화로 바뀐 것도 들어가요.</p>' +
    "</div>";
  const scoreCard = '<div class="card"><h2>시즌별 종합 능력</h2>' + careerRecordParts().scoreBars + "</div>";
  return (
    '<div class="card"><h2>스탯 <span class="muted small"><span class="bonus">★</span> 포지션 가산점 · 최대 100</span></h2>' +
      posScoresHTML(USER_ID, info) + strengthLineHTML(info) +
      '<div class="stat-columns">' + bars + "</div>" +
      statGuideHTML(state.player.position) +
      '<h2 class="sub">유형 스탯 <span class="muted small">높을수록 그 유형 챔피언 숙련도가 잘 올라요 (괄호 = 숙련도 성장 보너스)</span></h2>' +
      '<div class="stat-columns type-stats">' + typeScoresHTML() + "</div>" +
    "</div>" +
    '<div class="grid">' + changeCard + scoreCard + "</div>" +
    matchPreviewHTML()
  );
}

// 경기력 미리보기 (밴 2명 기준) — 예전 나의 커리어에서 옮김
function matchPreviewHTML() {
  const m = matchPower();
  const mp = m.meta;
  return (
    '<div class="card"><h2>경기력 미리보기 <span class="muted small">상대가 가장 경계하는 내 챔피언 ' + MATCH.bansAgainstMe + "명을 밴했을 때 · 실제 경기에서는 밴 수(0~3명)와 대상이 경기마다 달라요</span></h2>" +
      '<table class="calc">' +
        "<tr><td>스탯 점수</td><td>12개 평균, ★가산점 " + POSITION_BONUS.matchMultiplier + "배</td><td><b>" + m.score.toFixed(1) + "</b></td></tr>" +
        "<tr><td>밴 당한 챔피언</td><td colspan=\"2\">" + (m.banned.join(", ") || "없음") + "</td></tr>" +
        "<tr><td>고른 챔피언</td><td>" + m.pick + " (숙련도 " + state.mastery[m.pick] + (metaTier(m.pick) ? ", 메타 " + metaTier(m.pick) + "급 +" + Math.round(MATCH.metaPowerBonus[metaTier(m.pick)] * 100) + "%" : "") + ")</td><td>× <b>" + m.multiplier.toFixed(2) + "</b></td></tr>" +
        (m.jokerBonus > 0 ? "<tr><td>🃏 조커픽</td><td>메타가 아닌 챔피언 · 숙련도 " + MATCH.jokerFrom + "~" + MATCH.jokerFull + "에서 서서히 커짐 · 상대가 예상 못 함</td><td>× <b>" + (1 + m.jokerBonus).toFixed(3) + "</b></td></tr>" : "") +
        "<tr><td>메타 페널티</td><td>메타 챔피언 평균 숙련도 " + mp.avg.toFixed(0) +
          (mp.adapting ? " · 패치 적응 기간 (적응력 −" + Math.round(mp.adaptCut * 100) + "%" + (mp.stubborn ? ", 고집 +" + mp.stubborn : "") + ")" : "") +
          "</td><td>− <b>" + mp.penalty.toFixed(1) + "</b></td></tr>" +
        '<tr class="total"><td>경기력</td><td>스탯 점수 × 숙련도 배율(메타 등급 보너스 포함) × 조커픽 − 메타 페널티</td><td><b>' + m.power.toFixed(1) + "</b></td></tr>" +
      "</table>" +
      '<p class="muted small">실제 경기에서는 여기에 컨디션·체력·특성, 그리고 경기 흐름 사건(슈퍼플레이·실수)이 더해져요.</p>' +
    "</div>"
  );
}

// ----- ✨ 특성 -----
const TRAIT_TYPE_NAMES = { good: "좋은 특성", bad: "나쁜 특성", s: "S급", title: "칭호·전용" };

function playerTraitsHTML() {
  const p = state.player;
  const tally = (state.career.ev && state.career.ev.year === state.year) ? state.career.ev.trSeason : {};
  const total = (state.career.ev && state.career.ev.trTotal) || {};
  const rows = p.traits.map(function (id) {
    const t = findTrait(id);
    if (!t) return "";
    let note = "";
    if (t.impact) note += '<span class="up">세트 승률 +' + t.impact.toFixed(1) + "%p</span> · " + escapeHTML(t.when);
    const arch = findArchetype(p.archetype);
    if (arch && arch.startTrait === id && p.startTraitUntil) {
      const left = p.startTraitUntil - state.year;
      note += (note ? " · " : "") + "<b>" + (p.startTraitUntil - 1) + "년 시즌까지</b> (이번 시즌 포함 " + left + "시즌 남음)";
    }
    const used = (tally[id] || 0) + "회 / 통산 " + (total[id] || 0) + "회";
    return "<tr><td>" + traitChipHTML(id) + '</td><td class="small muted">' + (TRAIT_TYPE_NAMES[t.type] || "") + '</td><td class="small">' + escapeHTML(t.desc) + "</td>" +
      '<td class="small">' + (note || '<span class="muted">-</span>') + '</td><td class="r small">' + used + "</td></tr>";
  }).join("");
  const hasBad = p.traits.some(function (id) { return findTrait(id) && findTrait(id).type === "bad"; });
  const mine = '<div class="card"><h2>내 특성 <span class="muted small">' + p.traits.length + "개 · 장면 = 이 특성 덕분에 경기 흐름에서 일어난 내 장면 (이번 시즌 / 통산)</span></h2>" +
    (rows ? '<table class="roster trait-table"><tr><th>특성</th><th>종류</th><th>효과</th><th>경기 영향 · 기간</th><th class="r">장면</th></tr>' + rows + "</table>" : '<p class="muted">특성이 없어요.</p>') +
    (hasBad ? '<p class="small notice-inline">나쁜 특성은 SNS로 오는 극복 이벤트에서 좋은 선택을 하면 사라질 수 있어요.</p>' : "") +
  "</div>";
  return mine + sTraitProgressHTML();
}

// S급 특성 진행도: 조건마다 지금 어디까지 왔는지
function sTraitProgressHTML() {
  const rec = recOf(USER_ID) || {};
  const season = (state.league.season.playerStats || {})[USER_ID] || {};
  const mastered = Object.keys(state.mastery).filter(function (n) { return state.mastery[n] >= MASTERY.max; }).length;
  const sCount = state.player.traits.filter(function (x) { return findTrait(x) && findTrait(x).type === "s" && x !== "s_goat"; }).length;
  const awardThisYear = function (key) {
    return (state.league.awards || []).some(function (a) { return a.id === USER_ID && a.year === state.year && a.key === key; });
  };
  const prog = function (r) {
    switch (r.trait) {
      case "s_emperor":      return { cur: rec.worlds || 0, max: r.worlds, unit: "회 우승" };
      case "s_lane_lord":    return { cur: season.solo || 0, max: r.solo, unit: "솔로킬 (이번 시즌)" };
      case "s_comeback":     return { cur: rec.reverseSweeps || 0, max: r.reverseSweeps, unit: "번 역전" };
      case "s_one_club":     return { cur: rec.clubTeam === myTeam().id ? rec.clubYears || 0 : 0, max: r.seasons, unit: "시즌 (지금 팀, 시즌이 끝날 때 셈)" };
      case "s_breakthrough": return { cur: statsAtCap(USER_ID), max: r.atCap, unit: "개 " + (r.atLeast || STAT_CAP) + " 이상" };
      case "s_champ_master": return { cur: mastered, max: r.mastered, unit: "명 숙련도 100" };
      case "s_rank_god":     return { cur: state.soloRank ? state.soloRank.peak : 0, max: r.ladder, unit: "점 (역대 최고)" };
      case "s_goat":         return { cur: sCount, max: r.sCount, unit: "개 S급 특성" };
      case "s_iron_will":    return { text: state.player.age + "세 · " + (state.player.age >= r.age ? "이제 정규 시즌 MVP만 받으면 돼요" : r.age + "세부터 도전 가능") };
      case "s_demon":        return { text: "올해 리그 결승 MVP " + (awardThisYear("fmvp") ? "✅" : "⬜") + " · 월드 결승 MVP " + (awardThisYear("worldsfmvp") ? "✅" : "⬜") };
      case "s_weed":         return { text: state.career.benchedYear === state.year ? "이번 시즌 2군에 내려간 적 있음 → 우승하면 획득" : "2군에 내려간 시즌에 팀이 우승하면 획득" };
      default:               return { text: "" };
    }
  };
  const rows = S_TRAIT_RULES.map(function (r) {
    const owned = state.player.traits.indexOf(r.trait) !== -1;
    const g = prog(r);
    let cell;
    if (owned) cell = '<span class="up"><b>✅ 획득</b></span>';
    else if (g.max) {
      const pct = Math.min(100, g.cur / g.max * 100);
      cell = '<div class="mini-bar s-prog"><span class="bar"><span class="bar-fill' + (pct >= 100 ? " pos" : "") + '" style="width:' + pct + '%"></span></span>' +
        '<span class="mini-value">' + g.cur.toLocaleString() + " / " + g.max.toLocaleString() + "</span></div>" + '<span class="muted small">' + g.unit + "</span>";
    } else cell = '<span class="small">' + escapeHTML(g.text) + "</span>";
    return '<tr class="' + (owned ? "me" : "") + '"><td>' + traitChipHTML(r.trait) + '</td><td class="small">' + escapeHTML(r.text) + "</td><td>" + cell + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>🌟 S급 특성 진행도 <span class="muted small">게임 중 큰 업적으로만 얻어요 · 특성 이름에 마우스를 올리면 효과</span></h2>' +
    '<table class="roster s-table"><tr><th>특성</th><th>조건</th><th>진행</th></tr>' + rows + "</table></div>";
}

// ----- ⚔️ 챔피언 -----
function playerChampsHTML() {
  if (!championTab) championTab = state.player.position;
  const tabs = POSITION_IDS.map(function (id) {
    return '<button data-ctab="' + id + '"' + (championTab === id ? ' class="primary"' : "") + ">" + findPosition(id).name + "</button>";
  }).join("");
  const names = Object.keys(state.mastery)
    .filter(function (name) { return findChampion(name).positions.indexOf(championTab) !== -1; })
    .sort(function (a, b) { return state.mastery[b] - state.mastery[a] || a.localeCompare(b); });
  const rows = names.map(function (n) { return masteryRowHTML(n, championTab); }).join("");
  const upcoming = CHAMPIONS.filter(function (c) { return state.mastery[c.name] === undefined; });
  const next = upcoming.length ? "다음 출시 예정: <b>" + upcoming[0].name + "</b> (" + upcoming[0].released + ")" : "모든 챔피언이 출시됐어요.";
  const mastered = Object.keys(state.mastery).filter(function (n) { return state.mastery[n] >= MASTERY.max; }).length;
  return (
    championCardHTML() + // 이번 패치 메타 + 숙련도 상위 5 (js/dashboard.js)
    '<div class="card"><h2>챔피언 숙련도 전체 <span class="muted small">' + escapeHTML(state.meta.label) + " · 숙련도 100 챔피언 " + mastered + "명</span></h2>" +
      '<p class="muted small">1 = 한 번도 안 해 본 챔피언, 100 = 완벽하게 다룸. 금색 막대 = 이번 패치 메타 챔피언. ' +
        "지금까지 출시된 챔피언 " + Object.keys(state.mastery).length + "명 · " + next + "</p>" +
      '<div class="buttons">' + tabs + "</div>" +
      '<div class="stat-columns mastery-list">' + rows + "</div>" +
    "</div>"
  );
}

// ----- 📈 성장 보너스: 훈련 효과·숙련도·체력·컨디션 보너스가 어디서 오는지 -----
function pctCell(v, strong) {
  if (!v) return '<td class="r muted">-</td>';
  const t = (v > 0 ? "+" : "") + Math.round(v * 100) + "%";
  return '<td class="r ' + (v > 0 ? "up" : "down") + '">' + (strong ? "<b>" + t + "</b>" : t) + "</td>";
}

function playerGrowthHTML() {
  const tr = state.player.traits;
  const arch = findArchetype(state.player.archetype);
  const dorm = dormTrainingBonus();
  const rows = STATS.map(function (s) {
    const a = arch.trainingBonus || 0;
    const t = traitSumOf(tr, "trainingAll") + traitKeyOf(tr, "trainingStat", s.id);
    const pos = isBonusStat(s.id) ? POSITION_BONUS.trainingBonus : 0;
    const shop = shopEffectSum("trainingAll") + shopEffectKey("trainingStat", s.id);
    const sum = a + t + pos + shop + dorm;
    const gm = growthMultiplier(state.stats[s.id], tr, s.id);
    const ag = agingTrainingMultiplier(s.id);
    const real = Math.max(0, 1 + sum) * gm * ag;
    return "<tr><td" + (isBonusStat(s.id) ? ' class="bonus"' : "") + ">" + (isBonusStat(s.id) ? "★ " : "") + s.name + "</td>" +
      pctCell(a) + pctCell(t) + pctCell(pos) + pctCell(shop) + pctCell(dorm) + pctCell(sum, true) +
      '<td class="r muted">×' + gm.toFixed(2) + "</td>" + '<td class="r ' + (ag < 1 ? "down" : "muted") + '">×' + ag.toFixed(2) + "</td>" +
      '<td class="r"><b>×' + real.toFixed(2) + "</b></td></tr>";
  }).join("");
  const trainCard =
    '<div class="card"><h2>훈련 효과 <span class="muted small">스탯이 오를 때 곱해지는 값 · 실제 배율 = (1 + 보너스 합계) × 높은 스탯 감소(한계 특성 포함) × 노화</span></h2>' +
      '<div class="table-wrap"><table class="roster growth-table"><tr><th>스탯</th><th class="r">시작 유형</th><th class="r">특성</th><th class="r">포지션★</th><th class="r">장비·고용</th><th class="r">합숙</th><th class="r">보너스 합계</th>' +
        '<th class="r">높은 스탯 감소</th><th class="r">노화</th><th class="r">실제 배율</th></tr>' + rows + "</table></div>" +
      '<p class="muted small">높은 스탯 감소: 스탯이 높을수록 덜 올라요. 노화: ' + agingStartAge() + "세부터 반응속도·입력 정확도만 덜 올라요. 체력이 20 아래면 이 값이 다시 절반이 돼요.</p>" +
    "</div>";

  // 그 밖의 보너스: 특성 / 상점(장비·고용·거주지) / 합계
  const line = function (label, key, fmt, note) {
    const a = traitSumOf(tr, key), b = shopEffectSum(key);
    return "<tr><td>" + label + "</td><td class=\"r\">" + (a ? fmt(a) : '<span class="muted">-</span>') + '</td><td class="r">' + (b ? fmt(b) : '<span class="muted">-</span>') +
      '</td><td class="r"><b>' + (a + b ? fmt(a + b) : '<span class="muted">-</span>') + '</b></td><td class="muted small">' + (note || "") + "</td></tr>";
  };
  const pct = function (v) { return (v > 0 ? "+" : "") + Math.round(v * 100) + "%"; };
  const num = function (v) { return (v > 0 ? "+" : "") + v; };
  const mg = masteryGrowthMultiplier();
  const otherCard =
    '<div class="card"><h2>그 밖의 보너스 <span class="muted small">특성 / 상점(장비·고용·거주지·방송 장비)</span></h2>' +
      '<table class="roster"><tr><th>항목</th><th class="r">특성</th><th class="r">상점</th><th class="r">합계</th><th>설명</th></tr>' +
        "<tr><td>챔피언 숙련도 성장</td><td colspan=\"3\" class=\"r\"><b>×" + mg.toFixed(2) + '</b></td><td class="muted small">시작 유형 ×' + arch.masteryGrowth +
          " × (1 + 특성 " + pct(traitEffectSum("masteryGrowth")) + (dorm ? " + 합숙 " + pct(dorm) : "") + "). 메타 챔피언·유형 보너스는 챔피언마다 더해져요</td></tr>" +
        line("메타 챔피언 숙련도", "metaMastery", pct, "메타 챔피언을 연습할 때만") +
        line("훈련·경기 체력 소모", "staminaCost", pct, "−면 덜 지침") +
        line("휴식 체력 회복", "restBonus", pct) +
        line("매주 체력 회복", "staminaRegen", num) +
        "<tr><td>컨디션 상한</td><td colspan=\"3\" class=\"r\"><b>" + conditionCap() + '</b></td><td class="muted small">' + (inDorm() ? "팀 합숙 중" : currentHome().name) + "</td></tr>" +
        line("매주 컨디션 회복", "conditionRegen", num) +
        line("패배 후 컨디션 하락", "lossMental", pct, "−면 덜 떨어짐") +
        line("인기도 상승", "popularityGain", pct) +
        line("연봉", "salaryBonus", pct) +
        line("계약 협상 성공률", "negotiate", pct) +
        line("퀘스트 보상", "questBonus", pct) +
        line("노화로 줄어드는 양", "agingCut", function (v) { return "−" + Math.round(v * 100) + "%"; }) +
      "</table></div>";

  // 가진 것: 장비·고용·거주지
  const s = shopState();
  const owned = [];
  SHOP_GEAR.forEach(function (g) { const lv = s.gear[g.id] || 0; if (lv) owned.push(g.icon + " " + g.name + " " + lv + "단계"); });
  SHOP_STAFF.forEach(function (st) { if (s.staff[st.id]) owned.push(st.icon + " " + st.name + " (주 " + moneyText(st.weekly) + ")"); });
  SHOP_FAME.forEach(function (f) { if (f.once && s.fame[f.id]) owned.push(f.icon + " " + f.name); });
  const home = currentHome();
  owned.push(home ? home.icon + " " + home.name : "🛏️ 팀 합숙 (훈련 +" + Math.round(dormRate() * 100) + "%)");
  const ownCard = '<div class="card"><h2>가진 것 <span class="muted small">[상점]에서 사고 고용해요</span></h2><div class="chips">' +
    owned.map(function (x) { return '<span class="chip">' + escapeHTML(x) + "</span>"; }).join("") + "</div></div>";
  return trainCard + otherCard + ownCard;
}

// ----- 🏆 기록 -----
function playerRecordsHTML() {
  const x = careerRecordParts();
  const sum = careerSummary(true);
  const gradeCard = '<div class="card"><h2>엔딩 등급 예상 <span class="muted small">지금 은퇴하면</span></h2>' +
    '<p><span class="grade-big">' + "★".repeat(sum.stars) + "</span> <b>" + escapeHTML(sum.grade) + '</b> <span class="muted small">커리어 점수 ' + sum.points + "점</span></p>" +
    '<p class="muted small">' + escapeHTML(sum.gradeText) + " · 우승·수상·최고 종합 능력·1부 시즌 수로 점수가 쌓여요.</p></div>";
  return x.summary + gradeCard + highlightStatsHTML() + x.season;
}

// 경기 흐름 내 장면 통계 (이번 시즌 / 통산)
function highlightStatsHTML() {
  const ev = state.career.ev;
  if (!ev) return '<div class="card"><h2>🎬 내 경기 장면</h2><p class="muted">아직 경기 흐름 기록이 없어요. 경기를 치르면 바론 스틸·슈퍼플레이·실수 같은 내 장면이 여기 쌓여요.</p></div>';
  const season = ev.year === state.year ? ev.season : {};
  const ids = Object.keys(ev.total);
  const groups = {};
  ids.forEach(function (id) {
    const info = matchEventInfo({ e: id });
    if (!info) return;
    const kind = id === "solo" || id.indexOf("fin:") === 0 ? "good" : (findMatchEvent(id) || {}).kind || "good";
    const key = kind === "bad" ? "bad" : kind === "psych" ? "psych" : "good";
    (groups[key] = groups[key] || []).push({ id: id, info: info, s: season[id] || 0, t: ev.total[id] });
  });
  const sumOf = function (list, k) { return (list || []).reduce(function (a, x) { return a + x[k]; }, 0); };
  const block = function (key, title) {
    const list = (groups[key] || []).sort(function (a, b) { return b.t - a.t; });
    if (!list.length) return "";
    return '<h2 class="sub">' + title + ' <span class="muted small">이번 시즌 ' + sumOf(list, "s") + "회 · 통산 " + sumOf(list, "t") + "회</span></h2>" +
      '<div class="chips">' + list.map(function (x) {
        return '<span class="chip' + (key === "bad" ? " bad" : key === "good" ? " good" : "") + '">' + x.info.icon + " " + escapeHTML(x.info.name) + " <b>" + x.s + "</b>" +
          ' <span class="muted">/ ' + x.t + "</span></span>";
      }).join("") + "</div>";
  };
  return '<div class="card"><h2>🎬 내 경기 장면 <span class="muted small">경기 흐름에서 내가 주인공인 장면 · 숫자 = 이번 시즌 / 통산</span></h2>' +
    block("good", "⭐ 좋은 장면") + block("bad", "💀 실수") + block("psych", "🧠 심리") + "</div>";
}

// ----- ⏳ 나이·은퇴 -----
function playerAgeHTML() {
  return retireCardHTML() + recentLogHTML();
}
