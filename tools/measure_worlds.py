#!/usr/bin/env python3
# 월드 우승 밸런스 측정 (국내 vs 해외) — 게임에는 영향 없음
#
# 여러 시즌 자동 진행하면서 해마다 기록:
#   1. 월드 우승 지역 (국내 / 중국 / 북미 / 유럽 / 나머지)
#   2. 같은 해외 팀 여러 번·연속 우승
#   3. 해외 우승팀 주전 중 한국 출신 수·종합 능력
#   4. 국내 선수 해외 이적 (transferLog kind abroad), 그중 스타급 (S급 보유 또는 1부 평균 +5 이상)
#   5. 월드 결승 시점 국내 1위 팀 vs 해외 1위 팀 전력 (주전 5명 종합 능력 평균)
#   6. 국제대회(월드·MSI·First Stand·Road to MSI) 국내 vs 해외 세트 승률
#
# 예)
#   python3 tools/measure_worlds.py --years 2012,2017,2022 --seeds 1,2,3 --seasons 10 --jobs 2 --out /tmp/w.json
#   python3 tools/measure_worlds.py --years 2012 --seeds 1,2 --seasons 10 \
#       --variant "지금" --variant "러브콜끔:ABROAD.perYear=0" --variant "지역0.90:WORLD_REGIONS.0.strength=0.90;WORLD_REGIONS.1.strength=0.90;WORLD_REGIONS.2.strength=0.90"
#   python3 tools/measure_worlds.py --report /tmp/w.json      # 저장한 결과로 표만 다시
#
# 내 선수: 보통 미드, 2부 팀 시작 (월드에 거의 안 나가게 → 리그끼리 비교에 덜 끼어듦). --team으로 바꿀 수 있음
# 1시즌 ≈ 20~60초. 오래 걸리면 nohup으로 백그라운드 실행 후 --out 파일을 읽기
import argparse, json, sys, time
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim_lib import parse_sets, open_game, new_career, play_weeks  # noqa: E402

BIG = {"cn": "중국", "na": "북미", "eu": "유럽"}
INTL_COMPS = ["worlds_group", "worlds_ko", "msi_playin", "msi_ko", "fs_ko", "fs_group", "rtmsi"]

# 페이지 안에 기록 장치 설치 (월드 결승 직후 스냅샷 + 해외 이적 기록)
HOOK_INSTALL = """(intlComps) => {
  const R = window.__W = { worlds: [], abroad: [], intl: [], gaps: [] };
  const pScore = id => { try { return playerScore(id); } catch (e) { return 0; } };
  const wTeam = id => state.world && state.world.teams.find(t => t.id === id);
  const startersOf = id => {
    const wt = wTeam(id);
    const s = wt ? worldStarters(wt) : starters(id);
    return POSITION_IDS.map(pos => s[pos]).filter(Boolean).map(pid => {
      const p = findPlayer(pid) || (state.world && state.world.players[pid]);
      return { id: pid, name: p ? p.name : '?', origin: p ? (p.origin || 'kr') : '?', score: +pScore(pid).toFixed(1), s: sCountOfId(pid) };
    });
  };
  const strength = id => { const l = startersOf(id); return l.length ? l.reduce((a, b) => a + b.score, 0) / l.length : 0; };
  const origKo = koFinal;
  koFinal = function (comp, label, week, bo, champKey, title) {
    const out = origKo.apply(this, arguments);
    if (champKey === 'worlds') {
      const s = seasonOf();
      const f = s.matches.filter(m => m.comp === comp && m.week === week && m.label.indexOf('결승') !== -1).pop();
      const info = id => { const wt = wTeam(id); return { id: id, name: teamName(id), dom: !wt && !!findTeam(id), region: wt ? wt.region : (findTeam(id) ? 'kr' : '?'), str: +strength(id).toFixed(1), starters: startersOf(id) }; };
      // 국내 1위 / 해외 1위 전력 (월드 결승 시점)
      const dom = tierTeams(1).map(t => ({ id: t.id, str: strength(t.id) })).sort((a, b) => b.str - a.str)[0];
      const ov = (state.world ? state.world.teams.filter(t => activeRegions().some(r => r.id === t.region)) : []).map(t => ({ id: t.id, region: t.region, str: strength(t.id) })).sort((a, b) => b.str - a.str)[0];
      R.worlds.push({ year: state.year, winner: info(f.winner), loser: info(f.loser), score: f.score.slice(), mine: !!(myTeam() && f.winner === myTeam().id) });
      R.gaps.push({ year: state.year, dom: +dom.str.toFixed(1), domName: teamName(dom.id), ov: ov ? +ov.str.toFixed(1) : 0, ovRegion: ov ? ov.region : null, ovName: ov ? teamName(ov.id) : null, base: +domesticBase().toFixed(1) });
    }
    return out;
  };
  const origLog = logTransfer;
  logTransfer = function (e) {
    if (e && e.kind === 'abroad') {
      const base = domesticBase();
      R.abroad.push({ year: state.year, week: state.week, score: e.score, s: sCountOfId(e.id), base: +base.toFixed(1), from: e.from ? 'team' : 'fa', age: e.age, to: e.to });
    }
    return origLog.apply(this, arguments);
  };
  window.__intlYear = () => {
    const s = seasonOf();
    const isDom = id => !!findTeam(id) && !wTeam(id);
    let dw = 0, dl = 0, mw = 0, ml = 0;
    s.matches.filter(m => intlComps.indexOf(m.comp) !== -1 && m.winner && m.a && m.b).forEach(m => {
      const da = isDom(m.a), db = isDom(m.b);
      if (da === db) return;
      const d = da ? 0 : 1;
      dw += m.score[d]; dl += m.score[1 - d];
      if (m.winner === (da ? m.a : m.b)) mw++; else ml++;
    });
    R.intl.push({ year: state.year, setW: dw, setL: dl, matchW: mw, matchL: ml });
  };
}"""

