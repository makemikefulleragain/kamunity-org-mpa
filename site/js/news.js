/* ============================================================
   KAMUNITY MPA — news.js
   Kamunity News page: tab switching, filter bar, card grid,
   load more, read aloud, signal/pulse count from Supabase.
   Static fallback for all data loads (Doug Test).
   ============================================================ */

(function () {
    'use strict';

    var CS_ENDPOINT = 'https://community-signal.netlify.app/.netlify/functions/signals-read?mode=public&limit=30';

    var tabBar      = document.getElementById('news-tab-bar');
    var panel       = document.getElementById('news-panel');
    var countsEl    = document.getElementById('news-counts');
    var lastUpdEl   = document.getElementById('news-last-updated');
    var loadMoreWrap = document.getElementById('news-load-more');
    var loadMoreBtn  = document.getElementById('load-more-btn');
    var filterType   = document.getElementById('filter-type');
    var filterCat    = document.getElementById('filter-category');
    var filterSort   = document.getElementById('filter-sort');

    var allItems     = [];
    var visibleCount = 6;
    var PAGE_SIZE    = 6;
    var activeTab    = 'latest';

    /* ── Category mapping from tags ───────────────────────── */
    var TAB_TAGS = {
        'sector-intelligence': ['workforce', 'sector', 'governance', 'policy', 'mental-health'],
        'community-practice':  ['community', 'housing', 'disability', 'wellbeing', 'family'],
        'ai-tech':             ['digital-tools', 'ai', 'technology', 'software', 'data'],
        'policy-funding':      ['funding', 'grants', 'government', 'regulation', 'policy']
    };

    function itemMatchesTab(item, tab) {
        if (tab === 'latest') return true;
        var tags = (item.tags || []).map(function (t) { return t.toLowerCase(); });
        var tabTags = TAB_TAGS[tab] || [];
        return tabTags.some(function (tt) {
            return tags.some(function (t) { return t.includes(tt); });
        });
    }

    function formatAge(dateStr) {
        if (!dateStr) return '';
        var d    = new Date(dateStr);
        var now  = new Date();
        var diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7)   return diff + ' days ago';
        if (diff < 30)  return Math.floor(diff / 7) + 'w ago';
        return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    }

    function getTypeLabel(item) {
        var t = (item.type || 'signal').toLowerCase();
        if (t.includes('video'))   return ['pulse · video',   'news-card-type--video'];
        if (t.includes('audio'))   return ['pulse · audio',   'news-card-type--audio'];
        if (t.includes('written')) return ['pulse · written', 'news-card-type--signal'];
        return ['signal', 'news-card-type--signal'];
    }

    function renderCard(item) {
        var typeInfo = getTypeLabel(item);
        var typeLbl  = typeInfo[0];
        var typeCls  = typeInfo[1];
        var age      = formatAge(item.published_at || item.created_at);
        var tags     = (item.tags || []).slice(0, 3).join(' · ');
        var title    = item.summary || item.title || 'Community Signal';
        var summary  = item.why_matters || item.body_text || '';

        var card = document.createElement('div');
        card.className = 'news-card';
        card.setAttribute('data-type', typeLbl);
        card.setAttribute('data-tags', tags.toLowerCase());

        var actionsHtml = '<a href="/#chats" class="ask-kai-btn">Ask Kai about this →</a>';

        /* Read aloud for written signals (SpeechSynthesis API — graceful fallback) */
        var readAloudHtml = '';
        if (typeof speechSynthesis !== 'undefined' && summary) {
            readAloudHtml =
                '<button class="ask-kai-btn" onclick="readAloud(this, \'' +
                encodeURIComponent(title + '. ' + summary) +
                '\')" aria-label="Read aloud">🔊 Read aloud</button>';
        }

        /* YouTube nocookie embed for video pulses */
        var mediaHtml = '';
        if (item.source_url && item.source_url.includes('youtube.com')) {
            var videoId = item.source_url.match(/[?&]v=([^&]+)/);
            if (videoId) {
                mediaHtml =
                    '<a href="https://www.youtube-nocookie.com/watch?v=' + videoId[1] +
                    '" target="_blank" rel="noopener noreferrer" class="ask-kai-btn" style="display:inline-block;margin-bottom:0.5rem;">▶ Watch video →</a>';
            }
        }

        card.innerHTML =
            '<div class="news-card-type ' + typeCls + '">' + typeLbl + '</div>' +
            '<h3>' + title + '</h3>' +
            (summary ? '<p class="news-card-summary">' + summary + '</p>' : '') +
            '<div class="news-card-meta">' + (item.source_name || 'Community Signal') + ' · ' + age + (tags ? ' · ' + tags : '') + '</div>' +
            '<div class="news-card-actions">' + mediaHtml + actionsHtml + readAloudHtml + '</div>';

        return card;
    }

    function getFilteredItems() {
        var type = filterType ? filterType.value : '';
        var cat  = filterCat  ? filterCat.value  : '';
        var sort = filterSort ? filterSort.value  : 'newest';

        var filtered = allItems.filter(function (item) {
            if (!itemMatchesTab(item, activeTab)) return false;
            if (type && !getTypeLabel(item)[0].includes(type)) return false;
            if (cat && !itemMatchesTab(item, cat)) return false;
            return true;
        });

        filtered.sort(function (a, b) {
            var da = new Date(a.published_at || a.created_at || 0);
            var db = new Date(b.published_at || b.created_at || 0);
            return sort === 'oldest' ? da - db : db - da;
        });

        return filtered;
    }

    function render() {
        var filtered = getFilteredItems();
        panel.innerHTML = '';

        if (!filtered.length) {
            panel.innerHTML = '<div class="signals-fallback" style="grid-column:1/-1;">No items in this category yet. <a href="/#chats">Ask Kai about what\'s happening →</a></div>';
            if (loadMoreWrap) loadMoreWrap.style.display = 'none';
            return;
        }

        var toShow = filtered.slice(0, visibleCount);
        toShow.forEach(function (item) { panel.appendChild(renderCard(item)); });

        if (loadMoreWrap) {
            loadMoreWrap.style.display = filtered.length > visibleCount ? 'block' : 'none';
        }
    }

    /* Tab switching */
    if (tabBar) {
        tabBar.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-tab]');
            if (!btn) return;
            tabBar.querySelectorAll('.news-tab').forEach(function (t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            activeTab = btn.dataset.tab;
            visibleCount = PAGE_SIZE;
            render();
        });
    }

    /* Filter changes */
    [filterType, filterCat, filterSort].forEach(function (sel) {
        if (sel) sel.addEventListener('change', function () { visibleCount = PAGE_SIZE; render(); });
    });

    /* Load more */
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            visibleCount += PAGE_SIZE;
            render();
        });
    }

    /* Load data */
    async function loadNews() {
        try {
            var resp = await fetch(CS_ENDPOINT, { signal: AbortSignal.timeout(8000) });
            if (!resp.ok) throw new Error('Feed error');

            var data  = await resp.json();
            allItems  = Array.isArray(data) ? data : (data.signals || data.items || []);

            if (countsEl && allItems.length) {
                countsEl.textContent = allItems.length + ' items loaded';
            }
            if (lastUpdEl && allItems[0]) {
                var d = new Date(allItems[0].published_at || allItems[0].created_at);
                lastUpdEl.textContent = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
            }

            render();

        } catch (err) {
            allItems = [];
            if (panel) {
                panel.innerHTML =
                    '<div class="signals-fallback" style="grid-column:1/-1;">' +
                    'News feed loading. View live at ' +
                    '<a href="https://community-signal.netlify.app" target="_blank" rel="noopener noreferrer">community-signal.netlify.app</a>' +
                    '</div>';
            }
            if (countsEl) countsEl.textContent = 'Feed unavailable — static fallback shown';
        }
    }

    loadNews();

}());

/* Read aloud — uses SpeechSynthesis, gracefully absent if unavailable */
function readAloud(btn, encodedText) {
    if (typeof speechSynthesis === 'undefined') return;
    var text = decodeURIComponent(encodedText);
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        btn.textContent = '🔊 Read aloud';
        return;
    }
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-AU';
    utter.onend = function () { btn.textContent = '🔊 Read aloud'; };
    btn.textContent = '⏹ Stop';
    speechSynthesis.speak(utter);
}
