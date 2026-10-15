# tools/ — 밸런스 측정 도구 (게임과 상관없음)

게임(`index.html`)은 이 폴더를 읽지 않는다. AI가 밸런스를 잴 때 매번 스크립트를 새로 쓰지 않으려고 둔 것.

- 필요: `python3` + `playwright` (Claude 클라우드 작업 환경에는 있음. PC에서 쓰려면 `pip install playwright` 후 `playwright install chromium`)
- 조절 값 위치: **`tools/BALANCE.md`**
- 파일: `sim_lib.py`(공통) · `measure_traits.py`(특성 효과) · `measure_seasons.py`(여러 시즌 진행) · `measure_worlds.py`(월드 우승 국내 vs 해외) · `check_all.py`·`golden.py`·`shots.py`·`test_names.cjs`(코드 정리 안전망)

## 빠르게 · 같은 씨앗 = 같은 결과 (170)

- `play_weeks`는 52주씩 페이지 안에서 돌리고, 측정 중에는 화면 그리기·자동 저장을 끈다 (약 2.5배 빠름, 게임 규칙은 그대로). 예전 방식은 `fast=False` (measure_worlds는 `--slow`).
- 씨앗은 게임 파일을 읽기 전에 고정 (`open_game(pw, overrides, seed)`). 예전에는 페이지가 열릴 때 만드는 구단 목록이 매번 달라서 같은 씨앗이어도 리그가 달랐다.
- 측정은 두 단계: 씨앗 2개로 후보 거르기 → 유력한 2~3개만 씨앗 6개(180시즌).

## 코드 정리용 안전망 (R0, 2026-10-15) — 정리해도 게임 결과·화면이 그대로인지

| 도구 | 하는 일 | 시간 |
|---|---|---|
| `python3 tools/check_all.py` | 노드 검사 전부 + 정답지 비교. **정리 단계마다 이것 하나** | 약 2분 |
| `python3 tools/golden.py make` / `check` | 시나리오 5개 × 10시즌의 세이브 전체 해시 + 결과 요약을 `tools/golden/golden.json`과 비교. 세이브 모양을 일부러 바꾸는 단계(R5)는 `check --loose`(결과 요약만) | 약 2분 |
| `python3 tools/shots.py take <폴더>` · `diff <A> <B>` | 23화면 × 폭 3가지 + 겹창 5가지(경기 재생·대성공·얼굴 바꾸기·휴대폰 메뉴·신문) × 폭 2가지 = 79장을 찍고 비교 (40×40 이하나 0.005% 미만 작은 차이는 무시: 저장 시각 등). 스크린샷은 저장소에 안 넣음 → 정리 전 코드로 한 번, 정리 후 코드로 한 번 | 약 1분 |
| `python3 tools/test_oldsaves.py` | 지금 세이브를 '예전 버전 모양'(ver 1.0·리그 없음·값 망가짐)으로 깎아서 실제로 불러오고 1시즌 진행 → 오류·빠진 칸 확인 (R3) | 약 1분 |
| `python3 tools/profile_week.py [ui\|fast]` | 10시즌 게임에서 한 주 진행 시간과 오래 걸리는 함수 순위 (R6) | 약 1분 |
| `python3 tools/bundle.py [폴더]` | 공개 사이트용 묶음 만들기 (GitHub Actions가 push 때 자동 실행). `GAME_INDEX=폴더/index.html`을 붙이면 golden·shots·test_oldsaves가 묶음으로 검사 (R7) | 1초 |
| `node tools/test_savepack.cjs` | 세이브 압축(js/save.js lzPack·lzUnpack)이 어떤 글자든 그대로 되돌리는지 (R5) | 1초 |
| `node tools/test_css.cjs` | css/style.css에서 같은 폭 조건(@media) 안에 같은 선택자가 두 번 나오면 실패 (R4) | 1초 |
| `node tools/test_names.cjs` | js·data 맨 바깥 이름(function·const·let·var)이 겹치면 실패 (183 막대 깨짐 같은 사고 막기) | 1초 |

