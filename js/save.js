// ===== 저장 / 불러오기 =====
// 세이브는 브라우저 저장소(localStorage)에 글자(JSON)로 저장됩니다.
// 세이브 모양: { game, version, savedAt, state: { ...게임 상태... } }

const SAVE_KEY = "progamer-career-save";
const SAVE_GAME_ID = "progamer-career";
const SAVE_VERSION = 10; // 10: NPC 특성·S급 특성·스탯 상한선 / 9: 노화·은퇴·역사관 / 8: 메타 S급·퀘스트 / 7: 솔로 랭크·지난주 결과 / 6: 계약·이적 / 5: SNS·이벤트 / 4: 리그 / 2: 캐릭터 생성·스탯 12개 / 3: 연도·챔피언 숙련도·평판

// 저장할 항목 (화면 상태처럼 저장할 필요 없는 것은 빼고)
const SAVED_FIELDS = ["newsState", "player", "team", "money", "year", "week", "stats", "stamina", "staminaMax", "condition", "popularity", "reputation", "mastery", "meta", "practiceChamp", "plan", "log", "settings", "league", "inbox", "msgSeq", "eventCooldown", "career", "skipTraining", "matchBoost", "contract", "pendingMove", "benched", "benchWeeks", "transferListed", "transferRequestsLeft", "soloRank", "weekReport", "quests", "questSeq", "focusChamp", "retirePlanned", "retired", "compPlan", "shop", "activities", "pendingEvents", "tutorial", "housing", "loan", "trainHistory", "shakeup", "newChampBuff", "dormWeeks", "world", "fame", "signature", "sig100", "sigGrowth", "achievements", "eventLog", "flags", "relations", "trigQueue", "friends", "standing", "romance"];

// 현재 게임 상태를 세이브 모양으로 만들기
function makeSaveData() {
  const data = {};
  SAVED_FIELDS.forEach(function (key) { data[key] = state[key]; });
  return {
    game: SAVE_GAME_ID,
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: data,
  };
}

