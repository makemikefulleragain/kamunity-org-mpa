/* ============================================================
   KAMUNITY MPA — news.js
   Kamunity News page: tab switching, filter bar, card grid,
   load more, read aloud, signal/pulse count from Supabase.
   Static fallback for all data loads (Doug Test).
   ============================================================ */

(function () {
    'use strict';

    var PHOENIX_NEWS_ENDPOINT = window.PHOENIX_NEWS_ENDPOINT ||
        'https://phoenix-node.netlify.app/.netlify/functions/public-mpa-news';
    var PHOENIX_NEWS_SCHEMA = 'phoenix-mpa-news/v1';

    var tabBar      = document.getElementById('news-tab-bar');
    var panel       = document.getElementById('news-panel');
    var countsEl    = document.getElementById('news-counts');
    var lastUpdEl   = document.getElementById('news-last-updated');
    var loadMoreWrap = document.getElementById('news-load-more');
    var loadMoreBtn  = document.getElementById('load-more-btn');
    var filterType   = document.getElementById('filter-type');
    var filterCat    = document.getElementById('filter-category');
    var filterSort   = document.getElementById('filter-sort');
    var storyModal   = document.getElementById('story-modal');
    var lastModalTrigger = null;

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

    function freshUrl(url) {
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        return url + sep + '_=' + Date.now();
    }

    function requirePhoenixNewsFeed(payload) {
        if (!payload || payload.schema_version !== PHOENIX_NEWS_SCHEMA || !Array.isArray(payload.items)) {
            throw new Error('Unexpected Phoenix news feed schema');
        }
        return payload;
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
        if (t === 'story')         return ['story',           'news-card-type--story'];
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
        var title    = item.title || item.summary || 'Phoenix story';
        var summary  = item.summary || item.why_matters || item.body_text || '';

        var card = document.createElement('div');
        card.className = 'news-card';
        card.setAttribute('data-type', typeLbl);
        card.setAttribute('data-tags', tags.toLowerCase());

        var actionsHtml = '<a href="/#chats" class="ask-kai-btn news-card-ask">Ask Kai about this →</a>';

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

        var expandHtml = '';
        if (item._full_body && item._full_body.length > 300) {
            expandHtml = '<button class="ask-kai-btn news-card-read" data-story-open="' + escWh(item._story_id || '') + '">Read more</button>';
        }

        var titleHtml = item._story_id
            ? '<h3><button class="news-title-button" data-story-open="' + escWh(item._story_id) + '">' + escWh(title) + '</button></h3>'
            : '<h3>' + escWh(title) + '</h3>';

        card.innerHTML =
            '<div class="news-card-type ' + typeCls + '">' + typeLbl + '</div>' +
            titleHtml +
            (summary ? '<p class="news-card-summary">' + escWh(summary) + '</p>' : '') +
            '<div class="news-card-meta">' + escWh(item.source_name || 'Phoenix Node') + ' · ' + age + (tags ? ' · ' + escWh(tags) : '') + '</div>' +
            '<div class="news-card-actions">' + mediaHtml + expandHtml + actionsHtml + readAloudHtml + '</div>';

        return card;
    }

    if (panel) {
        panel.addEventListener('click', function (e) {
            var trigger = e.target.closest('[data-story-open]');
            if (!trigger) return;
            e.preventDefault();
            var storyId = trigger.getAttribute('data-story-open');
            if (storyId) openStoryModal(storyId, trigger, true);
        });
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

    function mapPhoenixNewsItem(item) {
        var content = item.body_text || '';
        return {
            type: item.type || 'story',
            _story_id: item.id,
            title: item.title || item.summary || 'Phoenix story',
            summary: item.summary || content.slice(0, 220),
            body_text: content,
            tags: item.tags || [],
            category: item.category || '',
            source_name: item.source_name || 'Phoenix Node',
            published_at: item.published_at,
            created_at: item.created_at,
            evidence: item.evidence || null,
            _full_body: content
        };
    }

    /* Load data */
    async function loadNews() {
        try {
            var res = await fetch(freshUrl(PHOENIX_NEWS_ENDPOINT + '?limit=30'), {
                cache: 'no-store',
                signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) throw new Error('Feed error ' + res.status);
            var data = requirePhoenixNewsFeed(await res.json());
            allItems = data.items.map(mapPhoenixNewsItem);
            allItems.sort(function (a, b) {
                var da = new Date(a.published_at || a.created_at || 0);
                var db = new Date(b.published_at || b.created_at || 0);
                return db - da;
            });

            if (countsEl && allItems.length) {
                countsEl.textContent = allItems.length + ' items loaded';
            }
            if (lastUpdEl && allItems[0]) {
                var d = new Date(allItems[0].published_at || allItems[0].created_at);
                lastUpdEl.textContent = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
            }

            render();
            var storyParam = new URLSearchParams(window.location.search).get('story');
            if (storyParam) openStoryModal(storyParam, null, false);

        } catch (err) {
            allItems = [];
            if (panel) {
                panel.innerHTML =
                    '<div class="signals-fallback" style="grid-column:1/-1;">' +
                    'News feed loading. Static Kamunity News notes remain available on this page.' +
                    '</div>';
            }
            if (countsEl) countsEl.textContent = 'Feed unavailable — static fallback shown';
        }
    }

    loadNews();

    async function openStoryModal(storyId, trigger, updateUrl) {
        if (!storyModal) return;
        lastModalTrigger = trigger || document.activeElement;
        setStoryModalLoading();
        storyModal.classList.add('is-open');
        storyModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('story-modal-open');
        var closeBtn = storyModal.querySelector('[data-story-modal-close]');
        if (closeBtn) closeBtn.focus();
        if (updateUrl && history.pushState) {
            history.pushState({ story: storyId }, '', '/news?story=' + encodeURIComponent(storyId));
        }
        try {
            var sep = PHOENIX_NEWS_ENDPOINT.indexOf('?') === -1 ? '?' : '&';
            var res = await fetch(freshUrl(PHOENIX_NEWS_ENDPOINT + sep + 'story_id=' + encodeURIComponent(storyId)), {
                cache: 'no-store'
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var data = requirePhoenixNewsFeed(await res.json());
            var story = data.story || (data.items && data.items[0]);
            if (!story) {
                document.getElementById('story-modal-title').textContent = 'Story not found';
                return;
            }
            renderStoryModal(story);
        } catch (err) {
            document.getElementById('story-modal-title').textContent = 'Error loading story';
        }
    }

    function setStoryModalLoading() {
        document.getElementById('story-modal-title').textContent = 'Loading…';
        document.getElementById('sm-date').textContent = '';
        document.getElementById('sm-tags').innerHTML = '';
        document.getElementById('sm-body').innerHTML = '';
    }

    function renderStoryModal(story) {
        var content = story.body_text || '';
        var title = story.title || story.summary || content.split('\n')[0] || 'Published Story';
        var date = story.published_at || story.created_at;
        document.getElementById('story-modal-title').textContent = title;
        document.getElementById('sm-date').textContent = date
            ? new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
            : '';

        var tags = story.tags || [];
        var tagsEl = document.getElementById('sm-tags');
        tagsEl.innerHTML = tags.map(function(t) {
            return '<span class="news-tag-badge">' + escWh(t) + '</span>';
        }).join(' ');

        var bodyEl = document.getElementById('sm-body');
        bodyEl.innerHTML = content.split(/\n+/).map(function(line) {
            return line.trim() ? '<p>' + escWh(line) + '</p>' : '';
        }).join('');

        var newsLink = document.getElementById('sm-news-link');
        if (newsLink && story.id) newsLink.href = '/news?story=' + encodeURIComponent(story.id);
        document.title = title + ' \u2014 Kamunity News';
    }

    function closeStoryModal(updateUrl) {
        if (!storyModal) return;
        storyModal.classList.remove('is-open');
        storyModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('story-modal-open');
        document.title = 'Kamunity News — Sector Intelligence for the WA Community Sector';
        if (updateUrl && history.pushState) history.pushState({}, '', '/news');
        if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') lastModalTrigger.focus();
    }

    if (storyModal) {
        storyModal.addEventListener('click', function (e) {
            if (e.target.closest('[data-story-modal-close]')) closeStoryModal(true);
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && storyModal && storyModal.classList.contains('is-open')) {
            closeStoryModal(true);
        }
    });
    window.addEventListener('popstate', function () {
        var storyParam = new URLSearchParams(window.location.search).get('story');
        if (storyParam) openStoryModal(storyParam, null, false);
        else closeStoryModal(false);
    });

}());

function escWh(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                         .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
