# 지시문: 연애 요소 데이터 파일 만들기 (data/romance.js)

## 할 일 (이것만)
- 저장소: `C:\Project\Game\Game` (순수 HTML/CSS/JS 롤 프로게이머 커리어 게임, 한국어).
- **새 파일 `data/romance.js` 하나만 만듭니다.** 다른 파일은 절대 수정하지 마세요 (엔진 `js/romance.js`, index.html 연결은 다른 AI가 이미 함).
- 참고(읽기만): `data/events_life.js`(연락 글 형식·톤), `data/friends.js`(대사 분위기), `data/stats.js`(능력치 id).
- 끝나면 `node --check data/romance.js` + 맨 아래 검사, 개수만 알려 주세요. 커밋하지 마세요.

## 게임 설정
- 내 선수 = 남자 프로게이머 `{me}`. 인기도가 오르면 여성 연애 대상들이 다가옵니다. **부가 재미 요소**라 짧고 가볍게.
- **수위: 데이트·고백·질투·열애설·스캔들까지만. 신체·성적 묘사, 노골적 표현 절대 금지.** AV배우도 "논란 많은 유명인"으로서의 스캔들 위험만 다룹니다 (직업 언급은 담백하게, 작품·신체 묘사 없음).
- 동시에 연애 상대는 1명. 관계 단계: 관심(호감 0~29) → 썸(30~59) → 고백 성공 시 연애 → 결별 가능. **결혼은 없음** (은퇴 엔딩에서 한 줄 언급만).
- 문장: 쉬운 한국어, 서술은 반말("~했다"), 대사는 각 대상 말투. 조사는 "이(가)", "을(를)", "은(는)", "와(과)" 둘 다 표기. 실존 인물·실제 회사·실제 방송사 이름 금지.

## 자리표시자
`{me}` 내 선수 · `{her}` 연애 대상 이름 · `{job}` 그 대상 직업 이름 · `{say}` 그 대상의 상황별 대사(엔진이 ①의 lines에서 골라 넣음) · `{rival}` 다가오는 다른 대상 이름 · `{rivaljob}` 그 직업 · `{rivalsay}` 다른 대상의 대사 · `{team}` 내 팀 · `{year}`

## ① ROMANCE_TARGETS — 대상 10명

```js
const ROMANCE_TARGETS = [
  {
    id: "announcer",                // 아래 10개 id 그대로
    icon: "🎙️", job: "리그 아나운서",
    unlock: 40,                     // 인기도 기준 (아래 표 그대로)
    names: ["한서린", "윤채아", "도하은"],   // 가상 이름 3개 (게임마다 하나)
    personality: "차분하고 똑 부러짐. 일과 사생활을 철저히 나눔",
    lines: {                        // 상황별 대사 — 각 2개 이상, 따옴표 없이 대사만, 1~2문장
      meet: [], gift: [], date: [], confessYes: [], confessNo: [],
      public: [], secret: [], cheer: [], rivalApproach: [], jealous: [],
      anniv: [], crisis: [], breakup: [], ending: [],
    },
  },
];
```
| id | icon | job | unlock | 성격 힌트 |
|---|---|---|---|---|
| announcer | 🎙️ | 리그 아나운서 | 40 | 차분, 공사 구분 |
| manager | 📋 | 팀 매니저 | 40 | 꼼꼼, 잔소리, 걱정 많음 (사내 연애) |
| trainer | 💪 | 트레이너 | 40 | 털털, 운동 강요, 솔직 (사내 연애) |
| sponsor | 💼 | 스폰서 담당자 | 40 | 세련됨, 계산적이지만 진심 |
| celeb | 🎬 | 연예인 | 60 | 밝고 바쁨, 카메라 의식 |
| model | 📸 | 모델 | 60 | 자유로움, 해외 일정 많음 |
| influencer | 📱 | 인플루언서 | 60 | 발랄, 사진·SNS 좋아함 |
| heiress | 💎 | 해외 재벌 2세 팬 | 60 | 통 큼, 선물 공세, 반말·외국어 섞음 |
| mideast | 🕌 | 중동 팬 | 60 | 예의 바름, 가족·초대 중시, 장거리 |
| avactress | 🎥 | AV배우 | 80 | 시원시원, 남 시선 신경 안 씀 (스캔들 위험) |

lines 키 뜻: meet 첫 연락 · gift 선물 줄 때 · date 데이트 · confessYes/confessNo 고백 받아들임/거절 · public 공개 연애 결정 · secret 몰래 만날 때 · cheer 경기장 응원 · rivalApproach (이 사람이 **다른 대상과 연애 중인 {me}에게** 다가올 때) · jealous (연애 상대인 이 사람이 질투할 때) · anniv 기념일 · crisis 이별 위기 · breakup 이별 · ending 은퇴 엔딩 한 줄(“{me}의 곁에는 …” 같은 서술, 3인칭 1문장).

