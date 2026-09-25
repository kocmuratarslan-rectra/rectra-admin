import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";

// Pazar analizi otomasyonunun ürettiği kapak görsellerini kalıcı, gerçek bir
// HTTPS URL'ye (Vercel Blob) yükler. Görseli veritabanına base64 olarak
// gömmek yerine gerçek bir URL kullanmamızın sebebi: LinkedIn/Facebook/Google
// gibi dış paylaşım kırıcıları (crawler) og:image için data: URI'yi ÇEKEMEZ,
// sadece http(s) URL kabul eder. Aynı x-automation-key ile korunur.

const bodySchema = z.object({
  imageBase64: z.string().min(1).max(20_000_000),
  filename: z.string().max(200).optional(),
  contentType: z.string().max(100).optional(),
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
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }

    // "data:image/jpeg;base64,...." önekiyle gelirse temizle.
    const raw = parsed.data.imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(raw, "base64");
    if (buffer.length === 0) {
      return NextResponse.json({ error: "empty_image" }, { status: 400 });
    }

    const filename = parsed.data.filename || `blog-cover-${Date.now()}.jpg`;
    const blob = await put(`market-intel/${filename}`, buffer, {
      access: "public",
      contentType: parsed.data.contentType || "image/jpeg",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (e) {
    console.error("upload-image error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
