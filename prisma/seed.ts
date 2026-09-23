import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "zihinacan@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const services = [
    { title: "Liderlik & Yönetim", body: "Stratejik Liderlik, Delegasyon, Karar Verme", order: 1 },
    { title: "Koçluk", body: "Yönetici koçluğu, ekip koçluğu, kariyer koçluğu", order: 2 },
    { title: "Satış & Pazarlama", body: "İleri Satış Teknikleri, Müzakere Becerileri, Müşteri Deneyimi", order: 3 },
    { title: "İK & Organizasyon", body: "Mülakat Teknikleri, Performans Yönetimi, Yetenek Yönetimi", order: 4 },
    { title: "Kişisel Gelişim & Yapay Zeka", body: "Zaman Yönetimi, Duygusal Zeka, YZ okuryazarlığı", order: 5 },
  ];

  for (const s of services) {
    const existing = await prisma.contentItem.findFirst({ where: { type: "SERVICE", title: s.title } });
    if (!existing) {
      await prisma.contentItem.create({ data: { type: "SERVICE", title: s.title, body: s.body, order: s.order } });
    }
  }

  console.log("Seed complete. Admin login:", email);
}

main().finally(() => prisma.$disconnect());
