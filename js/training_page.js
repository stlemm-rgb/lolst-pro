// ===== 훈련 화면 (pages.training) =====
// 위: 📊 내 스탯(막대) · 🔮 이번 주 예상 · 📈 최근 4주 성장
// 가운데: 훈련 카드(추천 배지·예상 상승치·체력·솔랭 판수·챔피언 칩) + 휴식 줄
// 아래: 📋 한눈에 비교표(훈련 × 스탯 예상 상승치)
// 예상치는 내 보너스(포지션·유형·특성·장비·합숙)와 성장 곡선·상한선·노화·지침(체력 20 미만 절반)까지 넣은 평균값이에요.

// ----- 예상 상승치 -----
function trainingExpect(t) {
  const tired = state.stamina < TIRED_LIMIT && t.id !== "rest";
  const half = tired ? 0.5 : 1;
  const avg = function (r) { return (r[0] + r[1]) / 2; };
  const out = { stats: {}, mastery: [], masteryTotal: 0, stamina: 0, condition: 0, tired: tired, ladder: t.ladderGames || 0 };
  const masteryGain = function (name, amount, share) {
    const now = state.mastery[name] || MASTERY.min;
    const g = Math.min(MASTERY.max - now, amount * share * masteryGrowthMultiplier(name) * Math.max(0.3, 1 - now / 125) * half);
    out.mastery.push({ name: name, v: g });
    out.masteryTotal += g;
  };
  Object.keys(t.effects).forEach(function (id) {
    const r = t.effects[id];
    if (state.stats[id] !== undefined) {
      if (r[1] <= 0) { out.stats[id] = avg(r); return; }
      const cur = state.stats[id];
      const g = avg(r) * (1 + trainingBonusFor(id)) * growthMultiplier(cur, state.player.traits, id) * agingTrainingMultiplier(id) * half;
      out.stats[id] = Math.max(0, Math.min(g, userStatCap(id) - cur));
    } else if (id === "stamina") {
      out.stamina = r[0] < 0 ? avg(r) * staminaCostMultiplier() : avg(r) * (1 + traitEffectSum("restBonus"));
    } else if (id === "condition") {
      out.condition = Math.min(avg(r), Math.max(0, conditionCap() - state.condition));
    } else if (id === "mastery") {
      practiceTargets().forEach(function (x) { masteryGain(x.name, avg(r), x.share); });
    } else if (id === "masteryFocus") {
      masteryGain(focusChamp(), avg(r), 1);
    } else if (id === "masteryMeta") {
      const name = myPositionChampions().filter(function (n) { return isMeta(n); }).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; })[0];
      if (name) masteryGain(name, avg(r), 1);
    }
  });
  return out;
}

// 챔피언 연습 대상 (js/champions.js practiceChampions와 같은 규칙)
function practiceTargets() {
  if (state.practiceChamp && state.mastery[state.practiceChamp] !== undefined) return [{ name: state.practiceChamp, share: 1 }];
  const mine = myPositionChampions();
  const meta = mine.filter(isMeta).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
  const rest = mine.filter(function (n) { return !isMeta(n); }).sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
  return meta.concat(rest).slice(0, 3).map(function (n) { return { name: n, share: 0.5 }; });
}

function fmt1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
function signed1(v) { return (v >= 0 ? "+" : "−") + fmt1(Math.abs(v)); }

