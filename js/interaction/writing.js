// 글이 적힌 물건을 조사하면 적힌 내용(writing)을 그 물건 모습 그대로 그린다.
// surface(무엇에 적혀 있나)는 소품 그림(file)으로 정해지거나(화이트보드·게시판·칠판) 소품에 직접 적는다.
//   손글씨 표면: whiteboard 화이트보드 · notebook 노트·일지·방명록 · corkboard 코르크 게시판 · chalkboard 칠판 · memo 포스트잇·쪽지
//   인쇄 표면: document 서류·출력물·안내문 · screen 모니터·제어 화면 · receipt 영수증 · label 라벨·스티커·명판·꼬리표 · card 사원증(image)
// look은 같은 표면의 생김새다.
//   document: sheet(기본, 출력물) · notice(붙여 둔 공지문) · sign(벽 안내판) · poster(포스터) · certificate(증서) · plaque(감사패·명패)
//   screen: monitor(기본) · terminal(초록 콘솔) · lcd(장비의 작은 액정)
//   memo: sticky(기본, 노랑) · sticky-pink · sticky-blue · sticky-green · slip(뜯어 낸 쪽지)
//   label: tape(기본, 라벨 테이프) · sticker(인쇄 스티커) · warning(경고 스티커) · plate(금속 명판) · tag(종이 꼬리표)
// image는 글까지 그려진 완성 그림 경로다. 모든 표면에서 지원하며 writing보다 우선한다(기존 card는 함께 표시).
// 글 사이에 그림을 넣으려면 writing에 { as: 'image', src: 'assets/...png', alt: '그림 설명' }를 넣는다.
// 화면 낭독기는 조사 대상의 message를 읽으므로 그림의 단서도 message에 적는다.
// writing은 항목 목록이다. 문자열은 한 줄이고(손글씨 표면은 손글씨, 인쇄 표면은 인쇄체), 객체는 { as, text, ... }다.
// text의 \n은 줄바꿈이고 연속 공백도 그대로 보인다.
//   as: 'line'(기본) · 'title' 제목 · 'hand' 손글씨 줄(인쇄 표면 위 볼펜·펜 글씨) · 'strike' 그어 지운 줄
//       'erased' 지우다 남은 흐린 자국 · 'field' 항목: 값(label, text) · 'rule' 가로 구분선
//       'table' 표(rows: 칸 목록의 목록, 칸은 문자열이나 { text, ink, sticker }, head: 첫 줄을 머리글로)
//       'stamp' 도장(text, color: red·blue) · 'redacted' 매직으로 지운 칸(label, length: 지운 글자 수)
//       'progress' 진행 막대(value: 0~100, text) · 'sticker' 스티커(color: red·yellow)
//       'note' 포스트잇(color: yellow·pink·blue·green, title) · 'paper' 붙여 둔 인쇄물(title, hand: 그 위 손글씨)
//       'page' 다음 쪽(노트 오른쪽 쪽, 서류 다음 장, 메모·라벨 한 장 더)
//   ink: black·blue·red·green(글씨 색), mark: circle·underline·highlight(동그라미·밑줄·형광펜), size: small·large, bold: true(굵게),
//   align: center·right, tilt: 기울기(도, 기본은 항목 순서대로 조금씩),
//   place: 'main'(화이트보드에서 note·paper를 오른쪽 대신 그 자리 아래에 붙임)
// caption은 표면 아래에 보이는 서술(적혀 있지 않은 것)이다. 조사 문구(message)는 화면 낭독기용 설명으로 그대로 쓴다.
// takenMessage·missingMessage에 적힌 글이 따로 있으면 takenSheet·missingSheet에 같은 모양으로 적는다. 방의 exitLock도
// surface·look·writing·caption을 받는다.
const WRITING_SURFACE_BY_FILE = {
  'rolling-whiteboard': 'whiteboard', 'research-board': 'whiteboard', 'strategy-board': 'whiteboard',
  'sales-kpi-board': 'whiteboard', 'dispatch-board': 'whiteboard', 'labeling-board': 'whiteboard',
  'training-slide-board': 'whiteboard', 'research-news-board': 'corkboard', 'food-kitchen-board': 'corkboard',
  'food-voice-board': 'chalkboard',
};
const WRITING_SURFACE_LABELS = {
  whiteboard: '화이트보드', notebook: '노트', corkboard: '게시판', chalkboard: '칠판', memo: '메모',
  document: '문서', screen: '화면', receipt: '영수증', label: '라벨', card: '사원증',
};
const WRITING_LOOK_LABELS = { notice: '공지', sign: '안내판', poster: '포스터', certificate: '증서', plaque: '명패',
  slip: '쪽지', sticker: '스티커', warning: '경고 스티커', plate: '명판', tag: '꼬리표' };
