// ===== 게임 상태 =====
// 게임의 모든 정보는 state 안에 모아 둡니다.
// 새 게임을 시작할 때의 기본값
// player가 null이면 아직 캐릭터를 만들지 않은 상태 → 캐릭터 생성 화면이 나옵니다.
function createNewState() {
  return {
    player: null,                 // { name, position, archetype, age, traits } (캐릭터 생성 때 채워짐)
    team: "무소속",                // 소속팀 이름 (리그가 생기면 myTeam()을 씀)
    league: null,                 // 리그 정보: 구단·선수·경기 기록 (js/league.js)
    money: 0,
    year: 2012,                   // 현재 연도 (= 시즌). 캐릭터 생성 때 고른 시작 연도
    week: 1,                      // 1 ~ 52주차
    stats: {},                    // 실력 스탯 12개 (캐릭터 생성 때 채워짐)
    stamina: 0,                   // 체력
    staminaMax: 0,                // 체력 최대치
    condition: CONDITION_START,   // 컨디션
    popularity: POPULARITY_START, // 인기도
    reputation: REPUTATION_START, // 평판 (-100 ~ +100)
    mastery: {},                  // 챔피언 숙련도 { 챔피언 이름: 1 ~ 100 }
    meta: null,                   // 지금 패치 { label, champs: { top: [...], ... } }
    practiceChamp: "",            // 챔피언 연습에서 고른 챔피언 ("" = 자동)
    inbox: [],                    // SNS 메시지 (js/events.js)
    msgSeq: 0,                    // 메시지 번호
    eventCooldown: {},            // 이벤트별 마지막으로 온 주
    career: { finalsWon: 0, gainTried: {}, seasonGames: 0, games: 0, wins: 0 }, // 커리어 기록
    contract: null,               // 내 계약 { teamId, salary, endYear, guarantee } (js/contracts.js)
    pendingMove: null,            // 새 시즌에 옮길 팀 (이적 합의)
    benched: false,               // true면 후보 (2군행) — 경기에 못 나감
    benchWeeks: 0,                // 후보로 지낸 주
    transferListed: false,        // 이적 희망 (비시즌 제안 늘어남)
    transferRequestsLeft: 0,      // 이번 비시즌 이적 요청 남은 횟수
    soloRank: { points: LADDER.startPoints, wins: 0, losses: 0, peak: LADDER.startPoints }, // 솔로 랭크 (가상 래더)
    weekReport: null,             // 대시보드 "지난주 결과" (js/dashboard.js)
    skipTraining: false,          // true면 다음 주 훈련 대신 휴식 (이벤트 효과)
    matchBoost: 0,                // 다음 경기 경기력 보너스 (이벤트 효과)
    plan: null,                   // 이번 주에 고른 훈련 id
    log: [],                      // 최근 주간 결과 (최신이 맨 앞)
    settings: { autoSave: true }, // 게임 설정
    notice: "",                   // 화면에 잠깐 띄울 안내 문구
    currentMenu: "dashboard",
  };
}

// 게임 시작 때 채워집니다 (맨 아래 참고)
let state;

// ===== 작은 도우미 함수 =====
// 글자 속 <, > 같은 기호가 화면을 망가뜨리지 않게 바꾸기
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// min ~ max 사이 정수 하나를 무작위로 뽑기
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 배열에서 하나를 무작위로 뽑기
function pick(list) {
  return list[randInt(0, list.length - 1)];
}

// 값이 0 ~ 100을 벗어나지 않게 자르기
function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function findTraining(id) {
  return TRAININGS.find(function (t) { return t.id === id; });
}

// 스탯 id 또는 "condition"을 화면용 이름으로
// 스탯 id 또는 체력·컨디션·인기도 id를 화면용 이름으로
function statName(id) {
  if (id === "mastery") return "챔피언 숙련도";
  if (id.indexOf("m:") === 0) return id.slice(2) + " 숙련도";
  const found = STATS.concat(GAUGES).find(function (s) { return s.id === id; });
  return found ? found.name : id;
}

// 숫자 막대 하나 (스탯, 체력, 컨디션 표시에 사용)
// - bonus: true면 ★ 표시 (포지션 가산점)
// - max: 최대치가 100이 아닐 때 (예: 체력 72 / 80)
function barHTML(label, value, desc, bonus, max) {
  const valueText = max ? value + '<span class="muted small">/' + max + "</span>" : value;
  return (
    '<div class="stat">' +
      '<div class="stat-label' + (bonus ? " bonus" : "") + '" title="' + (desc || "") + '">' + (bonus ? "★ " : "") + label + "</div>" +
      '<div class="bar"><div class="bar-fill' + (bonus ? " gold" : "") + '" style="width:' + value + '%"></div></div>' +
      '<div class="stat-value">' + valueText + "</div>" +
    "</div>"
  );
}

