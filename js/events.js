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
  state.weekCtx = { wins: 0, losses: 0, solos: 0, opp: null, champion: null, wonSemi: false, newChamps: [], patch: false, nerfChamp: null, results: [], training: null, superPlays: 0, blunders: 0 };
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

// 최근 연승 수
function winStreak() {
  const mine = myTeam();
  const done = userMatches().filter(function (m) { return m.winner; });
  let n = 0;
  for (let i = done.length - 1; i >= 0; i--) {
    if (done[i].winner !== mine.id) break;
    n++;
  }
  return n;
}

// 이번 주에 끊은 연패 수 (이번 주 승리로 끝난 연패, 없으면 0)
function brokenLoseStreak(winsThisWeek) {
  const mine = myTeam();
  const done = userMatches().filter(function (m) { return m.winner; });
  let i = done.length - 1, wins = 0, losses = 0;
  while (i >= 0 && done[i].winner === mine.id) { wins++; i--; }
  if (!wins || wins > winsThisWeek) return 0;
  while (i >= 0 && done[i].winner !== mine.id) { losses++; i--; }
  return losses;
}

// 선수 SNS용: 지난번 글 올릴 때와 비교할 내 상태 (이적·재계약·승강·2군 복귀·시상·솔랭 1위)
function socialSnapshot() {
  const t = myTeam();
  return {
    teamId: t ? t.id : null, tier: t ? t.tier : 0, benched: !!state.benched,
    endYear: state.contract ? state.contract.endYear : 0,
    awards: (state.career.awards || []).length,
    king: hasTrait(LADDER.kingTrait), rank: myLadderRank(),
  };
}

