### [심각도: 중간] 부상 중에도 올스타전에 출전하고 수당을 받음

- 위치: [js/fame.js:212](/C:/project/Game/js/fame.js:212), [js/main.js:883](/C:/project/Game/js/main.js:883)
- 무슨 일이 생기나: 부상 상태로 올스타 주차에 도달해 팬 투표에 선정되면, 결장하지 않고 출전 횟수·수당·보상을 받습니다. 메모리 재현에서 부상 3주가 남았는데도 올스타 출전 1회와 300만 원이 추가됐습니다.
- 근거:
  ```js
  if (state.player.position === pos && !state.benched)
    cands.push({ id: USER_ID, fan: state.popularity });
  ```
  일반 경기는 `userSidelined()`를 사용하지만, 올스타 후보 선정은 부상을 확인하지 않습니다.
- 고치는 방법 제안: 올스타 후보 조건에도 `!userSidelined()`를 적용하세요.
- 확신: 확실

### [심각도: 중간] 훈련 예상치에 부상·번아웃 효과가 반영되지 않음

- 위치: [js/training_page.js:8](/C:/project/Game/js/training_page.js:8), [js/main.js:661](/C:/project/Game/js/main.js:661)
- 무슨 일이 생기나: 부상 중 솔로 랭크를 선택하면 실제로는 재활하지만, 화면에는 스탯·숙련도 상승과 솔랭 12판이 예상 결과로 나옵니다. 번아웃의 훈련 효과 40% 감소도 예상치에서 빠집니다.
- 근거:
  ```js
  const half = tired ? 0.5 : 1;
  ```
  `trainingExpect()`는 지침 배율만 계산합니다. 실제 진행은 `rehabTraining()`으로 훈련을 교체하고 `burnoutTrainingMult()`를 적용합니다. 메모리 재현에서도 부상·번아웃 상태와 건강한 상태의 예상치가 동일했습니다.
- 고치는 방법 제안: 이번 주 예상에는 재활을 반영하고, 스탯·숙련도 예상 계산에도 번아웃 배율을 적용하세요.
- 확신: 확실

찾은 것 없음:
- 저장 누락: `health` 저장·복원 왕복 확인 통과.
- 이전 세이브: `health`가 없을 때 기본값 생성 확인.
- 새해 전환: 부상·번아웃 상태에서 52주→다음 해 1주 진행 확인.
- 전역 이름 중복: `test_names.cjs` 통과.
- CSS 선택자 중복: `test_css.cjs` 통과.

파일은 수정하지 않았습니다. PC·모바일의 실제 화면 배치와 터치는 검증하지 않았습니다.