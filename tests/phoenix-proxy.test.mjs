import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  DEFAULT_PHOENIX_ORIGIN,
  DEPLOY_PREVIEW_HOST_PATTERN,
  PRODUCTION_MPA_HOSTS,
  extractRequestHost,
  handler,
  resolvePhoenixOrigin,
  validateHttpsNetlifyOrigin,
} from "../site/netlify/functions/phoenix-proxy.mjs";

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

test("host extraction: extracts hostname from rawUrl or headers and strips port", () => {
  assert.equal(
    extractRequestHost({ rawUrl: "https://deploy-preview-1--kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=news" }),
    "deploy-preview-1--kamunity-org-mpa.netlify.app"
  );
  assert.equal(
    extractRequestHost({ rawUrl: "https://KAMUNITY-ORG-MPA.NETLIFY.APP/path" }),
    "kamunity-org-mpa.netlify.app"
  );
  assert.equal(
    extractRequestHost({ headers: { host: "kamunity.org:443" } }),
    "kamunity.org"
  );
  assert.equal(
    extractRequestHost({ headers: { "x-forwarded-host": "deploy-preview-42--kamunity-org-mpa.netlify.app" } }),
    "deploy-preview-42--kamunity-org-mpa.netlify.app"
  );
  assert.equal(extractRequestHost(null), null);
  assert.equal(extractRequestHost({}), null);
});

test("origin resolution: production hosts strictly ignore any preview override", () => {
  const previewEnv = { PHOENIX_PREVIEW_ORIGIN: "https://phoenix-preview-synthetic.netlify.app" };

  for (const host of PRODUCTION_MPA_HOSTS) {
    // Passing host directly
    assert.equal(resolvePhoenixOrigin(host, previewEnv), DEFAULT_PHOENIX_ORIGIN);
    // Passing event with rawUrl
    assert.equal(
      resolvePhoenixOrigin({ rawUrl: `https://${host}/.netlify/functions/phoenix-proxy` }, previewEnv),
      DEFAULT_PHOENIX_ORIGIN
    );
    // Passing event with host header
    assert.equal(
      resolvePhoenixOrigin({ headers: { host } }, previewEnv),
      DEFAULT_PHOENIX_ORIGIN
    );
  }
});

test("origin resolution: exact deploy-preview host uses configured synthetic origin", () => {
  const previewEnv = { PHOENIX_PREVIEW_ORIGIN: "https://phoenix-preview-synthetic-4c75543.netlify.app" };

  assert.equal(
    resolvePhoenixOrigin("deploy-preview-1--kamunity-org-mpa.netlify.app", previewEnv),
    "https://phoenix-preview-synthetic-4c75543.netlify.app"
  );
  assert.equal(
    resolvePhoenixOrigin("deploy-preview-999--kamunity-org-mpa.netlify.app", previewEnv),
    "https://phoenix-preview-synthetic-4c75543.netlify.app"
  );
  assert.equal(
    resolvePhoenixOrigin(
      { rawUrl: "https://deploy-preview-1--kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=news" },
      previewEnv
    ),
    "https://phoenix-preview-synthetic-4c75543.netlify.app"
  );
});

test("origin resolution: deploy-preview host with absent or invalid configuration fails closed", () => {
  const previewHost = "deploy-preview-1--kamunity-org-mpa.netlify.app";

  // Absent variable -> fails closed (null, not production origin)
  assert.equal(resolvePhoenixOrigin(previewHost, {}), null);
  assert.equal(resolvePhoenixOrigin(previewHost, { PHOENIX_PREVIEW_ORIGIN: "" }), null);

  // Invalid preview origin -> fails closed
  assert.equal(resolvePhoenixOrigin(previewHost, { PHOENIX_PREVIEW_ORIGIN: "http://insecure.netlify.app" }), null);
  assert.equal(resolvePhoenixOrigin(previewHost, { PHOENIX_PREVIEW_ORIGIN: "https://evil.com" }), null);
  assert.equal(resolvePhoenixOrigin(previewHost, { PHOENIX_PREVIEW_ORIGIN: "https://192.168.1.1.netlify.app" }), null);
  assert.equal(resolvePhoenixOrigin(previewHost, { PHOENIX_PREVIEW_ORIGIN: "https://preview.netlify.app:8443" }), null);
  assert.equal(resolvePhoenixOrigin(previewHost, { PHOENIX_PREVIEW_ORIGIN: "https://preview.netlify.app/subpath" }), null);
});

