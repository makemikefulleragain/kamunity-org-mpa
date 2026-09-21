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
    if (!env || env.CONTEXT === 'production' || !env.CONTEXT) {
        return DEFAULT_PHOENIX_ORIGIN;
    }

    const configuredOrigin = env.PHOENIX_PREVIEW_ORIGIN;
    if (!configuredOrigin) {
        return DEFAULT_PHOENIX_ORIGIN;
    }

    return validateHttpsOrigin(configuredOrigin);
}

export function validateHttpsOrigin(candidate) {
    try {
        const url = new URL(candidate);
        if (url.protocol !== 'https:') return null;
        if (url.username || url.password) return null;
        if (url.pathname !== '/' && url.pathname !== '') return null;
        if (url.search || url.hash) return null;
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
