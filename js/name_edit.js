// ===== js/name_edit.js — 다른 선수 이름 편집 (320, 시안 28 나: 리그 목록 + 명단) =====
// [이적 시장 → 이름 편집] 탭. 왼쪽 = 이름 찾기 + 국내·해외·소속 없음 팀 목록, 오른쪽 = 고른 팀 명단의 이름 칸
// 글자는 data/ui.js NAME_EDIT · HELP_TIPS.names
// 저장 칸: 선수.origName = 처음 이름 (바꾼 적 있는 선수만, 원래 이름으로 돌리면 지움)
//          선수.prevIds = 국내 ↔ 해외로 옮기며 바뀌기 전 id들 (js/dynasty.js · js/world_moves.js) → 그 id로 남은 지난 기록도 같이 바꿈
// 게임 결과는 안 바뀜 (이름 글자만, 난수 안 씀)

// 화면에서만 쓰는 값 (저장 안 함)
const nameEditUI = { tab: "kr", team: null, open: {}, scroll: false };

// ----- 이름 바꾸기 (지난 기록까지) -----
// changes = [{ id, name }] — 이름 하나라도 바뀌면 true
function renamePlayers(changes) {
  const map = {}; // 옛 id·지금 id → [옛 이름, 새 이름]
  const done = [];
  changes.forEach(function (c) {
    const p = findPlayer(c.id);
    if (!p || p.name === c.name) return;
    const pair = [p.name, c.name];
    map[p.id] = pair;
    (p.prevIds || []).forEach(function (old) { if (!map[old]) map[old] = pair; });
    if (!p.origName) p.origName = p.name;
    done.push(p);
  });
  if (!done.length) return false;
  renameInRecords(state, map);
  done.forEach(function (p) {
    p.name = map[p.id][1];
    if (p.origName === p.name) delete p.origName;
    const L = state.league;
    if (L.usedNames.indexOf(p.name) === -1) L.usedNames.push(p.name); // 새로 만드는 선수가 같은 이름을 안 받게 (js/league.js takeName)
    if (state.world && state.world.names && state.world.names.indexOf(p.name) === -1) state.world.names.push(p.name);
  });
  return true;
}

// 저장된 모든 기록에서 { id(또는 pid): 그 선수, name: 옛 이름 } 모양을 찾아 새 이름으로
// (이적 기록·수상·특성 기록·듀오·은퇴한 친구·코치·컬렉션 등. 신문·SNS 글처럼 문장 속 이름은 그대로)
function renameInRecords(node, map) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) renameInRecords(node[i], map); return; }
  if (typeof node.name === "string") {
    const key = node.id !== undefined ? node.id : node.pid;
    const pair = key !== undefined ? map[key] : null;
    if (pair && node.name === pair[0]) node.name = pair[1];
  }
  for (const k in node) {
    const v = node[k];
    if (v && typeof v === "object") renameInRecords(v, map);
  }
}

// 다른 선수(국내·해외·나)가 이미 쓰는 이름인가? (skip = 지금 바꾸는 선수 id들)
function nameTaken(name, skip) {
  if (state.player && state.player.name === name) return true;
  const same = function (dict) {
    return Object.keys(dict || {}).some(function (id) { return skip.indexOf(id) === -1 && dict[id].name === name; });
  };
  return same(state.league.players) || (state.world ? same(state.world.players) : false);
}

// ----- 팀 목록 -----
// 고른 팀 → { id, name, short, where, roster: [선수 id] }  (FA = 소속 없는 선수 모음)
function nameEditTeam(id) {
  if (id === "FA") {
    return { id: "FA", name: NAME_EDIT.faName, where: "", roster: state.league.freeAgents.filter(function (x) { return state.league.players[x]; }) };
  }
  const t = state.league.teams.find(function (x) { return x.id === id; });
  if (t) return { id: t.id, name: t.name, short: t.short, where: "국내 " + t.tier + "부" + (t.academyOf ? " · 2군" : ""), roster: t.roster };
  const w = findWorldTeam(id);
  if (w) return { id: w.id, name: w.name, short: w.short, where: (findRegion(w.region) || {}).name || "해외", roster: w.roster.filter(function (x) { return state.world.players[x]; }) };
  return null;
}

