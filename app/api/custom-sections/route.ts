import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(10000),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sections = await prisma.customSection.findMany({ orderBy: { order: "asc" } });
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
    const d = parsed.data;
    const maxOrder = await prisma.customSection.aggregate({ _max: { order: true } });
    const section = await prisma.customSection.create({
      data: {
        title: d.title,
        body: d.body,
        icon: d.icon ?? "✨",
        color: d.color ?? "#0FA99A",
        order: d.order ?? (maxOrder._max.order ?? 0) + 1,
        visible: d.visible ?? true,
      },
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
