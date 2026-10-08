// 챔피언 목록 (리그 오브 레전드 실제 챔피언, 2026년 6월 기준 173명)
// - 이름 | 출시일 | 주로 가는 포지션 (top, jungle, mid, adc, support) | 챔피언 유형
//   챔피언 유형: carry(캐리형), utility(지원형), aggro(공격형), macro(운영형)
// - 게임 날짜가 출시일에 도달하면 그 주부터 리그에 추가됩니다. 2012년 이전 챔피언은 처음부터 있어요.
// - 새 챔피언이 나오면 맨 아래에 한 줄 추가하면 됩니다.
const CHAMPION_LIST = `
누누와 윌럼프|2009-02-21|jungle|macro
라이즈|2009-02-21|mid|macro
마스터 이|2009-02-21|jungle|carry
모르가나|2009-02-21|support|utility
사이온|2009-02-21|top|utility
소라카|2009-02-21|support|utility
시비르|2009-02-21|adc|carry
알리스타|2009-02-21|support|utility
애니|2009-02-21|mid|aggro
애쉬|2009-02-21|adc|carry
워윅|2009-02-21|jungle top|aggro
잭스|2009-02-21|top jungle|carry
케일|2009-02-21|top|carry
트리스타나|2009-02-21|adc|carry
트위스티드 페이트|2009-02-21|mid|macro
티모|2009-02-21|top|macro
피들스틱|2009-02-21|jungle|macro
신지드|2009-04-18|top|macro
질리언|2009-04-18|support|utility
이블린|2009-05-01|jungle|aggro
트린다미어|2009-05-01|top|macro
트위치|2009-05-01|adc|carry
카서스|2009-06-12|jungle mid|carry
아무무|2009-06-26|jungle|utility
초가스|2009-06-26|top|utility
람머스|2009-07-10|jungle|utility
애니비아|2009-07-10|mid|macro
베이가|2009-07-24|mid|carry
카사딘|2009-08-07|mid|carry
갱플랭크|2009-08-19|top|macro
타릭|2009-08-19|support|utility
말파이트|2009-09-02|top|utility
문도 박사|2009-09-02|top|utility
블리츠크랭크|2009-09-02|support|utility
잔나|2009-09-02|support|utility
카타리나|2009-09-19|mid|aggro
코르키|2009-09-19|mid adc|carry
나서스|2009-10-01|top|carry
샤코|2009-10-10|jungle|aggro
하이머딩거|2009-10-10|mid|macro
우디르|2009-12-02|jungle|macro
니달리|2009-12-17|jungle|aggro
뽀삐|2010-01-13|top jungle|utility
그라가스|2010-02-02|jungle top|utility
판테온|2010-02-02|top support|aggro
모데카이저|2010-02-24|top|aggro
이즈리얼|2010-03-16|adc|carry
쉔|2010-03-24|top|macro
케넨|2010-04-08|top|macro
가렌|2010-04-27|top|aggro
아칼리|2010-05-11|mid top|aggro
말자하|2010-06-01|mid|macro
올라프|2010-06-08|top jungle|aggro
코그모|2010-06-24|adc|carry
신 짜오|2010-07-13|jungle|aggro
블라디미르|2010-07-27|mid top|carry
갈리오|2010-08-10|mid support|utility
우르곳|2010-08-24|top|aggro
미스 포츈|2010-09-08|adc|carry
소나|2010-09-20|support|utility
스웨인|2010-10-05|support mid|macro
럭스|2010-10-19|support mid|macro
르블랑|2010-11-02|mid|aggro
이렐리아|2010-11-16|top mid|carry
트런들|2010-12-01|jungle top|macro
카시오페아|2010-12-14|mid|carry
케이틀린|2011-01-04|adc|carry
레넥톤|2011-01-18|top|aggro
카르마|2011-02-01|support|utility
마오카이|2011-02-16|support jungle|utility
자르반 4세|2011-03-01|jungle|utility
녹턴|2011-03-15|jungle|aggro
리 신|2011-04-01|jungle|aggro
브랜드|2011-04-12|support mid|aggro
럼블|2011-04-26|top|aggro
베인|2011-05-10|adc top|carry
오리아나|2011-06-01|mid|macro
요릭|2011-06-22|top|macro
레오나|2011-07-13|support|utility
오공|2011-07-26|top jungle|aggro
스카너|2011-08-09|jungle|utility
탈론|2011-08-24|mid jungle|aggro
리븐|2011-09-14|top|aggro
제라스|2011-10-05|mid support|macro
그레이브즈|2011-10-19|jungle|carry
쉬바나|2011-11-01|jungle|carry
피즈|2011-11-15|mid|aggro
볼리베어|2011-11-29|top jungle|aggro
아리|2011-12-14|mid|aggro
빅토르|2011-12-29|mid|carry
세주아니|2012-01-17|jungle|utility
직스|2012-02-01|mid adc|macro
노틸러스|2012-02-14|support|utility
피오라|2012-02-29|top|macro
룰루|2012-03-20|support|utility
헤카림|2012-04-18|jungle|aggro
바루스|2012-05-08|adc|carry
다리우스|2012-05-23|top|aggro
드레이븐|2012-06-05|adc|carry
제이스|2012-07-07|top mid|aggro
자이라|2012-07-24|support|macro
다이애나|2012-08-07|jungle mid|aggro
렝가|2012-08-21|jungle top|aggro
신드라|2012-09-13|mid|aggro
카직스|2012-09-27|jungle|aggro
엘리스|2012-10-26|jungle|aggro
제드|2012-11-13|mid|aggro
나미|2012-12-07|support|utility
바이|2012-12-19|jungle|aggro
쓰레쉬|2013-01-23|support|utility
퀸|2013-03-01|top|macro
자크|2013-03-29|jungle|utility
리산드라|2013-04-30|mid|macro
아트록스|2013-06-13|top|aggro
루시안|2013-08-22|adc mid|aggro
징크스|2013-10-10|adc|carry
야스오|2013-12-13|mid top|carry
벨코즈|2014-02-27|support mid|macro
브라움|2014-05-11|support|utility
나르|2014-08-13|top|macro
아지르|2014-09-16|mid|macro
칼리스타|2014-11-20|adc|carry
렉사이|2014-12-11|jungle|aggro
바드|2015-03-12|support|macro
에코|2015-05-29|mid jungle|aggro
탐 켄치|2015-07-09|support top|utility
킨드레드|2015-10-14|jungle|carry
일라오이|2015-11-24|top|aggro
진|2016-02-01|adc|carry
아우렐리온 솔|2016-03-24|mid|carry
탈리야|2016-05-18|mid jungle|macro
클레드|2016-08-10|top|aggro
아이번|2016-10-05|jungle|utility
카밀|2016-12-12|top|macro
라칸|2017-04-19|support|utility
자야|2017-04-19|adc|carry
케인|2017-07-12|jungle|aggro
오른|2017-08-23|top|utility
조이|2017-11-21|mid|aggro
카이사|2018-03-07|adc|carry
파이크|2018-05-31|support|aggro
니코|2018-12-05|mid support|aggro
사일러스|2019-01-25|mid jungle|aggro
유미|2019-05-15|support|utility
키아나|2019-06-28|mid jungle|aggro
세나|2019-11-10|support adc|utility
아펠리오스|2019-12-11|adc|carry
세트|2020-01-14|top|aggro
릴리아|2020-07-22|jungle|macro
요네|2020-08-06|mid top|carry
사미라|2020-09-21|adc|carry
세라핀|2020-10-29|support mid|utility
렐|2020-12-09|support|utility
비에고|2021-01-21|jungle|carry
그웬|2021-04-15|top|carry
아크샨|2021-07-22|mid|aggro
벡스|2021-09-22|mid|aggro
제리|2022-01-20|adc|carry
레나타 글라스크|2022-02-17|support|utility
벨베스|2022-06-09|jungle|carry
닐라|2022-07-13|adc|carry
크산테|2022-11-02|top|utility
밀리오|2023-03-23|support|utility
나피리|2023-07-19|mid|aggro
브라이어|2023-09-13|jungle|aggro
흐웨이|2023-12-05|mid support|macro
스몰더|2024-01-31|adc|carry
오로라|2024-07-17|mid top|aggro
암베사|2024-11-06|top|aggro
멜|2025-01-23|mid support|macro
유나라|2025-07-16|adc|carry
자헨|2025-11-19|top jungle|aggro
로크|2026-06-24|mid|aggro
`;

