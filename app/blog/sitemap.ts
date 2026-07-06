import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content";

/**
 * XML sitemap at /blog/sitemap.xml — the traditional sitemap format.
 * Flat list of URLs with no titles, no hierarchy, no context.
 * Compare this to the markdown sitemap at /blog/sitemap.md to see
 * the difference for agent discovery.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return posts.map((post) => ({
    url: `/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
}