- 같은 씨앗 = 같은 결과가 되도록 화면 연출(포트레잇 점프·카드 반짝임·꽃가루·대성공 금가루)은 `fxRandom()`(js/portrait.js)을 쓴다. **연출에 `Math.random`을 쓰지 말 것** — 연출 타이머가 게임 결과용 무작위 순서를 흔들어서 정답지가 매번 달라짐 (R0에서 발견).

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

## 3) 월드 우승 국내 vs 해외 — measure_worlds.py (10시즌 1판 ≈ 1.5분)

```
python3 tools/measure_worlds.py --years 2012,2017,2022 --seeds 1,2,3,4,5,6 --seasons 10 --jobs 2 --variant "지금" --variant "러브콜끔:ABROAD.perYear=0" --out /tmp/w.json
python3 tools/measure_worlds.py --report /tmp/w.json
```
출력: 월드 우승 지역(국내/중국/북미/유럽/나머지), 같은 해외 팀 2회+·연속 우승 판 수, 해외 우승팀 한국 출신 주전 수·능력, 해외 이적(스타급), 국내 1위−해외 1위 전력(시즌 차수별), 국제대회 세트 승률. 아직 없는 수정안은 `@flat`·`@noise`·`@ovdyn` (BALANCE.md 10장).

## Claude 클라우드에서 돌릴 때
- 명령 하나가 10분을 넘으면 끊김 → 길면 `setsid nohup python3 tools/measure_seasons.py ... --out /tmp/x.json > /tmp/x.log 2>&1 &` 후 `sleep`으로 기다렸다 읽기
- 동시 실행은 3개까지가 적당 (`--jobs 3`)
- `pkill -f`는 쓰지 말 것 (셸까지 끊김)

## 뉴스 공통 처리 회귀 검사

`node tools/test_news.cjs` — 뉴스 중복·날짜·구버전 저장·효과 보존·미응답 연락·결승 재처리와 2012/2017/2022 시작 53주 진행 검사. Node 내장 모듈만 사용. DOM 대체 객체를 사용하므로 실제 브라우저 배치 검사는 별도다.

## 월즈 특집 회귀 검사

`node tools/test_worlds_news.cjs` — 41주 예고/42주 개막, 개최 후보, 실제 MVP·전년도 우승/장면, 저장 후 고정, 중복 방지, 과거 기록 없는 세이브를 검사한다. Node VM 기반이며 브라우저 화면 검사는 별도다.

## 리그 성장 뉴스·팬 배율 회귀 검사

`node tools/test_league_growth.cjs` — 인기도/우승 팬 단일 배율, 감소량·1억 이후 완화, 옛 저장 팬 수, 투자 기사 무입금, 2014·2016 실제 새해 통합 기사를 검사한다. 2012년부터 각각 진행하므로 단위 검사보다 시간이 걸린다. Node VM 기반이며 화면 배치는 별도 확인.

### 역사 뉴스 (5단계)

node tools/test_historical_news.cjs: 2012~2026 기사 편성·중복·저장·게임 수치 무변경 검사. 출처는 data/news.js(예전 historical_news.js 부분)의 source 필드. 새 게임은 SNS 신문 보관함, 다음 해부터 기존 신년 기사에 합쳐진다. 실제 53주 진행과 병합은 node tools/test_news.cjs에서도 검사한다. Node VM 검사로 화면 배치까지 검증하지는 않는다.

### 작은 시대 효과 (6단계)

node tools/test_era_match.cjs: 날짜 경계·저장·양 팀 대칭·뉴스 무보상, 시대별500세트 동일 난수 전후 비교. 실제 playSet을 사용하며 로스터 생성에 따라 측정값은 달라집니다. 전체 장기 밸런스나 실제 화면 검사는 아닙니다. 조절 값은 data/era.js.

### 뉴스 개편 통합 검증 (7단계)

결과와 미완료 화면 항목: NEWS_VALIDATION.md. node tools/test_news_integration.cjs(832주), node tools/test_news_edges.cjs(8항목), node tools/test_era_positions.cjs(포지션별 경기 비교). 통합/포지션 검사는 수 분 걸릴 수 있습니다. 실제 저장소의 localStorage에는 쓰지 않고 VM 내부 상태만 사용합니다.