const WRITING_BOARDS = new Set(['whiteboard', 'corkboard', 'chalkboard']);
const WRITING_PINNED = new Set(['note', 'paper']);
const WRITING_LINE_TILTS = [-0.5, 0.3, -0.15, 0.45, -0.35, 0.2];
const WRITING_PINNED_TILTS = [-2.2, 1.6, -1, 2.4, -1.7, 0.8];
// Writable faces in the 512x256 prop artwork; frames and wheels remain visible.
const WHITEBOARD_FACES = {
  'rolling-whiteboard': [104, 16, 304, 137], 'research-board': [51, 34, 408, 132],
  'strategy-board': [51, 42, 408, 128], 'sales-kpi-board': [44, 37, 423, 136],
  'dispatch-board': [52, 48, 356, 121], 'labeling-board': [51, 40, 382, 132],
  'training-slide-board': [51, 36, 408, 130],
};

function addWorldWhiteboardWriting(element, prop) {
  const face = WHITEBOARD_FACES[prop.file];
  if (!face || !prop.writing?.length) return;
  const [x, y, width, height] = face;
  const scale = prop.worldWidth / prop.size[0];
  const sheet = renderWritingSheet({ surface: 'whiteboard', writing: prop.writing, image: prop.image });
  sheet.classList.add('world-whiteboard-writing');
  sheet.setAttribute('aria-hidden', 'true');
  Object.assign(sheet.style, { left: `${x * scale}px`, top: `${y * scale}px` });
  element.append(sheet);
  const fit = () => {
    if (sheet.isConnected && sheet.scrollHeight) sheet.style.transform = `scale(${width * scale / 800}, ${height * scale / sheet.scrollHeight})`;
  };
  for (const image of sheet.querySelectorAll('img')) image.addEventListener('load', fit);
  fit();
  document.fonts.ready.then(fit);
}

function writingNode(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function writingCell(tag, cell) {
  const entry = typeof cell === 'string' ? { text: cell } : cell;
  const node = writingNode(tag, 'writing-cell', entry.text || '');
  if (entry.ink) node.dataset.ink = entry.ink;
  if (entry.sticker) node.append(writingNode('span', 'writing-sticker', entry.sticker));
  return node;
}

function writingTable(entry) {
  const table = writingNode('table', 'writing-table');
  entry.rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    for (const cell of row) tr.append(writingCell(entry.head && index === 0 ? 'th' : 'td', cell));
    table.append(tr);
  });
  return table;
}

function writingImage(src, className, alt = '') {
  const image = writingNode('img', className);
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  return image;
}

function writingItem(item, index) {
  const entry = typeof item === 'string' ? { text: item } : item;
  const kind = entry.as || 'line';
  let node;
  if (kind === 'page') return writingNode('div', 'writing-page');
  if (kind === 'table') node = writingTable(entry);
  else if (kind === 'image') node = writingImage(entry.src, 'writing-image', entry.alt);
  else if (kind === 'rule') node = writingNode('hr', 'writing-rule');
  else if (kind === 'field' || kind === 'redacted') {
    node = writingNode('p', `writing-${kind === 'field' ? 'field' : 'redacted-field'}`);
    if (entry.label) node.append(writingNode('span', 'writing-field-label', entry.label));
    if (kind === 'redacted') {
      const bar = writingNode('span', 'writing-redacted');
      bar.style.setProperty('--length', String(entry.length || 6));
      node.append(bar);
    } else node.append(writingNode('span', 'writing-field-value', entry.text || ''));
  } else if (kind === 'progress') {
    node = writingNode('div', 'writing-progress');
    const bar = writingNode('span', 'writing-progress-bar');
    bar.style.setProperty('--value', `${Math.max(0, Math.min(100, Number(entry.value) || 0))}%`);
    node.append(bar);
    if (entry.text) node.append(writingNode('span', 'writing-progress-text', entry.text));
  } else if (kind === 'note' || kind === 'paper') {
    node = writingNode('div', `writing-${kind}`);
    if (entry.title) node.append(writingNode('strong', 'writing-pinned-title', entry.title));
    if (entry.text) node.append(writingNode('p', 'writing-pinned-text', entry.text));
    if (entry.hand) node.append(writingNode('p', 'writing-hand', entry.hand));
  } else node = writingNode(kind === 'sticker' ? 'span' : 'p', `writing-${kind}`, entry.text);
  node.classList.add('writing-item');
  for (const key of ['ink', 'mark', 'size', 'align', 'color', 'bold']) if (entry[key]) node.dataset[key] = entry[key];
  const tilts = WRITING_PINNED.has(kind) ? WRITING_PINNED_TILTS : WRITING_LINE_TILTS;
  node.style.setProperty('--tilt', `${entry.tilt ?? tilts[index % tilts.length]}deg`);
  return node;
}

// page 항목에서 나눠 낱장(서류 한 장, 메모 한 장, 라벨 하나)을 만든다.
function writingSheets(writing, className) {
  const sheets = [writingNode('div', className)];
  writing.forEach((item, index) => {
    if (typeof item === 'object' && item.as === 'page') sheets.push(writingNode('div', className));
    else sheets.at(-1).append(writingItem(item, index));
  });
  return sheets.filter(sheet => sheet.childElementCount);
}