// "피지컬 +2, 컨디션 -15" 같은 변화 문장 만들기
function changesText(changes) {
  return Object.keys(changes || {}).filter(function (id) {
    return Number(changes[id]) !== 0; // 변화 없는 것은 숨김
  }).map(function (id) {
    const n = Number(changes[id]) || 0;
    const cls = n >= 0 ? "up" : "down";
    return '<span class="' + cls + '">' + statName(id) + " " + (n >= 0 ? "+" : "") + n + "</span>";
  }).join(", ");
}

// ===== 화면별 그리기 함수 =====
// 메뉴 id와 같은 이름으로 함수를 등록하면 그 화면이 표시됩니다.
// 등록되지 않은 메뉴는 "준비 중"으로 보입니다.
const pages = {};

pages.dashboard = function () {
  const p = state.player;
  const pos = findPosition(p.position);
  const arch = findArchetype(p.archetype);

  const traitsHTML = p.traits.map(traitChipHTML).join("") || '<span class="muted">없음</span>';

  // 챔피언: 내 포지션 메타 + 숙련도 상위 5
  const metaMine = state.meta.champs[p.position].map(function (name) {
    return '<span class="chip meta">' + name + " " + (state.mastery[name] || 1) + "</span>";
  }).join("");
  const top5 = myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; }).slice(0, 5);
  const topHTML = top5.map(function (name) { return masteryRowHTML(name); }).join("");

  let statsHTML = "";
  STATS.forEach(function (s) {
    statsHTML += barHTML(s.name, state.stats[s.id], s.desc, isBonusStat(s.id));
  });

  const plan = state.plan ? findTraining(state.plan).name : "아직 안 정함";

  let logHTML = '<p class="placeholder">아직 기록이 없습니다. 훈련을 고르고 [다음 주로 진행]을 눌러 보세요.</p>';
  if (state.log.length > 0) {
    logHTML = state.log.map(function (entry) {
      return (
        '<div class="log-entry">' +
          '<div class="log-head">' + escapeHTML(entry.when) + " · " + escapeHTML(entry.training) + "</div>" +
          "<div>" + escapeHTML(entry.message) + "</div>" +
          '<div class="log-changes">' + changesText(entry.changes) + "</div>" +
        "</div>"
      );
    }).join("");
  }

  return (
    "<h1>대시보드</h1>" +
    weekReportHTML() +
    upcomingHTML() +
    summaryRowHTML() +
    '<div class="grid">' +
      '<div class="card"><h2>프로필</h2>' +
        '<p class="profile-name">' + escapeHTML(p.name) + "</p>" +
        '<p class="muted">' + p.age + "세 · " + pos.name + " · " + arch.name + "</p>" +
        '<h2 class="sub">특성</h2><div class="chips">' + traitsHTML + "</div>" +
      "</div>" +
      '<div class="card"><h2>상태</h2>' +
        barHTML("체력", state.stamina, "훈련·경기로 줄고 휴식으로 회복", false, state.staminaMax) +
        barHTML("컨디션", state.condition, "이번 주의 몸과 마음 상태") +
        barHTML("인기도", state.popularity, "팬과 업계의 관심") +
        reputationBarHTML() +
        '<h2 class="sub">이번 주 할 일</h2><p>훈련: <b>' + plan + "</b></p>" +
      "</div>" +
    "</div>" +
    '<div class="card"><h2>내 스탯 <span class="muted small"><span class="bonus">★</span> 포지션 가산점</span></h2>' +
      '<div class="stat-columns">' + statsHTML + "</div>" +
      '<h2 class="sub">유형 스탯 <span class="muted small">높을수록 그 유형 챔피언 숙련도가 잘 올라요 (괄호 = 숙련도 성장 보너스)</span></h2>' +
      '<div class="stat-columns type-stats">' + typeScoresHTML() + "</div>" +
    "</div>" +
    leagueDashboardHTML() +
    '<div class="card"><h2>챔피언 <span class="muted small">' + escapeHTML(state.meta.label) + "</span></h2>" +
      '<p class="muted small">이번 패치 ' + pos.name + " 메타 챔피언 (숫자는 내 숙련도)</p>" +
      '<div class="chips">' + metaMine + "</div>" +
      '<h2 class="sub">내 숙련도 상위 5</h2>' + topHTML +
      '<p class="muted small">전체 목록은 [나의 커리어]에서 볼 수 있어요.</p>' +
    "</div>" +
    '<div class="card"><h2>최근 기록</h2>' + logHTML + "</div>"
  );
};

