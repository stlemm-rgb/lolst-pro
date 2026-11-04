// ===== ④ 포지션 경험 1단계 (259): 내 장면의 포지션다운 해설 — 글: data/position_voice.js =====
// 경기 재생(js/replay.js rpAddEvent)에서 부름. 효과·무작위 없음: 경기·세트·장면 번호로 글을 고름 (다시 열어도 같은 글)

function voiceHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function voicePick(list, key) {
  return list && list.length ? list[voiceHash(key) % list.length] : "";
}

// 돌려주는 값: { text, cause } 또는 null (내 장면이 아니거나 글이 없음)
function positionVoice(m, setIdx, e, i) {
  if (e.k === "psych") return null;
  const mineDid = e.p === USER_ID, hit = !mineDid && e.v === USER_ID && e.k === "good";
  if (!mineDid && !hit) return null;
  if (hit && e.e !== "solo" && ((matchEventInfo(e) || {}).size || "s") === "s") return null; // 당한 장면은 솔로킬·중간 이상만
  if (hit && e.e === "solo") { // 솔로킬 당함은 한 경기에 처음 한 번만 (신인 때는 거의 매 세트)
    const before = (m.detail ? m.detail.sets.slice(0, setIdx) : []).some(function (sd) { return (sd.ev || []).some(function (x) { return x.e === "solo" && x.v === USER_ID; }); });
    if (before) return null;
  }
  const V = POSITION_VOICE[mineDid ? e.pp : e.vp];
  if (!V) return null;
  const good = e.e === "solo" || e.k === "good";
  const key = [m.week, m.comp, m.a, m.b, setIdx, i, e.e].join("|");
  const text = voicePick(hit ? V["hit_" + e.e] || V._hit : V[e.e] || (good ? V._good : V._bad), key);
  if (!text) return null;
  let cause = "";
  if (mineDid && e.k === "bad") {
    const sd = m.detail && m.detail.sets[setIdx], R = POSITION_VOICE_RULES;
    if (sd && sd.pm !== undefined && sd.pm < R.lowMastery) cause = voicePick(POSITION_VOICE_CAUSE.mastery, key).replace(/\{champ\}/g, sd.pick || "챔피언").replace(/\{mastery\}/g, sd.pm);
    else if (careerYears() <= R.rookieYears) cause = voicePick(POSITION_VOICE_CAUSE.rookie, key);
  }
  return { text: text, cause: cause };
}

function positionVoiceHTML(m, setIdx, e, i) {
  const v = positionVoice(m, setIdx, e, i);
  if (!v) return "";
  return '<div class="rp-voice">💬 ' + escapeHTML(v.text) + (v.cause ? ' <span class="rp-cause">' + escapeHTML(v.cause) + "</span>" : "") + "</div>";
}