function writingBoard(writing) {
  const board = writingNode('div', 'writing-board');
  const main = writingNode('div', 'writing-main');
  const pinned = writingNode('div', 'writing-pinned');
  writing.forEach((item, index) => {
    const kind = typeof item === 'string' ? 'line' : item.as || 'line';
    if (kind !== 'page') (WRITING_PINNED.has(kind) && item.place !== 'main' ? pinned : main).append(writingItem(item, index));
  });
  board.dataset.layout = main.childElementCount && pinned.childElementCount ? 'split' :
    pinned.childElementCount ? 'pinned' : 'main';
  // ponytail: 종이 수로 열을 정한다. 긴 내용이 늘면 표면별 배치를 지정한다.
  const mainPins = main.querySelectorAll('.writing-note, .writing-paper').length;
  if (mainPins > 3 || pinned.childElementCount > 3) {
    board.dataset.pins = 'many';
    board.style.setProperty('--main-ratio', pinned.childElementCount > 6 ? '.5fr' : '1.75fr');
    main.style.setProperty('--pin-columns', mainPins > 3 ? 3 : 2);
    pinned.style.setProperty('--pin-columns', pinned.childElementCount > 6 ? 3 : 2);
  }
  if (main.childElementCount) board.append(main);
  if (pinned.childElementCount) board.append(pinned);
  return board;
}

function writingScreen(writing) {
  const screen = writingNode('div', 'writing-screen');
  const glass = writingNode('div', 'writing-screen-glass');
  writing.forEach((item, index) => {
    const kind = typeof item === 'string' ? 'line' : item.as || 'line';
    if (kind !== 'page') (WRITING_PINNED.has(kind) ? screen : glass).append(writingItem(item, index));
  });
  glass.append(writingNode('span', 'writing-cursor'));
  screen.prepend(glass);
  return screen;
}

function writingCard(sheet) {
  const card = writingNode('div', 'writing-card');
  if (sheet.image) card.append(writingImage(sheet.image, ''));
  for (const page of writingSheets(sheet.writing || [], 'writing-card-face')) card.append(page);
  return card;
}

// sheet: { surface, look, writing, caption, image }. surface가 없거나 그릴 내용이 없으면 null.
function renderWritingSheet(sheet) {
  const { surface, look, writing = [], caption } = sheet;
  const root = writingNode('div', 'writing-sheet');
  root.dataset.surface = surface;
  if (look) root.dataset.look = look;
  if (sheet.image && surface !== 'card') root.append(writingImage(sheet.image, 'writing-art'));
  else if (surface === 'notebook') {
    const book = writingNode('div', 'writing-book');
    const pages = writingNode('div', 'writing-pages');
    writing.forEach((item, index) => pages.append(writingItem(item, index)));
    book.append(pages);
    root.append(book);
  } else if (WRITING_BOARDS.has(surface)) root.append(writingBoard(writing));
  else if (surface === 'screen') root.append(writingScreen(writing));
  else if (surface === 'card') root.append(writingCard(sheet));
  else {
    const stack = writingNode('div', `writing-stack writing-${surface}-stack`);
    const sheets = writingSheets(writing, `writing-${surface}`);
    sheets.forEach((page, index) => page.style.setProperty('--tilt', `${[-0.8, 1.1, -1.4, 0.6][index % 4]}deg`));
    stack.dataset.count = String(sheets.length);
    stack.append(...sheets);
    root.append(stack);
  }
  if (!sheet.image && (surface === 'whiteboard' || surface === 'chalkboard')) root.append(writingNode('div', 'writing-tray'));
  if (caption) root.append(writingNode('p', 'writing-caption', caption));
  return root;
}

// 지금 보이는 문구에 맞는 표면: message면 소품 자체, takenMessage·missingMessage면 소품의 takenSheet·missingSheet
// ({ surface, look, writing, caption, image }). 맞는 것이 없으면 null(대화창).
function writingSheetFor(door, message) {
  if (!door || !message) return null;
  if (message === door.message) return door;
  if (message === door.takenMessage) return door.takenSheet || null;
  if (message === door.missingMessage) return door.missingSheet || null;
  return null;
}

// 조사 UI 머리글에 쓰는 이름(화이트보드, 문서, 공지 ...).
function writingSurfaceLabel(sheet) {
  return WRITING_LOOK_LABELS[sheet.look] || WRITING_SURFACE_LABELS[sheet.surface];
}

// 표면을 펼칠 수 있는가: 아는 표면이고 적힌 내용 또는 완성 그림이 있어야 한다.
function hasWritingSheet(sheet) {
  return Boolean(sheet && WRITING_SURFACE_LABELS[sheet.surface] && (sheet.writing?.length || sheet.image));
}