function nameEditCount(roster) {
  return roster.filter(function (id) { const p = id !== USER_ID && findPlayer(id); return p && p.origName; }).length;
}

function nameEditRowHTML(t, extra) {
  const n = nameEditCount(t.roster);
  const mine = t.roster.indexOf(USER_ID) !== -1;
  return '<div class="ne-row' + (nameEditUI.team === t.id ? " on" : "") + '">' +
    '<button class="ne-t" data-neteam="' + t.id + '">' + teamMarkHTML(t.id, "<b>" + escapeHTML(t.name) + "</b>") +
      (mine ? ' <span class="ne-me">내 팀</span>' : "") + (n ? ' <span class="ne-ed">✏️ ' + n + "</span>" : "") +
      '<span class="ne-sub">' + t.roster.length + "명</span></button>" +
    (extra || "") + "</div>";
}

function nameEditListHTML() {
  const tab = nameEditUI.tab;
  if (tab === "kr") {
    const teams = state.league.teams;
    const t1 = teams.filter(function (t) { return t.tier === 1; });
    const acad = {};
    teams.forEach(function (t) { if (t.academyOf && t.parent && t1.indexOf(findTeam(t.parent)) !== -1) acad[t.parent] = t; }); // 2021~: 1부 구단의 2군
    const t2 = teams.filter(function (t) { return t.tier !== 1 && acad[t.parent] !== t; }); // 2020년까지: 독립 2부 구단
    const hasAcad = Object.keys(acad).length > 0;
    return '<div class="ne-lg"><h4>' + (hasAcad ? NAME_EDIT.tier1Head : NAME_EDIT.tier1HeadPlain) + "</h4>" +
      t1.map(function (t) {
        const a = acad[t.id];
        const chip = a ? '<button class="ne-aca' + (nameEditUI.team === a.id ? " on" : "") + '" data-neteam="' + a.id + '">' + escapeHTML(a.short || a.name) +
          (a.roster.indexOf(USER_ID) !== -1 ? " ★" : "") + (nameEditCount(a.roster) ? " ✏️" : "") + "</button>" : "";
        return nameEditRowHTML(t, chip);
      }).join("") + "</div>" +
      (t2.length ? '<div class="ne-lg"><h4>' + NAME_EDIT.tier2Head + "</h4>" + t2.map(function (t) { return nameEditRowHTML(t); }).join("") + "</div>" : "");
  }
  if (tab === "world") {
    if (!state.world || !state.world.teams.length) return emptyBoxHTML("🌏", "해외 리그 팀이 아직 없어요.");
    const sel = nameEditUI.team ? findWorldTeam(nameEditUI.team) : null;
    return '<div class="ne-lg">' + WORLD_REGIONS.map(function (r, i) {
      const list = state.world.teams.filter(function (t) { return t.region === r.id; });
      if (!list.length) return "";
      const open = nameEditUI.open[r.id] !== undefined ? nameEditUI.open[r.id] : (sel ? sel.region === r.id : i === 0);
      return '<details class="ne-rg" data-nergn="' + r.id + '"' + (open ? " open" : "") + "><summary>" + escapeHTML(r.name) + "<small>" + list.length + "팀</small></summary>" +
        list.map(function (t) { return nameEditRowHTML(nameEditTeam(t.id)); }).join("") + "</details>";
    }).join("") + "</div>";
  }
  return '<div class="ne-lg">' + nameEditRowHTML(nameEditTeam("FA")) + "</div>";
}

