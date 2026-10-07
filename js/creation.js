// ===== 캐릭터 생성 =====
// 게임을 처음 켜거나 새 게임을 시작하면 이 화면이 나옵니다.
// 만드는 중인 캐릭터는 draft(초안)에 담아 두고, [커리어 시작]을 누르면 진짜 게임 상태(state)가 됩니다.

let draft = null;

// 배열을 무작위 순서로 섞은 복사본
function shuffled(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
  }
  return copy;
}

function newDraft() {
  // 스탯마다 평균에서 얼마나 벗어날지 미리 정해 둡니다 (포지션·유형을 바꿔도 유지)
  const offsets = {};
  STATS.forEach(function (s) {
    offsets[s.id] = randInt(-CREATION.randomSpread, CREATION.randomSpread);
  });
  return {
    name: "",
    position: POSITIONS[0].id,
    archetype: ARCHETYPES[0].id,
    startYear: CREATION.startYears[0].year,
    offsets: offsets,
    alloc: {},                          // 보너스 포인트를 어디에 몇 점 줬는지
    traits: [],                         // 직접 고른 좋은 특성 (유형별 개수까지)
    teams: makeTeamDefs(),              // 이번 판 구단 이름 (1부 10 + 2부 8)
    teamChoice: -1,                     // 고른 구단 번호 (-1 = 무작위)
    error: "",
  };
}

// 지금 유형에서 고를 수 있는 특성 개수
function traitSlots() {
  return findArchetype(draft.archetype).goodTraits;
}

// 고른 특성 (유형을 바꿔서 칸이 줄면 뒤에 고른 것부터 빠짐)
function draftTraits() {
  return draft.traits.slice(0, traitSlots());
}

// 시작할 때: 덜 고른 칸은 무작위로 채움
function finalTraits() {
  const chosen = draftTraits();
  const rest = shuffled(TRAITS.filter(function (t) { return t.type === "good" && chosen.indexOf(t.id) === -1; }).map(function (t) { return t.id; }));
  return chosen.concat(rest.slice(0, traitSlots() - chosen.length));
}

function findStartYear(year) {
  return CREATION.startYears.find(function (y) { return y.year === year; });
}

// 보너스 포인트를 넣기 전 스탯
function draftBaseStat(id) {
  const arch = findArchetype(draft.archetype);
  let value = arch.statAvg + draft.offsets[id] + (arch.statBonus[id] || 0) + findStartYear(draft.startYear).statBonus;
  if (isBonusStat(id, draft.position)) value += POSITION_BONUS.startBonus;
  return Math.max(CREATION.minStat, Math.min(CREATION.maxStat, value));
}

function draftStat(id) {
  return Math.min(100, draftBaseStat(id) + (draft.alloc[id] || 0));
}

function pointsLeft() {
  let used = 0;
  Object.keys(draft.alloc).forEach(function (id) { used += draft.alloc[id]; });
  return CREATION.bonusPoints - used;
}

// ----- 생성 도우미: 프리셋·주사위·구단 전력 -----

// 스탯 프리셋: 보너스 포인트를 그 스탯들에 고르게 (data/archetypes.js CREATION.presets)
function applyPreset(id) {
  const preset = CREATION.presets.find(function (x) { return x.id === id; });
  if (!preset) return;
  const list = preset.stats === "position" ? findPosition(draft.position).bonus : preset.stats;
  draft.alloc = {};
  const per = Math.floor(CREATION.bonusPoints / list.length);
  let left = CREATION.bonusPoints - per * list.length;
  list.forEach(function (sid) {
    const add = per + (left > 0 ? 1 : 0);
    if (left > 0) left--;
    draft.alloc[sid] = Math.max(0, Math.min(add, 100 - draftBaseStat(sid)));
  });
}

// 스탯 다시 굴리기 (평균에서 벗어나는 값만 새로)
function rerollOffsets() {
  STATS.forEach(function (s) { draft.offsets[s.id] = randInt(-CREATION.randomSpread, CREATION.randomSpread); });
}

