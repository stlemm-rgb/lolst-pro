// ===== 이번 주 행동 그림 (시안 24, 2026-11-02) — 데이터는 data/room.js =====
// roomBlockHTML(경기 수) → 그림 + 아래 한 줄. 대시보드 '이번 주' 칸 맨 위 (js/dashboard.js weekCommandHTML)
// 장면 고르기: 이번 주 경기 있음 → 경기 준비(부스) / 휴식(휴식 훈련·이벤트로 쉬기) → 지금 사는 집 / 그 밖 → 훈련 방
// 그리는 법: 20장을 가로 띠 한 장으로 그려 캐시 → CSS steps로 넘김 (JS 타이머 없음). 움직임 끄기면 첫 장만.
// 게임 결과용 무작위(Math.random) 안 씀 — 같은 상황이면 언제나 같은 그림

const ROOM_CACHE = {};
let roomCacheSize = 0;

// ----- 색 -----
function roomRGB(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function roomShade(h, k) {
  return "#" + roomRGB(h).map(function (v) { v = Math.max(0, Math.min(255, Math.round(v * k))); return (v < 16 ? "0" : "") + v.toString(16); }).join("");
}
// 색 이름 → "#색": "wood1"(정리표) · "team0"/"team1"/"team0d"(팀 색) · { a, p, on }(깜빡임) · "#색"
function roomColor(c, cx) {
  if (c && typeof c === "object") { const on = c.on !== undefined ? c.on : c.p / 2; c = (cx.f % c.p) < on ? c.a[0] : c.a[1]; }
  if (typeof c !== "string" || c.charAt(0) === "#") return c;
  if (c === "team0") return cx.team[0];
  if (c === "team1") return cx.team[1];
  if (c === "team0d") return roomShade(cx.team[0], 0.5);
  if (c === "team0m") return roomShade(cx.team[0], 0.65);
  const m = /^([a-z]+)([0-9])$/.exec(c);
  if (!m || !ROOM_RAMP[m[1]]) return c;
  const r = ROOM_RAMP[m[1]].c;
  return r[Math.min(+m[2], r.length - 1)];
}
// 상자 세 면 색: 정리표 색이면 같은 묶음에서 한·두 단계 어둡게, 팀 색이면 어둡게 섞기
function roomFaces(c, cx) {
  const m = typeof c === "string" ? /^([a-z]+)([0-9])$/.exec(c) : null;
  if (m && ROOM_RAMP[m[1]]) {
    const r = ROOM_RAMP[m[1]].c, i = +m[2];
    const at = function (k) { return r[Math.min(k, r.length - 1)]; };
    return { top: at(i), left: at(i + 1), right: at(i + 2) };
  }
  const base = roomColor(c, cx);
  return { top: base, left: roomShade(base, 0.78), right: roomShade(base, 0.62) };
}

// ----- 픽셀 판 -----
function roomCanvas(w, h) { return { w: w, h: h, d: new Uint8ClampedArray(w * h * 4) }; }
function roomPx(rs, x, y, col) {
  x = Math.floor(x); y = Math.floor(y);
  if (!col || x < 0 || y < 0 || x >= rs.w || y >= rs.h) return;
  const c = roomRGB(col), i = (y * rs.w + x) * 4;
  rs.d[i] = c[0]; rs.d[i + 1] = c[1]; rs.d[i + 2] = c[2]; rs.d[i + 3] = 255;
}
// 다각형 칠하기 (픽셀 가운데가 안에 있으면 칠함 → 가장자리가 흐려지지 않음)
function roomPoly(rs, pts, col) {
  if (!col) return;
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  pts.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
  for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) {
    for (let x = Math.floor(minx); x <= Math.ceil(maxx); x++) {
      const cx = x + 0.5, cy = y + 0.5;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i], b = pts[j];
        if ((a[1] > cy) !== (b[1] > cy) && cx < (b[0] - a[0]) * (cy - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      if (inside) roomPx(rs, x, y, col);
    }
  }
}

// ----- 한 장 그리기 -----
function roomDrawFrame(scene, cx) {
  const R = ROOM_RULES, W = R.roomW, H = R.roomH;
  const rs = roomCanvas(R.w, R.h);
  const oy = H + 3, ox = W + 2 + Math.floor((R.w - (2 * W + 2)) / 2);
  const P = function (x, y, z) { return [ox + (x - y), oy + (x + y) / 2 - z]; };
  const col = function (c) { return roomColor(c, cx); };
  const box = function (x, y, z, w, d, h, c, o) {
    if (h <= 0) return;
    o = o || {};
    const fc = roomFaces(c, cx);
    roomPoly(rs, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], o.left ? col(o.left) : fc.left);
    roomPoly(rs, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], o.right ? col(o.right) : fc.right);
    roomPoly(rs, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], o.top ? col(o.top) : fc.top);
  };
  const wallL = function (y1, z1, y2, z2, c) { roomPoly(rs, [P(0, y1, z1), P(0, y2, z1), P(0, y2, z2), P(0, y1, z2)], col(c)); };
  const wallR = function (x1, z1, x2, z2, c) { roomPoly(rs, [P(x1, 0, z1), P(x2, 0, z1), P(x2, 0, z2), P(x1, 0, z2)], col(c)); };
  const sprite = function (spr, x, y, z, colors, still) {
    const p = P(x, y, z), rows = spr.rows, w = rows[0].length, h = rows.length;
    const bx = Math.round(p[0] - w / 2), by = Math.round(p[1]) - h;
    const up = still ? 0 : R.breath[cx.f], blink = cx.f === R.blinkAt;
    for (let r = 0; r < h; r++) {
      const lift = (up && r < spr.split) ? 1 : 0;
      for (let c = 0; c < w; c++) {
        let k = rows[r][c];
        if (k === ".") continue;
        if (k === "E" && blink) k = "S";
        roomPx(rs, bx + c, by + r - lift, colors[k]);
        if (lift && r === spr.split - 1) roomPx(rs, bx + c, by + r, colors[k]); // 숨 들이쉴 때 어깨 아래 틈 메우기
      }
    }
    return { x: bx, y: by, w: w };
  };

  // 방 바탕: 바닥 판 + 벽 2개(두께 2) + 걸레받이
  const pal = ROOM_PAL[scene.pal], wr = ROOM_RAMP[pal.wall].c, fr = ROOM_RAMP[pal.floor].c;
  const at = function (r, i) { return r[Math.min(i, r.length - 1)]; };
  box(0, 0, -3, W, W, 3, at(fr, pal.fi), { top: at(fr, pal.fi), left: pal.slab ? pal.slab[0] : at(fr, pal.fi + 2), right: pal.slab ? pal.slab[1] : at(fr, pal.fi + 3) });
  box(-2, -2, 0, 2, W + 2, H, at(wr, pal.wi + 1), { right: at(wr, pal.wi + 1), top: at(wr, 0), left: at(wr, pal.wi + 3) });
  box(0, -2, 0, W, 2, H, at(wr, pal.wi), { left: at(wr, pal.wi), top: at(wr, 0), right: at(wr, pal.wi + 3) });
  wallL(0, 0, W, 1, at(wr, pal.wi + 2)); wallR(0, 0, W, 1, at(wr, pal.wi + 2));

  let me = null;
  scene.ops.forEach(function (op) {
    const k = op[0];
    if (k === "floor") roomPoly(rs, [P(op[1], op[2], 0), P(op[3], op[2], 0), P(op[3], op[4], 0), P(op[1], op[4], 0)], col(op[5]));
    else if (k === "wallL") wallL(op[1], op[2], op[3], op[4], op[5]);
    else if (k === "wallR") wallR(op[1], op[2], op[3], op[4], op[5]);
    else if (k === "box") box(op[1], op[2], op[3], op[4], op[5], op[6], op[7], op[8]);
    else if (k === "breath") { if (R.breath[cx.f]) box(op[1], op[2], op[3], op[4], op[5], op[6], op[7]); }
    else if (k === "me") { if (!cx.empty) me = sprite(ROOM_SPRITES[op[1]], op[2], op[3], op[4], cx.me, op[5] && op[5].still); }
    else if (k === "trophies") {
      cx.trophies.slice(0, op[1].length).forEach(function (t, i) {
        const T = ROOM_TROPHIES[t], r = ROOM_RAMP[T.ramp].c, s = op[1][i];
        const a = sprite({ split: 0, rows: T.rows }, s[0], s[1], s[2], { A: r[0], B: r[1], C: r[r.length - 1] }, true);
        if ((cx.f + i * 3) % 10 === 0) roomPx(rs, a.x + Math.floor(a.w / 2), a.y - 1, "#ffffff"); // 반짝
      });
    } else if (k === "stars") op[1].forEach(function (s) { const q = P(s[0], 0, s[1]); roomPx(rs, q[0], q[1], col(op[2])); });
    else if (k === "skyline") {
      op[1].forEach(function (b, i) {
        wallR(b[0], b[1], b[2], b[3], i % 2 ? "metal1" : "metal2");
        for (let wx = b[0]; wx < b[2] - 0.5; wx += 1.5) {
          for (let wz = b[1] + 2; wz < b[3] - 1; wz += 2) {
            if (((wx * 7 + wz * 3 + i) | 0) % 4 === Math.floor(cx.f / 5) % 4) continue; // 창문 불이 하나씩 꺼졌다 켜짐
            const q = P(wx + 0.5, 0, wz); roomPx(rs, q[0], q[1], col("gold0"));
          }
        }
      });
    } else if (k === "led") {
      for (let z = op[3]; z < op[4]; z += 2) {
        const c = (Math.floor(z / 2) + cx.f % 10) % 5 === 0 ? "linen0" : (z % 4 === 1 ? "team0" : "team0m");
        wallR(op[1], z, op[2], z + 2, c);
      }
    } else if (k === "crowd") {
      for (let i = 0; i < op[1]; i++) {
        const y = 3 + (i * 7) % 30, z = 5 + (i * 5) % 13;
        if ((i + cx.f) % 3) wallL(y, z, y + 1, z + 1, ["neon1", "violet1", "gold1"][i % 3]);
      }
    } else if (k === "mates") {
      op[1].forEach(function (x, i) {
        const mid = Math.floor(op[1].length / 2);
        const colors = i === mid ? cx.me : cx.mates[i < mid ? i : i - 1];
        const keep = cx.f; cx.f = (keep + i * 4) % R.frames; // 숨쉬기를 서로 다르게
        const a = sprite(ROOM_SPRITES.front, x, op[2], op[3], colors);
        cx.f = keep;
        if (i === mid) me = a;
      });
    } else if (k === "monitors") op[1].forEach(function (x) { box(x - 2, 18, 7, 4, 1, 3, "metal4", { left: "metal3" }); });
    else if (k === "zz" && me) {
      const t = cx.f % 10, zc = col("linen1");
      [[0, 0], [3, -4], [6, -8]].forEach(function (o, i) {
        if ((t + i * 3) % 10 >= 7) return;
        const yy = me.y - 3 + o[1] - Math.floor(t / 3), xx = me.x + me.w + o[0];
        roomPx(rs, xx, yy, zc); roomPx(rs, xx + 1, yy, zc); roomPx(rs, xx + 1, yy + 1, zc); roomPx(rs, xx, yy + 2, zc); roomPx(rs, xx + 1, yy + 2, zc);
      });
    } else if (k === "mark" && me) {
      const y = me.y - 4 + (cx.f % 10 < 5 ? 0 : -1), x = me.x + Math.floor(me.w / 2), g = col("gold1");
      roomPx(rs, x - 1, y, g); roomPx(rs, x, y, g); roomPx(rs, x + 1, y, g); roomPx(rs, x, y + 1, g);
    }
  });
  return rs;
}

