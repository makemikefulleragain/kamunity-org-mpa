/* ============================================================
   KAMUNITY MPA — shop-grid.js
   Renders selected Phoenix tool cards when the API is available.
   Static shop cards remain the no-JS and failure fallback.
   ============================================================ */

(function () {
    'use strict';

    var PHOENIX_TOOLS_ENDPOINT = window.PHOENIX_TOOLS_ENDPOINT ||
        'https://phoenix-node.netlify.app/.netlify/functions/public-mpa-tools';
    var PHOENIX_TOOLS_SCHEMA = 'phoenix-mpa-tools/v1';
    var rowWrap = document.getElementById('commons-shop-row-wrap');
    var row = document.getElementById('commons-shop-row');
    var status = document.getElementById('commons-shop-status');

    if (!rowWrap || !row || typeof fetch !== 'function') return;

    function text(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function normaliseUrl(value) {
        var url = text(value);
        return url.replace(/\/index\.html$/i, '').replace(/\/$/i, '');
    }

    function existingShopUrls() {
        var urls = new Set();
        document.querySelectorAll('#shop a[href]').forEach(function (link) {
            urls.add(normaliseUrl(link.href || link.getAttribute('href')));
        });
        return urls;
    }

    function iconFor(item) {
        var title = text(item.title).toLowerCase();
        var type = text(item.type).toLowerCase();
        if (title.includes('health') || title.includes('check')) return '🌱';
        if (title.includes('volunteer')) return '🤝';
        if (title.includes('ledger') || title.includes('value')) return '📒';
        if (title.includes('compliance') || title.includes('welfare')) return '🧭';
        if (type.includes('quiz') || type.includes('assessment')) return '🔍';
        return '⚒';
    }

    function mapPhoenixTool(item) {
        var artifact = item.artifact || {};
        var evidence = item.evidence || {};
        var tags = Array.isArray(item.tags) ? item.tags : [];
        var evidenceMeta = (evidence.signal_count || 0) + ' signal' + (evidence.signal_count === 1 ? '' : 's') +
            ' · ' + (evidence.source_count || 0) + ' source' + (evidence.source_count === 1 ? '' : 's');

        return {
            title: item.title,
            summary: item.summary,
            output_url: artifact.url,
            type: item.type,
            action_label: artifact.label || 'Open tool',
            sector_tags: tags.length ? tags : [evidenceMeta],
            meta: tags.length ? tags.slice(0, 2).join(' · ') + ' · ' + evidenceMeta : evidenceMeta
        };
    }

    function renderCard(item) {
        var title = text(item.title) || 'Commons tool';
        var summary = text(item.summary) || 'A selected Commons resource from the Kamunity library.';
        var url = text(item.output_url);
        var tags = Array.isArray(item.sector_tags) ? item.sector_tags.slice(0, 3) : [];
        var meta = text(item.meta) || (tags.length ? tags.join(' · ') : text(item.type) || 'Phoenix tool');
        var actionLabel = text(item.action_label) || 'Open tool';
        var kaiContext = 'I am looking at the Kamunity Commons tool "' + title + '". Can you help me understand when and how to use it?';

        var card = document.createElement('div');
        card.className = 'shop-card shop-card--commons';
        card.setAttribute('role', 'listitem');
        card.innerHTML =
            '<span class="shop-card-icon" aria-hidden="true">' + iconFor(item) + '</span>' +
                '<h4></h4>' +
                '<p></p>' +
                '<div class="shop-card-meta"></div>' +
                '<div class="shop-card-actions">' +
                '<a class="shop-btn" target="_blank" rel="noopener noreferrer"></a>' +
                '<button class="ask-kai-btn" data-kai-modal type="button">Ask Kai →</button>' +
            '</div>';

        card.querySelector('h4').textContent = title;
        card.querySelector('p').textContent = summary;
        card.querySelector('.shop-card-meta').textContent = meta;
        card.querySelector('a').href = url;
        card.querySelector('a').textContent = actionLabel + ' →';
        var kaiButton = card.querySelector('[data-kai-modal]');
        kaiButton.setAttribute('data-kai-context', kaiContext);
        kaiButton.setAttribute('aria-label', 'Ask Kai about ' + title);
        return card;
    }

    function showItems(items, mode) {
        var seen = existingShopUrls();
        var cards = [];

        items.forEach(function (item) {
            var url = normaliseUrl(item && item.output_url);
            if (!/^https:\/\//i.test(url) || seen.has(url)) return;
            seen.add(url);
            cards.push(renderCard(item));
        });

        if (!cards.length) return;

        row.innerHTML = '';
        cards.forEach(function (card) { row.appendChild(card); });
        if (status) {
            status.textContent = mode === 'phoenix'
                ? 'Selected from Phoenix Node'
                : 'From the Commons library';
        }
        rowWrap.hidden = false;
    }

    function freshUrl(url) {
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        return url + sep + '_=' + Date.now();
    }

    fetch(freshUrl(PHOENIX_TOOLS_ENDPOINT + '?limit=6'), { cache: 'no-store', headers: { 'Accept': 'application/json' } })
        .then(function (response) {
            if (!response.ok) throw new Error('shop grid unavailable');
            return response.json();
        })
        .then(function (payload) {
            if (!payload || payload.schema_version !== PHOENIX_TOOLS_SCHEMA || !Array.isArray(payload.items)) {
                throw new Error('Unexpected Phoenix tools feed schema');
            }
            var items = payload.items.map(mapPhoenixTool);
            showItems(items, 'phoenix');
        })
        .catch(function () {
            rowWrap.hidden = true;
        });
}());
