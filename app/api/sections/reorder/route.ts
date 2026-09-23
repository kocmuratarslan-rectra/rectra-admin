import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  ids: z.array(z.string()).min(1),
});

// ids dizisindeki sıraya göre order alanını 1..n olarak yeniden yazar.
// Not: Bu, admin panelindeki "Site Ağacı" sırasını değiştirir. Canlı site
// (Faz 1'de) bölümleri hâlâ kendi statik HTML sırasıyla gösterir — DOM'da
// fiziksel yeniden sıralama tasarım/animasyon riskleri nedeniyle Faz 2'ye
// bırakıldı (bkz. README).
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    await prisma.$transaction(
      parsed.data.ids.map((id, i) =>
        prisma.siteSection.update({ where: { id }, data: { order: i + 1 } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