// ----- 고른 팀 명단 -----
function nameEditRosterHTML() {
  const t = nameEditUI.team ? nameEditTeam(nameEditUI.team) : null;
  if (!t) return '<div class="ne-pick">' + NAME_EDIT.pick + "</div>";
  const ids = t.roster.slice().sort(function (a, b) { return POSITION_IDS.indexOf(playerPos(a)) - POSITION_IDS.indexOf(playerPos(b)); });
  const rows = ids.map(function (id) {
    const pos = findPosition(playerPos(id)).name;
    if (id === USER_ID) {
      return '<div class="ne-p mine"><span class="ne-pos"><b>' + pos + "</b>" + state.player.age + '세</span><span><input value="' + escapeHTML(state.player.name) + '" disabled>' +
        '<span class="ne-was">' + NAME_EDIT.mine + "</span></span><span></span></div>";
    }
    const p = findPlayer(id);
    return '<div class="ne-p"><span class="ne-pos"><b>' + pos + "</b>" + p.age + '세</span><span><input type="text" maxlength="20" data-nename="' + id + '" value="' + escapeHTML(p.name) + '"' + (p.origName ? ' class="chg"' : "") + ' aria-label="' + escapeHTML(pos + " 이름") + '">' +
      '<span class="ne-was">' + (p.origName ? NAME_EDIT.was + escapeHTML(p.origName) : "") + "</span></span>" +
      '<button class="ne-undo" data-neundo="' + id + '" title="' + NAME_EDIT.undo + '" aria-label="' + NAME_EDIT.undo + '"' + (p.origName ? "" : " disabled") + ">↺</button></div>";
  }).join("");
  const anyOrig = ids.some(function (id) { const p = id !== USER_ID && findPlayer(id); return p && p.origName; });
  return '<div class="card ne-roster"><div class="ne-head">' + (t.id === "FA" ? '<span class="ne-sw">🧳</span>' : teamMarkHTML(t.id, "")) +
      "<div><h2>" + escapeHTML(t.name) + "</h2><p>" + (t.where ? escapeHTML(t.where) + " · " : "") + t.roster.length + "명</p></div>" +
      '<button class="ne-close" data-neclose="1">' + NAME_EDIT.close + "</button></div>" +
    (rows || '<p class="muted">' + NAME_EDIT.empty + "</p>") +
    '<div class="ne-acts">' + (anyOrig ? '<button data-neresetall="1">' + NAME_EDIT.resetAll + "</button>" : "") +
      (rows ? '<button class="primary" data-nesave="1">' + NAME_EDIT.save + "</button>" : "") + "</div></div>";
}

pages.names = function () {
  return "<h1>선수 이름 편집</h1>" +
    '<div class="ne no-link"><div class="ne-split' + (nameEditUI.team ? " has-team" : "") + '">' +
      '<div class="ne-left">' +
        '<p class="muted small ne-desc">팀을 고르면 그 팀 선수들의 이름을 바꿀 수 있어요.' + helpBtnHTML(HELP_TIPS.names) + "</p>" +
        '<div class="ne-find"><input type="text" id="ne-q" placeholder="' + NAME_EDIT.search + '" autocomplete="off"></div><div id="ne-found"></div>' +
        '<div class="ne-seg">' + NAME_EDIT.tabs.map(function (x) {
          const n = x[0] === "kr" ? state.league.teams.length + "팀" : x[0] === "world" ? (state.world ? state.world.teams.length : 0) + "팀" : nameEditTeam("FA").roster.length + "명";
          return '<button data-netab="' + x[0] + '"' + (nameEditUI.tab === x[0] ? ' class="on"' : "") + ">" + x[1] + "<small>" + n + "</small></button>";
        }).join("") + "</div>" +
        nameEditListHTML() +
      "</div>" +
      '<div class="ne-right">' + nameEditRosterHTML() + "</div>" +
    "</div></div>";
};

// ----- 이름 찾기 (입력할 때마다 결과 칸만 다시 그림) -----
function nameEditFind(q) {
  q = q.trim().toLowerCase();
  if (!q) return "";
  const hits = [];
  const add = function (id, p, teamId) {
    if (hits.length >= 8) return;
    if (p.name.toLowerCase().indexOf(q) === -1 && !(p.origName && p.origName.toLowerCase().indexOf(q) !== -1)) return;
    hits.push({ id: id, p: p, teamId: teamId });
  };
  Object.keys(state.league.players).forEach(function (id) { const p = state.league.players[id]; add(id, p, p.teamId || "FA"); });
  if (state.world) state.world.teams.forEach(function (t) { t.roster.forEach(function (id) { const p = state.world.players[id]; if (p) add(id, p, t.id); }); });
  if (!hits.length) return '<div class="ne-found"><p class="muted small">' + NAME_EDIT.notFound + "</p></div>";
  return '<div class="ne-found">' + hits.map(function (h) {
    const t = h.teamId === "FA" ? null : (findTeam(h.teamId) || findWorldTeam(h.teamId));
    return '<button data-neteam="' + h.teamId + '"><b>' + escapeHTML(h.p.name) + "</b> " + findPosition(h.p.pos).name +
      (h.p.origName ? ' <span class="muted small">(' + escapeHTML(h.p.origName) + ")</span>" : "") +
      '<span class="muted small">' + escapeHTML(t ? (t.short || t.name) : NAME_EDIT.faName) + "</span></button>";
  }).join("") + "</div>";
}

