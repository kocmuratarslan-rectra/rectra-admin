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

  // ==== Site Bölümleri (Süper Admin · Site Kontrolü) ====
  // key + fields isimleri, canlı sitedeki (rectra-site/index.html) data-cms
  // etiketleriyle BİREBİR eşleşir (ör. key="hero", field="headline" →
  // data-cms="hero.headline"). Değerler canlı sitedeki GERÇEK mevcut
  // metinlerdir — admin panelinde bir şey değiştirmediğin sürece site aynı
  // kalır. "fields" boş olan bölümlerde (method, stats) sadece
  // gizle/göster çalışır; tekrarlanan liste içerikleri (kartlar, SSS
  // maddeleri, referanslar vb.) tasarımı bozma riski nedeniyle Faz 1
  // kapsamı dışında tutulmuştur — sadece başlık/alt metin gibi tekil
  // alanlar düzenlenebilir.
  const sections: {
    key: string; icon: string; name: string; color: string; order: number; visible: boolean;
    fields: Record<string, string>;
  }[] = [
    { key: "hero", icon: "✨", name: "Hero — 3D Banner", color: "#0B1026", order: 1, visible: true, fields: {
      eyebrow: "Rectra Business School · Danışmanlık · İşe Alım · Koçluk",
      slogan: "Discover and develop potential for the future.",
      headline: '<span class="h-amber">İnsan</span> potansiyeli,<br><span class="h-teal">yapay zekâ</span> hızında.',
      subtext: "Eğitim öncesi dijital platform, sınıfta uygulamalı atölye, sonrasında iş simülasyonu ve ölçüm. Rectra Business School'da gelişim bir gün değil, bir yolculuktur.",
      cta1: '60 Saniyede Teklif Al <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      cta2: "Eğitim Takvimi & Katalog",
      catalog_btn: '<span class="tag">YENİ</span> 120+ eğitimlik katalogda ara, seç, kendi gelişim programını tasarla →',
    }},
    { key: "trust", icon: "🏛", name: "Güven Şeridi (Logo Duvarı)", color: "#1a2145", order: 2, visible: true, fields: {
      label: "Türkiye'nin önde gelen kurumları RECTRA ile gelişiyor",
    }},
    { key: "method", icon: "🧭", name: "Metod Şeridi (5 Adım)", color: "#D98A0B", order: 3, visible: true, fields: {} },
    { key: "services", icon: "🎓", name: "Business School Kartları", color: "#0FA99A", order: 4, visible: true, fields: {
      title: "Beş gelişim fakültesi,<br>tek okul, tek hedef",
      subtitle: "Her fakülteye tıklayın: önce o alanı nasıl tasarladığımızı görün, sonra kataloğu keşfedip kendi programınızı oluşturun.",
    }},
    { key: "platforms", icon: "🖥", name: "Dijital Platformlar", color: "#111838", order: 5, visible: true, fields: {
      title: "Eğitim bir gün sürer.<br>Platform her gün yanınızda.",
      subtitle: "Dokümanlar, testler, anketler, envanterler, simülasyonlar ve ROI raporu — hepsi tek panelde.",
    }},
    { key: "calendar", icon: "📅", name: "Açık Eğitim Takvimi", color: "#6366F1", order: 6, visible: true, fields: {
      title: "Yaklaşan açık eğitimler",
      subtitle: "Takvimden yaprağınızı koparın: bireysel katılıma açık, sertifikalı programlarda kontenjanlar sınırlı.",
    }},
    { key: "trainers", icon: "🎖", name: "Eğitmen Standardı", color: "#B10D31", order: 7, visible: true, fields: {
      title: "Sahneye herkes çıkamaz.",
      subtitle: "Rectra Business School'da eğitmenlik bir unvan değil, kazanılan bir standarttır.",
    }},
    { key: "videos", icon: "📺", name: "Video Vitrini", color: "#54318f", order: 8, visible: true, fields: {
      title: "Eğitim salonundan,<br>gerçek anlar",
      subtitle: "Slaytları değil, dönüşümü izleyin. Programlarımızdan kısa kesitler.",
    }},
    { key: "stats", icon: "🔢", name: "Sayaç Şeridi", color: "#131B44", order: 9, visible: true, fields: {} },
    { key: "testimonials", icon: "💬", name: "Referanslar", color: "#F5A623", order: 10, visible: true, fields: {
      title: "Sonuç konuşsun",
    }},
    { key: "faq", icon: "❓", name: "SSS", color: "#5B6178", order: 11, visible: true, fields: {
      title: "Merak ettikleriniz",
    }},
    { key: "teklif", icon: "📨", name: "Teklif Formu → CRM", color: "#0E5F56", order: 12, visible: true, fields: {
      title: "60 saniyenizi ayırın,<br>24 saatte teklifiniz hazır.",
      subtitle: "Formu doldurun; talebiniz anında satış ekibimizin CRM panelinde oluşsun, size özel çözümle dönelim.",
    }},
    { key: "footer", icon: "⬛", name: "Footer", color: "#070B1C", order: 13, visible: true, fields: {
      desc: "Rectra Business School: insan potansiyelini yapay zekâ çağının hızıyla buluşturan eğitim, danışmanlık, işe alım ve koçluk ortağınız.",
    }},
  ];

  // Tek seferlik temizlik: Site Kontrolü özelliği daha önce hiç canlıya
  // alınmadığı (dolayısıyla bu key'lerde admin tarafından girilmiş GERÇEK
  // veri olmadığı) için, ilk sürümde kullanılan eski key isimleri
  // (logos/faculties/contact → trust/services/teklif olarak yeniden
  // adlandırıldı) burada güvenle temizlenir. Bu satır sadece bu üç eski
  // key için çalışır; gelecekte gerçek kullanıcı verisi olan hiçbir kayıt
  // bu şekilde silinmeyecektir (bkz. proje politikası: additive-only).
  await prisma.siteSection.deleteMany({ where: { key: { in: ["logos", "faculties", "contact"] } } });

  for (const s of sections) {
    await prisma.siteSection.upsert({
      where: { key: s.key },
      update: {}, // mevcut bölüm varsa admin panelinde yapılan değişikliği ezme
      create: {
        key: s.key,
        icon: s.icon,
        name: s.name,
        color: s.color,
        order: s.order,
        visible: s.visible,
        fields: s.fields,
      },
    });
  }

  console.log("Seed complete. Admin login:", email);
}

main().finally(() => prisma.$disconnect());
