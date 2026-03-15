# ASK KAI MODAL PATTERN
## Code Standard for Kamunity MPA
### Version 1.0 · March 2026

---

## The Pattern

Every "Ask Kai" button or link in the Kamunity MPA **must** trigger the floating Kai modal with a contextually appropriate pre-loaded message.

### ❌ OLD PATTERN (Do Not Use)
```html
<a href="/#chats" class="ask-kai-btn">Ask Kai →</a>
```

### ✅ NEW PATTERN (Always Use)
```html
<button 
    data-kai-modal 
    data-kai-context="I'm looking at [specific item/section]. Can you help me understand [specific question]?" 
    class="ask-kai-btn"
    aria-label="Ask Kai about [item]">
    Ask Kai →
</button>
```

---

## Required Attributes

| Attribute | Purpose | Required |
|---|---|---|
| `data-kai-modal` | Triggers the modal to open | ✓ Yes |
| `data-kai-context` | Pre-loads this message in the chat | ✓ Yes |
| `class="ask-kai-btn"` | Applies button styling | ✓ Yes |
| `aria-label` | Accessibility label | ✓ Yes |

---

## Context Message Guidelines

### 1. Be Specific
❌ "Can you help me?"  
✅ "I'm looking at the AI Safety Checklist. Can you help me understand how to use this with my team?"

### 2. Include Location Context
- "I'm browsing the Commons Warehouse..."
- "I'm looking at the Fix It service..."
- "I'm reading about [news topic]..."

### 3. Frame as a Question
- "Can you help me understand..."
- "What would you recommend for..."
- "Can you tell me more about..."
- "How does this work for..."

### 4. Match User Intent
- **Tool cards:** "How do I use this?"
- **Service cards:** "Is this right for my organisation?"
- **News cards:** "Can you provide more context?"
- **Warehouse cards:** "What would you recommend?"

---

## Implementation Examples

### Shop Card (Homepage)
```html
<div class="shop-card">
    <span class="shop-card-icon">📋</span>
    <h4>AI Safety Checklist</h4>
    <p>What your team needs to know before using any AI tool.</p>
    <div class="shop-card-meta">60 seconds · Print · Free</div>
    <a href="/tools/ai-safety-checklist.html" class="shop-btn">Download →</a>
    <button 
        data-kai-modal 
        data-kai-context="I'm looking at the AI Safety Checklist in the Kamunity Shop. Can you help me understand how to use this with my team?" 
        class="ask-kai-btn"
        aria-label="Ask Kai about AI Safety Checklist">
        Ask Kai →
    </button>
</div>
```

### Warehouse Tool Card
```html
<div class="wh-tool-card">
    <span class="wh-tool-badge">Methodology</span>
    <h4>Vine-o-Code</h4>
    <p>The build methodology that underlies everything here.</p>
    <a href="https://vine-o-coding.netlify.app">See the methodology →</a>
    <button 
        data-kai-modal 
        data-kai-context="I'm browsing the Commons Warehouse and found Vine-o-Code. Can you explain how this methodology works and whether it's right for my organisation?" 
        class="ask-kai-btn"
        aria-label="Ask Kai about Vine-o-Code">
        Ask Kai →
    </button>
</div>
```

### Service Card
```html
<div class="service-card">
    <span class="service-card-icon">🔧</span>
    <h3>Fix It</h3>
    <p>Fixing the thing that's broken or stuck.</p>
    <div class="service-price">NFP rate: <strong>$150/hr</strong></div>
    <a href="mailto:mike@kamunityconsulting.com">Get in touch →</a>
    <button 
        data-kai-modal 
        data-kai-context="I'm looking at the Fix It service. Can you help me understand if this is right for my organisation and what the process looks like?" 
        class="ask-kai-btn"
        aria-label="Ask Kai about Fix It service">
        Ask Kai →
    </button>
</div>
```

### News Card
```html
<div class="news-card">
    <div class="news-card-type news-card-type--signal">Signal</div>
    <h3>New funding opportunity for community tech</h3>
    <p class="news-card-summary">Details about the funding...</p>
    <div class="news-card-actions">
        <a href="[source]" class="ask-kai-btn">Read more →</a>
        <button 
            data-kai-modal 
            data-kai-context="I'm reading about this funding opportunity in Kamunity News. Can you help me understand if this is relevant for my organisation and what the application process involves?" 
            class="ask-kai-btn"
            aria-label="Ask Kai about this news item">
            Ask Kai →
        </button>
    </div>
</div>
```

---

## When Adding New Cards

**Every time you add a new card, tool, service, or content block with an "Ask Kai" option:**

1. ✓ Use `<button>` not `<a href="/#chats">`
2. ✓ Add `data-kai-modal` attribute
3. ✓ Write a specific `data-kai-context` message
4. ✓ Include location context ("I'm looking at...", "I'm browsing...")
5. ✓ Frame as a helpful question
6. ✓ Add descriptive `aria-label`

---

## Constitutional Alignment

This pattern serves **Principle 1: Real Users, Real Problems**

- Users don't want to scroll to the embedded chat section
- Users want immediate, contextual help
- The modal appears where they are, with context already loaded
- This reduces friction and serves Priya (the 12-person NFP coordinator with 15 minutes)

---

## Technical Implementation

The modal system is handled by `/js/kai-modal.js`:

```javascript
// Automatically listens for clicks on elements with data-kai-modal
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-kai-modal]');
    if (target) {
        e.preventDefault();
        var context = target.getAttribute('data-kai-context') || '';
        openModal('kai', context);
    }
});
```

No additional JavaScript needed in individual pages — just use the HTML attributes.

---

## Testing Checklist

When implementing or reviewing Ask Kai buttons:

- [ ] Button has `data-kai-modal` attribute
- [ ] Context message is specific and helpful
- [ ] Context message includes location ("I'm looking at...")
- [ ] Context message is framed as a question
- [ ] `aria-label` is descriptive
- [ ] Button styling matches design system
- [ ] Modal opens when clicked
- [ ] Context message appears in chat
- [ ] User can send/receive messages
- [ ] Modal can be closed (×, Escape, click-outside)

---

## Migration Status

| Page | Total Buttons | Migrated | Status |
|---|---|---|---|
| index.html | ~25 | 0 | Pending |
| warehouse.html | ~20 | 0 | Pending |
| news.html | ~5 | 0 | Pending |
| my-kamunity.html | ~3 | 0 | Pending |
| constitution.html | 0 | 0 | N/A |
| about.html | 0 | 0 | N/A |

**Total:** ~53 buttons to migrate

---

## Maintenance

- **When adding new content:** Use this pattern from the start
- **When reviewing PRs:** Check all Ask Kai buttons follow this pattern
- **When updating cards:** Ensure context messages remain accurate
- **When refactoring:** This pattern is load-bearing — don't remove without replacement

---

*This pattern is part of the Kamunity MPA constitutional infrastructure. It serves real users with real problems by reducing friction and providing contextual help exactly where it's needed.*

**Last updated:** March 15, 2026  
**Owner:** Mike Fuller  
**Status:** Active standard — must be followed
