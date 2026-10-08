#!/usr/bin/env python3
# 여러 시즌 자동 진행 → 시즌별 시리즈 승률·연락 수·은퇴 수 등 (값 후보 비교 가능)
#
# 예)
#   python3 tools/measure_seasons.py --seasons 6 --seeds 2024,7 --boost 40 --give-s 2014
#   python3 tools/measure_seasons.py --seasons 6 --seeds 2024,7 --boost 40 --give-s 2014 \
#       --variant "지금" --variant "견제강:FOCUS_RULES.userPerS=0.2" --variant "난조강:SLUMP_RULES.chance=0.7;SLUMP_RULES.goodMult=0.1"
#
# 옵션
#   --pos mid | --year 2012 | --arch prospect | --team tier1-top|tier1-mid|tier2
#   --boost 40        시작 뒤 모든 스탯 +40 (강한 선수)
#   --mastery 70      모든 챔피언 숙련도 최소값
#   --traits highlight,clutch   내 특성 목록
#   --give-s 2014     그 해 1주에 S급 3개(황제·불사대마왕·라인 지배자) 주기 (--s-list로 바꿈)
#   --set 경로=값      모든 변형에 공통으로 바꿔 끼울 값 (여러 번)
#   --variant "이름:경로=값;경로=값"   비교할 변형 (여러 번, 없으면 '기본' 하나)
#   --jobs 2          동시에 돌릴 개수 (1시즌 ≈ 1~1.5분, 3개 넘게는 느려짐)
#   --answer first|random, --accept-offers
#   --out 파일.json    결과 저장
# 오래 걸리면 nohup으로 백그라운드 실행 후 --out 파일을 읽기
import argparse, json, sys, time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim_lib import parse_sets, open_game, new_career, play_weeks, season_table, year_notes  # noqa: E402


def run_one(job):
    from playwright.sync_api import sync_playwright
    a, name, overrides, seed_value = job
    t0 = time.time()
    with sync_playwright() as pw:
        browser, page, errors = open_game(pw, overrides)
        new_career(page, pos=a["pos"], year=a["year"], archetype=a["arch"], team=a["team"], stat_boost=a["boost"],
                   mastery_min=a["mastery"], traits=a["traits"], seed_value=seed_value)
        hook = None
        if a["give_s"]:
            hook = "if (state.year === %d && state.week === 1) %s.forEach(t => { if (!state.player.traits.includes(t)) state.player.traits.push(t); });" % (a["give_s"], json.dumps(a["s_list"]))
        play_weeks(page, 52 * a["seasons"], answer=a["answer"], accept_offers=a["accept_offers"], hook_js=hook)
        res = {
            "variant": name, "seed": seed_value, "seasons": season_table(page), "years": year_notes(page),
            "end": page.evaluate("""() => {
                const P = state.league.players, hold = {};
                Object.keys(P).forEach(id => (P[id].traits || []).forEach(t => { const tr = findTrait(t); if (tr && tr.type === 's') hold[t] = (hold[t] || 0) + 1; }));
                return { score: +playerScore(USER_ID).toFixed(1), team: myTeam().name, tier: myTeam().tier, myTraits: state.player.traits, npcS: hold, slumps: state.career.slumps || 0 };
            }"""),
            "errors": errors[:5], "minutes": round((time.time() - t0) / 60, 1),
        }
        browser.close()
        return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seasons", type=int, default=3)
    ap.add_argument("--seeds", default="2024")
    ap.add_argument("--pos", default="mid")
    ap.add_argument("--year", type=int, default=2012)
    ap.add_argument("--arch", default=None)
    ap.add_argument("--team", default="tier1-top")
    ap.add_argument("--boost", type=int, default=0)
    ap.add_argument("--mastery", type=int, default=0)
    ap.add_argument("--traits", default=None)
    ap.add_argument("--give-s", type=int, default=0)
    ap.add_argument("--s-list", default="s_emperor,s_demon,s_lane_lord")
    ap.add_argument("--set", action="append", default=[])
    ap.add_argument("--variant", action="append", default=[])
    ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--answer", default="first")
    ap.add_argument("--accept-offers", action="store_true")
    ap.add_argument("--out", default=None)
    o = ap.parse_args()
    a = {"pos": o.pos, "year": o.year, "arch": o.arch, "team": o.team, "boost": o.boost, "mastery": o.mastery,
         "traits": o.traits.split(",") if o.traits else None, "give_s": o.give_s, "s_list": o.s_list.split(","),
         "seasons": o.seasons, "answer": o.answer, "accept_offers": o.accept_offers}
    common = parse_sets(o.set)
    variants = []
    for v in o.variant or ["기본"]:
        name, _, sets = v.partition(":")
        variants.append((name, common + parse_sets([x for x in sets.split(";") if x.strip()])))
    jobs = [(a, name, ov, int(s)) for name, ov in variants for s in o.seeds.split(",")]
    with ProcessPoolExecutor(max_workers=o.jobs) as ex:
        results = list(ex.map(run_one, jobs))

    # 표: 변형 × 씨앗 → 시즌별 시리즈 승률
    print("변형 | 씨앗 | 시즌별 시리즈 승률 (승/경기) | 끝 점수 | 난조 | 오류")
    for r in results:
        cells = ["%d:%d%%(%d/%d)" % (s["year"], round(s["seriesWins"] / max(1, s["series"]) * 100), s["seriesWins"], s["series"]) for s in r["seasons"]]
        print("%s | %s | %s | %s | %s | %s" % (r["variant"], r["seed"], " ".join(cells), r["end"]["score"], r["end"]["slumps"], len(r["errors"])))
    if o.give_s:
        print("\nS급을 받은 해(%d)부터 평균 시리즈 승률" % o.give_s)
        for name, _ in variants:
            w = n = 0
            for r in results:
                if r["variant"] != name:
                    continue
                for s in r["seasons"]:
                    if s["year"] >= o.give_s:
                        w += s["seriesWins"]; n += s["series"]
            print("  %s: %.1f%% (%d/%d)" % (name, w / max(1, n) * 100, w, n))
    print("\n해마다: 받은 연락 수 / 은퇴 수 (첫 결과)")
    for y in results[0]["years"]:
        print("  %d: 연락 %d · 은퇴 %d · 절친 %d" % (y["year"], y["inbox"], y["retires"], y["friendsBest"]))
    for r in results:
        if r["errors"]:
            print("오류", r["variant"], r["seed"], r["errors"])
    if o.out:
        Path(o.out).write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
        print("저장:", o.out)


if __name__ == "__main__":
    main()
