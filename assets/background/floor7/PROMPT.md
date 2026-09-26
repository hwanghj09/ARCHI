# 7층 AI 테스트·검증실 내부 배경 프롬프트

- 대상 파일: `assets/background/floor7/lab.png` (`f7-lab` 방의 `backgroundImage`, 아직 없음).
- 방 폭(월드) = 2600px, 세로 720px, 바닥선 y=570(위에서 79.17%). 창문 없음(`windowless: true`) — 복도로
  나가는 문 하나만 있다.
- 나가는 문(자동문, 복도 쪽 성능평가실 문과 같은 스타일)의 정확한 박스: **x=1231..1467(전체 폭의
  47.3%~56.4%), 위쪽 y=290(40.3%), 아래쪽 y=570(바닥선)**. 이 비율만 맞으면 실제 생성된 그림의 가로세로
  픽셀 수가 요청과 달라도 상관없다 — 나중에 바닥선 기준으로 다시 배율을 맞추고 문 위치도 다시 계산해서
  합성한다(비율을 늘리거나 줄이지 않고, 12층 방식대로 문 조각만 필요하면 통짜로 살짝 리사이즈).
- 소품(서버랙, 네트워크랙, 전자기기 작업대, 계측기 카트, 냉각 유닛, UPS 캐비닛)은 게임이 별도 스프라이트로
  바닥 위에 올려 그린다 — **배경 그림 아래쪽 벽면에는 아무 가구도 그리지 말 것.** 벽 자체(패널·케이블 트레이·
  배관)만 좌우로 반복해도 자연스럽게 이어지도록 균일한 간격으로 그린다.

## 프롬프트

```text
Use case: stylized-concept
Asset type: production background sprite for ARCHI, a 2D side-scrolling mystery/horror pixel-art game (80% quiet mystery, 20% horror).
Reference image is the existing 7th-floor corridor image already made for this game (assets/background/floor7/corridor.png) — match its exact pixel-art style, palette, material, outline weight and lighting precisely. This is the SAME building, drawn by the same artist.
Strict orthographic side view, perpendicular to the wall, no perspective, no vanishing point. Wide landscape image, as wide as the tool allows (aim for roughly 3.6:1, e.g. 1536x1024 is fine if that's the limit — proportions matter far more than exact pixel size).
Floor walk-line perfectly horizontal at 79.17% down from the top, thin pale baseline strip at the floor edge, dark flat foundation cutaway with pipes below it.
This is the INSIDE of the "AI 테스트·검증실" (AI test & verification lab): a windowless, secure server/test-bench room. NO windows anywhere — replace where windows would be with large dark gray metal wall panels, vertical seams, a cable tray and conduit runs near the ceiling, occasional small blinking status LEDs (one or two, dim red or green).
Ceiling: pale fluorescent light fixtures (all unlit, power outage) and conduits, consistent with the corridor reference.
One closed automatic sliding glass double door, split in the middle, centered at 47.3%-56.4% of the image width, its top edge at 40.3% down from the top and its bottom flush with the floor line. Small blank status plate and one dim red LED beside the door (power lost, door inoperative). Steel frame around the door matching the corridor's lab door.
Evenly spaced wall panel seams across the FULL width (both left and right of the door) so the wall can be tiled/repeated sideways without an obvious seam.
Cold desaturated blue-gray palette, midnight power outage — interior is dark and unlit, only faint ambient light and the one or two small LED accents. No text, no letters, no numbers, no logos, no signage content (any sign plate is blank). No people, no robots. Nothing in front of the lower wall: no racks, no desks, no furniture — the game places those separately. Opaque PNG, no border, no watermark, no UI.
```
