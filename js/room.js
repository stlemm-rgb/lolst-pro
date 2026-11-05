// ===== 이번 주 행동 그림 (시안 24, 2026-11-02) — 데이터는 data/room.js =====
// roomBlockHTML(경기 수) → 그림 + 아래 한 줄. 대시보드 이번 주 칸 (js/dash_layout.js)
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

// 동작 바꿔 끼우기 (요약 창, 시안 27): cx.pose = function(이름, 누구(-1 = 나), 장) → 그림 또는 없음(원래 그림). 대시보드는 cx.pose 없음 = 그대로
function roomSpr(name, cx, who) {
  const p = cx.pose && cx.pose(name, who, cx.f);
  return p || ROOM_SPRITES[name];
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
    else if (k === "me") { if (!cx.empty) me = sprite(roomSpr(op[1], cx, -1), op[2], op[3], op[4], cx.me, op[5] && op[5].still); }
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
        const a = sprite(roomSpr("front", cx, i === mid ? -1 : i), x, op[2], op[3], colors);
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
  // 😂 지난주 해프닝 소품 (234, data/room.js ROOM_PROPS) — 바닥 빈자리에 맨 나중에
  const pr = cx.prop && ROOM_PROPS[cx.prop], spot = cx.spot;
  if (pr && spot) {
    (pr.boxes || []).forEach(function (b) { box(spot[0] + b[0], spot[1] + b[1], b[2], b[3], b[4], b[5], b[6], b[7]); });
    if (pr.sprite) sprite({ split: 0, rows: pr.alt && cx.f % 10 >= 5 ? pr.alt : pr.sprite }, spot[0] + pr.at[0], spot[1] + pr.at[1], pr.at[2], pr.colors, true);
    if (pr.steam) {
      const q = P(spot[0] + 1.5, spot[1] + 1.5, 3), st = col("linen0");
      [0, 1, 2].forEach(function (i) { const t = (cx.f + i * 3) % 9; if (t < 6) roomPx(rs, q[0] + (i - 1) * 2 + (t % 2), q[1] - 1 - t, st); });
    }
  }
  return rs;
}

