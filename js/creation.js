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

// ----- 화면 그리기 -----
function creationHTML() {
  // 1. 이름
  const nameCard =
    '<div class="card"><h2>1. 이름</h2>' +
      '<input type="text" id="c-name" maxlength="20" placeholder="선수 이름 (닉네임)" value="' + escapeHTML(draft.name) + '">' +
    "</div>";

  // 2. 시작 연도
  let yearCards = "";
  CREATION.startYears.forEach(function (y) {
    const seasons = 2026 - y.year + 1;
    yearCards +=
      '<div class="choice' + (draft.startYear === y.year ? " selected" : "") + '" data-cyear="' + y.year + '">' +
        "<h3>" + y.year + "년</h3>" +
        '<p class="muted">' + y.desc + "</p>" +
        "<p>2026년까지 <b>" + seasons + "시즌</b></p>" +
        "<p>그때까지 나온 챔피언 <b>" + releasedChampions(y.year, 1).length + "명</b></p>" +
      "</div>";
  });
  const yearCard =
    '<div class="card"><h2>2. 시작 연도</h2>' +
      '<p class="muted">늦게 시작할수록 훈련할 시간이 짧아서 시작 스탯에 보정을 받아요. 한 시즌은 52주예요.</p>' +
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
        '<p class="bonus-line">★ 가산점: ' + bonusNames + "</p>" +
      "</div>";
  });
  const posCard =
    '<div class="card"><h2>3. 포지션</h2>' +
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
        "<h3>" + a.name + (a.difficulty ? ' <span class="badge-easy">' + a.difficulty + "</span>" : "") + "</h3>" +
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
    '<div class="card"><h2>4. 시작 유형</h2><div class="choices">' + archCards + "</div></div>";

  // 5. 특성
  const pickedTraits = draftTraits();
  const slots = traitSlots();
  const groups = [];
  TRAITS.forEach(function (t) { if (t.type === "good" && groups.indexOf(t.group) === -1) groups.push(t.group); });
  const traitGroups = groups.map(function (g) {
    const cards = TRAITS.filter(function (t) { return t.type === "good" && t.group === g; }).map(function (t) {
      const on = pickedTraits.indexOf(t.id) !== -1;
      const full = !on && pickedTraits.length >= slots;
      return '<div class="choice trait-pick' + (on ? " selected" : "") + (full ? " full" : "") + '" data-ctrait="' + t.id + '">' +
        "<h3>" + (on ? "✔ " : "") + t.name + "</h3><p class=\"muted\">" + escapeHTML(t.desc) + "</p></div>";
    }).join("");
    return '<h2 class="sub">' + g + '</h2><div class="choices trait-choices">' + cards + "</div>";
  }).join("");
  const traitCard =
    '<div class="card"><h2>5. 특성 <span class="muted small">' + pickedTraits.length + " / " + slots + "개 선택</span></h2>" +
      '<p class="muted small">' + findArchetype(draft.archetype).name + " 유형은 좋은 특성을 " + slots + "개 고를 수 있어요. 눌러서 고르고, 다시 누르면 빠져요. " +
        "덜 고르고 시작하면 남은 칸은 무작위로 채워져요. 나쁜 특성은 게임 중 이벤트로만 생겨요.</p>" +
      (pickedTraits.length ? '<div class="chips">' + pickedTraits.map(traitChipHTML).join("") + "</div>" : "") +
      traitGroups +
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
    '<div class="card"><h2>6. 스탯 <span class="muted small">보너스 포인트 남음: <b>' + pointsLeft() + "</b> / " + CREATION.bonusPoints + "</span></h2>" +
      '<p class="muted small"><span class="bonus">★</span> = 포지션 가산점 스탯. 스탯 이름에 마우스를 올리면 설명이 나와요.</p>' +
      statRows +
      statGuideHTML(draft.position) +
    "</div>";

  // 시작 버튼
  // 7. 소속팀
  const stats = {};
  STATS.forEach(function (s) { stats[s.id] = draftStat(s.id); });
  const myScore = statScoreFor(stats, draft.position);
  const teamBtn = function (def, i) {
    return '<div class="choice team-choice' + (draft.teamChoice === i ? " selected" : "") + '" data-cteam="' + i + '">' +
      '<b>' + escapeHTML(def.name) + "</b></div>";
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
      '<p class="muted small">뛰고 싶은 팀을 고르세요. 내 선수는 그 팀의 주전이 돼요. 지금 내 스탯 점수: <b>' + myScore.toFixed(1) + "</b></p>" +
      '<div class="choices team-choices"><div class="choice team-choice' + (draft.teamChoice === -1 ? " selected" : "") + '" data-cteam="-1">' +
        "<b>무작위</b><br><span class=\"muted small\">내 실력에 맞는 팀으로</span></div></div>" +
      '<h2 class="sub">1부 리그</h2><div class="choices team-choices">' + t1 + "</div>" +
      '<h2 class="sub">2부 리그</h2><div class="choices team-choices">' + t2 + "</div>" +
      warn +
    "</div>";

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
    nameCard + yearCard + posCard + archCard + traitCard + statCard + teamCard + startCard
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
  STATS.forEach(function (s) { fresh.stats[s.id] = draftStat(s.id); });
  fresh.staminaMax = arch.staminaMax;
  fresh.stamina = arch.staminaMax;
  fresh.year = draft.startYear;
  fresh.week = 1;
  fresh.mastery = startMastery(fresh.stats, fresh.player.position, fresh.year, fresh.week);
  fresh.meta = makePatch(fresh.year, fresh.week);

  const teams = draft.teams, teamChoice = draft.teamChoice;
  draft = null;
  window.scrollTo(0, 0); // 생성 화면에서 내려간 스크롤을 맨 위로
  state = fresh;
  makeLeague(teams, teamChoice); // 리그·구단·선수 만들고 내 소속팀 정하기
  replaceState(fresh, "dashboard", escapeHTML(fresh.player.name) + " 선수의 커리어가 시작됐어요! 훈련을 고르고 [다음 주로 진행]을 눌러 보세요.");
  saveGame();
}