// 위 목록을 게임에서 쓰기 좋은 모양으로 바꿉니다 (고치지 않아도 돼요)
const CHAMPIONS = CHAMPION_LIST.trim().split("\n").map(function (line) {
  const parts = line.split("|");
  return { name: parts[0].trim(), released: parts[1].trim(), positions: parts[2].trim().split(" "), type: parts[3].trim() };
});

// 챔피언 유형 4가지
// - stats: 이 유형의 "유형 스탯"을 계산할 때 평균 내는 실력 스탯 3개
//   (12개 스탯이 한 번씩 쓰여요)
// 선수의 유형 스탯이 높으면 그 유형 챔피언의 숙련도가 더 잘 오릅니다.
const CHAMPION_TYPES = [
  { id: "carry",   name: "캐리형", stats: ["accuracy", "spacing", "focus"],     desc: "후반에 팀을 끌고 가는 딜러" },
  { id: "utility", name: "지원형", stats: ["vision", "shotcall", "teamfight"], desc: "아군을 지키고 판을 깔아 주는 챔피언" },
  { id: "aggro",   name: "공격형", stats: ["laning", "reaction", "mental"],    desc: "먼저 싸움을 걸고 상대를 무너뜨리는 챔피언" },
  { id: "macro",   name: "운영형", stats: ["macro", "adapt", "pool"],          desc: "라인 관리와 맵 장악으로 이기는 챔피언" },
];

