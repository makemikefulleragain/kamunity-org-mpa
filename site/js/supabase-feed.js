/* ============================================================
   KAMUNITY MPA — supabase-feed.js
   Fetches latest public Phoenix stories for the homepage excerpt.
   Static fallback if unavailable (Doug Test)
   No data sent. Read-only. Constitutional Principle 5.
   ============================================================ */

(function () {
    'use strict';

    function isMpaDeployPreview() {
        if (typeof window === 'undefined' || !window.location || !window.location.hostname) return false;
        var host = window.location.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') return true;
        return /^deploy-preview-\d+--kamunity-org-mpa\.netlify\.app$/.test(host);
    }
    var PHOENIX_NEWS_ENDPOINT = window.PHOENIX_NEWS_ENDPOINT ||
        (isMpaDeployPreview()
            ? '/.netlify/functions/phoenix-proxy?feed=news'
            : 'https://phoenix-node.netlify.app/.netlify/functions/public-mpa-news');
    var PHOENIX_NEWS_SCHEMA = 'phoenix-mpa-news/v1';

    var signalsCol = document.getElementById('signals-col');
    var pulseCol   = document.getElementById('pulse-col');
    var teaserEl   = document.getElementById('signal-teaser');

    if (!signalsCol && !pulseCol) return;

    function formatAge(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var now = new Date();
        var diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'today';
        if (diff === 1) return 'yesterday';
        if (diff < 7)  return diff + ' days ago';
        if (diff < 30) return Math.floor(diff / 7) + ' weeks ago';
        return Math.floor(diff / 30) + ' months ago';
    }

    function renderCard(item) {
        var card = document.createElement('div');
        card.className = 'signal-card';

        var tags = (item.tags || []).slice(0, 2).join(' · ');
        var age  = formatAge(item.published_at || item.created_at);
        var title = item.summary || item.title || 'Phoenix story';
        var detail = item.title && item.summary && item.title !== item.summary ? item.title : '';
        var storyId = item.id || item.public_id || '';
        var href = storyId ? '/news?story=' + encodeURIComponent(storyId) : '/news';

        var tagEl = document.createElement('div');
        tagEl.className = 'signal-card-tag';
        tagEl.textContent = tags || item.category || 'Phoenix story';

        var heading = document.createElement('h4');
        heading.textContent = title;

        var dateEl = document.createElement('div');
        dateEl.className = 'signal-card-date';
        dateEl.textContent = (item.source_name || 'Phoenix Node') + (age ? ' · ' + age : '');

        var actions = document.createElement('div');
        actions.className = 'news-card-actions';

        var readLink = document.createElement('a');
        readLink.href = href;
        readLink.className = 'ask-kai-btn';
        readLink.textContent = 'Read on News →';

        var askLink = document.createElement('a');
        askLink.href = '/#chats';
        askLink.className = 'ask-kai-btn';
        askLink.textContent = 'Ask Kai →';

        card.appendChild(tagEl);
        card.appendChild(heading);
        card.appendChild(dateEl);
        if (detail) {
            var detailEl = document.createElement('p');
            detailEl.textContent = detail;
            card.appendChild(detailEl);
        }
        actions.appendChild(readLink);
        actions.appendChild(askLink);
        card.appendChild(actions);

        return card;
    }

    function showFallback(col) {
        col.innerHTML =
            '<div class="signals-fallback">' +
            'Phoenix stories loading — ' +
            '<a href="/news">view Kamunity News →</a>' +
            '</div>';
    }

    function buildFeedUrl(endpoint, params) {
        var sep = endpoint.indexOf('?') === -1 ? '?' : '&';
        var parts = [];
        if (params) {
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined && params[key] !== null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
        }
        parts.push('_=' + Date.now());
        return endpoint + sep + parts.join('&');
    }

    async function loadFeed() {
        try {
            var resp = await fetch(buildFeedUrl(PHOENIX_NEWS_ENDPOINT, { limit: 6 }), {
                cache: 'no-store',
                signal: AbortSignal.timeout(6000)
            });
            if (!resp.ok) throw new Error('Feed error ' + resp.status);

            var data = await resp.json();
            if (!data || data.schema_version !== PHOENIX_NEWS_SCHEMA || !Array.isArray(data.items)) {
                throw new Error('Unexpected Phoenix news feed schema');
            }
            var items = data.items;

            if (!items.length) throw new Error('No items');

            var midpoint = Math.ceil(items.length / 2);
            var signals = items.slice(0, midpoint).slice(0, 3);
            var pulses  = items.slice(midpoint).slice(0, 3);

            if (signalsCol) {
                if (signals.length) {
                    signalsCol.innerHTML = '';
                    signals.forEach(function (s) { signalsCol.appendChild(renderCard(s)); });
                } else {
                    showFallback(signalsCol);
                }
            }

            if (pulseCol) {
                if (pulses.length) {
                    pulseCol.innerHTML = '';
                    pulses.forEach(function (p) { pulseCol.appendChild(renderCard(p)); });
                } else {
                    showFallback(pulseCol);
                }
            }

            /* Update teaser with live count */
            if (teaserEl && items.length) {
                teaserEl.textContent =
                    items.length + ' Phoenix ' + (items.length === 1 ? 'story is' : 'stories are') +
                    ' currently available from Kamunity News.';
            }

        } catch (err) {
            if (signalsCol) showFallback(signalsCol);
            if (pulseCol)   showFallback(pulseCol);
        }
    }

    loadFeed();

}());
