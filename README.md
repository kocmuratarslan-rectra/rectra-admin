# Rectra Admin & CRM

Rectra için gerçek, çalışan bir Next.js 15 (App Router, TypeScript) admin/CRM uygulaması. Tasarımı `admin.html` mockup'ı ile birebir aynıdır; arayüzdeki modüllerden bir kısmı tam fonksiyonel (gerçek veri, gerçek API), bir kısmı ise henüz "Yakında" etiketiyle devre dışıdır — hiçbir modül sahte/mock veri göstermez.

## Modül durumu (Faz 1)

**Gerçek ve canlı çalışıyor:**
- **Panel** — gerçek KPI'lar (toplam/yeni/kazanılan talep, dönüşüm oranı) ve son talepler tablosu, veritabanından canlı okunur.
- **Talepler (CRM)** — site teklif formundan gelen tüm talepler, durum güncelleme, arama/filtre, silme.
- **İçerik** — hizmet kartları (ve referans/SSS/blog altyapısı) yönetimi.
- **Süper Admin · Site Kontrolü** — canlı sitenin (rectra-site.vercel.app) metin alanlarını ve bölüm görünürlüğünü buradan değiştirirsiniz; değişiklik birkaç saniye içinde sitede görünür (aşağıda "Site Kontrolü nasıl çalışır" bölümüne bakın).

**Tasarımda mevcut, "Yakında" — gerçek entegrasyon yok, sahte veri de yok:**
Tahsilat, Blog & SEO İçerik Üretimi (AI), Mailing Stüdyosu, Sosyal Medya & Ads, Murat AI Asistan, bazı Ayarlar entegrasyonları (WhatsApp, Google/LinkedIn/TikTok/X Ads, Spotify, muhasebe). Bu modüller kullanıcıya net şekilde "Yakında" olarak işaretlenir; hiçbir buton sahte bir başarı mesajı göstermez.

**Faz planı:** Her yeni modül gerçek hale getirilmeden önce kapsam ve gereken entegrasyonlar (API anahtarları vb.) kullanıcıya sunulur ve onay alınır. Onaylanan bir sonraki faz: **Blog & SEO içerik üretimi (AI)** — bu faz başladığında bir AI API anahtarı (ör. OpenAI) istenecektir.

**Veri kaybı politikası:** `prisma/schema.prisma` her zaman additive değişir (yeni alan/tablo eklenir, mevcut alan asla silinmez/tipi değiştirilmez) ve seed script'i `upsert` + boş `update: {}` kalıbını kullanır — bu sayede admin panelinde girilmiş hiçbir veri (Lead, ContentItem, SiteSection) sonraki faz güncellemelerinde ASLA ezilmez veya kaybolmaz.

## Teknolojiler

- Next.js 15 (App Router) + React 19 + TypeScript
- next-auth v4 (Credentials provider, JWT session stratejisi)
- Prisma 6 + PostgreSQL
- Tailwind CSS
- zod (girdi doğrulama)

## Kurulum

```bash
npm install
```

`npm install` sonrası `postinstall` hook'u otomatik olarak `prisma generate` çalıştırır. Bu adım internet erişimi gerektirir (Prisma engine binary indirir); Vercel build ortamında sorunsuz çalışır.

## Ortam değişkenleri

`.env.example` dosyasını referans alarak `.env` (yerel geliştirme) veya Vercel proje ayarlarında aşağıdaki değişkenleri tanımlayın:

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi (örn. Vercel Postgres, Neon, Supabase) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` ile üretilecek rastgele gizli anahtar |
| `NEXTAUTH_URL` | Uygulamanın yayında olacağı tam URL (örn. `https://rectra-admin.vercel.app`) |
| `ADMIN_EMAIL` | İlk admin kullanıcının e-postası (seed script tarafından kullanılır) |
| `ADMIN_PASSWORD` | İlk admin kullanıcının şifresi (seed script tarafından kullanılır, sadece seed sırasında okunur) |

## Veritabanı şeması ve admin kullanıcı oluşturma

Şema değişikliklerini veritabanına uygulamak için:

```bash
npx prisma migrate deploy
# veya geliştirme ortamında:
npx prisma migrate dev
```