// 유형 스탯 4개 막대
function typeScoresHTML() {
  return CHAMPION_TYPES.map(function (t) {
    const v = typeScore(t.id);
    const names = t.stats.map(statName).join("·");
    const bonus = typeMasteryBonus(t.id);
    return (
      '<div class="stat">' +
        '<div class="stat-label tip" tabindex="0" data-tip="' + t.desc + " / " + names + ' 평균">' + t.name + "</div>" +
        '<div class="bar"><div class="bar-fill type-' + t.id + '" style="width:' + v + '%"></div></div>' +
        '<div class="stat-value">' + v + (bonus > 0 ? ' <span class="up small">(' + percentText(bonus) + ")</span>" : "") + "</div>" +
      "</div>"
    );
  }).join("");
}

// 평판 막대 (-100 ~ +100, 가운데가 0)
function reputationBarHTML() {
  const v = state.reputation;
  const left = v < 0 ? 50 + v / 2 : 50;
  const width = Math.abs(v) / 2;
  return (
    '<div class="stat">' +
      '<div class="stat-label tip" tabindex="0" data-tip="-100 ~ +100. 좋은 이미지인지 나쁜 이미지인지. 구단 제안·이적에 영향">평판</div>' +
      '<div class="bar rep-bar"><div class="rep-mid"></div><div class="bar-fill ' + (v < 0 ? "neg" : "pos") + '" style="margin-left:' + left + "%;width:" + width + '%"></div></div>' +
      '<div class="stat-value ' + (v < 0 ? "down" : v > 0 ? "up" : "") + '">' + (v > 0 ? "+" : "") + v + "</div>" +
    "</div>"
  );
}

// 챔피언 숙련도 한 줄
function masteryRowHTML(name) {
  const v = state.mastery[name];
  return (
    '<div class="stat mastery-row">' +
      '<div class="stat-label">' + name + ' <span class="type-tag ' + findChampion(name).type + '">' + findChampionType(findChampion(name).type).name.slice(0, 2) + "</span>" +
        (isMeta(name) ? ' <span class="meta-tag">META</span>' : "") + "</div>" +
      '<div class="bar"><div class="bar-fill' + (isMeta(name) ? " gold" : "") + '" style="width:' + v + '%"></div></div>' +
      '<div class="stat-value">' + v + "</div>" +
    "</div>"
  );
}

// ===== 시즌 일정 (52주 달력) =====
pages.schedule = function () {
  const rows = SCHEDULE.map(function (s) {
    const now = state.week >= s.from && state.week <= s.to;
    const weeks = s.from === s.to ? s.from + "주" : s.from + " ~ " + s.to + "주";
    const tag = s.international ? ' <span class="meta-tag">국제</span>' : s.empty ? ' <span class="muted small">(비어 있음)</span>' : "";
    const patch = MASTERY.patchWeeks.filter(function (w) { return w >= s.from && w <= s.to; }).length ? ' <span class="chip meta">패치</span>' : "";
    return (
      '<tr class="' + (now ? "now" : "") + (state.week > s.to ? " past" : "") + '">' +
        "<td>" + weeks + "</td>" +
        "<td><b>" + s.name + "</b>" + tag + patch + (now ? ' <span class="now-tag">지금</span>' : "") + "</td>" +
        '<td class="muted">' + s.desc + "</td>" +
      "</tr>"
    );
  }).join("");
  return (
    "<h1>시즌 일정</h1>" +
    '<div class="card"><h2>' + state.year + "년 시즌 · " + state.week + "주차</h2>" +
      '<p class="muted small">2026년 실제 리그 일정을 바탕으로 한 52주 달력이에요. 경기는 3단계에서 추가돼요.</p>' +
      '<table class="schedule">' + rows + "</table>" +
    "</div>" +
    userScheduleHTML() +
    '<div class="card"><h2>월드 챔피언십</h2>' +
      "<p>우리 리그 상위 <b>" + WORLDS.myRegionSlots + "팀</b> + 해외 가상 지역 " +
        WORLDS.regions.map(function (r) { return r.name + " " + r.teams + "팀"; }).join(", ") + "</p>" +
      '<p class="muted">' + WORLDS.format + "</p>" +
    "</div>"
  );
};

// ===== 나의 커리어: 챔피언 숙련도 =====
let championTab = ""; // 보고 있는 포지션 탭 (저장 안 함)

