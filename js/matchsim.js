// ===== 경기 판정과 주간 일정 진행 =====
// 경기 하나 = { week, comp, label, a, b, bo, score: [a세트, b세트], winner, loser }
//   winner가 null이면 아직 안 한 경기 (일정에 잡혀 있음)

const COMP_NAMES = {
  cup: "컵 대회", cup_po: "컵 플레이오프",
  split1: "정규 시즌 전반기", split2: "정규 시즌 후반기",
  tier2: "2부 리그 전반기", tier2b: "2부 리그 후반기",
  playin: "플레이인", playoffs: "플레이오프", promotion: "승강전",
  worlds_group: "월드 조별 리그", worlds_ko: "월드 토너먼트",
};

function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

// 해외 가상 팀 찾기
function findOverseas(id) {
  const w = state.league.season.worlds;
  return w ? w.overseas.find(function (t) { return t.id === id; }) : null;
}

function teamName(id) {
  const t = findTeam(id) || findOverseas(id);
  return t ? t.name : "?";
}

function teamShort(id) {
  const t = findTeam(id) || findOverseas(id);
  return t ? t.short : "?";
}

// ----- 경기 일정 잡기 -----
function schedule(week, comp, label, a, b, bo) {
  const m = { week: week, comp: comp, label: label, a: a, b: b, bo: bo, score: [0, 0], winner: null, loser: null };
  state.league.season.matches.push(m);
  return m;
}

// 리그 방식(라운드 로빈) 대진표: 모든 팀이 한 번씩 만남
function roundRobin(ids) {
  const list = ids.slice();
  if (list.length % 2) list.push(null);
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a && b) pairs.push(r % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop()); // 첫 팀 고정, 나머지 회전
  }
  return rounds;
}

// 두 번씩 만나는 대진표
function doubleRoundRobin(ids) {
  const first = roundRobin(ids);
  return first.concat(first.map(function (round) {
    return round.map(function (p) { return [p[1], p[0]]; });
  }));
}

// rounds를 startWeek부터 perWeek 라운드씩 배치
function scheduleRounds(rounds, startWeek, perWeek, comp, labelPrefix) {
  rounds.forEach(function (pairs, i) {
    const week = startWeek + Math.floor(i / perWeek);
    pairs.forEach(function (p) {
      schedule(week, comp, labelPrefix + " " + (i + 1) + "라운드", p[0], p[1], LEAGUE.bestOf[comp] || 3);
    });
  });
}

// ----- 경기 판정 (라인 맞대결) -----

// 내 선수 경기력 (밴픽·숙련도·메타 페널티 × 컨디션·체력)
// 큰 경기: 결승·플레이오프·월드 토너먼트·승강전
function isBigMatch(match) {
  return ["playoffs", "worlds_ko", "promotion"].indexOf(match.comp) !== -1 || match.label.indexOf("결승") !== -1;
}

// 내 선수 한 세트 준비: 밴·픽·경기력 (세트마다 새로. used = 이번 경기에서 이미 나온 챔피언 → 다시 못 고름)
function userMatchContext(match, target, used) {
  const m = matchPower(rollBans(used), target, used); // 세트마다 밴 수·대상이 달라짐, 조합 성향 반영
  let mult = TEAM_MATCH.conditionBase + state.condition / TEAM_MATCH.conditionDiv;
  if (state.stamina < TEAM_MATCH.lowStaminaLimit) mult *= 1 - TEAM_MATCH.lowStaminaCut;
  mult *= 1 + (state.matchBoost || 0); // 이벤트 보너스 (한 경기만)
  // 특성(큰 무대·클러치·역전 등)은 다른 선수와 똑같이 traitPowerMult에서 계산
  return { power: m.power * mult, pick: m.pick, banned: m.banned, joker: m.joker };
}

