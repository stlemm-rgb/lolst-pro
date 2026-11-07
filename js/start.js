// ===== 게임 시작 =====
// 모든 파일을 읽은 뒤 마지막에 실행돼요.
// 저장된 게임이 있으면 이어서, 없으면 캐릭터 생성 화면
state = loadGame() || createNewState();
navRestoreLast(); // 285: 마지막에 보던 화면부터 (js/nav.js)
renderAll();
showUpdateNews(); // 317: 새 버전을 처음 열면 바뀐 것 한 번 (js/save.js)
