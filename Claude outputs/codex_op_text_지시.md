# Codex 작업: '사기 챔피언(패치 사고)' 글 쓰기 (읽기 전용 — 답으로 data 파일 내용만)

저장소 `C:\Project\Game` (오프라인 LoL 프로게이머 커리어 시뮬레이션 「챌린저 로드」). **파일을 바꾸지 마.**
답 = 아래 모양의 `data/op_patch.js` **전체 내용 하나** (Claude가 그대로 붙여 넣음) + 짧은 메모.
먼저 참고: `CLAUDE.md`, `data/news.js`의 `CRISIS_NEWS`(기사 모양·말투), `data/social_posts.js`·`data/social_posts_pro.js`(SNS 말투), `HANDOFF.md` 4장 '기타'(조사 규칙·친구 글 규칙).

## 기능 (Claude가 코드로 만드는 중)

시즌 중 가끔(시즌당 30%) 패치 실수로 챔피언 하나가 한 포지션에서 지나치게 세짐.
- **SS**: 4주 동안 경기력 +23%, 끝나면 원래 등급으로 (긴급 하향).
- **SSS**: 2주 동안 +32% → 게임사 사과 인터뷰 → 절반은 **대회 사용 금지 1주**(밴 칸을 쓰지 않고 아예 못 고름) → 원래 등급으로.
- 사고 동안 그 챔피언은 밴될 확률이 높음.
흐름: ① 시작 기사 ② 팬·선수 SNS ③ 1~2주 뒤 실제 경기 기록 기사(픽 수·승률) ④ (SSS) 게임사 사과 인터뷰 ⑤ (SSS 절반) 사용 금지 기사 ⑥ 끝 기사 ⑦ 내 포지션이면 코치 연락(내 숙련도 높음/낮음).

## 빈칸 (이것만 쓸 것)

`{champ}` 챔피언 이름 · `{pos}` 포지션 이름(탑·정글·미드·원딜·서포터) · `{tier}` SS 또는 SSS · `{weeks}` 남은/지속 주 수(숫자) ·
`{picks}` 프로 경기에서 고른 세트 수 · `{wins}` 그중 이긴 세트 수 · `{rate}` 승률 숫자(%) · `{bans}` 밴된 세트 수 · `{me}` 내 선수 이름 · `{myTeam}` 내 팀 이름 · `{mastery}` 내 숙련도 숫자

## 규칙

- **조사**: 빈칸 바로 뒤 고정 조사 금지 → `{champ}이(가)` `{champ}을(를)` `{champ}은(는)` `{champ}와(과)` `{champ}(으)로` `{me}이(가)` 처럼. 숫자 빈칸 뒤(`{picks}세트`, `{rate}%`, `{weeks}주`)는 괜찮음. (`node tools/test_josa.cjs`가 검사)
- **회사·실명 금지**: 실제 게임사 이름·실제 사람 이름 금지. 항상 "게임사", "밸런스 담당자", "개발팀". 실제 LoL 역사 사건을 그대로 재현하지 말 것.
- 사과 인터뷰는 실제 사과문처럼 진지하게, 팬 SNS는 가볍고 짧게(밈·놀림 OK, 욕·혐오 금지), 프로 선수 SNS는 장난스럽게 · 남자 선수끼리 연애·성적 비유로 읽힐 말투 금지.
- 글 안에 `<` `>` 백틱 금지 (세이브에서 지워짐). 이모지는 2019년 이전 것만(윈도우 10 글꼴).
- 쉬운 한국어, 기사 본문은 2~3문장.

## 답 모양 (이 키 이름 그대로, 개수는 최소 이만큼)

```js
// 패치 사고 '사기 챔피언' 글 (로직: js/op_patch.js). 빈칸: {champ} {pos} {tier} {weeks} {picks} {wins} {rate} {bans} {me} {myTeam} {mastery}
const OP_PATCH_TEXT = {
  start: {   // ① 시작 기사 — SS용·SSS용 따로
    SS:  [ { headline: "...", body: "..." }, x3 ],
    SSS: [ { headline: "...", body: "..." }, x3 ],
  },
  stats: [ { headline, body } x3 ],          // ③ 실제 기록 (picks·wins·rate·bans)
  statsNone: [ { headline, body } x2 ],      // ③ 프로 경기에서 아무도 안 골랐을 때 (picks 0)
  apology: [ { headline, body } x3 ],        // ④ SSS 게임사 사과 인터뷰 (따옴표 인용 넣기)
  ban: [ { headline, body } x2 ],            // ⑤ 사용 금지 시작 (일반 밴 횟수에 안 들어간다는 설명 포함)
  end: {     // ⑥ 끝
    SS:  [ { headline, body } x2 ],          // 긴급 하향 적용
    SSS: [ { headline, body } x2 ],          // 사용 금지 풀림/하향 후 복귀
  },
  fan: {     // ② 팬 SNS 한 줄 (글쓴이는 코드가 정함)
    start: [ "..." x6 ], during: [ "..." x6 ], ban: [ "..." x4 ], end: [ "..." x4 ],
  },
  pro: {     // ② 다른 팀 프로 선수 SNS 한 줄
    start: [ "..." x4 ], ban: [ "..." x3 ],
  },
  coach: {   // ⑦ 내 포지션 챔피언일 때 코치 연락 { title, text } — 선택지 없음
    high: [ { title, text } x2 ],            // 내 숙련도 높음 ({mastery}) → 기회, 그래도 밴 많이 당할 거라는 주의
    low:  [ { title, text } x2 ],            // 숙련도 낮음 → 짧게 연구할지 다른 챔피언 준비할지 고민
  },
  tag: { SS: "SS", SSS: "SSS", banned: "사용 금지" }, // 화면 배지 글자
};
```

메모에는: 조사 규칙을 지켰는지 스스로 확인한 결과, 애매한 글이 있으면 그 줄.
