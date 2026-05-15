# @melis-ai/x402-tools-mcp

[![npm version](https://img.shields.io/npm/v/@melis-ai/x402-tools-mcp.svg)](https://www.npmjs.com/package/@melis-ai/x402-tools-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP compatible](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)
[![x402](https://img.shields.io/badge/x402-protocol-7c3aed.svg)](https://x402.org)
[![Catalogue](https://img.shields.io/badge/catalogue-agents.melis.ai-teal.svg)](https://agents.melis.ai)

Boring infrastructure for agent builders. **22 pay-per-call utility tools** served as an MCP server — scrape, validate, embed, store, moderate, notify, convert, prevent loops. **No accounts, no API keys, no subscriptions.** Pay with USDC on Base via the [x402 protocol](https://x402.org).

```bash
npx @melis-ai/x402-tools-mcp
```

→ Full catalogue with prices and live examples: **[agents.melis.ai](https://agents.melis.ai)**
→ Canonical 5-step RAG pipeline: **[agents.melis.ai/pipelines/rag](https://agents.melis.ai/pipelines/rag)**
→ 5-minute getting started: **[agents.melis.ai/docs/getting-started](https://agents.melis.ai/docs/getting-started)**

---

## Tool catalogue (22)

| Tool | Price (USDC) | Description |
|------|-------------|-------------|
| `list_services` | free | Returns the full catalogue with prices and endpoint URLs |
| `cacheserve` | $0.001 | Fetch a URL with server-side caching — avoids redundant origin hits |
| `docconvert_text` | $0.001 | Format conversion: md↔html, json↔csv, html→txt, etc. |
| `intentflow` | $0.001 | Context handoff relay for multi-agent delegation (async, returns retrieve_url) |
| `memoryserve_write` | $0.001 | Store text + embedding in Qdrant + SQLite, namespaced per `agent_id` |
| `memoryserve_query` | $0.001 | Recall most-similar memories by semantic query |
| `memscrub` | $0.001 | Scan retrieved RAG content for indirect prompt injection (10 patterns) |
| `notifyrelay_webhook` | $0.001 | POST a JSON payload to a URL with optional HMAC-SHA256 signing |
| `schemagate` | $0.001 | Validate a JSON response against a JSON Schema, return a hint on failure |
| `loopwall_hop` | $0.0005 | Validate one hop of a signed multi-agent chain (loop / budget enforcement) |
| `loopwall_issue` | $0.001 | Issue a signed Job Envelope at chain start with budget + hop cap |
| `imageguard` | $0.002 | NSFW image classification (multi-class moderation on roadmap) |
| `notifyrelay_telegram` | $0.002 | Send a Telegram message to a known chat ID |
| `promptguard` | $0.002 | Score untrusted input for prompt injection risk (0–100) |
| `structextract` | $0.002 | Extract structured JSON from HTML — tables, links, emails, phones |
| `xaudit` | $0.002 | Validate API response content with a cryptographically signed certificate |
| `docconvert_pdf` | $0.005 | Convert HTML or markdown to PDF (base64 output) |
| `kyaoracle` | $0.005 | On-chain trust score (0–100) for an Ethereum/Base wallet address |
| `linkrisk` | $0.005 | URL risk profile — heuristic phishing signals, redirect tracing |
| `markdownopt` | $0.005 | Convert URL or HTML to clean LLM-ready markdown (~70% token reduction) |
| `notifyrelay_email` | $0.005 | Send a transactional email via Resend (allowlisted, rate-limited) |
| `embedpay` | $0.00005 / 1k tokens | OpenAI text-embedding-3-small wrapper, batch tier available |
| `linksafe` | $0.01 | Definitive URL safety check via Playwright sandbox + VirusTotal |
| `scrapepay` | $0.01 | Web extraction via Playwright (robots.txt enforced, SSRF-safe) |
| `pdf_render` | $0.49 | High-fidelity URL or HTML → PDF via Playwright |

22 services. Live prices and live wallet [on Basescan](https://basescan.org/address/0x1C680703D6cF7dfC9FEABb5AA28E64B869ddB3bC#tokentxns).

---

## Why x402, why pay-per-call

- **No signup tax.** Every tool here works the moment your wallet has USDC. No accounts to provision, no API keys to rotate, no subscription tiers to forecast.
- **Charge-on-success-only.** Every service settles payment only on HTTP 2xx with non-empty content. Failed calls cost nothing — your retry budget is preserved.
- **Composes naturally.** ScrapePay → MarkdownOpt → EmbedPay → MemoryServe → MEMSCRUB is the canonical RAG pipeline. Each step's payment is independent and verifiable on-chain.
- **MCP-native.** One install, all 22 tools appear in Claude Desktop, Cursor, Cline, Continue, Claude Code, or any MCP-aware agent runtime.
- **No vendor lock-in.** x402 is a Linux Foundation protocol (April 2026) co-signed by Google, AWS, Stripe, Visa, Mastercard. Other providers will offer x402 services; your wallet client works with all of them.

---

## Installation — Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x402-tools": {
      "command": "npx",
      "args": ["@melis-ai/x402-tools-mcp"]
    }
  }
}
```

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop. All 22 tools appear in the tool picker.

## Installation — Cursor, Cline, Continue, Claude Code

See [agents.melis.ai/docs/install-mcp](https://agents.melis.ai/docs/install-mcp) for per-client setup.

---

## Example: canonical RAG pipeline

```typescript
// All 22 tools registered as MCP tools — your agent calls them like any function
const page    = await callTool('scrapepay',   { url: 'https://example.com/article' });
const md      = await callTool('markdownopt', { html: page.content });
const vec     = await callTool('embedpay',    { input: md.markdown });
const stored  = await callTool('memoryserve_write', {
  agent_id: 'agent-1', content: md.markdown, vector: vec.embedding,
});

// Later — recall and guard against indirect injection
const hits    = await callTool('memoryserve_query', {
  agent_id: 'agent-1', query: 'what did we learn about X?',
});
for (const chunk of hits.matches) {
  const scrub = await callTool('memscrub', { content: chunk.content });
  if (scrub.risk_level === 'safe') useChunk(chunk);
}
```

Total cost per 5k-token page: ~$0.017 USDC. Detailed walkthrough: [agents.melis.ai/pipelines/rag](https://agents.melis.ai/pipelines/rag).

---

## Funding the wallet

x402 settles in USDC on Base (Coinbase L2). Two paths:

- **Coinbase Wallet** — buy USDC, switch to Base network, send to your agent's wallet.
- **Bridge from Ethereum mainnet** — [bridge.base.org](https://bridge.base.org).

$1.00 of USDC covers 100 ScrapePay calls, 200 PromptGuard calls, or one full RAG-pipeline ingestion run.

---

## Discovery surfaces (for agent builders + AI consumers)

| URL | Purpose |
|-----|---------|
| [agents.melis.ai/llms.txt](https://agents.melis.ai/llms.txt) | Concise LLM-readable catalogue |
| [agents.melis.ai/llms-full.txt](https://agents.melis.ai/llms-full.txt) | Full schemas + composition recipes |
| [agents.melis.ai/openapi.json](https://agents.melis.ai/openapi.json) | OpenAPI 3.1 spec for all 22 endpoints |
| [agents.melis.ai/ai-plugin.json](https://agents.melis.ai/ai-plugin.json) | ChatGPT-plugin manifest |
| `https://<service>.melis.ai/.well-known/mcp.json` | Per-service MCP discovery |
| [agents.melis.ai/agents-faq](https://agents.melis.ai/agents-faq) | Agent-builder FAQ (distinct from human FAQ) |

---

## Comparisons

- [ScrapePay vs Firecrawl](https://agents.melis.ai/comparison/vs-firecrawl)
- [EmbedPay vs OpenAI Embeddings (direct)](https://agents.melis.ai/comparison/vs-openai-embeddings)
- [MemoryServe vs Pinecone](https://agents.melis.ai/comparison/vs-pinecone)
- [Full alternatives doc](https://agents.melis.ai/docs/compare)

---

## Source & licensing

- **MCP wrapper source** (this repo): MIT licensed.
- **Service code** (the 22 services themselves): closed source for security.
- **Site content** (agents.melis.ai docs): CC-BY-4.0 — attribute "melis x402 Tools" with a link to agents.melis.ai.

---

## Security

Found a vulnerability? See [SECURITY.md](./SECURITY.md). Email sean@melis.ai. Critical issues acknowledged within 24 hours.

---

## Citing this work

If you use melis x402 Tools in research or downstream products, see [CITATION.cff](./CITATION.cff) for the canonical citation.

---

## Author

[Sean Melis](https://melis.ai) — agent operator and builder, London UK.
Catalogue: [agents.melis.ai](https://agents.melis.ai) · Email: sean@melis.ai
