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
    teams: makeTeamDefs(CREATION.startYears[0].year), // 이번 판 구단 이름 (구단 수는 시작 연도에 따라, data/era.js)
    teamChoice: -1,                     // 고른 구단 번호 (-1 = 무작위)
    look: randomLook(),                 // 얼굴 (js/portrait.js, 175)
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

// 경기 특성인가 (캐릭터 생성 때 TRAIT_FIT.matchLimit개까지, data/traits.js)
function isMatchTrait(id) { const t = findTrait(id); return !!t && t.group === "경기"; }

// 무작위로 채울 때도 경기 특성은 matchLimit개까지
function fillTraits(chosen, slots) {
  const out = chosen.slice();
  shuffled(TRAITS.filter(function (t) { return t.type === "good" && out.indexOf(t.id) === -1; }).map(function (t) { return t.id; })).forEach(function (id) {
    if (out.length >= slots) return;
    if (isMatchTrait(id) && out.filter(isMatchTrait).length >= TRAIT_FIT.matchLimit) return;
    out.push(id);
  });
  return out;
}

// 시작할 때: 덜 고른 칸은 무작위로 채움
function finalTraits() {
  return fillTraits(draftTraits(), traitSlots());
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

// 스탯 프리셋: 보너스 포인트를 그 스탯들에 고르게 (data/player.js CREATION.presets)
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
  draft.traits = fillTraits([], traitSlots());
  draft.alloc = {};
  for (let i = 0; i < CREATION.bonusPoints; i++) {
    const sid = pick(STATS).id;
    if (draftStat(sid) < 100) draft.alloc[sid] = (draft.alloc[sid] || 0) + 1;
  }
  draft.teamChoice = -1;
  draft.look = randomLook();
  draft.error = "";
}

// 구단 예상 전력 ★ (만들 때 정한 전력 보정 shift로)
function teamStarCount(def) {
  const r = CREATION.teamShift[def.tier];
  const max = r ? Math.max(1, r[1]) : 1;
  return Math.max(1, Math.min(5, Math.round(3 + 2 * (def.shift || 0) / max)));
}

// 별 표시 starsText(n)는 js/retire.js 것을 같이 씀 (예전엔 여기에도 같은 이름이 있어 retire.js 것이 덮어썼음, R1)

// 같은 리그 안에서 예상 순위 구간
function teamRankText(def) {
  const same = draft.teams.filter(function (d) { return d.tier === def.tier; });
  const higher = same.filter(function (d) { return (d.shift || 0) > (def.shift || 0); }).length;
  if (higher < same.length / 3) return "상위권";
  if (higher >= same.length * 2 / 3) return "하위권";
  return "중위권";
}

// ----- 화면 그리기 (213, 시안 19 '가. 한 단계씩 서류 작성') -----
// 왼쪽 = 7단계 목록(CREATION_STEPS, data/ui.js), 가운데 = 지금 단계 하나, 오른쪽 = 고를 때마다 채워지는 선수 등록증
// 휴대폰(860px 이하) = 위 진행 막대 + 아래 작은 등록증 (마지막 단계에서는 큰 등록증)
let creationStep = 0;    // 지금 단계 (0~6)
let creationSeenMax = 0; // 가 본 가장 뒤 단계 (✓ 표시용)

function goCreationStep(i) {
  creationStep = Math.max(0, Math.min(CREATION_STEPS.length - 1, i));
  creationSeenMax = Math.max(creationSeenMax, creationStep);
  renderCreation();
  window.scrollTo(0, 0);
}

// 1. 이름과 얼굴
function stepNameHTML() {
  return '<div class="name-row"><input type="text" id="c-name" maxlength="20" placeholder="선수 이름 (닉네임)" value="' + escapeHTML(draft.name) + '">' +
    '<button data-cname="1" title="무작위 이름">🎲 이름</button></div>' + lookPickerHTML();
}

// 2. 시작 연도
function stepYearHTML() {
  return '<div class="choices">' + CREATION.startYears.map(function (y) {
    return '<div class="choice' + (draft.startYear === y.year ? " selected" : "") + '" data-cyear="' + y.year + '">' +
      "<h3>" + y.year + "년</h3>" + '<p class="muted">' + y.desc + "</p>" +
      "<p>2026년까지 <b>" + (2026 - y.year + 1) + "시즌</b>, 챔피언 <b>" + releasedChampions(y.year, 1).length + "명</b></p></div>";
  }).join("") + "</div>";
}

// 3. 포지션
function stepPosHTML() {
  return '<div class="choices cr-list">' + POSITIONS.map(function (p) {
    return '<div class="choice' + (draft.position === p.id ? " selected" : "") + '" data-cpos="' + p.id + '">' +
      "<h3>" + p.name + "</h3>" + '<p class="muted">' + p.desc + "</p>" +
      '<p class="bonus-line">★ ' + p.bonus.map(statName).join(", ") + "</p></div>";
  }).join("") + "</div>";
}

