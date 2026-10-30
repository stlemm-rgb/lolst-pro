# 체력·컨디션 측정 (219 준비, 2026-10-31): 플레이 방식 3가지(기본 30↓ 휴식 / 안 쉼 솔랭만 / 관리 50↓ 휴식) × 2부 2012·1부 2017 미드 × 씨앗 3 × 2시즌
# 실행: python3 tools/measure_fatigue.py . /tmp/fatigue.json  (약 6분)
import sys, json, statistics as st
sys.path.insert(0, sys.argv[1] + "/tools")
import sim_lib as S
from playwright.sync_api import sync_playwright

POL = {
 "기본(30↓ 휴식)": "state.stamina < 30 ? 'rest' : (state.week % 2 ? 'scrim' : 'replay')",
 "안 쉼(솔랭만)": "'solo_rank'",
 "관리(50↓ 휴식)": "state.stamina < 50 ? 'rest' : (state.week % 2 ? 'scrim' : 'replay')",
}
SC = [("2부 2012 미드", 2012, "tier2"), ("1부 2017 미드", 2017, "tier1-mid")]
SEEDS = [11, 22, 33]
WEEKS = 104
JS = """([pol, weeks]) => {
  window.__sets = []; window.__wk = [];
  const orig = userMatchContext;
  userMatchContext = function (a, b, c) { const r = orig(a, b, c); window.__sets.push([state.stamina, state.condition]); return r; };
  renderMenu = function () {}; renderTopbar = function () {}; renderPage = function () {}; state.settings.autoSave = false;
  const s0 = playerScore(USER_ID);
  for (let i = 0; i < weeks; i++) {
    document.querySelectorAll('#news-popup').forEach(e => e.remove());
    state.retirePlanned = false;
    state.plan = eval(pol);
    state.inbox.filter(m => m.tab === 'inbox' && m.choices && m.answered === null && m.kind !== 'retire' && m.kind !== 'offer').forEach(m => answerMessage(m.id, 0));
    window.__wk.push([state.stamina, state.condition, state.plan === 'rest' ? 1 : 0]);
    nextWeek();
  }
  const seasons = state.career.seasons || [];
  const sets = seasons.reduce((a, s) => a + s.sets, 0), sw = seasons.reduce((a, s) => a + s.setWins, 0);
  return { wk: window.__wk, sets: window.__sets, growth: playerScore(USER_ID) - s0, swr: sets ? sw / sets : 0, nsets: sets };
}"""
out = {}
with sync_playwright() as pw:
    for scn, yr, team in SC:
        for pn, pol in POL.items():
            agg = []
            for sd in SEEDS:
                b, page, err = S.open_game(pw, seed_value=sd)
                S.new_career(page, pos="mid", year=yr, team=team)
                agg.append(page.evaluate(JS, [pol, WEEKS]))
                b.close()
            wk = [w for a in agg for w in a["wk"]]; sets = [x for a in agg for x in a["sets"]]
            pct = lambda xs, f: round(100 * sum(1 for x in xs if f(x)) / max(1, len(xs)))
            row = {
              "체력평균": round(st.mean(w[0] for w in wk)), "체력<20 주%": pct(wk, lambda w: w[0] < 20), "체력<30 주%": pct(wk, lambda w: w[0] < 30),
              "휴식 주%": pct(wk, lambda w: w[2] == 1),
              "컨디션평균": round(st.mean(w[1] for w in wk)), "컨디션<30 주%": pct(wk, lambda w: w[1] < 30), "컨디션<50 주%": pct(wk, lambda w: w[1] < 50),
              "세트: 체력<30%": pct(sets, lambda x: x[0] < 30), "세트: 컨디션평균": round(st.mean(x[1] for x in sets)) if sets else 0,
              "2시즌 성장": round(st.mean(a["growth"] for a in agg), 1), "세트승률%": round(100 * st.mean(a["swr"] for a in agg), 1),
            }
            out[scn + " / " + pn] = row
            print(scn, pn, json.dumps(row, ensure_ascii=False), flush=True)
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