// ----- 버튼 연결 (renderPage에서) -----
function bindNameEdit(page) {
  const root = page.querySelector(".ne");
  if (!root) return;
  if (nameEditUI.scroll) {
    nameEditUI.scroll = false;
    const r = root.querySelector(".ne-roster");
    if (r && (r.getBoundingClientRect().top < 0 || r.getBoundingClientRect().top > window.innerHeight * 0.6)) r.scrollIntoView({ block: "start" });
  }
  const q = document.getElementById("ne-q");
  const found = document.getElementById("ne-found");
  q.oninput = function () { found.innerHTML = nameEditFind(q.value); };
  root.querySelectorAll("details[data-nergn]").forEach(function (d) {
    d.ontoggle = function () { nameEditUI.open[d.getAttribute("data-nergn")] = d.open; };
  });
  root.querySelectorAll("[data-nename]").forEach(function (inp) {
    inp.onkeydown = function (e) { if (e.key === "Enter") saveTeam(); };
  });
  root.onclick = function (e) {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-netab")) {
      nameEditUI.tab = b.getAttribute("data-netab");
    } else if (b.hasAttribute("data-neteam")) {
      const id = b.getAttribute("data-neteam");
      nameEditUI.team = id;
      nameEditUI.tab = id === "FA" ? "fa" : findWorldTeam(id) ? "world" : "kr";
      const w = findWorldTeam(id);
      if (w) nameEditUI.open[w.region] = true;
      nameEditUI.scroll = true; // 다시 그린 뒤 명단이 화면 밖이면 명단으로
    } else if (b.hasAttribute("data-neclose")) {
      nameEditUI.team = null;
    } else if (b.hasAttribute("data-neundo")) {
      const p = findPlayer(b.getAttribute("data-neundo"));
      if (p && p.origName) done(renamePlayers([{ id: p.id, name: p.origName }]) ? NAME_EDIT.saved.replace("{n}", 1) : "");
      return;
    } else if (b.hasAttribute("data-neresetall")) {
      const t = nameEditTeam(nameEditUI.team);
      const list = t.roster.map(function (id) { const p = id !== USER_ID && findPlayer(id); return p && p.origName ? { id: id, name: p.origName } : null; }).filter(Boolean);
      done(renamePlayers(list) ? NAME_EDIT.saved.replace("{n}", list.length) : "");
      return;
    } else if (b.hasAttribute("data-nesave")) {
      saveTeam();
      return;
    } else return;
    state.notice = "";
    renderPage();
  };
  function saveTeam() {
    const list = [];
    let bad = "";
    root.querySelectorAll("[data-nename]").forEach(function (inp) {
      const id = inp.getAttribute("data-nename");
      const p = findPlayer(id);
      if (!p) return;
      let name = cleanName(inp.value).trim().slice(0, 20); // 287: < > " & ` 는 이름에 못 씀 (js/save.js)
      if (!name) name = p.origName || p.name; // 비우면 원래 이름
      if (name === p.name) return;
      list.push({ id: id, name: name });
    });
    const ids = list.map(function (c) { return c.id; });
    list.forEach(function (c, i) {
      if (bad) return;
      const twice = list.some(function (o, j) { return j !== i && o.name === c.name; });
      if (twice || nameTaken(c.name, ids)) bad = c.name;
    });
    if (bad) return showNotice(NAME_EDIT.dup.replace("{name}", escapeHTML(bad)));
    done(list.length && renamePlayers(list) ? NAME_EDIT.saved.replace("{n}", list.length) : NAME_EDIT.noChange);
  }
  function done(msg) {
    if (msg && msg !== NAME_EDIT.noChange && state.settings.autoSave) saveGame();
    showNotice(msg);
  }
}