// ----- 20장 띠 → 그림 주소 (캐시) -----
function roomStripURL(key, cx) {
  const ck = JSON.stringify([key, cx.empty, cx.me, cx.team, cx.mates, cx.trophies, cx.prop || ""]);
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
  // 😂 지난주 해프닝에 소품이 있으면 (js/sns_page.js mishapAt, 게임을 한 주라도 진행한 뒤에만)
  const mh = key !== "match" && socialPosts().length ? mishapAt(absWeek() - 1) : null;
  if (mh && mh.prop && ROOM_PROP_SPOT[key]) { cx.prop = mh.prop; cx.spot = ROOM_PROP_SPOT[key]; }
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

// 방 그림의 작은 내 캐릭터만 (휴대폰 SNS 프로필, js/sns_page.js) — k배로 키운 <img>
function roomFigureHTML(k) {
  const team = myTeam(), uni = uniformOfTeam(team ? team.id : null);
  const colors = roomPersonColors(lookOf(USER_ID), uni), spr = ROOM_SPRITES.front;
  const ck = JSON.stringify(["figure", colors]);
  let url = ROOM_CACHE[ck];
  if (url === undefined) {
    url = "";
    try {
      const w = spr.rows[0].length + 2, h = spr.rows.length + 2, rs = roomCanvas(w, h);
      spr.rows.forEach(function (row, r) { row.split("").forEach(function (c, i) { if (c !== ".") roomPx(rs, i + 1, r + 1, colors[c]); }); });
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").putImageData(new ImageData(rs.d, w, h), 0, 0);
      url = cv.toDataURL();
    } catch (e) { url = ""; }
    ROOM_CACHE[ck] = url; roomCacheSize++;
  }
  if (!url) return "";
  return '<img class="px room-fig" src="' + url + '" width="' + (spr.rows[0].length + 2) * k + '" height="' + (spr.rows.length + 2) * k + '" alt="">';
}

// 대시보드에 넣는 덩어리: 그림 + 한 줄 (capHTML을 주면 그림 아래 줄을 그것으로 — 236: 휴대폰은 솔로 랭크, false면 줄 없음 — 276: PC는 옆 칸에 주차·훈련이 있어서)
function roomBlockHTML(matchCount, capHTML) {
  const key = roomSceneKey(matchCount);
  const url = roomStripURL(key, roomContext(key));
  if (!url) return "";
  const R = ROOM_RULES, w = R.w * R.scale, h = R.h * R.scale;
  const caption = roomCaption(key, matchCount);
  return '<div class="room-block"><div class="room-pic" role="img" aria-label="' + escapeHTML(caption) + '" style="width:' + w + "px;height:" + h + "px;background-image:url(" + url + ");background-size:" + (w * R.frames) + "px " + h + "px;--room-end:-" + (w * R.frames) +
    "px;animation-duration:" + (R.frames * R.frameMs) + "ms;animation-timing-function:steps(" + R.frames + ')"></div>' +
    (capHTML === false ? "" : '<div class="room-cap">' + (capHTML || escapeHTML(caption)) + "</div>") + "</div>";
}

// ===== 이번 주 요약 창 그림 (시안 27, 2026-11-04) — 데이터: data/room.js ROOM_POSES · ROOM_FX · ROOM_FONT =====
// 지난주에 한 일 → 장면: 우승(무대 불꽃 / 국제 대회 클로즈업) > 경기(마지막 경기 승·패) > 휴식·재활(집) > 훈련(대성공이면 불꽃 빛)
// 게임 결과용 무작위 안 씀 — 색종이·불꽃은 자리·장 번호로 정함 (같은 상황 = 같은 그림)
function roomWeekKind(r) {
  if (r.title) return ROOM_FX.bigTitles.indexOf(r.title.key) !== -1 ? "titleBig" : "titleLeague";
  const lines = r.teamLines || [];
  if (lines.length) return lines[lines.length - 1].won ? "win" : "lose";
  if (r.training && (r.training.id === "rest" || r.training.id === "rehab")) return "rest";
  return r.great ? "great" : "train";
}
function roomWHash(i, k) { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); }
function roomWIso(x, y, z) {
  const R = ROOM_RULES, W = R.roomW, oy = R.roomH + 3, ox = W + 2 + Math.floor((R.w - (2 * W + 2)) / 2);
  return [ox + (x - y), oy + (x + y) / 2 - z];
}
// 도트 그림 붙이기 (k배), 아래 가운데 = (bx, by)
function roomWBlit(rs, spr, bx, by, colors, k, lift) {
  const rows = spr.rows, w = rows[0].length, h = rows.length, x0 = Math.round(bx - w * k / 2), y0 = Math.round(by - h * k) - (lift || 0);
  rows.forEach(function (row, ry) {
    row.split("").forEach(function (ch, rx) {
      if (ch === "." || !colors[ch]) return;
      for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) roomPx(rs, x0 + rx * k + a, y0 + ry * k + b, colors[ch]);
    });
  });
}
function roomWConfetti(rs, f, n, seed, cx) {
  const H = rs.h + 8, F = ROOM_RULES.frames, cols = ROOM_FX.confetti.map(function (c) { return roomColor(c, cx); });
  for (let i = 0; i < n; i++) {
    const x = Math.floor(roomWHash(i, seed) * rs.w + Math.sin((f / F) * 6.283 + i) * 2), sp = 1 + Math.floor(roomWHash(i, seed + 1) * 3);
    const y = Math.floor((roomWHash(i, seed + 2) * H + f * sp * H / F) % H) - 4, c = cols[i % cols.length];
    roomPx(rs, x, y, c);
    if ((f + i) % 3) roomPx(rs, x + 1, y, c); else roomPx(rs, x, y + 1, c);
  }
}
function roomWPyro(rs, x, by, f, ph) {
  const cols = ROOM_FX.pyro, hgt = 10 + Math.round(6 * Math.abs(Math.sin((f + ph) * 0.9)));
  for (let y = 0; y < hgt; y++) {
    const w = y < 3 ? 2 : 1, c = cols[Math.min(cols.length - 1, Math.floor(y / hgt * cols.length))];
    for (let d = -w; d <= w; d++) if (d === 0 || roomWHash(x * 31 + y + d, f) > 0.25) roomPx(rs, x + d, by - y, c);
  }
  for (let i = 0; i < 4; i++) roomPx(rs, x + Math.round((roomWHash(i, f + ph) - 0.5) * 8), by - hgt - 1 - Math.floor(roomWHash(i + 9, f + ph) * 5), cols[i % 3]);
}
function roomWWord(rs, y, f) {
  const str = ROOM_FX.word.split(""), ws = str.map(function (ch) { return ROOM_FONT[ch][0].length; });
  let x0 = Math.floor((rs.w - ws.reduce(function (a, b) { return a + b + 1; }, -1)) / 2);
  str.forEach(function (ch, i) {
    ROOM_FONT[ch].forEach(function (row, ry) {
      row.split("").forEach(function (c, rx) {
        if (c !== "#") return;
        roomPx(rs, x0 + rx + 1, y + ry + 1, ROOM_FX.wordShadow);
        roomPx(rs, x0 + rx, y + ry, (f % 10) === i ? "#ffffff" : ROOM_FX.wordRamp[ry]);
      });
    });
    x0 += ws[i] + 1;
  });
}
// 대성공: 캐릭터 둘레 1칸에 불꽃 점 (내가 없는 그림과 비교해 캐릭터 자리를 찾음)
function roomWFire(rs, empty, f) {
  const W = rs.w, H = rs.h, me = new Uint8Array(W * H), cols = ROOM_FX.fire.map(roomRGB);
  for (let i = 0; i < W * H; i++) { const j = i * 4; if (rs.d[j] !== empty.d[j] || rs.d[j + 1] !== empty.d[j + 1] || rs.d[j + 2] !== empty.d[j + 2]) me[i] = 1; }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (me[i] || !(me[i - 1] || me[i + 1] || me[i - W] || me[i + W] || me[i + W - 1] || me[i + W + 1]) || (x * 7 + y * 3 + f) % 4 === 0) continue;
    const up = me[i + W] || me[i + W - 1] || me[i + W + 1], c = cols[(x + y + f) % cols.length], j = i * 4;
    rs.d[j] = c[0]; rs.d[j + 1] = up ? Math.min(255, c[1] + 40) : c[1]; rs.d[j + 2] = c[2]; rs.d[j + 3] = 255;
    if (up && (x + f) % 5 === 0 && y > 2) { const k = (i - 2 * W) * 4; rs.d[k] = 255; rs.d[k + 1] = 220; rs.d[k + 2] = 90; rs.d[k + 3] = 255; }
  }
}
// 국제 대회 우승: 금빛 햇살 줄기 + 크게 그린 나
function roomWCloseup(cx, f) {
  const R = ROOM_RULES, X = ROOM_FX, rs = roomCanvas(R.w, R.h), c0 = [R.w / 2, R.h * 0.6], step = Math.PI * 2 / X.rays.n;
  for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
    const a = Math.atan2(y - c0[1], x - c0[0]) + f * (Math.PI * 2 * X.rays.turn) / R.frames;
    const ray = ((Math.floor((a + 2 * Math.PI) / step) % 2) + 2) % 2, base = ray ? X.rays.light : X.rays.dark;
    const fade = Math.max(0.25, 1 - Math.hypot(x - c0[0], (y - c0[1]) * 1.3) / 70), j = (y * R.w + x) * 4;
    rs.d[j] = base[0] * fade + 20; rs.d[j + 1] = base[1] * fade + 10; rs.d[j + 2] = base[2] * fade + 30; rs.d[j + 3] = 255;
  }
  const fy = R.h - 4;
  for (let x = 0; x < R.w; x++) for (let y = fy; y < R.h; y++) roomPx(rs, x, y, y === fy ? X.floor[0] : X.floor[1]);
  roomWBlit(rs, roomWTrophy(f), R.w / 2, fy, cx.me, X.closeScale, R.breath[f] ? 1 : 0);
  for (let i = 0; i < 10; i++) { // 반짝이 별
    const t = (f + i * 2) % 10;
    if (t > 4) continue;
    const x = Math.floor(roomWHash(i, 3) * (R.w - 6)) + 3, y = Math.floor(roomWHash(i, 4) * 44) + 9, r = t < 3 ? t : 4 - t;
    roomPx(rs, x, y, "#ffffff");
    for (let d = 1; d <= r; d++) { roomPx(rs, x + d, y, "#fff4bc"); roomPx(rs, x - d, y, "#fff4bc"); roomPx(rs, x, y + d, "#fff4bc"); roomPx(rs, x, y - d, "#fff4bc"); }
  }
  roomWConfetti(rs, f, X.confettiN.big, 11, cx);
  roomWWord(rs, 1, f);
  return rs;
}
function roomWTrophy(f) { return f % (ROOM_FX.trophyBlink * 2) < ROOM_FX.trophyBlink ? ROOM_POSES.trophyA : ROOM_POSES.trophyB; }

