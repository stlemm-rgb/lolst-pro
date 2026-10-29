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
  const T = WORLDS_NEWS, host = state.year === 2012 ? T.firstHost : pick(worldsHostCandidates());
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
  return [HISTORICAL_NEWS_NOTE].concat(due.map(function (e) {
    return "📜 " + e.title + "\n" + e.body;
  }));
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
      return '<article class="npt-art' + (i === 0 ? " lead" : "") + (a.mine ? " mine" : "") + '"><h3>' + escapeHTML(a.headline) + "</h3><p>" + escapeHTML(a.body) + "</p></article>";
    }).join("");
  } else if (mine.length) {
    const m = mine.shift();
    lead = '<article class="npt-art lead mine' + (m.read ? "" : " new") + '"><h3>' + escapeHTML(m.title) + "</h3><p>" + escapeHTML(m.text) + "</p>" + newsChangesHTML(m) + "</article>";
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
      return '<div class="npt-brief' + (m.read ? "" : " new") + '"><b>' + escapeHTML(m.title) + '</b><span class="d">' + escapeHTML(m.text) + "</span>" + newsChangesHTML(m) + "</div>";
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
