// ===== 국제대회: First Stand · Road to MSI · MSI (규칙: data/schedule.js INTL) =====
// 실제 2025년 흐름: LCK 컵 우승 → First Stand(10~11주) → 1·2라운드 상위 6팀 Road to MSI(23~24주) → MSI(25~28주) → 월드
// - First Stand를 우리 리그 팀이 우승하면 MSI에서 국내 2팀 모두 본선 직행 (season.fsBonus)
// - MSI를 우리 리그 팀이 우승하면 월드 국내 출전 +1팀 (season.msiBonus)
// 해외 팀: season.overseas = [{ id, name, short, region, rank, ratio, power }] — 시즌 내내 같은 팀이 나와요

// ----- 해외 팀 -----
// 시즌 해외 팀 = 해외 리그(state.world, js/era.js)의 올해 참가 지역 팀들. 지역 순위는 전력 ± 흔들림으로 정함
// (예전 세이브에서 해외 리그가 없으면 예전 방식: INTL.regions 가상 팀)
function ensureOverseasPool() {
  const s = seasonOf();
  if (s.overseas && s.overseas.length) return s.overseas;
  if (state.world && state.world.teams.length) {
    const list = [];
    activeRegions(s.year).forEach(function (r) {
      state.world.teams.filter(function (t) { return t.region === r.id; })
        .map(function (t) { return { t: t, v: worldTeamStrength(t) + randFloat(-WORLD_RULES.rankNoise, WORLD_RULES.rankNoise) }; })
        .sort(function (a, b) { return b.v - a.v; })
        .forEach(function (x, i) {
          list.push({ id: x.t.id, name: x.t.name + " (" + r.name + ")", short: x.t.short, region: r.name, regionId: r.id, rank: i + 1, strength: r.strength, power: 0 });
        });
    });
    s.overseas = list;
    refreshOverseasPower();
    return list;
  }
  const names = shuffled(OVERSEAS_TEAM_NAMES);
  const list = [];
  INTL.regions.forEach(function (region) {
    for (let i = 0; i < region.teams; i++) {
      const name = names[list.length] || ("해외 팀 " + (list.length + 1));
      list.push({
        id: "W" + (list.length + 1),
        name: name + " (" + region.name + ")",
        short: name.slice(0, 3),
        region: region.name,
        rank: i + 1,
        ratio: region.strength * (INTL.topBonus[i] || 0.92) * randFloat(0.96, 1.04),
        power: 0,
      });
    }
  });
  s.overseas = list;
  refreshOverseasPower();
  return list;
}

// 대회가 열릴 때마다 우리 리그 수준(1부 전력 × 숙련도 배율)에 맞춰 해외 팀 전력 갱신
function refreshOverseasPower() {
  const f = npcPowerFactor();
  const base = average(tier1Ids().map(teamStrength)) * f;
  (seasonOf().overseas || []).forEach(function (t) {
    const wt = findWorldTeam(t.id);
    t.power = wt ? worldTeamStrength(wt) * f : base * t.ratio; // 해외 리그 팀은 선수 전력으로
  });
}

// 해외 팀 중 강한 순 (exclude: 뺄 팀 id)
function overseasByPower(exclude) {
  exclude = exclude || [];
  return ensureOverseasPool().filter(function (t) { return exclude.indexOf(t.id) === -1; })
    .slice().sort(function (a, b) { return b.power - a.power; });
}

// 지역별 1위 팀들 (강한 지역 순)
function regionChampions() {
  const pool = ensureOverseasPool();
  const regions = [];
  pool.forEach(function (t) { if (regions.indexOf(t.region) === -1) regions.push(t.region); });
  return regions.map(function (name) {
    return pool.filter(function (t) { return t.region === name; }).sort(function (a, b) { return a.rank - b.rank; })[0];
  }).filter(Boolean).sort(function (a, b) { return b.power - a.power; });
}

