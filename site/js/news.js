/* ============================================================
   KAMUNITY MPA — news.js
   Kamunity News page: tab switching, filter bar, card grid,
   load more, read aloud, signal/pulse count from Supabase.
   Static fallback for all data loads (Doug Test).
   ============================================================ */

(function () {
    'use strict';

    var CS_BASE = 'https://community-signal.netlify.app/.netlify/functions/';
    var CS_ENDPOINT = CS_BASE + 'signals-read?mode=public&limit=30';
    var STORIES_ENDPOINT = CS_BASE + 'post-schedule?mode=public-feed&limit=20';

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

        var expandHtml = '';
        if (item._full_body && item._full_body.length > 300) {
            expandHtml = '<button class="ask-kai-btn" onclick="expandStory(this)" data-full="' + encodeURIComponent(item._full_body) + '">Read more</button>';
        }

        var titleHtml = item._story_id
            ? '<h3><a href="/news?story=' + encodeURIComponent(item._story_id) + '" style="color:inherit;text-decoration:none;">' + escWh(title) + '</a></h3>'
            : '<h3>' + title + '</h3>';

        card.innerHTML =
            '<div class="news-card-type ' + typeCls + '">' + typeLbl + '</div>' +
            titleHtml +
            (summary ? '<p class="news-card-summary">' + summary + '</p>' : '') +
            '<div class="news-card-meta">' + (item.source_name || 'Community Signal') + ' · ' + age + (tags ? ' · ' + tags : '') + '</div>' +
            '<div class="news-card-actions">' + mediaHtml + expandHtml + actionsHtml + readAloudHtml + '</div>';

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

    function mapStoryToItem(story) {
        var content = story.content || '';
        var firstLine = content.split('\n')[0] || 'Published Story';
        var rest = content.slice(firstLine.length).trim();
        var tags = (story.patterns && story.patterns.sector_tags) || [];
        return {
            type: 'story',
            _story_id: story.id,
            summary: story.patterns && story.patterns.summary ? story.patterns.summary : firstLine.slice(0, 120),
            why_matters: rest.slice(0, 300) || content.slice(0, 300),
            tags: tags,
            source_name: 'Content Studio',
            published_at: story.published_at,
            created_at: story.created_at,
            _full_body: content
        };
    }

    /* Load data */
    async function loadNews() {
        try {
            var results = await Promise.allSettled([
                fetch(CS_ENDPOINT, { signal: AbortSignal.timeout(8000) }),
                fetch(STORIES_ENDPOINT, { signal: AbortSignal.timeout(8000) })
            ]);

            var signals = [];
            var stories = [];

            if (results[0].status === 'fulfilled' && results[0].value.ok) {
                var sData = await results[0].value.json();
                signals = Array.isArray(sData) ? sData : (sData.signals || sData.items || []);
            }

            if (results[1].status === 'fulfilled' && results[1].value.ok) {
                var stData = await results[1].value.json();
                stories = (stData.stories || []).map(mapStoryToItem);
            }

            allItems = signals.concat(stories);
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

    /* ── Routing: single story or list ────────────────────── */
    var storyParam = new URLSearchParams(window.location.search).get('story');
    if (storyParam) {
        showSingleStory(storyParam);
    } else {
        loadNews();
    }

    async function showSingleStory(storyId) {
        var listView  = document.getElementById('story-list-view');
        var storyView = document.getElementById('story-view');
        if (listView)  listView.style.display = 'none';
        if (storyView) storyView.style.display = '';
        document.getElementById('sr-story-id').value = storyId;

        try {
            var res = await fetch(CS_BASE + 'post-schedule?mode=public-feed&story_id=' + encodeURIComponent(storyId));
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var data = await res.json();
            var story = data.story;
            if (!story) {
                document.getElementById('sv-title').textContent = 'Story not found';
                return;
            }
            var content = story.content || '';
            var patSummary = story.patterns && story.patterns.summary ? story.patterns.summary : '';
            var title = patSummary || content.split('\n')[0] || 'Published Story';

            document.getElementById('sv-title').textContent = title;
            document.getElementById('sv-date').textContent =
                new Date(story.published_at).toLocaleDateString('en-AU',
                    { day: 'numeric', month: 'long', year: 'numeric' });

            var tags = (story.patterns && story.patterns.sector_tags) || [];
            var tagsEl = document.getElementById('sv-tags');
            if (tagsEl && tags.length) {
                tagsEl.innerHTML = tags.map(function(t) {
                    return '<span class="news-tag-badge">' + escWh(t) + '</span>';
                }).join(' ');
            }

            var bodyEl = document.getElementById('sv-body');
            bodyEl.innerHTML = content.split('\n').map(function(line) {
                return line.trim() ? '<p>' + escWh(line) + '</p>' : '';
            }).join('');

            document.title = title + ' \u2014 Kamunity News';
        } catch (err) {
            document.getElementById('sv-title').textContent = 'Error loading story';
        }
    }

}());

/* Submit story response — engagement capture */
function submitStoryResponse(e) {
    e.preventDefault();
    var storyId = document.getElementById('sr-story-id').value;
    var text = document.getElementById('sr-text').value.trim();
    var name = document.getElementById('sr-name').value.trim();
    var btn = e.target.querySelector('.sr-submit-btn');

    if (!text) return;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch('https://community-signal.netlify.app/.netlify/functions/post-schedule?mode=story-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, text: text, name: name || null, source: 'news-page' }),
    }).then(function(res) {
        if (res.ok) {
            document.getElementById('story-response-form').style.display = 'none';
            document.getElementById('sr-success').style.display = '';
        } else {
            return res.json().then(function(d) { throw new Error(d.error || 'Submit failed'); });
        }
    }).catch(function(err) {
        btn.disabled = false;
        btn.textContent = 'Send →';
        alert('Something went wrong: ' + err.message);
    });
}

function escWh(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                         .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Expand story — shows full body inline when "Read more" is clicked */
function expandStory(btn) {
    var full = decodeURIComponent(btn.getAttribute('data-full') || '');
    if (!full) return;
    var card = btn.closest('.news-card');
    if (!card) return;
    var summary = card.querySelector('.news-card-summary');
    if (summary) {
        summary.style.whiteSpace = 'pre-wrap';
        summary.textContent = full;
    }
    btn.remove();
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
