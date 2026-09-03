// Read-only public/auth-boundary checks; never sends a valid payment/cron request.
import assert from "node:assert/strict";

const origin = process.argv[2] ?? "http://127.0.0.1:3000";
const deployment = process.argv[3] ?? "cpu-opt-20260830";
const demo = "/mau-thiep/long-phung-v3-do/demo";
async function request(path, options = {}) {
  return fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(15000), ...options });
}
async function html(path) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  return { response, body: await response.text() };
}
for (const path of ["/", "/bang-gia", demo]) {
  await html(path);
  const { response, body } = await html(path);
  assert.equal(response.headers.get("x-nextjs-cache"), "HIT", path);
  assert.ok(body.includes(`dpl=${deployment}`) || body.includes(`data-dpl-id="${deployment}"`), `Deployment: ${path}`);
  assert.ok(body.includes(`rel="canonical" href="https://thiepmungonline.com${path === "/" ? "" : path}`), `Canonical: ${path}`);
  assert.ok(!body.includes("trycloudflare.com"), `No preview URL: ${path}`);
  if (path === demo && deployment.startsWith("detail-preload-")) {
    assert.ok(body.includes('data-invitation-detail="waiting"'), "Detail does not compete with the initial cover");
    assert.ok(!/<img[^>]+src="[^"]*\/gallery\//.test(body), "No detail gallery images in initial HTML");
  }
  console.log(JSON.stringify({ path, status: response.status, cache: response.headers.get("x-nextjs-cache"), bytes: Buffer.byteLength(body) }));
  if (path === "/") {
    const script = body.match(/<script[^>]+src="([^"]+\.js[^\"]*)"/);
    const css = body.match(/<link[^>]+href="([^"]+\.css[^\"]*)"/);
    assert.ok(script && css, "JS/CSS in Home");
    for (const match of [script, css]) {
      assert.equal((await request(match[1].replaceAll("&amp;", "&"))).status, 200, "Static asset");
    }
  }
}
const listing = await html("/mau-thiep");
assert.match(listing.response.headers.get("cache-control"), /no-store/);
const lab = await html("/home-2/lab/v11");
assert.match(lab.body, /name="robots" content="[^"]*noindex/);
assert.equal((await request("/chungdoi/icon-v2.png")).status, 200);
const captureRedirect = await request(`${demo}?capture=1`);
assert.equal(captureRedirect.status, 307);
assert.equal(new URL(captureRedirect.headers.get("location"), origin).pathname, `${demo}/capture`);
const capture = await html(`${demo}/capture`);
assert.match(capture.response.headers.get("cache-control"), /no-store/);
assert.ok(capture.body.includes('data-capture-mode="true"'));
if (deployment.startsWith("detail-preload-")) {
  assert.ok(capture.body.includes('data-invitation-detail="visible"'), "Capture bypasses background preparation");
}
for (const path of ["/dashboard", "/admin", "/api/payment/deployment-check/status"]) {
  const response = await request(path);
  if (response.status === 200 && !path.startsWith("/api/")) {
    // App Router may begin streaming the layout before emitting its redirect.
    assert.match(response.headers.get("cache-control"), /no-store/, path);
    assert.match(await response.text(), /NEXT_REDIRECT[^<]*login/, path);
  } else {
    assert.ok([303, 307, 401, 403].includes(response.status), `Auth boundary: ${path}`);
    if (response.status < 400) assert.match(response.headers.get("location"), /login/);
  }
}
for (const path of ["/login", "/api/auth/session"]) await html(path);
const signupRedirect = await request("/signup");
assert.equal(signupRedirect.status, 307);
assert.equal(new URL(signupRedirect.headers.get("location"), origin).pathname, "/login");
for (const path of ["/api/cron/payos-reconcile", "/api/cron/trial-reminders"]) {
  const response = await request(path, { method: "POST" });
  assert.equal(response.status, 401, `Unauthorized cron: ${path}`);
}
const invalidWebhook = await request("/api/payos/webhook", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
});
assert.equal(invalidWebhook.status, 400);
console.log("PASS: production HTML cache, assets, V11 noindex, capture, auth and rejected integration requests");
