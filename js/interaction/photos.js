// photo: true인 조사 대상(1층 층별 안내판)에만 촬영을 제공한다. 예전에 찍어 둔 사진은 clue가 있는 물건이어도 갤러리에서 그대로 본다.
// shortcut: 사진은 원본 표면으로 복원한다. 촬영 순간의 동적 화면이 필요해지면 픽셀 이미지를 저장한다.
const inspectionPhotoButton = document.getElementById('inspection-photo');
const phoneCameraShoot = document.getElementById('phone-camera-shoot');
const photoShutter = document.getElementById('photo-shutter');
let collectedPhotos = [];
let phoneCameraSubject = null;
let pendingPhoto = null;

function photoSource(photo) {
  const config = floorById.get(photo?.scene);
  return [...(config?.props || []), ...(config?.fixtures || []), ...(config?.barriers || []), ...(config?.solids || [])]
    .find(source => source.name === photo.name && (source.clue || source.photo === true));
}

function hasPhoto(photo) {
  return collectedPhotos.some(saved => saved.scene === photo.scene && saved.name === photo.name);
}

function photoMessage(photo) {
  const source = photoSource(photo);
  return (photo.variant === 'taken' ? source?.takenMessage : source?.message) || source?.clue || '';
}

function photoPlace(photo) {
  return floorById.get(photo.scene).header;
}

function photoSubjectAvailable() {
  const subject = phoneCameraSubject;
  if (!subject || room !== 'dynamic' || subject.photo.scene !== dynamicFloorId || !currentDoors.includes(subject.door)) return false;
  const door = subject.door;
  return grounded && [].concat(door.standYs ?? door.standY ?? floorY).some(y => Math.abs(body.bounds.max.y - y) < 2) &&
    Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28 &&
    !(world.dataset.dark === 'true' && door.darkMessage) &&
    [].concat(door.requires || []).every(item => collectedItems.has(item)) && (!door.condition || door.condition());
}

function offerInspectionPhoto(door, message) {
  if (!usingInspection || !message || room !== 'dynamic') return;
  const photo = { scene: dynamicFloorId, name: door.name, variant: message === door.takenMessage ? 'taken' : 'original' };
  if (photoSource(photo)?.photo !== true) return; // 새 사진은 photo: true인 물건(1층 층별 안내판)만 찍을 수 있다. 단서(clue)가 있어도 찍지 않는다.
  phoneCameraSubject = { door, photo };
  inspectionPhotoButton.hidden = false;
  inspectionPhotoButton.disabled = !photoSubjectAvailable() || hasPhoto(photo) || Boolean(phoneDock) || phoneBattery <= 0;
  inspectionPhotoButton.textContent = hasPhoto(photo) ? '갤러리에 저장됨' : phoneDock ? '사진 찍기 · 휴대폰 가져오기 필요' :
    phoneBattery <= 0 ? '사진 찍기 · 충전 필요' : '사진 찍기';
  // 층별 안내판을 처음 볼 때(아직 사진이 없고 찍을 수 있을 때)는 닫기 버튼을 없애고 사진 찍기만 남긴다. 찍을 수 없으면 닫을 수 있다.
  const photoOnly = !inspectionPhotoButton.disabled;
  inspectionClose.hidden = photoOnly;
  if (photoOnly) { inspectionPanel.dataset.photoOnly = 'true'; inspectionPhotoButton.focus(); }
  else delete inspectionPanel.dataset.photoOnly;
  if (inspectionTypingTimer === null) finishInspectionText(); // 아래 안내를 'E · 사진 찍기' 또는 'E / Esc'로 맞춘다
}

function renderPhonePhoto(photo) {
  const source = photoSource(photo);
  const sheet = writingSheetFor({ ...source, surface: source.surface || WRITING_SURFACE_BY_FILE[source.file] }, photoMessage(photo));
  if (hasWritingSheet(sheet)) return renderWritingSheet(sheet);
  const figure = document.createElement('figure');
  figure.className = 'phone-photo-image';
  const image = new Image();
  image.alt = photo.name;
  image.draggable = false;
  const art = [floorById.get(photo.scene).backgroundImage].flat().find(Boolean);
  if (source.file && !source.sprite) image.src = `assets/objects/floor-kit/${source.file}.png`;
  else if (source.sprite && source.size) {
    const frame = photo.variant === 'taken' && source.stateBy ? 1 : source.spriteFrame || 0;
    figure.classList.add('phone-photo-crop');
    figure.style.aspectRatio = source.size.join(' / ');
    Object.assign(image.style, { width: `${(source.frames || 2) * 100}%`, height: '100%', left: `${-frame * 100}%`, top: '0' });
    image.src = source.sprite;
  }
  else if (source.image) image.src = source.image;
  else if (art) {
    const [x, y, width, height] = source.outline || [source.x, source.y, source.width, source.height || floorY - source.y];
    figure.classList.add('phone-photo-crop');
    figure.style.aspectRatio = `${width} / ${height}`;
    Object.assign(image.style, { width: `${(art.width || floorById.get(photo.scene).width) / width * 100}%`,
      height: `${art.height / height * 100}%`, left: `${((art.left || 0) - x) / width * 100}%`, top: `${((art.top || 0) - y) / height * 100}%` });
    image.src = art.src;
  }
  if (image.getAttribute('src')) figure.append(image);
  return figure;
}

