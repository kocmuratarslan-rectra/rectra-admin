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

// Canlı sitedeki "Eğitim İhtiyaç Analizi" formu bunu çeker: sadece aktif
// yetkinlikler + aktif göstergeler, sıralarına göre.
export async function GET() {
  const competencies = await prisma.competency.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: { indicators: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ competencies }, { headers: corsHeaders() });
}