// 🎲 전부 무작위 (쉬운 난이도 유형은 빼고, 이름은 비어 있을 때만)
function randomizeDraft() {
  if (!draft.name.trim()) draft.name = pick(PLAYER_NAMES);
  draft.position = pick(POSITIONS).id;
  draft.archetype = pick(ARCHETYPES.filter(function (a) { return !a.difficulty; })).id;
  draft.startYear = pick(CREATION.startYears).year;
  rerollOffsets();
  draft.traits = shuffled(TRAITS.filter(function (t) { return t.type === "good"; }).map(function (t) { return t.id; })).slice(0, traitSlots());
  draft.alloc = {};
  for (let i = 0; i < CREATION.bonusPoints; i++) {
    const sid = pick(STATS).id;
    if (draftStat(sid) < 100) draft.alloc[sid] = (draft.alloc[sid] || 0) + 1;
  }
  draft.teamChoice = -1;
  draft.error = "";
}

// 구단 예상 전력 ★ (만들 때 정한 전력 보정 shift로)
function teamStarCount(def) {
  const r = CREATION.teamShift[def.tier];
  const max = r ? Math.max(1, r[1]) : 1;
  return Math.max(1, Math.min(5, Math.round(3 + 2 * (def.shift || 0) / max)));
}

function starsText(n) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

// 같은 리그 안에서 예상 순위 구간
function teamRankText(def) {
  const same = draft.teams.filter(function (d) { return d.tier === def.tier; });
  const higher = same.filter(function (d) { return (d.shift || 0) > (def.shift || 0); }).length;
  if (higher < same.length / 3) return "상위권";
  if (higher >= same.length * 2 / 3) return "하위권";
  return "중위권";
}