// ----- 추천 배지 -----
// { 훈련 id: [{ icon, text, cls }] }
function trainingBadges() {
  const map = {};
  const add = function (id, b) { (map[id] = map[id] || []).push(b); };
  // 퀘스트
  (state.quests || []).forEach(function (q) {
    const qp = questPlan(q);
    if (qp) add(qp.plan, { text: "📋 퀘스트", tip: "퀘스트 '" + findQuest(q.id).title + "'을(를) 채우는 훈련" });
  });
  // 약점: 후보(2군)면 주전 경쟁 상대보다 낮은 스탯, 아니면 내 낮은 스탯 3개 (상한선에 닿은 건 빼고)
  const rival = state.benched ? benchRival() : null;
  let weak, weakLabel;
  if (rival) {
    const rs = statsOfId(rival);
    weak = STATS.map(function (s) { return { id: s.id, gap: rs[s.id] - state.stats[s.id] }; })
      .filter(function (x) { return x.gap > 0; }).sort(function (a, b) { return b.gap - a.gap; }).slice(0, 4).map(function (x) { return x.id; });
    weakLabel = { text: "⚔️ 주전 경쟁", tip: "주전 " + playerName(rival) + "보다 낮은 스탯을 올려요" };
  } else {
    weak = STATS.filter(function (s) { return state.stats[s.id] < userStatCap(s.id); })
      .sort(function (a, b) { return state.stats[a.id] - state.stats[b.id]; }).slice(0, 3).map(function (s) { return s.id; });
    weakLabel = { text: "📈 약점 보강", tip: "내 낮은 스탯(" + weak.map(statName).join("·") + ")을 올려요" };
  }
  TRAININGS.forEach(function (t) {
    if (t.id === "rest") return;
    const hit = Object.keys(t.effects).filter(function (id) { return weak.indexOf(id) !== -1; }).length;
    if (hit >= 2 || (hit >= 1 && weak.length <= 2)) add(t.id, weakLabel);
  });
  // 메타 숙련도
  if (metaPenaltyInfo().avg < MATCH.metaPenaltyBase) {
    const tip = "메타 챔피언 평균 숙련도 " + Math.round(metaPenaltyInfo().avg) + " → " + MATCH.metaPenaltyBase + " 아래라 경기력이 깎여요";
    add("champion", { text: "🎯 메타 숙련도", tip: tip });
    add("champ_focus", { text: "🎯 메타 숙련도", tip: tip });
  }
  // 솔랭 마감 (패치 전 주)
  if (isPrePatchWeek(state.week)) add("solo_rank", { text: "👑 솔랭 마감", tip: "이번 주가 끝나면 솔로 랭크 초기화" });
  // 체력
  if (state.stamina < TIRED_LIMIT) {
    add("rest", { text: "💤 체력 위험", tip: "체력 " + state.stamina + " → " + TIRED_LIMIT + " 아래라 훈련 효과가 절반", cls: "warn" });
    TRAININGS.forEach(function (t) { if (t.id !== "rest") add(t.id, { text: "⚠️ 효과 절반", tip: "지금 체력이 " + TIRED_LIMIT + " 아래라 효과가 절반이에요", cls: "warn" }); });
  } else if (state.stamina < TEAM_MATCH.lowStaminaLimit + 10) {
    add("rest", { text: "💤 체력 낮음", tip: "체력 " + state.stamina + ". 경기가 있으면 " + TEAM_MATCH.lowStaminaLimit + " 아래에서 경기력이 깎여요" });
  }
  return map;
}

function badgesHTML(list) {
  return (list || []).map(function (b) {
    return '<span class="tbadge' + (b.cls ? " " + b.cls : "") + ' tip" tabindex="0" data-tip="' + escapeHTML(b.tip || "") + '">' + b.text + "</span>";
  }).join("");
}

// ----- 위쪽: 내 스탯 · 이번 주 예상 · 최근 4주 -----
function trainStatsPanelHTML(exp) {
  const rows = STATS.map(function (s) {
    const v = state.stats[s.id], cap = userStatCap(s.id);
    const g = exp && exp.stats[s.id] > 0 ? exp.stats[s.id] : 0;
    return '<div class="tstat" data-stat="' + s.id + '"><span class="tstat-name' + (isBonusStat(s.id) ? " bonus" : "") + '">' + (isBonusStat(s.id) ? "★" : "") + s.name + "</span>" +
      '<span class="bar"><span class="bar-fill' + (isBonusStat(s.id) ? " gold" : "") + '" style="width:' + v + '%"></span>' +
        (g ? '<span class="bar-gain" style="left:' + v + "%;width:" + Math.max(1.5, g) + '%"></span>' : "") + "</span>" +
      '<span class="tstat-val">' + v + '<span class="muted">/' + cap + "</span>" + (g ? ' <span class="up">+' + fmt1(g) + "</span>" : "") + "</span></div>";
  }).join("");
  return '<div class="card tpanel"><h2>📊 내 스탯 <span class="muted small">초록 = 고른 훈련으로 이번 주 오를 양 · 카드에 마우스를 올리면 오를 스탯이 빛나요</span></h2>' +
    '<div class="tstats">' + rows + "</div></div>";
}