test("origin resolution: forged or unrelated hosts fail closed", () => {
  const previewEnv = { PHOENIX_PREVIEW_ORIGIN: "https://phoenix-preview-synthetic.netlify.app" };

  // Forged deploy preview names
  assert.equal(resolvePhoenixOrigin("deploy-preview-1--other-site.netlify.app", previewEnv), null);
  assert.equal(resolvePhoenixOrigin("deploy-preview-abc--kamunity-org-mpa.netlify.app", previewEnv), null);
  assert.equal(resolvePhoenixOrigin("fake-deploy-preview-1--kamunity-org-mpa.netlify.app", previewEnv), null);
  assert.equal(resolvePhoenixOrigin("deploy-preview-1--kamunity-org-mpa.netlify.app.attacker.com", previewEnv), null);

  // Unrelated hosts
  assert.equal(resolvePhoenixOrigin("evil.com", previewEnv), null);
  assert.equal(resolvePhoenixOrigin("kamunity-consulting.com", previewEnv), null);
  assert.equal(resolvePhoenixOrigin("random.netlify.app", previewEnv), null);
  assert.equal(resolvePhoenixOrigin(null, previewEnv), null);
  assert.equal(resolvePhoenixOrigin("", previewEnv), null);
});

test("origin validation: arbitrary HTTPS domains and non-Netlify origins are rejected", () => {
  assert.equal(validateHttpsNetlifyOrigin("https://evil-attacker.com"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://example.org"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://phoenix-node.com"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://kamunity.org"), null);
});

test("origin validation: localhost, IP addresses, ports and malformed inputs are rejected", () => {
  assert.equal(validateHttpsNetlifyOrigin("http://phoenix-preview.netlify.app"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://localhost"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://localhost:8888"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://127.0.0.1"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://192.168.1.100.netlify.app"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://phoenix.netlify.app:8443"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://user:pass@phoenix.netlify.app"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://phoenix.netlify.app/path"), null);
  assert.equal(validateHttpsNetlifyOrigin("https://phoenix.netlify.app?q=1"), null);
  assert.equal(validateHttpsNetlifyOrigin("not-a-url"), null);
});

test("proxy handler: method restrictions are enforced", async () => {
  globalThis.fetch = async () => { throw new Error("must not fetch"); };

  const postRes = await handler({ httpMethod: "POST" });
  assert.equal(postRes.statusCode, 405);

  const optionsRes = await handler({ httpMethod: "OPTIONS" });
  assert.equal(optionsRes.statusCode, 204);
});

test("proxy handler: invalid feed parameter returns 400", async () => {
  globalThis.fetch = async () => { throw new Error("must not fetch"); };

  const res = await handler({ httpMethod: "GET", queryStringParameters: { feed: "unsupported" } });
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, "invalid_feed");
});

test("proxy handler: unrecognised host returns 502 with masked error", async () => {
  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://evil-unrecognised-host.com/.netlify/functions/phoenix-proxy?feed=news",
    queryStringParameters: { feed: "news" },
  });
  assert.equal(res.statusCode, 502);
  assert.equal(JSON.parse(res.body).error, "invalid_preview_origin_configuration");
});

test("proxy handler: deploy preview host with invalid or missing preview origin returns 502", async () => {
  process.env.PHOENIX_PREVIEW_ORIGIN = "https://non-netlify-domain.org";

  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://deploy-preview-1--kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=news",
    queryStringParameters: { feed: "news" },
  });
  assert.equal(res.statusCode, 502);
  assert.equal(JSON.parse(res.body).error, "invalid_preview_origin_configuration");
});

test("proxy handler: deploy preview host with valid preview origin forwards correctly", async () => {
  process.env.PHOENIX_PREVIEW_ORIGIN = "https://phoenix-preview-synthetic-4c75543.netlify.app";

  let capturedUrl = null;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    assert.equal(options.redirect, "error");
    return {
      ok: true,
      json: async () => ({
        schema_version: "phoenix-mpa-news/v1",
        generated_at: "2026-09-22T00:00:00.000Z",
        items: [{ id: "item-preview", title: "Synthetic preview — Story" }],
      }),
    };
  };

  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://deploy-preview-1--kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=news&limit=10&story_id=story-1",
    queryStringParameters: { feed: "news", limit: "10", story_id: "story-1" },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(capturedUrl.origin, "https://phoenix-preview-synthetic-4c75543.netlify.app");
  assert.equal(capturedUrl.pathname, "/.netlify/functions/public-mpa-news");
  assert.equal(capturedUrl.searchParams.get("limit"), "10");
  assert.equal(capturedUrl.searchParams.get("story_id"), "story-1");
  const data = JSON.parse(res.body);
  assert.equal(data.schema_version, "phoenix-mpa-news/v1");
  assert.equal(data.items[0].title, "Synthetic preview — Story");
});

