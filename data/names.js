// ===== data/names.js — 이름: 구단·선수·실존 이름 선수 (R2: 파일 3개를 합침) =====

// ━━━━━ (예전 data/team_names.js) ━━━━━
// 구단 이름 = 기업명 + 서브 브랜드 (예: T1 VANGUARD)
// - 1부 기업명 10개는 고정이에요. 서브 브랜드는 새 게임마다 무작위로 붙어요.
// - 2부 구단은 영문 2글자 기업명(무작위) + 서브 브랜드
const TIER1_ORGS = ["GEN.G", "Hanwha", "T1", "Dplus", "KT", "BNK", "BRION", "NS", "KW", "DN"];

// 기존 세이브의 고정 구단만 개명 (무작위 2부 구단의 같은 약칭은 유지).
const TEAM_ORG_RENAMES = [
  { id: "T2", from: ["HL"], to: "Hanwha" },
  { id: "T4", from: ["DK", "DP"], to: "Dplus" },
];

// 서브 브랜드 50개 (이름, 뜻)
const TEAM_BRANDS = [
  ["VANGUARD", "선봉대"],
  ["ECLIPSE", "일식·월식"],
  ["LEGION", "군단"],
  ["APEX", "정점"],
  ["PHANTOM", "유령"],
  ["TITAN", "거인"],
  ["IGNITE", "점화·발화"],
  ["VENOM", "맹독"],
  ["DYNASTY", "왕조"],
  ["SYNDICATE", "연합"],
  ["NEXUS", "연결점·핵심"],
  ["OMEGA", "최후·극상"],
  ["ALPHA", "최초·우두머리"],
  ["PRIME", "전성기·주요한"],
  ["SHADOW", "그림자"],
  ["STORM", "폭풍"],
  ["VALOR", "용기·용맹"],
  ["REAPER", "수확자·사신"],
  ["PRODIGY", "신동·영재"],
  ["TEMPEST", "대폭풍"],
  ["AVALANCHE", "눈사태"],
  ["VORTEX", "소용돌이"],
  ["HORIZON", "지평선"],
  ["SPECTRE", "망령"],
  ["IMPACT", "충격·충돌"],
  ["MIRAGE", "신기루"],
  ["RAMPAGE", "광란·광포"],
  ["CHRONO", "시간"],
  ["PULSE", "맥박·파동"],
  ["SOLIS", "태양"],
  ["OBSIDIAN", "흑요석"],
  ["ZENITH", "정점·천정"],
  ["VALKYRIE", "발키리"],
  ["INFERNO", "대화재·지옥불"],
  ["GENESIS", "창세기·기원"],
  ["NOVA", "신성"],
  ["CYCLONE", "사이클론"],
  ["HYDRA", "하이드라"],
  ["NEMESIS", "천적·복수의 여신"],
  ["ABYSS", "심연"],
  ["TITANIUM", "티타늄"],
  ["EMPIRE", "제국"],
  ["KINETIC", "운동의·활동적인"],
  ["SPECTRUM", "스펙트럼"],
  ["AURA", "오라·기운"],
  ["MATRIX", "모체·기반"],
  ["OVERLOAD", "과부하"],
  ["ZEPHYR", "서풍·산들바람"],
  ["ASTRUM", "별·천체"],
  ["RUSH", "돌격"],
];

// 해외 가상 구단 이름 (월드 챔피언십용)
const OVERSEAS_TEAM_NAMES = [
  "드래곤 게이트", "팬더 킹덤", "레드 로터스", "제이드 엠파이어", "스카이 템플", "썬 라이즈",
  "노던 라이츠", "바이킹 레이드", "로열 크라운", "블랙 포레스트", "알파 울프", "아틀란티스",
  "엘 솔", "아마존 퀸즈", "카니발", "선셋 비치", "볼케이노", "삼바 스톰",
];

