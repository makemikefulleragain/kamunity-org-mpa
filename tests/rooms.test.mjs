import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { handler } from '../site/netlify/functions/kamunity-rooms.mjs';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('public proxy excludes private rooms and fields and bounds malformed query input', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url.origin, 'https://kamunity.ai');
    assert.equal(url.searchParams.get('limit'), '6');
    assert.equal(url.searchParams.get('sort'), 'recent');
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    return { ok: true, json: async () => ({ data: { rooms: [
      { id: 'public/1', isPublic: true, name: 'Public room', memberCount: 3, messages: ['private content'], memberEmails: ['private@example.invalid'] },
      { id: 'private', isPublic: false, name: 'Private room' },
      { id: 'unknown', name: 'Missing public flag' },
    ] } }) };
  };
  const response = await handler({ httpMethod: 'GET', queryStringParameters: { limit: 'invalid', sort: 'invalid' } });
  const data = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].url, 'https://kamunity.ai/room/public%2F1');
  assert.equal(data.items[0].member_count, 3);
  assert.ok(!response.body.includes('private content'));
  assert.ok(!response.body.includes('private@example.invalid'));
});

test('upstream failure returns an explicit empty failure response', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  const response = await handler({ httpMethod: 'GET' });
  assert.equal(response.statusCode, 502);
  assert.deepEqual(JSON.parse(response.body).items, []);
});

test('write methods never contact the upstream service', async () => {
  globalThis.fetch = async () => { throw new Error('must not fetch'); };
  assert.equal((await handler({ httpMethod: 'POST' })).statusCode, 405);
  assert.equal((await handler({ httpMethod: 'OPTIONS' })).statusCode, 204);
});