function isDomestic(id) { return !!findTeam(id); }

// ----- First Stand -----
// 9주(컵 결승 직후): 컵 우승팀 + 해외 지역 1위 4팀, 10주에 조별 리그(한 번씩) 일정
function setupFirstStand() {
  const s = seasonOf();
  if (s.fs || !s.champions.cup || !firstStandOn(s.year)) return; // First Stand는 2025년부터 (data/era.js)
  ensureOverseasPool();
  refreshOverseasPower();
  const teams = [s.champions.cup].concat(regionChampions().slice(0, 4).map(function (t) { return t.id; }));
  s.fs = { teams: teams };
  roundRobin(shuffled(teams)).forEach(function (pairs) {
    pairs.forEach(function (p) { schedule(10, "fs_group", "First Stand 조별 리그", p[0], p[1], INTL.firstStand.groupBo); });
  });
  addNews("First Stand", teamName(s.champions.cup) + "이(가) LCK 컵 우승팀으로 국제대회 First Stand에 나간다. (10~11주)");
}

// 11주: 조 1위 vs 4위, 2위 vs 3위 → 같은 주 결승
function firstStandKnockout() {
  const s = seasonOf();
  if (!s.fs) return;
  const top = standings("fs_group", s.fs.teams).slice(0, 4).map(function (r) { return r.id; });
  s.fs.seeds = top;
  playMatch(schedule(11, "fs_ko", "First Stand 4강", top[0], top[3], INTL.firstStand.koBo));
  playMatch(schedule(11, "fs_ko", "First Stand 4강", top[1], top[2], INTL.firstStand.koBo));
  koFinal("fs_ko", "First Stand 결승", 11, INTL.firstStand.koBo, "firststand", "First Stand");
  const w = s.champions.firststand;
  if (w && isDomestic(w)) {
    s.fsBonus = true;
    addNews("First Stand", "우리 리그가 First Stand를 제패! MSI에서 국내 대표 2팀이 모두 본선(8강)에 바로 올라간다.");
  }
}

// ----- Road to MSI (23~24주, 1·2라운드 상위 6팀) -----
function rtmsiSeeds() {
  const s = seasonOf();
  if (!s.rtmsiSeeds) s.rtmsiSeeds = standings("split1", tier1Ids()).slice(0, 6).map(function (r) { return r.id; });
  return s.rtmsiSeeds;
}
function rtmsiMatch(word) {
  return seasonOf().matches.find(function (m) { return m.comp === "rtmsi" && m.label.indexOf(word) !== -1; });
}
const RTMSI_LABELS = { r1: "Road to MSI 1라운드", r2: "Road to MSI 2라운드", r3: "Road to MSI 1번 시드전", r4: "Road to MSI 3라운드", r5: "Road to MSI 최종전" };

function roadToMsiWeek1() {
  if (!msiOn(seasonOf().year)) return; // MSI는 2015년부터 (data/era.js)
  const sd = rtmsiSeeds();
  const bo = INTL.roadToMsi.bo;
  const r1 = schedule(23, "rtmsi", RTMSI_LABELS.r1, sd[4], sd[5], bo);
  playMatch(r1);
  playMatch(schedule(23, "rtmsi", RTMSI_LABELS.r2, sd[3], r1.winner, bo));
}

function roadToMsiWeek2() {
  const s = seasonOf();
  if (!msiOn(s.year) || !s.rtmsiSeeds) return;
  const sd = rtmsiSeeds();
  const bo = INTL.roadToMsi.bo;
  const r2 = rtmsiMatch("2라운드");
  const r3 = schedule(24, "rtmsi", RTMSI_LABELS.r3, sd[0], sd[1], bo);
  playMatch(r3);
  const r4 = schedule(24, "rtmsi", RTMSI_LABELS.r4, sd[2], r2.winner, bo);
  playMatch(r4);
  const r5 = schedule(24, "rtmsi", RTMSI_LABELS.r5, r3.loser, r4.winner, bo);
  playMatch(r5);
  s.msiTeams = [r3.winner, r5.winner];
  const mine = myTeam();
  queueHeadline("rtmsi_result", mine && s.msiTeams.indexOf(mine.id) !== -1 ? "myTeam" : "other", { seed1: teamName(r3.winner), seed2: teamName(r5.winner) }); // 화면 뉴스
  addNews("Road to MSI", "MSI 대표 확정: 1번 시드 " + teamName(r3.winner) + ", 2번 시드 " + teamName(r5.winner) + ".");
  setupMsi();
}

