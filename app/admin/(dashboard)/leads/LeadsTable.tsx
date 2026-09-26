"use client";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    setConfirmDeleteId(null);
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

  function exportRows() {
    return filtered.map((l) => ({
      "Ad Soyad": l.name,
      "E-posta": l.email,
      "Telefon": l.phone || "",
      "Mesaj": l.message || "",
      "Kaynak": l.source,
      "Durum": STATUS_LABEL[l.status] ?? l.status,
      "Tarih": new Date(l.createdAt).toLocaleString("tr-TR"),
    }));
  }

  function fileStamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportExcel() {
    const rows = exportRows();
    if (!rows.length) { showToast("İndirilecek talep yok"); return; }
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Talepler");
    const out: ArrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `rectra-talepler-${fileStamp()}.xlsx`);
    showToast("Excel dosyası indirildi");
  }

  function csvEscape(v: string) {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function exportCsv() {
    const rows = exportRows();
    if (!rows.length) { showToast("İndirilecek talep yok"); return; }
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(";")].concat(
      rows.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(";"))
    );
    // Excel'in Türkçe karakterleri doğru göstermesi için UTF-8 BOM eklenir.
    const csv = "﻿" + lines.join("\r\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `rectra-talepler-${fileStamp()}.csv`);
    showToast("CSV dosyası indirildi");
  }

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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-line btn-sm" onClick={exportExcel} title="Görüntülenen talepleri Excel (.xlsx) olarak indir">
            ⬇ Excel (.xlsx)
          </button>
          <button className="btn btn-line btn-sm" onClick={exportCsv} title="Görüntülenen talepleri CSV olarak indir">
            ⬇ CSV
          </button>
        </div>
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
                    {confirmDeleteId === l.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
                        <button className="btn btn-line btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }} onClick={() => remove(l.id)}>Evet, sil</button>
                        <button className="btn btn-line btn-sm" onClick={() => setConfirmDeleteId(null)}>Vazgeç</button>
                      </div>
                    ) : (
                      <button className="tbtn danger" title="Sil" onClick={() => setConfirmDeleteId(l.id)}>
                        ✕
                      </button>
                    )}
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
