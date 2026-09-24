import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderMarkdownLite, plainExcerpt } from "@/lib/markdown-lite";
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

async function getPost(slug: string) {
  return prisma.contentItem.findFirst({
    where: { type: "BLOG", slug, published: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: `Yazı bulunamadı | ${SITE_NAME}` };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || plainExcerpt(post.content || "");
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "tr_TR",
      type: "article",
      publishedTime: (post.publishedAt || post.createdAt).toISOString(),
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: post.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: (post.publishedAt || post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "Rectra Business School" },
    publisher: { "@type": "Organization", name: "Rectra Business School" },
    mainEntityOfPage: url,
  };

  return (
    <>
      <style>{`
        .rblog-back{font-size:13px;color:var(--muted);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:24px}
        .rblog-back:hover{color:var(--ink)}
        .rblog-art-cat{display:inline-block;font-family:var(--font-m),monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;background:rgba(45,212,191,.12);color:var(--teal-deep,#0FA99A);padding:4px 10px;border-radius:100px;margin-bottom:16px;font-weight:700}
        .rblog-art h1{font-family:var(--font-d),sans-serif;font-size:clamp(28px,4vw,42px);color:var(--ink);margin-bottom:14px;line-height:1.2}
        .rblog-art time{display:block;font-size:12.5px;color:var(--mod,#9AA3C0);font-family:var(--font-m),monospace;margin-bottom:28px}
        .rblog-cover{width:100%;border-radius:18px;margin-bottom:32px;display:block}
        .rblog-body{font-size:16.5px;line-height:1.8;color:var(--text)}
        .rblog-body h2{font-family:var(--font-d),sans-serif;font-size:26px;margin:36px 0 14px;color:var(--ink)}
        .rblog-body h3{font-family:var(--font-d),sans-serif;font-size:20px;margin:28px 0 12px;color:var(--ink)}
        .rblog-body p{margin-bottom:18px}
        .rblog-body ul{margin:0 0 18px 22px}
        .rblog-body li{margin-bottom:8px}
        .rblog-body a{color:var(--teal-deep,#0FA99A);font-weight:600}
        .rblog-cta-box{margin-top:52px;padding:28px;border-radius:18px;background:var(--ink);color:#fff;text-align:center}
        .rblog-cta-box h3{font-family:var(--font-d),sans-serif;font-size:20px;margin-bottom:8px}
        .rblog-cta-box p{color:#C6CCE2;font-size:14px;margin-bottom:18px}
        .rblog-cta-box a{display:inline-block;background:linear-gradient(120deg,#E5164A,#B10D31);color:#fff;padding:12px 26px;border-radius:100px;font-weight:700;text-decoration:none;font-size:14px}
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" className="rblog-back">← Tüm yazılar</Link>
      <article className="rblog-art">
        {post.category && <span className="rblog-art-cat">{CAT_LABELS[post.category] || post.category}</span>}
        <h1>{post.title}</h1>
        <time dateTime={(post.publishedAt || post.createdAt).toISOString()}>
          {(post.publishedAt || post.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
        </time>
        {post.coverImage && <img src={post.coverImage} alt={post.title} className="rblog-cover" />}
        <div className="rblog-body" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(post.content || "") }} />
        <div className="rblog-cta-box">
          <h3>Kurumunuz için özel çözüm ister misiniz?</h3>
          <p>60 saniyede formu doldurun, 24 saat içinde teklifiniz hazır olsun.</p>
          <a href={`${SITE_URL}/#teklif`}>60 Saniyede Teklif Al</a>
        </div>
      </article>
    </>
  );
}
