// ===== js/shop.js — 상점·거주지 (R2: 파일 2개를 합침) =====

// ━━━━━ (예전 js/shop.js) ━━━━━
// ===== 상점: 장비 · 개인 고용 · 투자 · 팬/명성 (규칙과 값은 data/shop.js) =====
// state.shop = {
//   gear: { keyboard: 2, ... }        장비 단계 (0 = 없음)
//   staff: { analyst: true, ... }     고용 중인 사람
//   invest: [{ id, amount, at(결과 나오는 절대 주) }]  진행 중인 투자
//   investProfit: 투자로 번(잃은) 돈 합계
//   fame: { gift: 절대 주, fanmeet: { year, count }, stream: true }
// }

function shopState() {
  if (!state.shop) state.shop = { gear: {}, staff: {}, fame: {} };
  const s = state.shop;
  s.gear = s.gear || {}; s.staff = s.staff || {}; s.fame = s.fame || {};
  s.invest = s.invest || []; s.investProfit = s.investProfit || 0;
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
  housingEffects().forEach(function (e) { list.push(e); }); // 거주지 (js/shop.js)
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

function fameAvailable(f) {
  const s = shopState();
  const v = s.fame[f.id];
  if (f.once && v) return "이미 샀어요";
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

// ----- 투자 (data/shop.js SHOP_INVEST) -----
function invest(id, pct) {
  const inv = SHOP_INVEST.find(function (x) { return x.id === id; });
  const amount = Math.floor(state.money * pct / 10000) * 10000; // 만 원 단위
  if (!inv || amount < 10000) return;
  state.money -= amount;
  shopState().invest.push({ id: id, amount: amount, at: absWeek() + inv.weeks });
  shopNotice(inv.icon + " " + inv.name + "에 " + moneyText(amount) + " 투자! " + inv.weeks + "주 뒤에 결과가 나와요.");
}

// 수익률 뽑기: range 하나 또는 outcomes 중 하나를 고른 뒤 그 범위에서 무작위
function investReturn(inv) {
  let range = inv.range;
  if (inv.outcomes) {
    let r = Math.random();
    range = inv.outcomes[inv.outcomes.length - 1].range;
    for (let i = 0; i < inv.outcomes.length; i++) {
      if (r < inv.outcomes[i].chance) { range = inv.outcomes[i].range; break; }
      r -= inv.outcomes[i].chance;
    }
  }
  return randFloat(range[0], range[1]);
}

// 매주 (main.js nextWeek에서): 기한이 된 투자 결과
function settleInvestments() {
  const s = shopState();
  const now = absWeek();
  const lines = [];
  s.invest = s.invest.filter(function (x) {
    if (x.at > now) return true;
    const inv = SHOP_INVEST.find(function (i) { return i.id === x.id; });
    const r = inv ? investReturn(inv) : 0;
    const back = Math.max(0, Math.round(x.amount * (1 + r) / 10000) * 10000);
    const profit = back - x.amount;
    state.money += back;
    s.investProfit += profit;
    const line = (inv ? inv.icon + " " + inv.name : "투자") + " " + moneyText(x.amount) + " → " + moneyText(back) +
      " (" + (profit >= 0 ? "+" : "−") + moneyText(Math.abs(profit)) + ", " + (r >= 0 ? "+" : "−") + Math.abs(Math.round(r * 100)) + "%)";
    lines.push({ text: line, up: profit >= 0 });
    addNews(profit >= 0 ? "📈 투자 수익" : "📉 투자 손실", line);
    return false;
  });
  if (lines.length && state.weekReport) state.weekReport.investLines = lines;
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
    if (lv >= g.levels.length) action = '<span class="chip gold">최고 단계</span>';
    else {
      const next = g.levels[lv];
      action = btn(' data-buygear="' + g.id + '"', "Lv" + (lv + 1) + " 구매 " + moneyText(next.price), state.money < next.price ? "자금이 부족해요" : "") +
        '<div class="muted small">→ ' + shopEffectText(next.effects) + "</div>";
    }
    return "<tr><td>" + g.icon + " <b>" + g.name + '</b><div class="muted small">' + g.what + "</div></td>" +
      '<td class="c"><span class="pips tip" tabindex="0" data-tip="' + (lv > 0 ? "Lv" + lv : "아직 없음") + " / 최고 Lv" + g.levels.length + '">' + g.levels.map(function (x, i) { return "<i" + (i < lv ? ' class="on"' : "") + "></i>"; }).join("") + "</span></td><td>" + now + "</td><td>" + action + "</td></tr>";
  }).join("");

  const staffRows = SHOP_STAFF.map(function (st) {
    const on = !!s.staff[st.id];
    return "<tr" + (on ? ' class="me"' : "") + "><td>" + st.icon + " <b>" + st.name + "</b></td><td>" + st.desc + '</td><td class="r">주 ' + moneyText(st.weekly) + "</td><td>" +
      (on ? btn(' data-staff="' + st.id + '"', "해지") + ' <span class="up small">고용 중</span>'
          : btn(' data-staff="' + st.id + '"', "고용", state.money < st.weekly ? "자금이 부족해요" : "")) + "</td></tr>";
  }).join("");

  const fameRows = SHOP_FAME.map(function (f) {
    const limit = f.once ? "한 번 (영구)" : f.perSeason ? "시즌 " + f.perSeason + "번" : "제한 없음";
    return "<tr><td>" + f.icon + " <b>" + f.name + "</b></td><td>" + f.desc + ' <span class="muted small">· ' + limit + '</span></td><td class="r">' + moneyText(f.price) + "</td><td>" +
      btn(' data-fame="' + f.id + '"', f.once ? "사기" : "하기", fameAvailable(f)) + "</td></tr>";
  }).join("");

  return (
    "<h1>상점</h1>" +
    '<div class="card"><div class="shop-money">💰 자금 <b>' + moneyText(state.money) + "</b>" +
      ' <span class="muted small">· 매주 연봉 +' + moneyText(weeklyIn) + (weeklyOut ? " · 개인 고용 −" + moneyText(weeklyOut) : "") + (currentHome() && currentHome().rent ? " · 월세 −" + moneyText(currentHome().rent) : "") + "</span></div></div>" +
    activitiesCardHTML() +
    housingCardHTML() +
    '<div class="card"><h2>🛒 장비 <span class="muted small">한 번 사면 계속 · 단계가 오를수록 효과가 커져요</span></h2>' +
      '<table class="roster shop-table"><tr><th>장비</th><th class="c">단계</th><th>지금 효과</th><th>다음 단계</th></tr>' + gearRows + "</table></div>" +
    '<div class="card"><h2>🧑‍🏫 개인 고용 <span class="muted small">매주 비용이 나가는 동안만 효과 · 자금이 모자라면 자동 해지</span></h2>' +
      '<table class="roster shop-table">' + staffRows + "</table></div>" +
    investCardHTML() +
    staffShopCardHTML() + // 🎫 스태프 스카우트 티켓 (js/staff.js)
    '<div class="card"><h2>🌟 팬·명성</h2>' +
      '<table class="roster shop-table">' + fameRows + "</table></div>"
  );
};

