/* ============================================================
   KAMUNITY MPA — shop-grid.js
   Renders selected Commons shop-grid cards when the API is available.
   Static shop cards remain the no-JS and failure fallback.
   ============================================================ */

(function () {
    'use strict';

    var API_URL = 'https://community-signal.netlify.app/.netlify/functions/door-shop-grid-read?limit=12';
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

    function renderCard(item) {
        var title = text(item.title) || 'Commons tool';
        var summary = text(item.summary) || 'A selected Commons resource from the Kamunity library.';
        var url = text(item.output_url);
        var tags = Array.isArray(item.sector_tags) ? item.sector_tags.slice(0, 3) : [];
        var meta = tags.length ? tags.join(' · ') : text(item.type) || 'commons tool';
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
                '<a class="shop-btn" target="_blank" rel="noopener noreferrer">Open tool →</a>' +
                '<button class="ask-kai-btn" data-kai-modal type="button">Ask Kai →</button>' +
            '</div>';

        card.querySelector('h4').textContent = title;
        card.querySelector('p').textContent = summary;
        card.querySelector('.shop-card-meta').textContent = meta;
        card.querySelector('a').href = url;
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
            if (!url || seen.has(url)) return;
            seen.add(url);
            cards.push(renderCard(item));
        });

        if (!cards.length) return;

        row.innerHTML = '';
        cards.forEach(function (card) { row.appendChild(card); });
        if (status) {
            status.textContent = mode === 'selected'
                ? 'Selected from the Commons library'
                : 'From the Commons library';
        }
        rowWrap.hidden = false;
    }

    fetch(API_URL, { headers: { 'Accept': 'application/json' } })
        .then(function (response) {
            if (!response.ok) throw new Error('shop grid unavailable');
            return response.json();
        })
        .then(function (payload) {
            showItems(Array.isArray(payload.items) ? payload.items : [], payload.mode);
        })
        .catch(function () {
            rowWrap.hidden = true;
        });
}());
