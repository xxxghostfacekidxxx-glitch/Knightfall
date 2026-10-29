// Private admin game archive delivery. Never expose R2 object keys as user input.
export async function serveAdminGameArchive(request, env, getUser) {
  const allowed = new Map([
    ['sanctuary-original', 'admin-game-builds/sanctuary-original.zip'],
    ['ashfall-infernal-reign-dev', 'admin-game-builds/ashfall-infernal-reign-dev.zip']
  ]);
  const url = new URL(request.url);
  const match = /^\/api\/admin\/game-downloads\/([a-z0-9-]+)$/.exec(url.pathname);
  if (!match) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status:405,headers:{allow:'GET, HEAD'}});
  const user = await getUser(request, env);
  if (!user) return new Response('Sign in required', {status:401,headers:{'cache-control':'no-store'}});
  if (!['admin','god'].includes(user.role)) return new Response('Administrator access required', {status:403,headers:{'cache-control':'no-store'}});
  const key = allowed.get(match[1]);
  if (!key) return new Response('Unknown game', {status:404,headers:{'cache-control':'no-store'}});
  if (!env.VAULT) return new Response('Private game storage not configured', {status:503});
  const object = await env.VAULT.get(key);
  if (!object) return new Response('Package not built or uploaded yet', {status:404,headers:{'cache-control':'no-store'}});
  const headers = new Headers({
    'content-type':'application/zip',
    'content-disposition': 'attachment; filename="'+match[1]+'.zip"',
    'cache-control':'private, no-store',
    'x-content-type-options':'nosniff',
    'content-length':String(object.size)
  });
  return new Response(request.method==='HEAD'?null:object.body,{status:200,headers});
}
