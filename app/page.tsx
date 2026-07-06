import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";

const EXPERIMENTS = [
  {
    href: "/experiments/negotiation",
    n: "01",
    title: "Same URL, two representations",
    question: "What does an agent see vs. what a browser sees?",
    watch:
      "The AgentProbe fetches a blog post with both Accept: text/html and Accept: text/markdown. Same URL, same route — different response. See the payload and token savings in real time.",
  },
  {
    href: "/experiments/accept",
    n: "02",
    title: "The Accept header field guide",
    question: "How does the rewrite decide which format to serve?",
    watch:
      "Test seven different Accept header values against the same URL. See how the regex (.*)text/markdown(.*) matches markdown anywhere in the header — and what happens when it's absent.",
  },
  {
    href: "/experiments/sitemap",
    n: "03",
    title: "Markdown sitemaps vs. XML sitemaps",
    question: "How do agents discover what content exists?",
    watch:
      "Compare /blog/sitemap.xml (flat URL list, no context) with /blog/sitemap.md (titles, hierarchy, meaning). An agent reading the markdown sitemap knows what each page is about before fetching it.",
  },
  {
    href: "/experiments/discovery",
    n: "04",
    title: "Discovery paths for agents",
    question: "How does an agent find the markdown version?",
    watch:
      "Three discovery mechanisms: the Accept header (automatic), the link rel=alternate tag (HTML head), and the sitemap.md URL (convention). See how each one works and when agents use each.",
  },
  {
    href: "/experiments/tokens",
    n: "05",
    title: "Token efficiency, measured",
    question: "How many tokens does markdown save across all blog posts?",
    watch:
      "Fetch every blog post as both HTML and markdown. See the total payload, token count, and cost difference. The HTML version overflows a 128K context window; markdown leaves 90% free.",
  },
];

const FORMAT_TABLE = [
  { header: "text/markdown", tone: "blue" as const, means: "agent requests markdown, server returns it" },
  { header: "text/html", tone: "amber" as const, means: "browser requests HTML, server returns it" },
  { header: "*/*", tone: "neutral" as const, means: "client accepts anything, server returns default (HTML)" },
];

export default function Home() {
  return (
    <div className="py-14">
      <p className="text-label-13-mono text-gray-500">
        next@16.3 · content negotiation · works locally and on Vercel
      </p>
      <h1 className="mt-3 max-w-3xl text-heading-40 md:text-heading-56">
        Content negotiation, observed
      </h1>
      <p className="mt-4 max-w-2xl text-copy-16 text-gray-900">
        Five experiments where you emulate an agent viewing your site, send
        the right <code className="text-copy-14-mono text-gray-1000">Accept</code>{" "}
        header, and watch the server return markdown instead of HTML from the
        same URL. Built on the concepts from the{" "}
        <a
          href="https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation"
          className="text-blue-700 underline"
        >
          Vercel blog post
        </a>
        .
      </p>

      <Callout variant="success" title="Works locally" className="mt-8 max-w-2xl">
        Unlike the ISR Lab, this lab runs fully on <code>next dev</code>.
        Content negotiation is a Next.js rewrite + route handler — no Vercel
        infrastructure required. Deploy when you&apos;re ready to share.
      </Callout>

      <h2 className="mt-14 text-heading-24">The instrument</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Every experiment page embeds an{" "}
        <code className="text-copy-14-mono text-gray-1000">AgentProbe</code>{" "}
        that fetches a URL with either a browser&apos;s or an agent&apos;s{" "}
        <code className="text-copy-14-mono text-gray-1000">Accept</code> header.
        The toggle <em>is</em> the agent/browser switch — that&apos;s how you
        emulate an agent viewing your site.
      </p>

      <Card className="mt-4 max-w-2xl p-4">
        <p className="mb-3 text-label-13 font-medium uppercase tracking-wide text-gray-500">
          The vocabulary
        </p>
        <ul className="space-y-2.5">
          {FORMAT_TABLE.map((f) => (
            <li key={f.header} className="flex items-baseline gap-3">
              <Badge tone={f.tone} mono className="shrink-0">
                {f.header}
              </Badge>
              <span className="text-copy-14 text-gray-900">{f.means}</span>
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="mt-14 text-heading-24">The experiments</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        In order — each builds on the vocabulary of the previous one.
      </p>
      <div className="mt-6 grid gap-4">
        {EXPERIMENTS.map((e) => (
          <Link key={e.href} href={e.href} className="group">
            <Card className="p-5 transition-colors group-hover:border-gray-300">
              <div className="flex items-baseline gap-4">
                <span className="text-label-14-mono text-gray-500">{e.n}</span>
                <div>
                  <h3 className="text-heading-20 group-hover:underline">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-copy-14 text-gray-700">{e.question}</p>
                  <p className="mt-3 text-copy-14 text-gray-900">
                    <span className="text-label-13 font-medium uppercase tracking-wide text-gray-500">
                      watch for{" "}
                    </span>
                    {e.watch}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mt-14 text-heading-24">The blog</h2>
      <p className="mt-2 max-w-2xl text-copy-14 text-gray-900">
        Four sample posts about agent-friendly web design. Every URL supports
        content negotiation. Visit{" "}
        <Link href="/blog" className="text-blue-700 underline">
          /blog
        </Link>{" "}
        to browse, or fetch any post with{" "}
        <code className="text-copy-14-mono text-gray-1000">
          Accept: text/markdown
        </code>{" "}
        to get the markdown version.
      </p>

      <h2 className="mt-14 text-heading-24">After the experiments</h2>
      <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 text-copy-14 text-gray-900">
        <li>
          Try the shell scripts in <code className="text-gray-1000">scripts/</code>:
          <code className="text-gray-1000">./scripts/compare.sh /blog/making-agent-friendly-pages</code>
        </li>
        <li>
          Deploy to Vercel and share the deployment URL with an agent — it
          will automatically get markdown from any blog URL.
        </li>
        <li>
          The README walks through every experiment with copy-paste curl
          commands.
        </li>
      </ul>
    </div>
  );
}