// 특성에 따른 이번 세트 경기력 배율 (나와 다른 선수 모두)
// setCtx: { match, deciding(풀세트), behind(세트 스코어에서 지고 있는 팀 id) }
function traitPowerMult(traits, teamId, setCtx) {
  if (!traits.length) return 1;
  let mult = 1 + traitSumOf(traits, "power");                                         // 황제·GOAT
  if (setCtx.match && isBigMatch(setCtx.match)) mult *= 1 + traitSumOf(traits, "bigMatch"); // 큰 무대 체질 / 무대 공포증 / 불사대마왕
  if (state.week <= 12) mult *= 1 - traitSumOf(traits, "earlyPenalty");                // 슬로 스타터
  if (setCtx.deciding) mult *= 1 + traitSumOf(traits, "clutch");                      // 클러치
  if (setCtx.behind === teamId) mult *= 1 + traitSumOf(traits, "comeback");           // 역전의 명수
  return mult;
}

// 스탯 고유 역할: 멘탈(지고 있을 때)·집중력(3세트부터) 경기력 배율 (data/match.js STAT_ROLES)
function statPowerMult(st, teamId, setCtx) {
  if (!st) return 1;
  const R = STAT_ROLES;
  let mult = 1;
  if (setCtx.behind === teamId) mult *= 1 - Math.max(0, R.pivot - st.mental) * R.mentalPer;
  if ((setCtx.setNo || 1) >= R.focusFromSet) mult *= 1 + (st.focus - R.pivot) * R.focusPer;
  return mult;
}

// 라인 맞대결 경기력 = 경기력 + 라인전 스탯 보정
function lanePower(p) {
  const st = p.id ? statsOfId(p.id) : null;
  return p.power + (st ? (st.laning - STAT_ROLES.pivot) * STAT_ROLES.lanePer : 0);
}

// 한 팀의 이번 세트 라인업과 경기력
function lineup(teamId, userCtx, setCtx) {
  setCtx = setCtx || {};
  const overseas = findOverseas(teamId);
  if (overseas) {
    return POSITION_IDS.map(function (pos) {
      return { pos: pos, id: null, power: overseas.power * randFloat(0.85, 1.15) };
    });
  }
  const s = starters(teamId);
  return POSITION_IDS.map(function (pos) {
    const id = s[pos];
    const tr = traitsOf(id);
    const st = statsOfId(id);
    const v = traitSumOf(tr, "variance"); // 기복: 더 흔들림
    // 입력 정확도: 못하는 쪽 흔들림을 줄임
    const steady = st ? Math.max(0, Math.min(STAT_ROLES.accuracyMax, (st.accuracy - 40) / 100)) : 0;
    let power;
    if (id === USER_ID) {
      const down = 0.05 + v;
      power = userCtx.power * randFloat(1 - down * (1 - steady), 1 + 0.05 + v);
    } else {
      const down = 1 - (MATCH.npcMultiplier[0] - v);
      power = playerScore(id) * randFloat(1 - down * (1 - steady), MATCH.npcMultiplier[1] + v);
    }
    power *= traitPowerMult(tr, teamId, setCtx) * statPowerMult(st, teamId, setCtx);
    return { pos: pos, id: id, power: power };
  });
}

function average(list) {
  let sum = 0;
  list.forEach(function (v) { sum += v; });
  return list.length ? sum / list.length : 0;
}

// 운영·한타 점수: 5명의 운영·오더·시야·한타·거리 조절 평균이 기준보다 높은 만큼 (해외 가상 팀은 경기력으로 대신)
function teamplayScore(list) {
  const vals = list.map(function (p) {
    const st = p.id ? statsOfId(p.id) : null;
    if (!st) return p.power;
    return average(TEAM_MATCH.teamplayStats.map(function (id) { return st[id]; }));
  });
  return (average(vals) - TEAM_MATCH.teamplayBase) * TEAM_MATCH.teamplayWeight;
}

