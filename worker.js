const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';
const CACHE_TTL = 600; // 10 minutes

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Redirect root to GitHub
    if (url.pathname === '/') {
      return Response.redirect('https://github.com/hcl-z/tmdb-proxy-cf', 301);
    }

    // Image proxy: /t/p/* → image.tmdb.org
    if (url.pathname.startsWith('/t/p/')) {
      return proxyImage(request, url);
    }

    // API proxy: everything else → api.themoviedb.org
    return proxyApi(request, url, ctx);
  },
};

async function proxyImage(request, url) {
  const target = `${TMDB_IMAGE_BASE}${url.pathname}${url.search}`;
  const response = await fetch(target, {
    headers: { 'User-Agent': 'tmdb-proxy/1.0' },
    cf: { cacheEverything: true, cacheTtl: CACHE_TTL },
  });

  const newResp = new Response(response.body, response);
  newResp.headers.set('Access-Control-Allow-Origin', '*');
  return newResp;
}

async function proxyApi(request, url, ctx) {
  const targetUrl = `${TMDB_API_BASE}${url.pathname}${url.search}`;
  const cacheKey = new Request(targetUrl, { method: 'GET' });
  const cache = caches.default;

  // Check cache
  const cached = await cache.match(cacheKey);
  if (cached) {
    const resp = new Response(cached.body, cached);
    resp.headers.set('X-Cache', 'HIT');
    return resp;
  }

  // Forward request to TMDB
  const headers = { 'User-Agent': 'tmdb-proxy/1.0' };
  const auth = request.headers.get('Authorization');
  if (auth) headers['Authorization'] = auth;

  let response;
  try {
    response = await fetch(targetUrl, { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach TMDB', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const respHeaders = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => respHeaders.set(k, v));
  respHeaders.set('X-Cache', 'MISS');

  const body = await response.arrayBuffer();
  const newResp = new Response(body, { status: response.status, headers: respHeaders });

  // Cache only successful responses
  if (response.ok) {
    const cacheResp = new Response(body, { status: response.status, headers: respHeaders });
    cacheResp.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
    ctx.waitUntil(cache.put(cacheKey, cacheResp));
  }

  return newResp;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
