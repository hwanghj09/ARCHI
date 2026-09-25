// 11층: FLOOR11_LAYOUT(복도)과 FLOOR11_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 11층 TmaxSoft 사업본부·전략마케팅본부: 남색 카펫과 금색 테(sales 테마). 코어 왼쪽에 큰 영업본부 사무실 하나, 화장실
// 오른쪽에 전략회의실·마케팅 자료실을 붙여 둔다. 정전 직전 SYSTEM이 원격으로 내린 방화셔터(barriers)가 화장실 오른쪽 복도를
// 막고 있어, 영업본부 사무실의 층 비상 대응함에서 수동 개방 핸들(gives)을 챙겨 와야 셔터를 올리고 두 방에 갈 수 있다.
// 방 안 폭은 복도 전면 폭의 5.7배(632/316/316 → 3600/1800/1800). 단서는 낮 시연 실패와 밤 리허설 성공, 사업화 보류,
// 외부 파트너 데모 서버 계정의 새벽 비밀번호 변경(7층 외부 연결 복선). 정전 상태 기준으로 썼다.
const FLOOR11_LAYOUT = {
  header: '11F · 사업본부 · 전략마케팅본부', background: '#141824', theme: 'sales',
  rooms: [
    { name: '영업본부 사무실', x: 64, width: 632, style: 'sales', target: 'f11-sales',
      doorX: 244, doorWidth: 140, doorStyle: 'gilt' },
    { name: '전략회의실', x: 4322, width: 316, style: 'war-room', target: 'f11-strategy',
      doorX: 4470, doorWidth: 130, doorStyle: 'privacy' },
    { name: '마케팅 자료실', x: 4652, width: 316, style: 'materials', target: 'f11-marketing',
      doorX: 4668, doorWidth: 120, doorStyle: 'stockroom' },
  ],
  barriers: [
    { name: '방화셔터', x: 4292, y: 112, width: 24, style: 'shutter', requires: 'f11-crank', gives: 'f11-shutter-open',
      missingMessage: '방화셔터가 바닥까지 내려와 있다. 제어함 표시: "23:58 원격 폐쇄 · SYSTEM". 수동 개방 핸들을 꽂는 구멍이 비어 있다.',
      message: '수동 개방 핸들을 꽂고 돌리자 셔터가 천천히 말려 올라간다.',
      takenMessage: '셔터가 천장까지 말려 올라가 있다. 불이 난 흔적은 어디에도 없다.' },
  ],
  props: [
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 980, name: '영업 실적 보드',
      message: '이번 분기 ARCHI 계약 0건. 칸 옆에 누군가 적어 두었다: "시연은 무조건 밤에 잡자."' },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1330 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1560 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3230, name: '트로피 진열장',
      message: '영업 우수상 트로피가 줄지어 있다. 맨 끝 "ARCHI 첫 계약" 자리는 받침대만 있고 비어 있다.' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3480 },
  ],
};
const FLOOR11_ROOMS = interiorRooms(11, [
  { id: 'f11-sales', name: '영업본부 사무실', width: 3600, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 250 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 810, name: '책상',
      message: '고객 시연 보고서: "14:00 시연 · 질문 20개 중 1개 응답 · 고객사 탈락." 뒷장 메모: "전날 밤 리허설은 완벽했는데?"' },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1100 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1700, name: '영업 현황판',
      message: 'PoC 현황: 탈락 · 탈락 · 연기. 사유 칸은 전부 같다. "사내 성능 평가 3~5%."' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2080 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2370 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2660 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 2900 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 3150, name: '층 비상 대응함', gives: 'f11-crank',
      message: '손전등과 방연 마스크 옆에 "방화셔터 수동 개방 핸들"이 걸려 있다. 챙겼다.',
      takenMessage: '핸들을 걸어 두던 고리만 남아 있다.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3400 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3520 },
  ] },
  { id: 'f11-strategy', name: '전략회의실', width: 1800, interiorStyle: 'boardroom', props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 260 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 560, name: '전략 보드',
      message: 'ARCHI 사업화 로드맵: "1분기 공개 → 연기 → 연기." 맨 아래 이사회 메모: "성능 개선 없으면 다음 분기 프로젝트 축소."' },
    { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 980, name: '회의 테이블',
      message: '회의록 한 장: "홍보 영상은 새벽 3시 자동 녹화본이 제일 좋음. 녹화 요청자는 확인 불가. 일단 보류."' },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1620 },
  ] },
  { id: 'f11-marketing', name: '마케팅 자료실', width: 1800, windowless: true, props: [
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 420, name: '브로슈어 진열장',
      message: 'ARCHI 브로슈어 초판이 쌓여 있다. "사람처럼 배우는 AI." 출시일 칸은 매직으로 지워져 있다.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 560 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 650 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 900, name: '자료실 책상',
      message: '출력된 알림 메일: "해외 파트너 데모 서버 · archi-demo 계정 비밀번호가 변경되었습니다 · 03:07." 여백에 볼펜으로 "우리 팀 아무도 안 바꿈."' },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1180 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 1400 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1600 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1690 },
  ] },
]);
