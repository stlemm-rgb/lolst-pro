// ===== 307 사운드 (로직: js/sound.js) — 사용자 결정 2026-11-06 =====
// 코드로 만든 8비트 소리 (Web Audio, 소리 파일 0개). 효과음 = 시안 1 '다. 레트로 게임기' (우승은 새 팡파레), 배경 음악 = 시안 3 '소환 (e스포츠 무대)'.
// 유명한 게임·LoL 음악과 닮은 음 배열은 쓰지 않음 (시안 1 우승 소리를 바꾼 이유).
const SOUND_RULES = {
  sfxOn: true, sfxVol: 50,      // 처음 값: 효과음 켜짐·중간
  bgmOn: true, bgmVol: 30,      // 처음 값: 음악 켜짐·효과음보다 작게
  sfxMax: 0.6, bgmMax: 0.5,     // 크기 100일 때 실제 크기
  duck: 0.35,                   // 경기 재생 중 음악 크기 (× 이 값)
  reverb: 0.28,                 // 음악 울림
  minGapMs: 45,                 // 같은 효과음이 이 시간 안에 또 오면 건너뜀 (겹쳐서 시끄럽지 않게)
  storeKey: "progamer-sound",   // 설정은 세이브와 따로 (localStorage)
};

// 효과음: 소리 조각 목록. n 음 이름 / f 주파수 · at 시작(초) · dur 길이 · duty 펄스파(0.125·0.25·0.5) 또는 type 파형 · vol · to 끝 주파수 · noise: lp/hp 필터
// arp: [음들], step 간격 → 차례로
const SFX = {
  click:   [{ f: 1046, dur: 0.035, duty: 0.25, vol: 0.18 }],
  next:    [{ arp: ["C5", "G5", "C6"], step: 0.04, dur: 0.06, duty: 0.125, vol: 0.18 }],
  tick:    [{ n: "A6", dur: 0.025, duty: 0.125, vol: 0.1 }],
  statup:  [{ arp: ["C6", "E6", "G6"], step: 0.035, dur: 0.06, duty: 0.25, vol: 0.16 }],
  great:   [{ arp: ["C5", "E5", "G5", "C6", "E6", "G6", "C7"], step: 0.035, dur: 0.08, duty: 0.25, vol: 0.16 }, { n: "C7", at: 0.26, dur: 0.3, duty: 0.5, vol: 0.12 }],
  notify:  [{ n: "B5", dur: 0.08, duty: 0.5, vol: 0.18 }, { n: "E6", at: 0.09, dur: 0.18, duty: 0.5, vol: 0.18 }],
  kill:    [{ noise: true, dur: 0.1, lp: 5000, vol: 0.2 }, { f: 600, to: 150, dur: 0.1, duty: 0.5, vol: 0.12 }],
  fight:   [0, 1, 2, 3, 4].map(function (i) { return { noise: true, at: i * 0.07, dur: 0.06, lp: 4000 - i * 500, vol: 0.2 }; }),
  object:  [{ arp: ["C4", "G4", "C5", "G4", "C5", "E5"], step: 0.07, dur: 0.1, duty: 0.25, vol: 0.18 }],
  setwin:  [{ arp: ["C5", "E5", "G5"], step: 0.08, dur: 0.1, duty: 0.25, vol: 0.18 }, { n: "C6", at: 0.26, dur: 0.35, duty: 0.25, vol: 0.18 }],
  setlose: [{ arp: ["C5", "B4", "A#4", "A4"], step: 0.14, dur: 0.16, duty: 0.5, vol: 0.16 }],
  trophy:  [{ arp: ["G4", "C5", "E5", "G5"], step: 0.07, dur: 0.1, duty: 0.25, vol: 0.17 }, { arp: ["E5", "G5", "C6"], at: 0.34, step: 0.07, dur: 0.1, duty: 0.25, vol: 0.17 },
            { n: "D6", at: 0.58, dur: 0.16, duty: 0.25, vol: 0.17 }, { n: "E6", at: 0.76, dur: 0.7, duty: 0.25, vol: 0.17 }, { n: "C4", at: 0.76, dur: 0.7, type: "triangle", vol: 0.3 },
            { noise: true, at: 0.76, dur: 0.5, hp: 5000, vol: 0.08 }],
};

// 배경 음악 '소환 (e스포츠 무대)': 128 BPM, 한 마디 = 8칸(8분음), 8마디 반복. '-' 앞 음 이어서 · '.' 쉼
// 멜로디는 '설레는 출발'을 라단조 진행(Am F C G)으로 옮긴 것 (새 곡)
const BGM = {
  summon: {
    name: "소환", bpm: 128,
    mel: ["C5 - E5 A5 - G5 E5 -", "C5 - F5 A5 - G5 F5 -", "E5 - G5 C6 - B5 G5 -", "D5 - G5 B5 - A5 G5 -",
          "C6 - B5 A5 - E5 C5 -", "A5 - G5 F5 - C5 A4 -", "G5 - A5 C6 - B5 G5 -", "B5 - D6 G5 . A5 B5 E6"],
    chords: [["A", "C", "E"], ["F", "A", "C"], ["C", "E", "G"], ["G", "B", "D"]],
    roots: ["A", "F", "C", "G"],
    lead: { duty: 0.25, vol: 0.12, det: 12 },
    pad: { det: 14, lp: 2400, vol: 0.08 },
    pump: 0.25,                   // 킥마다 배경 소리가 이만큼까지 작아졌다 커짐
    claps: [2, 6], riserBar: 7,   // 박수 칸, 고조되는 마디 (0부터)
  },
};
const BGM_DEFAULT = "summon";

// [설정] 화면 글
const SOUND_TEXT = {
  title: "🔊 소리",
  sfx: "효과음",
  bgm: "배경 음악",
  note: "화면을 한 번 누른 뒤부터 소리가 나요. 아이폰은 무음 스위치를 끄면 들려요. 이 설정은 세이브와 따로 저장돼요.",
  test: "들어 보기",
};
