# 지시문: 은퇴 이야기 데이터 파일 만들기 (data/retire_stories.js)

## 할 일 (이것만 하세요)
- 저장소: `C:\Project\Game\Game` (순수 HTML/CSS/JS 롤 프로게이머 커리어 게임, 한국어).
- **새 파일 `data/retire_stories.js` 하나만 만듭니다.** 다른 파일은 절대 수정하지 마세요. (index.html 연결과 엔진 `js/retirement.js`는 이미 되어 있습니다.)
- 참고할 파일(읽기만): `data/friends.js`, `data/events_life.js`(연락 글 형식·톤), `data/news_articles.js`(신문 기사 형식), `js/retirement.js`(이 데이터를 쓰는 엔진).
- 끝나면 `node --check data/retire_stories.js`를 실행하고, 맨 아래 검사도 돌린 뒤 만든 개수만 알려 주세요. 커밋은 하지 마세요.

## 게임 상황
1. **메타 적응 은퇴**: 매년 비시즌 이적 시장 도중(50주), 1부 선수 1명이 **개인 방송에서** "메타 적응이 힘들어 은퇴한다"고 발표합니다. 화면에 신문 기사가 뜨고, 이적 목록에 '메타 적응 불가'로 남습니다.
2. **은퇴 상담**: 새 시즌 직전(51주), 내 선수와 친한 선수(관계 25 이상)가 은퇴 고민을 털어놓습니다. 내 선택에 따라 그 선수가 **은퇴**하거나, **한 시즌 더** 뛰거나, **은퇴 후 우리 팀 코치**로 옵니다. 코치는 2년 뒤 **감독**이 됩니다.

## 글 규칙
- 쉬운 한국어. 연락·소식은 반말 서술("~했다"), 인터뷰는 방송 말투(존댓말 구어체).
- 실존 선수·실제 팀 이름 금지. 조사는 "이(가)", "을(를)", "은(는)", "와(과)", "(으)로"처럼 둘 다 적기.
- 자리표시자: `{player}` 그 선수 이름 · `{pteam}` 그 선수 팀(코치 글에서는 코치로 가는 팀) · `{pos}` 포지션 이름 · `{age}` 나이 · `{me}` 내 선수 이름 · `{year}` 연도.

---

## ① META_RETIRE_INTERVIEWS — 개인 방송 은퇴 인터뷰 5개

```js
const META_RETIRE_INTERVIEWS = [
  "요즘 패치가 너무 빨라요. 새 챔피언 연습하다 보면 다음 패치가 와 있어요. ...",
];
```
- 한 개당 2~3문장, 큰따옴표 없이 대사만 씁니다(엔진이 따옴표를 붙임).
- 이유를 5개 모두 다르게: 패치 속도, 손이 예전 같지 않음, 새 챔피언 폭, 팀 운영 방식 변화, 팬에게 미안함 등. 담담하고 진솔하게, 마지막엔 감사 인사.

## ② 메타 은퇴 신문 기사 3개

```js
NEWS_ARTICLES.meta_retire = [
  { who: "any", headline: "{pteam} {player}, 방송 중 깜짝 은퇴 발표", body: "..." },
];
```
- headline 30자 안쪽, body 2~4문장. body 안에 `"{interview}"`를 꼭 한 번 넣어 인터뷰를 인용하세요 (엔진이 ①의 인터뷰 하나로 바꿈).
- `{year}` 비시즌, 이적 시장 도중이라는 점, 팀이 급히 대체 선수를 찾아야 한다는 점을 기사에 녹이기.

## ③ 은퇴 상담 연락 — EVENTS.push(...) 4개 이상