test("proxy handler: production host ignores preview override and uses default origin", async () => {
  process.env.PHOENIX_PREVIEW_ORIGIN = "https://phoenix-preview-synthetic-4c75543.netlify.app";

  let capturedUrl = null;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    return {
      ok: true,
      json: async () => ({
        schema_version: "phoenix-mpa-news/v1",
        generated_at: "2026-09-22T00:00:00.000Z",
        items: [{ id: "prod-item", title: "Production Story" }],
      }),
    };
  };

  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=news",
    queryStringParameters: { feed: "news" },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(capturedUrl.origin, DEFAULT_PHOENIX_ORIGIN);
  assert.equal(capturedUrl.pathname, "/.netlify/functions/public-mpa-news");
});

test("proxy handler: redirects fail with a masked 502", async () => {
  process.env.PHOENIX_PREVIEW_ORIGIN = "https://phoenix-preview-synthetic-4c75543.netlify.app";

  globalThis.fetch = async (url, options) => {
    assert.equal(options.redirect, "error");
    throw new TypeError("Failed to fetch: redirect mode is error");
  };

  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://deploy-preview-1--kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=news",
    queryStringParameters: { feed: "news" },
  });
  assert.equal(res.statusCode, 502);
  const data = JSON.parse(res.body);
  assert.equal(data.error, "phoenix_feed_unavailable");
  assert.deepEqual(data.items, []);
  assert.equal(data.message, undefined);
});

test("proxy handler: schema mismatch returns 502 with masked error", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      schema_version: "wrong-version/v99",
      items: [{ id: "bad" }],
    }),
  });

  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=tools",
    queryStringParameters: { feed: "tools" },
  });
  assert.equal(res.statusCode, 502);
  const data = JSON.parse(res.body);
  assert.equal(data.error, "phoenix_feed_schema_mismatch");
  assert.deepEqual(data.items, []);
});

test("proxy handler: upstream failure returns 502 with masked error", async () => {
  globalThis.fetch = async () => {
    throw new Error("connection reset by peer");
  };

  const res = await handler({
    httpMethod: "GET",
    rawUrl: "https://kamunity-org-mpa.netlify.app/.netlify/functions/phoenix-proxy?feed=rooms",
    queryStringParameters: { feed: "rooms" },
  });
  assert.equal(res.statusCode, 502);
  const data = JSON.parse(res.body);
  assert.equal(data.error, "phoenix_feed_unavailable");
  assert.deepEqual(data.items, []);
  assert.equal(data.message, undefined);
});

test("client query builder helper: correctly constructs URLs without duplicate question marks", () => {
  function buildFeedUrl(endpoint, params) {
    var sep = endpoint.indexOf("?") === -1 ? "?" : "&";
    var parts = [];
    if (params) {
      for (var key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined && params[key] !== null) {
          parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
        }
      }
    }
    parts.push("_=12345");
    return endpoint + sep + parts.join("&");
  }

  // 1. Proxy endpoint with existing ?feed=news
  const proxyUrl = buildFeedUrl("/.netlify/functions/phoenix-proxy?feed=news", { limit: 6 });
  assert.equal(proxyUrl, "/.netlify/functions/phoenix-proxy?feed=news&limit=6&_=12345");
  assert.equal(proxyUrl.split("?").length, 2, "must contain exactly one question mark");

  // 2. Direct Phoenix endpoint with no existing query
  const directUrl = buildFeedUrl("https://phoenix-node.netlify.app/.netlify/functions/public-mpa-news", { limit: 30 });
  assert.equal(directUrl, "https://phoenix-node.netlify.app/.netlify/functions/public-mpa-news?limit=30&_=12345");
  assert.equal(directUrl.split("?").length, 2, "must contain exactly one question mark");

  // 3. Story modal with story_id parameter
  const storyUrl = buildFeedUrl("/.netlify/functions/phoenix-proxy?feed=news", { story_id: "story-abc-123" });
  assert.equal(storyUrl, "/.netlify/functions/phoenix-proxy?feed=news&story_id=story-abc-123&_=12345");
  assert.equal(storyUrl.split("?").length, 2, "must contain exactly one question mark");
});
