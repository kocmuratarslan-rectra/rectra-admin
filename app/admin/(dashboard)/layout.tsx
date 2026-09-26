import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "./SignOutButton";
import NavLink from "./NavLink";
import { APP_VERSION, LAST_UPDATED, LAST_UPDATE_SUMMARY } from "@/app/version";

const SITE_URL = "https://rectra-site.vercel.app";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// Faz 1'de gerçek: Panel, Talepler (CRM), İçerik, Süper Admin · Site Kontrolü.
// Blog & SEO artık gerçek: İçerik (Hizmetler) → Blog sekmesinde yönetiliyor.
// Diğerleri admin.html tasarımında kalır, "Yakında" etiketiyle devre dışıdır —
// gerçek veri/entegrasyon olmadan asla sahte veri göstermezler.
const SOON_ITEMS = [
  { ic: "💳", n: "Tahsilat" },
  { ic: "📧", n: "Mailing Stüdyosu" },
  { ic: "📣", n: "Sosyal Medya & Ads" },
  { ic: "🤖", n: "Murat AI Asistan" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const newLeadsCount = await prisma.lead.count({ where: { status: "NEW" } });

  return (
    <div className="app">
      <aside className="side">
        <input type="checkbox" id="side-toggle" className="side-toggle-checkbox" />
        <div className="side-top-row">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/rectra-logo-white.webp" alt="Rectra" style={{ height: 22, width: "auto", display: "block" }} />
            <small>ADMIN &amp; CRM</small>
          </div>
          <label htmlFor="side-toggle" className="side-toggle-btn" aria-label="Menü">
            <span></span><span></span><span></span>
          </label>
        </div>

        <NavLink href="/admin" icon="🏠" label="Panel" exact />
        <NavLink href="/admin/leads" icon="📨" label="Talepler (CRM)" badge={newLeadsCount > 0 ? String(newLeadsCount) : undefined} />
        <NavLink href="/admin/content" icon="🗂" label="İçerik (Hizmetler)" />
        <NavLink href="/admin/site" icon="🧭" label="Süper Admin · Site" />
        <NavLink href="/admin/settings" icon="⚙️" label="Ayarlar" />

        <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="snav site-link">
          <span className="ic">🌐</span>
          Siteyi Görüntüle
          <span className="ext-arrow">↗</span>
        </a>

        <div style={{ height: 10 }} />

        {SOON_ITEMS.map((it) => (
          <div className="snav disabled" key={it.n}>
            <span className="ic">{it.ic}</span>
            {it.n}
            <span className="bdg soon">Yakında</span>
          </div>
        ))}

        <div className="side-foot">
          <b>{session.user?.email}</b>
          Rectra Business School
          <div style={{ marginTop: 10 }}>
            <SignOutButton />
          </div>
          <Link href="/admin/settings" className="ver-tag" title={LAST_UPDATE_SUMMARY}>
            v{APP_VERSION} <span className="ver-dot">·</span> {formatDate(LAST_UPDATED)}
          </Link>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
