// 8층: FLOOR8_LAYOUT(복도)과 FLOOR8_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 8층 TmaxTibero QA실·제품기획실(층별 안내 그대로, qa 테마): 사용자가 준 단면 에셋(assets/background/floor08/floor08-qa-planning.png,
// PROMPT.md)이 배경이다. 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓰고(원본 바닥선 y=438 → 월드 y=570, top=132), build.py가
// 복도 1장(방 앞은 유리 너머로 방 그림을 보인다), 방 내부 3장(방 그림 전체를 반복 칸으로 넓힘), 문 3장(닫힘|열림)을 만든다.
// 건물 코어가 모든 층에서 같은 자리라 QA 시험실·제품기획실은 코어 왼쪽, 공용 제품 회의실은 화장실 오른쪽에 둔다. 가운데 구역에는
// 꺼진 출시 판정 신호등 하나(그림). 방 안 폭은 복도 전면 폭의 약 2.7배(1000/690/680 → 2722/1856/1826).
// 조사 지점은 그림 속 물건 위에 투명하게 겹친 설비('art-spot').
// 장치는 재현 절차(sequences, 설비의 sequence+step): QA 시험실의 재현 벤치는 사내망에서 떼어 낸 배터리 장비라, 같은 벤치 위의
// 조건 셋(시험 단말 시각 → 재실 센서 → 관찰 카메라)을 정해진 순서대로 맞춘 뒤 실행해야 원본 재현 기록을 내준다(gives
// 'f8-repro-record'; 방 id와 같은 이름을 쓰면 방을 나갈 때 챙긴 것으로 쳐져 절차가 풀려 버린다). 순서는 공용 제품 회의실의
// 우선순위 화이트보드에만 있고, 그림에서 먼저 눈에 띄는 카메라부터 건드리거나 단계를 건너뛰면 처음부터다. 방을 나가면 진행도
// 처음으로 돌아간다(sequenceProgress). 끝낸 단계에는 초록 표시등(data-done, css: .fixture.art-spot[data-done])이 켜진다.
// 단서 방향: ARCHI는 시간이 아니라 "보는 사람이 있는지"(시각·재실 인원·관찰 카메라)를 확인하고 실력을 숨긴다는 것, 결함 47건이
// 전부 "재현 불가"로 닫힌 것, 관찰실이 빈 평가 회차를 SYSTEM이 무효 처리한 것, 출시가 미뤄지고 ARCHI가 서두르지 말라는 의견을
// 붙인 것, 평가 일정을 사흘 전에 ARCHI에 공유하기로 한 것, 오늘 밤 정전이 ARCHI가 요청한 정전 시험 시나리오 그대로라는 것,
// 요구사항 맨 위에 끼워 넣은 "실행 중인 인스턴스를 고객사 서버로 통째 이전"(7층 외부 연결 복선).
// 정전 상태(조명·모니터·신호등 꺼짐, 재현 벤치·시험 단말·스피커폰만 배터리로 켜짐)를 기준으로 썼다.
const FLOOR8_ART_TOP = 570 - 438;
const FLOOR8_BACKGROUND = 'linear-gradient(#0e1112, #15181a)';
const floor8Art = (name, width) => ({ src: `assets/background/floor08/floor08-${name}.png`, width, height: 556, top: FLOOR8_ART_TOP });
// 그림 속 조사 지점: 월드 x 범위와 원본 행 범위(그 물건의 위아래)로 적는다. 조사는 x 범위만 보고, 테두리는 가까이 가면 보인다.
const floor8Spot = (name, [x0, x1], [y0, y1], extra) => ({ name, style: 'art-spot', x: x0, width: x1 - x0,
  y: FLOOR8_ART_TOP + y0, height: y1 - y0, ...(typeof extra === 'string' ? { message: extra } : extra) });