pages.career = function () {
  if (!championTab) championTab = state.player.position;
  const tabs = POSITION_IDS.map(function (id) {
    const pos = findPosition(id);
    return '<button data-ctab="' + id + '"' + (championTab === id ? ' class="primary"' : "") + ">" + pos.name + "</button>";
  }).join("");

  const names = Object.keys(state.mastery)
    .filter(function (name) { return findChampion(name).positions.indexOf(championTab) !== -1; })
    .sort(function (a, b) { return state.mastery[b] - state.mastery[a] || a.localeCompare(b); });
  const rows = names.map(masteryRowHTML).join("");

  const upcoming = CHAMPIONS.filter(function (c) { return state.mastery[c.name] === undefined; });
  const next = upcoming.length
    ? "다음 출시 예정: <b>" + upcoming[0].name + "</b> (" + upcoming[0].released + ")"
    : "모든 챔피언이 출시됐어요.";

  // 경기력 미리보기 (밴 2명 기준)
  const m = matchPower();
  const mp = m.meta;
  const preview =
    '<div class="card"><h2>경기력 미리보기 <span class="muted small">상대가 내 챔피언 ' + MATCH.bansAgainstMe + "명을 밴했을 때 (3단계 경기 판정에 쓰여요)</span></h2>" +
      '<table class="calc">' +
        "<tr><td>스탯 점수</td><td>12개 평균, ★가산점 " + POSITION_BONUS.matchMultiplier + "배</td><td><b>" + m.score.toFixed(1) + "</b></td></tr>" +
        "<tr><td>밴 당한 챔피언</td><td colspan=\"2\">" + (m.banned.join(", ") || "없음") + "</td></tr>" +
        "<tr><td>고른 챔피언</td><td>" + m.pick + " (숙련도 " + state.mastery[m.pick] + (isMeta(m.pick) ? ", 메타" : "") + ")</td><td>× <b>" + m.multiplier.toFixed(2) + "</b></td></tr>" +
        "<tr><td>메타 페널티</td><td>메타 챔피언 평균 숙련도 " + mp.avg.toFixed(0) +
          (mp.adapting ? " · 패치 적응 기간 (적응력 −" + Math.round(mp.adaptCut * 100) + "%" + (mp.stubborn ? ", 고집 +" + mp.stubborn : "") + ")" : "") +
          "</td><td>− <b>" + mp.penalty.toFixed(1) + "</b></td></tr>" +
        '<tr class="total"><td>경기력</td><td>스탯 점수 × 숙련도 배율 − 메타 페널티</td><td><b>' + m.power.toFixed(1) + "</b></td></tr>" +
      "</table>" +
    "</div>";

  return (
    "<h1>나의 커리어</h1>" + careerRecordHTML() + preview +
    '<div class="card"><h2>챔피언 숙련도 <span class="muted small">' + escapeHTML(state.meta.label) + "</span></h2>" +
      '<p class="muted small">1 = 한 번도 안 해 본 챔피언, 100 = 완벽하게 다룸. 금색 막대 = 이번 패치 메타 챔피언. ' +
        "지금까지 출시된 챔피언 " + Object.keys(state.mastery).length + "명 · " + next + "</p>" +
      '<div class="buttons">' + tabs + "</div>" +
      '<div class="stat-columns mastery-list">' + rows + "</div>" +
    "</div>" +
    ""
  );
};

// 챔피언 연습에서 연습할 챔피언 고르기
function practiceSelectHTML() {
  const options = myPositionChampions().map(function (name) {
    return '<option value="' + name + '"' + (state.practiceChamp === name ? " selected" : "") + ">" +
      name + (isMeta(name) ? " ★메타" : "") + " · " + findChampionType(findChampion(name).type).name +
      " (숙련도 " + state.mastery[name] + ", 성장 " + percentText(masteryGrowthMultiplier(name) - 1) + ")</option>";
  }).join("");
  return (
    '<p class="effects"><label>연습할 챔피언 ' +
      '<select id="practice-champ"><option value="">자동 (메타·낮은 숙련도 3명에게 나눠서)</option>' + options + "</select>" +
    "</label></p>"
  );
}

