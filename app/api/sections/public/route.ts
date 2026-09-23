import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=60",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Canlı site (rectra-site) bu uçtan sadece YAYINDA olan bölümlerin
// key + fields bilgisini çeker ve data-cms etiketli elemanlara uygular.
// Oturum gerektirmez, herkese açıktır (sadece okuma).
export async function GET() {
  const sections = await prisma.siteSection.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
    select: { key: true, fields: true, order: true },
  });
  return NextResponse.json({ sections }, { headers: corsHeaders() });
}
