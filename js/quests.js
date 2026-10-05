// ===== 퀘스트: 코치·감독 과제 =====
// state.quests = [{ uid, id, need, progress, champ, deadline(절대 주) }]

function findQuest(id) {
  return QUESTS.find(function (q) { return q.id === id; });
}

function questText(q, text) {
  return String(text)
    .replace(/\{need\}/g, q.need)
    .replace(/\{champ\}/g, q.champ || "")
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
      postMessage("news", "⌛ 퀘스트 기한 만료: " + findQuest(q.id).title, "기한 안에 끝내지 못했다. (" + q.progress + "/" + q.need + ")", {});
    }
  });
  const first = !state.career.questsGiven; // 첫 퀘스트는 바로
  if (state.quests.length >= QUEST_RULES.maxActive) return;
  if (!first && Math.random() >= QUEST_RULES.newChance) return;
  const active = state.quests.map(function (q) { return q.id; });
  const pool = QUESTS.filter(function (t) { return active.indexOf(t.id) === -1 && !questMastered(t); });
  if (!pool.length) return;
  const tpl = pick(pool);
  const range = tpl.need || QUEST_RULES.need;
  state.questSeq = (state.questSeq || 0) + 1;
  const q = { uid: state.questSeq, id: tpl.id, need: randInt(range[0], range[1]), progress: 0, champ: tpl.kind === "metaS" ? mySMeta() : null, deadline: now + QUEST_RULES.deadlineWeeks };
  state.quests.push(q);
  state.career.questsGiven = (state.career.questsGiven || 0) + 1;
  postMessage("inbox", "📋 새 퀘스트: " + tpl.title, QUEST_GIVERS[tpl.giver] + ": \"" + questText(q, tpl.desc) + "\"\n보상: " + rewardText(q) + "\n기한: " + QUEST_RULES.deadlineWeeks + "주", {});
}

// 퀘스트 카드 (훈련 화면·대시보드)
function questsHTML(compact) {
  const list = state.quests || [];
  if (!list.length) return compact ? "" : '<div class="card"><h2>📋 퀘스트</h2><p class="muted">지금 받은 퀘스트가 없어요. 코치와 감독이 곧 과제를 줄 거예요.</p></div>';
  const now = absWeek();
  const rows = list.map(function (q) {
    const tpl = findQuest(q.id);
    const pct = Math.round(q.progress / q.need * 100);
    return (
      '<div class="quest">' +
        '<div class="quest-head"><span class="muted small">' + QUEST_GIVERS[tpl.giver] + "</span> <b>" + escapeHTML(tpl.title) + "</b>" +
          '<span class="muted small quest-left">' + (q.deadline - now) + "주 남음</span></div>" +
        (compact ? "" : '<div class="small">' + escapeHTML(questText(q, tpl.desc)) + "</div>") +
        '<div class="stat"><div class="stat-label small">' + q.progress + " / " + q.need + '</div><div class="bar"><div class="bar-fill gold" style="width:' + pct + '%"></div></div><div class="stat-value small">' + pct + "%</div></div>" +
        '<div class="muted small">보상: ' + escapeHTML(rewardText(q)) + "</div>" +
      "</div>"
    );
  }).join("");
  return compact ? '<h2 class="sub">📋 퀘스트</h2>' + rows : '<div class="card"><h2>📋 퀘스트 <span class="muted small">완료 ' + (state.career.questsDone || 0) + "회</span></h2>" + rows + "</div>";
}
