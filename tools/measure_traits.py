#!/usr/bin/env python3
# 특성 하나가 세트·경기 승률을 얼마나 올리는지 (특성 없음과 비교, 같은 리그·같은 난수로)
#
# 예)
#   python3 tools/measure_traits.py                              # 5포지션 × 경기 특성 8개, 500경기씩
#   python3 tools/measure_traits.py --pos jungle --n 800 --traits steal_master,map_reader,genius
#   python3 tools/measure_traits.py --set TRAIT_FIT.offMult=0.3   # 값 바꿔 끼우고 측정
#   python3 tools/measure_traits.py --level 78 --traits s_emperor,s_demon --combo s_emperor+s_demon+s_lane_lord
#
# 옵션: --pos all|top|jungle|mid|adc|support, --level 62(내 스탯 점수), --n 500(특성마다 경기 수),
#       --traits 목록(없으면 경기 특성 전부), --combo a+b+c(묶음, 여러 번), --plus-stat 3(모든 스탯 +n 비교),
#       --set 경로=값(여러 번), --jobs 2, --out 파일.json
# 경기: 1부 가운데 팀 vs 다른 1부 팀 돌아가며, 3경기 중 1경기는 큰 경기(플레이오프 5판), 나머지 정규 3판
# 결과: 세트 승률 변화(%p). 경기 특성은 어울리는 포지션(on)·아닌 포지션(off) 평균도 따로
# 참고: 500경기면 한 칸 오차 ±2~4%p → 여러 포지션 평균으로 보는 게 안전
import argparse, json, sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim_lib import parse_sets, open_game, seed  # noqa: E402

POSITIONS = ["top", "jungle", "mid", "adc", "support"]

RUN_JS = """([level, n, configs, plusStat]) => {
  const sd = function (x) { let s = x; Math.random = function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; };
  const setScore = v => Object.keys(state.stats).forEach(k => state.stats[k] = v);
  let v = level; setScore(v); for (let i = 0; i < 30; i++) { v += level - playerScore(USER_ID); setScore(Math.round(v)); }
  Object.keys(state.mastery).forEach(c => state.mastery[c] = Math.max(state.mastery[c], level > 70 ? 80 : 50));
  const mine = myTeam(); const opps = state.league.teams.filter(t => t.tier === 1 && t.id !== mine.id);
  const snap = JSON.stringify(state.league);
  const run = function (traits) {
    state.player.traits = traits.slice(); state.league = JSON.parse(snap); sd(999);
    let sw = 0, st = 0, mw = 0;
    for (let i = 0; i < n; i++) {
      state.condition = 80; state.stamina = 100;
      const o = opps[i % opps.length]; const big = i % 3 === 2;
      const m = { a: mine.id, b: o.id, comp: big ? 'playoffs' : 'split1', label: big ? '플레이오프' : '정규 시즌', bo: big ? 5 : 3, week: 20, score: [0, 0] };
      playMatch(m); sw += m.score[0]; st += m.score[0] + m.score[1]; if (m.score[0] > m.score[1]) mw++;
    }
    return { set: sw / st * 100, match: mw / n * 100 };
  };
  const res = { score: +playerScore(USER_ID).toFixed(1), none: run([]) , items: {} };
  configs.forEach(c => { res.items[c.join('+')] = run(c); });
  if (plusStat) { setScore(v + plusStat); res.items['스탯+' + plusStat] = run([]); setScore(v); }
  return res;
}"""


def run_pos(job):
    from playwright.sync_api import sync_playwright
    pos, level, n, configs, plus, overrides = job
    with sync_playwright() as pw:
        browser, page, errors = open_game(pw, overrides)
        seed(page, 42)
        page.evaluate("""(pos) => { draft.name='테스트'; draft.position=pos; draft.startYear=2012; renderCreation();
            const t1 = draft.teams.map((d, i) => [d, i]).filter(x => x[0].tier === 1); draft.teamChoice = t1[Math.floor(t1.length / 2)][1]; startCareer(); }""", pos)
        r = page.evaluate(RUN_JS, [level, n, configs, plus])
        r["pos"] = pos
        r["fit"] = page.evaluate("() => { const o = {}; TRAITS.forEach(t => { if (t.fit) o[t.id] = t.fit; }); return o; }")
        r["errors"] = errors[:3]
        browser.close()
        return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pos", default="all")
    ap.add_argument("--level", type=int, default=62)
    ap.add_argument("--n", type=int, default=500)
    ap.add_argument("--traits", default="big_stage,clutch,steel_mental,born_leader,steal_master,highlight,machine,map_reader")
    ap.add_argument("--combo", action="append", default=[])
    ap.add_argument("--plus-stat", type=int, default=3)
    ap.add_argument("--set", action="append", default=[])
    ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--out", default=None)
    o = ap.parse_args()
    positions = POSITIONS if o.pos == "all" else o.pos.split(",")
    configs = [[t] for t in o.traits.split(",") if t] + [c.split("+") for c in o.combo]
    overrides = parse_sets(o.set)
    with ProcessPoolExecutor(max_workers=o.jobs) as ex:
        results = list(ex.map(run_pos, [(p, o.level, o.n, configs, o.plus_stat, overrides) for p in positions]))

    keys = list(results[0]["items"].keys())
    print("세트 승률 변화 %p (특성 없음 대비) · 내 점수", results[0]["score"])
    print("포지션 | 기준 | " + " | ".join(keys))
    on, off = {}, {}
    for r in results:
        base = r["none"]["set"]
        row = []
        for k in keys:
            d = r["items"][k]["set"] - base
            row.append("%+.1f" % d)
            f = r["fit"].get(k)
            if f is not None:
                (on if r["pos"] in f else off).setdefault(k, []).append(d)
        print("%s | %.1f | %s" % (r["pos"], base, " | ".join(row)))
        if r["errors"]:
            print("  오류:", r["errors"])
    if on or off:
        allon = [x for v in on.values() for x in v]
        alloff = [x for v in off.values() for x in v]
        print("\n경기 특성 포지션 궁합 평균: 맞는 포지션 %+.1f%%p (%d칸) / 안 맞는 포지션 %+.1f%%p (%d칸)" % (
            sum(allon) / max(1, len(allon)), len(allon), sum(alloff) / max(1, len(alloff)), len(alloff)))
    if o.out:
        Path(o.out).write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
        print("저장:", o.out)


if __name__ == "__main__":
    main()