// 한 세트: 라인전 → 운영·한타
function playSet(a, b, userCtx, setCtx) {
  const la = lineup(a, userCtx, setCtx), lb = lineup(b, userCtx, setCtx);
  // 밴픽 조합: 상성·시너지 (js/comps.js)
  const comps = setComps(la, lb, Object.assign({}, setCtx, { teamA: a, teamB: b }), userCtx ? userCtx.pick : null);
  let bonusA = 0, bonusB = 0, userLane = null;
  const laneResults = []; // 경기 상세용: 라인마다 { aWon, solo }
  POSITION_IDS.forEach(function (pos, i) {
    const pa = la[i], pb = lb[i];
    const diff = lanePower(pa) - lanePower(pb); // 라인전 스탯 반영
    const loser = diff >= 0 ? pb : pa;
    const loserSt = loser.id ? statsOfId(loser.id) : null;
    const dodge = loserSt ? (loserSt.reaction - STAT_ROLES.pivot) * STAT_ROLES.reactionPer : 0; // 반응속도: 솔로킬 피하기
    const winnerTraits = pa.id || pb.id ? traitsOf(diff >= 0 ? pa.id : pb.id) : [];
    const winComp = diff >= 0 ? comps.a : comps.b; // 이긴 쪽 팀 조합 (돌진·누커 시너지)
    const solo = Math.abs(diff) >= TEAM_MATCH.soloKillGap - traitSumOf(winnerTraits, "soloEasy") - winComp.soloEasy + dodge; // 라인 지배자·돌진·반응속도
    const add = TEAM_MATCH.laneWinBonus + traitSumOf(winnerTraits, "laneBonus") + winComp.laneExtra + (solo ? TEAM_MATCH.soloKillBonus : 0);
    if (diff >= 0) bonusA += add; else bonusB += add;
    laneResults.push({ aWon: diff >= 0, solo: solo });
    if (pa.id === USER_ID) userLane = { won: diff >= 0, solo: solo, opp: pb.id };
    if (pb.id === USER_ID) userLane = { won: diff < 0, solo: solo, opp: pa.id };
  });
  const luckA = randFloat(-TEAM_MATCH.teamRandom, TEAM_MATCH.teamRandom), luckB = randFloat(-TEAM_MATCH.teamRandom, TEAM_MATCH.teamRandom);
  const avgA = average(la.map(function (p) { return p.power; })), avgB = average(lb.map(function (p) { return p.power; }));
  const playA = teamplayScore(la), playB = teamplayScore(lb);
  const compA = comps.a.bonus, compB = comps.b.bonus;
  const powerA = avgA + bonusA + playA + compA + luckA;
  const powerB = avgB + bonusB + playB + compB + luckB;
  // 타고난 리더·원클럽맨: 그 선수가 있는 팀 한타 전력 보너스
  const mood = function (list) { return list.reduce(function (sum, p) { return sum + (p.id ? traitSumOf(traitsOf(p.id), "teamMood") : 0); }, 0); };
  const moodA = mood(la), moodB = mood(lb);
  return {
    winner: powerA + moodA >= powerB + moodB ? a : b, userLane: userLane, la: la, lb: lb,
    lanes: laneResults, comps: comps,
    teamA: { avg: avgA, lane: bonusA, play: playA, comp: compA, luck: luckA, mood: moodA }, teamB: { avg: avgB, lane: bonusB, play: playB, comp: compB, luck: luckB, mood: moodB },
  };
}