// 4. 시작 유형
function stepArchHTML() {
  return '<div class="choices">' + ARCHETYPES.map(function (a) {
    return '<div class="choice' + (draft.archetype === a.id ? " selected" : "") + '" data-carch="' + a.id + '">' +
      "<h3>" + a.name + (a.difficulty ? ' <span class="badge-easy">' + a.difficulty + "</span>" : "") + "</h3>" +
      '<p class="muted">' + a.desc + "</p>" +
      "<ul><li>시작 나이 <b>" + a.age + "세</b>, 스탯 평균 <b>약 " + a.statAvg + "</b></li>" +
        "<li>체력 최대 <b>" + a.staminaMax + "</b>, 좋은 특성 <b>" + a.goodTraits + "개</b></li>" +
        (a.startTrait ? "<li>전용 특성 " + traitChipHTML(a.startTrait) + ' <span class="muted small">(' + a.startTraitSeasons + "시즌)</span></li>" : "") +
      "</ul>" + '<p class="up">장점: ' + a.strength + "</p>" + '<p class="down">약점: ' + a.weakness + "</p></div>";
  }).join("") + "</div>";
}

// 5. 특성
function stepTraitHTML() {
  const pickedTraits = draftTraits();
  const slots = traitSlots();
  const rec = TRAIT_RECOMMEND[draft.position] || [];
  const posName = findPosition(draft.position).name;
  const groups = [];
  TRAITS.forEach(function (t) { if (t.type === "good" && groups.indexOf(t.group) === -1) groups.push(t.group); });
  const matchPicked = pickedTraits.filter(isMatchTrait);
  const traitCardHTML = function (t) {
    const on = pickedTraits.indexOf(t.id) !== -1;
    const full = !on && pickedTraits.length >= slots && !(t.group === "경기" && matchPicked.length >= TRAIT_FIT.matchLimit); // 경기 특성끼리는 바꿔 끼울 수 있음
    const fits = t.fit ? t.fit.indexOf(draft.position) !== -1 : true;
    const isRec = rec.indexOf(t.id) !== -1;
    return '<div class="choice trait-pick' + (on ? " selected" : "") + (full ? " full" : "") + (isRec ? " rec" : "") + '" data-ctrait="' + t.id + '">' +
      "<h3>" + (on ? "✔ " : "") + t.name + (isRec ? ' <span class="rec-badge">⭐ ' + posName + " 추천</span>" : "") + "</h3>" +
      '<p class="muted">' + escapeHTML(t.desc) + "</p>" +
      (t.impact ? '<p class="impact">경기 영향: 세트 승률 <b>+' + t.impact.toFixed(1) + "%p</b>, " + escapeHTML(t.when) + "</p>" : "") +
      (t.fit ? '<p class="small ' + (fits ? "up" : "down") + '">🎯 어울리는 포지션: ' + traitFitText(t) + (fits ? " (" + posName + " ✔)" : ", " + posName + "은(는) 효과 절반") + "</p>" : "") +
    "</div>";
  };
  const arch = findArchetype(draft.archetype);
  return '<p class="cr-count"><b>' + pickedTraits.length + " / " + slots + "개</b> 골랐어요</p>" +
    '<p class="small">⚔️ <b>경기 특성은 ' + TRAIT_FIT.matchLimit + "개만</b> 고를 수 있어요 (다른 경기 특성을 누르면 바꿔 끼움). 🎯 어울리는 포지션이 아니면 효과가 절반이에요. " +
      "경기 영향은 그 특성을 가진 선수 1명이 있을 때 세트 승률이 얼마나 오르는지 잰 값이에요 (스탯 12개 전부 +5 ≈ +2.5%p).</p>" +
    (arch.startTrait ? '<p class="small">전용 특성: ' + traitChipHTML(arch.startTrait) + " 자동으로 붙어요 (" + arch.startTraitSeasons + "시즌 뒤 사라짐)</p>" : "") +
    '<h2 class="sub">⭐ ' + posName + " 추천</h2>" + '<div class="choices trait-choices">' + rec.map(findTrait).filter(Boolean).map(traitCardHTML).join("") + "</div>" +
    groups.map(function (g) {
      return '<h2 class="sub">' + g + '</h2><div class="choices trait-choices">' +
        TRAITS.filter(function (t) { return t.type === "good" && t.group === g; }).map(traitCardHTML).join("") + "</div>";
    }).join("");
}

