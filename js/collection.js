// ===== 수집·강화 (값: data/collection.js) =====
// 1) 🏆 월드 우승 스킨: 월드 결승 우승 세트에서 우승 팀이 쓴 챔피언 → state.league.worldsSkins (모든 해 기록)
//    내 선수가 뛰었으면 내 스킨 → 그 챔피언 경기력 +2% (js/champions.js champPower)
// 2) ✒️ 시그니처 픽 성장: 시그니처로 뛴 세트마다 경험치 → ★1~★5 (state.sigGrowth = { xp, sets, wins })
// 3) 🏅 업적 도감: 매주 확인해서 이룬 업적 기록·보상 (state.achievements = { id: { y, w } })
// 화면: [수집] 업적 도감 (pages.achievements) · 컬렉션 (pages.collection)

// ----- 1) 월드 우승 스킨 -----
// 월드 결승이 끝나면 (js/matchsim.js koFinal) — f.finalPicks는 playMatch가 세트마다 덮어쓴 마지막(우승) 세트 픽
function recordWorldsSkins(f) {
  const fp = f.finalPicks;
  delete f.finalPicks;
  if (!fp) return;
  const side = f.winner === f.a ? "a" : "b";
  const picks = fp[side], ids = fp[side === "a" ? "la" : "lb"];
  const entry = {
    year: state.year, teamId: f.winner, team: teamName(f.winner),
    players: POSITION_IDS.map(function (pos, i) {
      const id = ids[i] || null;
      return { pos: pos, id: id, name: id ? playerName(id) : null, champ: picks[i] };
    }),
  };
  if (!state.league.worldsSkins) state.league.worldsSkins = [];
  state.league.worldsSkins.push(entry);
  const me = entry.players.find(function (p) { return p.id === USER_ID; });
  if (me) {
    state.popularity = clamp(state.popularity + WORLDS_SKIN.popularity);
    addMoment("🎨", state.year + " 월드 우승 스킨 '" + skinName(entry, me.champ) + "'");
    postMessage("news", "🎨 월드 우승 스킨 제작 확정", state.year + " 월드 챔피언십 우승을 기념해 " + entry.team + " 선수들의 우승 스킨이 만들어진다.\n" +
      state.player.name + "의 스킨은 결승 마지막 세트에서 쓴 " + me.champ + ".", {
      notes: ["🎨 " + me.champ + "을(를) 고르면 경기력 +" + Math.round(WORLDS_SKIN.powerBonus * 100) + "% (스킨 효과)", "인기도 +" + WORLDS_SKIN.popularity, "[수집] → 컬렉션에서 볼 수 있어요."],
    });
  }
}

function skinName(entry, champ) { return entry.year + " " + entry.team + " " + champ; }

// 내 우승 스킨 목록 [{ year, team, champ }]
function mySkins() {
  const list = [];
  ((state.league && state.league.worldsSkins) || []).forEach(function (e) {
    e.players.forEach(function (p) { if (p.id === USER_ID) list.push({ year: e.year, team: e.team, champ: p.champ }); });
  });
  return list;
}
function hasSkin(name) { return mySkins().some(function (s) { return s.champ === name; }); }
function skinPowerBonus(name) { return hasSkin(name) ? WORLDS_SKIN.powerBonus : 0; }
function skinTagHTML(name) {
  const s = mySkins().filter(function (x) { return x.champ === name; });
  if (!s.length) return "";
  return ' <span class="joker-tag skin-tag" title="월드 우승 스킨 (' + s.map(function (x) { return x.year; }).join(", ") + "): 고르면 경기력 +" + Math.round(WORLDS_SKIN.powerBonus * 100) + '%">🎨 스킨</span>';
}

// ----- 2) 시그니처 픽 성장 -----
function sigGrowth() {
  if (!state.sigGrowth) state.sigGrowth = { xp: 0, sets: 0, wins: 0 };
  return state.sigGrowth;
}
function sigStarOf(xp) {
  let s = 0;
  SIGNATURE_GROWTH.stars.forEach(function (v, i) { if (xp >= v) s = i + 1; });
  return s;
}
function sigStar() { return state.signature ? sigStarOf(sigGrowth().xp) : 0; }
// 별에 따른 값 (pickBonus · powerBonus · banChance)
function sigValueAt(key, star) { return MATCH.signaturePick[key] + SIGNATURE_GROWTH.perStar[key] * Math.max(0, star - 1); }
function sigValue(key) { return sigValueAt(key, Math.max(1, sigStar())); }
function starText(n) { return "★".repeat(n) + "☆".repeat(SIGNATURE_GROWTH.stars.length - n); }

