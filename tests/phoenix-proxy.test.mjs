import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  DEFAULT_PHOENIX_ORIGIN,
  handler,
  resolvePhoenixOrigin,
  validateHttpsOrigin,
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

test('origin resolution: production defaults remain unchanged', () => {
  assert.equal(resolvePhoenixOrigin({}), DEFAULT_PHOENIX_ORIGIN);

  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'production',
      PHOENIX_PREVIEW_ORIGIN: 'https://preview-override.example.org',
    }),
    DEFAULT_PHOENIX_ORIGIN
  );
});

test('origin resolution: preview configuration selects only approved preview origin', () => {
  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'deploy-preview',
      PHOENIX_PREVIEW_ORIGIN: 'https://phoenix-preview-123.netlify.app',
    }),
    'https://phoenix-preview-123.netlify.app'
  );

  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'deploy-preview',
    }),
    DEFAULT_PHOENIX_ORIGIN
  );
});

test('origin resolution: unsafe or malformed origins are rejected', () => {
  assert.equal(validateHttpsOrigin('http://insecure-site.example.org'), null);
  assert.equal(validateHttpsOrigin('javascript:alert(1)'), null);
  assert.equal(validateHttpsOrigin('https://user:pass@evil.example.org'), null);
  assert.equal(validateHttpsOrigin('not-a-valid-url'), null);
  assert.equal(validateHttpsOrigin('https://valid.example.org/path-not-allowed'), null);
  assert.equal(validateHttpsOrigin('https://valid.example.org?query=not-allowed'), null);
  assert.equal(validateHttpsOrigin('https://clean-origin.netlify.app'), 'https://clean-origin.netlify.app');

  assert.equal(
    resolvePhoenixOrigin({
      CONTEXT: 'deploy-preview',
      PHOENIX_PREVIEW_ORIGIN: 'http://insecure-site.example.org',
    }),
    null
  );
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
  process.env.PHOENIX_PREVIEW_ORIGIN = 'http://insecure.example.org';

  const res = await handler({ httpMethod: 'GET', queryStringParameters: { feed: 'news' } });
  assert.equal(res.statusCode, 502);
  assert.equal(JSON.parse(res.body).error, 'invalid_preview_origin_configuration');
});

test('proxy handler: query bounds, upstream calling, and valid payload pass-through', async () => {
  process.env.CONTEXT = 'deploy-preview';
  process.env.PHOENIX_PREVIEW_ORIGIN = 'https://phoenix-preview-abc.netlify.app';

  let capturedUrl = null;
  globalThis.fetch = async (url) => {
    capturedUrl = url;
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
  assert.equal(capturedUrl.origin, 'https://phoenix-preview-abc.netlify.app');
  assert.equal(capturedUrl.pathname, '/.netlify/functions/public-mpa-news');
  assert.equal(capturedUrl.searchParams.get('limit'), '100');
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
