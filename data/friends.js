// ===== 친구 시스템 데이터 (분기 활동 · 단계 이야기 · 친구 연락) =====

// 분기: q1 새 시즌 준비 / q2 스프링 휴식 / q3 서머 중반 / q4 비시즌 휴가.
const FRIEND_ACTIVITIES = [
  {
    id: "duo_soloq", icon: "🎮", label: "새벽 듀오 솔랭",
    when: ["q1", "q2", "q3"], kinds: ["mate", "rival", "old", "peer"],
    relation: 10, effects: { focus: 1, stamina: -3 },
    stories: [
      "{player}와(과) 마지막 한 판을 세 번이나 더 했다. 끝내 역전승을 하자 둘이 동시에 책상을 두드려 마이크가 울렸다.",
      "{player}와(과) 귀환 시간을 맞추는 연습을 했다. 마지막 판에는 말하지 않아도 함께 빠졌고, 서로 먼저 잘했다고 했다.",
      "{player}와(과) 연패 뒤 물 한 잔을 마시고 다시 앉았다. 다음 판에 첫 킬을 함께 만들자 굳어 있던 목소리가 풀렸다.",
    ],
  },
  {
    id: "vod_snacks", icon: "📺", label: "간식 놓고 공개 경기 복기",
    when: ["q1", "q2", "q3"], kinds: ["mate", "rival", "old", "peer"],
    relation: 10, effects: { macro: 1 },
    stories: [
      "{player}와(과) 공개 경기 영상을 멈추고 다음 움직임을 맞혀 봤다. 둘 다 틀릴 때마다 과자 한 개씩 벌금처럼 내려놓았다.",
      "{player}와(과) 같은 장면에 서로 다른 화살표를 그렸다. 종이가 새까매질 때쯤 왜 판단이 달랐는지 알게 됐다.",
      "{player}와(과) 잘한 장면만 하나씩 골라 다시 봤다. 내 화면 구석의 작은 움직임까지 알아봐 줘서 괜히 영상을 한 번 더 돌렸다.",
    ],
  },
  {
    id: "late_noodles", icon: "🍜", label: "연습 뒤 야식 원정",
    when: ["q1", "q2", "q3"], kinds: ["mate", "rival", "old", "peer"],
    relation: 8, effects: { condition: 4, money: -30000 },
    stories: [
      "{player}와(과) 문 닫기 직전 국숫집에 들어갔다. 마지막 만두를 반으로 나누다가 둘 다 젓가락질에 실패했다.",
      "{player}와(과) 매운 국물에 도전했다. 물병을 서로 밀어 주다가 결국 순한 국물 하나를 더 시켰다.",
      "{player}와(과) 포장한 야식을 공원 벤치에서 먹었다. 바람에 날아간 영수증을 함께 쫓느라 식기 전에 한바탕 뛰었다.",
    ],
  },
  {
    id: "pc_room_duel", icon: "🖱️", label: "PC방 일대일 간식 내기",
    when: ["q1", "q2", "q3"], kinds: ["rival", "peer"],
    relation: 12, effects: { laning: 1, money: -20000 },
    check: { stat: "laning", diff: 50 }, failRelation: 4, failEffects: { money: -30000 },
    stories: [
      "{player}와(과) 같은 챔피언으로 일대일을 했다. 간발의 차로 이기자 옆자리에서 약속한 과자가 조용히 넘어왔다.",
      "{player}와(과) 미니언 열 개를 먼저 놓치는 사람이 지는 내기를 했다. 마지막 한 개를 챙긴 뒤 서로의 손을 보며 웃었다.",
      "{player}와(과) 세 판째까지 승부를 가리지 못했다. 마지막 교전에서 이기고도 너무 목이 말라 음료는 내가 샀다.",
    ],
    failStories: [
      "{player}와(과) 일대일을 하다 미니언에게 막혀 졌다. 계산대까지 가는 동안 그 장면을 서로 몸짓으로 재현했다.",
      "{player}의 견제를 피하려다 엉뚱한 곳에 스킬을 썼다. 간식을 사 들고 돌아오니 재대결 자리를 비워 두고 기다리고 있었다.",
    ],
  },
  {
    id: "joint_stream", icon: "📡", label: "협동 게임 합동 방송",
    when: ["q2", "q4"], kinds: ["mate", "old", "peer"],
    relation: 14, effects: { popularity: 3, stamina: -3 },
    check: { stat: "popularity", diff: 45 }, failRelation: 3, failEffects: { condition: -2 },
    stories: [
      "{player}와(과) 협동 게임에서 같은 문에 끼었다. 서로 양보하겠다고 외치는 장면에 채팅창이 웃음으로 가득 찼다.",
      "{player}와(과) 시청자가 정한 별명으로만 서로를 불렀다. 방송을 끈 뒤에도 그 별명이 입에 붙어 한참 웃었다.",
      "{player}와(과) 마지막 보스를 잡자 동시에 의자에서 일어났다. 종료 화면을 띄워 놓고도 다음 방송 날짜를 한참 골랐다.",
    ],
    failStories: [
      "{player}와(과) 방송을 시작했는데 게임 소리만 나왔다. 마이크를 켜고 첫 인사부터 다시 하며 서로의 실수를 대신 설명해 줬다.",
      "{player}와(과) 어려운 퍼즐 앞에서 말이 끊겼다. 방송 뒤 둘이 남아 결국 답을 찾고 조용히 하이파이브했다.",
    ],
  },
  {
    id: "morning_run", icon: "🏃", label: "천천히 아침 러닝",
    when: ["q1", "q2", "q3"], kinds: ["mate", "old", "peer"],
    relation: 8, effects: { stamina: 5, condition: 3 },
    check: { stat: "stamina", diff: 45 }, failRelation: 4, failEffects: { stamina: -2 },
    stories: [
      "{player}와(과) 운동장 세 바퀴를 돌았다. 마지막 바퀴에는 대화가 끊겼지만 물 마시는 자리에서는 다시 수다가 시작됐다.",
      "{player}와(과) 달리다가 길을 건너는 강아지에게 멈춰 섰다. 주인 허락을 받고 쓰다듬느라 기록은 둘 다 잊었다.",
      "{player}와(과) 서로의 속도에 맞춰 강변을 뛰었다. 돌아오는 길에는 다음에 쉴 벤치까지 미리 골라 뒀다.",
    ],
    failStories: [
      "{player}와(과) 달리다 숨이 차서 걷기로 바꿨다. 속도를 낮추니 못 했던 이야기가 이어져 돌아오는 길은 짧게 느껴졌다.",
      "{player}와(과) 목표 지점까지 못 가고 벤치에 앉았다. 서로 운동화 끈을 다시 묶으며 다음에는 거리를 줄여 시작하자고 했다.",
    ],
  },
  {
    id: "new_champion_lab", icon: "🧪", label: "새 챔피언 실험",
    when: ["q1"], kinds: ["mate", "rival", "peer"],
    relation: 12, effects: { pool: 1, adapt: 1 },
    stories: [
      "{player}와(과) 연습 모드에서 새 챔피언의 사거리를 쟀다. 바닥 무늬를 기준으로 세다 보니 둘만 알아듣는 단위가 생겼다.",
      "{player}와(과) 특이한 아이템 조합을 하나씩 시험했다. 실패한 조합 옆에 웃는 얼굴을 그리니 노트가 금세 빼곡해졌다.",
      "{player}와(과) 공개된 스킬 설명을 읽고 연계 순서를 바꿔 봤다. 처음 성공한 순간을 녹화해 서로에게 바로 보냈다.",
    ],
  },
  {
    id: "gym_partner", icon: "🏋️", label: "헬스장 첫 수업",
    when: ["q1"], kinds: ["mate", "old", "peer"],
    relation: 10, effects: { stamina: 6, money: -80000 },
    stories: [
      "{player}와(과) 같은 시간대 운동 수업을 등록했다. 거울 앞에서 자세를 확인하다 눈이 마주쳐 둘 다 웃음을 참지 못했다.",
      "{player}와(과) 가벼운 무게부터 천천히 들었다. 마지막 횟수를 서로 세어 주니 혼자 할 때보다 덜 지루했다.",
      "{player}와(과) 스트레칭 매트를 나란히 폈다. 발끝에 손이 닿지 않는 모습을 보고 누가 먼저랄 것도 없이 사진을 찍었다.",
    ],
  },
  {
    id: "winter_sunrise", icon: "🌅", label: "새 시즌 첫 일출",
    when: ["q1"], kinds: ["mate", "old", "peer"],
    relation: 14, effects: { mental: 1, condition: 4 },
    stories: [
      "{player}와(과) 두꺼운 장갑을 끼고 해 뜨는 것을 기다렸다. 붉은 빛이 보이자 종이컵을 맞대고 새 시즌을 잘 버텨 보자고 했다.",
      "{player}와(과) 전망대 계단을 올라갔다. 해가 뜨는 동안 말없이 서 있다가 내려오는 길에 각자의 목표를 하나씩 말했다.",
      "{player}와(과) 새벽 버스에서 번갈아 졸았다. 종점에서 함께 내려 찍은 사진에는 일출보다 졸린 얼굴이 더 크게 나왔다.",
    ],
  },
  {
    id: "food_map", icon: "🥟", label: "골목 맛집 지도 만들기",
    when: ["q2"], kinds: ["mate", "rival", "old", "peer"],
    relation: 12, effects: { condition: 6, money: -60000 },
    stories: [
      "{player}와(과) 골목을 돌며 작은 만두집 세 곳을 찾았다. 지도에 별점을 적다 취향이 정반대라는 걸 알았다.",
      "{player}와(과) 긴 줄 끝에 서서 메뉴 사진을 확대해 봤다. 막상 차례가 오자 둘 다 옆 테이블 음식을 가리켰다.",
      "{player}와(과) 가게마다 한 접시씩 나눠 먹었다. 마지막 집에서는 배가 불러 다음 휴식기 약속부터 잡았다.",
    ],
  },
  {
    id: "bowling_bet", icon: "🎳", label: "볼링 두 게임",
    when: ["q2"], kinds: ["mate", "rival", "old", "peer"],
    relation: 10, effects: { condition: 5, money: -40000 },
    stories: [
      "{player}와(과) 가장 가벼운 공부터 골랐다. 둘 다 도랑에 빠뜨린 뒤부터 점수 대신 자세에 이름을 붙이기 시작했다.",
      "{player}와(과) 마지막 프레임까지 동점을 달렸다. 공이 천천히 핀 하나를 쓰러뜨리자 둘이 결승전처럼 소리쳤다.",
      "{player}와(과) 신발 끈을 다시 묶고 두 번째 게임을 시작했다. 첫 스트라이크가 나오자 상대 점수인데도 손뼉이 먼저 나왔다.",
    ],
  },
  {
    id: "theme_park", icon: "🎢", label: "놀이공원 도전",
    when: ["q2"], kinds: ["mate", "old", "peer"],
    relation: 16, effects: { mental: 1, money: -70000 },
    check: { stat: "mental", diff: 50 }, failRelation: 5, failEffects: { condition: -3, money: -70000 },
    stories: [
      "{player}와(과) 가장 높은 놀이기구 맨 앞에 앉았다. 내려와서 사진을 보니 둘 다 눈은 감고 손만 높이 들고 있었다.",
      "{player}와(과) 출발 전 안전 손잡이를 세 번씩 확인했다. 끝까지 타고 내려온 뒤에는 서로가 더 무서워했다고 우겼다.",
      "{player}와(과) 무서운 구간마다 같은 구호를 외쳤다. 저녁 퍼레이드를 볼 때도 그 구호만 나오면 웃음이 났다.",
    ],
    failStories: [
      "{player}와(과) 줄을 서다가 결국 옆의 회전목마로 향했다. 작은 말에 나란히 앉아 탄 사진을 서로 지우지 않기로 했다.",
      "{player}와(과) 한 번 탄 뒤 벤치에서 오래 쉬었다. 말없이 건네받은 물이 고마워 다음 코스는 내가 찾아봤다.",
    ],
  },
  {
    id: "riverside_chicken", icon: "🍗", label: "강변 치킨 소풍",
    when: ["q3"], kinds: ["mate", "rival", "old", "peer"],
    relation: 10, effects: { condition: 6, money: -35000 },
    stories: [
      "{player}와(과) 강변에 돗자리를 폈다. 치킨 상자가 바람에 닫힐 때마다 한 명은 뚜껑을 잡고 한 명은 먹었다.",
      "{player}와(과) 배달 장소를 못 찾아 다리 아래를 두 번 돌았다. 겨우 받은 치킨을 펼치자 누가 먼저랄 것도 없이 웃었다.",
      "{player}와(과) 남은 닭다리 하나를 걸고 가위바위보를 했다. 다섯 번 연속 비긴 뒤 그냥 살을 나눠 먹었다.",
    ],
  },
  {
    id: "transfer_walk", icon: "🚶", label: "이적 시장 뒤 산책",
    when: ["q3"], kinds: ["old", "peer", "rival"],
    relation: 14, effects: { mental: 1 },
    stories: [
      "{player}와(과) 편의점 음료를 들고 동네를 돌았다. 이미 발표된 이적 소식만 이야기하다가 결국 서로 잘 적응하고 있는지 물었다.",
      "{player}와(과) 걷다가 빈 놀이터 그네에 앉았다. 새로운 환경에서 가장 낯선 것들을 하나씩 말하니 생각보다 비슷했다.",
      "{player}와(과) 갈림길을 지나서도 한 바퀴 더 걸었다. 팀이 달라도 힘든 날 밥 먹을 사람은 있다는 말에 마음이 놓였다.",
    ],
  },
  {
    id: "summer_day_sea", icon: "🌊", label: "쉬는 날 바다 당일치기",
    when: ["q3"], kinds: ["mate", "old", "peer"],
    relation: 16, effects: { condition: 8, money: -120000 },
    stories: [
      "{player}와(과) 쉬는 날 첫 기차를 타고 바다에 갔다. 운동화가 젖지 않을 선을 찾다가 둘 다 파도에 발목을 적셨다.",
      "{player}와(과) 모래사장에 막대기로 경기 지도를 그렸다. 파도가 한 번에 지워 버리자 오늘은 게임 이야기를 쉬기로 했다.",
      "{player}와(과) 돌아올 기차 시간에 맞춰 해변을 걸었다. 주머니에 들어간 모래가 숙소까지 따라와 사진을 찍어 보냈다.",
    ],
  },
  {
    id: "jeju_trip", icon: "✈️", label: "비시즌 제주 여행",
    when: ["q4"], kinds: ["mate", "old", "peer"],
    relation: 22, effects: { condition: 10, money: -600000 },
    stories: [
      "{player}와(과) 제주 버스를 잘못 타 낯선 마을에 내렸다. 다음 버스를 기다리며 먹은 귤이 이번 여행 최고의 간식이 됐다.",
      "{player}와(과) 비 오는 바다 앞 숙소에서 보드게임을 펼쳤다. 밖에 못 나간 하루가 가장 많이 웃은 날로 남았다.",
      "{player}와(과) 바닷길을 걷다가 삼각대로 사진을 찍었다. 타이머에 맞춰 뛰어오는 모습까지 찍혀 둘만의 여행 표지가 됐다.",
    ],
  },
  {
    id: "winter_camp", icon: "🏕️", label: "비시즌 캠핑",
    when: ["q4"], kinds: ["mate", "old", "peer"],
    relation: 18, effects: { condition: 8, money: -180000 },
    check: { stat: "adapt", diff: 45 }, failRelation: 5, failEffects: { condition: -2, money: -180000 },
    stories: [
      "{player}와(과) 설명서를 펴고 텐트를 완성했다. 입구에 신발을 가지런히 놓으니 둘이 만든 작은 숙소 같았다.",
      "{player}와(과) 바람을 막을 자리를 찾아 의자를 옮겼다. 따뜻한 수프를 나눠 먹으며 올 시즌 가장 웃겼던 날을 골랐다.",
      "{player}와(과) 침낭에 누워 천장에 비친 랜턴 그림자를 봤다. 내년에도 시간이 맞으면 오자는 말을 잠들기 직전에 들었다.",
    ],
    failStories: [
      "{player}와(과) 텐트 기둥을 거꾸로 끼워 한참 헤맸다. 관리인 도움으로 완성한 뒤 서로의 얼어붙은 손에 핫팩을 쥐여 줬다.",
      "{player}와(과) 밥을 태워 근처에서 도시락을 사 왔다. 냄비를 함께 닦으며 다음에는 메뉴부터 쉽게 정하자고 했다.",
    ],
  },
  {
    id: "hometown_visit", icon: "🏡", label: "친구 고향 구경",
    when: ["q4"], kinds: ["old", "peer", "rival"],
    relation: 20, effects: { condition: 8, money: -150000 },
    stories: [
      "{player}와(과) 어릴 때 다녔다는 골목을 걸었다. 작은 분식집 의자에 앉자 프로가 되기 전 이야기가 줄줄 나왔다.",
      "{player}와(과) 옛 동네 운동장에서 공을 찼다. 어릴 때 골대로 썼다는 나무 두 그루 사이로 공을 넣고 함께 환호했다.",
      "{player}와(과) 고향 시장에서 저녁거리를 골랐다. 단골 가게에 나를 소개하는 목소리가 평소보다 조금 들떠 있었다.",
    ],
  },
  {
    id: "year_end_album", icon: "📷", label: "연말 사진 모임",
    when: ["q4"], kinds: ["mate", "rival", "old", "peer"],
    relation: 16, effects: { condition: 6, money: -50000 },
    stories: [
      "{player}와(과) 올해 함께 찍은 사진을 인화했다. 잘 나온 사진보다 흔들린 사진에 더 오래 설명을 붙였다.",
      "{player}와(과) 작은 케이크 앞에서 {year}년의 웃긴 장면을 골랐다. 순위를 정하지 못해 결국 전부 공동 일등으로 했다.",
      "{player}와(과) 사진 뒷면에 짧은 메모를 적어 바꿨다. 집에 돌아와 읽어 보니 내가 잊고 있던 작은 도움까지 적혀 있었다.",
    ],
  },
  {
    id: "dorm_cooking", icon: "🍳", label: "숙소 볶음밥 대결",
    when: ["q1", "q2", "q3"], kinds: ["mate"],
    relation: 12, effects: { condition: 4, money: -25000 },
    stories: [
      "{player}와(과) 냉장고 재료를 반씩 나눠 볶음밥을 만들었다. 서로의 접시를 바꿔 먹다 자기 요리가 더 짜다는 걸 인정했다.",
      "{player}와(과) 달걀을 예쁘게 올리는 데만 한참 썼다. 완성 사진을 찍고 나서는 찬밥인데도 싹 비웠다.",
      "{player}와(과) 앞치마를 두르고 요리 방송 흉내를 냈다. 조리보다 설거지가 오래 걸렸지만 끝까지 같이 주방을 닦았다.",
    ],
  },
  {
    id: "dorm_lane_drill", icon: "⌨️", label: "숙소 일대일 라인전 연습",
    when: ["q1", "q3"], kinds: ["mate"],
    relation: 10, effects: { spacing: 1, stamina: -3 },
    stories: [
      "{player}와(과) 역할을 바꿔 가며 첫 세 웨이브만 반복했다. 내가 자꾸 물러나는 지점에 표시를 해 줘서 습관을 알아챘다.",
      "{player}와(과) 딱 한 번의 견제만 주고받는 연습을 했다. 누가 맞았는지 애매한 순간에는 둘 다 화면 앞으로 고개를 내밀었다.",
      "{player}와(과) 연습이 끝난 뒤 키보드를 나란히 닦았다. 내일은 오늘보다 한 번 덜 맞아 보자며 주먹을 맞댔다.",
    ],
  },
  {
    id: "dorm_cleanup", icon: "🧹", label: "숙소 대청소",
    when: ["q1", "q2", "q3"], kinds: ["mate"],
    relation: 8, effects: { condition: 5, stamina: -2 },
    stories: [
      "{player}와(과) 소파를 옮기니 잃어버린 충전선이 세 개나 나왔다. 각자 주인을 찾으며 보물 감정하듯 식탁에 늘어놓았다.",
      "{player}와(과) 공용 냉장고에 이름표를 붙였다. 글씨를 못 알아보겠다고 놀리다가 서로의 이름까지 대신 써 줬다.",
      "{player}와(과) 창문을 닦고 깨끗해진 거실 바닥에 앉았다. 배달 음식을 먹고 난 뒤에는 누가 말하지 않아도 함께 치웠다.",
    ],
  },
  {
    id: "public_weakness_review", icon: "🔍", label: "공개 경기 속 습관 찾아주기",
    when: ["q2", "q3"], kinds: ["rival", "peer"],
    relation: 14, effects: { vision: 1, focus: 1 },
    stories: [
      "{player}와(과) 서로의 공개 경기만 골라 봤다. 같은 길로 귀환하는 버릇을 발견하고 지도에 대체 경로를 함께 그렸다.",
      "{player}와(과) 실수 장면 앞뒤를 천천히 돌려 봤다. 놀릴 줄 알았는데 왜 그랬는지 먼저 물어봐 줘서 솔직하게 답했다.",
      "{player}와(과) 공개 영상에서 고칠 습관을 하나씩 적었다. 각자 접은 종이를 챙기며 다음 경기에는 통하지 않을 거라고 웃었다.",
    ],
  },
  {
    id: "fan_meeting_pair", icon: "🎤", label: "휴가 팬 행사 동반 출연",
    when: ["q4"], kinds: ["rival", "peer"],
    relation: 14, effects: { popularity: 3, reputation: 1 },
    check: { stat: "popularity", diff: 50 }, failRelation: 3, failEffects: { condition: -2 },
    stories: [
      "{player}와(과) 팬들이 낸 그림 퀴즈를 풀었다. 서로의 엉뚱한 답을 설명해 주다 진행자까지 웃음을 터뜨렸다.",
      "{player}와(과) 작은 무대에서 서로의 장점을 하나씩 말했다. 준비해 간 문장보다 함께 연습했던 이야기에 박수가 더 컸다.",
      "{player}와(과) 사인 줄이 끝날 때까지 나란히 앉았다. 마지막 펜 뚜껑을 닫으며 다음에도 같이 나오자고 했다.",
    ],
    failStories: [
      "{player}와(과) 인사 순서를 헷갈려 동시에 마이크를 들었다. 대기실에서 다시 인사를 맞춰 보며 어색했던 장면을 웃어넘겼다.",
      "{player}와(과) 퀴즈 정답을 하나도 맞히지 못했다. 행사가 끝난 뒤 문제지를 다시 보며 둘만의 복습 시간을 가졌다.",
    ],
  },
];

