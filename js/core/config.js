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
const elevatorFloorTime = 1200;

const speed = 200;
const runSpeed = 340;
const runFrames = 8;
const runFrameDistance = 192 / runFrames;
const walkFrames = 6;
const frameDistance = 184 / walkFrames;
const step = 1000 / 60;
const sanityDrainPerSecond = 1;
const sanityRecoveryPerSecond = 2;
