import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["AI", "LIDER", "SOFT", "IK", "ALIM", "KOC"] as const;

const createSchema = z.object({
  title: z.string().min(1).max(300),
  category: z.enum(CATEGORIES),
  date: z.string().min(1), // "2026-07-15"
  duration: z.string().min(1).max(50),
  location: z.string().min(1).max(150),
  certBadge: z.string().max(50).optional(),
  hot: z.boolean().optional(),
  seatText: z.string().max(80).optional(),
  ctaUrl: z.string().max(300).optional(),
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

// Oturumsuz istekler (canlı site dahil) sadece published:true kayıtları,
// tarihe göre artan sırada görür. CORS açık.
export async function GET() {
  const session = await getServerSession(authOptions);
  const events = await prisma.calendarEvent.findMany({
    where: session ? {} : { published: true },
    orderBy: [{ date: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ events }, { headers: session ? {} : corsHeaders() });
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
    const event = await prisma.calendarEvent.create({
      data: {
        title: d.title,
        category: d.category,
        date: new Date(d.date + "T00:00:00.000Z"),
        duration: d.duration,
        location: d.location,
        certBadge: d.certBadge ?? "Sertifikalı",
        hot: d.hot ?? false,
        seatText: d.seatText ?? "Kontenjan açık",
        ctaUrl: d.ctaUrl ?? "#teklif",
        order: d.order ?? 0,
        published: d.published ?? true,
      },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
