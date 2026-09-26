import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CAT_LABELS: Record<string, string> = {
  AI: "Yapay Zekâ Fakültesi",
  LIDER: "Liderlik Fakültesi",
  SOFT: "Soft Skills Fakültesi",
  IK: "İK Fakültesi & Danışmanlık",
  ALIM: "İşe Alım & Headhunting",
  KOC: "Koçluk Fakültesi & Akademi",
};

const responseSchema = z.object({
  competencyId: z.string(),
  indicatorId: z.string(),
  current: z.number().int().min(1).max(5),
  target: z.number().int().min(1).max(5),
});

const submitSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(50).optional().nullable(),
  responses: z.array(responseSchema).min(1).max(200),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Admin: gelen ihtiyaç analizi başvurularını listele.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const analyses = await prisma.needsAnalysis.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ analyses });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400, headers: corsHeaders() });
    }
    const d = parsed.data;

    // İlgili yetkinlik/gösterge metinlerini çek (rapor + AI özeti için).
    const competencyIds = [...new Set(d.responses.map((r) => r.competencyId))];
    const competencies: { id: string; name: string; category: string }[] = await prisma.competency.findMany({
      where: { id: { in: competencyIds } },
      include: { indicators: true },
    });
    const compById: Record<string, { id: string; name: string; category: string }> = {};
    for (const c of competencies) compById[c.id] = c;

    // Yetkinlik bazında ortalama açık (hedef - mevcut) hesapla.
    const gapByCompetency = new Map<string, { name: string; category: string; totalGap: number; count: number }>();
    for (const r of d.responses) {
      const comp = compById[r.competencyId];
      if (!comp) continue;
      const gap = r.target - r.current;
      const entry = gapByCompetency.get(r.competencyId) || { name: comp.name, category: comp.category, totalGap: 0, count: 0 };
      entry.totalGap += gap;
      entry.count += 1;
      gapByCompetency.set(r.competencyId, entry);
    }
    const ranked = [...gapByCompetency.entries()]
      .map(([id, v]) => ({ id, name: v.name, category: v.category, avgGap: v.count ? v.totalGap / v.count : 0 }))
      .sort((a, b) => b.avgGap - a.avgGap);

    const topGaps = ranked.filter((r) => r.avgGap > 0).slice(0, 3);
    const recommended = (topGaps.length ? topGaps : ranked.slice(0, 3)).map((g) => ({
      category: g.category,
      categoryLabel: CAT_LABELS[g.category] || g.category,
      competency: g.name,
    }));

    // Deterministik (her zaman çalışan) özet metni — AI'ya bağımlı değil.
    let summary: string;
    if (topGaps.length) {
      const list = topGaps.map((g) => `${g.name} (ortalama açık: ${g.avgGap.toFixed(1)} puan)`).join(", ");
      summary = `${d.companyName} için en büyük gelişim açıkları şu alanlarda görünüyor: ${list}. Bu alanlara odaklanan bir gelişim programı önerilir.`;
    } else {
      summary = `${d.companyName} için girilen yanıtlara göre belirgin bir açık görünmüyor — ekibiniz değerlendirilen yetkinliklerde hedeflenen seviyeye yakın. Yine de sürekli gelişim için önerilen programlara göz atabilirsiniz.`;
    }

    // Opsiyonel: ANTHROPIC_API_KEY tanımlıysa metni daha akıcı bir dille
    // yeniden yazdır. Başarısız olursa (anahtar yok/hata) yukarıdaki
    // deterministik özet aynen kullanılır — özellik hiçbir zaman kırılmaz.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            system: "Sen Rectra Business School için kurumsal eğitim ihtiyaç analizi raporları yazan bir danışmansın. Sana verilen ham veriyi 3-4 cümlelik, profesyonel, sıcak ve somut bir Türkçe yönetici özetine çevir. Rakamları aynen koru, uydurma bilgi ekleme.",
            messages: [{ role: "user", content: `Firma: ${d.companyName}\nHam özet: ${summary}\nEn büyük açıklar: ${topGaps.map((g) => `${g.name}: ${g.avgGap.toFixed(1)} puan`).join("; ")}` }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = (data.content || []).map((b: any) => b.text || "").join("").trim();
          if (text) summary = text;
        }
      } catch {
        // sessizce deterministik özete geri dön
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name: d.contactName,
        email: d.contactEmail,
        phone: d.contactPhone || null,
        message: `[İhtiyaç Analizi] ${d.companyName} — ${summary}`,
        source: "İhtiyaç Analizi",
      },
    });

    const analysis = await prisma.needsAnalysis.create({
      data: {
        companyName: d.companyName,
        contactName: d.contactName,
        contactEmail: d.contactEmail,
        contactPhone: d.contactPhone || null,
        responses: d.responses as any,
        summary,
        recommended: recommended as any,
        leadId: lead.id,
      },
    });

    return NextResponse.json({ id: analysis.id, summary, recommended }, { status: 201, headers: corsHeaders() });
  } catch (e) {
    console.error("needs-analysis submit error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: corsHeaders() });
  }
}
