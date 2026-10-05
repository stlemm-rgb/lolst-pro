// ===== 이벤트 처리: 조건 감지 → SNS 메시지 → 선택 → 효과 =====
// 메시지 하나의 모양 (state.inbox 안에 저장)
//   { id, tab("inbox"/"news"/"social"), year, week, title, text, eventId, ctx,
//     choices: [{ label, hint }] (받은 연락만), read, answered(null/번호/"ignored"),
//     changes: {변화}, notes: [문장] }

function absWeek(year, week) {
  return (year || state.year) * CREATION.weeksPerSeason + (week || state.week);
}

function findEvent(id) {
  return EVENTS.find(function (e) { return e.id === id; });
}

function hasTrait(id) {
  return state.player.traits.indexOf(id) !== -1;
}

// ----- 이번 주에 일어난 일 (이벤트 조건 판단용, 저장 안 함) -----
function resetWeekCtx() {
  state.weekCtx = { wins: 0, losses: 0, solos: 0, opp: null, champion: null, wonSemi: false, newChamps: [], patch: false, nerfChamp: null };
}

// 최근 연패 수
function loseStreak() {
  const mine = myTeam();
  const done = userMatches().filter(function (m) { return m.winner; });
  let n = 0;
  for (let i = done.length - 1; i >= 0; i--) {
    if (done[i].winner === mine.id) break;
    n++;
  }
  return n;
}

// ----- 글자 채우기 -----
function fillText(text, ctx) {
  const c = ctx || {};
  return String(text)
    .replace(/\{name\}/g, state.player.name)
    .replace(/\{team\}/g, myTeam().name)
    .replace(/\{pos\}/g, findPosition(state.player.position).name)
    .replace(/\{champ\}/g, c.champ || "")
    .replace(/\{opp\}/g, c.opp || "상대 팀");
}

// ----- 메시지 넣기 -----
function postMessage(tab, title, text, extra) {
  state.msgSeq = (state.msgSeq || 0) + 1;
  const msg = {
    id: state.msgSeq, tab: tab, year: state.year, week: state.week,
    title: title, text: text, read: false, answered: null, changes: {}, notes: [],
  };
  Object.keys(extra || {}).forEach(function (k) { msg[k] = extra[k]; });
  state.inbox.unshift(msg);
  state.inbox = state.inbox.slice(0, EVENT_RULES.keepMessages);
  return msg;
}

// ----- 효과 적용 -----
// 돌려주는 것: { changes: {스탯 변화}, notes: [문장] }
function applyEffects(eff, ctx) {
  const changes = {}, notes = [];
  const add = function (id, n) { if (n) changes[id] = (changes[id] || 0) + n; };
  Object.keys(eff || {}).forEach(function (key) {
    const v = eff[key];
    let before;
    if (state.stats[key] !== undefined) {
      before = state.stats[key];
      state.stats[key] = clamp(state.stats[key] + v);
      add(key, state.stats[key] - before);
    } else if (key === "stamina") {
      before = state.stamina;
      state.stamina = Math.max(0, Math.min(state.staminaMax, state.stamina + v));
      add(key, state.stamina - before);
    } else if (key === "condition") {
      before = state.condition;
      state.condition = clamp(state.condition + v);
      add(key, state.condition - before);
    } else if (key === "popularity") {
      before = state.popularity;
      state.popularity = clamp(state.popularity + (v > 0 ? roundRandom(v * popularityMultiplier()) : v));
      add(key, state.popularity - before);
    } else if (key === "reputation") {
      before = state.reputation;
      state.reputation = Math.max(-100, Math.min(100, state.reputation + v));
      add(key, state.reputation - before);
    } else if (key === "money") {
      state.money += v;
      notes.push("자금 " + (v > 0 ? "+" : "−") + Math.abs(v / 10000).toLocaleString() + "만 원");
    } else if (key === "masteryMetaAll" || key === "masteryMetaOne" || key === "masteryChamp") {
      let targets = [];
      if (key === "masteryChamp") targets = ctx && ctx.champ ? [ctx.champ] : [];
      else {
        targets = state.meta.champs[state.player.position].filter(function (n) { return state.mastery[n] !== undefined; });
        if (key === "masteryMetaOne") {
          targets.sort(function (a, b) { return state.mastery[a] - state.mastery[b]; });
          targets = targets.slice(0, 1);
        }
      }
      targets.forEach(function (name) {
        if (state.mastery[name] === undefined) return;
        before = state.mastery[name];
        state.mastery[name] = Math.max(MASTERY.min, Math.min(MASTERY.max, state.mastery[name] + v));
        add("m:" + name, state.mastery[name] - before);
      });
    } else if (key === "skipTraining") {
      state.skipTraining = true;
      notes.push("다음 주는 훈련 대신 쉰다");
    } else if (key === "transferListed") {
      state.transferListed = true;
      notes.push("비시즌에 이적 제안이 늘어난다");
    } else if (key === "matchBoost") {
      state.matchBoost = v;
      notes.push("다음 경기 경기력 +" + Math.round(v * 100) + "%");
    }
  });
  return { changes: changes, notes: notes };
}

