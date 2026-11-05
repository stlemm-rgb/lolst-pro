// ===== 307 사운드 엔진 (값·소리·곡: data/sound.js) =====
// 코드로 만든 8비트 소리 (Web Audio). 소리 기능이 없는 브라우저는 조용히 넘어감.
// 브라우저 규칙: 화면을 한 번 누른 뒤부터 소리가 남 → sndUnlock. 게임 결과와 상관없음 (게임 난수·state 안 건드림, 설정은 localStorage 따로).

let SND = null; // { ac, sfx(gain), music(gain), dry, conv, pad, noise, pulse{}, last{}, bgm{timer,step,next}, ducked }
let sndPrefsCache = null;
function sndPrefs() {
  if (sndPrefsCache) return sndPrefsCache;
  const R = SOUND_RULES, p = { sfxOn: R.sfxOn, sfxVol: R.sfxVol, bgmOn: R.bgmOn, bgmVol: R.bgmVol };
  try {
    const saved = JSON.parse(localStorage.getItem(R.storeKey) || "null");
    if (saved && typeof saved === "object") ["sfxOn", "bgmOn"].forEach(function (k) { if (typeof saved[k] === "boolean") p[k] = saved[k]; });
    if (saved && typeof saved === "object") ["sfxVol", "bgmVol"].forEach(function (k) { if (typeof saved[k] === "number") p[k] = Math.max(0, Math.min(100, saved[k])); });
  } catch (e) { /* 저장 못 읽어도 처음 값 */ }
  return (sndPrefsCache = p);
}
function sndSavePrefs() { try { localStorage.setItem(SOUND_RULES.storeKey, JSON.stringify(sndPrefs())); } catch (e) { /* 저장 칸 없음 */ } }

// 소리 장치: 화면을 처음 누를 때 만듦
function sndCtx() {
  if (SND) return SND.ac;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  let ac;
  try { ac = new AC(); } catch (e) { return null; }
  const R = SOUND_RULES;
  SND = { ac: ac, pulse: {}, last: {}, bgm: null, ducked: false };
  SND.sfx = ac.createGain(); SND.sfx.connect(ac.destination);
  SND.music = ac.createGain(); SND.music.connect(ac.destination);
  SND.dry = ac.createGain(); SND.dry.connect(SND.music);
  // 울림: 사라지는 잡음으로 만든 공간 (고정 씨앗 — 게임 난수 아님)
  const len = Math.floor(ac.sampleRate * 2.2), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); let s = 777 + c; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; ch[i] = (s / 1073741823.5 - 1) * Math.pow(1 - i / len, 3); } }
  SND.conv = ac.createConvolver(); SND.conv.buffer = ir;
  const wet = ac.createGain(); wet.gain.value = R.reverb; SND.conv.connect(wet); wet.connect(SND.music);
  SND.pad = ac.createGain(); SND.pad.connect(SND.dry); SND.pad.connect(SND.conv);
  const nlen = ac.sampleRate * 2; SND.noise = ac.createBuffer(1, nlen, ac.sampleRate);
  const nch = SND.noise.getChannelData(0); let s = 12345; for (let i = 0; i < nlen; i++) { s = (s * 16807) % 2147483647; nch[i] = s / 1073741823.5 - 1; }
  sndApplyVolume();
  return ac;
}
function sndApplyVolume() {
  if (!SND) return;
  const R = SOUND_RULES, p = sndPrefs();
  SND.sfx.gain.value = p.sfxOn ? p.sfxVol / 100 * R.sfxMax : 0;
  SND.music.gain.value = p.bgmOn ? p.bgmVol / 100 * R.bgmMax * (SND.ducked ? R.duck : 1) : 0;
}
function sndReady() { return !!(SND && SND.ac.state === "running"); }
function sndUnlock() {
  const ac = sndCtx();
  if (!ac) return;
  if (ac.state === "suspended" && !document.hidden) ac.resume().then(sndBgmAuto, function () {});
  else sndBgmAuto();
}
["pointerdown", "keydown", "touchend"].forEach(function (ev) { document.addEventListener(ev, sndUnlock, { capture: true, passive: true }); });
document.addEventListener("visibilitychange", function () { // 다른 탭으로 가면 음악·소리 멈춤
  if (!SND) return;
  if (document.hidden) SND.ac.suspend().catch(function () {}); else SND.ac.resume().then(sndBgmAuto, function () {});
});

