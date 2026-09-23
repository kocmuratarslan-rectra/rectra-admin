"use client";
import { useEffect, useState } from "react";

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

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu talebi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-gray-500">Yükleniyor...</p>;
  if (leads.length === 0) return <p className="text-gray-500">Henüz talep yok. Site iletişim formu doldurulduğunda burada görünecek.</p>;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-rectra-gray text-left">
          <tr>
            <th className="p-3">Ad</th>
            <th className="p-3">E-posta</th>
            <th className="p-3">Telefon</th>
            <th className="p-3">Mesaj</th>
            <th className="p-3">Kaynak</th>
            <th className="p-3">Durum</th>
            <th className="p-3">Tarih</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="p-3 font-medium">{l.name}</td>
              <td className="p-3">{l.email}</td>
              <td className="p-3">{l.phone || "-"}</td>
              <td className="p-3 max-w-xs truncate" title={l.message || ""}>{l.message || "-"}</td>
              <td className="p-3">{l.source}</td>
              <td className="p-3">
                <select
                  value={l.status}
                  onChange={(e) => updateStatus(l.id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-gray-500">{new Date(l.createdAt).toLocaleString("tr-TR")}</td>
              <td className="p-3">
                <button onClick={() => remove(l.id)} className="text-rectra-red text-xs">Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