// 세이브를 게임 상태로 되돌리기.
// 이상한 값은 버리고 새 게임 기본값을 쓰므로, 예전 세이브나 망가진 값이 있어도 게임이 멈추지 않습니다.
// 세이브가 아니면 오류를 냅니다.
function stateFromSave(save) {
  if (!save || save.game !== SAVE_GAME_ID || typeof save.state !== "object" || save.state === null) {
    throw new Error("이 게임의 세이브 파일이 아닙니다.");
  }
  const s = save.state;
  const fresh = createNewState();
  if (s.newsState && Array.isArray(s.newsState.articles)) {
    fresh.newsState = { articles: s.newsState.articles.filter(function (a) { return a && typeof a.id === "string" && typeof a.headline === "string" && typeof a.body === "string"; }).slice(-NEWS_KEEP),
      notices: Array.isArray(s.newsState.notices) ? s.newsState.notices.filter(function (id) { return typeof id === "string"; }).slice(-400) : [] };
  }

  // 캐릭터 정보가 없으면 (예전 버전 세이브 등) 불러올 수 없음
  const p = s.player;
  if (!p || typeof p !== "object" || typeof p.name !== "string" || !findPosition(p.position) || !findArchetype(p.archetype)) {
    throw new Error("예전 버전이거나 캐릭터 정보가 없는 세이브라 불러올 수 없습니다.");
  }
  const arch = findArchetype(p.archetype);
  fresh.player = {
    name: p.name.trim().slice(0, 20) || "이름 없음",
    position: p.position,
    archetype: p.archetype,
    age: Number.isFinite(p.age) ? p.age : arch.age,
    traits: Array.isArray(p.traits) ? p.traits.filter(function (id) { return !!findTrait(id); }) : [],
  };

  if (Number.isFinite(p.startTraitUntil)) fresh.player.startTraitUntil = p.startTraitUntil; // 유망주 특성 끝나는 해 (예전엔 저장이 안 됐음)
  if (typeof s.team === "string") fresh.team = s.team;
  if (Number.isFinite(s.money)) fresh.money = s.money;
  if (Number.isFinite(s.year)) fresh.year = s.year;
  else if (Number.isFinite(s.season)) fresh.year = 2012 + s.season - 1; // 예전(버전 2) 세이브
  if (Number.isFinite(s.week)) fresh.week = Math.max(1, Math.min(CREATION.weeksPerSeason, s.week));
  fresh.staminaMax = Number.isFinite(s.staminaMax) ? clamp(s.staminaMax) : arch.staminaMax;
  fresh.stamina = Number.isFinite(s.stamina) ? Math.max(0, Math.min(fresh.staminaMax, s.stamina)) : fresh.staminaMax;
  if (Number.isFinite(s.condition)) fresh.condition = clamp(s.condition);
  if (Number.isFinite(s.popularity)) fresh.popularity = clamp(s.popularity);
  if (Number.isFinite(s.reputation)) fresh.reputation = Math.max(-100, Math.min(100, s.reputation));
  STATS.forEach(function (stat) {
    const v = s.stats && s.stats[stat.id];
    fresh.stats[stat.id] = Number.isFinite(v) ? clamp(v) : arch.statAvg; // 빠진 스탯은 유형 평균으로
  });
  if (findTraining(s.plan)) fresh.plan = s.plan;

  // 챔피언 숙련도: 출시된 챔피언만, 빠진 것은 새로 정함
  const startM = startMastery(fresh.stats, fresh.player.position, fresh.year, fresh.week);
  Object.keys(startM).forEach(function (name) {
    const v = s.mastery && s.mastery[name];
    fresh.mastery[name] = Number.isFinite(v) ? Math.max(MASTERY.min, Math.min(MASTERY.max, v)) : startM[name];
  });
  const metaOk = s.meta && typeof s.meta.label === "string" && s.meta.champs &&
    POSITION_IDS.every(function (id) { return Array.isArray(s.meta.champs[id]); });
  fresh.meta = metaOk ? s.meta : makePatch(fresh.year, fresh.week);
  if (typeof s.practiceChamp === "string" && fresh.mastery[s.practiceChamp] !== undefined) fresh.practiceChamp = s.practiceChamp;
  if (Array.isArray(s.log)) fresh.log = s.log.slice(0, 30);
  // SNS·이벤트
  if (Array.isArray(s.inbox)) fresh.inbox = trimMessages(s.inbox);
  if (Number.isFinite(s.msgSeq)) fresh.msgSeq = s.msgSeq;
  if (s.eventCooldown && typeof s.eventCooldown === "object") fresh.eventCooldown = s.eventCooldown;
  if (s.career && typeof s.career === "object") {
    fresh.career.finalsWon = Number(s.career.finalsWon) || 0;
    fresh.career.gainTried = s.career.gainTried || {};
    ["seasonGames", "games", "wins", "seasonWins", "questsDone", "questsGiven", "earned", "repSum", "repWeeks", "allstars", "allStarYear"].forEach(function (k) { fresh.career[k] = Number(s.career[k]) || 0; });
    if (Array.isArray(s.career.seasons)) fresh.career.seasons = s.career.seasons;
    if (Array.isArray(s.career.awards)) fresh.career.awards = s.career.awards;
    if (Array.isArray(s.career.deepRuns)) fresh.career.deepRuns = s.career.deepRuns; // 팀 내 입지 경력 (js/standing.js)
    if (s.career.debut) fresh.career.debut = s.career.debut;
    if (s.career.statStart) fresh.career.statStart = s.career.statStart;
    if (Array.isArray(s.career.moments)) fresh.career.moments = s.career.moments.slice(-120);
    else delete fresh.career.moments; // 예전 세이브: 우승·수상 기록으로 채움 (ensureMoments)
    fresh.career.agingStarted = s.career.agingStarted === true;
    fresh.career.challenger = s.career.challenger === true;
    if (s.career.rec && typeof s.career.rec === "object") fresh.career.rec = s.career.rec;
    if (Number.isFinite(s.career.benchedYear)) fresh.career.benchedYear = s.career.benchedYear;
  }
  fresh.skipTraining = s.skipTraining === true;
  // 계약
  if (s.contract && typeof s.contract === "object" && Number.isFinite(s.contract.salary)) fresh.contract = s.contract;
  if (s.pendingMove && typeof s.pendingMove === "object") fresh.pendingMove = s.pendingMove;
  fresh.benched = s.benched === true;
  if (Number.isFinite(s.benchWeeks)) fresh.benchWeeks = s.benchWeeks;
  fresh.transferListed = s.transferListed === true;
  if (s.soloRank && Number.isFinite(s.soloRank.points)) fresh.soloRank = s.soloRank;
  if (Array.isArray(s.quests)) fresh.quests = s.quests.filter(function (q) { return findQuest(q.id); });
  if (Number.isFinite(s.questSeq)) fresh.questSeq = s.questSeq;
  if (typeof s.focusChamp === "string") fresh.focusChamp = s.focusChamp;
  if (s.weekReport && typeof s.weekReport === "object" && s.weekReport.training) fresh.weekReport = s.weekReport;
  if (Number.isFinite(s.transferRequestsLeft)) fresh.transferRequestsLeft = s.transferRequestsLeft;
  if (Number.isFinite(s.matchBoost)) fresh.matchBoost = s.matchBoost;
  fresh.retirePlanned = s.retirePlanned === true;
  if (COMP_PLANS.some(function (p) { return p.id === s.compPlan; })) fresh.compPlan = s.compPlan;
  if (s.shop && typeof s.shop === "object") fresh.shop = s.shop;
  if (s.loan && typeof s.loan === "object") fresh.loan = s.loan; // 여름 임대 중
  if (Array.isArray(s.trainHistory)) fresh.trainHistory = s.trainHistory.slice(-8); // 최근 훈련 기록
  if (s.housing && typeof s.housing === "object" && SHOP_HOUSING.some(function (h) { return h.id === s.housing.id; })) fresh.housing = s.housing; // 거주지 (없으면 합숙)
  fresh.tutorial = s.tutorial && typeof s.tutorial === "object" ? s.tutorial : { on: false, done: {}, visited: {} }; // 예전 세이브는 안내 꺼짐
  if (Array.isArray(s.activities)) fresh.activities = s.activities.filter(function (a) { return a && ACTIVITIES[a.id]; });
  if (Array.isArray(s.pendingEvents)) fresh.pendingEvents = s.pendingEvents.filter(function (p) { return p && findEvent(p.event); });
  if (s.retired && typeof s.retired === "object" && s.retired.titles && Number.isFinite(s.retired.points)) fresh.retired = s.retired;

  // 리그: 기본 모양이 맞으면 그대로, 아니면 화면을 그릴 때 새로 만듦
  const L = s.league;
  if (L && Array.isArray(L.teams) && L.players && L.season && Array.isArray(L.season.matches) &&
      L.teams.some(function (t) { return Array.isArray(t.roster) && t.roster.indexOf("USER") !== -1; })) {
    fresh.league = L;
    // 기존 세이브에 이미 잡힌 컵 경기 일정에도 새 명칭 적용.
    L.season.matches.forEach(function (m) {
      if (typeof m.label !== "string") return;
      if (m.comp === "cup") m.label = m.label.replace(/^컵 대회 /, "LCK 컵 그룹 배틀 ");
      if (m.comp === "cup_po") m.label = m.label.replace(/^컵 플레이오프/, "LCK 컵 플레이오프").replace(/^컵 대회/, "LCK 컵");
    });
    TEAM_ORG_RENAMES.forEach(function (rename) {
      const team = L.teams.find(function (t) { return t.id === rename.id && rename.from.indexOf(t.short) !== -1; });
      if (!team) return;
      const oldName = team.name;
      if (team.name === team.short || team.name.indexOf(team.short + " ") === 0) {
        team.name = rename.to + team.name.slice(team.short.length);
      }
      team.short = rename.to;
      if (fresh.team === oldName) fresh.team = team.name;
    });
    if (!Array.isArray(L.freeAgents)) L.freeAgents = [];
    if (!Array.isArray(L.usedNames)) L.usedNames = [];
  }
  if (s.settings && typeof s.settings.autoSave === "boolean") fresh.settings.autoSave = s.settings.autoSave;

  if (s.world && typeof s.world === "object" && Array.isArray(s.world.teams)) fresh.world = s.world; // 해외 리그 (js/era.js)
  if (Number.isFinite(s.dormWeeks)) fresh.dormWeeks = s.dormWeeks;
  if (s.fame && typeof s.fame === "object") fresh.fame = s.fame;
  if (typeof s.signature === "string") fresh.signature = s.signature; // 시그니처 픽 (js/signature.js)
  if (s.sigGrowth && typeof s.sigGrowth === "object") fresh.sigGrowth = s.sigGrowth; // 시그니처 성장 (js/collection.js)
  if (s.achievements && typeof s.achievements === "object") fresh.achievements = s.achievements; // 업적 도감
  // 받은 연락 리뉴얼 (js/stories.js): 연락 기록·이야기 기억·선수 관계·시스템 트리거 대기열
  ["eventLog", "flags", "relations", "friends", "standing", "romance"].forEach(function (k) { if (s[k] && typeof s[k] === "object") fresh[k] = s[k]; });
  if (Array.isArray(s.trigQueue)) fresh.trigQueue = s.trigQueue;
  if (Array.isArray(s.sig100)) fresh.sig100 = s.sig100; // 스타·평판 등급 (js/fame.js) // 합숙한 주 수 (합숙 피로)
  if (s.newChampBuff && typeof s.newChampBuff === "object") fresh.newChampBuff = s.newChampBuff; // 새 챔피언 출시 버프
  if (s.shakeup && typeof s.shakeup === "object") fresh.shakeup = s.shakeup; // 대격변 패치 (js/shakeup.js)
  applyExtraPositions(fresh.shakeup); // 대격변으로 생긴 챔피언 포지션
  // 기존 세이브도 현재·예정 계약에 최저 연봉 보장 (과거 수입 기록은 유지).
  [fresh.contract, fresh.pendingMove].forEach(function (c) {
    if (c) c.salary = Math.max(CONTRACT.minSalary, Number(c.salary) || 0);
  });
  if (fresh.league) Object.keys(fresh.league.players).forEach(function (id) {
    const p = fresh.league.players[id];
    p.salary = Math.max(CONTRACT.minSalary, Number(p.salary) || 0);
  });
  fresh.inbox.forEach(function (m) {
    const o = m.offer;
    if (m.kind !== "offer" || m.answered !== null || !o || o.salary >= CONTRACT.minSalary) return;
    const oldSalary = o.salary;
    o.salary = CONTRACT.minSalary;
    if (typeof m.text === "string") m.text = m.text.split(moneyText(oldSalary)).join(moneyText(o.salary));
    if (o.breakdown) o.breakdown.total = Math.max(CONTRACT.minSalary, o.breakdown.total || 0);
  });
  // 유망주 특성: 기간(데뷔 후 2시즌)이 지났으면 불러올 때 빼기 (예전 세이브는 3시즌·저장 안 됨)
  const stEnd = startTraitEndYear(fresh.player, fresh.career);
  const stId = arch.startTrait;
  if (stId && fresh.player.traits.indexOf(stId) !== -1 && stEnd && fresh.year >= stEnd) {
    fresh.player.traits.splice(fresh.player.traits.indexOf(stId), 1);
    fresh.player.startTraitUntil = null;
  }
  return fresh;
}

