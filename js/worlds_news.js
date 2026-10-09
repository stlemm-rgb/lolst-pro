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
    addNews("월즈 개막 예고", feature.headline + " — 주제곡·뮤직비디오·지역 MVP 소개는 신문 기사 보관함에서 확인할 수 있다.");
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
