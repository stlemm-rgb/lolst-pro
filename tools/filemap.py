# 파일 지도 만들기 (R2): python tools/filemap.py → FILEMAP.md
# index.html이 읽는 순서대로, 파일마다 첫 줄 설명과 크기, 합쳐진 예전 파일 이름을 적음
import re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
idx = (root / "index.html").read_text(encoding="utf-8")
files = re.findall(r'<script src="([^"]+)"', idx)
rows = []
for f in files:
    t = (root / f).read_text(encoding="utf-8")
    first = next((l.strip("/ =").strip() for l in t.splitlines() if l.strip().startswith("//")), "")
    first = re.sub(r"\s*\(R2: 파일 \d+개를 합침\)", "", first)
    first = re.sub(r"^" + re.escape(f) + r" — ", "", first)
    olds = re.findall(r"━━━━━ \(예전 ([^)]+)\) ━━━━━", t)
    rows.append((f, len(t.encode("utf-8")) // 1024, first.replace("|", "/")[:90], ", ".join(o.split("/")[-1] for o in olds)))
out = ["# 파일 지도", "", "`python3 tools/filemap.py`로 다시 만들 수 있어요. 순서 = index.html이 읽는 순서 (data → js, 뒤 파일이 앞 파일 것을 쓸 수 있음).", "",
       "| 파일 | KB | 하는 일 | 합쳐진 예전 파일 |", "|---|---|---|---|"]
out += ["| `%s` | %d | %s | %s |" % r for r in rows]
out += ["", "- 데이터(숫자·문구)는 `data/`, 규칙·화면 코드는 `js/` (CLAUDE.md 규칙)", "- 검사 도구: `tools/` (게임은 읽지 않음, tools/README.md)"]
(root / "FILEMAP.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print("FILEMAP.md:", len(rows), "files")
