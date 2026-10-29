from pathlib import Path
import sys,shutil,json
src,dest,helpers=map(Path,sys.argv[1:])
if dest.exists():shutil.rmtree(dest)
shutil.copytree(src/'client',dest)
shutil.copytree(src/'shared',dest/'shared')
shutil.copytree(src/'server',dest/'server-source')
shutil.copy2(src/'LICENSE',dest/'LICENSE')
shutil.copy2(helpers/'bq-socket.js',dest/'knightfall-socket.js')
for name in ['config_build.json','config_local.json']:
 (dest/'config'/name).write_text(json.dumps({'host':'solo','port':0,'dispatcher':False}))
p=dest/'js/gameclient.js';s=p.read_text();start=s.index('            if(window.MozWebSocket)');end=s.index('            if(dispatcherMode)',start);s=s[:start]+'            this.connection = new window.KnightfallLocalSocket();\n\n'+s[end:];p.write_text(s)
p=dest/'index.html';s=p.read_text().replace('A Massively Multiplayer Adventure','A Browser-Local Solo Adventure').replace('<script src="js/lib/log.js">','<script src="knightfall-socket.js"></script>\n<script src="js/lib/log.js">');p.write_text(s)
for p in (dest/'js').glob('*.js'):
 s=p.read_text();p.write_text(s.replace('../../shared/js/gametypes','../shared/js/gametypes'))
(dest/'KNIGHTFALL-CHANGES.md').write_text('''# BrowserQuest — Knightfall solo edition, 2026-10-29

Original game by Little Workshop for Mozilla. Code MPL 2.0; content CC BY-SA 3.0. Original credits and LICENSE retained.

This edition runs the original world simulation in a browser Web Worker with a local transport. Exploration, enemies, equipment, and chests remain local to the player. It is singleplayer, without an online multiplayer service. Original server sources are in server-source/; modified transport and source archive are included. Browser character saves remain local. This is a modified edition, not an official Mozilla service.
''')
