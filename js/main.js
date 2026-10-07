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
    career: { finalsWon: 0, gainTried: {}, seasonGames: 0, games: 0, wins: 0, earned: 0, moments: [] }, // 커리어 기록
    retirePlanned: false,         // true면 이번 시즌이 끝날 때 은퇴 (js/retire.js)
    shop: { gear: {}, staff: {}, fame: {}, invest: [], investProfit: 0 }, // 상점 (js/shop.js)
    tutorial: { on: true, done: {}, visited: {} }, // 처음 안내 (js/guide.js). 예전 세이브를 불러오면 꺼짐
    activities: [],               // 오래 가는 계약·활동 (스폰서·개인 방송·라이벌, js/events.js)
    pendingEvents: [],            // 몇 주 뒤에 올 후속 연락
    compPlan: "auto",             // 조합 전략: meta / counter / auto (js/comps.js)
    retired: null,                // 은퇴 후 엔딩 요약 (있으면 엔딩 화면)
    contract: null,               // 내 계약 { teamId, salary, endYear, guarantee } (js/contracts.js)
    pendingMove: null,            // 새 시즌에 옮길 팀 (이적 합의)
    benched: false,               // true면 후보 (2군행) — 경기에 못 나감
    benchWeeks: 0,                // 후보로 지낸 주
    transferListed: false,        // 이적 희망 (비시즌 제안 늘어남)
    transferRequestsLeft: 0,      // 이번 비시즌 이적 요청 남은 횟수
    soloRank: { points: LADDER.startPoints, wins: 0, losses: 0, peak: LADDER.startPoints }, // 솔로 랭크 (가상 래더)
    weekReport: null,             // 대시보드 "지난주 결과" (js/dashboard.js)
    quests: [],                   // 진행 중인 퀘스트 (js/quests.js)
    questSeq: 0,
    focusChamp: "",               // 챔피언 집중 연습에서 고른 챔피언
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
  if (id === "masteryFocus") return "고른 챔피언 숙련도";
  if (id === "masteryMeta") return "메타 챔피언 1명 숙련도";
  if (id === "staminaMax") return "체력 최대치";
  if (id.indexOf("m:") === 0) return id.slice(2) + " 숙련도";
  const found = STATS.concat(GAUGES).find(function (s) { return s.id === id; });
  return found ? found.name : id;
}

// 숫자 막대 하나 (스탯, 체력, 컨디션 표시에 사용)
// - bonus: true면 ★ 표시 (포지션 가산점)
// - max: 최대치가 100이 아닐 때 (예: 체력 72 / 80)
function barHTML(label, value, desc, bonus, max) {
  const valueText = max && max < 100 ? value + '<span class="muted small">/' + max + "</span>" : value;
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
  // 대시보드 (2026-10-06 리뉴얼)
  // 맨 위 요약 4칸 → 왼쪽(이번 주 할 일: 지난주 결과·이번 주·최근 경기) / 오른쪽(내 선수: 프로필·챔피언·솔로 랭크) → 맨 아래 내 스탯
  // 조각들은 js/dashboard.js
  return (
    '<h1 class="dash-title">대시보드' + trophyShelfHTML() + "</h1>" + // 우승 트로피 진열장 (js/trophies.js)
    tutorialCardHTML() + // 📘 처음이라면: 한 줄 (js/guide.js). 🎯 목표는 프로필 카드, 💡 추천은 '이번 주' 카드 안
    dashStripHTML() +
    '<div class="dash">' +
      '<div class="dash-main">' +
        weekReportHTML() +
        thisWeekHTML() +
        recentMatchesHTML() +
      "</div>" +
      '<div class="dash-side">' +
        profileCardHTML() +
        championCardHTML() +
        leagueLadderHTML() +
      "</div>" +
    "</div>" +
    statsCardHTML()
  );
};