# 수정안 시험 (파일을 고치지 않고 이번 측정에서만) — 변형에 "@이름=값"으로 넣음
#   @flat=0.3   새해마다 해외 팀(그 지역 출신 선수)을 지역 평균 쪽으로 차이의 30% 당김 (해외 1위 팀 고정 완화)
#   @noise=2    새해마다 해외 팀마다 전력 ±2 흔들림 (순위 섞기)
#   @ovdyn=1    해외 팀이 월드 우승하면 새해에 그 팀 주전 중 강한 n명이 같은 지역 다른 팀으로 (해외 왕조 압박)
PROTO_INSTALL = """(P) => {
  window.__P = P;
  const natives = (t) => { const st = worldStarters(t); return POSITION_IDS.map(pos => st[pos] && worldPlayer(st[pos])).filter(q => q && q.origin === t.region); };
  const shiftTeam = (t, d) => { d = Math.round(d); if (!d) return; t.roster.forEach(id => { const p = worldPlayer(id); if (p && p.origin === t.region) STATS.forEach(s => p.stats[s.id] = Math.max(1, Math.min(100, p.stats[s.id] + d))); }); };
  const orig = worldNewSeason;
  worldNewSeason = function () {
    const lc = state.league.lastChamps;
    if (P.ovdyn && lc && lc.year === state.year - 1 && lc.ids.worlds && findWorldTeam(lc.ids.worlds)) {
      const t = findWorldTeam(lc.ids.worlds);
      const others = state.world.teams.filter(x => x.region === t.region && x.id !== t.id);
      const st = worldStarters(t);
      POSITION_IDS.map(pos => st[pos]).filter(Boolean).sort((a, b) => worldScore(worldPlayer(b)) - worldScore(worldPlayer(a))).slice(0, P.ovdyn).forEach(id => {
        const p = worldPlayer(id); if (!p || !others.length) return;
        const o = others[Math.floor(Math.random() * others.length)];
        const sw = worldStarters(o)[p.pos];
        t.roster.splice(t.roster.indexOf(id), 1); o.roster.push(id);
        if (sw) { o.roster.splice(o.roster.indexOf(sw), 1); t.roster.push(sw); }
      });
    }
    const out = orig.apply(this, arguments);
    if (P.flat || P.noise) {
      activeRegions().forEach(r => {
        const teams = state.world.teams.filter(t => t.region === r.id);
        const vals = teams.map(t => { const l = natives(t).map(worldScore); return l.length ? average(l) : null; });
        const ok = vals.filter(v => v !== null); if (!ok.length) return;
        const m = average(ok);
        teams.forEach((t, i) => { if (vals[i] === null) return; shiftTeam(t, (m - vals[i]) * (P.flat || 0) + (P.noise ? randFloat(-P.noise, P.noise) : 0)); });
      });
    }
    return out;
  };
}"""

