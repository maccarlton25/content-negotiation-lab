import type { Metadata } from "next";
import { AcceptHeaderTester } from "@/components/AcceptHeaderTester";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = { title: "02 · The Accept header field guide" };

const HEADER_PATTERNS = [
  {
    header: "text/markdown",
    matches: true,
    note: "exact match — the simplest case",
  },
  {
    header: "text/markdown, text/html, */*",
    matches: true,
    note: "markdown first — the common agent pattern",
  },
  {
    header: "text/html, text/markdown, */*",
    matches: true,
    note: "markdown anywhere in the list — still matches",
  },
  {
    header: "*/*, text/markdown;q=0.8",
    matches: true,
    note: "with quality factor — still matches",
  },
  {
    header: "text/html, */*",
    matches: false,
    note: "no markdown — serves HTML (default)",
  },
  {
    header: "*/*",
    matches: false,
    note: "wildcard only — serves HTML (default)",
  },
  {
    header: "(no Accept header)",
    matches: false,
    note: "header absent — serves HTML (default)",
  },
];

export default function AcceptPage() {
  const post = getAllPosts()[0];

  return (
    <div className="py-12">
      <p className="text-label-13-mono text-gray-500">experiment 02</p>
      <h1 className="mt-2 text-heading-32">The Accept header field guide</h1>
      <p className="mt-3 max-w-2xl text-copy-16 text-gray-900">
        The <code className="text-gray-1000">Accept</code> header is the
        handshake between client and server. The rewrite rule uses a regex
        to detect <code className="text-gray-1000">text/markdown</code>{" "}
        anywhere in the header. Test every variation and see what the server
        returns.
      </p>

      <h2 className="mt-10 text-heading-24">The matching rules</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        The rewrite uses <code className="text-gray-1000">(.*)text/markdown(.*)</code>{" "}
        — a regex that matches markdown anywhere in the Accept header:
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-label-13">
          <thead>
            <tr className="text-gray-500">
              <th className="py-1 pr-4 font-normal">Accept header</th>
              <th className="py-1 pr-4 font-normal">Rewrite?</th>
              <th className="py-1 font-normal">Why</th>
            </tr>
          </thead>
          <tbody>
            {HEADER_PATTERNS.map((p) => (
              <tr key={p.header} className="border-t border-gray-400/60">
                <td className="py-1.5 pr-4">
                  <code className={p.matches ? "text-blue-700" : "text-amber-700"}>
                    {p.header}
                  </code>
                </td>
                <td className="py-1.5 pr-4">
                  {p.matches ? (
                    <Badge tone="blue" mono>→ markdown</Badge>
                  ) : (
                    <Badge tone="amber" mono>→ html</Badge>
                  )}
                </td>
                <td className="py-1.5 text-gray-900">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-heading-24">Test it live</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Click <span className="text-gray-1000">Test all headers</span> to
        fetch <code className="text-gray-1000">/blog/{post.slug}</code> with
        each Accept header variation and see what the server returns:
      </p>

      <AcceptHeaderTester
        path={`/blog/${post.slug}`}
        className="mt-4"
      />

      <Callout variant="warning" title="The quality factor edge case" className="mt-6 max-w-2xl">
        An agent sending <code>text/html;q=0.9, text/markdown;q=0.8</code>{" "}
        strictly prefers HTML. The regex still matches and serves markdown —
        which is <em>not</em> what the agent asked for. In practice this is
        rare: agents that want markdown list it first. If you need precise
        q-value handling, parse the Accept header in middleware instead of
        using a rewrite.
      </Callout>

      <h2 className="mt-10 text-heading-24">The regex, explained</h2>
      <CodeBlock
        filename="next.config.ts (rewrite has field)"
        code={`has: [
  {
    type: "header",
    key: "accept",
    // The value is a regex tested against the header value.
    // (.*)text/markdown(.*)  matches the substring
    // "text/markdown" anywhere in the Accept header.
    //
    // Examples that MATCH:
    //   "text/markdown"
    //   "text/markdown, text/html"
    //   "text/html, text/markdown, */*"
    //   "*/*, text/markdown;q=0.8"
    //
    // Examples that DON'T match:
    //   "text/html"
    //   "*/*"
    //   "text/plain"
    value: "(.*)text/markdown(.*)",
  },
]`}
        highlight={[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]}
        className="mt-3"
      />

      <h2 className="mt-10 text-heading-24">Try with curl</h2>
      <CodeBlock
        filename="terminal"
        code={`# Markdown — should return text/markdown
curl -s -D - http://localhost:3000/blog/${post.slug} \\
  -H "accept: text/markdown" | head -5

# HTML — should return text/html
curl -s -D - http://localhost:3000/blog/${post.slug} \\
  -H "accept: text/html" | head -5

# Wildcard — should return text/html (default)
curl -s -D - http://localhost:3000/blog/${post.slug} \\
  -H "accept: */*" | head -5

# No header — should return text/html (default)
curl -s -D - http://localhost:3000/blog/${post.slug} | head -5`}
        className="mt-3"
      />
    </div>
  );
}
