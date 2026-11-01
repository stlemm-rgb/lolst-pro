// ===== 이번 주 행동 그림 데이터 (시안 24, 2026-11-02) — 그리는 코드는 js/room.js =====
// 아이소메트릭(비스듬히 내려다본) 픽셀 방. 96×64 픽셀을 3배로 키워 288×192로 보여 줌.
// 좌표는 '칸': 방 바닥 36×36, 벽 높이 21. x = 오른쪽 아래로, y = 왼쪽 아래로, z = 위로.
//   오른쪽 벽 = y 0 면(wallR: x1,z1,x2,z2), 왼쪽 벽 = x 0 면(wallL: y1,z1,y2,z2)

const ROOM_RULES = {
  w: 96, h: 64,          // 그림 크기 (픽셀)
  roomW: 36, roomH: 21,  // 방 바닥 한 변 · 벽 높이 (칸)
  scale: 3,              // 화면에서 몇 배로 (정수만: 도트가 뭉개지지 않게)
  frames: 20, frameMs: 200,                                  // 20장 × 0.2초 = 4초 반복
  breath: [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1],        // 1 = 숨 들이쉼 (어깨·머리 1칸 위)
  blinkAt: 12,                                               // 이 장에서 눈 감음 (4초에 한 번)
};

// ----- 색 정리표: 묶음마다 밝은 → 어두운. 상자 윗면 = 고른 단계, 왼면 +1, 오른면 +2 -----
// 장면에서 "wood1"처럼 '묶음 이름 + 단계'로 씀. team0·team1 = 우리 팀 유니폼 색, team0d = 팀 색 어둡게
const ROOM_RAMP = {
  wall:   { name: "벽",       use: "방 벽",                       c: ["#aba3cf", "#8b83b4", "#6f6797", "#554e7a", "#3d375c", "#2a2642"] },
  floor:  { name: "바닥",     use: "바닥 판·판 옆면",             c: ["#86bdb0", "#67a095", "#4f827b", "#3a6461", "#284847", "#1a3132"] },
  wood:   { name: "나무",     use: "책상·선반·침대 틀·아파트 바닥", c: ["#dcab7a", "#b9875b", "#936645", "#6e4a33", "#4c3223"] },
  cloth:  { name: "천·러그",  use: "러그·쿠션",                   c: ["#cdbbef", "#ad97da", "#8b75bd", "#6b549b", "#4c3b74"] },
  linen:  { name: "흰 천",    use: "매트리스·베개·창틀",          c: ["#f7f4fc", "#e0dbf0", "#bdb6d7", "#948db3", "#6e6890"] },
  metal:  { name: "금속",     use: "모니터·의자·2층 침대·바지",   c: ["#62627e", "#4a4a64", "#36364d", "#25253a", "#171724"] },
  leaf:   { name: "잎",       use: "화분",                        c: ["#9fd98e", "#6fb874", "#4b8f58", "#326a42", "#22492f"] },
  day:    { name: "낮 창",    use: "훈련 방 창밖",                c: ["#c8edff", "#98d7f7", "#6bb7e2", "#4b8fbf"] },
  sky:    { name: "밤 창",    use: "휴식 방 창밖",                c: ["#56689f", "#3c4c86", "#2a3769", "#1c264d"] },
  neon:   { name: "네온",     use: "모니터 빛·무대 테두리·LCK 컵", c: ["#8af4ff", "#00e0ff", "#00acc9", "#007d94"] },
  violet: { name: "보라 네온", use: "둘째 모니터·관중 불빛·First Stand", c: ["#dba4ff", "#b44dff", "#8c33d4", "#6422a3"] },
  silver: { name: "은",       use: "월드 트로피·달",              c: ["#ffffff", "#d3d7e6", "#a3a8bf", "#6f7590"] },
  gold:   { name: "금",       use: "MSI·리그 트로피·별·내 표시",  c: ["#fff0a0", "#ffd23f", "#dba92b", "#a97c1d"] },
  rose:   { name: "분홍",     use: "의자·커튼·빈백",              c: ["#ffa6c9", "#e9789f", "#c3577f", "#913f5f"] },
  stage:  { name: "무대",     use: "경기장 벽·바닥",              c: ["#3a3a63", "#2a2a50", "#1e1e3c", "#14142a", "#0c0c1a"] },
};

