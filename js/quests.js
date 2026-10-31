// ===== 퀘스트: 코치·감독 과제 =====
// state.quests = [{ uid, id, need, progress, champ, deadline(절대 주) }]

function findQuest(id) {
  return QUESTS.find(function (q) { return q.id === id; });
}

function questText(q, text) {
  return String(text)
    .replace(/\{need\}/g, q.need)
    .replace(/\{champ\}/g, q.champ || "")
    .replace(/\{start\}/g, q.startRank || "")
    .replace(/\{opp\}/g, q.opp ? teamName(q.opp) : "")
    .replace(/\{derby\}/g, q.derby || "")
    .replace(/\{pos\}/g, findPosition(state.player.position).name);
}

// 보상을 글로 (예: "라인전 +2, 반응속도 +1")
function rewardText(q) {
  const tpl = findQuest(q.id);
  return Object.keys(tpl.reward).map(function (k) {
    const v = tpl.reward[k];
    if (k === "masteryChamp") return (q.champ || "챔피언") + " 숙련도 +" + v;
    if (k === "masteryMetaAll") return "메타 챔피언 숙련도 +" + v;
    return statName(k) + " +" + v;
  }).join(", ");
}

// 퀘스트 완료 줄: 실제로 오른 값 (모범생 보너스·높은 스탯 보상 감소 반영). 높은 스탯이라 덜 올랐으면 (95→96 · 90 이상은 보상이 적게)
function rewardResultText(reward, changes) {
  const parts = [];
  Object.keys(changes || {}).forEach(function (k) {
    const n = Number(changes[k]) || 0;
    if (!n && state.stats[k] === undefined) return;
    let t = statName(k) + " " + (n >= 0 ? "+" : "") + n;
    if (state.stats[k] !== undefined && reward[k] > n) {
      const after = state.stats[k], before = after - n;
      if (before >= REWARD_CURVE[REWARD_CURVE.length - 1].from) t += " (" + before + "→" + after + " · 원래 +" + reward[k] + ", " + REWARD_CURVE[REWARD_CURVE.length - 1].from + " 이상이라 적게 올라요)";
    }
    parts.push(t);
  });
  Object.keys(reward).forEach(function (k) { // 보상인데 변화 기록이 없는 스탯 (0)
    if (state.stats[k] !== undefined && changes[k] === undefined) {
      const lim = REWARD_CURVE[REWARD_CURVE.length - 1].from;
      parts.push(statName(k) + " +0" + (state.stats[k] >= lim ? " (" + state.stats[k] + " · 원래 +" + reward[k] + ", " + lim + " 이상이라 적게 올라요)" : ""));
    }
  });
  return parts.join(", ") || "변화 없음";
}

// 이번 주 훈련이 퀘스트에 해당하는지 확인하고 진행/완료 처리
// training: 이번 주 훈련, changes: 훈련 결과 변화 ("m:챔피언" 숙련도 포함)
function progressQuests(training, changes) {
  if (!state.quests) state.quests = [];
  repairQuests();
  // 챔피언 연습 퀘스트는 챔피언 연습·집중 연습만 셈 (다른 훈련에 섞인 메타 숙련도 상승은 제외)
  const champTraining = !!(training.effects.mastery || training.effects.masteryFocus);
  const practiced = !champTraining ? [] : Object.keys(changes).filter(function (k) { return k.indexOf("m:") === 0; }).map(function (k) { return k.slice(2); });
  const myMeta = state.meta.champs[state.player.position];
  const done = [];
  state.quests.forEach(function (q) {
    const tpl = findQuest(q.id);
    if (!tpl) return;
    let hit = false;
    if (tpl.kind === "training") hit = training.id === tpl.training;
    if (tpl.kind === "metaS") hit = practiced.indexOf(q.champ) !== -1;
    if (tpl.kind === "metaAny") hit = practiced.some(function (n) { return myMeta.indexOf(n) !== -1; });
    if (tpl.kind === "ladderTop") {
      // 솔랭 순위 퀘스트: 진행 = 지금 리그 순위, 목표 순위 안이면 완료
      q.rank = myLadderRank();
      if (q.rank <= q.need) done.push(q);
      else if (state.weekReport) state.weekReport.questLines.push("📋 " + tpl.title + ": 리그 " + q.rank + "위 (목표 " + q.need + "위)");
      return;
    }
    // 숙련도가 최대(100)가 되면 남은 횟수와 상관없이 완료
    //   S급 메타 장악: 그 챔피언이 최대 / 주력 챔피언 만들기: 이번 주 집중 연습한 챔피언이 최대에 도달
    const maxed = function (n) { return n && (state.mastery[n] || 0) >= MASTERY.max; };
    const maxedNow = (tpl.kind === "metaS" && maxed(q.champ)) ||
      (tpl.kind === "training" && tpl.training === "champ_focus" && hit &&
        practiced.some(function (n) { return maxed(n) && changes["m:" + n] > 0; }));
    if (maxedNow) {
      q.maxedEarly = true;
      done.push(q);
      return;
    }
    if (!hit) return;
    q.progress++;
    if (q.progress >= q.need) done.push(q);
    else if (state.weekReport) state.weekReport.questLines.push("📋 " + tpl.title + " " + q.progress + "/" + q.need);
  });
  done.forEach(completeQuest);
}