// 최근 기록 (훈련·경기·소식 30개) — [선수 정보] ⏳ 나이·은퇴 탭
function recentLogHTML() {
  if (!state.log.length) return "";
  const items = state.log.map(function (entry) {
    return (
      '<div class="log-entry">' +
        '<div class="log-head">' + escapeHTML(entry.when) + " · " + escapeHTML(entry.training) + "</div>" +
        "<div>" + escapeHTML(entry.message) + "</div>" +
        '<div class="log-changes">' + changesText(entry.changes) + "</div>" +
      "</div>"
    );
  }).join("");
  return '<details class="card log-card"><summary><h2>최근 기록 <span class="muted small">주마다 훈련·경기 기록 ' + state.log.length + "개 · 눌러서 펼치기</span></h2></summary>" + items + "</details>";
}

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
// pos: 그 포지션 기준 메타 표시 (기본은 내 포지션)
function masteryRowHTML(name, pos) {
  const v = state.mastery[name];
  return (
    '<div class="stat mastery-row">' +
      '<div class="stat-label">' + name + ' <span class="type-tag ' + findChampion(name).type + '">' + findChampionType(findChampion(name).type).name.slice(0, 2) + "</span>" +
        metaTagHTML(name, pos) + champCompsHTML(name) + sigTagHTML(name) + skinTagHTML(name) + (isJoker(name) ? ' <span class="joker-tag" title="메타가 아니지만 숙련도가 높음: 고르면 경기력 +' + (MATCH.jokerPowerBonus * 100 * jokerFactor(v, false)).toFixed(1) + '% (숙련도 ' + MATCH.jokerFull + '이면 최대 +' + Math.round(MATCH.jokerPowerBonus * 100) + '%)">🃏 조커</span>' : "") +
        (isNewChampBuff(name) && !isMeta(name, pos) ? ' <span class="joker-tag" title="새 챔피언 출시 버프 (다음 패치 전까지): 픽 가치 +' + MATCH.newChamp.pick + ' · 경기력 +' + Math.round(MATCH.newChamp.power * 100) + '%. 다음 패치 때 메타에 들어갈 확률 ' + Math.round(MATCH.newChamp.nextMetaChance * 100) + '%">🆕 출시</span>' : "") + "</div>" +
      '<div class="bar"><div class="bar-fill' + (isMeta(name, pos) ? " gold" : "") + '" style="width:' + v + '%"></div></div>' +
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
      '<p class="muted small">실제 한국 1부 리그(2025년) 일정을 바탕으로 한 52주 달력이에요. 국제대회: First Stand(10~11주) · MSI(25~28주) · 월드(42~46주).</p>' +
      '<table class="schedule">' + rows + "</table>" +
    "</div>" +
    userScheduleHTML() +
    '<div class="card"><h2>월드 챔피언십</h2>' +
      "<p>우리 리그 상위 <b>" + INTL.worldsSeeds + "팀</b> (MSI를 우리 리그 팀이 우승하면 +" + INTL.msiBonusSeeds + "팀) + 해외 가상 지역 " +
        INTL.regions.map(function (r) { return r.name; }).join(", ") + "의 강팀들 = 16팀</p>" +
      '<p class="muted">' + WORLDS.format + "</p>" +
    "</div>"
  );
};

// ===== 선수 정보 화면은 js/player_page.js (예전 '나의 커리어') =====
let championTab = ""; // 챔피언 탭에서 보고 있는 포지션 (저장 안 함)

// 나이와 은퇴 카드 ([선수 정보] ⏳ 나이·은퇴 탭)
function retireCardHTML() {
  const age = state.player.age;
  const start = agingStartAge();
  const agingLine = age >= start
    ? "노화 중: 매년 새해에 반응속도·입력 정확도·체력 최대치가 줄고, 두 스탯 훈련 효과도 " + Math.round(agingTrainingMultiplier("reaction") * 100) + "%로 줄었어요. (운영·오더 같은 머리 스탯은 계속 올릴 수 있어요)"
    : start + "세부터 노화가 시작돼요. (앞으로 " + (start - age) + "년)";
  let planLine = "";
  if (state.retirePlanned) {
    planLine = '<p class="notice-inline">이번 시즌(52주)이 끝나면 은퇴해요.</p>' +
      (age < userMaxAge() ? '<button data-retire="cancel">은퇴 취소 (한 시즌 더 뛰기)</button> ' : "");
  }
  return (
    '<div class="card"><h2>나이와 은퇴</h2>' +
      "<p>" + age + "세 · 프로 " + careerYears() + "년차</p>" +
      '<p class="muted small">' + agingLine + "</p>" +
      '<p class="muted small">평균 은퇴 나이 ' + CAREER.avgRetireAge + "세. " + CAREER.retireAskAge + "세부터 비시즌마다 감독이 은퇴를 물어봐요. 최대 " + userMaxAge() + "세까지 뛸 수 있어요.</p>" +
      planLine +
      '<div class="buttons"><button class="danger" data-retire="now">지금 은퇴하기</button></div>' +
    "</div>"
  );
}

// 챔피언 연습에서 연습할 챔피언 고르기
function champOptionsHTML(selected) {
  return myPositionChampions().map(function (name) {
    const tier = metaTier(name);
    return '<option value="' + name + '"' + (selected === name ? " selected" : "") + ">" +
      name + (tier ? " ★메타 " + tier + "급" : "") + " · " + findChampionType(findChampion(name).type).name +
      " (숙련도 " + state.mastery[name] + ", 성장 " + percentText(masteryGrowthMultiplier(name) - 1) + ")</option>";
  }).join("");
}

