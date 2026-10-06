// ===== 저장 / 불러오기 =====
// 세이브는 브라우저 저장소(localStorage)에 글자(JSON)로 저장됩니다.
// 세이브 모양: { game, version, savedAt, state: { ...게임 상태... } }

const SAVE_KEY = "progamer-career-save";
const SAVE_GAME_ID = "progamer-career";
const SAVE_VERSION = 10; // 10: NPC 특성·S급 특성·스탯 상한선 / 9: 노화·은퇴·역사관 / 8: 메타 S급·퀘스트 / 7: 솔로 랭크·지난주 결과 / 6: 계약·이적 / 5: SNS·이벤트 / 4: 리그 / 2: 캐릭터 생성·스탯 12개 / 3: 연도·챔피언 숙련도·평판

// 저장할 항목 (화면 상태처럼 저장할 필요 없는 것은 빼고)
const SAVED_FIELDS = ["player", "team", "money", "year", "week", "stats", "stamina", "staminaMax", "condition", "popularity", "reputation", "mastery", "meta", "practiceChamp", "plan", "log", "settings", "league", "inbox", "msgSeq", "eventCooldown", "career", "skipTraining", "matchBoost", "contract", "pendingMove", "benched", "benchWeeks", "transferListed", "transferRequestsLeft", "soloRank", "weekReport", "quests", "questSeq", "focusChamp", "retirePlanned", "retired", "compPlan", "shop", "activities", "pendingEvents", "tutorial"];

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
  if (Array.isArray(s.inbox)) fresh.inbox = s.inbox.slice(0, EVENT_RULES.keepMessages);
  if (Number.isFinite(s.msgSeq)) fresh.msgSeq = s.msgSeq;
  if (s.eventCooldown && typeof s.eventCooldown === "object") fresh.eventCooldown = s.eventCooldown;
  if (s.career && typeof s.career === "object") {
    fresh.career.finalsWon = Number(s.career.finalsWon) || 0;
    fresh.career.gainTried = s.career.gainTried || {};
    ["seasonGames", "games", "wins", "seasonWins", "questsDone", "questsGiven", "earned"].forEach(function (k) { fresh.career[k] = Number(s.career[k]) || 0; });
    if (Array.isArray(s.career.seasons)) fresh.career.seasons = s.career.seasons;
    if (Array.isArray(s.career.awards)) fresh.career.awards = s.career.awards;
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
  fresh.tutorial = s.tutorial && typeof s.tutorial === "object" ? s.tutorial : { on: false, done: {}, visited: {} }; // 예전 세이브는 안내 꺼짐
  if (Array.isArray(s.activities)) fresh.activities = s.activities.filter(function (a) { return a && ACTIVITIES[a.id]; });
  if (Array.isArray(s.pendingEvents)) fresh.pendingEvents = s.pendingEvents.filter(function (p) { return p && findEvent(p.event); });
  if (s.retired && typeof s.retired === "object" && s.retired.titles && Number.isFinite(s.retired.points)) fresh.retired = s.retired;

  // 리그: 기본 모양이 맞으면 그대로, 아니면 화면을 그릴 때 새로 만듦
  const L = s.league;
  if (L && Array.isArray(L.teams) && L.players && L.season && Array.isArray(L.season.matches) &&
      L.teams.some(function (t) { return Array.isArray(t.roster) && t.roster.indexOf("USER") !== -1; })) {
    fresh.league = L;
    if (!Array.isArray(L.freeAgents)) L.freeAgents = [];
    if (!Array.isArray(L.usedNames)) L.usedNames = [];
  }
  if (s.settings && typeof s.settings.autoSave === "boolean") fresh.settings.autoSave = s.settings.autoSave;

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