// ----- 소리 조각 -----
function sndNote(name) {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) return 440;
  const idx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (idx - 9) / 12 + (Number(m[3]) - 4));
}
function sndPulse(duty) {
  if (SND.pulse[duty]) return SND.pulse[duty];
  const n = 64, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return (SND.pulse[duty] = SND.ac.createPeriodicWave(re, im));
}
// o: t 시작 · f · dur · duty|type · vol · to · att · rel · lp(+lpEnv) · det(겹친 소리 어긋남, 센트) · bus · wet(울림)
function sndTone(o) {
  const ac = SND.ac, t0 = o.t, d = o.dur, voices = o.det ? [-o.det, 0, o.det] : [0];
  const g = ac.createGain(), att = o.att || 0.005, v = o.vol / voices.length * (o.det ? 1.6 : 1);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + att);
  g.gain.setValueAtTime(v, t0 + Math.max(att, d * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (o.rel || 0));
  let head = g;
  if (o.lp) { const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2; f.frequency.setValueAtTime(o.lpEnv ? o.lp * 4 : o.lp, t0); if (o.lpEnv) f.frequency.exponentialRampToValueAtTime(o.lp, t0 + 0.18); g.connect(f); head = f; }
  head.connect(o.bus || SND.sfx); if (o.wet) head.connect(SND.conv);
  voices.forEach(function (cents) {
    const osc = ac.createOscillator();
    if (o.duty) osc.setPeriodicWave(sndPulse(o.duty)); else osc.type = o.type || "square";
    osc.frequency.setValueAtTime(o.f, t0); if (cents) osc.detune.value = cents;
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    osc.connect(g); osc.start(t0); osc.stop(t0 + d + (o.rel || 0) + 0.05);
  });
}
function sndNoise(o) {
  const ac = SND.ac, t0 = o.t, d = o.dur, src = ac.createBufferSource();
  src.buffer = SND.noise;
  const f = ac.createBiquadFilter(); f.type = o.hp ? "highpass" : o.bp ? "bandpass" : "lowpass"; f.frequency.setValueAtTime(o.hp || o.bp || o.lp || 2000, t0);
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t0 + d);
  const g = ac.createGain(), att = o.att || 0.002;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol, t0 + att); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(f); f.connect(g); g.connect(o.bus || SND.sfx); if (o.wet) g.connect(SND.conv);
  src.start(t0); src.stop(t0 + d + 0.02);
}

// ----- 효과음: sfx("click") 등 (data/sound.js SFX) -----
function sfx(id) {
  if (!sndReady() || !sndPrefs().sfxOn || !SFX[id]) return;
  const now = performance.now();
  if (SND.last[id] && now - SND.last[id] < SOUND_RULES.minGapMs) return;
  SND.last[id] = now;
  try {
    const t = SND.ac.currentTime + 0.01;
    SFX[id].forEach(function (p) {
      const base = Object.assign({}, p, { t: t + (p.at || 0) });
      if (p.noise) { sndNoise(base); return; }
      if (p.arp) { p.arp.forEach(function (n, i) { sndTone(Object.assign({}, base, { t: base.t + i * p.step, f: sndNote(n) })); }); return; }
      if (p.n) base.f = sndNote(p.n);
      sndTone(base);
    });
  } catch (e) { /* 소리는 실패해도 게임은 계속 */ }
}
function sfxLater(id, ms) { setTimeout(function () { sfx(id); }, ms); }