function trainForecastHTML(t, exp) {
  if (!t) return '<div class="card tpanel"><h2>🔮 이번 주 예상</h2><p class="muted">아래에서 훈련을 골라 주세요.</p></div>';
  const parts = Object.keys(exp.stats).filter(function (id) { return exp.stats[id] > 0.05; }).map(function (id) {
    return statName(id) + ' <b class="up">+' + fmt1(exp.stats[id]) + "</b>";
  });
  if (exp.masteryTotal > 0.05) parts.push("숙련도 " + exp.mastery.map(function (m) { return escapeHTML(m.name) + ' <b class="up">+' + fmt1(m.v) + "</b>"; }).join(", "));
  if (exp.condition) parts.push("컨디션 <b class=\"up\">+" + fmt1(exp.condition) + "</b>");
  const after = Math.max(0, Math.min(state.staminaMax, Math.round(state.stamina + exp.stamina)));
  const wk = userWeekMatches(state.week);
  const hasMatch = wk.matches.length + wk.preview.length > 0 && !state.benched;
  return '<div class="card tpanel"><h2>🔮 이번 주 예상 <span class="muted small">' + escapeHTML(t.name) + "</span></h2>" +
    (exp.tired ? '<p class="down small">⚠️ 체력이 ' + TIRED_LIMIT + " 아래라 효과가 절반이에요. 휴식을 먼저 고려해 보세요.</p>" : "") +
    '<p class="tforecast">' + (parts.join(" · ") || '<span class="muted">스탯 변화 없음</span>') + "</p>" +
    '<p class="small">체력 ' + state.stamina + " → <b class=\"" + (after < TIRED_LIMIT ? "down" : "") + '">' + after + "</b>" +
      (hasMatch ? ' <span class="muted">(이번 주 경기가 있어서 더 줄어요)</span>' : "") +
      (exp.ladder ? " · 솔로 랭크 " + exp.ladder + "판" : "") + "</p>" +
    '<p class="muted small">평균값이에요. 실제로는 범위 안에서 무작위로 정해져요.</p></div>';
}

// 맨 위 한 줄: 지금 고른 훈련과 이번 주 예상 (자세한 건 아래 '이번 주 예상' 칸)
function trainForecastStripHTML(t, exp) {
  if (!t) return '<div class="tstrip">👇 이번 주 훈련을 골라 주세요. 카드의 초록 숫자 = 이번 주 예상 상승치</div>';
  const top = Object.keys(exp.stats).filter(function (id) { return exp.stats[id] > 0.05; })
    .map(function (id) { return statName(id) + ' <b class="up">+' + fmt1(exp.stats[id]) + "</b>"; });
  if (exp.masteryTotal > 0.05) top.push('숙련도 <b class="up">+' + fmt1(exp.masteryTotal) + "</b>");
  if (exp.condition) top.push('컨디션 <b class="up">+' + fmt1(exp.condition) + "</b>");
  const after = Math.max(0, Math.min(state.staminaMax, Math.round(state.stamina + exp.stamina)));
  return '<div class="tstrip' + (exp.tired ? " warn" : "") + '">✔ <b>' + escapeHTML(t.name) + "</b> · " + (top.join(" · ") || "스탯 변화 없음") +
    ' · 체력 ' + state.stamina + " → <b" + (after < TIRED_LIMIT ? ' class="down"' : "") + ">" + after + "</b>" +
    (exp.tired ? ' · <span class="down">⚠️ 지쳐서 효과 절반</span>' : "") + "</div>";
}

