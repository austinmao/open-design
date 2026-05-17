/**
 * Contract for OD → OpenClaw S2S chat bridge.
 * OpenClaw-side route: POST https://app.holalumina.com/api/lumina/od-chat
 *
 * Auth: HMAC-SHA256 over `${unix_ts_seconds}.${rawBody}` with per-tenant
 * secret `OD_S2S_HMAC_SECRET_<TENANT_UPPER>`. Headers:
 *   x-od-tenant      : tenant slug (e.g. "ceremonia")
 *   x-hub-timestamp  : unix seconds, ±300s window
 *   x-hub-signature  : "sha256=<lowercase-64-hex>"
 */

export interface LuminaOpenClawChatRequest {
  message: string;
  agentId?: string;
  history?: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LuminaOpenClawErrorEnvelope {
  type: 'error';
  code:
    | 'gateway_unavailable'
    | 'gateway_timeout'
    | 'tenant_not_provisioned'
    | 'rate_limited'
    | 'unauthorized'
    | 'tool_error';
  message: string;
  retryAfterSeconds?: number;
}

export interface LuminaOpenClawErrorResponse {
  code: string;
  message: string;
}
