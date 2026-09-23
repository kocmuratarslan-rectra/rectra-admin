import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  key: z.string().min(1).max(100),
  icon: z.string().min(1).max(10),
  name: z.string().min(1).max(200),
  color: z.string().min(1).max(20),
  fields: z.record(z.string(), z.string()),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

// Admin panelinde her zaman TÜM bölümler (gizli olanlar dahil) listelenir.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sections = await prisma.siteSection.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ sections });
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
    const existing = await prisma.siteSection.findUnique({ where: { key: parsed.data.key } });
    if (existing) return NextResponse.json({ error: "key_exists" }, { status: 409 });
    const maxOrder = await prisma.siteSection.aggregate({ _max: { order: true } });
    const section = await prisma.siteSection.create({
      data: {
        key: parsed.data.key,
        icon: parsed.data.icon,
        name: parsed.data.name,
        color: parsed.data.color,
        fields: parsed.data.fields,
        order: parsed.data.order ?? (maxOrder._max.order ?? 0) + 1,
        visible: parsed.data.visible ?? true,
      },
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
