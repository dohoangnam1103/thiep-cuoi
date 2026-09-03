# Preview VPS stress test — 2026-08-30

## Conclusion

The current one-vCPU shared VPS is healthy after the test, but it is not suitable for 1,000 simultaneously active users. Dynamic page throughput saturated at roughly 12.5 requests/second for the template listing and 19 requests/second for a template demo. Latency crossed the five-second stop threshold before any HTTP errors, service restarts, or out-of-memory events occurred.

This test distinguishes active concurrent requests from connected or idle users. It does not claim a limit for users who already loaded the site and are no longer making requests.

## Safety and scope

- Read-only `GET` requests only.
- No authentication, autosave, upload, payment, or email endpoints were called.
- Short eight-second stages were used, with a stop condition at an error rate above 1%, p95 above five seconds, an OOM event, or impact to the other hosted application.
- The preview app, gateway, tunnel, the existing `lv-clone` application, cgroup memory events, and service restarts were checked between stages.
- Origin measurements passed through a local SSH port forward to the VPS gateway. They therefore include SSH transport overhead and are not pure on-host loopback measurements.
- The public preview measurement used the temporary TryCloudflare URL.

## Host and service baseline

- Host: `163.223.9.198`
- CPU: 1 vCPU, Intel Xeon Platinum 8171M
- RAM: 1,971 MiB; swap: 1,907 MiB
- Preview slice CPU quota: 0.8 CPU
- Preview slice memory high/max: 650/800 MiB
- Another application was running on the same host throughout the test.
- The template listing HTML response was approximately 446 KB before its images.

## Results

### Dynamic template listing: `/mau-thiep`

| Concurrency | Requests | Throughput | p50 | p95 | p99 | Errors |
|---:|---:|---:|---:|---:|---:|---:|
| 5 | 71 | 8.49 req/s | 546 ms | 854 ms | 873 ms | 0 |
| 10 | 90 | 10.50 req/s | 988 ms | 1,087 ms | 1,136 ms | 0 |
| 20 | 100 | 11.57 req/s | 1,678 ms | 2,576 ms | 3,053 ms | 0 |
| 40 | 114 | 12.51 req/s | 3,023 ms | 5,159 ms | 5,404 ms | 0 |

The listing reached the latency stop threshold at concurrency 40. Throughput was already flattening, so concurrency 80, 100, and 1,000 were not attempted on this endpoint.

### Dynamic template demo: `/mau-thiep/long-phung-v3-do/demo`

| Concurrency | Requests | Throughput | p50 | p95 | p99 | Errors |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 133 | 16.17 req/s | 565 ms | 938 ms | 1,029 ms | 0 |
| 20 | 160 | 18.36 req/s | 1,056 ms | 1,308 ms | 1,315 ms | 0 |
| 40 | 160 | 19.37 req/s | 1,893 ms | 3,465 ms | 3,512 ms | 0 |
| 80 | 172 | 19.12 req/s | 3,636 ms | 8,364 ms | 8,467 ms | 0 |

Throughput stopped increasing around 19 requests/second. Concurrency 80 produced severe queuing even though every response still returned HTTP 200.

### Static thumbnail

| Concurrency | Requests | Throughput | p50 | p95 | p99 | Errors |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 1,633 | 194.97 req/s | 379 ms | 1,203 ms | 1,432 ms | 0 |

Static delivery was about ten to fifteen times faster than dynamic HTML. The main bottleneck in this test was dynamic rendering/CPU, not thumbnail serving or memory.

### Public Quick Tunnel: `/mau-thiep`

| Concurrency | Requests | Throughput | p50 | p95 | p99 | Errors |
|---:|---:|---:|---:|---:|---:|---:|
| 20 | 99 | 10.16 req/s | 1,885 ms | 2,392 ms | 2,792 ms | 0 |

Cloudflare documents Quick Tunnels as development/testing only, without an SLA, and limits them to 200 in-flight requests. This temporary tunnel is therefore not a production ingress option for the target load.

## Post-test health

- Preview app, gateway, tunnel, and the existing hosted app: active.
- Service restarts: 0.
- Cgroup memory events: `high=0`, `max=0`, `oom=0`, `oom_kill=0`.
- Peak preview-slice memory observed during the stages: approximately 447 MiB.
- SQLite read-only `PRAGMA quick_check`: `ok`.
- Preview origin, public preview, existing application, and production domain: HTTP 200.

## What the numbers mean for 1,000 users

At the measured listing capacity of 12.5 requests/second, a simultaneous burst of 1,000 initial dynamic requests would require a theoretical minimum of about 80 seconds to clear, before accounting for browser assets, API calls, editing, uploads, or database writes. The real user experience would be worse because requests would time out or queue behind other work.

The server may hold many idle browser sessions, but this benchmark does not validate 1,000 active users loading or editing at once.

## Recommended next steps before another capacity test

1. Replace Quick Tunnel with a named production tunnel and the real custom domain.
2. Give the application dedicated compute. A practical next benchmark target is at least 4 vCPU and 8 GiB RAM; this is a starting point for measurement, not a capacity guarantee.
3. Cache public listing/demo HTML safely at the edge and reduce the roughly 446 KB listing response.
4. Move write-heavy production usage from SQLite to PostgreSQL before validating concurrent editing, or first isolate a test database and measure SQLite/WAL behavior explicitly.
5. Run a realistic staged scenario against an isolated environment: browse templates, open a demo, sign in, edit/autosave, publish, and upload media.
6. Add CPU, p95 latency, HTTP error, service restart, OOM, and database saturation alerts before production load testing.

## Reproduction helper

The read-only load generator is in `scripts/preview/load-test-readonly.mjs`. It consumes each response body, records HTTP statuses/errors/timeouts, and reports throughput plus p50/p95/p99/max latency.
