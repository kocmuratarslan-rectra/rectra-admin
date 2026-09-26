import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  imageUrl: z.string().min(1).max(2000).optional(),
  linkUrl: z.string().min(1).max(2000).optional(),
  altText: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    // Bu banner aktif yapılıyorsa, önce diğer tüm kayıtları pasife çek —
    // aynı anda sadece bir banner canlı sitede gösterilsin.
    if (parsed.data.active) {
      await prisma.popupBanner.updateMany({ where: { active: true, NOT: { id } }, data: { active: false } });
    }
    const banner = await prisma.popupBanner.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ banner });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.popupBanner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