pages.training = function () {
  let cards = "";
  TRAININGS.forEach(function (t) {
    const selected = state.plan === t.id;
    const sign = function (n) { return (n > 0 ? "+" : "") + n; };
    const effects = Object.keys(t.effects).map(function (id) {
      const r = t.effects[id];
      let text = (isBonusStat(id) ? '<span class="bonus">★</span>' : "") + statName(id) + " " + sign(r[0]) + " ~ " + sign(r[1]);
      // 내 보너스 표시
      let extra = 0;
      if (state.stats[id] !== undefined && r[1] > 0) extra = trainingBonusFor(id);
      if (id === "stamina" && r[1] < 0) extra = staminaCostMultiplier() - 1;
      if (id === "popularity" && r[1] > 0) extra = popularityMultiplier() - 1;
      if (id === "mastery") extra = masteryGrowthMultiplier() - 1;
      if (Math.abs(extra) > 0.001) text += ' <span class="' + (extra > 0 === (id !== "stamina") ? "up" : "down") + '">(' + percentText(extra) + ")</span>";
      return text;
    }).join("<br>");

    cards +=
      '<div class="card training' + (selected ? " selected" : "") + '">' +
        "<h2>" + t.name + "</h2>" +
        "<p>" + t.desc + "</p>" +
        '<p class="effects">' + effects + "</p>" +
        (t.effects.mastery ? practiceSelectHTML() : "") +
        '<button data-plan="' + t.id + '"' + (selected ? ' class="primary"' : "") + ">" +
          (selected ? "✔ 선택됨" : "이번 주 훈련으로 선택") +
        "</button>" +
      "</div>";
  });

  const tired = state.stamina < TIRED_LIMIT
    ? '<div class="notice">체력이 ' + state.stamina + "밖에 남지 않았어요. 체력이 " + TIRED_LIMIT + " 미만이면 훈련 효과가 절반이 돼요. 휴식을 고려해 보세요.</div>"
    : "";
  return (
    "<h1>훈련</h1>" + tired +
    '<p class="placeholder">이번 주에 할 훈련을 고른 뒤, 위의 [다음 주로 진행]을 누르세요. 괄호 안은 포지션 가산점·유형·특성으로 받는 내 보너스예요.</p>' +
    '<div class="grid">' + cards + "</div>"
  );
};

pages.settings = function () {
  const last = lastSavedText();
  return (
    "<h1>설정 및 저장</h1>" +
    '<div class="card"><h2>저장</h2>' +
      '<p class="placeholder">마지막 저장: ' + (last || "없음") + "</p>" +
      '<div class="buttons">' +
        '<button class="primary" data-action="save">저장하기</button>' +
        '<button data-action="load">불러오기</button>' +
      "</div>" +
    "</div>" +
    '<div class="card"><h2>세이브 파일</h2>' +
      '<p class="placeholder">세이브를 파일로 내려받아 보관하거나, 보관한 파일을 다시 가져올 수 있어요.</p>' +
      '<div class="buttons">' +
        '<button data-action="export">세이브 내보내기</button>' +
        '<button data-action="import">세이브 가져오기</button>' +
        '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
      "</div>" +
    "</div>" +
    '<div class="card"><h2>게임 설정</h2>' +
      '<div class="setting-row">' +
        '<label for="player-name">선수 이름</label>' +
        '<input type="text" id="player-name" maxlength="20" value="' + escapeHTML(state.player.name) + '">' +
        '<button data-action="rename">이름 바꾸기</button>' +
      "</div>" +
      '<div class="setting-row">' +
        '<label><input type="checkbox" id="auto-save"' + (state.settings.autoSave ? " checked" : "") + "> 자동 저장 (다음 주로 진행할 때마다 저장)</label>" +
      "</div>" +
    "</div>" +
    '<div class="card"><h2>새 게임</h2>' +
      '<p class="placeholder">캐릭터 생성부터 다시 시작합니다. 커리어를 시작하기 전까지는 기존 저장이 남아 있어요.</p>' +
      '<button class="danger" data-action="new-game">새 게임 시작</button>' +
    "</div>"
  );
};

// 설정 화면의 버튼 동작
const settingsActions = {
  save: function () {
    showNotice(saveGame() ? "저장했어요." : "저장하지 못했어요. 브라우저 설정에서 저장소가 막혀 있는지 확인해 주세요.");
  },
  load: function () {
    const loaded = loadGame();
    if (!loaded) return showNotice("저장된 게임이 없어요.");
    if (!confirm("마지막으로 저장한 때로 되돌릴까요?\n저장하지 않은 진행은 사라집니다.")) return;
    replaceState(loaded, "settings", "불러왔어요.");
  },
  export: function () {
    exportSave();
    showNotice("세이브 파일을 내려받았어요. 보통 '다운로드' 폴더에 있어요.");
  },
  import: function () {
    document.getElementById("import-file").click();
  },
  rename: function () {
    const name = document.getElementById("player-name").value.trim();
    if (!name) return showNotice("이름을 한 글자 이상 입력해 주세요.");
    state.player.name = name.slice(0, 20);
    if (state.settings.autoSave) saveGame();
    renderTopbar();
    showNotice("이름을 '" + escapeHTML(state.player.name) + "'(으)로 바꿨어요.");
  },
  "new-game": function () {
    if (!confirm("새 게임을 시작할까요?\n캐릭터 생성 화면으로 이동합니다.\n새 캐릭터로 [커리어 시작]을 누르면 브라우저에 저장된 게임이 새 게임으로 바뀝니다.")) return;
    const fresh = createNewState();
    fresh.settings.autoSave = state.settings.autoSave;
    replaceState(fresh, "dashboard", "");
  },
};