// ━━━━━ (예전 data/player_names.js) ━━━━━
// 선수 이름 후보 (500개)
// - 게임을 시작할 때와 신인 선수가 들어올 때 여기서 무작위로 뽑아요.
// - 한 줄에 하나씩 자유롭게 추가·삭제해도 돼요.
const PLAYER_NAMES = `
Ace
Aero
Aether
Aim
Aika
Aizen
Apex
Aqua
Ares
Aria
Arise
Aris
Ash
Asta
Astro
Atom
Atrox
Axle
Ayaka
Azure
Bane
Bark
Bear
Beast
Blank
Blaze
Blink
Blitz
Block
Blood
Blue
Bolt
Bone
Boom
Boss
Brio
Bull
Burn
Buzz
Byte
Cage
Cake
Calm
Camp
Cap
Cash
Cast
Cave
Cell
Chaos
Claw
Core
Craze
Crest
Crown
Crux
Cryo
Cube
Cyan
Cyst
Dark
Dart
Dash
Dawn
Dice
Dirt
Dive
Dock
Doom
Door
Dope
Dose
Drag
Drop
Duke
Dune
Dusk
Dust
Duty
Dyna
Echo
Eden
Edge
Edit
Elixir
Envy
Eon
Epic
Era
Evil
Excel
Exit
Exo
Expo
Ext
Eye
Ezra
Ezy
Evo
Exil
Fade
Fall
Fang
Fast
Fate
Fear
Feed
Feel
Fire
Fish
Fizz
Flag
Flee
Flip
Flow
Flux
Fog
Fool
Form
Fox
Gale
Game
Gate
Gear
Gem
Ghost
Gift
Glad
Glee
Glow
Glue
Goal
Gold
Good
Goon
Gore
Grab
Grim
Grip
Grit
Halo
Halt
Hand
Hard
Hate
Hawk
Heal
Heat
Hell
Hero
Hide
High
Hill
Hint
Hit
Hive
Hoax
Hold
Hole
Hope
Ibis
Ice
Icon
Idea
Idle
Idol
Igloo
Ignite
Imp
Inch
Info
Ink
Inn
Ion
Iris
Iron
Item
Ivory
Ivy
Ize
Jack
Jade
Jail
Jam
Jar
Jaw
Jazz
Jeep
Jest
Jet
Jinx
Jive
Job
Join
Joke
Jolt
Joy
Jump
Junk
Just
Keen
Keep
Key
Kick
Kid
Kill
Kind
King
Kiss
Kite
Kiwi
Knee
Knit
Knot
Know
Koda
Koko
Kong
Krew
Kyro
Lace
Lack
Lake
Lamb
Lamp
Land
Lane
Last
Late
Lava
Law
Lazy
Lead
Leaf
Leak
Lean
Leap
Left
Less
Life
Mace
Mad
Mage
Maid
Mail
Main
Make
Male
Mall
Malt
Man
Many
Map
Mark
Mars
Mask
Mass
Mast
Mate
Maze
Nail
Name
Nano
Nap
Navy
Near
Neat
Neck
Need
Neon
Nerd
Nest
Net
News
Next
Nice
Nick
Nine
Node
Noon
Oak
Oar
Oasis
Oath
Oats
Obey
Odd
Ode
Off
Oil
Okay
Old
Omen
Once
One
Only
Onyx
Oops
Open
Opus
Pace
Pack
Pact
Pad
Page
Pain
Pair
Pale
Palm
Pan
Pant
Park
Part
Pass
Past
Path
Peak
Pear
Peel
Peer
Qubit
Quack
Quad
Quake
Qual
Quark
Quart
Quash
Quasi
Queen
Quest
Quick
Quiet
Quill
Quilt
Quirk
Quit
Quiz
Quota
Quote
Race
Rack
Rage
Raid
Rail
Rain
Ramp
Rank
Rant
Rare
Rash
Rate
Rave
Ray
Read
Real
Rear
Reef
Rest
Riot
Sack
Sad
Safe
Sage
Sail
Sale
Salt
Same
Sand
Sane
Save
Saw
Say
Scar
Seal
Seat
Seed
Seek
Self
Sell
Tack
Tact
Tail
Take
Tale
Talk
Tall
Tame
Tank
Tape
Task
Taxi
Team
Tear
Tech
Tell
Tent
Term
Test
Text
Uber
Ugly
Ulcer
Ultra
Umbra
Uncle
Under
Unfit
Union
Unit
Unity
Until
Upon
Upper
Upset
Urban
Urge
User
Usual
Utility
Vac
Vain
Vale
Vamp
Vane
Vang
Vast
Vault
Vein
Vend
Vent
Verb
Very
Vest
Veto
Vibe
Vice
View
Vine
Void
Wack
Wade
Wage
Wail
Wait
Wake
Walk
Wall
Wand
Want
Ward
Warm
Warn
Warp
Wash
Wasp
Wave
Wax
Way
Web
Xact
Xavi
Xcel
Xena
Xeno
Xenon
Xerxes
Xman
Xodus
Xoxo
Xpert
Xray
Xtra
Xyl
Xyle
Xylia
Xylo
Xyris
Xyz
Xon
Yacht
Yard
Yarn
Yawn
Yeah
Year
Yell
Yelp
Yeti
Yield
Yoga
Yolk
Yolo
Yore
York
Young
Your
Youth
Yoyo
Yuca
`.trim().split("\n").map(function (s) { return s.trim(); }).filter(Boolean);