// 시그니처 픽으로 뛴 세트 (js/matchsim.js playMatch)
function sigGrowthOnSet(won) {
  if (!state.signature) return;
  const g = sigGrowth();
  const before = sigStar();
  g.sets++;
  if (won) g.wins++;
  g.xp += SIGNATURE_GROWTH.xp.set + (won ? SIGNATURE_GROWTH.xp.win : 0);
  const after = sigStar();
  if (after > before) {
    const P = function (k) { return k === "powerBonus" || k === "banChance" ? Math.round(sigValueAt(k, after) * 100) + "%" : "+" + sigValueAt(k, after); };
    addMoment("✒️", "시그니처 픽 " + state.signature + " " + starText(after));
    addNews("시그니처 픽", "✒️ " + state.player.name + "의 " + state.signature + ", " + starText(after) + "! 이 챔피언만큼은 누구에게도 지지 않는다.");
    postMessage("inbox", "✒️ 시그니처 픽 " + starText(after), state.signature + "을(를) 잡을 때마다 손이 먼저 움직인다. 이제 상대도 이 챔피언을 더 경계한다.", {
      notes: ["고를 때 가치 " + P("pickBonus") + " · 경기력 +" + P("powerBonus") + " · 상대가 먼저 밴할 확률 " + P("banChance"), "[수집] → 컬렉션에서 다음 별까지 남은 경험치를 볼 수 있어요."],
    });
  }
}

// ----- 3) 업적 도감 -----
function achContext() {
  const c = state.career;
  const s = careerSummary(true);
  const rows = (c.seasons || []).concat([currentSeasonRecord()]);
  const has = function (r, w) { return r.titles.some(function (t) { return t.indexOf(w) === 0; }); };
  return { c: c, s: s, rows: rows, has: has };
}
const ACH_VALUES = {
  games: function (x) { return x.c.games || 0; },
  wins: function (x) { return x.c.wins || 0; },
  pog: function (x) { return x.s.pog; },
  solo: function (x) { return x.s.solo; },
  cup: function (x) { return x.s.titles.cup; },
  playoffs: function (x) { return x.s.titles.playoffs; },
  firststand: function (x) { return x.s.titles.firststand; },
  msi: function (x) { return x.s.titles.msi; },
  worlds: function (x) { return x.s.titles.worlds; },
  slam: function (x) { return x.rows.filter(function (r) { return x.has(r, "리그") && x.has(r, "MSI") && x.has(r, "월드"); }).length; },
  allstars: function (x) { return x.c.allstars || 0; },
  peak: function (x) { return Math.floor(x.s.peak); },
  m100: function () { return Object.keys(state.mastery).filter(function (n) { return state.mastery[n] >= MASTERY.max; }).length; },
  sigStar: function () { return sigStar(); },
  skins: function () { return mySkins().length; },
  ladderPeak: function () { return state.soloRank ? state.soloRank.peak : 0; },
  fameTier: function () { return state.fame ? Math.max(state.fame.best || 0, fameTierIndex()) : fameTierIndex(); },
  reputation: function () { return state.reputation; },
  salary: function () { return state.contract ? state.contract.salary : 0; },
  earned: function (x) { return x.c.earned || 0; },
  teams: function (x) { const t = myTeam(); return x.s.teams.concat(t && x.s.teams.indexOf(t.name) === -1 ? [t.name] : []).filter(function (n, i, a) { return a.indexOf(n) === i; }).length; },
  oneClub: function (x) { return ACH_VALUES.teams(x) === 1 ? (x.c.seasons || []).length : 0; },
  seasons: function (x) { return (x.c.seasons || []).length; },
};
function achValue(a, x) {
  if (a.key.indexOf("aw_") === 0) { const k = a.key.slice(3); return (x.c.awards || []).filter(function (w) { return w.key === k; }).length; }
  if (a.key.indexOf("ev_") === 0) { const k = a.key.slice(3); return (x.c.ev && x.c.ev.total && x.c.ev.total[k]) || 0; }
  const f = ACH_VALUES[a.key];
  return f ? f(x) || 0 : 0;
}