// 설정 화면이 그려진 뒤 버튼·입력칸 연결
function bindSettings(page) {
  page.querySelectorAll("[data-action]").forEach(function (btn) {
    btn.onclick = settingsActions[btn.getAttribute("data-action")];
  });

  document.getElementById("auto-save").onchange = function () {
    state.settings.autoSave = this.checked;
    showNotice(this.checked ? "자동 저장을 켰어요." : "자동 저장을 껐어요. 진행 후에는 직접 [저장하기]를 눌러 주세요.");
  };

  document.getElementById("player-name").onkeydown = function (e) {
    if (e.key === "Enter") settingsActions.rename();
  };

  document.getElementById("import-file").onchange = function () {
    const file = this.files[0];
    this.value = ""; // 같은 파일을 다시 골라도 동작하게
    if (!file) return;
    importSave(file, function (loaded, error) {
      if (!loaded) return showNotice("가져오지 못했어요: " + escapeHTML(error));
      if (!confirm("이 세이브 파일로 바꿀까요?\n지금 진행은 사라집니다.")) return;
      replaceState(loaded, "settings", "세이브 파일을 가져왔어요.");
      saveGame();
    });
  };
}

// 안내 문구를 띄우고 화면 다시 그리기
function showNotice(text) {
  state.notice = text;
  renderPage();
}

// 게임 상태를 통째로 바꾸기 (불러오기, 새 게임 등)
function replaceState(newState, menu, message) {
  state = newState;
  state.currentMenu = menu;
  state.notice = message;
  renderAll();
}

// ===== 좌측 메뉴 =====
function renderMenu() {
  const menu = document.getElementById("menu");
  menu.innerHTML = "";
  MENUS.forEach(function (item) {
    const li = document.createElement("li");
    li.textContent = item.name;
    // SNS: 안 읽었거나 답하지 않은 받은 연락 수
    const badge = item.id === "sns" ? unreadCount("inbox") : 0;
    if (badge) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = badge;
      li.appendChild(b);
    }
    if (item.id === state.currentMenu) li.classList.add("active");
    li.onclick = function () { selectMenu(item.id); };
    menu.appendChild(li);
  });
}

function selectMenu(id) {
  state.currentMenu = id;
  state.notice = "";
  renderMenu();
  renderPage();
}

// ===== 상단바 =====
function renderTopbar() {
  document.getElementById("topbar").innerHTML =
    '<span class="item"><b>' + state.year + "</b>년 <b>" + state.week + "</b>주차 · " + scheduleOfWeek(state.week).name + "</span>" +
    '<span class="item"><b>' + escapeHTML(state.player.name) + "</b> (" + findPosition(state.player.position).name + ")</span>" +
    '<span class="item"><b>' + escapeHTML(myTeam().name) + "</b> (" + tierName(myTeam().tier) + ")</span>" +
    '<span class="item tip" tabindex="0" data-tip="자금 ' + state.money.toLocaleString() + '원">💰 <b>' + moneyText(state.money) + "</b></span>" +
    '<span class="spacer"></span>' +
    '<span class="topbar-actions">' +
      '<button id="rest-week" class="tip" data-tip="고른 훈련은 그대로 두고 이번 주만 쉬어요 (체력·컨디션 회복)">휴식 주 💤</button>' +
      '<button class="primary" id="next-week">다음 주로 진행 ▶</button>' +
    "</span>";
  document.getElementById("next-week").onclick = function () { nextWeek(false); };
  document.getElementById("rest-week").onclick = function () { nextWeek(true); };
}