// 퀘스트 완료 처리 (훈련 퀘스트 + 빅게임 퀘스트 js/rivals.js)
function completeQuest(q) {
    const tpl = findQuest(q.id);
    // 모범생: 보상 +50%
    const bonus = 1 + traitEffectSum("questBonus");
    const reward = {};
    Object.keys(tpl.reward).forEach(function (k) { reward[k] = roundRandom(tpl.reward[k] * bonus); });
    const r = applyEffects(reward, { champ: q.champ });
    state.quests.splice(state.quests.indexOf(q), 1);
    state.career.questsDone = (state.career.questsDone || 0) + 1;
    standingQuest(true); // 팀 내 입지 (js/standing.js)
    const line = "✅ 퀘스트 완료: " + tpl.title + (q.maxedEarly ? " (숙련도 " + MASTERY.max + " 달성)" : "") + " → " + rewardResultText(reward, r.changes) +
      (bonus > 1 ? " · 📗 모범생 보상 +" + Math.round((bonus - 1) * 100) + "%" : "");
    if (state.weekReport) state.weekReport.questLines.push(line);
    state.log.unshift({ when: state.year + "년 " + state.week + "주차", training: "퀘스트 완료 · " + tpl.title, message: QUEST_GIVERS[tpl.giver] + "의 과제를 끝냈다!", changes: r.changes });
    postMessage("news", "✅ 퀘스트 완료: " + tpl.title, QUEST_GIVERS[tpl.giver] + ": \"잘했다. 약속한 대로다.\"", { changes: r.changes, notes: r.notes });
}

// 이미 충분히 익힌 챔피언이라 의미 없는 퀘스트인가? (숙련도 masteryDone 이상)
function questMastered(tpl) {
  const done = function (name) { return (state.mastery[name] || 0) >= QUEST_RULES.masteryDone; };
  if (tpl.kind === "metaS") return done(mySMeta());
  if (tpl.kind === "metaAny") return state.meta.champs[state.player.position].every(done);
  return false;
}

// 기한 지난 퀘스트 정리, 새 퀘스트 주기 (주가 넘어간 뒤 부름)
// 새 퀘스트 비중 (data/training.js QUEST_RULES.lowMastery)
function questWeight(tpl) {
  const L = QUEST_RULES.lowMastery;
  const lowBoost = function (m) { return 1 + L.boost * Math.max(0, Math.min(1, (L.pivot - m) / L.range)); };
  if (tpl.kind === "metaAny") {
    const meta = state.meta.champs[state.player.position];
    return lowBoost(meta.reduce(function (a, n) { return a + (state.mastery[n] || 0); }, 0) / meta.length);
  }
  if (tpl.kind === "metaS" || (tpl.kind === "training" && tpl.training === "champ_focus")) return lowBoost(state.mastery[mySMeta()] || 0);
  return 1;
}

function weightedPickBy(list, weightOf) {
  const ws = list.map(weightOf);
  let r = Math.random() * ws.reduce(function (a, b) { return a + b; }, 0);
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r < 0) return list[i]; }
  return list[list.length - 1];
}

