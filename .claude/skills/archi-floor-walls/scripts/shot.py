"""In-game screenshots without Node: serve the repo, open a copy of index.html in headless Chrome, jump to a scene.

usage (from the repo root):  python .claude/skills/archi-floor-walls/scripts/shot.py <out_dir> <scene@x> [<scene@x> ...]
  scene = floor id (f9, b1) or room id (f9-office); x = world x to stand at (camera centres on it)
Writes <out_dir>/<scene>_<x>.png (1280x720) and prints script errors per shot. Cleans up its temp files and stops
only its own HTTP server.
"""
import os
import subprocess
import sys
import time

ROOT = os.getcwd()
OUT = os.path.abspath(sys.argv[1])
SHOTS = sys.argv[2:]
CHROME = next((p for p in (r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                           r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') if os.path.exists(p)), None)
assert CHROME, 'Chrome or Edge not found'
os.makedirs(OUT, exist_ok=True)

html = open('index.html', encoding='utf8').read()
html = html.replace('<head>', '<head><script>window.__errors=[];window.addEventListener("error",e=>__errors.push(e.message));</script>', 1)
html = html.replace('<script src="js/main.js" defer></script>',
                    '<script src="js/main.js" defer></script>\n    <script src="shot-probe.js" defer></script>', 1)
open('shot-probe.html', 'w', encoding='utf8').write(html)
open('shot-probe.js', 'w', encoding='utf8').write('''const [target, x] = decodeURIComponent(location.hash.slice(1)).split('@');
const isRoom = /-/.test(target);
// 메인 메뉴·오프닝이 화면을 덮고 있으면 장면이 보이지 않으니 걷어 낸다.
document.body.dataset.mainMenu = 'false';
const menu = document.getElementById('main-menu'); if (menu) menu.hidden = true;
try { mainMenuActive = false; } catch (e) {}
delete world.dataset.opening;
performFloorChange(target, isRoom ? null : 0, isRoom ? 'exit' : null);
if (x) { Body.setPosition(body, { x: Number(x), y: floorY - 81 }); cameraX = Math.max(0, Math.min(worldWidth - viewWidth, Number(x) - viewWidth / 2)); }
updateInteraction(); render();
const pre = document.createElement('pre'); pre.id = 'probe'; pre.textContent = JSON.stringify(window.__errors); document.body.append(pre);
''')
server = subprocess.Popen([sys.executable, '-m', 'http.server', '8766', '--bind', '127.0.0.1'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1.5)
    for shot in SHOTS:
        url = f'http://127.0.0.1:8766/shot-probe.html#{shot}'
        png = os.path.join(OUT, shot.replace('@', '_') + '.png')
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--window-size=1280,720', '--virtual-time-budget=8000',
                        f'--screenshot={png}', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=8000', '--dump-dom', url],
                             capture_output=True, text=True, encoding='utf8', errors='replace').stdout
        errors = dom.split('<pre id="probe">')[1].split('</pre>')[0] if '<pre id="probe">' in dom else 'NO PROBE (script failed?)'
        print(shot, '->', png, 'errors', errors)
finally:
    server.terminate()
    for f in ('shot-probe.html', 'shot-probe.js'):
        if os.path.exists(f):
            os.remove(f)
