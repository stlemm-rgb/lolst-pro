// ===== 우승 트로피 진열장 (대시보드 제목 옆) =====
// 대회마다 트로피 1개 + 2번 이상이면 ×횟수 (아무리 많이 우승해도 최대 5개라 넘치지 않음)
// 크기: 월드 > MSI > First Stand > 리그 > 컵. 마우스를 올리면 우승한 연도
// 그림은 SVG로 직접 그림 (그림 파일 없음). 우승 기록은 js/retire.js careerSummary

const TROPHY_TYPES = [
  // key: careerSummary().titles 이름, word: 우승 기록 글자 앞부분, h: 높이(px)
  { key: "worlds",     word: "월드",        name: "월드 챔피언십", h: 46 },
  { key: "msi",        word: "MSI",         name: "MSI",           h: 38 },
  { key: "firststand", word: "First Stand", name: "First Stand",   h: 34 },
  { key: "playoffs",   word: "리그",        name: "리그",          h: 31 },
  { key: "cup",        word: "컵",          name: "컵 대회",       h: 26 },
];

// 대회별 트로피 그림 (viewBox 0 0 40 48, 바닥 = 48)
const TROPHY_SVG = {
  // 월드: 크고 넓은 소환사의 컵 모양 — 큰 사발 + 길게 휘는 손잡이 + 3단 받침
  worlds:
    '<defs><linearGradient id="tg-w" x1="0" x2="1"><stop offset="0" stop-color="#9a6b12"/><stop offset=".45" stop-color="#ffe9a3"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>' +
    '<path d="M6 6 Q1 7 2 14 Q3 21 12 22" fill="none" stroke="url(#tg-w)" stroke-width="2.4"/>' +
    '<path d="M34 6 Q39 7 38 14 Q37 21 28 22" fill="none" stroke="url(#tg-w)" stroke-width="2.4"/>' +
    '<path d="M5 4 H35 Q35 22 20 27 Q5 22 5 4 Z" fill="url(#tg-w)"/>' +
    '<ellipse cx="20" cy="4" rx="15" ry="2.2" fill="#fff3c4"/>' +
    '<path d="M11 10 Q20 14 29 10" fill="none" stroke="#9a6b12" stroke-width=".8" opacity=".6"/>' +
    '<rect x="17.5" y="27" width="5" height="8" fill="url(#tg-w)"/>' +
    '<rect x="11" y="35" width="18" height="4" rx="1" fill="url(#tg-w)"/>' +
    '<rect x="8" y="39" width="24" height="4" rx="1" fill="#7a5410"/>' +
    '<rect x="6" y="43" width="28" height="5" rx="1" fill="url(#tg-w)"/>',
  // MSI: 받침 위에 둥근 구슬 — 기둥 + 구 + 고리
  msi:
    '<defs><radialGradient id="tg-m" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#9fd8ff"/><stop offset="1" stop-color="#2a6fb0"/></radialGradient>' +
    '<linearGradient id="tg-m2" x1="0" x2="1"><stop offset="0" stop-color="#9a6b12"/><stop offset=".5" stop-color="#ffe9a3"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>' +
    '<circle cx="20" cy="13" r="11" fill="url(#tg-m)"/>' +
    '<ellipse cx="20" cy="13" rx="14" ry="4" fill="none" stroke="url(#tg-m2)" stroke-width="2"/>' +
    '<path d="M15 24 L25 24 L23 36 L17 36 Z" fill="url(#tg-m2)"/>' +
    '<rect x="11" y="36" width="18" height="5" rx="1" fill="url(#tg-m2)"/>' +
    '<rect x="8" y="41" width="24" height="7" rx="1.5" fill="#7a5410"/>',
  // First Stand: 은색 별 트로피
  firststand:
    '<defs><linearGradient id="tg-f" x1="0" x2="1"><stop offset="0" stop-color="#7d8794"/><stop offset=".5" stop-color="#f4f7fb"/><stop offset="1" stop-color="#9aa4b1"/></linearGradient></defs>' +
    '<path d="M20 1 L24.5 11 L35 12 L27 19 L29.5 30 L20 24.5 L10.5 30 L13 19 L5 12 L15.5 11 Z" fill="url(#tg-f)" stroke="#5f6874" stroke-width=".8"/>' +
    '<rect x="17.5" y="28" width="5" height="9" fill="url(#tg-f)"/>' +
    '<rect x="11" y="37" width="18" height="4" rx="1" fill="url(#tg-f)"/>' +
    '<rect x="9" y="41" width="22" height="7" rx="1.5" fill="#4b5563"/>',
  // 리그: 손잡이 두 개 달린 뚜껑 컵 (금)
  playoffs:
    '<defs><linearGradient id="tg-l" x1="0" x2="1"><stop offset="0" stop-color="#a87412"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#c08a14"/></linearGradient></defs>' +
    '<circle cx="20" cy="3.5" r="2.5" fill="url(#tg-l)"/>' +
    '<path d="M11 9 Q20 3 29 9 Z" fill="url(#tg-l)"/>' +
    '<path d="M10 9 Q4 9 4 15 Q4 21 12 22" fill="none" stroke="url(#tg-l)" stroke-width="2.6"/>' +
    '<path d="M30 9 Q36 9 36 15 Q36 21 28 22" fill="none" stroke="url(#tg-l)" stroke-width="2.6"/>' +
    '<path d="M10 9 H30 V18 Q30 28 20 29 Q10 28 10 18 Z" fill="url(#tg-l)"/>' +
    '<rect x="17.5" y="29" width="5" height="7" fill="url(#tg-l)"/>' +
    '<rect x="12" y="36" width="16" height="4" rx="1" fill="url(#tg-l)"/>' +
    '<rect x="10" y="40" width="20" height="8" rx="1.5" fill="#6b4a12"/>',
  // 컵 대회: 작은 동색 사발 컵
  cup:
    '<defs><linearGradient id="tg-c" x1="0" x2="1"><stop offset="0" stop-color="#7a4a24"/><stop offset=".5" stop-color="#f0b98a"/><stop offset="1" stop-color="#9c5f2e"/></linearGradient></defs>' +
    '<path d="M7 10 H33 Q33 26 20 30 Q7 26 7 10 Z" fill="url(#tg-c)"/>' +
    '<ellipse cx="20" cy="10" rx="13" ry="2" fill="#f7d3b2"/>' +
    '<rect x="17.5" y="30" width="5" height="7" fill="url(#tg-c)"/>' +
    '<rect x="11" y="37" width="18" height="11" rx="1.5" fill="#5a3a1e"/>',
};

function trophyShelfHTML() {
  if (!state.career || !state.player) return "";
  const s = careerSummary(true);
  const items = TROPHY_TYPES.filter(function (t) { return s.titles[t.key] > 0; }).map(function (t) {
    const n = s.titles[t.key];
    const years = s.titleList.filter(function (x) { return x.split(" ").slice(1).join(" ").indexOf(t.word) === 0; })
      .map(function (x) { return x.split(" ")[0]; });
    const w = Math.round(t.h * 40 / 48);
    return '<span class="trophy tip" tabindex="0" data-tip="' + t.name + " 우승 " + n + "회 · " + years.join(", ") + '">' +
      '<svg viewBox="0 0 40 48" width="' + w + '" height="' + t.h + '" aria-label="' + t.name + ' 트로피">' + TROPHY_SVG[t.key] + "</svg>" +
      (n > 1 ? '<span class="trophy-n">×' + n + "</span>" : "") + "</span>";
  });
  return items.length ? '<span class="trophy-shelf">' + items.join("") + "</span>" : "";
}
