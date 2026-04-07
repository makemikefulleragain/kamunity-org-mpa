/* ============================================================
   KAMUNITY MPA — warehouse.js
   Client-side search across all aisle cards.
   No data sent. No external requests. Doug Test: works without JS.
   ============================================================ */

(function () {
    'use strict';

    var searchInput  = document.getElementById('wh-search');
    var searchGoBtn  = document.getElementById('wh-search-go');
    var noResults    = document.getElementById('wh-no-results');

    if (!searchInput) return;

    function normalise(str) {
        return (str || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    }

    function runSearch(query) {
        var allCards = document.querySelectorAll('.wh-tool-card[data-search]');
        var aisles   = document.querySelectorAll('.wh-aisle');
        var q = normalise(query);

        if (!q) {
            /* Reset: show all */
            allCards.forEach(function (card) { card.style.display = ''; });
            aisles.forEach(function (aisle) { aisle.style.display = ''; });
            // Show field aisle wrap if it has cards
            var fieldWrap = document.getElementById('aisle-field-wrap');
            if (fieldWrap && fieldWrap.querySelector('.wh-tool-card')) fieldWrap.style.display = '';
            if (noResults) noResults.style.display = 'none';
            return;
        }

        var anyVisible = false;

        allCards.forEach(function (card) {
            var searchText = normalise(
                (card.dataset.search || '') + ' ' +
                (card.querySelector('h4') ? card.querySelector('h4').textContent : '') + ' ' +
                (card.querySelector('p')  ? card.querySelector('p').textContent  : '')
            );
            var match = q.split(' ').every(function (word) { return searchText.includes(word); });
            card.style.display = match ? '' : 'none';
            if (match) anyVisible = true;
        });

        /* Hide aisles where all cards are hidden */
        aisles.forEach(function (aisle) {
            var visibleCards = aisle.querySelectorAll('.wh-tool-card[data-search]:not([style*="display: none"])');
            aisle.style.display = visibleCards.length ? '' : 'none';
        });

        if (noResults) {
            noResults.style.display = anyVisible ? 'none' : 'block';
        }
    }

    searchInput.addEventListener('input', function () {
        runSearch(this.value);
    });

    searchInput.addEventListener('search', function () {
        runSearch(this.value);
    });

    // Go button click
    if (searchGoBtn) {
        searchGoBtn.addEventListener('click', function () {
            runSearch(searchInput.value);
        });
    }

    // Enter key in search input
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch(this.value);
        }
    });

}());
