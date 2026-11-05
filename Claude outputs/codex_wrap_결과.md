파일은 수정하지 않았습니다. `CLAUDE.md`, `FILEMAP.md`와 관련 코드를 조사했습니다.

**우선 확인할 곳은 재생 해설, 재생 버튼, 요약 창 승패 칸입니다.** 아래는 코드로 확인한 위험 구조이며, 브라우저에서 높이를 직접 측정하지 않았으므로 실제 흔들림 여부는 **추측**으로 표시했습니다.

| 화면 | 요소·위치 | 바뀌는 글자 | 왜 흔들릴 수 있나 | 위험도 |
|---|---|---|---|---|
| 경기 재생 | `.rp-cast` — [style.css:2213](C:/Project/Game/css/style.css:2213), [replay.js:382](C:/Project/Game/js/replay.js:382) | 사건마다 바뀌는 해설·선수 이름 | 최소 높이만 지정되어 있어 한 줄과 두 줄을 오갈 수 있음. 아래 그래프·버튼이 이동. PC도 왼쪽 칸이 380px라 확인 필요 | **높음·추측** |
| 경기 재생 | `#rp-play`, `.rp-ctrl` — [replay.js:255](C:/Project/Game/js/replay.js:255), [style.css:1103](C:/Project/Game/css/style.css:1103) | `▶ 재생` / `⏸ 일시정지` / `↺ 다시 보기` | 버튼 너비가 달라짐. 옆 배속 버튼이 좌우로 이동하고, 경계에서는 버튼 줄 수도 달라질 수 있음 | **높음·추측** |
| 이번 주 요약 | `.ws-res` — [dash_plus.js:99](C:/Project/Game/js/dash_plus.js:99), [style.css:1441](C:/Project/Game/css/style.css:1441) | 빈칸 → `승리` 또는 `패배` | 처음에는 승패 칸의 너비가 0에 가까움. 결과가 나오면 상대 이름 칸이 좁아져 줄바꿈·행 높이가 바뀔 수 있음 | **높음·추측** |
| 경기 재생 | `.rp-setbar`, `.rp-st` — [replay.js:167](C:/Project/Game/js/replay.js:167), [style.css:1078](C:/Project/Game/css/style.css:1078) | `1세트` → `1세트 · 팀명 승`, 하이라이트·승부처 표시 | 모바일 시계를 분리해도 **세트 버튼 자체는 길어짐**. 또 768px에는 시계 분리 규칙이 적용되지 않음 | **중간·추측** |
| 상단 상태 막대 | `.topbar` — [style.css:159](C:/Project/Game/css/style.css:159), [main.js:480](C:/Project/Game/js/main.js:480) | 일정명·자금·훈련·체력·대성공 배지 | 전체 줄이 자동 줄바꿈됨. 특히 768px은 왼쪽 메뉴도 공간을 차지하므로 상태에 따라 줄 수가 달라질 가능성 | **중간·추측** |

**바꿀 안**

다음은 적용하지 않은 제안입니다. 기존 규칙은 그 자리에서 교체하며, 새 색상은 사용하지 않습니다.

**1. 해설: 우선 두 줄 공간을 확보하는 안**

[css/style.css:2213](C:/Project/Game/css/style.css:2213)의 `.rp-cast` 규칙 안에서 다음 부분만 교체합니다.

원래:
```css
min-height: 34px;
```

새 글자:
```css
height: 56px; min-height: 56px; line-height: 21px;
```

그리고 현재 없는 선택자를 한 번만 추가합니다.

```css
#rp-cast-t {
  flex: 1;
  min-width: 0;
  max-height: 42px;
  overflow-y: auto;
  overflow-wrap: anywhere;
}
```

두 줄보다 긴 해설은 내부에서 스크롤할 수 있습니다. **두 줄 공간을 항상 둘지는 디자인 선택**입니다. 한 줄 말줄임도 가능하지만 해설이 잘리므로, 이 안이 내용 보존에 유리합니다.

**2. 재생 버튼: 가장 긴 문구의 자리를 미리 확보**

[js/replay.js:85](C:/Project/Game/js/replay.js:85)에서 정확히 다음 부분을 교체합니다.

원래:
```html
class="primary" data-rpplay="1"
```

새 글자:
```html
class="primary rp-play-toggle" data-rpplay="1"
```

`css/style.css`에 새 선택자를 한 번만 추가합니다.

```css
.rp-play-toggle {
  flex: 0 0 9em;
  width: 9em;
}
```

세 문구가 바뀌어도 같은 너비를 사용합니다. 전체 버튼이 두 줄이 되는 것 자체는 정상이며, **재생 상태 때문에 줄 배치가 바뀌지 않는 것**이 목표입니다.

**3. 요약 창: ‘승리/패배’ 두 글자 자리 확보**

[css/style.css:1441](C:/Project/Game/css/style.css:1441)

원래:
```css
.ws-res { font-weight: 800; white-space: nowrap; }
```

새 글자:
```css
.ws-res { font-weight: 800; white-space: nowrap; flex: 0 0 2em; text-align: center; }
```

