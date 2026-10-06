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

// 이번 주 훈련이 퀘스트에 해당하는지 확인하고 진행/완료 처리
// training: 이번 주 훈련, changes: 훈련 결과 변화 ("m:챔피언" 숙련도 포함)
function progressQuests(training, changes) {
  if (!state.quests) state.quests = [];
  const practiced = Object.keys(changes).filter(function (k) { return k.indexOf("m:") === 0; }).map(function (k) { return k.slice(2); });
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
    if (!hit) return;
    q.progress++;
    if (q.progress >= q.need) done.push(q);
    else if (state.weekReport) state.weekReport.questLines.push("📋 " + tpl.title + " " + q.progress + "/" + q.need);
  });
  done.forEach(function (q) {
    const tpl = findQuest(q.id);
    // 모범생: 보상 +50%
    const bonus = 1 + traitEffectSum("questBonus");
    const reward = {};
    Object.keys(tpl.reward).forEach(function (k) { reward[k] = roundRandom(tpl.reward[k] * bonus); });
    const r = applyEffects(reward, { champ: q.champ });
    state.quests.splice(state.quests.indexOf(q), 1);
    state.career.questsDone = (state.career.questsDone || 0) + 1;
    const line = "✅ 퀘스트 완료: " + tpl.title + " → " + rewardText(q);
    if (state.weekReport) state.weekReport.questLines.push(line);
    state.log.unshift({ when: state.year + "년 " + state.week + "주차", training: "퀘스트 완료 · " + tpl.title, message: QUEST_GIVERS[tpl.giver] + "의 과제를 끝냈다!", changes: r.changes });
    postMessage("news", "✅ 퀘스트 완료: " + tpl.title, QUEST_GIVERS[tpl.giver] + ": \"잘했다. 약속한 대로다.\"", { changes: r.changes, notes: r.notes });
  });
}

// 이미 충분히 익힌 챔피언이라 의미 없는 퀘스트인가? (숙련도 masteryDone 이상)
function questMastered(tpl) {
  const done = function (name) { return (state.mastery[name] || 0) >= QUEST_RULES.masteryDone; };
  if (tpl.kind === "metaS") return done(mySMeta());
  if (tpl.kind === "metaAny") return state.meta.champs[state.player.position].every(done);
  return false;
}

// 기한 지난 퀘스트 정리, 새 퀘스트 주기 (주가 넘어간 뒤 부름)
function updateQuests() {
  if (!state.quests) state.quests = [];
  const now = absWeek();
  state.quests.slice().forEach(function (q) {
    if (now > q.deadline) {
      state.quests.splice(state.quests.indexOf(q), 1);
      const prog = findQuest(q.id).kind === "ladderTop" ? "최종 리그 " + (q.rank || "-") + "위 / 목표 " + q.need + "위" : q.progress + "/" + q.need;
      postMessage("news", "⌛ 퀘스트 기한 만료: " + findQuest(q.id).title, "기한 안에 끝내지 못했다. (" + prog + ")", {});
    }
  });
  if (state.career.seasonOverYear === state.year) return; // 우리 팀 시즌이 끝나면 새 퀘스트는 비시즌 퀘스트만
  const first = !state.career.questsGiven; // 첫 퀘스트는 바로
  if (state.quests.length >= QUEST_RULES.maxActive) return;
  if (!first && Math.random() >= QUEST_RULES.newChance) return;
  const active = state.quests.map(function (q) { return q.id; });
  const pool = QUESTS.filter(function (t) { return !t.offseason && active.indexOf(t.id) === -1 && !questMastered(t); });
  if (!pool.length) return;
  const tpl = pick(pool);
  const range = tpl.need || QUEST_RULES.need;
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
  if (tpl.kind === "training") return { plan: tpl.training };
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
  return findTraining(qp.plan).name + (qp.focusChamp ? " · " + qp.focusChamp : qp.plan === "champion" ? " · 자동(메타 위주)" : "");
}

function questPlanButtonHTML(q) {
  if (!questPlan(q)) return "";
  if (questPlanActive(q)) return '<span class="quest-picked">✓ 이번 주 훈련으로 선택됨</span>';
  return '<button class="small-btn quest-pick" data-questplan="' + q.uid + '">▶ 이번 주 훈련으로 선택 <span class="muted">(' + escapeHTML(questPlanLabel(q)) + ")</span></button>";
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
      state.notice = "이번 주 훈련을 <b>" + escapeHTML(questPlanLabel(q)) + "</b>(으)로 골랐어요. (퀘스트: " + escapeHTML(findQuest(q.id).title) + ")";
      renderPage();
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
          '<span class="muted small quest-left">' + (q.deadline - now) + "주 남음</span></div>" +
        (compact ? "" : '<div class="small">' + escapeHTML(questText(q, tpl.desc)) + "</div>") +
        '<div class="stat"><div class="stat-label small">' + progLabel + '</div><div class="bar"><div class="bar-fill gold" style="width:' + pct + '%"></div></div><div class="stat-value small">' + pct + "%</div></div>" +
        '<div class="quest-foot"><span class="muted small">보상: ' + escapeHTML(rewardText(q)) + "</span>" + questPlanButtonHTML(q) + "</div>" +
      "</div>"
    );
  }).join("");
  return compact ? '<h2 class="sub">📋 퀘스트</h2>' + rows : '<div class="card"><h2>📋 퀘스트 <span class="muted small">완료 ' + (state.career.questsDone || 0) + "회</span></h2>" + rows + "</div>";
}
