/* ============================================================
   KAMUNITY MPA — supabase-feed.js
   Fetches latest signals + pulses from Community Signal API
   Static fallback if unavailable (Doug Test)
   No data sent. Read-only. Constitutional Principle 5.
   ============================================================ */

(function () {
    'use strict';

    var CS_ENDPOINT = 'https://community-signal.netlify.app/.netlify/functions/signals-read?mode=public&limit=3';

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

        card.innerHTML =
            '<div class="signal-card-tag">' + (tags || 'Sector') + '</div>' +
            '<h4>' + (item.summary || item.title || 'Signal') + '</h4>' +
            '<div class="signal-card-date">' + (item.source_name || 'Community Signal') + ' · ' + age + '</div>' +
            (item.why_matters ? '<p>' + item.why_matters + '</p>' : '') +
            '<a href="/#chats" class="ask-kai-btn">Ask Kai about this →</a>';

        return card;
    }

    function showFallback(col) {
        col.innerHTML =
            '<div class="signals-fallback">' +
            'Signal pipeline loading — ' +
            '<a href="https://community-signal.netlify.app" target="_blank" rel="noopener noreferrer">view live signals →</a>' +
            '</div>';
    }

    async function loadFeed() {
        try {
            var resp = await fetch(CS_ENDPOINT, { signal: AbortSignal.timeout(6000) });
            if (!resp.ok) throw new Error('Feed error ' + resp.status);

            var data = await resp.json();
            var items = Array.isArray(data) ? data : (data.signals || data.items || []);

            if (!items.length) throw new Error('No items');

            var signals = items.filter(function (i) { return !i.type || i.type === 'signal'; }).slice(0, 3);
            var pulses  = items.filter(function (i) { return i.type && i.type !== 'signal'; }).slice(0, 3);

            /* Fallback: if no type split, just split the list in half */
            if (!pulses.length && signals.length > 1) {
                pulses  = signals.splice(Math.floor(signals.length / 2));
            }

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
                    items.length + ' new signal' + (items.length !== 1 ? 's' : '') +
                    ' this week from the WA community sector.';
            }

        } catch (err) {
            if (signalsCol) showFallback(signalsCol);
            if (pulseCol)   showFallback(pulseCol);
        }
    }

    loadFeed();

}());
