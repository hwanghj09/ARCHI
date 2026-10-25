"""층별 복도·방 화면과 그 화면이 쓰는 벽·문 에셋을 정리한다(에셋 백업용).

usage (게임 폴더 루트에서):  python <이 파일> [out_dir]   (기본 out_dir: asset-backup)
  <out_dir>/복도/<층>.png                 층 복도 전체 화면(5000x720)
  <out_dir>/방/<층>/<방 id>_<이름>.png      방 안 전체 화면
  <out_dir>/모듈/벽, 모듈/문              여러 층이 함께 쓰는 벽 모듈(기본벽·유리벽…)과 문 세트
  <out_dir>/층별/<층>/                     그 층 복도 벽 구성표(README.md)와 실제로 쓰는 벽 배경·유리 너머·문·방 배경 원본
플레이어·UI는 숨기고 모든 층 전력을 켠 상태로 찍는다. 필요: Python playwright + 설치된 Chrome.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.getcwd()
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'asset-backup')
PORT = 8767

SETUP = '''() => {
  try { sanity = 100; updateSanity(0); } catch (e) {}
  try { setAllFloorsPower(true); } catch (e) {}
  // 게임 화면(#world)만 남기고 UI·연출 자막·건너뛰기 버튼·플레이어를 숨긴다.
  const style = document.createElement('style');
  style.textContent = `body > :not(#stage), #stage > :not(#world), #player, .guard-robot-sprite { visibility: hidden !important; }`;
  document.head.append(style);
  return [...floorById.values()].map(c => ({ id: c.id, floor: c.floor, interior: !!c.interior,
    name: c.label || c.name || c.aria || c.id,
    rooms: (c.rooms || []).map(r => ({ name: r.name, target: r.target, x: r.x, width: r.width,
      doorX: r.doorX, doorWidth: r.doorWidth, door: r.doorSprite || r.doorStyle || '' })) }));
}'''

SHOW = '''async ([id, interior]) => {
  try { finishStoryScene(); } catch (e) {}
  performFloorChange(id, interior || id === 'rooftop' ? null : 0, interior ? 'exit' : null);
  // 어두운 방도 벽·문이 보이게 밝힌다.
  world.dataset.dark = 'false';
  world.style.setProperty('--room-brightness', '1');
  await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  // 이 장면에 보이는 그림 파일(img와 CSS 배경)
  const used = new Set();
  for (const el of world.querySelectorAll('*')) {
    if (!el.getClientRects().length || el.closest('#player')) continue;
    if (el.tagName === 'IMG') used.add(el.getAttribute('src'));
    const bg = getComputedStyle(el).backgroundImage;
    for (const m of bg.matchAll(/url\\("?([^")]+)"?\\)/g)) used.add(m[1]);
  }
  return { width: worldWidth, used: [...used].filter(Boolean)
    .map(src => decodeURIComponent(src.replace(location.origin + '/', '').replace(/^\\//, ''))) };
}'''

WALL_NAMES = {'wall-concrete': '기본벽(흰 벽)', 'wall-glass': '투명 유리벽', 'wall-frosted': '불투명 유리벽',
              'wall-glass-mixed': '혼합 유리벽', 'pilaster': '기둥'}
DOOR_NAMES = {'door-glass-clear-single': '투명유리_여닫이문', 'door-glass-clear-auto': '투명유리_자동문',
              'door-glass-frosted-single': '불투명유리_여닫이문', 'door-glass-frosted-auto': '불투명유리_자동문',
              'door-glass-mixed-single': '혼합유리_여닫이문', 'door-glass-mixed-auto': '혼합유리_자동문',
              'door-solid-vision': '흰벽용_창있는문', 'door-solid-plain': '흰벽용_민짜문'}


def floor_name(floor):
    return f'B{-floor}' if floor < 0 else 'RF' if floor == 18 else f'{floor:02d}F'


def safe(text):
    return re.sub(r'[\\/:*?"<>|\s]+', '_', text).strip('_')


def copy(src, dst):
    src = os.path.join(ROOT, src)
    if os.path.isfile(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        return True
    return False


def is_wall_or_door(path):
    # 벽·문·배경만 고른다(소품·캐릭터·UI 제외).
    name = os.path.basename(path)
    return path.startswith('assets/background/') or is_door(path)


def is_door(path):
    name = os.path.basename(path)
    return 'door' in name or name in ('elevator.png', 'stairs.png')


def capture():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1.5)
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel='chrome')
            page = browser.new_page(viewport={'width': 1280, 'height': 720})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{PORT}/index.html')
            page.locator('#menu-start').click()
            if page.locator('#menu-new-confirm').is_visible():
                page.locator('#menu-new-confirm').click()
            page.locator('#opening-skip').click()
            page.wait_for_timeout(500)
            scenes = page.evaluate(SETUP)
            for scene in scenes:
                shown = page.evaluate(SHOW, [scene['id'], scene['interior']])
                page.set_viewport_size({'width': int(shown['width']), 'height': 720})
                page.wait_for_timeout(700)  # 크기 바뀐 뒤 카메라·조명 한 프레임 이상 갱신
                floor = floor_name(scene['floor'])
                if scene['interior']:
                    rel = f"방/{floor}/{scene['id']}_{safe(scene['name'])}.png"
                else:
                    rel = f'복도/{floor}.png'
                os.makedirs(os.path.dirname(os.path.join(OUT, rel)), exist_ok=True)
                page.screenshot(path=os.path.join(OUT, rel))
                scene.update(width=shown['width'], file=rel, used=sorted(set(shown['used'])))
                print(scene['id'], '->', rel)
            browser.close()
            print('errors', errors)
            return scenes
    finally:
        server.terminate()


def organize(scenes):
    # 공용 벽 모듈과 공용 문 세트: 알아보기 쉬운 이름으로 복사
    for key, label in WALL_NAMES.items():
        copy(f'assets/background/wall/{key}.png', os.path.join(OUT, '모듈/벽', f'{label}_{key}.png'))
        copy(f'assets/background/wall/{key}@2x.png', os.path.join(OUT, '모듈/벽/2배', f'{label}_{key}@2x.png'))
    for key, label in DOOR_NAMES.items():
        copy(f'assets/objects/doors/{key}.png', os.path.join(OUT, '모듈/문', f'{label}_{key}.png'))
    for doc in ('assets/background/wall/README.md', 'assets/objects/doors/README.md'):
        copy(doc, os.path.join(OUT, '모듈', '벽' if '/wall/' in doc else '문', '원래_README.md'))

    by_floor = {}
    for scene in scenes:
        by_floor.setdefault(floor_name(scene['floor']), []).append(scene)
    for floor, items in by_floor.items():
        base = os.path.join(OUT, '층별', floor)
        corridor = next((s for s in items if not s['interior']), None)
        lines = [f'# {floor} 벽·문 에셋', '']
        layout = None
        if corridor:
            lines += [f"복도 화면: [../../{corridor['file']}](../../{corridor['file']})", '']
            walls = [p for p in corridor['used'] if is_wall_or_door(p)]
            for p in walls:
                folder = '문' if is_door(p) else '복도'
                copy(p, os.path.join(base, folder, os.path.basename(p)))
                if folder == '문':  # 문 한 칸짜리 원본
                    copy(os.path.join(os.path.dirname(p), 'source', os.path.basename(p)),
                         os.path.join(base, '문', '원본', os.path.basename(p)))
            bg_dirs = {os.path.dirname(p) for p in walls if re.search(r'/walls[^/]*\.png$', p)}
            for d in bg_dirs:
                path = os.path.join(ROOT, d, 'walls-layout.json')
                if os.path.isfile(path):
                    layout = json.load(open(path, encoding='utf8'))
                    copy(f'{d}/walls-layout.json', os.path.join(base, '복도', 'walls-layout.json'))
                    for seg in layout.get('segments', []):
                        if seg.get('behind'):
                            copy(f"{d}/{seg['behind']}", os.path.join(base, '복도', '유리너머', seg['behind']))
        if layout:
            fill = layout.get('fill', 'wall-concrete')
            lines += ['## 복도 벽 구성 (walls-layout.json)', '',
                      f"빈 구간 기본: **{WALL_NAMES.get(fill, fill)}** (`{fill}`). 구간 양 끝은 기둥(`pilaster`).", '',
                      '| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |', '| --- | --- | --- | --- | --- | --- |']
            rooms = corridor['rooms']
            for seg in layout.get('segments', []):
                room = next((r for r in rooms if r['x'] is not None and abs(r['x'] - seg['x']) < 60), None)
                door = os.path.basename(room['door']) if room and room['door'] else ''
                wall = seg.get('wall', fill)
                lines.append(f"| {seg['x']} | {seg['width']} | {WALL_NAMES.get(wall, wall)} `{wall}` | "
                             f"{room['name'] if room else '-'} | {door or '-'} | {seg.get('behind', '-')} |")
            lines += ['', '다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`', '']
        elif corridor:
            lines += ['이 층 복도는 공용 벽 모듈이 아니라 따로 그린 배경을 쓴다(`복도/` 폴더).', '']
        if corridor and corridor['rooms']:
            lines += ['## 복도의 방 문', '', '| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |', '| --- | --- | --- | --- | --- | --- |']
            for r in corridor['rooms']:
                lines.append(f"| {r['name']} | {r['x']} | {r['width']} | {r['doorX']} | {r['doorWidth']} | {r['door'] or '-'} |")
            lines.append('')
        lines += ['## 방 안', '', '| 방 | 화면 | 배경·문 원본 |', '| --- | --- | --- |']
        for s in (s for s in items if s['interior']):
            folder = os.path.join(base, '방', safe(f"{s['id']}_{s['name']}"))
            files = []
            for p in s['used']:
                if is_wall_or_door(p) and copy(p, os.path.join(folder, os.path.basename(p))):
                    files.append(os.path.basename(p))
            lines.append(f"| {s['name']} | [화면](../../{s['file'].replace(' ', '%20')}) | {', '.join(files) or '-'} |")
        os.makedirs(base, exist_ok=True)
        with open(os.path.join(base, 'README.md'), 'w', encoding='utf8') as f:
            f.write('\n'.join(lines) + '\n')

    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8') as f:
        json.dump(scenes, f, ensure_ascii=False, indent=1)
    floors = sorted(by_floor, key=lambda n: (n[0] != 'B', n))
    commit = subprocess.run(['git', 'log', '-1', '--format=%h %s'], capture_output=True, text=True, encoding='utf8').stdout.strip()
    lines = ['# 에셋 백업 (복도·방 화면 + 벽·문 에셋)', '',
             f'기준: `{commit}` / {time.strftime("%Y-%m-%d")}에 `scripts/capture-asset-backup.py`로 만들었다.', '',
             '- `복도/<층>.png`, `방/<층>/…png`: 게임 화면 그대로(플레이어·UI 숨김, 모든 층 전력 켬, 어두운 방도 밝힘). 높이 720px.',
             '- `모듈/벽`: 공용 벽 모듈(기본벽·투명/불투명/혼합 유리벽·기둥, `2배`는 @2x). 맵에 붙일 때 쓰는 원본.',
             '- `모듈/문`: 공용 문 세트(벽 종류별 여닫이·자동문).',
             '- `층별/<층>/README.md`: 그 층 복도 벽이 어느 구간에 어떤 벽 모듈·문을 쓰는지 표, 실제 파일 복사본(`복도`, `문`, `방`).', '',
             '| 층 | 복도 | 벽·문 정리 | 방 |', '| --- | --- | --- | --- |']
    for floor in floors:
        corridor = ' '.join(f"[{floor}]({s['file']})" for s in by_floor[floor] if not s['interior'])
        rooms = ', '.join(f"[{s['name']}]({s['file'].replace(' ', '%20')})" for s in by_floor[floor] if s['interior'])
        lines.append(f'| {floor} | {corridor or "-"} | [정리](층별/{floor}/README.md) | {rooms or "-"} |')
    with open(os.path.join(OUT, 'README.md'), 'w', encoding='utf8') as f:
        f.write('\n'.join(lines) + '\n')


organize(capture())
