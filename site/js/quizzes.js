/* ============================================================
   KAMUNITY.ORG MPA — Embedded Quizzes
   Brief: WB-MPA-002
   Cannibalised from: ring-two-mvp/site/index.html quiz JS
   Three tools: Sovereignty Check, AI Readiness, Org Health Check
   All client-side. No data sent anywhere. Constitutional Principle 5.
   ============================================================ */

/* ── SOVEREIGNTY CHECK ── */
const SOVCHECK_QUESTIONS = [
    {
        q: "Where does your organisation's email live?",
        dimension: "Infrastructure",
        options: [
            { text: "Google Workspace or Microsoft 365 (paid)", score: 2 },
            { text: "Google Workspace or Microsoft 365 (free/nonprofit tier)", score: 1 },
            { text: "Managed by your own server or a local provider", score: 3 },
            { text: "We mostly use personal Gmail/Outlook accounts", score: 0 }
        ]
    },
    {
        q: "Where does your organisation's data (client records, financials, documents) live?",
        dimension: "Data",
        options: [
            { text: "Mostly in cloud platforms (Google Drive, OneDrive, Dropbox)", score: 1 },
            { text: "In a purpose-built case management system we pay for", score: 2 },
            { text: "Locally on our own servers or drives", score: 3 },
            { text: "We're not entirely sure — it's spread across several places", score: 0 }
        ]
    },
    {
        q: "If your main software vendor tripled their prices tomorrow, what would you do?",
        dimension: "Vendor dependency",
        options: [
            { text: "We'd have to pay — we couldn't operate without it", score: 0 },
            { text: "We'd be in serious trouble but could probably find alternatives over a few months", score: 1 },
            { text: "We could migrate to alternatives within a month", score: 2 },
            { text: "We run mostly open-source or self-hosted tools — we'd be fine", score: 3 }
        ]
    },
    {
        q: "Does your organisation have a documented process for what happens if a key digital service goes down?",
        dimension: "Resilience",
        options: [
            { text: "Yes — we have a documented continuity plan and test it", score: 3 },
            { text: "Informally — key people know what to do but it's not written down", score: 2 },
            { text: "Not really — we'd probably figure it out as we went", score: 1 },
            { text: "No — it hasn't come up as a priority", score: 0 }
        ]
    },
    {
        q: "If you had to leave your current software provider, could you take your data with you?",
        dimension: "Portability",
        options: [
            { text: "Yes — we can export everything in usable formats at any time", score: 3 },
            { text: "Probably — but we've never actually tried", score: 2 },
            { text: "It would be difficult — some things might be stuck", score: 1 },
            { text: "No — we don't know how, or it's not possible with our current setup", score: 0 }
        ]
    }
];

const SOVCHECK_RESULTS = [
    { min: 0, max: 5, label: "High dependency", text: "Your organisation is significantly dependent on infrastructure you don't control. That's not unusual — most WA community orgs are. But it does mean your services could be disrupted by decisions made by people who don't know your community exists." },
    { min: 6, max: 9, label: "Moderate dependency", text: "You have some sovereignty in your digital infrastructure, but there are meaningful gaps. The good news: you've already made some conscious choices. The next steps are about filling the gaps, not starting from scratch." },
    { min: 10, max: 13, label: "Growing sovereignty", text: "You're doing better than most. You've thought about this and made deliberate choices. The remaining vulnerabilities are worth addressing — the foundation is already there." },
    { min: 14, max: 15, label: "Strong sovereignty", text: "Your digital infrastructure is genuinely more sovereign than most organisations in the sector. That's unusual and valuable. The next question isn't how to fix things — it's how to maintain this as your needs grow." }
];