// 한 경기(시리즈) 진행
function playMatch(m) {
  const mine = myTeam();
  const userIn = mine && (m.a === mine.id || m.b === mine.id) && !state.benched; // 후보면 출전 안 함
  // 조합 전략 (경기마다): 메타 따라가기 / 메타 카운터 / 자유 (js/comps.js)
  const plans = { a: teamCompPlan(m.a), b: teamCompPlan(m.b) };
  const myTarget = userIn ? (m.a === mine.id ? plans.a : plans.b).target : null;
  const seriesUsed = []; // 피어리스: 이번 경기에서 한 번 나온 챔피언은 뒤 세트에서 아무도 못 고름
  const userPicks = [];
  let userCtx = null;
  const need = Math.ceil(m.bo / 2);
  const lanes = [];
  const perf = {}; // 이 경기 선수별 기록 (js/records.js)
  const downTwo = []; // 0:2로 몰렸던 팀 (역전의 명수)
  // 경기 상세: 우리 팀 경기와 결승전만 저장 (js/match_detail.js)
  const keepDetail = (mine && (m.a === mine.id || m.b === mine.id)) || m.label.indexOf("결승") !== -1;
  const detail = keepDetail ? { sets: [] } : null;
  m.score = [0, 0];
  while (m.score[0] < need && m.score[1] < need) {
    if (m.score[0] === 0 && m.score[1] === 2) downTwo.push(m.a);
    if (m.score[1] === 0 && m.score[0] === 2) downTwo.push(m.b);
    const setCtx = {
      match: m,
      deciding: m.score[0] === need - 1 && m.score[1] === need - 1, // 풀세트
      behind: m.score[0] < m.score[1] ? m.a : m.score[1] < m.score[0] ? m.b : null,
      setNo: m.score[0] + m.score[1] + 1,
      plans: plans,
      used: seriesUsed,
    };
    if (userIn) {
      userCtx = userMatchContext(m, myTarget, seriesUsed);
      userPicks.push({ pick: userCtx.pick, joker: userCtx.joker });
    }
    const set = playSet(m.a, m.b, userCtx, setCtx);
    set.comps.a.picks.concat(set.comps.b.picks).forEach(function (n) { if (seriesUsed.indexOf(n) === -1) seriesUsed.push(n); });
    m.score[set.winner === m.a ? 0 : 1]++;
    if (set.userLane) lanes.push(set.userLane);
    recordSet(set, m, perf);
    if (detail) {
      const sd = setDetail(set, setCtx, m, userCtx ? userCtx.pick : null);
      if (userCtx) { sd.pick = userCtx.pick; sd.joker = !!userCtx.joker; sd.banned = userCtx.banned; }
      detail.sets.push(sd);
    }
  }
  if (detail) m.detail = detail;
  m.winner = m.score[0] > m.score[1] ? m.a : m.b;
  m.loser = m.winner === m.a ? m.b : m.a;
  finishSeriesRecord(m, perf);
  sTraitsOnMatch(m, perf, downTwo); // 0:2 역전승 기록 (역전의 명수, js/straits.js)
  if (userIn) afterUserMatch(m, { pick: userPicks.map(function (u) { return (u.joker ? "🃏" : "") + u.pick; }).join(" / "), joker: false }, lanes, perf[USER_ID]);
  return m;
}

// 이번 주에 잡힌 경기 모두 진행
function playDue(week) {
  state.league.season.matches.forEach(function (m) {
    if (m.week === week && !m.winner) playMatch(m);
  });
}