// 6. 스탯
function stepStatHTML() {
  const rows = STATS.map(function (s) {
    const value = draftStat(s.id);
    const added = draft.alloc[s.id] || 0;
    const bonus = isBonusStat(s.id, draft.position);
    return '<div class="stat stat-edit">' +
      '<div class="stat-label' + (bonus ? " bonus" : "") + '" title="' + s.desc + '">' + (bonus ? "★ " : "") + s.name + "</div>" +
      '<div class="bar"><div class="bar-fill' + (bonus ? " gold" : "") + '" style="width:' + value + '%"></div></div>' +
      '<div class="stat-value">' + value + (added ? ' <span class="up">+' + added + "</span>" : "") + "</div>" +
      '<div class="pm"><button data-minus="' + s.id + '"' + (added > 0 ? "" : " disabled") + ">−</button>" +
        '<button data-plus="' + s.id + '"' + (pointsLeft() > 0 && value < 100 ? "" : " disabled") + ">+</button></div></div>";
  }).join("");
  const presetBtns = CREATION.presets.map(function (x) { return '<button data-cpreset="' + x.id + '">' + x.name + "</button>"; }).join("");
  return '<div class="cr-points"><span>남은 보너스 포인트</span><b>' + pointsLeft() + "</b><span>/ " + CREATION.bonusPoints + "</span></div>" +
    '<div class="buttons preset-row">' + presetBtns +
      '<button data-creset="1">↺ 포인트 초기화</button><button data-creroll="1" title="시작 스탯의 무작위 부분을 다시 정해요">🎲 스탯 다시 굴리기</button></div>' +
    rows + statGuideHTML(draft.position);
}

// 7. 소속팀
function stepTeamHTML(myScore) {
  const teamBtn = function (def, i) {
    const n = teamStarCount(def);
    const uni = uniformByShort(def.short);
    return '<div class="choice team-choice' + (draft.teamChoice === i ? " selected" : "") + '" data-cteam="' + i + '">' +
      '<span class="pf-frame">' + portraitHTMLFrom(draft.look, uni, { scale: 2, mood: draft.teamChoice === i ? "win" : "normal" }) + "</span>" +
      '<div class="team-choice-text"><b>' + escapeHTML(def.name) + "</b>" +
      '<div class="small">' + uniformSwatchHTML(uni) + '<span class="team-stars s' + n + '">' + starsText(n) + '</span></div><div class="small muted">예상 ' + teamRankText(def) + "</div></div></div>";
  };
  let t1 = "", t2 = "";
  draft.teams.forEach(function (def, i) { if (def.tier === 1) t1 += teamBtn(def, i); else t2 += teamBtn(def, i); });
  const chosen = draft.teams[draft.teamChoice];
  const warn = chosen && chosen.tier === 1 && myScore < LEAGUE.userTier1Score
    ? '<div class="notice">지금 내 스탯 점수는 <b>' + myScore.toFixed(1) + "</b>이고, 1부 주전 평균은 약 " + LEAGUE.npc.tier1Starter.avg + "이에요. 주전으로 뛰지만 힘든 출발이 될 수 있어요.</div>" : "";
  return '<p class="small">지금 내 스탯 점수: <b>' + myScore.toFixed(1) + "</b></p>" +
    '<div class="choices team-choices"><div class="choice team-choice' + (draft.teamChoice === -1 ? " selected" : "") + '" data-cteam="-1">' +
      '<b>무작위</b><br><span class="muted small">내 실력에 맞는 팀으로</span></div></div>' +
    '<h2 class="sub">1부 리그</h2><div class="choices team-choices">' + t1 + "</div>" +
    '<h2 class="sub">2부 리그</h2><div class="choices team-choices">' + t2 + "</div>" + warn;
}

// 등록증이 다 채워졌나 (이름 있음 + 보너스 포인트 다 씀)
function draftComplete() { return !!draft.name.trim() && pointsLeft() === 0; }

