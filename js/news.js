// ===== js/news.js — 뉴스: 소식·신문 팝업·월즈 특집·역사 뉴스 (R2: 파일 4개를 합침) =====

// ━━━━━ (예전 js/news.js) ━━━━━
// 뉴스 등록은 표시·보관만 담당한다. 경기·보상·특성 효과는 호출한 시스템에 남긴다.
const NEWS_KEEP = 160;
function ensureNewsState() {
  if (!state.newsState || !Array.isArray(state.newsState.articles)) state.newsState = { articles: [], notices: [] };
  if (!Array.isArray(state.newsState.notices)) state.newsState.notices = [];
  return state.newsState;
}
function newsIdentity(kind, key, detail) {
  return JSON.stringify([state.year, state.week, kind, key, detail]);
}
function findNewsArticle(id) { return ensureNewsState().articles.find(function (a) { return a.id === id; }); }
function newsPriority(a) { return Number.isFinite(a.priority) ? a.priority : a.mine ? 100 : 20; }
function publishHeadline(article, options) {
  const opts = options || {}, N = ensureNewsState(), r = state.weekReport;
  const id = opts.id || newsIdentity('article', article.key, opts.variant || '');
  if (findNewsArticle(id)) return null;
  const a = Object.assign({}, article, { id: id, year: state.year, week: state.week });
  a.priority = newsPriority(a);
  N.articles.push(a);
  N.articles = N.articles.slice(-NEWS_KEEP);
  if (r) {
    r.headlines = r.headlines || [];
    if (opts.first) r.headlines.unshift(a); else r.headlines.push(a);
    r.headlinesSeen = false;
  }
  return a;
}
// 일반 단신의 반복 등록만 막는다. 효과가 있는 fireEvent와 팬 SNS는 생략하지 않는다.
function publishNotice(title, message) {
  const N = ensureNewsState(), id = newsIdentity('notice', title, message);
  if (N.notices.indexOf(id) !== -1) return;
  N.notices.push(id);
  N.notices = N.notices.slice(-400);
  state.log.unshift({ when: state.year + '년 ' + state.week + '주차', training: title, message: message, changes: {} });
  if (state.inbox) postMessage('news', '[' + title + '] ' + message, message, { newsId: id });
  if (state.weekReport) {
    state.weekReport.news = state.weekReport.news || [];
    state.weekReport.news.push({ id: id, year: state.year, week: state.week, title: title, text: message });
  }
}
// 과거 저장의 현재 신문도 보관하되 날짜를 추측하지 않는다. 원래 보고서 날짜를 남긴다.
function migrateCurrentNews() {
  const r = state.weekReport, N = ensureNewsState();
  if (!r || !r.headlines) return;
  r.headlines.forEach(function (a, i) {
    if (!a.id) { a.id = JSON.stringify(['legacy', r.when, i, a.headline]); a.when = r.when; }
    const saved = findNewsArticle(a.id);
    if (saved) Object.assign(a, saved);
    else N.articles.push(a);
  });
  N.articles = N.articles.slice(-NEWS_KEEP);
}
function newsDate(a) { return a.year && a.week ? a.year + '년 ' + a.week + '주차' : a.when || ''; }
// 새 소식 때문에 답장 대기 중인 연락이 잘리지 않게 한다. 일반 메시지는 기존 수만 보관.
function trimMessages(messages) {
  let kept = 0;
  return messages.filter(function (m) {
    if (m.tab === 'inbox' && m.choices && m.answered === null) return true;
    return kept++ < EVENT_RULES.keepMessages;
  });
}

