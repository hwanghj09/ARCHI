"""List the image files the game really loads for some floors, and the files in their folders that nothing loads.

usage (repo root):  python .claude/skills/archi-asset-files/scripts/used_assets.py [floor ...]
  floor = 2 3 10 b1 ... (default: 2 3 4 5 6 8 9 10). Builds every corridor and room scene of those floors in headless
  Chrome (no Node needed), collects <img> sources and CSS background images (incl. ::before/::after), then prints
  USED, MISSING (referenced but not on disk) and UNUSED images under assets/background/floorNN/ and
  assets/objects/floorNN/ (source/ originals and build inputs are listed separately as KEEP-INPUT).
Only stops its own HTTP server and removes its own temp files.
"""
import glob
import html
import json
import os
import subprocess
import sys
import time

floors = sys.argv[1:] or ['2', '3', '4', '5', '6', '8', '9', '10']
ids = [f'b{f[1:]}' if f.lower().startswith('b') else f'f{int(f)}' for f in floors]
CHROME = next((p for p in (r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                           r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') if os.path.exists(p)), None)
assert CHROME, 'Chrome or Edge not found'
page = open('index.html', encoding='utf8').read().replace(
    '<script src="js/main.js" defer></script>', '<script src="js/main.js" defer></script>\n    <script src="ua-probe.js" defer></script>', 1)
open('ua-probe.html', 'w', encoding='utf8').write(page)
open('ua-probe.js', 'w', encoding='utf8').write('''const used = new Set();
const grab = () => { for (const el of dynamicScene.querySelectorAll('*')) {
  if (el.tagName === 'IMG') used.add(el.getAttribute('src'));
  for (const pseudo of [null, '::before', '::after'])
    for (const m of getComputedStyle(el, pseudo).backgroundImage.matchAll(/url\\("?([^"\\)]+)"?\\)/g))
      used.add(decodeURI(m[1]).replace(location.origin + '/', ''));
} };
for (const id of %s) {
  performFloorChange(id, 0); grab();
  for (const r of floorById.get(id).rooms) { if (!floorById.get(r.target)) continue; performFloorChange(r.target, null, 'exit'); grab(); }
}
const pre = document.createElement('pre'); pre.id = 'probe'; pre.textContent = JSON.stringify([...used]); document.body.append(pre);''' % json.dumps(ids))
server = subprocess.Popen([sys.executable, '-m', 'http.server', '8770', '--bind', '127.0.0.1'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1.5)
    dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=20000', '--dump-dom',
                          'http://127.0.0.1:8770/ua-probe.html'], capture_output=True, text=True, encoding='utf8', errors='replace').stdout
finally:
    server.terminate()
    for f in ('ua-probe.html', 'ua-probe.js'):
        if os.path.exists(f):
            os.remove(f)
used = set(json.loads(html.unescape(dom.split('<pre id="probe">')[1].split('</pre>')[0]))) if '<pre id="probe">' in dom else None
assert used is not None, 'probe failed (script error while building scenes?)'
used = {u for u in used if u.startswith('assets/')}
print('USED'); [print('  ' + u) for u in sorted(used)]
print('MISSING'); [print('  ' + u) for u in sorted(used) if not os.path.exists(u)]
print('UNUSED / KEEP-INPUT')
for f in floors:
    tag = f'b{f[1:]}' if f.lower().startswith('b') else f'{int(f):02d}'
    for path in sorted(glob.glob(f'assets/background/floor{tag}/*.png') + glob.glob(f'assets/objects/floor{tag}/**/*.png', recursive=True)):
        p = path.replace('\\', '/')
        if p in used:
            continue
        name = os.path.basename(p)
        keep = '/source/' in p or name.startswith('behind-') or os.path.exists(os.path.join(os.path.dirname(p), 'PROMPT.md')) and \
            name.split('.')[0] in open(os.path.join(os.path.dirname(p), 'PROMPT.md'), encoding='utf8').read()
        print(('  KEEP-INPUT ' if keep else '  UNUSED     ') + p)