// 매주 (main.js nextWeek) + 화면 열 때 확인. 새로 이룬 업적 → 보상 + 연락 1개로 묶음
function checkAchievements() {
  if (!state.player || state.retired || !state.league || !state.league.season) return;
  if (!state.achievements) state.achievements = {};
  const x = achContext();
  const fresh = ACHIEVEMENTS.filter(function (a) { return !state.achievements[a.id] && achValue(a, x) >= a.goal; });
  if (!fresh.length) return;
  const sum = { popularity: 0, reputation: 0, money: 0 };
  fresh.forEach(function (a) {
    state.achievements[a.id] = { y: state.year, w: state.week };
    const r = ACH_REWARD[a.grade];
    sum.popularity += r.popularity; sum.reputation += r.reputation; sum.money += eventMoney(r.money);
  });
  state.popularity = clamp(state.popularity + sum.popularity);
  state.reputation = Math.min(100, state.reputation + sum.reputation);
  state.money += sum.money;
  const title = fresh.length === 1 ? "🏅 업적 달성: " + fresh[0].name : "🏅 업적 " + fresh.length + "개 달성";
  postMessage("news", title, fresh.map(function (a) { return a.icon + " " + a.name + " — " + a.desc; }).join("\n"), {
    notes: ["보상: 인기도 +" + sum.popularity + (sum.reputation ? " · 평판 +" + sum.reputation : "") + " · " + moneyText(sum.money), "[수집] → 업적 도감 (" + achDoneCount() + "/" + ACHIEVEMENTS.length + ")"],
  });
  fresh.filter(function (a) { return a.grade === "g"; }).forEach(function (a) { addMoment("🏅", "업적 '" + a.name + "' 달성"); });
}
function achDoneCount() { return ACHIEVEMENTS.filter(function (a) { return state.achievements && state.achievements[a.id]; }).length; }

const ACH_GRADE_NAME = { b: "동", s: "은", g: "금" };

// ----- 화면: 업적 도감 -----
pages.achievements = function () {
  checkAchievements();
  const x = achContext();
  const done = achDoneCount(), total = ACHIEVEMENTS.length;
  const pct = Math.round(done / total * 100);
  const cards = ACH_CATS.map(function (cat) {
    const list = ACHIEVEMENTS.filter(function (a) { return a.cat === cat.id; });
    const got = list.filter(function (a) { return state.achievements[a.id]; }).length;
    const items = list.map(function (a) {
      const d = state.achievements[a.id];
      const v = Math.min(a.goal, achValue(a, x));
      const r = ACH_REWARD[a.grade];
      const tip = "보상: 인기도 +" + r.popularity + (r.reputation ? " · 평판 +" + r.reputation : "") + " · " + moneyText(eventMoney(r.money));
      const prog = d ? '<span class="up small">✅ ' + d.y + "년 " + d.w + "주</span>"
        : '<div class="bar ach-bar"><div class="bar-fill" style="width:' + Math.round(v / a.goal * 100) + '%"></div></div><span class="muted small">' + achNum(a, v) + " / " + achNum(a, a.goal) + "</span>";
      return '<div class="ach' + (d ? " done" : "") + '"><div class="ach-icon">' + a.icon + "</div>" +
        '<div class="ach-body"><div><b>' + escapeHTML(a.name) + '</b> <span class="ach-grade g-' + a.grade + ' tip" tabindex="0" data-tip="' + escapeHTML(tip) + '">' + ACH_GRADE_NAME[a.grade] + "</span></div>" +
        '<div class="muted small">' + escapeHTML(a.desc) + "</div>" + prog + "</div></div>";
    }).join("");
    return '<div class="card"><h2>' + cat.name + ' <span class="muted small">' + got + "/" + list.length + "</span></h2>" + '<div class="ach-list">' + items + "</div></div>";
  }).join("");
  return "<h1>업적 도감</h1>" +
    '<div class="card"><h2>달성 ' + done + " / " + total + ' <span class="muted small">(' + pct + "%)</span></h2>" +
      '<div class="bar"><div class="bar-fill gold" style="width:' + pct + '%"></div></div>' +
      '<p class="muted small">업적을 이루면 인기도·평판·돈 보상이 와요 (동 · 은 · 금). 매주 자동으로 확인해요. 등급 글자에 마우스를 올리면 보상을 볼 수 있어요.</p></div>' +
    '<div class="grid">' + cards + "</div>";
};
// 큰 숫자는 돈으로
function achNum(a, v) { return a.key === "salary" || a.key === "earned" ? moneyText(v) : String(v); }