const FRIEND_STAGE_STORIES = {
  friend: [
    "{player}와(과) 야식을 먹고 나서 빈 용기를 함께 치웠다. 헤어질 때 다음에 먹을 메뉴부터 정하는 사이가 됐다.",
    "{player}와(과) 듀오를 끝내고도 통화를 끊지 않았다. 게임을 꺼 놓고 내일 아침 메뉴를 이야기하다 보니 친구가 됐다는 실감이 났다.",
    "{player}와(과) 산책하던 길에 비가 내려 편의점 처마로 뛰었다. 젖은 어깨를 털며 웃고 나니 다음 약속을 잡기가 더 편해졌다.",
    "{player}와(과) 함께 찍은 사진을 골랐다. 잘 나온 내 얼굴보다 같이 웃는 사진을 보내고 싶어졌다.",
    "{player}와(과) 점심을 먹다가 말없이 반찬 접시를 바꿨다. 이제 서로 안 먹는 음식쯤은 기억하는 사이가 됐다.",
    "{player}와(과) 공개 경기 영상을 보다가 같은 순간에 멈춤을 눌렀다. 눈을 마주치고 웃은 뒤부터 복기 약속이 자연스러워졌다.",
    "{player}와(과) 집으로 가는 버스를 기다리며 이어폰을 한 쪽씩 나눠 꼈다. 그날 들은 노래가 나오면 먼저 연락할 사람이 생겼다.",
    "{player}와(과) 카페에서 보드게임을 정리했다. 상자에 빠진 말을 찾느라 함께 바닥을 살핀 뒤, 다음 판도 같이 하기로 했다.",
  ],
  best: [
    "{player}와(과) 밤 산책을 하다 벤치에 오래 앉았다. 처음으로 성적표에 적히지 않는 걱정까지 털어놓았고, 끝까지 기다려 주는 얼굴을 봤다.",
    "{player}와(과) 밥을 먹으며 가장 힘들었던 경기를 다시 이야기했다. 위로할 말을 서두르지 않고 내 그릇에 반찬부터 놓아 주는 모습에 마음이 놓였다.",
    "{player}와(과) 함께 찍은 사진을 정리하다 휴대폰 연락처를 봤다. 내 이름이 '{me}, 밥 거르지 마'로 저장돼 있어 한참 웃었다.",
    "{player}와(과) 듀오에서 크게 진 뒤 게임을 끄고 걸었다. 잘하는 날뿐 아니라 이런 날에도 곁에 있어 줄 친구라는 생각이 들었다.",
    "{player}와(과) 식당 구석에서 서로의 약점을 종이에 적었다. 읽고 나서 함께 종이를 찢어 버리니 숨기느라 힘주던 어깨가 풀렸다.",
    "{player}와(과) 여행 사진 뒷면에 다음 휴가 약속을 적었다. 어느 팀에서 뛰든 시간을 맞춰 보자는 말이 가벼운 인사처럼 들리지 않았다.",
    "{player}와(과) 도시락을 나눠 먹으며 가족에게도 못 했던 걱정을 말했다. 젓가락을 내려놓고 끝까지 들어 줘서 이 친구는 오래 곁에 두고 싶었다.",
    "{player}와(과) 빈 운동장에서 천천히 공을 주고받았다. 말이 없어도 어색하지 않아, 이제는 잘 보이려 애쓰지 않아도 되는 사이라는 걸 알았다.",
  ],
  bestFull: [
    "{player}와(과) 저녁을 먹고 다음 약속까지 잡았다. 이미 깊이 마음을 나누는 친구들과의 시간도 챙기면서 천천히 더 가까워지고 싶었다.",
    "{player}와(과) 오래 걸으며 많은 이야기를 했다. 서로 편해졌지만 속마음의 마지막 한 칸은 조금 더 시간을 두고 열기로 했다.",
    "{player}와(과) 여행 사진을 바꿔 가졌다. 지금 곁의 가까운 친구들도 소홀히 하지 않으며 이 인연을 오래 이어 가고 싶었다.",
    "{player}와(과) 협동 게임을 끝내고 다음 판을 기약했다. 마음을 깊이 나누는 사이가 되기까지 서두를 필요는 없었다.",
  ],
};