// ----- 배경 음악 (data/sound.js BGM, 소환 편곡) -----
function sndBgmAuto() { if (sndReady() && sndPrefs().bgmOn && !SND.bgm) sndBgmStart(BGM_DEFAULT); }
function sndBgmStart(key) {
  if (!sndReady()) return;
  sndBgmStop();
  const S = BGM[key];
  if (!S) return;
  const sd = 60 / S.bpm / 2;
  SND.pad.gain.cancelScheduledValues(0); SND.pad.gain.value = 1;
  const b = SND.bgm = { key: key, step: 0, next: SND.ac.currentTime + 0.1 };
  b.timer = setInterval(function () {
    if (SND.bgm !== b || SND.ac.state !== "running") return;
    while (b.next < SND.ac.currentTime + 0.15) {
      try { sndBgmStep(S, b.step, b.next, sd); } catch (e) { /* 한 칸 실패해도 계속 */ }
      b.step++; b.next += sd;
    }
  }, 25);
}
function sndBgmStop() { if (SND && SND.bgm) { clearInterval(SND.bgm.timer); SND.bgm = null; } }
function sndBgmStep(S, step, t, sd) {
  const bar = Math.floor(step / 8) % S.mel.length, i = step % 8, ch = S.chords[bar % 4], root = S.roots[bar % 4], M = SND.music;
  if (i === 0) ch.forEach(function (n) { sndTone({ t: t, f: sndNote(n + "4"), dur: sd * 7.8, type: "sawtooth", det: S.pad.det, att: 0.05, lp: S.pad.lp, vol: S.pad.vol, bus: SND.pad }); });
  if (i % 2 === 0) { // 4박 킥 + 펌핑
    sndTone({ t: t, f: 150, to: 42, dur: 0.16, type: "sine", vol: 0.7, bus: SND.dry });
    SND.pad.gain.cancelScheduledValues(t); SND.pad.gain.setValueAtTime(S.pump, t); SND.pad.gain.linearRampToValueAtTime(1, t + sd * 1.7);
  } else sndTone({ t: t, f: sndNote(root + "2"), dur: sd * 0.8, type: "sawtooth", lp: 500, lpEnv: true, vol: 0.28, bus: SND.dry }); // 엇박 베이스
  if (S.claps.indexOf(i) !== -1) { sndNoise({ t: t, dur: 0.14, bp: 1500, vol: 0.28, bus: SND.dry }); sndNoise({ t: t + 0.012, dur: 0.12, bp: 2200, vol: 0.18, bus: SND.dry }); }
  sndNoise({ t: t + sd / 2, dur: 0.03, hp: 8000, vol: 0.06, bus: SND.dry });
  sndTone({ t: t, f: sndNote(ch[i % 3] + "6"), dur: sd * 0.4, duty: 0.125, vol: 0.05, bus: SND.dry });
  sndTone({ t: t + sd / 2, f: sndNote(ch[(i + 1) % 3] + "5"), dur: sd * 0.4, duty: 0.125, vol: 0.05, bus: SND.dry });
  if (bar === S.riserBar && i === 0) sndNoise({ t: t, dur: sd * 8, hp: 400, sweep: 9000, att: sd * 7.5, vol: 0.16, bus: SND.dry });
  if (bar === 0 && i === 0) sndNoise({ t: t, dur: 1.4, hp: 5000, vol: 0.13, bus: SND.dry, wet: true });
  const mel = S.mel[bar].split(" ");
  if (mel[i] !== "-" && mel[i] !== ".") {
    let n = 1; while (mel[i + n] === "-") n++;
    sndTone({ t: t, f: sndNote(mel[i]), dur: sd * n * 0.92, duty: S.lead.duty, vol: S.lead.vol, det: S.lead.det, bus: SND.dry });
  }
  return M;
}
// 경기 재생 중엔 음악을 작게
function sndDuck(on) { if (!SND) return; SND.ducked = !!on; sndApplyVolume(); }

// ----- 버튼 누르는 소리 (다음 주 진행 버튼은 따로 'next') -----
document.addEventListener("click", function (e) {
  const el = e.target && e.target.closest ? e.target.closest("button, summary, [data-go], .menu-item, .mnav a, .mnav button") : null;
  if (!el || el.disabled) return;
  if (el.closest("#next-week, [data-dashgo], .mnav-go")) return;
  sfx("click");
}, true);

// ----- [설정] 화면 -----
function soundSettingsHTML() {
  const p = sndPrefs(), T = SOUND_TEXT;
  const row = function (key, name, test) {
    return '<div class="setting-row snd-row"><label><input type="checkbox" data-snd-on="' + key + '"' + (p[key + "On"] ? " checked" : "") + "> " + escapeHTML(name) + "</label>" +
      ' <input type="range" min="0" max="100" step="5" value="' + p[key + "Vol"] + '" data-snd-vol="' + key + '"> <span class="muted small" data-snd-val="' + key + '">' + p[key + "Vol"] + "</span>" +
      ' <button data-snd-test="' + test + '">' + escapeHTML(T.test) + "</button></div>";
  };
  return "<h3>" + escapeHTML(T.title) + "</h3>" + row("sfx", T.sfx, "great") + row("bgm", T.bgm, "bgm") + '<div class="muted small">' + escapeHTML(T.note) + "</div>";
}
function bindSoundSettings(page) {
  const p = sndPrefs();
  page.querySelectorAll("[data-snd-on]").forEach(function (el) {
    el.onchange = function () {
      const k = el.getAttribute("data-snd-on");
      p[k + "On"] = el.checked; sndSavePrefs(); sndUnlock(); sndApplyVolume();
      if (k === "bgm") { if (el.checked) sndBgmAuto(); else sndBgmStop(); }
    };
  });
  page.querySelectorAll("[data-snd-vol]").forEach(function (el) {
    el.oninput = function () {
      const k = el.getAttribute("data-snd-vol"), lab = page.querySelector('[data-snd-val="' + k + '"]');
      p[k + "Vol"] = Number(el.value); if (lab) lab.textContent = el.value; sndApplyVolume();
    };
    el.onchange = sndSavePrefs;
  });
  page.querySelectorAll("[data-snd-test]").forEach(function (el) {
    el.onclick = function () { sndUnlock(); const w = el.getAttribute("data-snd-test"); if (w === "bgm") sndBgmAuto(); else setTimeout(function () { sfx(w); }, 30); };
  });
}