// 나쁜 특성 위험 / 극복 / 좋은 특성 얻기
function rollTraitEffects(choice, notes) {
  if (choice.risk && !hasTrait(choice.risk.trait)) {
    const chance = Math.min(EVENT_RULES.maxRisk, choice.risk.chance);
    if (Math.random() < chance) {
      state.player.traits.push(choice.risk.trait);
      notes.push("⚠️ 나쁜 특성 '" + findTrait(choice.risk.trait).name + "'이(가) 생겼다");
    }
  }
  if (choice.cure && hasTrait(choice.cure.trait)) {
    if (Math.random() < choice.cure.chance) {
      state.player.traits.splice(state.player.traits.indexOf(choice.cure.trait), 1);
      notes.push("💚 '" + findTrait(choice.cure.trait).name + "'을(를) 극복했다!");
    } else {
      notes.push("아직 '" + findTrait(choice.cure.trait).name + "'을(를) 완전히 이겨내지는 못했다");
    }
  }
  if (choice.gain && !hasTrait(choice.gain.trait) && Math.random() < choice.gain.chance) {
    state.player.traits.push(choice.gain.trait);
    notes.push("✨ 좋은 특성 '" + findTrait(choice.gain.trait).name + "'을(를) 얻었다!");
  }
}

// 선택지 옆에 보여 줄 위험·극복 안내
function choiceHint(choice) {
  const parts = [];
  if (choice.note) parts.push(choice.note);
  if (choice.risk) parts.push("⚠️ 낮은 확률(" + Math.round(Math.min(EVENT_RULES.maxRisk, choice.risk.chance) * 100) + "%)로 나쁜 특성 '" + findTrait(choice.risk.trait).name + "'");
  if (choice.cure) parts.push("💚 " + Math.round(choice.cure.chance * 100) + "% 확률로 '" + findTrait(choice.cure.trait).name + "' 극복");
  return parts.join(" · ");
}

// ----- 이벤트 발생 -----
function eventReady(ev) {
  const cd = state.eventCooldown[ev.id];
  const wait = ev.cooldown || EVENT_RULES.cooldown;
  if (cd !== undefined && absWeek() - cd < wait) return false;
  const need = ev.need || {};
  if (need.minPopularity && state.popularity < need.minPopularity) return false;
  if (need.minAge && state.player.age < need.minAge) return false;
  if (need.trait && !hasTrait(need.trait)) return false;
  if (need.noTrait && hasTrait(need.noTrait)) return false;
  return true;
}

function fireEvent(ev, ctx) {
  state.eventCooldown[ev.id] = absWeek();
  const title = fillText(ev.title, ctx);
  const text = fillText(ev.text, ctx);
  if (ev.tab === "news") {
    // 소식: 바로 효과 적용
    const r = applyEffects(ev.effects, ctx);
    rollTraitEffects(ev, r.notes);
    postMessage("news", title, text, { eventId: ev.id, changes: r.changes, notes: r.notes });
  } else {
    postMessage("inbox", title, text, {
      eventId: ev.id, ctx: ctx || {},
      choices: ev.choices.map(function (c) { return { label: c.label, hint: choiceHint(c) }; }),
    });
  }
}

// 조건 이벤트: trigger 이름 → 이번 주에 맞는지와 ctx
function triggerContext(trigger) {
  const w = state.weekCtx;
  const mineNew = w.newChamps.filter(function (c) { return c.positions.indexOf(state.player.position) !== -1; });
  switch (trigger) {
    case "afterWin": return w.wins > 0 ? { opp: w.opp } : null;
    case "soloKills": return w.solos >= 2 ? {} : null;
    case "loseStreak3": return w.losses > 0 && loseStreak() === 3 ? {} : null;
    case "loseStreak4": return w.losses > 0 && loseStreak() >= 4 ? {} : null;
    case "preFinal": return w.wonSemi ? {} : null;
    case "champion": return w.champion ? { champ: "" } : null;
    case "newChamp": return mineNew.length ? { champ: mineNew[0].name } : null;
    case "patch": return w.patch ? {} : null;
    case "patchNerf": return w.nerfChamp ? { champ: w.nerfChamp } : null;
    case "lowCondition": return state.condition <= 30 ? {} : null;
    case "highCondition": return state.condition >= 90 ? {} : null;
    case "lowStamina": return state.stamina <= 20 ? {} : null;
    case "benchLong": return state.benched && state.benchWeeks >= CONTRACT.benchTalkWeeks ? {} : null;
    default: return null;
  }
}

// 특성에 따라 확률 2배 (구설수 → 루머, 부상 잦음 → 손목 통증)
function traitWeight(ev) {
  if (!ev.weightTrait || !hasTrait(ev.weightTrait)) return 1;
  const t = findTrait(ev.weightTrait).effects;
  return t.scandalRate || t.injuryRate || 2;
}

