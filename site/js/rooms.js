/* ============================================================
   KAMUNITY MPA — rooms.js
   Renders public Kamunity.AI rooms and Phoenix room briefs.
   ============================================================ */

(function () {
    'use strict';

    function isMpaDeployPreview() {
        if (typeof window === 'undefined' || !window.location || !window.location.hostname) return false;
        var host = window.location.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') return true;
        return /^deploy-preview-\d+--kamunity-org-mpa\.netlify\.app$/.test(host);
    }
    var PHOENIX_ROOMS_ENDPOINT = window.PHOENIX_ROOMS_ENDPOINT ||
        (isMpaDeployPreview()
            ? '/.netlify/functions/phoenix-proxy?feed=rooms'
            : 'https://phoenix-node.netlify.app/.netlify/functions/public-mpa-rooms');
    var PHOENIX_ROOMS_SCHEMA = 'phoenix-mpa-rooms/v1';
    var KAMUNITY_ROOMS_ENDPOINT = window.KAMUNITY_ROOMS_ENDPOINT ||
        '/.netlify/functions/kamunity-rooms';

    var sectionWrap = document.getElementById('rooms-section-wrap');
    var aiRow = document.getElementById('rooms-ai-row');
    var phoenixRow = document.getElementById('rooms-phoenix-row');
    var aiGroup = document.getElementById('rooms-ai-group');
    var phoenixGroup = document.getElementById('rooms-phoenix-group');
    var status = document.getElementById('rooms-status');

    if (!sectionWrap || !aiRow || !phoenixRow || typeof fetch !== 'function') return;

    function text(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function freshUrl(url) {
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        return url + sep + '_=' + Date.now();
    }

    function fetchJson(url) {
        return fetch(freshUrl(url), {
            cache: 'no-store',
            headers: { Accept: 'application/json' }
        }).then(function (response) {
            if (!response.ok) throw new Error('rooms unavailable');
            return response.json();
        });
    }

    function mapPhoenixRoom(item) {
        var artifact = item.artifact || {};
        var evidence = item.evidence || {};
        var signalCount = Number(evidence.signal_count || 0);
        var sourceCount = Number(evidence.source_count || 0);
        var artifactUrl = text(artifact.url);
        var isLiveRoom = item.kind === 'public_room' && /^https:\/\//i.test(artifactUrl);
        return {
            source: 'phoenix',
            kind: isLiveRoom ? 'public_room' : 'room_brief',
            title: item.title,
            summary: item.summary,
            url: isLiveRoom ? artifactUrl : '',
            action_label: isLiveRoom ? artifact.label || 'Open room' : '',
            meta: signalCount + ' signal' + (signalCount === 1 ? '' : 's') +
                ' · ' + sourceCount + ' source' + (sourceCount === 1 ? '' : 's'),
            eyebrow: isLiveRoom ? 'LIVE ROOM' : 'ROOM BRIEF'
        };
    }

    function mapKamunityRoom(item) {
        var members = Number(item.member_count || 0);
        var vibes = Number(item.vibe_count || 0);
        return {
            source: 'kamunity_ai',
            kind: 'public_room',
            title: item.title,
            summary: item.summary,
            url: item.url,
            action_label: 'Open room',
            meta: members + ' member' + (members === 1 ? '' : 's') +
                (vibes ? ' · ' + vibes + ' vibe' + (vibes === 1 ? '' : 's') : ''),
            eyebrow: 'PUBLIC ROOM'
        };
    }

    function roomIcon(item) {
        if (item.source === 'kamunity_ai') return '◎';
        if (item.kind === 'public_room') return '↗';
        return '✦';
    }

    function renderCard(item) {
        var title = text(item.title) || 'Kamunity room';
        var summary = text(item.summary) || 'A public room or room brief from the Kamunity ecosystem.';
        var candidateUrl = text(item.url);
        var url = /^https:\/\//i.test(candidateUrl) ? candidateUrl : '';
        var actionLabel = text(item.action_label) || (url ? 'Open room' : '');
        var kaiContext = 'I am looking at the Kamunity Rooms card "' + title + '". Can you help me understand who this room is for and whether it is useful for my work?';

        var card = document.createElement('article');
        card.className = 'rooms-card';
        card.innerHTML =
            '<div class="rooms-card-top">' +
                '<span class="rooms-card-icon" aria-hidden="true"></span>' +
                '<span class="rooms-card-eyebrow"></span>' +
            '</div>' +
            '<h4></h4>' +
            '<p></p>' +
            '<div class="rooms-card-meta"></div>' +
            '<div class="rooms-card-actions">' +
                '<span class="rooms-card-action-slot"></span>' +
                '<button class="ask-kai-btn" data-kai-modal type="button">Ask Kai →</button>' +
            '</div>';

        card.querySelector('.rooms-card-icon').textContent = roomIcon(item);
        card.querySelector('.rooms-card-eyebrow').textContent = text(item.eyebrow) || 'ROOM';
        card.querySelector('h4').textContent = title;
        card.querySelector('p').textContent = summary;
        card.querySelector('.rooms-card-meta').textContent = text(item.meta);

        var actionSlot = card.querySelector('.rooms-card-action-slot');
        if (url && actionLabel) {
            var link = document.createElement('a');
            link.className = 'shop-btn rooms-card-link';
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = actionLabel + ' ↗';
            link.setAttribute('aria-label', actionLabel + ' in a new tab: ' + title);
            actionSlot.appendChild(link);
        } else {
            var label = document.createElement('span');
            label.className = 'rooms-card-note';
            label.textContent = 'Brief only';
            actionSlot.appendChild(label);
        }

        var kaiButton = card.querySelector('[data-kai-modal]');
        kaiButton.setAttribute('data-kai-context', kaiContext);
        kaiButton.setAttribute('aria-label', 'Ask Kai about ' + title);
        return card;
    }

    function renderRow(row, group, items) {
        if (!items.length) {
            if (group) group.hidden = true;
            return 0;
        }
        row.innerHTML = '';
        items.slice(0, 3).forEach(function (item) {
            row.appendChild(renderCard(item));
        });
        if (group) group.hidden = false;
        return Math.min(items.length, 3);
    }

    Promise.allSettled([
        fetchJson(KAMUNITY_ROOMS_ENDPOINT + '?limit=3').then(function (payload) {
            return Array.isArray(payload.items) ? payload.items.map(mapKamunityRoom) : [];
        }),
        fetchJson(PHOENIX_ROOMS_ENDPOINT + '?limit=3').then(function (payload) {
            if (!payload || payload.schema_version !== PHOENIX_ROOMS_SCHEMA || !Array.isArray(payload.items)) {
                throw new Error('Unexpected Phoenix rooms feed schema');
            }
            return payload.items.map(mapPhoenixRoom);
        })
    ]).then(function (results) {
        var aiItems = results[0].status === 'fulfilled' ? results[0].value : [];
        var phoenixItems = results[1].status === 'fulfilled' ? results[1].value : [];
        var shown = 0;

        shown += renderRow(aiRow, aiGroup, aiItems);
        shown += renderRow(phoenixRow, phoenixGroup, phoenixItems);

        if (!shown) {
            sectionWrap.hidden = true;
            return;
        }

        if (status) {
            status.textContent = aiItems.length && phoenixItems.length
                ? 'Public rooms from Kamunity.AI and room briefs from Phoenix Node'
                : aiItems.length
                    ? 'Public rooms from Kamunity.AI'
                    : 'Room briefs from Phoenix Node';
        }
        sectionWrap.hidden = false;
    }).catch(function () {
        sectionWrap.hidden = true;
    });
}());
