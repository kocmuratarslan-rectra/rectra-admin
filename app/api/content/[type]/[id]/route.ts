import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  subtitle: z.string().max(300).optional().nullable(),
  body: z.string().max(10000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
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
    const item = await prisma.contentItem.update({
      where: { id },
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        body: parsed.data.body,
        category: parsed.data.category,
        order: parsed.data.order,
        published: parsed.data.published,
      },
    });
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
    await prisma.contentItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