EVENTS.push(
  {
    id: "fr_slump_cheer", tab: "inbox", trigger: "random", who: "bestFriend",
    need: { weeks: [10, 40] },
    title: "💬 {player}의 늦은 저녁 초대",
    text: "{player}에게서 빈 식당 자리 사진이 왔다. '요즘 표정이 안 좋더라, 일단 밥부터 먹자.' 구석자리에는 물컵이 두 개 놓여 있었다.",
    choices: [
      { label: "만나서 밥 먹으며 고민을 말한다", effects: { relation: 10, condition: 6 }, result: "국이 식을 때까지 이야기를 들어 줬다. 답을 찾지는 못했지만 내일 연습장에 갈 마음은 생겼다." },
      { label: "함께 걸으며 마음을 정리한다", check: { stat: "mental", diff: 50 },
        success: { effects: { relation: 12, mental: 1 }, result: "{player}와(과) 동네를 두 바퀴 돌며 당장 고칠 것 하나를 정했다. 헤어지기 전에 먼저 주먹을 내밀었다." },
        fail: { effects: { relation: 5, condition: 3 }, result: "말이 자꾸 끊겨 같은 벤치에 오래 앉았다. {player}은(는) 재촉하지 않고 따뜻한 음료를 건넸다." } },
      { label: "참견하지 말라고 쏘아붙인다", effects: { relation: -10 }, result: "답장을 보내자 입력 중 표시가 사라졌다. 한참 뒤 '알겠어'라는 짧은 말만 왔다." },
    ],
  },
  {
    id: "fr_birthday_box", tab: "inbox", trigger: "random", who: "bestFriend",
    title: "🎁 뒤늦게 건네는 생일 선물",
    text: "{player}이(가) 지난 생일에 못 줬다며 작은 상자를 내밀었다. 안에는 함께 먹었던 간식과 삐뚤빼뚤한 손편지가 들어 있었다.",
    choices: [
      { label: "간식을 나눠 먹으며 편지를 읽는다", effects: { relation: 12, condition: 4 }, result: "편지의 오타를 읽어 주자 급히 종이를 뺏으려 했다. 마지막 줄의 응원은 모른 척 다시 접어 챙겼다." },
      { label: "고맙다며 저녁을 산다", effects: { relation: 8, money: -60000 }, result: "계산서를 먼저 집어 들고 다음 생일에는 늦지 말라고 했다. {player}은(는) 바로 달력에 표시하는 시늉을 했다." },
    ],
  },
  {
    id: "fr_win_replay", tab: "inbox", trigger: "afterWin", who: "friendMate",
    title: "🙌 함께 만든 승리 한 장면",
    text: "{player}이(가) 오늘 이긴 경기의 마지막 한타 영상을 보내 왔다. '여기서 네 콜 듣고 바로 들어갔다.' 화면을 멈추니 둘의 움직임이 겹쳐 있었다.",
    choices: [
      { label: "간식 먹으며 같이 다시 본다", effects: { relation: 10, teamfight: 1 }, result: "서로가 봤던 화면을 비교하며 영상을 돌렸다. 마지막에는 우승하는 날에도 이런 장면을 만들자고 했다." },
      { label: "내 덕에 이겼다고만 한다", effects: { relation: -8 }, result: "한타 전에 시야를 잡아 준 이야기는 꺼내지 않았다. {player}은(는) 영상을 닫고 먼저 연습하러 갔다." },
    ],
  },
  {
    id: "fr_romance_practice", tab: "inbox", trigger: "random", who: "bestFriend",
    title: "💌 보내기 전 연습 한 번",
    text: "{player}이(가) 좋아하는 사람에게 보낼 문장을 몇 번이나 지웠다. 카페 맞은편에 앉아 '너라면 이 말 부담스럽냐'고 작은 목소리로 물었다.",
    choices: [
      { label: "상대가 편하게 답할 문장을 같이 고른다", effects: { relation: 10, condition: 3 }, result: "긴 문장을 짧은 안부로 바꾸고 휴대폰을 내려놨다. 답장을 기다리는 동안 케이크 한 조각을 반씩 나눠 먹었다." },
      { label: "직접 고르게 하고 곁에서 기다린다", effects: { relation: 6 }, result: "전송 버튼을 누를 때만 손뼉을 작게 쳐 줬다. {player}은(는) 이제 게임 결승보다 떨린다며 웃었다." },
      { label: "고민을 우스갯소리로 넘긴다", effects: { relation: -5 }, result: "웃을 줄 알았는데 휴대폰을 뒤집어 놓았다. 남은 케이크를 먹는 동안 다른 이야기만 했다." },
    ],
  },
  {
    id: "fr_contract_notes", tab: "inbox", trigger: "random", who: "bestFriend",
    need: { weeks: [47, 48], noFlag: "fr_contract_pending" },
    title: "📝 계약보다 먼저 적을 것",
    text: "{player}와(과) 카페에 앉았다. 재계약과 새로운 도전 사이에서 고민한다며, 금액이 적힌 종이 대신 빈 노트를 내 쪽으로 밀었다.",
    choices: [
      { label: "중요한 조건을 함께 적고 다시 만나기로 한다",
        effects: { relation: 8, flag: { fr_contract_pending: true } },
        result: "출전 기회와 생활 환경을 한 줄씩 적었다. 결론을 재촉하지 않고 다음 만남에 다시 읽어 보기로 했다.",
        followUp: { event: "fr_contract_walk", weeks: [1, 2], chance: 1 } },
      { label: "내가 대신 정해 주려 한다", effects: { relation: -8 }, result: "내 선택이 맞다고 몰아붙이자 노트가 닫혔다. 함께 고민하자고 부른 것이지 답을 맡긴 건 아니라는 말을 들었다." },
    ],
  },
  {
    id: "fr_contract_walk", tab: "inbox", trigger: "followUp", who: "bestFriend",
    need: { flag: "fr_contract_pending" },
    title: "🚶 노트를 다시 펼친 날",
    text: "{player}와(과) 약속한 카페에서 다시 만났다. 지난번 적은 조건 몇 개에 동그라미가 쳐져 있었다.",
    choices: [
      { label: "우선순위가 달라진 이유를 듣는다", effects: { relation: 12, unflag: "fr_contract_pending" }, result: "어떤 결정을 하든 스스로 납득하고 싶다는 말을 들었다. 카페를 나와 함께 걷는 발걸음이 지난번보다 가벼웠다." },
      { label: "아직도 결정 못 했냐고 재촉한다", effects: { relation: -6, unflag: "fr_contract_pending" }, result: "{player}은(는) 동그라미 친 페이지를 접었다. 돌아가는 길에는 계약 이야기를 더 꺼내지 않았다." },
    ],
  },
  {
    id: "fr_clip_misunderstanding", tab: "inbox", trigger: "random", who: "bestFriend",
    need: { noFlag: "fr_reconcile_pending" },
    title: "📱 짧게 잘린 농담",
    text: "방송에서 {player}와(과) 했던 농담이 앞뒤 없이 짧게 퍼졌다. '너도 나를 그렇게 생각했냐'는 메시지와 함께 함께 찍은 영상이 도착했다.",
    choices: [
      { label: "상처 준 말을 인정하고 만나자고 한다",
        effects: { relation: -5, flag: { fr_reconcile_pending: true } },
        result: "해명부터 하려던 손을 멈추고 사과를 적었다. {player}은(는) 며칠 뒤 늘 가던 식당에서 보자고 했다.",
        followUp: { event: "fr_table_reconcile", weeks: [1, 3], chance: 1 } },
      { label: "농담도 못 받냐며 대화를 끊는다", effects: { relation: -15 }, result: "내가 웃겼다고 생각한 장면이 다시 눈에 들어왔다. 채팅창에는 더 이상 답이 올라오지 않았다." },
    ],
  },
  {
    id: "fr_table_reconcile", tab: "inbox", trigger: "followUp", who: "bestFriend",
    need: { flag: "fr_reconcile_pending" },
    title: "🍲 마주 앉아 푸는 오해",
    text: "{player}와(과) 약속한 식당 구석에 앉았다. 평소처럼 반찬을 밀어 주려다 손을 멈추는 모습에 먼저 말을 꺼냈다.",
    choices: [
      { label: "어떤 말이 아팠는지 끝까지 듣는다", effects: { relation: 16, unflag: "fr_reconcile_pending" }, result: "다음에는 공개적으로 하지 않을 농담을 함께 정했다. 식사가 끝날 무렵에는 서로의 빈 물컵을 다시 채워 주고 있었다." },
      { label: "형식적으로 사과하고 화제를 바꾼다", effects: { relation: -5, unflag: "fr_reconcile_pending" }, result: "일단 알겠다는 답은 들었지만 예전처럼 웃지는 못했다. 식당 문 앞에서 다음 약속 없이 헤어졌다." },
    ],
  },
  {
    id: "fr_dorm_prank", tab: "inbox", trigger: "random", who: "friendMate",
    title: "🧸 의자를 지키는 인형",
    text: "연습실 의자에 내 유니폼을 입은 인형이 앉아 있었다. 옆자리의 {player}은(는) 모르는 척 마우스만 움직였다.",
    choices: [
      { label: "인형 옆에서 함께 사진을 찍는다", effects: { relation: 8, condition: 4 }, result: "인형에게 오늘의 주전 자리를 양보하는 시늉을 했다. 범인도 결국 웃음을 터뜨리며 사진 안으로 들어왔다." },
      { label: "웃으며 연습 자리 장난은 여기까지만 하자고 한다", effects: { relation: 3 }, result: "인형은 둘이 볼 수 있는 선반으로 옮겼다. {player}이(가) 직접 의자를 정리하고 연습 화면을 켜 줬다." },
    ],
  },
  {
    id: "fr_call_dispute", tab: "inbox", trigger: "random", who: "friendMate",
    title: "🎧 겹쳐 버린 두 개의 콜",
    text: "연습 경기에서 내가 들어가자고 할 때 {player}은(는) 빠지자고 했다. 끝난 뒤 헤드셋을 내려놓은 채 마지막 장면을 다시 보자고 했다.",
    choices: [
      { label: "각자 본 정보를 짧게 정리한다", check: { stat: "shotcall", diff: 50 },
        success: { effects: { relation: 10, shotcall: 1 }, result: "서로 다른 정보를 보고 있었다는 걸 찾았다. 다음에는 쿨타임부터 말하기로 하고 같은 장면을 다시 연습했다." },
        fail: { effects: { relation: 3, condition: -2 }, result: "설명이 자꾸 겹쳐 잠깐 물을 마셨다. 종이에 차례로 적으니 적어도 무엇이 달랐는지는 보였다." } },
      { label: "내 말만 들었으면 됐다고 한다", effects: { relation: -10 }, result: "{player}은(는) 설명하려던 화면을 닫았다. 다음 연습에서는 필요한 콜만 짧게 오갔다." },
    ],
  },
  {
    id: "fr_starter_competition", tab: "inbox", trigger: "random", who: "friendMate",
    title: "🪑 친구와 나 사이의 한 자리",
    text: "{player}이(가) 예전 주전 경쟁 때 적었던 연습 노트를 가져왔다. '한 자리만 남았을 때 친구랑 서로 말도 안 했거든.' 페이지 모서리가 여러 번 접혀 있었다.",
    choices: [
      { label: "노트를 보며 공정하게 경쟁할 방법을 함께 적는다", effects: { relation: 10, mental: 1 }, result: "누가 후보가 되든 필요한 연습은 도와주자는 말을 적었다. 같은 상황이 와도 지킬 수 있도록 서로 소리 내 읽었다." },
      { label: "주전만 되면 친구는 상관없다고 한다", effects: { relation: -12 }, result: "{player}은(는) 노트를 가방에 넣었다. 지금 같은 편이라는 사실만으로 안심할 수는 없겠다는 답을 들었다." },
    ],
  },
  {
    id: "fr_match_tease", tab: "inbox", trigger: "friendVs", who: "friendOther",
    title: "⚔️ 오늘은 반대쪽 대기실",
    text: "오늘 맞붙을 {pteam}의 {player}에게서 손을 푸는 사진이 왔다. '끝나고 밥은 먹어도 경기에서는 안 봐준다.'",
    choices: [
      { label: "나도 준비됐다며 주먹 사진을 보낸다", effects: { relation: 6, focus: 1 }, result: "같은 이모티콘이 돌아왔다. 경기장에서는 제대로 겨루고 밖에서는 다시 친구로 만나기로 했다." },
      { label: "친구니까 살살 하라고 계속 조른다", effects: { relation: -8 }, result: "'그런 부탁은 하지 말자'는 답이 왔다. 장난으로 시작했지만 분위기가 무거워졌다." },
    ],
  },
  {
    id: "fr_transfer_tip", tab: "inbox", trigger: "random", who: "friendOther",
    need: { weeks: [47, 52] },
    title: "🧭 다른 팀 친구의 이적 소식",
    text: "{pteam}의 {player}와(과) 카페에서 만났다. 공개된 영입 소식 중 내가 확인해 볼 만한 팀이 있다며 휴대폰을 내밀었다.",
    choices: [
      { label: "확인할 정보를 메모한다", effects: { relation: 6, friendTip: true }, result: "지원할 포지션과 문의할 곳을 적었다. 확정된 제안은 아니라는 말을 듣고 직접 알아보기로 했다." },
      { label: "지금은 생각이 없다며 커피를 산다", effects: { relation: 3, money: -15000 }, result: "소식 챙겨 준 것은 고맙다고 했다. 컵을 내려놓고 나서는 쉬는 날 무엇을 할지 이야기했다." },
    ],
  },
  {
    id: "fr_friend_title", tab: "inbox", trigger: "friendTitle", who: "friendOther",
    title: "🏆 {player}의 우승 사진",
    text: "{pteam}의 우승 뒤 {player}에게서 메달을 든 사진이 왔다. 축하하는 마음과 내가 그 자리에 서고 싶다는 마음이 함께 들었다.",
    choices: [
      { label: "사진 속 표정을 놀리며 진심으로 축하한다", effects: { relation: 12, condition: 3 }, result: "'울어서 얼굴이 부었잖아'라고 보내자 웃는 답장이 왔다. 다음 만남에는 메달을 직접 보여 주기로 했다." },
      { label: "부럽지만 다음에는 내가 도전하겠다고 한다", effects: { relation: 6, mental: 1 }, result: "{player}은(는) 기다리겠다고 답했다. 사진을 다시 보며 나도 훈련 노트를 펼쳤다." },
      { label: "대진 운이 좋았다고 깎아내린다", effects: { relation: -12 }, result: "축하 메시지가 오가던 채팅창이 조용해졌다. 내 말 밑에 짧은 마침표 같은 답만 남았다." },
    ],
  },
  {
    id: "fr_join_invitation", tab: "inbox", trigger: "random", who: "friendOther",
    need: { weeks: [47, 52] },
    title: "👕 언젠가 같은 유니폼으로",
    text: "{pteam}의 {player}이(가) 밥을 먹다 '기회 되면 우리 팀도 알아볼래?'라고 물었다. 공식 제안은 아니지만 같은 팀에서 뛰는 이야기에 눈이 반짝였다.",
    choices: [
      { label: "관심 있다고 하고 정식으로 알아볼 길을 묻는다", effects: { relation: 8, friendTip: true }, result: "친구의 바람과 실제 영입은 별개라는 데 뜻을 모았다. 연락할 곳을 적고 식기 전에 밥부터 마저 먹었다." },
      { label: "서로 다른 팀에서 만나는 것도 좋다고 한다", effects: { relation: 4 }, result: "다음 맞대결 뒤에도 밥은 같이 먹자고 했다. {player}은(는) 그렇다면 계산은 이기는 쪽이 하자며 웃었다." },
    ],
  },
  {
    id: "fr_retirement_farewell", tab: "inbox", trigger: "friendRetire", who: "bestFriend",
    need: { noFlag: "fr_coach_reunion_pending" },
    title: "📦 유니폼을 접는 저녁",
    text: "이번 비시즌에 은퇴하는 {player}와(과) 장비를 정리했다. 낡은 마우스 패드를 말다가 '다음에는 코치로 이 게임 곁에 있고 싶다'는 말을 들었다.",
    choices: [
      { label: "함께 짐을 옮기고 다음 만남을 약속한다",
        effects: { relation: 15, flag: { fr_coach_reunion_pending: true } },
        result: "마지막 상자를 함께 들고 계단을 내려갔다. 새 일을 시작하면 첫 연습 자료를 같이 봐 주겠다고 했다.",
        followUp: { event: "fr_coach_reunion", weeks: [4, 8], chance: 1 } },
      { label: "추억이 담긴 사진을 골라 선물한다", effects: { relation: 10, money: -30000 }, result: "함께 웃던 사진 한 장을 작은 액자에 넣었다. {player}은(는) 새 책상에도 올려 두겠다고 했다." },
    ],
  },
  {
    id: "fr_coach_reunion", tab: "inbox", trigger: "followUp", who: "retiredFriend",
    need: { flag: "fr_coach_reunion_pending" },
    title: "📋 이제는 코치의 연습 노트",
    text: "은퇴 뒤 신인들을 가르치는 코치가 된 {player}에게서 연락이 왔다. 약속대로 카페에서 만나자 처음 만든 연습 자료가 테이블 위에 놓여 있었다.",
    choices: [
      { label: "선수 입장에서 자료를 함께 읽는다", effects: { relation: 12, unflag: "fr_coach_reunion_pending" }, result: "이해하기 어려운 설명 옆에 예시 그림을 그렸다. {player}은(는) 선수 때 함께 복기하던 기분이라며 노트를 챙겼다." },
      { label: "오늘은 쉬면서 근황부터 나눈다", effects: { relation: 6, unflag: "fr_coach_reunion_pending" }, result: "자료를 잠시 덮고 낯선 출근 생활 이야기를 들었다. 경기 결과 대신 제자의 작은 성장을 말하는 표정이 밝았다." },
    ],
  },
  {
    id: "fr_commentator_replay", tab: "inbox", trigger: "random", who: "retiredFriend",
    title: "🎙️ 해설 연습을 들어 줄 친구",
    text: "은퇴 후 해설 일을 시작한 {player}이(가) 공개 경기 영상과 음성 파일을 보내 왔다. '말이 너무 빨라지는지 같이 들어 줄래?'",
    choices: [
      { label: "영상 통화로 함께 듣고 표시한다", effects: { relation: 8, focus: 1 }, result: "숨이 가빠지는 구간마다 영상에 시간을 적었다. 다시 녹음한 설명은 더 편하게 들려 서로 고개를 끄덕였다." },
      { label: "마음에 든 장면부터 자세히 말해 준다", effects: { relation: 6, condition: 3 }, result: "선수 때의 경험을 풀어 준 장면이 좋았다고 했다. 다음 연습 파일도 보내겠다며 한결 편한 목소리로 웃었다." },
    ],
  }
);