/* ── AI READINESS ── */
const AIREADY_QUESTIONS = [
    {
        q: "Has your organisation discussed AI formally — at a board or leadership level — in the last 12 months?",
        dimension: "Governance",
        options: [
            { text: "Yes — we have a position or policy on it", score: 3 },
            { text: "Yes — it's come up but we haven't formalised anything", score: 2 },
            { text: "Informally, but not at board or leadership level", score: 1 },
            { text: "No — it hasn't come up formally", score: 0 }
        ]
    },
    {
        q: "Do staff in your organisation currently use AI tools (like ChatGPT, Copilot, Gemini) in their work?",
        dimension: "Adoption",
        options: [
            { text: "Yes — regularly, with some guidance or guidelines", score: 3 },
            { text: "Yes — but informally, without any organisational guidance", score: 1 },
            { text: "Occasionally, by some individuals", score: 2 },
            { text: "No — not that we're aware of", score: 0 }
        ]
    },
    {
        q: "Does your organisation have a documented policy on what data staff should NOT put into AI tools?",
        dimension: "Safety",
        options: [
            { text: "Yes — written, communicated to staff, and updated", score: 3 },
            { text: "Informally understood but not written down", score: 1 },
            { text: "We've talked about it but haven't formalised anything", score: 2 },
            { text: "No — this hasn't been addressed", score: 0 }
        ]
    },
    {
        q: "How would you describe your organisation's data quality — the data you'd potentially feed into AI tools?",
        dimension: "Readiness",
        options: [
            { text: "Clean, organised, and well-documented", score: 3 },
            { text: "Mostly organised but with some gaps and inconsistencies", score: 2 },
            { text: "Somewhat disorganised — we know it needs work", score: 1 },
            { text: "Honestly: messy, inconsistent, or siloed across systems", score: 0 }
        ]
    },
    {
        q: "Is there a specific problem or bottleneck in your operations that you think AI might help with?",
        dimension: "Opportunity",
        options: [
            { text: "Yes — we have a clear use case in mind", score: 3 },
            { text: "Probably — but we haven't identified a specific use case yet", score: 2 },
            { text: "We're not sure — we're still exploring what AI can do", score: 1 },
            { text: "No — we're not sure AI applies to our work", score: 0 }
        ]
    },
    {
        q: "Does your organisation have someone who could champion an AI initiative — technically curious, trusted by staff?",
        dimension: "Capacity",
        options: [
            { text: "Yes — we have someone ready for this", score: 3 },
            { text: "Possibly — there's someone who's interested but not formally in this role", score: 2 },
            { text: "It's unclear — it would depend on finding the right person", score: 1 },
            { text: "No — this would be a gap we'd need to fill", score: 0 }
        ]
    },
    {
        q: "How does your board currently think about AI?",
        dimension: "Governance",
        options: [
            { text: "Engaged — they're asking the right questions and want a position", score: 3 },
            { text: "Curious — it's come up and they're open to learning more", score: 2 },
            { text: "Mixed — some interested, some concerned, no clear direction", score: 1 },
            { text: "Unaware or not yet engaged with the question", score: 0 }
        ]
    },
    {
        q: "If you ran an AI pilot in your organisation, what would getting it wrong cost you?",
        dimension: "Risk",
        options: [
            { text: "Low stakes — we could try things, learn, and adjust", score: 3 },
            { text: "Medium stakes — mistakes would be visible but recoverable", score: 2 },
            { text: "High stakes — errors could affect vulnerable people we serve", score: 1 },
            { text: "Very high stakes — data sensitivity or compliance makes any error serious", score: 0 }
        ]
    },
    {
        q: "Has your organisation encountered any AI-related incidents or close calls — staff sharing sensitive data, misinformation from AI output, etc.?",
        dimension: "Safety",
        options: [
            { text: "No — and we have safeguards in place to prevent it", score: 3 },
            { text: "No — but we haven't thought about it systematically", score: 1 },
            { text: "Yes, minor — we caught it and addressed it", score: 2 },
            { text: "Yes — it was a problem and we're still working out what to do", score: 0 }
        ]
    },
    {
        q: "What's your budget reality for AI tools and support in the next 12 months?",
        dimension: "Resources",
        options: [
            { text: "We have budget allocated or could find it for the right initiative", score: 3 },
            { text: "Very limited — free tools only, no consultant budget", score: 1 },
            { text: "Small but real — could fund some tools and limited advice", score: 2 },
            { text: "No budget — this would have to be completely unfunded", score: 0 }
        ]
    },
    {
        q: "Do staff trust leadership to make good decisions about AI adoption?",
        dimension: "Culture",
        options: [
            { text: "Yes — there's high trust and good communication", score: 3 },
            { text: "Mostly — but there are some concerns about being consulted", score: 2 },
            { text: "Mixed — some distrust of tech decisions in the past", score: 1 },
            { text: "Low trust — any tech change faces significant internal resistance", score: 0 }
        ]
    },
    {
        q: "How does your organisation currently handle the gap between 'someone has a good idea' and 'it becomes standard practice'?",
        dimension: "Capacity",
        options: [
            { text: "Well — we have clear processes for testing and adopting new approaches", score: 3 },
            { text: "Unevenly — some things stick, some don't, no clear pattern", score: 2 },
            { text: "Slowly — good ideas often get lost in day-to-day pressures", score: 1 },
            { text: "Poorly — we struggle to implement change systematically", score: 0 }
        ]
    }
];

