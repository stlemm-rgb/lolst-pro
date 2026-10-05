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
  const goodIds = TRAITS.filter(function (t) { return t.type === "good"; }).map(function (t) { return t.id; });
  return {
    name: "",
    position: POSITIONS[0].id,
    archetype: ARCHETYPES[0].id,
    offsets: offsets,
    alloc: {},                          // 보너스 포인트를 어디에 몇 점 줬는지
    traitOrder: shuffled(goodIds),      // 특성 뽑기 순서 (앞에서부터 개수만큼 받음)
    rerollsLeft: CREATION.traitRerolls,
    error: "",
  };
}

// 지금 유형에서 받는 특성 id 목록
function draftTraits() {
  return draft.traitOrder.slice(0, findArchetype(draft.archetype).goodTraits);
}

// 보너스 포인트를 넣기 전 스탯
function draftBaseStat(id) {
  const arch = findArchetype(draft.archetype);
  let value = arch.statAvg + draft.offsets[id] + (arch.statBonus[id] || 0);
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

// ----- 화면 그리기 -----
function creationHTML() {
  // 1. 이름
  const nameCard =
    '<div class="card"><h2>1. 이름</h2>' +
      '<input type="text" id="c-name" maxlength="20" placeholder="선수 이름 (닉네임)" value="' + escapeHTML(draft.name) + '">' +
    "</div>";

  // 2. 포지션
  let posCards = "";
  POSITIONS.forEach(function (p) {
    const bonusNames = p.bonus.map(function (id) { return statName(id); }).join(" · ");
    posCards +=
      '<div class="choice' + (draft.position === p.id ? " selected" : "") + '" data-cpos="' + p.id + '">' +
        "<h3>" + p.name + "</h3>" +
        '<p class="muted">' + p.desc + "</p>" +
        '<p class="bonus-line">★ 가산점: ' + bonusNames + "</p>" +
      "</div>";
  });
  const posCard =
    '<div class="card"><h2>2. 포지션</h2>' +
      '<p class="muted">★ 가산점 스탯은 시작값 +' + POSITION_BONUS.startBonus +
      ", 훈련 효과 " + percentText(POSITION_BONUS.trainingBonus) +
      ", 경기에서 " + POSITION_BONUS.matchMultiplier + "배로 계산돼요.</p>" +
      '<div class="choices">' + posCards + "</div>" +
    "</div>";

  // 3. 시작 유형
  let archCards = "";
  ARCHETYPES.forEach(function (a) {
    archCards +=
      '<div class="choice' + (draft.archetype === a.id ? " selected" : "") + '" data-carch="' + a.id + '">' +
        "<h3>" + a.name + "</h3>" +
        '<p class="muted">' + a.desc + "</p>" +
        "<ul>" +
          "<li>시작 나이 <b>" + a.age + "세</b></li>" +
          "<li>스탯 평균 <b>약 " + a.statAvg + "</b></li>" +
          "<li>체력 최대 <b>" + a.staminaMax + "</b></li>" +
          "<li>좋은 특성 <b>" + a.goodTraits + "개</b></li>" +
        "</ul>" +
        '<p class="up">장점: ' + a.strength + "</p>" +
        '<p class="down">약점: ' + a.weakness + "</p>" +
      "</div>";
  });
  const archCard =
    '<div class="card"><h2>3. 시작 유형</h2><div class="choices">' + archCards + "</div></div>";

  // 4. 특성
  const traitList = draftTraits().map(function (id) {
    const t = findTrait(id);
    return '<div class="trait good"><b>' + t.name + "</b> <span class=\"muted\">— " + t.desc + "</span></div>";
  }).join("");
  const traitCard =
    '<div class="card"><h2>4. 특성</h2>' +
      traitList +
      '<div class="buttons" style="margin-top:12px">' +
        '<button data-reroll="1"' + (draft.rerollsLeft > 0 ? "" : " disabled") + ">다시 뽑기 (남은 횟수 " + draft.rerollsLeft + ")</button>" +
      "</div>" +
    "</div>";

  // 5. 스탯
  let statRows = "";
  STATS.forEach(function (s) {
    const value = draftStat(s.id);
    const added = draft.alloc[s.id] || 0;
    const bonus = isBonusStat(s.id, draft.position);
    statRows +=
      '<div class="stat stat-edit">' +
        '<div class="stat-label' + (bonus ? " bonus" : "") + '" title="' + s.desc + '">' + (bonus ? "★ " : "") + s.name + "</div>" +
        '<div class="bar"><div class="bar-fill" style="width:' + value + '%"></div></div>' +
        '<div class="stat-value">' + value + (added ? ' <span class="up">+' + added + "</span>" : "") + "</div>" +
        '<div class="pm">' +
          '<button data-minus="' + s.id + '"' + (added > 0 ? "" : " disabled") + ">−</button>" +
          '<button data-plus="' + s.id + '"' + (pointsLeft() > 0 && value < 100 ? "" : " disabled") + ">+</button>" +
        "</div>" +
      "</div>";
  });
  const statCard =
    '<div class="card"><h2>5. 스탯 <span class="muted small">보너스 포인트 남음: <b>' + pointsLeft() + "</b> / " + CREATION.bonusPoints + "</span></h2>" +
      '<p class="muted small"><span class="bonus">★</span> = 포지션 가산점 스탯. 스탯 이름에 마우스를 올리면 설명이 나와요.</p>' +
      statRows +
    "</div>";

  // 시작 버튼
  const saved = loadGame();
  const startCard =
    '<div class="card start-card">' +
      (draft.error ? '<div class="notice">' + draft.error + "</div>" : "") +
      '<div class="buttons">' +
        '<button class="primary big" data-start="1">커리어 시작 ▶</button>' +
        (saved ? '<button data-continue="1">저장된 게임 이어하기 (' + escapeHTML(saved.player.name) + ")</button>" : "") +
      "</div>" +
    "</div>";

  return (
    '<h1 class="creation-title">캐릭터 생성</h1>' +
    '<p class="muted">프로게이머로서의 첫걸음. 어떤 선수가 될지 정해 주세요.</p>' +
    nameCard + posCard + archCard + traitCard + statCard + startCard
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
    if (draft.error) { // 이름을 입력하면 안내 문구 지우기
      draft.error = "";
      const notice = box.querySelector(".start-card .notice");
      if (notice) notice.remove();
    }
  };
  document.getElementById("c-name").onkeydown = function (e) {
    if (e.key === "Enter") startCareer();
  };

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

  const reroll = box.querySelector("[data-reroll]");
  reroll.onclick = function () {
    if (draft.rerollsLeft <= 0) return;
    draft.rerollsLeft -= 1;
    // 지금 보이는 특성은 맨 뒤로 보내서, 다시 뽑으면 반드시 다른 특성이 나오게
    const current = draftTraits();
    const others = draft.traitOrder.filter(function (id) { return current.indexOf(id) === -1; });
    draft.traitOrder = shuffled(others).concat(shuffled(current));
    renderCreation();
  };

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
    traits: draftTraits(),
  };
  STATS.forEach(function (s) { fresh.stats[s.id] = draftStat(s.id); });
  fresh.staminaMax = arch.staminaMax;
  fresh.stamina = arch.staminaMax;

  draft = null;
  replaceState(fresh, "dashboard", escapeHTML(fresh.player.name) + " 선수의 커리어가 시작됐어요! 훈련을 고르고 [다음 주로 진행]을 눌러 보세요.");
  saveGame();
}
