// 여러 기능이 함께 읽고 바꾸는 게임 상태: 지금 장면(방·층), 조작을 막는 모드, 챙긴 물건.
let worldWidth = officeWidth;
let room = 'office'; // 'corridor' | 'office' (17층) | 'dynamic' (다른 층)
let dynamicFloorId = null;
let returnX = 644;
let currentSceneFloor = 17;

// 조사해서 챙긴 물건(소품의 gives). 방의 unlockedBy와 같은 물건이 있으면 그 방 문은 다음에 층을 그릴 때부터 열린다.
const collectedItems = new Set(['f17-badge']);
// 차례대로 조사해야 하는 소품 묶음(방의 sequences, 8층 재현 절차)의 진행 단계. 방을 나가면 처음부터다.
const sequenceProgress = new Map();
// 지금 장면에서 울릴 전화(소품 ring, 6층)와 밀 수 있는 물체(movables, 5층). performFloorChange가 장면마다 다시 채운다.
let activeCall = null;
let movingParts = [];
// 버튼(opens)으로 잠깐 열린 장애물(3층 배터리 자동문). 장면을 바꾸면 비운다.
const timedBarriers = [];

// 조작을 막는 모드: 장면 전환 중, 엘리베이터 안, 컴퓨터 사용 중, 키패드 입력 중.
let transitioning = false;
let mainMenuActive = true;
let gameStarted = false;
let gameVolume = .7;
let openingActive = true;
let blackoutSceneActive = false;
let storySceneActive = false; // 이야기 컷씬(story-scene.js)이 진행 중
// B1 방재 관제실 첫 입장 컷씬(js/scene/cctv-event.js).
let cctvSceneActive = false;
let solarRestoreActive = false; // 옥상에서 17층 조명 복구를 비추는 컷씬
let playerCaught = false;
let selectingFloor = false;
let usingComputer = false;
// 도어락 키패드(방 문·소품의 code): 열려 있는 동안 플레이어 조작을 멈춘다.
let usingKeypad = false;
// 휴대폰과 옥상 전력 분배 UI. 전력은 지상층 중 한 층만 켤 수 있고, 다른 층을 켜면 켜져 있던 층이 꺼진다.
let usingPhone = false;
let usingPowerPanel = false;
let usingInspection = false;
// 직접 조작하는 장치(manual-control.js): 레버·열쇠·전원선 같은 조작 창이 열려 있는 동안 플레이어 조작을 멈춘다.
let usingControl = false;
// 조작창·키패드·회선 퍼즐이 닫힌 시각(performance.now). 저절로 닫힌 직후 닫으려고 누른 Esc가 일시정지 메뉴를 열지 않게 한다(keyboard.js).
let modalClosedAt = -Infinity;
let phoneBattery = 100;
// 휴대폰을 충전하는 방·층·콘센트 위치. 맡긴 방의 같은 자리에서 찾아간다.
let phoneDock = null;
let sanity = 100;
let antianxietyCalm = 0; // 항불안제 효과로 정신력이 안 닳는 남은 ms(sanity.js)
let phoneLightOn = false;
// 태양광 전력을 받는 지상층. 켠 순서대로 담는다(앞이 가장 먼저 켠 층).
let solarPoweredFloors = [];
const solarFloorLimit = 1;
let solarEnabled = false;
let buildingBlackout = false;
// 정신력 공포 단계(0~5, sanityTierOf 참고). CCTV·컴퓨터·이동 속도 등 여러 기능이 함께 읽는다.
let fearTier = 0;
// B2 최종 추격(미구현)에서 켤 플래그. 켜져 있는 동안은 경비 로봇에게 쫓겨도 정신력이 10%/초로 줄지 않는다.
let bossFightActive = false;
// 정신력 0% 이벤트의 마지막 단계: 환각에게 잡아먹혀 게임 오버 연출 중이다.
let hallucinationCaught = false;
