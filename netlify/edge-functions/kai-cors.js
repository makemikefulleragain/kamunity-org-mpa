/**
 * kai-cors.js — Netlify Edge Function
 * 
 * Adds CORS headers to kai-proxy responses.
 * 
 * Why: Netlify's CDN strips custom headers from serverless function responses.
 * Edge Functions run AT the CDN layer and can set headers that persist.
 * 
 * Approach: For OPTIONS, respond directly. For POST, fetch the serverless
 * function internally and return the response with CORS headers added.
 * 
 * Constitutional note: No data is stored, logged, or modified. Pass-through only.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

export default async (request, context) => {
  // Handle OPTIONS preflight directly at the edge
  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // For all other methods, pass through to the serverless function
  // and add CORS headers to the response
  try {
    const response = await context.next();
    
    // Create new headers combining the original response headers with CORS
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
    newHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    // If context.next() fails, try direct fetch as fallback
    try {
      const url = new URL(request.url);
      const fetchResponse = await fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' ? await request.text() : undefined,
      });
      
      const newHeaders = new Headers(fetchResponse.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
      newHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
      
      return new Response(fetchResponse.body, {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: newHeaders,
      });
    } catch (fetchErr) {
      return new Response(JSON.stringify({ error: 'Edge function error', detail: fetchErr.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  }
};