// 내 팀 경기 후: 체력·컨디션·인기도 변화와 기록
function afterUserMatch(m, ctx, lanes, myPerf) {
  const mine = myTeam().id;
  const won = m.winner === mine;
  const oppId = m.a === mine ? m.b : m.a;
  const myScore = m.a === mine ? m.score[0] : m.score[1];
  const oppScore = m.a === mine ? m.score[1] : m.score[0];
  const changes = {};
  state.matchBoost = 0;
  state.career.seasonGames = (state.career.seasonGames || 0) + 1;
  state.career.games = (state.career.games || 0) + 1;
  if (won) state.career.wins = (state.career.wins || 0) + 1;
  if (won) state.career.seasonWins = (state.career.seasonWins || 0) + 1;
  // 평점·POG 문장
  let perfText = "";
  if (myPerf) {
    perfText = " · 평점 " + (myPerf.r / myPerf.g).toFixed(1);
    if (m.pog === USER_ID) perfText += " · 🏅 POG!";
  }

  // 이벤트 조건용 기록
  const w = state.weekCtx;
  if (w) {
    if (won) w.wins++; else w.losses++;
    w.opp = oppId;
    w.solos += lanes.filter(function (l) { return l.won && l.solo; }).length;
    if (won && m.label.indexOf("4강") !== -1 && m.comp !== "cup_po") w.wonSemi = true;
    // 선수 SNS용: 이번 주 경기 결과 (완승 = 상대가 한 세트도 못 땀, 내 선수 POG)
    if (w.results) w.results.push({ won: won, sweep: Math.min(m.score[0], m.score[1]) === 0, pog: m.pog === USER_ID, opp: teamName(oppId) });
  }

  const cost = m.bo >= 5 ? TEAM_MATCH.staminaCostBo5 : TEAM_MATCH.staminaCostBo3;
  let before = state.stamina;
  state.stamina = Math.max(0, state.stamina - roundRandom(cost * staminaCostMultiplier()));
  changes.stamina = state.stamina - before;

  const rule = won ? LEAGUE.afterWin : LEAGUE.afterLoss;
  let cond = randInt(rule.condition[0], rule.condition[1]);
  if (cond < 0) {
    const mentalCut = Math.max(STAT_ROLES.mentalLossMin, Math.min(1, 1 - (state.stats.mental - 50) / 100)); // 멘탈: 패배 후 컨디션 하락 감소
    cond = Math.round(cond * Math.max(0, 1 + traitEffectSum("lossMental")) * mentalCut);
  }
  before = state.condition;
  state.condition = clamp(state.condition + cond);
  changes.condition = state.condition - before;

  const pop = roundRandom((randInt(rule.popularity[0], rule.popularity[1]) + (won ? traitEffectSum("winPopularity") : 0)) * popularityMultiplier());
  before = state.popularity;
  state.popularity = clamp(state.popularity + pop);
  changes.popularity = state.popularity - before;

  // 라인전 요약
  const posName = findPosition(state.player.position).name;
  const laneWins = lanes.filter(function (l) { return l.won; }).length;
  const solos = lanes.filter(function (l) { return l.won && l.solo; }).length;
  const soloLosses = lanes.filter(function (l) { return !l.won && l.solo; }).length;
  let laneText = posName + " 라인전 " + lanes.length + "세트 중 " + laneWins + "세트 우세";
  if (solos) laneText += ", 솔로킬 " + solos + "회!";
  if (soloLosses) laneText += ", 솔로킬 " + soloLosses + "회 허용";
  if (lanes.length && lanes[0].opp) laneText += " (상대 " + playerName(lanes[0].opp) + ")";

  if (state.weekReport) {
    state.weekReport.userLines.push({
      won: won, changes: changes, matchKey: matchKey(m), // 경기 상세 열기용
      text: m.label + " · vs " + teamName(oppId) + " " + myScore + ":" + oppScore + (won ? " 승리!" : " 패배") + " · " + (ctx.joker ? "🃏 조커픽 " : "") + ctx.pick + " 픽 · " + laneText + perfText,
    });
  }
  state.log.unshift({
    when: state.year + "년 " + state.week + "주차",
    training: "경기 · " + m.label,
    message: "vs " + teamName(oppId) + " " + myScore + ":" + oppScore + (won ? " 승리!" : " 패배") +
      " · " + (ctx.joker ? "🃏 조커픽 " : "") + ctx.pick + " 픽 · " + laneText + perfText,
    changes: changes,
    match: true,
  });
}

// 한 경기 결과를 짧은 글로 (예: "BLZ 2:1 IWF")
function matchLine(m) {
  return teamShort(m.a) + " " + m.score[0] + ":" + m.score[1] + " " + teamShort(m.b);
}

// ----- 주차별 진행 -----
function seasonOf() { return state.league.season; }
function tier1Ids() { return tierTeams(1).map(function (t) { return t.id; }); }
function tier2Ids() { return tierTeams(2).map(function (t) { return t.id; }); }

