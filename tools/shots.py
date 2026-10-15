# 화면 비교 (R0, 2026-10-15): 코드 정리 전·후 화면이 똑같은지 확인
#
#   python tools/shots.py take <폴더>          → 22화면 + 캐릭터 생성 × 폭 3가지(1400·768·390) 스크린샷
#   python tools/shots.py diff <폴더A> <폴더B>  → 두 폴더 비교, 다른 화면과 다른 픽셀 비율
#
# 같은 씨앗으로 60주 진행한 같은 상태를 찍음. 움직임 끄기(애니메이션 없음)로 찍어서 매번 같은 그림.
# 스크린샷은 크기가 커서 저장소에 넣지 않음 → 비교할 때마다 '정리 전 코드'로 한 번, '정리 후 코드'로 한 번 찍기
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim_lib import open_game, new_career, play_weeks

PAGES = ["dashboard", "training", "sns", "friends", "career", "shop", "team", "results", "schedule", "tournament",
         "standings", "world", "achievements", "collection", "transfer", "search", "clubs", "awards", "history",
         "ecosystem", "howto", "settings"]
WIDTHS = [1400, 768, 390]
CLEAN = """() => { const n = document.getElementById('news-popup'); if (n) n.remove();
  if (state.weekReport) state.weekReport.headlinesSeen = true; }"""


def take(out):
    from playwright.sync_api import sync_playwright
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        b, page, errors = open_game(pw, seed_value=9)
        for w in WIDTHS:
            page.set_viewport_size({"width": w, "height": 900})
            page.wait_for_timeout(100)
            page.screenshot(path=str(out / f"creation_{w}.png"), full_page=True)
        new_career(page, year=2017, team="tier1-mid")
        page.evaluate("window.__orig=[renderMenu,renderTopbar,renderPage]")
        play_weeks(page, 60)
        page.evaluate("() => { renderMenu=__orig[0]; renderTopbar=__orig[1]; renderPage=__orig[2]; state.settings.motion='off'; state.settings.replayAuto='off'; }")
        for w in WIDTHS:
            page.set_viewport_size({"width": w, "height": 900})
            for p in PAGES:
                page.evaluate(CLEAN)
                page.evaluate("(p) => { state.currentMenu = p; renderAll(); window.scrollTo(0, 0); }", p)
                page.evaluate(CLEAN)
                page.wait_for_timeout(60)
                page.screenshot(path=str(out / f"{p}_{w}.png"), full_page=True)
        b.close()
    print(f"찍음: {out} ({len(list(out.glob('*.png')))}장)" + (f" · 브라우저 오류 {errors[:2]}" if errors else ""))
    return 1 if errors else 0


def diff(a, b):
    from PIL import Image, ImageChops
    a, b = Path(a), Path(b)
    bad = 0
    names = sorted(set(p.name for p in a.glob("*.png")) | set(p.name for p in b.glob("*.png")))
    for n in names:
        if not (a / n).exists() or not (b / n).exists():
            print(f"✗ {n}: 한쪽에만 있음"); bad += 1; continue
        x, y = Image.open(a / n).convert("RGB"), Image.open(b / n).convert("RGB")
        if x.size != y.size:
            print(f"✗ {n}: 크기 다름 {x.size} → {y.size}"); bad += 1; continue
        box = ImageChops.difference(x, y).getbbox()
        if box:
            d = ImageChops.difference(x, y).convert("L").point(lambda v: 255 if v > 8 else 0)
            pct = d.histogram()[255] / (x.size[0] * x.size[1]) * 100
            if (box[2] - box[0]) * (box[3] - box[1]) <= 40 * 40:
                print(f"· {n}: 아주 작은 차이 무시 (영역 {box}, 저장 시각·포커스 테두리 같은 것)"); continue
            print(f"✗ {n}: 다른 픽셀 {pct:.2f}% (영역 {box})"); bad += 1
    print(f"결과: {len(names)}장 중 " + ("✅ 모두 같음" if not bad else f"❌ {bad}장 다름"))
    return 1 if bad else 0


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "take":
        sys.exit(take(sys.argv[2]))
    if len(sys.argv) >= 4 and sys.argv[1] == "diff":
        sys.exit(diff(sys.argv[2], sys.argv[3]))
    print(__doc__ if __doc__ else "사용법: take <폴더> / diff <폴더A> <폴더B>")