Admin kullanıcı ve örnek hizmet kartlarını oluşturmak için:

```bash
npm run seed
```

Bu komut `.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` değerleriyle (tanımlı değilse varsayılan olarak `zihinacan@gmail.com` / `ChangeMe123!`) bir `AdminUser` kaydı oluşturur veya mevcutsa şifresini günceller, ayrıca 5 örnek hizmet kartı (`ContentItem`, type=SERVICE) ekler.

**Önemli:** Prodüksiyonda `ADMIN_PASSWORD` için mutlaka güçlü, benzersiz bir şifre tanımlayın ve seed işleminden sonra bu değeri ortam değişkenlerinden kaldırmanız veya değiştirmeniz önerilir.

## Giriş

Panele giriş: `/admin/login`

Giriş başarılı olduktan sonra `/admin` altındaki tüm sayfalar (Panel, Talepler/CRM, İçerik) `middleware.ts` tarafından korunur; oturum yoksa otomatik olarak `/admin/login` sayfasına yönlendirilir.

## API uçları

- `POST /api/contact` — **public**, CORS açık. Ana pazarlama sitesindeki teklif formu bu uca `name`, `email`, `phone`, `message`, `source` alanlarıyla POST isteği atar ve bir `Lead` kaydı oluşturur.
- `GET /api/leads`, `PATCH /api/leads/:id`, `DELETE /api/leads/:id` — admin oturumu gerektirir.
- `GET /api/content/:type` — `type` = SERVICE | TESTIMONIAL | FAQ | BLOG. Oturum yoksa sadece `published: true` kayıtlar döner (ana site içeriği bu uçtan çekebilir).
- `POST /api/content/:type`, `PUT /api/content/:type/:id`, `DELETE /api/content/:type/:id` — admin oturumu gerektirir.
- `GET /api/sections/public` — **public**, CORS açık, önbelleklenir (60sn). Sadece `visible: true` bölümlerin `{key, fields, order}` bilgisini döner. `rectra-site/index.html` sayfa yüklenirken bu uca istek atar.
- `GET /api/sections`, `POST /api/sections`, `PUT /api/sections/:id`, `DELETE /api/sections/:id`, `POST /api/sections/reorder` — admin oturumu gerektirir; Süper Admin · Site Kontrolü ekranı bu uçları kullanır.

## Site Kontrolü nasıl çalışır

`rectra-site/index.html` içindeki her düzenlenebilir metin elemanı `data-cms="bölüm.alan"` (ör. `data-cms="hero.headline"`), her bölüm sarmalayıcısı da `data-cms-section="bölüm"` (ör. `<header class="hero" data-cms-section="hero">`) etiketiyle işaretlidir. Sayfa yüklendiğinde sondaki `<script>` bloğu `GET {ADMIN_API_BASE}/api/sections/public`'i çağırır:

- Dönen her bölümün `fields` nesnesindeki her `alan: değer` çifti için, sayfadaki `[data-cms="bölüm.alan"]` elemanlarının `innerHTML`'i güncellenir.
- Bir bölüm **gizliyse** (admin panelinde kapatılmışsa) o bölüm API yanıtında hiç dönmez; script bunu görüp `[data-cms-section="bölüm"]` elemanını `display:none` yapar.
- API'ye ulaşılamazsa (ağ hatası, admin geçici çevrimdışı vb.) script sessizce hiçbir şey değiştirmez — sayfa varsayılan (seed'deki) haliyle kalır, asla bozuk görünmez.

**Kapsam notu (Faz 1):** Sadece tekil metin alanları (başlık, alt başlık, buton yazısı vb.) düzenlenebilir. Tekrarlanan liste içerikleri (fakülte kartları, SSS maddeleri, video listesi, referans listesi, takvim etkinlikleri, logo duvarı) şu an için tasarımda sabit kalır — bunları admin'den yönetilebilir hale getirmek, mevcut animasyon/tasarımı bozma riski taşıdığı için ayrı bir faz olarak planlanmalı ve önceden onay alınmalıdır. Aynı şekilde bölümlerin canlı sitedeki fiziksel sırası (DOM sırası) da sabittir; admin panelindeki sıralama oku sadece "Site Ağacı" görünümünü ve `order` alanını değiştirir, gerçek sayfa düzenini değiştirmez (diyagonal geçiş animasyonlarının bozulma riski nedeniyle).