function creationHTML() {
  const stats = {};
  STATS.forEach(function (s) { stats[s.id] = draftStat(s.id); });
  const myScore = statScoreFor(stats, draft.position);
  const i = creationStep, st = CREATION_STEPS[i], last = CREATION_STEPS.length - 1;
  const stepState = function (k) {
    if (k === i) return "cur";
    if (k === 0 && !draft.name.trim() && creationSeenMax > 0) return "warn";
    return k <= creationSeenMax ? "done" : "";
  };
  const list = CREATION_STEPS.map(function (s, k) {
    return '<li><button class="' + stepState(k) + '" data-cstep="' + k + '"><span class="cr-no">' + (stepState(k) === "done" ? "✓" : stepState(k) === "warn" ? "!" : k + 1) + "</span>" + s.name + "</button></li>";
  }).join("");
  const prog = CREATION_STEPS.map(function (s, k) { return '<i class="' + stepState(k) + '"></i>'; }).join("");
  const bodies = [stepNameHTML, stepYearHTML, stepPosHTML, stepArchHTML, stepTraitHTML, stepStatHTML, stepTeamHTML];
  const hint = st.id === "pos"
    ? "가산점 스탯(★)은 시작값 +" + POSITION_BONUS.startBonus + ", 훈련 효과 " + percentText(POSITION_BONUS.trainingBonus) + ", 경기에서 " + POSITION_BONUS.matchMultiplier + "배로 계산돼요."
    : st.id === "trait" ? findArchetype(draft.archetype).name + " 유형은 좋은 특성을 " + traitSlots() + "개 고를 수 있어요. " + st.hint
    : st.id === "stat" ? "보너스 포인트 " + CREATION.bonusPoints + "점을 나눠요. " + st.hint
    : st.hint;
  const nav =
    '<div class="cr-nav">' +
      (i > 0 ? '<button data-cstep="' + (i - 1) + '">이전: ' + CREATION_STEPS[i - 1].name + "</button>" : "<span></span>") +
      (i < last ? '<button class="primary" data-cstep="' + (i + 1) + '">다음: ' + CREATION_STEPS[i + 1].name + "</button>"
                : '<button class="primary big" data-start="1">등록하고 커리어 시작</button>') +
    "</div>";
  return (
    '<div class="cr-wrap cr-at-' + st.id + '">' +
      '<nav class="cr-rail"><ol class="cr-steps">' + list + "</ol>" +
        '<div class="cr-tools"><button data-crandom="1">🎲 전부 무작위로</button><button data-cback="1">처음 화면으로</button></div></nav>' +
      '<div class="cr-main">' +
        '<div class="cr-prog">' + prog + '</div><div class="cr-stepno">' + (i + 1) + " / " + CREATION_STEPS.length + " 단계</div>" +
        '<h1 class="cr-title">' + st.name + '</h1><p class="cr-hint">' + hint + "</p>" +
        (draft.error ? '<div class="notice">' + draft.error + "</div>" : "") +
        '<div class="cr-body">' + bodies[i](myScore) + "</div>" + nav +
      "</div>" +
      '<aside class="cr-side">' + regCardHTML(stats, myScore) + "</aside>" +
      miniRegHTML() +
    "</div>"
  );
}

// 오른쪽 선수 등록증 (고를 때마다 채워짐, 시작 화면 등록증과 같은 모양 — css 25부분)
function regCardHTML(stats, myScore) {
  const arch = findArchetype(draft.archetype);
  const pos = findPosition(draft.position);
  const picked = draftTraits();
  const T1 = LEAGUE.npc.tier1Starter.avg, T2 = LEAGUE.npc.tier2Starter.avg;
  const level = myScore >= T1 ? "1부 주전급" : myScore >= LEAGUE.userTier1Score ? "1부 도전 가능" : myScore >= T2 ? "2부 주전급" : "2부 유망주";
  const team = draft.teams[draft.teamChoice];
  const uni = team ? uniformByShort(team.short) : FREE_AGENT_UNIFORM;
  const fld = function (k, v, cls) { return '<div class="reg-fld">' + k + "<span" + (cls ? ' class="' + cls + '"' : "") + ">" + v + "</span></div>"; };
  const bars = STATS.map(function (s) {
    const v = stats[s.id], bonus = isBonusStat(s.id, draft.position);
    return '<div class="cr-stat"><span class="' + (bonus ? "bonus" : "muted") + '">' + (bonus ? "★" : "") + s.name + "</span>" +
      '<span class="bar"><span class="bar-fill' + (bonus ? " gold" : "") + '" style="width:' + v + '%"></span></span><b>' + v + "</b></div>";
  }).join("");
  const empty = [];
  for (let k = picked.length; k < traitSlots(); k++) empty.push('<span class="chip muted">＋ 무작위</span>');
  return (
    '<div class="reg-card cr-reg"><h3>e스포츠 선수 등록증</h3><div class="reg-yr">' + draft.startYear + " 시즌</div>" +
      '<div class="reg-body"><div class="reg-slot">' + portraitHTMLFrom(draft.look, uni, { scale: 2, jump: true }) + "</div>" +
        '<div class="reg-fields">' +
          fld("선수명", draft.name.trim() ? escapeHTML(draft.name.trim()) : "", "cr-name") +
          fld("포지션", pos.name) + fld("유형", arch.name + ", " + arch.age + "세") +
          fld("소속", team ? escapeHTML(team.name) + " (" + tierName(team.tier) + ")" : "무작위") +
        "</div></div>" +
      '<div class="reg-stamp ' + (draftComplete() ? "ok" : "wip") + '">' + (draftComplete() ? "작성 완료" : "작성 중") + "</div>" +
      '<div class="cr-score"><span>스탯 점수</span> <b>' + myScore.toFixed(1) + "</b> <i>" + level + "</i></div>" +
      '<div class="cr-gauge"><div class="cr-fill" style="width:' + Math.min(100, myScore) + '%"></div>' +
        '<span class="cr-mark" style="left:' + T2 + '%">2부 ' + T2 + "</span>" +
        '<span class="cr-mark" style="left:' + T1 + '%">1부 ' + T1 + "</span></div>" +
      '<div class="cr-stats">' + bars + "</div>" +
      '<div class="chips cr-traits">' + picked.map(traitChipHTML).join("") + empty.join("") + (arch.startTrait ? traitChipHTML(arch.startTrait) : "") + "</div>" +
      (pointsLeft() > 0 ? '<div class="small down cr-left">보너스 포인트 ' + pointsLeft() + "점이 남았어요</div>" : "") +
    "</div>"
  );
}