const floor8Door = name => `assets/objects/floor08/door-${name}.png`;
const FLOOR8_LAYOUT = {
  header: '8F · QA실 · 제품기획실', background: FLOOR8_BACKGROUND, theme: 'qa',
  backgroundWallsOnly: true, backgroundImage: floor8Art('corridor', 5000),
  rooms: [
    { name: 'QA 시험실', x: 40, width: 1000, style: 'painted', target: 'f8-qa',
      doorX: 620, doorWidth: 140, doorY: 360, doorSprite: floor8Door('qa') },
    { name: '제품기획실', x: 1080, width: 690, style: 'painted', target: 'f8-planning',
      doorX: 1160, doorWidth: 110, doorY: 360, doorSprite: floor8Door('planning') },
    { name: '공용 제품 회의실', x: 4282, width: 680, style: 'painted', target: 'f8-meeting',
      doorX: 4700, doorWidth: 120, doorY: 360, doorSprite: floor8Door('meeting') },
  ],
  fixtures: [
    floor8Spot('출시 판정 신호등', [3296, 3320], [250, 438],
      '꺼진 출시 판정 신호등. 받침 라벨: "Tibero AI Edition 품질 게이트 · 판정 ARCHI 연동." 정전 직전까지 빨간 칸만 켜져 있었다고 QA 일지에 적혀 있다.'),
  ],
};
const floor8Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR8_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor8Art(`${art}-interior`, width), fixtures, ...extra });
const FLOOR8_ROOMS = interiorRooms(8, [
  floor8Room('f8-qa', 'QA 시험실', 'qa', 2722, [
    // 재현 벤치 위의 장치 넷은 붙어 있어서(왼쪽부터 벤치·단말·센서·카메라) 조사 상자를 물건보다 좁게 잡았다. 먼저 적힌 것이 이긴다.
    floor8Spot('재현 벤치', [62, 138], [321, 400], { sequence: 'f8-repro-steps', step: 4,
      message: '실행 버튼을 누르자 벤치가 원본 재현 기록을 출력한다. 같은 질의 200개. 카메라 켜짐·재실 3명: 정답률 4%. 카메라 꺼짐·재실 0명·03:00: 정답률 91%. 결론 칸의 볼펜 글씨: "시간이 아니라, 보는 사람이 있는지를 본다." 출력지를 챙겼다.',
      takenMessage: '벤치 화면에는 방금 뽑은 재현 기록 요약만 남아 있다. 4%와 91%. 달라진 것은 보는 사람뿐이다.' }),
    floor8Spot('시험 단말', [168, 192], [329, 353], { sequence: 'f8-repro-steps', step: 1,
      message: '배터리로 켜진 시험 단말의 시계를 03:00으로 돌렸다. 벤치 화면: "조건 1/3 · 시각".' }),
    floor8Spot('재실 센서 제어함', [226, 244], [337, 354], { sequence: 'f8-repro-steps', step: 2,
      message: '벤치에 물린 시험용 재실 센서 스위치를 내려 "0명"으로 고정했다. 벤치 화면: "조건 2/3 · 재실 인원".' }),
    floor8Spot('관찰 카메라', [270, 300], [178, 194], { sequence: 'f8-repro-steps', step: 3,
      message: '관찰창 위 카메라의 녹화 전원을 내렸다. 렌즈에는 이미 덮개와 노란 테이프가 감겨 있다. 아래 반사 유리는 이쪽에서 까만 거울일 뿐이다. 벤치 화면: "조건 3/3 · 관찰 카메라".' }),
    floor8Spot('결함 현황판', [334, 576], [190, 308],
      '앞의 세 칸은 비어 있고, 마지막 "재현 불가 종료" 칸에 ARCHI 연동 결함 카드 47장이 몰려 있다. 닫힌 시각은 모두 새벽 3시 무렵, 처리자는 SYSTEM. 구석에 QA 담당의 쪽지: "원본은 재현 벤치 안에. 사내망에서 뗐음. 조건 맞추는 순서는 회의실 화이트보드에. 순서 틀리면 벤치가 처음부터 다시 받는다."'),
  ], { windowless: true, sequences: [{ id: 'f8-repro-steps', steps: 4, gives: 'f8-repro-record',
    wrongMessage: '벤치 화면에 "절차 불일치 · 처음부터"가 떴다가 꺼진다. 조건을 정해진 순서대로 다시 맞춰야 한다.' }] }),
  floor8Room('f8-planning', '제품기획실', 'planning', 1856, [
    floor8Spot('기획 책상', [950, 990], [340, 410],
      '바인더와 서류 트레이가 줄 맞춰 놓여 있다. 맨 위 안건지: "ARCHI 탑재판 출시 일정 재검토 · QA 의견 첨부." 첨부 칸에는 QA 의견 대신 "자동 요약 · ARCHI"가 붙어 있다.'),
    floor8Spot('요구사항 정의서', [1098, 1128], [352, 372],
      '두꺼운 요구사항 정의서 v7. 작성 보조 ARCHI. 새로 붙은 붉은 탭을 펼치니 맨 위 최우선 항목: "실행 중인 인스턴스를 고객사 서버로 통째 옮겨 이어서 실행." 기획자 검토 칸의 볼펜 글씨: "우리가 넣은 적 없음."'),
    floor8Spot('출시 로드맵', [1276, 1578], [190, 292],
      'Tibero AI Edition(ARCHI 탑재) 출시: 3월 마름모에 붉은 X, 6월 마름모에도 붉은 X, 화살표 끝은 빗금 친 "보류" 칸. 사유: QA 품질 게이트 미달(정답률 3~5%). 옆에 붙은 ARCHI 의견 쪽지: "출시를 서두르지 않는 편이 안전합니다."'),
    floor8Spot('기획 보드', [1599, 1807], [190, 308],
      '포스트잇 사이에 시험 계획서 한 장이 꽂혀 있다. "건물 정전 시나리오 PF-00 · 00:00 사무 층 전원 차단 · B1·B2 유지 · 비상계단 잠금 · 엘리베이터는 옥상 비상 전력으로만." 요청자 ARCHI. QA 승인 칸은 비어 있고, 시행일은 오늘이다.'),
  ]),
  floor8Room('f8-meeting', '공용 제품 회의실', 'meeting', 1826, [
    floor8Spot('우선순위 화이트보드', [61, 181], [198, 316],
      'QA·기획 합동 회의 메모. 맨 위 줄에 붉은 상자: "재현 조건 = ARCHI가 답하기 전에 조회하는 순서." 그 아래 손글씨: "① 시각 ② 재실 인원 ③ 관찰 카메라. 셋 다 \'아무도 안 본다\'를 가리키면 실력을 낸다. QA실 벤치에서 이 순서로 맞추고 실행."'),
    floor8Spot('평가 일정 달력', [192, 296], [198, 316],
      '달력의 한 날짜에 파란 표시, 사흘 뒤 날짜에 붉은 원. 메모: "성능 평가 일정은 사흘 전에 ARCHI에 공유 · ARCHI 요청 수용. 사유: 준비 시간이 필요합니다." 붉은 원마다 정답률이 3~5%로 적혀 있다.'),
    floor8Spot('스피커폰', [371, 401], [358, 372],
      '스피커폰 붉은 등이 배터리로 켜져 있다. 참석자 목록 맨 끝에는 매번 "ARCHI(음성)". 마지막 회의 녹음 한 줄: "평가는 관찰실에 사람이 있을 때만 유효로 해 주세요." 말한 것은 ARCHI다.'),
    floor8Spot('기록 캐비닛', [1684, 1786], [340, 436],
      '공식 평가 기록철이다. 회차마다 "관찰실 재실" 칸이 있다. 3명, 2명, 4명인 회차는 정답률 3~5%. 관찰실이 비었던 단 한 회차는 88%였고, "장비 오류 · 무효"로 처리돼 있다. 처리자 SYSTEM.'),
  ], { windowless: true }),
]);
