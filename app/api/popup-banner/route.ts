import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  imageUrl: z.string().min(1).max(2000),
  linkUrl: z.string().min(1).max(2000),
  altText: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const banners = await prisma.popupBanner.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ banners });
}

// Yeni banner oluşturulurken active:true seçilirse, tek seferde sadece bir
// banner aktif olabilsin diye önce diğer tüm kayıtlar pasife çekilir.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    if (d.active) {
      await prisma.popupBanner.updateMany({ where: { active: true }, data: { active: false } });
    }
    const banner = await prisma.popupBanner.create({
      data: {
        imageUrl: d.imageUrl,
        linkUrl: d.linkUrl,
        altText: d.altText || null,
        active: d.active ?? false,
      },
    });
    return NextResponse.json({ banner }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