// 투자 칸
function investCardHTML() {
  const s = shopState();
  const now = absWeek();
  const rows = SHOP_INVEST.map(function (inv) {
    const btns = INVEST_AMOUNTS.map(function (p) {
      const amt = Math.floor(state.money * p / 10000) * 10000;
      return '<button class="small-btn" data-invest="' + inv.id + ":" + p + '"' + (amt < 10000 ? " disabled" : "") + ' title="' + moneyText(amt) + '">' +
        (p === 1 ? "전부" : Math.round(p * 100) + "%") + "</button>";
    }).join("");
    return "<tr><td>" + inv.icon + " <b>" + inv.name + "</b></td><td>" + inv.desc + "</td><td>" + btns + "</td></tr>";
  }).join("");
  const holding = s.invest.map(function (x) {
    const inv = SHOP_INVEST.find(function (i) { return i.id === x.id; });
    return "<li>" + (inv ? inv.icon + " " + inv.name : "투자") + " " + moneyText(x.amount) + ' <span class="muted small">· ' + Math.max(0, x.at - now) + "주 뒤 결과</span></li>";
  }).join("");
  const profit = s.investProfit;
  return '<div class="card"><h2>💹 투자 <span class="muted small">넣은 돈이 정해진 주 뒤에 무작위로 불어나거나 줄어요 · 완전 운</span></h2>' +
    '<table class="roster shop-table">' + rows + "</table>" +
    '<p class="muted small">버튼 = 지금 자금의 몇 %를 넣을지 (마우스를 올리면 금액이 보여요). 평균은 본전 근처라서 오래 하면 운에 따라 갈려요.</p>' +
    '<p class="small">진행 중: ' + (holding ? "</p><ul class=\"invest-list\">" + holding + "</ul>" : '<span class="muted">없음</span></p>') +
    '<p class="small">지금까지 투자 손익: <b class="' + (profit >= 0 ? "up" : "down") + '">' + (profit >= 0 ? "+" : "−") + moneyText(Math.abs(profit)) + "</b></p></div>";
}

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
  page.querySelectorAll("[data-home]").forEach(function (b) { b.onclick = function () { moveHome(b.getAttribute("data-home") || null); }; });
  page.querySelectorAll("[data-buygear]").forEach(function (b) { b.onclick = function () { buyGear(b.getAttribute("data-buygear")); }; });
  page.querySelectorAll("[data-staff]").forEach(function (b) { b.onclick = function () { toggleStaff(b.getAttribute("data-staff")); }; });
  page.querySelectorAll("[data-fame]").forEach(function (b) { b.onclick = function () { buyFame(b.getAttribute("data-fame")); }; });
  page.querySelectorAll("[data-staffticket]").forEach(function (b) { b.onclick = function () { buyStaffTicket(); }; });
  page.querySelectorAll("[data-invest]").forEach(function (b) {
    b.onclick = function () { const v = b.getAttribute("data-invest").split(":"); invest(v[0], Number(v[1])); };
  });
  page.querySelectorAll("[data-stopact]").forEach(function (b) {
    b.onclick = function () { stopActivity(b.getAttribute("data-stopact")); shopNotice("그만뒀어요."); };
  });
}

