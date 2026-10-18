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
const crouchSpeed = 90;
const runFrames = 16;
const runFrameDistance = 288 / runFrames; // 이동 속도는 유지하고, 동작 한 바퀴는 약 0.85초로 재생한다.
const walkFrames = 8;
const frameDistance = 184 / walkFrames;
const step = 1000 / 60;
// 정신력: 밝은 곳·플래시는 더 이상 올리지 않고(소모만 막는다), 어두운 곳에서만 천천히 줄어든다.
// 쫓기는 동안(경비 로봇 추적)은 훨씬 빠르게 줄어든다 — 보스전(bossFightActive)은 예외.
const sanityDarkDrainPerSecond = 1 / 3;
const sanityChaseDrainPerSecond = 10;
const sanityAnxietyDrainPerSecond = .1; // 10%에서도 16층으로 이동해 약을 찾을 시간(100초)을 준다.
const sanityChaseFloor = 10; // 경비 로봇에게 쫓겨서는 이 값 아래로 줄지 않는다
const newGameSanity = 85; // 새 게임을 시작할 때의 정신력
const antianxietyRestore = 50; // 항불안제를 사용했을 때의 정신력 회복량
// 50/40/30/20/10% 미만 구간의 공포 연출 단계(1~5). sanityTierOf()가 이 경계로 계산한다.
const sanityTierThresholds = [50, 40, 30, 20, 10];
const sanitySlowSpeedFactor = .92; // 30% 미만 이동 속도
const sanityCriticalSpeedFactor = .8; // 10% 미만 이동 속도(위와 곱해진다)
const ambientSightingIntervalRange = [45000, 90000]; // 같은 장소에서는 한 번만 보인다.
const ambientSightingLifeMs = 2800;
const zeroEventChargeWaitMs = 45000;
const zeroEventRetryWaitMs = 60000;
const zeroEventWarningMs = 1800; // 발소리와 정지한 형상을 먼저 보여 준 뒤 다가온다.
const zeroEventRushDurationMs = 3200;
const zeroEventGhostFadeInMs = 350;
const zeroEventLightHoldMs = 350; // 잠깐 스친 빛이 아니라 방향을 확인해 비춘 빛으로 물러난다.

// 20% 미만(4단계)은 3단계보다 깜빡이는 간격이 1/3 짧고, 10% 미만(5단계)은 거기서 다시 1/3 짧다.
const blinkIntervalRangeByTier = { 2: [7000, 11000], 3: [6000, 10000], 4: [4000, 6667], 5: [2667, 4444] };
const wallEyeMaxCount = 6;