const AIREADY_RESULTS = [
    { min: 0, max: 12, label: "Early stage", text: "Your organisation is at the beginning of its AI readiness journey. That's not a problem — most WA community orgs are here. The priority is building foundation: clear policy on data, basic awareness training, and one small safe experiment." },
    { min: 13, max: 22, label: "Building readiness", text: "You have some elements of AI readiness in place, but there are meaningful gaps — often in governance, safety policy, or change capacity. The good news: you're not starting from scratch. Targeted investment in the gaps will unlock the opportunity." },
    { min: 23, max: 29, label: "Ready with conditions", text: "You're genuinely ready to run a well-scoped AI initiative. The conditions are mostly there. The work now is identifying the right use case, managing the risk, and building on what's working." },
    { min: 30, max: 36, label: "Strong foundation", text: "You have strong AI readiness foundations. The question isn't whether to proceed — it's how to do it in a way that's genuinely useful and maintains the constitutional commitments your community needs." }
];

/* ── ORG HEALTH CHECK ── */
const HEALTH_QUESTIONS = [
    {
        q: "How often does your organisation's strategy get reviewed and updated?",
        dimension: "Strategy",
        options: [
            { text: "Annually with clear process and board involvement", score: 3 },
            { text: "Irregularly — when there's a crisis or change in leadership", score: 1 },
            { text: "We have a strategy but it's rarely revisited", score: 2 },
            { text: "We don't have a documented strategy", score: 0 }
        ]
    },
    {
        q: "When something goes wrong in your operations, how well does your organisation understand why?",
        dimension: "Quality",
        options: [
            { text: "We have root cause analysis processes — we understand the why", score: 3 },
            { text: "We usually figure it out but it takes time and varies by person", score: 2 },
            { text: "We fix the symptom but rarely get to the underlying cause", score: 1 },
            { text: "We're in reactive mode — we fix what breaks and move on", score: 0 }
        ]
    },
    {
        q: "How well do your core processes work — the things that happen every day or every week?",
        dimension: "Process",
        options: [
            { text: "They're documented, followed, and regularly reviewed", score: 3 },
            { text: "They mostly work but depend on specific people's knowledge", score: 2 },
            { text: "They're inconsistent — varies by team or person", score: 1 },
            { text: "We don't really have documented processes for most things", score: 0 }
        ]
    },
    {
        q: "How much of your organisation's knowledge lives only in people's heads (not documented)?",
        dimension: "Process",
        options: [
            { text: "Very little — we document well and knowledge is accessible", score: 3 },
            { text: "Some — key roles have things documented, others don't", score: 2 },
            { text: "A lot — if certain people left, we'd be in trouble", score: 1 },
            { text: "Nearly all of it — we're very dependent on specific individuals", score: 0 }
        ]
    },
    {
        q: "How does your organisation handle new ideas for improving how you work?",
        dimension: "Innovation",
        options: [
            { text: "We have a clear process for testing and implementing improvements", score: 3 },
            { text: "Good ideas sometimes get implemented but it's inconsistent", score: 2 },
            { text: "New ideas often get discussed but rarely actioned", score: 1 },
            { text: "There's no real process — it depends on who has energy or authority", score: 0 }
        ]
    },
    {
        q: "How well does your board understand and fulfil its governance role?",
        dimension: "Governance",
        options: [
            { text: "Very well — clear role separation, active oversight, good support", score: 3 },
            { text: "Mostly well — some confusion about roles but generally functional", score: 2 },
            { text: "Unevenly — board engagement varies significantly between members", score: 1 },
            { text: "There are real problems — board/management tension, unclear roles, or disengagement", score: 0 }
        ]
    },
    {
        q: "How healthy is the relationship between board and management?",
        dimension: "Governance",
        options: [
            { text: "Strong — mutual trust, clear communication, healthy tension", score: 3 },
            { text: "Functional — mostly okay but some friction or communication gaps", score: 2 },
            { text: "Strained — there's tension that affects decision-making", score: 1 },
            { text: "Problematic — this is actively getting in the way of the organisation's work", score: 0 }
        ]
    },
    {
        q: "How are your staff going? Not their official wellbeing scores — honestly?",
        dimension: "Quality",
        options: [
            { text: "Good — people are engaged, turnover is low, load is manageable", score: 3 },
            { text: "Mixed — some people are fine, others are stretched", score: 2 },
            { text: "Tired — there's a sense of sustained overload", score: 1 },
            { text: "Critical — we're losing people or people are quietly disengaged", score: 0 }
        ]
    },
    {
        q: "How well does your organisation measure whether it's actually achieving what it says it's for?",
        dimension: "Strategy",
        options: [
            { text: "Well — we have meaningful outcome measures, not just output counts", score: 3 },
            { text: "We measure activity but not always impact", score: 2 },
            { text: "We report to funders but don't really know if we're making a difference", score: 1 },
            { text: "We don't have a clear measurement framework", score: 0 }
        ]
    },
    {
        q: "In the last 12 months, has your organisation tried something genuinely new — not just iteration on existing work?",
        dimension: "Innovation",
        options: [
            { text: "Yes — deliberate innovation, with learning and reflection", score: 3 },
            { text: "Yes — but it was opportunistic rather than strategic", score: 2 },
            { text: "Small experiments — but nothing significant", score: 1 },
            { text: "No — we've been in maintenance or survival mode", score: 0 }
        ]
    },
    {
        q: "How well does your organisation understand the difference between what it's trying to achieve and what it's currently doing to get there?",
        dimension: "Strategy",
        options: [
            { text: "Clearly — there's a strong theory of change and people understand it", score: 3 },
            { text: "Roughly — the connection exists but isn't always explicit", score: 2 },
            { text: "Vaguely — there's a gap between mission language and actual activity", score: 1 },
            { text: "Poorly — activities have drifted from purpose over time", score: 0 }
        ]
    },
    {
        q: "If you had to identify the one process in your organisation that wastes the most energy, how hard would that be?",
        dimension: "Process",
        options: [
            { text: "Easy — we know exactly where the waste is, and we're working on it", score: 3 },
            { text: "Easy — we know where it is, but fixing it hasn't been a priority", score: 2 },
            { text: "Hard — there are too many to pick just one", score: 1 },
            { text: "Very hard — we haven't looked at this systematically", score: 0 }
        ]
    },
    {
        q: "How are your finances? Not the formal audit — honestly?",
        dimension: "Governance",
        options: [
            { text: "Healthy — we have reserves, diversified income, and a plan", score: 3 },
            { text: "Functional — we're okay for now but the buffer is thin", score: 2 },
            { text: "Precarious — we're dependent on one or two grants renewing", score: 1 },
            { text: "In crisis — financial sustainability is the issue we're working against constantly", score: 0 }
        ]
    },
    {
        q: "How quickly can your organisation respond when something externally changes — a policy shift, a funder's priorities, a crisis?",
        dimension: "Innovation",
        options: [
            { text: "Quickly — we have enough slack and decision-making agility", score: 3 },
            { text: "Adequately — we can respond but it takes time and causes stress", score: 2 },
            { text: "Slowly — we're usually catching up, not anticipating", score: 1 },
            { text: "Very slowly — we're too stretched to respond well to change", score: 0 }
        ]
    },
    {
        q: "Does your organisation have the right mix of skills and knowledge on its board?",
        dimension: "Governance",
        options: [
            { text: "Yes — we've mapped what we need and actively recruit for gaps", score: 3 },
            { text: "Mostly — but there are some gaps we've lived with for a while", score: 2 },
            { text: "Uncertain — we've never really assessed this", score: 1 },
            { text: "No — there are clear gaps affecting our governance quality", score: 0 }
        ]
    }
];

