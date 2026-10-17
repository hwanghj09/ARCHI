// 마우스로 글자·그림을 고르거나 끌거나 복사하지 못하게 한다(오른쪽 클릭 메뉴도 막는다).
// 플레이어가 직접 쓰는 입력 칸(휴대폰·PC 메모, 키패드, 12층 DB 콘솔)은 그대로 고르고 붙여 넣을 수 있다.
const isEditableTarget = target => target instanceof Element && Boolean(target.closest('input, textarea, [contenteditable="true"]'));
for (const type of ['selectstart', 'dragstart', 'copy', 'cut', 'contextmenu']) {
  document.addEventListener(type, event => {
    if (!isEditableTarget(event.target)) event.preventDefault();
  });
}