const WEEK_EVENTS = {
  // 컵 대회 조 편성 + 5라운드 (2~6주)
  2: [function () {
    const ids = shuffled(tier1Ids());
    const A = ids.slice(0, 5), B = ids.slice(5, 10);
    seasonOf().cupGroups = { A: A, B: B };
    for (let r = 0; r < 5; r++) {
      for (let i = 0; i < 5; i++) {
        schedule(2 + r, "cup", "컵 대회 " + (r + 1) + "라운드", A[i], B[(i + r) % 5], LEAGUE.bestOf.cup);
      }
    }
  }],
  // 컵 플레이오프 1라운드: 3위 vs 6위, 4위 vs 5위
  8: [function () {
    const seeds = standings("cup", tier1Ids()).slice(0, 6).map(function (r) { return r.id; });
    seasonOf().cupSeeds = seeds;
    schedule(8, "cup_po", "컵 플레이오프 1라운드", seeds[2], seeds[5], LEAGUE.bestOf.cup_po);
    schedule(8, "cup_po", "컵 플레이오프 1라운드", seeds[3], seeds[4], LEAGUE.bestOf.cup_po);
  }],
  // 컵 4강 → 결승
  9: [function () { koSemis("cup_po", "컵 플레이오프 4강", seasonOf().cupSeeds, 8, 9, LEAGUE.bestOf.cup_po); },
      function () { koFinal("cup_po", "컵 대회 결승", 9, LEAGUE.bestOf.cup_final, "cup", "컵 대회"); }],
  // 정규 시즌 전반기: 1부 더블 라운드 로빈 18라운드(13~21주), 2부 14라운드(13~19주)
  13: [function () {
    scheduleRounds(shuffledRounds(doubleRoundRobin(shuffled(tier1Ids()))), 13, 2, "split1", "전반기");
    scheduleRounds(shuffledRounds(doubleRoundRobin(shuffled(tier2Ids()))), 13, 2, "tier2", "2부 전반기");
  }],
  // 후반기: 상위 5팀 / 하위 5팀 그룹 (30~34주), 2부는 한 번씩 (30~33주)
  30: [function () {
    const order = standings("split1", tier1Ids()).map(function (r) { return r.id; });
    const g = { legend: order.slice(0, 5), rise: order.slice(5, 10) };
    seasonOf().groups = g;
    scheduleRounds(doubleRoundRobin(g.legend), 30, 2, "split2", "후반기 상위 그룹");
    scheduleRounds(doubleRoundRobin(g.rise), 30, 2, "split2", "후반기 하위 그룹");
    scheduleRounds(roundRobin(shuffled(tier2Ids())), 30, 2, "tier2b", "2부 후반기");
  }],
  // 플레이인: 상위 그룹 5위 vs 하위 그룹 3위, 하위 그룹 1위 vs 2위 → 승자가 플레이오프 5·6번 시드
  35: [function () {
    const order = tier1FinalOrder();
    seasonOf().finalOrder = order;
    schedule(35, "playin", "플레이인", order[4], order[7], LEAGUE.bestOf.playin);
    schedule(35, "playin", "플레이인", order[5], order[6], LEAGUE.bestOf.playin);
  }],
  // 플레이오프 1라운드
  36: [function () {
    const order = seasonOf().finalOrder;
    const pi = seasonOf().matches.filter(function (m) { return m.comp === "playin"; });
    const seeds = order.slice(0, 4).concat([pi[0].winner, pi[1].winner]);
    seasonOf().seeds = seeds;
    schedule(36, "playoffs", "플레이오프 1라운드", seeds[2], seeds[5], LEAGUE.bestOf.playoffs);
    schedule(36, "playoffs", "플레이오프 1라운드", seeds[3], seeds[4], LEAGUE.bestOf.playoffs);
  }],
  37: [function () { koSemis("playoffs", "플레이오프 4강", seasonOf().seeds, 36, 37, LEAGUE.bestOf.playoffs); }],
  38: [function () { koFinal("playoffs", "결승전", 38, LEAGUE.bestOf.playoffs, "playoffs", "리그 우승"); }],
  // 승강전: 1부 10위 vs 2부 1위, 1부 9위 vs 2부 2위
  39: [function () { promoMatch(39, 9, 0); }],
  40: [function () { promoMatch(40, 8, 1); }],
  41: [setupWorlds],
  44: [function () {
    const g = seasonOf().worlds.groups;
    const top = g.map(function (ids) { return standings("worlds_group", ids).map(function (r) { return r.id; }); });
    schedule(44, "worlds_ko", "월드 8강", top[0][0], top[1][1], LEAGUE.bestOf.worlds_ko);
    schedule(44, "worlds_ko", "월드 8강", top[1][0], top[0][1], LEAGUE.bestOf.worlds_ko);
    schedule(44, "worlds_ko", "월드 8강", top[2][0], top[3][1], LEAGUE.bestOf.worlds_ko);
    schedule(44, "worlds_ko", "월드 8강", top[3][0], top[2][1], LEAGUE.bestOf.worlds_ko);
  }],
  45: [function () {
    const qf = seasonOf().matches.filter(function (m) { return m.comp === "worlds_ko" && m.week === 44; });
    schedule(45, "worlds_ko", "월드 4강", qf[0].winner, qf[2].winner, LEAGUE.bestOf.worlds_ko);
    schedule(45, "worlds_ko", "월드 4강", qf[1].winner, qf[3].winner, LEAGUE.bestOf.worlds_ko);
  }],
  46: [function () { koFinal("worlds_ko", "월드 결승", 46, LEAGUE.bestOf.worlds_ko, "worlds", "월드 챔피언십"); }],
};

