import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["AI", "LIDER", "SOFT", "IK", "ALIM", "KOC"] as const;

const createSchema = z.object({
  title: z.string().min(1).max(300),
  category: z.enum(CATEGORIES),
  duration: z.string().min(1).max(50),
  format: z.string().min(1).max(100),
  level: z.string().min(1).max(100),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=30",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const items = await prisma.catalogItem.findMany({
    where: session ? {} : { published: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ items }, { headers: session ? {} : corsHeaders() });
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
    const item = await prisma.catalogItem.create({
      data: {
        title: d.title,
        category: d.category,
        duration: d.duration,
        format: d.format,
        level: d.level,
        order: d.order ?? 0,
        published: d.published ?? true,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
