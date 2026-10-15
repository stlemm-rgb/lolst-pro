// ===== 페이지 머리 (179, 디자인 D5) — 코드는 js/pagehead.js =====
// 화면 맨 위 제목을 카드로: 아이콘 + 제목 + 한 줄 설명 (+ 오른쪽 요약 숫자는 js/pagehead.js PAGE_HEAD_SIDE)
// 합친 메뉴(일정·이적 시장·기록실)는 부모 메뉴 id로 찾아요. 대시보드는 따로 (히어로 카드)
const PAGE_HEADS = {
  training:     { icon: "🏋️", desc: "이번 주 할 훈련을 골라요. [다음 주로 진행]을 누르면 훈련해요" },
  sns:          { icon: "📱", desc: "받은 연락에 답하고, 기사와 선수들의 글을 봐요" },
  friends:      { icon: "🤝", desc: "친구와 함께하면 관계가 깊어지고, 절친은 경기에서 힘이 돼요" },
  career:       { icon: "🧑‍💻", desc: "내 선수의 능력·특성·챔피언·기록을 한눈에" },
  shop:         { icon: "🛍️", desc: "모은 돈으로 집·장비·개인 고용·투자" },
  team:         { icon: "🏠", desc: "팀 내 입지, 우리 팀 전력, 선수단과 스태프" },
  results:      { icon: "📺", desc: "지난 경기 기록과 다시 보기" },
  calendar:     { icon: "🗓️", desc: "올해 시즌 흐름과 대회 대진표" },
  standings:    { icon: "🏆", desc: "리그별 순위표 · 세트 득실과 최근 5경기" },
  world:        { icon: "🌏", desc: "해외 지역 리그 순위와 스타 선수" },
  achievements: { icon: "🎖️", desc: "커리어·우승·개인상·명장면 업적 모음" },
  collection:   { icon: "🎨", desc: "시그니처 픽과 월드 우승 스킨" },
  market:       { icon: "💼", desc: "내 계약, 이적 요청, 선수 검색과 구단 탐색" },
  records:      { icon: "📚", desc: "개인 시상 레이스, 역사관, 리그 생태계" },
  howto:        { icon: "❓", desc: "게임 규칙과 화면 설명" },
  settings:     { icon: "⚙️", desc: "저장·불러오기와 게임 설정" },
};
