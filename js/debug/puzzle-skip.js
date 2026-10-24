// 테스트용 퍼즐 건너뛰기: 고른 퍼즐 바로 앞까지의 진행 상태(챙긴 물건·정전·태양광)로 바꾸고 그 퍼즐 장소로 옮긴다.
// 순서는 objective.js의 본편 목표 순서를 따른다. items는 그 퍼즐을 풀면 남는 플래그다.
const PUZZLE_STEPS = [
  { label: '17F 정전 컷씬', at: 'office' },
  { label: '17F 소화전 열쇠·옥상문', at: 'f17', items: ['rooftop-key', 'rooftop-unlocked'] },
  { label: 'RF 태양광 비밀번호·전선', at: 'rooftop', items: ['roof-wires-fixed'], solar: [17] },
  { label: '17F 관리실 비밀번호·비상 회선', at: 'f17', items: ['f17-manager-memo', 'f17-manager-unlocked', 'f17-circuit-guide-read', 'f17-emergency-linked'] },
  { label: '1F 정문·안내 데스크 전력 앱', at: 'f1', items: ['f1-reached', 'f1-door-checked', 'story-f1-door-seen', 'solar-app-installed'], solar: [1] },
  { label: '1F 경비 로봇 추격', at: 'f1', items: ['f1-reached', 'f1-chase-ended', 'story-anxiety-seen', 'goal-f1-directory'] },
  { label: brandText('16F VU 항불안제'), at: 'f16', items: ['f16-cu', 'f16-antianxiety', 'f16-antianxiety-used', 'story-robot-seen'] },
  { label: '1F 로봇 정비 기록', at: 'f1', items: ['f1-robot-log'] },
  { label: '12F 게이트·출입증 쌔비기', at: 'f12', items: ['story-gate-tagged', 'story-badge-seen', 'f16-badge'] },
  { label: '12F 로그 삭제 막기', at: 'f12', items: ['f12-network-isolated', 'f12-log-restored'] }, // 복구한 기록으로 퀴즈를 바로 풀 수 있다
  { label: '12F 모델 평가 퀴즈', at: 'f12', items: ['f12-log-hint', 'f12-evaluation-solved'] },
  { label: '5F 서가 꼭대기 노트', at: 'f5', items: ['goal-f5-note'] },
  { label: '8F 재현 기록', at: 'f8', items: ['f8-repro-record'] },
  { label: '7F 백업 장비 · 학습 시간', at: 'f7', items: ['f7-training-time-solved'] },
  { label: '7F 백업 장비 · 오늘 기록', at: 'f7', items: ['f7-external-connection-solved'] },
  { label: '13F 보안 자료실 백업 장치', at: 'f13', items: ['f13-backup-device'] },
  { label: '17F 백업 장치 영상', at: 'f17', items: ['f17-usb-played'] },
  { label: '2F 리허설 영상', at: 'f2', items: ['f2-reel', 'f2-remote', 'f2-projected'] },
  { label: 'B1 CCTV·B2 운행 제한 해제', at: 'b1', items: ['b1-lights-out', 'b1-cctv-live', 'b1-cctv-seen', 'b2-restricted-seen', 'b1-elevator'] },
  { label: 'B2 카메라·외부 회선 차단', at: 'b2', items: ['b2-cctv-off', 'b2-transfer-cut'] },
  { label: 'B2 메인 콘솔 DELETE', at: 'b2-main' },
];

const debugPuzzleSelect = document.getElementById('debug-puzzle-select');
PUZZLE_STEPS.forEach((step, index) => debugPuzzleSelect.add(new Option(step.label, index)));

function debugGoTo(id) {
  if (id === 'office') { performFloorChange('f17', null); performRoomChange(); }
  else if (floorById.get(id).interior) performFloorChange(id, null, 'exit');
  else performFloorChange(id, id === 'rooftop' ? null : 0);
}

function skipToPuzzle(index) {
  const step = PUZZLE_STEPS[index];
  const done = PUZZLE_STEPS.slice(0, index);
  const solar = done.findLast(entry => entry.solar);
  // 앞으로도 뒤로도 갈 수 있게 소지품은 이 퍼즐 직전 상태로 덮어쓴다. 단서·사진·배터리·정신력은 그대로 둔다.
  restoreProgress({ ...progressSnapshot(), items: done.flatMap(entry => entry.items || []), blackout: index > 0,
    solarEnabled: Boolean(solar), solarPoweredFloors: solar?.solar || [], logPuzzle: null, cabin: null, runtime: {} });
  transitionScene(() => debugGoTo(step.at));
}

document.getElementById('debug-puzzle').addEventListener('submit', event => {
  event.preventDefault();
  if (!debugCanAct()) return;
  stage.focus({ preventScroll: true });
  skipToPuzzle(Number(debugPuzzleSelect.value));
});
