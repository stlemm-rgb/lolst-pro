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
  const dormRow = "<tr" + (!home ? ' class="me"' : "") + "><td>🛏️ <b>팀 합숙소</b></td><td>모든 훈련 효과 +" + Math.round(dormRate() * 100) + "% · 컨디션 상한 " + HOUSING.dormConditionCap +
    ' <span class="muted small">(경기력 −' + Math.round((1 - TEAM_MATCH.conditionBase - HOUSING.dormConditionCap / TEAM_MATCH.conditionDiv) * 100) + '% · 합숙 ' + dormYears() + '년째, 1년마다 훈련 보너스 −' + Math.round(HOUSING.dormFatiguePerYear * 100) + '%p, 최소 +' + Math.round(HOUSING.dormTrainingMin * 100) + '%)</span></td><td class="r">무료</td><td>' +
    (!home ? '<span class="up small">지금 여기</span>' : '<button class="small-btn" data-home="">합숙으로 돌아가기</button>' + (refund ? ' <span class="muted small">매각 +' + moneyText(refund) + "</span>" : "")) + "</td></tr>";
  const rows = SHOP_HOUSING.map(function (h) {
    const here = home && home.id === h.id;
    const price = h.rent ? "주 " + moneyText(h.rent) : moneyText(h.price);
    const need = h.price ? h.price - refund : h.rent;
    const why = state.money < need ? "자금이 부족해요" : "";
    return "<tr" + (here ? ' class="me"' : "") + "><td>" + h.icon + " <b>" + h.name + '</b><div class="muted small">' + h.desc + "</div></td><td>" + fxText(h) + '</td><td class="r">' + price + "</td><td>" +
      (here ? '<span class="up small">지금 여기</span>' : '<button class="small-btn" data-home="' + h.id + '"' + (why ? " disabled" : "") + ">" + (h.rent ? "월세 계약" : "구매") + "</button>" +
        (why ? ' <span class="muted small">' + why + "</span>" : "")) + "</td></tr>";
  }).join("");
  return '<div class="card"><h2>🏠 거주지 <span class="muted small">집이 없으면 팀 합숙 · 훈련은 잘 되지만 컨디션이 ' + HOUSING.dormConditionCap + "을 못 넘어요</span></h2>" +
    '<table class="roster shop-table">' + dormRow + rows + "</table>" +
    '<p class="muted small">컨디션 100이면 경기력 +10%, 50이면 ±0, 40이면 −2%. 월세는 매주 나가고 모자라면 합숙으로 돌아가요. 아파트는 옮기거나 합숙으로 돌아가면 산 값의 ' + Math.round(HOUSING.resale * 100) + "%를 돌려받아요. 2부 선수들은 모두 합숙이라 조금 더 빨리 크지만 경기력은 조금 떨어져요.</p></div>";
}
