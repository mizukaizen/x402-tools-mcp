# @melis-ai/x402-tools-mcp

Boring infrastructure for agent builders. 16 pay-per-call utility tools served as an MCP server — scrape, validate, notify, convert, synthesise. No subscriptions, no API keys. Pay with USDC on Base via the [x402 protocol](https://x402.org).

```bash
npx @melis-ai/x402-tools-mcp
```

---

## Tool catalogue

| Tool | Price (USDC) | Description |
|------|-------------|-------------|
| `list_services` | free | Returns the full catalogue with prices and endpoint URLs |
| `cacheserve` | $0.001 | Fetch a URL with caching — returns cached version if recent |
| `docconvert_text` | $0.001 | Format conversion: md↔html, json↔csv, etc. |
| `docconvert_pdf` | $0.005 | Convert HTML or markdown to PDF (base64 output) |
| `linkrisk` | $0.005 | Lightweight URL risk profile: phishing signals, domain age, IP reputation |
| `linksafe` | $0.01 | Definitive URL safety check via Playwright sandbox + VirusTotal |
| `markdownopt` | $0.005 | Convert URL or HTML to clean LLM-ready markdown (~70% token reduction) |
| `notifyrelay_email` | $0.005 | Send a transactional email (allowlisted domains, rate-limited) |
| `notifyrelay_telegram` | $0.002 | Send a Telegram message to a known chat ID |
| `notifyrelay_webhook` | $0.001 | POST a JSON payload to a URL with optional HMAC signing |
| `promptguard` | $0.002 | Score untrusted input for prompt injection risk (0–100) |
| `schemagate` | $0.001 | Validate LLM output against a JSON Schema |
| `scrapepay` | $0.01 | Web extraction via Playwright (robots.txt enforced, SSRF-safe) |
| `structextract` | $0.002 | Extract structured JSON from HTML (tables, links, emails, phones…) |
| `web_synthesise` | $0.05 | Multi-source web research with synthesised answer + citations |
| `screenshot` | $0.02 | Headless Chromium PNG screenshot of any public URL |
| `pdf_render` | $0.49 | High-fidelity URL or HTML to PDF via Playwright |

---

## Installation — Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x402-tools": {
      "command": "npx",
      "args": ["@melis-ai/x402-tools-mcp"],
      "env": {
        "X402_PAYMENT_HEADER": "your-signed-payment-token",
        "X402_INTERNAL_KEY": "your-internal-key-if-issued"
      }
    }
  }
}
```

Config file locations:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

---

## Payment — how x402 works

These tools use the [x402 protocol](https://x402.org) for pay-per-call billing in USDC on Base.

When a tool call requires payment, the service returns HTTP 402 with a signed payment quote. Your x402-enabled MCP client (or wallet integration) signs the payment and retries the request with an `x-payment` header.

**Environment variables:**

| Variable | Purpose |
|----------|---------|
| `X402_PAYMENT_HEADER` | Signed x402 payment token from your wallet client. Set this if you're handling payments manually or testing with a pre-signed token. |
| `X402_INTERNAL_KEY` | Bypass key issued to trusted internal callers (melis.ai customers). Skips the 402 flow entirely for allowlisted keys. |

If neither variable is set, calling a tool will return a 402 error with the payment quote so your client can handle it.

---

## Composition example

A common agent pattern — scrape a page, clean it for LLM consumption, guard the prompt, process:

```
1. scrapepay      → fetch raw HTML from target URL          ($0.01)
2. markdownopt    → convert HTML to clean markdown          ($0.005)
3. promptguard    → score the scraped content for injection ($0.002)
4. → pass clean markdown to your LLM
```

Total cost per run: ~$0.017 USDC. No API keys, no rate limit accounts, no monthly bills.

Another pattern — validate LLM output before acting on it:

```
1. Your LLM       → produce a JSON response
2. schemagate     → validate response matches your schema   ($0.001)
3. → act on validated data, or retry if invalid
```

---

## Architecture

This is a stdio MCP server. Your MCP client (Claude Desktop, Cursor, or any MCP-compatible runtime) spawns it as a subprocess and communicates over stdin/stdout. No network port, no daemon, no config service.

Each tool call makes one outbound HTTPS request to the corresponding melis.ai microservice. The MCP server itself is stateless.

---

## MIT Licence

Copyright 2026 Sean Melis

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