// ━━━━━ (예전 js/housing.js) ━━━━━
// ===== 거주지 (부동산) · 합숙 — 규칙과 값은 data/shop.js HOUSING, SHOP_HOUSING =====
// state.housing = null(합숙) 또는 { id, paid(산 값, 매매일 때), since(절대 주) }

function currentHome() {
  const h = state.housing;
  return h ? SHOP_HOUSING.find(function (x) { return x.id === h.id; }) || null : null;
}

// 집이 없으면 합숙
function inDorm() {
  return !currentHome();
}

// 합숙한 햇수 (state.dormWeeks: 합숙한 주 수, 집에 살다 돌아와도 그대로)
function dormYears() {
  return Math.floor((state.dormWeeks || 0) / CREATION.weeksPerSeason);
}

// 지금 합숙 훈련 보너스 비율 (합숙 피로: 1년마다 줄어듦)
function dormRate() {
  return Math.max(HOUSING.dormTrainingMin, HOUSING.dormTraining - HOUSING.dormFatiguePerYear * dormYears());
}

// 합숙 훈련 보너스 (모든 훈련: 스탯·챔피언 숙련도)
function dormTrainingBonus() {
  return inDorm() ? dormRate() : 0;
}

// 지금 컨디션 상한
function conditionCap() {
  const home = currentHome();
  return home ? home.conditionCap : HOUSING.dormConditionCap;
}

// 집 효과 (js/shop.js shopEffectList에 더해짐)
function housingEffects() {
  const home = currentHome();
  return home ? [home.effects] : [];
}

// 매주: 월세 내기 (main.js nextWeek, 연봉 다음). 모자라면 합숙으로
function payHousing() {
  const home = currentHome();
  if (!home || !home.rent) return 0;
  if (state.money < home.rent) {
    state.housing = null;
    addNews("🏠 합숙 복귀", "월세를 낼 돈이 모자라 " + home.name + "에서 나와 다시 팀 합숙소로 들어갔다.");
    return 0;
  }
  state.money -= home.rent;
  if (state.weekReport) state.weekReport.rent = home.rent;
  return home.rent;
}

// 매주: 집 효과로 컨디션 회복 + 컨디션 상한 적용 (main.js nextWeek 끝)
function applyHousingWeek() {
  if (inDorm()) {
    state.dormWeeks = (state.dormWeeks || 0) + 1;
    if (state.dormWeeks % CREATION.weeksPerSeason === 0 && dormRate() < HOUSING.dormTraining) {
      addNews("🛏️ 합숙 피로", "팀 합숙 " + dormYears() + "년째. 익숙해진 만큼 합숙 훈련 효과가 +" + Math.round(dormRate() * 100) + "%로 줄었다." + (dormRate() <= HOUSING.dormTrainingMin ? " (최소)" : " 슬슬 독립을 생각해 볼 때다."));
    }
  }
  const regen = traitEffectSum("conditionRegen");
  if (regen) state.condition = clamp(state.condition + regen);
  enforceConditionCap();
}

function enforceConditionCap() {
  state.condition = Math.min(state.condition, conditionCap());
}

// 지금 집을 정리할 때 돌려받는 돈 (매매만)
function homeRefund() {
  const home = currentHome();
  return home && home.price ? Math.round((state.housing.paid || home.price) * HOUSING.resale) : 0;
}

