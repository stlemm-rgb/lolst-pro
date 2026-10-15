# 정리(R0~R9) 단계마다 한 번에 돌리는 검사: python tools/check_all.py [--loose] [--no-golden]
#   1) 노드 검사 tools/test_*.cjs 전부 (이름 겹침 검사 포함)
#   2) 정답지 비교 tools/golden.py check (약 2분)
import subprocess, sys
from pathlib import Path
T = Path(__file__).resolve().parent
bad = 0
for f in sorted(T.glob("test_*.cjs")):
    r = subprocess.run(["node", str(f)], capture_output=True, text=True)
    print(("✅ " if r.returncode == 0 else "❌ ") + f.name)
    if r.returncode:
        bad += 1; print(r.stdout[-600:], r.stderr[-600:])
if "--no-golden" not in sys.argv:
    args = [sys.executable, str(T / "golden.py"), "check"] + (["--loose"] if "--loose" in sys.argv else [])
    r = subprocess.run(args)
    bad += 1 if r.returncode else 0
print("전체: " + ("✅ 통과" if not bad else f"❌ 실패 {bad}개"))
sys.exit(1 if bad else 0)
