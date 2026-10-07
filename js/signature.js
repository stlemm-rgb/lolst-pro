// ===== 시그니처 픽 (값: data/match.js MATCH.signaturePick, 글: data/events.js signature_found) =====
// 내 포지션 챔피언 숙련도가 100이 되면 독백 연락 → "맞다"를 고르면 그 챔피언이 시그니처 픽 (한 번 정하면 그대로)
// "아니다"를 고르면 다음에 다른 챔피언이 100이 될 때 다시 물어봄 (같은 챔피언도 숙련도가 떨어졌다가 다시 100이 되면 다시)
// 저장: state.signature (챔피언 이름 또는 null), state.sig100 (이미 물어본 100 챔피언 목록)

function checkSignature100() {
  if (!state.player || state.signature) return;
  const noted = state.sig100 = (state.sig100 || []).filter(function (n) { return (state.mastery[n] || 0) >= MASTERY.max; }); // 100 아래로 떨어지면 다시 물어볼 수 있게
  const fresh = myPositionChampions().filter(function (n) { return state.mastery[n] >= MASTERY.max && noted.indexOf(n) === -1; });
  if (!fresh.length) return;
  const ev = findEvent("signature_found");
  if (!ev) return;
  const champ = fresh[0];
  noted.push(champ); // 한 주에 하나씩만
  fireEvent(ev, { champ: champ });
}

// 시그니처 픽 표시 칩
function sigTagHTML(name) {
  return state.signature && name === state.signature
    ? ' <span class="joker-tag sig-tag" title="시그니처 픽 ' + starText(sigStar()) + ': 메타와 상관없이 고를 때 가치 +' + sigValue("pickBonus") + ' · 경기력 +' + Math.round(sigValue("powerBonus") * 100) +
      '%, 고른 세트에서 좋은 장면 1번 보장, 상대가 ' + Math.round(sigValue("banChance") * 100) + '% 확률로 먼저 밴, 대격변 패치에도 숙련도·포지션 그대로">✒️ 시그니처 ' + "★".repeat(sigStar()) + '</span>'
    : "";
}

// 시그니처 픽을 고른 세트: 내 선수 좋은 장면이 없으면 하나 만들어 줌 (있으면 첫 장면에 ✒️ 표시) — js/match_events.js rollSetEvents
function sigGuaranteedPlay(out, sides, R) {
  const s = sides[0].some(function (q) { return q.id === USER_ID; }) ? 0 : sides[1].some(function (q) { return q.id === USER_ID; }) ? 1 : -1;
  if (s < 0) return;
  const p = sides[s].find(function (q) { return q.id === USER_ID; });
  const mine = out.list.filter(function (e) { return e.p === USER_ID && e.k === "good"; });
  if (mine.length) { mine[0].sg = true; return; }
  const pool = MATCH_EVENTS.filter(function (e) { return e.kind === "good" && !e.finisher && (!e.pos || e.pos[p.pos]); });
  const ev = weightedPick(pool, function (e) { return e.w * (e.pos ? e.pos[p.pos] : 1); });
  if (!ev) return;
  const victim = evVictim(ev, sides[1 - s], p.pos);
  const r = R.size[ev.size];
  const x = Math.round(randFloat(r[0], r[1]) * R.scale * evSizeMult(traitsOf(USER_ID), ev) * 10) / 10;
  if (s === 0) out.a += x; else out.b += x;
  addRate(out.rate, USER_ID, R.rating[ev.size]);
  if (victim) addRate(out.rate, victim.id, -R.victimRating);
  out.list.push({ t: randInt(ev.t[0], ev.t[1]), e: ev.id, s: s, p: USER_ID, pp: p.pos, v: victim ? victim.id : null, vp: victim ? victim.pos : null, x: x, k: "good", sg: true });
}
