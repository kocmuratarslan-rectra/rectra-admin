import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

// Admin panelinden (oturum açmış kullanıcı) genel amaçlı görsel yükleme
// (ör. Banner Pop Up görseli). Vercel Blob'a yükler, kalıcı https URL döner.
// Pazar analizi otomasyonunun kendi x-automation-key korumalı uç noktası
// (app/api/automation/upload-image) bundan ayrı ve dokunulmadı.

const bodySchema = z.object({
  imageBase64: z.string().min(1).max(20_000_000),
  filename: z.string().max(200).optional(),
  contentType: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }

    const raw = parsed.data.imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(raw, "base64");
    if (buffer.length === 0) {
      return NextResponse.json({ error: "empty_image" }, { status: 400 });
    }

    const filename = parsed.data.filename || `admin-upload-${Date.now()}.jpg`;
    const blob = await put(`admin-uploads/${filename}`, buffer, {
      access: "public",
      contentType: parsed.data.contentType || "image/jpeg",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (e) {
    console.error("admin upload-image error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
