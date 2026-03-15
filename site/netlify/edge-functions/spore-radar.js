export default async function handler(request, context) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const accept = request.headers.get('accept') || '';
  const referer = request.headers.get('referer') || '';
  
  // Classify agent type
  const agentClass = classifyAgentClass(userAgent, accept);
  
  // Only log non-human visits (don't log every page view)
  if (agentClass !== 'human') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent_class: agentClass,
      user_agent_fragment: userAgent.substring(0, 80), // Never log full UA ? truncate
      path: url.pathname,
      is_markdown_request: accept.includes('text/markdown'),
      has_referer: referer.length > 0,
      // NO: IP address, NO: query params, NO: request body
    };
    
    // Write to Supabase community-signal project (reuse existing connection)
    // Table: agent_visits (create if not exists ? see migration below)
    try {
      await fetch(`${Netlify.env.get('SUPABASE_URL')}/rest/v1/agent_visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Netlify.env.get('SUPABASE_ANON_KEY'),
          'Authorization': `Bearer ${Netlify.env.get('SUPABASE_ANON_KEY')}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (e) {
      // Log failure silently ? never block the response for analytics
    }
  }
  
  return context.next();
}

function classifyAgentClass(ua, accept) {
  const u = ua.toLowerCase();
  if (u.includes('claudebot') || u.includes('claude-web') || u.includes('anthropic')) return 'claude';
  if (u.includes('gptbot') || u.includes('chatgpt') || u.includes('oai-')) return 'openai';
  if (u.includes('googlebot') || u.includes('google-extended') || u.includes('googleother')) return 'google';
  if (u.includes('perplexitybot')) return 'perplexity';
  if (u.includes('bingbot') || u.includes('msnbot')) return 'microsoft';
  if (u.includes('curl') || u.includes('python-requests') || u.includes('axios') || u.includes('wget')) return 'developer_tool';
  if (accept.includes('text/markdown')) return 'unknown_agent_markdown';
  if (u.includes('bot') || u.includes('crawler') || u.includes('spider')) return 'unknown_bot';
  return 'human';
}