function updateQuests() {
  if (!state.quests) state.quests = [];
  const now = absWeek();
  state.quests.slice().forEach(function (q) {
    if (now > q.deadline) {
      state.quests.splice(state.quests.indexOf(q), 1);
      if (findQuest(q.id) && findQuest(q.id).special) return; // 빅게임 퀘스트: 경기가 안 열렸으면 조용히 정리
      standingQuest(false); // 팀 내 입지 (js/standing.js)
      const prog = findQuest(q.id).kind === "ladderTop" ? "최종 리그 " + (q.rank || "-") + "위 / 목표 " + q.need + "위" : q.progress + "/" + q.need;
      postMessage("news", "⌛ 퀘스트 기한 만료: " + findQuest(q.id).title, "기한 안에 끝내지 못했다. (" + prog + ")", {});
    }
  });
  if (state.career.seasonOverYear === state.year) return; // 우리 팀 시즌이 끝나면 새 퀘스트는 비시즌 퀘스트만
  const first = !state.career.questsGiven; // 첫 퀘스트는 바로
  if (state.quests.length >= QUEST_RULES.maxActive) return;
  if (!first && Math.random() >= QUEST_RULES.newChance) return;
  const active = state.quests.map(function (q) { return q.id; });
  const pool = QUESTS.filter(function (t) {
    if (t.maxStamina !== undefined && state.stamina > t.maxStamina) return false; // 컨디션 관리: 체력 40 이하일 때만
    return !t.offseason && !t.special && active.indexOf(t.id) === -1 && !questMastered(t);
  });
  if (!pool.length) return;
  const tpl = weightedPickBy(pool, questWeight); // 숙련도가 낮으면 챔피언 퀘스트 비중 ↑
  let range = tpl.need || QUEST_RULES.need;
  // 이미 5회짜리 퀘스트가 있으면 새 퀘스트는 최대 3회
  if (state.quests.some(function (q) { return q.need >= QUEST_RULES.bigNeed && findQuest(q.id).kind !== "ladderTop"; })) {
    range = [Math.min(range[0], QUEST_RULES.capAfterBig), Math.min(range[1], QUEST_RULES.capAfterBig)];
  }
  state.questSeq = (state.questSeq || 0) + 1;
  const q = { uid: state.questSeq, id: tpl.id, need: randInt(range[0], range[1]), progress: 0, champ: tpl.kind === "metaS" ? mySMeta() : null, deadline: now + QUEST_RULES.deadlineWeeks };
  state.quests.push(q);
  state.career.questsGiven = (state.career.questsGiven || 0) + 1;
  postMessage("inbox", "📋 새 퀘스트: " + tpl.title, QUEST_GIVERS[tpl.giver] + ": \"" + questText(q, tpl.desc) + "\"\n보상: " + rewardText(q) + "\n기한: " + QUEST_RULES.deadlineWeeks + "주", {});
}

// ----- 퀘스트 → 이번 주 훈련 바로 고르기 -----
// 퀘스트마다 맞는 훈련: { plan: 훈련 id, practiceChamp?, focusChamp? }
//   training → 그 훈련 / metaS → 챔피언 집중 연습(그 S급 챔피언) / metaAny → 챔피언 연습(자동 = 메타 챔피언 위주)
function questPlan(q) {
  const tpl = findQuest(q.id);
  if (tpl.kind === "training") return tpl.training === "champ_focus" ? { plan: "champ_focus", focusChamp: "" } : { plan: tpl.training }; // 집중 연습은 챔피언 자동
  if (tpl.kind === "metaS") return { plan: "champ_focus", focusChamp: q.champ };
  if (tpl.kind === "metaAny") return { plan: "champion", practiceChamp: "" };
  if (tpl.kind === "ladderTop") return { plan: "solo_rank" };
  return null;
}

// 지금 고른 훈련이 이미 이 퀘스트를 채우는가?
function questPlanActive(q) {
  const tpl = findQuest(q.id);
  const myMeta = state.meta.champs[state.player.position];
  if (tpl.kind === "training") return state.plan === tpl.training;
  if (tpl.kind === "ladderTop") return state.plan === "solo_rank";
  if (tpl.kind === "metaS") {
    return (state.plan === "champ_focus" && focusChamp() === q.champ) || (state.plan === "champion" && state.practiceChamp === q.champ);
  }
  if (tpl.kind === "metaAny") {
    return (state.plan === "champion" && (!state.practiceChamp || myMeta.indexOf(state.practiceChamp) !== -1)) ||
      (state.plan === "champ_focus" && myMeta.indexOf(focusChamp()) !== -1);
  }
  return false;
}

// 버튼 글자: "챔피언 집중 연습 · 제이스"
function questPlanLabel(q) {
  const qp = questPlan(q);
  if (!qp) return "";
  if (qp.plan === "champ_focus" && !qp.focusChamp) return findTraining(qp.plan).name + " · 자동(" + autoFocusChamp() + ")";
  return findTraining(qp.plan).name + (qp.focusChamp ? " · " + qp.focusChamp : qp.plan === "champion" ? " · 자동(메타 위주)" : "");
}

