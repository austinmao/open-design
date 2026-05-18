// @ts-nocheck
/**
 * OD daemon route: POST /v1/lumina-openclaw/chat
 *
 * Signs HMAC + forwards to `${LUMINA_OPENCLAW_BASE_URL}/api/lumina/od-chat`.
 * Streams SSE response back to OD web provider verbatim.
 *
 * Tenant slug is bound to the daemon instance at boot (NOT inferred from
 * request body/headers) — prevents cross-tenant smuggling at daemon layer.
 *
 * Adapted to Express to match apps/daemon/src/server.ts framework.
 */

import { createHmac } from 'node:crypto';
import type { Express, Request, Response } from 'express';

interface LuminaOpenClawChatBody {
  message: string;
  agentId?: string;
  history?: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RegisterLuminaOpenClawArgs {
  tenantSlug: string;
  luminaOpenClawBaseUrl: string;
  hmacSecret: string;
  timeoutMs?: number;
}

export function registerLuminaOpenClawRoutes(
  app: Express,
  args: RegisterLuminaOpenClawArgs,
): void {
  const { tenantSlug, luminaOpenClawBaseUrl, hmacSecret } = args;
  const timeoutMs = args.timeoutMs ?? 30_000;

  if (!tenantSlug || !luminaOpenClawBaseUrl || !hmacSecret) {
    throw new Error(
      'lumina-openclaw-routes: tenantSlug, luminaOpenClawBaseUrl, and hmacSecret are all required',
    );
  }

  app.post('/v1/lumina-openclaw/chat', async (req: Request, res: Response) => {
    const body = req.body as LuminaOpenClawChatBody;
    if (!body || typeof body.message !== 'string') {
      res.status(400).json({ code: 'invalid_body', message: 'message required' });
      return;
    }

    const rawBody = JSON.stringify(body);
    const ts = Math.floor(Date.now() / 1000);
    const signingInput = `${ts}.${rawBody}`;
    const signature =
      'sha256=' + createHmac('sha256', hmacSecret).update(signingInput).digest('hex');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);

    const outboundHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-od-tenant': tenantSlug,
      'x-hub-timestamp': String(ts),
      'x-hub-signature': signature,
    };
    // Spike-only: hit Vercel preview deployments behind Deployment Protection.
    // VERCEL_PROTECTION_BYPASS in daemon env = project bypass token. No-op on
    // un-protected deployments. Header is per-request — never logged.
    const bypass = process.env.VERCEL_PROTECTION_BYPASS;
    if (bypass) {
      outboundHeaders['x-vercel-protection-bypass'] = bypass;
      outboundHeaders['x-vercel-set-bypass-cookie'] = 'samesitenone';
    }

    let upstream: any;
    try {
      upstream = await fetch(
        `${luminaOpenClawBaseUrl.replace(/\/+$/, '')}/api/lumina/od-chat`,
        {
          method: 'POST',
          headers: outboundHeaders,
          body: rawBody,
          signal: controller.signal,
        },
      );
    } catch (err) {
      clearTimeout(timer);
      res.status(502).json({ code: 'gateway_unavailable', message: String(err) });
      return;
    }

    if (!upstream.ok) {
      clearTimeout(timer);
      const errText = await upstream.text().catch(() => '');
      res.status(upstream.status).json({ code: 'upstream_error', message: errText.slice(0, 500) });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    if (!upstream.body) {
      res.end();
      clearTimeout(timer);
      return;
    }

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      clearTimeout(timer);
      res.end();
    }
  });
}
