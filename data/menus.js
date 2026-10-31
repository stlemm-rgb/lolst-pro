// 좌측 메뉴 (2026-10-06 정리: 묶음 4개 + 맨 아래 설정)
// - id: 코드에서 쓰는 이름 (영어, 바꾸지 마세요)
// - name: 화면에 보이는 이름 (자유롭게 바꿔도 됩니다)
// - tabs: 화면 여러 개를 합친 메뉴. 누르면 첫 탭(또는 마지막에 본 탭)이 열리고, 화면 위에 탭 버튼이 생겨요
// 224 (시안 21 가): 칸마다 icon, 묶음마다 color(css 변수 이름). 해외 리그는 '순위' 탭, 업적·컬렉션은 '수집' 탭 (17칸 → 13칸)
const MENU_GROUPS = [
  { title: "내 선수", color: "accent", items: [
    { id: "dashboard", name: "대시보드", icon: "🏠" },
    { id: "training",  name: "훈련",     icon: "🏋️" },
    { id: "sns",       name: "SNS",      icon: "📱" },
    { id: "friends",   name: "친구",     icon: "🤝" },
    { id: "career",    name: "선수 정보", icon: "🧑" },
    { id: "shop",      name: "상점",     icon: "🛒" },
  ] },
  { title: "리그", color: "accent2", items: [
    { id: "team",      name: "소속팀",   icon: "🛡️" },
    { id: "results",   name: "경기 결과", icon: "📺" },
    { id: "calendar",  name: "일정",     icon: "📅", tabs: [
      { id: "schedule",   name: "시즌 일정" },
      { id: "tournament", name: "대회 일정" },
    ] },
    { id: "rank",      name: "순위",     icon: "🏆", tabs: [
      { id: "standings", name: "리그 순위" },
      { id: "world",     name: "해외 리그" },
    ] },
  ] },
  { title: "이적 · 기록", color: "gold", items: [
    { id: "market", name: "이적 시장", icon: "🔁", tabs: [
      { id: "transfer", name: "이적 시장" },
      { id: "search",   name: "선수 검색" },
      { id: "clubs",    name: "구단 탐색" },
    ] },
    { id: "collect", name: "수집", icon: "💎", tabs: [
      { id: "achievements", name: "업적 도감" },
      { id: "collection",   name: "컬렉션" },
    ] },
    { id: "records", name: "기록실", icon: "🏛️", tabs: [
      { id: "awards",    name: "개인 시상" },
      { id: "history",   name: "역사관" },
      { id: "ecosystem", name: "리그 생태계" },
    ] },
  ] },
];

// 맨 아래 따로 놓는 메뉴
const MENU_BOTTOM = [
  { id: "howto",    name: "게임 방법", icon: "❓" },
  { id: "settings", name: "설정·저장", icon: "⚙" },
];

// 화면(page) 이름 찾기용: 모든 메뉴와 탭을 한 줄로
const MENUS = [];
MENU_GROUPS.forEach(function (g) {
  g.items.forEach(function (item) {
    if (item.tabs) item.tabs.forEach(function (t) { MENUS.push({ id: t.id, name: t.name, parent: item.id }); });
    else MENUS.push({ id: item.id, name: item.name });
  });
});
MENU_BOTTOM.forEach(function (item) { MENUS.push({ id: item.id, name: item.name }); });

// 224: 메뉴 아이콘 찾기용 (휴대폰 ☰ 메뉴판도 같은 아이콘)
const MENUS_ICON = {};
MENU_GROUPS.forEach(function (g) { g.items.forEach(function (item) { MENUS_ICON[item.id] = item.icon; }); });
MENU_BOTTOM.forEach(function (item) { MENUS_ICON[item.id] = item.icon; });