// ----- 화면 그리기 -----
function creationHTML() {
  // 1. 이름
  const nameCard =
    '<div class="card"><h2>1. 이름</h2>' +
      '<div class="name-row"><input type="text" id="c-name" maxlength="20" placeholder="선수 이름 (닉네임)" value="' + escapeHTML(draft.name) + '">' +
      '<button data-cname="1" title="무작위 이름">🎲 이름</button></div>' +
    "</div>";

  // 2. 시작 연도
  let yearCards = "";
  CREATION.startYears.forEach(function (y) {
    const seasons = 2026 - y.year + 1;
    yearCards +=
      '<div class="choice' + (draft.startYear === y.year ? " selected" : "") + '" data-cyear="' + y.year + '">' +
        "<h3>" + y.year + "년</h3>" +
        '<p class="muted">' + y.desc + "</p>" +
        "<p>2026년까지 <b>" + seasons + "시즌</b> · 챔피언 <b>" + releasedChampions(y.year, 1).length + "명</b></p>" +
      "</div>";
  });
  const yearCard =
    '<div class="card"><h2>2. 시작 연도</h2>' +
      '<p class="muted small">늦게 시작할수록 훈련할 시간이 짧아서 시작 스탯에 보정을 받아요. 한 시즌은 52주예요.</p>' +
      '<div class="choices">' + yearCards + "</div>" +
    "</div>";

  // 3. 포지션
  let posCards = "";
  POSITIONS.forEach(function (p) {
    const bonusNames = p.bonus.map(function (id) { return statName(id); }).join(" · ");
    posCards +=
      '<div class="choice' + (draft.position === p.id ? " selected" : "") + '" data-cpos="' + p.id + '">' +
        "<h3>" + p.name + "</h3>" +
        '<p class="muted">' + p.desc + "</p>" +
        '<p class="bonus-line">★ ' + bonusNames + "</p>" +
      "</div>";
  });
  const posCard =
    '<div class="card"><h2>3. 포지션</h2>' +
      '<p class="muted small">★ 가산점 스탯은 시작값 +' + POSITION_BONUS.startBonus +
      ", 훈련 효과 " + percentText(POSITION_BONUS.trainingBonus) +
      ", 경기에서 " + POSITION_BONUS.matchMultiplier + "배로 계산돼요.</p>" +
      '<div class="choices">' + posCards + "</div>" +
    "</div>";

  // 4. 시작 유형
  let archCards = "";
  ARCHETYPES.forEach(function (a) {
    archCards +=
      '<div class="choice' + (draft.archetype === a.id ? " selected" : "") + '" data-carch="' + a.id + '">' +
        "<h3>" + a.name + (a.difficulty ? ' <span class="badge-easy">' + a.difficulty + "</span>" : "") + "</h3>" +
        '<p class="muted">' + a.desc + "</p>" +
        "<ul>" +
          "<li>시작 나이 <b>" + a.age + "세</b> · 스탯 평균 <b>약 " + a.statAvg + "</b></li>" +
          "<li>체력 최대 <b>" + a.staminaMax + "</b> · 좋은 특성 <b>" + a.goodTraits + "개</b></li>" +
          (a.startTrait ? "<li>전용 특성 " + traitChipHTML(a.startTrait) + " <span class=\"muted small\">(" + a.startTraitSeasons + "시즌)</span></li>" : "") +
        "</ul>" +
        '<p class="up">장점: ' + a.strength + "</p>" +
        '<p class="down">약점: ' + a.weakness + "</p>" +
      "</div>";
  });
  const archCard =
    '<div class="card"><h2>4. 시작 유형</h2><div class="choices">' + archCards + "</div></div>";

  // 5. 특성
  const pickedTraits = draftTraits();
  const slots = traitSlots();
  const rec = TRAIT_RECOMMEND[draft.position] || [];
  const posName = findPosition(draft.position).name;
  const groups = [];
  TRAITS.forEach(function (t) { if (t.type === "good" && groups.indexOf(t.group) === -1) groups.push(t.group); });
  const traitCardHTML = function (t) {
    const on = pickedTraits.indexOf(t.id) !== -1;
    const full = !on && pickedTraits.length >= slots;
    const isRec = rec.indexOf(t.id) !== -1;
    return '<div class="choice trait-pick' + (on ? " selected" : "") + (full ? " full" : "") + (isRec ? " rec" : "") + '" data-ctrait="' + t.id + '">' +
      "<h3>" + (on ? "✔ " : "") + t.name + (isRec ? ' <span class="rec-badge">⭐ ' + posName + " 추천</span>" : "") + "</h3>" +
      '<p class="muted">' + escapeHTML(t.desc) + "</p>" +
      (t.impact ? '<p class="impact">경기 영향: 세트 승률 <b>+' + t.impact.toFixed(1) + "%p</b> · " + escapeHTML(t.when) + "</p>" : "") +
    "</div>";
  };
  const recCards = rec.map(findTrait).filter(Boolean).map(traitCardHTML).join("");
  const traitGroups = groups.map(function (g) {
    const cards = TRAITS.filter(function (t) { return t.type === "good" && t.group === g; }).map(traitCardHTML).join("");
    return '<h2 class="sub">' + g + '</h2><div class="choices trait-choices">' + cards + "</div>";
  }).join("");
  const arch = findArchetype(draft.archetype);
  const traitCard =
    '<div class="card"><h2>5. 특성 <span class="muted small">' + pickedTraits.length + " / " + slots + "개 선택</span></h2>" +
      '<p class="muted small">' + arch.name + " 유형은 좋은 특성을 " + slots + "개 고를 수 있어요. 눌러서 고르고, 다시 누르면 빠져요. " +
        "덜 고르고 시작하면 남은 칸은 무작위로 채워져요. 나쁜 특성은 게임 중 이벤트로만 생겨요. " +
        "경기 영향은 그 특성을 가진 선수 1명이 있을 때 세트 승률이 얼마나 오르는지 잰 값이에요 (스탯 12개 전부 +5 ≈ +2.5%p).</p>" +
      (arch.startTrait ? '<p class="small">전용 특성: ' + traitChipHTML(arch.startTrait) + " — 자동으로 붙어요 (" + arch.startTraitSeasons + "시즌 뒤 사라짐)</p>" : "") +
      '<h2 class="sub">⭐ ' + posName + " 추천</h2>" + '<div class="choices trait-choices">' + recCards + "</div>" +
      traitGroups +
    "</div>";

  // 6. 스탯
  let statRows = "";
  STATS.forEach(function (s) {
    const value = draftStat(s.id);
    const added = draft.alloc[s.id] || 0;
    const bonus = isBonusStat(s.id, draft.position);
    statRows +=
      '<div class="stat stat-edit">' +
        '<div class="stat-label' + (bonus ? " bonus" : "") + '" title="' + s.desc + '">' + (bonus ? "★ " : "") + s.name + "</div>" +
        '<div class="bar"><div class="bar-fill' + (bonus ? " gold" : "") + '" style="width:' + value + '%"></div></div>' +
        '<div class="stat-value">' + value + (added ? ' <span class="up">+' + added + "</span>" : "") + "</div>" +
        '<div class="pm">' +
          '<button data-minus="' + s.id + '"' + (added > 0 ? "" : " disabled") + ">−</button>" +
          '<button data-plus="' + s.id + '"' + (pointsLeft() > 0 && value < 100 ? "" : " disabled") + ">+</button>" +
        "</div>" +
      "</div>";
  });
  const presetBtns = CREATION.presets.map(function (x) { return '<button data-cpreset="' + x.id + '">' + x.name + "</button>"; }).join("");
  const statCard =
    '<div class="card"><h2>6. 스탯 <span class="muted small">보너스 포인트 남음: <b>' + pointsLeft() + "</b> / " + CREATION.bonusPoints + "</span></h2>" +
      '<div class="buttons preset-row">' + presetBtns +
        '<button data-creset="1">↺ 포인트 초기화</button><button data-creroll="1" title="시작 스탯의 무작위 부분을 다시 정해요">🎲 스탯 다시 굴리기</button></div>' +
      '<p class="muted small">프리셋 = 보너스 포인트 ' + CREATION.bonusPoints + "점을 그 스탯들에 고르게 나눠요. <span class=\"bonus\">★</span> = 포지션 가산점 스탯. 스탯 이름에 마우스를 올리면 설명이 나와요.</p>" +
      statRows +
      statGuideHTML(draft.position) +
    "</div>";

  // 7. 소속팀
  const stats = {};
  STATS.forEach(function (s) { stats[s.id] = draftStat(s.id); });
  const myScore = statScoreFor(stats, draft.position);
  const teamBtn = function (def, i) {
    const n = teamStarCount(def);
    return '<div class="choice team-choice' + (draft.teamChoice === i ? " selected" : "") + '" data-cteam="' + i + '">' +
      "<b>" + escapeHTML(def.name) + "</b>" +
      '<div class="small"><span class="team-stars s' + n + '">' + starsText(n) + '</span> <span class="muted">예상 ' + teamRankText(def) + "</span></div></div>";
  };
  let t1 = "", t2 = "";
  draft.teams.forEach(function (def, i) { if (def.tier === 1) t1 += teamBtn(def, i); else t2 += teamBtn(def, i); });
  const chosen = draft.teams[draft.teamChoice];
  let warn = "";
  if (chosen && chosen.tier === 1 && myScore < LEAGUE.userTier1Score) {
    warn = '<div class="notice">지금 내 스탯 점수는 <b>' + myScore.toFixed(1) + "</b>이고, 1부 주전 평균은 약 " + LEAGUE.npc.tier1Starter.avg +
      "이에요. 주전으로 뛰지만 힘든 출발이 될 수 있어요.</div>";
  }
  const teamCard =
    '<div class="card"><h2>7. 소속팀</h2>' +
      '<p class="muted small">뛰고 싶은 팀을 고르세요. 내 선수는 그 팀의 주전이 돼요. ★ = 예상 전력 (팀원 수준, 같은 리그 안에서 비교). 지금 내 스탯 점수: <b>' + myScore.toFixed(1) + "</b></p>" +
      '<div class="choices team-choices"><div class="choice team-choice' + (draft.teamChoice === -1 ? " selected" : "") + '" data-cteam="-1">' +
        "<b>무작위</b><br><span class=\"muted small\">내 실력에 맞는 팀으로</span></div></div>" +
      '<h2 class="sub">1부 리그</h2><div class="choices team-choices">' + t1 + "</div>" +
      '<h2 class="sub">2부 리그</h2><div class="choices team-choices">' + t2 + "</div>" +
      warn +
    "</div>";

  return (
    '<div class="creation-head"><div><h1 class="creation-title">캐릭터 생성</h1>' +
      '<p class="muted">프로게이머로서의 첫걸음. 어떤 선수가 될지 정해 주세요. 오른쪽 선수 카드에서 결과를 바로 볼 수 있어요.</p></div>' +
      '<button data-crandom="1">🎲 전부 무작위로 만들기</button></div>' +
    '<div class="creation-layout">' +
      '<div class="creation-main">' + nameCard + yearCard + posCard + archCard + traitCard + statCard + teamCard + "</div>" +
      '<aside class="creation-side">' + playerCardHTML(stats, myScore) + "</aside>" +
    "</div>"
  );
}

