"""Prepare a pinned Armada tree; runtime and GPL source remain together."""
from pathlib import Path
import sys, shutil, json, wave, math, struct
src, dest = map(Path, sys.argv[1:])
if dest.exists(): shutil.rmtree(dest)
dest.mkdir(parents=True)
for name in ['assets','config','css','data','js','src','license']:
 shutil.copytree(src/name,dest/name)
for name in ['index.html','editor.html','LICENSE.txt','README.md','Gruntfile.js','package.json']:
 shutil.copy2(src/name,dest/name)
# Only restricted recording identified by upstream's complete audio credits.
assert 'License: CC BY-NC 4.0' in (src/'license/sfx-license.txt').read_text()
(dest/'assets/sfx/spacecraft/collision.ogg').unlink()
audio=dest/'assets/sfx/spacecraft/collision-knightfall.wav'
with wave.open(str(audio),'wb') as out:
 out.setparams((1,2,22050,0,'NONE','not compressed'))
 out.writeframes(b''.join(struct.pack('<h',int(9000*math.exp(-i/1300)*math.sin(i*.071)*math.sin(i*.019))) for i in range(6615)))
for relative in ['data/resources.json','src/data/resources.json']:
 p=dest/relative;p.write_text(p.read_text().replace('spacecraft/collision.ogg','spacecraft/collision-knightfall.wav'))
for relative in ['config/config.json','src/config/config.json']:
 p=dest/relative;d=json.loads(p.read_text());d['analyticsUrl']='';d['analyticsEnabled']=False;d['missionHubUrl']='';p.write_text(json.dumps(d))
p=dest/'index.html';s=p.read_text().replace('href="/assets/','href="assets/').replace('https://pabitrabanerjee.me/Interstellar-Armada/assets/images/orientation.png','assets/images/orientation.png');s=s.replace('</head>', '<style>[id$="mainMenu.multiplayer"],[id$="singlePlayer.communityMissions"]{display:none!important}</style></head>');p.write_text(s)
(dest/'KNIGHTFALL-CHANGES.md').write_text('''# Knightfall hosting changes — 2026-10-29

Interstellar Armada by Pabitra Banerjee. Code GPL-3.0; artwork and music CC BY 4.0. Full original credits and third-party notices are retained in LICENSE.txt and license/.

The BY-NC collision recording is excluded. A new mathematically synthesized collision-knightfall.wav replaces it (CC0). Resource manifests reference its correct WAV extension. Remote analytics and mission-sharing endpoints are disabled. The launch link uses #local. This release provides singleplayer missions and the local mission editor; upstream multiplayer services are not provided.

Modified preferred-form source is included under src/, with Gruntfile.js and package.json. source.zip contains these code and build inputs; runtime assets are directly available alongside this file. No warranty; redistribution of covered code is under GPL-3.0.
''')
print('Armada prepared:',dest)

# Replace the reporting module as well: a blank URL alone still permits local POSTs.
module='define("modules/analytics",[],function(){return{init:function(){},login:function(){},sendEvent:function(){},isEnabled:function(){return false;},enable:function(){},disable:function(){},setEnabled:function(){}}});'
(dest/'src/js/modules/analytics.js').write_text('// Knightfall: analytics disabled, 2026-10-29.\n'+module)
p=dest/'js/main.js';s=p.read_text();start=s.index('define("modules/analytics"');end=s.index('define(',start+10);s=s[:start]+module[:-1]+',\n'+s[end:];p.write_text(s)
