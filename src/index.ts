#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

interface Service {
  name: string;
  url: string;
  method: "GET" | "POST";
  priceUsdc: number;
  description: string;
  inputSchema: Record<string, unknown>;
}

const SERVICES: Service[] = [
  {
    name: "cacheserve",
    url: "https://cacheserve.melis.ai/fetch",
    method: "POST",
    priceUsdc: 0.001,
    description: "Fetch a URL with caching. Returns cached version if recent, otherwise fetches and caches. Use before any fetch that might be repeated.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        ttl_seconds: { type: "number", default: 3600 },
      },
      required: ["url"],
    },
  },
  {
    name: "docconvert_text",
    url: "https://docconvert-text.melis.ai/convert",
    method: "POST",
    priceUsdc: 0.001,
    description: "Format conversion: md↔html, json↔csv, etc. Lightweight content transcoding.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        content: { type: "string" },
      },
      required: ["from", "to", "content"],
    },
  },
  {
    name: "docconvert_pdf",
    url: "https://docconvert-pdf.melis.ai/convert",
    method: "POST",
    priceUsdc: 0.005,
    description: "Convert HTML or markdown to PDF. Returns base64-encoded PDF.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", enum: ["html", "md"] },
        to: { type: "string", const: "pdf" },
        content: { type: "string" },
      },
      required: ["from", "to", "content"],
    },
  },
  {
    name: "linkrisk",
    url: "https://linkrisk.melis.ai/profile",
    method: "POST",
    priceUsdc: 0.005,
    description: "Lightweight URL risk profile: checks phishing signals, redirects, domain age, IP reputation. Use before visiting unknown URLs.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
  {
    name: "linksafe",
    url: "https://linksafe.melis.ai/verify",
    method: "POST",
    priceUsdc: 0.01,
    description: "Definitive URL safety check (Playwright sandbox + VirusTotal + redirect tracing). More thorough than linkrisk.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
  {
    name: "markdownopt",
    url: "https://markdownopt.melis.ai/markdown",
    method: "POST",
    priceUsdc: 0.005,
    description: "Convert URL or HTML to clean LLM-ready markdown. ~70% token reduction vs raw HTML. Pass a url OR html field.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        html: { type: "string" },
      },
    },
  },
  {
    name: "notifyrelay_email",
    url: "https://notify.melis.ai/email",
    method: "POST",
    priceUsdc: 0.005,
    description: "Send a transactional email. Allowlisted recipient domains; rate-limited per IP.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "notifyrelay_telegram",
    url: "https://notify.melis.ai/notify",
    method: "POST",
    priceUsdc: 0.002,
    description: "Send a Telegram message to a known chat ID.",
    inputSchema: {
      type: "object",
      properties: {
        chat_id: { type: "string" },
        message: { type: "string" },
      },
      required: ["chat_id", "message"],
    },
  },
  {
    name: "notifyrelay_webhook",
    url: "https://notify.melis.ai/webhook",
    method: "POST",
    priceUsdc: 0.001,
    description: "POST a JSON payload to a public URL with optional HMAC signing. Allowlisted domains only.",
    inputSchema: {
      type: "object",
      properties: {
        target_url: { type: "string" },
        payload: { type: "object" },
        secret: { type: "string" },
      },
      required: ["target_url", "payload"],
    },
  },
  {
    name: "promptguard",
    url: "https://promptguard.melis.ai/score",
    method: "POST",
    priceUsdc: 0.002,
    description: "Score untrusted input for prompt injection risk (0-100) with flagged dimensions. Run on any user-provided prompt before passing to a downstream LLM.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        sensitivity: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["prompt"],
    },
  },
  {
    name: "schemagate",
    url: "https://schemagate.melis.ai/validate-schema",
    method: "POST",
    priceUsdc: 0.001,
    description: "Validate that an LLM output conforms to a JSON Schema. Returns valid:true/false with a correction hint on failure.",
    inputSchema: {
      type: "object",
      properties: {
        response: { type: "string" },
        schema: { type: "object" },
      },
      required: ["response", "schema"],
    },
  },
  {
    name: "scrapepay",
    url: "https://scrapepay.melis.ai/scrape",
    method: "POST",
    priceUsdc: 0.01,
    description: "Web extraction via Playwright. Charges only on successful scrape. robots.txt enforced. SSRF-safe.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        format: { type: "string", enum: ["text", "html", "markdown"] },
        selector: { type: "string" },
        wait_for: { type: "string" },
        timeout_ms: { type: "number" },
      },
      required: ["url"],
    },
  },
  {
    name: "structextract",
    url: "https://structextract.melis.ai/extract",
    method: "POST",
    priceUsdc: 0.002,
    description: "Extract structured JSON from raw HTML (tables, links, headings, meta, emails, phones, images).",
    inputSchema: {
      type: "object",
      properties: {
        html: { type: "string" },
        extract: {
          type: "array",
          items: {
            type: "string",
            enum: ["tables", "links", "emails", "phones", "headings", "meta", "images"],
          },
        },
      },
      required: ["html"],
    },
  },
  {
    name: "web_synthesise",
    url: "https://api.melis.ai/web/synthesise",
    method: "POST",
    priceUsdc: 0.05,
    description: "Multi-source web research synthesis. Pass a query, get a synthesised answer with citations.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        depth: { type: "string", enum: ["quick", "deep"] },
      },
      required: ["query"],
    },
  },
  {
    name: "screenshot",
    url: "https://api.melis.ai/screenshot",
    method: "POST",
    priceUsdc: 0.02,
    description: "Headless Chromium PNG screenshot of any public URL. Returns base64 PNG.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        width: { type: "number" },
        fullPage: { type: "boolean" },
      },
      required: ["url"],
    },
  },
  {
    name: "pdf_render",
    url: "https://api.melis.ai/pdf/render",
    method: "POST",
    priceUsdc: 0.49,
    description: "Render any URL or HTML to PDF via Playwright. Higher fidelity than docconvert_pdf for complex pages.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        html: { type: "string" },
      },
    },
  },
];