// 챔피언 집중 연습: 한 명 고르기 (안 골랐으면 S급 메타)
function focusChamp() {
  return state.focusChamp && state.mastery[state.focusChamp] !== undefined ? state.focusChamp : autoFocusChamp();
}

// 집중 연습 '자동': S급 메타 챔피언 → (숙련도 최대면) 숙련도가 가장 높은 다른 메타 챔피언(최대 미만)
function autoFocusChamp() {
  const s = mySMeta();
  if ((state.mastery[s] || 0) < MASTERY.max) return s;
  const meta = myPositionChampions().filter(function (n) { return isMeta(n) && state.mastery[n] < MASTERY.max; })
    .sort(function (a, b) { return state.mastery[b] - state.mastery[a]; });
  return meta[0] || s;
}

// 집중 연습을 자동으로 고른 상태인가?
function focusIsAuto() {
  return !(state.focusChamp && state.mastery[state.focusChamp] !== undefined);
}

// 훈련 화면은 js/training_page.js

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
      '<div class="setting-row">처음 안내 (📘 대시보드 맨 위) ' +
        (state.tutorial && state.tutorial.on ? '<button data-tutorial="off">끄기</button>' : '<button data-tutorial="on">다시 켜기</button>') +
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
  if (state.league && state.player) placeNamedPlayers(); // 예전 세이브에도 네임드 선수 추가 (선수마다 한 번)
  state.currentMenu = menu;
  state.notice = message;
  renderAll();
}

// ===== 좌측 메뉴 (data/menus.js) =====
// 합친 메뉴(tabs)마다 마지막에 본 탭 (저장 안 함)
const lastMenuTab = {};

// 메뉴 칸(item)이 지금 화면을 포함하나? (합친 메뉴는 탭 중 하나면 해당)
function menuItemActive(item) {
  if (item.id === state.currentMenu) return true;
  return !!(item.tabs && item.tabs.some(function (t) { return t.id === state.currentMenu; }));
}

// 지금 화면이 들어 있는 합친 메뉴 (없으면 null)
function parentMenuOf(pageId) {
  let found = null;
  MENU_GROUPS.forEach(function (g) {
    g.items.forEach(function (item) {
      if (item.tabs && item.tabs.some(function (t) { return t.id === pageId; })) found = item;
    });
  });
  return found;
}

function renderMenu() {
  const menu = document.getElementById("menu");
  menu.innerHTML = "";
  const addItem = function (item, extraClass) {
    const li = document.createElement("li");
    li.textContent = item.name;
    if (extraClass) li.className = extraClass;
    // SNS: 안 읽었거나 답하지 않은 받은 연락 수 + 나를 언급한 안 읽은 선수 SNS 글
    const badge = item.id === "sns" ? unreadCount("inbox") + unreadCount("social") : 0;
    if (badge) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = badge;
      li.appendChild(b);
    }
    if (menuItemActive(item)) li.classList.add("active");
    li.onclick = function () { selectMenu(item.id); };
    menu.appendChild(li);
  };
  MENU_GROUPS.forEach(function (g) {
    const head = document.createElement("li");
    head.className = "menu-group";
    head.textContent = g.title;
    menu.appendChild(head);
    g.items.forEach(function (item) { addItem(item); });
  });
  MENU_BOTTOM.forEach(function (item, i) { addItem(item, i === 0 ? "menu-bottom" : ""); });
}

// id: 화면 id 또는 합친 메뉴 id (합친 메뉴면 마지막에 본 탭, 처음이면 첫 탭)
function selectMenu(id) {
  MENU_GROUPS.forEach(function (g) {
    g.items.forEach(function (item) {
      if (item.id === id && item.tabs) id = lastMenuTab[item.id] || item.tabs[0].id;
    });
  });
  state.currentMenu = id;
  state.notice = "";
  tutorialVisit(id); // 처음 안내: 들어가 본 메뉴 (js/guide.js)
  renderMenu();
  renderPage();
  if (id === "sns") window.scrollTo(0, 0); // SNS에 들어갈 때는 항상 맨 위부터 보기
}

