// ===== 2D 도트 포트레잇 (175, 디자인 D1) — 값은 data/portrait.js =====
// portraitImg(id, opts) → <img> HTML (canvas로 그린 그림을 data URL로, 같은 그림은 캐시)
//   opts: scale 1~3, mood "normal"|"win"|"lose"|"tired", face true = 얼굴만 18×18 잘라서(표용), jump true = 가끔 점프, size(face일 때 px: 18 또는 36)
// 내 선수 얼굴: state.player.look { skin, hs, hairC, eyes, face, headset, glasses } (캐릭터 만들 때 고름, 예전 세이브는 이름으로 자동)

function pfSeed(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function pfRng(s) {
  let a = pfSeed(s);
  return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function randomLook(seed) {
  const r = seed === undefined ? Math.random : pfRng(seed);
  const n = function (k) { return Math.floor(r() * k); };
  const P = PORTRAIT;
  return { skin: n(P.skins.length), hairC: n(P.hairColors.length), hs: n(P.hairStyles.length), eyes: n(P.eyes.length), face: n(P.faces.length),
    headset: r() < P.headsetChance, glasses: r() < P.glassesChance };
}
function lookOf(id) {
  if (id === USER_ID && state.player) {
    if (!state.player.look) state.player.look = randomLook("me:" + state.player.name); // 예전 세이브
    return state.player.look;
  }
  return randomLook(id);
}

// ----- 유니폼 -----
function uniformByShort(short) {
  return TEAM_UNIFORMS[short] || UNIFORM_POOL[pfSeed(short) % UNIFORM_POOL.length];
}
function uniformOfTeam(teamId) {
  if (!teamId) return FREE_AGENT_UNIFORM;
  const t = findTeam(teamId);
  if (t) return uniformByShort(t.short);
  const w = typeof findWorldTeam === "function" ? findWorldTeam(teamId) : null;
  const reg = w ? w.region : null;
  const list = REGION_UNIFORMS[reg] || UNIFORM_POOL;
  return list[pfSeed(teamId) % list.length];
}
function teamIdOfPlayer(id) {
  if (id === USER_ID) { const t = myTeam(); return t ? t.id : null; }
  const p = state.league && state.league.players[id];
  if (p) return p.teamId || null;
  if (state.world && String(id).charAt(0) === "X") {
    const wt = state.world.teams.find(function (t) { return t.roster.indexOf(id) !== -1; });
    return wt ? wt.id : null;
  }
  return null;
}
// 내 선수 표정: 체력이 낮으면 지침, 아니면 지난주 경기 결과 (이긴 경기가 더 많으면 웃음)
function myMood() {
  if (state.stamina < PORTRAIT.tiredStamina) return "tired";
  const L = state.weekReport && state.weekReport.userLines;
  if (!L || !L.length) return "normal";
  const w = L.filter(function (l) { return l.won; }).length;
  return w * 2 > L.length ? "win" : w * 2 < L.length ? "lose" : "normal";
}

// ----- 그리기 (32×32, 시안 4 그대로) -----
function drawPortrait32(g, L, c, mood) {
  const P = PORTRAIT;
  const R = function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const sk = P.skins[L.skin].c, H = P.hairColors[L.hairC].c, dark = "#231f2b", M = "#7a3b3b";
  // 몸·유니폼
  R(6, 26, 20, 6, c[0]); R(8, 25, 16, 1, c[0]); R(14, 25, 4, 3, c[1]); R(6, 30, 20, 1, c[1]); R(14, 22, 4, 4, sk);
  // 얼굴
  const fw = [12, 11, 13][L.face], fx = Math.floor(16 - fw / 2);
  const face = function () { R(fx, 9, fw, 14, sk); R(fx + 1, 23, fw - 2, 1, sk); R(fx - 1, 14, 1, 4, sk); R(fx + fw, 14, 1, 4, sk); };
  face();
  // 머리
  if (L.hs === 6) { // 아프로: 얼굴 뒤를 감싸고 얼굴을 다시
    R(fx - 4, 3, fw + 8, 10, H); R(fx - 3, 2, fw + 6, 1, H); R(fx - 5, 5, 1, 10, H); R(fx + fw + 4, 5, 1, 10, H); R(fx - 4, 13, 3, 5, H); R(fx + fw + 1, 13, 3, 5, H);
    R(fx, 10, fw, 13, sk); R(fx + 1, 9, fw - 2, 1, sk); R(fx + 1, 23, fw - 2, 1, sk); R(fx - 1, 14, 1, 4, sk); R(fx + fw, 14, 1, 4, sk);
    R(fx - 2, 4, 2, 1, "rgba(255,255,255,.18)"); R(fx + 3, 3, 3, 1, "rgba(255,255,255,.18)");
  } else [
    function () { R(fx - 1, 6, fw + 2, 4, H); R(fx - 1, 10, 2, 4, H); R(fx + fw - 1, 10, 2, 4, H); },
    function () { R(fx - 1, 5, fw + 2, 5, H); R(fx + 2, 10, 4, 2, H); R(fx - 1, 10, 1, 6, H); R(fx + fw, 10, 1, 6, H); },
    function () { R(fx, 5, fw, 4, H); R(fx - 1, 8, fw + 2, 2, H); R(fx + fw - 4, 10, 4, 1, H); },
    function () { R(fx - 2, 5, fw + 4, 5, H); R(fx - 2, 10, 2, 10, H); R(fx + fw, 10, 2, 10, H); },
    function () { R(fx, 6, fw, 3, H); R(fx + 2, 4, 2, 2, H); R(fx + 6, 3, 2, 3, H); R(fx + fw - 3, 4, 2, 2, H); R(fx - 1, 8, fw + 2, 2, H); },
    function () { R(fx + 1, 7, fw - 2, 2, sk); R(fx + 2, 6, fw - 4, 1, sk); R(fx + 2, 7, 2, 1, "rgba(255,255,255,.55)"); R(fx - 1, 12, 1, 2, H); R(fx + fw, 12, 1, 2, H); },
  ][L.hs]();
  // 눈썹·눈
  const ey = 15, e1 = fx + 2, e2 = fx + fw - 4;
  const by = L.glasses ? 12 : 13; // 안경테(13줄)에 눈썹이 가려서 머리색이 안 보이던 문제 → 안경이면 눈썹을 한 줄 위로 (184)
  if (mood === "lose") { R(e1, by - 1, 1, 1, H); R(e1 + 1, by, 1, 1, H); R(e2 + 1, by - 1, 1, 1, H); R(e2, by, 1, 1, H); }
  else { R(e1, by, 2, 1, H); R(e2, by, 2, 1, H); }
  const eye = function (x) {
    if (mood === "win") { R(x, ey, 1, 1, dark); R(x + 1, ey - 1, 1, 1, dark); }
    else if (mood === "tired") R(x, ey, 2, 1, dark);
    else if (L.eyes === 1) { R(x, ey - 1, 2, 2, dark); R(x + 1, ey - 1, 1, 1, "#fff"); }
    else R(x, ey - 1, 2, 2, dark);
  };
  eye(e1); eye(e2);
  if (L.glasses) { R(e1 - 1, ey - 2, 4, 1, dark); R(e2 - 1, ey - 2, 4, 1, dark); R(e1 + 3, ey - 1, e2 - e1 - 3, 1, dark); }
  // 입
  if (mood === "win") { R(14, 19, 4, 1, M); R(15, 20, 2, 1, M); R(fx + 1, 17, 2, 1, "#f29a9a"); R(fx + fw - 3, 17, 2, 1, "#f29a9a"); }
  else if (mood === "lose") { R(15, 19, 2, 1, M); R(14, 20, 1, 1, M); R(17, 20, 1, 1, M); }
  else if (mood === "tired") { R(15, 19, 2, 2, M); R(fx + fw + 1, 10, 1, 2, "#7fc8ff"); }
  else R(15, 20, 2, 1, M);
  // 헤드셋: 머리띠 + 귀 이어컵(밝은 테두리, 안쪽 팀색) + 마이크
  if (L.headset) {
    const k = "#2b2b38", kl = "#6c6c86", top = L.hs === 6 ? 2 : 4;
    R(fx, top, fw, 1, k); R(fx - 1, top + 1, 1, 1, k); R(fx + fw, top + 1, 1, 1, k); R(fx - 2, top + 2, 1, 12 - top, k); R(fx + fw + 1, top + 2, 1, 12 - top, k);
    R(fx - 4, 12, 4, 7, k); R(fx - 4, 12, 4, 1, kl); R(fx - 4, 12, 1, 7, kl); R(fx - 3, 14, 2, 3, c[0]);
    R(fx + fw, 12, 4, 7, k); R(fx + fw, 12, 4, 1, kl); R(fx + fw + 3, 12, 1, 7, kl); R(fx + fw + 1, 14, 2, 3, c[0]);
    R(fx - 1, 19, 1, 1, k); R(fx, 20, 3, 1, k); R(fx + 3, 20, 1, 1, "#ff3d71");
  }
}

// 그림 → data URL (캐시)
const PF_CACHE = {};
function portraitURL(look, uni, mood, face) {
  const key = JSON.stringify([look, uni, mood || "normal", !!face]);
  if (PF_CACHE[key] !== undefined) return PF_CACHE[key];
  let url = "";
  try {
    const cv = document.createElement("canvas");
    cv.width = 32; cv.height = 32;
    const g = cv.getContext && cv.getContext("2d");
    if (g) {
      drawPortrait32(g, look, uni, mood || "normal");
      if (face) { // 얼굴만: 머리~턱 18×18 (표에서 2배 = 36px로 선명하게)
        const c2 = document.createElement("canvas");
        c2.width = 18; c2.height = 18;
        c2.getContext("2d").drawImage(cv, 7, 5, 18, 18, 0, 0, 18, 18);
        url = c2.toDataURL();
      } else url = cv.toDataURL();
    }
  } catch (e) { url = ""; }
  PF_CACHE[key] = url;
  return url;
}
function portraitHTMLFrom(look, uni, opts) {
  opts = opts || {};
  const url = portraitURL(look, uni, opts.mood, opts.face);
  if (!url) return "";
  const size = opts.face ? (opts.size || 36) : 32 * Math.max(1, Math.min(3, opts.scale || 1));
  const img = '<img class="pf px' + (opts.face ? " pf-face" : "") + '" src="' + url + '" width="' + size + '" height="' + size + '" alt="">';
  return opts.jump ? '<span class="pf-jump">' + img + "</span>" : img;
}
function portraitImg(id, opts) {
  opts = Object.assign({}, opts);
  if (id === USER_ID && !opts.mood && !opts.face) opts.mood = myMood();
  return portraitHTMLFrom(lookOf(id), uniformOfTeam(opts.teamId !== undefined ? opts.teamId : teamIdOfPlayer(id)), opts);
}
// 표에 넣는 얼굴 칸
function faceTd(id) { return '<td class="pf-cell">' + portraitImg(id, { face: true, size: 36 }) + "</td>"; }

// ----- 가끔 점프 (크게 보이는 그림만) -----
(function () {
  if (typeof setInterval !== "function" || typeof document === "undefined" || !document.querySelectorAll) return;
  const J = PORTRAIT.jump;
  setInterval(function () {
    if (typeof motionOff === "function" && motionOff()) return; // 움직임 끄기 (디자인 D6)
    let list;
    try { list = document.querySelectorAll(".pf-jump"); } catch (e) { return; }
    const now = Date.now();
    Array.prototype.forEach.call(list, function (el) {
      if (!el._nj) el._nj = now + 600 + Math.random() * (J.maxGap - J.minGap);
      if (now < el._nj) return;
      el.style.setProperty("--jh", (J.minPx + Math.floor(Math.random() * (J.maxPx - J.minPx + 1))) + "px");
      el.classList.remove("jumping"); void el.offsetWidth; el.classList.add("jumping");
      el._nj = now + J.minGap + Math.random() * (J.maxGap - J.minGap);
    });
  }, 250);
})();