// 오른쪽 '내 선수' 카드 (스크롤해도 따라옴)
function playerCardHTML(stats, myScore) {
  const arch = findArchetype(draft.archetype);
  const pos = findPosition(draft.position);
  const picked = draftTraits();
  const slots = traitSlots();
  const T1 = LEAGUE.npc.tier1Starter.avg, T2 = LEAGUE.npc.tier2Starter.avg;
  const level = myScore >= T1 ? "1부 주전급" : myScore >= LEAGUE.userTier1Score ? "1부 도전 가능" : myScore >= T2 ? "2부 주전급" : "2부 유망주";
  const bars = STATS.map(function (s) {
    const v = stats[s.id], bonus = isBonusStat(s.id, draft.position);
    return '<div class="pc-stat"><span class="' + (bonus ? "bonus" : "muted") + '">' + (bonus ? "★" : "") + s.name + "</span>" +
      '<span class="bar"><span class="bar-fill' + (bonus ? " gold" : "") + '" style="width:' + v + '%"></span></span><b>' + v + "</b></div>";
  }).join("");
  const empty = [];
  for (let i = picked.length; i < slots; i++) empty.push('<span class="chip muted">＋ 무작위</span>');
  const team = draft.teams[draft.teamChoice];
  const saved = loadGame();
  return (
    '<div class="card pcard">' +
      '<div class="pc-name">' + (draft.name.trim() ? escapeHTML(draft.name.trim()) : '<span class="muted">이름을 입력해 주세요</span>') + "</div>" +
      '<div class="small">' + pos.name + " · " + arch.age + "세 · " + arch.name + " · " + draft.startYear + "년 데뷔</div>" +
      '<div class="pc-score"><span class="muted small">스탯 점수</span> <b>' + myScore.toFixed(1) + '</b> <span class="small">' + level + "</span></div>" +
      '<div class="pc-gauge"><div class="pc-fill" style="width:' + Math.min(100, myScore) + '%"></div>' +
        '<span class="pc-mark" style="left:' + T2 + '%">2부 ' + T2 + "</span>" +
        '<span class="pc-mark" style="left:' + T1 + '%">1부 ' + T1 + "</span></div>" +
      '<div class="pc-stats">' + bars + "</div>" +
      '<div class="pc-sec"><span class="muted small">특성</span><div class="chips">' + picked.map(traitChipHTML).join("") + empty.join("") +
        (arch.startTrait ? traitChipHTML(arch.startTrait) : "") + "</div></div>" +
      '<div class="pc-sec"><span class="muted small">소속팀</span><div>' +
        (team ? "<b>" + escapeHTML(team.name) + '</b> <span class="muted small">' + tierName(team.tier) + '</span> <span class="team-stars s' + teamStarCount(team) + '">' + starsText(teamStarCount(team)) + "</span>"
              : '<span class="muted">무작위 (내 실력에 맞는 팀)</span>') + "</div></div>" +
      (pointsLeft() > 0 ? '<div class="small down">보너스 포인트 ' + pointsLeft() + "점이 남았어요</div>" : "") +
      (draft.error ? '<div class="notice">' + draft.error + "</div>" : "") +
      '<div class="buttons pc-buttons"><button class="primary big" data-start="1">커리어 시작 ▶</button>' +
        (saved ? '<button data-continue="1">저장된 게임 이어하기 (' + escapeHTML(saved.player.name) + ")</button>" : "") + "</div>" +
    "</div>"
  );
}

