import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPost } from "@/lib/content";
import { markdownToHtml } from "@/lib/markdown";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      types: {
        "text/markdown": `/blog/${post.slug}`,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.content);

  return (
    <div className="py-12">
      <Link
        href="/blog"
        className="text-label-13 text-gray-700 transition-colors hover:text-gray-1000"
      >
        ← Blog
      </Link>

      <div className="mt-4 max-w-3xl">
        <h1 className="text-heading-40">{post.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-label-13-mono text-gray-500">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.author}</span>
        </div>
      </div>

      <Callout variant="tip" title="This page supports content negotiation" className="mt-6 max-w-3xl">
        Send <code>Accept: text/markdown</code> to this URL to get the
        markdown version. Try it:{" "}
        <code>curl http://localhost:3000/blog/{post.slug} -H &quot;accept: text/markdown&quot;</code>
      </Callout>

      <article
        className="prose-article mt-8 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="mt-12 flex flex-wrap gap-2">
        <Link href={`/experiments/negotiation?path=/blog/${post.slug}#try`}>
          <Badge tone="blue" mono>probe this page</Badge>
        </Link>
        <Link href="/blog/sitemap.md">
          <Badge tone="green" mono>markdown sitemap</Badge>
        </Link>
      </div>
    </div>
  );
}