function trainHistoryHTML() {
  const list = (state.trainHistory || []).slice(-4);
  if (!list.length) return '<div class="card tpanel"><h2>📈 최근 4주 성장</h2><p class="muted small">훈련을 하면 여기에 쌓여요.</p></div>';
  const sum = {}, champ = {};
  list.forEach(function (h) {
    Object.keys(h.changes || {}).forEach(function (k) {
      const v = h.changes[k];
      if (k.indexOf("m:") === 0) champ[k.slice(2)] = (champ[k.slice(2)] || 0) + v;
      else if (state.stats[k] !== undefined) sum[k] = (sum[k] || 0) + v;
    });
  });
  const stats = Object.keys(sum).filter(function (k) { return sum[k]; }).sort(function (a, b) { return sum[b] - sum[a]; })
    .map(function (k) { return statName(k) + ' <b class="' + (sum[k] > 0 ? "up" : "down") + '">' + (sum[k] > 0 ? "+" : "") + sum[k] + "</b>"; });
  const champs = Object.keys(champ).sort(function (a, b) { return champ[b] - champ[a]; }).slice(0, 4)
    .map(function (k) { return escapeHTML(k) + ' <b class="up">+' + champ[k] + "</b>"; });
  const names = list.map(function (h) { return h.name; }).join(" → ");
  return '<div class="card tpanel"><h2>📈 최근 ' + list.length + "주 성장</h2>" +
    '<p class="muted small">' + escapeHTML(names) + "</p>" +
    '<p class="small">' + (stats.join(" · ") || '<span class="muted">스탯 변화 없음</span>') + "</p>" +
    (champs.length ? '<p class="small">숙련도: ' + champs.join(" · ") + "</p>" : "") + "</div>";
}

// ----- 훈련 카드 -----
function champChipsHTML(kind) {
  const pos = state.player.position;
  const meta = myPositionChampions().filter(function (n) { return isMeta(n); });
  const top = myPositionChampions().filter(function (n) { return !isMeta(n); })
    .sort(function (a, b) { return state.mastery[b] - state.mastery[a]; }).slice(0, 3);
  const cur = kind === "practice" ? (state.practiceChamp || "") : (focusIsAuto() ? "" : focusChamp());
  const chip = function (name, label) {
    return '<button class="cchip' + (cur === name ? " on" : "") + '" data-' + kind + '="' + escapeHTML(name) + '">' + label + "</button>";
  };
  const champLabel = function (n) { return escapeHTML(n) + metaTagHTML(n, pos) + ' <span class="muted">' + state.mastery[n] + "</span>"; };
  const others = myPositionChampions().filter(function (n) { return meta.indexOf(n) === -1 && top.indexOf(n) === -1; });
  return '<div class="cchips">' + (kind === "practice" ? chip("", "🔄 자동") : chip("", "🔄 자동 <span class=\"muted\">(" + escapeHTML(autoFocusChamp()) + ")</span>")) +
    meta.map(function (n) { return chip(n, champLabel(n)); }).join("") +
    top.map(function (n) { return chip(n, champLabel(n)); }).join("") +
    (others.length ? '<select class="cchip-more" data-' + kind + 'sel="1"><option value="">다른 챔피언…</option>' +
      others.map(function (n) { return '<option value="' + escapeHTML(n) + '"' + (cur === n ? " selected" : "") + ">" + escapeHTML(n) + " (" + state.mastery[n] + ")</option>"; }).join("") + "</select>" : "") +
    "</div>";
}

