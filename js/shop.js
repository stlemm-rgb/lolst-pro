// ===== 상점: 장비 · 개인 고용 · 회복 · 팬/명성 (규칙과 값은 data/shop.js) =====
// state.shop = {
//   gear: { keyboard: 2, ... }        장비 단계 (0 = 없음)
//   staff: { analyst: true, ... }     고용 중인 사람
//   careWeek: 절대 주                  회복·힐링을 마지막으로 쓴 주 (한 주에 하나)
//   fame: { gift: 절대 주, fanmeet: { year, count }, stream: true }
// }

function shopState() {
  if (!state.shop) state.shop = { gear: {}, staff: {}, careWeek: -1, fame: {} };
  const s = state.shop;
  s.gear = s.gear || {}; s.staff = s.staff || {}; s.fame = s.fame || {};
  return s;
}

// ----- 효과: 지금 가진 장비 + 고용 중인 사람의 효과 목록 -----
function shopEffectList() {
  if (!state || !state.shop) return [];
  const s = state.shop, list = [];
  SHOP_GEAR.forEach(function (g) {
    const lv = (s.gear || {})[g.id] || 0;
    if (lv > 0) list.push(g.levels[lv - 1].effects);
  });
  SHOP_STAFF.forEach(function (st) { if ((s.staff || {})[st.id]) list.push(st.effects); });
  SHOP_FAME.forEach(function (f) { if (f.once && (s.fame || {})[f.id]) list.push(f.effects); });
  return list;
}

// 숫자 효과 합 (예: staminaCost) — js/player.js의 traitEffectSum이 같이 더해요
function shopEffectSum(key) {
  let sum = 0;
  shopEffectList().forEach(function (e) { if (typeof e[key] === "number") sum += e[key]; });
  return sum;
}

// { 키: 값 } 효과의 한 키 합 (예: trainingStat의 accuracy)
function shopEffectKey(effect, key) {
  let sum = 0;
  shopEffectList().forEach(function (e) { if (e[effect] && typeof e[effect][key] === "number") sum += e[effect][key]; });
  return sum;
}

// ----- 매주: 개인 고용 비용 (main.js nextWeek에서 연봉 다음에 부름) -----
// 돈이 모자라면 비싼 사람부터 해지. 돌려주는 값: 이번 주에 낸 돈
function payStaff() {
  const s = shopState();
  let hired = SHOP_STAFF.filter(function (st) { return s.staff[st.id]; });
  const total = function () { return hired.reduce(function (a, st) { return a + st.weekly; }, 0); };
  const fired = [];
  hired.sort(function (a, b) { return b.weekly - a.weekly; });
  while (hired.length && state.money < total()) {
    const st = hired.shift();
    s.staff[st.id] = false;
    fired.push(st.name);
  }
  if (fired.length) addNews("💸 고용 해지", "자금이 모자라서 " + fired.join(", ") + "와(과)의 계약이 끝났다.");
  const fee = total();
  state.money -= fee;
  if (state.weekReport) state.weekReport.shopFee = fee;
  return fee;
}

// ----- 사기 -----
function shopNotice(text) { state.notice = text; renderAll(); if (state.settings.autoSave) saveGame(); }

function buyGear(id) {
  const g = SHOP_GEAR.find(function (x) { return x.id === id; });
  const s = shopState();
  const lv = s.gear[id] || 0;
  if (!g || lv >= g.levels.length) return;
  const price = g.levels[lv].price;
  if (state.money < price) return;
  state.money -= price;
  s.gear[id] = lv + 1;
  shopNotice(g.icon + " " + g.name + " Lv" + (lv + 1) + " 구매! (" + moneyText(price) + ")");
}

function toggleStaff(id) {
  const st = SHOP_STAFF.find(function (x) { return x.id === id; });
  const s = shopState();
  if (!st) return;
  if (s.staff[id]) { s.staff[id] = false; shopNotice(st.icon + " " + st.name + " 계약을 끝냈어요."); return; }
  if (state.money < st.weekly) return;
  s.staff[id] = true;
  shopNotice(st.icon + " " + st.name + "을(를) 고용했어요. 다음 주부터 매주 " + moneyText(st.weekly) + "씩 나가요.");
}

// 비시즌인가? (우리 팀 경기가 모두 끝난 뒤)
function isOffseasonNow() {
  return state.career && state.career.seasonOverYear === state.year;
}

function careAvailable(c) {
  const s = shopState();
  if (s.careWeek === absWeek()) return "이번 주에 이미 썼어요";
  if (c.offseason && !isOffseasonNow()) return "비시즌에만 갈 수 있어요";
  if (state.money < c.price) return "자금이 부족해요";
  return "";
}

