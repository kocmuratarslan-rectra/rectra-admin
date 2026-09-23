"use client";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
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

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.leads || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast("Durum güncellendi");
  }

  async function remove(id: string) {
    if (!confirm("Bu talebi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    showToast("Talep silindi");
    load();
  }

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filter !== "ALL" && l.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.phone || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: leads.length };
    for (const s of STATUSES) c[s] = leads.filter((l) => l.status === s).length;
    return c;
  }, [leads]);

  return (
    <>
      <div className="filters">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input placeholder="İsim, e-posta veya telefon ara..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className={`fchip${filter === "ALL" ? " on" : ""}`} onClick={() => setFilter("ALL")}>
          Tümü ({counts.ALL})
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={`fchip${filter === s ? " on" : ""}`} onClick={() => setFilter(s)}>
            {STATUS_LABEL[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 22, color: "var(--muted)" }}>Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 22, color: "var(--muted)" }}>
            {leads.length === 0 ? "Henüz talep yok. Site iletişim formu doldurulduğunda burada görünecek." : "Bu filtreye uyan talep yok."}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>İletişim</th>
                <th>Mesaj</th>
                <th>Kaynak</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700 }}>{l.name}</td>
                  <td>
                    <div>{l.email}</div>
                    {l.phone && <div style={{ fontSize: 12, color: "var(--muted)" }}>{l.phone}</div>}
                  </td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.message || ""}>
                    {l.message || "—"}
                  </td>
                  <td>{l.source}</td>
                  <td>
                    <select
                      className="stt"
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    {" "}
                    <span className={`pill ${STATUS_PILL[l.status] ?? "p-new"}`} style={{ marginLeft: 6 }}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(l.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td>
                    <button className="tbtn danger" title="Sil" onClick={() => remove(l.id)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