// ----- 화면: 컬렉션 (시그니처 픽 · 우승 스킨) -----
pages.collection = function () {
  // 시그니처 픽
  let sigCard;
  if (!state.signature) {
    sigCard = '<div class="card"><h2>✒️ 시그니처 픽</h2><p class="muted">아직 없어요. 내 포지션 챔피언 숙련도가 ' + MASTERY.max + "이 되면 '이게 내 시그니처 픽인가?' 하는 순간이 와요.</p></div>";
  } else {
    const g = sigGrowth(), star = sigStar();
    const S = SIGNATURE_GROWTH.stars;
    const next = S[star]; // 다음 별 경험치 (★5면 undefined)
    const prev = S[star - 1];
    const pct = next === undefined ? 100 : Math.round((g.xp - prev) / (next - prev) * 100);
    const rows = S.map(function (v, i) {
      const n = i + 1;
      return "<tr" + (n === star ? ' class="me"' : "") + "><td>" + starText(n) + '</td><td class="r">' + v + '</td><td class="r">+' + sigValueAt("pickBonus", n) +
        '</td><td class="r">+' + Math.round(sigValueAt("powerBonus", n) * 100) + '%</td><td class="r">' + Math.round(sigValueAt("banChance", n) * 100) + "%</td></tr>";
    }).join("");
    sigCard = '<div class="card"><h2>✒️ 시그니처 픽 <span class="muted small">' + escapeHTML(state.signature) + "</span></h2>" +
      '<div class="sig-stars">' + starText(star) + "</div>" +
      '<div class="bar"><div class="bar-fill gold" style="width:' + pct + '%"></div></div>' +
      '<p class="muted small">경험치 ' + g.xp + (next === undefined ? " (최고 단계)" : " / " + next + " (다음 별까지 " + (next - g.xp) + ")") + " · 시그니처로 뛴 세트 " + g.sets + " (승 " + g.wins + ") · 세트마다 +" + SIGNATURE_GROWTH.xp.set + ", 이기면 +" + SIGNATURE_GROWTH.xp.win + "</p>" +
      '<table class="mini"><tr><th>단계</th><th class="r">경험치</th><th class="r">고를 때 가치</th><th class="r">경기력</th><th class="r">상대 선밴</th></tr>' + rows + "</table>" +
      '<p class="muted small">별이 오를수록 강해지지만 상대도 더 자주 먼저 밴해요. 고른 세트에서는 좋은 장면 1번 보장 · 대격변 패치에도 그대로.</p></div>';
  }
  // 내 우승 스킨
  const mine = mySkins();
  const skinCard = '<div class="card"><h2>🎨 내 월드 우승 스킨 <span class="muted small">' + mine.length + "개</span></h2>" +
    (mine.length ? '<div class="skin-list">' + mine.map(function (s) {
      return '<div class="skin-card"><div class="skin-year">' + s.year + '</div><div class="skin-champ">' + escapeHTML(s.champ) + '</div><div class="muted small">' + escapeHTML(s.team) + "</div></div>";
    }).join("") + "</div>" + '<p class="muted small">스킨이 있는 챔피언을 고르면 경기력 +' + Math.round(WORLDS_SKIN.powerBonus * 100) + "%.</p>"
      : '<p class="muted">월드 챔피언십 결승에서 우승하면, 우승 세트에서 쓴 챔피언으로 우승 스킨이 만들어져요.</p>') + "</div>";
  // 역대 월드 우승 스킨
  const all = ((state.league && state.league.worldsSkins) || []).slice().reverse();
  const hist = all.map(function (e) {
    const me = e.players.some(function (p) { return p.id === USER_ID; });
    return "<tr" + (me ? ' class="me"' : "") + "><td>" + e.year + "</td><td><b>" + escapeHTML(e.team) + "</b></td>" + e.players.map(function (p) {
      return "<td>" + escapeHTML(p.champ) + (p.name ? '<div class="muted small">' + escapeHTML(p.name) + "</div>" : "") + "</td>";
    }).join("") + "</tr>";
  }).join("");
  const histCard = '<div class="card"><h2>🌍 역대 월드 우승 스킨</h2>' +
    (hist ? '<div class="table-wrap"><table class="roster tlog"><tr><th>연도</th><th>팀</th>' + POSITION_IDS.map(function (pos) { return "<th>" + findPosition(pos).name + "</th>"; }).join("") + "</tr>" + hist + "</table></div>"
      : '<p class="muted">아직 기록이 없어요. 월드 챔피언십 결승이 끝나면 우승 팀의 스킨이 여기에 남아요.</p>') + "</div>";
  return "<h1>컬렉션</h1>" + '<div class="grid">' + sigCard + skinCard + "</div>" + histCard;
};
