# Security Policy

## Reporting a vulnerability

Email **sean@melis.ai** with subject `SECURITY: <service or component>`.

For high-severity issues (RCE, wallet drain, settlement bypass, SSRF on a production service), please **do not open a public GitHub issue** until we've shipped a fix and confirmed it back to you.

## Response targets

| Severity | Acknowledgement | First update | Fix shipped |
|----------|-----------------|--------------|-------------|
| Critical (active exploitation, wallet at risk) | 24 hours | 48 hours | < 7 days |
| High (privilege escalation, settlement integrity) | 48 hours | 7 days | < 30 days |
| Medium (information leak, SSRF without impact) | 7 days | 30 days | next planned release |
| Low (best-practice deviation) | 14 days | 60 days | when prioritised |

## Scope

In scope:

- The MCP wrapper in this repository (`@melis-ai/x402-tools-mcp`)
- The 22 production services hosted at `*.melis.ai` (see [agents.melis.ai](https://agents.melis.ai))
- Settlement flow on Base (USDC, x402 protocol implementation)

Out of scope:

- Vulnerabilities in upstream dependencies (Playwright, OpenAI, Qdrant, Resend, Telegram, api4.ai) — please report those upstream first
- Issues in the x402 protocol spec itself — see [x402.org](https://x402.org)
- Denial-of-service via volume (per-payer rate limits exist; see /docs/x402-payment for details)
- Social engineering, physical attacks, or compromised end-user wallets

## Supported versions

The deployed services at `*.melis.ai` are continuously updated. There is no "version" — all changes are tracked in the commit history.

The npm package follows semver. The latest minor version is supported; older minors are not.

## Audit history

A full fleet audit was completed 2026-05-08 covering all 22 services across 10 factors (liveness, settlement integrity, caller protection, functional integrity, network/input security, authorisation, upstream consumption, observability, liability hygiene, marketing fidelity). Reports are not public for security reasons but are available on request from sean@melis.ai.

## Settlement transparency

All service payments settle to a single fleet wallet on Base:
`0x1C680703D6cF7dfC9FEABb5AA28E64B869ddB3bC` ([live transfers on Basescan](https://basescan.org/address/0x1C680703D6cF7dfC9FEABb5AA28E64B869ddB3bC#tokentxns))

PDF Render uses a separate wallet:
`0x61F2eF18ab0630912D24Fd0A30288619735AfFf5`

These addresses are pinned in the x402 challenge response of every service — verify the `payTo` field before paying.

## Charge-on-success guarantee

Every service uses the same patched `@melis/x402-sdk` middleware which settles payment only on HTTP 2xx responses (verified at `packages/x402-sdk/src/middleware.ts:160` in the services repo). 4xx and 5xx responses, including SSRF blocks, malformed inputs, upstream failures, and CSAM 451s, never settle. If you can demonstrate a path where payment settles on a non-2xx response, that's a critical bug — please report it.

## Credit

Thank you for helping keep melis x402 Tools safe. With your permission, we credit responsible disclosures in a public hall-of-fame after the fix ships.