YEAR_HOOK = "if (state.week === 52 && window.__intlYear) window.__intlYear();"


def run_one(job):
    from playwright.sync_api import sync_playwright
    a, name, overrides, year, seed_value = job
    t0 = time.time()
    with sync_playwright() as pw:
        browser, page, errors = open_game(pw, overrides)
        new_career(page, pos=a["pos"], year=year, team=a["team"], seed_value=seed_value)
        page.evaluate(HOOK_INSTALL, INTL_COMPS)
        if a["proto"].get(name):
            page.evaluate(PROTO_INSTALL, a["proto"][name])
        play_weeks(page, 52 * a["seasons"], answer="first", hook_js=YEAR_HOOK)
        data = page.evaluate("() => window.__W")
        browser.close()
    data.update({"variant": name, "year": year, "seed": seed_value, "errors": errors[:5], "minutes": round((time.time() - t0) / 60, 1)})
    return data


def region_group(r):
    if r == "kr":
        return "국내"
    return BIG.get(r, "나머지")


def summarize(results, variant):
    rs = [r for r in results if r["variant"] == variant]
    groups = Counter()
    runs_multi = runs_consec = 0
    kr_counts, kr_scores, ov_win_str = [], [], []
    abroad_n = abroad_star = 0
    gaps = defaultdict(list)
    setW = setL = mW = mL = 0
    seasons = 0
    for r in rs:
        wins = [w["winner"] for w in r["worlds"]]
        seasons += len(wins)
        for w in wins:
            groups[region_group(w["region"])] += 1
        ov_ids = [w["id"] for w in wins if not w["dom"]]
        c = Counter(ov_ids)
        if any(v >= 2 for v in c.values()):
            runs_multi += 1
        if any(wins[i]["id"] == wins[i + 1]["id"] and not wins[i]["dom"] for i in range(len(wins) - 1)):
            runs_consec += 1
        for w in wins:
            if w["dom"]:
                continue
            kr = [p for p in w["starters"] if p["origin"] == "kr"]
            kr_counts.append(len(kr))
            kr_scores += [p["score"] for p in kr]
            ov_win_str.append(w["str"])
        for e in r["abroad"]:
            abroad_n += 1
            if e["s"] > 0 or e["score"] >= e["base"] + 5:
                abroad_star += 1
        for g in r["gaps"]:
            gaps[g["year"] - r["year"]].append(g["dom"] - g["ov"])
        for i in r["intl"]:
            setW += i["setW"]; setL += i["setL"]; mW += i["matchW"]; mL += i["matchL"]
    n = max(1, seasons)
    avg = lambda l: sum(l) / len(l) if l else 0
    return {
        "variant": variant, "runs": len(rs), "seasons": seasons,
        "dom_pct": groups["국내"] / n * 100, "groups": dict(groups),
        "runs_multi": runs_multi, "runs_consec": runs_consec,
        "ov_wins": len(kr_counts), "kr_per_ov_champ": avg(kr_counts), "kr_score": avg(kr_scores), "ov_champ_str": avg(ov_win_str),
        "abroad_per_season": abroad_n / n, "abroad_star_per_season": abroad_star / n,
        "gap_by_season": {k: round(avg(v), 1) for k, v in sorted(gaps.items())}, "gap_all": avg([x for v in gaps.values() for x in v]),
        "set_pct": setW / max(1, setW + setL) * 100, "sets": setW + setL, "match_pct": mW / max(1, mW + mL) * 100, "matches": mW + mL,
    }


