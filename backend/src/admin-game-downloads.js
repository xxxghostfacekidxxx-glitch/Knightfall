import catalog from '../../public/arcade/original-creations.json';
// Private admin game archive delivery. IDs are strictly allowlisted from the reviewed catalog.
export async function serveAdminGameArchive(request, env, getUser) {
  const allowed = new Map(catalog.games.filter(game => /^\/arcade\/hosted\/[a-z0-9-]+\/index\.html$/.test(game.engine) && game.id === game.engine.split('/')[3]).map(game => [game.id, 'admin-game-builds/'+game.id+'.zip']));
  for (const [id, key] of [
    ['sanctuary-original', 'admin-game-builds/sanctuary-original.zip'],
    ['ashfall-infernal-reign-dev', 'admin-game-builds/ashfall-infernal-reign-dev.zip']
  ]) allowed.set(id, key);
  const origin = request.headers.get('Origin');
  const cors = origin === 'https://ash-fall.com' || origin === 'https://www.ash-fall.com' || origin === 'https://knightfall.pages.dev' ? {'access-control-allow-origin':origin,'access-control-allow-credentials':'true','vary':'Origin'} : {};
  const respond = (body, status, headers={}) => new Response(body,{status,headers:{'cache-control':'no-store',...cors,...headers}});
  const url = new URL(request.url);
  const match = /^\/api\/admin\/game-downloads\/([a-z0-9-]+)$/.exec(url.pathname);
  if (!match) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return respond('Method not allowed',405,{allow:'GET, HEAD'});
  const user = await getUser(request, env);
  if (!user) return respond('Sign in required',401);
  if (!['admin','god'].includes(user.role)) return respond('Administrator access required',403);
  const key = allowed.get(match[1]);
  if (!key) return respond('Unknown game',404);
  if (!env.VAULT) return respond('Private game storage not configured',503);
  const object = await env.VAULT.get(key);
  if (!object) return respond('Package not built or uploaded yet',404);
  const headers = new Headers({...cors,
    'content-type':'application/zip',
    'content-disposition': 'attachment; filename="'+match[1]+'.zip"',
    'cache-control':'private, no-store',
    'x-content-type-options':'nosniff',
    'content-length':String(object.size)
  });
  return new Response(request.method==='HEAD'?null:object.body,{status:200,headers});
}