function renderCreation() {
  if (!draft) draft = newDraft();
  const box = document.getElementById("creation");
  const scrollY = window.scrollY;
  box.innerHTML = creationHTML();
  window.scrollTo(0, scrollY); // 다시 그려도 스크롤 위치 유지

  document.getElementById("c-name").oninput = function () {
    draft.name = this.value;
    if (draft.error) draft.error = ""; // 이름을 입력하면 안내 문구 지우기
    // 오른쪽 카드 이름만 바로 바꾸기 (다시 그리면 입력 칸 커서가 사라져서)
    const nameEl = box.querySelector(".pc-name");
    if (nameEl) nameEl.innerHTML = draft.name.trim() ? escapeHTML(draft.name.trim()) : '<span class="muted">이름을 입력해 주세요</span>';
    const notice = box.querySelector(".pcard .notice");
    if (notice) notice.remove();
  };
  document.getElementById("c-name").onkeydown = function (e) {
    if (e.key === "Enter") startCareer();
  };

  box.querySelectorAll("[data-cyear]").forEach(function (el) {
    el.onclick = function () { draft.startYear = Number(el.getAttribute("data-cyear")); renderCreation(); };
  });
  box.querySelectorAll("[data-cteam]").forEach(function (el) {
    el.onclick = function () { draft.teamChoice = Number(el.getAttribute("data-cteam")); renderCreation(); };
  });
  box.querySelectorAll("[data-cpos]").forEach(function (el) {
    el.onclick = function () { draft.position = el.getAttribute("data-cpos"); renderCreation(); };
  });
  box.querySelectorAll("[data-carch]").forEach(function (el) {
    el.onclick = function () { draft.archetype = el.getAttribute("data-carch"); renderCreation(); };
  });
  box.querySelectorAll("[data-plus]").forEach(function (el) {
    el.onclick = function () {
      const id = el.getAttribute("data-plus");
      if (pointsLeft() > 0 && draftStat(id) < 100) draft.alloc[id] = (draft.alloc[id] || 0) + 1;
      renderCreation();
    };
  });
  box.querySelectorAll("[data-minus]").forEach(function (el) {
    el.onclick = function () {
      const id = el.getAttribute("data-minus");
      if (draft.alloc[id] > 0) draft.alloc[id] -= 1;
      renderCreation();
    };
  });

  box.querySelectorAll("[data-ctrait]").forEach(function (el) {
    el.onclick = function () {
      const id = el.getAttribute("data-ctrait");
      draft.traits = draftTraits(); // 유형을 바꿔 넘친 것은 정리
      const i = draft.traits.indexOf(id);
      if (i !== -1) draft.traits.splice(i, 1);
      else if (draft.traits.length < traitSlots()) draft.traits.push(id);
      else if (traitSlots() === 1) draft.traits = [id]; // 1개짜리 유형은 바로 바꿔 끼움
      renderCreation();
    };
  });

  box.querySelectorAll("[data-cpreset]").forEach(function (el) {
    el.onclick = function () { applyPreset(el.getAttribute("data-cpreset")); renderCreation(); };
  });
  box.querySelector("[data-creset]").onclick = function () { draft.alloc = {}; renderCreation(); };
  box.querySelector("[data-creroll]").onclick = function () { rerollOffsets(); renderCreation(); };
  box.querySelector("[data-crandom]").onclick = function () { randomizeDraft(); renderCreation(); };
  box.querySelector("[data-cname]").onclick = function () { draft.name = pick(PLAYER_NAMES); draft.error = ""; renderCreation(); };

  box.querySelector("[data-start]").onclick = startCareer;

  const cont = box.querySelector("[data-continue]");
  if (cont) cont.onclick = function () {
    const loaded = loadGame();
    if (!loaded) return;
    draft = null;
    replaceState(loaded, "dashboard", "저장된 게임을 이어서 시작해요.");
  };
}