function questPlanButtonHTML(q, inCard) { // inCard (225): 대시보드 퀘스트 카드 안 — 카드 전체가 눌리므로 모양만
  if (!questPlan(q)) return "";
  if (questPlanActive(q)) return '<span class="quest-picked">✓ 이번 주 훈련으로 선택됨</span>';
  const inner = '▶ 이번 주 훈련으로 선택 <span class="muted">(' + escapeHTML(questPlanLabel(q)) + ")</span>";
  return inCard ? '<span class="small-btn quest-pick">' + inner + "</span>" : '<button class="small-btn quest-pick" data-questplan="' + q.uid + '">' + inner + "</button>";
}

// 버튼 연결 (main.js의 renderPage에서 부름)
function bindQuestPlan(page) {
  page.querySelectorAll("[data-questplan]").forEach(function (btn) {
    btn.onclick = function () {
      const q = (state.quests || []).find(function (x) { return x.uid === Number(btn.getAttribute("data-questplan")); });
      const qp = q && questPlan(q);
      if (!qp) return;
      state.plan = qp.plan;
      if (qp.focusChamp !== undefined) state.focusChamp = qp.focusChamp;
      if (qp.practiceChamp !== undefined) state.practiceChamp = qp.practiceChamp;
      state.notice = ""; /* 226: 훈련 고른 알림 없음 (위 훈련 배지가 바로 바뀜) */ renderPage();
    };
  });
}

// ----- 비시즌: 우리 팀 시즌이 끝난 주에 부름 (main.js nextWeek) -----
// 비시즌 솔랭 퀘스트를 바로 줌 (기한 = 그 시즌 마지막 주). 이미 받았으면 그대로
function startOffseason() {
  if (state.career.seasonOverYear === state.year) return;
  state.career.seasonOverYear = state.year;
  if (!state.quests) state.quests = [];
  const tpl = findQuest(OFFSEASON.quest);
  if (!tpl || state.quests.some(function (q) { return q.id === tpl.id; })) return;
  state.questSeq = (state.questSeq || 0) + 1;
  const rank = myLadderRank();
  const q = { uid: state.questSeq, id: tpl.id, need: offseasonTarget(rank), progress: 0, rank: rank, startRank: rank, champ: null, deadline: absWeek(state.year, CREATION.weeksPerSeason) };
  state.quests.push(q);
  state.career.offseasonQuestYear = state.year;
  state.career.questsGiven = (state.career.questsGiven || 0) + 1;
  postMessage("inbox", "📋 새 퀘스트: " + tpl.title, QUEST_GIVERS[tpl.giver] + ": \"" + questText(q, tpl.desc) + "\"\n보상: " + rewardText(q) + "\n기한: " + state.year + "년 " + CREATION.weeksPerSeason + "주차까지 (시즌이 끝나면 달성 여부와 상관없이 체력 +" + OFFSEASON.staminaRecover + ")", {});
  addNews("시즌 종료", myTeam().name + "의 " + state.year + "년 경기 일정이 모두 끝났다. 이제 비시즌!");
}

// 예전 버전 파일 때문에 목표 순위가 숫자가 아니게(NaN → 저장하면 null) 저장된 비시즌 퀘스트 고치기
function repairQuests() {
  (state.quests || []).forEach(function (q) {
    const tpl = findQuest(q.id);
    if (!tpl || tpl.kind !== "ladderTop" || q.need > 0) return;
    q.startRank = q.startRank > 0 ? q.startRank : (q.rank > 0 ? q.rank : myLadderRank());
    q.need = offseasonTarget(q.startRank);
    // 받은 연락의 글자도 고쳐 줌
    state.inbox.forEach(function (m) {
      if (m.text && m.text.indexOf("NaN위") !== -1) {
        m.text = String(m.text).replace(/NaN위 안에 들어라\.( \(지금 [^)]*\))?/, q.need + "위 안에 들어라. (지금 " + q.startRank + "위)");
      }
    });
  });
}

// 비시즌 솔랭 목표 순위: 지금 순위보다 climb 계단 위, 단 상위권은 지금 순위의 절반까지만
function offseasonTarget(rank) {
  return Math.max(1, rank - OFFSEASON.climb, Math.floor(rank / 2));
}

// 시즌이 넘어갈 때 (52주차 다음): 비시즌 퀘스트를 받은 시즌이면 체력 회복
function offseasonRecover(endedYear) {
  if (state.career.offseasonQuestYear !== endedYear) return;
  const before = state.stamina;
  state.stamina = Math.min(state.staminaMax, state.stamina + OFFSEASON.staminaRecover);
  addNews("시즌 마무리", "한 시즌을 마무리하며 푹 쉬었다. 체력 +" + (state.stamina - before) + " (" + state.stamina + "/" + state.staminaMax + ")");
}