// ===== 친구 시스템 규칙 (엔진: js/friends.js) =====
// - quarters: 분기 친구 활동 연락이 오는 주 (1년 4번)
// - friendFrom / bestFrom: 관계 점수 기준 (친구 25 / 절친 50), bestMax: 절친 최대 수
const FRIEND_RULES = {
  quarters: { 3: "q1", 16: "q2", 29: "q3", 49: "q4" },
  quarterNames: { q1: "새 시즌 준비", q2: "스프링 휴식기", q3: "서머 중반", q4: "비시즌 휴가" },
  intro: {
    q1: "새 시즌 준비로 바쁜 와중에 하루 쉬는 날이 생겼다. 누구와 무엇을 해 볼까?",
    q2: "스프링이 끝나고 짧은 휴식기가 왔다. 오랜만에 누군가와 시간을 보내고 싶다.",
    q3: "이적 시장이 지나가고 숙소 분위기가 조금 달라졌다. 머리를 식힐 겸 누구를 만나 볼까?",
    q4: "긴 시즌이 끝났다. 휴가 동안 누구와 추억을 만들어 볼까?",
  },
  friendFrom: 25,
  bestFrom: 50,
  bestMax: 3,
  rest: { label: "😴 이번엔 혼자 푹 쉰다", effects: { condition: 5, stamina: 5 }, result: "아무 약속 없이 하루 종일 잤다. 몸은 개운한데 휴대폰은 조용했다." },
  kindNames: { mate: "팀 동료", rival: "같은 포지션 라이벌", old: "예전 동료", peer: "동갑내기" },
  roles: ["코치", "해설위원", "개인 방송 스트리머", "아카데미 강사"],
};
