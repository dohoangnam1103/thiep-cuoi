/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node gateway runs without a package manifest. */
const http = require('node:http');

const blocked = /^(?:\/api\/(?:cron|payos|casso|payment|email)(?:\/|$)|\/dashboard\/[^/]+\/thanh-toan(?:\/|$))/;
const publicAsset = /^\/(?:_next\/static\/|chungdoi\/(?:images|templates|labs|fonts|music|videos)\/|thiepmungonline\/|images\/)/;
const assetType = /^(?:image\/|font\/|audio\/|video\/|text\/css|(?:text|application)\/javascript|application\/font-woff)/;

function cacheControlFor(req, headers, statusCode) {
  const fallback = 'private, no-store';
  if (!['GET', 'HEAD'].includes(req.method) || req.headers.authorization || headers['set-cookie']) return fallback;
  if (statusCode !== 304 && (statusCode < 200 || statusCode >= 300)) return fallback;
  const policy = headers['cache-control'] || '';
  if (!/\bpublic\b/i.test(policy) || /\b(?:private|no-store)\b/i.test(policy)) return fallback;
  try {
    const url = new URL(req.url, 'http://preview.invalid');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/_next/image') {
      const source = url.searchParams.get('url') || '';
      if (!source.startsWith('/') || source.startsWith('//')) return fallback;
      const sourcePath = decodeURIComponent(new URL(source, 'http://preview.invalid').pathname);
      return publicAsset.test(sourcePath) && (statusCode === 304 || /^image\//.test(headers['content-type'] || '')) ? policy : fallback;
    }
    return publicAsset.test(pathname) && (statusCode === 304 || assetType.test(headers['content-type'] || '')) ? policy : fallback;
  } catch {
    return fallback;
  }
}

function createPreviewGateway({ upstreamPort = 3211 } = {}) {
  const server = http.createServer((req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Referrer-Policy', 'same-origin');
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://preview.invalid').pathname); }
    catch { res.writeHead(400); res.end('Invalid URL'); return; }
    if (pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('User-agent: *\nDisallow: /\n');
      return;
    }
    if (blocked.test(pathname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Chức năng email và thanh toán bị tắt trên bản preview.');
      return;
    }
    const headers = { ...req.headers, 'x-forwarded-host': req.headers.host, 'x-forwarded-proto': 'https' };
    if (/^Basic /i.test(headers.authorization || '')) delete headers.authorization;
    const upstream = http.request({ hostname: '127.0.0.1', port: upstreamPort, path: req.url, method: req.method, headers }, response => {
      const outgoing = { ...response.headers,
        'x-robots-tag': 'noindex, nofollow, noarchive',
        // Use forwarded headers: obsolete gateway Basic credentials were stripped above.
        'cache-control': cacheControlFor({ method: req.method, url: req.url, headers }, response.headers, response.statusCode || 502),
        'referrer-policy': 'same-origin',
      };
      if (outgoing.location) {
        try {
          const target = new URL(outgoing.location);
          if (['thiepmungonline.com', 'www.thiepmungonline.com', '127.0.0.1', 'localhost'].includes(target.hostname)) {
            outgoing.location = `${target.pathname}${target.search}${target.hash}`;
          }
        } catch { /* Relative redirects stay on the preview. */ }
      }
      res.writeHead(response.statusCode || 502, outgoing);
      response.pipe(res);
    });
    upstream.setTimeout(90_000, () => upstream.destroy(new Error('Origin timeout')));
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end('Preview origin unavailable');
    });
    req.on('aborted', () => upstream.destroy());
    res.on('close', () => { if (!res.writableFinished) upstream.destroy(); });
    req.pipe(upstream);
  });
  server.requestTimeout = 120_000;
  server.headersTimeout = 30_000;
  return server;
}

module.exports = { cacheControlFor, createPreviewGateway };
if (require.main === module) {
  createPreviewGateway().listen(3210, '127.0.0.1', () => console.log('Public noindex preview gateway listening on 127.0.0.1:3210'));
}
