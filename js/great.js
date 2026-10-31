// ===== 훈련 대성공 (182) — 규칙·문구는 data/great.js =====
// state.great = { streak: 연속 횟수, count: 통산, season: 올해 횟수, year }
function greatState() {
  if (!state.great || typeof state.great !== "object") state.great = { streak: 0, count: 0, season: 0, year: state.year };
  if (state.great.year !== state.year) { state.great.year = state.year; state.great.season = 0; }
  return state.great;
}
function greatFire() { return greatState().streak >= 2; } // 불타는 손

// 확률과 이유 (훈련 화면 표시용)
function greatChanceParts() {
  const R = GREAT_RULES, pro = greatProspect(), parts = [[pro ? "기본 (🌱 유망주)" : "기본", pro ? R.prospectBase : R.base]];
  if (state.condition >= R.condMin) parts.push(["컨디션 " + R.condMin + " 이상", R.condBonus]);
  const t = myTeam();
  if (t && t.staff && t.staff.coach) parts.push(["구단 코치 " + gradeName(t.staff.coach.g) + "급", R.coach[t.staff.coach.g] || 0]);
  const gear = state.shop && state.shop.gear ? Object.keys(state.shop.gear).reduce(function (a, k) { return a + (state.shop.gear[k] || 0); }, 0) : 0;
  if (gear) parts.push(["장비 " + gear + "단계", gear * R.gearPer]);
  return parts;
}
function greatChance() {
  const R = GREAT_RULES;
  let p = Math.min(greatMax(), greatChanceParts().reduce(function (a, x) { return a + x[1]; }, 0));
  if (greatFire()) p += R.streakBonus;
  if (state.stamina < TIRED_LIMIT) p *= R.tiredMult;
  return p;
}
// 228: 🌱 유망주 특성이면 기본 7%·최대 15%, 아니면 기본 2%·최대 10%
function greatProspect() { return !!(state.player && state.player.traits && state.player.traits.indexOf(GREAT_RULES.prospectTrait) !== -1); }
function greatMax() { return greatProspect() ? GREAT_RULES.prospectMax : GREAT_RULES.max; }
function greatPct(p) { return (Math.round(p * 1000) / 10) + "%"; }
// 스탯이나 숙련도가 오르는 훈련만 대성공 가능 (휴식 제외)
function greatEligible(training) {
  return training && training.id !== "rest" && Object.keys(training.effects).some(function (id) { return state.stats[id] !== undefined || /^mastery/.test(id); });
}
// 매주 (main.js nextWeek): 훈련 적용 전에 굴림
function rollGreat(training) {
  const G = greatState();
  if (!greatEligible(training)) return false; // 휴식 주는 연속을 끊지 않음
  const hit = Math.random() < greatChance();
  if (hit) { G.streak++; G.count++; G.season++; } else G.streak = 0;
  return hit;
}

// ----- 훈련 화면 -----
function greatChipHTML() {
  const p = greatChance();
  const why = greatChanceParts().map(function (x) { return x[0] + " +" + greatPct(x[1]); }).join(" · ") + " (최대 " + greatPct(greatMax()) + ")" +
    (greatFire() ? " · 🔥 불타는 손 +" + greatPct(GREAT_RULES.streakBonus) : "") + (state.stamina < TIRED_LIMIT ? " · 너무 지쳐서 절반" : "");
  return '<span class="gsc tip" tabindex="0" data-tip="' + escapeHTML("대성공이면 그 주 오른 스탯·숙련도 2배. " + why) + '">🎯 대성공 ' + greatPct(p) +
    ' <span class="gsc-bar"><i style="width:' + Math.round(p / (greatMax() + GREAT_RULES.streakBonus) * 100) + '%"></i></span></span>';
}
function greatLineHTML() {
  const hint = state.condition < GREAT_RULES.condMin ? " · 컨디션을 " + GREAT_RULES.condMin + " 이상으로 올리면 +" + greatPct(GREAT_RULES.condBonus) : "";
  return '<div class="gs-line">' + greatChipHTML() + ' <span class="muted small">이번 주 훈련 대성공 확률' + hint + (greatState().season ? " · 올해 대성공 " + greatState().season + "번" : "") + "</span>" +
    (greatFire() ? " " + fireBadgeHTML() : "") + "</div>";
}

// ----- 상단바: 불타는 손 -----
function fireBadgeHTML() {
  if (!greatFire()) return "";
  const n = greatState().streak;
  return '<span class="fire-badge tip" tabindex="0" data-tip="' + escapeHTML(GREAT_TEXTS.fireTip.replace("{n}", n)) + '">🔥 불타는 손 ×' + n + "</span>";
}

