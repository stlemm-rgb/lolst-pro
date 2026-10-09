// ===== 노화 · 은퇴 · 엔딩 · 명예의 전당 · 커리어 주요 순간 =====
// state.retirePlanned: true면 이번 시즌이 끝날 때 은퇴
// state.retired: 은퇴한 뒤 엔딩 요약 (있으면 엔딩 화면이 나옴)
// state.career.moments: [{ year, week, icon, text }] 커리어 주요 순간 (역사관)
// 명예의 전당: 브라우저 저장소에 따로 보관 (새 게임을 해도 남음)

// ----- 커리어 주요 순간 -----
function addMoment(icon, text) {
  if (!state.career) return;
  if (!state.career.moments) state.career.moments = [];
  state.career.moments.push({ year: state.year, week: state.week, icon: icon, text: text });
  state.career.moments = state.career.moments.slice(-120);
}

// 예전 세이브: 지금까지의 우승·수상으로 주요 순간 채우기
function ensureMoments() {
  const c = state.career;
  if (c.moments) return;
  c.moments = [];
  (c.seasons || []).forEach(function (r) {
    r.titles.forEach(function (t) { c.moments.push({ year: r.year, week: 52, icon: "🏆", text: r.team + " " + t }); });
  });
  (c.awards || []).forEach(function (a) { c.moments.push({ year: a.year, week: 52, icon: "🏅", text: a.title + " 수상" }); });
}

// ----- 노화 (새해, 나이가 1살 늘어난 뒤 부름) -----
function agingStartAge() {
  return CAREER.agingStartAge + traitEffectSum("agingDelay"); // 늦게 피는 꽃
}

// 노화 중 반응속도·입력 정확도 훈련 효과 배율 (1 = 그대로)
function agingTrainingMultiplier(statId) {
  if (statId !== "reaction" && statId !== "accuracy") return 1;
  const years = state.player.age - agingStartAge() + 1;
  if (years <= 0) return 1;
  return Math.max(CAREER.agingTrainingMin, 1 - years * CAREER.agingTrainingCut);
}

// 최대 은퇴 나이 (철의 의지 +3)
function userMaxAge() {
  return CAREER.maxAge + traitEffectSum("maxAgeBonus");
}

function applyAging() {
  const age = state.player.age;
  const keep = Math.max(0, 1 - traitEffectSum("agingCut")); // 철의 의지: 절반
  if (age < agingStartAge()) return null;
  const rule = CAREER.aging.find(function (r) { return age <= r.maxAge; });
  const changes = {};
  ["reaction", "accuracy"].forEach(function (id) {
    const before = state.stats[id];
    state.stats[id] = clamp(before - roundRandom(randInt(rule[id][0], rule[id][1]) * keep));
    changes[id] = state.stats[id] - before;
  });
  const beforeMax = state.staminaMax;
  state.staminaMax = Math.max(CAREER.minStaminaMax, state.staminaMax - roundRandom(rule.staminaMax * keep));
  state.stamina = Math.min(state.stamina, state.staminaMax);
  changes.staminaMax = state.staminaMax - beforeMax;
  if (!state.career.agingStarted) {
    state.career.agingStarted = true;
    addMoment("⏳", age + "세, 노화가 시작됐다");
  }
  postMessage("news", "⏳ " + RETIRE_TEXTS.agingTitle + " (" + age + "세)", RETIRE_TEXTS.aging, { changes: changes });
  state.log.unshift({ when: state.year + "년 " + state.week + "주차", training: RETIRE_TEXTS.agingTitle, message: RETIRE_TEXTS.aging, changes: changes });
  return changes;
}

// ----- 은퇴 권유 (비시즌 시작 주에 부름) -----
function careerYears() {
  return state.year - (state.career.debut ? state.career.debut.year : state.year) + 1;
}

function retireText(text) {
  return String(text).replace(/\{age\}/g, state.player.age).replace(/\{years\}/g, careerYears());
}