// 매주 한 번: 조건 이벤트 → 무작위 이벤트 → 특성 얻기 → 선수 SNS → 답 안 한 연락 정리
function runWeeklyEvents() {
  EVENTS.forEach(function (ev) {
    if (ev.trigger === "random" || !eventReady(ev)) return;
    const ctx = triggerContext(ev.trigger);
    if (!ctx) return;
    const chance = Math.min(1, (ev.chance === undefined ? 1 : ev.chance) * traitWeight(ev));
    if (Math.random() < chance) fireEvent(ev, ctx);
  });

  if (Math.random() < EVENT_RULES.randomChance) {
    const pool = [];
    EVENTS.forEach(function (ev) {
      if (ev.trigger !== "random" || !eventReady(ev)) return;
      for (let i = 0; i < traitWeight(ev); i++) pool.push(ev);
    });
    if (pool.length) fireEvent(pick(pool), {});
  }

  checkTraitGains();
  postSocial();
  autoIgnore();
}

// 좋은 특성 얻기 (조건이 처음 맞았을 때 한 번)
function checkTraitGains() {
  TRAIT_GAINS.forEach(function (g) {
    if (state.career.gainTried[g.id]) return;
    let ok = false;
    if (g.when === "finalsWon2") ok = state.career.finalsWon >= 2;
    if (g.when === "mastery100") ok = Object.keys(state.mastery).some(function (n) { return state.mastery[n] >= MASTERY.max; });
    if (g.when === "popularity80") ok = state.popularity >= 80;
    if (!ok) return;
    state.career.gainTried[g.id] = true;
    if (hasTrait(g.trait) || Math.random() >= g.chance) return;
    state.player.traits.push(g.trait);
    postMessage("news", "✨ 새 특성: " + findTrait(g.trait).name, g.text, { notes: ["좋은 특성 '" + findTrait(g.trait).name + "'을(를) 얻었다!"] });
  });
}

// 선수 SNS (분위기용 글)
function postSocial() {
  const w = state.weekCtx;
  const ctx = { opp: w.opp ? teamName(w.opp) : "" };
  const author = function () {
    const ids = Object.keys(state.league.players);
    return Math.random() < 0.5 && ids.length ? "@" + state.league.players[pick(ids)].name : "@팬" + randInt(1000, 9999);
  };
  if (w.wins || w.losses) {
    const list = w.wins >= w.losses ? SOCIAL_POSTS.win : SOCIAL_POSTS.loss;
    postMessage("social", author(), fillText(pick(list), ctx), { read: true });
  }
  if (Math.random() < 0.3) postMessage("social", author(), fillText(pick(SOCIAL_POSTS.general), ctx), { read: true });
}

// 오래 답하지 않은 연락은 "무시"로
function autoIgnore() {
  state.inbox.forEach(function (m) {
    if (m.tab !== "inbox" || m.answered !== null || !m.choices) return;
    if (absWeek() - absWeek(m.year, m.week) >= EVENT_RULES.ignoreAfterWeeks) {
      m.answered = "ignored";
      m.read = true;
      m.notes = ["답하지 않아서 그냥 지나갔다"];
    }
  });
}

// 자금이 모자라서 고를 수 없는 선택지인가?
function choiceTooExpensive(msg, index) {
  const ev = findEvent(msg.eventId);
  const c = ev && ev.choices[index];
  return !!(c && c.effects && c.effects.money < 0 && state.money < -c.effects.money);
}

// ----- 선택하기 -----
function answerMessage(msgId, index) {
  const msg = state.inbox.find(function (m) { return m.id === msgId; });
  if (!msg || msg.answered !== null) return;
  if (msg.kind === "offer") { answerOffer(msg, index); return; } // 계약 제안 (js/contracts.js)
  const ev = findEvent(msg.eventId);
  const choice = ev && ev.choices[index];
  if (!choice || choiceTooExpensive(msg, index)) return;
  const r = applyEffects(choice.effects, msg.ctx);
  rollTraitEffects(choice, r.notes);
  msg.answered = index;
  msg.read = true;
  msg.changes = r.changes;
  msg.notes = r.notes;
  state.log.unshift({
    when: state.year + "년 " + state.week + "주차",
    training: "SNS · " + msg.title,
    message: "선택: " + choice.label + (r.notes.length ? " · " + r.notes.join(", ") : ""),
    changes: r.changes,
  });
  state.log = state.log.slice(0, 30);
}

// 메뉴 배지: 안 읽었거나 답하지 않은 받은 연락 + 안 읽은 소식
function unreadCount(tab) {
  return state.inbox.filter(function (m) {
    if (tab && m.tab !== tab) return false;
    if (m.tab === "social") return false;
    return !m.read || (m.choices && m.answered === null);
  }).length;
}
