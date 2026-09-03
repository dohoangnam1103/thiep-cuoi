import assert from 'node:assert/strict';

const base = process.argv[2];
if (!base) throw new Error('Usage: node verify-preview.mjs <preview-origin>');
async function check(path, status = 200) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  const body = await response.text();
  assert.equal(response.status, status, path);
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/, path);
  console.log(JSON.stringify({ path, status, cache: response.headers.get('cache-control') }));
  return { response, body };
}
const listing = await check('/mau-thiep');
assert.match(listing.body, /listing-thumbnails/);
assert.equal(listing.response.headers.get('cache-control'), 'private, no-store');
const sources = [...listing.body.matchAll(/(?:src|href)="([^"<>]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
for (const suffix of ['.js', '.css']) {
  const asset = sources.find(src => src.startsWith('/_next/static/') && src.includes(suffix));
  assert.ok(asset);
  const { response } = await check(asset);
  assert.match(response.headers.get('cache-control'), /public.*immutable/);
}
const thumbnail = sources.find(src => src.includes('/listing-thumbnails/'));
assert.ok(thumbnail);
const { response: image } = await check(thumbnail);
assert.match(image.headers.get('cache-control'), /public.*max-age=2592000/);
await check('/');
await check('/login');
await check('/api/auth/session');
const dashboard = await check('/dashboard');
assert.equal(dashboard.response.headers.get('cache-control'), 'private, no-store');
assert.match(dashboard.body, /NEXT_REDIRECT[^<]*login/);
await check('/mau-thiep/long-phung-v3-do/demo');
await check('/api/cron/trial-reminders', 403);
await check('/api/payos/webhook', 403);
await check('/robots.txt');
console.log('PASS: public preview, assets/cache, login boundary, demo and integration blocks');
