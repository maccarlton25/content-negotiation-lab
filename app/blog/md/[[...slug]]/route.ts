import { notFound } from "next/navigation";
import {
  getAllPosts,
  getMarkdownContent,
  getMarkdownIndex,
  getMarkdownSitemap,
} from "@/lib/content";

export const dynamic = "force-static";

/**
 * The markdown route handler. Serves markdown for:
 *   - /blog/md  (empty slug → markdown index)
 *   - /blog/md/sitemap.md  (markdown sitemap)
 *   - /blog/md/[slug]  (individual post markdown)
 *
 * The rewrite in next.config.ts routes /blog/:path* here when the
 * Accept header contains text/markdown. This URL is also accessible
 * directly (without the Accept header) — the route handler always
 * returns text/markdown.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;

  let content: string | undefined;

  if (!slug || slug.length === 0) {
    // /blog/md — markdown index of all posts
    content = getMarkdownIndex();
  } else if (
    slug.length === 1 &&
    (slug[0] === "sitemap.md" ||
      slug[0] === "sitemap.xml" ||
      slug[0] === "sitemap")
  ) {
    // Markdown sitemap. Catches both the direct /blog/sitemap.md and the
    // canonical /blog/sitemap.xml rewritten here when Accept: text/markdown
    // (Next's sitemap convention exposes the sitemap as sitemap.xml).
    content = getMarkdownSitemap();
  } else {
    // /blog/md/[slug] — individual post
    content = getMarkdownContent(slug.join("/"));
  }

  if (!content) {
    notFound();
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return [
    ...posts.map((post) => ({ slug: [post.slug] })),
    { slug: ["sitemap.md"] },
    { slug: ["sitemap.xml"] },
  ];
}