// [커리어 시작]: 초안을 진짜 게임 상태로 바꾸기
function startCareer() {
  const name = draft.name.trim();
  if (!name) {
    draft.error = "이름을 한 글자 이상 입력해 주세요.";
    renderCreation();
    document.getElementById("c-name").focus();
    return;
  }
  if (pointsLeft() > 0 && !confirm("보너스 포인트가 " + pointsLeft() + "점 남았어요. 이대로 시작할까요?")) return;

  const arch = findArchetype(draft.archetype);
  const fresh = createNewState();
  if (state && state.settings) fresh.settings = state.settings;

  fresh.player = {
    name: name.slice(0, 20),
    position: draft.position,
    archetype: draft.archetype,
    age: arch.age,
    traits: finalTraits(),
  };
  // 시작 유형 전용 특성 (유망주: 🌱 유망주, startTraitSeasons 시즌 뒤 사라짐)
  if (arch.startTrait) {
    fresh.player.traits.push(arch.startTrait);
    fresh.player.startTraitUntil = draft.startYear + arch.startTraitSeasons;
  }
  STATS.forEach(function (s) { fresh.stats[s.id] = draftStat(s.id); });
  fresh.staminaMax = arch.staminaMax;
  fresh.stamina = arch.staminaMax;
  fresh.year = draft.startYear;
  fresh.week = 1;
  fresh.mastery = startMastery(fresh.stats, fresh.player.position, fresh.year, fresh.week);
  fresh.shakeup = newShakeupState(fresh.year); // 대격변 패치 (js/shakeup.js)
  applyExtraPositions(null); // 예전 게임의 포지션 변경 되돌리기
  fresh.meta = makePatch(fresh.year, fresh.week);

  const teams = draft.teams, teamChoice = draft.teamChoice;
  draft = null;
  window.scrollTo(0, 0); // 생성 화면에서 내려간 스크롤을 맨 위로
  state = fresh;
  makeLeague(teams, teamChoice); // 리그·구단·선수 만들고 내 소속팀 정하기
  const extra = applyFirstContract(); // 첫 계약: 능력 보너스·계약금·원룸 (data/contracts.js FIRST_CONTRACT)
  enforceConditionCap(); // 2부는 합숙으로 시작 (js/housing.js)
  replaceState(fresh, "dashboard", escapeHTML(fresh.player.name) + " 선수의 커리어가 시작됐어요! " + extra + "훈련을 고르고 [다음 주로 진행]을 눌러 보세요.");
  saveGame();
}