function buyCare(id) {
  const c = SHOP_CARE.find(function (x) { return x.id === id; });
  if (!c || careAvailable(c)) return;
  state.money -= c.price;
  shopState().careWeek = absWeek();
  const r = applyEffects(c.effects, {});
  shopNotice(c.icon + " " + c.name + " (" + moneyText(c.price) + ") → " + (changesText(r.changes) || "변화 없음"));
}

function fameAvailable(f) {
  const s = shopState();
  const v = s.fame[f.id];
  if (f.once && v) return "이미 샀어요";
  if (f.perWeek && v === absWeek()) return "이번 주에 이미 했어요";
  if (f.perSeason && v && v.year === state.year && v.count >= f.perSeason) return "이번 시즌은 다 했어요 (" + f.perSeason + "번)";
  if (state.money < f.price) return "자금이 부족해요";
  return "";
}

function buyFame(id) {
  const f = SHOP_FAME.find(function (x) { return x.id === id; });
  if (!f || fameAvailable(f)) return;
  const s = shopState();
  state.money -= f.price;
  if (f.once) s.fame[f.id] = true;
  else if (f.perWeek) s.fame[f.id] = absWeek();
  else if (f.perSeason) {
    const v = s.fame[f.id];
    s.fame[f.id] = { year: state.year, count: v && v.year === state.year ? v.count + 1 : 1 };
  }
  let msg = f.icon + " " + f.name + " (" + moneyText(f.price) + ")";
  if (!f.once) {
    const r = applyEffects(f.effects, {});
    msg += " → " + (changesText(r.changes) || "변화 없음");
  } else msg += " → " + f.desc;
  shopNotice(msg);
}

// ----- 화면 -----
// 효과를 글로: { trainingStat: { accuracy: 0.1 } } → "입력 정확도 훈련 +10%"
function shopEffectText(e) {
  const parts = [];
  Object.keys(e).forEach(function (k) {
    const v = e[k];
    if (k === "trainingStat") {
      const ids = Object.keys(v);
      parts.push(ids.map(statName).join("·") + " 훈련 +" + Math.round(v[ids[0]] * 100) + "%");
    } else if (k === "staminaCost") parts.push("체력 소모 " + Math.round(v * 100) + "%");
  });
  return parts.join(", ");
}

