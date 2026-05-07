// @ts-nocheck
// Regression: BUG-3 — daemon /healthz returns 404; only /api/health works
// Found by /qa on 2026-05-07 (lumina spec-101 demo follow-up)
// Report: https://github.com/austinmao/openclaw/pull/238
//
// Boot helpers and external monitoring probes follow the legacy `/healthz`
// convention. The daemon serves health on `/api/health`; this test pins the
// alias so removing it triggers a red regression instead of a silent
// false-positive in `/tmp/boot-od-daemon.sh`.
//
// Three layers of coverage (codex-gate pass 3 BLOCKING-MERGE finding):
//   1. Fixture (replicates the dual-route registration pattern)
//   2. Source-grep wiring-drift guard (catches alias deletion)
//   3. Real-server integration via startServer (catches middleware/route-
//      order/static-shadowing regressions that fixture+grep cannot)

import http from 'node:http';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer } from '../src/server.js';

// Replicate the dual-route registration pattern from server.ts so both
// endpoints share a single handler. The wiring-drift test below pins the
// real source file so this fixture cannot diverge from production.
function makeTestApp() {
  const app = express();
  const healthHandler = async (_req, res) => {
    res.json({ ok: true, version: '0.4.1' });
  };
  app.get('/api/health', healthHandler);
  app.get('/healthz', healthHandler);
  app.use((_req, res) => res.status(404).json({ error: 'not found' }));
  return app;
}

describe('daemon health routes', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        server = makeTestApp().listen(0, '127.0.0.1', () => {
          const addr = server.address() as { port: number };
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      }),
  );

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it('GET /healthz returns 200 + ok:true (BUG-3 alias)', async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe('string');
  });

  it('GET /api/health still returns 200 + ok:true (no regression)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe('string');
  });

  it('GET /healthz and /api/health return identical payload shape', async () => {
    const [healthz, apiHealth] = await Promise.all([
      fetch(`${baseUrl}/healthz`).then((r) => r.json()),
      fetch(`${baseUrl}/api/health`).then((r) => r.json()),
    ]);
    expect(Object.keys(healthz).sort()).toEqual(Object.keys(apiHealth).sort());
    expect(healthz.ok).toBe(apiHealth.ok);
  });
});

// Wiring-drift guard: the unit test above asserts a *pattern* in a fixture.
// This test asserts the actual production source file registers the alias.
// Without this, someone could delete the alias from server.ts and the
// fixture-only tests would still pass.
describe('server.ts wiring (BUG-3 regression)', () => {
  it('registers /healthz route in production server.ts', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const serverPath = path.join(here, '..', 'src', 'server.ts');
    const source = readFileSync(serverPath, 'utf8');
    expect(source).toMatch(/app\.get\(\s*['"]\/healthz['"]/);
  });

  it('still registers /api/health route in production server.ts', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const serverPath = path.join(here, '..', 'src', 'server.ts');
    const source = readFileSync(serverPath, 'utf8');
    expect(source).toMatch(/app\.get\(\s*['"]\/api\/health['"]/);
  });
});

// Real-server integration: catches the class of regression that fixture +
// grep cannot — middleware order, static-export shadowing, route-table
// mutations, catch-all 404 placement. Mirrors the version-route.test.ts
// pattern that already proves /api/health against /api/version.
describe('startServer real /healthz integration (BUG-3 regression)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const started = (await startServer({ port: 0, returnServer: true })) as {
      url: string;
      server: http.Server;
    };
    baseUrl = started.url;
    server = started.server;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it('GET /healthz on real daemon returns 200 + ok:true with version', async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe('string');
    expect(body.version.length).toBeGreaterThan(0);
  });

  it('GET /healthz body equals GET /api/health body on real daemon', async () => {
    const [healthzRes, apiHealthRes] = await Promise.all([
      fetch(`${baseUrl}/healthz`),
      fetch(`${baseUrl}/api/health`),
    ]);
    expect(healthzRes.ok).toBe(true);
    expect(apiHealthRes.ok).toBe(true);
    const healthzBody = await healthzRes.json();
    const apiHealthBody = await apiHealthRes.json();
    expect(healthzBody).toEqual(apiHealthBody);
  });
});
