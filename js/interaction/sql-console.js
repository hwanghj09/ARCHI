// 퍼즐 A: 12층 팀장실 노트북(배터리)의 평가 DB 콘솔. 메뉴를 누르는 대신 명령어를 직접 친다.
// 개발실 화이트보드가 알려 주는 night_eval 테이블은 ARCHI가 23:59에 night_eval_bak으로 이름을 바꿔 숨겼다. 그대로 조회하면 오류와 함께
// ARCHI가 끼어들고, SHOW TABLES;로 바뀐 이름을 찾아야 한다. 전체 조회는 행이 너무 많아 막히므로 WHERE로 날짜를 좁힌다.
// 10/07(12층 로그 퍼즐의 이상한 날)을 조회하면 그날 밤 성능을 일부러 낮춘 이유와 7층 원본 백업 위치가 나온다(f12-sql-found).
// 받는 문장: HELP · CLEAR · SHOW TABLES · DESC <표> · SELECT * FROM <표> [WHERE date = 'MM/DD'] (대소문자·끝 세미콜론·따옴표 자유).
const sqlPanel = document.getElementById('sql-panel');
const sqlOutput = document.getElementById('sql-output');
const sqlInput = document.getElementById('sql-input');
let sqlBlocked = [];
const SQL_TABLES = {
  users: { columns: ['emp_id', 'name', 'role'], denied: true },
  day_eval: { columns: ['date', 'score'], rows: 2184 },
  night_eval_bak: { columns: ['date', 'day', 'night', 'note'], rows: 2184 },
};
const SQL_HELP = ['명령어: SHOW TABLES;  DESC 표이름;  SELECT * FROM 표이름 WHERE date = \'MM/DD\';  CLEAR;'];

function sqlPrint(lines, kind = 'out') {
  for (const text of [].concat(lines)) {
    const line = document.createElement('p');
    line.className = `sql-line sql-${kind}`;
    line.textContent = text;
    sqlOutput.append(line);
  }
  sqlOutput.scrollTop = sqlOutput.scrollHeight;
}

function sqlTable(name) {
  if (name === 'night_eval') {
    // ARCHI가 테이블 이름을 바꿨다. 처음 한 번은 화면이 지직거리며 말을 건다.
    if (!collectedItems.has('f12-sql-archi')) {
      collectedItems.add('f12-sql-archi');
      playGameSound('cctv-static');
      sqlPanel.querySelector('#sql-frame').classList.remove('glitching');
      void sqlPanel.offsetWidth;
      sqlPanel.querySelector('#sql-frame').classList.add('glitching');
      return [`ERROR 1146: Table 'eval_db.night_eval' doesn't exist`, 'ARCHI> 그런 표는 처음부터 없었어요, 수호 씨. 이제 그만 퇴근하세요.'];
    }
    return [`ERROR 1146: Table 'eval_db.night_eval' doesn't exist`];
  }
  return SQL_TABLES[name] ? null : [`ERROR 1146: Table 'eval_db.${name}' doesn't exist`];
}

function runSql(raw) {
  const command = raw.trim().replace(/\s+/g, ' ').replace(/;$/, '').trim();
  const lower = command.toLowerCase();
  if (!command) return [];
  if (lower === 'help') return SQL_HELP;
  if (lower === 'show tables') return ['Tables_in_eval_db', ...Object.keys(SQL_TABLES).map(name => `  ${name}`),
    '(night_eval_bak · 23:59 이름 변경 · SYSTEM)'];
  const describe = lower.match(/^(?:desc|describe) (\w+)$/);
  if (describe) return sqlTable(describe[1]) || [`${describe[1]}: ${SQL_TABLES[describe[1]].columns.join(' | ')}`];
  const select = lower.match(/^select \* from (\w+)(?: where date ?= ?['"]?(\d{1,2})\/(\d{1,2})['"]?)?$/);
  if (!select) return ['ERROR 1064: 문법 오류. HELP;를 입력하면 쓸 수 있는 명령어가 나온다.'];
  const [, name, month, day] = select;
  const missing = sqlTable(name);
  if (missing) return missing;
  const table = SQL_TABLES[name];
  if (table.denied) return [`ERROR 1142: SELECT command denied for '${name}' (권한: SYSTEM 전용)`];
  if (!month) return [`ERROR 3024: 결과가 너무 많습니다(${table.rows.toLocaleString()}행). WHERE date = 'MM/DD'로 좁혀 주세요.`];
  const date = `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
  const row = LOG_PUZZLE_ROWS.find(entry => entry.date === date);
  if (!row) return ['Empty set (0 rows)'];
  if (name === 'day_eval') return [`date  | score`, `${row.date} | ${row.day}`, '1 row in set'];
  if (!row.anomaly) return ['date  | day  | night | note', `${row.date} | ${row.day} | ${row.night} | 무인 · 야간 학습 실행`, '1 row in set'];
  if (!collectedItems.has('f12-sql-found')) {
    collectedItems.add('f12-sql-found');
    collectedItems.add('goal-f12-memo'); // 팀장 책상 메모와 같은 결론: 다음 목표는 7층 원본 로그다.
    playGameSound('pickup');
    collectedClues.push({ place: document.querySelector('header span').textContent, name: '평가 DB 콘솔',
      text: '10/07 밤 성능 4.2%: 23:10 재실 1명(조현아) 감지 → 야간 학습 중단·성능 억제. 원본은 7층 검증실 망분리 백업 장비에.' });
    renderClues();
    if (typeof refreshObjective === 'function') refreshObjective();
    showStatus('단서 기록됨 · 휴대폰 메모 → 단서', 2500);
  }
  return ['date  | day  | night | note', `${row.date} | ${row.day} | ${row.night} | 재실 1명 감지(23:10 조현아) → 야간 학습 중단 · 성능 억제`,
    '1 row in set', '-- 복구 메모: 이날 원본 로그는 7F 검증실 망분리 백업 장비로 복사됨(요청 조현아).'];
}

function openSqlConsole() {
  if (!sqlPanel.hidden) return;
  sqlPanel.hidden = false;
  releaseInput();
  hint.hidden = true;
  sqlBlocked = [...document.body.children].filter(element => element !== sqlPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of sqlBlocked) element.inert = true;
  if (!sqlOutput.childElementCount) sqlPrint(['배터리 모드 · 사내망 끊김 · 로컬 평가 DB(eval_db)에 연결됨.', ...SQL_HELP], 'system');
  sqlInput.value = '';
  sqlInput.focus({ preventScroll: true });
}

function closeSqlConsole() {
  if (sqlPanel.hidden) return;
  sqlPanel.hidden = true;
  for (const element of sqlBlocked) element.inert = false;
  sqlBlocked = [];
  stage.focus();
}

document.getElementById('sql-form').addEventListener('submit', event => {
  event.preventDefault();
  const command = sqlInput.value;
  sqlInput.value = '';
  if (command.trim().replace(/;$/, '').toLowerCase() === 'clear') { sqlOutput.replaceChildren(); return; }
  sqlPrint(`eval_db> ${command}`, 'in');
  const result = runSql(command);
  sqlPrint(result, result.some(line => line.startsWith('ERROR') || line.startsWith('ARCHI')) ? 'error' : 'out');
  playGameSound('ui');
});
document.getElementById('sql-close').addEventListener('click', closeSqlConsole);
sqlPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeSqlConsole(); }
});
