/* Generated from Phoenix publication-metadata.js; do not edit by hand. */
(function(){"use strict";
// Shared publication vocabulary. Only canonical topic IDs leave the source-tag fallback.
const PUBLIC_RESPONSE_TYPES = {
  article: { label: 'Article', action: 'Read article' },
  opportunity: { label: 'Opportunity notice', action: 'View opportunity details' },
  discussion: { label: 'Discussion proposal', action: 'Read discussion proposal' },
  tool: { label: 'Tool proposal', action: 'Explore tool proposal' },
};
const PUBLIC_TOPICS = {
  'sector-intelligence': 'Sector intelligence',
  'community-practice': 'Community practice',
  'ai-tech': 'AI & technology',
  'policy-funding': 'Policy & funding',
};
const TOPIC_WORDS = {
  'sector-intelligence': ['workforce', 'sector', 'governance', 'mental-health'],
  'community-practice': ['community', 'housing', 'disability', 'wellbeing', 'family', 'volunteer'],
  'ai-tech': ['digital', 'technology', 'software', 'data', 'artificial-intelligence', 'ai'],
  'policy-funding': ['funding', 'grants', 'government', 'regulation', 'policy', 'budgets'],
};
function canonicalTopics(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(value => Object.hasOwn(PUBLIC_TOPICS, value)))].slice(0, 4);
}
function suggestedTopics(tags = []) {
  const clean = (Array.isArray(tags) ? tags : []).filter(tag => typeof tag === 'string').map(tag => tag.toLowerCase());
  const topics = Object.keys(PUBLIC_TOPICS).filter(topic => clean.some(tag => tag === topic || TOPIC_WORDS[topic].some(word => word === 'ai' ? /(^|[^a-z])ai([^a-z]|$)/.test(tag) : tag.includes(word))));
  return topics.length ? topics : ['sector-intelligence'];
}
function responseType(item = {}) {
  const value = item.response_type || item.evidence_pack?.editorial_response_type || item.type;
  return Object.hasOwn(PUBLIC_RESPONSE_TYPES, value) ? value : 'article';
}
function publicationTopics(item = {}, sourceSignals = []) {
  const evidence = item.evidence_pack || {};
  const explicit = canonicalTopics(item.topics).length ? canonicalTopics(item.topics) : canonicalTopics(evidence.public_topics);
  if (explicit.length) return explicit;
  if (canonicalTopics([item.category]).length && !(Array.isArray(item.tags) && item.tags.length)) return [item.category];
  const ids = new Set(item.signal_ids || []);
  const tags = [...(Array.isArray(item.tags) ? item.tags : []), ...(Array.isArray(evidence.tags) ? evidence.tags : []), ...(Array.isArray(evidence.sector_tags) ? evidence.sector_tags : []),
    ...(Array.isArray(evidence.sources) ? evidence.sources : []).flatMap(source => Array.isArray(source?.tags) ? source.tags : []),
    ...sourceSignals.filter(signal => ids.has(signal.id)).flatMap(signal => Array.isArray(signal.tags) ? signal.tags : [])];
  return suggestedTopics(tags);
}
function publicationState(item = {}, now = new Date()) {
  const type = responseType(item), evidence = item.evidence_pack || {};
  if (type === 'tool' || type === 'discussion') return 'Proposed — not yet available';
  if (type !== 'opportunity') return '';
  const deadline = item.deadline || evidence.public_deadline;
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline || '') && now > new Date(deadline + 'T23:59:59+08:00')) return 'Closed';
  return (item.availability || evidence.public_availability) === 'open' ? 'Open — availability checked' : 'Potential — check the details';
}
function cardPresentation(item = {}) {
  const type = responseType(item);
  return { type, label: PUBLIC_RESPONSE_TYPES[type].label, action: PUBLIC_RESPONSE_TYPES[type].action,
    state: publicationState(item), topics: publicationTopics(item), summary: item.summary || '',
    href: '/news?story=' + encodeURIComponent(item.id || item.public_id || '') };
}
function publicationWarnings(body = '') {
  const warnings = [];
  if (/^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:private (?:opportunity|draft|discussion|tool)|for:\s*human editor|internal draft)/im.test(body)) warnings.push('Internal preparation wording is still present. Rewrite it for a public reader.');
  if (/date[^\n]{0,100}(?:inconsistent|should be verified)/i.test(body)) warnings.push('An unresolved date-check note remains. Resolve it before publication.');
  return warnings;
}

window.KamunityPublication = Object.freeze({ PUBLIC_RESPONSE_TYPES, PUBLIC_TOPICS, canonicalTopics, suggestedTopics, responseType, publicationTopics, publicationState, cardPresentation, publicationWarnings });
}());