// ----- MSI (25~28주) -----
// 본선 8강: 국내 1번 시드 + (First Stand 우승이면 2번 시드도) + 해외 강팀 → 6자리, 플레이인 4팀(5판) 승자 2팀
function setupMsi() {
  const s = seasonOf();
  if (s.msi || !s.msiTeams) return;
  ensureOverseasPool();
  refreshOverseasPower();
  const dom = s.msiTeams;
  const direct = s.fsBonus ? dom.slice() : [dom[0]];
  const playin = s.fsBonus ? [] : [dom[1]];
  const ovs = overseasByPower().map(function (t) { return t.id; });
  while (direct.length < INTL.msi.bracket - 2) direct.push(ovs.shift());
  while (playin.length < INTL.msi.playin) playin.push(ovs.shift());
  s.msi = { direct: direct, playin: playin };
  // 플레이인: 국내 팀(있으면)은 가장 약한 해외 팀과
  schedule(25, "msi_playin", "MSI 플레이인", playin[0], playin[3], INTL.msi.bo);
  schedule(25, "msi_playin", "MSI 플레이인", playin[1], playin[2], INTL.msi.bo);
  addNews("MSI", "MSI 대진 발표: " + dom.map(teamName).join(", ") + (s.fsBonus ? " (둘 다 본선 직행)" : " (" + teamName(dom[1]) + "은(는) 플레이인부터)"));
}

// 8강 대진: 국내 1번 시드와 (본선 직행한) 2번 시드는 반대편, 국내 팀이 이긴 플레이인 자리도 반대편으로
function msiBracketOrder() {
  const s = seasonOf();
  const pi = s.matches.filter(function (m) { return m.comp === "msi_playin"; });
  if (pi.length < 2 || !pi.every(function (m) { return m.winner; })) return null;
  const d = s.msi.direct;
  const piW = [pi[1].winner, pi[0].winner]; // pi[0]은 국내 팀이 있을 수 있는 경기 → 1번 시드 반대편(B조)으로
  const A = [d[0], piW[0], d[2], d[4]];
  const B = [d[1], piW[1], d[3], d[5]];
  return A.concat(B);
}

function msiQuarterfinals() {
  const o = msiBracketOrder();
  if (!o) return;
  for (let i = 0; i < 8; i += 2) schedule(26, "msi_ko", "MSI 8강", o[i], o[i + 1], INTL.msi.bo);
}

function msiSemifinals() {
  const qf = seasonOf().matches.filter(function (m) { return m.comp === "msi_ko" && m.label.indexOf("8강") !== -1; });
  if (qf.length !== 4) return;
  schedule(27, "msi_ko", "MSI 4강", qf[0].winner, qf[1].winner, INTL.msi.bo);
  schedule(27, "msi_ko", "MSI 4강", qf[2].winner, qf[3].winner, INTL.msi.bo);
}

function msiFinal() {
  const s = seasonOf();
  if (!s.matches.some(function (m) { return m.comp === "msi_ko" && m.label.indexOf("4강") !== -1; })) return;
  koFinal("msi_ko", "MSI 결승", 28, INTL.msi.bo, "msi", "MSI");
  if (isDomestic(s.champions.msi)) {
    s.msiBonus = true;
    addNews("MSI", "우리 리그가 MSI 우승! 올해 월드 챔피언십에 국내 " + worldsSeedCount() + "팀이 나간다.");
  }
}

