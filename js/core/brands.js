// 브랜드를 바꾸려면 이 두 설정만 수정한 뒤 새로고침하세요. 그림 속 글자도 함께 바뀝니다.
const BRAND_NAMES = {
  softwareCompany: 'ARCHI Soft',
  databaseCompany: 'ARCHI Data',
  databaseProduct: 'ARCHI DB',
  store: 'VU',
  ramen: '인라면',
  ramenEnglish: 'IN RAMEN',
  blogService: 'BLORIA', // 컴퓨터 블로그 화면의 서비스 이름
  blogDomain: 'blog.bloria.net',
};
const BRAND_ART = {
  storeEmblem: 'assets/objects/signage/store-emblem.png',
  ramenBox: 'assets/objects/floor16/ramen-box.png',
};

// 원본 층 데이터의 이름을 표시 직전에 통일한다. 퍼즐 id와 저장 키는 바꾸지 않는다.
function brandText(text) {
  const names = {
    TmaxSoft: BRAND_NAMES.softwareCompany, TMAXSOFT: BRAND_NAMES.softwareCompany.toUpperCase(),
    TmaxTibero: BRAND_NAMES.databaseCompany, Tibero: BRAND_NAMES.databaseProduct,
    CU: BRAND_NAMES.store, VU: BRAND_NAMES.store,
    진라면: BRAND_NAMES.ramen, 신라면: BRAND_NAMES.ramen, 인라면: BRAND_NAMES.ramen,
  };
  return text.replace(/TmaxTibero|TmaxSoft|TMAXSOFT|Tibero|\b(?:CU|VU)\b|진라면|신라면|인라면/g, name => names[name]);
}

function applyBrandNames(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (typeof value[key] === 'string') value[key] = brandText(value[key]);
    else applyBrandNames(value[key], seen);
  }
}

function addBrandSign(parent, { x, y, width, height }) {
  const sign = document.createElement('div');
  sign.className = 'brand-sign';
  sign.setAttribute('aria-hidden', 'true');
  Object.assign(sign.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`,
    fontSize: `${Math.min(height * .72, (width - height * .75 - 8) / Math.max(2, [...BRAND_NAMES.store].length))}px` });
  const emblem = new Image();
  emblem.src = BRAND_ART.storeEmblem;
  emblem.alt = '';
  const name = document.createElement('span');
  name.textContent = BRAND_NAMES.store;
  sign.append(emblem, name);
  parent.append(sign);
}

function addCartonBrand(parent) {
  const image = new Image();
  image.className = 'carton-art';
  image.src = BRAND_ART.ramenBox;
  image.alt = '';
  parent.append(image);
  const label = document.createElement('span');
  label.className = 'carton-label carton-label-front';
  label.style.fontSize = `${Math.min(28, 140 / Math.max(3, [...BRAND_NAMES.ramen].length))}px`;
  label.textContent = BRAND_NAMES.ramen;
  const english = document.createElement('small');
  english.textContent = BRAND_NAMES.ramenEnglish;
  label.append(english);
  parent.append(label);
}

// HTML에 고정된 글자(data-brand="BRAND_NAMES의 키")를 설정한 이름으로 채운다: 컴퓨터 블로그의 서비스 이름·주소.
// 화면이 없는 곳(tests/brands.mjs의 node 실행)에서는 건너뛴다.
if (typeof document !== 'undefined') {
  for (const element of document.querySelectorAll('[data-brand]')) element.textContent = BRAND_NAMES[element.dataset.brand];
}
