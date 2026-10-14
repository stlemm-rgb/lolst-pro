// ===== 대회 결과 뉴스 팝업 (기사: data/news_articles.js) =====
// 대회 결과가 나오면 그 주 '지난주 결과'(state.weekReport.headlines)에 기사를 넣어 두고,
// 다음 화면을 그릴 때 신문처럼 띄워요. 아무 곳이나 누르면 닫힘. '지난주 결과'의 [📰 NEWS]로 다시 보기.

function fillNews(text, vars) {
  const t = text.replace(/\{(\w+)\}/g, function (all, k) { return vars[k] !== undefined && vars[k] !== null ? vars[k] : all; });
  // 스코어 뒤 '로': 읽는 소리에 맞게 (3:0 → "삼 대 영"으로, 3:1 → "삼 대 일"로)
  return t.replace(/(\d+:(\d))로/g, function (all, score, last) { return score + ("0368".indexOf(last) !== -1 ? "으로" : "로"); });
}

// key: NEWS_ARTICLES의 키, who: 상황, vars: 글자 바꾸기 값
function queueHeadline(key, who, vars) {
  const id = newsIdentity("article", key, [who, vars || {}]);
  if (findNewsArticle(id)) return null;
  const r = state.weekReport;
  const list = (typeof NEWS_ARTICLES !== "undefined" && NEWS_ARTICLES[key]) || [];
  const pool = list.filter(function (a) { return a.who === who; });
  const art = pick(pool.length ? pool : list.filter(function (a) { return a.who === "any"; }));
  if (!r || !art) return;
  const team = myTeam();
  const v = Object.assign({ year: state.year, me: state.player.name, myTeam: team ? team.name : "" }, vars);
  return publishHeadline({ key: key, headline: fillNews(art.headline, v), body: fillNews(art.body, v), mine: who.indexOf("my") === 0 }, { id: id });
}

// 결승이 끝났을 때 (js/matchsim.js koFinal)
const INTL_FINALS = ["firststand", "msi", "worlds"];
function queueFinalNews(champKey, eventName, f, st) {
  if (f.newsPublished) return;
  const mine = myTeam();
  let who;
  if (mine && f.winner === mine.id) who = "myTeam";
  else if (mine && f.loser === mine.id) who = "myRunnerUp";
  else if (INTL_FINALS.indexOf(champKey) !== -1) who = findTeam(f.winner) ? "domestic" : "overseas";
  else who = "other";
  const EVENT_NAMES = { cup: "LCK 컵", playoffs: "리그 플레이오프", worlds: "월드 챔피언십", firststand: "First Stand", msi: "MSI" };
  // 연속 우승 기록은 경기 결과 처리에서 확정한 값을 받는다.
  const vars = {
    event: EVENT_NAMES[champKey] || eventName, winner: teamName(f.winner), loser: teamName(f.loser),
    score: Math.max(f.score[0], f.score[1]) + ":" + Math.min(f.score[0], f.score[1]),
    mvp: f.pogName || teamName(f.winner) + "의 에이스", // 해외 팀은 선수 이름이 없어서
    streak: st.n, peat: peatName(st.n), brokenStreak: st.broken,
    firstStandNote: firstStandOn() ? "우승팀은 First Stand에 출전한다." : "시즌 첫 트로피를 품고 다음 무대를 준비한다.",
  };
  const article = queueHeadline(champKey + "_final", who, vars);
  repeatNews(who, vars, st, article);
  if (article) f.newsPublished = true;
}

function peatName(n) {
  if (n < 2) return "";
  return (typeof REPEAT_NEWS !== "undefined" && REPEAT_NEWS.names[n]) || n + "연패";
}
// 방금 넣은 결승 기사에 연속 우승 제목·문장 더하기 + 우리 팀이면 소식·주요 순간
function repeatNews(who, vars, st, art) {
  if (typeof REPEAT_NEWS === "undefined") return;
  if (!art) return;
  const team = myTeam();
  const v = Object.assign({ year: state.year, me: state.player.name, myTeam: team ? team.name : "" }, vars);
  const mineWin = who === "myTeam";
  if (art && st.n >= 2) {
    art.headline = fillNews(pick(REPEAT_NEWS.headline[mineWin ? "myTeam" : "any"]), v);
    art.body += " " + fillNews(REPEAT_NEWS.body[mineWin ? "myTeam" : "any"], v);
  }
  if (art && st.broken) art.body += " " + fillNews(REPEAT_NEWS.broken[mineWin ? "myTeam" : "any"], v);
  if (st.n >= 2) {
    addNews("연속 우승", (mineWin ? "🏆 " : "") + v.winner + ", " + v.event + " " + st.n + "년 연속 우승 — " + v.peat + "!");
    if (mineWin) addMoment("🏆", v.winner + " " + v.event + " " + v.peat + " (" + st.n + "년 연속 우승)");
  }
}

// ----- 화면 -----
function newsOverlayHTML(items) {
  const r = state.weekReport;
  const arts = items.slice().sort(function (a, b) { return newsPriority(b) - newsPriority(a); }).map(function (a, i) {
    return '<article class="np-article' + (i === 0 ? " lead" : "") + (a.mine ? " mine" : "") + '">' +
      (a.mine && i === 0 ? '<span class="np-pf">' + portraitImg(USER_ID, { scale: 2 }) + "</span>" : "") + // 내 기사 1면: 내 얼굴 (js/portrait.js)
      "<h2>" + escapeHTML(a.headline) + "</h2><div class=\"muted small\">" + escapeHTML(newsDate(a)) + "</div><p>" + escapeHTML(a.body) + "</p></article>";
  }).join("");
  return '<div class="np-paper">' +
    '<div class="np-mast"><span class="np-title">📰 e스포츠 데일리</span><span class="np-date">' + "주간 주요 소식" + "</span></div>" +
    arts + '<div class="np-hint">아무 곳이나 누르면 닫혀요 · 다시 보기: 대시보드 지난주 결과 [📰 NEWS]</div></div>';
}

function showNewsPopup() {
  const r = state.weekReport;
  if (!r || !r.headlines || !r.headlines.length) return;
  let el = document.getElementById("news-popup");
  if (!el) {
    el = document.createElement("div");
    el.id = "news-popup";
    document.body.appendChild(el);
    el.addEventListener("click", hideNewsPopup);
  }
  el.innerHTML = newsOverlayHTML(r.headlines);
  el.hidden = false; // 이름 링크는 넣지 않음 (어디를 눌러도 닫히게)
}

function hideNewsPopup(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const el = document.getElementById("news-popup");
  if (el) el.hidden = true;
  if (state.weekReport) state.weekReport.headlinesSeen = true;
  if (state.settings.autoSave) saveGame();
}

// 화면을 그린 뒤 (main.js renderPage): 아직 안 본 뉴스가 있으면 대시보드에서 띄움
function maybeShowNews() {
  const r = state.weekReport;
  if (r && r.headlines && r.headlines.length && !r.headlinesSeen && state.currentMenu === "dashboard") showNewsPopup();
}

// [📰 NEWS] 버튼 (지난주 결과 오른쪽 위)
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest ? e.target.closest("[data-news-open]") : null;
  if (b) showNewsPopup();
});

// Esc 키로도 닫힘
document.addEventListener("keydown", function (e) {
  const el = document.getElementById("news-popup");
  if (el && !el.hidden && e.key === "Escape") hideNewsPopup();
});
