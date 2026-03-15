/* ============================================================
   KAMUNITY MPA — kai.js
   Kai chat embed + Reflection chat embed
   Calls /netlify/functions/kai-proxy
   Constitutional Principle 5: no conversation stored
   ============================================================ */

(function () {
    'use strict';

    var KAI_ENDPOINT = '/.netlify/functions/kai-proxy';

    function initChat(cfg) {
        var messagesEl = document.getElementById(cfg.messagesId);
        var inputEl    = document.getElementById(cfg.inputId);
        var sendBtn    = document.getElementById(cfg.sendId);
        var typingEl   = document.getElementById(cfg.typingId);

        if (!messagesEl || !inputEl || !sendBtn) return;

        var history = [];

        function addBubble(text, role) {
            var bubble = document.createElement('div');
            bubble.className = 'kai-bubble ' + (role === 'user' ? 'kai-bubble-user' : 'kai-bubble-ai');
            bubble.textContent = text;
            messagesEl.appendChild(bubble);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return bubble;
        }

        async function send() {
            var text = inputEl.value.trim();
            if (!text || sendBtn.disabled) return;

            inputEl.value = '';
            sendBtn.disabled = true;
            addBubble(text, 'user');
            history.push({ role: 'user', content: text });

            if (typingEl) typingEl.classList.remove('hidden');

            try {
                var resp = await fetch(KAI_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history, mode: cfg.mode || 'wayfinder' })
                });

                if (!resp.ok) {
                    throw new Error('API error ' + resp.status);
                }

                var data = await resp.json();
                var reply = data.response || 'Something went wrong. Please try again.';
                history.push({ role: 'assistant', content: reply });
                addBubble(reply, 'assistant');

            } catch (err) {
                addBubble("I'm having trouble connecting right now. Try again in a moment, or contact Mike directly at mike@kamunityconsulting.com", 'assistant');
                history.pop();
            } finally {
                if (typingEl) typingEl.classList.add('hidden');
                sendBtn.disabled = false;
                inputEl.focus();
            }
        }

        sendBtn.addEventListener('click', send);

        inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });
    }

    /* Kai chat */
    initChat({
        messagesId: 'kai-messages',
        inputId:    'kai-input',
        sendId:     'kai-send',
        typingId:   'kai-typing',
        mode:       'wayfinder'
    });

    /* Reflection chat */
    initChat({
        messagesId: 'reflection-messages',
        inputId:    'reflection-input',
        sendId:     'reflection-send',
        typingId:   'reflection-typing',
        mode:       'reflection'
    });

}());
