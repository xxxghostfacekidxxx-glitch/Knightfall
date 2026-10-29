from pathlib import Path
import json,zipfile
root=Path('public/arcade/hosted')
for slug in ['interstellar-armada','browserquest-solo','openfront-solo']:
 base=root/slug
 for name in ['index.html','UPSTREAM.txt','KNIGHTFALL-CHANGES.md','source.html','source.zip']:assert (base/name).is_file(),(slug,name)
 files=[p for p in base.rglob('*') if p.is_file()]
 assert all(p.stat().st_size<25*1024*1024 for p in files),slug
 for p in base.glob('source*.zip'):
  with zipfile.ZipFile(p) as z:assert z.testzip() is None
 print(slug,len(files),'deployable files; notices and complete source archives present')
a=root/'interstellar-armada'
assert not (a/'assets/sfx/spacecraft/collision.ogg').exists()
assert (a/'assets/sfx/spacecraft/collision-knightfall.wav').read_bytes()[:4]==b'RIFF'
for name in ['data/resources.json','src/data/resources.json']:assert 'spacecraft/collision.ogg' not in (a/name).read_text()
for name in ['config/config.json','src/config/config.json']:
 d=json.loads((a/name).read_text());assert not d['analyticsUrl'] and not d['missionHubUrl']
assert 'KnightfallLocalSocket' in (root/'browserquest-solo/js/gameclient.js').read_text()
print('Pinned import license exclusions and solo transports verified')