// ━━━━━ (예전 js/news_popup.js) ━━━━━
// ===== 대회 결과 뉴스 팝업 (기사: data/news.js) =====
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
  const list = NEWS_ARTICLES[key] || [];
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
  return REPEAT_NEWS.names[n] || n + "연패";
}
// 방금 넣은 결승 기사에 연속 우승 제목·문장 더하기 + 우리 팀이면 소식·주요 순간
function repeatNews(who, vars, st, art) {
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

// ----- 297 기사 본문: 새해·해외 결산·월즈 특집의 긴 목록을 종류별 표로 (글: data/news.js NEWS_GROUP_TEXT) — 보여 줄 때만, 무작위 없음 -----
function articleBodyHTML(a) {
  const body = String(a.body || "");
  const html = a.key === "newyear" ? newYearBodyHTML(body) : a.key === "worldStory" ? worldStoryBodyHTML(body) : a.key === "worlds_preview" ? worldsPreviewBodyHTML(body) : a.key === "eraIntro" ? eraIntroBodyHTML(body) : null;
  return html || "<p>" + escapeHTML(body) + "</p>";
}
// 298 받은 소식 글: 올스타전처럼 '포지션: A / B' 줄이 3개 넘게 이어지면 표로 (나머지 글은 그대로)
function msgTextHTML(text) {
  const lines = String(text || "").split("\n"), out = [], G = NEWS_GROUP_TEXT, me = state.player ? state.player.name : "";
  const posNames = POSITION_IDS.map(function (p) { return findPosition(p).name; });
  const re = /^(.+?): (.+) \/ (.+)$/;
  let i = 0;
  while (i < lines.length) {
    let j = i;
    while (j < lines.length) { const m = re.exec(lines[j]); if (!m || posNames.indexOf(m[1]) === -1) break; j++; }
    if (j - i >= 3) {
      const rows = lines.slice(i, j).map(function (ln) { const m = re.exec(ln); return { cells: [m[1], m[2], m[3]], mine: !!me && (m[2].indexOf(me + " (") === 0 || m[3].indexOf(me + " (") === 0) }; });
      out.push({ html: newsTableHTML("", G.allstar, rows, true) });
      i = j;
    } else { out.push({ text: lines[i] }); i++; }
  }
  if (!out.some(function (o) { return o.html; })) return escapeHTML(text);
  // 글 줄은 이어 붙이고 표는 사이에 (줄바꿈은 pre-line이 보여 줌)
  let html = "", buf = [];
  const flush = function () { if (buf.length) { html += escapeHTML(buf.join("\n")); buf = []; } };
  out.forEach(function (o) { if (o.html) { flush(); html += o.html; } else buf.push(o.text); });
  flush();
  return html;
}
function newsMyTeamName() { const t = state.player && myTeam(); return t ? t.name : ""; }
// 표 하나: rows = [{ cells: [...글자], mine: 우리 팀 줄 }] → 우리 팀 줄 맨 위 + ★ (같은 묶음 안에서 원래 순서 유지)
function newsTableHTML(title, cols, rows, keepOrder) {
  if (!rows.length) return "";
  const G = NEWS_GROUP_TEXT;
  const sorted = keepOrder ? rows : rows.filter(function (r) { return r.mine; }).concat(rows.filter(function (r) { return !r.mine; })); // keepOrder: 포지션 순서처럼 순서가 뜻이 있으면 그대로
  return '<div class="np-grp">' + (title ? '<div class="np-grp-h">' + escapeHTML(title.replace("{n}", rows.length)) + "</div>" : "") + '<table class="np-tbl">' +
    (cols.length ? "<tr>" + cols.map(function (c) { return "<th>" + escapeHTML(c) + "</th>"; }).join("") + "</tr>" : "") + // 298: 머리 없는 목록 표도
    sorted.map(function (r) {
      return "<tr" + (r.mine ? ' class="mine"' : "") + ">" + r.cells.map(function (c, i) { return "<td>" + (i === 0 && r.mine ? G.mineMark : "") + escapeHTML(c) + "</td>"; }).join("") + "</tr>";
    }).join("") + "</table></div>";
}
function newYearBodyHTML(body) {
  const G = NEWS_GROUP_TEXT, mine = newsMyTeamName();
  const renames = [], moves = [], rookies = [], rest = [];
  let history = null;
  body.split("\n").forEach(function (ln) {
    if (history !== null) { history.push(ln); return; }
    if (ln.indexOf("📜") === 0) { history = [ln]; return; } // 시대 소개는 끝까지 그대로
    let m = /^🏷️ 구단 이름 변경: (.+) → (.+)$/.exec(ln);
    if (m) { renames.push({ cells: [m[1], m[2]], mine: m[1] === mine || m[2] === mine }); return; }
    // 이적 (🧩 경쟁 후보·💥 주전 이적) — 예전엔 아는 아이콘이 아니라서 앞에 ⬆️(승강)가 잘못 붙었음 → 떼고 이적으로
    m = /^(?:⬆️ )?(🧩|💥) (.+?), (?:FA |(.+?)의 )(.+?)\((.+?), [\d.]+\) 영입(?: — [^·]*)?(?: · 이적료 (.+))?$/.exec(ln);
    if (m) { moves.push({ cells: [m[1] + " " + m[2], m[4] + " (" + m[5] + ")", m[3] || G.fa, m[6] || "-"], mine: m[2] === mine || m[3] === mine }); return; }
    m = /^🌟 (대형|레전드) 신인 (.+?)\((.+?), .+?\) (.+?) 입단/.exec(ln);
    if (m) { rookies.push({ cells: [m[2] + " · " + (G.rookieKind[m[1]] || m[1]), m[3], m[4]], mine: m[4] === mine }); return; }
    if (ln.trim()) rest.push(ln.replace(/^⬆️ (?=[🧩💥])/u, ""));
  });
  if (!renames.length && !moves.length && !rookies.length) return null; // 묶을 게 없으면 원래대로
  return newsTableHTML(G.rename, G.renameCols, renames) + newsTableHTML(G.move, G.moveCols, moves) + newsTableHTML(G.rookie, G.rookieCols, rookies) +
    (rest.length ? "<p>" + escapeHTML(rest.join("\n")) + "</p>" : "") + (history ? "<p>" + escapeHTML(history.join("\n")) + "</p>" : "");
}
// 298 2012년 리그 소개(eraIntro): '🏟️ 리그 규모: …' 같은 줄은 항목·지금 표, '🔜 내년(…)에는:' 아래 '  · …' 줄은 그 제목의 목록 표
function eraIntroBodyHTML(body) {
  const G = NEWS_GROUP_TEXT, now = [], next = [], rest = [];
  let nextTitle = "";
  body.split("\n").forEach(function (ln) {
    let m = /^  · (.+)$/.exec(ln);
    if (m && nextTitle) { next.push({ cells: [m[1]], mine: false }); return; }
    if (/^🔜 /.test(ln)) { nextTitle = ln.replace(/[:：]\s*$/, ""); return; }
    m = /^(\S+ [^:]{1,12}): (.+)$/.exec(ln);
    if (m && !nextTitle) { now.push({ cells: [m[1], m[2]], mine: false }); return; }
    if (ln.trim()) rest.push(ln);
  });
  if (!now.length && !next.length) return null;
  return newsTableHTML("", G.era, now, true) + (rest.length ? "<p>" + escapeHTML(rest.join("\n")) + "</p>" : "") + newsTableHTML(nextTitle, [], next, true);
}
function worldStoryBodyHTML(body) {
  const G = NEWS_GROUP_TEXT, lines = body.split("\n"), rows = [], rest = [];
  lines.forEach(function (ln) {
    const m = /^🏆 (.+?): (.+?) 우승(?: · MVP (.+?)\((.+?), .+?\)(.*))?$/.exec(ln);
    if (m) rows.push({ cells: [m[1], m[2], m[3] ? m[3] + " (" + m[4] + ")" + (m[5] || "") : "-"], mine: false });
    else if (ln.trim()) rest.push(ln);
  });
  if (!rows.length) return null;
  return (rest.length ? "<p>" + escapeHTML(rest.join("\n")) + "</p>" : "") + newsTableHTML("", G.world, rows);
}
function worldsPreviewBodyHTML(body) {
  const G = NEWS_GROUP_TEXT, mine = newsMyTeamName();
  let done = false;
  const parts = body.split("\n\n").map(function (para) {
    const ls = para.split("\n");
    const rows = ls.slice(1).map(function (ln) { const m = /^(.+?): (.+) \((.+)\)$/.exec(ln); return m ? { cells: [m[1], m[2], m[3]], mine: m[3] === mine } : null; });
    if (ls.length > 2 && rows.every(Boolean)) { done = true; return "<p>" + escapeHTML(ls[0]) + "</p>" + newsTableHTML("", G.mvp, rows); } // 지역 MVP 목록
    return "<p>" + escapeHTML(para) + "</p>";
  });
  return done ? parts.join("") : null;
}
// ----- 화면 -----
function newsOverlayHTML(items) {
  const r = state.weekReport;
  const arts = items.slice().sort(function (a, b) { return newsPriority(b) - newsPriority(a); }).map(function (a, i) {
    return '<article class="np-article' + (i === 0 ? " lead" : "") + (a.mine ? " mine" : "") + '">' +
      (a.mine && i === 0 ? '<span class="np-pf">' + portraitImg(USER_ID, { scale: 2 }) + "</span>" : "") + // 내 기사 1면: 내 얼굴 (js/portrait.js)
      "<h2>" + escapeHTML(a.headline) + "</h2><div class=\"muted small\">" + escapeHTML(newsDate(a)) + "</div>" + articleBodyHTML(a) + "</article>"; // 297: 긴 목록은 표로
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
  if (r && r.headlines && r.headlines.length && !r.headlinesSeen && state.currentMenu === "dashboard" && !wsBusy) showNewsPopup();
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

// ━━━━━ (예전 js/worlds_news.js) ━━━━━
// 기사와 개최지·영상 소개만 만든다. 경기 일정·전력·팬·보상은 변경하지 않는다.
function worldsHostCandidates() {
  const regions = ["kr"].concat(activeRegions().map(function (r) { return r.id; }));
  return WORLDS_NEWS.hosts.filter(function (h) { return regions.indexOf(h.region) !== -1; });
}

// 시즌이 바뀌기 전에 이름과 장면을 글로 고정한다. 이적·은퇴로 ID가 사라져도 읽을 수 있다.
function worldsMatchScenes(matches, limit) {
  const scenes = [];
  matches.forEach(function (m) {
    if (!m.winner || !m.score) return;
    const result = teamName(m.winner) + "의 " + teamName(m.loser) + " 상대 " + Math.max.apply(null, m.score) + ":" + Math.min.apply(null, m.score) + " 승리";
    const label = m.label || "경기";
    const detail = m.detail && m.detail.sets || [];
    let moment = null;
    detail.some(function (set, i) {
      return (set.ev || []).some(function (e) {
        const def = findMatchEvent(e.e);
        if (!def || def.kind !== "good" || def.size !== "l" || !e.p) return false;
        if (e.p !== USER_ID && !findPlayer(e.p)) return false;
        moment = (i + 1) + "세트 " + playerName(e.p) + "의 " + def.name;
        return true;
      });
    });
    scenes.push(label + " — " + result + (moment ? ", " + moment : ""));
  });
  return scenes.slice(0, limit);
}

function buildWorldsRecap(season) {
  const matches = (season.matches || []).filter(function (m) { return m.comp === "worlds_ko" && m.winner; })
    .slice().sort(function (a, b) { return b.week - a.week; });
  return { year: season.year, song: season.worldsFeature ? season.worldsFeature.song : null, scenes: worldsMatchScenes(matches, 3) };
}

function worldsMvpLines() {
  const missing = WORLDS_NEWS.mvpMissing;
  const domestic = (state.league.awards || []).find(function (a) { return a.year === state.year && a.key === "mvp"; });
  const lines = ["한국: " + (domestic ? domestic.name + " (" + domestic.team + ")" : missing)];
  activeRegions().forEach(function (r) {
    const a = (state.world && state.world.history || []).find(function (h) { return h.y === state.year && h.r === r.id; });
    lines.push(r.name + ": " + (a && a.mvp ? a.mvp + " (" + a.mvpTeam + ")" : missing));
  });
  return lines;
}

function makeWorldsFeature() {
  const s = state.league.season;
  if (s.worldsFeature) return s.worldsFeature;
  const T = WORLDS_NEWS, real = T.realHosts[state.year]; // 249: 실제 개최지가 있는 해는 그대로
  const host = real ? { country: real[0], city: real[1] } : state.year === 2012 ? T.firstHost : pick(worldsHostCandidates());
  const previous = (state.league.history || []).find(function (h) { return h.year === state.year - 1; });
  const oldSong = previous && previous.worldsRecap && previous.worldsRecap.song;
  const songs = T.songs.filter(function (song) { return song !== oldSong; });
  const v = { year: state.year, country: host.country, city: host.city, song: pick(songs.length ? songs : T.songs), video: pick(T.videos) };
  const lines = [fillNews(T.intro, v), fillNews(T.music, v)];
  if (state.year >= 2013) {
    const champion = previous && previous.champions && previous.champions.worlds;
    if (champion) {
      lines.push(fillNews(T.respect, { champion: champion }));
      const scenes = previous.worldsRecap && previous.worldsRecap.scenes || [];
      if (scenes.length) lines.push(fillNews(T.previous, { scenes: scenes.join(" / ") }));
    } else lines.push(T.noHistory);
  }
  const recentFinals = s.matches.filter(function (m) { return m.winner && m.label.indexOf("결승") !== -1 && m.week < 41; })
    .slice().sort(function (a, b) { return b.week - a.week; });
  const current = worldsMatchScenes(recentFinals, 2);
  if (current.length) lines.push(fillNews(T.current, { scenes: current.join(" / ") }));
  lines.push(T.mvpHeading + "\n" + worldsMvpLines().join("\n"));
  const team = myTeam();
  const qualified = team && (s.worldsTeams || []).indexOf(team.id) !== -1;
  lines.push(qualified ? fillNews(T.participant, { team: team.name, me: state.player.name }) : T.observer);
  s.worldsFeature = { year: state.year, host: { country: host.country, city: host.city }, song: v.song,
    headline: fillNews(T.headline, v), body: lines.join("\n\n"), mine: !!qualified, previewSent: false, openingSent: false };
  return s.worldsFeature;
}

// 주차 진입 시 호출. 41주 조 편성은 setupWorlds가 원래 시점에 실행한다.
// 구버전 저장을 41/42주에 열어도 각각 한 번만 안내한다.
function worldsNewsForWeek(saveAfter) {
  if (!state.player || !state.league || !state.league.season || (state.week !== 41 && state.week !== 42)) return;
  const feature = makeWorldsFeature();
  let changed = false;
  if (state.week === 41 && !feature.previewSent) {
    publishHeadline({ key: "worlds_preview", headline: feature.headline, body: feature.body, mine: feature.mine, priority: feature.mine ? 100 : 60 },
      { id: "worlds_preview:" + state.year });
    addNews("월즈 개막 예고", feature.headline + " — 주제곡·뮤직비디오·지역 MVP 소개는 이번 주 신문 1면에 실렸다.");
    feature.previewSent = true;
    changed = true;
  }
  const s = state.league.season;
  if (state.week === 42 && s.worlds && !feature.openingSent) {
    const count = s.worlds.groups.reduce(function (n, g) { return n + g.length; }, 0);
    let message = fillNews(WORLDS_NEWS.opening, { year: state.year, country: feature.host.country, city: feature.host.city, count: count });
    const team = myTeam();
    if (team && s.worldsTeams.indexOf(team.id) !== -1) message += " " + team.name + "도 월드 챔피언십에 출전한다.";
    addNews("월즈 개막", message);
    feature.openingSent = true;
    changed = true;
  }
  if (changed && saveAfter && state.settings.autoSave) saveGame();
}

// ━━━━━ (예전 js/historical_news.js) ━━━━━
// 실제 역사 소개는 기사만 만든다. 경기 판정·메타·팬·경제 값은 건드리지 않는다.
function historicalNewsDue() {
  if (!state.player || state.retired || !state.league || !state.league.season) return [];
  const sent = state.league.season.historicalNewsSent;
  return HISTORICAL_NEWS.filter(function (e) {
    return e.year === state.year && e.week === state.week && (!Array.isArray(sent) || sent.indexOf(e.id) === -1);
  });
}
function historicalNewsLines() {
  const due = historicalNewsDue();
  if (!due.length) return [];
  const s = state.league.season;
  if (!Array.isArray(s.historicalNewsSent)) s.historicalNewsSent = [];
  due.forEach(function (e) { s.historicalNewsSent.push(e.id); });
  return due.map(function (e) { // 248: 맨 앞 안내문(실제 역사와 게임 규칙이 다르다는 글)은 사용자 요청으로 뺌
    return "📜 " + e.title + "\n" + e.body;
  });
}
function historicalNewsForWeek(saveAfter) {
  const lines = historicalNewsLines();
  if (!lines.length) return;
  const title = state.year + "년 " + (state.week === 1 ? "시즌 시대 소식" : state.week === 29 ? "중간 역사 소식" : "연말 역사 소식");
  const a = publishHeadline({ key: "historical", headline: title, body: lines.join("\n\n"), mine: false },
    { id: "historical:" + state.year + ":" + state.week });
  if (a) addNews("시대 소식", title + " — 전문은 이번 주 신문 1면에 실렸다.");
  if (saveAfter && state.settings.autoSave) saveGame();
}

// ━━━━━ 206: SNS 소식 탭 = 주간 신문 (시안 15 A안) ━━━━━
// 한 주 = 신문 한 부: 위 1면 기사(신문 기사·내 소식), 아래 분야별 단신(2단). 같은 문장은 한 번만, ' — ' 뒤는 작은 설명.
// 단신 = "[분야] 글" 소식(publishNotice), 내 소식 = 그 밖의 news 메시지(퀘스트·업적·특성·수상 …)
let newsEdition = null; // 보고 있는 호 "연도-주" (null = 가장 최근)
let newsEditionAt = null; // 210: 지난 호를 고른 주. 주가 넘어가면 다시 최신 호부터
function newsWeekKey(y, w) { return y + "-" + w; }
function articleWeekKey(a) {
  if (a.year && a.week) return newsWeekKey(a.year, a.week);
  const x = /(\d+)년 (\d+)주/.exec(a.when || "");
  return x ? newsWeekKey(Number(x[1]), Number(x[2])) : null;
}
function newsEditions(list) {
  const keys = [];
  const add = function (k) { if (k && keys.indexOf(k) === -1) keys.push(k); };
  list.forEach(function (m) { add(newsWeekKey(m.year, m.week)); });
  ensureNewsState().articles.forEach(function (a) { add(articleWeekKey(a)); });
  return keys.sort(function (a, b) { const p = a.split("-").map(Number), q = b.split("-").map(Number); return q[0] - p[0] || q[1] - p[1]; });
}
function newsAboutMe(text) {
  const team = myTeam();
  return String(text).indexOf(state.player.name) !== -1 || (team && String(text).indexOf(team.name) !== -1);
}
// "앞 — 뒤" → [앞, 뒤]
function newsSplit(text) {
  const t = String(text || ""), i = t.indexOf(" — ");
  return i === -1 ? [t, ""] : [t.slice(0, i), t.slice(i + 3)];
}
function newsPaperHTML(list) {
  const eds = newsEditions(list);
  if (!eds.length) return '<p class="muted">아직 소식이 없어요. 주를 진행하면 기사와 소식이 와요.</p>';
  if (newsEditionAt !== state.year + "-" + state.week) newsEdition = null;
  if (!newsEdition || eds.indexOf(newsEdition) === -1) newsEdition = eds[0];
  const key = newsEdition, kp = key.split("-").map(Number);
  const msgs = list.filter(function (m) { return newsWeekKey(m.year, m.week) === key; });
  const arts = ensureNewsState().articles.filter(function (a) { return articleWeekKey(a) === key; }).sort(function (a, b) { return newsPriority(b) - newsPriority(a); });
  const notices = [], mine = [];
  msgs.forEach(function (m) {
    const x = /^\[([^\]]+)\] /.exec(m.title || "");
    if (x && m.newsId !== undefined || x && m.text && m.title.slice(x[0].length) === m.text) notices.push({ m: m, cat: x[1] });
    else mine.push(m);
  });
  // 1면: 신문 기사 → 없으면 내 소식 첫 번째
  let lead = "";
  if (arts.length) {
    lead = arts.map(function (a, i) {
      return '<article class="npt-art' + (i === 0 ? " lead" : "") + (a.mine ? " mine" : "") + '"><h3>' + escapeHTML(a.headline) + "</h3>" + articleBodyHTML(a) + "</article>"; // 297
    }).join("");
  } else if (mine.length) {
    const m = mine.shift();
    lead = '<article class="npt-art lead mine' + (m.read ? "" : " new") + '"><h3>' + escapeHTML(m.title) + '</h3><div class="npt-body">' + msgTextHTML(m.text) + "</div>" + newsChangesHTML(m) + "</article>"; // 298
  }
  // 단신: 분야별 (나·우리 팀 이야기가 있는 분야 먼저)
  const groups = [];
  notices.forEach(function (n) {
    let g = groups.find(function (x) { return x.cat === n.cat; });
    if (!g) { g = { cat: n.cat, items: [] }; groups.push(g); }
    g.items.push(n.m);
  });
  groups.forEach(function (g) {
    g.items.sort(function (a, b) { return newsAboutMe(b.text) - newsAboutMe(a.text); });
    g.me = g.items.some(function (m) { return newsAboutMe(m.text); });
  });
  groups.sort(function (a, b) { return b.me - a.me || b.items.length - a.items.length; });
  const brief = function (m) {
    const s = newsSplit(m.text), me = newsAboutMe(m.text);
    return '<div class="npt-brief' + (m.read ? "" : " new") + (me ? " mine" : "") + '">' + escapeHTML(s[0]) + (s[1] ? '<span class="d">' + escapeHTML(s[1]) + "</span>" : "") + "</div>";
  };
  const show = NEWS_PAPER.briefShow;
  let secs = "";
  if (mine.length) {
    secs += '<div class="npt-sec"><h4><span>' + NEWS_PAPER.mineTitle + "</span><small>" + mine.length + "건</small></h4>" + mine.map(function (m) {
      return '<div class="npt-brief' + (m.read ? "" : " new") + '"><b>' + escapeHTML(m.title) + '</b><div class="d">' + msgTextHTML(m.text) + "</div>" + newsChangesHTML(m) + "</div>"; // 298
    }).join("") + "</div>";
  }
  secs += groups.map(function (g) {
    const head = g.items.slice(0, show).map(brief).join("");
    const rest = g.items.slice(show);
    return '<div class="npt-sec"><h4><span>' + escapeHTML(newsCatName(g.cat)) + "</span><small>" + g.items.length + "건</small></h4>" + head +
      (rest.length ? '<details class="npt-more"><summary>' + rest.length + "건 더 보기</summary>" + rest.map(brief).join("") + "</details>" : "") + "</div>";
  }).join("");
  const unreadKeys = {};
  list.forEach(function (m) { if (!m.read) unreadKeys[newsWeekKey(m.year, m.week)] = true; });
  const chips = eds.map(function (k) {
    const p = k.split("-");
    return '<button class="npt-ed' + (k === key ? " on" : "") + (unreadKeys[k] ? " new" : "") + '" data-edition="' + k + '">' + (Number(p[0]) !== state.year ? p[0] + "년 " : "") + p[1] + "주차</button>";
  }).join("");
  const sch = kp[0] === state.year ? " · " + escapeHTML(scheduleOfWeek(kp[1]).name) : "";
  return '<div class="npt-paper">' +
    '<div class="npt-mast"><b>' + NEWS_PAPER.title + "</b><span>" + kp[0] + "년 " + kp[1] + "주차" + sch + "</span></div>" +
    '<div class="npt-eds">' + chips + "</div>" +
    (lead ? '<div class="npt-lead">' + lead + "</div>" : "") +
    (secs ? '<div class="npt-cols">' + secs + "</div>" : '<p class="npt-empty">이 주에는 단신이 없어요.</p>') +
  "</div>";
}
function newsCatName(cat) {
  const icon = NEWS_PAPER.icons[cat];
  return (icon ? icon + " " : "") + cat;
}
function newsChangesHTML(m) {
  const c = changesText(m.changes);
  return (c ? '<span class="d log-changes">' + c + "</span>" : "") + (m.notes && m.notes.length ? '<span class="d">' + m.notes.map(escapeHTML).join(" · ") + "</span>" : "");
}
// 보고 있는 호의 소식은 읽음 처리 (선수 SNS 탭처럼 보면 읽음)
function markEditionRead() {
  if (!newsEdition) return false;
  let changed = false;
  state.inbox.forEach(function (m) { if (m.tab === "news" && !m.read && newsWeekKey(m.year, m.week) === newsEdition) { m.read = true; changed = true; } });
  return changed;
}

// ━━━━━ 후반 '위기감' 기사 (281) ━━━━━ 글·숫자: data/news.js CRISIS_NEWS · CRISIS_RULES
// 프로 5년차 이상 + 1부 3위 안일 때, 실제로 있었던 기록으로만: ① 2:1·3:2 진땀승 ② 이겼지만 분석 빗나감 ③ 다음 상대와 맞대결 승 ≤ 패 — 모두 신문
// (단신 addNews는 받은 연락 보관 칸을 같이 써서 오래된 연락이 밀려나 연락 흐름이 바뀜 → 신문만 씀, 게임 결과 그대로)
// ④ 해외 같은 팀 지역 2연패(새 시즌 3주, 신문). 시즌 합계·간격·종류별 상한. 표시·보관만 (경기·팬·돈 효과 없음, 무작위 안 씀)
function crisisState() {
  const N = ensureNewsState();
  if (!N.crisis || N.crisis.y !== state.year) N.crisis = { y: state.year, n: 0, last: -99, c: {} };
  return N.crisis;
}
function crisisRoom(kind) {
  const C = crisisState(), R = CRISIS_RULES;
  return C.n < R.seasonMax && absWeek() - C.last >= R.gapWeeks && (C.c[kind] || 0) < R.each[kind];
}
function crisisMark(kind) { const C = crisisState(); C.n++; C.last = absWeek(); C.c[kind] = (C.c[kind] || 0) + 1; }
function crisisPick(list, salt) { return list[(state.year * 53 + state.week + salt) % list.length]; }
function crisisHeadline(kind, art, v) {
  publishHeadline({ key: "crisis_" + kind, headline: fillNews(art.headline, v), body: fillNews(art.body, v), mine: true, priority: 40 });
  crisisMark(kind);
}
function crisisNewsWeek(playedWeek) {
  const mine = state.player && !state.retired && state.league && myTeam();
  if (!mine || mine.tier !== 1 || careerYears() < CRISIS_RULES.fromYear) return;
  const v = { myTeam: mine.name, me: state.player.name };
  // ④ 해외 왕좌: 새 시즌 초에 지난 두 해 우승 기록 (순위는 아직 의미 없어서 안 봄)
  if (state.week === CRISIS_RULES.abroadWeek && crisisRoom("abroad")) {
    const H = (state.world && state.world.history) || [];
    const two = WORLD_REGIONS.map(function (r) {
      const a = H.find(function (e) { return e.r === r.id && e.y === state.year - 2; }), b = H.find(function (e) { return e.r === r.id && e.y === state.year - 1; });
      return a && b && a.teamId === b.teamId ? { region: r.name, team: b.team, y1: a.y, y2: b.y } : null;
    }).filter(Boolean)[0];
    if (two) { crisisHeadline("abroad", crisisPick(CRISIS_NEWS.abroad, 0), Object.assign({}, v, two)); return; }
  }
  const rank = myLeagueRank();
  if (rank < 1 || rank > CRISIS_RULES.topRank) return;
  v.rank = rank;
  const involves = function (m) { return m.a === mine.id || m.b === mine.id; };
  const played = seasonOf().matches.filter(function (m) { return m.week === playedWeek && m.winner === mine.id && involves(m); });
  const oppOf = function (m) { return m.a === mine.id ? m.b : m.a; };
  // ① 진땀승
  const close = played.find(function (m) { const hi = Math.max(m.score[0], m.score[1]), lo = Math.min(m.score[0], m.score[1]); return hi >= 2 && lo === hi - 1; });
  if (close && crisisRoom("close")) {
    const my = close.a === mine.id ? 0 : 1;
    crisisHeadline("close", crisisPick(CRISIS_NEWS.close, 1), Object.assign({}, v, { opp: teamName(oppOf(close)), score: close.score[my] + ":" + close.score[1 - my] }));
    return;
  }
  // ② 분석이 빗나갔는데 이김
  const miss = played.find(function (m) { return m.scout && m.scout.y === state.year && !m.scout.right; });
  if (miss && crisisRoom("misread")) {
    crisisHeadline("misread", crisisPick(CRISIS_NEWS.misread, 2), Object.assign({}, v, { opp: teamName(oppOf(miss)), plan: compLabel(miss.scout.shown), real: compLabel(miss.scout.target) }));
    return;
  }
  // ③ 다음 상대와 맞대결이 안 좋음
  const next = userWeekMatches(state.week).matches[0];
  const h = next && h2hTeam(mine.id, oppOf(next));
  if (h && h.w + h.l >= CRISIS_RULES.nemesisGames && h.w <= h.l && crisisRoom("nemesis")) {
    crisisHeadline("nemesis", crisisPick(CRISIS_NEWS.nemesis, 3), Object.assign({}, v, { opp: teamName(oppOf(next)), w: h.w, l: h.l }));
  }
}