function askRetirement() {
  if (state.retirePlanned) return;
  const age = state.player.age;
  if (age >= userMaxAge()) {
    state.retirePlanned = true;
    postMessage("inbox", RETIRE_TEXTS.maxAgeTitle, retireText(RETIRE_TEXTS.maxAge), {});
    return;
  }
  if (age < CAREER.retireAskAge) return;
  postMessage("inbox", RETIRE_TEXTS.askTitle, retireText(RETIRE_TEXTS.ask), {
    kind: "retire",
    choices: [{ label: RETIRE_TEXTS.stay }, { label: RETIRE_TEXTS.retire, hint: "시즌(52주)이 끝나면 은퇴하고 엔딩을 봐요. [선수 정보] → ⏳ 나이·은퇴에서 취소할 수 있어요." }],
  });
}

// 은퇴 권유에 답하기 (events.js answerMessage에서 부름)
function answerRetire(msg, index) {
  msg.answered = index;
  msg.read = true;
  if (index === 1) {
    setRetirePlanned(true);
    msg.notes.push(RETIRE_TEXTS.retireNote);
  } else {
    msg.notes.push(RETIRE_TEXTS.stayNote);
  }
}

// 은퇴 예정 켜기/끄기. 켜면 아직 답하지 않은 계약 제안은 정리
function setRetirePlanned(on) {
  state.retirePlanned = on;
  if (!on) return;
  state.inbox.forEach(function (m) {
    if (m.kind === "offer" && m.answered === null) {
      m.answered = "ignored";
      m.read = true;
      m.notes.push("은퇴를 결정해서 정리됐다.");
    }
  });
  state.pendingMove = null;
}

// 새해 직전: 계약이 끝났는데 받아 줄 팀이 없으면 true (29세 이상)
function noTeamWantsMe() {
  if (state.player.age < CAREER.forcedRetireAge) return false;
  if (state.pendingMove || state.contract.endYear > state.year) return false;
  const me = playerScore(USER_ID);
  const rival = benchRival();
  const ownWants = state.reputation >= CONTRACT.noRenewalReputation && !(rival && playerScore(rival) >= me + 10);
  if (ownWants) return false;
  const mine = myTeam();
  return !state.league.teams.some(function (t) {
    const s = starterAt(t.id, state.player.position);
    return t.id !== mine.id && (!s || me > playerScore(s));
  });
}

// 시즌이 끝날 때 은퇴할지 (main.js nextWeek에서 새해 직전에 부름). 은퇴 이유 또는 ""
function seasonEndRetireReason() {
  if (state.player.age >= userMaxAge()) return "나이";
  if (state.retirePlanned) return "선택";
  if (noTeamWantsMe()) return "계약";
  return "";
}

// ----- 엔딩 요약 · 등급 -----
function awardKeyOf(title) {
  title = title.replace(/^컵 대회/, "LCK 컵"); // 예전 세이브의 결승 MVP도 같은 상으로 인정
  const keys = Object.keys(AWARD_NAMES).sort(function (a, b) { return AWARD_NAMES[b].length - AWARD_NAMES[a].length; });
  return keys.find(function (k) { return title.indexOf(AWARD_NAMES[k]) === 0; }) || "";
}

