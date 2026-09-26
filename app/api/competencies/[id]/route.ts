import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATS = ["AI", "LIDER", "SOFT", "IK", "ALIM", "KOC"] as const;

const indicatorSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1).max(400),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(CATS).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  indicators: z.array(indicatorSchema).max(30).optional(),
});

// Tam senkron: gönderilen indicators listesi "doğru" kabul edilir —
// id'si olanlar güncellenir, id'si olmayanlar oluşturulur, listede
// bulunmayan mevcut göstergeler silinir. Böylece admin UI'da tek bir
// "Kaydet" ile hem yetkinlik hem göstergeleri güncellenebilir.
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
    const d = parsed.data;

    if (d.indicators) {
      const existing = await prisma.behaviorIndicator.findMany({ where: { competencyId: id } });
      const keepIds = new Set(d.indicators.filter((i) => i.id).map((i) => i.id));
      const toDelete = existing.filter((e: { id: string }) => !keepIds.has(e.id)).map((e: { id: string }) => e.id);
      if (toDelete.length) await prisma.behaviorIndicator.deleteMany({ where: { id: { in: toDelete } } });
      for (let i = 0; i < d.indicators.length; i++) {
        const ind = d.indicators[i];
        if (ind.id) {
          await prisma.behaviorIndicator.update({ where: { id: ind.id }, data: { text: ind.text, order: ind.order ?? i, active: ind.active ?? true } });
        } else {
          await prisma.behaviorIndicator.create({ data: { competencyId: id, text: ind.text, order: ind.order ?? i } });
        }
      }
    }

    const competency = await prisma.competency.update({
      where: { id },
      data: {
        name: d.name,
        category: d.category,
        order: d.order,
        active: d.active,
      },
      include: { indicators: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ competency });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.competency.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
