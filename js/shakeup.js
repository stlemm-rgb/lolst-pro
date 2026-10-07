// ===== 대격변 패치 (값: data/shakeup.js) =====
// state.shakeup = {
//   next: 다음 대격변 연도, last: 마지막 대격변 연도, item: 오브젝트·아이템 개편 id,
//   extraPos: { 챔피언: [새 포지션...] }, reworked: { 챔피언: 연도 }, history: [{ year, reworks, moves, item }]
// }

// 처음 포지션 기억 (포지션 변경을 되돌릴 때 사용)
CHAMPIONS.forEach(function (c) { c.basePositions = c.positions.slice(); });

// 챔피언 포지션 = 처음 포지션 + 대격변으로 생긴 포지션 (새 게임·불러오기 때도 부름)
function applyExtraPositions(sh) {
  CHAMPIONS.forEach(function (c) { c.positions = c.basePositions.slice(); });
  const extra = (sh && sh.extraPos) || {};
  Object.keys(extra).forEach(function (name) {
    const c = findChampion(name);
    if (!c) return;
    extra[name].forEach(function (pos) { if (c.positions.indexOf(pos) === -1) c.positions.push(pos); });
  });
}

function newShakeupState(year) {
  return { next: year + randInt(SHAKEUP.gapYears[0], SHAKEUP.gapYears[1]), last: null, item: null, extraPos: {}, reworked: {}, history: [] };
}

// 예전 세이브: 없으면 만들기
function ensureShakeup() {
  if (!state.shakeup) state.shakeup = newShakeupState(state.year);
  return state.shakeup;
}

// 올해가 대격변 해인가 (메타 판 확대: 두 패치 모두)
function isShakeupYear(year) {
  return typeof state !== "undefined" && state && state.shakeup && state.shakeup.last === year;
}

// 경기 흐름 사건 빈도 배율 (js/match_events.js)
function shakeupEvMult(cat) {
  const sh = typeof state !== "undefined" && state && state.shakeup;
  if (!sh || !sh.item) return 1;
  const it = SHAKEUP_ITEM_CHANGES.find(function (x) { return x.id === sh.item; });
  return it && it.catW[cat] ? it.catW[cat] : 1;
}

function currentItemChange() {
  const sh = state.shakeup;
  return sh && sh.item ? SHAKEUP_ITEM_CHANGES.find(function (x) { return x.id === sh.item; }) : null;
}

// 이번 주(새 시즌 1주차)가 대격변이면 실행. makePatch 전에 부름 (js/main.js)
// 돌려주는 값: 메타에 넣을 챔피언 { 포지션: [이름...] } 또는 null
function runShakeupIfDue() {
  const sh = ensureShakeup();
  if (state.week !== 1 || state.year < sh.next) return null;
  const S = SHAKEUP;
  const pool = releasedChampions(state.year, state.week);
  const prefer = {};
  POSITION_IDS.forEach(function (p) { prefer[p] = []; });

  // 1) 리워크: 포지션마다 2~3명 (겹치지 않게)
  const reworks = [];
  POSITION_IDS.forEach(function (pos) {
    const list = shuffled(pool.filter(function (c) { return c.basePositions[0] === pos && reworks.indexOf(c.name) === -1; }));
    list.slice(0, randInt(S.rework.perPosition[0], S.rework.perPosition[1])).forEach(function (c) {
      reworks.push(c.name);
      sh.reworked[c.name] = state.year;
      if (Math.random() < S.rework.metaChance) prefer[pos].push(c.name);
    });
  });

  // 2) 숙련도: 리워크 × keep, 나머지는 from 이상이면 × masteryCut.keep (나와 다른 선수 모두)
  const cut = function (m) {
    Object.keys(m).forEach(function (name) {
      if (reworks.indexOf(name) !== -1) m[name] = Math.max(MASTERY.min, Math.round(m[name] * S.rework.keep));
      else if (m[name] >= S.masteryCut.from) m[name] = Math.max(MASTERY.min, Math.round(m[name] * S.masteryCut.keep));
    });
  };
  cut(state.mastery);
  Object.keys(state.league.players).forEach(function (id) { const p = state.league.players[id]; if (p.mastery) cut(p.mastery); });

  // 3) 포지션 변경: 포지션이 1~2개인 챔피언 중 3~5명에게 새 포지션 하나
  const moves = [];
  shuffled(pool.filter(function (c) { return c.positions.length <= 2; })).slice(0, randInt(S.posChange.count[0], S.posChange.count[1])).forEach(function (c) {
    const to = pick(POSITION_IDS.filter(function (p) { return c.positions.indexOf(p) === -1; }));
    sh.extraPos[c.name] = (sh.extraPos[c.name] || []).concat([to]);
    c.positions.push(to);
    moves.push({ name: c.name, to: to });
    if (Math.random() < S.posChange.metaChance) prefer[to].push(c.name);
  });
  ensureNpcMastery(); // 새 포지션 선수들: 그 챔피언 숙련도 1부터

  // 4) 오브젝트·아이템 개편 (지난번과 다른 것)
  const item = pick(SHAKEUP_ITEM_CHANGES.filter(function (x) { return x.id !== sh.item; }));
  sh.item = item.id;

  sh.last = state.year;
  sh.next = state.year + randInt(S.gapYears[0], S.gapYears[1]);
  sh.history.push({ year: state.year, reworks: reworks, moves: moves, item: item.id });
  sh.pending = { reworks: reworks, moves: moves }; // 패치가 만들어진 뒤 기사·소식 (shakeupNews)
  return prefer;
}

