# Content Negotiation Lab

Five experiments for learning **content negotiation** — making agent-friendly
pages that serve markdown to agents and HTML to browsers from the same URL.

Built on the concepts from the Vercel blog post
[Making agent-friendly pages with content negotiation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation),
this lab lets you **emulate an agent viewing your site** and observe the
difference between what a browser receives and what an agent receives.

The lab's method: **toggle → fetch → compare.** Every experiment page embeds
an `AgentProbe` that fetches a URL with either a browser's `Accept` header
(`text/html`) or an agent's `Accept` header (`text/markdown`), shows the
response body, Content-Type, payload size, and estimated token count.

## Unlike the ISR Lab, this runs locally

Content negotiation is a Next.js rewrite + route handler — no Vercel
infrastructure required. The `Accept` header detection, the rewrite, and
the markdown route handler all work in `next dev`.

```bash
npm install
npm run dev          # http://localhost:3000
```

Deploy when you're ready to share:

```bash
vercel deploy        # a preview deployment is all you need
```

## The mental model

Agents fetch web pages to answer questions, write code, and complete tasks.
When an agent requests a page, it gets everything your browser gets —
navigation, stylesheets, JavaScript, tracking scripts — when all it needs
is the structured text. **Content negotiation** lets the agent request
just the text via the `Accept` header.

```bash
# Browser — returns HTML
curl http://localhost:3000/blog/making-agent-friendly-pages -H "accept: text/html"

# Agent — returns markdown (same URL!)
curl http://localhost:3000/blog/making-agent-friendly-pages -H "accept: text/markdown"
```

### The vocabulary: Accept header values

| Value | Meaning |
| --- | --- |
| `text/markdown` | agent requests markdown, server returns it |
| `text/html` | browser requests HTML, server returns it |
| `*/*` | client accepts anything, server returns default (HTML) |

### The instrument: AgentProbe

Every experiment page has an `AgentProbe` with three modes:

- **Browser** — fetches with `Accept: text/html`
- **Agent** — fetches with `Accept: text/markdown`
- **Compare** — fetches both and shows payload + token savings

The toggle *is* the agent/browser switch — that's how you emulate an agent
viewing your site. No external tools needed.

---

## The experiments

Work them in order; each builds on the previous one's vocabulary.

### 01 · Same URL, two representations — `/experiments/negotiation`

**Question:** what does an agent see vs. what a browser sees?

The AgentProbe fetches a real blog post at `/blog/making-agent-friendly-pages`
with both headers. Same URL, same route — different response. In compare
mode, you see the payload and token savings in real time.

**In the browser** the HTML version is a styled article with navigation,
fonts, and layout. The markdown version is plain structured text — same
information, no chrome.

**Through curl** you verify both come from the same URL:

```bash
curl -s -D - http://localhost:3000/blog/making-agent-friendly-pages -H "accept: text/html" | grep -i content-type
# → content-type: text/html; charset=utf-8

curl -s -D - http://localhost:3000/blog/making-agent-friendly-pages -H "accept: text/markdown" | grep -i content-type
# → content-type: text/markdown; charset=utf-8
```

**How it works:** two pieces — a rewrite in `next.config.ts` that detects
`text/markdown` in the Accept header and routes to `/blog/md/:path*`, and
a route handler at `app/blog/md/[[...slug]]/route.ts` that returns the
markdown content. The rewrite is in `beforeFiles`, so it runs before the
filesystem checks the HTML page route.

### 02 · The Accept header field guide — `/experiments/accept`

**Question:** how does the rewrite decide which format to serve?

The rewrite uses the regex `(.*)text/markdown(.*)` — it matches
`text/markdown` *anywhere* in the Accept header. Test seven different
header values and see what the server returns:

| Accept header | Rewrite? | Why |
| --- | --- | --- |
| `text/markdown` | → markdown | exact match |
| `text/markdown, text/html` | → markdown | markdown first (common agent pattern) |
| `text/html, text/markdown` | → markdown | markdown anywhere — still matches |
| `text/markdown;q=0.8, text/html;q=0.9` | → markdown | with quality factor — still matches |
| `text/html` | → html | no markdown — default |
| `*/*` | → html | wildcard only — default |
| (no header) | → html | absent — default |

Click "Test all headers" on the experiment page to run all seven at once.

**The edge case:** `text/html;q=0.9, text/markdown;q=0.8` strictly prefers
HTML, but the regex still serves markdown. In practice, agents that want
markdown list it first. If you need precise q-value handling, parse the
Accept header in middleware.