// 휴대폰 아래 작은 등록증
function miniRegHTML() {
  const team = draft.teams[draft.teamChoice];
  const uni = team ? uniformByShort(team.short) : FREE_AGENT_UNIFORM;
  const done = draftComplete();
  return '<div class="cr-mini">' + portraitHTMLFrom(draft.look, uni, { scale: 1 }) +
    '<div><b class="cr-name">' + (draft.name.trim() ? escapeHTML(draft.name.trim()) : "이름 없음") + "</b>" +
      findPosition(draft.position).name + ", " + findArchetype(draft.archetype).name + ", " + draft.startYear + "년</div>" +
    '<span class="cr-mini-stamp' + (done ? " ok" : "") + '">' + (done ? "작성 완료" : "작성 중") + "</span></div>";
}

// ----- 시작 화면 (212, 시안 18 '나. 선수 등록증') -----
// 캐릭터가 없을 때(처음 접속·새 게임) 캐릭터 생성 전에 한 번 보여 줌. [선수 등록하기] → 캐릭터 생성
// draft는 지금처럼 먼저 만들어 둠 (측정 도구가 draft를 바로 고쳐 쓰기 때문, 난수 순서도 그대로)
let startScreenDone = false;
const START_FEATURES = [
  "무명 신인으로 시작해 월드 챔피언, 그리고 전설까지",
  "한 주씩 훈련을 고르고 경기를 뛰고 연락에 답해요",
  "2012년부터 이어지는 리그에서 승격, 이적, 우승에 도전",
  "해외 리그 선수들과 국제대회에서 맞붙어요",
];

function startScreenHTML() {
  const saved = loadGame();
  let oldCard = "", contBtn = "";
  if (saved && saved.player) {
    const sp = saved.player;
    const team = saved.league && saved.league.teams ? saved.league.teams.find(function (t) { return t.roster.indexOf(USER_ID) !== -1; }) : null;
    const uni = team ? uniformByShort(team.short) : FREE_AGENT_UNIFORM;
    const pos = findPosition(sp.position);
    const look = sp.look || randomLook("me:" + sp.name);
    const posName = pos ? pos.name : "";
    oldCard =
      '<div class="reg-card reg-old" aria-hidden="true"><h3>e스포츠 선수 등록증</h3><div class="reg-yr">' + saved.year + " 시즌</div>" +
        '<div class="reg-body"><div class="reg-slot">' + portraitHTMLFrom(look, uni, { scale: 2 }) + "</div>" +
        '<div class="reg-fields"><div class="reg-fld">선수명<span>' + escapeHTML(sp.name) + "</span></div>" +
        '<div class="reg-fld">포지션<span>' + posName + "</span></div>" +
        '<div class="reg-fld">소속<span>' + (team ? escapeHTML(team.name) : "없음") + "</span></div></div></div>" +
        '<div class="reg-stamp ok">' + (saved.retired ? "은퇴" : "현역") + "</div></div>";
    contBtn =
      '<button class="start-cont" data-continue="1">' + portraitHTMLFrom(look, uni, { scale: 1 }) +
        "<div><b>이어하기</b><span>" + escapeHTML(sp.name) + (posName ? " (" + posName + ")" : "") + ", " + saved.year + "년 " + saved.week + "주차</span></div></button>";
  }
  const blank = '<div class="reg-blank">' + portraitHTMLFrom(draft.look, FREE_AGENT_UNIFORM, { scale: 2 }) + "</div>";
  const newCard =
    '<div class="reg-card reg-new"><h3>e스포츠 선수 등록증</h3><div class="reg-yr">새 시즌</div>' +
      '<div class="reg-body"><div class="reg-slot">' + blank + "</div>" +
      '<div class="reg-fields"><div class="reg-fld">선수명<span></span></div><div class="reg-fld">포지션<span></span></div>' +
      '<div class="reg-fld">소속<span></span></div><div class="reg-fld">데뷔<span></span></div></div></div>' +
      '<div class="reg-stamp">미등록</div></div>';
  return (
    '<div class="start-screen">' +
      '<div class="start-main">' +
        '<h1 class="start-logo">' + pixelLogoHTML("챌린저 로드", 4, { size: 22 }) + "</h1>" +
        '<p class="start-tag">무명 신인에서 전설까지, 한 주씩</p>' +
        '<div class="start-btns"><button class="start-new" data-register="1">선수 등록하기</button>' + contBtn + "</div>" +
        '<ul class="start-feat">' + START_FEATURES.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>" +
      "</div>" +
      '<div class="reg-stack' + (oldCard ? " has-old" : "") + '">' + oldCard + newCard + "</div>" +
      '<div class="start-ver">' + escapeHTML(gameVersionText()) + "</div>" +
    "</div>"
  );
}

