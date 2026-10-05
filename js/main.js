// ===== 게임 상태 =====
// 게임의 모든 정보는 이 state 안에 모아 둡니다.
const state = {
  name: "신인 선수",
  team: "무소속",
  money: 0,
  season: 1,
  week: 1,
  currentMenu: "dashboard",
};

// ===== 화면별 그리기 함수 =====
// 메뉴 id와 같은 이름으로 함수를 등록하면 그 화면이 표시됩니다.
// 등록되지 않은 메뉴는 "준비 중"으로 보입니다.
const pages = {};

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
  if (draw) {
    page.innerHTML = draw();
  } else {
    const menu = MENUS.find(function (m) { return m.id === state.currentMenu; });
    page.innerHTML =
      "<h1>" + menu.name + "</h1>" +
      '<div class="card placeholder">준비 중입니다.</div>';
  }
}

// ===== 다음 주로 진행 =====
function nextWeek() {
  state.week += 1;
  renderAll();
}

function renderAll() {
  renderMenu();
  renderTopbar();
  renderPage();
}

// 게임 시작
renderAll();
