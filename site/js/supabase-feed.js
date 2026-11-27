/* ============================================================
   KAMUNITY MPA — supabase-feed.js
   Shows the six latest public Phoenix publications, newest first.
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

    var publications = document.getElementById('latest-publications');

    if (!publications) return;

    function renderCard(item) {
        var card = document.createElement('li');
        card.className = 'news-card';

        var presentation = window.KamunityPublication.cardPresentation(item);
        var title = item.title || item.summary || 'Kamunity publication';
        var detail = item.summary && item.title !== item.summary ? item.summary : '';
        var storyId = item.id || item.public_id || '';
        var href = storyId ? '/news?story=' + encodeURIComponent(storyId) : '/news';

        var tagEl = document.createElement('div');
        tagEl.className = 'news-card-type news-card-type--story';
        tagEl.textContent = presentation.label;

        var heading = document.createElement('h3');
        heading.textContent = title;

        var dateEl = document.createElement('div');
        dateEl.className = 'news-card-meta';
        dateEl.textContent = 'Published ';
        var date = document.createElement('time');
        date.dateTime = item.published_at || item.created_at || '';
        date.textContent = date.dateTime ? new Date(date.dateTime).toLocaleDateString('en-AU', {
            day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth'
        }) : 'date unavailable';
        dateEl.appendChild(date);

        var actions = document.createElement('div');
        actions.className = 'news-card-actions';

        var readLink = document.createElement('a');
        readLink.href = href;
        readLink.className = 'ask-kai-btn';
        readLink.textContent = presentation.action;

        card.appendChild(tagEl);
        card.appendChild(heading);
        card.appendChild(dateEl);
        if (presentation.state) {
            var state = document.createElement('p');
            state.className = 'news-card-status';
            state.textContent = presentation.state;
            card.appendChild(state);
        }
        if (detail) {
            var detailEl = document.createElement('p');
            detailEl.className = 'news-card-summary';
            detailEl.textContent = detail;
            card.appendChild(detailEl);
        }
        var sourceUrl = safeOriginalSourceUrl(item.source_url);
        if (sourceUrl) {
            var source = document.createElement('p');
            var sourceLink = document.createElement('a');
            sourceLink.className = 'news-original-source';
            sourceLink.href = sourceUrl;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.textContent = 'Open original source ↗';
            source.appendChild(sourceLink);
            card.appendChild(source);
        }
        actions.appendChild(readLink);
        var readAloud = window.KamunityReadAloud && window.KamunityReadAloud.createButton(item, Boolean(sourceUrl));
        if (readAloud) actions.appendChild(readAloud);
        card.appendChild(actions);

        return card;
    }

    // Match the News cards' policy for public original-source links.
    function safeOriginalSourceUrl(value) {
        if (typeof value !== 'string' || value.length > 2048) return '';
        try {
            var url = new URL(value);
            if (url.protocol !== 'https:' || url.username || url.password) return '';
            if (!url.hostname.includes('.') || /^(localhost|.*\.localhost|.*\.local|.*\.test|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(url.hostname)) return '';
            url.search = '';
            url.hash = '';
            return url.toString();
        } catch (err) {
            return '';
        }
    }

    function showFallback(message) {
        publications.innerHTML =
            '<li class="signals-fallback">' +
            message + ' — ' +
            '<a href="/news">view all publications</a>' +
            '</li>';
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
                signal: AbortSignal.timeout(20000)
            });
            if (!resp.ok) throw new Error('Feed error ' + resp.status);

            var data = await resp.json();
            if (!data || data.schema_version !== PHOENIX_NEWS_SCHEMA || !Array.isArray(data.items)) {
                throw new Error('Unexpected Phoenix news feed schema');
            }
            // The server orders the full eligible feed before applying limit=6.
            var items = data.items.slice().sort(function (a, b) {
                return (Date.parse(b.published_at || b.created_at) || 0) -
                    (Date.parse(a.published_at || a.created_at) || 0) ||
                    String(a.id || '').localeCompare(String(b.id || ''));
            }).slice(0, 6);

            if (!items.length) {
                showFallback('No publications available right now');
                return;
            }

            publications.innerHTML = '';
            items.forEach(function (item) { publications.appendChild(renderCard(item)); });

        } catch (err) {
            showFallback('Publications temporarily unavailable');
        } finally {
            publications.setAttribute('aria-busy', 'false');
        }
    }

    loadFeed();

}());
