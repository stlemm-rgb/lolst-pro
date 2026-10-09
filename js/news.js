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
function newsArchiveHTML() {
  migrateCurrentNews();
  const list = ensureNewsState().articles.slice().reverse();
  return '<details class="card"><summary>📰 신문 기사 보관함 (' + list.length + '건)</summary><p class="muted small">최근 ' + NEWS_KEEP + '개 기사 · 날짜는 기사 발생 시점이에요.</p>' +
    list.map(function (a) { return '<details class="card"><summary>' + escapeHTML(a.headline) + '</summary><p class="muted small">' + escapeHTML(newsDate(a)) + '</p><div class="msg-text">' + escapeHTML(a.body) + '</div></details>'; }).join('') + '</details>';
}
// 새 소식 때문에 답장 대기 중인 연락이 잘리지 않게 한다. 일반 메시지는 기존 수만 보관.
function trimMessages(messages) {
  let kept = 0;
  return messages.filter(function (m) {
    if (m.tab === 'inbox' && m.choices && m.answered === null) return true;
    return kept++ < EVENT_RULES.keepMessages;
  });
}
