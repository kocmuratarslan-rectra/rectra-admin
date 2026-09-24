import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["AI", "LIDER", "SOFT", "IK", "ALIM", "KOC"] as const;

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  category: z.enum(CATEGORIES).optional(),
  duration: z.string().min(1).max(50).optional(),
  format: z.string().min(1).max(100).optional(),
  level: z.string().min(1).max(100).optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
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
    const item = await prisma.catalogItem.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.catalogItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
