import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// Bu sitemap rectra-admin'de üretilir ama rectra-site'ın vercel.json
// rewrite'ı sayesinde https://rectra-site.vercel.app/sitemap.xml adresinde
// servis edilir — URL'ler her zaman kanonik ana site adresini (SITE_URL)
// kullanır, blog yazıları veritabanından dinamik olarak eklenir.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.contentItem.findMany({
    where: { type: "BLOG", published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...posts
      .filter((p: { slug: string | null }) => p.slug)
      .map((p: { slug: string | null; updatedAt: Date }) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}