// ----- 대시보드 지난주 결과 -----
function greatReportRowHTML(r) {
  if (!r.great) return "";
  return '<div class="rep-row gs-rep"><span class="rep-tag gs">🔥 ×' + GREAT_RULES.mult + "</span>" + escapeHTML(GREAT_TEXTS.report) +
    (r.great.streak >= 2 ? ' <span class="fire-badge small">🔥 ' + r.great.streak + "주 연속</span>" : "") + "</div>";
}

// ----- 다음 주 진행 직후: 화면 가운데 연출 -----
function showGreat(done) {
  const r = state.weekReport;
  if (!r || !r.great || r.great.seen) { if (done) done(); return; }
  r.great.seen = true;
  const ch = r.training.changes || {};
  const rows = Object.keys(ch).filter(function (k) { return ch[k] > 0 && (state.stats[k] !== undefined || k.indexOf("m:") === 0); }).slice(0, 5).map(function (k) {
    return { name: k.indexOf("m:") === 0 ? "⚔️ " + k.slice(2) : statName(k), to: ch[k], from: Math.max(1, Math.round(ch[k] / GREAT_RULES.mult)) };
  });
  let el = document.getElementById("gs-overlay");
  if (!el) { el = document.createElement("div"); el.id = "gs-overlay"; document.body.appendChild(el); }
  el.innerHTML = '<div class="gs-flash"></div><div class="gs-box"><div class="gs-rays"></div>' +
    '<div class="gs-title">' + GREAT_TEXTS.title + '</div><div class="gs-sub">🏋️ ' + escapeHTML(r.training.name) + " · " + GREAT_TEXTS.sub + "</div>" +
    '<div class="gs-pf"><span class="gs-jumpy">' + portraitImg(USER_ID, { scale: 3, mood: "win" }) + '</span><span class="gs-flex">💪</span></div>' +
    '<div class="gs-rows">' + (rows.length ? rows.map(function (x, i) {
      return '<div class="gs-row" style="animation-delay:' + (0.55 + i * 0.22) + 's">' + escapeHTML(x.name) + " <s>+" + x.from + '</s> <span class="x2">×' + GREAT_RULES.mult + '</span><b class="n">+' + (motionOff() ? x.to : x.from) + "</b></div>";
    }).join("") : '<div class="gs-row" style="animation-delay:.5s">스탯이 상한선이라 더 오르지 않았어요</div>') + "</div>" +
    (r.great.streak >= 2 ? '<div class="gs-streak">' + escapeHTML(GREAT_TEXTS.streak.replace("{n}", r.great.streak)) + "</div>" : "") +
    '<button class="primary gs-ok">' + GREAT_TEXTS.ok + "</button></div>";
  el.hidden = false;
  const close = function () {
    if (el.hidden) return;
    el.hidden = true; el.innerHTML = "";
    document.removeEventListener("keydown", onKey);
    if (done) done();
  };
  const onKey = function (e) { if (e.key === "Escape" || e.key === "Enter") close(); };
  document.addEventListener("keydown", onKey);
  el.onclick = close;
  if (motionOff()) return;
  // 숫자 카운트업 (+2 → +4) + 금가루
  rows.forEach(function (x, i) {
    setTimeout(function () {
      const n = el.querySelectorAll(".gs-row b.n")[i];
      if (!n) return;
      let v = x.from;
      const step = function () {
        if (!n.isConnected || v >= x.to) return;
        v++; n.textContent = "+" + v; n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump");
        setTimeout(step, 150);
      };
      step();
    }, 900 + i * 220);
  });
  setTimeout(function () {
    const box = el.querySelector(".gs-box");
    if (!box) return;
    for (let i = 0; i < 34; i++) {
      const s = document.createElement("i");
      s.className = "gs-spark";
      const a = fxRandom() * Math.PI * 2, d = 90 + fxRandom() * 160;
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d + "px");
      s.style.background = ["#ffd23f", "#fff3c4", "#ff9f1c", "#2bff9e"][i % 4];
      box.appendChild(s);
      setTimeout(function () { s.remove(); }, 1200);
    }
  }, 350);
}
// 대시보드 내 포트레잇: 대성공 주 처음 볼 때 크게 점프 (③)
function greatDashJump(page) {
  const r = state.weekReport;
  if (!r || !r.great || r.great.jumped || motionOff()) return;
  const pf = page.querySelector(".hero-pf");
  if (!pf) return;
  r.great.jumped = true;
  setTimeout(function () { pf.classList.remove("gs-bigjump"); void pf.offsetWidth; pf.classList.add("gs-bigjump"); }, 300);
}
