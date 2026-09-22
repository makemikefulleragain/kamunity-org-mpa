const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

const KAMUNITY_AI_DISCOVER = 'https://kamunity.ai/api/rooms/discover';

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS, body: '' };
    }
    if (event.httpMethod !== 'GET') {
        return json(405, { error: 'method_not_allowed', allowed: ['GET', 'OPTIONS'] });
    }

    const params = event.queryStringParameters || {};
    const requestedLimit = Number(params.limit || 6);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(Math.trunc(requestedLimit), 12)) : 6;
    const sort = ['recent', 'members', 'vibes'].includes(params.sort) ? params.sort : 'recent';
    const upstreamUrl = new URL(KAMUNITY_AI_DISCOVER);
    upstreamUrl.searchParams.set('limit', String(limit));
    upstreamUrl.searchParams.set('sort', sort);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(upstreamUrl, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });

        if (!response.ok) {
            return json(502, { error: 'kamunity_ai_rooms_unavailable', status: response.status, items: [] });
        }

        const payload = await response.json();
        const rooms = payload && payload.data && Array.isArray(payload.data.rooms)
            ? payload.data.rooms
            : [];

        return json(200, {
            schema_version: 'kamunity-ai-public-rooms/v1',
            generated_at: new Date().toISOString(),
            source: { name: 'Kamunity.AI', public_endpoint: '/api/rooms/discover' },
            items: rooms.map(toPublicRoom).filter(Boolean),
        });
    } catch (error) {
        return json(502, { error: 'kamunity_ai_rooms_unavailable', message: error.message, items: [] });
    } finally {
        clearTimeout(timeout);
    }
};

function toPublicRoom(room) {
    if (!room || room.isPublic !== true || !room.id) return null;
    const title = cleanText(room.name, 120);
    if (!title) return null;

    return removeUndefined({
        id: String(room.id),
        public_id: `kamunity-ai-${room.id}`,
        source: 'kamunity_ai',
        kind: 'public_room',
        title,
        summary: cleanText(room.description, 240),
        url: `https://kamunity.ai/room/${encodeURIComponent(room.id)}`,
        image_preset: cleanText(room.imagePreset, 40),
        member_count: numberOrZero(room.memberCount),
        vibe_count: numberOrZero(room.vibeCount),
        vibes: room.vibes && typeof room.vibes === 'object' ? room.vibes : {},
        updated_at: room.updatedAt || room.createdAt || null,
        created_at: room.createdAt || null,
    });
}

function json(statusCode, body) {
    return {
        statusCode,
        headers: CORS,
        body: JSON.stringify(body),
    };
}

function cleanText(value, maxLength) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!maxLength || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trim()}…`;
}

function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
}

function removeUndefined(value) {
    if (Array.isArray(value)) return value.map(removeUndefined);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value)
            .filter(([, entry]) => entry !== undefined)
            .map(([key, entry]) => [key, removeUndefined(entry)])
    );
}
