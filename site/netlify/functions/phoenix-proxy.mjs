const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

export const DEFAULT_PHOENIX_ORIGIN = 'https://phoenix-node.netlify.app';

const ALLOWED_FEEDS = {
    news: {
        path: '/.netlify/functions/public-mpa-news',
        schemaVersion: 'phoenix-mpa-news/v1',
        defaultLimit: 30,
        maxLimit: 100,
    },
    rooms: {
        path: '/.netlify/functions/public-mpa-rooms',
        schemaVersion: 'phoenix-mpa-rooms/v1',
        defaultLimit: 6,
        maxLimit: 24,
    },
    tools: {
        path: '/.netlify/functions/public-mpa-tools',
        schemaVersion: 'phoenix-mpa-tools/v1',
        defaultLimit: 6,
        maxLimit: 24,
    },
};

export function resolvePhoenixOrigin(env = process.env) {
    // Only deploy-preview context may honor a preview origin override
    if (!env || env.CONTEXT !== 'deploy-preview') {
        return DEFAULT_PHOENIX_ORIGIN;
    }

    const configuredOrigin = env.PHOENIX_PREVIEW_ORIGIN;
    if (!configuredOrigin) {
        return DEFAULT_PHOENIX_ORIGIN;
    }

    return validateHttpsNetlifyOrigin(configuredOrigin);
}

export function validateHttpsNetlifyOrigin(candidate) {
    if (typeof candidate !== 'string') return null;
    const trimmed = candidate.trim();
    if (!trimmed) return null;

    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:') return null;
        if (url.username || url.password) return null;
        if (url.port) return null;
        if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) return null;

        const hostname = url.hostname.toLowerCase();

        // Must end strictly with .netlify.app
        if (!hostname.endsWith('.netlify.app')) return null;

        // Reject raw IPs and localhost
        if (/^[\d.]+$/.test(hostname) || hostname.includes(':') || hostname.startsWith('[')) return null;
        if (hostname.includes('localhost')) return null;

        const subdomain = hostname.slice(0, -'.netlify.app'.length);
        if (!subdomain) return null;

        // Reject IP-like or purely numeric subdomains
        if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(subdomain) || /^[\d.]+$/.test(subdomain)) {
            return null;
        }

        // Valid Netlify subdomain characters: letters, numbers, hyphens
        if (!/^[a-z0-9]+([a-z0-9-]*[a-z0-9]+)?(\.[a-z0-9]+([a-z0-9-]*[a-z0-9]+)?)*$/.test(subdomain)) {
            return null;
        }

        return url.origin;
    } catch {
        return null;
    }
}

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS, body: '' };
    }
    if (event.httpMethod !== 'GET') {
        return json(405, { error: 'method_not_allowed', allowed: ['GET', 'OPTIONS'] });
    }

    const params = event.queryStringParameters || {};
    const feedName = String(params.feed || '').toLowerCase().trim();
    const feedConfig = ALLOWED_FEEDS[feedName];

    if (!feedConfig) {
        return json(400, {
            error: 'invalid_feed',
            message: 'feed parameter must be one of: news, rooms, tools',
        });
    }

    const origin = resolvePhoenixOrigin(process.env);
    if (!origin) {
        return json(502, {
            error: 'invalid_preview_origin_configuration',
            feed: feedName,
            items: [],
        });
    }

    const requestedLimit = Number(params.limit);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), feedConfig.maxLimit)
        : feedConfig.defaultLimit;

    const upstreamUrl = new URL(feedConfig.path, origin);
    upstreamUrl.searchParams.set('limit', String(limit));

    if (feedName === 'news' && params.story_id) {
        upstreamUrl.searchParams.set('story_id', String(params.story_id).slice(0, 100));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(upstreamUrl, {
            headers: { Accept: 'application/json' },
            redirect: 'error',
            signal: controller.signal,
        });

        if (!response.ok) {
            return json(502, {
                error: 'phoenix_feed_unavailable',
                feed: feedName,
                status: response.status,
                items: [],
            });
        }

        const payload = await response.json();

        if (!payload || payload.schema_version !== feedConfig.schemaVersion || !Array.isArray(payload.items)) {
            return json(502, {
                error: 'phoenix_feed_schema_mismatch',
                feed: feedName,
                items: [],
            });
        }

        return json(200, payload);
    } catch (error) {
        return json(502, {
            error: 'phoenix_feed_unavailable',
            feed: feedName,
            items: [],
        });
    } finally {
        clearTimeout(timeout);
    }
};

function json(statusCode, body) {
    return {
        statusCode,
        headers: CORS,
        body: JSON.stringify(body),
    };
}