// 첫 계약 (data/contracts.js FIRST_CONTRACT): 돌려주는 값 = 시작 안내에 붙일 글
function applyFirstContract() {
  const F = FIRST_CONTRACT;
  const team = myTeam();
  if (!team || !state.contract) return "";
  // 1) 능력 보너스: 1부 주전 평균보다 높은 만큼
  const scores = [];
  tierTeams(1).forEach(function (t) {
    const st = starters(t.id);
    Object.keys(st).forEach(function (pos) { if (st[pos] && st[pos] !== USER_ID) scores.push(playerScore(st[pos])); });
  });
  const avg = scores.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, scores.length);
  const boost = Math.min(F.maxBoost, Math.max(0, (playerScore(USER_ID) - avg) * F.perPointAbove));
  if (boost > 0) state.contract.salary = Math.round(state.contract.salary * (1 + boost) / 1000000) * 1000000;
  state.contract.firstBoost = Math.round(boost * 100); // [이적 시장] 내 계약 칸 표시용
  let text = "연봉 " + moneyText(state.contract.salary) + (boost > 0 ? "(능력 보너스 +" + Math.round(boost * 100) + "%)" : "") + ". ";
  // 2) 1부 시작: 계약금 + 원룸
  if (team.tier === 1) {
    const bonus = Math.round(state.contract.salary * F.signingBonus / 10000) * 10000;
    state.money += bonus;
    text += "계약금 " + moneyText(bonus) + "을(를) 받았고, ";
    // 원룸: 주급이 월세보다 적으면 몇 주 만에 돈이 떨어지니 합숙으로 시작
    const home = SHOP_HOUSING.find(function (h) { return h.id === F.tier1Home; });
    if (home && state.contract.salary / CREATION.weeksPerSeason >= (home.rent || 0)) {
      state.housing = { id: F.tier1Home, since: absWeek() };
      text += home.name + "에서 시작해요. ";
    } else {
      text += "주급이 월세보다 적어서 팀 합숙소에서 시작해요. ";
    }
  }
  return text;
}

// 새 시즌 (js/main.js): 전용 특성 기간이 끝났으면 빼기 — 유망주는 4년차 시즌이 시작될 때
function expireStartTrait() {
  const p = state.player;
  if (!p.startTraitUntil || state.year < p.startTraitUntil) return;
  const arch = findArchetype(p.archetype);
  const id = arch && arch.startTrait;
  p.startTraitUntil = null;
  if (!id || p.traits.indexOf(id) === -1) return;
  p.traits.splice(p.traits.indexOf(id), 1);
  addNews("특성", findTrait(id).name + " 기간이 끝났다. 데뷔 " + arch.startTraitSeasons + "시즌 동안 받던 훈련·숙련도 보너스가 사라지고, 이제 진짜 실력으로 승부할 때다.");
}
