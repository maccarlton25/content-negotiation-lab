import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = { title: "04 · Discovery paths for agents" };

const DISCOVERY_PATHS = [
  {
    n: "A",
    title: "The Accept header (automatic)",
    tone: "blue" as const,
    description:
      "An agent sends Accept: text/markdown when fetching a URL. The rewrite detects it and serves markdown. No prior knowledge of the site needed — any agent that sends the header gets markdown from any supporting site.",
    who: "All agents that know about content negotiation",
    url: "/blog/making-agent-friendly-pages",
    header: "Accept: text/markdown",
  },
  {
    n: "B",
    title: "link rel=alternate (HTML head)",
    tone: "purple" as const,
    description:
      "The HTML page includes a <link> tag in its <head> advertising the markdown version. An agent that doesn't send the Accept header can still discover that markdown exists by reading the HTML.",
    who: "Agents that parse HTML but don't send Accept headers",
    url: "/blog/making-agent-friendly-pages",
    header: '<link rel="alternate" type="text/markdown" ... />',
  },
  {
    n: "C",
    title: "sitemap.md (convention)",
    tone: "green" as const,
    description:
      "The markdown sitemap at /blog/sitemap.md lists all posts with titles. An agent can fetch this URL directly (no Accept header needed) to discover what content exists, then fetch individual pages with the Accept header.",
    who: "Agents that look for sitemaps",
    url: "/blog/sitemap.md",
    header: "Direct URL access",
  },
];

export default function DiscoveryPage() {
  return (
    <div className="py-12">
      <p className="text-label-13-mono text-gray-500">experiment 04</p>
      <h1 className="mt-2 text-heading-32">Discovery paths for agents</h1>
      <p className="mt-3 max-w-2xl text-copy-16 text-gray-900">
        An agent needs to find the markdown version before it can use it.
        Three mechanisms, each for a different kind of agent. Together they
        cover every discovery scenario.
      </p>

      <div className="mt-8 grid gap-4">
        {DISCOVERY_PATHS.map((p) => (
          <Card key={p.n} className="p-5">
            <div className="flex items-baseline gap-4">
              <span className="text-heading-32 text-gray-500">{p.n}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-heading-20">{p.title}</h3>
                  <Badge tone={p.tone} mono>path {p.n}</Badge>
                </div>
                <p className="mt-2 text-copy-14 text-gray-900">
                  {p.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-label-13-mono">
                  <div>
                    <span className="text-gray-500">url: </span>
                    <span className="text-gray-1000">{p.url}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">signal: </span>
                    <span className="text-gray-1000">{p.header}</span>
                  </div>
                </div>
                <p className="mt-2 text-label-13 text-gray-700">
                  <span className="font-medium uppercase tracking-wide text-gray-500">
                    who uses this:{" "}
                  </span>
                  {p.who}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-heading-24">Path B: the link tag</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        This lab includes the <code className="text-gray-1000">link rel=&quot;alternate&quot;</code>{" "}
        tag in every blog post&apos;s metadata. View the page source to see
        it in the <code className="text-gray-1000">&lt;head&gt;</code>:
      </p>
      <CodeBlock
        filename="app/blog/[slug]/page.tsx (generateMetadata)"
        code={`export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug.join("/"));
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      types: {
        // This generates:
        // <link rel="alternate"
        //   type="text/markdown"
        //   href="/blog/{slug}" />
        "text/markdown": \`/blog/\${post.slug}\`,
      },
    },
  };
}`}
        highlight={[12, 13, 14, 15, 16, 17]}
        className="mt-3"
      />

      <Callout variant="info" title="Verify it in the page source" className="mt-4 max-w-2xl">
        Open <code>/blog/making-agent-friendly-pages</code> in your browser
        and view the HTML source (Cmd+U). Search for{" "}
        <code>rel=&quot;alternate&quot;</code> — you&apos;ll find the link
        tag in the <code>&lt;head&gt;</code>, advertising the markdown
        version at the same URL.
      </Callout>

      <h2 className="mt-10 text-heading-24">The full agent flow</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        A well-equipped agent combines all three paths. Here&apos;s the
        typical discovery and consumption flow:
      </p>
      <CodeBlock
        filename="agent flow"
        code={`# 1. DISCOVER: fetch the markdown sitemap
#    (no Accept header needed — .md URL is direct access)
curl http://localhost:3000/blog/sitemap.md
# → # Blog sitemap
#   - [Making agent-friendly pages...](/blog/making-agent-friendly-pages)
#   - [The Accept header field guide](/blog/the-accept-header-field-guide)
#   ...

# 2. SELECT: the agent reads titles and picks relevant posts

# 3. CONSUME: fetch each post with Accept: text/markdown
curl http://localhost:3000/blog/making-agent-friendly-pages \\
  -H "accept: text/markdown"
# → # Making agent-friendly pages with content negotiation
#   Agents fetch web pages to answer questions...

# Fallback: if the agent doesn't know about sitemaps,
# it can discover markdown from the HTML <link> tag:
curl -s http://localhost:3000/blog/making-agent-friendly-pages \\
  | grep 'rel="alternate"'
# → <link rel="alternate" type="text/markdown" href="/blog/making-agent-friendly-pages" />`}
        className="mt-3"
      />

      <h2 className="mt-10 text-heading-24">All three, tested with curl</h2>
      <CodeBlock
        filename="terminal"
        code={`# Path A: Accept header (automatic content negotiation)
curl -s http://localhost:3000/blog/making-agent-friendly-pages \\
  -H "accept: text/markdown" | head -3
# → # Making agent-friendly pages with content negotiation
#   ...
#   Agents fetch web pages to answer questions...

# Path B: link tag discovery (read the HTML, find the alternate)
curl -s http://localhost:3000/blog/making-agent-friendly-pages \\
  | grep 'rel="alternate"'
# → <link rel="alternate" type="text/markdown" href="..." />

# Path C: sitemap.md (direct URL, no header needed)
curl -s http://localhost:3000/blog/sitemap.md | head -5
# → # Blog sitemap
#   - [Making agent-friendly pages...](/blog/making-agent-friendly-pages)
#   ...`}
        className="mt-3"
      />
    </div>
  );
}