function trainingCardHTML(t, badges) {
  const selected = state.plan === t.id;
  const exp = trainingExpect(t);
  const gains = Object.keys(exp.stats).filter(function (id) { return exp.stats[id] > 0; }).map(function (id) {
    return '<span class="tgain' + (isBonusStat(id) ? " bonus" : "") + '">' + (isBonusStat(id) ? "★" : "") + statName(id) + " <b>+" + fmt1(exp.stats[id]) + "</b></span>";
  });
  if (exp.masteryTotal > 0) gains.push('<span class="tgain champ">⚔️ 숙련도 <b>+' + fmt1(exp.masteryTotal) + "</b>" + (exp.mastery.length > 1 ? " (" + exp.mastery.length + "명)" : "") + "</span>");
  const statIds = Object.keys(t.effects).filter(function (id) { return state.stats[id] !== undefined; });
  return '<div class="card training tcard' + (selected ? " selected" : "") + '" data-tcard="' + t.id + '" data-stats="' + statIds.join(",") + '">' +
    '<div class="tc-head"><h2>' + t.name + "</h2>" + badgesHTML(badges) + "</div>" +
    '<p class="muted small tc-desc">' + t.desc + "</p>" +
    '<div class="tgains">' + gains.join("") + "</div>" +
    '<p class="muted small">체력 ' + signed1(exp.stamina) + (exp.ladder ? " · 솔로 랭크 " + exp.ladder + "판" : "") + "</p>" +
    (t.effects.mastery ? champChipsHTML("practice") : "") +
    (t.effects.masteryFocus ? champChipsHTML("focus") : "") +
    '<button class="tselect' + (selected ? " primary" : "") + '" data-plan="' + t.id + '">' + (selected ? "✔ 이번 주 훈련 (선택됨)" : "▶ 이 훈련 하기") + "</button>" +
  "</div>";
}

function restRowHTML(t, badges) {
  const selected = state.plan === t.id;
  const exp = trainingExpect(t);
  const statParts = Object.keys(exp.stats).filter(function (id) { return exp.stats[id] > 0; }).map(function (id) { return statName(id) + " +" + fmt1(exp.stats[id]); });
  return '<div class="card training trest' + (selected ? " selected" : "") + '" data-tcard="rest" data-stats="' + Object.keys(exp.stats).join(",") + '">' +
    '<div class="tc-head"><h2>💤 ' + t.name + "</h2>" + badgesHTML(badges) + "</div>" +
    '<span class="small">체력 <b class="up">' + signed1(exp.stamina) + "</b> · 컨디션 <b class=\"up\">+" + fmt1(exp.condition) + "</b>" +
      (conditionCap() < 100 ? ' <span class="muted">(상한 ' + conditionCap() + ")</span>" : "") + (statParts.length ? " · " + statParts.join(" · ") : "") + "</span>" +
    '<span class="muted small">' + t.desc + "</span>" +
    '<button class="tselect' + (selected ? " primary" : "") + '" data-plan="rest">' + (selected ? "✔ 이번 주 휴식 (선택됨)" : "💤 이번 주 쉬기") + "</button></div>";
}

