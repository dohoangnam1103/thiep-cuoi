/* eslint-disable @typescript-eslint/no-require-imports -- Tests exercise the standalone CommonJS gateway. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cacheControlFor } = require('./preview-gateway.cjs');

const publicHeaders = { 'cache-control': 'public, max-age=2592000, must-revalidate', 'content-type': 'image/webp' };
const request = (url, method = 'GET', headers = {}) => ({ url, method, headers });

test('preserves explicit public policies for images, optimized images and static bundles', () => {
  for (const url of ['/chungdoi/images/example.webp', '/_next/image?url=%2Fchungdoi%2Fimages%2Fexample.webp&w=640&q=75']) {
    assert.equal(cacheControlFor(request(url), publicHeaders, 200), publicHeaders['cache-control']);
  }
  const js = { 'cache-control': 'public, max-age=31536000, immutable', 'content-type': 'application/javascript' };
  assert.equal(cacheControlFor(request('/_next/static/chunk.js'), js, 200), js['cache-control']);
  assert.equal(cacheControlFor(request('/chungdoi/images/example.webp', 'HEAD'), publicHeaders, 200), publicHeaders['cache-control']);
  assert.equal(cacheControlFor(request('/chungdoi/images/example.webp'), { 'cache-control': publicHeaders['cache-control'] }, 304), publicHeaders['cache-control']);
});

test('never promotes private pages, uploads, errors or authenticated responses into shared cache', () => {
  const urls = ['/mau-thiep', '/dashboard', '/api/users', '/uploads/a.webp', '/_next/image?url=%2Fuploads%2Fa.webp', '/_next/image?url=https%3A%2F%2Fexample.com%2Fa.webp', '/chungdoi/images/../../dashboard', '/chungdoi/images/%ZZ'];
  for (const url of urls) assert.equal(cacheControlFor(request(url), publicHeaders, 200), 'private, no-store');
  const req = request('/chungdoi/images/example.webp');
  for (const status of [302, 404, 500]) assert.equal(cacheControlFor(req, publicHeaders, status), 'private, no-store');
  for (const policy of ['', 'private, max-age=3600', 'public, no-store']) {
    assert.equal(cacheControlFor(req, { ...publicHeaders, 'cache-control': policy }, 200), 'private, no-store');
  }
  assert.equal(cacheControlFor(req, { ...publicHeaders, 'set-cookie': ['session=secret'] }, 200), 'private, no-store');
  assert.equal(cacheControlFor(req, { ...publicHeaders, 'content-type': 'text/html' }, 200), 'private, no-store');
  assert.equal(cacheControlFor(request(req.url, 'POST'), publicHeaders, 200), 'private, no-store');
  assert.equal(cacheControlFor(request(req.url, 'GET', { authorization: 'Bearer token' }), publicHeaders, 200), 'private, no-store');
});