const server = new Server(
  { name: "melis-x402-tools", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_services",
      description:
        "Returns the catalogue of available services with prices, descriptions, and endpoint URLs. Call this first to introspect what is available.",
      inputSchema: { type: "object", properties: {} },
    },
    ...SERVICES.map((s) => ({
      name: s.name,
      description: `[$${s.priceUsdc} USDC] ${s.description}`,
      inputSchema: s.inputSchema,
    })),
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "list_services") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              services: SERVICES.map((s) => ({
                name: s.name,
                url: s.url,
                method: s.method,
                price_usdc: s.priceUsdc,
                description: s.description,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const svc = SERVICES.find((s) => s.name === name);
  if (!svc) throw new Error(`Unknown tool: ${name}`);

  // x402 payment headers — set by the MCP client's wallet integration, or manually via env vars.
  // X402_PAYMENT_HEADER: signed x402 payment token from your wallet client.
  // X402_INTERNAL_KEY: bypass key for internal/trusted callers (issued by melis.ai).
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.X402_PAYMENT_HEADER) headers["x-payment"] = process.env.X402_PAYMENT_HEADER;
  if (process.env.X402_INTERNAL_KEY) headers["x-internal-key"] = process.env.X402_INTERNAL_KEY;

  const res = await fetch(svc.url, {
    method: svc.method,
    headers,
    body: svc.method === "POST" ? JSON.stringify(args ?? {}) : undefined,
  });

  if (res.status === 402) {
    const quote = await res.json().catch(() => ({}));
    throw new Error(
      `Payment required ($${svc.priceUsdc} USDC). x402 payment quote: ${JSON.stringify(quote)}. ` +
        `Configure your MCP client's x402 wallet integration or set X402_PAYMENT_HEADER env var.`
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${svc.name} returned HTTP ${res.status}: ${body.slice(0, 500)}`);
  }

  const body = (await res.json()) as unknown;
  return { content: [{ type: "text", text: JSON.stringify(body, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
