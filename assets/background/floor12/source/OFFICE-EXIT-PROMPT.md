# 개발실 복도 출입문 수정

내장 ImageGen으로 `office-exit-before.png`를 편집했다. `office-exit-generated.png`가 생성 원본이고, 게임용 `office-exit-corridor.png`는 이를 257×360으로 축소한 결과다.

`office.png`와 `office-finished.png` 각각의 `[1490, 210, 257, 360]`에 게임용 조각을 합성했다. 이 영역 밖의 픽셀은 유지한다. `build.py`는 수정된 `office.png`에서 마감본을 재생성한다. 기존 `exitArt`가 이 문을 실제 출구 위치로 옮기므로 출입 판정·화이트보드·주변 외창은 그대로다.

별도로 겹쳐 표시되던 `background-power.js`의 `floor12/office` 및 `floor12/office-finished` 비상구 표시등 항목도 제거했다.

## 최종 프롬프트

Use case: precise-object-edit. Edit target: the attached exact cropped 2D side-scrolling game background, 514 by 720 pixels. Preserve the exact straight-on composition, steel double sliding door frame, central mullion, two handles, automatic door sensor, all door dimensions/positions, side wall edges, dark blue-gray palette, detailed pixel-art texture. Change only two things: (1) Completely remove the small glowing green emergency running-man exit sign above the sensor and fill that rectangle seamlessly with the matching plain dark gray wall. No replacement sign, pictogram, words or glow. (2) Replace the night city skyline and blue sky visible through BOTH door glass panes with an enclosed INDOOR office corridor: dark graphite-gray interior wall across the corridor, subtle horizontal architectural seams, a closed ordinary gray office door, a narrow strip of indoor gray floor seen through the lower glass. No buildings, outside sky, windows, outdoors, stars or lights resembling a city. It must clearly read as going from this room into the building's interior hallway. Keep the corridor dim and consistent with an office power outage. Retain the existing dark steel door perimeter/center frame and metal handles, without moving or reshaping anything. Opaque complete rectangular background crop; no transparency, no added characters, furniture or text.
