// ===== 게임 상태 =====
// 게임의 모든 정보는 이 state 안에 모아 둡니다.
const state = {
  name: "신인 선수",
  team: "무소속",
  money: 0,
  season: 1,
  week: 1,
  stats: {},                    // 스탯 값 (data/stats.js에서 시작값을 가져옴)
  condition: CONDITION_START,   // 컨디션
  plan: null,                   // 이번 주에 고른 훈련 id
  log: [],                      // 최근 주간 결과 (최신이 맨 앞)
  notice: "",                   // 화면에 잠깐 띄울 안내 문구
  currentMenu: "dashboard",
};

STATS.forEach(function (s) { state.stats[s.id] = s.start; });

// ===== 작은 도우미 함수 =====
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
function statName(id) {
  if (id === "condition") return "컨디션";
  return STATS.find(function (s) { return s.id === id; }).name;
}

// 숫자 막대 하나 (스탯, 컨디션 표시에 사용)
function barHTML(label, value, desc) {
  return (
    '<div class="stat">' +
      '<div class="stat-label" title="' + (desc || "") + '">' + label + "</div>" +
      '<div class="bar"><div class="bar-fill" style="width:' + value + '%"></div></div>' +
      '<div class="stat-value">' + value + "</div>" +
    "</div>"
  );
}

// "피지컬 +2, 컨디션 -15" 같은 변화 문장 만들기
function changesText(changes) {
  return Object.keys(changes).map(function (id) {
    const n = changes[id];
    const cls = n >= 0 ? "up" : "down";
    return '<span class="' + cls + '">' + statName(id) + " " + (n >= 0 ? "+" : "") + n + "</span>";
  }).join(", ");
}

// ===== 화면별 그리기 함수 =====
// 메뉴 id와 같은 이름으로 함수를 등록하면 그 화면이 표시됩니다.
// 등록되지 않은 메뉴는 "준비 중"으로 보입니다.
const pages = {};

pages.dashboard = function () {
  let statsHTML = "";
  STATS.forEach(function (s) {
    statsHTML += barHTML(s.name, state.stats[s.id], s.desc);
  });

  const plan = state.plan ? findTraining(state.plan).name : "아직 안 정함";

  let logHTML = '<p class="placeholder">아직 기록이 없습니다. 훈련을 고르고 [다음 주로 진행]을 눌러 보세요.</p>';
  if (state.log.length > 0) {
    logHTML = state.log.map(function (entry) {
      return (
        '<div class="log-entry">' +
          '<div class="log-head">' + entry.when + " · " + entry.training + "</div>" +
          "<div>" + entry.message + "</div>" +
          '<div class="log-changes">' + entry.changes + "</div>" +
        "</div>"
      );
    }).join("");
  }

  return (
    "<h1>대시보드</h1>" +
    '<div class="grid">' +
      '<div class="card"><h2>내 스탯</h2>' + statsHTML + "</div>" +
      '<div class="card"><h2>컨디션</h2>' + barHTML("컨디션", state.condition) +
        '<h2 class="sub">이번 주 할 일</h2><p>훈련: <b>' + plan + "</b></p>" +
      "</div>" +
    "</div>" +
    '<div class="card"><h2>최근 기록</h2>' + logHTML + "</div>"
  );
};

pages.training = function () {
  let cards = "";
  TRAININGS.forEach(function (t) {
    const selected = state.plan === t.id;
    const effects = Object.keys(t.effects).map(function (id) {
      const r = t.effects[id];
      const sign = function (n) { return (n > 0 ? "+" : "") + n; };
      return statName(id) + " " + sign(r[0]) + " ~ " + sign(r[1]);
    }).join(", ");

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

  return (
    "<h1>훈련</h1>" +
    '<p class="placeholder">이번 주에 할 훈련을 고른 뒤, 위의 [다음 주로 진행]을 누르세요.</p>' +
    '<div class="grid">' + cards + "</div>"
  );
};

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
    '<span class="item">선수 <b>' + state.name + "</b></span>" +
    '<span class="item">소속 <b>' + state.team + "</b></span>" +
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
  const changes = {};
  Object.keys(training.effects).forEach(function (id) {
    const range = training.effects[id];
    const amount = randInt(range[0], range[1]);
    if (id === "condition") {
      const before = state.condition;
      state.condition = clamp(state.condition + amount);
      changes[id] = state.condition - before;
    } else {
      const before = state.stats[id];
      state.stats[id] = clamp(state.stats[id] + amount);
      changes[id] = state.stats[id] - before;
    }
  });

  // 결과 기록 (최근 10개만 보관)
  state.log.unshift({
    when: "시즌 " + state.season + " · " + state.week + "주차",
    training: training.name,
    message: pick(training.messages),
    changes: changesText(changes),
  });
  state.log = state.log.slice(0, 10);

  // 주 넘기기. 고른 훈련은 다음 주에도 그대로 유지됩니다.
  state.week += 1;
  state.currentMenu = "dashboard";
  state.notice = "";
  renderAll();
}

function renderAll() {
  renderMenu();
  renderTopbar();
  renderPage();
}

// 게임 시작
renderAll();
