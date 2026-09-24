import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type BlogListItem = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  category: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

const CAT_LABELS: Record<string, string> = {
  AI: "Yapay Zekâ",
  LIDER: "Liderlik",
  SOFT: "Soft Skills",
  IK: "İK",
  ALIM: "İşe Alım",
  KOC: "Koçluk",
  GENEL: "Genel",
};

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description: "Kurumsal eğitim, liderlik, yapay zekâ ve İK üzerine Rectra Business School'dan güncel yazılar.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description: "Kurumsal eğitim, liderlik, yapay zekâ ve İK üzerine Rectra Business School'dan güncel yazılar.",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    locale: "tr_TR",
    type: "website",
  },
};

export default async function BlogListPage() {
  const posts = await prisma.contentItem.findMany({
    where: { type: "BLOG", published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <style>{`
        .rblog-hero h1{font-family:var(--font-d),sans-serif;font-size:clamp(32px,4.5vw,48px);margin-bottom:10px;color:var(--ink)}
        .rblog-hero p{color:var(--muted);font-size:16px;max-width:560px}
        .rblog-list{display:grid;gap:18px;margin-top:40px}
        .rblog-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;display:block;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s}
        .rblog-card:hover{transform:translateY(-2px);box-shadow:0 16px 34px -20px rgba(11,16,38,.25)}
        .rblog-card-cat{display:inline-block;font-family:var(--font-m),monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;background:rgba(45,212,191,.12);color:var(--teal-deep,#0FA99A);padding:4px 10px;border-radius:100px;margin-bottom:12px;font-weight:700}
        .rblog-card h2{font-family:var(--font-d),sans-serif;font-size:22px;margin-bottom:8px;color:var(--ink)}
        .rblog-card p{color:var(--muted);font-size:14.5px;line-height:1.6}
        .rblog-card time{display:block;margin-top:14px;font-size:12.5px;color:var(--mod,#9AA3C0);font-family:var(--font-m),monospace}
        .rblog-empty{color:var(--muted);margin-top:40px}
      `}</style>
      <div className="rblog-hero">
        <h1>Rectra Blog</h1>
        <p>Kurumsal eğitim, liderlik, yapay zekâ ve İK üzerine güncel içerikler.</p>
      </div>

      {posts.length === 0 ? (
        <p className="rblog-empty">Henüz yayınlanmış yazı yok — yakında burada olacak.</p>
      ) : (
        <div className="rblog-list">
          {posts.map((post: BlogListItem) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="rblog-card">
              {post.category && <span className="rblog-card-cat">{CAT_LABELS[post.category] || post.category}</span>}
              <h2>{post.title}</h2>
              {post.excerpt && <p>{post.excerpt}</p>}
              <time dateTime={(post.publishedAt || post.createdAt).toISOString()}>
                {(post.publishedAt || post.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
              </time>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