// ===== 우측 본문 =====
function renderPage() {
  const page = document.getElementById("page");
  const draw = pages[state.currentMenu];
  let html;
  if (draw) {
    html = draw();
  } else {
    const menu = MENUS.find(function (m) { return m.id === state.currentMenu; });
    html = "<h1>" + menu.name + "</h1>" + '<div class="card placeholder">준비 중입니다.</div>';
  }
  if (state.notice) {
    html = '<div class="notice">' + state.notice + "</div>" + html;
  }
  page.innerHTML = html;

  // 훈련 선택 버튼 연결
  page.querySelectorAll("[data-plan]").forEach(function (btn) {
    btn.onclick = function () {
      state.plan = btn.getAttribute("data-plan");
      state.notice = "";
      renderPage();
    };
  });

  if (state.currentMenu === "settings") bindSettings(page);
  if (state.currentMenu === "sns") bindSns(page);
  bindMarket(page); // 선수 검색·구단 탐색·이적 시장
  bindRecords(page); // 개인 시상

  // 챔피언 연습: 연습할 챔피언 고르기
  const practice = document.getElementById("practice-champ");
  if (practice) practice.onchange = function () { state.practiceChamp = this.value; };

  // 나의 커리어: 포지션 탭
  page.querySelectorAll("[data-stab]").forEach(function (btn) {
    btn.onclick = function () { standingsTab = btn.getAttribute("data-stab"); renderPage(); };
  });
  page.querySelectorAll("[data-ctab]").forEach(function (btn) {
    btn.onclick = function () { championTab = btn.getAttribute("data-ctab"); renderPage(); };
  });
}

// ===== 다음 주로 진행 =====
// restWeek: true면 고른 훈련과 상관없이 이번 주만 휴식 ([휴식 주] 버튼)
function nextWeek(restWeek) {
  restWeek = restWeek === true;
  // 훈련을 안 골랐으면 훈련 화면으로 안내
  if (!state.plan && !state.skipTraining && !restWeek) {
    state.currentMenu = "training";
    state.notice = "이번 주 훈련을 먼저 골라 주세요.";
    renderAll();
    return;
  }

  resetWeekCtx(); // 이번 주에 일어난 일 기록 시작 (이벤트 조건용)

  // 훈련 효과 적용 (이벤트로 "쉰다"를 골랐으면 이번 주는 휴식)
  const training = (state.skipTraining || restWeek) ? findTraining("rest") : findTraining(state.plan);
  state.skipTraining = false;
  const tired = state.stamina < TIRED_LIMIT; // 훈련 전 체력이 너무 낮으면 효과 절반
  const changes = {};
  Object.keys(training.effects).forEach(function (id) {
    const range = training.effects[id];
    let amount = randInt(range[0], range[1]);
    let before;

    if (id === "stamina") {
      if (amount < 0) amount = -roundRandom(-amount * staminaCostMultiplier());
      before = state.stamina;
      state.stamina = Math.max(0, Math.min(state.staminaMax, state.stamina + amount));
      changes[id] = state.stamina - before;
    } else if (id === "condition") {
      before = state.condition;
      state.condition = clamp(state.condition + amount);
      changes[id] = state.condition - before;
    } else if (id === "popularity") {
      if (amount > 0) amount = roundRandom(amount * popularityMultiplier());
      before = state.popularity;
      state.popularity = clamp(state.popularity + amount);
      changes[id] = state.popularity - before;
    } else if (id === "reputation") {
      before = state.reputation;
      state.reputation = Math.max(-100, Math.min(100, state.reputation + amount));
      changes[id] = state.reputation - before;
    } else if (id === "mastery") {
      // 챔피언 숙련도: 고른 챔피언(또는 자동으로 고른 챔피언)들에게
      const gained = practiceChampions(range, tired);
      Object.keys(gained).forEach(function (name) { changes["m:" + name] = gained[name]; });
    } else if (state.stats[id] !== undefined) {
      // 실력 스탯: 오를 때만 보너스(가산점·유형·특성)를 붙임
      if (amount > 0) {
        let boosted = amount * (1 + trainingBonusFor(id));
        if (tired) boosted *= 0.5;
        amount = roundRandom(Math.max(0, boosted));
      }
      before = state.stats[id];
      state.stats[id] = clamp(state.stats[id] + amount);
      changes[id] = state.stats[id] - before;
    }
  });

  let message = pick(training.messages);
  const gainsStats = Object.keys(training.effects).some(function (id) { return state.stats[id] !== undefined || id === "mastery"; });
  if (tired && gainsStats) message += " (너무 지쳐서 훈련 효과가 절반이었다.)";

  // 결과 기록 (최근 10개만 보관)
  state.log.unshift({
    when: state.year + "년 " + state.week + "주차",
    training: training.name,
    message: message,
    changes: changes,
  });
  // 솔로 랭크(가상 래더)와 지난주 결과 기록 시작
  startWeekReport(training, message, changes, playLadder(training));

  // 이번 주 리그 경기 (훈련 다음에 진행), 연봉 1주치
  const playedWeek = state.week;
  playLeagueWeek(state.week);
  finishWeekReport(playedWeek, state.league.season.matches);
  paySalary();

  // 주 넘기기. 고른 훈련은 다음 주에도 그대로 유지됩니다.
  state.week += 1;
  if (state.week > CREATION.weeksPerSeason) {
    // 새해 = 새 시즌. 나이 +1, 승강·선수 성장/은퇴
    saveSeasonHistory();
    state.year += 1;
    state.week = 1;
    state.player.age += 1;
    const leagueNews = newSeasonLeague().concat(contractsNewSeason());
    initContracts(); // 새로 들어온 신인들 계약
    addNews("새 시즌", state.year + "년 시즌이 시작됐다. " + escapeHTML(state.player.name) + " 선수는 이제 " + state.player.age + "세. 소속: " + myTeam().name + " (" + tierName(myTeam().tier) + ")");
    leagueNews.forEach(function (text) { addNews("승강", text); });
  }

  // 이번 주에 출시된 새 챔피언 (숙련도 1부터 시작)
  newlyReleased(state.year, state.week).forEach(function (c) {
    if (state.mastery[c.name] !== undefined) return;
    state.mastery[c.name] = MASTERY.min;
    state.weekCtx.newChamps.push(c);
    const posNames = c.positions.map(function (id) { return findPosition(id).name; }).join("·");
    addNews("새 챔피언", "새 챔피언 '" + c.name + "'(" + posNames + ")이(가) 출시됐다!");
  });

  // 패치 주차면 메타가 바뀜
  if (MASTERY.patchWeeks.indexOf(state.week) !== -1) {
    state.meta = makePatch(state.year, state.week);
    const mine = state.meta.champs[state.player.position].join(", ");
    addNews("패치", state.meta.label + " 적용! " + findPosition(state.player.position).name + " 메타 챔피언: " + mine);
    state.weekCtx.patch = true;
    // 패치마다 솔로 랭크 초기화
    const oldPoints = resetLadder();
    if (oldPoints !== undefined) addNews("랭크 초기화", "패치로 솔로 랭크가 초기화됐다. (" + ladderTier(oldPoints) + " " + oldPoints.toLocaleString() + "점 → " + ladderTier(LADDER.resetPoints) + " " + LADDER.resetPoints.toLocaleString() + "점)");
    // 숙련도 1위 챔피언이 메타에서 빠졌으면 "너프" 소식 후보
    const top = myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; })[0];
    if (top && !isMeta(top)) state.weekCtx.nerfChamp = top;
  }

  // 2군행/승격 판정, 비시즌 시작이면 재계약·영입 제안
  checkBench();
  if (state.week === CONTRACT.windowStart) startTransferWindow();

  // 이번 주 이벤트 (SNS)
  runWeeklyEvents();
  state.log = state.log.slice(0, 30);
  state.currentMenu = "dashboard";
  state.notice = "";
  if (state.settings.autoSave) saveGame();
  renderAll();
}