// 챔피언 숙련도 (1 = 한 번도 안 해 본 챔피언, 100 = 완벽하게 다룸)
const MASTERY = {
  min: 1,
  max: 100,
  // 캐릭터 생성 때 처음 숙련도: 내 포지션 챔피언은 챔피언 폭에 따라, 다른 포지션은 낮게
  startMainRatio: 0.7,  // 내 포지션 챔피언: 챔피언 폭 × 0.7 근처
  startMainSpread: 15,  //   ± 15 무작위
  startOffMax: 15,      // 다른 포지션 챔피언: 1 ~ 15
  // 패치마다 포지션별 메타 챔피언 수
  metaPerPosition: 5,
  metaKeep: 0.25,      // 패치 때 지난 메타 챔피언이 다음 메타에도 남을 확률 (챔피언마다)
  metaKeepMine: 0.5,   // 내 숙련도 1위 챔피언이 메타였으면 남을 확률
  // 패치가 나오는 주차 (시즌당 2번: 프리시즌, 후반기 준비)
  patchWeeks: [1, 29],
  // 유형 보너스: 유형 스탯이 기준보다 높으면 숙련도 성장 보너스
  //   보너스 = (유형 스탯 − typeBonusPivot) ÷ typeBonusScale  (예: 80 → +30%)
  typeBonusPivot: 50,
  typeBonusScale: 100,
};

// 다른 선수(NPC) 챔피언 숙련도 (js/npc_mastery.js)
// - 자기 포지션 챔피언만 숙련도를 가져요. 처음 값은 내 선수와 같은 규칙(챔피언 폭 × 0.7 ± 15)
// - 선수마다 '시그니처 챔피언' 몇 명은 크게 높음
// - 매주 챔피언 연습: 적응력이 높을수록 메타 챔피언을 더 자주 연습 (패치 직후 '적응 경쟁')
// - 경기에서는 내 선수와 똑같이 밴 → 픽 → 숙련도 배율·메타 보너스·메타 페널티 (data/match.js MATCH)
const NPC_MASTERY = {
  signatureCount: [2, 3],     // 시그니처 챔피언 수
  signatureBonus: [10, 25],   // 시그니처 챔피언 숙련도 + (최대 100)
  practiceCount: 2,           // 매주 연습하는 챔피언 수
  practiceGain: [2, 4],       // 한 명당 오르는 숙련도 (숙련도가 높을수록 덜 오름, 내 선수와 같은 규칙)
  metaFocusBase: 0.5,         // 메타 챔피언을 연습할 확률 = metaFocusBase + (적응력 − 50) × metaFocusPerAdapt
  metaFocusPerAdapt: 0.01,
  pickWeights: [60, 25, 15],  // 픽: 가치(숙련도 + 메타 보너스) 상위 3명 중에서, 앞쪽일수록 잘 고름
  patchNewsCount: 3,          // 패치 소식: 새 메타에 강한/고전할 1부 주전 몇 명씩
};
