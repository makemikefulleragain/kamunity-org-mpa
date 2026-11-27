/* Share the selected publication, independent of the current page or campaign. */
(function () {
    'use strict';
    var nextId = 0;

    function articleUrl(item) {
        var id = item && (item.id || item._story_id);
        if (typeof id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)) return '';
        return 'https://kamunity-org-mpa.netlify.app/news?story=' + encodeURIComponent(id.toLowerCase());
    }

    function createButton(item) {
        var address = articleUrl(item);
        if (!address) return null;
        var title = String(item.title || 'Kamunity publication');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ask-kai-btn publication-share';
        button.textContent = 'Share';
        button.setAttribute('aria-label', 'Share: ' + title);
        var id = 'publication-share-' + (++nextId), feedback = null, fallback = null, instructions = null, input = null;

        function clearFeedback() {
            if (feedback) feedback.remove();
            feedback = null;
        }
        function announce(message) {
            clearFeedback();
            feedback = document.createElement('p');
            feedback.className = 'publication-share-feedback';
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            button.parentElement.appendChild(feedback);
            feedback.textContent = message;
        }
        function closeFallback(restoreFocus) {
            if (fallback) fallback.remove();
            fallback = null;
            button.removeAttribute('aria-controls');
            button.removeAttribute('aria-expanded');
            if (restoreFocus) button.focus();
        }
        function showFallback(message) {
            if (!button.parentElement || button.isConnected === false) return;
            if (!fallback) {
                fallback = document.createElement('div');
                fallback.id = id;
                fallback.className = 'publication-share-fallback';
                fallback.setAttribute('role', 'group');
                fallback.setAttribute('aria-label', 'Share this article');
                instructions = document.createElement('p');
                instructions.id = id + '-instructions';
                var label = document.createElement('label');
                label.textContent = 'Article link';
                input = document.createElement('input');
                input.type = 'url';
                input.readOnly = true;
                input.value = address;
                input.setAttribute('aria-describedby', instructions.id);
                input.addEventListener('click', function () { input.select(); });
                label.appendChild(input);
                var actions = document.createElement('div');
                actions.className = 'publication-share-fallback-actions';
                var copy = document.createElement('button');
                copy.type = 'button';
                copy.className = 'ask-kai-btn';
                copy.textContent = 'Copy link';
                copy.addEventListener('click', async function () {
                    copy.disabled = true;
                    try { await copyLink(); } finally { copy.disabled = false; }
                });
                var close = document.createElement('button');
                close.type = 'button';
                close.className = 'ask-kai-btn';
                close.textContent = 'Close';
                close.addEventListener('click', function () { closeFallback(true); });
                actions.appendChild(copy);
                actions.appendChild(close);
                fallback.appendChild(instructions);
                fallback.appendChild(label);
                fallback.appendChild(actions);
                fallback.addEventListener('keydown', function (event) {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        closeFallback(true);
                    }
                });
                button.parentElement.appendChild(fallback);
                button.setAttribute('aria-controls', id);
                button.setAttribute('aria-expanded', 'true');
            }
            instructions.textContent = message;
            input.focus();
            input.select();
        }
        async function copyLink() {
            try {
                if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('clipboard_unavailable');
                await navigator.clipboard.writeText(address);
                var restoreFocus = Boolean(fallback);
                closeFallback(restoreFocus);
                announce('Link copied');
            } catch (error) {
                showFallback('Select and copy this link, then paste it into your message.');
            }
        }
        button.addEventListener('click', async function () {
            if (button.disabled) return;
            button.disabled = true;
            clearFeedback();
            closeFallback(false);
            try {
                var data = { title: title, text: title, url: address };
                if (typeof navigator.share === 'function' && (typeof navigator.canShare !== 'function' || navigator.canShare(data))) {
                    // Stay in the original click gesture; no request comes first.
                    try { await navigator.share(data); }
                    catch (error) {
                        if (error && error.name === 'AbortError') return;
                        showFallback('Choose Copy link, or select and copy the address below.');
                    }
                } else await copyLink();
            } catch (error) {
                showFallback('Choose Copy link, or select and copy the address below.');
            } finally { button.disabled = false; }
        });
        return button;
    }
    window.KamunityShare = Object.freeze({ articleUrl: articleUrl, createButton: createButton });
}());
