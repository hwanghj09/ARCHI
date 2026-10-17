// clue 또는 photo: true인 조사 대상에 촬영을 제공한다.
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
  if (!photoSource(photo)) return;
  phoneCameraSubject = { door, photo };
  inspectionPhotoButton.hidden = false;
  inspectionPhotoButton.disabled = !photoSubjectAvailable() || hasPhoto(photo) || Boolean(phoneDock) || phoneBattery <= 0;
  inspectionPhotoButton.textContent = hasPhoto(photo) ? '갤러리에 저장됨' : phoneDock ? '사진 찍기 · 휴대폰 가져오기 필요' :
    phoneBattery <= 0 ? '사진 찍기 · 충전 필요' : '사진 찍기';
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
  const caption = document.createElement('p');
  caption.className = 'writing-caption';
  caption.textContent = `${photoPlace(photo)} · ${photoMessage(photo)}`;
  inspectionSheet.replaceChildren(renderPhonePhoto(photo), caption);
}

function startPhotoCapture() {
  if (photoCaptureTime > 0 || itemUseTime > 0 || mainMenuActive || playerCaught || hallucinationCaught ||
      openingActive || blackoutSceneActive || storySceneActive || cctvSceneActive || transitioning || !photoSubjectAvailable()) return;
  if (phoneDock || phoneBattery <= 0) return showStatus(phoneDock ? '충전하던 휴대폰을 먼저 가져와야 한다.' : '휴대폰 배터리가 없다. 충전이 필요하다.');
  if (hasPhoto(phoneCameraSubject.photo)) return showStatus('이미 갤러리에 저장한 사진이다.');
  if (!phoneSheet.complete || !phoneSheet.naturalWidth || !phoneAwaySheet.complete || !phoneAwaySheet.naturalWidth) {
    return showStatus('촬영 동작을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
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
    showStatus(`${name} 촬영 완료 · 휴대폰 → 갤러리`, 3500);
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
