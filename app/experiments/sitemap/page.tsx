import type { Metadata } from "next";
import Link from "next/link";
import { AgentProbe } from "@/components/AgentProbe";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { getMarkdownSitemap, getAllPosts } from "@/lib/content";

export const metadata: Metadata = { title: "03 · Markdown sitemaps vs. XML sitemaps" };

export default function SitemapPage() {
  const sitemapMd = getMarkdownSitemap();
  const posts = getAllPosts();

  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts.map((p) => `  <url><loc>https://example.com/blog/${p.slug}</loc></url>`).join("\n")}
</urlset>`;

  return (
    <div className="py-12">
      <p className="text-label-13-mono text-gray-500">experiment 03</p>
      <h1 className="mt-2 text-heading-32">Markdown sitemaps vs. XML sitemaps</h1>
      <p className="mt-3 max-w-2xl text-copy-16 text-gray-900">
        Sitemaps tell agents what content exists. XML sitemaps are flat URL
        lists with no context. Markdown sitemaps give agents titles,
        hierarchy, and meaning — so they can decide what to fetch without
        downloading every page.
      </p>

      <h2 className="mt-10 text-heading-24">Side by side</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Both sitemaps list the same four blog posts. The difference is what
        an agent learns from each:
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-400 px-4 py-2">
            <Badge tone="purple" mono>sitemap.xml</Badge>
            <Link href="/blog/sitemap.xml" className="text-label-12 text-blue-700 underline">
              /blog/sitemap.xml
            </Link>
          </div>
          <pre className="px-4 py-3 text-label-12-mono leading-relaxed text-gray-900 overflow-x-auto">
            {xmlSitemap}
          </pre>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-400 px-4 py-2">
            <Badge tone="green" mono>sitemap.md</Badge>
            <Link href="/blog/sitemap.md" className="text-label-12 text-blue-700 underline">
              /blog/sitemap.md
            </Link>
          </div>
          <pre className="px-4 py-3 text-label-12-mono leading-relaxed text-gray-900 overflow-x-auto">
            {sitemapMd}
          </pre>
        </Card>
      </div>

      <Callout variant="info" title="What the agent learns" className="mt-4 max-w-2xl">
        <strong className="text-gray-1000">From XML:</strong> four URLs.
        Nothing else. The agent must fetch each one to know what it is.{" "}
        <br />
        <strong className="text-gray-1000">From markdown:</strong> four
        titles, each linked to its URL. The agent can skip pages it
        doesn&apos;t need and fetch only the relevant ones — saving tokens
        and time.
      </Callout>

      <h2 className="mt-10 text-heading-24">Probe the sitemap</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Fetch the canonical <span className="text-gray-1000">/blog/sitemap.xml</span>{" "}
        with both headers. A browser (<code>Accept: text/html</code>) gets the
        XML sitemap; an agent (<code>Accept: text/markdown</code>) gets the
        markdown version from the same URL. Use{" "}
        <span className="text-gray-1000">Compare</span> to see the payload and
        token savings:
      </p>

      <AgentProbe path="/blog/sitemap.xml" defaultMode="compare" className="mt-4" />

      <h2 className="mt-10 text-heading-24">The markdown sitemap implementation</h2>
      <CodeBlock
        filename="app/blog/sitemap.md/route.ts"
        code={`import { getMarkdownSitemap } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  const sitemap = getMarkdownSitemap();
  return new Response(sitemap, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}`}
        highlight={[7, 8, 9, 10]}
        className="mt-3"
      />

      <CodeBlock
        filename="lib/content.ts (getMarkdownSitemap)"
        code={`export function getMarkdownSitemap(): string {
  const all = getAllPosts();
  const lines = all.map(
    (p) => \`- [\${p.title}](/blog/\${p.slug})\`
  );
  return \`# Blog sitemap\\n\\n\${lines.join("\\n")}\`;
}

// Output:
// # Blog sitemap
//
// - [Making agent-friendly pages...](/blog/making-agent-friendly-pages)
// - [The Accept header field guide](/blog/the-accept-header-field-guide)
// - [Markdown sitemaps for agent discovery](/blog/markdown-sitemaps-for-agent-discovery)
// - [Token efficiency in practice](/blog/token-efficiency-in-practice)`}
        className="mt-3"
      />

      <h2 className="mt-10 text-heading-24">Nested hierarchy (documentation)</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        For documentation with nested sections, a recursive renderer
        preserves parent-child relationships using indentation:
      </p>
      <CodeBlock
        filename="docs sitemap output"
        code={`# Documentation sitemap

- [Getting Started](/docs/getting-started)
  - [Installation](/docs/getting-started/installation)
  - [Configuration](/docs/getting-started/configuration)
- [API Reference](/docs/api)
  - [Authentication](/docs/api/authentication)
  - [Endpoints](/docs/api/endpoints)
    - [Users](/docs/api/endpoints/users)
    - [Posts](/docs/api/endpoints/posts)`}
        className="mt-3"
      />

      <Callout variant="tip" title="The sitemap also supports content negotiation" className="mt-4 max-w-2xl">
        An agent sending <code>Accept: text/markdown</code> to{" "}
        <code>/blog/sitemap</code> (without the <code>.md</code> extension)
        gets the markdown sitemap automatically. The rewrite catches it and
        routes to the same handler. The <code>.md</code> URL is for direct
        access — agents that don&apos;t send the header.
      </Callout>
    </div>
  );
}