def report(results, variants):
    print("\n## 변형별 요약")
    print("| 변형 | 판 | 시즌 | 국내 우승 | 중국/북미/유럽/나머지 | 같은 해외 팀 2회+ 판 | 연속 우승 판 | 해외 우승팀 한국 주전(명) | 그 선수 능력 | 해외 이적/시즌 (스타) | 국내1위−해외1위 | 국제 세트 승률 (n) |")
    print("|---|---|---|---|---|---|---|---|---|---|---|---|")
    sums = []
    for v in variants:
        s = summarize(results, v)
        sums.append(s)
        g = s["groups"]
        print("| %s | %d | %d | %.0f%% | %d/%d/%d/%d | %d | %d | %.1f | %.1f | %.2f (%.2f) | %+.1f | %.1f%% (%d) |" % (
            v, s["runs"], s["seasons"], s["dom_pct"], g.get("중국", 0), g.get("북미", 0), g.get("유럽", 0), g.get("나머지", 0),
            s["runs_multi"], s["runs_consec"], s["kr_per_ov_champ"], s["kr_score"], s["abroad_per_season"], s["abroad_star_per_season"],
            s["gap_all"], s["set_pct"], s["sets"]))
    print("\n## 시즌 차수별 국내1위−해외1위 전력 차 (변형별)")
    for s in sums:
        print("  %s: %s" % (s["variant"], " ".join("%d년차 %+.1f" % (k + 1, v) for k, v in s["gap_by_season"].items())))
    print("\n## 판별 월드 우승 (첫 변형)")
    for r in [r for r in results if r["variant"] == variants[0]]:
        line = " ".join("%d:%s" % (w["year"], "KR" if w["winner"]["dom"] else w["winner"]["region"].upper() + "(" + w["winner"]["name"][:8] + ",kr" + str(sum(1 for p in w["winner"]["starters"] if p["origin"] == "kr")) + ")") for w in r["worlds"])
        print("  %d 씨앗%s: %s" % (r["year"], r["seed"], line))
    errs = [(r["variant"], r["year"], r["seed"], r["errors"]) for r in results if r["errors"]]
    if errs:
        print("\n오류:", errs)
    return sums


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seasons", type=int, default=10)
    ap.add_argument("--seeds", default="1,2")
    ap.add_argument("--years", default="2012,2017,2022")
    ap.add_argument("--pos", default="mid")
    ap.add_argument("--team", default="tier2")
    ap.add_argument("--set", action="append", default=[])
    ap.add_argument("--variant", action="append", default=[])
    ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--out", default=None)
    ap.add_argument("--report", default=None, help="저장한 결과 JSON(여러 개는 쉼표)으로 표만 출력")
    o = ap.parse_args()
    if o.report:
        results = []
        for f in o.report.split(","):
            results += json.loads(Path(f).read_text(encoding="utf-8"))
        variants = list(dict.fromkeys(r["variant"] for r in results))
        report(results, variants)
        return
    a = {"pos": o.pos, "team": o.team, "seasons": o.seasons, "proto": {}}
    common = parse_sets(o.set)
    variants = []
    for v in o.variant or ["기본"]:
        name, _, sets = v.partition(":")
        items = [x.strip() for x in sets.split(";") if x.strip()]
        a["proto"][name] = {x[1:].split("=")[0]: json.loads(x.split("=", 1)[1]) for x in items if x.startswith("@")}
        variants.append((name, common + parse_sets([x for x in items if not x.startswith("@")])))
    jobs = [(a, name, ov, int(y), int(s)) for name, ov in variants for y in o.years.split(",") for s in o.seeds.split(",")]
    results = []
    with ProcessPoolExecutor(max_workers=o.jobs) as ex:
        for r in ex.map(run_one, jobs):
            results.append(r)
            print("끝: %s %d 씨앗%d (%.1f분)" % (r["variant"], r["year"], r["seed"], r["minutes"]), flush=True)
            if o.out:
                Path(o.out).write_text(json.dumps(results, ensure_ascii=False), encoding="utf-8")
    report(results, [v[0] for v in variants])
    if o.out:
        print("저장:", o.out)


if __name__ == "__main__":
    main()
