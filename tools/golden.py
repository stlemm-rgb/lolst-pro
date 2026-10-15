# 정답지 (R0, 2026-10-15): 코드 정리·최적화가 게임 결과를 바꾸지 않았는지 확인하는 도구
#
#   python tools/golden.py make    → tools/golden/golden.json 만들기 (정리 시작 전 한 번)
#   python tools/golden.py check   → 지금 코드로 다시 돌려서 정답지와 비교 (단계마다)
#   python tools/golden.py check --loose   → 세이브 모양이 바뀌는 단계(R5)용: 게임 결과(요약)만 비교
#
# 같은 씨앗 = 같은 결과 (sim_lib.open_game이 페이지를 열기 전에 Math.random을 고정)
# 시나리오 5개 × 10시즌. 시즌이 끝날 때마다 두 가지를 기록:
#   strict  : 세이브 전체(state)를 키 순서대로 늘어놓은 문자열의 해시 — 하나라도 바뀌면 다름
#   summary : 사람이 읽을 수 있는 게임 결과 (내 선수·순위·우승·시상·이적·뉴스 수 등)
import json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim_lib import open_game, new_career, play_weeks
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent / "golden" / "golden.json"
SEASONS = 10
SCENARIOS = [
    {"name": "A 미드 2017 1부", "seed": 101, "pos": "mid", "year": 2017, "team": "tier1-mid", "answer": "first", "offers": False},
    {"name": "B 탑 2012 1부 강팀 무작위 답", "seed": 202, "pos": "top", "year": 2012, "team": "tier1-top", "answer": "random", "offers": False},
    {"name": "C 원딜 2022 2부", "seed": 303, "pos": "adc", "year": 2022, "team": "tier2", "answer": "first", "offers": False},
    {"name": "D 정글 2017 제안 수락", "seed": 404, "pos": "jungle", "year": 2017, "team": "tier1-mid", "answer": "random", "offers": True},
    {"name": "E 서포트 2012", "seed": 505, "pos": "support", "year": 2012, "team": "tier1-mid", "answer": "first", "offers": False},
]

SNAP_JS = r"""() => {
  const skip = { savedAt: 1 };
  const canon = function (v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    return "{" + Object.keys(v).filter(k => !skip[k] && v[k] !== undefined).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  };
  const fnv = function (s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  const d = makeSaveData().state;
  const strict = fnv(canon(d));
  const L = state.league, y = state.year;
  const r1 = x => Math.round(x * 10) / 10;
  const npcIds = Object.keys(L.players);
  const top = npcIds.map(id => [id, playerScore(id)]).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0] + ":" + r1(x[1]));
  const summary = {
    year: y, week: state.week, retired: !!state.retired,
    me: { team: state.player && myTeam() ? myTeam().short : null, score: r1(playerScore(USER_ID)), stats: state.stats,
          money: state.money, pop: state.popularity, rep: state.reputation, traits: (state.player.traits || []).slice().sort(),
          salary: state.contract ? state.contract.salary : null, benched: !!state.benched,
          seasons: (state.career.seasons || []).map(s => [s.year, s.rank, s.seriesWins + "-" + (s.series - s.seriesWins), s.titles.join("/")]),
          awards: (state.career.awards || []).length, great: state.great ? state.great.count : 0 },
    league: { players: npcIds.length, teams: L.teams.length, top10: top,
              tier1: (typeof tier1FinalOrder === "function" ? tier1FinalOrder() : []).map(id => teamShort(id)),
              awards: (L.awards || []).filter(a => a.year === y).map(a => a.key + ":" + a.name),
              transfers: (L.transferLog || []).filter(e => e.y === y).length,
              history: fnv(canon(L.history || null)) },
    world: { teams: state.world && state.world.teams ? state.world.teams.length : 0, hash: fnv(canon(state.world || null)) },
    news: { articles: state.newsState && state.newsState.articles ? state.newsState.articles.length : 0 },
    inbox: state.inbox.length,
  };
  return { strict, summary };
}"""


def run_scenario(pw, sc):
    b, page, errors = open_game(pw, seed_value=sc["seed"])
    new_career(page, pos=sc["pos"], year=sc["year"], team=sc["team"])
    snaps = []
    for s in range(SEASONS):
        play_weeks(page, 52, answer=sc["answer"], accept_offers=sc["offers"])
        snaps.append(page.evaluate(SNAP_JS))
        if snaps[-1]["summary"]["retired"]:
            break
    b.close()
    return {"name": sc["name"], "snaps": snaps, "errors": errors}


def run_all():
    out = []
    with sync_playwright() as pw:
        for sc in SCENARIOS:
            t = time.time()
            r = run_scenario(pw, sc)
            print(f"  {sc['name']}: {len(r['snaps'])}시즌 {time.time() - t:.0f}초" + (f" · 오류 {len(r['errors'])}" if r["errors"] else ""))
            out.append(r)
    return out


def diff(a, b, path=""):
    """두 값의 다른 곳 목록"""
    if type(a) != type(b):
        return [f"{path}: {a!r} → {b!r}"]
    if isinstance(a, dict):
        res = []
        for k in sorted(set(a) | set(b)):
            res += diff(a.get(k), b.get(k), f"{path}.{k}")
        return res
    if isinstance(a, list):
        if len(a) != len(b):
            return [f"{path}: 길이 {len(a)} → {len(b)}"]
        res = []
        for i, (x, y) in enumerate(zip(a, b)):
            res += diff(x, y, f"{path}[{i}]")
        return res
    return [] if a == b else [f"{path}: {a!r} → {b!r}"]


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "check"
    loose = "--loose" in sys.argv
    print("정답지 " + ("만들기" if mode == "make" else "비교" + (" (요약만)" if loose else "")) + f" — 시나리오 {len(SCENARIOS)}개 × {SEASONS}시즌")
    now = run_all()
    if mode == "make":
        OUT.parent.mkdir(exist_ok=True)
        OUT.write_text(json.dumps(now, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"저장: {OUT}")
        return 0
    ref = json.loads(OUT.read_text(encoding="utf-8"))
    bad = 0
    for r, n in zip(ref, now):
        for i in range(max(len(r["snaps"]), len(n["snaps"]))):
            a = r["snaps"][i] if i < len(r["snaps"]) else None
            b = n["snaps"][i] if i < len(n["snaps"]) else None
            if a is None or b is None:
                print(f"✗ {r['name']} 시즌 {i + 1}: 시즌 수가 다름"); bad += 1; break
            if not loose and a["strict"] != b["strict"]:
                d = diff(a["summary"], b["summary"])
                print(f"✗ {r['name']} 시즌 {i + 1}: 세이브 전체가 다름" + (" — 요약 차이: " + "; ".join(d[:5]) if d else " (요약은 같음: 세이브 안 다른 칸)"))
                bad += 1; break
            d = diff(a["summary"], b["summary"])
            if d:
                print(f"✗ {r['name']} 시즌 {i + 1}: " + "; ".join(d[:8])); bad += 1; break
        if n["errors"]:
            print(f"✗ {n['name']}: 브라우저 오류 {n['errors'][:2]}"); bad += 1
    print("결과: " + ("✅ 정답지와 같음" if not bad else f"❌ 다른 시나리오 {bad}개"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
