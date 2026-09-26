import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATS = ["AI", "LIDER", "SOFT", "IK", "ALIM", "KOC"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(CATS),
  order: z.number().int().optional(),
  indicators: z.array(z.string().min(1).max(400)).max(20).optional(),
});

// Admin: taksonomiyi (yetkinlik + davranış göstergeleri) listele.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const competencies = await prisma.competency.findMany({
    orderBy: { order: "asc" },
    include: { indicators: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ competencies });
}

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
    const maxOrder = await prisma.competency.aggregate({ _max: { order: true } });
    const competency = await prisma.competency.create({
      data: {
        name: d.name,
        category: d.category,
        order: d.order ?? (maxOrder._max.order ?? 0) + 1,
        indicators: { create: (d.indicators || []).map((text, i) => ({ text, order: i + 1 })) },
      },
      include: { indicators: true },
    });
    return NextResponse.json({ competency }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