// 리그 솔로 랭크 내 순위 (js/dashboard.js의 leagueLadder)
function myLadderRank() {
  return leagueLadder().findIndex(function (x) { return x.id === USER_ID; }) + 1;
}

// 퀘스트 카드 (훈련 화면·대시보드)
function questsHTML(compact) {
  repairQuests();
  const list = state.quests || [];
  if (!list.length) return compact ? "" : '<div class="card"><h2>📋 퀘스트</h2><p class="muted">지금 받은 퀘스트가 없어요. 코치와 감독이 곧 과제를 줄 거예요.</p></div>';
  const now = absWeek();
  const rows = list.map(function (q) {
    const tpl = findQuest(q.id);
    let pct = Math.round(q.progress / q.need * 100);
    let progLabel = q.progress + " / " + q.need;
    if (tpl.kind === "ladderTop") {
      // 순위 퀘스트: 지금 순위 → 목표까지 얼마나 왔는지
      const rank = myLadderRank();
      const from = q.startRank || leagueLadder().length; // 받을 때 순위 → 목표 순위 사이에서 얼마나 왔나
      pct = rank <= q.need ? 100 : Math.max(0, Math.round((from - rank) / Math.max(1, from - q.need) * 100));
      progLabel = rank + "위 → " + q.need + "위";
    }
    return (
      '<div class="quest">' +
        '<div class="quest-head"><span class="muted small">' + QUEST_GIVERS[tpl.giver] + "</span> <b>" + escapeHTML(tpl.title) + "</b>" +
          '<span class="muted small quest-left">' + (q.deadline > now ? (q.deadline - now) + "주 남음" : "이번 주까지") + "</span></div>" +
        (compact ? "" : '<div class="small">' + escapeHTML(questText(q, tpl.desc)) + "</div>") +
        '<div class="stat"><div class="stat-label small">' + progLabel + '</div><div class="bar"><div class="bar-fill gold" style="width:' + pct + '%"></div></div><div class="stat-value small">' + pct + "%</div></div>" +
        '<div class="quest-foot"><span class="muted small">보상: ' + escapeHTML(rewardText(q)) + "</span>" + questPlanButtonHTML(q) + "</div>" +
      "</div>"
    );
  }).join("");
  return compact ? '<h2 class="sub">📋 퀘스트</h2>' + rows : '<div class="card"><h2>📋 퀘스트 <span class="muted small">완료 ' + (state.career.questsDone || 0) + "회</span></h2>" + rows + "</div>";
}

// 대시보드 '이번 주' 퀘스트 카드 (1줄 2칸, 디자인 D2): 이름·남은 주·진행도·보상·훈련 고르기 버튼
function questCardsHTML() {
  repairQuests();
  const list = state.quests || [];
  if (!list.length) return "";
  const now = absWeek();
  return '<div class="qcards">' + list.map(function (q) {
    const tpl = findQuest(q.id);
    let pct = Math.round(q.progress / q.need * 100), prog = q.progress + "/" + q.need;
    if (tpl.kind === "ladderTop") {
      const rank = myLadderRank(), from = q.startRank || leagueLadder().length;
      pct = rank <= q.need ? 100 : Math.max(0, Math.round((from - rank) / Math.max(1, from - q.need) * 100));
      prog = rank + "위→" + q.need + "위";
    }
    const pick = questPlan(q) && !questPlanActive(q); // 225: 카드 전체를 누르면 훈련 선택
    return '<div class="qcard' + (pick ? ' click" data-questplan="' + q.uid + '" title="눌러서 이번 주 훈련으로 선택' : "") + '"><div class="qcard-h"><span class="muted small">' + QUEST_GIVERS[tpl.giver] + "</span> <b>" + escapeHTML(tpl.title) + '</b><span class="muted small qcard-left">' +
      (q.deadline > now ? (q.deadline - now) + "주 남음" : "이번 주까지") + "</span></div>" +
      '<div class="qcard-p"><span class="bar"><span class="bar-fill gold" style="width:' + pct + '%"></span></span><span class="small">' + prog + "</span></div>" +
      '<div class="muted small tip" tabindex="0" data-tip="' + escapeHTML(questText(q, tpl.desc)) + '">보상 ' + escapeHTML(rewardText(q)) + "</div>" +
      questPlanButtonHTML(q, true) + "</div>";
  }).join("") + "</div>";
}
