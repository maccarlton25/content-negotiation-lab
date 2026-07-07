export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
};

export const posts: BlogPost[] = [
  {
    slug: "making-agent-friendly-pages",
    title: "Making agent-friendly pages with content negotiation",
    date: "2026-02-03",
    author: "Mac Carlton",
    excerpt:
      "Agents fetch web pages to answer questions and complete tasks. Content negotiation lets them request just the text, without the markup that confuses them and wastes their context window.",
    content: `# Making agent-friendly pages with content negotiation

Agents fetch web pages to answer questions, write code, and complete tasks. When an agent requests a page, it gets everything your browser gets — navigation menus, stylesheets, JavaScript bundles, tracking scripts, and footer links — when all it needs is the structured text on the page. That extra markup confuses the agent, consumes its context window, and makes every request more expensive.

## What is content negotiation

What agents need is a way to request just the text content of a page, without the browser-specific markup. **Content negotiation** solves this. It's a standard HTTP mechanism where the client specifies its preferred format via the \`Accept\` header, and the server returns the matching representation.

Many agents already send \`Accept: text/markdown\` when fetching pages. A server that supports content negotiation can return clean, structured text from the same URL that serves HTML to a browser.

\`\`\`bash
curl https://example.com/blog/my-post -H "accept: text/markdown"
\`\`\`

This works better than hosting separate \`.md\` URLs because content negotiation requires no site-specific knowledge. Any agent that sends the right header gets markdown automatically, from any site that supports it.

## Implementing content negotiation in Next.js

The implementation has two parts: a rewrite rule in \`next.config.ts\` that detects the header, and a route handler that returns markdown.

The rewrite checks the \`Accept\` header on every incoming request. When it contains \`text/markdown\`, the request gets routed to a dedicated markdown endpoint:

\`\`\`ts
async rewrites() {
  function markdownRewrite(prefix: string) {
    return {
      source: \`\${prefix}/:path*\`,
      has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
      destination: \`\${prefix}/md/:path*\`,
    };
  }
  return { beforeFiles: [markdownRewrite("/blog")] };
}
\`\`\`

The route handler serves the markdown content directly:

\`\`\`ts
export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const content = getMarkdownContent(slug?.join("/") ?? "index");
  if (!content) notFound();
  return new Response(content, { headers: { "Content-Type": "text/markdown" } });
}
\`\`\`

## Performance benefits

The HTML version of a typical blog post is around 500KB. The markdown version is 3KB — a **99.37% reduction** in payload size. For agents operating under token limits, smaller payloads mean they can consume more content per request and spend their budget on actual information instead of markup.

> The savings compound: an agent that fetches ten pages during a research task saves roughly 5MB of unnecessary markup per task. That's thousands of tokens redirected from parsing \`<div>\` tags to understanding your content.

## Making your site agent-friendly

Content negotiation, markdown sitemaps, and \`link rel="alternate"\` tags give agents three ways to find and consume your content efficiently. You can read any page as markdown by sending \`Accept: text/markdown\` to any blog URL on a site that supports it.

For an implementation reference, see the [Vercel knowledge base](https://vercel.com/kb/guide/how-to-serve-documentation-for-agents).`,
  },
  {
    slug: "the-accept-header-field-guide",
    title: "The Accept header field guide",
    date: "2026-01-27",
    author: "Mac Carlton",
    excerpt:
      "The Accept header is the handshake between agent and server. Learn how it works, what agents actually send, and how to test your server's response to every variation.",
    content: `# The Accept header field guide

The \`Accept\` header is the mechanism that makes content negotiation work. It tells the server what media types the client can process, in order of preference. Understanding its syntax and behavior is essential for building agent-friendly pages.

## The syntax

The \`Accept\` header uses a comma-separated list of media types with optional quality factors (q-values):

\`\`\`
Accept: text/markdown, text/html, */*;q=0.1
\`\`\`

- **text/markdown** — preferred format (listed first, default q=1.0)
- **text/html** — acceptable fallback (default q=1.0)
- **\*/\*;q=0.1** — anything else, but barely (q=0.1)

The server should return the highest-quality format it supports. If it supports markdown, it returns markdown. If not, it falls back to HTML.

## What agents actually send

Different agents send different Accept headers. Here are the common patterns:

1. **Markdown-first**: \`Accept: text/markdown, text/html, */*\` — the agent prefers markdown but can handle HTML
2. **HTML-only**: \`Accept: text/html, */*\` — the agent doesn't know about markdown; serve HTML
3. **Wildcard**: \`Accept: */*\` — the agent accepts anything; serve your default format
4. **No header** — some simple fetchers omit Accept entirely; serve your default format

## The rewrite pattern

The key insight is that the rewrite should match \`text/markdown\` *anywhere* in the Accept header, not just as the entire value. The regex \`(.*)text/markdown(.*)\` does this:

\`\`\`ts
has: [
  {
    type: "header",
    key: "accept",
    value: "(.*)text/markdown(.*)",
  },
]
\`\`\`

This matches:
- \`text/markdown\` (exact)
- \`text/markdown, text/html\` (first in list)
- \`text/html, text/markdown\` (anywhere in list)
- \`*/*, text/markdown;q=0.9\` (with quality factor)

## Testing with curl

You can test all four patterns with curl:

\`\`\`bash
# Markdown-first — should return markdown
curl -s -D - https://example.com/blog/my-post -H "accept: text/markdown" | head -5

# HTML-only — should return HTML
curl -s -D - https://example.com/blog/my-post -H "accept: text/html" | head -5

# Wildcard — should return HTML (default)
curl -s -D - https://example.com/blog/my-post -H "accept: */*" | head -5

# No header — should return HTML (default)
curl -s -D - https://example.com/blog/my-post | head -5
\`\`\`

> **Tip**: Always check the \`Content-Type\` response header to verify which format the server chose. A correctly implemented server returns \`text/markdown\` for markdown and \`text/html\` for HTML.

## The quality factor edge case

Quality factors (q-values) add nuance. An agent might send:

\`\`\`
Accept: text/html;q=0.9, text/markdown;q=0.8
\`\`\`

Strictly speaking, this agent prefers HTML over markdown. The rewrite pattern \`(.*)text/markdown(.*)\` will still match and route to markdown, which is *not* what the agent asked for.

In practice, this is rarely a problem because:
- Most agents that include \`text/markdown\` at all list it first
- The agents that prefer HTML simply don't include \`text/markdown\`
- The benefit of a simple regex outweighs the edge case

If you need precise q-value handling, you'd parse the Accept header in middleware rather than using a rewrite. For most sites, the rewrite approach is the right tradeoff.`,
  },
  {
    slug: "markdown-sitemaps-for-agent-discovery",
    title: "Markdown sitemaps for agent discovery",
    date: "2026-01-20",
    author: "Mac Carlton",
    excerpt:
      "XML sitemaps are flat URL lists with no context. Markdown sitemaps give agents a structured table of contents with titles, hierarchy, and meaning.",
    content: `# Markdown sitemaps for agent discovery

Content negotiation gets an agent the right format once it knows the URL. But how does the agent discover what URLs exist? That's where sitemaps come in — and markdown sitemaps are dramatically better for agents than the traditional XML format.

## The problem with XML sitemaps

A standard XML sitemap is a flat list of URLs:

\`\`\`xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/blog/post-1</loc></url>
  <url><loc>https://example.com/blog/post-2</loc></url>
  <url><loc>https://example.com/blog/post-3</loc></url>
</urlset>
\`\`\`

An agent reading this learns three URLs and nothing else. It doesn't know:
- What each page is about (no titles)
- Which pages are related (no hierarchy)
- Which pages are important (no priority or context)
- Whether the content is worth fetching (no excerpts)

The agent has to fetch every URL to find out what's there, consuming tokens and time on pages it might not need.

## The markdown sitemap advantage

A markdown sitemap gives the agent a structured table of contents:

\`\`\`markdown
# Blog sitemap

- [Making agent-friendly pages with content negotiation](/blog/making-agent-friendly-pages)
- [The Accept header field guide](/blog/the-accept-header-field-guide)
- [Markdown sitemaps for agent discovery](/blog/markdown-sitemaps-for-agent-discovery)
- [Token efficiency in practice](/blog/token-efficiency-in-practice)
\`\`\`

Now the agent can:
1. Read the titles and understand what content exists
2. Decide which pages are relevant to its task
3. Fetch only the pages it needs, using content negotiation to get markdown

## Nested content with hierarchy

For documentation with nested sections, a recursive renderer preserves the parent-child relationships:

\`\`\`markdown
# Documentation sitemap

- [Getting Started](/docs/getting-started)
  - [Installation](/docs/getting-started/installation)
  - [Configuration](/docs/getting-started/configuration)
- [API Reference](/docs/api)
  - [Authentication](/docs/api/authentication)
  - [Endpoints](/docs/api/endpoints)
    - [Users](/docs/api/endpoints/users)
    - [Posts](/docs/api/endpoints/posts)
\`\`\`

The indentation tells the agent that \`Installation\` is a child of \`Getting Started\`, and \`Users\` is a child of \`Endpoints\` which is a child of \`API Reference\`. This hierarchy helps the agent navigate efficiently.

## Implementation

The route handler generates the sitemap on the fly:

\`\`\`ts
export const dynamic = "force-static";

export async function GET() {
  const posts = getAllBlogPosts();
  const lines = posts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((post) => \`- [\${post.title}](/blog/\${post.slug})\`);
  const sitemap = \`# Blog sitemap\\n\\n\${lines.join("\\n")}\`;
  return new Response(sitemap, {
    headers: { "Content-Type": "text/markdown" },
  });
}
\`\`\`

The sitemap is served at a predictable URL (\`/blog/sitemap.md\`) that agents can discover. You can also advertise it in your HTML via a \`link\` tag:

\`\`\`html
<link rel="alternate" type="text/markdown" title="LLM-friendly sitemap" href="/blog/sitemap.md" />
\`\`\`

## Served with content negotiation too

The sitemap itself can support content negotiation. An agent sending \`Accept: text/markdown\` to \`/blog/sitemap\` gets the markdown version automatically — no need to know the \`.md\` extension exists.`,
  },
  {
    slug: "token-efficiency-in-practice",
    title: "Token efficiency in practice",
    date: "2026-01-13",
    author: "Mac Carlton",
    excerpt:
      "Every byte an agent fetches costs tokens. Measuring the real-world savings of markdown over HTML across multiple pages, and why it matters for agent economics.",
    content: `# Token efficiency in practice

When an agent fetches a web page, the response body enters its context window. Every byte of HTML markup — every \`<div>\`, every \`class\` attribute, every \`<script>\` tag — is a token the agent processes and pays for. Reducing payload size isn't just about bandwidth; it's about how much useful information an agent can hold in its working memory.

## The measurement

Let's compare the same blog post in both formats. A typical article with headings, code blocks, links, and lists produces:

| Format | Payload size | Estimated tokens | Content tokens | Overhead |
| --- | --- | --- | --- | --- |
| HTML | ~250 KB | ~63,000 | ~2,000 | ~61,000 |
| Markdown | ~8 KB | ~2,000 | ~2,000 | ~0 |

The HTML version carries 30x more tokens for the *same information*. The agent's context window — typically 128K to 200K tokens — can hold maybe 2 HTML pages or 60+ markdown pages.

## Where the overhead comes from

HTML payload bloat has several sources:

1. **Structural tags**: \`<div>\`, \`<span>\`, \`<section>\`, \`<nav>\`, \`<header>\`, \`<footer>\` — dozens per page, each with attributes
2. **CSS class names**: \`class="flex items-center gap-4 px-4 py-3 text-gray-900"\` — meaningful to the browser, noise to the agent
3. **JavaScript bundles**: inline scripts, hydration data, framework runtime — the agent can't execute any of it
4. **Navigation and chrome**: menus, breadcrumbs, sidebars, footers — duplicated on every page
5. **Meta tags and tracking**: \`<meta>\`, \`<script>\` for analytics, Open Graph tags — invisible to the reader

Markdown strips all of this. A heading is \`## Title\` not \`<h2 class="text-2xl font-bold mt-8 mb-4">Title</h2>\`. A link is \`[text](url)\` not \`<a href="url" class="text-blue-600 hover:underline" data-track="click">text</a>\`.

## The compounding effect

Consider an agent researching a topic by reading five pages:

| Scenario | Total payload | Tokens consumed | Remaining context (128K) |
| --- | --- | --- | --- |
| HTML only | ~1,250 KB | ~315,000 | Overflow — agent must summarize or truncate |
| Markdown only | ~40 KB | ~10,000 | ~118,000 — agent keeps full context |

With HTML, the agent overflows its context window after just two pages and must start summarizing or truncating, losing detail. With markdown, it holds all five pages with 92% of its context free for reasoning.

> **The economic angle**: if you're paying per token for agent API calls, markdown serving directly reduces your cost. A research task reading 10 pages costs ~630K tokens in HTML vs ~20K tokens in markdown — a 30x cost reduction.

## Measuring your own site

You can measure the difference with a simple script:

\`\`\`bash
# Fetch as HTML
html_size=$(curl -s https://example.com/blog/my-post | wc -c)

# Fetch as markdown
md_size=$(curl -s https://example.com/blog/my-post -H "accept: text/markdown" | wc -c)

echo "HTML: $html_size bytes (~$((html_size / 4)) tokens)"
echo "Markdown: $md_size bytes (~$((md_size / 4)) tokens)"
echo "Savings: $((100 - md_size * 100 / html_size))%"
\`\`\`

The ~4 bytes/token ratio is approximate (actual ratios vary by content and tokenizer), but it's close enough for comparing formats. The real ratio depends on how much of the payload is ASCII whitespace versus markup — markup-heavy HTML tends to have a slightly worse token-to-byte ratio than markdown.

## Beyond blog posts

The same principle applies to any content an agent might fetch:
- **Documentation**: API references, guides, tutorials
- **Product pages**: specifications, descriptions, reviews
- **Knowledge bases**: support articles, FAQs
- **Changelogs**: release notes, version histories

Any page where the agent needs the *text content* and not the *visual presentation* benefits from a markdown representation. The agent doesn't need to see your carefully designed card layout — it needs the data inside the cards.`,
  },
];

export function getAllPosts(): BlogPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getMarkdownContent(slug: string): string | undefined {
  const post = getPost(slug);
  return post?.content;
}

export function getMarkdownIndex(): string {
  const all = getAllPosts();
  const lines = all.map(
    (p) => `- [${p.title}](/blog/${p.slug}) — ${p.excerpt}`,
  );
  return `# Blog\n\n${lines.join("\n")}`;
}

export function getMarkdownSitemap(): string {
  const all = getAllPosts();
  const lines = all.map((p) => `- [${p.title}](/blog/${p.slug})`);
  return `# Blog sitemap\n\n${lines.join("\n")}`;
}
