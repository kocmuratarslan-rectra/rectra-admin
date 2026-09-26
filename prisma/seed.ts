import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // NOT: Admin kullanıcı SADECE hiç yoksa oluşturulur. Bir kez oluşturulduktan
  // sonra seed script'i şifreye ASLA dokunmaz — admin panelinden (Ayarlar)
  // şifreni değiştirsen, bir sonraki deploy onu geri almaz. (Önceki sürümde
  // `upsert` her deploy'da passwordHash'i sabit değere sıfırlıyordu; bu artık
  // tamamen kaldırıldı.)
  const email = "zihinacan@gmail.com";
  const password = "Rectra2026#Yonetim!";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.adminUser.create({ data: { email, passwordHash } });
  }

  // Tek seferlik: admin giriş e-postasını kurumsal adrese taşı. Şifreye
  // dokunulmaz, sadece giriş e-postası değişir. Bir kez çalıştıktan sonra
  // eski e-posta artık bulunamayacağı için tekrar çalışmaz (idempotent).
  const NEW_ADMIN_EMAIL = "info@rectra.com.tr";
  const oldAdminRow = await prisma.adminUser.findUnique({ where: { email: "zihinacan@gmail.com" } });
  const newAdminRow = await prisma.adminUser.findUnique({ where: { email: NEW_ADMIN_EMAIL } });
  if (oldAdminRow && !newAdminRow) {
    await prisma.adminUser.update({ where: { id: oldAdminRow.id }, data: { email: NEW_ADMIN_EMAIL } });
  }

  const services = [
    { title: "Liderlik & Yönetim", body: "Stratejik Liderlik, Delegasyon, Karar Verme", order: 1 },
    { title: "Koçluk", body: "Yönetici koçluğu, ekip koçluğu, kariyer koçluğu", order: 2 },
    { title: "Satış & Pazarlama", body: "İleri Satış Teknikleri, Müzakere Becerileri, Müşteri Deneyimi", order: 3 },
    { title: "İK & Organizasyon", body: "Mülakat Teknikleri, Performans Yönetimi, Yetenek Yönetimi", order: 4 },
    { title: "Kişisel Gelişim & Yapay Zeka", body: "Zaman Yönetimi, Duygusal Zeka, YZ okuryazarlığı", order: 5 },
  ];

  // NOT: Aşağıdaki dört blok (Hizmetler/SSS/Referanslar/Takvim/Katalog) SADECE
  // ilgili tablo TAMAMEN BOŞSA (hiç seed edilmemiş) veri ekler. Bir kez
  // seed edildikten sonra admin panelinde yapılan hiçbir ekleme/düzenleme/
  // silme, sonraki bir deploy tarafından ASLA geri alınmaz veya
  // çoğaltılmaz. (Önceki sürümde tek tek `title`/`title+date` eşleşmesine
  // bakılıyordu; bu, admin bir kaydın TARİHİNİ değiştirdiğinde eşleşme
  // bulunamadığı için orijinal kaydın yinelenerek geri gelmesine — takvimde
  // "silinemiyor/revize edilemiyor" sorununa — yol açıyordu.)
  const serviceCount = await prisma.contentItem.count({ where: { type: "SERVICE" } });
  if (serviceCount === 0) {
    for (const s of services) {
      await prisma.contentItem.create({ data: { type: "SERVICE", title: s.title, body: s.body, order: s.order } });
    }
  }

  // ==== SSS (canlı sitedeki GERÇEK mevcut sorular/cevaplar) ====
  // Canlı site artık bu kayıtları /api/content/FAQ'dan çeker (bkz. index.html).
  // Admin panelinde ekleme/düzenleme/silme yapılana kadar site aynı kalır.
  const faqs = [
    { title: "Kurumsal eğitim fiyatları nasıl belirlenir?", body: "Fiyat; katılımcı sayısı, program süresi, format (yüz yüze / online / hibrit) ve içerik özelleştirme derinliğine göre belirlenir. İhtiyaç analizi görüşmesi ücretsizdir ve teklifinizi 24 saat içinde iletiriz.", order: 1 },
    { title: "Katalogdan seçtiğim eğitimlerle kendi programımı oluşturabilir miyim?", body: "Evet — bu tam olarak katalog deneyimimizin amacı. Katalogda arama yapın, \"Programa Ekle\" ile başlıkları seçin ve tek tıkla talep gönderin. Uzmanlarımız seçiminizi kuruma özel bir gelişim yolculuğuna dönüştürüp 24 saat içinde teklifle döner.", order: 2 },
    { title: "Dijital eğitim ve iş simülasyon platformlarına kimler erişebilir?", body: "Rectra Business School katılımcıları üye girişiyle erişir. Eğitim öncesi mikro dersler ve ön testler, eğitim sonrası simülasyon senaryoları ve gelişim raporları üyelik panelinizde toplanır.", order: 3 },
    { title: "Yapay zekâ eğitimi hangi departmanlara verilmeli?", body: "Önerimiz katmanlı yaklaşımdır: tüm çalışanlara temel yapay zekâ okuryazarlığı, yöneticilere strateji ve etik boyutu, İK/pazarlama/operasyon gibi fonksiyonlara ise uygulamalı atölyeler. Kuruma özel yol haritasını birlikte çıkarırız.", order: 4 },
    { title: "Eğitim sonuçlarını nasıl ölçüyorsunuz?", body: "Kirkpatrick modeliyle dört seviyede: memnuniyet, öğrenme (ön/son test), davranış değişimi (30-60-90 gün takibi) ve iş sonuçlarına etki. Yönetime raporlanabilir çıktılar sunarız.", order: 5 },
    { title: "Azerbaycan'da hizmet veriyor musunuz?", body: "Evet. Bakü başta olmak üzere Azerbaycan genelinde yüz yüze ve online programlar düzenliyoruz. Azerice içerik desteği sağlanabilir.", order: 6 },
  ];
  const faqCount = await prisma.contentItem.count({ where: { type: "FAQ" } });
  if (faqCount === 0) {
    for (const f of faqs) {
      await prisma.contentItem.create({ data: { type: "FAQ", title: f.title, body: f.body, order: f.order } });
    }
  }

  // ==== Referanslar (canlı sitedeki GERÇEK mevcut 3 referans) ====
  // title = kişi adı, subtitle = unvan/kurum, body = alıntı metni.
  // Canlı site bunları /api/content/TESTIMONIAL'dan çekip dönüşümlü gösterir.
  const testimonials = [
    { title: "Elif K.", subtitle: "İK Direktörü, Perakende — 4.200 çalışan", body: "RECTRA'nın liderlik gelişim programı sonrası ilk kademe yönetici devir hızımız %30 azaldı. Eğitim değil, dönüşüm aldık.", order: 1 },
    { title: "Murat T.", subtitle: "Genel Müdür, Üretim — Bursa", body: "Yapay zekâ atölyesinden bir hafta sonra ekipler kendi otomasyonlarını kurmaya başladı. Yatırımın geri dönüşünü ilk ayda gördük.", order: 2 },
    { title: "Ayşən M.", subtitle: "HR Business Partner — Bakü, Azerbaycan", body: "Eğitim öncesi dijital hazırlık ve sonrasındaki simülasyon takibi, klasik eğitim firmalarında görmediğimiz bir deneyimdi.", order: 3 },
  ];
  const testimonialCount = await prisma.contentItem.count({ where: { type: "TESTIMONIAL" } });
  if (testimonialCount === 0) {
    for (const t of testimonials) {
      await prisma.contentItem.create({ data: { type: "TESTIMONIAL", title: t.title, subtitle: t.subtitle, body: t.body, order: t.order } });
    }
  }

  // ==== Dijital Platformlar (canlı sitedeki GERÇEK mevcut 2 platform kartı) ====
  // title = platform adı, subtitle = küçük etiket (plat-tag), body = açıklama.
  // category = kart teması ("tealb" / "ambb" — ilk iki kayıt için); sonradan
  // eklenen platformlar için boş bırakılabilir, sitede genel kart stiliyle gösterilir.
  const platforms = [
    { title: "Rectra Dijital Eğitim Platformu", subtitle: "EĞİTİM ÖNCESİ + SONRASI", body: "Katılımcının tüm eğitim materyali tek yerde. Sınıfa hazır gelir, sonrasında pekiştirir.", category: "tealb", order: 1 },
    { title: "Rectra İş Simülasyon Platformu", subtitle: "EĞİTİM SONRASI ÖLÇÜM", body: "Öğrenilen davranış, güvenli senaryolarda denenir; değişim 30-60-90 günde ölçülür.", category: "ambb", order: 2 },
  ];
  const platformCount = await prisma.contentItem.count({ where: { type: "PLATFORM" } });
  if (platformCount === 0) {
    for (const p of platforms) {
      await prisma.contentItem.create({ data: { type: "PLATFORM", title: p.title, subtitle: p.subtitle, body: p.body, category: p.category, order: p.order } });
    }
  }

  // ==== Eğitmen Kadromuz (canlı sitedeki GERÇEK mevcut 8 eğitmen) ====
  // title = ad, subtitle = unvan, category = sertifika/etiket satırı.
  // Avatar rengi ve baş harfler canlı sitede addan otomatik türetilir.
  const instructors = [
    { title: "Murat K.", subtitle: "Kurucu · Baş Eğitmen & Executive Coach", category: "ICF PCC · LİDERLİK · AI", order: 1 },
    { title: "Selin D.", subtitle: "Kıdemli Eğitmen · İK & Yetenek", category: "SHRM-SCP · ASSESSMENT", order: 2 },
    { title: "Emre A.", subtitle: "Yapay Zekâ Programları Lideri", category: "ÜRETKEN AI · PROMPT", order: 3 },
    { title: "Aygün N.", subtitle: "Kıdemli Koç · Azerbaycan", category: "ICF ACC · TAKIM KOÇLUĞU", order: 4 },
    { title: "Deniz Y.", subtitle: "Satış & Müşteri Deneyimi", category: "15 YIL SAHA LİDERLİĞİ", order: 5 },
    { title: "Pelin S.", subtitle: "Soft Skills · İletişim", category: "DOKTORA · KOLB UYGULAYICI", order: 6 },
    { title: "Kaan T.", subtitle: "Assessment & Envanter", category: "AC LİSANSI · PSİKOMETRİ", order: 7 },
    { title: "Leyla H.", subtitle: "İş Simülasyonu Tasarımı", category: "SENARYO · ÖLÇÜM", order: 8 },
  ];
  const instructorCount = await prisma.contentItem.count({ where: { type: "INSTRUCTOR" } });
  if (instructorCount === 0) {
    for (const ins of instructors) {
      await prisma.contentItem.create({ data: { type: "INSTRUCTOR", title: ins.title, subtitle: ins.subtitle, category: ins.category, order: ins.order } });
    }
  }

  // ==== Video Vitrini / Keep In Mind (canlı sitedeki GERÇEK mevcut 17 video) ====
  // title = video başlığı, subtitle = küçük etiket/kategori, body = YouTube
  // video ID'si (tam link de girilebilir — canlı site ID'yi otomatik ayıklar).
  const videos = [
    { title: "İK Profesyonelleri İçin Koçvari Yaklaşım Eğitimi", subtitle: "ETİ Akademi", body: "oK2Ui_Y1RpI", order: 1 },
    { title: "Yeni Nesil Liderlik Programı", subtitle: "Engin Grup", body: "oHUkjH8zMLQ", order: 2 },
    { title: "İK Stüdyo", subtitle: "Söyleşi", body: "rHnaHubxCBo", order: 3 },
    { title: "Expat Kültürü ve İş İngilizcesi Öğrenme Yöntemleri", subtitle: "Eğitim", body: "ZzD1nVIZ-7Q", order: 4 },
    { title: "Mentorluk Yaklaşımının Dünü, Bugünü ve Yarını", subtitle: "Eğitim", body: "v11br40P9iI", order: 5 },
    { title: "Dijital Pazarlama ve Influencer Dönemi — Part 1", subtitle: "Eğitim", body: "4iCEvmzBhJI", order: 6 },
    { title: "Dijital Pazarlama ve Influencer Dönemi — Part 2", subtitle: "Eğitim", body: "3ji_m9tqv5A", order: 7 },
    { title: "Benden Lider Olur Mu? — Part 1", subtitle: "Liderlik", body: "9b5AJSvLXpY", order: 8 },
    { title: "Benden Lider Olur Mu? — Part 2", subtitle: "Liderlik", body: "R8bn5cs9Nyc", order: 9 },
    { title: "Liderler İçin Fark Yaratan Online Toplantı Yönetimi — Part 1", subtitle: "Liderlik", body: "19PJCur1XPk", order: 10 },
    { title: "Liderler İçin Fark Yaratan Online Toplantı Yönetimi — Part 2", subtitle: "Liderlik", body: "6NjxJTRp9VE", order: 11 },
    { title: "Hedef Belirleme", subtitle: "Orta Anadolu İhracat Birliği", body: "4yXlIWlnZJo", order: 12 },
    { title: "İlk Fırsat: \"Gençlere Umut Verin\" Kampanya Çağrımız", subtitle: "Sosyal Sorumluluk", body: "wvGE_xMJvt4", order: 13 },
    { title: "Çetin Zamanlarda İK'nın Yol Haritası — Part 1", subtitle: "İK", body: "6b09bagDXDs", order: 14 },
    { title: "Çetin Zamanlarda İK'nın Yol Haritası — Part 2", subtitle: "İK", body: "Ab-ctdkc8rM", order: 15 },
    { title: "Çetin Zamanlarda İK'nın Yol Haritası — Part 3", subtitle: "İK", body: "SS7-FYI3raw", order: 16 },
    { title: "Hedefleri Belirlemek Üzere Yaşanmış Bir Hikaye — Jim Rohn", subtitle: "İlham", body: "ZJHaiYmEVkA", order: 17 },
  ];
  const videoCount = await prisma.contentItem.count({ where: { type: "VIDEO" } });
  if (videoCount === 0) {
    for (const v of videos) {
      await prisma.contentItem.create({ data: { type: "VIDEO", title: v.title, subtitle: v.subtitle, body: v.body, order: v.order } });
    }
  }

  // ==== Açık Eğitim Takvimi (canlı sitedeki GERÇEK mevcut 6 etkinlik) ====
  // Canlı site bunları /api/calendar/public'ten çekip #takvim bölümünde
  // tarihe göre render eder (geri sayım, koltuk durumu dahil).
  const calendarEvents: {
    title: string; category: "AI" | "LIDER" | "SOFT" | "IK" | "ALIM" | "KOC";
    date: string; duration: string; location: string; hot: boolean; seatText: string; order: number;
  }[] = [
    { title: "Yöneticiler için Üretken Yapay Zekâ", category: "AI", date: "2026-07-15", duration: "1 Gün", location: "İstanbul + Online", hot: true, seatText: "Son 6 koltuk", order: 1 },
    { title: "İlk Kademe Yönetici Gelişim Programı", category: "LIDER", date: "2026-07-22", duration: "2 Gün", location: "İstanbul", hot: true, seatText: "Son 11 koltuk", order: 2 },
    { title: "Yetkinlik Bazlı Mülakat Teknikleri", category: "IK", date: "2026-08-05", duration: "1 Gün", location: "Online", hot: false, seatText: "Kontenjan açık", order: 3 },
    { title: "Profesyonel Koçluk Programı — Güz", category: "KOC", date: "2026-08-18", duration: "12 Hafta", location: "Hibrit", hot: true, seatText: "Erken kayıt %15", order: 4 },
    { title: "İK'da Yapay Zekâ: Uygulama Atölyesi", category: "AI", date: "2026-09-09", duration: "1 Gün", location: "İstanbul", hot: false, seatText: "Kontenjan açık", order: 5 },
    { title: "Stratejik Düşünme ve Karar Alma", category: "LIDER", date: "2026-09-24", duration: "1 Gün", location: "Ankara", hot: false, seatText: "Kontenjan açık", order: 6 },
  ];
  const calendarCount = await prisma.calendarEvent.count();
  if (calendarCount === 0) {
    for (const ev of calendarEvents) {
      await prisma.calendarEvent.create({
        data: {
          title: ev.title, category: ev.category as any, date: new Date(ev.date + "T00:00:00.000Z"),
          duration: ev.duration, location: ev.location, hot: ev.hot, seatText: ev.seatText, order: ev.order,
        },
      });
    }
  }

  // ==== Katalog (canlı sitedeki GERÇEK mevcut 26 eğitim — eski TRAININGS dizisi) ====
  // Canlı site bunları /api/catalog/public'ten çekip katalog modalının
  // filtre/arama/sepet motorunu (openCatalog/renderGrid) bu veriyle besler.
  const catalogItems: { title: string; category: "AI" | "LIDER" | "SOFT" | "IK" | "ALIM" | "KOC"; duration: string; format: string; level: string; order: number }[] = [
    { title: "Çalışanlar için Yapay Zekâ Okuryazarlığı", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Temel", order: 1 },
    { title: "Yöneticiler için Üretken Yapay Zekâ ve Strateji", category: "AI", duration: "1 Gün", format: "Yüz yüze", level: "Yönetici", order: 2 },
    { title: "Prompt Mühendisliği Atölyesi", category: "AI", duration: "1 Gün", format: "Online", level: "Orta", order: 3 },
    { title: "İK'da Yapay Zekâ: Uygulama Atölyesi", category: "AI", duration: "1 Gün", format: "Yüz yüze", level: "İK Profesyoneli", order: 4 },
    { title: "Kurumsal Yapay Zekâ Politikası Tasarımı", category: "AI", duration: "½ Gün", format: "Danışmanlık + Atölye", level: "Üst Yönetim", order: 5 },
    { title: "İlk Kademe Yönetici Gelişim Programı", category: "LIDER", duration: "2 Gün", format: "Yüz yüze", level: "Yeni Yönetici", order: 6 },
    { title: "Liderlik Gelişim Programı (Modüler)", category: "LIDER", duration: "4×1 Gün", format: "Hibrit", level: "Orta/Üst Kademe", order: 7 },
    { title: "Değişim Yönetimi ve Liderliği", category: "LIDER", duration: "1 Gün", format: "Yüz yüze", level: "Yönetici", order: 8 },
    { title: "Stratejik Düşünme ve Karar Alma", category: "LIDER", duration: "1 Gün", format: "Yüz yüze", level: "Yönetici", order: 9 },
    { title: "Delegasyon ve Geri Bildirim Ustalığı", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 10 },
    { title: "Etkili İletişim ve Dinleme", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Tüm Çalışanlar", order: 11 },
    { title: "Sunum Becerileri: Sahnede Etki", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Tüm Çalışanlar", order: 12 },
    { title: "Zaman ve Öncelik Yönetimi", category: "SOFT", duration: "½ Gün", format: "Online", level: "Tüm Çalışanlar", order: 13 },
    { title: "Problem Çözme ve Analitik Düşünme", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Tüm Çalışanlar", order: 14 },
    { title: "Stres ve Tükenmişlik Yönetimi", category: "SOFT", duration: "½ Gün", format: "Online", level: "Tüm Çalışanlar", order: 15 },
    { title: "Takım Çalışması ve İş Birliği", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Ekipler", order: 16 },
    { title: "Performans Yönetimi Sistemi Kurulumu", category: "IK", duration: "Proje", format: "Danışmanlık", level: "İK Ekibi", order: 17 },
    { title: "Yetkinlik Bazlı Mülakat Teknikleri", category: "IK", duration: "1 Gün", format: "Online", level: "İK / Yönetici", order: 18 },
    { title: "Yetenek Yönetimi ve Yedekleme Planı", category: "IK", duration: "1 Gün", format: "Yüz yüze", level: "İK Ekibi", order: 19 },
    { title: "İK Analitiği ve Veriyle Karar", category: "IK", duration: "1 Gün", format: "Online", level: "İK Profesyoneli", order: 20 },
    { title: "Yönetici İşe Alımı (Executive Search)", category: "ALIM", duration: "Proje", format: "Hizmet", level: "C-Level / Direktör", order: 21 },
    { title: "Assessment Center Tasarımı ve Uygulaması", category: "ALIM", duration: "Proje", format: "Hizmet", level: "Tüm Kademeler", order: 22 },
    { title: "Kişilik ve Yetkinlik Envanterleri", category: "ALIM", duration: "Sürekli", format: "Dijital", level: "Tüm Kademeler", order: 23 },
    { title: "Yönetici Koçluğu (Executive Coaching)", category: "KOC", duration: "6-12 Seans", format: "Birebir", level: "Yönetici", order: 24 },
    { title: "Takım Koçluğu Programı", category: "KOC", duration: "4-8 Seans", format: "Ekip", level: "Ekipler", order: 25 },
    { title: "Profesyonel Koçluk Programı (ICF Yolu)", category: "KOC", duration: "12 Hafta", format: "Hibrit", level: "Koç Adayı", order: 26 },
  ];
  const catalogCount = await prisma.catalogItem.count();
  if (catalogCount === 0) {
    for (const c of catalogItems) {
      await prisma.catalogItem.create({
        data: { title: c.title, category: c.category as any, duration: c.duration, format: c.format, level: c.level, order: c.order },
      });
    }
  }

  // ==== Katalog genişletmesi: "2025 RECTRA_Eğitim Kataloğu Güncel.docx" ====
  // Murat'ın yüklediği Word kataloğundaki ~121 eğitim, doğru kategoriye
  // (AI/LİDER/SOFT/İK/KOÇ) yerleştirilip mevcut 26 eğitimle birleştirilerek
  // HER KATEGORİDE alfabetik sıraya dizildi (ALİM kategorisi kurum hizmetleri
  // olduğu için dokümandan yeni eğitim almadı, sadece kendi içinde alfabetik
  // sıralandı). Bu blok idempotent'tir: başlığa göre eşleşen kayıtların
  // sadece kategori/sırasını günceller (published/duration gibi admin'in
  // sonradan değiştirebileceği alanlara dokunmaz), eşleşmeyenleri oluşturur.
  // Sadece katalog hâlâ ilk 26 kayıtta ise çalışır — admin daha sonra manuel
  // sıralama yaparsa bir sonraki deploy'da bu blok tekrar üzerine yazmaz.
  const catalogCountNow = await prisma.catalogItem.count();
  if (catalogCountNow <= 26) {
    const fullCatalog: { title: string; category: "AI" | "LIDER" | "SOFT" | "IK" | "ALIM" | "KOC"; duration: string; format: string; level: string; order: number }[] = [
      { title: "Çalışanlar için Yapay Zekâ Okuryazarlığı", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Temel", order: 1 },
      { title: "Dijital Araçlar ve Uygulama Yöntemleri", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 2 },
      { title: "Dijital Check-up ve Strateji Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 3 },
      { title: "Dijital Context ve Content Yaklaşımı", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 4 },
      { title: "Dijital Dönüşüm", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 5 },
      { title: "Dijital İhracatta Dijital İletişim ve Dönüşümün Önemi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 6 },
      { title: "Dijital Kriz Yönetimi Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 7 },
      { title: "Dijital Mecralar ve Platformlarda Hesap Yönetimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 8 },
      { title: "Dijital Medya Satın Alma ve Optimizasyon", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 9 },
      { title: "Dijital Pazarlama Case'leri", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 10 },
      { title: "Dijital Pazarlama Eğitimi", category: "AI", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 11 },
      { title: "Dijital Performans Pazarlaması", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 12 },
      { title: "Dijital Veri, İçgörü ve Analiz Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 13 },
      { title: "Dijital Yetenekler ve Yapay Zeka Uygulamaları Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 14 },
      { title: "E-Ticaret Eğitimi", category: "AI", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 15 },
      { title: "Güçlü Marka Oluşturma Stratejileri Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 16 },
      { title: "Günümüz Yapay Zeka Çağında Hayatta Kalmak", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 17 },
      { title: "İçerik Editörlüğü Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 18 },
      { title: "İçerik Pazarlaması Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 19 },
      { title: "İK'da Yapay Zekâ: Uygulama Atölyesi", category: "AI", duration: "1 Gün", format: "Yüz yüze", level: "İK Profesyoneli", order: 20 },
      { title: "İş Süreçlerinde Etkin Yapay Zeka Kullanımı Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 21 },
      { title: "Kurumsal Yapay Zekâ Politikası Tasarımı", category: "AI", duration: "½ Gün", format: "Danışmanlık + Atölye", level: "Üst Yönetim", order: 22 },
      { title: "LinkedIn ve B2B Dijital İletişim", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 23 },
      { title: "Prompt Mühendisliği", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 24 },
      { title: "Prompt Mühendisliği Atölyesi", category: "AI", duration: "1 Gün", format: "Online", level: "Orta", order: 25 },
      { title: "Sanayi 4.0 Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 26 },
      { title: "SEO Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 27 },
      { title: "Search ve Web Sitesi Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 28 },
      { title: "Sosyal Medya Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 29 },
      { title: "Veri Analizi ve Görselleştirme", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 30 },
      { title: "Veri Okuryazarlığı Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 31 },
      { title: "Yapay Zeka Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 32 },
      { title: "Yapay Zeka ile Kreatif Yetkinlik Kazanımı", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 33 },
      { title: "Yapay Zeka Operatörlüğü Eğitimi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 34 },
      { title: "Yöneticiler için Bireysel Dijital İletişim Stratejileri ve Şirket İletişimleri için Önemi", category: "AI", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 35 },
      { title: "Yöneticiler için Üretken Yapay Zekâ ve Strateji", category: "AI", duration: "1 Gün", format: "Yüz yüze", level: "Yönetici", order: 36 },
      { title: "Çatışma ve Stres Yönetimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 1 },
      { title: "Çatışma Yönetimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 2 },
      { title: "Çatışma Yönetimi Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 3 },
      { title: "Dayanıklılık", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 4 },
      { title: "Değişim Yönetimi ve Liderliği", category: "LIDER", duration: "1 Gün", format: "Yüz yüze", level: "Yönetici", order: 5 },
      { title: "Delegasyon Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 6 },
      { title: "Delegasyon ve Geri Bildirim Ustalığı", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 7 },
      { title: "Duygusal Zekâ ve Empati", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 8 },
      { title: "Ekibe Liderlik Etmek Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 9 },
      { title: "Ekip Yönetimi ve Motivasyon", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 10 },
      { title: "Etkin Geri Bildirim Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 11 },
      { title: "İlk Kademe Yönetici Gelişim Programı", category: "LIDER", duration: "2 Gün", format: "Yüz yüze", level: "Yeni Yönetici", order: 12 },
      { title: "Koçvari Liderlik", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 13 },
      { title: "Kuşaklar Arası İletişim ve İlişki Yönetimi Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 14 },
      { title: "Liderler için Hikaye Anlatımı Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 15 },
      { title: "Liderlik Gelişim Programı (Modüler)", category: "LIDER", duration: "4×1 Gün", format: "Hibrit", level: "Orta/Üst Kademe", order: 16 },
      { title: "Norm Kadro Analizi (Çalışan Niteliklerinin Belirlenmesi) Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 17 },
      { title: "Proje Liderliği Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 18 },
      { title: "Proje Yönetimi Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 19 },
      { title: "Stratejik Düşünme ve Karar Alma", category: "LIDER", duration: "1 Gün", format: "Yüz yüze", level: "Yönetici", order: 20 },
      { title: "Takım İçi Liderlik Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 21 },
      { title: "Takım Koçluğu Gelişim Programı", category: "LIDER", duration: "6 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 22 },
      { title: "Uzaktan Ekip ve İş Yönetimi Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 23 },
      { title: "VUCA Çağında Liderlik Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 24 },
      { title: "Yönetim Becerilerini Geliştirme Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 25 },
      { title: "Yönetim ve Organizasyon Eğitimi", category: "LIDER", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 26 },
      { title: "Yönetimde Stratejik Planlama Eğitimi", category: "LIDER", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Yöneticiler", order: 27 },
      { title: "Agile Yönetim ve Scrum Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 1 },
      { title: "B2B Pazarlama Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 2 },
      { title: "Duygusal Dayanıklılık Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 3 },
      { title: "Duygusal Zeka Merkezli Takım Yönetimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 4 },
      { title: "Eleştirel Düşünme Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 5 },
      { title: "Etkili İletişim Teknikleri Eğitimi", category: "SOFT", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 6 },
      { title: "Etkili İletişim ve Dinleme", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Tüm Çalışanlar", order: 7 },
      { title: "Etkili Sunum Teknikleri Eğitimi", category: "SOFT", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 8 },
      { title: "Finansal Okuryazarlık Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 9 },
      { title: "Girişimcilik ve Değer Yaratma Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 10 },
      { title: "Hedef Belirleme Teknikleri Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 11 },
      { title: "Hızlı Okuma ve Hafıza Teknikleri Eğitimi", category: "SOFT", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 12 },
      { title: "Hitabet ve Diksiyon Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 13 },
      { title: "İkna Teknikleri Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 14 },
      { title: "İlişki Yönetimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 15 },
      { title: "İş Hayatında Yazışma Teknikleri Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 16 },
      { title: "Müşteri İlişkileri Yönetimi ve CRM Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 17 },
      { title: "Müşteri Odaklı Satış Teknikleri Eğitimi", category: "SOFT", duration: "2 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 18 },
      { title: "Müşteri Tipleri ve Yaklaşım Yöntemleri", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 19 },
      { title: "Müşteri (Tüketici) Davranışları Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 20 },
      { title: "Nöropazarlama Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 21 },
      { title: "Oyunlaştırma Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 22 },
      { title: "Öğrenme Çevikliği Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 23 },
      { title: "Öğrenmeyi Öğrenme Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 24 },
      { title: "Problem Çözme ve Analitik Düşünme", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Tüm Çalışanlar", order: 25 },
      { title: "Satış Koçluğu Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 26 },
      { title: "Satış Teknikleri Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 27 },
      { title: "Satış Yönetimi Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 28 },
      { title: "Stratejik Pazarlama ve Ürün Yönetimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 29 },
      { title: "Stres ve Tükenmişlik Yönetimi", category: "SOFT", duration: "½ Gün", format: "Online", level: "Tüm Çalışanlar", order: 30 },
      { title: "Stres Yönetimi Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 31 },
      { title: "Sunum Becerileri: Sahnede Etki", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Tüm Çalışanlar", order: 32 },
      { title: "Takım Çalışması ve İş Birliği", category: "SOFT", duration: "1 Gün", format: "Yüz yüze", level: "Ekipler", order: 33 },
      { title: "Telefonda Etkili İletişim Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 34 },
      { title: "Telefonda Satış Teknikleri Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 35 },
      { title: "Temel Satış Becerileri", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 36 },
      { title: "Temel Yönetim Becerileri Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 37 },
      { title: "Uzaktan Verimli Çalışma Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 38 },
      { title: "Yaratıcı Düşünme Teknikleri ve İnovasyon Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 39 },
      { title: "Zaman ve Öncelik Yönetimi", category: "SOFT", duration: "½ Gün", format: "Online", level: "Tüm Çalışanlar", order: 40 },
      { title: "Zaman Yönetimi Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 41 },
      { title: "Zor Müşterilerle Başa Çıkma Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 42 },
      { title: "21. Yüzyıl Becerileri Kazanma Eğitimi", category: "SOFT", duration: "1 Gün", format: "Yüz yüze / Online", level: "Tüm Çalışanlar", order: 43 },
      { title: "Bordrolama Eğitimi", category: "IK", duration: "2 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 1 },
      { title: "CV Hazırlama ve Mülakata Hazırlık Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 2 },
      { title: "Değerlendirme Merkezi Sertifika Programı", category: "IK", duration: "4 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 3 },
      { title: "Deneyimsel Öğrenme Metodolojisi ile Eğitim Tasarımı", category: "IK", duration: "2 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 4 },
      { title: "Eğitimcinin Eğitimi", category: "IK", duration: "2 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 5 },
      { title: "Eğitimde Ölçme-Değerlendirme Teknikleri", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 6 },
      { title: "Etkili Geri Bildirim Teknikleri", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 7 },
      { title: "İK Analitiği ve Veriyle Karar", category: "IK", duration: "1 Gün", format: "Online", level: "İK Profesyoneli", order: 8 },
      { title: "İK Asistanlığı Eğitimi", category: "IK", duration: "3 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 9 },
      { title: "İK Metrikleri ve İK Analitik", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 10 },
      { title: "İK'da Değişim Yönetimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 11 },
      { title: "İngilizce Mülakata Hazırlık", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 12 },
      { title: "İş Analizi ve Başarı Profilleme", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 13 },
      { title: "İş Analizi ve Görev Tanımı", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 14 },
      { title: "İş Değerlemeye Dayalı Ücret Sistemi Yönetimi Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 15 },
      { title: "İş İlanı Hazırlama, Aday Özgeçmişi Analiz Etme ve Değerlendirme Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 16 },
      { title: "İş Yaşamında Kuşakların Yönetimi Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 17 },
      { title: "İşyerinde Çeşitlilik ve Kapsayıcılık Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 18 },
      { title: "Kariyer Yönetimi Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 19 },
      { title: "Kurum Değerleri Oluşturma Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 20 },
      { title: "Kurum İçi İletişim Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 21 },
      { title: "Kurumsal Dayanıklılığın Artırılması ve Kurumsal Esnekliğin Sağlanması Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 22 },
      { title: "Oryantasyon Programı Tasarımı Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 23 },
      { title: "Performans Değerlendirme Yönetimi Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 24 },
      { title: "Performans Yönetimi Sistemi Kurulumu", category: "IK", duration: "Proje", format: "Danışmanlık", level: "İK Ekibi", order: 25 },
      { title: "Temel İş Kanunu ve İş Hukuku Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 26 },
      { title: "Temel İş Sağlığı ve Güvenliği Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 27 },
      { title: "Verimli Sanal Toplantı Yönetimi Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 28 },
      { title: "Yetenek Yönetimi Eğitimi", category: "IK", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK Ekibi", order: 29 },
      { title: "Yetenek Yönetimi ve Yedekleme Planı", category: "IK", duration: "1 Gün", format: "Yüz yüze", level: "İK Ekibi", order: 30 },
      { title: "Yetkinlik Bazlı Mülakat Teknikleri", category: "IK", duration: "1 Gün", format: "Online", level: "İK / Yönetici", order: 31 },
      { title: "Assessment Center Tasarımı ve Uygulaması", category: "ALIM", duration: "Proje", format: "Hizmet", level: "Tüm Kademeler", order: 1 },
      { title: "Kişilik ve Yetkinlik Envanterleri", category: "ALIM", duration: "Sürekli", format: "Dijital", level: "Tüm Kademeler", order: 2 },
      { title: "Yönetici İşe Alımı (Executive Search)", category: "ALIM", duration: "Proje", format: "Hizmet", level: "C-Level / Direktör", order: 3 },
      { title: "Kurum İçi Koçluk Eğitimi", category: "KOC", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK / Yönetici", order: 1 },
      { title: "Kurum İçi Koçluk ve Mentorluk Sistemi Kurma Eğitimi", category: "KOC", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK / Yönetici", order: 2 },
      { title: "Mentorluk Proje Liderliği Eğitimi", category: "KOC", duration: "1 Gün", format: "Yüz yüze / Online", level: "İK / Yönetici", order: 3 },
      { title: "Profesyonel Koçluk Programı (ICF Yolu)", category: "KOC", duration: "12 Hafta", format: "Hibrit", level: "Koç Adayı", order: 4 },
      { title: "Takım Koçluğu Programı", category: "KOC", duration: "4-8 Seans", format: "Ekip", level: "Ekipler", order: 5 },
      { title: "Temel Koçluk Sertifika Programı", category: "KOC", duration: "3 Gün", format: "Yüz yüze / Online", level: "İK / Yönetici", order: 6 },
      { title: "Yönetici Koçluğu (Executive Coaching)", category: "KOC", duration: "6-12 Seans", format: "Birebir", level: "Yönetici", order: 7 },
    ];
    for (const c of fullCatalog) {
      const existingCatalogItem = await prisma.catalogItem.findFirst({ where: { title: c.title } });
      if (existingCatalogItem) {
        await prisma.catalogItem.update({ where: { id: existingCatalogItem.id }, data: { category: c.category as any, order: c.order } });
      } else {
        await prisma.catalogItem.create({
          data: { title: c.title, category: c.category as any, duration: c.duration, format: c.format, level: c.level, order: c.order },
        });
      }
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
    { key: "nav", icon: "🧭", name: "Üst Menü (Navigasyon)", color: "#1a2145", order: 0, visible: true, fields: {
      link_school: "Business School",
      link_catalog: "Katalog",
      link_calendar: "Açık Eğitimler",
      link_ecosystem: "Ekosistem",
      link_faq: "SSS",
      link_login: "Giriş",
      link_cta: "Teklif Al",
    }},
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
      // 6 kartın başlık/açıklama/etiket metinleri (kart sayısı ve animasyon/
      // kategori sistemi sabittir — bkz. Task #19 tasarım kararı — sadece
      // metinler buradan düzenlenir).
      card_ai_title: "Yapay Zekâ Fakültesi",
      card_ai_desc: "Temel okuryazarlıktan yönetici stratejisine, İK'da yapay zekâdan prompt tekniklerine uygulamalı programlar.",
      card_ai_tags: "<span>AI Okuryazarlığı</span><span>Prompt Mühendisliği</span><span>İK'da AI</span>",
      card_lider_title: "Liderlik Fakültesi",
      card_lider_desc: "İlk kademe yöneticiden üst düzey lidere; 70-20-10 modeliyle tasarlanan gelişim yolculukları.",
      card_lider_tags: "<span>Liderlik Gelişim Programı</span><span>Değişim Yönetimi</span>",
      card_soft_title: "Soft Skills Fakültesi",
      card_soft_desc: "İletişim, sunum, problem çözme; Kolb döngüsüyle yaşayarak öğrenilen beceriler.",
      card_soft_tags: "<span>Etkili İletişim</span><span>Sunum Becerileri</span>",
      card_ik_title: "İK Fakültesi &amp; Danışmanlık",
      card_ik_desc: "Performans sisteminden yetenek yönetimine; Kirkpatrick ölçümüyle kanıtlanan İK dönüşümü.",
      card_ik_tags: "<span>Performans Yönetimi</span><span>Yetenek Yönetimi</span>",
      card_alim_title: "İşe Alım &amp; Headhunting",
      card_alim_desc: "Executive search'ten toplu projelere; assessment center ile isabetli yetenek kararları.",
      card_alim_tags: "<span>Executive Search</span><span>Assessment Center</span>",
      card_koc_title: "Koçluk Fakültesi &amp; Akademi",
      card_koc_desc: "Yönetici ve takım koçluğu; Potential Coaching Academy ile ICF yolculuğunuz.",
      card_koc_tags: "<span>Executive Coaching</span><span>ICF Programları</span>",
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
      title: "İşin Mutfağından Gelen Deneyimli Eğitmen Kadromuz",
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

  // Bölüm zaten varsa: admin panelinde girilmiş GERÇEK değerleri ASLA ezme.
  // Ama yeni bir sürümde o bölüme yeni bir alan (ör. kart metni, menü
  // etiketi) eklendiyse, bu alan DB'deki mevcut satıra hiç yazılmaz (upsert
  // update:{} yeni alanları görmez) — bu yüzden burada var olan fields JSON'u
  // okuyup sadece eksik olan yeni anahtarları varsayılan değerleriyle
  // ekliyoruz; halihazırda var olan (admin tarafından değiştirilmiş de
  // olabilecek) hiçbir anahtar dokunulmadan kalır.
  for (const s of sections) {
    const existingRow = await prisma.siteSection.findUnique({ where: { key: s.key } });
    if (!existingRow) {
      await prisma.siteSection.create({
        data: { key: s.key, icon: s.icon, name: s.name, color: s.color, order: s.order, visible: s.visible, fields: s.fields },
      });
      continue;
    }
    const existingFields = (existingRow.fields as Record<string, string>) || {};
    const hasNewKeys = Object.keys(s.fields).some((k) => !(k in existingFields));
    if (hasNewKeys) {
      const mergedFields = { ...s.fields, ...existingFields };
      await prisma.siteSection.update({ where: { key: s.key }, data: { fields: mergedFields } });
    }
  }

  // Tek seferlik metin düzeltmesi: "Eğitmen Standardımız" başlığı hâlâ eski
  // varsayılan metni taşıyorsa (admin panelinden hiç değiştirilmemişse) yeni
  // ifadeyle güncelle. Admin bu alanı manuel değiştirdiyse dokunulmaz —
  // yukarıdaki "asla ezme" politikasıyla tutarlı, sadece varsayılanı düzeltir.
  const trainersSection = await prisma.siteSection.findUnique({ where: { key: "trainers" } });
  if (trainersSection) {
    const tf = (trainersSection.fields as Record<string, string>) || {};
    if (tf.title === "Sahneye herkes çıkamaz.") {
      await prisma.siteSection.update({
        where: { key: "trainers" },
        data: { fields: { ...tf, title: "İşin Mutfağından Gelen Deneyimli Eğitmen Kadromuz" } },
      });
    }
  }

  console.log("Seed complete. Admin login:", email);
}

main().finally(() => prisma.$disconnect());