// 라운드 순서를 섞어서 (같은 상대를 연달아 만나지 않게 앞뒤 절반은 유지)
function shuffledRounds(rounds) {
  const half = rounds.length / 2;
  return shuffled(rounds.slice(0, half)).concat(shuffled(rounds.slice(half)));
}

// 4강: 1번 시드 vs 1라운드 승자 중 낮은 시드, 2번 시드 vs 나머지
function koSemis(comp, label, seeds, r1Week, week, bo) {
  const r1 = seasonOf().matches.filter(function (m) { return m.comp === comp && m.week === r1Week; });
  const winners = r1.map(function (m) { return m.winner; })
    .sort(function (x, y) { return seeds.indexOf(y) - seeds.indexOf(x); }); // 낮은 시드 먼저
  schedule(week, comp, label, seeds[0], winners[0], bo);
  schedule(week, comp, label, seeds[1], winners[1], bo);
}

// 결승: 같은 주의 4강 승자끼리. 끝나면 우승 기록
function koFinal(comp, label, week, bo, champKey, title) {
  const semis = seasonOf().matches.filter(function (m) { return m.comp === comp && m.week === week - (comp === "cup_po" ? 0 : 1) && m.label.indexOf("4강") !== -1; });
  const f = schedule(week, comp, label, semis[0].winner, semis[1].winner, bo);
  playMatch(f);
  seasonOf().champions[champKey] = f.winner;
  finalsMvp(champKey, f); // 결승 MVP (js/records.js)
  sTraitsOnTitle(f.winner, champKey); // 황제·잡초 (js/straits.js)
  const mine = myTeam();
  if (mine && f.winner === mine.id) {
    state.career.finalsWon = (state.career.finalsWon || 0) + 1;
    addMoment("🏆", mine.name + " " + { cup: "컵 대회 우승", playoffs: "리그 우승", worlds: "월드 챔피언십 우승" }[champKey]);
    if (state.weekCtx) state.weekCtx.champion = title;
  }
  if (champKey === "playoffs") {
    // 월드 진출: 결승 두 팀 + 4강 패자 두 팀
    seasonOf().worldsTeams = [f.winner, f.loser, semis[0].loser, semis[1].loser];
  }
  addNews(title + " 우승", teamName(f.winner) + "이(가) " + teamName(f.loser) + "을(를) " +
    Math.max(f.score[0], f.score[1]) + ":" + Math.min(f.score[0], f.score[1]) + "로 꺾고 " + title + " 우승!");
}

function promoMatch(week, tier1Index, tier2Index) {
  const t1 = seasonOf().finalOrder[tier1Index];
  const t2 = standings(["tier2", "tier2b"], tier2Ids())[tier2Index].id;
  const m = schedule(week, "promotion", "승강전", t1, t2, LEAGUE.bestOf.promotion);
  playMatch(m);
  seasonOf().promo.push({ tier1: t1, tier2: t2, winner: m.winner });
  addNews("승강전", m.winner === t2
    ? teamName(t2) + "이(가) " + teamName(t1) + "을(를) 꺾고 다음 시즌 1부 승격!"
    : teamName(t1) + "이(가) 1부 잔류에 성공했다.");
}