function careerSummary(includeCurrent) {
  ensureCareerRecords();
  const c = state.career;
  const rows = c.seasons.slice();
  if (includeCurrent) rows.push(currentSeasonRecord());
  const sum = { sets: 0, setWins: 0, ratingSum: 0, pog: 0, solo: 0, series: 0, seriesWins: 0, tier1Seasons: 0 };
  const titles = { worlds: 0, msi: 0, playoffs: 0, firststand: 0, cup: 0 };
  const titleList = [];
  const teams = [];
  let peak = c.debut.score;
  rows.forEach(function (r) {
    sum.sets += r.sets; sum.setWins += r.setWins; sum.ratingSum += r.rating * r.sets;
    sum.pog += r.pog; sum.solo += r.solo; sum.series += r.series; sum.seriesWins += r.seriesWins;
    if (r.tier === 1) sum.tier1Seasons++;
    peak = Math.max(peak, r.score);
    if (teams[teams.length - 1] !== r.team) teams.push(r.team); // 소속 순서 (같은 팀 연속은 한 번)
    r.titles.forEach(function (t) {
      if (t.indexOf("월드") === 0) titles.worlds++;
      else if (t.indexOf("MSI") === 0) titles.msi++;
      else if (t.indexOf("First Stand") === 0) titles.firststand++;
      else if (t.indexOf("리그") === 0) titles.playoffs++;
      else if (t.indexOf("LCK 컵") === 0 || t.indexOf("컵") === 0) titles.cup++;
      titleList.push(r.year + " " + t);
    });
  });
  peak = Math.max(peak, playerScore(USER_ID));

  // 커리어 점수
  const P = CAREER.points;
  let points = titles.worlds * P.worlds + titles.msi * P.msi + titles.playoffs * P.playoffs + titles.firststand * P.firststand + titles.cup * P.cup;
  (c.awards || []).forEach(function (a) { points += P[awardKeyOf(a.title)] || 0; });
  points += Math.max(0, Math.round(peak - P.peakFrom)) + sum.tier1Seasons * P.tier1Season;
  // 인성 점수 (커리어 평균 평판, js/fame.js) · 올스타 선정
  const repPoints = typeof reputationPoints === "function" ? reputationPoints() : 0;
  const allstars = c.allstars || 0;
  points += repPoints + allstars * (P.allstar || 0);
  const grade = CAREER.grades.find(function (g) { return points >= g.min; }) || CAREER.grades[CAREER.grades.length - 1]; // 평판이 나빠 점수가 0 아래여도 '평범' (v1.1 버그 수정: 매주 멈추던 문제)

  return {
    name: state.player.name, position: state.player.position, archetype: state.player.archetype,
    traits: state.player.traits.slice(),
    debutYear: c.debut.year, retireYear: state.year, age: state.player.age,
    years: state.year - c.debut.year + 1, teams: teams,
    titles: titles, titleList: titleList, awards: (c.awards || []).map(function (a) { return a.year + " " + a.title; }),
    peak: Math.round(peak * 10) / 10, series: sum.series, seriesWins: sum.seriesWins,
    sets: sum.sets, setWins: sum.setWins, rating: sum.sets ? sum.ratingSum / sum.sets : 0,
    pog: sum.pog, solo: sum.solo, tier1Seasons: sum.tier1Seasons,
    earned: c.earned || 0, soloPeak: state.soloRank ? state.soloRank.peak : 0,
    repPoints: repPoints, avgRep: Math.round(typeof careerAvgReputation === "function" ? careerAvgReputation() : state.reputation), allstars: allstars,
    peakFame: state.fame ? FAME.tiers[state.fame.best || 0].name : "",
    points: points, grade: grade.name, stars: grade.stars, gradeText: grade.text,
  };
}

// ----- 은퇴 처리 -----
// reason: "선택"(직접·권유), "나이"(최대 나이), "계약"(받아 줄 팀 없음), "즉시"(버튼으로 바로)
// includeCurrent: 이번 시즌 기록이 아직 저장 안 됐으면 true
function finishCareer(reason, includeCurrent) {
  const s = careerSummary(includeCurrent);
  s.reason = reason;
  s.retiredAt = state.year + "년 " + state.week + "주차";
  addMoment("🎤", s.age + "세, 은퇴 (" + RETIRE_REASONS[reason] + ")");
  s.moments = state.career.moments.slice();
  s.romance = typeof romanceEndingLine === "function" ? romanceEndingLine() : ""; // 연애 중이면 엔딩에 한 줄 (js/romance.js)
  state.retired = s;
  state.retirePlanned = false;
  addToHallOfFame(s);
  saveGame(); // 엔딩 화면이 다시 열려도 그대로 보이게
}

