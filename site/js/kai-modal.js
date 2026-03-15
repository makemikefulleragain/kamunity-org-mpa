/* ============================================================
   KAMUNITY MPA — kai-modal.js
   Floating Kai and Reflection modals with context pre-loading
   Constitutional Principle 5: no conversation stored
   ============================================================ */

(function () {
    'use strict';

    var KAI_ENDPOINT = '/.netlify/functions/kai-proxy';

    function renderMarkdown(text) {
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^#{1,3}\s+(.+)$/gm, '<strong>$1</strong>')
            .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\n{2,}/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    // Modal state
    var activeModal = null;
    var modalHistory = {};

    // Initialize modals on page load
    function initModals() {
        // Create Kai modal
        createModal('kai', {
            name: 'Kai',
            tagline: 'Constitutional AI wayfinder',
            color: 'var(--sky)',
            colorLight: 'rgba(58, 106, 138, 0.1)',
            initialMessage: "I'm Kai, your wayfinder for the WA community sector. What brings you here today?",
            mode: 'wayfinder'
        });

        // Create Reflection modal
        createModal('reflection', {
            name: 'Reflection',
            tagline: 'Slower · Contemplative · AI-assisted',
            color: 'var(--moss)',
            colorLight: 'rgba(74, 106, 66, 0.1)',
            initialMessage: "Take your time. What's something you've been carrying that you haven't had space to think through properly?",
            mode: 'reflection',
            requireConsent: true
        });

        // Set up global click handlers for Ask Kai buttons
        document.addEventListener('click', function(e) {
            var target = e.target.closest('[data-kai-modal]');
            if (target) {
                e.preventDefault();
                var context = target.getAttribute('data-kai-context') || '';
                openModal('kai', context);
            }
        });
    }

    function createModal(id, config) {
        var modal = document.createElement('div');
        modal.className = 'kai-modal-overlay';
        modal.id = 'kai-modal-' + id;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'kai-modal-title-' + id);
        modal.setAttribute('aria-modal', 'true');

        var consentHTML = '';
        if (config.requireConsent) {
            consentHTML = `
                <div class="kai-modal-consent" id="kai-modal-consent-${id}">
                    <label class="kai-modal-consent-label">
                        <input type="checkbox" id="kai-modal-consent-check-${id}" aria-required="true">
                        I understand this is an AI, not a human counsellor. I can pause or exit at any time.
                    </label>
                    <button class="kai-modal-consent-btn" id="kai-modal-consent-btn-${id}" disabled>Begin reflection</button>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="kai-modal-container">
                <div class="kai-modal-header">
                    <div class="kai-modal-header-left">
                        <div class="kai-modal-orb" style="background: ${config.color};" aria-hidden="true">
                            ${config.name.charAt(0)}
                        </div>
                        <div>
                            <div class="kai-modal-name" id="kai-modal-title-${id}" style="color: ${config.color};">${config.name}</div>
                            <div class="kai-modal-tagline">${config.tagline}</div>
                        </div>
                    </div>
                    <button class="kai-modal-close" aria-label="Close ${config.name}" data-modal-id="${id}">×</button>
                </div>
                ${consentHTML}
                <div class="kai-modal-body" id="kai-modal-body-${id}" ${config.requireConsent ? 'style="display:none;"' : ''}>
                    <div class="kai-modal-messages" id="kai-modal-messages-${id}" role="log" aria-live="polite"></div>
                    <div class="kai-modal-typing hidden" id="kai-modal-typing-${id}" aria-live="polite">Thinking...</div>
                    <div class="kai-modal-input-row">
                        <textarea class="kai-modal-input" id="kai-modal-input-${id}" placeholder="Type your message..." rows="2" aria-label="Message for ${config.name}"></textarea>
                        <button class="kai-modal-send" id="kai-modal-send-${id}" aria-label="Send">Send</button>
                    </div>
                    <div class="kai-modal-footer">
                        <a href="/about" class="kai-modal-footer-link">About Kamunity</a>
                        <span class="kai-modal-footer-sep">·</span>
                        <a href="/constitution" class="kai-modal-footer-link">Constitution</a>
                        ${id === 'reflection' ? '<span class="kai-modal-footer-sep">·</span><span class="kai-modal-crisis">Crisis? Lifeline 13 11 14</span>' : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Store config
        modal.dataset.config = JSON.stringify(config);

        // Set up event listeners
        setupModalEvents(id, config);
    }

    function setupModalEvents(id, config) {
        var modal = document.getElementById('kai-modal-' + id);
        var closeBtn = modal.querySelector('.kai-modal-close');
        var sendBtn = document.getElementById('kai-modal-send-' + id);
        var inputEl = document.getElementById('kai-modal-input-' + id);

        // Close button
        closeBtn.addEventListener('click', function() {
            closeModal(id);
        });

        // Click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(id);
            }
        });

        // Escape key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && activeModal === id) {
                closeModal(id);
            }
        });

        // Consent handling for Reflection
        if (config.requireConsent) {
            var consentCheck = document.getElementById('kai-modal-consent-check-' + id);
            var consentBtn = document.getElementById('kai-modal-consent-btn-' + id);
            var consentDiv = document.getElementById('kai-modal-consent-' + id);
            var bodyDiv = document.getElementById('kai-modal-body-' + id);

            consentCheck.addEventListener('change', function() {
                consentBtn.disabled = !this.checked;
            });

            consentBtn.addEventListener('click', function() {
                consentDiv.style.display = 'none';
                bodyDiv.style.display = 'block';
                inputEl.focus();
            });
        }

        // Send message
        sendBtn.addEventListener('click', function() {
            sendMessage(id, config);
        });

        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(id, config);
            }
        });
    }

    function openModal(id, context) {
        var modal = document.getElementById('kai-modal-' + id);
        var config = JSON.parse(modal.dataset.config);
        var inputEl = document.getElementById('kai-modal-input-' + id);
        
        // Initialize history if needed
        if (!modalHistory[id]) {
            modalHistory[id] = [];
            var messagesEl = document.getElementById('kai-modal-messages-' + id);
            messagesEl.innerHTML = '';
            
            // Add initial message
            addBubble(id, config.initialMessage, 'assistant');
        }

        modal.classList.add('active');
        activeModal = id;
        
        // Pre-fill input with context if provided
        if (context && inputEl) {
            inputEl.value = context;
        }
        
        // Focus input
        if (inputEl && !config.requireConsent) {
            setTimeout(function() { 
                inputEl.focus();
                // Move cursor to end of pre-filled text
                inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
            }, 100);
        }
    }

    function closeModal(id) {
        var modal = document.getElementById('kai-modal-' + id);
        modal.classList.remove('active');
        activeModal = null;
    }

    function addBubble(id, text, role) {
        var messagesEl = document.getElementById('kai-modal-messages-' + id);
        var bubble = document.createElement('div');
        bubble.className = 'kai-modal-bubble kai-modal-bubble-' + role;
        if (role === 'assistant') {
            bubble.innerHTML = renderMarkdown(text);
        } else {
            bubble.textContent = text;
        }
        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return bubble;
    }

    async function sendMessage(id, config) {
        var inputEl = document.getElementById('kai-modal-input-' + id);
        var sendBtn = document.getElementById('kai-modal-send-' + id);
        var typingEl = document.getElementById('kai-modal-typing-' + id);

        var text = inputEl.value.trim();
        if (!text || sendBtn.disabled) return;

        inputEl.value = '';
        sendBtn.disabled = true;
        addBubble(id, text, 'user');
        modalHistory[id].push({ role: 'user', content: text });

        typingEl.classList.remove('hidden');

        try {
            var resp = await fetch(KAI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: modalHistory[id], 
                    mode: config.mode 
                })
            });

            if (!resp.ok) {
                throw new Error('API error ' + resp.status);
            }

            var data = await resp.json();
            var reply = data.response || 'Something went wrong. Please try again.';
            modalHistory[id].push({ role: 'assistant', content: reply });
            addBubble(id, reply, 'assistant');

        } catch (err) {
            addBubble(id, "I'm having trouble connecting right now. Try again in a moment, or contact Mike directly at mike@kamunityconsulting.com", 'assistant');
            modalHistory[id].pop();
        } finally {
            typingEl.classList.add('hidden');
            sendBtn.disabled = false;
            inputEl.focus();
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModals);
    } else {
        initModals();
    }

    // Expose global function for programmatic opening
    window.openKaiModal = function(context) {
        openModal('kai', context || '');
    };

    window.openReflectionModal = function() {
        openModal('reflection', '');
    };

}());
