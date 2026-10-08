# 측정 도구 공통 함수 (게임에는 영향 없음 — 게임은 tools/ 폴더를 읽지 않음)
# 필요: python3 + playwright (클라우드 작업 환경에는 이미 있음)
#
# 핵심 기능
#   open_game(pw, overrides)  : index.html을 열고, 숫자 바꿔 끼우기(overrides)를 적용
#   new_career(page, ...)     : 새 게임 시작 (포지션·시작 연도·유형·1부 팀·스탯 보정·씨앗)
#   play_weeks(page, n, ...)  : 훈련 자동 선택 + 연락 자동 답장으로 n주 진행
#
# 숫자 바꿔 끼우기 (파일을 고치지 않고 이번 측정에서만)
#   "FOCUS_RULES.userPerS=0.2"  "SLUMP_RULES.chance=0.6"  "TRAIT_FIT.offMult=0.4"
#   값은 JSON으로 읽음 (숫자, true/false, "글자", [목록], {객체}). 왼쪽은 data/*.js 상수의 경로.
import json
from pathlib import Path

GAME = (Path(__file__).resolve().parent.parent / "index.html").as_uri()


def parse_sets(items):
    """["A.b=1", "C.d=[1,2]"] → [("A.b", 1), ("C.d", [1, 2])]"""
    out = []
    for it in items or []:
        if "=" not in it:
            raise SystemExit("값 형식은 경로=값 이어야 해요: " + it)
        k, v = it.split("=", 1)
        try:
            v = json.loads(v)
        except json.JSONDecodeError:
            v = v  # 글자 그대로
        out.append((k.strip(), v))
    return out


def apply_overrides(page, overrides):
    """overrides: [(경로, 값)] → 페이지 안 상수에 대입. 틀린 경로면 오류"""
    for path, val in overrides:
        ok = page.evaluate("""([p, v]) => {
            const parts = p.split('.');
            let obj; try { obj = eval(parts[0]); } catch (e) { return 'no:' + parts[0]; }
            for (let i = 1; i < parts.length - 1; i++) { obj = obj[parts[i]]; if (obj === undefined) return 'no:' + parts.slice(0, i + 1).join('.'); }
            if (parts.length === 1) return 'top';
            const last = parts[parts.length - 1];
            if (!(last in obj)) return 'new:' + p;
            obj[last] = v; return 'ok';
        }""", [path, val])
        if ok != "ok":
            raise SystemExit("바꿔 끼우기 실패 (" + ok + "): " + path)


def open_game(pw, overrides=None):
    browser = pw.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("dialog", lambda d: d.accept())
    page.goto(GAME)
    apply_overrides(page, overrides or [])
    return browser, page, errors


SEED_JS = """(seed) => { let s = seed; Math.random = function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }"""


def seed(page, value):
    """Math.random을 고정 씨앗으로 (같은 씨앗 = 같은 결과)"""
    page.evaluate(SEED_JS, value)


def new_career(page, pos="mid", year=2012, archetype=None, team="tier1-mid", stat_boost=0, mastery_min=0, traits=None, seed_value=None):
    """새 게임. team: "tier1-top"(1부 첫 팀) / "tier1-mid"(1부 가운데) / "tier2"
    stat_boost: 시작 뒤 모든 스탯 +n, mastery_min: 모든 챔피언 숙련도 최소값, traits: 내 특성 목록으로 바꿈"""
    if seed_value is not None:
        seed(page, seed_value)
    page.evaluate("""([pos, year, arch, team, boost, mmin, traits]) => {
        draft.name = '테스트'; draft.position = pos; draft.startYear = year;
        if (arch) draft.archetype = arch;
        renderCreation();
        const t1 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1);
        const t2 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 2);
        draft.teamChoice = team === 'tier2' ? t2[0][1] : team === 'tier1-top' ? t1[0][1] : t1[Math.floor(t1.length / 2)][1];
        startCareer();
        if (boost) Object.keys(state.stats).forEach(k => state.stats[k] = Math.min(100, state.stats[k] + boost));
        if (mmin) Object.keys(state.mastery).forEach(n => state.mastery[n] = Math.max(state.mastery[n], mmin));
        if (traits) state.player.traits = traits.slice();
        state.relations = state.relations || {};
    }""", [pos, year, archetype, team, stat_boost, mastery_min, traits])


# 한 주 진행: 훈련 고르기 → 받은 연락 답장 → 다음 주
#   answer: "first"(첫 선택지) / "random"
#   accept_offers: 계약 제안도 첫 선택지(수락)로 답할지
#   hook_js: 매주 nextWeek 전에 실행할 JS (예: 특정 해에 S급 주기)
WEEK_JS = """([answer, acceptOffers, hook]) => {
    document.querySelectorAll('#news-popup').forEach(e => e.remove());
    state.retirePlanned = false;
    if (hook) eval(hook);
    state.plan = state.stamina < 30 ? 'rest' : (state.week % 2 ? 'scrim' : 'replay');
    state.inbox.filter(m => m.tab === 'inbox' && m.choices && m.answered === null && m.kind !== 'retire' && (acceptOffers || m.kind !== 'offer'))
      .forEach(m => answerMessage(m.id, answer === 'random' ? Math.floor(Math.random() * m.choices.length) : 0));
    // 해가 바뀌기 직전 기록 (52주 진행 전)
    if (state.week === 52) {
      window.__YEARS = window.__YEARS || [];
      const L = state.eventLog || { n: 0 };
      window.__YEARS.push({ year: state.year, inbox: L.n, slumps: (state.career.slumps || 0),
        retires: (state.league.transferLog || []).filter(e => e.kind === 'retire' && e.y === state.year).length,
        friendsBest: state.friends ? state.friends.best.length : 0 });
    }
    nextWeek();
    return state.retired ? 1 : 0;
}"""


def play_weeks(page, n, answer="first", accept_offers=False, hook_js=None):
    for _ in range(n):
        if page.evaluate(WEEK_JS, [answer, accept_offers, hook_js]):
            break


def season_table(page):
    """시즌별 기록: [연도, 시리즈, 시리즈 승, 세트, 세트 승, 스탯 점수, 순위, 우승]"""
    return page.evaluate("""() => (state.career.seasons || []).map(s => ({
        year: s.year, series: s.series, seriesWins: s.seriesWins, sets: s.sets, setWins: s.setWins,
        score: +s.score.toFixed(1), rank: s.rank, titles: s.titles.join('/') }))""")


def year_notes(page):
    return page.evaluate("() => window.__YEARS || []")
