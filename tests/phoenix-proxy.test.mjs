import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  DEFAULT_PHOENIX_ORIGIN,
  handler,
  resolvePhoenixOrigin,
  validateHttpsNetlifyOrigin,
} from '../site/netlify/functions/phoenix-proxy.mjs';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.CONTEXT;
  delete process.env.PHOENIX_PREVIEW_ORIGIN;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
});

test('origin resolution: non-deploy-preview contexts strictly ignore the preview override', () => {
  // Undefined context defaults to production origin
  assert.equal(
    resolvePhoenixOrigin({ PHOENIX_PREVIEW_ORIGIN: 'https://preview-override.netlify.app' }),
    DEFAULT_PHOENIX_ORIGIN
  );

  // Production context strictly ignores PHOENIX_PREVIEW_ORIGIN
  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'production',
      PHOENIX_PREVIEW_ORIGIN: 'https://preview-override.netlify.app',
    }),
    DEFAULT_PHOENIX_ORIGIN
  );

  // Branch-deploy context strictly ignores PHOENIX_PREVIEW_ORIGIN
  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'branch-deploy',
      PHOENIX_PREVIEW_ORIGIN: 'https://preview-override.netlify.app',
    }),
    DEFAULT_PHOENIX_ORIGIN
  );
});

test('origin resolution: deploy-preview context honors exact expected Netlify preview origin', () => {
  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'deploy-preview',
      PHOENIX_PREVIEW_ORIGIN: 'https://phoenix-preview-temp.netlify.app',
    }),
    'https://phoenix-preview-temp.netlify.app'
  );

  // Deploy preview without override falls back safely to production default
  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'deploy-preview',
    }),
    DEFAULT_PHOENIX_ORIGIN
  );
});

test('origin resolution: arbitrary HTTPS domains and non-Netlify origins are rejected', () => {
  assert.equal(validateHttpsNetlifyOrigin('https://evil-attacker.com'), null);
  assert.equal(validateHttpsNetlifyOrigin('https://example.org'), null);
  assert.equal(validateHttpsNetlifyOrigin('https://phoenix-node.com'), null);
  assert.equal(validateHttpsNetlifyOrigin('https://kamunity.org'), null);
});

test('origin resolution: localhost, IP addresses, ports and malformed inputs are rejected', () => {
  assert.equal(validateHttpsNetlifyOrigin('http://phoenix-preview.netlify.app'), null); // Insecure HTTP
  assert.equal(validateHttpsNetlifyOrigin('https://localhost'), null);
  assert.equal(validateHttpsNetlifyOrigin('https://localhost:8888'), null);
  assert.equal(validateHttpsNetlifyOrigin('https://127.0.0.1'), null);
  assert.equal(validateHttpsNetlifyOrigin('https://192.168.1.100.netlify.app'), null); // Raw IP
  assert.equal(validateHttpsNetlifyOrigin('https://phoenix.netlify.app:8443'), null); // Non-default port
  assert.equal(validateHttpsNetlifyOrigin('https://user:pass@phoenix.netlify.app'), null); // Credentials
  assert.equal(validateHttpsNetlifyOrigin('https://phoenix.netlify.app/path'), null); // Path present
  assert.equal(validateHttpsNetlifyOrigin('https://phoenix.netlify.app?q=1'), null); // Query present
  assert.equal(validateHttpsNetlifyOrigin('not-a-url'), null);
});

test('proxy handler: method restrictions are enforced', async () => {
  globalThis.fetch = async () => { throw new Error('must not fetch'); };

  const postRes = await handler({ httpMethod: 'POST' });
  assert.equal(postRes.statusCode, 405);

  const optionsRes = await handler({ httpMethod: 'OPTIONS' });
  assert.equal(optionsRes.statusCode, 204);
});

test('proxy handler: invalid feed parameter returns 400', async () => {
  globalThis.fetch = async () => { throw new Error('must not fetch'); };

  const res = await handler({ httpMethod: 'GET', queryStringParameters: { feed: 'unsupported' } });
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_feed');
});

test('proxy handler: invalid preview origin returns 502 with masked error', async () => {
  process.env.CONTEXT = 'deploy-preview';
  process.env.PHOENIX_PREVIEW_ORIGIN = 'https://non-netlify-domain.org';

  const res = await handler({ httpMethod: 'GET', queryStringParameters: { feed: 'news' } });
  assert.equal(res.statusCode, 502);
  assert.equal(JSON.parse(res.body).error, 'invalid_preview_origin_configuration');
});

test('proxy handler: redirects fail with a masked 502', async () => {
  process.env.CONTEXT = 'deploy-preview';
  process.env.PHOENIX_PREVIEW_ORIGIN = 'https://phoenix-preview-temp.netlify.app';

  globalThis.fetch = async (url, options) => {
    assert.equal(options.redirect, 'error');
    // Simulate fetch throwing when redirect is encountered
    const err = new TypeError('Failed to fetch: redirect mode is error');
    throw err;
  };

  const res = await handler({ httpMethod: 'GET', queryStringParameters: { feed: 'news' } });
  assert.equal(res.statusCode, 502);
  const data = JSON.parse(res.body);
  assert.equal(data.error, 'phoenix_feed_unavailable');
  assert.deepEqual(data.items, []);
  assert.equal(data.message, undefined); // Masked
});

test('proxy handler: query bounds, upstream calling, and valid payload pass-through', async () => {
  process.env.CONTEXT = 'deploy-preview';
  process.env.PHOENIX_PREVIEW_ORIGIN = 'https://phoenix-preview-temp.netlify.app';

  let capturedUrl = null;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    assert.equal(options.redirect, 'error');
    return {
      ok: true,
      json: async () => ({
        schema_version: 'phoenix-mpa-news/v1',
        generated_at: '2026-09-21T00:00:00.000Z',
        items: [{ id: 'item-1', title: 'Preview News' }],
      }),
    };
  };

  const res = await handler({
    httpMethod: 'GET',
    queryStringParameters: { feed: 'news', limit: '999', story_id: 'story-123' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(capturedUrl.origin, 'https://phoenix-preview-temp.netlify.app');
  assert.equal(capturedUrl.pathname, '/.netlify/functions/public-mpa-news');
  assert.equal(capturedUrl.searchParams.get('limit'), '100'); // Capped at maxLimit 100
  assert.equal(capturedUrl.searchParams.get('story_id'), 'story-123');

  const data = JSON.parse(res.body);
  assert.equal(data.schema_version, 'phoenix-mpa-news/v1');
  assert.equal(data.items.length, 1);
});

test('proxy handler: schema mismatch returns 502 with masked error', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'wrong-version/v99',
      items: [{ id: 'bad' }],
    }),
  });

  const res = await handler({ httpMethod: 'GET', queryStringParameters: { feed: 'tools' } });
  assert.equal(res.statusCode, 502);
  const data = JSON.parse(res.body);
  assert.equal(data.error, 'phoenix_feed_schema_mismatch');
  assert.deepEqual(data.items, []);
});

test('proxy handler: upstream failure returns 502 with masked error', async () => {
  globalThis.fetch = async () => {
    throw new Error('connection reset by peer');
  };

  const res = await handler({ httpMethod: 'GET', queryStringParameters: { feed: 'rooms' } });
  assert.equal(res.statusCode, 502);
  const data = JSON.parse(res.body);
  assert.equal(data.error, 'phoenix_feed_unavailable');
  assert.deepEqual(data.items, []);
  assert.equal(data.message, undefined);
});
