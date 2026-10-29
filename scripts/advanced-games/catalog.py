from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[2];p=root/'public/arcade-30-games.html';s=p.read_text()
games=[('interstellar-armada','Interstellar Armada','WebGL space combat missions and local mission editor. Singleplayer edition; keyboard or touch controls.','GPL-3.0 / CC BY 4.0'),('browserquest-solo','BrowserQuest · Solo Edition','The original BrowserQuest world, enemies and equipment, running locally in a browser Worker. No online multiplayer.','MPL-2.0 / CC BY-SA 3.0'),('openfront-solo','OpenFront · Solo Edition','Territorial strategy against bots. Pinned fully open snapshot; runs locally without official accounts or purchases.','AGPL-3.0 / CC BY-SA 4.0')]
for slug,title,desc,license in games:
 assert (root/'public/arcade/hosted'/slug/'index.html').is_file()
 if f'href="/arcade/hosted/{slug}/index.html' in s:continue
 fragment='#local' if slug=='interstellar-armada' else ''
 card=f'<article class="game" data-category="Strategy"><div class="meta"><span>OPEN SOURCE · LOCALLY HOSTED · SINGLEPLAYER</span><span>{license}</span></div><h2>{title}</h2><p>{desc}</p><div class="license">Original authors credited · Modified source and license included</div><div class="actions"><a class="play" href="/arcade/hosted/{slug}/index.html{fragment}">Play {title}</a><a class="source" href="/arcade/hosted/{slug}/source.html">Complete modified source</a></div></article>'
 needle='<section id="grid" class="grid" aria-label="All locally playable games">';assert needle in s;s=s.replace(needle,needle+'\n'+card,1)
s=re.sub(r'<section aria-label="Selected multiplayer games pending compatibility work".*?</section>','',s,flags=re.S)
s=re.sub(r'<section aria-label="Advanced games in development".*?</section>','',s,flags=re.S)
status='<section aria-label="Remaining requested games"><h2>Remaining requested games</h2><p><strong>Freeciv-web:</strong> needs a native Freeciv server, WebSocket proxy and web application stack; no compatible free Cloudflare runtime is deployed. <strong>Kaetram:</strong> extra project terms restrict AI-related use; clearance is needed for integration with this AI-enabled site. <strong>Space Huggers:</strong> README explicitly says not intended for redistribution despite a GPL file; author clarification is needed. These are not hosted playable imports. BrowserQuest and OpenFront above are solo editions; online multiplayer remains undeployed.</p></section>'
s=s.replace('<div id="count"',status+'<div id="count"',1) if 'aria-label="Remaining requested games"' not in s else s
count=len(re.findall(r'<article class="game"[^>]*>',s));s=re.sub(r'ARCADE × \d+',f'ARCADE × {count}',s);s=re.sub(r'\d+ CABINETS',f'{count} CABINETS',s);s=re.sub(r'\d+ locally hosted game entries',f'{count} locally hosted game entries',s);p.write_text(s)
manifest=root/'public/arcade/advanced-imports.json';manifest.write_text(json.dumps({'games':[{'slug':slug,'title':title,'mode':'singleplayer','license':lic,'route':f'/arcade/hosted/{slug}/index.html'+('#local' if slug=='interstellar-armada' else ''),'source':f'/arcade/hosted/{slug}/source.html'} for slug,title,desc,lic in games]},indent=2)+'\n')
