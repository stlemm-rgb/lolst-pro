# 지시문: 친구 시스템 데이터 파일 만들기 (data/friends.js)

## 작업 요약
- 저장소: `C:\Project\Game\Game` (순수 HTML/CSS/JS 롤 프로게이머 커리어 게임, 한국어).
- **새 파일 `data/friends.js` 하나만 만듭니다.** 다른 파일(js/*, index.html, 다른 data/*)은 절대 수정하지 마세요. 엔진·화면·index.html 연결은 다른 AI가 따로 합니다.
- 내용: ① 분기 친구 활동 `FRIEND_ACTIVITIES` ② 관계 단계 이야기 `FRIEND_STAGE_STORIES` ③ 친구 전용 연락 `EVENTS.push(...)`.
- 참고할 기존 파일(읽기만): `data/events_life.js`(글 분위기·형식 예시), `data/events.js`(EVENTS 정의, 기존 id 확인), `data/stats.js`(능력치 id).

## 게임 설정 (글 쓸 때 알아야 할 것)
- 내 선수는 LCK 같은 리그의 프로게이머. 1년 = 52주. 스프링·MSI·서머·월즈, 47주부터 비시즌.
- 친구 활동은 **1년에 4번(분기)** 연락으로 옵니다. 후보 선수 3명이 각자 활동 하나와 짝지어 선택지로 나옵니다. 예: "🎮 {player}와(과) 새벽 듀오 솔랭".
  - q1 = 3주 (비시즌 끝, 새 시즌 준비) / q2 = 16주 (스프링 끝난 휴식기) / q3 = 29주 (서머 중반, 이적 시장 직후) / q4 = 49주 (시즌 끝, 휴가)
- 후보 선수 종류(`kind`): `mate` 같은 팀 동료 / `rival` 같은 포지션 다른 팀 / `old` 예전 팀 동료 / `peer` 동갑·같은 시기 데뷔 다른 팀.
- 관계 점수: −100~100. 친함 25↑ → 친구, 50↑ → 절친. 절친은 최대 3명.
- **핵심 원칙: "말 한 번 했다"가 아니라 "무엇을 같이 하며 친해졌다"가 보이게.** 장면·대사·구체적인 디테일이 들어간 짧은 이야기(1~3문장).
- 문장 톤: 쉬운 한국어, 반말 서술("~했다"), 따옴표 대사 가끔. 실존 선수·실제 팀 이름 금지.

## 쓸 수 있는 자리표시자 (글 안에서)
`{player}` 친구 이름 · `{pteam}` 친구 팀 이름 · `{pos}` 친구 포지션 이름 · `{me}` 내 선수 이름 · `{year}` 올해 연도.
조사는 "와(과)", "이(가)", "을(를)", "은(는)"처럼 둘 다 적습니다.

## 쓸 수 있는 효과 키 (effects)
- 능력치(+1~+2만): `accuracy` `laning` `teamfight` `macro` `vision` `shotcall` `pool` `mental` `reaction` `spacing` `adapt` `focus`
- `condition` 컨디션(−10~+12), `stamina` 체력(−8~+12), `popularity` 인기도(−3~+4), `reputation` 평판(−4~+4), `money` 원(예: −300000)
- `relation` 친구와의 관계 변화 (아래 숫자 범위 지킬 것)
- `flag: { 이름: true }` / `unflag: "이름"` 이야기 기억 (연작용, 이름은 `fr_`로 시작)
- 새 키 `friendTip: true` = 다른 팀 친구가 이적 정보를 줌 (엔진이 처리. 다른 팀 친구 연락에서만)
- **난이도 영향은 작게.** 활동 하나의 덤은 효과 1~2개, 위 범위 안.

---

## ① FRIEND_ACTIVITIES (분기 활동) — 최소 20개

```js
const FRIEND_ACTIVITIES = [
  {
    id: "duo_soloq",              // 영문 소문자_밑줄, 고유
    icon: "🎮",
    label: "새벽 듀오 솔랭",        // 선택지: "🎮 {player}와(과) 새벽 듀오 솔랭"
    when: ["q1", "q2", "q3"],     // 나올 수 있는 분기 (q4 휴가 전용 활동도 만들기)
    kinds: ["mate", "rival", "old", "peer"], // 이 활동이 어울리는 후보 종류 (예: 숙소 활동은 mate만)
    relation: 10,                 // 관계 + (작음 6~8 / 보통 10~12 / 큼 14~16 / 아주 큼 18~22)
    effects: { focus: 1, stamina: -3 },      // 작은 덤 (없으면 {})
    stories: [                    // 결과 이야기 3개 이상 (무작위 1개)
      "{player}와(과) 새벽 4시까지 듀오를 돌렸다. 30연승을 찍은 순간 둘 다 소리를 질러 옆방에서 벽을 쳤다.",
      "...",
      "...",
    ],
    // 선택: 능력치 판정이 있는 활동 (전체의 1/4 정도)
    // check: { stat: "popularity", diff: 50 },   // stat은 능력치 id 또는 popularity·reputation·condition·stamina
    // failRelation: 3,                           // 실패 시 관계 (+0~5, 혹은 −3까지)
    // failEffects: { condition: -3 },
    // failStories: ["...", "..."],               // 실패 이야기 2개 이상 (어색했지만 추억, 같은 톤)
  },
];
```

만들 활동 가이드 (아이디어, 그대로 안 써도 됨):

| 분기 | 활동 예 |
|---|---|
| 공통 | 듀오 솔랭, VOD 같이 분석, 야식 원정, PC방 1:1 내기, 합동 방송(판정: popularity), 아침 러닝 |
| q1 새 시즌 준비 | 새 챔피언 같이 연구, 헬스장 등록, 새해 첫 일출 |
| q2 스프링 휴식기 | 맛집 원정, 볼링·노래방, 놀이공원(판정: mental, 무서운 놀이기구) |
| q3 서머 중반 | 한강 치킨, 이적 시장 고민 상담, 여름 바다 당일치기 |
| q4 휴가 | 여행(제주·해외) — 아주 큼, 캠핑, 상대 고향 방문, 연말 파티 |
| mate 전용 | 숙소 요리 대결, 새벽 1:1 라인전 연습, 숙소 대청소 |
| rival/peer 전용 | 서로의 약점 분석해 주기, 올스타 이벤트 듀오, 팬미팅 동반 출연 |

## ② FRIEND_STAGE_STORIES (관계 단계 이야기)

관계가 25(친구) 또는 50(절친)을 처음 넘을 때 소식으로 나옵니다. 각 6개 이상.

```js
const FRIEND_STAGE_STORIES = {
  friend: [   // 친구가 됨
    "이제 {player}와(과)는 경기 끝나고 '밥 먹었냐'는 연락을 주고받는 사이가 됐다.",
  ],
  best: [     // 절친이 됨
    "{player}의 휴대폰에 내 이름이 '{me} 🐶'로 저장돼 있다는 걸 알았다. 이 녀석, 이제 진짜 절친이다.",
  ],
  bestFull: [ // 절친이 이미 3명이라 더 못 늘 때 (가볍게, 3개 이상)
    "{player}와(과)도 꽤 가까워졌다. 하지만 속마음까지 털어놓을 사이는 아직 아니다.",
  ],
};
```

## ③ 친구 전용 연락 EVENTS.push(...) — 최소 14개

형식은 `data/events_life.js`와 똑같이 씁니다. 그 파일의 `friend_duo`, `friend_advice`, `foe_clash`가 좋은 예시입니다.

```js
EVENTS.push(
  {
    id: "fr_slump_cheer",           // 반드시 fr_로 시작, 기존 EVENTS id와 겹치지 않게
    tab: "inbox",                   // 선택지가 있으면 inbox, 소식만이면 "news" + effects
    trigger: "random",              // 아래 트리거 표 중 하나
    who: "bestFriend",              // 아래 who 표 중 하나
    need: { weeks: [10, 40] },      // 선택 (minWeek, weeks:[a,b], flag, noFlag, tier, minAge)
    title: "💬 {player}의 새벽 전화",
    text: "...",
    choices: [
      { label: "...", effects: { relation: 8, condition: 4 }, result: "..." },
      { label: "...", check: { stat: "mental", diff: 50 },
        success: { effects: {...}, result: "..." },
        fail: { effects: {...}, result: "..." } },
      { label: "...", effects: {...}, result: "...",
        followUp: { event: "fr_다음편_id", weeks: [4, 10], chance: 0.8 } },  // 연작: 다음 편 trigger는 "followUp"
    ],
  }
);
```

### who (누가 나오나)
| who | 뜻 |
|---|---|
| `bestFriend` | 절친(50↑) 중 1명 |
| `friendMate` | 같은 팀 친구(25↑) |
| `friendOther` | 다른 팀 친구(25↑) — `friendTip` 쓸 수 있음 |
| `retiredFriend` | 은퇴한 친구 (코치·해설·스트리머로 재등장. `{pteam}` 대신 글에서 직업을 직접 서술) |

### trigger (언제 나오나)
| trigger | 뜻 |
|---|---|
| `random` | 아무 주 (대부분 이걸로) |
| `afterWin` | 내가 이긴 주 |
| `followUp` | 연작 다음 편 (앞 편 선택지의 followUp으로만 옴, `{player}` 그대로 이어짐) |
| `friendVs` | 이번 주 친구 팀과 맞대결함 (`friendOther`와 함께) |
| `friendRetire` | 친구가 이번 비시즌에 은퇴함 (작별 연락, who는 `bestFriend` 또는 `friendMate`·`friendOther`) |
| `friendTitle` | 다른 팀 친구가 우승함 (축하·질투) |

### 만들 연락 가이드 (14개 이상, 연작 2개 이상 포함)
- 절친: 슬럼프 위로, 생일, 같이 우승, 연애 상담, 계약 고민 공유, 싸움과 화해(연작: 오해 → 화해)
- 같은 팀 친구: 숙소 장난, 경기 중 콜 다툼, 주전 경쟁 (둘 중 하나만 주전)
- 다른 팀 친구: 맞대결 전 도발(`friendVs`), 이적 정보(`friendTip: true`), 우승 축하(`friendTitle`), "우리 팀 올래?"
- 은퇴: 작별(`friendRetire`) → 은퇴한 친구가 코치·해설로 다시 연락(`retiredFriend`, 연작 가능)
- 관계가 나빠지는 선택도 일부 넣기 (relation −5 ~ −15).
- 연락 효과의 relation 범위: +3 ~ +20, −15까지.

---

## 마지막 확인 (꼭 하기)
1. 파일 맨 위 주석: `// ===== 친구 시스템 데이터 (분기 활동 · 단계 이야기 · 친구 연락) =====`
2. `node --check data/friends.js` 통과.
3. 아래 검사 스크립트 통과 (임시로 실행, 파일로 남기지 말 것):
```bash
node -e "
global.EVENTS=[]; eval(require('fs').readFileSync('data/events.js','utf8').replace(/^const /gm,'var '));
const base=new Set(EVENTS.map(e=>e.id));
eval(require('fs').readFileSync('data/friends.js','utf8').replace(/^const /gm,'var '));
const ids=EVENTS.map(e=>e.id); const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log('중복 id', dup);
const fr=EVENTS.filter(e=>!base.has(e.id)); console.log('친구 연락', fr.length);
fr.forEach(e=>(e.choices||[]).forEach(c=>[c,c.success,c.fail].forEach(o=>{ if(o&&o.followUp&&!ids.includes(o.followUp.event)) console.log('없는 followUp',e.id,o.followUp.event); })));
console.log('활동', FRIEND_ACTIVITIES.length, '단계', Object.keys(FRIEND_STAGE_STORIES));
"
```
   (events.js 앞부분에서 다른 상수가 필요해 오류가 나면, 검사 방법만 알맞게 바꿔도 됩니다.)
4. 효과 키·숫자 범위가 위 표를 벗어나지 않는지 확인.
5. 커밋하지 말고, 만든 활동·연락 개수만 알려 주세요.
