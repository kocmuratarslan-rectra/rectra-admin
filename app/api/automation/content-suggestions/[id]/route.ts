import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/markdown-lite";

const decideSchema = z.object({
  action: z.enum(["approve", "reject"]),
  // Onaylamadan önce Murat başlık/içerik/slug üzerinde küçük düzeltmeler yapabilir.
  title: z.string().min(1).max(300).optional(),
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().max(50000).optional(),
  category: z.string().max(100).optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = decideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    const suggestion = await prisma.contentSuggestion.findUnique({ where: { id } });
    if (!suggestion) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (suggestion.status !== "PENDING") {
      return NextResponse.json({ error: "already_decided" }, { status: 409 });
    }

    if (parsed.data.action === "reject") {
      await prisma.contentSuggestion.update({
        where: { id },
        data: { status: "REJECTED", decidedAt: new Date() },
      });
      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    const title = parsed.data.title ?? suggestion.title;
    const slug = (parsed.data.slug ?? suggestion.slug) || slugify(title);
    const excerpt = parsed.data.excerpt ?? suggestion.excerpt;
    const content = parsed.data.content ?? suggestion.content;
    const category = parsed.data.category ?? suggestion.category;

    let item;
    try {
      item = await prisma.contentItem.create({
        data: {
          type: "BLOG",
          title,
          slug,
          excerpt,
          content,
          category,
          published: true,
          publishedAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        return NextResponse.json({ error: "slug_taken", message: "Bu slug zaten kullanılıyor — önce slug'ı değiştirip tekrar deneyin." }, { status: 409 });
      }
      throw e;
    }

    await prisma.contentSuggestion.update({
      where: { id },
      data: { status: "APPROVED", decidedAt: new Date() },
    });

    return NextResponse.json({ ok: true, status: "APPROVED", item });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.contentSuggestion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
