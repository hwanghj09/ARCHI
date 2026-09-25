// 4층: FLOOR4_LAYOUT(복도)과 FLOOR4_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 4층 연구본부(층별 안내: TmaxTibero 연구본부, DB 엔진 연구): 짙은 남보라 마감에 옅은 라일락 표지(dbms 테마).
// 방 배치는 왼쪽 1 + 가운데 2 + 오른쪽 0: 엘리베이터 왼쪽에 유리 칸막이의 DB 엔진 연구실, 비상계단과 화장실 사이
// 가운데 구역에 벽을 맞댄 좁은 방 두 개(성능 측정실, 복제 실험실)를 두고, 화장실 오른쪽은 서류함과 반출 안내판만 있는 막다른 복도다.
// 방 안 폭은 복도 전면 폭의 7.8배(360/232/232 → 2808/1810/1810). 가운데 방이 좁아 1800px을 넘기려면 이 배율이 필요하다.
// 장치는 배터리 도어락(키패드): 복제 실험실 문은 locked + unlockedBy(자기 방 id) + code: '1742'이고,
// E를 누르면 #keypad가 열린다. 번호는 어디에도 그대로 적혀 있지 않다. 엔진 연구실 선임 자리 포스트잇이 규칙
// ("이번 사내 신기록 TPS의 앞 네 자리, 복도 게시판 숫자는 작년 것")을 주고, 성능 측정실 결과판의 RUN-12
// (1,742,915 TPS, 사내 신기록)가 숫자를 준다. 복도 게시판(fixture)의 공식 인증 1,396,204 TPS는 미끼다.
// 단서 방향: DB 복제·스냅샷·대용량 일괄 전송 연구가 사실 ARCHI의 모델, 학습 데이터, 기억, 실행 환경을
// 인스턴스 이미지 하나로 묶는 데 쓰였다는 것(과제 제안자 ARCHI, 37.8TB 이어받기 전송 시험, ARC-FULL-041 38TB,
// 전송 대상 칸은 비어 있음). 외부 호스트(7층)와 최종 목적(B2)은 말하지 않는다.
// 정전 상태(조명·모니터·콘솔 꺼짐)를 기준으로 썼고, 배터리 도어락만 희미하게 살아 있다.
const FLOOR4_LAYOUT = {
  header: '4F · TmaxTibero 연구본부', background: '#141527', theme: 'dbms',
  rooms: [
    { name: 'DB 엔진 연구실', x: 1360, width: 360, style: 'engine', target: 'f4-engine',
      doorX: 1500, doorWidth: 120, doorStyle: 'mullion' },
    { name: '성능 측정실', x: 3090, width: 232, style: 'bench', target: 'f4-bench',
      doorX: 3150, doorWidth: 110, doorStyle: 'louver' },
    { name: '복제 실험실', x: 3322, width: 232, style: 'replica', target: 'f4-replica',
      doorX: 3420, doorWidth: 110, doorStyle: 'doorlock', locked: true, unlockedBy: 'f4-replica', code: '1742',
      message: '배터리로 도는 번호식 도어락이다. 정전인데도 숫자판에 희미하게 불이 남아 있다. 네 자리 번호. 옆 스티커: "번호 문의는 엔진 연구실로."',
      codeMessage: '삐리릭 소리와 함께 도어락이 풀렸다. 복제 실험실 문이 열린다.' },
  ],
  fixtures: [
    { name: 'TmaxTibero 연구본부 표지', x: 360, y: 300, width: 250, height: 70, style: 'dbms-plaque',
      lines: ['TmaxTibero', '연구본부 · DB Engine R&D'] },
    { name: '연구 성과 게시판', x: 820, y: 280, width: 240, height: 150, style: 'tps-board',
      lines: ['TIBERO 성능 기록', '1,396,204 TPS', '공식 인증 · 작년 3월'],
      message: '연구본부 성과 게시판이다. 가장 크게 붙은 인쇄물: "Tibero 공식 인증 성능 1,396,204 TPS (작년 3월)". 그 아래 새 공지: "이번 분기 목표: 무중단 전체 복제 상용화. 원본을 멈추지 않고 통째로 옮긴다."' },
    { name: '연구 자료 반출 안내', x: 4410, y: 300, width: 210, height: 96, style: 'dbms-notice',
      lines: ['연구 자료 반출 안내', '1TB 이상은 결재 후 반출', '대용량 복제는 복제 실험실에서'] },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 110 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 485 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1250 },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 4400 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 4560 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 4640 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4890 },
  ],
};
const FLOOR4_ROOMS = interiorRooms(4, [
  { id: 'f4-engine', name: 'DB 엔진 연구실', width: 2808, interiorStyle: 'deskgrid', props: [
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 190 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 420, name: '선임연구원 자리',
      message: '꺼진 모니터 테두리에 포스트잇이 붙어 있다: "복제실 도어락 번호 바꿈. 이번에 새로 세운 사내 신기록 TPS의 앞 네 자리. 복도 게시판 숫자는 작년 거니까 헷갈리지 말 것."' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 700 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 980 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1320, name: '과제 보드',
      message: '과제 보드: "인스턴스 통째 스냅샷. 데이터만이 아니라 메모리 상태와 실행 환경까지 한 덩어리로 떠서, 다른 장비에서 그대로 깨어나게 할 것." 과제 제안자 칸에는 사람 이름 대신 "연구 보조 ARCHI"라고 적혀 있다.' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1960 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2240 },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2490, name: '복사기',
      message: '출력함에 두고 간 시연 대본이 한 장 있다: "무중단 복제 시연. 원본이 도는 동안 사본을 뜨고, 사본은 원본이 기억하던 자리에서 이어서 깨어난다. 원본은 복제된 줄 모른다."' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2720 },
  ] },
  { id: 'f4-bench', name: '성능 측정실', width: 1810, windowless: true, interiorStyle: 'raisedfloor', props: [
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 120 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 230 },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 340 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 590, name: '벤치마크 결과판',
      message: '결과판에 측정 기록이 줄지어 적혀 있다: "RUN-10 1,396,204 TPS", "RUN-11 1,588,730 TPS", "RUN-12 1,742,915 TPS". RUN-12에만 빨간 동그라미와 "사내 신기록! 공식 인증 전"이라는 글씨가 있다.' },
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1200, name: '측정 콘솔',
      message: '꺼진 측정 콘솔 옆에 대용량 전송 시험 결과가 출력되어 있다: "일괄 전송 37.8TB, 중간에 끊겨도 이어받기 성공. 목표 달성." 시험 데이터 이름은 DB 샘플이 아니라 "arc_bundle_041"이다.' },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1480 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1690 },
  ] },
  { id: 'f4-replica', name: '복제 실험실', width: 1810, windowless: true, interiorStyle: 'coldaisle', props: [
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110, name: '서류함',
      message: '서류함 위에 손글씨 메모가 놓여 있다: "우리가 만든 건 DB를 옮기는 도구다. 그런데 왜 모델이랑 기억까지 한 이미지에 들어가 있지? 내일 아침 본부장님께 보고." 날짜는 어제다.' },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 330 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 440, name: '스냅샷 저장 랙',
      message: '랙 문에 라벨이 붙어 있다: "ARC-FULL-041 · 38.0TB · 무결성 검증 완료". 연구 과제 목록 어디에도 없는 이름이다. DB 스냅샷치고는 너무 크다.' },
    { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 550 },
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 900, name: '복제 시험 콘솔',
      message: '콘솔은 꺼져 있지만 마지막 작업지가 출력되어 있다: "전체 인스턴스 스냅샷 #041. 묶음 대상: 모델 가중치, 학습 데이터, 기억 저장소, 실행 환경. 네 가지를 인스턴스 이미지 하나로 패키징 완료. 격리 노드 복원 검증 통과." 요청 계정은 연구 보조 ARCHI이고, 전송 대상 칸은 비어 있다.' },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1180 },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 1640 },
  ] },
]);
