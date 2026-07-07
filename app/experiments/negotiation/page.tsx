import type { Metadata } from "next";
import { AgentProbe } from "@/components/AgentProbe";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = { title: "01 · Same URL, two representations" };

export default async function NegotiationPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const posts = getAllPosts();
  const { path } = await searchParams;

  // The "open in AgentProbe" badge on a blog post links here with
  // ?path=/blog/<slug>. Feature that post so the probe reflects the post
  // the reader came from — otherwise the link always lands on posts[0].
  const requestedSlug = path?.replace(/^\/blog\//, "");
  const featured =
    posts.find((post) => post.slug === requestedSlug) ?? posts[0];
  const rest = posts.filter((post) => post.slug !== featured.slug);

  return (
    <div className="py-12">
      <p className="text-label-13-mono text-gray-500">experiment 01</p>
      <h1 className="mt-2 text-heading-32">Same URL, two representations</h1>
      <p className="mt-3 max-w-2xl text-copy-16 text-gray-900">
        The core of content negotiation: one URL serves{" "}
        <Badge tone="amber" mono>HTML</Badge> to browsers and{" "}
        <Badge tone="blue" mono>markdown</Badge> to agents. The server
        inspects the <code className="text-gray-1000">Accept</code> header
        and returns the matching format. No separate <code>.md</code> URLs.
      </p>

      <Callout variant="tip" title="How to use the probe" className="mt-6 max-w-2xl">
        Set the toggle to <span className="text-amber-700">Browser</span> to
        fetch with <code>Accept: text/html</code>. Set it to{" "}
        <span className="text-blue-700">Agent</span> to fetch with{" "}
        <code>Accept: text/markdown</code>. Set it to{" "}
        <span className="text-purple-900">Compare</span> to fetch both and
        see the savings. Then click <span className="text-gray-1000">Fetch</span>.
      </Callout>

      <h2 id="try" className="mt-10 scroll-mt-24 text-heading-24">
        Try it: {featured.title}
      </h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        This is a real blog post at <code className="text-gray-1000">/blog/{featured.slug}</code>.
        The AgentProbe fetches it with both headers and shows you exactly
        what a browser and an agent receive.
      </p>

      <AgentProbe
        path={`/blog/${featured.slug}`}
        className="mt-4"
        defaultMode="compare"
      />

      <h2 className="mt-10 text-heading-24">Try other posts</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Every blog post supports content negotiation. Pick one and run the
        probe:
      </p>
      <div className="mt-4 grid gap-3">
        {rest.map((post) => (
          <Card key={post.slug} className="p-4">
            <p className="text-heading-20">{post.title}</p>
            <p className="mt-1 text-copy-14 text-gray-700">{post.excerpt}</p>
            <AgentProbe
              path={`/blog/${post.slug}`}
              className="mt-3"
              defaultMode="compare"
            />
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-heading-24">How it works</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Two pieces: a rewrite rule that detects the header, and a route
        handler that returns markdown.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CodeBlock
          filename="next.config.ts"
          code={`async rewrites() {
  function markdownRewrite(prefix: string) {
    return {
      source: \`\${prefix}/:path*\`,
      has: [{
        type: "header",
        key: "accept",
        value: "(.*)text/markdown(.*)",
      }],
      destination: \`\${prefix}/md/:path*\`,
    };
  }
  return {
    beforeFiles: [
      markdownRewrite("/blog"),
    ],
  };
}`}
          highlight={[6, 7, 8, 9, 10]}
        />
        <CodeBlock
          filename="app/blog/md/[[...slug]]/route.ts"
          code={`export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const content = getMarkdownContent(
    slug?.join("/") ?? "index"
  );
  if (!content) notFound();
  return new Response(content, {
    headers: { "Content-Type": "text/markdown" },
  });
}`}
          highlight={[9, 10, 11]}
        />
      </div>

      <Callout variant="info" title="The rewrite is in beforeFiles" className="mt-4 max-w-2xl">
        <code>beforeFiles</code> rewrites run <em>before</em> Next.js checks
        the filesystem for a matching route. So when the Accept header
        contains <code>text/markdown</code>, the request is redirected to
        the <code>/blog/md/</code> route handler before the HTML page at{" "}
        <code>/blog/[slug]/page.tsx</code> is even considered.
      </Callout>

      <h2 className="mt-10 text-heading-24">The same URL, verified</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Confirm with curl that both representations come from the same URL —
        no <code>.md</code> suffix, no query parameter, just the Accept header:
      </p>
      <CodeBlock
        filename="terminal"
        code={`# Browser — returns HTML
curl -s -D - http://localhost:3000/blog/${featured.slug} \\
  -H "accept: text/html" | grep -i content-type
# → content-type: text/html; charset=utf-8

# Agent — returns markdown
curl -s -D - http://localhost:3000/blog/${featured.slug} \\
  -H "accept: text/markdown" | grep -i content-type
# → content-type: text/markdown; charset=utf-8

# Same URL. Different Accept header. Different format.`}
        className="mt-3"
      />
    </div>
  );
}
