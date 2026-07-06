import { getMarkdownSitemap } from "@/lib/content";

export const dynamic = "force-static";

/**
 * Standalone markdown sitemap for direct access at /blog/sitemap.md
 * (without needing the Accept: text/markdown header).
 *
 * If an agent DOES send Accept: text/markdown to /blog/sitemap.md,
 * the rewrite routes it to /blog/md/sitemap.md, which the catch-all
 * route handler also handles — so both paths serve the same content.
 */
export async function GET() {
  const sitemap = getMarkdownSitemap();
  return new Response(sitemap, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