// 이사: id = 새 집 (null이면 합숙으로)
function moveHome(id) {
  const next = id ? SHOP_HOUSING.find(function (x) { return x.id === id; }) : null;
  const old = currentHome();
  if (old && next && old.id === next.id) return;
  const refund = homeRefund();
  const cost = next && next.price ? next.price : next ? next.rent : 0; // 월세는 첫 주 월세가 있어야 이사
  if (state.money + refund < cost) { shopNotice("자금이 부족해요."); return; }
  state.money += refund;
  if (next && next.price) state.money -= next.price;
  state.housing = next ? { id: next.id, paid: next.price || 0, since: absWeek() } : null;
  enforceConditionCap();
  const soldText = refund ? " (" + old.name + " 매각 +" + moneyText(refund) + ")" : "";
  if (next) {
    addMoment("🏠", next.name + " 입주");
    shopNotice(next.icon + " " + next.name + "(으)로 이사했어요." + soldText + " 이제 합숙이 아니라 훈련 보너스는 없고, 컨디션 상한은 " + next.conditionCap + "이에요.");
  } else {
    shopNotice("팀 합숙소로 들어갔어요." + soldText + " 훈련 효과 +" + Math.round(dormRate() * 100) + "%, 컨디션 상한 " + HOUSING.dormConditionCap + ".");
  }
}

// 상점 화면: 거주지 칸
function housingCardHTML() {
  const home = currentHome();
  const refund = homeRefund();
  const fxText = function (h) {
    const e = h.effects, parts = ["컨디션 상한 " + h.conditionCap];
    if (e.staminaRegen) parts.push("매주 체력 +" + e.staminaRegen);
    if (e.conditionRegen) parts.push("매주 컨디션 +" + e.conditionRegen);
    if (e.popularityGain) parts.push("인기도 상승 +" + Math.round(e.popularityGain * 100) + "%");
    return parts.join(" · ");
  };
  // 디자인 D5: 2줄 작은 카드 (지금 사는 곳 초록, 못 사는 곳 흐리게)
  const card = function (cls, icon, name, eff, price, action, tip) {
    return '<div class="home ' + cls + (tip ? ' tip" tabindex="0" data-tip="' + escapeHTML(tip) : "") + '"><span class="home-em">' + icon + '</span><div class="home-t"><b>' + name + '</b><div class="home-eff">' + eff + "</div></div>" +
      '<div class="home-pr"><div class="home-price">' + price + "</div>" + action + "</div></div>";
  };
  const dormTip = "경기력 −" + Math.round((1 - TEAM_MATCH.conditionBase - HOUSING.dormConditionCap / TEAM_MATCH.conditionDiv) * 100) + "% · 합숙 " + dormYears() + "년째, 1년마다 훈련 보너스 −" + Math.round(HOUSING.dormFatiguePerYear * 100) + "%p, 최소 +" + Math.round(HOUSING.dormTrainingMin * 100) + "%";
  const dormRow = card(!home ? "cur" : "", "🛏️", "팀 합숙소", '훈련 효과 <span class="up">+' + Math.round(dormRate() * 100) + "%</span> · 컨디션 상한 " + HOUSING.dormConditionCap, "무료",
    !home ? '<span class="chip good">지금 여기</span>' : '<button class="small-btn" data-home="">들어가기</button>' + (refund ? '<span class="muted small">매각 +' + moneyText(refund) + "</span>" : ""), dormTip);
  const rows = SHOP_HOUSING.map(function (h) {
    const here = home && home.id === h.id;
    const price = h.rent ? "주 " + moneyText(h.rent) : moneyText(h.price);
    const need = h.price ? h.price - refund : h.rent;
    const why = state.money < need;
    return card(here ? "cur" : why ? "lock" : "", h.icon, h.name, fxText(h), price,
      here ? '<span class="chip good">지금 여기</span>' : '<button class="small-btn' + (why ? "" : " primary") + '" data-home="' + h.id + '"' + (why ? " disabled" : "") + ">" + (why ? "🔒 자금 부족" : h.rent ? "월세 계약" : "구매") + "</button>", h.desc);
  }).join("");
  return '<div class="card"><h2>🏠 거주지 <span class="muted small">집이 없으면 팀 합숙 · 훈련은 잘 되지만 컨디션이 ' + HOUSING.dormConditionCap + "을 못 넘어요</span></h2>" +
    '<div class="homes">' + dormRow + rows + "</div>" +
    '<p class="muted small">컨디션 100이면 경기력 +10%, 50이면 ±0, 40이면 −2%. 월세는 매주 나가고 모자라면 합숙으로 돌아가요. 아파트는 옮기거나 합숙으로 돌아가면 산 값의 ' + Math.round(HOUSING.resale * 100) + "%를 돌려받아요. 2부 선수들은 모두 합숙이라 조금 더 빨리 크지만 경기력은 조금 떨어져요.</p></div>";
}