// ━━━━━ (예전 data/named_players.js) ━━━━━
// ===== 레전드 선수 (244, 사용자 결정 2026-11-03 — 예전 네임드 7명 대신, js/league.js placeLegends) =====
// - 실제 LCK 레전드를 닉네임 1글자만 바꿔서. 후보·결정 기록: Claude outputs/레전드_후보.md
// - 실제로 활동한 해에만 등장: 시작 해가 활동 기간 안 → 첫해부터 실제 나이로 / 데뷔 전 → 데뷔 해 새 시즌에 '레전드 신인' / 은퇴 뒤 → 등장 안 함
// - 처음 소속 = 실제 데뷔 팀(team: 게임 구단 약자, 게임에 있으면). 없거나 꽉 찼으면 같은 포지션 레전드가 없는 1부 강팀
// - 은퇴: retire 해까지는 은퇴 안 함, 그다음 새 시즌에 은퇴. retire null(현역) = LEGEND_RULES.activeUntil까지 보호, 그 뒤 일반 규칙
// - 연도·팀은 기억 기준이라 1~2년 틀릴 수 있음 (후보 표의 ⚠️)
// [게임 이름, 포지션, 출생, 데뷔, 은퇴(null = 현역), 데뷔 팀(null = 게임에 없음), 등급 S/A]
const LEGENDS = [
  // 2012~15 데뷔
  ["Fakar",     "mid",     1996, 2013, null, "T1",    "S"], // Faker
  ["Bengo",     "jungle",  1993, 2013, 2017, "T1",    "S"], // Bengi
  ["Scorn",     "jungle",  1992, 2013, 2020, "KT",    "A"], // Score
  ["PawM",      "mid",     1995, 2013, 2019, "GEN.G", "S"], // PawN (Samsung)
  ["Deff",      "adc",     1996, 2013, 2022, null,    "S"], // Deft (CJ)
  ["MadLive",   "support", 1993, 2012, 2017, null,    "A"], // MadLife (CJ)
  ["Wolv",      "support", 1996, 2013, 2020, "T1",    "S"], // Wolf
  ["Smab",      "top",     1995, 2014, 2020, null,    "S"], // Smeb (IM)
  ["Bung",      "adc",     1995, 2013, 2021, "T1",    "S"], // Bang
  ["PreY",      "adc",     1993, 2012, 2019, null,    "A"], // PraY (NaJin)
  ["GorillO",   "support", 1994, 2012, 2021, null,    "A"], // GorillA (NaJin)
  ["Maka",      "support", 1994, 2013, 2018, "GEN.G", "S"], // Mata (Samsung)
  ["Doke",      "top",     1994, 2014, 2021, null,    "S"], // Duke (NaJin)
  ["Peanat",    "jungle",  1998, 2015, 2024, null,    "S"], // Peanut (NaJin)
  // 2016~19 데뷔
  ["Kiim",      "top",     1999, 2016, null, "KW",    "A"], // Kiin (Afreeca)
  ["Kham",      "top",     1995, 2016, 2019, null,    "A"], // Khan (Longzhu)
  ["Canyan",    "jungle",  2001, 2018, null, null,    "S"], // Canyon (Jin Air)
  ["ShowMakar", "mid",     2000, 2017, null, "Dplus", "S"], // ShowMaker (DAMWON)
  ["Chovi",     "mid",     2001, 2018, null, null,    "S"], // Chovy (Griffin)
  ["Rulor",     "adc",     1998, 2016, null, "GEN.G", "S"], // Ruler (Samsung)
  ["Lehands",   "support", 1998, 2018, null, null,    "A"], // Lehends (Griffin)
  ["Vipor",     "adc",     2000, 2018, null, null,    "S"], // Viper (Griffin)
  ["Taddy",     "adc",     1998, 2016, null, null,    "A"], // Teddy (Jin Air)
  ["Doron",     "top",     2000, 2019, null, null,    "A"], // Doran (Griffin)
  // 2020~ 데뷔
  ["Zeos",      "top",     2004, 2021, null, "T1",    "S"], // Zeus
  ["Omer",      "jungle",  2002, 2021, null, "T1",    "S"], // Oner
  ["Gumayasi",  "adc",     2002, 2020, null, "T1",    "S"], // Gumayusi
  ["Kerio",     "support", 2002, 2020, null, null,    "S"], // Keria (DRX)
  ["Peys",      "adc",     2005, 2023, null, "GEN.G", "A"], // Peyz
  ["Zeko",      "mid",     2002, 2021, null, "BNK",   "A"], // Zeka (Liiv SANDBOX)
].map(function (r) { return { name: r[0], pos: r[1], born: r[2], debut: r[3], retire: r[4], team: r[5], grade: r[6] }; });

