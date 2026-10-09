# tools/ — 밸런스 측정 도구 (게임과 상관없음)

게임(`index.html`)은 이 폴더를 읽지 않는다. AI가 밸런스를 잴 때 매번 스크립트를 새로 쓰지 않으려고 둔 것.

- 필요: `python3` + `playwright` (Claude 클라우드 작업 환경에는 있음. PC에서 쓰려면 `pip install playwright` 후 `playwright install chromium`)
- 조절 값 위치: **`tools/BALANCE.md`**
- 파일: `sim_lib.py`(공통) · `measure_traits.py`(특성 효과) · `measure_seasons.py`(여러 시즌 진행)

## 숫자 바꿔 끼우기 (파일을 고치지 않고)

`--set 경로=값` (여러 번 가능). 경로는 `data/*.js` 상수: `FOCUS_RULES.userPerS=0.2`, `SLUMP_RULES.chance=0.7`, `TRAIT_FIT.offMult=0.4`, `LEAGUE.veterans.chancePerTeam=1`
값 후보 비교는 `--variant "이름:경로=값;경로=값"`를 여러 번 (measure_seasons). 틀린 경로면 바로 오류.

## 1) 특성 효과 — measure_traits.py (5포지션 × 8특성 × 500경기 ≈ 3~4분, --jobs 2)

```
python3 tools/measure_traits.py                                  # 경기 특성 8개, 맞는/안 맞는 포지션 평균
python3 tools/measure_traits.py --pos jungle --n 800 --traits steal_master,genius
python3 tools/measure_traits.py --set TRAIT_FIT.offMult=0.3
python3 tools/measure_traits.py --level 78 --traits s_emperor --combo s_emperor+s_demon+s_lane_lord
```
출력: 포지션별 세트 승률 변화(%p) + "맞는 포지션 / 안 맞는 포지션" 평균. 한 칸 오차 ±2~4%p라 평균을 볼 것.

## 2) 여러 시즌 — measure_seasons.py (1시즌 ≈ 1~1.5분 × 변형 × 씨앗 ÷ jobs)

```
# 전승 방지 확인 (강한 미드, 2014에 S급 3개)
python3 tools/measure_seasons.py --seasons 6 --seeds 2024,7 --boost 40 --mastery 70 --traits highlight --give-s 2014

# 값 후보 3개 비교
python3 tools/measure_seasons.py --seasons 6 --seeds 2024,7 --boost 40 --mastery 70 --traits highlight --give-s 2014 \
  --variant "지금" --variant "견제강:FOCUS_RULES.userPerS=0.2" --variant "난조강:SLUMP_RULES.chance=0.7;SLUMP_RULES.goodMult=0.1" \
  --jobs 3 --out /tmp/seasons.json

# 보통 선수로 연락 수·은퇴 수·절친 수 (해마다)
python3 tools/measure_seasons.py --seasons 3 --answer random
```
출력: 변형·씨앗별 시즌 시리즈 승률, S급 받은 해부터 평균, 해마다 받은 연락·은퇴·절친 수.

## Claude 클라우드에서 돌릴 때
- 명령 하나가 10분을 넘으면 끊김 → 길면 `nohup python3 tools/measure_seasons.py ... --out /tmp/x.json > /tmp/x.log 2>&1 &` 후 `sleep`으로 기다렸다 읽기
- 동시 실행은 3개까지가 적당 (`--jobs 3`)
- `pkill -f`는 쓰지 말 것 (셸까지 끊김)

## 뉴스 공통 처리 회귀 검사

`node tools/test_news.cjs` — 뉴스 중복·날짜·구버전 저장·효과 보존·미응답 연락·결승 재처리와 2012/2017/2022 시작 53주 진행 검사. Node 내장 모듈만 사용. DOM 대체 객체를 사용하므로 실제 브라우저 배치 검사는 별도다.