## ② 연락 EVENTS.push(...) — 아래 trigger마다 2개 이상 (총 26개 이상)

형식은 `data/events_life.js`와 같고, **반드시** `tab: "inbox"`, `always: true`, `who` 없음, id는 `rm_`로 시작.

```js
EVENTS.push(
  {
    id: "rm_meet_dm", tab: "inbox", trigger: "rm_meet", always: true,
    title: "📩 {job} {her}의 메시지",
    text: "경기가 끝난 밤, {job} {her}에게서 메시지가 왔다. \"{say}\"",
    choices: [
      { label: "답장한다", effects: { affection: 12 }, result: "..." },
      { label: "정중히 선을 긋는다", effects: { affection: -10 }, result: "..." },
      { label: "읽고 넘긴다", effects: { affection: -3 }, result: "..." },
    ],
  }
);
```
| trigger | 언제 (엔진이 정함) | 선택지에 꼭 넣을 것 |
|---|---|---|
| rm_meet | 처음 다가옴 (관심) | 호감 + / 거절(−) / 무시 |
| rm_gift | 선물 공세 (관심·썸) | 받는다(돈·호감 +) / 정중히 거절 / 돌려보냄 |
| rm_date | 썸 단계 데이트 | 간다(컨디션 + 호감 +, 체력 −) / 다음에 |
| rm_confess | 썸이 깊어짐 (호감 60↑) | 고백한다(🎲 판정: success `romance: "start"`, fail 호감 −) / 아직 친구로 |
| rm_public | 연애 중, 공개 여부 | 공개(`romance: "public"`, 인기도 + 평판 ±) / 몰래(`romance: "secret"`) |
| rm_cheer | 연애 중, 큰 경기 전 | 와 달라고 한다(`matchBoost: 0.02`, 🎲 mental 실패 시 `matchBoost: -0.02`) / 부담돼서 거절 |
| rm_rival | 연애 중 다른 대상 {rival} 공세 | 선을 긋는다(호감 +) / 숨긴다(🎲, 실패 시 싸움: 호감 −15 컨디션 −) / 흔들린다(`romance: "end"`) |
| rm_rumor | 몰래 연애가 들킴 (열애설) | 인정(`romance: "public"`) / 부인(평판 −, 호감 −) / 무대응 |
| rm_anniv | 기념일 | 챙긴다(돈 −, 호감 +) / 바빠서 깜빡 (호감 −) |
| rm_crisis | 호감 낮음 (이별 위기) | 붙잡는다(🎲) / 놓아준다(`romance: "end"`) |
| rm_sasaeng | ⚠️ 사생팬 (연애 아님) | 구단에 알린다 / 직접 대응(평판 위험) — 글에 `{her}` 쓰지 말 것 |
| rm_stalker | ⚠️ 스토커 (연애 아님) | 경찰 신고 / 경호 고용(돈 −) — 글에 `{her}` 쓰지 말 것 |

- rm_rival 글에는 `{rival}`·`{rivaljob}`·`{rivalsay}`를 쓰고, 연애 상대는 `{her}`.
- 텍스트 안에 `{say}`를 꼭 한 번 넣기 (사생팬·스토커 제외).

### 쓸 수 있는 효과 키
- `affection`: 호감 변화 (−20 ~ +15)
- `romance`: `"start"` 연애 시작 · `"end"` 결별 · `"public"` 공개 · `"secret"` 몰래
- `condition`(−10~+10), `stamina`(−8~+5), `popularity`(−3~+4), `reputation`(−6~+3), `money`(−500000~+800000, 원), `matchBoost`(±0.02만)
- 판정: `check: { stat, diff }` + `success`/`fail` (stat: mental·focus·popularity·reputation 등, diff 40~60)
- `note`: 선택지 아래 짧은 안내 (예: "연애 공개 — 인기도↑, 평판은 상대에 따라")

## 마지막 검사 (임시 실행, 파일로 남기지 말 것)
```bash
node -e "
global.EVENTS=[];
eval(require('fs').readFileSync('data/romance.js','utf8').replace(/^const /gm,'var '));
const keys=['meet','gift','date','confessYes','confessNo','public','secret','cheer','rivalApproach','jealous','anniv','crisis','breakup','ending'];
console.log('대상', ROMANCE_TARGETS.length);
ROMANCE_TARGETS.forEach(t=>{ const miss=keys.filter(k=>!(t.lines[k]&&t.lines[k].length>=2)); if(miss.length||t.names.length<3) console.log('부족',t.id,miss,t.names.length); });
const trig={}; EVENTS.forEach(e=>{ trig[e.trigger]=(trig[e.trigger]||0)+1; if(!e.always||e.tab!=='inbox'||!e.id.startsWith('rm_')) console.log('형식',e.id); });
console.log(trig);
const ids=EVENTS.map(e=>e.id); console.log('중복', ids.filter((x,i)=>ids.indexOf(x)!==i));
"
```
trigger 12개가 모두 2개 이상이어야 합니다.
