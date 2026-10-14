// ===== 수집·강화 (js/collection.js) — 2026-10-08 =====
// 1) 🏆 월드 우승 스킨  2) ✒️ 시그니처 픽 성장(★1~★5)  3) 🏅 업적 도감

// ----- 1) 월드 우승 스킨 -----
// 월드 결승 마지막 세트(우승 세트)에서 우승 팀 5명이 쓴 챔피언이 그해 우승 스킨이 돼요 (모든 팀 기록 → [우승 스킨] 역대 목록)
// 내 선수가 그 세트에 뛰었으면 내 스킨으로 수집 → 그 챔피언을 고르면 경기력 +powerBonus (스킨이 여러 개여도 한 번만)
const WORLDS_SKIN = {
  powerBonus: 0.02,     // 경기력 +2%
  popularity: 3,        // 스킨을 받을 때 인기도 +
};

// ----- 2) 시그니처 픽 성장 -----
// 시그니처 픽으로 뛴 세트마다 경험치: set(뛴 세트) + win(그 세트 승리)
// 별이 오를수록 보너스가 커지지만, 상대가 먼저 밴할 확률도 올라가요 (data/match.js MATCH.signaturePick 값이 ★1)
const SIGNATURE_GROWTH = {
  xp: { set: 1, win: 1 },
  stars: [0, 15, 40, 80, 140],                 // ★1~★5가 되는 경험치
  perStar: { pickBonus: 3, powerBonus: 0.01, banChance: 0.05 }, // 별 하나 오를 때마다 더함 (★5 = 고를 때 가치 +27 · 경기력 +9% · 선밴 50%)
};

// ----- 3) 업적 도감 -----
// key: 무엇을 셀지 (js/collection.js ACH_VALUES), goal: 목표, grade: 난이도 등급 b 동 · s 은 · g 금 (표시만, 보상 없음 — 2026-10-08 보상 삭제)
// cat: 분류 (ACH_CATS 순서로 화면에 묶어 보여 줌). 이미 이룬 업적은 불러오기·다음 주에 한꺼번에 달성 처리
const ACH_CATS = [
  { id: "career", name: "커리어" },
  { id: "title",  name: "우승" },
  { id: "award",  name: "개인상" },
  { id: "play",   name: "명장면" },
  { id: "growth", name: "성장·수집" },
  { id: "life",   name: "선수 생활" },
];

