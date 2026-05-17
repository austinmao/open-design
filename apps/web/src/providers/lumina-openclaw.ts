/**
 * Streams chat through OpenClaw via OD daemon's lumina-openclaw routes.
 *
 * SPIKE LIMITATION ("no-replay mode"): runId/runStatus/lastRunEventId NOT
 * preserved. Reattach/cancel/replay disabled when this provider is selected.
 * Full integration is Phase 2.
 */

// SPIKE: inline interface — contract source-of-truth lives at
// packages/contracts/src/api/lumina-openclaw.ts. Promoted to a package
// export when this surface graduates from spike → Phase 2.
export interface LuminaOpenClawChatRequest {
  message: string;
  agentId?: string;
  history?: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>;
}

export interface StreamLuminaOpenClawInput {
  daemonBaseUrl: string;
  signal?: AbortSignal;
  request: LuminaOpenClawChatRequest;
}

export async function streamLuminaOpenClaw(
  input: StreamLuminaOpenClawInput,
): Promise<ReadableStream<Uint8Array>> {
  const url = `${input.daemonBaseUrl.replace(/\/+$/, '')}/v1/lumina-openclaw/chat`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(input.request),
    signal: input.signal,
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    throw new Error(`lumina-openclaw daemon returned ${resp.status}: ${errBody.slice(0, 200)}`);
  }
  if (!resp.body) {
    throw new Error('lumina-openclaw daemon response had no body');
  }
  return resp.body;
}