// 합친 메뉴의 화면 위 탭 버튼 + 제목
function subTabsHTML(parent) {
  return "<h1>" + parent.name + "</h1>" +
    '<div class="subtabs">' + parent.tabs.map(function (t) {
      return '<button data-subtab="' + t.id + '"' + (t.id === state.currentMenu ? ' class="primary"' : "") + ">" + t.name + "</button>";
    }).join("") + "</div>";
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
      planBadgeHTML() +
      staminaBadgeHTML() +
      '<button id="rest-week" class="tip" data-tip="고른 훈련은 그대로 두고 이번 주만 쉬어요 (체력·컨디션 회복)">휴식 주 💤</button>' +
      '<button class="primary" id="next-week">다음 주로 진행 ▶</button>' +
    "</span>";
  document.getElementById("next-week").onclick = function () { nextWeek(false); };
  document.getElementById("plan-badge").onclick = function () { selectMenu("training"); };
  document.getElementById("rest-week").onclick = function () { nextWeek(true); };
}

// 상단바: 지금 고른 훈련 ([다음 주로 진행]을 누르면 할 훈련). 누르면 훈련 화면으로
function planBadgeHTML() {
  if (!state.plan) return '<button id="plan-badge" class="plan-badge none">🏋️ 훈련 미선택</button>';
  const t = findTraining(state.plan);
  let extra = "";
  if (state.plan === "champ_focus") extra = focusIsAuto() ? " · 자동(" + focusChamp() + ")" : " · " + focusChamp();
  else if (state.plan === "champion") extra = state.practiceChamp ? " · " + state.practiceChamp : " · 자동";
  return '<button id="plan-badge" class="plan-badge tip" data-tip="[다음 주로 진행]을 누르면 할 훈련이에요. 눌러서 바꾸기">🏋️ ' + t.name + extra + "</button>";
}

// 상단바 체력 표시 (낮으면 빨간색)
function staminaBadgeHTML() {
  const low = state.stamina < TIRED_LIMIT;
  const warn = state.stamina < TEAM_MATCH.lowStaminaLimit;
  const cls = low ? "down" : warn ? "warn" : "";
  const tip = low ? "체력이 너무 낮아요! 훈련 효과가 절반이에요. 휴식을 추천해요."
    : warn ? "체력이 " + TEAM_MATCH.lowStaminaLimit + " 미만이면 경기력이 떨어져요."
    : "훈련·경기로 줄고 휴식으로 회복";
  return '<span class="stamina-badge tip ' + cls + '" tabindex="0" data-tip="' + tip + '">💪 체력 <b>' + state.stamina + "</b>/" + state.staminaMax + "</span>";
}