function refreshPhoneCamera() {
  const available = photoSubjectAvailable();
  const photo = available ? phoneCameraSubject.photo : null;
  const saved = photo && hasPhoto(photo);
  document.getElementById('phone-camera-status').textContent = photo ?
    `${photoPlace(photo)} · ${photo.name}${saved ? ' · 촬영 완료' : ''}` : '촬영할 단서를 가까이에서 조사하세요.';
  document.getElementById('phone-camera-preview').replaceChildren(...(photo ? [renderPhonePhoto(photo)] : []));
  phoneCameraShoot.disabled = !photo || saved || Boolean(phoneDock) || phoneBattery <= 0;
}

function renderPhoneGallery() {
  const list = document.getElementById('phone-gallery-list');
  list.replaceChildren(...[...collectedPhotos].reverse().map(photo => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'phone-photo-card';
    const preview = document.createElement('div');
    preview.className = 'phone-photo-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.append(renderPhonePhoto(photo));
    const name = document.createElement('strong');
    name.textContent = photo.name;
    const place = document.createElement('small');
    place.textContent = photoPlace(photo);
    button.append(preview, name, place);
    button.addEventListener('click', () => openGalleryPhoto(photo));
    item.append(button);
    return item;
  }));
  document.getElementById('phone-gallery-empty').hidden = collectedPhotos.length > 0;
}

function openGalleryPhoto(photo) {
  closePhone();
  openInspection(`사진 · ${photo.name}`, `${photoPlace(photo)}\n${photoMessage(photo)}`);
  finishInspectionText();
  inspectionPanel.dataset.returnTo = 'gallery';
  inspectionPanel.dataset.surface = 'photo';
  inspectionLabel.textContent = '갤러리';
  inspectionSheet.hidden = false;
  inspectionSheet.replaceChildren(renderPhonePhoto(photo));
}

function startPhotoCapture() {
  if (photoCaptureTime > 0 || itemUseTime > 0 || mainMenuActive || playerCaught || hallucinationCaught ||
      openingActive || blackoutSceneActive || storySceneActive || cctvSceneActive || transitioning || !photoSubjectAvailable()) return;
  if (phoneDock || phoneBattery <= 0) return;
  if (hasPhoto(phoneCameraSubject.photo)) return;
  if (!phoneSheet.complete || !phoneSheet.naturalWidth || !phoneAwaySheet.complete || !phoneAwaySheet.naturalWidth) {
    delete inspectionPanel.dataset.photoOnly; inspectionClose.hidden = false; finishInspectionText(); // 찍지 못하면 닫을 수 있게
    return;
  }
  pendingPhoto = { ...phoneCameraSubject.photo };
  const door = phoneCameraSubject.door;
  if (usingPhone) closePhone();
  if (usingInspection) closeInspection();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  facing = body.position.x <= door.x + door.width / 2 ? 1 : -1;
  photoCaptureTime = photoCaptureDuration;
  phoneAwayTime = 0;
  hint.hidden = true;
  animate(0);
}

function cancelPhotoCapture() {
  photoCaptureTime = 0;
  pendingPhoto = null;
  photoShutter.hidden = true;
}

function updatePhotoCapture(elapsed) {
  if (playerCaught || hallucinationCaught || transitioning || (pendingPhoto && (!photoSubjectAvailable() || phoneDock || phoneBattery <= 0))) {
    cancelPhotoCapture();
    return;
  }
  photoCaptureTime = Math.max(0, photoCaptureTime - elapsed);
  if (pendingPhoto && photoCaptureTime <= 720) {
    collectedPhotos.push(pendingPhoto);
    const name = pendingPhoto.name;
    pendingPhoto = null;
    playGameSound('camera-shutter');
    renderPhoneGallery();
    saveProgress();
  }
  photoShutter.hidden = !(photoCaptureTime <= 720 && photoCaptureTime > 600);
}

function photoSnapshot() {
  return collectedPhotos.map(photo => ({ ...photo }));
}

function restorePhotos(saved) {
  cancelPhotoCapture();
  phoneCameraSubject = null;
  collectedPhotos = [];
  if (Array.isArray(saved)) for (const photo of saved.slice(0, 256)) {
    if (typeof photo?.scene !== 'string' || typeof photo.name !== 'string' ||
        !['original', 'taken'].includes(photo.variant) || !photoSource(photo) || hasPhoto(photo)) continue;
    collectedPhotos.push({ scene: photo.scene, name: photo.name, variant: photo.variant });
  }
  renderPhoneGallery();
}

inspectionPhotoButton.addEventListener('click', startPhotoCapture);
phoneCameraShoot.addEventListener('click', startPhotoCapture);
renderPhoneGallery();
