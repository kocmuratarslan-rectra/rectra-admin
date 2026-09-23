import Link from "next/link";
import { prisma } from "@/lib/prisma";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  createdAt: Date;
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişimde",
  QUALIFIED: "Teklif",
  WON: "Kazanıldı",
  LOST: "Kaybedildi",
};
const STATUS_PILL: Record<string, string> = {
  NEW: "p-new",
  CONTACTED: "p-contact",
  QUALIFIED: "p-offer",
  WON: "p-won",
  LOST: "p-lost",
};

export default async function DashboardPage() {
  const [totalLeads, newLeads, wonLeads, visibleSections, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.siteSection.count({ where: { visible: true } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const conversion = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const kpis = [
    { ic: "📨", label: "Toplam Talep", value: totalLeads, color: "var(--indigo)" },
    { ic: "🆕", label: "Yeni Talepler", value: newLeads, color: "var(--amber)" },
    { ic: "🏆", label: "Kazanılan", value: wonLeads, color: "var(--green)" },
    { ic: "📈", label: "Dönüşüm Oranı", value: `%${conversion}`, color: "var(--teal-deep)" },
  ];

  return (
    <>
      <div className="topbar">
        <h1>
          Genel Bakış
          <small>Rectra CRM &amp; Site kontrol paneli — canlı veriler</small>
        </h1>
        <div className="top-actions">
          <Link href="/admin/leads" className="btn btn-amber">Talepleri Gör</Link>
          <Link href="/admin/site" className="btn btn-line">Site Kontrolü</Link>
        </div>
      </div>

      <div className="grid kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.label} style={{ ["--kc" as string]: k.color }}>
            <span className="kicon">{k.ic}</span>
            <small>{k.label}</small>
            <b>{k.value}</b>
          </div>
        ))}
      </div>

      <div className="sec-title">
        Son Talepler
        <small>En son gelen 6 kayıt</small>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>E-posta</th>
              <th>Kaynak</th>
              <th>Durum</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "var(--muted)", textAlign: "center", padding: "24px" }}>
                  Henüz talep yok.
                </td>
              </tr>
            )}
            {recentLeads.map((l: LeadRow) => (
              <tr key={l.id}>
                <td style={{ fontWeight: 700 }}>{l.name}</td>
                <td>{l.email}</td>
                <td>{l.source}</td>
                <td>
                  <span className={`pill ${STATUS_PILL[l.status] ?? "p-new"}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                </td>
                <td className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                  {new Date(l.createdAt).toLocaleDateString("tr-TR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note">
        Süper Admin · Site Kontrolü'nde şu an <b>{visibleSections}</b> bölüm canlı sitede yayında.
      </div>
    </>
  );
}
