# 공개 사이트용 묶기 (R7, 2026-10-15): python3 tools/bundle.py [출력 폴더, 기본 _site]
#
# GitHub Actions(.github/workflows/pages.yml)가 push 때마다 자동으로 실행해서 공개 사이트에만 씀.
# 내 PC에서 Challenger_Road.html을 더블클릭해 하는 개발·플레이는 지금처럼 파일 그대로 (이 도구는 손댈 필요 없음).
#
# 하는 일
#   1) Challenger_Road.html이 읽는 스크립트(data → js, 순서 그대로)를 game.js 하나로 이어 붙임
#   2) Challenger_Road.html의 <script> 줄들을 game.js 한 줄로 바꿔 index.html로 저장 (웹 주소는 그대로, ?v=내용 해시: 새 버전을 올리면 브라우저가 바로 새 파일을 받음)
#   3) css/style.css 복사 (?v= 해시), .nojekyll
#   → 공개 사이트에는 게임에 필요한 파일만 올라감 (시안·문서·도구·updates 이미지는 저장소에만 남음)
import hashlib, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def build(out):
    out = Path(out)
    if out.exists():
        shutil.rmtree(out)
    (out / "css").mkdir(parents=True)
    html = (ROOT / "Challenger_Road.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script src="([^"]+)"></script>', html)
    parts = []
    for s in scripts:
        code = (ROOT / s).read_text(encoding="utf-8").rstrip()
        # 파일마다 끝에 ; 를 붙여 앞 파일 끝과 다음 파일 첫 줄이 붙어서 뜻이 바뀌는 일 막기
        parts.append("// ▼▼▼ " + s + " ▼▼▼\n" + code + "\n;\n")
    game = "// 챌린저 로드 — 공개 사이트용 묶음 (tools/bundle.py가 자동으로 만듦, 직접 고치지 말 것)\n" + "".join(parts)
    (out / "game.js").write_text(game, encoding="utf-8")
    css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    (out / "css" / "style.css").write_text(css, encoding="utf-8")
    h = lambda t: hashlib.sha1(t.encode("utf-8")).hexdigest()[:10]
    # <script> 줄들(앞뒤 주석·빈 줄 포함 덩어리)을 한 줄로
    first = html.index('<script src="')
    last_tag = '<script src="' + scripts[-1] + '"></script>'
    last = html.index(last_tag) + len(last_tag)
    line_start = html.rfind("\n", 0, first) + 1
    new_html = html[:line_start] + '  <script src="game.js?v=' + h(game) + '"></script>' + html[last:]
    new_html = new_html.replace('href="css/style.css"', 'href="css/style.css?v=' + h(css) + '"')
    (out / "index.html").write_text(new_html, encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    print(f"묶음: 스크립트 {len(scripts)}개 → game.js ({len(game.encode('utf-8')) // 1024}KB) · {out}")
    return out


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else ROOT / "_site")
