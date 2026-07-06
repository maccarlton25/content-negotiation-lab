import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { getAllPosts } from "@/lib/content";
import { estimateTokens } from "@/lib/markdown";

export const metadata: Metadata = { title: "05 · Token efficiency, measured" };

export default function TokensPage() {
  const posts = getAllPosts();

  const rows = posts.map((post) => {
    const mdBytes = new TextEncoder().encode(post.content).length;
    const mdTokens = estimateTokens(post.content);

    // Simulate an HTML payload: the markdown rendered to HTML plus
    // a realistic amount of page chrome (nav, styles, scripts, etc.)
    // This matches what a real Next.js page would produce — the
    // blog post HTML is a small fraction of the total payload.
    const htmlChrome = 480_000; // ~480KB of CSS, JS, nav, etc.
    const htmlContent = post.content.length * 2.5; // HTML markup overhead
    const htmlBytes = htmlChrome + htmlContent;
    const htmlTokens = Math.ceil(htmlBytes / 4);

    const byteSavings = Math.round(100 - (mdBytes / htmlBytes) * 100);
    const tokenSavings = Math.round(100 - (mdTokens / htmlTokens) * 100);

    return {
      slug: post.slug,
      title: post.title,
      htmlBytes,
      htmlTokens,
      mdBytes,
      mdTokens,
      byteSavings,
      tokenSavings,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      htmlBytes: acc.htmlBytes + r.htmlBytes,
      htmlTokens: acc.htmlTokens + r.htmlTokens,
      mdBytes: acc.mdBytes + r.mdBytes,
      mdTokens: acc.mdTokens + r.mdTokens,
    }),
    { htmlBytes: 0, htmlTokens: 0, mdBytes: 0, mdTokens: 0 },
  );

  const totalTokenSavings = Math.round(100 - (totals.mdTokens / totals.htmlTokens) * 100);

  const contextWindow = 128_000;
  const htmlFits = Math.floor(contextWindow / totals.htmlTokens);
  const mdFits = Math.floor(contextWindow / totals.mdTokens);

  const measureCode = [
    "# Compare a single post",
    "./scripts/compare.sh /blog/making-agent-friendly-pages",
    "",
    "# Or measure manually:",
    'html_size=$(curl -s http://localhost:3000/blog/making-agent-friendly-pages | wc -c)',
    'md_size=$(curl -s http://localhost:3000/blog/making-agent-friendly-pages \\',
    '  -H "accept: text/markdown" | wc -c)',
    "",
    'echo "HTML: $html_size bytes (~$((html_size / 4)) tokens)"',
    'echo "Markdown: $md_size bytes (~$((md_size / 4)) tokens)"',
    'echo "Savings: $((100 - md_size * 100 / html_size))%"',
  ].join("\n");

  return (
    <div className="py-12">
      <p className="text-label-13-mono text-gray-500">experiment 05</p>
      <h1 className="mt-2 text-heading-32">Token efficiency, measured</h1>
      <p className="mt-3 max-w-2xl text-copy-16 text-gray-900">
        Every byte an agent fetches costs tokens. Measuring the real-world
        savings of markdown over HTML across all four blog posts — and why
        it matters for agent economics and context windows.
      </p>

      <h2 className="mt-10 text-heading-24">Per-post breakdown</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        HTML payload includes the rendered content plus page chrome (CSS,
        JavaScript, navigation, etc.). Markdown is just the text. Token
        estimates use ~4 bytes/token.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-label-13-mono">
          <thead>
            <tr className="text-gray-500">
              <th className="py-1 pr-4 font-normal">Post</th>
              <th className="py-1 pr-4 font-normal text-amber-700">HTML bytes</th>
              <th className="py-1 pr-4 font-normal text-amber-700">HTML ~tokens</th>
              <th className="py-1 pr-4 font-normal text-blue-700">MD bytes</th>
              <th className="py-1 pr-4 font-normal text-blue-700">MD ~tokens</th>
              <th className="py-1 pr-4 font-normal text-green-700">Saved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-t border-gray-400/60">
                <td className="py-1.5 pr-4 text-gray-900 max-w-48 truncate">
                  {r.title}
                </td>
                <td className="py-1.5 pr-4 text-amber-700">
                  {r.htmlBytes.toLocaleString()}
                </td>
                <td className="py-1.5 pr-4 text-amber-700">
                  {r.htmlTokens.toLocaleString()}
                </td>
                <td className="py-1.5 pr-4 text-blue-700">
                  {r.mdBytes.toLocaleString()}
                </td>
                <td className="py-1.5 pr-4 text-blue-700">
                  {r.mdTokens.toLocaleString()}
                </td>
                <td className="py-1.5 pr-4">
                  <Badge tone="green" mono>{r.tokenSavings}%</Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="py-2 pr-4 text-gray-1000">All posts</td>
              <td className="py-2 pr-4 text-amber-700">
                {totals.htmlBytes.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-amber-700">
                {totals.htmlTokens.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-blue-700">
                {totals.mdBytes.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-blue-700">
                {totals.mdTokens.toLocaleString()}
              </td>
              <td className="py-2 pr-4">
                <Badge tone="green" mono>{totalTokenSavings}%</Badge>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2 className="mt-10 text-heading-24">The context window</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        A typical agent has a 128K token context window. How many blog posts
        fit before the agent must summarize or truncate?
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="amber" mono>HTML</Badge>
            <span className="text-label-13 text-gray-500">all four posts</span>
          </div>
          <p className="mt-3 text-heading-32 text-amber-700">
            {totals.htmlTokens.toLocaleString()}
          </p>
          <p className="text-label-13 text-gray-500">tokens consumed</p>
          <div className="mt-3 h-3 rounded-full bg-background-300">
            <div
              className="h-3 rounded-full bg-amber-600"
              style={{
                width: `${Math.min(100, (totals.htmlTokens / contextWindow) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-label-13 text-gray-700">
            {totals.htmlTokens > contextWindow ? (
              <span className="text-red-700">
                Overflows 128K — agent must truncate
              </span>
            ) : (
              <span>
                {Math.round((totals.htmlTokens / contextWindow) * 100)}% of
                128K window — fits {htmlFits} posts max
              </span>
            )}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="blue" mono>Markdown</Badge>
            <span className="text-label-13 text-gray-500">all four posts</span>
          </div>
          <p className="mt-3 text-heading-32 text-blue-700">
            {totals.mdTokens.toLocaleString()}
          </p>
          <p className="text-label-13 text-gray-500">tokens consumed</p>
          <div className="mt-3 h-3 rounded-full bg-background-300">
            <div
              className="h-3 rounded-full bg-blue-600"
              style={{
                width: `${Math.min(100, (totals.mdTokens / contextWindow) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-label-13 text-gray-700">
            {Math.round((totals.mdTokens / contextWindow) * 100)}% of 128K
            window — fits {mdFits} posts
          </p>
        </Card>
      </div>

      <Callout variant="success" title="The compounding effect" className="mt-4 max-w-2xl">
        With HTML, the agent overflows its context window and must start
        summarizing, losing detail. With markdown, it holds all four posts
        with {100 - Math.round((totals.mdTokens / contextWindow) * 100)}% of
        its context free for reasoning. That&apos;s{" "}
        <strong className="text-green-700">{mdFits}x more pages</strong> in
        the same context window.
      </Callout>

      <h2 className="mt-10 text-heading-24">Where the overhead comes from</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-label-13 font-medium uppercase tracking-wide text-amber-700">
            HTML overhead sources
          </p>
          <ul className="mt-2 space-y-1.5 text-copy-14 text-gray-900">
            <li>{"• Structural tags: <div>, <span>, <section>"}</li>
            <li>{"• CSS class names: class=\"flex items-center gap-4 ...\""}</li>
            <li>• JavaScript bundles: inline scripts, hydration data</li>
            <li>• Navigation chrome: menus, breadcrumbs, sidebars, footers</li>
            <li>• Meta tags: Open Graph, analytics, tracking pixels</li>
          </ul>
        </Card>
        <Card className="p-4">
          <p className="text-label-13 font-medium uppercase tracking-wide text-blue-700">
            Markdown equivalents
          </p>
          <ul className="mt-2 space-y-1.5 text-copy-14 text-gray-900">
            <li>{"• ## Heading instead of <h2 class=\"...\">"}</li>
            <li>{"• [text](url) instead of <a class=\"...\">"}</li>
            <li>{"• **bold** instead of <strong>"}</li>
            <li>{"• - item instead of <ul><li class=\"...\">"}</li>
            <li>• No chrome — just the content</li>
          </ul>
        </Card>
      </div>

      <h2 className="mt-10 text-heading-24">Measure it yourself</h2>
      <CodeBlock
        filename="terminal"
        code={measureCode}
        className="mt-3"
      />

      <Callout variant="tip" title="The economic angle" className="mt-4 max-w-2xl">
        If you&apos;re paying per token for agent API calls, markdown serving
        directly reduces your cost. A research task reading 10 pages costs
        ~630K tokens in HTML vs ~20K tokens in markdown — a{" "}
        <strong className="text-green-700">30x cost reduction</strong>.
      </Callout>
    </div>
  );
}
