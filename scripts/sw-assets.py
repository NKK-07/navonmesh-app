# Regenerate the service worker's precache list from what is actually on disk.
#
# It listed 14 files while the app has around 30 modules, so an "offline first"
# app was missing most of itself the moment the network went. Anything added to
# app/src from now on is picked up by re-running this.
import io, os, re

ROOT = 'app'
files = []
for root, _, names in os.walk(os.path.join(ROOT, 'src')):
    for n in sorted(names):
        if n.endswith('.js') or n.endswith('.css'):
            rel = os.path.relpath(os.path.join(root, n), ROOT)
            files.append('./' + rel.replace(os.sep, '/'))

ordered = ['./', './index.html', './manifest.json'] + sorted(files) \
        + ['./icon-192.png', './icon-badge.png']

path = os.path.join(ROOT, 'sw.js')
src = io.open(path, encoding='utf-8').read()
start = src.index('const ASSETS = [')
end = src.index('];', start) + 2

body = 'const ASSETS = [\n' + '\n'.join("  '%s'," % a for a in ordered)
body = body.rstrip(',') + '\n];'

io.open(path, 'w', encoding='utf-8', newline='').write(src[:start] + body + src[end:])
print('precache now lists %d files' % len(ordered))
