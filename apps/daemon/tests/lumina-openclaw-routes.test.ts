// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import http from 'node:http';
import { registerLuminaOpenClawRoutes } from '../src/lumina-openclaw-routes.js';

const REAL_FETCH = global.fetch;
const UPSTREAM_HOST = 'openclaw.test';

afterEach(() => {
  global.fetch = REAL_FETCH;
});

interface ServerHandle {
  url: string;
  close: () => Promise<void>;
}

async function startApp(): Promise<ServerHandle> {
  const app = express();
  app.use(express.json());
  registerLuminaOpenClawRoutes(app, {
    tenantSlug: 'ceremonia',
    luminaOpenClawBaseUrl: `http://${UPSTREAM_HOST}`,
    hmacSecret: 'test-secret',
  });
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('listen address missing');
  return {
    url: `http://127.0.0.1:${addr.port}`,
    close: () => new Promise((r) => server.close(() => r())),
  };
}

// URL-discriminating fetch mock: outer test calls (127.0.0.1) pass through to
// the real fetch (which hits the live Express server); only the route's
// forwarding call to UPSTREAM_HOST is captured by `upstreamSpy`.
function installUpstreamMock(opts: { handler: (init: RequestInit) => Promise<Response> }) {
  const upstreamSpy = vi.fn(async (url: string, init: RequestInit) => opts.handler(init));
  global.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes(UPSTREAM_HOST)) {
      return upstreamSpy(url, init as RequestInit);
    }
    return REAL_FETCH(input, init);
  }) as typeof global.fetch;
  return upstreamSpy;
}

describe('registerLuminaOpenClawRoutes (Express)', () => {
  it('signs request with HMAC and forwards to OpenClaw', async () => {
    const upstreamSpy = installUpstreamMock({
      handler: async () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data: {"type":"finish"}\n\n'));
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      },
    });

    const srv = await startApp();
    try {
      const resp = await fetch(`${srv.url}/v1/lumina-openclaw/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });
      expect(resp.status).toBe(200);
      expect(upstreamSpy).toHaveBeenCalledTimes(1);
      const [url, init] = upstreamSpy.mock.calls[0]!;
      expect(url).toBe(`http://${UPSTREAM_HOST}/api/lumina/od-chat`);
      const headers = (init as any)?.headers as Record<string, string>;
      expect(headers['x-od-tenant']).toBe('ceremonia');
      expect(headers['x-hub-signature']).toMatch(/^sha256=[0-9a-f]{64}$/);
      expect(headers['x-hub-timestamp']).toMatch(/^\d+$/);
    } finally {
      await srv.close();
    }
  });

  it('returns 400 when message missing', async () => {
    const srv = await startApp();
    try {
      const resp = await fetch(`${srv.url}/v1/lumina-openclaw/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'x' }),
      });
      expect(resp.status).toBe(400);
    } finally {
      await srv.close();
    }
  });

  it('returns 502 when upstream fetch fails', async () => {
    installUpstreamMock({
      handler: async () => {
        throw new Error('network error');
      },
    });

    const srv = await startApp();
    try {
      const resp = await fetch(`${srv.url}/v1/lumina-openclaw/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });
      expect(resp.status).toBe(502);
    } finally {
      await srv.close();
    }
  });
});