// ===== 우측 본문 =====
function renderPage() {
  updateTutorial(); // 처음 안내 단계 확인 (js/guide.js)
  renderTopbar(); // 상단바 (고른 훈련·체력이 바뀌었을 수 있어서)
  const page = document.getElementById("page");
  const draw = pages[state.currentMenu];
  let html;
  if (draw) {
    html = draw();
  } else {
    const menu = MENUS.find(function (m) { return m.id === state.currentMenu; });
    html = "<h1>" + menu.name + "</h1>" + '<div class="card placeholder">준비 중입니다.</div>';
  }
  // 합친 메뉴(일정·이적 시장·기록실): 화면 제목 대신 메뉴 제목 + 탭 버튼
  const parent = parentMenuOf(state.currentMenu);
  if (parent) {
    lastMenuTab[parent.id] = state.currentMenu;
    html = subTabsHTML(parent) + html.replace(/^\s*<h1>[\s\S]*?<\/h1>/, "");
  }
  if (state.notice) {
    html = '<div class="notice">' + state.notice + "</div>" + html;
  }
  page.innerHTML = html;
  linkifyNames(page); // 선수·구단 이름을 누르면 선수 검색·구단 탐색으로 (js/links.js)
  maybeShowNews(); // 대회 결과 뉴스 팝업 (js/news_popup.js)
  // 안내 문구에서 SNS로 바로 가기 (예: 선수 SNS 언급 알림 → 💬 선수 SNS 탭)
  page.querySelectorAll("[data-gosns]").forEach(function (el) {
    el.onclick = function () { snsTab = el.getAttribute("data-gosns"); openMsgId = null; selectMenu("sns"); };
    el.onkeydown = function (e) { if (e.key === "Enter") el.onclick(); };
  });
  page.querySelectorAll("[data-subtab]").forEach(function (btn) {
    btn.onclick = function () { selectMenu(btn.getAttribute("data-subtab")); };
  });

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
  bindMatchDetail(page); // 경기 결과 화면 (js/match_detail.js)
  bindCompPlan(page); // 조합 전략 (js/comps.js)
  bindShop(page); // 상점 (js/shop.js)
  bindGuide(page); // 이번 주 추천·처음 안내 (js/guide.js)
  bindTraining(page); // 훈련 화면 (js/training_page.js)
  page.querySelectorAll("[data-retire]").forEach(function (btn) {
    btn.onclick = function () {
      if (btn.getAttribute("data-retire") === "now") return retireNowButton();
      setRetirePlanned(false);
      if (state.settings.autoSave) saveGame();
      showNotice("은퇴를 취소했어요. 한 시즌 더 뛰어요!");
    };
  });

  // 챔피언 연습: 연습할 챔피언 고르기
  const practice = document.getElementById("practice-champ");
  if (practice) practice.onchange = function () { state.practiceChamp = this.value; renderTopbar(); };
  const focusSel = document.getElementById("focus-champ");
  if (focusSel) focusSel.onchange = function () { state.focusChamp = this.value; renderTopbar(); };

  // 퀘스트 [이번 주 훈련으로 선택] (js/quests.js)
  bindQuestPlan(page);

  // 다른 메뉴로 가는 버튼 (예: 대시보드 [훈련 바꾸기])
  page.querySelectorAll("[data-go]").forEach(function (btn) {
    btn.onclick = function () { selectMenu(btn.getAttribute("data-go")); };
  });

  // 대시보드: 리그 솔로 랭크 [전체 보기]/[접기]
  const ladderAll = page.querySelector("[data-ladderall]");
  if (ladderAll) ladderAll.onclick = function () { ladderShowAll = !ladderShowAll; renderPage(); };

  // 선수 정보 챔피언 탭: 포지션 탭
  page.querySelectorAll("[data-stab]").forEach(function (btn) {
    btn.onclick = function () { standingsTab = btn.getAttribute("data-stab"); renderPage(); };
  });
  page.querySelectorAll("[data-radar]").forEach(function (btn) {
    btn.onclick = function () { radarCmp = btn.getAttribute("data-radar"); renderPage(); }; // 스탯 12각형 비교 대상 (js/player_page.js)
  });
  page.querySelectorAll("[data-tlog-year]").forEach(function (btn) {
    btn.onclick = function () { tlogYear = Number(btn.getAttribute("data-tlog-year")); renderPage(); }; // 이적 목록 (js/market_pages.js)
  });
  page.querySelectorAll("[data-tlog-filter]").forEach(function (btn) {
    btn.onclick = function () { tlogFilter = btn.getAttribute("data-tlog-filter"); renderPage(); };
  });
  page.querySelectorAll("[data-ptab]").forEach(function (btn) {
    btn.onclick = function () { playerTab = btn.getAttribute("data-ptab"); renderPage(); };
  });
  page.querySelectorAll("[data-ctab]").forEach(function (btn) {
    btn.onclick = function () { championTab = btn.getAttribute("data-ctab"); renderPage(); };
  });
}