// 버전 글자는 Challenger_Road.html 왼쪽 위 로고(.logo .ver) 한 곳에서만 고침
function gameVersionText() {
  const el = document.querySelector(".logo .ver");
  return el ? el.textContent.trim() : "";
}

function renderStartScreen() {
  const box = document.getElementById("creation");
  box.innerHTML = startScreenHTML();
  box.querySelector("[data-register]").onclick = function () {
    startScreenDone = true;
    renderCreation();
    window.scrollTo(0, 0);
  };
  const cont = box.querySelector("[data-continue]");
  if (cont) cont.onclick = continueSavedGame;
}

function continueSavedGame() {
  const loaded = loadGame();
  if (!loaded) return;
  draft = null;
  replaceState(loaded, "dashboard", "저장된 게임을 이어서 시작해요.");
}

function renderCreation() {
  if (!draft) { draft = newDraft(); startScreenDone = false; creationStep = 0; creationSeenMax = 0; }
  // 시작 연도가 바뀌어 구단 수가 달라지면 구단 목록 다시 만들기 (2012년 1부 8·2부 6 / 2017년 10·8)
  const need = eraTeams(draft.startYear);
  const have = { 1: draft.teams.filter(function (d) { return d.tier === 1; }).length, 2: draft.teams.filter(function (d) { return d.tier === 2; }).length };
  if (need[1] !== have[1] || need[2] !== have[2]) { draft.teams = makeTeamDefs(draft.startYear); draft.teamChoice = -1; }
  if (!startScreenDone) { renderStartScreen(); return; } // 시작 화면 (구단 목록 맞추기 뒤에: 측정 도구가 연도만 바꾸고 부를 때도 같은 결과)
  const box = document.getElementById("creation");
  const scrollY = window.scrollY;
  box.innerHTML = creationHTML();
  window.scrollTo(0, scrollY); // 다시 그려도 스크롤 위치 유지 (단계를 옮길 때는 goCreationStep이 맨 위로)
  // 단계마다 있는 버튼만 있으므로 없으면 건너뜀
  const all = function (sel, fn) { box.querySelectorAll(sel).forEach(function (el) { el.onclick = function () { fn(el); }; }); };
  const redraw = function (fn) { return function (el) { fn(el); renderCreation(); }; };

  const nameInput = document.getElementById("c-name");
  if (nameInput) {
    nameInput.oninput = function () {
      draft.name = this.value;
      if (draft.error) draft.error = ""; // 이름을 입력하면 안내 문구 지우기
      // 등록증 이름만 바로 바꾸기 (다시 그리면 입력 칸 커서가 사라져서)
      box.querySelectorAll(".cr-name").forEach(function (el) { el.innerHTML = draft.name.trim() ? escapeHTML(draft.name.trim()) : ""; });
      const notice = box.querySelector(".cr-main .notice");
      if (notice) notice.remove();
    };
    nameInput.onkeydown = function (e) {
      if (e.key === "Enter") goCreationStep(creationStep + 1); // 엔터 = 다음 단계
    };
  }

  all("[data-cstep]", function (el) { goCreationStep(Number(el.getAttribute("data-cstep"))); });
  all("[data-cback]", function () { startScreenDone = false; renderCreation(); window.scrollTo(0, 0); });
  all("[data-cyear]", redraw(function (el) { draft.startYear = Number(el.getAttribute("data-cyear")); }));
  all("[data-cteam]", redraw(function (el) { draft.teamChoice = Number(el.getAttribute("data-cteam")); }));
  all("[data-cpos]", redraw(function (el) { draft.position = el.getAttribute("data-cpos"); }));
  all("[data-carch]", redraw(function (el) { draft.archetype = el.getAttribute("data-carch"); }));
  all("[data-plus]", redraw(function (el) {
    const id = el.getAttribute("data-plus");
    if (pointsLeft() > 0 && draftStat(id) < 100) draft.alloc[id] = (draft.alloc[id] || 0) + 1;
  }));
  all("[data-minus]", redraw(function (el) {
    const id = el.getAttribute("data-minus");
    if (draft.alloc[id] > 0) draft.alloc[id] -= 1;
  }));
  all("[data-ctrait]", redraw(function (el) {
    const id = el.getAttribute("data-ctrait");
    draft.traits = draftTraits(); // 유형을 바꿔 넘친 것은 정리
    const i = draft.traits.indexOf(id);
    if (i !== -1) draft.traits.splice(i, 1);
    else if (isMatchTrait(id) && draft.traits.filter(isMatchTrait).length >= TRAIT_FIT.matchLimit) {
      const old = draft.traits.filter(isMatchTrait)[0]; // 경기 특성은 1개만: 바꿔 끼움
      draft.traits[draft.traits.indexOf(old)] = id;
    }
    else if (draft.traits.length < traitSlots()) draft.traits.push(id);
    else if (traitSlots() === 1) draft.traits = [id]; // 1개짜리 유형은 바로 바꿔 끼움
  }));
  all("[data-cpreset]", redraw(function (el) { applyPreset(el.getAttribute("data-cpreset")); }));
  all("[data-creset]", redraw(function () { draft.alloc = {}; }));
  all("[data-creroll]", redraw(function () { rerollOffsets(); }));
  all("[data-crandom]", redraw(function () { randomizeDraft(); creationSeenMax = CREATION_STEPS.length - 1; }));
  all("[data-cname]", redraw(function () { draft.name = pick(PLAYER_NAMES); draft.error = ""; }));
  all("[data-clook]", redraw(function (el) { changeLook(draft.look, el.getAttribute("data-clook"), Number(el.getAttribute("data-d"))); }));
  all("[data-clookrand]", redraw(function () { draft.look = randomLook(); }));
  all("[data-start]", function () { startCareerFromButton(); });
}

