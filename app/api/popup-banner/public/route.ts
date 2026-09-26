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

// Canlı site bunu çeker: sadece aktif tek banner döner, yoksa banner:null.
export async function GET() {
  const banner = await prisma.popupBanner.findFirst({ where: { active: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ banner: banner || null }, { headers: corsHeaders() });
}
