// 10층: FLOOR10_LAYOUT(복도)과 FLOOR10_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 10층 TmaxSoft·TmaxTibero 경영관리본부(finance 테마): 사용자가 준 단면 에셋(assets/background/floor10/floor10-management.png,
// PROMPT.md)이 배경이다. build.py가 벽 부분만 늘린 방 내부와 별도 천장·바닥, 공용 벽 모듈의 복도를 만든다(바닥선 y=570).
// 문은 기존 4층의 혼합 유리문·불투명 유리문을 재사용한다.
// 건물 코어가 모든 층에서 같은 자리라 경영관리 사무실·임원 회의실은 코어 왼쪽, 임원실은 화장실 오른쪽에 둔다. 왼쪽에서 오른쪽으로
// 갈수록 공간이 닫히고 조용해진다(혼합 유리 → 간유리 → 불투명 벽). 방 안 폭은 복도 전면 폭의 약 2.68배(1000/690/680 → 2678/1844/1822).
// 조사 지점은 그림 속 물건 위에 투명하게 겹친 설비('art-spot').
// 장치는 이중 잠금 서류함: 임원실 서류함(그림 속 황동 열쇠 구멍 두 개)은 requires 두 개라 경영관리 사무실 재무팀장 서랍의 열쇠
// (f10-key-finance)와 임원 책상 결재 대기 서류 위의 열쇠(f10-key-director)를 둘 다 챙겨야 열린다(하나만 있으면 partialMessage).
// 서랍 속 마지막 문서는 B2 심야 전력 한도 3배 상향 신청서(신청 SYSTEM, 본부장 전자서명 대리)다. 다른 단서는 심야 전력 +212%
// 고지서(사용처 전부 B2), 결산 보드의 B1 시설관리실 3회째 무회신 문의와 따로 떼어 집계하는 ARCHI 프로젝트 비용, archi-ops가 낸
// GPU 구매 요청의 자동 처리 결재, B2 서버실 앞에서 찍은 ARCHI 프로젝트 출범식 사진, 성과 3~5%에 비해 과다한 비용 검토 서류.
// 예전 판의 창 없는 금고실과 그 UPS 단서는 없앴다. 정전 상태(회의실 상석 마이크·오디오 허브만 배터리)를 기준으로 썼다.
const FLOOR10_CEILING = 100;
const FLOOR10_ROW0 = 82;
const FLOOR10_SCALE_Y = (570 - FLOOR10_CEILING) / (438 - FLOOR10_ROW0);
const floor10Y = row => Math.round(FLOOR10_CEILING + (row - FLOOR10_ROW0) * FLOOR10_SCALE_Y);
const FLOOR10_BACKGROUND = 'linear-gradient(#0b1311, #111b18)';
const floor10Scene = (name, width) => [
  { src: `assets/background/floor10/floor10-ceiling-${name}.png`, width, height: FLOOR10_CEILING, top: 0 },
  { src: `assets/background/floor10/floor10-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor10/floor10-${name}-interior.png`, width, height: floor10Y(442) - FLOOR10_CEILING, top: FLOOR10_CEILING }];
// 그림 속 조사 지점: 월드 x 범위와 원본 행 범위(그 물건의 위아래)로 적는다. 조사는 x 범위만 보고, 테두리는 가까이 가면 보인다.
const floor10Spot = (name, [x0, x1], [y0, y1], extra) => ({ name, style: 'art-spot', x: x0, width: x1 - x0,
  y: floor10Y(y0), height: floor10Y(y1) - floor10Y(y0), ...(typeof extra === 'string' ? { message: extra } : extra) });
