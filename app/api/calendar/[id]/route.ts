import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["AI", "LIDER", "SOFT", "IK", "ALIM", "KOC"] as const;

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  category: z.enum(CATEGORIES).optional(),
  date: z.string().min(1).optional(),
  duration: z.string().min(1).max(50).optional(),
  location: z.string().min(1).max(150).optional(),
  certBadge: z.string().max(50).optional(),
  hot: z.boolean().optional(),
  seatText: z.string().max(80).optional(),
  ctaUrl: z.string().max(300).optional(),
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
    const { date, ...rest } = parsed.data;
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: { ...rest, ...(date ? { date: new Date(date + "T00:00:00.000Z") } : {}) },
    });
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
