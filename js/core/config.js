// 고정 설정값: 모든 층이 공유하는 건물 코어, 월드 크기와 바닥선, 이동 속도와 고정 시간 간격.
// 모든 층(B2~17)이 공유하는 건물 코어: 층 폭, 엘리베이터 3대, 비상계단, 화장실. 17층 배경 그림 기준이며
// 층마다 다른 것은 빈 구역 x=32..1790, 3100..3540, 4300..4968에 놓는 방과 소품뿐이다.
const BUILDING_CORE = {
  width: 5000, elevatorY: 220, floorSignX: 2694,
  elevators: [{ x: 1818, width: 218 }, { x: 2148, width: 214 }, { x: 2444, width: 216 }],
  stairs: { x: 2906, y: 232, width: 180 },
  restroom: { x: 3556, width: 726, style: 'restroom', doorX: 3612, doorY: 210, doorWidth: 145, doorStyle: 'metal' },
};
const corridorWidth = BUILDING_CORE.width;
const officeWidth = 2400;

const worldHeight = 720;
const floorY = 570;
const elevatorFloorTime = 200; // 엘리베이터가 한 층을 지나는 데 걸리는 시간(ms)

const speed = 200;
const runSpeed = 340;
const runFrames = 8;
const runFrameDistance = 192 / runFrames;
const walkFrames = 6;
const frameDistance = 184 / walkFrames;
const step = 1000 / 60;
// 정신력: 밝은 곳·플래시는 더 이상 올리지 않고(소모만 막는다), 어두운 곳에서만 천천히 줄어든다.
// 쫓기는 동안(경비 로봇 추적)은 훨씬 빠르게 줄어든다 — 보스전(bossFightActive)은 예외.
const sanityDarkDrainPerSecond = 1 / 3;
const sanityChaseDrainPerSecond = 10;
const sanityChaseFloor = 10; // 경비 로봇에게 쫓겨서는 이 값 아래로 줄지 않는다
const newGameSanity = 35; // 새 게임을 시작할 때의 정신력
const antianxietyRestore = 50; // 항불안제를 사용했을 때의 정신력 회복량
// 50/40/30/20/10% 미만 구간의 공포 연출 단계(1~5). sanityTierOf()가 이 경계로 계산한다.
const sanityTierThresholds = [50, 40, 30, 20, 10];
const sanitySlowSpeedFactor = .92; // 30% 미만 이동 속도
const sanityCriticalSpeedFactor = .8; // 10% 미만 이동 속도(위와 곱해진다)
const ambientSightingIntervalRange = [7000, 15000]; // 30% 미만에서 먼 환각이 보이는 간격(ms)
const ambientSightingLifeMs = 3400;
const blinkIntervalRangeByTier = { 2: [7000, 11000], 3: [6000, 10000], 4: [4500, 8000], 5: [2600, 5200] };
const zeroEventApproachThreshold = 3; // 0%가 되기 전, 이 수치 이하에서 한 번 예고 환각이 다가온다
const zeroEventApproachDurationMs = 3600;
const zeroEventChargeWaitMs = 15000; // 0% 도달 후 첫 돌진까지
const zeroEventRetryWaitMs = 5000; // 회피 이후 다음 돌진까지
const zeroEventRushDurationMs = Math.round(2400 / 1.7); // 돌진이 플레이어에게 닿기까지 걸리는 시간(기존 2400ms의 1.7배 속도). 회피하지 못하면 게임 오버
const wallEyeMaxCount = 6;
