// ===== 선수·구단 이름 링크: 어느 화면이든 이름을 누르면 [선수 검색] / [구단 탐색]의 그 선수·구단으로 =====
// 화면을 그린 뒤(renderPage) 글자 속 선수 이름·구단 이름을 찾아 누를 수 있게 바꿔요.
// - 지금 리그에 있는 선수(나 포함)와 국내 구단만 (은퇴한 선수·해외 팀은 그냥 글자)
// - 버튼·입력칸·제목(h1) 안의 글자는 그대로

// 링크로 바꾸지 않을 곳
const LINK_SKIP = "a, button, input, select, textarea, option, h1, script, style, .glink, .no-link";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 이름 → { player: id } 또는 { team: id }, 긴 이름부터 찾는 정규식
function nameIndex() {
  const map = {};
  state.league.teams.forEach(function (t) { map[t.name] = { team: t.id }; });
  Object.keys(state.league.players).forEach(function (id) {
    const p = state.league.players[id];
    if (p.name && !map[p.name]) map[p.name] = { player: id };
  });
  if (state.player && state.player.name) map[state.player.name] = { player: USER_ID };
  // 해외 선수도 (v1.1, 국내 선수와 이름이 같으면 국내 선수 우선)
  if (state.world) Object.keys(state.world.players).forEach(function (id) {
    const p = state.world.players[id];
    if (p.name && !map[p.name]) map[p.name] = { player: id };
  });
  const names = Object.keys(map).filter(function (n) { return n.length >= 2; })
    .sort(function (a, b) { return b.length - a.length; });
  if (!names.length) return null;
  // 앞뒤가 영문·숫자면 다른 단어의 일부라서 제외 (한글 조사는 OK: "Ego가")
  const re = new RegExp("(?<![A-Za-z0-9])(" + names.map(escapeRegExp).join("|") + ")(?![A-Za-z0-9])", "g");
  return { map: map, re: re };
}

function linkifyNames(root) {
  if (!state || !state.league || !root) return;
  const idx = nameIndex();
  if (!idx) return;
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      if (!n.nodeValue || n.nodeValue.length < 2) return NodeFilter.FILTER_REJECT;
      const el = n.parentElement;
      return el && !el.closest(LINK_SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(function (node) {
    const text = node.nodeValue;
    idx.re.lastIndex = 0;
    if (!idx.re.test(text)) return;
    idx.re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = idx.re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const hit = idx.map[m[1]];
      const a = document.createElement("span");
      a.className = "glink";
      a.setAttribute("tabindex", "0");
      if (hit.player) { a.setAttribute("data-goplayer", hit.player); a.title = "선수 검색에서 보기"; }
      else { a.setAttribute("data-goteam", hit.team); a.title = "구단 탐색에서 보기"; }
      a.textContent = m[1];
      frag.appendChild(a);
      last = m.index + m[1].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

// [선수 검색]에서 그 선수 상세 열기
function goPlayer(id) {
  if (id !== USER_ID && !findPlayer(id)) return;
  selectedPlayer = id;
  selectMenu("search");
  const d = document.querySelector("#page .card.detail");
  if (d) d.scrollIntoView({ block: "start" });
}

// [구단 탐색]에서 그 구단 선수단 열기
function goTeam(id) {
  if (!findTeam(id)) return;
  openClubId = id;
  selectMenu("clubs");
  const el = document.querySelector('#page [data-club="' + id + '"]');
  if (el) el.scrollIntoView({ block: "center" });
}

// 이름 누르기: 다른 클릭(경기 상세 열기 등)보다 먼저 처리
function onNameLink(e) {
  const el = e.target && e.target.closest ? e.target.closest("[data-goplayer], [data-goteam]") : null;
  if (!el) return;
  if (e.type === "keydown" && e.key !== "Enter") return;
  e.preventDefault();
  e.stopPropagation();
  if (el.hasAttribute("data-goplayer")) goPlayer(el.getAttribute("data-goplayer"));
  else goTeam(el.getAttribute("data-goteam"));
}
document.addEventListener("click", onNameLink, true);
document.addEventListener("keydown", onNameLink, true);
