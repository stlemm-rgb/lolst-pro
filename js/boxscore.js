// ===== 경기 기록(박스 스코어): 픽, 킬/데스/어시스트, CS, 피해량, 시야, 라인·운영·한타 점수 =====
// 승패는 이미 정해진 뒤에, 그 결과(라인 맞대결 경기력·팀 점수)에 맞게 기록을 만들어요. 규칙은 data/boxscore.js

function statsOfId(id) {
  if (id === USER_ID) return state.stats;
  const p = id && findPlayer(id);
  return p ? p.stats : null;
}

// 가중치 목록에서 하나 뽑기 → 번호
function weightedIndex(weights) {
  const total = weights.reduce(function (s, w) { return s + w; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

function clamp100(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// 다른 선수 챔피언 고르기 (이미 나온 챔피언은 빼고)
function npcPick(pos, used) {
  const released = Object.keys(state.mastery).filter(function (n) {
    return used.indexOf(n) === -1 && findChampion(n).positions.indexOf(pos) !== -1;
  });
  const meta = state.meta.champs[pos].filter(function (n) { return released.indexOf(n) !== -1; });
  const pool = meta.length && Math.random() < BOXSCORE.npcMetaPick ? meta : released;
  return pool.length ? pick(pool) : "?";
}

// set: playSet 결과, userPick: 내 선수가 고른 챔피언
function makeBoxScore(set, m, userPick) {
  const aWon = set.winner === m.a;
  const total = function (t) { return t.avg + t.lane + (t.play || 0) + t.luck + t.mood; };
  const gap = Math.abs(total(set.teamA) - total(set.teamB));
  const minutes = Math.max(BOXSCORE.minutesMin, randFloat(BOXSCORE.minutes[0], BOXSCORE.minutes[1]) - gap * BOXSCORE.minutesPerGap);
  const winK = randInt(BOXSCORE.winnerKills[0], BOXSCORE.winnerKills[1]) + Math.round(gap * BOXSCORE.killsPerGap);
  const loseK = Math.max(1, randInt(BOXSCORE.loserKills[0], BOXSCORE.loserKills[1]) - Math.round(gap * BOXSCORE.killsPerGap));
  const kills = aWon ? [winK, loseK] : [loseK, winK];

  // 픽 (같은 세트에 같은 챔피언 없음)
  const used = userPick ? [userPick] : [];
  const sides = [set.la, set.lb].map(function (list) {
    return list.map(function (p) {
      const champ = p.id === USER_ID && userPick ? userPick : npcPick(p.pos, used);
      used.push(champ);
      return { id: p.id, pos: p.pos, power: p.power, c: champ, k: 0, d: 0, a: 0 };
    });
  });

  // 킬: 팀 킬 수를 선수들에게 나눔 (경기력이 높을수록, 포지션 성향대로). 솔로킬 낸 선수는 1킬 먼저
  [0, 1].forEach(function (s) {
    const mine = sides[s], theirs = sides[1 - s];
    let left = kills[s];
    set.lanes.forEach(function (ln, i) {
      const wonLane = s === 0 ? ln.aWon : !ln.aWon;
      if (ln.solo && wonLane && left > 0) { mine[i].k++; theirs[i].d++; left--; }
    });
    const kw = mine.map(function (p) { return BOXSCORE.pos[p.pos].kill * Math.pow(Math.max(20, p.power) / 60, 2); });
    const dw = theirs.map(function (p) { return BOXSCORE.pos[p.pos].death * Math.pow(60 / Math.max(20, p.power), 2); });
    for (let i = 0; i < left; i++) {
      mine[weightedIndex(kw)].k++;
      theirs[weightedIndex(dw)].d++;
    }
  });

  // 어시스트·CS·피해량·시야·점수
  [0, 1].forEach(function (s) {
    const mine = sides[s], theirs = sides[1 - s];
    const won = s === 0 ? aWon : !aWon;
    mine.forEach(function (p, i) {
      const rule = BOXSCORE.pos[p.pos];
      const st = statsOfId(p.id);
      const stat = function (id) { return st ? st[id] : p.power; };
      const laneDiff = p.power - theirs[i].power;
      const ln = set.lanes[i];
      const soloWin = ln.solo && (s === 0 ? ln.aWon : !ln.aWon);

      p.a = Math.max(0, Math.round(kills[s] * rule.kp * randFloat(0.75, 1.15)) - p.k);
      const laneFactor = Math.max(0, Math.min(1, 0.5 + laneDiff / 40));
      p.cspm = Math.round(rule.cs * (0.82 + 0.36 * laneFactor) * randFloat(0.95, 1.05) * 10) / 10;
      p.cs = Math.round(p.cspm * minutes);
      p.dmg = Math.round(rule.dpm * (p.power / 65) * randFloat(0.85, 1.15) * (1 + 0.04 * p.k) * minutes);
      p.vs = Math.round(rule.vision * (0.6 + stat("vision") / 125) * randFloat(0.85, 1.15) * minutes);
      // 점수 (0~100)
      p.ls = clamp100(50 + laneDiff * 2.2 + (soloWin ? 10 : 0) + randFloat(-5, 5));
      p.ms = clamp100(stat("macro") * 0.45 + stat("vision") * 0.25 + stat("shotcall") * 0.1 + (won ? 12 : -4) + randFloat(-8, 8));
      const kp = kills[s] ? (p.k + p.a) / kills[s] : 0;
      p.ts = clamp100(stat("teamfight") * 0.45 + stat("spacing") * 0.15 + kp * 25 + (won ? 8 : -4) + randFloat(-8, 8));
    });
    const teamDmg = mine.reduce(function (sum, p) { return sum + p.dmg; }, 0) || 1;
    mine.forEach(function (p) { p.share = Math.round(p.dmg / teamDmg * 1000) / 10; });
  });

  const strip = function (p) {
    return { c: p.c, k: p.k, d: p.d, a: p.a, cs: p.cs, cspm: p.cspm, dmg: p.dmg, share: p.share, vs: p.vs, ls: p.ls, ms: p.ms, ts: p.ts };
  };
  return { min: Math.round(minutes * 10) / 10, kills: kills, a: sides[0].map(strip), b: sides[1].map(strip) };
}