// 올해 월드 국내 출전 팀 수
function worldsSeedCount() {
  return INTL.worldsSeeds + (seasonOf().msiBonus ? INTL.msiBonusSeeds : 0);
}

// ----- 대진 미리 보기 (js/matchsim.js koPreview에서 부름) -----
function intlPreview(week) {
  const s = seasonOf();
  const allPlayed = function (list) { return list.length && list.every(function (m) { return m.winner; }); };
  const of = function (comp, word) { return s.matches.filter(function (m) { return m.comp === comp && (!word || m.label.indexOf(word) !== -1); }); };
  if (week === 11 && s.fs && allPlayed(of("fs_group"))) {
    const t = standings("fs_group", s.fs.teams).slice(0, 4).map(function (r) { return r.id; });
    return [{ comp: "fs_ko", label: "First Stand 4강", a: t[0], b: t[3], bo: INTL.firstStand.koBo },
            { comp: "fs_ko", label: "First Stand 4강", a: t[1], b: t[2], bo: INTL.firstStand.koBo }];
  }
  if (week === 23 && msiOn(s.year) && allPlayed(of("split1"))) {
    const sd = standings("split1", tier1Ids()).slice(0, 6).map(function (r) { return r.id; });
    return [{ comp: "rtmsi", label: RTMSI_LABELS.r1, a: sd[4], b: sd[5], bo: INTL.roadToMsi.bo },
            { comp: "rtmsi", label: RTMSI_LABELS.r2 + " (1라운드 승자와)", a: sd[3], b: null, bo: INTL.roadToMsi.bo }];
  }
  if (week === 24 && s.rtmsiSeeds) {
    const sd = s.rtmsiSeeds;
    const r2 = of("rtmsi", "2라운드")[0];
    return [{ comp: "rtmsi", label: RTMSI_LABELS.r3, a: sd[0], b: sd[1], bo: INTL.roadToMsi.bo }]
      .concat(r2 && r2.winner ? [{ comp: "rtmsi", label: RTMSI_LABELS.r4, a: sd[2], b: r2.winner, bo: INTL.roadToMsi.bo }] : []);
  }
  if (week === 26 && s.msi) {
    const o = msiBracketOrder();
    if (!o) return [];
    const list = [];
    for (let i = 0; i < 8; i += 2) list.push({ comp: "msi_ko", label: "MSI 8강", a: o[i], b: o[i + 1], bo: INTL.msi.bo });
    return list;
  }
  if (week === 27) {
    const qf = of("msi_ko", "8강");
    if (qf.length !== 4 || !allPlayed(qf)) return [];
    return [{ comp: "msi_ko", label: "MSI 4강", a: qf[0].winner, b: qf[1].winner, bo: INTL.msi.bo },
            { comp: "msi_ko", label: "MSI 4강", a: qf[2].winner, b: qf[3].winner, bo: INTL.msi.bo }];
  }
  if (week === 28) {
    const sf = of("msi_ko", "4강");
    return sf.length === 2 && allPlayed(sf) ? [{ comp: "msi_ko", label: "MSI 결승", a: sf[0].winner, b: sf[1].winner, bo: INTL.msi.bo }] : [];
  }
  return [];
}

// ----- 주차 행사 등록 (js/matchsim.js WEEK_EVENTS) -----
WEEK_EVENTS[9].push(setupFirstStand);              // 컵 결승 직후
WEEK_EVENTS[11] = [firstStandKnockout];
WEEK_EVENTS[23] = [roadToMsiWeek1];
WEEK_EVENTS[24] = [roadToMsiWeek2];
WEEK_EVENTS[26] = [msiQuarterfinals];
WEEK_EVENTS[27] = [msiSemifinals];
WEEK_EVENTS[28] = [msiFinal];
