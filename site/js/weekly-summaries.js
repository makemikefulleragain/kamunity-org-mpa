/* Published recordings only. Research, narration and publication live in Phoenix. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-weekly-hero]'), archive = document.querySelector('[data-weekly-archive]');
  if (!hero && !archive) return;
  var origin = 'https://phoenix-node.netlify.app', endpoint = origin + '/.netlify/functions/public-weekly-summaries';
  var items = [], next = null, loading = false, players = [], search = document.getElementById('wh-search'), archiveSync = function () {};
  function el(tag, text, attrs) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; Object.entries(attrs || {}).forEach(function (entry) { node.setAttribute(entry[0], entry[1]); }); return node; }
  function date(value) { return new Date(value).toLocaleDateString('en-AU', { timeZone: 'Australia/Perth', day: 'numeric', month: 'short', year: 'numeric' }); }
  function dates(item) { return date(item.period.start) + ' – ' + date(new Date(Date.parse(item.period.end) - 1).toISOString()); }
  function duration(value) { return Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0'); }
  function valid(item) {
    try {
      var url = new URL(item.audioUrl);
      var briefing = item.briefing;
      var briefingValid = !briefing || [briefing.publicationsConsidered, briefing.publicationsCovered, briefing.publicationsExcluded].every(function (n) { return Number.isSafeInteger(n) && n >= 0; }) && briefing.publicationsCovered + briefing.publicationsExcluded === briefing.publicationsConsidered && briefing.publicationsCovered === item.sources.length && Array.isArray(briefing.actions) && briefing.actions.every(function (action) { return typeof action.text === 'string' && action.text.trim().length >= 20 && item.script.includes(action.text) && Array.isArray(action.sourceIds) && action.sourceIds.length > 0 && action.sourceIds.every(function (id) { return item.sources.some(function (source) { return source.id === id; }); }); });
      return /^\d{4}-\d{2}-\d{2}$/.test(item.id) && typeof item.title === 'string' && item.title.length <= 140 && typeof item.description === 'string' && typeof item.script === 'string' && item.script.length <= 14000 && Number.isFinite(item.duration) && item.duration > 1 && item.duration <= 720 && Number.isFinite(Date.parse(item.period.start)) && Number.isFinite(Date.parse(item.period.end)) && url.origin === origin && url.pathname === '/.netlify/functions/weekly-summary-audio' && url.searchParams.get('id') === item.id && Array.isArray(item.sources) && briefingValid;
    } catch (error) { return false; }
  }
  async function read(cursor, id) {
    var url = new URL(endpoint); if (cursor) url.searchParams.set('cursor', cursor); if (id) url.searchParams.set('id', id);
    var response = await fetch(url.href, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.ok) throw new Error('unavailable');
    var feed = await response.json();
    if (feed.schema_version !== 'phoenix-weekly-summaries/v1' || !Array.isArray(feed.items) || feed.items.some(function (item) { return !valid(item); })) throw new Error('invalid feed');
    return feed;
  }
  function recording(item, host, button) {
    var originalLabel = button.textContent;
    var panel = el('div', undefined, { class: 'weekly-listening' }), status = el('p', '', { role: 'status', class: 'weekly-status' });
    var audio = el('audio', undefined, { controls: '', preload: 'none', 'aria-label': item.title });
    players.push(audio);
    audio.addEventListener('pause', function () { button.textContent = originalLabel; });
    audio.addEventListener('ended', function () { button.textContent = originalLabel; });
    audio.addEventListener('play', function () { button.textContent = '❚❚ Pause summary'; players.forEach(function (other) { if (other !== audio) other.pause(); }); if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); });
    audio.addEventListener('error', function () { status.textContent = 'This recording could not be loaded. Try Play again, or read the transcript.'; button.disabled = false; });
    var speedLabel = el('label', 'Playback speed '), speed = el('select', undefined, { 'aria-label': 'Playback speed for ' + item.title });
    [1, 1.25, 1.5, 2].forEach(function (rate) { var option = el('option', rate + '×', { value: rate }); speed.append(option); });
    speed.addEventListener('change', function () { audio.playbackRate = Number(speed.value); }); speedLabel.append(speed);
    var transcript = el('details', undefined, { class: 'weekly-transcript' }); transcript.append(el('summary', 'Transcript & sources'));
    transcript.append(el('p', 'Coverage: ' + dates(item) + '. This edition reflects what was published that week. Check current availability and dates in the linked sources.', { class: 'weekly-status' }));
    if (item.briefing) {
      transcript.append(el('p', item.briefing.publicationsCovered + ' of ' + item.briefing.publicationsConsidered + ' publications covered. ' + item.briefing.publicationsExcluded + ' excluded after editorial review.', { class: 'weekly-status' }));
      if (item.briefing.actions.length) {
        transcript.append(el('h3', 'Practical next steps'));
        var actions = el('ul'); item.briefing.actions.forEach(function (action) { actions.append(el('li', action.text)); }); transcript.append(actions);
      }
    }
    item.script.split(/\n\s*\n/).forEach(function (p) { transcript.append(el('p', p)); });
    transcript.append(el('p', 'AI-generated narration · Published by Kamunity', { class: 'weekly-status' }));
    var sources = el('ul'); item.sources.forEach(function (source) { try { var url = new URL(source.url); if (url.protocol !== 'https:' || url.username || url.password) return; var li = el('li'); li.append(el('a', source.title, { href: url.href })); sources.append(li); } catch (error) { /* malformed source omitted */ } }); transcript.append(sources);
    panel.append(audio, speedLabel, status, transcript); host.append(panel);
    button.addEventListener('click', function () {
      status.textContent = ''; panel.hidden = false;
      if (!audio.paused) { audio.pause(); return; }
      // Refresh the guarded audio endpoint after an expired signed URL or error.
      if (!audio.src || audio.error) { audio.src = item.audioUrl + '&play=' + Date.now(); audio.load(); }
      audio.play().catch(function () { status.textContent = 'Use the audio Play control to start listening.'; });
    });
    return panel;
  }
  function drawHero(feed) {
    hero.replaceChildren();
    var button = el('button', '▶ Play the weekly community-sector briefing', { type: 'button', class: 'weekly-play' });
    hero.append(button);
    if (!feed.items.length) { button.disabled = true; hero.append(el('p', 'The first edition is being prepared. New summaries arrive Sundays at 7am Perth time.', { class: 'weekly-status', role: 'status' })); return; }
    var item = feed.items[0];
    hero.append(el('p', dates(item) + ' · ' + duration(item.duration) + ' · ' + item.title + (item.briefing ? ' · ' + item.briefing.publicationsCovered + ' publications covered' : ''), { class: 'weekly-meta' }));
    if (feed.delayed) hero.append(el('p', 'The new edition is delayed. The previous available summary is shown with its coverage dates.', { class: 'weekly-status', role: 'status' }));
    var panel = recording(item, hero, button); panel.hidden = true;
    var links = el('div', undefined, { class: 'weekly-links' }), transcriptButton = el('button', 'Read transcript', { type: 'button', class: 'weekly-text-button' });
    transcriptButton.addEventListener('click', function () { panel.hidden = false; panel.querySelector('details').open = true; panel.querySelector('summary').focus(); });
    links.append(transcriptButton, el('a', 'Past summaries →', { href: '/warehouse#weekly-summaries' })); hero.append(links);
    hero.append(el('p', 'New edition every Sunday at 7am Perth · AI narration', { class: 'weekly-status' }));
  }
  function drawArchive() {
    archive.replaceChildren();
    archive.append(el('div', 'Listen back', { class: 'wh-aisle-label' }));
    var header = el('div', undefined, { class: 'catalogue-row-header' }); header.append(el('h2', 'Weekly Community-Sector Briefings', { id: 'weekly-heading' }));
    var controls = el('div', undefined, { class: 'catalogue-row-controls' }), previous = el('button', '←', { type: 'button', 'aria-label': 'Previous weekly summaries' }), forward = el('button', '→', { type: 'button', 'aria-label': 'Next weekly summaries' }); controls.append(previous, forward); header.append(controls); archive.append(header);
    archive.append(el('p', 'Themes, important stories and practical next steps for community organisations and groups. Usually eight to ten minutes in a busy week, with a twelve-minute maximum. Recent editions appear first; earlier summaries remain in the archive.', { class: 'wh-aisle-intro' }));
    var row = el('div', undefined, { class: 'wh-aisle-row catalogue-shelf weekly-shelf', role: 'list', tabindex: '0', 'aria-label': 'Weekly news recordings' });
    var matching = items.filter(function (item) { return !search || search.value.toLowerCase().trim().split(/\s+/).every(function (word) { return [item.title, item.description, dates(item), item.script].join(' ').toLowerCase().includes(word); }); });
    if (matching.length) { var noResults = document.getElementById('wh-no-results'); if (noResults) noResults.style.display = 'none'; }
    var listening = el('div', undefined, { class: 'weekly-archive-player' });
    matching.forEach(function (item) {
      var card = el('article', undefined, { class: 'wh-tool-card catalogue-card weekly-card', role: 'listitem', 'data-search': item.title + ' ' + item.description, id: 'weekly-' + item.id });
      card.append(el('span', dates(item) + ' · ' + duration(item.duration), { class: 'wh-tool-badge' }), el('h3', item.title), el('p', item.description));
      var link = el('button', '▶ Play summary', { type: 'button', class: 'ask-kai-btn' }), readButton = el('button', 'Transcript', { type: 'button', class: 'weekly-text-button' });
      function open(auto) {
        players.forEach(function (audio) { audio.pause(); }); listening.replaceChildren();
        listening.append(el('h3', item.title), el('p', dates(item) + ' · ' + duration(item.duration), { class: 'weekly-meta' }));
        var play = el('button', '▶ Play this edition', { type: 'button', class: 'weekly-play' }); listening.append(play); var panel = recording(item, listening, play);
        if (auto) play.click(); else panel.querySelector('details').open = true;
        history.replaceState(null, '', '#weekly-' + item.id);
        listening.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      link.addEventListener('click', function () { open(true); }); readButton.addEventListener('click', function () { open(false); }); card.append(link, readButton); row.append(card);
    });
    if (!matching.length) row.append(el('p', items.length ? 'No summaries match this search.' : 'The first weekly edition is being prepared.', { class: 'catalogue-empty' }));
    archive.append(row, listening);
    function sync() { var overflow = row.scrollWidth > row.clientWidth + 2; controls.hidden = !overflow; previous.disabled = row.scrollLeft <= 2; forward.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2; }
    function scroll(direction) { row.scrollBy({ left: direction * 296, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    previous.addEventListener('click', function () { scroll(-1); }); forward.addEventListener('click', function () { scroll(1); }); archiveSync = sync; row.addEventListener('scroll', sync, { passive: true }); row.addEventListener('keydown', function (event) { if (event.target === row && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); scroll(event.key === 'ArrowRight' ? 1 : -1); } }); requestAnimationFrame(sync);
    if (next !== null) { var more = el('button', 'Load older summaries', { type: 'button', class: 'weekly-text-button' }); more.disabled = loading; more.addEventListener('click', function () { loadMore(more); }); archive.append(more); }
    document.dispatchEvent(new Event('weekly-summaries-updated'));
  }
  async function loadMore(button) {
    if (loading) return; loading = true; button.disabled = true;
    try { var feed = await read(next); feed.items.forEach(function (item) { if (!items.some(function (prior) { return prior.id === item.id; })) items.push(item); }); next = feed.next_cursor; loading = false; players.forEach(function (audio) { audio.pause(); }); drawArchive(); }
    catch (error) { button.textContent = 'Older summaries could not be loaded — retry'; }
    finally { loading = false; button.disabled = false; }
  }
  window.addEventListener('resize', function () { archiveSync(); });
  if (search && archive) search.addEventListener('input', function () { players.forEach(function (audio) { audio.pause(); }); drawArchive(); });
  read().then(async function (feed) {
    items = feed.items; next = feed.next_cursor;
    if (hero) drawHero(feed);
    if (archive) {
      var target = location.hash.match(/^#weekly-(\d{4}-\d{2}-\d{2})$/);
      if (target && !items.some(function (item) { return item.id === target[1]; })) { try { var older = await read(null, target[1]); items = items.concat(older.items); } catch (error) { /* current editions remain available */ } }
      drawArchive();
      if (target) { var card = document.getElementById('weekly-' + target[1]); if (card) card.querySelector('.weekly-text-button').click(); else archive.append(el('p', 'The requested edition is unavailable. Other published summaries are shown above.', { class: 'weekly-status', role: 'status' })); }
    }
  }).catch(function () {
    var host = hero || archive; host.append(el('p', 'Weekly summaries could not be checked. Please try again shortly.', { class: 'weekly-status', role: 'status' }));
    var retry = el('button', 'Retry weekly summaries', { type: 'button', class: 'weekly-text-button' }); retry.addEventListener('click', function () { location.reload(); }); host.append(retry);
  });
}());