// ----- 한눈에 비교표 -----
function trainCompareHTML() {
  const cols = STATS.map(function (s) { return s.id; });
  const head = "<tr><th>훈련</th>" + cols.map(function (id) {
    return '<th data-col="' + id + '" class="' + (isBonusStat(id) ? "bonus" : "") + '">' + (isBonusStat(id) ? "★" : "") + statName(id) + "</th>";
  }).join("") + "<th>숙련도</th><th>체력</th><th>솔랭</th></tr>";
  const cell = function (v) {
    if (!v || v <= 0.04) return '<td class="tc0"></td>';
    const cls = v >= 1 ? "tc3" : v >= 0.5 ? "tc2" : "tc1";
    return '<td class="' + cls + '">+' + fmt1(v) + "</td>";
  };
  const rows = TRAININGS.map(function (t) {
    const e = trainingExpect(t);
    return '<tr class="trow' + (state.plan === t.id ? " on" : "") + '" data-plan="' + t.id + '" data-tcard="' + t.id + '" data-stats="' + Object.keys(e.stats).join(",") + '" title="눌러서 이번 주 훈련으로 선택">' +
      "<td><b>" + t.name + "</b></td>" + cols.map(function (id) { return cell(e.stats[id]); }).join("") +
      cell(e.masteryTotal) + '<td class="' + (e.stamina < 0 ? "down" : "up") + '">' + signed1(e.stamina) + "</td><td>" + (e.ladder || "-") + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>📋 한눈에 비교 <span class="muted small">이번 주 예상 상승치(평균) · 진할수록 많이 올라요 · 줄을 누르면 선택</span></h2>' +
    '<div class="tcompare-wrap"><table class="tcompare">' + head + rows + "</table></div></div>";
}

pages.training = function () {
  const badges = trainingBadges();
  const cur = findTraining(state.plan);
  const exp = cur ? trainingExpect(cur) : null;
  const tired = state.stamina < TIRED_LIMIT
    ? '<div class="notice">체력이 ' + state.stamina + "밖에 남지 않았어요. 체력이 " + TIRED_LIMIT + " 미만이면 훈련 효과가 절반이 돼요. 휴식을 고려해 보세요.</div>"
    : "";
  // 스탯 훈련은 3칸, 챔피언 훈련(칩이 많아 김)은 2칸으로 따로 줄을 맞춤
  const isChamp = function (t) { return !!(t.effects.mastery || t.effects.masteryFocus); };
  const statCards = TRAININGS.filter(function (t) { return t.id !== "rest" && !isChamp(t); }).map(function (t) { return trainingCardHTML(t, badges[t.id]); }).join("");
  const champCards = TRAININGS.filter(function (t) { return isChamp(t); }).map(function (t) { return trainingCardHTML(t, badges[t.id]); }).join("");
  const rest = findTraining("rest");
  // 고르는 칸(카드)을 맨 위에: 이번 주 예상 한 줄 → 카드 → 휴식 → (아래) 내 스탯·예상·최근 4주·퀘스트 → 비교표
  return (
    "<h1>훈련</h1>" + tired + trainForecastStripHTML(cur, exp) +
    '<div class="tcards tcards-3 tfirst">' + statCards + "</div>" +
    '<div class="tcards tcards-2">' + champCards + "</div>" +
    (rest ? restRowHTML(rest, badges.rest) : "") +
    '<div class="tpanels tbelow">' + trainStatsPanelHTML(exp) + '<div class="tpanel-col">' + trainForecastHTML(cur, exp) + trainHistoryHTML() + "</div></div>" +
    questsHTML(false) +
    trainCompareHTML() +
    '<details class="card tmore"><summary>📉 성장 곡선 · ❓ 각 스탯이 하는 일</summary>' +
      '<p class="muted small">스탯이 높을수록 덜 올라요. ' + GROWTH_CURVE.map(function (g, i) {
        const from = i ? GROWTH_CURVE[i - 1].upTo : 0;
        return from + "~" + Math.min(100, g.upTo - 1) + " " + Math.round(g.mult * 100) + "%";
      }).join(" · ") + ". 괄호 없이 보이는 숫자는 모두 내 보너스까지 넣은 예상치예요.</p>" +
      statGuideHTML(state.player.position) + "</details>"
  );
};

// ----- 버튼 연결 (main.js renderPage에서 부름) -----
function bindTraining(page) {
  if (state.currentMenu !== "training") return;
  const setHL = function (ids) {
    page.querySelectorAll("[data-stat]").forEach(function (el) { el.classList.toggle("hl", ids.indexOf(el.getAttribute("data-stat")) !== -1); });
    page.querySelectorAll("[data-col]").forEach(function (el) { el.classList.toggle("hl", ids.indexOf(el.getAttribute("data-col")) !== -1); });
  };
  page.querySelectorAll("[data-tcard]").forEach(function (el) {
    el.addEventListener("mouseenter", function () { setHL((el.getAttribute("data-stats") || "").split(",")); });
    el.addEventListener("mouseleave", function () { setHL([]); });
  });
  page.querySelectorAll("[data-practice]").forEach(function (b) {
    b.onclick = function () { state.practiceChamp = b.getAttribute("data-practice"); if (state.plan !== "champion") state.plan = "champion"; renderPage(); };
  });
  page.querySelectorAll("[data-focus]").forEach(function (b) {
    b.onclick = function () { state.focusChamp = b.getAttribute("data-focus"); if (state.plan !== "champ_focus") state.plan = "champ_focus"; renderPage(); };
  });
  page.querySelectorAll("[data-practicesel]").forEach(function (s) {
    s.onchange = function () { if (s.value) { state.practiceChamp = s.value; state.plan = "champion"; renderPage(); } };
  });
  page.querySelectorAll("[data-focussel]").forEach(function (s) {
    s.onchange = function () { if (s.value) { state.focusChamp = s.value; state.plan = "champ_focus"; renderPage(); } };
  });
}
