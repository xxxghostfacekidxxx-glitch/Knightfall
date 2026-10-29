from pathlib import Path
import re,sys
root=Path(sys.argv[1]);base='/arcade/hosted/openfront-solo/'
p=root/'webpack.config.js';s=p.read_text().replace('publicPath: "/"',f'publicPath: "{base}"').replace('new ESLintPlugin({\n        context: __dirname,\n      }),','');p.write_text(s)
p=root/'src/core/configuration/ConfigLoader.ts';s=p.read_text();start=s.index('  const response = await fetch("/api/env")');end=s.index('\n}\nexport function getServerConfigFromServer',start);s=s[:start]+'  cachedSC = prodConfig;\n  return cachedSC;'+s[end:];p.write_text(s)
p=root/'src/client/jwt.ts';s=p.read_text();start=s.index('export function getApiBase()');end=s.index('\nfunction getToken()',start);s=s[:start]+f'export function getApiBase() {{ return "{base}offline-api"; }}\n'+s[end:];s=re.sub(r'export function isLoggedIn\(\): [^{]+\{.*?\n\}', 'export function isLoggedIn(): IsLoggedInResponse { return false; }',s,flags=re.S);p.write_text(s)
p=root/'src/client/Cosmetics.ts';s=p.read_text();start=s.index('export async function fetchCosmetics()');end=s.index('export function patternRelationship',start);s=s[:start]+'export async function fetchCosmetics(): Promise<Cosmetics | null> { return null; }\n\n'+s[end:];p.write_text(s)
p=root/'src/client/PublicLobby.ts';s=p.read_text().replace('  connectedCallback() {','  connectedCallback() { return;\n');p.write_text(s)
# Keep all game asset and map requests inside its own mounted directory.
for p in list((root/'src').rglob('*.ts'))+list((root/'src').rglob('*.html')):
 s=p.read_text();s=re.sub(r'([\"\x27`])/(images|flags|maps|lang|sounds|fonts|text|binary|atlases|icons|changelog|commit)(?=[/\.\"\x27`])',lambda m:m[1]+base+m[2],s);p.write_text(s)
p=root/'src/client/index.html';s=p.read_text();s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S);s=re.sub(r'<script>\s*window.dataLayer.*?</script>','',s,flags=re.S);s=s.replace('</head>', '<style>public-lobby,token-login,account-button,#host-lobby-button,#join-private-lobby-button,#chat-button,#territory-patterns-input-preview-button{display:none!important}</style></head>');s=s.replace('<body', '<body',1);s=s.replace('</body>',f'<p style="position:fixed;bottom:0;left:0;z-index:99999;background:#111;color:#fff;font:12px sans-serif;margin:0;padding:4px">Knightfall solo edition · OpenFront.io / OpenFront LLC · AGPL-3.0 code · CC BY-SA 4.0 assets · <a style="color:#c6ff45" href="{base}source.html">Modified source</a> · <a style="color:#ff55d8" href="/arcade-30-games.html">Arcade</a></p></body>');p.write_text(s)
(root/'KNIGHTFALL-CHANGES.md').write_text('''# Knightfall solo edition — 2026-10-29

Pinned OpenFront source: c2cf2ce65f74ac91859f68a84aec89aeda5722ee, before the proprietary asset split documented in LICENSING.md. Code AGPL-3.0; all assets CC BY-SA 4.0. Attribution: OpenFront.io / OpenFront LLC. Original copyright notices retained. This modified edition offers browser-local singleplayer against bots; no public/private multiplayer, login, purchases, advertising, analytics, or official OpenFront API service is provided. Game paths are mounted under openfront-solo. A complete modified source archive with build inputs is supplied as source.zip.
''')

p=root/'src/client/Main.ts';s=p.read_text().replace('window.PageOS.session.newPageView();','void 0; // Knightfall: no advertising page-view reporting.');p.write_text(s)