const RETIRE_REASONS = { "선택": "스스로 은퇴를 결정", "나이": "최대 나이", "계약": "받아 주는 팀이 없음", "즉시": "시즌 중 은퇴" };

// [선수 정보] → ⏳ 나이·은퇴의 은퇴 버튼
function retireNowButton() {
  askConfirm("지금 바로 은퇴할까요?\n커리어가 끝나고 엔딩 화면으로 넘어가요. 되돌릴 수 없어요.", function () {
    finishCareer("즉시", true);
    renderAll();
  }, "은퇴하기");
}

// ----- 명예의 전당 (브라우저 저장소, 새 게임을 해도 남음) -----
function readHallOfFame() {
  try {
    const list = JSON.parse(localStorage.getItem(CAREER.hallOfFameKey) || "[]");
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function addToHallOfFame(s) {
  const list = readHallOfFame();
  const id = s.name + "|" + s.debutYear + "|" + s.retireYear;
  if (list.some(function (h) { return h.id === id; })) return;
  list.push({
    id: id, name: s.name, position: s.position, archetype: s.archetype,
    debutYear: s.debutYear, retireYear: s.retireYear, age: s.age,
    grade: s.grade, stars: s.stars, points: s.points, peak: s.peak,
    titles: s.titles, awards: s.awards.length, teams: s.teams, avgRep: s.avgRep, allstars: s.allstars, savedAt: new Date().toISOString(),
  });
  list.sort(function (a, b) { return b.points - a.points; });
  try {
    localStorage.setItem(CAREER.hallOfFameKey, JSON.stringify(list.slice(0, CAREER.hallOfFameMax)));
  } catch (e) { /* 저장소가 막혀 있으면 그냥 넘어감 */ }
}

function starsText(n) {
  return "★★★★★".slice(0, n) + '<span class="muted">' + "☆☆☆☆☆".slice(0, 5 - n) + "</span>";
}

function hallOfFameHTML(highlightId) {
  const list = readHallOfFame();
  if (!list.length) return '<p class="muted">아직 은퇴한 선수가 없어요. 은퇴하면 여기에 기록돼요. (새 게임을 해도 남아요)</p>';
  const rows = list.map(function (h, i) {
    const t = h.titles || {};
    const titleText = [t.worlds ? "월드 " + t.worlds : "", t.msi ? "MSI " + t.msi : "", t.playoffs ? "리그 " + t.playoffs : "", t.firststand ? "FS " + t.firststand : "", t.cup ? "LCK 컵 " + t.cup : ""].filter(Boolean).join(" · ") || "-";
    return '<tr class="' + (h.id === highlightId ? "me" : "") + '"><td>' + (i + 1) + "</td><td><b>" + escapeHTML(h.name) + "</b> " +
      '<span class="muted small">' + findPosition(h.position).name + " · " + h.debutYear + "~" + h.retireYear + "</span></td>" +
      "<td>" + starsText(h.stars) + " " + escapeHTML(h.grade) + "</td>" +
      "<td>" + titleText + '</td><td class="r">' + h.awards + '</td><td class="r">' + h.peak + '</td><td class="r"><b>' + h.points + "</b></td></tr>";
  }).join("");
  return '<table class="roster"><tr><th>#</th><th>선수</th><th>등급</th><th>우승</th><th class="r">수상</th><th class="r">최고 능력</th><th class="r">커리어 점수</th></tr>' + rows + "</table>";
}

// ----- 엔딩 화면 -----
function renderEnding() {
  const s = state.retired;
  const pos = findPosition(s.position);
  const arch = findArchetype(s.archetype);
  const t = s.titles;
  const chips = function (list, cls) {
    return list.length ? list.map(function (x) { return '<span class="chip ' + cls + '">' + escapeHTML(x) + "</span>"; }).join("") : '<span class="muted">없음</span>';
  };
  const timeline = (s.moments || []).slice().reverse().slice(0, 30).map(function (m) {
    return '<div class="moment"><span class="moment-when muted small">' + m.year + "년 " + m.week + "주</span> " + m.icon + " " + escapeHTML(m.text) + "</div>";
  }).join("");
  const hofId = s.name + "|" + s.debutYear + "|" + s.retireYear;

  document.getElementById("ending").innerHTML =
    '<h1 class="ending-title">🎤 은퇴: ' + escapeHTML(s.name) + "</h1>" +
    '<p class="muted">' + pos.name + " · " + arch.name + " · " + s.debutYear + "~" + s.retireYear + "년 (" + s.years + "시즌) · " + s.age + "세 · " + RETIRE_REASONS[s.reason] + "</p>" +
    '<div class="card ending-grade"><div class="grade-stars">' + starsText(s.stars) + "</div>" +
      '<div class="grade-name">' + escapeHTML(s.grade) + '</div><div class="muted">' + escapeHTML(s.gradeText) + "</div>" +
      '<div class="small muted">커리어 점수 ' + s.points + "점" + (s.repPoints !== undefined ? " (인성 점수 " + (s.repPoints > 0 ? "+" : "") + s.repPoints + " · 평균 평판 " + s.avgRep + (s.allstars ? " · 올스타 " + s.allstars + "회" : "") + (s.peakFame ? " · 최고 스타 등급 " + escapeHTML(s.peakFame) : "") + ")" : "") + " · 명예의 전당에 기록됐어요</div></div>" +
    '<div class="summary-row">' +
      '<div class="card"><div class="sum-label">우승</div><div class="sum-main">' + (t.worlds + (t.msi || 0) + t.playoffs + (t.firststand || 0) + t.cup) + "회</div>" +
        '<div class="sum-sub muted">월드 ' + t.worlds + " · MSI " + (t.msi || 0) + " · 리그 " + t.playoffs + " · First Stand " + (t.firststand || 0) + " · LCK 컵 " + t.cup + "</div></div>" +
      '<div class="card"><div class="sum-label">통산 경기</div><div class="sum-main">' + s.seriesWins + "승 " + (s.series - s.seriesWins) + "패</div>" +
        '<div class="sum-sub muted">세트 ' + s.setWins + "승 " + (s.sets - s.setWins) + "패 · 평점 " + (s.sets ? s.rating.toFixed(2) : "-") + " · POG " + s.pog + "</div></div>" +
      '<div class="card"><div class="sum-label">최고 종합 능력</div><div class="sum-main">' + s.peak + "</div>" +
        '<div class="sum-sub muted">1부 ' + s.tier1Seasons + "시즌 · 솔로 랭크 최고 " + s.soloPeak.toLocaleString() + "점</div></div>" +
      '<div class="card"><div class="sum-label">번 돈 (연봉)</div><div class="sum-main">' + moneyText(s.earned) + "</div>" +
        '<div class="sum-sub muted">소속팀: ' + s.teams.map(escapeHTML).join(" → ") + "</div></div>" +
    "</div>" +
    '<div class="card"><h2>우승</h2><div class="chips">' + chips(s.titleList, "meta") + '</div><h2 class="sub">수상</h2><div class="chips">' + chips(s.awards, "good") + "</div></div>" +
    (s.romance ? '<div class="card"><h2>💕 그 뒤로</h2><p>' + escapeHTML(s.romance) + "</p></div>" : "") +
    '<div class="card"><h2>커리어 주요 순간</h2>' + (timeline || '<p class="muted">기록이 없어요.</p>') + "</div>" +
    '<div class="card"><h2>🏛 명예의 전당</h2>' + hallOfFameHTML(hofId) + "</div>" +
    '<div class="buttons"><button class="primary" id="ending-new">새 선수로 시작</button><button id="ending-export">세이브 내보내기</button></div>';

  document.getElementById("ending-new").onclick = function () {
    const fresh = createNewState();
    fresh.settings.autoSave = state.settings.autoSave;
    replaceState(fresh, "dashboard", "");
  };
  document.getElementById("ending-export").onclick = exportSave;
}