```js
EVENTS.push(
  {
    id: "rc_tired_hands",            // rc_로 시작, 고유
    tab: "inbox", trigger: "retireCounsel", always: true,
    title: "📞 {player}의 늦은 전화",
    text: "시즌이 끝난 밤, {pteam}의 {player}({age}세)에게서 전화가 왔다. \"나... 이번이 마지막 시즌이었던 것 같아.\" ...",
    choices: [
      { label: "\"네가 정한 거라면 응원할게\"", note: "{player} 이번 겨울 은퇴",
        effects: { counsel: "retire", relation: 10 }, result: "..." },
      { label: "\"아직 할 수 있어. 한 시즌만 더 해 보자\"", note: "성공하면 한 시즌 더, 실패하면 은퇴",
        check: { stat: "mental", diff: 50 },
        success: { effects: { counsel: "stay", relation: 8 }, result: "..." },
        fail: { effects: { counsel: "retire", relation: 3 }, result: "..." } },
      { label: "\"은퇴하면 우리 팀 코치로 와 줘\"", note: "은퇴 후 우리 팀 코치 (내 훈련 효과 +5%, 2년 뒤 감독)",
        check: { stat: "reputation", diff: 20 },
        success: { effects: { counsel: "coach", relation: 12 }, result: "..." },
        fail: { effects: { counsel: "retire", relation: 4 }, result: "...(다른 팀 코치 제안을 이미 받았다 등)" } },
    ],
  }
);
```
- **필수**: `trigger: "retireCounsel"`, `always: true`, `who`는 쓰지 않음 (엔진이 선수를 정함).
- `counsel` 값은 `"retire"`(은퇴) / `"stay"`(한 시즌 더) / `"coach"`(은퇴 후 우리 팀 코치) 셋 중 하나. **모든 선택지(판정이면 success·fail 둘 다)에 counsel이 꼭 있어야** 합니다.
- 각 연락은 은퇴·한 시즌 더·코치 3방향이 모두 가능하게 (선택지 3~4개). `note`로 결과를 짧게 알려 주기.
- 고민 이유를 연락마다 다르게: 손목·체력 한계 / 2군 생활 / 메타·나이 / 가족·군 문제 / 우승 뒤 박수 칠 때 떠나기 등.
- 판정 stat: `mental` `shotcall` `reputation` `popularity` 등. diff 30~60.
- 효과 범위: relation +3~+15 (붙잡다 실패하면 −5까지), condition −5~+8. 다른 효과는 넣지 않기.

## ④ COACH_STORIES — 코치·감독 소식

```js
const COACH_STORIES = {
  join: [    // 은퇴한 친구가 우리 팀 코치로 합류 (4개)
    "{player}이(가) 선수 생활을 마치고 {pteam} 코치로 첫 출근을 했다. ...",
  ],
  promote: [ // 2년 뒤 코치 → 감독 (3개)
    "{player} 코치가 {pteam}의 새 감독으로 선임됐다. ...",
  ],
};
```
- 각 2~3문장. 내 선수({me})와의 우정이 느껴지는 장면 하나씩.

---

## 파일 맨 위 주석
`// ===== 은퇴 이야기 (메타 적응 은퇴 인터뷰·기사 · 은퇴 상담 연락 · 코치/감독 소식) — 엔진 js/retirement.js =====`

## 마지막 검사 (임시로 실행, 파일로 남기지 말 것)
```bash
node -e "
global.EVENTS=[]; global.NEWS_ARTICLES={};
eval(require('fs').readFileSync('data/retire_stories.js','utf8').replace(/^const /gm,'var '));
console.log('인터뷰', META_RETIRE_INTERVIEWS.length, '기사', NEWS_ARTICLES.meta_retire.length, 'join', COACH_STORIES.join.length, 'promote', COACH_STORIES.promote.length);
const ok=['retire','stay','coach'];
EVENTS.forEach(e=>{ if(e.trigger!=='retireCounsel'||!e.always) console.log('trigger/always 확인',e.id);
  const got=new Set(); e.choices.forEach(c=>[c,c.success,c.fail].forEach(o=>{ if(!o) return; const v=o.effects&&o.effects.counsel; if(o===c&&c.check) return; if(!ok.includes(v)) console.log('counsel 없음',e.id,c.label); else got.add(v); }));
  console.log(e.id, [...got].join(','));
});
NEWS_ARTICLES.meta_retire.forEach(a=>{ if(a.body.indexOf('{interview}')<0) console.log('interview 없음', a.headline); });
"
```
각 상담 연락 줄에 `retire,stay,coach` 셋이 모두 보여야 합니다.
