/* Shared full-publication reading, using the browser's SpeechSynthesis API. */
(function () {
    'use strict';

    var supported = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
    var active = null;

    function reset(reading) {
        reading.button.textContent = 'Read aloud';
        reading.button.setAttribute('aria-label', 'Read aloud: ' + reading.title);
        reading.button.setAttribute('aria-pressed', 'false');
    }

    function stop() {
        var previous = active;
        active = null;
        if (supported) speechSynthesis.cancel();
        if (previous) reset(previous);
    }

    function createButton(item) {
        // The feed body is the full Kamunity publication, not the card summary
        // or the linked original publisher's article. Never substitute a summary.
        var body = typeof item.body_text === 'string' ? item.body_text.trim() : '';
        if (!supported || !body) return null;
        var title = item.title || 'Kamunity publication';
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ask-kai-btn publication-read-aloud';
        reset({ button: button, title: title });
        button.addEventListener('click', function () {
            var sameButton = active && active.button === button;
            stop();
            if (sameButton) return;
            document.querySelectorAll('audio').forEach(function (audio) { audio.pause(); });
            var utterance = new SpeechSynthesisUtterance(title + '. ' + body);
            utterance.lang = 'en-AU';
            var reading = { button: button, title: title, utterance: utterance };
            active = reading;
            function finish() {
                // A cancelled earlier story must not reset the new story's button.
                if (active !== reading) return;
                active = null;
                reset(reading);
            }
            utterance.onend = finish;
            utterance.onerror = finish;
            button.textContent = 'Stop';
            button.setAttribute('aria-label', 'Stop reading: ' + title);
            button.setAttribute('aria-pressed', 'true');
            try { speechSynthesis.speak(utterance); } catch (_error) { finish(); }
        });
        return button;
    }

    if (supported) {
        window.addEventListener('pagehide', stop);
        document.addEventListener('play', function (event) {
            if (event.target && event.target.tagName === 'AUDIO') stop();
        }, true);
    }
    window.KamunityReadAloud = Object.freeze({ createButton: createButton });
}());
