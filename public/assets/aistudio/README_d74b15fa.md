# Sentinel scanner service

A small, zero-dependency Node service that performs a **passive** check of a public web app and returns a
report in the same shape the Sentinel front end already renders. Detection is deterministic code. A language
model may rephrase explanations later, but it never decides what counts as a finding.

## What one scan does (and never does)

A scan is a short, sequential visit, like one person opening the site:

1. `GET /robots.txt` (honored: a disallow for `SentinelScanner` or `*` stops the scan)
2. `GET /` (the origin root only; any path or query the user typed is dropped)
3. `GET` up to 5 of the site's own same-origin scripts that the page already loads

Hard limits per scan: 10 requests, 1 MB per page, 1.5 MB per script (decompressed size is capped too),
8 s per request, 25 s total, 3 redirects, at least 400 ms between requests to one host.

It never logs in, submits forms, fuzzes, guesses paths (`/.env`, `/admin`, ...), follows third-party links,
runs the page's JavaScript, or downloads source maps. Authentication, authorization and database rules are
always reported as **not assessed**.

## Why it will not break a target or burn your home IP

- **Runs in the cloud, not at home.** Targets only ever see your cloud host's address. Never run this
  against other people's sites from your own connection.
- **Identifies itself.** The User-Agent names the scanner and your contact address (`SCANNER_CONTACT`).
  Do not use rotating or residential proxies to get around blocks. If a site blocks the scanner, that is its
  right and the scanner reports it.
- **Backs off.** A 429 or 5xx from robots.txt, the page or a script stops the scan. A host that errored is not
  retried for 2 minutes. A scanned host is cached for 10 minutes. Simultaneous requests for one site share one scan.
- **Rate limited.** Per client (6 fresh scans/hour), globally (150/hour) and by concurrency (3 at once).
- **SSRF-safe.** Only ports 80 and 443, no IP literals, no credentials. The socket connects only to an address the
  guard validated (private, loopback, link-local, cloud-metadata, CGNAT, NAT64, 6to4 and mapped ranges are refused,
  and if any DNS answer is private the whole lookup is refused). Redirects are followed by hand and every hop is
  re-validated.
- **Never echoes secrets.** Evidence shows only the first 4 characters and the length, and cookie values are never read out.

## Run and test

```sh
npm test            # 40 tests, no network needed
npm start           # listens on :8080
```

## Deploy (Google Cloud Run)

```sh
gcloud run deploy sentinel-scanner --source . --region us-central1 \
  --allow-unauthenticated --max-instances 1 --concurrency 8 --memory 512Mi --cpu 1 --timeout 60 \
  --set-env-vars "ALLOWED_ORIGINS=https://YOUR-FRONTEND,SCANNER_CONTACT=you@your-domain,TRUST_PROXY_HOPS=1"
```

`--max-instances 1` matters: rate limits live in memory. Before using more instances, move them to Redis.

After deploying, check the client-address setting: call `https://YOUR-SERVICE/api/whoami` from two different
networks (for example your phone on mobile data). You should see two different addresses. If you see the same
one, change `TRUST_PROXY_HOPS` and redeploy.

## API

`POST /api/scan` with `{ "url": "https://example.com" }`

Success returns `mode: "LIVE_PASSIVE"`, `requestedOrigin`, `origin`, `scannedAt`, `score`, `grade`,
`findings[]` (same fields as the demo fixtures plus `kind`), `observations[]`, `checked[]` (every check run and
its result), `coverage` (requests made, scripts checked, whether it stopped early, not assessed, not done) and
`limitations`. A repeat within 10 minutes also returns `cached: true`.

Errors return `{ "error": { "code", "message" } }`. Codes: `INVALID_URL`, `PORT_NOT_ALLOWED`, `IP_NOT_ALLOWED`,
`HOST_NOT_ALLOWED`, `ROBOTS_DISALLOW`, `TARGET_UNHEALTHY`, `TIMEOUT`, `UNREACHABLE`, `TLS_ERROR`, `DNS_FAILED`,
`BLOCKED_ADDRESS`, `TOO_MANY_REDIRECTS`, `SCAN_DEADLINE`, `RATE_LIMITED` (429), `BUSY` (503).

## Front end changes required before enabling live scans

1. Call the service: `fetch(`${import.meta.env.VITE_SCANNER_URL}/api/scan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })`.
2. `Report` must take the report as a prop instead of importing the fixture `findings`. Bind the score bar width and
   grade colour to `report.score` (they are hard-coded to 55% today).
3. **Fix the copy. These statements become false once live scanning is on:** "Simulation only. Your URL is not
   contacted or stored", "Simulated report - no actual scan performed", "No live scanning", the DEMO MODE tag, the
   scope dialog text and the FAQ answers. Say instead what is true: Sentinel makes a handful of requests to the
   public page, honors robots.txt, never logs in or probes hidden paths, and stores nothing.
4. Keep the fixture report for `fieldnotes.example` as the explicit demo, labeled as a sample.
5. Surface `coverage` and `checked[]` in the report. They are the visible proof of what was and was not looked at.

## Embedding in another Node server (Express, AI Studio server.ts)

`createApp(...)` returns an `http.Server` that also exposes `server.listener(req, res)`. In a host app, build it
the way `startServer` does and route only `POST /api/scan`, `GET /api/whoami` and `GET /healthz` to `listener`.
Mount that route **before** any body parser (`express.json()` etc.): the scanner reads the raw request stream
itself, and a body parser that runs first will make requests hang.

## Security notes

- Keep the Gemini key on the server. A key in the browser bundle is visible to every visitor, and this scanner would flag it.
- Add Cloudflare Turnstile or similar before promoting the endpoint widely. Any public scanner can be misused as a
  proxy, which is why scans are passive, tiny, cached and identified.
- A deeper tier (path checks, header probes beyond the home page) should require proving ownership of the domain
  first (DNS TXT record or a file at a known path). Do not add it to the anonymous tier.
