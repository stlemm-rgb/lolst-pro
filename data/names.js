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
// ===== 네임드 선수: 새 게임마다 항상 등장하는 선수 (js/league.js placeNamedPlayers) =====
// - 1부 강팀의 주전으로 들어가요 (내 팀 제외, 되도록 서로 다른 팀. 팀이 모자라면 같은 포지션 네임드가 없는 팀에)
// - 나이: 내 선수 나이 ± ageGap 사이 (17~27세 안으로)
// - 실력(종합 능력): 나이에 따라 score 범위에서 정해요. 어릴수록 낮게 시작해서 성장해요
// - 좋은 특성 traits개 (다른 선수가 가질 수 있는 특성 중 무작위). 나쁜 특성은 없음
// - 다른 선수처럼 성장하고 늙고 은퇴해요
// - 예전 세이브를 불러와도 한 번은 들어와요 (목록에 새로 넣은 선수도 다음에 불러올 때 들어와요)
const NAMED_PLAYERS = [
  { name: "Ego",     pos: "top" },
  { name: "Chen",    pos: "jungle" },
  { name: "Sking",   pos: "mid" },
  { name: "Hwansam", pos: "adc" },
  { name: "Runa",    pos: "support" },
  { name: "Jimul",   pos: "adc" },      // v1.1 추가
  { name: "Kibai",   pos: "top" },      // v1.1 추가
];

const NAMED_RULES = {
  ageGap: [1, 3],              // 내 선수와 1~3살 차이 (위·아래 무작위)
  score: [                     // [이 나이까지, [최소, 최대]]
    [18, [66, 70]],
    [21, [70, 74]],
    [99, [73, 78]],
  ],
  traits: 2,
  teamPool: 6,                 // 1부 전력 상위 몇 팀 중에서 고를지
};
