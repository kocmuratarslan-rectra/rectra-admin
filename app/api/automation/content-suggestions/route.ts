import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Bu endpoint iki farklı çağıranı destekler:
// 1) Zamanlanmış pazar analizi görevi (oturumsuz) — x-automation-key başlığı
//    process.env.AUTOMATION_SECRET ile eşleşmeli. Eşleşmezse ya da secret
//    hiç tanımlı değilse istek reddedilir (asla "secret yoksa serbest" değil).
// 2) Admin paneli (oturumlu) — sadece GET ile bekleyen önerileri listeler.

const suggestionSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(50000),
  category: z.string().max(100).optional().nullable(),
  evidence: z.record(z.any()),
  // Canva ile üretilip base64 data URI'a çevrilmiş kapak görseli (opsiyonel —
  // görsel üretimi başarısız olursa öneri yine de görselsiz oluşturulabilir).
  coverImage: z.string().max(5_000_000).optional().nullable(),
});

function isAutomationRequest(req: Request) {
  const key = req.headers.get("x-automation-key");
  const secret = process.env.AUTOMATION_SECRET;
  return Boolean(secret) && key === secret;
}

export async function POST(req: Request) {
  if (!isAutomationRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = suggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    const suggestion = await prisma.contentSuggestion.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug || null,
        excerpt: parsed.data.excerpt,
        content: parsed.data.content,
        category: parsed.data.category,
        evidence: parsed.data.evidence,
        coverImage: parsed.data.coverImage || null,
      },
    });
    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const suggestions = await prisma.contentSuggestion.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ suggestions });
}