// 예전 네임드 (v1.0~1.2): 예전 세이브를 불러오면 한 번 일반 선수(새 이름)로 바꿈 (js/league.js retireOldNamed)
const OLD_NAMED = ["Ego", "Chen", "Sking", "Hwansam", "Runa", "Jimul", "Kibai"];

const LEGEND_RULES = {
  // 종합 능력 = 1부 주전 평균 + 등급 보너스 + 데뷔 몇 년째 보정 (그 뒤는 다른 선수처럼 성장·노화)
  gradeBonus: { S: 3, A: 1 },   // 246: S+5·A+2 → S+3·A+1 (6년차 리그 상위 10명 중 레전드 5.7 → 4명)
  rookieRamp: [-4, -2, 0],     // 데뷔 해 −4, 2년째 −2, 3년째부터 0
  traits: 2,                   // 좋은 특성 (다른 선수가 가질 수 있는 것 중 무작위)
  maxPerTeam: 3,               // 한 팀에 동시에 활동하는 레전드 최대 (T1 데뷔 6명 쏠림 막기)
  realBoost: 6,                // 시즌 중 데뷔: 실제 데뷔 팀 주전이 이보다 덜 강하면 그 주전보다 살짝 높게 맞춰 실제 팀 주전으로 (더 강하면 주전이 되는 다른 팀)
  activeUntil: 2026,           // 현역(retire null) 레전드는 이 해까지 은퇴 안 함
  contractYears: [2, 3],       // 시즌 중 데뷔할 때 계약
};