// ===== 다음 주로 진행 =====
// restWeek: true면 고른 훈련과 상관없이 이번 주만 휴식 ([휴식 주] 버튼)
function nextWeek(restWeek) {
  restWeek = restWeek === true;
  if (state.retired) return; // 은퇴한 뒤에는 진행 없음
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
  state.weekCtx.training = training.id; // 선수 SNS용 (이번 주 훈련 글)
  if (training.id === "rest" && state.tutorial) state.tutorial.restDone = true; // 처음 안내: 쉬어 보기
  const tired = state.stamina < TIRED_LIMIT; // 훈련 전 체력이 너무 낮으면 효과 절반
  const changes = {};
  Object.keys(training.effects).forEach(function (id) {
    const range = training.effects[id];
    let amount = randInt(range[0], range[1]);
    let before;

    if (id === "stamina") {
      if (amount < 0) amount = -roundRandom(-amount * staminaCostMultiplier());
      else amount = roundRandom(amount * Math.max(0, 1 + traitEffectSum("restBonus"))); // 회복력 / 올빼미
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
    } else if (id === "masteryFocus") {
      // 챔피언 집중 연습: 고른 챔피언 1명만 크게
      const name = focusChamp();
      const now = state.mastery[name];
      let gain = amount * masteryGrowthMultiplier(name) * Math.max(0.3, 1 - now / 125);
      if (tired) gain *= 0.5;
      state.mastery[name] = Math.min(MASTERY.max, now + roundRandom(gain));
      changes["m:" + name] = state.mastery[name] - now;
    } else if (id === "masteryMeta") {
      // 다른 훈련에 섞인 메타 챔피언 연습: 내 포지션 메타 챔피언 중 숙련도가 가장 낮은 1명
      const name = myPositionChampions().filter(function (n) { return isMeta(n); })
        .sort(function (a, b) { return state.mastery[a] - state.mastery[b]; })[0];
      if (name) {
        const now = state.mastery[name];
        let gain = amount * masteryGrowthMultiplier(name) * Math.max(0.3, 1 - now / 125);
        if (tired) gain *= 0.5;
        state.mastery[name] = Math.min(MASTERY.max, now + roundRandom(gain));
        changes["m:" + name] = state.mastery[name] - now;
      }
    } else if (id === "mastery") {
      // 챔피언 숙련도: 고른 챔피언(또는 자동으로 고른 챔피언)들에게
      const gained = practiceChampions(range, tired);
      Object.keys(gained).forEach(function (name) { changes["m:" + name] = gained[name]; });
    } else if (state.stats[id] !== undefined) {
      // 실력 스탯: 오를 때만 보너스(가산점·유형·특성)를 붙임
      if (amount > 0) {
        let boosted = amount * (1 + trainingBonusFor(id)) * growthMultiplier(state.stats[id], state.player.traits, id) * agingTrainingMultiplier(id); // 높은 스탯일수록 덜 오름, 노화하면 손 스탯 덜 오름
        if (tired) boosted *= 0.5;
        amount = roundRandom(Math.max(0, boosted));
      }
      before = state.stats[id];
      state.stats[id] = capRise(before, clamp(before + amount), userStatCap(id)); // 상한선에서 멈춤
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
  // 훈련 화면 '최근 4주 성장'용 기록 (js/training_page.js)
  state.trainHistory = (state.trainHistory || []).concat([{ name: training.name, changes: changes }]).slice(-8);
  recordStatSnapshot(); // [선수 정보] 능력 변화: 4주 전·시즌 시작 비교 (js/player_page.js)
  // 솔로 랭크(가상 래더)와 지난주 결과 기록 시작
  startWeekReport(training, message, changes, playLadder(training));
  playNpcLadder(); // 다른 선수들도 솔로 랭크 (리그 솔로 랭크 순위)
  npcPractice(); // 다른 선수들도 매주 챔피언 연습 (js/npc_mastery.js)
  progressQuests(training, changes); // 퀘스트 진행 (js/quests.js)

  // 이번 주 리그 경기 (훈련 다음에 진행), 연봉 1주치
  const playedWeek = state.week;
  playLeagueWeek(state.week);
  finishWeekReport(playedWeek, state.league.season.matches);
  // 우리 팀 시즌이 끝났으면 비시즌 시작 (비시즌 솔랭 퀘스트, js/quests.js)
  if (state.career.seasonOverYear !== state.year && userSeasonOver(playedWeek)) startOffseason();
  paySalary();
  payStaff(); // 상점 개인 고용 비용 (js/shop.js)
  payHousing(); // 월세 (js/housing.js)
  runActivities(); // 스폰서·개인 방송 등 매주 효과 (js/events.js)
  weeklyFame(); // 인기도 자연 감소·평판 제자리 찾기·등급 소식 (js/fame.js)
  checkAchievements(); // 업적 도감 (js/collection.js)
  settleInvestments(); // 상점 투자 결과 (js/shop.js)
  // 회복력: 매주 체력 자연 회복
  const regen = traitEffectSum("staminaRegen");
  if (regen) state.stamina = Math.min(state.staminaMax, state.stamina + regen);
  applyHousingWeek(); // 집 효과: 컨디션 회복 + 컨디션 상한 (합숙 40)

  // 주 넘기기. 고른 훈련은 다음 주에도 그대로 유지됩니다.
  const finalLadderBoard = isPrePatchWeek(state.week) ? leagueLadder() : null;
  state.week += 1;
  if (state.week > CREATION.weeksPerSeason) {
    // 새해 = 새 시즌. 나이 +1, 승강·선수 성장/은퇴
    offseasonRecover(state.year); // 시즌 마무리 체력 회복 (비시즌 퀘스트를 받은 시즌)
    endSeasonActivities(); // 시즌 끝까지인 계약·활동 종료
    saveSeasonHistory();
    // 은퇴 (스스로 결정 / 최대 나이 / 받아 줄 팀 없음) → 엔딩
    const retireReason = seasonEndRetireReason();
    if (retireReason) {
      state.week = CREATION.weeksPerSeason;
      finishCareer(retireReason, false);
      renderAll();
      return;
    }
    if (state.league.settledYear !== state.year) settleSeasonClubs(); // 보통 47주에 이미 함 (예전 세이브만 여기서)
    state.year += 1;
    state.week = 1;
    state.player.age += 1;
    applyAging(); // 27세부터 노화 (js/retire.js)
    expireStartTrait(); // 유망주 전용 특성: 4년차부터 사라짐 (js/creation.js)
    const leagueNews = newSeasonLeague().concat(contractsNewSeason()).concat(addBigRookies()); // 대형 신인 (js/league.js)
    initContracts(); // 새로 들어온 신인들 계약
    addNews("새 시즌", state.year + "년 시즌이 시작됐다. " + escapeHTML(state.player.name) + " 선수는 이제 " + state.player.age + "세. 소속: " + myTeam().name + " (" + tierName(myTeam().tier) + ")");
    const NEWS_TAGS = { "🔁": "이적 시장", "🌟": "대형 신인", "📈": "리그 확장", "🆕": "신생 구단", "🌏": "해외 리그" };
    leagueNews.forEach(function (text) {
      const tag = Object.keys(NEWS_TAGS).find(function (k) { return text.indexOf(k) === 0; });
      addNews(tag ? NEWS_TAGS[tag] : "승강", tag ? text.slice(tag.length).trim() : text);
    });
  }

  // 이번 주·다음 주 리그 일정(대진) 미리 만들기 → 대시보드 '이번 주'·'다음 경기'에 바로 보임 (js/matchsim.js)
  prepareWeek(state.week);
  prepareWeek(state.week + 1);

  // 이번 주에 출시된 새 챔피언 (숙련도 1부터 시작)
  newlyReleased(state.year, state.week).forEach(function (c) {
    if (state.mastery[c.name] !== undefined) return;
    state.mastery[c.name] = MASTERY.min;
    state.weekCtx.newChamps.push(c);
    state.newChampBuff = state.newChampBuff || {};
    state.newChampBuff[c.name] = true; // 출시 버프: 다음 패치 전까지 (data/match.js MATCH.newChamp)
    const posNames = c.positions.map(function (id) { return findPosition(id).name; }).join("·");
    addNews("새 챔피언", "새 챔피언 '" + c.name + "'(" + posNames + ")이(가) 출시됐다!");
  });
  ensureNpcMastery(); // 다른 선수들도 새 챔피언 숙련도 1부터

  // 패치 주차면 메타가 바뀜
  if (MASTERY.patchWeeks.indexOf(state.week) !== -1) {
    const prefer = runShakeupIfDue() || {}; // 2~3년마다 대격변 패치 (js/shakeup.js)
    // 지난 패치 뒤 나온 새 챔피언: nextMetaChance 확률로 그 포지션 메타에 (이번 주 출시는 제외)
    Object.keys(state.newChampBuff || {}).forEach(function (name) {
      const c = findChampion(name);
      if (!c || newlyReleased(state.year, state.week).indexOf(c) !== -1 || Math.random() >= MATCH.newChamp.nextMetaChance) return;
      const pos = c.positions[0];
      prefer[pos] = (prefer[pos] || []).concat([name]);
    });
    const keep = {};
    newlyReleased(state.year, state.week).forEach(function (c) { keep[c.name] = true; }); // 패치 주에 나온 챔피언은 버프 유지
    state.newChampBuff = keep;
    state.meta = makePatch(state.year, state.week, prefer);
    const mine = state.meta.champs[state.player.position].join(", ");
    addNews("패치", state.meta.label + " 적용! 메타 조합: " + findComp(metaComp()).icon + " " + findComp(metaComp()).name + " · " + findPosition(state.player.position).name + " 메타 챔피언: " + mine);
    state.weekCtx.patch = true;
    const outlook = npcPatchNews(); // 새 메타에 강한/고전할 선수 (js/npc_mastery.js)
    if (outlook) addNews("패치 전망", outlook);
    shakeupNews(); // 대격변이면 소식·신문 기사
    // 패치마다 솔로 랭크 초기화
    const oldPoints = resetLadder(finalLadderBoard);
    if (oldPoints !== undefined) addNews("랭크 초기화", "패치로 솔로 랭크가 초기화됐다. (" + ladderTier(oldPoints) + " " + oldPoints.toLocaleString() + "점 → " + ladderTier(LADDER.resetPoints) + " " + LADDER.resetPoints.toLocaleString() + "점)");
    // 숙련도 1위 챔피언이 메타에서 빠졌으면 "너프" 소식 후보
    const top = myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; })[0];
    if (top && !isMeta(top)) state.weekCtx.nerfChamp = top;
  }

  // 패치 바로 전 주(28주·52주): 솔로 랭크 초기화 예고
  if (isPrePatchWeek(state.week)) {
    const r = myLadderRank();
    const top = leagueLadder()[0];
    addNews("랭크 초기화 예고", "이번 주가 끝나면 패치로 솔로 랭크가 " + LADDER.resetPoints.toLocaleString() + "점으로 초기화된다. 지금 리그 " + r + "위" +
      (top ? " (1위 " + playerName(top.id) + " " + top.points.toLocaleString() + "점)" : "") + ". 이번 주 끝에 1위면 '" + findTrait(LADDER.kingTrait).name + "' 칭호!");
  }

  // 2군행/승격 판정, 비시즌 시작이면 재계약·영입 제안
  checkBench();
  if (state.week === ALL_STAR.week) runAllStar(); // 올스타전 팬 투표 (js/fame.js)
  if (state.week === SUMMER_MARKET.start) startSummerWindow(); // 여름 이적 기간 (js/summer_market.js)
  if (state.week === SUMMER_MARKET.applyWeek) summerMarket().forEach(function (text) { addNews(text.indexOf("🤝") === 0 ? "임대" : "여름 이적 시장", text.replace(/^(🔁|🤝) /, "")); });
  if (state.week === CONTRACT.windowStart) {
    if (state.league.grownYear !== state.year) {
      npcYearGrowth(1); // 다른 선수들 1년치 성장·노화를 이적 시장 전에 (js/league.js)
      addNews("비시즌", "시즌이 끝나고 다른 선수들의 1년 성장·노화와 구단 스폰서 수입·승강 지원금이 반영됐다. 이적 시장에서 바뀐 능력과 구단 자금을 확인해 보자.");
    }
    settleSeasonClubs(); // 구단 스폰서 수입·저축/빚 정산·승강 지원금도 이적 시장 전에 (성장과 따로, 한 번만 — js/club_market.js)
    askRetirement(); // 29세부터 은퇴 권유 (js/retire.js)
    startTransferWindow();
  }

  // 이번 주 이벤트 (SNS), 퀘스트 기한·새 퀘스트
  checkSignature100(); // 숙련도 100이 된 챔피언 → 시그니처 픽 독백 (js/signature.js)
  runWeeklyEvents();
  updateQuests();
  state.log = state.log.slice(0, 30);
  enforceConditionCap(); // 이벤트로 오른 컨디션도 상한까지만 (js/housing.js)
  state.currentMenu = "dashboard";
  state.notice = state.newMentions
    ? '<span class="notice-go no-link" data-gosns="social" tabindex="0" title="눌러서 선수 SNS 보기">📣 선수 SNS에서 ' + escapeHTML(state.player.name) + " 선수를 언급한 글이 " + state.newMentions + '개 올라왔어요. <b>💬 선수 SNS 보기 ▶</b></span>'
    : "";
  state.newMentions = 0;
  if (state.settings.autoSave) saveGame();
  renderAll();
}

// 지난 시즌 우승 기록 남기기 (7단계 역사관에서 사용)
function saveSeasonHistory() {
  sTraitsOnSeasonEnd(); // 원클럽맨·라인 지배자·한계 돌파 (js/straits.js)
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
  if (state.weekReport) state.weekReport.news.push({ title: title, text: message }); // 대시보드 지난주 결과에도 (제목과 함께)
}

function renderAll() {
  const creating = !state.player; // 캐릭터가 없으면 캐릭터 생성 화면
  const ended = !creating && !!state.retired; // 은퇴했으면 엔딩 화면
  document.getElementById("layout").hidden = creating || ended;
  document.getElementById("creation").hidden = !creating;
  document.getElementById("ending").hidden = !ended;
  if (ended) {
    document.getElementById("creation").innerHTML = "";
    renderEnding();
    window.scrollTo(0, 0);
    return;
  }
  document.getElementById("ending").innerHTML = "";
  if (creating) {
    renderCreation();
    return;
  }
  document.getElementById("creation").innerHTML = "";
  if (!state.league) makeLeague(); // 예전 세이브: 리그가 없으면 새로 만듦
  ensureNpcTraits(); // 예전 세이브: 다른 선수 특성
  ensureWorld(); // 해외 리그 (새 게임·예전 세이브, js/era.js)
  if (state.league && state.league.season) { prepareWeek(state.week); prepareWeek(state.week + 1); } // 새 게임 1주차: 2주차 LCK 컵 대진도 미리
  ensureNpcStyles(); // 예전 세이브: 다른 선수 플레이 스타일 (js/league.js)
  ensureNpcMastery(); // 예전 세이브: 다른 선수 챔피언 숙련도 (js/npc_mastery.js)
  enforceConditionCap(); // 거주지 컨디션 상한 (집이 없으면 합숙, js/housing.js)
  if (!state.contract) initContracts(); // 예전 세이브: 계약이 없으면 만듦
  ensureCareerRecords(); // 데뷔 기록 등
  renderMenu();
  renderTopbar();
  renderPage();
}