pages.shop = function () {
  const s = shopState();
  const weeklyIn = state.contract ? Math.round(state.contract.salary / CREATION.weeksPerSeason) : 0;
  const weeklyOut = SHOP_STAFF.reduce(function (a, st) { return a + (s.staff[st.id] ? st.weekly : 0); }, 0);
  const btn = function (attr, label, disabledWhy) {
    return '<button class="small-btn"' + attr + (disabledWhy ? ' disabled title="' + escapeHTML(disabledWhy) + '"' : "") + ">" + label + "</button>" +
      (disabledWhy ? ' <span class="muted small">' + escapeHTML(disabledWhy) + "</span>" : "");
  };

  const gearRows = SHOP_GEAR.map(function (g) {
    const lv = s.gear[g.id] || 0;
    const now = lv > 0 ? shopEffectText(g.levels[lv - 1].effects) : '<span class="muted">없음</span>';
    let action;
    if (lv >= g.levels.length) action = '<span class="up small">최고 단계</span>';
    else {
      const next = g.levels[lv];
      action = btn(' data-buygear="' + g.id + '"', "Lv" + (lv + 1) + " 구매 " + moneyText(next.price), state.money < next.price ? "자금이 부족해요" : "") +
        '<div class="muted small">→ ' + shopEffectText(next.effects) + "</div>";
    }
    return "<tr><td>" + g.icon + " <b>" + g.name + '</b><div class="muted small">' + g.what + "</div></td>" +
      '<td class="c">' + (lv > 0 ? "Lv" + lv : "-") + "</td><td>" + now + "</td><td>" + action + "</td></tr>";
  }).join("");

  const staffRows = SHOP_STAFF.map(function (st) {
    const on = !!s.staff[st.id];
    return "<tr" + (on ? ' class="me"' : "") + "><td>" + st.icon + " <b>" + st.name + "</b></td><td>" + st.desc + '</td><td class="r">주 ' + moneyText(st.weekly) + "</td><td>" +
      (on ? btn(' data-staff="' + st.id + '"', "해지") + ' <span class="up small">고용 중</span>'
          : btn(' data-staff="' + st.id + '"', "고용", state.money < st.weekly ? "자금이 부족해요" : "")) + "</td></tr>";
  }).join("");

  const careRows = SHOP_CARE.map(function (c) {
    return "<tr><td>" + c.icon + " <b>" + c.name + "</b></td><td>" + c.desc + '</td><td class="r">' + moneyText(c.price) + "</td><td>" +
      btn(' data-care="' + c.id + '"', "하기", careAvailable(c)) + "</td></tr>";
  }).join("");

  const fameRows = SHOP_FAME.map(function (f) {
    const limit = f.once ? "한 번 (영구)" : f.perWeek ? "주 1번" : "시즌 " + f.perSeason + "번";
    return "<tr><td>" + f.icon + " <b>" + f.name + "</b></td><td>" + f.desc + ' <span class="muted small">· ' + limit + '</span></td><td class="r">' + moneyText(f.price) + "</td><td>" +
      btn(' data-fame="' + f.id + '"', f.once ? "사기" : "하기", fameAvailable(f)) + "</td></tr>";
  }).join("");

  return (
    "<h1>상점</h1>" +
    '<div class="card"><div class="shop-money">💰 자금 <b>' + moneyText(state.money) + "</b>" +
      ' <span class="muted small">· 매주 연봉 +' + moneyText(weeklyIn) + (weeklyOut ? " · 개인 고용 −" + moneyText(weeklyOut) : "") + "</span></div></div>" +
    activitiesCardHTML() +
    '<div class="card"><h2>🛒 장비 <span class="muted small">한 번 사면 계속 · 단계가 오를수록 효과가 커져요</span></h2>' +
      '<table class="roster shop-table"><tr><th>장비</th><th class="c">단계</th><th>지금 효과</th><th>다음 단계</th></tr>' + gearRows + "</table></div>" +
    '<div class="card"><h2>🧑‍🏫 개인 고용 <span class="muted small">매주 비용이 나가는 동안만 효과 · 자금이 모자라면 자동 해지</span></h2>' +
      '<table class="roster shop-table">' + staffRows + "</table></div>" +
    '<div class="card"><h2>💆 회복·힐링 <span class="muted small">바로 효과 · 한 주에 하나만</span></h2>' +
      '<table class="roster shop-table">' + careRows + "</table></div>" +
    '<div class="card"><h2>🌟 팬·명성</h2>' +
      '<table class="roster shop-table">' + fameRows + "</table></div>"
  );
};

// 진행 중인 계약·활동 (SNS 받은 연락에서 시작한 것)
function activitiesCardHTML() {
  const list = state.activities || [];
  const rows = list.map(function (a) {
    const def = ACTIVITIES[a.id];
    if (!def) return "";
    return "<tr><td>" + def.icon + " <b>" + def.name + "</b>" + (a.ctx && a.ctx.player ? ' <span class="muted small">vs ' + escapeHTML(a.ctx.player) + "</span>" : "") +
      "</td><td>" + escapeHTML(fillText(def.desc, a.ctx || {})) + '</td><td class="muted small">' + a.year + "년부터</td><td>" +
      (def.stoppable ? '<button class="small-btn" data-stopact="' + a.id + '">그만두기</button>' : '<span class="muted small">' + (def.untilSeasonEnd ? "시즌 끝까지" : "") + "</span>") + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>📋 진행 중인 계약·활동 <span class="muted small">SNS 받은 연락에서 시작한 스폰서·개인 방송·라이벌</span></h2>' +
    (rows ? '<table class="roster shop-table">' + rows + "</table>" : '<p class="muted small">지금은 없어요. SNS 받은 연락으로 제안이 오면 시작할 수 있어요.</p>') + "</div>";
}

// 버튼 연결 (main.js renderPage에서 부름)
function bindShop(page) {
  page.querySelectorAll("[data-buygear]").forEach(function (b) { b.onclick = function () { buyGear(b.getAttribute("data-buygear")); }; });
  page.querySelectorAll("[data-staff]").forEach(function (b) { b.onclick = function () { toggleStaff(b.getAttribute("data-staff")); }; });
  page.querySelectorAll("[data-care]").forEach(function (b) { b.onclick = function () { buyCare(b.getAttribute("data-care")); }; });
  page.querySelectorAll("[data-fame]").forEach(function (b) { b.onclick = function () { buyFame(b.getAttribute("data-fame")); }; });
  page.querySelectorAll("[data-stopact]").forEach(function (b) {
    b.onclick = function () { stopActivity(b.getAttribute("data-stopact")); shopNotice("그만뒀어요."); };
  });
}
