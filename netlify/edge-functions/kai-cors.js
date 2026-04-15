/**
 * kai-cors.js — Netlify Edge Function
 * Adds CORS headers to kai-proxy responses.
 */

export default async (request, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  };

  // Handle OPTIONS preflight directly
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Pass through to the serverless function
  const response = await context.next();

  // Add CORS headers to the response
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
};

export const config = { path: '/.netlify/functions/kai-proxy' };