// 브라우저에 저장. 성공하면 true
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(makeSaveData()));
    return true;
  } catch (e) {
    return false;
  }
}

// 브라우저에서 세이브 꺼내기. 없거나 망가졌으면 null
function readSave() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return null;
  }
}

// 브라우저 세이브로 게임 상태 만들기. 없으면 null
function loadGame() {
  const save = readSave();
  if (!save) return null;
  try {
    return stateFromSave(save);
  } catch (e) {
    return null;
  }
}

// 마지막 저장 시각 (없으면 null)
function lastSavedText() {
  const save = readSave();
  if (!save || !save.savedAt) return null;
  return new Date(save.savedAt).toLocaleString("ko-KR");
}

// 세이브를 .json 파일로 내려받기
function exportSave() {
  const text = JSON.stringify(makeSaveData(), null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "progamer-save_" + state.year + "년_" + state.week + "주차.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

// .json 파일을 읽어서 게임 상태로. 다 읽으면 onDone(새 상태 또는 null, 오류 문구)
function importSave(file, onDone) {
  const reader = new FileReader();
  reader.onload = function () {
    try {
      onDone(stateFromSave(JSON.parse(reader.result)), "");
    } catch (e) {
      onDone(null, e instanceof SyntaxError ? "파일 내용을 읽을 수 없습니다." : e.message);
    }
  };
  reader.onerror = function () { onDone(null, "파일을 열 수 없습니다."); };
  reader.readAsText(file);
}
