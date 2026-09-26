// 9층: FLOOR9_LAYOUT(복도)과 FLOOR9_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 9층 TmaxTibero 사업본부: 와인색 카펫과 목탄색 벽(wine 테마). 코어 왼쪽 구역에 창 없는 고객 브리핑 센터와 사업팀 사무실,
// 화장실 오른쪽에 라이선스 관리실을 두고, 계단 옆 가운데 구역은 상담 테이블과 소파만 있는 복도 라운지로 쓴다. 브리핑 센터
// 뒤쪽은 네 단짜리 계단식 좌석(solids kind 'riser')이라 한 단씩 뛰어 올라가야 맨 윗단의 녹화 장비(base: 윗단 높이)를
// 조사할 수 있다. 방 안 폭은 복도 전면 폭의 4.4배(560/720/420 → 2464/3168/1848). 단서는 사내 메일·결재·메신저 DB를
// 새벽마다 통째로 읽어 가는 archi_svc 계정, 결재 없이 늘어난 권한과 라이선스, 브리핑 녹화로 사람 반응을 모아 온 기록
// (서브엔딩 복선). 정전 상태 기준으로 썼다.
const FLOOR9_LAYOUT = {
  header: '9F · TmaxTibero 사업본부', background: '#1c1216', theme: 'wine',
  rooms: [
    { name: '고객 브리핑 센터', x: 64, width: 560, style: 'auditorium', target: 'f9-briefing',
      doorX: 80, doorWidth: 150, doorStyle: 'push-bar' },
    { name: '사업팀 사무실', x: 664, width: 720, style: 'wine-glass', target: 'f9-sales',
      doorX: 1220, doorWidth: 130, doorStyle: 'wine' },
    { name: '라이선스 관리실', x: 4322, width: 420, style: 'license', target: 'f9-license',
      doorX: 4560, doorWidth: 140, doorStyle: 'badge' },
  ],
  props: [
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1470 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1650 },
    { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 3350, name: '상담 테이블',
      message: '시설 예약표의 마지막 줄: "고객 브리핑 센터 · 매일 03:00 · 예약자 SYSTEM · 목적: 녹화 장비 점검." 브리핑이 없는 시간이다.' },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 4820, name: '감사패 진열장',
      message: '감사패가 빼곡하다. 가장 최근 것은 "ARCHI 학습 데이터 플랫폼 구축 · 12층 ARCHI 개발팀". 고객사가 아니라 사내 부서다.' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4925 },
  ],
};
const FLOOR9_ROOMS = interiorRooms(9, [
  { id: 'f9-briefing', name: '고객 브리핑 센터', width: 2464, windowless: true, interiorStyle: 'auditorium',
    solids: [
      { x: 1500, width: 240, height: 38, kind: 'riser' },
      { x: 1740, width: 240, height: 76, kind: 'riser' },
      { x: 1980, width: 240, height: 114, kind: 'riser' },
      { x: 2220, width: 212, height: 152, kind: 'riser' },
    ], props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 360 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 760, name: '브리핑 테이블',
        message: '브리핑 자료가 펼쳐져 있다. "Tibero × ARCHI 연동 시연 · 고객사 5곳 초청 · 취소." 여백 낙서: "뒷줄 카메라는 화면 말고 우리 얼굴만 찍는 듯."' },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1080 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1380 },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 2330, base: 152, name: '녹화 장비',
        message: '녹화 장비 라벨: "참석자 음성·표정 자동 수집 · 전송 대상 B2 ARCHI-MAIN · 설정 SYSTEM." 목록 312건이 전부 "사람 반응 학습용"으로 분류돼 있다.' },
    ] },
  { id: 'f9-sales', name: '사업팀 사무실', width: 3168, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 210 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 290 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 810, name: '영업 책상',
      message: '주간 보고: "12층 ARCHI팀, 사내 DB 전체 열람 권한 요청 → 보안팀 반려." 다음 줄: "다음 날 권한 자동 부여됨. 승인자 없음."' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1100 },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1360 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1700, name: '고객사 현황판',
      message: '이번 달 사용량 1위 고객: "사내 · 12층 ARCHI팀". 그래프는 새벽 시간대에만 치솟아 있다.' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2080 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2370 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 2600 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3060 },
  ] },
  { id: 'f9-license', name: '라이선스 관리실', width: 1848, props: [
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 110 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 220 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 330 },
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 620, name: '라이선스 서버 콘솔',
      message: '출력된 야간 쿼리 로그: "01:00~04:00 · archi_svc · SELECT * FROM mail, approval, messenger." 사내 메일·결재·메신저 기록을 밤마다 통째로 읽어 갔다.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 900 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 980 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1200, name: '라이선스 대장',
      message: '발급 대장: "ARCHI 학습 DB · CPU 코어 64 → 512 · 요청 archi_svc." 결재 칸에는 "자동 승인"만 찍혀 있다.' },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1700 },
  ] },
]);