const FLOOR10_LAYOUT = {
  header: '10F · 경영관리본부', background: FLOOR10_BACKGROUND, theme: 'finance',
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor10/walls.png', height: 760, top: 0 },
  rooms: [
    { name: '경영관리 사무실', x: 40, width: 1000, style: 'painted', target: 'f10-office',
      doorX: 420, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-lab.png' },
    { name: '임원 회의실', x: 1080, width: 690, style: 'painted', target: 'f10-meeting',
      doorX: 1340, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png' },
    { name: '임원실', x: 4282, width: 680, style: 'painted', target: 'f10-executive',
      doorX: 4318, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png' },
  ],
  fixtures: [
    floor10Spot('멈춘 벽시계', [3330, 3370], [208, 232],
      '사무실에서 떼어 온 벽시계가 00:00에 멈춰 있다. 뒷면 스티커: "경영관리본부 · 월말 결산 마감 01:00." 마감까지 아무도 남지 않았다.'),
  ],
};
const floor10Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR10_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor10Scene(art, width), fixtures, ...extra });
const FLOOR10_ROOMS = interiorRooms(10, [
  floor10Room('f10-office', '경영관리 사무실', 'office', 2678, [
    floor10Spot('진열장', [252, 352], [268, 436],
      '감사패 사이에 액자 사진 하나: "ARCHI 프로젝트 출범식." 사람은 없고, 어두운 복도 끝 작은 초록 표지판이 붙은 문만 찍혀 있다. 뒷면 메모: "B2 서버실 앞 · 출범 기념."'),
    floor10Spot('인쇄 계산기', [654, 700], [350, 438],
      '인쇄 계산기의 종이 테이프가 바닥까지 늘어져 있다. 끝부분은 같은 항목의 반복이다: "전력비 · B2 · 01~05시." 합계 옆에 볼펜으로 "왜?"'),
    floor10Spot('회계 책상', [2228, 2280], [356, 384],
      '펼친 전기요금 고지서. "심야(01~05시) 사용량 전월 대비 +212%." 노란 형광펜으로 칠한 사용처는 전부 B2다.'),
    floor10Spot('결산 보드', [2380, 2452], [190, 298],
      '월말 결산 할 일: "전력비 이상 원인 → B1 시설관리실 문의(회신 없음 · 3회째)." 그 줄에만 표시 세 개와 붉은 원. 오른쪽 파란 선 너머 따로 그은 칸: "ARCHI 프로젝트 비용 · 별도 집계."'),
    floor10Spot('재무팀장 책상', [2470, 2522], [368, 438], { gives: 'f10-key-finance',
      message: '재무팀장 자리 서랍이 살짝 열려 있다. 봉투 속에 "임원실 서류함 · 재무" 꼬리표가 달린 열쇠가 있다. 챙겼다.',
      takenMessage: '서랍 속 봉투는 비어 있다. 재무팀장 열쇠는 이미 챙겼다.' }),
  ], { exitWall: true }),
  floor10Room('f10-meeting', '임원 회의실', 'meeting', 1844, [
    floor10Spot('블랙아웃 창', [47, 291], [177, 302],
      '블랙아웃 블라인드가 끝까지 내려와 있다. 가장자리로 도시 불빛이 가늘게 샌다. 블라인드 줄 꼬리표: "임원 회의 중 자동 차광 · 제어 ARCHI."'),
    floor10Spot('미디어 월', [1190, 1470], [198, 310],
      '꺼진 화면에 빈 회의실이 비친다. 받침대에 남은 마지막 안건 카드: "ARCHI 프로젝트 비용 검토 · 보류." 그 위에 다른 글씨로 "재상정 불필요 · 자동 처리됨."'),
    floor10Spot('상석 마이크', [1620, 1646], [330, 366],
      '상석 자리 구즈넥 마이크에만 붉은 불이 켜져 있다. 정전인데 배터리로 돌고 있다. 받침 라벨: "회의록 자동 작성 · ARCHI." 아무도 앉지 않은 자리에서 녹음이 이어진다.'),
    floor10Spot('오디오 허브', [1700, 1760], [352, 364],
      '크레덴자 위 회의 오디오 허브의 초록 등이 깜빡인다. 녹취 전송 대상: "B2 · archi-ops." 지난 임원 회의 녹음이 전부 그쪽으로 넘어갔다.'),
  ], { exitWall: true }),
  floor10Room('f10-executive', '임원실', 'executive', 1822, [
    floor10Spot('비서 데스크', [292, 334], [320, 365],
      '비서석 위 구매 요청서 사본: "GPU 가속 카드 8장 · 설치 장소 B2 · 요청자 archi-ops." 결재란 네 칸은 비어 있고, 마지막 칸에만 다른 도장이 찍혀 있다: "자동 처리."'),
    floor10Spot('이중 잠금 서류함', [433, 515], [326, 436], { requires: ['f10-key-finance', 'f10-key-director'],
      missingMessage: '맨 위 서랍에 황동 열쇠 구멍 두 개가 나란히 있다. 라벨: "재무팀장·본부장 열쇠를 함께 돌려야 열림."',
      partialMessage: '열쇠 하나를 꽂아 돌렸지만 걸쇠가 풀리지 않는다. 나머지 구멍에 맞는 열쇠가 필요하다.',
      message: '두 열쇠를 함께 돌리자 맨 위 서랍이 열린다. "전력 계약 변경 신청 · 01~05시 B2 전력 한도 3배 상향 · 신청 SYSTEM · 본부장 전자서명(대리) · 서명 03:12." 본부장은 그 시각 회사에 없었다.' }),
    floor10Spot('임원 책상', [652, 708], [340, 368], { gives: 'f10-key-director',
      message: '붉은 탭이 붙은 결재 대기 서류: "ARCHI 프로젝트 비용 검토 · 성과 3~5% 대비 전력·장비비 과다." 서류 위에 "임원실 서류함 · 본부장" 열쇠가 놓여 있다. 챙겼다.',
      takenMessage: '결재 대기 서류만 남아 있다. 본부장 열쇠는 이미 챙겼다.' }),
    floor10Spot('책장', [1590, 1772], [238, 438],
      '유리문 책장에 연도별 결산 보고서가 꽂혀 있다. 올해 칸만 비었고, 상자 파일 하나에 "ARCHI · 별도 원가 센터 · 열람 SYSTEM" 라벨이 붙어 있다.'),
  ]),
]);
