import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
});

// Admin kendi şifresini burada değiştirir. Mevcut şifre doğrulanmadan
// değişiklik yapılmaz. Bu sayede şifre artık Vercel ortam değişkenlerine
// veya deploy'lara bağlı değildir — admin panelden istediği zaman
// güvenle değiştirebilir.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "wrong_current_password" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.adminUser.update({ where: { email: session.user.email }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