// 요약 창 그림 띠 (20장) → 그림 주소. kind = roomWeekKind 값
function roomWeekStripURL(kind) {
  const key = kind === "rest" ? roomHomeKey() : (kind === "train" || kind === "great") ? "train" : "match";
  const cx = roomContext(key);
  cx.empty = false;
  cx.me = Object.assign({}, cx.me, ROOM_FX.trophyColors);
  if (kind === "train" || kind === "great") cx.pose = function (name, who, f) { return name === "sitL" ? (f % (ROOM_FX.typeEvery * 2) < ROOM_FX.typeEvery ? ROOM_POSES.typeA : ROOM_POSES.typeB) : null; };
  if (kind === "win") cx.pose = function (name) { return name === "front" ? ROOM_POSES.cheer : null; };
  if (kind === "lose") cx.pose = function (name) { return name === "front" ? ROOM_POSES.slump : null; };
  if (kind === "titleLeague") cx.pose = function (name, who, f) { return name === "front" ? (who === -1 ? roomWTrophy(f) : ROOM_POSES.cheer) : null; };
  const ck = JSON.stringify(["week", kind, key, cx.me, cx.team, cx.mates, cx.trophies, cx.prop || ""]);
  if (ROOM_CACHE[ck] !== undefined) return ROOM_CACHE[ck];
  let url = "";
  try {
    const R = ROOM_RULES, cv = document.createElement("canvas");
    cv.width = R.w * R.frames; cv.height = R.h;
    const g = cv.getContext && cv.getContext("2d");
    if (g && typeof ImageData !== "undefined") {
      for (let f = 0; f < R.frames; f++) {
        cx.f = f;
        let rs;
        if (kind === "titleBig") rs = roomWCloseup(cx, f);
        else {
          rs = roomDrawFrame(ROOM_SCENES[key], cx);
          if (kind === "great") roomWFire(rs, roomDrawFrame(ROOM_SCENES[key], Object.assign({}, cx, { empty: true })), f);
          if (kind === "lose") for (let i = 0; i < rs.d.length; i += 4) { rs.d[i] *= ROOM_FX.loseDim[0]; rs.d[i + 1] *= ROOM_FX.loseDim[1]; rs.d[i + 2] *= ROOM_FX.loseDim[2]; }
          if (kind === "titleLeague") {
            ROOM_FX.pyroAt.forEach(function (p, i) { const q = roomWIso(p[0], p[1], 0); roomWPyro(rs, q[0] + (i ? -2 : 2), q[1] - 1, f, i * 3); });
            roomWConfetti(rs, f, ROOM_FX.confettiN.league, 1, cx);
            roomWWord(rs, 3, f);
          }
        }
        g.putImageData(new ImageData(rs.d, R.w, R.h), f * R.w, 0);
      }
      url = cv.toDataURL();
    }
  } catch (e) { url = ""; }
  if (roomCacheSize > 40) { Object.keys(ROOM_CACHE).forEach(function (k) { delete ROOM_CACHE[k]; }); roomCacheSize = 0; }
  ROOM_CACHE[ck] = url; roomCacheSize++;
  return url;
}
