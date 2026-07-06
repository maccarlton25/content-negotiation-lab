import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/content";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Blog",
  description: "Sample blog posts for the content negotiation lab.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="py-12">
      <p className="text-label-13-mono text-gray-500">blog</p>
      <h1 className="mt-2 text-heading-32">Blog</h1>
      <p className="mt-3 max-w-2xl text-copy-16 text-gray-900">
        Four sample posts about agent-friendly web design. Every post URL
        supports content negotiation — send{" "}
        <code className="text-gray-1000">Accept: text/markdown</code> to get
        the markdown version from the same URL.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/blog/sitemap.md">
          <Badge tone="green" mono>sitemap.md</Badge>
        </Link>
        <Link href="/blog/sitemap.xml">
          <Badge tone="purple" mono>sitemap.xml</Badge>
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <Card className="p-5 transition-colors group-hover:border-gray-300">
              <div className="flex items-baseline gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-heading-20 group-hover:underline">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-label-13-mono text-gray-500">
                    {post.date} · {post.author}
                  </p>
                  <p className="mt-2 text-copy-14 text-gray-900">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
