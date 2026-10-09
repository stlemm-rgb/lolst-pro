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
  if (a) addNews("시대 소식", title + " — SNS 소식의 신문 기사 보관함에서 전문을 읽을 수 있다.");
  if (saveAfter && state.settings.autoSave) saveGame();
}
