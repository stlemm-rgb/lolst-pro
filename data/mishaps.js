// ===== 웃긴 해프닝 (2026-11-02) — 게임 결과와 관계없는 우스꽝스러운 사건사고 =====
// 보여 주는 곳: 📸 SNS 피드의 '😂 해프닝' 글 (js/sns_page.js) · 방 그림 소품 (js/room.js, prop이 있을 때)
// 언제: 대략 every주에 한 번. 연도·주차·내 이름으로 계산한 고정 번호로 고름 → 게임 결과용 난수(Math.random)를 안 쓰고, 저장도 안 함
//       (같은 주는 다시 열어도 같은 해프닝. 승패·스탯·돈·세이브는 그대로)
//
// ■ 해프닝 하나 = { id, place, prop, fan, pro }
//   id    영어 소문자 이름 (겹치면 안 됨)
//   place 장소: 숙소 · 경기장 · 방송 · 팬 · 동료
//   prop  방 그림에 나오는 소품: "cat"(고양이) · "pizza"(피자 상자) · "ramen"(라면 그릇) · null(없음). 숙소 해프닝에만
//   fan   팬이 올리는 글 (반말·커뮤니티 말투) — 꼭 있어야 함
//   pro   다른 팀 프로 선수가 올리는 글 (존댓말) — 없으면 "" (그러면 팬 글만)
// ■ 빈칸: {name} 내 선수 이름 · {team} 내 팀 이름 (다른 빈칸은 안 씀). 글 안에 큰따옴표(") 금지
// ■ 내용: 웃기지만 아무도 다치지 않고, 경기력·스탯 변화로 읽히지 않는 일. 실존 인물·욕설·혐오·성적인 내용 금지

const MISHAP_RULES = {
  every: 4,                                      // 대략 4주에 한 번 (사용자 결정)
  places: ["숙소", "경기장", "방송", "팬", "동료"],
  props: ["cat", "pizza", "ramen"],
  tag: "😂 해프닝",
  proRate: 0.5,                                  // pro 글이 있으면 절반쯤은 프로 선수가 올림 (고정 번호로)
};

