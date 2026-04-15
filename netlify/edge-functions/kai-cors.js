/**
 * kai-cors.js — Netlify Edge Function
 * 
 * Wraps the kai-proxy serverless function response with CORS headers.
 * 
 * Why: Netlify's CDN strips custom headers from serverless function responses.
 * Edge Functions run AT the CDN layer and can set headers that persist.
 * 
 * This edge function intercepts all requests to /.netlify/functions/kai-proxy,
 * passes them through to the actual function, then adds CORS headers to the
 * response before returning to the browser.
 * 
 * Constitutional note: No data is stored, logged, or modified. This is a
 * pass-through that adds transport headers only.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

export default async (request, context) => {
  // Handle OPTIONS preflight directly at the edge — never hits the function
  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Pass through to the actual kai-proxy function
  const response = await context.next();

  // Clone the response so we can modify headers
  const body = await response.text();

  // Return with CORS headers added
  return new Response(body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      ...CORS_HEADERS,
    },
  });
};