// ----- 방 종류: 벽·바닥 묶음과 시작 단계 -----
const ROOM_PAL = {
  day:   { wall: "wall",  wi: 1, floor: "floor", fi: 1 },
  night: { wall: "wall",  wi: 2, floor: "floor", fi: 2 },
  apt:   { wall: "wall",  wi: 1, floor: "wood",  fi: 2 },
  stage: { wall: "stage", wi: 2, floor: "stage", fi: 1, slab: ["neon1", "neon2"] },
};

// ----- 사람: H 머리 S 피부 E 눈 D 감은 눈 U 유니폼 V 유니폼 둘째 색 P 바지 K 신발 -----
// split = 숨쉴 때 위로 1칸 움직이는 줄 수 (머리·어깨만, 엉덩이·발은 그대로)
const ROOM_SPRITES = {
  front: { split: 6, rows: [".HHHH.", ".HSSH.", ".ESSE.", ".SSSS.", "UUUUUU", "SUVVUS", "SUUUUS", ".UUUU.", ".PPPP.", ".P..P.", ".K..K."] },
  sitL:  { split: 6, rows: ["..HHHH.", "..ESHH.", "..SSSH.", "..SSS..", "..UUUU.", "SSUVUU.", "..UVUU.", "..UUUU.", "PPPPP..", "P...P..", "K...K.."] },
  lie:   { split: 0, rows: ["HHHH", "DSSD", "SSSS"] },
};

// ----- 트로피 (대회 key = js/history_pages.js TROPHY_TYPES). A 밝은 B 중간 C 받침 -----
const ROOM_TROPHIES = {
  worlds:     { ramp: "silver", rows: [".A.", "ABA", "ABA", ".B.", ".B.", "CCC"] },
  msi:        { ramp: "gold",   rows: ["ABA", "ABA", ".B.", "CCC"] },
  firststand: { ramp: "violet", rows: [".A.", "ABA", ".B.", "CCC"] },
  playoffs:   { ramp: "gold",   rows: ["ABA", ".B.", "CCC"] },
  cup:        { ramp: "neon",   rows: ["AB", "CC"] },
};

// ----- 집 → 휴식 장면 (data/shop.js SHOP_HOUSING id, 합숙 = null) -----
const ROOM_HOME = { dorm: "restDorm", oneroom: "restRoom", tworoom: "restRoom", apt: "restApt", luxury: "restApt", penthouse: "restApt" };