// 지난 시즌 우승 기록 남기기 (7단계 역사관에서 사용)
function saveSeasonHistory() {
  saveCareerSeason(); // 내 시즌 기록 (js/records.js)
  const season = state.league.season;
  if (!state.league.history) state.league.history = [];
  const names = {};
  Object.keys(season.champions).forEach(function (k) { names[k] = teamName(season.champions[k]); });
  state.league.history.push({ year: season.year, champions: names, myTeam: myTeam().name });
}

// 소식 기록 (새 시즌, 새 챔피언, 패치 등)
function addNews(title, message) {
  state.log.unshift({
    when: state.year + "년 " + state.week + "주차",
    training: title,
    message: message,
    changes: {},
  });
  if (state.inbox) postMessage("news", "[" + title + "] " + message, message); // SNS 소식 탭에도
  if (state.weekReport) state.weekReport.news.push(message); // 대시보드 지난주 결과에도
}

function renderAll() {
  const creating = !state.player; // 캐릭터가 없으면 캐릭터 생성 화면
  document.getElementById("layout").hidden = creating;
  document.getElementById("creation").hidden = !creating;
  if (creating) {
    renderCreation();
    return;
  }
  document.getElementById("creation").innerHTML = "";
  if (!state.league) makeLeague(); // 예전 세이브: 리그가 없으면 새로 만듦
  if (!state.contract) initContracts(); // 예전 세이브: 계약이 없으면 만듦
  ensureCareerRecords(); // 데뷔 기록 등
  renderMenu();
  renderTopbar();
  renderPage();
}