// ----- 20장 띠 → 그림 주소 (캐시) -----
function roomStripURL(key, cx) {
  const ck = JSON.stringify([key, cx.empty, cx.me, cx.team, cx.mates, cx.trophies]);
  if (ROOM_CACHE[ck] !== undefined) return ROOM_CACHE[ck];
  let url = "";
  try {
    const R = ROOM_RULES, cv = document.createElement("canvas");
    cv.width = R.w * R.frames; cv.height = R.h;
    const g = cv.getContext && cv.getContext("2d");
    if (g && typeof ImageData !== "undefined") {
      for (let f = 0; f < R.frames; f++) {
        cx.f = f;
        g.putImageData(new ImageData(roomDrawFrame(ROOM_SCENES[key], cx).d, R.w, R.h), f * R.w, 0);
      }
      url = cv.toDataURL();
    }
  } catch (e) { url = ""; }
  if (roomCacheSize > 40) { Object.keys(ROOM_CACHE).forEach(function (k) { delete ROOM_CACHE[k]; }); roomCacheSize = 0; }
  ROOM_CACHE[ck] = url; roomCacheSize++;
  return url;
}

// ----- 게임 상황 → 그림 재료 -----
function roomPersonColors(look, uni) {
  const P = PORTRAIT, skin = P.skins[look.skin] ? P.skins[look.skin].c : P.skins[0].c;
  const hair = P.hairColors[look.hairC] ? P.hairColors[look.hairC].c : P.hairColors[0].c;
  return { H: hair, S: skin, E: "#2a1717", D: roomShade(skin, 0.6), U: uni[0], V: uni[1], P: ROOM_RAMP.metal.c[2], K: ROOM_RAMP.metal.c[4] };
}
function roomHomeKey() { return ROOM_HOME[state.housing && state.housing.id] || ROOM_HOME.dorm; }
function roomSceneKey(matchCount) {
  if (matchCount > 0) return "match";
  if (state.skipTraining || state.plan === "rest") return roomHomeKey();
  return "train";
}
// 우승 트로피 (큰 대회부터, js/history_pages.js TROPHY_TYPES 순서)
function roomTrophyList() {
  const titles = careerSummary(true).titles, out = [];
  TROPHY_TYPES.forEach(function (t) { for (let i = 0; i < (titles[t.key] || 0); i++) out.push(t.key); });
  return out;
}
function roomContext(key) {
  const team = myTeam();
  const uni = uniformOfTeam(team ? team.id : null);
  const cx = { f: 0, empty: key === "train" && !state.plan, team: uni, me: roomPersonColors(lookOf(USER_ID), uni), mates: [], trophies: [] };
  if (key === "match" && team) {
    const s = starters(team.id);
    const ids = POSITION_IDS.map(function (pos) { return s[pos]; }).filter(function (id) { return id && id !== USER_ID; });
    while (ids.length < 4) ids.push("room-mate-" + ids.length);
    cx.mates = ids.slice(0, 4).map(function (id) { return roomPersonColors(lookOf(id), uni); });
  }
  if (key.indexOf("rest") === 0) cx.trophies = roomTrophyList();
  return cx;
}
function roomCaption(key, matchCount) {
  const t = state.plan ? findTraining(state.plan) : null;
  const tname = t ? t.name : "";
  let text;
  if (key === "match") text = ROOM_TEXT.match.replace("{n}", matchCount) + (t && state.plan !== "rest" ? " · 🏋️ " + tname : "");
  else if (key === "train") text = t ? ROOM_TEXT.train.replace("{training}", tname) : ROOM_TEXT.noPlan;
  else {
    const home = state.housing ? (SHOP_HOUSING.find(function (h) { return h.id === state.housing.id; }) || {}).name || "" : "";
    text = ROOM_TEXT.rest[key].replace("{home}", home.replace(/\s*\(.*\)$/, ""));
  }
  return state.week + "주차 · " + text;
}

// 대시보드에 넣는 덩어리: 그림 + 한 줄
function roomBlockHTML(matchCount) {
  const key = roomSceneKey(matchCount);
  const url = roomStripURL(key, roomContext(key));
  if (!url) return "";
  const R = ROOM_RULES, w = R.w * R.scale, h = R.h * R.scale;
  const caption = roomCaption(key, matchCount);
  return '<div class="room-block"><div class="room-pic" role="img" aria-label="' + escapeHTML(caption) + '" style="width:' + w + "px;height:" + h + "px;background-image:url(" + url + ");background-size:" + (w * R.frames) + "px " + h + "px;--room-end:-" + (w * R.frames) +
    "px;animation-duration:" + (R.frames * R.frameMs) + "ms;animation-timing-function:steps(" + R.frames + ')"></div>' +
    '<div class="room-cap">' + escapeHTML(caption) + "</div></div>";
}
