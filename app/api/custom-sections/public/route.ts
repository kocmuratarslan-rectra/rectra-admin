import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// Canlı site bunu çeker: sadece visible:true olan özel bölümler, sırasına göre.
export async function GET() {
  const sections = await prisma.customSection.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ sections }, { headers: corsHeaders() });
}