const MISHAPS = [
  { id: "cat_keyboard", place: "숙소", prop: "cat", fan: "{name} 숙소 고양이가 키보드 밟아서 오늘 인사는 ㅁㅁㅁ이래 ㅋㅋ", pro: "{name} 선수 숙소 고양이의 채팅을 봤습니다. 인사가 아주 간결하네요." },
  { id: "cat_chair", place: "숙소", prop: "cat", fan: "의자 뺏긴 {name} 고양이 눈치 보며 작은 방석에 앉았대", pro: "{name} 선수보다 고양이가 의자에 먼저 앉았군요. 자리 협상이 필요하겠네요." },
  { id: "cat_camera", place: "숙소", prop: "cat", fan: "{name} 숙소 사진 찍는데 고양이 꼬리만 렌즈 앞에 대문짝만 함", pro: "" },
  { id: "cat_box", place: "숙소", prop: "cat", fan: "{name} 고양이한테 새 방석 줬는데 포장 상자에서만 잔다네", pro: "" },
  { id: "pizza_compass", place: "숙소", prop: "pizza", fan: "{name} 피자 상자 돌리며 큰 조각 찾다가 방향만 네 번 바꿈", pro: "{name} 선수의 피자 조각 고르기가 길어졌네요. 상자 방향만 계속 바뀝니다." },
  { id: "pizza_note", place: "숙소", prop: "pizza", fan: "{name} 피자 상자에 이름 써놨는데 다 먹은 빈 상자였음 ㅋㅋ", pro: "{name} 선수, 이름표가 붙은 빈 피자 상자는 보관용 기념품인 건가요?" },
  { id: "pizza_border", place: "숙소", prop: "pizza", fan: "숙소 피자 끝부분 줄 세운 {name} 갑자기 빵 테두리 전시회 열었네", pro: "" },
  { id: "pizza_photo", place: "숙소", prop: "pizza", fan: "{name} 피자 인증 사진에 뚜껑만 찍혀서 메뉴 맞히기 시작됨", pro: "" },
  { id: "ramen_lake", place: "숙소", prop: "ramen", fan: "{name} 라면 물 너무 많이 잡아서 그릇에 면발 몇 가닥만 섬처럼 보임", pro: "{name} 선수의 라면 사진을 봤습니다. 면을 찾으려면 지도가 필요하겠네요." },
  { id: "ramen_timer", place: "숙소", prop: "ramen", fan: "{name} 라면 타이머 이름을 기상 알람으로 해둬서 다들 일어남", pro: "{name} 선수 라면 알람에 숙소가 잠깐 기상 시간으로 착각했다는군요." },
  { id: "ramen_chopsticks", place: "숙소", prop: "ramen", fan: "{name} 라면 먹으려는데 젓가락 대신 길이 다른 나무주걱 두 개 꺼냄", pro: "" },
  { id: "ramen_portrait", place: "숙소", prop: "ramen", fan: "{name} 라면 그릇 김 때문에 셀카가 온통 뿌옇게 나왔네 ㅋㅋ", pro: "" },
  { id: "sock_exhibit", place: "숙소", prop: null, fan: "{name} 숙소 양말 정리하다 짝 없는 것들로 개인 전시회 차림", pro: "{name} 선수의 양말 사진을 봤는데 색상별 전시 설명까지 붙어 있더군요." },
  { id: "remote_fridge", place: "숙소", prop: null, fan: "{name} 숙소 리모컨 찾았는데 과자 서랍에서 간식이랑 같이 나옴", pro: "{name} 선수, 리모컨도 간식 시간에 함께 쉬고 있었던 모양입니다." },
  { id: "pillow_label", place: "숙소", prop: null, fan: "숙소 쿠션에 자리 비움 팻말 놓고 간 {name} 꽤 진지하네 ㅋㅋ", pro: "" },
  { id: "blanket_cape", place: "숙소", prop: null, fan: "{name} 이불 빨래 걷다가 망토처럼 걸치고 복도 한 바퀴 돌았대", pro: "" },
  { id: "plant_name", place: "숙소", prop: null, fan: "숙소 화분 이름 공모했는데 최종 후보가 전부 채소 이름이래", pro: "" },
  { id: "laundry_memo", place: "숙소", prop: null, fan: "{name} 세탁 끝 메모를 너무 크게 써서 숙소 벽보처럼 됐네", pro: "" },
  { id: "slipper_train", place: "숙소", prop: null, fan: "숙소 슬리퍼 나란히 정리했더니 현관부터 기차 노선 생김 ㅋㅋ", pro: "" },
  { id: "cup_labels", place: "숙소", prop: null, fan: "컵마다 이름 붙인 {name} 본인 컵에는 내 컵이라고만 써둠", pro: "" },
  { id: "mic_reverse", place: "경기장", prop: null, fan: "{name} 인터뷰 마이크 거꾸로 들었다가 혼자 고개 끄덕임 ㅋㅋ", pro: "{name} 선수, 마이크 방향을 바로잡은 뒤 첫마디가 방향 확인이셨네요." },
  { id: "photo_blink", place: "경기장", prop: null, fan: "{name} 단체사진 찍을 때마다 눈 감아서 마지막엔 구호 직접 셌대", pro: "{name} 선수 덕분에 단체사진 촬영 구호가 점점 길어져서 웃었습니다." },
  { id: "door_pull", place: "경기장", prop: null, fan: "{name} 당기시오 문 앞에서 밀까 당길까 작게 회의한 거 봄?", pro: "{name} 선수와 문 앞에서 잠시 고민했는데 안내문이 바로 눈앞에 있었네요." },
  { id: "lanyard_flip", place: "경기장", prop: null, fan: "{name} 출입증 사진 뒤집힌 줄 모르고 본인 얼굴 안 보인다고 찾음", pro: "{name} 선수, 출입증 속 사진을 찾으실 때 카드 뒷면부터 보시면 됩니다." },
  { id: "stage_wave", place: "경기장", prop: null, fan: "{name} 경기장 카메라에 인사했는데 꺼진 카메라라 관객만 받아줌", pro: "{name} 선수의 인사를 카메라 대신 옆에 계신 관객분들이 받아주셨네요." },
  { id: "water_names", place: "경기장", prop: null, fan: "{name} 경기장 물병에 이름 크게 써서 멀리서도 출석 확인 가능", pro: "{name} 선수 물병의 글씨가 안내판만큼 선명해서 멀리서도 알아봤습니다." },
  { id: "empty_sign", place: "경기장", prop: null, fan: "{name} 사인해주려고 펜 뚜껑만 들고 나와서 다시 돌아갔대", pro: "" },
  { id: "waiting_pose", place: "경기장", prop: null, fan: "대기실 거울 앞 {name} 인사 연습하다 직원이랑 진짜 인사함", pro: "" },
  { id: "sofa_cushion", place: "경기장", prop: null, fan: "{name} 대기실 쿠션 들고 단체사진 줄 서서 쿠션도 팀원 된 듯", pro: "" },
  { id: "hall_echo", place: "경기장", prop: null, fan: "빈 경기장 복도에서 인사했는데 메아리만 돌아와서 또 인사했대", pro: "" },
  { id: "camera_count", place: "경기장", prop: null, fan: "사진사가 셋 세기 전에 {name} 혼자 박수 쳐서 다들 따라 침", pro: "" },
  { id: "seat_sticker", place: "경기장", prop: null, fan: "{name} 대기석 이름표 옷에 붙은 줄 모르고 등에 이름 달고 다님", pro: "" },
  { id: "dinner_reply", place: "방송", prop: null, fan: "{name} 방송에 밥 먹어 소리 들리니까 채팅창 전원이 네 대답함", pro: "{name} 선수 방송을 보다가 저도 저녁 먹으라는 말씀에 대답할 뻔했습니다." },
  { id: "mic_song", place: "방송", prop: null, fan: "{name} 음소거인 줄 알고 콧노래 했는데 채팅에서 다음 소절 기다림", pro: "{name} 선수의 콧노래를 들었습니다. 채팅창이 잠깐 작은 음악회가 됐네요." },
  { id: "camera_zoom", place: "방송", prop: null, fan: "{name} 방송 카메라 줌 잘못 눌러서 이마만 화면 가득 나옴", pro: "{name} 선수 방송에 잠시 이마만 나와서 카메라 위치부터 확인했습니다." },
  { id: "chat_font", place: "방송", prop: null, fan: "{name} 채팅 글자 키우다가 한 글자씩 읽는 초대형 자막 됨", pro: "{name} 선수 채팅창 글씨가 커져서 저도 멀리서 편하게 읽을 수 있었습니다." },
  { id: "mute_greeting", place: "방송", prop: null, fan: "{name} 방송 시작 인사 세 번 했는데 마이크 켠 건 네 번째래", pro: "" },
  { id: "cursor_circle", place: "방송", prop: null, fan: "방송 화면 멈췄냐고 하니까 {name} 커서로 원 그리며 생존 신고함", pro: "" },
  { id: "ending_loop", place: "방송", prop: null, fan: "{name} 방송 종료 인사하고 질문 하나씩 더 받아서 인사만 다섯 번", pro: "" },
  { id: "screen_memo", place: "방송", prop: null, fan: "{name} 방송 메모장에 할 말 써놨는데 첫 줄이 메모장 닫기였음", pro: "" },
  { id: "snack_poll", place: "방송", prop: null, fan: "방송 간식 투표했는데 둘 다 먹자가 이겨서 접시 두 개 나옴", pro: "" },
  { id: "chair_squeak", place: "방송", prop: null, fan: "{name} 의자 삐걱 소리 날 때마다 채팅에서 의자도 인사하네 함", pro: "" },
  { id: "banner_typo", place: "팬", prop: null, fan: "{name} 응원 문구 오타 보고 그대로 읽어줘서 현장 별명 새로 생김", pro: "{name} 선수, 플래카드 오타까지 다정하게 읽어주셔서 현장이 웃음바다였네요." },
  { id: "lunch_label", place: "팬", prop: null, fan: "{name} 팬 도시락에 체력 +10 적혀 있길래 그냥 맛 설명이라고 함", pro: "{name} 선수 도시락 문구가 재미있네요. 수치 대신 따뜻한 응원이 담겼습니다." },
  { id: "tiny_portrait", place: "팬", prop: null, fan: "{name} 팬이 준 초미니 초상화 보려고 단체로 얼굴 가까이 모음", pro: "{name} 선수의 작은 초상화를 보려고 다 같이 고개를 모았던 순간이 기억나네요." },
  { id: "sign_long", place: "팬", prop: null, fan: "{name} 팬 닉네임 너무 길어서 사인지 끝에 글씨가 점점 작아짐", pro: "{name} 선수, 긴 닉네임을 끝까지 적으시느라 마지막 글씨가 아주 작아졌네요." },
  { id: "plush_twin", place: "팬", prop: null, fan: "{name} 닮은 인형 선물 받았는데 인형 머리부터 단정히 만져줌", pro: "" },
  { id: "fan_umbrella", place: "팬", prop: null, fan: "응원 우산 접었더니 문구가 반만 남아서 다 같이 뜻 추측함", pro: "" },
  { id: "bracelet_colors", place: "팬", prop: null, fan: "{name} 팬 팔찌 색 순서 외우다 손목 돌리니까 처음부터 다시 셈", pro: "" },
  { id: "letter_fold", place: "팬", prop: null, fan: "{name} 접이식 팬레터 펼치는데 계속 길어져서 옆자리까지 넘어감", pro: "" },
  { id: "heart_mirror", place: "팬", prop: null, fan: "{name} 팬이랑 손하트 맞추려다 둘 다 같은 쪽 손만 계속 바꿈", pro: "" },
  { id: "cookie_face", place: "팬", prop: null, fan: "팬 쿠키에 그려진 얼굴이 너무 진지해서 먹기 전 인사부터 했대", pro: "" },
  { id: "wallet_memory", place: "동료", prop: null, fan: "{name} 동료랑 지갑 두고 왔다며 놀라더니 둘 다 가방 안에서 찾음", pro: "{name} 선수와 지갑을 찾느라 한참 웃었습니다. 둘 다 안쪽 주머니에 있었네요." },
  { id: "snack_border", place: "동료", prop: null, fan: "{name} 동료 팀 간식까지 한 접시에 담고 국경 없는 간식이라 부름", pro: "{name} 선수와 간식을 합쳐놓으니 어느 팀 접시였는지 아무도 모르겠더군요." },
  { id: "matching_shirts", place: "동료", prop: null, fan: "{name} 동료랑 약속 없이 같은 옷 입고 와서 서로 코디 검사함", pro: "{name} 선수와 같은 색 옷을 입고 만나서 누가 먼저 골랐는지 이야기했습니다." },
  { id: "menu_echo", place: "동료", prop: null, fan: "{name} 동료랑 메뉴 고르는데 아무거나만 주고받다 메뉴판 다시 폄", pro: "{name} 선수와 메뉴를 고르다 아무거나라는 대답만 반복해서 함께 웃었습니다." },
  { id: "greeting_repeat", place: "동료", prop: null, fan: "{name} 동료랑 복도에서 세 번 마주쳐서 세 번 다 처음처럼 인사함", pro: "{name} 선수와 복도에서 자꾸 마주쳐서 인사말을 매번 새로 골라봤습니다." },
  { id: "photo_timer", place: "동료", prop: null, fan: "{name} 동료랑 셀카 타이머 켰는데 둘 다 숫자 세는 입 모양만 찍힘", pro: "{name} 선수와 사진을 찍었는데 둘 다 타이머 숫자를 읽는 표정으로 남았네요." },
  { id: "bag_twin", place: "동료", prop: null, fan: "{name} 동료랑 가방 똑같아서 구분용 리본 달았는데 리본도 같은 색", pro: "{name} 선수와 가방을 구분하려고 리본을 달았는데 색까지 같아서 다시 웃었습니다." },
  { id: "map_spin", place: "동료", prop: null, fan: "{name} 동료랑 길 안내 지도 보는데 둘이 번갈아 화면만 빙빙 돌림", pro: "{name} 선수와 지도를 보다가 방향을 맞추느라 같은 자리에서 한 바퀴 돌았습니다." },
];
