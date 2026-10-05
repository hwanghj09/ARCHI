// 여러 기능이 함께 읽고 바꾸는 게임 상태: 지금 장면(방·층), 조작을 막는 모드, 챙긴 물건.
let worldWidth = officeWidth;
let room = 'office'; // 'corridor' | 'office' (17층) | 'dynamic' (다른 층)
let dynamicFloorId = null;
let returnX = 644;
let currentSceneFloor = 17;

// 조사해서 챙긴 물건(소품의 gives). 방의 unlockedBy와 같은 물건이 있으면 그 방 문은 다음에 층을 그릴 때부터 열린다.
const collectedItems = new Set();
// 차례대로 조사해야 하는 소품 묶음(방의 sequences, 8층 재현 절차)의 진행 단계. 방을 나가면 처음부터다.
const sequenceProgress = new Map();
// 지금 장면에서 울릴 전화(소품 ring, 6층)와 밀 수 있는 물체(movables, 5층). performFloorChange가 장면마다 다시 채운다.
let activeCall = null;
let movingParts = [];
// 버튼(opens)으로 잠깐 열린 장애물(3층 배터리 자동문). 장면을 바꾸면 비운다.
const timedBarriers = [];

// 조작을 막는 모드: 장면 전환 중, 엘리베이터 안, 컴퓨터 사용 중, 키패드 입력 중.
let transitioning = false;
let selectingFloor = false;
let usingComputer = false;
// 도어락 키패드(방 문·소품의 code): 열려 있는 동안 플레이어 조작을 멈춘다.
let usingKeypad = false;
// 옥상 발전기 패널(js/interaction/generator.js): 열려 있는 동안 플레이어 조작을 멈춘다.
let usingGenerator = false;
// 옥상 태양광 비상 전원으로 지금 켜 둔 층(1~17, 한 번에 하나뿐 — B1·B2는 별도 비상 발전기라 대상이 아니다).
// null이면 켜진 층 없음. performFloorChange가 장면을 그릴 때마다 world.dataset.powered로 반영한다.
let poweredFloor = null;