const ACHIEVEMENTS = [
  // 커리어
  { id: "games10",   cat: "career", icon: "🎮", name: "프로 데뷔",       desc: "공식 경기 10번 출전",        key: "games",  goal: 10,  grade: "b" },
  { id: "games100",  cat: "career", icon: "🎮", name: "백전노장",        desc: "공식 경기 100번 출전",       key: "games",  goal: 100, grade: "s" },
  { id: "games300",  cat: "career", icon: "🎮", name: "철인",            desc: "공식 경기 300번 출전",       key: "games",  goal: 300, grade: "g" },
  { id: "wins50",    cat: "career", icon: "✅", name: "승리의 맛",       desc: "경기 50승",                  key: "wins",   goal: 50,  grade: "b" },
  { id: "wins200",   cat: "career", icon: "✅", name: "승리 제조기",     desc: "경기 200승",                 key: "wins",   goal: 200, grade: "g" },
  { id: "pog1",      cat: "career", icon: "🏅", name: "첫 POG",          desc: "POG 1번",                    key: "pog",    goal: 1,   grade: "b" },
  { id: "pog30",     cat: "career", icon: "🏅", name: "POG 단골",        desc: "POG 30번",                   key: "pog",    goal: 30,  grade: "s" },
  { id: "pog100",    cat: "career", icon: "🏅", name: "POG 수집가",      desc: "POG 100번",                  key: "pog",    goal: 100, grade: "g" },
  { id: "big1",      cat: "career", icon: "🔥", name: "라이벌전 첫 승",  desc: "빅게임(통신사 더비·왕좌의 전쟁) 첫 승리", key: "bigWins",   goal: 1,  grade: "b" },
  { id: "big10",     cat: "career", icon: "🔥", name: "더비의 주인",     desc: "빅게임 10승",                 key: "bigWins",   goal: 10, grade: "s" },
  { id: "bigStreak5", cat: "career", icon: "🔥", name: "라이벌의 천적",  desc: "같은 빅게임 5연승",           key: "bigStreak", goal: 5,  grade: "g" },
  { id: "solo30",    cat: "career", icon: "🗡️", name: "라인전 학살자",   desc: "솔로킬 30번",                key: "solo",   goal: 30,  grade: "s" },
  // 우승
  { id: "cup1",      cat: "title",  icon: "🏆", name: "컵 우승",         desc: "LCK 컵 우승",                key: "cup",        goal: 1, grade: "s" },
  { id: "league1",   cat: "title",  icon: "🏆", name: "리그 챔피언",     desc: "리그 우승",                  key: "playoffs",   goal: 1, grade: "s" },
  { id: "league3",   cat: "title",  icon: "🏆", name: "왕조",            desc: "리그 우승 3번",              key: "playoffs",   goal: 3, grade: "g" },
  { id: "fs1",       cat: "title",  icon: "🌐", name: "첫 무대의 승자",  desc: "First Stand 우승",           key: "firststand", goal: 1, grade: "s" },
  { id: "msi1",      cat: "title",  icon: "🌐", name: "MSI 정복",        desc: "MSI 우승",                   key: "msi",        goal: 1, grade: "g" },
  { id: "worlds1",   cat: "title",  icon: "🌍", name: "월드 챔피언",     desc: "월드 챔피언십 우승",         key: "worlds",     goal: 1, grade: "g" },
  { id: "worlds3",   cat: "title",  icon: "🌍", name: "불멸의 왕",       desc: "월드 챔피언십 우승 3번",     key: "worlds",     goal: 3, grade: "g" },
  { id: "slam",      cat: "title",  icon: "👑", name: "그랜드 슬램",     desc: "한 해에 리그·MSI·월드 모두 우승", key: "slam",  goal: 1, grade: "g" },
  // 개인상
  { id: "rookie",    cat: "award",  icon: "🌱", name: "떡잎",            desc: "신인왕",                     key: "aw_rookie",     goal: 1, grade: "s" },
  { id: "allpro3",   cat: "award",  icon: "⭐", name: "리그 최고의 라이너", desc: "올프로 퍼스트 팀 3번",    key: "aw_allpro",     goal: 3, grade: "s" },
  { id: "mvp1",      cat: "award",  icon: "🥇", name: "MVP",             desc: "정규 시즌 MVP",              key: "aw_mvp",        goal: 1, grade: "g" },
  { id: "fmvp1",     cat: "award",  icon: "🥇", name: "결승의 사나이",   desc: "리그 결승 MVP",              key: "aw_fmvp",       goal: 1, grade: "s" },
  { id: "wfmvp1",    cat: "award",  icon: "🥇", name: "세계 최고의 무대", desc: "월드 결승 MVP",             key: "aw_worldsfmvp", goal: 1, grade: "g" },
  { id: "allstar1",  cat: "award",  icon: "🌟", name: "올스타",          desc: "올스타 선정",                key: "allstars",      goal: 1, grade: "b" },
  { id: "allstar5",  cat: "award",  icon: "🌟", name: "팬들의 선택",     desc: "올스타 선정 5번",            key: "allstars",      goal: 5, grade: "s" },
  // 명장면 (내 선수 경기 장면 누적)
  { id: "baron",     cat: "play",   icon: "🐉", name: "바론 도둑",       desc: "바론 스틸",                  key: "ev_baron_steal",  goal: 1,  grade: "s" },
  { id: "elder",     cat: "play",   icon: "🐉", name: "장로의 주인",     desc: "장로 스틸",                  key: "ev_elder_steal",  goal: 1,  grade: "s" },
  { id: "fight45",   cat: "play",   icon: "🔥", name: "4:5의 기적",      desc: "4:5 한타 승리",              key: "ev_fight_4v5",    goal: 1,  grade: "s" },
  { id: "duel",      cat: "play",   icon: "⭐", name: "1대2 장인",       desc: "1대2 승리 10번",             key: "ev_duel_1v2",     goal: 10, grade: "s" },
  { id: "ace",       cat: "play",   icon: "🏆", name: "에이스 메이커",   desc: "에이스 20번",                key: "ev_ace",          goal: 20, grade: "b" },
  { id: "dodge",     cat: "play",   icon: "⭐", name: "매트릭스",        desc: "궁극기 회피 20번",           key: "ev_dodge_ult",    goal: 20, grade: "b" },
  // 성장·수집
  { id: "peak70",    cat: "growth", icon: "📈", name: "1부급",           desc: "스탯 점수 70 달성",          key: "peak",     goal: 70, grade: "b" },
  { id: "peak80",    cat: "growth", icon: "📈", name: "리그 정상급",     desc: "스탯 점수 80 달성",          key: "peak",     goal: 80, grade: "s" },
  { id: "peak90",    cat: "growth", icon: "📈", name: "살아있는 전설",   desc: "스탯 점수 90 달성",          key: "peak",     goal: 90, grade: "g" },
  { id: "m100x1",    cat: "growth", icon: "🎯", name: "장인",            desc: "숙련도 100 챔피언 1개",      key: "m100",     goal: 1,  grade: "b" },
  { id: "m100x5",    cat: "growth", icon: "🎯", name: "챔피언 폭",       desc: "숙련도 100 챔피언 5개",      key: "m100",     goal: 5,  grade: "s" },
  { id: "sig1",      cat: "growth", icon: "✒️", name: "나만의 무기",     desc: "시그니처 픽 정하기",         key: "sigStar",  goal: 1,  grade: "b" },
  { id: "sig5",      cat: "growth", icon: "✒️", name: "시그니처 완성",   desc: "시그니처 픽 ★5",            key: "sigStar",  goal: 5,  grade: "g" },
  { id: "skin1",     cat: "growth", icon: "🎨", name: "우승 스킨",       desc: "월드 우승 스킨 1개",         key: "skins",    goal: 1,  grade: "g" },
  { id: "skin3",     cat: "growth", icon: "🎨", name: "스킨 컬렉터",     desc: "월드 우승 스킨 3개",         key: "skins",    goal: 3,  grade: "g" },
  // 선수 생활
  { id: "chall",     cat: "life",   icon: "🪜", name: "챌린저",          desc: "솔로 랭크 챌린저 달성",      key: "ladderPeak", goal: 3200, grade: "s" },
  { id: "superstar", cat: "life",   icon: "👑", name: "슈퍼스타",        desc: "스타 등급 '슈퍼스타'",       key: "fameTier",   goal: 4,    grade: "s" },
  { id: "face",      cat: "life",   icon: "😇", name: "리그의 얼굴",     desc: "평판 60 달성",               key: "reputation", goal: 60,   grade: "s" },
  { id: "rich",      cat: "life",   icon: "💰", name: "억대 연봉",       desc: "연봉 1억 원 계약",           key: "salary",     goal: 100000000, grade: "b" },
  { id: "rich10",    cat: "life",   icon: "💰", name: "부자 선수",       desc: "번 돈(연봉 합계) 10억 원",   key: "earned",     goal: 1000000000, grade: "s" },
  { id: "journey",   cat: "life",   icon: "🧳", name: "저니맨",          desc: "팀 3곳에서 뛰기",            key: "teams",      goal: 3,  grade: "b" },
  { id: "oneclub",   cat: "life",   icon: "💙", name: "원클럽맨",        desc: "한 팀에서만 5시즌",          key: "oneClub",    goal: 5,  grade: "s" },
  { id: "decade",    cat: "life",   icon: "🎂", name: "10년 차",         desc: "프로 10시즌 마치기",         key: "seasons",    goal: 10, grade: "g" },
];