빈칸일 때도 같은 공간을 차지하므로, 결과가 나타날 때 상대 이름 칸을 밀지 않습니다.

**4. 세트 줄: 시계 문제와 세트 버튼 문제를 따로 처리**

768px에서도 시계를 항상 별도 줄에 둘 경우, [css/style.css:2304](C:/Project/Game/css/style.css:2304)의 기존 규칙을 교체합니다.

원래:
```css
@media (max-width: 760px) { .rp-clock { flex-basis: 100%; text-align: right; overflow: hidden; text-overflow: ellipsis; } }
```

새 글자:
```css
@media (max-width: 820px) { .rp-clock { flex-basis: 100%; text-align: right; overflow: hidden; text-overflow: ellipsis; } }
```

820px은 기존 재생 화면이 한 열로 바뀌는 기준입니다. **이 변경만으로 세트 버튼의 줄바꿈까지 해결되지는 않습니다.**

세트 버튼은 다음 중 선택이 필요합니다.

- 결과 팀명을 그대로 표시: 모든 세트의 최종 문구에 맞춰 버튼 공간을 처음부터 확보.
- 버튼 크기를 작게 유지: 버튼에는 세트 번호만 표시하고 승리 팀은 별도 영역으로 이동.

1400px에서도 긴 팀명·5세트·하이라이트 표시 조합은 별도로 확인해야 합니다.

**5. 상단 막대는 재현 후 배치를 결정하는 편이 좋습니다**

우선 768px에서 확인하고, 높이가 바뀐다면 날짜 줄과 조작 줄을 항상 분리하는 안이 적절합니다. 전체 막대에 고정 높이부터 주면 버튼이 넘치거나 가려질 수 있어 권하지 않습니다.

**Claude가 확인할 방법**

390px·768px·1400px 각각에서 다음을 비교하면 됩니다. 높이뿐 아니라 버튼의 좌우 이동도 봐야 합니다.

| 대상 | 재현할 상태 | 측정할 요소 |
|---|---|---|
| 해설 | 짧은 해설 ↔ 선수·상대 이름이 들어가는 긴 해설 | `#rp-cast.offsetHeight`, `#rp-flow`의 위쪽 위치 |
| 재생 버튼 | 재생 ↔ 일시정지 ↔ 세트 종료의 다시 보기 | `#rp-play.offsetWidth`, 부모 `.rp-ctrl.offsetHeight`, 각 배속 버튼 위치 |
| 요약 승패 | 긴 상대 이름이 있는 경기에서 결과 애니메이션 전후 | `.ws-res.offsetWidth`, `.ws-mrow.offsetHeight`, `.ws-foot` 위치 |
| 세트 줄 | 3·5세트 경기의 진행 전후, 하이라이트·승부처 표시 | `#rp-setbar.offsetHeight`, 각 `.rp-st` 위치 |
| 상단 막대 | 9→10주, 일정 변경, 긴 훈련명, 대성공 배지 유무 | `#topbar.offsetHeight`, `.topbar-actions` 위치 |

개발자 도구에서 다음처럼 측정할 수 있습니다.

```js
function measure(selector) {
  return [...document.querySelectorAll(selector)].map(el => {
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent.trim(),
      height: el.offsetHeight,
      width: el.offsetWidth,
      top: r.top,
      left: r.left
    };
  });
}
```

같은 스크롤 위치에서 상태 전후를 비교하세요. 요약 창은 확대·이동 애니메이션이 있으므로, **실제 칸 높이 변화는 `offsetHeight`로 구분**하는 것이 좋습니다.

**이번 조사에서 우선 수정 대상으로 보지 않은 곳**

- **다다닥 숫자:** `.ws-flip .d`는 고정 너비이고, 체력·컨디션 숫자도 `.ws-bar`의 34px 칸 안에 있습니다. `tabular-nums`가 없다는 이유만으로 주변 흔들림이라고 볼 수 없습니다.
- **요약 정보·특별한 일:** 처음부터 DOM에 있고 투명도·이동 효과로 나타납니다. 나타나는 순간 공간이 새로 생기는 구조는 아닙니다.
- **킬 알림·큰 사건 글씨·흐름 그래프 라벨:** 지도 위에 겹쳐 배치됩니다. 글자가 길어져도 본문을 직접 밀지 않습니다.
- **모바일 하단 메뉴:** 버튼의 `white-space: nowrap`을 상속하므로 상태 문구가 자동으로 두 줄이 되는 구조는 아닙니다. 긴 문구의 넘침은 별도 확인 대상입니다.
- **종료 안내·밴픽 소개:** 종료 안내가 열리면 아래 내용이 밀리는 것은 현재 설계입니다. 밴픽 소개는 겹쳐 뜨는 영역입니다. 둘 다 반복적인 숫자 줄바꿈 버그와 구분해야 합니다.

현재 파일에 대해 `node tools/test_css.cjs`를 실행한 결과, **규칙 1,769개·중복 0개로 통과**했습니다. 위 수정안은 미적용이므로 적용 후 검사와 화면 측정이 필요합니다.