// 월드 챔피언십 준비: 해외 가상 팀 만들고 4개 조 편성
function setupWorlds() {
  const season = seasonOf();
  const domestic = season.worldsTeams || [];
  const base = average(tier1Ids().map(teamStrength));
  const names = shuffled(OVERSEAS_TEAM_NAMES);
  const overseas = [];
  WORLDS.regions.forEach(function (region) {
    for (let i = 0; i < region.teams; i++) {
      const name = names[overseas.length] || ("해외 팀 " + (overseas.length + 1));
      overseas.push({
        id: "W" + (overseas.length + 1),
        name: name + " (" + region.name + ")",
        short: name.slice(0, 3),
        region: region.name,
        power: base * region.strength * randFloat(0.92, 1.08),
      });
    }
  });
  season.worlds = { overseas: overseas, groups: [] };
  // 조 편성: 국내 팀은 서로 다른 조에, 나머지는 해외 팀으로
  const pool = shuffled(overseas.map(function (t) { return t.id; }));
  const groups = [[], [], [], []];
  domestic.forEach(function (id, i) { groups[i % 4].push(id); });
  groups.forEach(function (g) { while (g.length < 4 && pool.length) g.push(pool.pop()); });
  season.worlds.groups = groups;
  groups.forEach(function (ids, gi) {
    const label = "월드 " + "ABCD"[gi] + "조";
    const rounds = doubleRoundRobin(ids);
    rounds.forEach(function (pairs, r) {
      pairs.forEach(function (p) { schedule(42 + Math.floor(r / 3), "worlds_group", label, p[0], p[1], LEAGUE.bestOf.worlds_group); });
    });
  });
  const mine = myTeam();
  if (mine && domestic.indexOf(mine.id) !== -1) addNews("월드 진출", mine.name + "이(가) 월드 챔피언십에 진출했다!");
}

// 한 주 진행: 그 주의 행사(조 편성·토너먼트) → 잡힌 경기 진행
function playLeagueWeek(week) {
  const events = WEEK_EVENTS[week] || [];
  events.forEach(function (fn) {
    fn();
    playDue(week);
  });
  playDue(week);
}

// 우리 팀의 이번 시즌 경기가 모두 끝났나? (week = 방금 끝난 주)
// - 앞으로 잡힌 경기가 있으면 아직
// - 2부: 후반기(33주) 뒤, 2부 1·2위는 승강전을 치른 뒤
// - 1부: 후반기(34주) 뒤. 9·10위는 승강전 뒤, 플레이인·플레이오프 1라운드에서 지면 끝,
//        4강 이상(월드 진출)은 월드 조별 리그 탈락(43주) / 월드 토너먼트에서 지거나 결승이 끝나면(46주) 끝
function userSeasonOver(week) {
  const mine = myTeam();
  if (!mine) return false;
  const s = seasonOf();
  const id = mine.id;
  const involves = function (m) { return m.a === id || m.b === id; };
  if (s.matches.some(function (m) { return !m.winner && involves(m); })) return false;
  const promoDone = (s.promo || []).some(function (p) { return p.tier1 === id || p.tier2 === id; });
  if (mine.tier === 2) {
    if (week < 33) return false;
    const top2 = standings(["tier2", "tier2b"], tier2Ids()).slice(0, 2).map(function (r) { return r.id; });
    return top2.indexOf(id) === -1 || promoDone;
  }
  if (week < 34) return false;
  const order = s.finalOrder || tier1FinalOrder();
  if (order.indexOf(id) >= 8) return promoDone;
  const lostEarly = s.matches.some(function (m) {
    return m.loser === id && (m.comp === "playin" || (m.comp === "playoffs" && m.label.indexOf("1라운드") !== -1));
  });
  if (lostEarly) return true;
  if (week < 38) return false;                               // 플레이오프 진행 중
  if ((s.worldsTeams || []).indexOf(id) === -1) return true;  // (혹시 모를) 월드 미진출
  if (week < 43) return false;                               // 월드 조별 리그 진행 중
  if (s.matches.some(function (m) { return m.comp === "worlds_ko" && m.loser === id; })) return true;
  if (week === 43) {
    const g = s.worlds.groups.find(function (ids) { return ids.indexOf(id) !== -1; });
    return standings("worlds_group", g).slice(0, 2).map(function (r) { return r.id; }).indexOf(id) === -1;
  }
  return week >= 46;
}

// 내 팀의 다음 경기 (아직 안 한 것 중 가장 빠른 것)
function nextUserMatch() {
  const mine = myTeam();
  if (!mine) return null;
  const list = seasonOf().matches.filter(function (m) { return !m.winner && (m.a === mine.id || m.b === mine.id); });
  list.sort(function (x, y) { return x.week - y.week; });
  return list[0] || null;
}

// 내 팀이 한 경기들 (최근 것부터)
function userMatches() {
  const mine = myTeam();
  if (!mine) return [];
  return seasonOf().matches.filter(function (m) { return m.a === mine.id || m.b === mine.id; });
}