// 메타 확정 뒤: 소식·기사·주요 순간
function shakeupNews() {
  const sh = state.shakeup;
  if (!sh || !sh.pending) return;
  const pend = sh.pending;
  delete sh.pending;
  const item = currentItemChange();
  const myPos = state.player.position;
  const posName = function (id) { return findPosition(id).name; };
  const movesText = pend.moves.map(function (m) { return m.name + "(→" + posName(m.to) + ")"; }).join(", ");

  // 내 선수 관련 한 문장
  const top = myPositionChampions().slice().sort(function (a, b) { return state.mastery[b] - state.mastery[a]; }).slice(0, 3);
  const hit = top.filter(function (n) { return pend.reworks.indexOf(n) !== -1; })[0];
  const gained = pend.moves.filter(function (m) { return m.to === myPos; })[0];
  let mine;
  if (hit) mine = SHAKEUP_MINE.reworked.replace("{champ}", hit);
  else if (gained) mine = SHAKEUP_MINE.gained.replace("{champ}", gained.name);
  else mine = SHAKEUP_MINE.none;
  mine = mine.replace("{me}", state.player.name).replace("{pos}", posName(myPos));

  addNews("대격변 패치", "🌋 " + state.year + "년 대격변 패치! 리워크: " + pend.reworks.join(", ") + " · 포지션 변경: " + movesText + " · " + item.name + " (" + item.desc + ") · 올해 메타 챔피언 포지션마다 " + SHAKEUP.metaWide.perPosition + "명 (S급 " + SHAKEUP.metaWide.sCount + "명). 리워크 챔피언 숙련도 −" + Math.round((1 - SHAKEUP.rework.keep) * 100) + "%, 나머지 챔피언도 숙련도 " + SHAKEUP.masteryCut.from + " 이상이면 −" + Math.round((1 - SHAKEUP.masteryCut.keep) * 100) + "%.");
  if (typeof addMoment === "function") addMoment("🌋", state.year + "년 대격변 패치 (" + item.name + ")");

  const r = state.weekReport;
  if (!r) return;
  const art = pick(SHAKEUP_ARTICLES);
  const short = pend.reworks.length > 6 ? pend.reworks.slice(0, 6).join(", ") + " 등 " + pend.reworks.length + "명" : pend.reworks.join(", ");
  const v = { year: state.year, item: item.name, itemDesc: item.desc, reworks: short, moves: movesText, metaCount: SHAKEUP.metaWide.perPosition, mine: mine };
  r.headlines = r.headlines || [];
  r.headlines.unshift({ key: "shakeup", headline: fillNews(art.headline, v), body: fillNews(art.body, v), mine: true });
  r.headlinesSeen = false;
}
