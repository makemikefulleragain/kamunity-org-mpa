// Public AI conversations are held for this email-only MPA release.
// Keep the route fail-closed so old links cannot trigger a paid provider call.
export const handler = async () => ({
  statusCode: 410,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify({
    error: 'feature_not_available',
    contact: 'mike@kamunityconsulting.com',
  }),
});