// [등록하고 커리어 시작] 버튼 (214): 확인 → '등록 완료' 도장 연출 → startCareer(true)
// 측정 도구는 startCareer(true)를 바로 부르므로 연출이 없음 (게임 결과와 무관, 무작위도 안 씀)
function startCareerFromButton() {
  if (!draft.name.trim()) { startCareer(); return; } // 이름 안내는 startCareer가
  const go = function () { playRegisterStamp(function () { startCareer(true); }); };
  if (pointsLeft() > 0) askConfirm("보너스 포인트가 " + pointsLeft() + "점 남았어요. 이대로 시작할까요?", go, "이대로 시작");
  else go();
}

// 등록증이 가운데로 커지고 '등록 완료' 도장이 쾅 → 얼굴이 웃음 → done (약 1.6초)
// 움직임 끄기(설정)·기기의 '동작 줄이기'면 바로 done. 누르거나 아무 키나 누르면 건너뜀
function playRegisterStamp(done) {
  const card = document.querySelector(".cr-reg");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motionOff() || reduce || !card) { done(); return; }
  const R = REGISTER_FX;
  const fx = document.createElement("div");
  fx.id = "reg-fx";
  const copy = card.cloneNode(true);
  const old = copy.querySelector(".reg-stamp");
  if (old) old.remove();
  copy.insertAdjacentHTML("beforeend", '<div class="reg-stamp fx-stamp">' + R.stampText + "</div>");
  fx.appendChild(copy);
  document.body.appendChild(fx);
  let finished = false;
  const timers = [];
  const finish = function () {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKey, true);
    done();
    fx.remove();
  };
  const onKey = function (e) { e.preventDefault(); e.stopPropagation(); finish(); }; // Space가 '다음 주'로 새지 않게
  fx.onclick = finish;
  document.addEventListener("keydown", onKey, true);
  timers.push(setTimeout(function () { // 도장이 닿는 순간: 흔들림 + 웃는 얼굴
    copy.classList.add("fx-hit");
    const slot = copy.querySelector(".reg-slot");
    const team = draft && draft.teams[draft.teamChoice];
    if (slot && draft) slot.innerHTML = portraitHTMLFrom(draft.look, team ? uniformByShort(team.short) : FREE_AGENT_UNIFORM, { scale: 2, mood: "win" });
  }, R.hitMs));
  timers.push(setTimeout(finish, R.totalMs));
}

