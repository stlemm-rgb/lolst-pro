# 예전 세이브 테스트 (R3, 2026-10-15): python3 tools/test_oldsaves.py
# 지금 게임으로 세이브를 하나 만든 뒤, 일부러 '예전 버전 모양'으로 깎아서 불러와 본다.
#   - 불러오기(페이지를 새로 열 때 js/start.js)가 멈추지 않는지
#   - 화면 23개가 오류 없이 그려지는지
#   - 1시즌(52주) 진행해도 오류가 없고, 빠졌던 칸이 다시 채워지는지
# 예전 버전 세이브 파일이 남아 있지 않아서, 버전별로 없던 칸을 빼서 흉내 냄 (PROGRESS의 기능 추가 순서 기준)
import copy, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim_lib import open_game, new_career, play_weeks, SEED_JS, GAME
from playwright.sync_api import sync_playwright

PAGES = ["dashboard", "training", "sns", "friends", "career", "shop", "team", "results", "schedule", "tournament",
         "standings", "world", "achievements", "collection", "transfer", "search", "clubs", "awards", "history",
         "ecosystem", "howto", "settings"]


def drop(d, keys):
    for k in keys:
        d.pop(k, None)


def v10(save):
    """ver 1.0 무렵: 해외 리그·친구·연애·입지·대성공·스태프·얼굴·뉴스 개편 등이 없던 때"""
    s = save["state"]
    drop(s, ["great", "standing", "romance", "friends", "relations", "trigQueue", "eventLog", "flags", "world", "fame",
             "sig100", "signature", "sigGrowth", "achievements", "shakeup", "newChampBuff", "housing", "dormWeeks",
             "activities", "loan", "trainHistory", "newsState"])
    s["player"].pop("look", None)
    s["settings"] = {"autoSave": True}
    drop(s["career"], ["moments", "deepRuns", "rec", "statLog", "socialSnap", "ev"])
    L = s["league"]
    drop(L, ["h2h", "titleStreaks", "worldsSkins", "sTraitLog", "rookieCards", "transferLog", "history", "lastChamps",
             "namedDone", "namedAdded", "lockedDone", "rivalYearDone", "marketSnap", "scouted"])
    for t in L["teams"]:
        drop(t, ["staff", "incomeLog", "money"])
    for p in L["players"].values():
        drop(p, ["traits", "style", "mastery", "origin", "named", "solo", "rec"])
    save["version"] = 9
    return save


def no_league(save):
    """리그·해외 리그·계약이 없던 아주 예전 세이브 (화면을 그릴 때 새로 만듦)"""
    s = v10(save)["state"]
    drop(s, ["league", "contract", "pendingMove", "weekReport", "quests"])
    save["version"] = 3
    return save


def broken(save):
    """값이 망가진 세이브: 숫자 자리에 글자, 빈 칸, 이상한 설정"""
    s = save["state"]
    s["stats"] = {k: ("abc" if i % 3 == 0 else v) for i, (k, v) in enumerate(s["stats"].items())}
    s["money"] = "많음"
    s["stamina"] = None
    s["settings"] = {"autoSave": "yes", "replayAuto": "sometimes", "replaySpeed": 9, "motion": 1}
    s["player"]["look"] = {"skin": 99, "hs": -1}
    s["plan"] = "없는 훈련"
    s["weekReport"] = {"when": "?"}
    s["quests"] = [{"id": "없는 퀘스트"}] + (s.get("quests") or [])
    s["great"] = "많이"
    return save


CASES = [("지금 버전 (비교용)", lambda x: x), ("ver 1.0 모양", v10), ("리그 없는 아주 예전", no_league), ("값이 망가진", broken)]

CHECK_JS = """() => ({
  loaded: !!state.player && state.player.name === '예전',
  look: !!(state.player && state.player.look),
  league: !!(state.league && state.league.teams.length),
  staff: !!(state.league && state.league.teams.every(t => t.staff)),
  world: !!(state.world && state.world.teams && state.world.teams.length),
  contract: !!state.contract,
  stats: Object.values(state.stats).every(v => Number.isFinite(v)),
  money: Number.isFinite(state.money),
  year: state.year, week: state.week,
})"""


def main():
    bad = 0
    with sync_playwright() as pw:
        b, page, errors = open_game(pw, seed_value=21)
        new_career(page, year=2017, team="tier1-mid")
        page.evaluate("() => { state.player.name = '예전'; }")
        play_weeks(page, 70)
        base = page.evaluate("() => makeSaveData()")
        b.close()
        for name, fn in CASES:
            save = fn(copy.deepcopy(base))
            br = pw.chromium.launch()
            pg = br.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.add_init_script("(" + SEED_JS + ")(7)")
            pg.add_init_script("localStorage.setItem('progamer-career-save', " + json.dumps(json.dumps(save, ensure_ascii=False)) + ")")
            pg.goto(GAME)
            pg.wait_for_timeout(200)
            first = pg.evaluate(CHECK_JS)
            for p in PAGES:
                pg.evaluate("(p) => { const n = document.getElementById('news-popup'); if (n) n.remove(); state.currentMenu = p; renderAll(); }", p)
            pg.evaluate("window.__orig=[renderMenu,renderTopbar,renderPage]")
            play_weeks(pg, 52)
            pg.evaluate("() => { renderMenu=__orig[0]; renderTopbar=__orig[1]; renderPage=__orig[2]; }")
            for p in PAGES:
                pg.evaluate("(p) => { const n = document.getElementById('news-popup'); if (n) n.remove(); state.currentMenu = p; renderAll(); }", p)
            after = pg.evaluate(CHECK_JS)
            br.close()
            need = ["loaded", "look", "league", "staff", "world", "contract", "stats", "money"]
            miss = [k for k in need if not after[k]] + (["불러오기 실패"] if not first["loaded"] else [])
            ok = not errs and not miss and after["year"] > first["year"]
            print(("✅ " if ok else "❌ ") + name + f": 불러옴 {first['year']}년 {first['week']}주 → 1시즌 뒤 {after['year']}년 {after['week']}주"
                  + (f" · 빠진 칸 {miss}" if miss else "") + (f" · 오류 {errs[:2]}" if errs else ""))
            bad += 0 if ok else 1
    print("결과: " + ("✅ 예전 세이브 " + str(len(CASES)) + "가지 모두 통과" if not bad else f"❌ {bad}가지 실패"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
