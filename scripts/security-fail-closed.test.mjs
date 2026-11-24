import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseRateLimit } from '../backend/src/database-rate-limit.js';
import { checkTurnstile } from '../backend/src/turnstile.js';

test('rate limiter rejects absent, invalid and exhausted results', async () => {
  for (const [row, expected] of [[null,false],[{},false],[{count:0},false],[{count:1},true],[{count:2},true],[{count:3},false]]) {
    const db = { prepare(sql) {
      assert.match(sql, /WHERE request_rate_limits\.reset_at <= \?3 OR request_rate_limits\.count < \?4/);
      return { bind(...args) {
        assert.deepEqual(args, ['test', 61000, 1000, 2]);
        return { first: async () => row };
      }};
    }};
    assert.equal(await databaseRateLimit(db,'test',2,60,1000),expected);
  }
  assert.equal(await databaseRateLimit(null,'test',2,60),false);
});

test('Turnstile fails closed without both keys or valid token', async () => {
  const req = new Request('https://api.ash-fall.com/register');
  for (const env of [{},{TURNSTILE_SITE_KEY:'site'},{TURNSTILE_SECRET_KEY:'secret'}]) {
    assert.equal(await checkTurnstile(env,req,'token'),false);
  }
  const env = {TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'};
  for (const token of [null,'','x'.repeat(2049)]) assert.equal(await checkTurnstile(env,req,token),false);
});

test('Turnstile rejects incorrect action, hostname, staging and upstream failure', async () => {
  const original = globalThis.fetch;
  const env = {TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret',TURNSTILE_STAGING_HOSTNAME:'staging.ash-fall.com'};
  const req = new Request('https://api.ash-fall.com/register');
  try {
    for (const [result,expected] of [
      [{success:true,action:'register',hostname:'ash-fall.com'},true],
      [{success:true,action:'login',hostname:'ash-fall.com'},false],
      [{success:true,action:'register',hostname:'evil.example'},false],
      [{success:true,action:'register',hostname:'staging.ash-fall.com'},false],
      [{success:false,action:'register',hostname:'ash-fall.com'},false]
    ]) {
      globalThis.fetch = async () => Response.json(result);
      assert.equal(await checkTurnstile(env,req,'token'),expected);
    }
    globalThis.fetch = async () => { throw new Error('network'); };
    assert.equal(await checkTurnstile(env,req,'token'),false);
  } finally { globalThis.fetch = original; }
});