// ----- 글자 채우기 -----
function fillText(text, ctx) {
  const c = ctx || {};
  return String(text)
    .replace(/\{name\}/g, state.player.name)
    .replace(/\{team\}/g, myTeam().name)
    .replace(/\{pos\}/g, findPosition(state.player.position).name)
    .replace(/\{champ\}/g, c.champ || "")
    .replace(/\{cup\}/g, c.cup || "대회")
    .replace(/\{proteam\}/g, c.proteam || "저희 팀")
    .replace(/\{player\}/g, c.player || "")
    .replace(/\{pteam\}/g, c.pteam || "")
    .replace(/\{trait\}/g, c.traitName || "")
    .replace(/\{oldteam\}/g, c.oldteam || "전 소속팀")
    .replace(/\{award\}/g, c.award || "개인상")
    .replace(/\{streak\}/g, c.streak || "")
    .replace(/\{opp\}/g, c.opp || "상대 팀")
    .replace(/\{me\}/g, state.player.name)
    .replace(/\{year\}/g, String(state.year))
    .replace(/\{window\}/g, String(CONTRACT.windowStart))
    .replace(/\{(\w+)\}/g, function (all, k) { return c[k] !== undefined && c[k] !== null && typeof c[k] !== "object" ? String(c[k]) : all; }); // 그 밖의 빈칸은 ctx 값
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

// ----- 이벤트 돈: 데이터 값은 "연봉 3,000만 원 기준" → 내 연봉에 맞게 키움 (10만 원 단위) -----
function eventMoneyScale() {
  const salary = state.contract ? state.contract.salary : 0;
  return Math.max(eraMoney(), salary / EVENT_RULES.moneyBaseSalary); // 초창기엔 이벤트 돈도 작게 (data/era.js)
}
function eventMoney(v) {
  return Math.round(v * eventMoneyScale() / 100000) * 100000;
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
      const gain = v > 0 ? roundRandom(v * rewardMultiplier(before, state.player.traits, key)) : v; // 높은 스탯은 보상도 덜 오름
      state.stats[key] = capRise(before, clamp(before + gain), userStatCap(key)); // 상한선에서 멈춤
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
    } else if (key === "setSignature") {
      // 시그니처 픽 정하기 (js/signature.js)
      if (ctx && ctx.champ && !state.signature) {
        state.signature = ctx.champ;
        notes.push("✒️ '" + ctx.champ + "'이(가) 나의 시그니처 픽이 됐다");
        addMoment("✒️", "시그니처 픽 '" + ctx.champ + "'");
        addNews("시그니처 픽", state.player.name + "의 시그니처 픽은 '" + ctx.champ + "'! 이제 이 챔피언을 고르면 언제나 한 번은 빛나는 장면을 만든다.");
      }
    } else if (key === "flag") {
      // 이야기 기억 (need.flag / need.noFlag)
      if (!state.flags) state.flags = {};
      Object.keys(v).forEach(function (k) { state.flags[k] = v[k]; });
    } else if (key === "unflag") {
      (Array.isArray(v) ? v : [v]).forEach(function (k) { if (state.flags) delete state.flags[k]; });
    } else if (key === "relation") {
      if (ctx && ctx.pid) changeRelation(ctx.pid, v, notes); // js/stories.js
    } else if (key === "teamRelation") {
      const t = myTeam();
      if (t) t.roster.forEach(function (id) { if (id !== USER_ID) changeRelation(id, v, null); });
      notes.push("팀 동료들과의 관계 " + (v > 0 ? "+" : "") + v);
    } else if (key === "salaryRaise") {
      if (state.contract) {
        const old = state.contract.salary;
        state.contract.salary = Math.round(old * (1 + v) / 1000000) * 1000000;
        notes.push("💰 연봉 " + moneyText(old) + " → " + moneyText(state.contract.salary));
      }
    } else if (key === "money") {
      const m = eventMoney(v);
      state.money += m;
      notes.push("자금 " + (m > 0 ? "+" : "−") + Math.abs(m / 10000).toLocaleString() + "만 원");
    } else if (key === "friendTip") {
      friendTip(ctx, notes); // 다른 팀 친구의 이적 정보 (js/friends.js)
    } else if (key === "activity") {
      startActivity(v, ctx, notes);
    } else if (key === "cureOther") {
      // 나온 선수의 나쁜 특성 없애 주기
      const p = ctx && ctx.pid && state.league.players[ctx.pid];
      if (p && p.traits && p.traits.indexOf(ctx.trait) !== -1 && !(findTrait(ctx.trait) && findTrait(ctx.trait).npcLocked)) { // 🔒 특성은 못 없앰
        if (Math.random() < v) {
          p.traits.splice(p.traits.indexOf(ctx.trait), 1);
          notes.push("💚 " + p.name + " 선수가 '" + findTrait(ctx.trait).name + "'을(를) 이겨냈다!");
          addNews("동료의 극복", p.name + " 선수가 " + state.player.name + "의 도움으로 '" + findTrait(ctx.trait).name + "'을(를) 이겨냈다.");
        } else notes.push(p.name + " 선수는 아직 '" + findTrait(ctx.trait).name + "'을(를) 완전히 이겨내지 못했다");
      }
    } else if (key === "otherRisk") {
      // 사고를 막지 못함: 나온 선수에게 나쁜 특성
      const p = ctx && ctx.pid && state.league.players[ctx.pid];
      if (p && Math.random() < v.chance) {
        if (!p.traits) p.traits = [];
        if (p.traits.indexOf(v.trait) === -1) p.traits.push(v.trait);
        const mine = myTeam() && p.teamId === myTeam().id;
        notes.push("⚠️ " + p.name + " 선수가 결국 사고를 쳤다 ('" + findTrait(v.trait).name + "')" + (mine ? " · 팀 이미지도 나빠졌다" : ""));
        addNews("선수 구설수", p.name + " (" + teamName(p.teamId) + ") 선수의 부적절한 발언이 논란이 되고 있다.");
        if (mine) { before = state.reputation; state.reputation = Math.max(-100, state.reputation - 2); add("reputation", state.reputation - before); }
      } else if (p) notes.push(p.name + " 선수에게 별일은 없었다");
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
  if (choice.risk && !hasTrait(choice.risk.trait) && !traitEffectSum("badImmune")) { // 잡초: 나쁜 특성 안 생김
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
function choiceHint(choice, ctx) {
  const parts = [];
  if (choice.note) parts.push(choice.note);
  const e = choice.effects || {};
  if (e.money) parts.push("자금 " + (e.money > 0 ? "+" : "−") + moneyText(Math.abs(eventMoney(e.money))));
  if (e.activity && ACTIVITIES[e.activity] && !choice.note) parts.push(ACTIVITIES[e.activity].icon + " " + fillText(ACTIVITIES[e.activity].desc, ctx));
  if (e.cureOther) parts.push("💚 " + Math.round(e.cureOther * 100) + "% 확률로 동료의 나쁜 특성 극복");
  if (choice.risk) parts.push("⚠️ 낮은 확률(" + Math.round(Math.min(EVENT_RULES.maxRisk, choice.risk.chance) * 100) + "%)로 나쁜 특성 '" + findTrait(choice.risk.trait).name + "'");
  if (choice.cure) parts.push("💚 " + Math.round(choice.cure.chance * 100) + "% 확률로 '" + findTrait(choice.cure.trait).name + "' 극복");
  const fr = choice.check && choice.fail && choice.fail.risk;
  if (fr) parts.push("실패하면 ⚠️ 낮은 확률(" + Math.round(Math.min(EVENT_RULES.maxRisk, fr.chance) * 100) + "%)로 나쁜 특성 '" + findTrait(fr.trait).name + "'");
  const sg = choice.check && choice.success && choice.success.gain;
  if (sg) parts.push("성공하면 ✨ 낮은 확률로 좋은 특성 '" + findTrait(sg.trait).name + "'");
  if (choice.gain) parts.push("✨ 낮은 확률로 좋은 특성 '" + findTrait(choice.gain.trait).name + "'");
  if (choice.check) parts.unshift("🎲 성공 확률 " + Math.round(checkChance(choice.check) * 100) + "% (" + checkStatName(choice.check.stat) + " " + Math.round(checkValue(choice.check.stat)) + ")"); // js/stories.js
  return parts.join(" · ");
}

// ----- 이벤트 발생 -----
function eventReady(ev) {
  const cd = state.eventCooldown[ev.id];
  const wait = ev.cooldown || EVENT_RULES.cooldown;
  if (cd !== undefined && absWeek() - cd < wait) return false;
  const need = ev.need || {};
  if (need.minPopularity && state.popularity < need.minPopularity) return false;
  if (need.maxPopularity !== undefined && state.popularity > need.maxPopularity) return false;
  if (need.minReputation !== undefined && state.reputation < need.minReputation) return false;
  if (need.maxReputation !== undefined && state.reputation > need.maxReputation) return false;
  if (need.minAge && state.player.age < need.minAge) return false;
  if (need.minWeek && state.week < need.minWeek) return false;
  if (need.trait && !hasTrait(need.trait)) return false;
  if (need.noTrait && hasTrait(need.noTrait)) return false;
  if (!storyNeedOk(need)) return false; // 리뉴얼 조건 (js/stories.js)
  // 한 시즌에 같은 연락은 seasonMax번까지, 받은 연락은 inboxPerSeason개까지 (always·후속 연락은 예외)
  if (ev.tab === "inbox" && !ev.always && ev.trigger !== "followUp" && ev.trigger !== "signature") {
    const L = eventLog();
    if ((L.ys[ev.id] || 0) >= (ev.seasonMax || EVENT_RULES.seasonMax)) return false;
    if (L.n >= EVENT_RULES.inboxPerSeason) return false;
  }
  return true;
}

function fireEvent(ev, ctx) {
  state.eventCooldown[ev.id] = absWeek();
  logEventFired(ev); // js/stories.js
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
      choices: ev.choices.map(function (c) { return { label: c.label, hint: choiceHint(c, ctx || {}) }; }),
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
    default: return storyTriggerContext(trigger); // 시즌 흐름 트리거 (js/stories.js)
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
  // 한 주에 선택지 연락은 1개까지 (always 연락은 따로): 시스템 트리거(js/stories.js) → 조건 연락 → 무작위
  let inboxFired = friendWeekly(); // 분기 친구 활동 · 친구 트리거 (js/friends.js)
  inboxFired = runQueuedTriggers() || inboxFired;
  shuffled(EVENTS).forEach(function (ev) {
    if (ev.trigger === "random" || ev.trigger === "followUp" || ev.trigger === "signature" || QUEUE_TRIGGERS.indexOf(ev.trigger) !== -1 || !eventReady(ev)) return;
    if (ev.tab === "inbox" && !ev.always && inboxFired) return;
    const ctx = triggerContext(ev.trigger);
    if (!ctx) return;
    const full = ev.who ? whoContext(ev.who) : null;
    if (ev.who && !full) return;
    const chance = Math.min(1, (ev.chance === undefined ? 1 : ev.chance) * traitWeight(ev));
    if (Math.random() < chance) {
      fireEvent(ev, Object.assign({}, ctx, full || {}));
      if (ev.tab === "inbox" && !ev.always) inboxFired = true;
    }
  });

  if (!inboxFired && Math.random() < EVENT_RULES.randomChance) {
    const pool = [];
    const L = eventLog();
    EVENTS.forEach(function (ev) {
      if (ev.trigger !== "random" || !eventReady(ev)) return;
      if (ev.who && !whoContext(ev.who)) return; // 나올 선수가 없으면 빼기
      const w = traitWeight(ev) * (L.seen[ev.id] ? 1 : EVENT_RULES.freshWeight); // 처음 보는 연락 우선
      for (let i = 0; i < w; i++) pool.push(ev);
    });
    if (pool.length) {
      const ev = pick(pool);
      fireEvent(ev, ev.who ? whoContext(ev.who) : {});
    }
  }
  firePendingEvents(); // 후속 연락

  checkTraitGains();
  state.newMentions = postSocial();
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
    if (g.when === "popularity60") ok = state.popularity >= 60;
    if (g.when === "finalsWon3") ok = state.career.finalsWon >= 3;
    if (g.when === "challenger") ok = !!state.soloRank && state.soloRank.peak >= 3200;
    if (!ok) return;
    state.career.gainTried[g.id] = true;
    if (hasTrait(g.trait) || Math.random() >= g.chance) return;
    state.player.traits.push(g.trait);
    addMoment("✨", "특성 '" + findTrait(g.trait).name + "' 획득");
    postMessage("news", "✨ 새 특성: " + findTrait(g.trait).name, g.text, { notes: ["좋은 특성 '" + findTrait(g.trait).name + "'을(를) 얻었다!"] });
  });
  sTraitsWeeklyUser(); // 내 선수만 얻는 S급 특성 (js/straits.js)
}

// 이번 글에 내 이름 언급을 허용할까? (data/social_posts.js SOCIAL_RULES.mention)
function mentionAllowed(cat, who) {
  const M = SOCIAL_RULES.mention;
  if (!M || M.always.indexOf(cat) !== -1) return true;
  let rate = M.minRate + (1 - M.minRate) * Math.min(1, state.popularity / M.fullAt);
  if (who.proId && myTeam() && myTeam().tier === 2) rate *= M.tier2ProFactor;
  return Math.random() < rate;
}

// 선수 SNS (분위기용 글)
// - 글: 팬 = data/social_posts.js (SOCIAL_POSTS), 프로 선수 = data/social_posts_pro.js (SOCIAL_PRO_POSTS, 점잖은 말투)
// - 이번 주 상황에 맞는 분류에서 글을 고름 (경기 결과·훈련·솔로킬·패치 등)
// - 내 선수 이름({name})이 들어간 글은 "멘션" → 안 읽음으로 올려서 알림
// - 돌려주는 값: 이번 주 새 멘션 수
function postSocial() {
  const w = state.weekCtx;
  const R = SOCIAL_RULES;
  const ctx = { opp: w.opp ? teamName(w.opp) : "", cup: (w.champion || "").replace(/ 우승$/, "") }; // "리그 우승" → "리그"
  const proLists = typeof SOCIAL_PRO_POSTS !== "undefined" ? SOCIAL_PRO_POSTS : {};

  // 분류 cat의 글 목록 (경기 결과 세부 분류는 win/loss 글도 같이 섞어서)
  const listOf = function (posts, cat) {
    const base = posts[cat] || [];
    if (cat === "winSweep" || cat === "winClose") return base.concat(posts.win || []);
    if (cat === "lossSweep" || cat === "lossClose") return base.concat(posts.loss || []);
    return base;
  };
  // 글쓴이 정하기: 프로 선수(그 분류에 프로 글이 있을 때) 또는 팬
  const author = function (cat) {
    // 프로 글쓴이: 팀이 있는 다른 팀 선수 (우리 팀 동료는 빼요)
    const mineId = myTeam() ? myTeam().id : null;
    const ids = Object.keys(state.league.players).filter(function (id) { const t = state.league.players[id].teamId; return t && t !== mineId; });
    if (Math.random() < R.proAuthorRate && ids.length && listOf(proLists, cat).length) {
      const id = pick(ids);
      const t = findTeam(state.league.players[id].teamId);
      return { title: "@" + state.league.players[id].name, proId: id, posts: proLists, proteam: t ? t.short : "" };
    }
    const fans = SOCIAL_FAN_NAMES.length ? SOCIAL_FAN_NAMES : ["팬"];
    return { title: "@" + pick(fans) + randInt(1000, 9999), proId: null, posts: SOCIAL_POSTS, proteam: "" };
  };

  // 이번 주 경기 결과: 마지막 경기 기준 완승/접전 승/접전 패/완패
  const last = w.results.length ? w.results[w.results.length - 1] : null;
  const resultCat = last ? (last.won ? (last.sweep ? "winSweep" : "winClose") : (last.sweep ? "lossSweep" : "lossClose")) : null;
  if (last) ctx.opp = last.opp || ctx.opp;

  // 이번 주 조건이 맞는 분류 (앞쪽이 먼저)
  const cats = [];
  if (w.champion) cats.push("champion");
  if (resultCat) cats.push(resultCat);
  if (w.results.some(function (r) { return r.pog; })) cats.push("pog");
  if (w.solos > 0) cats.push("soloKill");
  if (w.losses > 0 && loseStreak() >= 3) cats.push("loseStreak");
  if (w.training) cats.push("train_" + w.training);
  if (w.patch) cats.push("patch");
  if (state.benched) cats.push("benched");
  if (state.popularity >= 70) cats.push("popular");
  if (state.player.age <= 18) cats.push("rookie");
  if (state.player.age >= 29) cats.push("veteran");
  if (hasActivity("stream")) cats.push("streaming");
  if (hasActivity("sponsor")) cats.push("sponsor");
  cats.push("general");

  // 지난번과 비교해서 생긴 일 (2026-10-07 추가) — 중요한 일이라 앞쪽에 끼워 넣음
  const snap = state.career.socialSnap;
  const now = socialSnapshot();
  const early = [];
  if (snap) {
    const sameTeam = snap.teamId === now.teamId;
    if (!sameTeam && snap.teamId) { early.push("transfer"); ctx.oldteam = findTeam(snap.teamId) ? findTeam(snap.teamId).name : ""; }
    if (sameTeam && now.endYear > snap.endYear) early.push("renewal");
    if (sameTeam && now.tier < snap.tier) early.push("promoted");
    if (sameTeam && now.tier > snap.tier) early.push("relegated");
    if (now.awards > snap.awards) { early.push("award"); ctx.award = state.career.awards.slice(snap.awards).map(function (a) { return a.title; }).join(", "); }
    if ((now.king && !snap.king) || (now.rank === 1 && snap.rank !== 1)) early.push("ladderTop");
    if (sameTeam && snap.benched && !now.benched) early.push("benchReturn");
  }
  state.career.socialSnap = now;
  if (w.superPlays > 0) early.push("superPlay");
  if (w.blunders > 0) early.push("blunder");
  const broken = w.wins > 0 ? brokenLoseStreak(w.wins) : 0;
  if (broken >= 3) { early.push("streakBreak"); ctx.streak = broken; }
  else if (w.wins > 0 && winStreak() >= 3) { early.push("winStreak"); ctx.streak = winStreak(); }
  const at = resultCat ? cats.indexOf(resultCat) + 1 : (w.champion ? 1 : 0);
  Array.prototype.splice.apply(cats, [at, 0].concat(early));

  let posted = 0, mentions = 0;
  // 리그 우승·월드 우승 주에는 우승 글을 2~3개 꼭 올림 (한 주 최대 개수와 따로)
  if (w.champion && R.bigTitleWords && R.bigTitleWords.some(function (t) { return w.champion.indexOf(t) !== -1; })) {
    const count = randInt(R.bigTitlePosts[0], R.bigTitlePosts[1]);
    const used = [];
    for (let i = 0; i < count; i++) {
      const who = author("champion");
      const list = listOf(who.posts, "champion").filter(function (t) { return used.indexOf(t) === -1; });
      if (!list.length) break;
      const raw = pick(list);
      used.push(raw);
      const mention = raw.indexOf("{name}") !== -1;
      postMessage("social", who.title, fillText(raw, Object.assign({}, ctx, { proteam: who.proteam })), { read: !mention, mention: mention, proId: who.proId });
      if (mention) mentions++;
    }
    cats.splice(cats.indexOf("champion"), 1); // 아래에서 또 올리지 않게
  }
  cats.forEach(function (cat) {
    if (posted >= R.maxPerWeek) return;
    const always = cat === resultCat; // 경기가 있으면 결과 글은 항상 1개
    const chance = R.chance[cat] !== undefined ? R.chance[cat] : cat.indexOf("train_") === 0 ? R.chance.training : 0.3;
    if (!always && Math.random() >= chance) return;
    const who = author(cat);
    let list = listOf(who.posts, cat);
    // 인기도가 낮으면(또는 2부에서 프로 선수 글이면) 내 이름이 들어간 글을 덜 고름
    if (!mentionAllowed(cat, who)) list = list.filter(function (t) { return t.indexOf("{name}") === -1; });
    if (!list.length) return;
    const raw = pick(list);
    const mention = raw.indexOf("{name}") !== -1;
    const c = Object.assign({}, ctx, { proteam: who.proteam }, cat === "patch" ? { champ: mySMeta() } : {});
    postMessage("social", who.title, fillText(raw, c), { read: !mention, mention: mention, proId: who.proId });
    posted++;
    if (mention) mentions++;
  });
  return mentions;
}

// 오래 답하지 않은 연락은 "무시"로, 오래 안 읽은 소식·연락은 "읽음"으로 (알림 배지에서 빠짐)
function autoIgnore() {
  state.inbox.forEach(function (m) {
    const age = absWeek() - absWeek(m.year, m.week);
    if (!m.read && !(m.choices && m.answered === null) && age >= EVENT_RULES.readAfterWeeks) m.read = true;
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
  if (msg.kind === "friend") return friendChoiceTooExpensive(msg, index); // js/friends.js
  const ev = findEvent(msg.eventId);
  const c = ev && ev.choices[index];
  return !!(c && c.effects && c.effects.money < 0 && state.money < -eventMoney(c.effects.money));
}

// ----- 선택하기 -----
function answerMessage(msgId, index) {
  const msg = state.inbox.find(function (m) { return m.id === msgId; });
  if (!msg || msg.answered !== null) return;
  if (msg.kind === "offer") { answerOffer(msg, index); return; } // 계약 제안 (js/contracts.js)
  if (msg.kind === "retire") { answerRetire(msg, index); return; } // 은퇴 권유 (js/retire.js)
  if (msg.kind === "friend") { answerFriend(msg, index); return; } // 분기 친구 활동 (js/friends.js)
  const ev = findEvent(msg.eventId);
  let choice = ev && ev.choices[index];
  // 예전에 온 연락이라 선택지 순서가 바뀌었으면 글자로 찾기
  if (ev && msg.choices && msg.choices[index] && choice && choice.label !== msg.choices[index].label) {
    choice = ev.choices.find(function (c) { return c.label === msg.choices[index].label; }) || null;
  }
  if (!choice || choiceTooExpensive(msg, index)) return;
  const r = applyEffects(choice.effects, msg.ctx);
  rollTraitEffects(choice, r.notes);
  scheduleFollowUps(choice.followUp, msg.ctx); // 몇 주 뒤 후속 연락
  // 능력치 판정 🎲 → 성공/실패 결과 (js/stories.js)
  let result = choice.result;
  if (choice.check) {
    const ok = Math.random() < checkChance(choice.check);
    const br = (ok ? choice.success : choice.fail) || {};
    r.notes.unshift(ok ? "🎲 성공!" : "🎲 실패…");
    const r2 = applyEffects(br.effects, msg.ctx);
    Object.keys(r2.changes).forEach(function (k) { r.changes[k] = (r.changes[k] || 0) + r2.changes[k]; });
    r2.notes.forEach(function (n) { r.notes.push(n); });
    rollTraitEffects(br, r.notes);
    scheduleFollowUps(br.followUp, msg.ctx);
    if (br.result) result = br.result;
    msg.checkOk = ok;
  }
  if (result) msg.result = fillText(Array.isArray(result) ? pick(result) : result, msg.ctx);
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

// 알림 수: 안 읽었거나 답하지 않은 받은 연락 + 안 읽은 소식 + 안 읽은 멘션(선수 SNS)
function unreadCount(tab) {
  return state.inbox.filter(function (m) {
    if (tab && m.tab !== tab) return false;
    if (m.tab === "social") return !!m.mention && !m.read; // 나를 언급한 글만 알림
    return !m.read || (m.choices && m.answered === null);
  }).length;
}

// ===== 다른 선수가 나오는 연락: who → { pid, player, pteam, trait, traitName } =====
const TEAMMATE_BAD_TRAITS = ["lazy", "stage_fright", "inconsistent", "slow_starter"];
function whoContext(who) {
  const mine = myTeam();
  if (!mine) return null;
  const P = state.league.players;
  const make = function (id, trait) {
    const p = P[id];
    const t = findTeam(p.teamId);
    return { pid: id, player: p.name, pteam: t ? t.name : "", trait: trait || null, traitName: trait ? findTrait(trait).name : "" };
  };
  const others = Object.keys(P).filter(function (id) { const t = P[id].teamId && findTeam(P[id].teamId); return t && t.id !== mine.id && (t.tier === 1 || t.tier === 2); });
  const mates = mine.roster.filter(function (id) { return id !== USER_ID && P[id]; });
  if (who === "rival") {
    if (state.activities && state.activities.some(function (a) { return a.id === "rival"; })) return null; // 이미 라이벌이 있음
    const same = others.filter(function (id) { return P[id].pos === state.player.position && findTeam(P[id].teamId).tier === mine.tier; })
      .sort(function (a, b) { return playerScore(b) - playerScore(a); });
    return same.length ? make(same[0]) : null;
  }
  if (who === "otherPro") return others.length ? make(pick(others)) : null;
  // 관계 (js/stories.js): 절친 동료 · 앙숙
  if (who === "friend") {
    const f = mates.filter(function (id) { return relationOf(id) >= 40; });
    return f.length ? make(pick(f)) : null;
  }
  if (who === "foe") {
    const f = Object.keys(state.relations || {}).filter(function (id) { return P[id] && P[id].teamId && relationOf(id) <= -30; });
    return f.length ? make(pick(f)) : null;
  }
  const fw = friendWhoContext(who); // 친구 연락: bestFriend · friendMate · friendOther · retiredFriend (js/friends.js)
  if (fw !== undefined) return fw;
  if (who === "teammate") return mates.length ? make(pick(mates)) : null;
  if (who === "teammateBad") {
    const bad = [];
    mates.forEach(function (id) { (P[id].traits || []).forEach(function (t) { if (TEAMMATE_BAD_TRAITS.indexOf(t) !== -1) bad.push([id, t]); }); });
    if (!bad.length) return null;
    const b = pick(bad);
    return make(b[0], b[1]);
  }
  return null;
}

// ===== 후속 연락: 선택지의 followUp → 몇 주 뒤 =====
function scheduleFollowUps(f, ctx) {
  if (!f) return;
  (Array.isArray(f) ? f : [f]).forEach(function (x) {
    if (Math.random() >= (x.chance === undefined ? 1 : x.chance)) return;
    if (!state.pendingEvents) state.pendingEvents = [];
    state.pendingEvents.push({ event: x.event, at: absWeek() + randInt(x.weeks[0], x.weeks[1]), ctx: ctx || {} });
  });
}

function firePendingEvents() {
  if (!state.pendingEvents || !state.pendingEvents.length) return;
  const now = absWeek();
  state.pendingEvents = state.pendingEvents.filter(function (p) {
    if (p.at > now) return true;
    const ev = findEvent(p.event);
    // 방송 관련 후속은 방송을 그만뒀으면 안 옴
    if (ev && (p.event.indexOf("stream_") !== 0 || hasActivity("stream"))) fireEvent(ev, p.ctx);
    return false;
  });
}

// ===== 오래 가는 계약·활동 (data/events.js ACTIVITIES) =====
// state.activities = [{ id, year(시작한 해), ctx: { pid, player, pteam, teamId } }]
function hasActivity(id) {
  return !!(state.activities || []).some(function (a) { return a.id === id; });
}

function startActivity(id, ctx, notes) {
  const def = ACTIVITIES[id];
  if (!def) return;
  if (!state.activities) state.activities = [];
  if (hasActivity(id)) { notes.push("이미 " + def.name + " 중이다"); return; }
  const c = Object.assign({}, ctx || {});
  if (c.pid && state.league.players[c.pid]) c.teamId = state.league.players[c.pid].teamId;
  state.activities.push({ id: id, year: state.year, ctx: c });
  notes.push(def.icon + " " + def.name + " 시작: " + fillText(def.desc, c));
}

function stopActivity(id, reason) {
  const def = ACTIVITIES[id];
  state.activities = (state.activities || []).filter(function (a) { return a.id !== id; });
  if (def && reason) addNews(def.icon + " " + def.name + " 종료", reason);
}

// 매주 (main.js nextWeek에서 연봉 다음에): 활동 효과와 해지 조건
function runActivities() {
  (state.activities || []).slice().forEach(function (a) {
    const def = ACTIVITIES[a.id];
    if (!def) return;
    if (def.failIf && def.failIf.popularityBelow !== undefined && state.popularity < def.failIf.popularityBelow) {
      applyEffects(def.failEffects || {}, a.ctx);
      stopActivity(a.id, "인기도가 " + def.failIf.popularityBelow + " 아래로 떨어져 계약이 해지됐다." + (def.failEffects && def.failEffects.reputation ? " (평판 " + def.failEffects.reputation + ")" : ""));
      return;
    }
    const w = def.weekly || {};
    if (w.moneySalaryPct && state.contract) {
      const m = Math.round(state.contract.salary * w.moneySalaryPct);
      state.money += m;
      if (state.weekReport) state.weekReport.activityIncome = (state.weekReport.activityIncome || 0) + m;
    }
    const rest = {};
    Object.keys(w).forEach(function (k) { if (k !== "moneySalaryPct") rest[k] = w[k]; });
    applyEffects(rest, a.ctx);
  });
}

// 시즌이 넘어갈 때: 시즌 끝까지인 활동 종료
function endSeasonActivities() {
  (state.activities || []).slice().forEach(function (a) {
    const def = ACTIVITIES[a.id];
    if (def && def.untilSeasonEnd) stopActivity(a.id, "시즌이 끝나 " + def.name + "이(가) 끝났다.");
  });
}

// 경기력 보너스: 라이벌 팀과 경기 (matchsim.js userMatchContext에서 부름)
function activityMatchBoost(match) {
  const mine = myTeam();
  if (!mine || !match) return 0;
  const opp = match.a === mine.id ? match.b : match.a;
  let b = 0;
  (state.activities || []).forEach(function (a) {
    const def = ACTIVITIES[a.id];
    if (def && def.matchBoostVs && a.ctx && a.ctx.teamId === opp) b += def.matchBoostVs;
  });
  return b;
}