## Vercel'e deploy

1. Bu repoyu GitHub'a push edin ve Vercel'de yeni proje olarak import edin.
2. Yukarıdaki ortam değişkenlerini Vercel proje ayarlarında tanımlayın.
3. Bir PostgreSQL veritabanı bağlayın (Vercel Postgres, Neon, Supabase vb.) ve `DATABASE_URL`'i buna göre ayarlayın.
4. İlk deploy sonrası `npx prisma migrate deploy` ve `npm run seed` komutlarını (Vercel CLI ile `vercel env pull` sonrası yerelden, veya bir migration/seed adımını build pipeline'ına ekleyerek) çalıştırın.
5. Ana pazarlama sitesindeki (`rectra-deploy/index.html`) `ADMIN_API_BASE` sabitini bu uygulamanın gerçek Vercel domainiyle güncelleyin.

## Kendi başına güncelleme rehberi

Bu proje üç farklı seviyede revize edilebilecek şekilde kuruldu — hangisine ihtiyacın olduğuna göre birini seç:

### 1. Kod bilmeden: içerik değişikliği (admin panelden)
Hizmet kartı, referans, SSS veya blog yazısı eklemek/silmek/yayından kaldırmak için kod dosyalarına hiç dokunmana gerek yok: `/admin/content` sayfasına gir, ilgili sekmeyi seç, formu doldur. Talepleri (lead) görüp durumlarını güncellemek için `/admin/leads` yeterli. Bu değişiklikler anında veritabanına yazılır, yeniden deploy gerekmez.

### 2. Site tasarımı/metni: `rectra-deploy/index.html`
Bu dosya düz HTML+CSS+JS — herhangi bir metin editörüyle açıp başlık, açıklama, renk, bölüm sırası gibi her şeyi değiştirebilirsin. Değişiklik sonrası dosyayı `kocmuratarslan-rectra/rectra-site` GitHub reposuna push et; Vercel otomatik olarak yeniden yayınlar (elle deploy gerekmez). `data-cms="..."` etiketli alanlar ileride admin panelinden düzenlenebilir hale getirilebilecek şekilde işaretlendi (şu an statik, phase 2'de dinamikleştirilebilir).

### 3. Kod seviyesinde: CRM'e yeni alan/ekran ekleme
Yeni bir veri türü veya alan eklemek istediğinde izlenecek standart yol (örnek: "Referans" kartına bir "şirket logosu URL'i" alanı eklemek):

1. `prisma/schema.prisma` içinde ilgili modele yeni alanı ekle (örn. `ContentItem` modeline `logoUrl String?`).
2. `npx prisma migrate dev --name add_logo_url` ile migration oluştur (yerelde DB bağlantın varsa) veya Vercel'de `npx prisma migrate deploy`.
3. İlgili API route'unda (`app/api/content/[type]/route.ts` ve `[id]/route.ts`) zod şemasına (`createSchema` / `updateSchema`) yeni alanı ekle.
4. İlgili admin sayfasında (`app/admin/content/ContentManager.tsx`) forma yeni input'u ekle.

Tamamen yeni bir bölüm (örn. "Vakalar/Case Study") eklemek istersen: `prisma/schema.prisma`'ya yeni bir model ekle → `app/api/<yeni-kaynak>/route.ts` oluştur (mevcut `leads` veya `content` route'larını şablon al) → `app/admin/<yeni-kaynak>/page.tsx` ile yeni bir panel sayfası oluştur → `app/admin/layout.tsx`'teki nav menüsüne link ekle. Mevcut kod tabanı (Lead ve ContentItem) bu deseni zaten örnekliyor, kopyala-uyarla mantığıyla ilerlenebilir.

### 4. Hiç uğraşmak istemiyorsan
Yukarıdakilerin hiçbiriyle uğraşmadan, hangi değişikliği istediğini yazman yeterli — kodu ve deploy'u ben (Claude) yaparım.

<!-- deploy trigger: 2026-09-23T21:16:51Z -->