// [커리어 시작]: 초안을 진짜 게임 상태로 바꾸기 (sure: 보너스 포인트가 남아도 묻지 않음)
function startCareer(sure) {
  const name = draft.name.trim();
  if (!name) {
    draft.error = "이름을 한 글자 이상 입력해 주세요.";
    creationStep = 0; // 이름 단계로
    renderCreation();
    const input = document.getElementById("c-name");
    if (input) input.focus();
    return;
  }
  if (pointsLeft() > 0 && sure !== true) {
    askConfirm("보너스 포인트가 " + pointsLeft() + "점 남았어요. 이대로 시작할까요?", function () { startCareer(true); }, "이대로 시작");
    return;
  }

  const arch = findArchetype(draft.archetype);
  const fresh = createNewState();
  if (state && state.settings) fresh.settings = state.settings;

  fresh.player = {
    name: name.slice(0, 20),
    position: draft.position,
    archetype: draft.archetype,
    age: arch.age,
    traits: finalTraits(),
    look: draft.look || randomLook(), // 얼굴 (js/portrait.js)
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
  enforceConditionCap(); // 2부는 합숙으로 시작 (js/shop.js)
  replaceState(fresh, "dashboard", escapeHTML(fresh.player.name) + " 선수의 커리어가 시작됐어요! " + extra.trim()); // 훈련·진행 안내는 코치가 (215, js/guide.js)
  saveGame();
}

// 첫 계약 (data/contracts.js FIRST_CONTRACT): 돌려주는 값 = 시작 안내에 붙일 글
function applyFirstContract() {
  const F = FIRST_CONTRACT;
  const team = myTeam();
  if (!team || !state.contract) return "";
  state.contract.endYear = state.year;
  state.contract.endWeek = F.endWeek;
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
  let text = "연봉 " + moneyText(state.contract.salary) + (boost > 0 ? "(능력 보너스 +" + Math.round(boost * 100) + "%)" : "") + ". 첫 계약은 " + F.endWeek + "주까지이며, " + SUMMER_MARKET.start + "주에 재계약 제안이 와요. ";
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

// 전용 특성이 사라지는 해 = 데뷔 연도 + startTraitSeasons (데뷔 기록이 없으면 만들 때 저장한 값)
function startTraitEndYear(p, career) {
  const arch = findArchetype(p.archetype);
  if (!arch || !arch.startTrait) return null;
  if (career && career.debut && Number.isFinite(career.debut.year)) return career.debut.year + arch.startTraitSeasons;
  return p.startTraitUntil || null;
}

// 새 시즌 (js/main.js): 전용 특성 기간이 끝났으면 빼기 — 유망주는 3년차 시즌이 시작될 때
function expireStartTrait() {
  const p = state.player;
  const until = startTraitEndYear(p, state.career);
  if (!until || state.year < until) return;
  const arch = findArchetype(p.archetype);
  const id = arch && arch.startTrait;
  p.startTraitUntil = null;
  if (!id || p.traits.indexOf(id) === -1) return;
  p.traits.splice(p.traits.indexOf(id), 1);
  addNews("특성", findTrait(id).name + " 기간이 끝났다. 데뷔 " + arch.startTraitSeasons + "시즌 동안 받던 훈련·숙련도 보너스가 사라지고, 이제 진짜 실력으로 승부할 때다.");
}

// ----- 얼굴 고르기 (175, 디자인 D1 — 그림은 js/portrait.js) -----
const LOOK_FIELDS = [
  { key: "skin", name: "피부색", list: function () { return PORTRAIT.skins.map(function (x) { return x.name; }); } },
  { key: "hs", name: "머리 모양", list: function () { return PORTRAIT.hairStyles; } },
  { key: "hairC", name: "머리색", list: function () { return PORTRAIT.hairColors.map(function (x) { return x.name; }); } },
  { key: "eyes", name: "눈", list: function () { return PORTRAIT.eyes; } },
  { key: "face", name: "얼굴", list: function () { return PORTRAIT.faces; } },
  { key: "headset", name: "헤드셋", list: function () { return ["없음", "있음"]; } },
  { key: "glasses", name: "안경", list: function () { return ["없음", "있음"]; } },
];
function changeLook(look, key, d) {
  const f = LOOK_FIELDS.find(function (x) { return x.key === key; });
  if (!f) return;
  if (typeof look[key] === "boolean") look[key] = !look[key];
  else { const n = f.list().length; look[key] = ((look[key] || 0) + d + n) % n; }
}
function lookPickerHTML() {
  const L = draft.look;
  const rows = LOOK_FIELDS.map(function (f) {
    const v = typeof L[f.key] === "boolean" ? (L[f.key] ? 1 : 0) : L[f.key];
    return '<div class="look-row"><span>' + f.name + '</span><button data-clook="' + f.key + '" data-d="-1">◀</button><div class="look-val">' + escapeHTML(f.list()[v]) +
      '</div><button data-clook="' + f.key + '" data-d="1">▶</button></div>';
  }).join("");
  return '<div class="look-picker"><div class="look-rows">' + rows + '</div><div class="buttons"><button data-clookrand="1">🎲 얼굴 무작위</button>' +
    '<span class="muted small">유니폼은 7단계 소속팀에서 고른 팀 색이에요. 다른 선수 얼굴은 자동이에요.</span></div></div>';
}
function uniformSwatchHTML(uni) {
  return '<span class="uni-sw"><i style="background:' + uni[0] + '"></i><i style="background:' + uni[1] + '"></i></span>';
}
