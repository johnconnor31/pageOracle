// Run with: node --test app/api/chat/rate-limit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, clientIp } from './rate-limit.mjs';

test('allows up to the limit, then blocks until the window resets', () => {
  const check = createRateLimiter({ limit: 2, windowMs: 60_000 });
  assert.equal(check('a', 0).allowed, true);
  assert.equal(check('a', 1).allowed, true);
  const blocked = check('a', 30_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 30);
  assert.equal(check('b', 30_000).allowed, true);
  assert.equal(check('a', 60_000).allowed, true);
});

test('stays bounded when many distinct keys arrive', () => {
  const check = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3 });
  for (const key of ['a', 'b', 'c', 'd', 'e']) assert.equal(check(key, 0).allowed, true);
});

test('reads the client IP from platform headers', () => {
  const req = (headers) => new Request('http://x', { headers });
  assert.equal(clientIp(req({ 'x-real-ip': '1.2.3.4' })), '1.2.3.4');
  assert.equal(clientIp(req({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' })), '5.6.7.8');
  assert.equal(clientIp(req({})), 'unknown');
});