### 03 · Markdown sitemaps vs. XML sitemaps — `/experiments/sitemap`

**Question:** how do agents discover what content exists?

Compare `/blog/sitemap.xml` (flat URL list, no context) with
`/blog/sitemap.md` (titles, hierarchy, meaning). An agent reading the
markdown sitemap knows what each page is about *before* fetching it.

```bash
# XML sitemap — four URLs, nothing else
curl http://localhost:3000/blog/sitemap.xml
# → <urlset>...<url><loc>...</loc></url>...</urlset>

# Markdown sitemap — four titles, linked
curl http://localhost:3000/blog/sitemap.md
# → # Blog sitemap
#   - [Making agent-friendly pages...](/blog/making-agent-friendly-pages)
#   - [The Accept header field guide](/blog/the-accept-header-field-guide)
#   ...
```

For documentation with nested sections, the markdown sitemap preserves
parent-child relationships using indentation — so the agent understands
which pages are children of which topics.

### 04 · Discovery paths for agents — `/experiments/discovery`

**Question:** how does an agent find the markdown version?

Three mechanisms, each for a different kind of agent:

| Path | Mechanism | Who uses it |
| --- | --- | --- |
| A | `Accept: text/markdown` header | agents that know about content negotiation |
| B | `<link rel="alternate" type="text/markdown">` in HTML head | agents that parse HTML but don't send Accept |
| C | `/blog/sitemap.md` direct URL | agents that look for sitemaps |

The full agent flow: fetch the sitemap → read titles → select relevant
posts → fetch each with `Accept: text/markdown`.

```bash
# Path A: Accept header
curl http://localhost:3000/blog/making-agent-friendly-pages -H "accept: text/markdown"

# Path B: link tag discovery
curl -s http://localhost:3000/blog/making-agent-friendly-pages | grep 'rel="alternate"'

# Path C: sitemap
curl http://localhost:3000/blog/sitemap.md
```

### 05 · Token efficiency, measured — `/experiments/tokens`

**Question:** how many tokens does markdown save across all blog posts?

A table showing every blog post's payload size and estimated token count in
both formats, plus a context-window visualization. The HTML version of all
four posts overflows a 128K context window; the markdown version uses less
than 10%.

```bash
# Measure a single post
./scripts/compare.sh /blog/making-agent-friendly-pages

# Or measure manually
html_size=$(curl -s http://localhost:3000/blog/making-agent-friendly-pages | wc -c)
md_size=$(curl -s http://localhost:3000/blog/making-agent-friendly-pages -H "accept: text/markdown" | wc -c)
echo "HTML: $html_size bytes (~$((html_size / 4)) tokens)"
echo "Markdown: $md_size bytes (~$((md_size / 4)) tokens)"
echo "Savings: $((100 - md_size * 100 / html_size))%"
```

---

## The blog

Four sample posts at `/blog`, all supporting content negotiation:

- [Making agent-friendly pages with content negotiation](/blog/making-agent-friendly-pages)
- [The Accept header field guide](/blog/the-accept-header-field-guide)
- [Markdown sitemaps for agent discovery](/blog/markdown-sitemaps-for-agent-discovery)
- [Token efficiency in practice](/blog/token-efficiency-in-practice)

Each post URL serves HTML to browsers and markdown to agents. Each post's
HTML includes a `<link rel="alternate" type="text/markdown">` tag for
discovery.

## Shell scripts

Three scripts in `scripts/` for terminal-based testing:

```bash
# Fetch as an agent (Accept: text/markdown)
./scripts/agent-fetch.sh /blog/making-agent-friendly-pages

# Fetch as a browser (Accept: text/html)
./scripts/browser-fetch.sh /blog/making-agent-friendly-pages

# Compare both — shows Content-Type, bytes, tokens, and savings
./scripts/compare.sh /blog/making-agent-friendly-pages
```

All scripts accept local paths (prepended with `http://localhost:3000`) or
full URLs (for deployed sites).

## Deploy to Vercel

```bash
vercel deploy
```

Once deployed, any agent that sends `Accept: text/markdown` to your blog
URLs will automatically receive markdown. No configuration needed on the
agent side — the content negotiation is built into the server.

## Stack

Next.js 16.3.0-preview.4 (App Router) · React 19 · Tailwind v4 · Geist
design tokens (shared with the sibling `next-isr-lab`).
