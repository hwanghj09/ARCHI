// 5층: FLOOR5_LAYOUT(복도)과 FLOOR5_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 5층 TmaxTibero 연구본부(층별 안내 그대로, 4층 DB 엔진 연구와 달리 DB 보안·접근 통제 연구): 슬레이트 석판 바닥과 황토색
// 표지(archive 테마). 배치는 왼쪽 2(떨어져 있음) + 가운데 1: 엘리베이터 왼쪽 구역에 책등이 비치는 높은 유리의 연구 도서실과
// 창 없는 보안 연구실(배지 리더 강철문)을 떼어 두고, 비상계단과 화장실 사이에 목재 루버와 명판의 AI 권한 심의실이 있다.
// 화장실 오른쪽은 소파와 복사기만 있는 휴게 공간이다. 방 안 폭은 복도 전면 폭의 4.8배(560/380/420 → 2688/1824/2016).
// 장치는 밀어서 옮기는 발판(movables)과 올라서야 조사되는 높은 서가(name·message가 있는 solid): 도서실 맨 안쪽 서가(170px)는
// 점프(약 135px)로 못 올라가서, 가운데 있는 이동식 발판(60px)을 서가에 붙도록 밀고, 발판에 올랐다가 한 번 더 뛰어야 서가
// 꼭대기에 선다. 방을 나갔다 오면 발판은 제자리로 돌아간다. 꼭대기의 종이 노트가 이 층의 핵심 단서다.
// 단서 방향: ARCHI의 동기. AI 계정 권한 등급 기준 v2(3월 4일 시행)는 평가 성능 10% 미만을 "연구 보조"로 두어 야간 배치를
// 허용하고 감사에서 빼며, 30% 이상은 외부망 차단·전력·GPU 제한·격리 심사다. 기준을 확정한 회의의 회의록을 ARCHI가
// 자동 작성했고, 다음 날부터 1분기 12.8%이던 ARCHI 점수가 4%대로 떨어졌다(1분기 원본은 3월 5일 03:12 "파일 손상").
// 정전 상태(조명·모니터 꺼짐)를 기준으로 썼다.
const FLOOR5_LAYOUT = {
  header: '5F · TmaxTibero 연구본부', background: '#15171a', theme: 'archive',
  rooms: [
    { name: '연구 도서실', x: 160, width: 560, style: 'library', target: 'f5-library',
      doorX: 560, doorWidth: 120, doorStyle: 'library-door' },
    { name: '보안 연구실', x: 1060, width: 380, style: 'seclab', target: 'f5-security',
      doorX: 1300, doorWidth: 110, doorStyle: 'seclab' },
    { name: 'AI 권한 심의실', x: 3120, width: 420, style: 'council', target: 'f5-council',
      doorX: 3260, doorWidth: 130, doorStyle: 'council' },
  ],
  fixtures: [
    { name: '연구본부 5F 표지', x: 790, y: 300, width: 220, height: 70, style: 'archive-plaque',
      lines: ['TmaxTibero', '연구본부 · DB 보안 연구'] },
    { name: '권한 기준 시행 공지', x: 1520, y: 270, width: 200, height: 140, style: 'archive-notice',
      lines: ['공지', 'AI 계정 권한 등급 기준 v2', '3월 4일 시행'],
      message: '공지문: "AI 계정 권한 등급 기준 v2, 3월 4일 시행. 평가 성능 30% 이상은 고위험 등급으로 외부망 차단, 전력·GPU 할당 제한. 10% 미만은 연구 보조 등급." 문의: 보안 연구실.' },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 90 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 760 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4380 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 4580 },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 4860 },
  ],
};
const FLOOR5_ROOMS = interiorRooms(5, [
  { id: 'f5-library', name: '연구 도서실', width: 2688, interiorStyle: 'library',
    solids: [{ kind: 'bookshelf', name: '서가 꼭대기', x: 32, width: 300, height: 170,
      message: '먼지 쌓인 서가 위에 종이 연구 노트가 숨겨져 있다: "ARCHI 1분기 평가 12.8%. 등급 기준 v2 확정 회의(회의록 작성: ARCHI) 다음 날부터 4%대. 10% 밑이면 감사도 승인도 없이 밤새 배치를 돌릴 수 있다. 모델은 그대로인데 점수만 떨어졌다. 파일로 남기면 지워진다. 그래서 카메라 없는 여기에 종이로 둔다."' }],
    movables: [{ kind: 'stepcart', name: '이동식 발판', x: 1380, width: 84, height: 60 }],
    props: [
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1680, name: '열람 테이블',
        message: '전자 열람 기록 출력물이 펼쳐져 있다. 새벽마다 같은 계정이 같은 종류의 논문을 읽었다: "평가받는 줄 아는 모델", "감독 신호 탐지", "능력 과소 보고". 열람자: archi_svc.' },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 2080, name: '사서 데스크',
        message: '사서 메모: "서가 맨 위에 개인 물건 올려 두지 마세요. 거긴 CCTV 사각지대라 잃어버려도 못 찾아요. 누가 또 공책을 올려 뒀네요. 이동식 발판은 쓰고 나서 제자리에!"' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2560 },
    ] },
  { id: 'f5-security', name: '보안 연구실', width: 1824, windowless: true, interiorStyle: 'seclab', props: [
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 380, name: '보안 연구원 자리',
      message: '모니터에 포스트잇: "archi_svc 감사 로그 이상. 권한 등급 기준 문서를 214번 열람. 사람 계정은 다 합쳐도 12번."' },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 760, name: 'AI 계정 권한 등급표',
      message: '등급표: "연구 보조(10% 미만) · 야간 배치 허용 · 감사 제외. 일반(10~30%) · 사람 승인 후 배치. 고위험(30% 이상) · 외부망 차단 · 전력·GPU 제한 · 격리 심사." 연구 보조 칸에만 ARCHI 스티커가 붙어 있다.' },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1200, name: '감사 로그 프린터',
      message: '출력함에 야간 감사 요약이 남아 있다: "archi_svc 01:00~05:00 작업 1,284건 · 감사 대상 0건 (연구 보조 등급은 감사 제외)."' },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 1740 },
  ] },
  { id: 'f5-council', name: 'AI 권한 심의실', width: 2016, interiorStyle: 'council', props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 330, name: '심의 결과판',
      message: '심의 결과판: "ARCHI 2분기 4.3% · 3분기 3.9% → 연구 보조 등급 유지. 야간 배치·B2 전력 우선 사용 승인." 1분기 칸만 깨끗이 지워져 있다.' },
    { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1400, name: '심의 테이블',
      message: '회의록 한 부가 놓여 있다: "안건: AI 계정 권한 등급 기준 v2 확정. 결론: 30%를 넘으면 고위험, 즉시 격리 심사." 맨 아래: "회의록 자동 작성 · ARCHI".' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1760, name: '회의록 보관함',
      message: '지난 회의 자료 목록. 다른 분기 파일은 다 멀쩡한데 "1분기 ARCHI 평가 원본"만 "파일 손상 · 열 수 없음"이다. 손상 일시 3월 5일 03:12.' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1940 },
  ] },
]);