// ----- 장면: 그리는 순서대로 (뒤에 있는 것 먼저) -----
// 색 자리에 { a: [색1, 색2], p: 주기(장), on: 색1 장 수 } = 깜빡이는 색
// 명령: floor · wallL · wallR · box(opts: top/left/right) · breath(숨 들이쉴 때만 그리는 상자) · me(자세, x,y,z, {still: 숨쉬기 없음})
//       trophies(놓을 자리 목록) · stars(창 별 [x,z]) · skyline(건물 [x1,z1,x2,z2]) · led(오른쪽 벽 LED) · crowd(왼쪽 벽 관중 불빛)
//       mates(부스 5자리 x 목록, y, z — 가운데가 나) · monitors(x 목록) · zz(잠 Z) · mark(내 머리 위 ▼)
const ROOM_SCENES = {
  train: { name: "훈련", pal: "day", ops: [
    ["floor", 8, 12, 28, 30, "cloth3"], ["floor", 9, 13, 27, 29, "cloth2"],
    ["wallR", 19, 7, 32, 17, "linen1"], ["wallR", 20, 8, 31, 16, { a: ["day1", "day0"], p: 10 }], ["wallR", 25, 8, 26, 16, "linen1"], ["wallR", 20, 12, 31, 13, "linen1"],
    ["wallL", 4, 8, 11, 16, "team0"], ["wallL", 5, 9, 10, 10, "team1"], ["wallL", 5, 13, 10, 14, "team1"],
    ["box", 28, 2, 0, 6, 5, 11, "wood2"], ["box", 28, 2, 6, 6, 5, 1, "wood1"],
    ["box", 29, 3, 11, 1, 2, 2, "rose1"], ["box", 30, 3, 11, 1, 2, 3, "neon2"], ["box", 31, 3, 11, 1, 2, 2, "cloth1"],
    ["box", 0, 9, 0, 9, 17, 8, "wood1"],
    ["box", 1, 11, 8, 2, 6, 7, "metal2", { right: { a: ["neon1", "neon0"], p: 4 } }],
    ["box", 1, 19, 8, 2, 6, 7, "metal2", { right: { a: ["violet1", "violet0"], p: 6 } }],
    ["box", 5, 13, 8, 2, 10, 1, "metal1"],
    ["box", 30, 28, 0, 3, 3, 3, "wood2"], ["box", 30, 28, 3, 3, 3, 4, "leaf1"],
    ["box", 12, 14, 0, 6, 7, 4, "rose2"],
    ["me", "sitL", 12, 18, 3],
    ["box", 17, 14, 4, 2, 7, 8, "metal2", { top: "team0" }],
  ] },
  match: { name: "경기 준비", pal: "stage", ops: [
    ["led", 2, 34, 3, 20], ["crowd", 14],
    ["floor", 4, 6, 34, 30, "stage0"],
    ["mates", [7, 13, 19, 25, 31], 13, 2],
    ["monitors", [7, 13, 19, 25, 31]],
    ["box", 4, 18, 0, 30, 5, 7, "stage0", { left: "team0" }],
    ["box", 4, 22, 0, 30, 1, 1, "neon1"],
    ["mark"],
  ] },
  restDorm: { name: "합숙소", pal: "night", ops: [
    ["floor", 10, 10, 26, 34, "cloth4"],
    ["wallR", 14, 9, 22, 17, "linen2"], ["wallR", 15, 10, 21, 16, "sky2"],
    ["box", 24, 0, 0, 12, 4, 16, "team0"], ["box", 24, 3, 0, 12, 1, 16, "team0d"],
    ["trophies", [[26, 1.5, 16], [28.5, 1.5, 16], [31, 1.5, 16], [33.5, 1.5, 16]]],
    ["box", 0, 6, 0, 10, 18, 3, "metal1"], ["box", 0, 6, 3, 10, 18, 1, "linen2"], ["box", 1, 7, 4, 7, 3, 1, "linen1"],
    ["box", 9, 6, 0, 1, 1, 14, "metal3"], ["box", 9, 23, 0, 1, 1, 14, "metal3"],
    ["box", 0, 6, 10, 10, 18, 2, "metal1"], ["box", 0, 6, 12, 10, 18, 1, "linen1"], ["box", 1, 7, 13, 7, 3, 1, "linen0"],
    ["me", "lie", 4, 10, 14, { still: true }],
    ["box", 1, 11, 13, 8, 12, 1, "team0"], ["breath", 3, 14, 14, 4, 6, 1, "team0"],
    ["box", 20, 24, 0, 6, 6, 3, "metal2"],
    ["zz"],
  ] },
  restRoom: { name: "원룸·투룸", pal: "night", ops: [
    ["floor", 14, 12, 32, 30, "cloth3"], ["floor", 15, 13, 31, 29, "cloth2"],
    ["wallR", 6, 7, 18, 17, "linen2"], ["wallR", 7, 8, 17, 16, "sky2"], ["stars", [[9, 14], [12, 10], [15, 13], [10, 9]], "gold0"],
    ["wallR", 4, 6, 7, 18, "rose1"], ["wallR", 17, 6, 19, 18, "rose2"],
    ["wallL", 4, 9, 11, 16, "team0"], ["wallL", 5, 10, 10, 11, "team1"],
    ["box", 22, 0, 0, 9, 6, 7, "wood2"], ["box", 24, 1, 7, 4, 3, 1, "metal2", { top: { a: ["neon1", "neon0"], p: 6 } }],
    ["box", 21, 0, 11, 12, 3, 1, "wood1"],
    ["trophies", [[23, 1.5, 12], [25.5, 1.5, 12], [28, 1.5, 12], [30.5, 1.5, 12]]],
    ["box", 0, 13, 0, 12, 21, 4, "wood3"], ["box", 0, 13, 4, 12, 21, 2, "linen1"], ["box", 1, 14, 6, 10, 3, 2, "linen0"],
    ["me", "lie", 6, 17, 8, { still: true }],
    ["box", 1, 18, 6, 11, 15, 2, "team0"], ["breath", 3, 21, 8, 7, 8, 1, "team0"],
    ["box", 26, 24, 0, 6, 6, 3, "rose1"],
    ["zz"],
  ] },
  restApt: { name: "아파트", pal: "apt", ops: [
    ["floor", 14, 12, 32, 30, "cloth3"], ["floor", 15, 13, 31, 29, "cloth1"],
    ["wallR", 1, 3, 22, 20, "linen2"], ["wallR", 2, 4, 21, 19, "sky3"],
    ["skyline", [[2, 4, 5, 11], [5, 4, 8, 15], [8, 4, 10, 9], [10, 4, 13, 14], [13, 4, 16, 10], [16, 4, 19, 16], [19, 4, 21, 12]]],
    ["stars", [[19, 18]], "silver0"],
    ["wallR", 11.5, 4, 12, 19, "linen2"],
    ["wallL", 3, 8, 12, 17, "gold2"], ["wallL", 4, 9, 11, 16, "team0"], ["wallL", 5, 11, 10, 12, "team1"],
    ["box", 24, 0, 0, 10, 5, 2, "wood2"], ["wallR", 24, 2, 34, 15, "wood4"],
    ["box", 24, 0, 2, 1, 5, 13, "wood2"], ["box", 33, 0, 2, 1, 5, 13, "wood2"],
    ["box", 25, 0, 7, 8, 5, 1, "wood1"], ["box", 24, 0, 15, 10, 5, 1, "wood1"],
    ["trophies", [[26.5, 2, 2], [29, 2, 2], [31.5, 2, 2], [26.5, 2, 8], [29, 2, 8], [31.5, 2, 8]]],
    ["box", 0, 13, 0, 14, 21, 4, "wood3"], ["box", 0, 13, 4, 14, 21, 2, "linen1"],
    ["box", 1, 14, 6, 5, 3, 2, "linen0"], ["box", 7, 14, 6, 5, 3, 2, "linen0"],
    ["me", "lie", 4, 17, 8, { still: true }],
    ["box", 1, 18, 6, 13, 15, 2, "team0"], ["breath", 3, 21, 8, 7, 8, 1, "team0"],
    ["box", 17, 13, 0, 2, 2, 8, "metal2"], ["box", 16, 12, 8, 4, 4, 3, { a: ["gold0", "gold1"], p: 10, on: 8 }],
    ["zz"],
  ] },
};

// ----- 그림 아래 한 줄 -----
const ROOM_TEXT = {
  match: "⚔ 경기 {n} 준비",
  train: "🏋️ {training}",
  noPlan: "🏋️ 이번 주 훈련을 골라 주세요",
  rest: { restDorm: "💤 휴식 · 합숙소", restRoom: "💤 휴식 · {home}", restApt: "💤 휴식 · {home}" },
};
