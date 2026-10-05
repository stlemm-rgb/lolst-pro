// ===== 챔피언 · 숙련도 · 메타(패치) =====

const POSITION_IDS = ["top", "jungle", "mid", "adc", "support"];

function findChampion(name) {
  return CHAMPIONS.find(function (c) { return c.name === name; });
}

// 그 해 그 주차의 마지막 날 ("2012-01-07" 같은 글자). 1주차 = 1월 1일 ~ 7일
function weekEndDate(year, week) {
  const d = new Date(Date.UTC(year, 0, 1 + week * 7 - 1));
  if (d.getUTCFullYear() > year) return year + "-12-31"; // 52주차는 연말까지
  return d.toISOString().slice(0, 10);
}

// 그 주까지 출시된 챔피언 목록
function releasedChampions(year, week) {
  const until = week >= 52 ? year + "-12-31" : weekEndDate(year, week);
  return CHAMPIONS.filter(function (c) { return c.released <= until; });
}

// 이번 주에 새로 출시된 챔피언 (지난주까지는 없었던)
function newlyReleased(year, week) {
  const before = week === 1 ? (year - 1) + "-12-31" : weekEndDate(year, week - 1);
  const until = week >= 52 ? year + "-12-31" : weekEndDate(year, week);
  return CHAMPIONS.filter(function (c) { return c.released > before && c.released <= until; });
}

// 캐릭터 생성 때 처음 숙련도 정하기 (챔피언 폭이 높을수록 내 포지션 챔피언을 잘 다룸)
function startMastery(stats, position, year, week) {
  const mastery = {};
  releasedChampions(year, week).forEach(function (c) {
    let value;
    if (c.positions.indexOf(position) !== -1) {
      const center = stats.pool * MASTERY.startMainRatio;
      value = Math.round(center + randInt(-MASTERY.startMainSpread, MASTERY.startMainSpread));
    } else {
      value = randInt(MASTERY.min, MASTERY.startOffMax);
    }
    mastery[c.name] = Math.max(MASTERY.min, Math.min(MASTERY.max, value));
  });
  return mastery;
}

// 새 패치: 포지션마다 메타 챔피언을 무작위로 뽑음
function makePatch(year, week) {
  const pool = releasedChampions(year, week);
  const champs = {};
  POSITION_IDS.forEach(function (pos) {
    const list = pool.filter(function (c) { return c.positions.indexOf(pos) !== -1; });
    champs[pos] = shuffled(list).slice(0, MASTERY.metaPerPosition).map(function (c) { return c.name; });
  });
  const number = MASTERY.patchWeeks.indexOf(week) + 1;
  return { label: year + "년 " + (number > 0 ? number + "차" : "") + " 패치", champs: champs };
}

function isMeta(name) {
  if (!state.meta) return false;
  return POSITION_IDS.some(function (pos) { return state.meta.champs[pos].indexOf(name) !== -1; });
}

// 내 포지션 챔피언 (출시된 것만), 메타 → 숙련도 높은 순
function myPositionChampions() {
  const pos = state.player.position;
  return Object.keys(state.mastery)
    .filter(function (name) { const c = findChampion(name); return c && c.positions.indexOf(pos) !== -1; })
    .sort(function (a, b) {
      const ma = isMeta(a) ? 1 : 0, mb = isMeta(b) ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return state.mastery[b] - state.mastery[a];
    });
}

// 숙련도 성장 배율 = 시작 유형(레전드 0.5) × (1 + 특성 보너스)
function masteryGrowthMultiplier() {
  return findArchetype(state.player.archetype).masteryGrowth * Math.max(0, 1 + traitEffectSum("masteryGrowth"));
}

// 챔피언 연습: 숙련도 올리기. 바뀐 값을 { 이름: +n } 으로 돌려줌
// - 특정 챔피언을 골랐으면 그 챔피언만 크게
// - "자동"이면 내 포지션의 메타 챔피언 중 숙련도 낮은 순으로 3명에게 나눠서
function practiceChampions(range, tired) {
  let targets, share;
  if (state.practiceChamp && state.mastery[state.practiceChamp] !== undefined) {
    targets = [state.practiceChamp];
    share = 1;
  } else {
    const mine = myPositionChampions();
    const meta = mine.filter(isMeta).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
    const rest = mine.filter(function (n) { return !isMeta(n); }).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
    targets = meta.concat(rest).slice(0, 3);
    share = 0.5;
  }
  const result = {};
  targets.forEach(function (name) {
    const now = state.mastery[name];
    // 숙련도가 높을수록 조금씩 덜 오름
    let gain = randInt(range[0], range[1]) * share * masteryGrowthMultiplier() * Math.max(0.3, 1 - now / 125);
    if (tired) gain *= 0.5;
    gain = roundRandom(gain);
    state.mastery[name] = Math.min(MASTERY.max, now + gain);
    result[name] = state.mastery[name] - now;
  });
  return result;
}
