// ===== 게임 상태 =====
// 게임의 모든 정보는 state 안에 모아 둡니다.
// 새 게임을 시작할 때의 기본값
// player가 null이면 아직 캐릭터를 만들지 않은 상태 → 캐릭터 생성 화면이 나옵니다.
function createNewState() {
  return {
    player: null,                 // { name, position, archetype, age, traits } (캐릭터 생성 때 채워짐)
    team: "무소속",
    money: 0,
    season: 1,
    week: 1,
    stats: {},                    // 실력 스탯 12개 (캐릭터 생성 때 채워짐)
    stamina: 0,                   // 체력
    staminaMax: 0,                // 체력 최대치
    condition: CONDITION_START,   // 컨디션
    popularity: POPULARITY_START, // 인기도
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
  return Object.keys(changes || {}).map(function (id) {
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

  const traitsHTML = p.traits.map(function (id) {
    const t = findTrait(id);
    return t ? '<span class="chip ' + t.type + '" title="' + t.desc + '">' + t.name + "</span>" : "";
  }).join("") || '<span class="muted">없음</span>';

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
        '<h2 class="sub">이번 주 할 일</h2><p>훈련: <b>' + plan + "</b></p>" +
      "</div>" +
    "</div>" +
    '<div class="card"><h2>내 스탯 <span class="muted small"><span class="bonus">★</span> 포지션 가산점</span></h2>' +
      '<div class="stat-columns">' + statsHTML + "</div>" +
    "</div>" +
    '<div class="card"><h2>최근 기록</h2>' + logHTML + "</div>"
  );
};

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
      if (Math.abs(extra) > 0.001) text += ' <span class="' + (extra > 0 === (id !== "stamina") ? "up" : "down") + '">(' + percentText(extra) + ")</span>";
      return text;
    }).join("<br>");

    cards +=
      '<div class="card training' + (selected ? " selected" : "") + '">' +
        "<h2>" + t.name + "</h2>" +
        "<p>" + t.desc + "</p>" +
        '<p class="effects">' + effects + "</p>" +
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
    '<span class="item">시즌 <b>' + state.season + "</b> · <b>" + state.week + "</b>주차</span>" +
    '<span class="item">선수 <b>' + escapeHTML(state.player.name) + "</b> (" + findPosition(state.player.position).name + ")</span>" +
    '<span class="item">소속 <b>' + escapeHTML(state.team) + "</b></span>" +
    '<span class="item">자금 <b>' + state.money.toLocaleString() + "</b>원</span>" +
    '<span class="spacer"></span>' +
    '<button class="primary" id="next-week">다음 주로 진행 ▶</button>';
  document.getElementById("next-week").onclick = nextWeek;
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
}

// ===== 다음 주로 진행 =====
function nextWeek() {
  // 훈련을 안 골랐으면 훈련 화면으로 안내
  if (!state.plan) {
    state.currentMenu = "training";
    state.notice = "이번 주 훈련을 먼저 골라 주세요.";
    renderAll();
    return;
  }

  // 훈련 효과 적용
  const training = findTraining(state.plan);
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
  const gainsStats = Object.keys(training.effects).some(function (id) { return state.stats[id] !== undefined; });
  if (tired && gainsStats) message += " (너무 지쳐서 훈련 효과가 절반이었다.)";

  // 결과 기록 (최근 10개만 보관)
  state.log.unshift({
    when: "시즌 " + state.season + " · " + state.week + "주차",
    training: training.name,
    message: message,
    changes: changes,
  });
  state.log = state.log.slice(0, 10);

  // 주 넘기기. 고른 훈련은 다음 주에도 그대로 유지됩니다.
  state.week += 1;
  state.currentMenu = "dashboard";
  state.notice = "";
  if (state.settings.autoSave) saveGame();
  renderAll();
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
  renderMenu();
  renderTopbar();
  renderPage();
}

// 게임 시작: 저장된 게임이 있으면 이어서, 없으면 캐릭터 생성 화면
state = loadGame() || createNewState();
renderAll();
