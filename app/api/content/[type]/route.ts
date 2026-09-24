import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["SERVICE", "TESTIMONIAL", "FAQ", "BLOG"];

const createSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(300).optional().nullable(),
  body: z.string().max(10000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
  // Blog & SEO alanları (opsiyonel, sadece BLOG tipi için kullanılır)
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  coverImage: z.string().max(1000).optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=30",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Oturumsuz istekler (canlı site dahil) sadece published:true kayıtları görür.
// CORS açık: rectra-site.vercel.app buradan SSS ve Referanslar verisini çeker.
export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type: rawType } = await params;
  const type = rawType.toUpperCase();
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  const session = await getServerSession(authOptions);
  const items = await prisma.contentItem.findMany({
    where: { type: type as any, ...(session ? {} : { published: true }) },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ items }, { headers: session ? {} : corsHeaders() });
}

export async function POST(req: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { type: rawType } = await params;
    const type = rawType.toUpperCase();
    if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    const item = await prisma.contentItem.create({
      data: {
        type: type as any,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        body: parsed.data.body,
        category: parsed.data.category,
        order: parsed.data.order ?? 0,
        published: parsed.data.published ?? true,
        slug: parsed.data.slug || null,
        excerpt: parsed.data.excerpt,
        content: parsed.data.content,
        coverImage: parsed.data.coverImage,
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
        publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : (parsed.data.published !== false ? new Date() : null),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "slug_taken", message: "Bu slug zaten kullanılıyor, farklı bir slug seçin." }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
