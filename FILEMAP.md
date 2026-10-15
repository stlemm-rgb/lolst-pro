# 파일 지도

`python3 tools/filemap.py`로 다시 만들 수 있어요. 순서 = index.html이 읽는 순서 (data → js, 뒤 파일이 앞 파일 것을 쓸 수 있음).

| 파일 | KB | 하는 일 | 합쳐진 예전 파일 |
|---|---|---|---|
| `data/menus.js` | 2 | 좌측 메뉴 (2026-10-06 정리: 묶음 4개 + 맨 아래 설정) |  |
| `data/shop.js` | 8 | 상점 ([상점] 메뉴) — 모은 돈을 쓰는 곳 |  |
| `data/guide.js` | 21 | 초보자 도움 (js/guide.js) |  |
| `data/player.js` | 15 | 내 선수 기본 규칙: 스탯·성장 곡선·포지션·유형·커리어 | stats.js, growth.js, positions.js, archetypes.js, career.js |
| `data/traits.js` | 28 | 특성 목록 |  |
| `data/champions.js` | 9 | 챔피언 목록 (리그 오브 레전드 실제 챔피언, 2026년 6월 기준 173명) |  |
| `data/match.js` | 9 | 경기력 계산 규칙 (밴픽 + 메타 페널티) |  |
| `data/match_events.js` | 23 | 경기 이벤트 (세트마다 일어나는 사건: 스틸·슈퍼플레이·실수·심리) — js/match_events.js |  |
| `data/schedule.js` | 5 | 한 시즌(52주) 일정표 |  |
| `data/league.js` | 6 | 리그 규칙 (3단계) |  |
| `data/names.js` | 6 | 이름: 구단·선수·실존 이름 선수 | team_names.js, player_names.js, named_players.js |
| `data/events.js` | 52 | 이벤트 (SNS로 오는 연락과 소식) |  |
| `data/events_story.js` | 26 | 받은 연락 리뉴얼 ① 시즌 흐름 · 새 시스템 연결 · 이어지는 이야기 (2026-10-08) |  |
| `data/events_life.js` | 11 | 받은 연락 리뉴얼 ② 선수 생활·인생 · 동료·라이벌 관계 (2026-10-08) |  |
| `data/friends.js` | 40 | 친구 시스템 데이터 (분기 활동 · 단계 이야기 · 친구 연락) |  |
| `data/social_posts.js` | 47 | 선수 SNS 글 ([SNS] → 💬 선수 SNS 탭) |  |
| `data/social_posts_pro.js` | 42 | 프로 선수 SNS 글 ([SNS] → 💬 선수 SNS 탭, 🎮 선수 표시가 붙는 글) |  |
| `data/contracts.js` | 13 | 연봉·계약·이적 규칙 (5단계) |  |
| `data/records.js` | 10 | 기록: 왕조·맞대결·솔로 랭크·시상 | dynasty.js, h2h.js, ladder.js, awards.js |
| `data/news.js` | 43 | 뉴스 기사: 신문 팝업·월즈 특집·역사 뉴스 | news_articles.js, worlds_news.js, historical_news.js |
| `data/club.js` | 7 | 구단: 빅게임 라이벌·구단 스태프 | biggame.js, staff.js |
| `data/ui.js` | 8 | 화면: 도트 포트레잇·페이지 머리 | portrait.js, pagehead.js |
| `data/great.js` | 1 | 훈련 대성공 (182, 사용자 피드백 '도파민용 대성공') — 코드는 js/great.js |  |
| `data/replay.js` | 1 | 경기 다시 보기 · 자동 재생 (177, 디자인 D3) — 코드는 js/replay.js |  |
| `data/training.js` | 9 | 훈련: 퀘스트·훈련 | quests.js, training.js |
| `data/boxscore.js` | 1 | 경기 기록(박스 스코어) 만들기 규칙 |  |
| `data/comps.js` | 7 | 챔피언 조합 성향 (밴픽 상성·시너지) |  |
| `data/era.js` | 16 | 시대: 대격변 패치·시대·해외 리그·시대별 경기 환경 | shakeup.js, era.js, era_match.js |
| `data/fame.js` | 9 | 인기도 · 평판 (js/fame.js) — 2026-10-07 |  |
| `data/collection.js` | 9 | 수집·강화 (js/collection.js) — 2026-10-08 |  |
| `data/retire_stories.js` | 14 | 은퇴 이야기 (메타 적응 은퇴 인터뷰·기사 · 은퇴 상담 연락 · 코치/감독 소식) — 엔진 js/retirement.js |  |
| `data/standing.js` | 3 | 팀 내 입지 (126) — 엔진 js/standing.js |  |
| `data/romance.js` | 51 | 연애: 규칙·대상 | romance_rules.js, romance.js |
| `js/player.js` | 9 | 선수 관련 계산 |  |
| `js/champions.js` | 18 | 챔피언 · 숙련도 · 메타(패치) |  |
| `js/creation.js` | 31 | 캐릭터 생성 |  |
| `js/save.js` | 22 | 저장 / 불러오기 |  |
| `js/league.js` | 26 | 리그: 구단·선수 생성, 순위 계산, 시즌 넘기기 |  |
| `js/npc_mastery.js` | 10 | 다른 선수(NPC) 챔피언 숙련도: 만들기 · 매주 연습 · 밴픽 · 경기력 |  |
| `js/match_events.js` | 18 | 경기 이벤트: 세트마다 사건(스틸·슈퍼플레이·실수·심리)이 일어나 팀 점수를 흔듦 |  |
| `js/matchsim.js` | 43 | 경기 판정과 주간 일정 진행 |  |
| `js/intl.js` | 11 | 국제대회: First Stand · Road to MSI · MSI (규칙: data/schedule.js INTL) |  |
| `js/main.js` | 54 | 게임 상태 |  |
| `js/training_page.js` | 20 | 훈련 화면 (pages.training) |  |
| `js/league_pages.js` | 19 | 리그 화면: 소속팀, 리그 순위, 대회 일정, 대시보드 경기 카드 |  |
| `js/events.js` | 36 | 이벤트 처리: 조건 감지 → SNS 메시지 → 선택 → 효과 |  |
| `js/sns_page.js` | 11 | SNS 화면 |  |
| `js/contracts.js` | 33 | 연봉 · 계약 · 2군행 · 이적 |  |
| `js/club_market.js` | 29 | 구단 이적 시장·여름 이적 | club_market.js, summer_market.js |
| `js/market_pages.js` | 26 | 선수 검색 · 구단 탐색 · 이적 시장 화면 |  |
| `js/links.js` | 4 | 선수·구단 이름 링크: 어느 화면이든 이름을 누르면 [선수 검색] / [구단 탐색]의 그 선수·구단으로 |  |
| `js/news.js` | 17 | 뉴스: 소식·신문 팝업·월즈 특집·역사 뉴스 | news.js, news_popup.js, worlds_news.js, historical_news.js |
| `js/dashboard.js` | 40 | 대시보드 위쪽: 지난주 결과, 커리어 요약, 솔로 랭크 |  |
| `js/records.js` | 10 | 기록: 세트 평점, POG, 시즌 기록, 시상, 커리어 시즌 기록 |  |
| `js/quests.js` | 18 | 퀘스트: 코치·감독 과제 |  |
| `js/shop.js` | 21 | 상점·거주지 | shop.js, housing.js |
| `js/guide.js` | 15 | 초보자 도움: 튜토리얼 · 지금 목표 · 이번 주 추천 · 게임 방법 (글은 data/guide.js) |  |
| `js/records_pages.js` | 12 | 기록 화면: 선수 정보 기록(위쪽), 개인 시상, 대회 일정(아래쪽) |  |
| `js/player_page.js` | 32 | [선수 정보] 내 선수의 모든 것 (2026-10-07, 예전 '나의 커리어'를 바꿈) |  |
| `js/retire.js` | 16 | 노화 · 은퇴 · 엔딩 · 명예의 전당 · 커리어 주요 순간 |  |
| `js/straits.js` | 14 | S급 특성: 얻는 조건 확인과 지급 (나와 다른 선수 모두) |  |
| `js/boxscore.js` | 5 | 경기 기록(박스 스코어): 픽, 킬/데스/어시스트, CS, 피해량, 시야, 라인·운영·한타 점수 |  |
| `js/comps.js` | 9 | 조합 성향: 메타 조합 · 조합 전략 · 밴픽 · 상성 · 시너지 |  |
| `js/match_detail.js` | 23 | [경기 결과] 화면: 경기 요약 · 세트별 분석 · 선수 기록 |  |
| `js/history_pages.js` | 15 | 역사관·리그 생태계·트로피 진열장 | history_pages.js, trophies.js |
| `js/shakeup.js` | 7 | 대격변 패치 (값: data/era.js) |  |
| `js/era.js` | 26 | 시대·해외 리그·시대별 경기 환경 | era.js, era_match.js |
| `js/fame.js` | 14 | 인기도 · 평판 (값: data/fame.js) |  |
| `js/collection.js` | 21 | 시그니처 픽·업적·컬렉션 | signature.js, collection.js |
| `js/friends.js` | 30 | 선수 관계 이야기·친구 | stories.js, friends.js |
| `js/retirement.js` | 8 | 은퇴·세대교체 (122) — 값: data/league.js LEAGUE.veterans · RETIRE_RULES, 글: data/retire_stories.j |  |
| `js/standing.js` | 17 | 팀 내 입지 (126) — 값·글: data/standing.js |  |
| `js/romance.js` | 12 | 연애 요소 (128) — 규칙 data/romance.js, 대상·대사·연락 data/romance.js |  |
| `js/dynasty.js` | 10 | 강팀 쏠림 막기 (v1.1): 왕조의 연봉 압박 · 해외 러브콜 · 분석 당하는 챔피언 |  |
| `js/world_moves.js` | 12 | ③ 선수 오가기 + 외국인 수 제한 + 언어 소통 (v1.1) |  |
| `js/rivals.js` | 17 | 맞대결 전적·구단별 빅게임 | h2h.js, biggame.js |
| `js/staff.js` | 17 | 구단 스태프 (173, 로드맵 ④) — 값은 data/club.js |  |
| `js/portrait.js` | 9 | 2D 도트 포트레잇 (175, 디자인 D1) — 값은 data/ui.js |  |
| `js/replay.js` | 19 | 경기 다시 보기 · 자동 재생 (177, 디자인 D3) — 값은 data/replay.js |  |
| `js/ui.js` | 10 | 화면 공통: 뒤집는 카드·페이지 머리·팀 배지·움직임 설정 | cards.js, pagehead.js |
| `js/great.js` | 7 | 훈련 대성공 (182) — 규칙·문구는 data/great.js |  |
| `js/look_edit.js` | 4 | 내 캐릭터 얼굴 바꾸기 (184) — 대시보드 내 선수 그림 ✏️ · 설정 및 저장 |  |
| `js/dash_plus.js` | 12 | 대시보드·진행 개선 (196, 시안 10 — 「풋볼 에이전시」 참고) |  |
| `js/mobile_nav.js` | 4 | 휴대폰 아래 탭 + 진행 막대 (197, 시안 12 A1) |  |
| `js/shortcuts.js` | 3 | 단축키 (198) |  |
| `js/start.js` | 0 | 게임 시작 |  |

- 데이터(숫자·문구)는 `data/`, 규칙·화면 코드는 `js/` (CLAUDE.md 규칙)
- 검사 도구: `tools/` (게임은 읽지 않음, tools/README.md)
