# 속도 재기 (R6, 2026-10-15): python3 tools/profile_week.py [ui|fast]
#   10시즌 진행한 게임에서 한 주 진행 시간(ms)을 재고, 크롬 프로파일러로 오래 걸리는 함수 순위를 보여 줌
#   ui = 화면 그리기 포함(실제 플레이와 같음), fast = 측정 도구처럼 화면 그리기 없이
import sys, json, collections
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from sim_lib import *
from playwright.sync_api import sync_playwright
MODE = sys.argv[1] if len(sys.argv) > 1 else "ui"
with sync_playwright() as pw:
    b, page, errors = open_game(pw, seed_value=3)
    page.set_viewport_size({"width":1400,"height":900})
    new_career(page, year=2017, team="tier1-mid")
    page.evaluate("window.__orig=[renderMenu,renderTopbar,renderPage]")
    play_weeks(page, 52*10)
    if MODE == "ui":
        page.evaluate("() => { renderMenu=__orig[0]; renderTopbar=__orig[1]; renderPage=__orig[2]; state.settings.autoSave=false; state.settings.replayAuto='off'; }")
    t = page.evaluate("""() => { const out=[]; for (let i=0;i<20;i++){ const a=performance.now(); state.plan='scrim'; nextWeek(); document.querySelectorAll('#news-popup').forEach(e=>e.remove()); out.push(performance.now()-a);} return out; }""")
    print(MODE, "ms/week avg", round(sum(t)/len(t),1), "min", round(min(t)), "max", round(max(t)))
    cdp = page.context.new_cdp_session(page)
    cdp.send("Profiler.enable"); cdp.send("Profiler.setSamplingInterval", {"interval": 100}); cdp.send("Profiler.start")
    page.evaluate("""() => { for (let i=0;i<30;i++){ state.plan='scrim'; nextWeek(); document.querySelectorAll('#news-popup').forEach(e=>e.remove()); } }""")
    prof = cdp.send("Profiler.stop")["profile"]
    nodes = {n["id"]: n for n in prof["nodes"]}
    self_t = collections.Counter()
    dt = prof["timeDeltas"]; samples = prof["samples"]
    for s, d in zip(samples, dt):
        n = nodes[s]; cf = n["callFrame"]
        self_t[(cf["functionName"] or "(anon)") + " " + cf["url"].split("/")[-1] + ":" + str(cf["lineNumber"]+1)] += d
    # inclusive: walk parents
    parent = {}
    for n in prof["nodes"]:
        for c in n.get("children", []): parent[c] = n["id"]
    incl = collections.Counter()
    for s, d in zip(samples, dt):
        seen=set(); x=s
        while x is not None:
            cf = nodes[x]["callFrame"]; k=(cf["functionName"] or "(anon)") + " " + cf["url"].split("/")[-1]
            if k not in seen: incl[k]+=d; seen.add(k)
            x = parent.get(x)
    tot = sum(dt)
    print("total ms", round(tot/1000))
    print("SELF top"); [print(f"  {v/tot*100:5.1f}% {k}") for k,v in self_t.most_common(18)]
    print("INCL top"); [print(f"  {v/tot*100:5.1f}% {k}") for k,v in incl.most_common(30) if '.js' in k]
    print(errors); b.close()
