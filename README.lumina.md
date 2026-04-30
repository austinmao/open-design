# Lumina Fork — open-design

**Upstream**: [nexu-io/open-design](https://github.com/nexu-io/open-design)
**Pinned upstream SHA**: `d25a7aaf4219d69b6a3055ddda25fbce0dafd24d` (captured 2026-04-30)
**Fork branch**: `lumina-1.0.0`
**Fork purpose**: 5-day customer demo sprint for Eric Edmeades — strip BYOK UI, route 100% of AI calls through Lumina gateway, ship STOP IT keynote landing page demo with iMessage agent handoff wedge.

## Why this fork exists

Spec 100 in `austinmao/openclaw` repo (`specs/100-open-design-demo/plan.md`). Day-0 capability spike validated SHIP_B verdict — single-page generation → live Vercel URL pipeline. This fork applies the BYOK UI gut + Lumina gateway routing per spike memo Section 6 file list.

## Day-1 Acceptance Criteria

- [x] T002: Upstream installs + generates a page out-of-the-box (validated 2026-04-30)
- [x] T003: Fork created, `lumina-1.0.0` branch pinned to upstream SHA above
- [ ] T004: Test fixtures for daemon proxy token injection (failing pre-implementation)
- [ ] T005: 18-file BYOK gut + Lumina gateway wire (`apps/daemon/src/server.ts:1670-1749` splice point)
- [ ] T006: Update e2e fixtures (`e2e/specs/app.spec.ts` + `apps/web/src/providers/sse.test.ts`)
- [ ] T007: Day-1 smoke test with real Lumina openrouter creds (Doppler `prd`)

## Constraints (from spec 100)

- Stay close to upstream — minimal diff, prefer single-file daemon proxy + CSS-hide UI over full 18-file React component rip-out (UC4 minimal-surface variant)
- AI routing 100% via Lumina gateway (`LUMINA_GATEWAY_URL` + `LUMINA_GATEWAY_TOKEN` env vars)
- NEVER expose per-tenant API keys in UI
- Pin to `d25a7aaf4219d69b6a3055ddda25fbce0dafd24d` until upstream is re-evaluated post-demo

## Wedge (per spec 100 plan.md)

Generated landing pages POST lead form submissions into the customer's existing Lumina iMessage agent for real-time human-in-the-loop conversion. Differentiator vs Lovable / Vercel v0 / Bolt.new / Replit Agent — they ship pages, Lumina ships pages-into-living-agent-conversations.

## Day-2 Kill Gate (NON-NEGOTIABLE)

End of Day 2, ALL THREE must be true:
1. Day-1 install gate passed AND Day-2 acceptance technically achieved (prompt → live URL works)
2. Wedge demonstration plan locked (iMessage agent handoff endpoint defined)
3. Pre-written paid next-step offer drafted ($5k STOP IT pilot, 7-day delivery)

If any fail by EOD Day 2 → resume `austinmao/openclaw` spec 092 lumina-pack Phase 1 Day 3. Demo cancelled.

## Day-5 Demo Structure

- Pass 1 (cold): generic STOP IT prompt, no Eric brand pre-load — proves baseline product capability
- Pass 2 (branded): same prompt, Eric brand context loaded — shows tailoring
- Pass 3 (wedge): visitor on Pass-2 page submits booking form → Eric's iMessage receives structured lead handoff in real-time
- Commercial close: $5k pilot OR named referral committed in-meeting

## Spec / artifact references

- Spec: https://github.com/austinmao/openclaw/blob/100-open-design-demo/specs/100-open-design-demo/plan.md
- Spike memo: https://github.com/austinmao/openclaw/blob/100-open-design-demo/docs/artifacts/open-design-capability-spike-2026-04-30.md
- Brand kit: https://github.com/austinmao/openclaw/blob/100-open-design-demo/docs/artifacts/eric-edmeades-brand-kit-2026-04-30.md
- Tasks: https://github.com/austinmao/openclaw/blob/100-open-design-demo/specs/100-open-design-demo/tasks.md
- Draft PR (openclaw side): https://github.com/austinmao/openclaw/pull/152