const HEALTH_RESULTS = [
    { min: 0, max: 15, label: "Significant concerns", text: "Your organisation has significant operational health concerns across multiple areas. This is more common than you might think, especially after several years of sustained pressure. The good news: these problems are fixable. They just need deliberate attention." },
    { min: 16, max: 25, label: "Areas needing attention", text: "Your organisation has real strengths alongside some meaningful gaps. The pattern of what's working and what isn't is usually telling — it points to where to invest energy first." },
    { min: 26, max: 35, label: "Mostly healthy with gaps", text: "You're in reasonable health with some specific areas that could be strengthened. The foundation is solid. The work is targeted improvement, not rescue." },
    { min: 36, max: 45, label: "Healthy organisation", text: "Your organisation is operating well across most dimensions. That's genuinely rare and worth protecting. The risk at this level is complacency — keeping it healthy requires continued attention." }
];

/* ── QUIZ ENGINE ── */
function buildQuiz(containerId, resultsId, warmId, questions, resultsConfig) {
    const container = document.getElementById(containerId);
    const resultsEl = document.getElementById(resultsId);
    const warmEl = warmId ? document.getElementById(warmId) : null;
    if (!container) return;

    let currentQ = 0;
    let answers = [];
    let shuffledOptions = questions.map(q => {
        const opts = [...q.options];
        return opts; /* keep order as designed */
    });

    function renderStart() {
        container.innerHTML = `
            <div class="quiz-start">
                <h3>${questions.length} questions · Client-side only · No data collected</h3>
                <p>Take about ${Math.ceil(questions.length * 0.5)} minutes. Your answers never leave your browser.</p>
                <button class="quiz-btn-start" id="${containerId}-start">Start →</button>
            </div>`;
        document.getElementById(containerId + '-start').addEventListener('click', function() {
            renderQuestion(0);
        });
    }

    function renderQuestion(idx) {
        const q = questions[idx];
        const opts = shuffledOptions[idx];
        const progress = ((idx) / questions.length) * 100;
        const selected = answers[idx] !== undefined ? answers[idx] : -1;

        container.innerHTML = `
            <div class="quiz-question">
                <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${progress}%"></div></div>
                <div class="quiz-meta">
                    <span class="quiz-dimension">${q.dimension}</span>
                    <span>${idx + 1} / ${questions.length}</span>
                </div>
                <div class="quiz-question-text">${q.q}</div>
                <div class="quiz-options">
                    ${opts.map((opt, i) => `
                        <button class="quiz-option${selected === i ? ' selected' : ''}" data-idx="${i}">
                            <span class="quiz-option-dot"></span>
                            ${opt.text}
                        </button>`).join('')}
                </div>
                <div class="quiz-nav">
                    <button class="quiz-btn-back" ${idx === 0 ? 'disabled' : ''} id="${containerId}-back">← Back</button>
                    <button class="quiz-btn-next" ${selected === -1 ? 'disabled' : ''} id="${containerId}-next">
                        ${idx === questions.length - 1 ? 'See results →' : 'Next →'}
                    </button>
                </div>
            </div>
            <div class="quiz-dots">
                ${questions.map((_, i) => `<button class="quiz-dot ${i === idx ? 'current' : (answers[i] !== undefined ? 'answered' : '')}" data-goto="${i}" aria-label="Question ${i+1}"></button>`).join('')}
            </div>`;

        container.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', function() {
                answers[idx] = parseInt(this.dataset.idx);
                container.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById(containerId + '-next').disabled = false;
            });
        });

        document.getElementById(containerId + '-back').addEventListener('click', function() {
            if (idx > 0) renderQuestion(idx - 1);
        });

        document.getElementById(containerId + '-next').addEventListener('click', function() {
            if (answers[idx] === undefined) return;
            if (idx < questions.length - 1) {
                renderQuestion(idx + 1);
            } else {
                showResults();
            }
        });

        container.querySelectorAll('.quiz-dot').forEach(dot => {
            dot.addEventListener('click', function() {
                renderQuestion(parseInt(this.dataset.goto));
            });
        });
    }

    function showResults() {
        const totalScore = answers.reduce((sum, ansIdx, qIdx) => {
            return sum + (shuffledOptions[qIdx][ansIdx]?.score || 0);
        }, 0);
        const maxScore = questions.length * 3;
        const pct = Math.round((totalScore / maxScore) * 100);

        const result = resultsConfig.find(r => totalScore >= r.min && totalScore <= r.max) || resultsConfig[resultsConfig.length - 1];

        container.innerHTML = '';
        resultsEl.classList.remove('hidden');
        resultsEl.innerHTML = `
            <h3>${result.label}</h3>
            <div class="quiz-score-bar-wrap">
                <div class="quiz-score-label">Overall score</div>
                <div class="quiz-score-track">
                    <div class="quiz-score-fill score-fill-ember" style="width:0%" id="${containerId}-fill"></div>
                </div>
            </div>
            <div class="quiz-result-summary">${result.text}</div>
            <button class="quiz-btn-reset" id="${containerId}-reset">Start again</button>`;

        setTimeout(() => {
            const fill = document.getElementById(containerId + '-fill');
            if (fill) fill.style.width = pct + '%';
        }, 100);

        if (warmEl) warmEl.style.display = 'block';

        document.getElementById(containerId + '-reset').addEventListener('click', function() {
            answers = [];
            resultsEl.classList.add('hidden');
            resultsEl.innerHTML = '';
            if (warmEl) warmEl.style.display = 'none';
            renderStart();
        });

        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderStart();
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
    buildQuiz('sovcheck-quiz', 'sovcheck-results', 'sovcheck-warm', SOVCHECK_QUESTIONS, SOVCHECK_RESULTS);
    buildQuiz('aiready-quiz', 'aiready-results', 'aiready-warm', AIREADY_QUESTIONS, AIREADY_RESULTS);
    buildQuiz('health-quiz', 'health-results', 'health-warm', HEALTH_QUESTIONS, HEALTH_RESULTS);
});
