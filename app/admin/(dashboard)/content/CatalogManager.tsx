"use client";
import { useEffect, useState } from "react";

type CatalogEntry = {
  id: string;
  title: string;
  category: "AI" | "LIDER" | "SOFT" | "IK" | "ALIM" | "KOC";
  duration: string;
  format: string;
  level: string;
  order: number;
  published: boolean;
};

const CAT_LABELS: Record<string, string> = {
  AI: "Yapay Zekâ",
  LIDER: "Liderlik",
  SOFT: "Soft Skills",
  IK: "İK",
  ALIM: "İşe Alım",
  KOC: "Koçluk",
};

const emptyForm = { title: "", category: "AI" as CatalogEntry["category"], duration: "", format: "", level: "" };

export default function CatalogManager() {
  const [items, setItems] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/catalog");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    showToast("Eğitim kataloğa eklendi");
    load();
  }

  function startEdit(item: CatalogEntry) {
    setEditingId(item.id);
    setEditForm({ title: item.title, category: item.category, duration: item.duration, format: item.format, level: item.level });
  }

  async function saveEdit(id: string) {
    await fetch(`/api/catalog/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    showToast("Eğitim güncellendi — birkaç saniye içinde sitede görünür");
    load();
  }

  async function togglePublished(item: CatalogEntry) {
    await fetch(`/api/catalog/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu eğitimi kataloğdan silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    showToast("Eğitim silindi");
    load();
  }

  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <div className="note" style={{ marginTop: 0, marginBottom: 18 }}>
        Canlı sitede katalog modalında (Katalog butonu / Hizmet kartları / "60 Saniyede Teklif Al") arama ve filtreyle birlikte listelenir, ziyaretçi buradan programına ekleyebilir.
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto" }}>
          <input className="inp" placeholder="Eğitim adı" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="inp" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CatalogEntry["category"] })}>
            {Object.entries(CAT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input className="inp" placeholder="Süre (1 Gün)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <input className="inp" placeholder="Format (Yüz yüze)" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
          <input className="inp" placeholder="Seviye (Temel)" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          <button type="submit" className="btn btn-teal">+ Ekle</button>
        </form>
      </div>

      <div className="filters" style={{ marginBottom: 14 }}>
        <button className={`fchip${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>Tümü ({items.length})</button>
        {Object.entries(CAT_LABELS).map(([k, v]) => (
          <button key={k} className={`fchip${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}>
            {v} ({items.filter((i) => i.category === k).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : shown.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Bu kategoride henüz eğitim yok.</p>
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {shown.map((item) => (
            <div className="card" key={item.id} style={{ padding: 18 }}>
              {editingId === item.id ? (
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                  <input className="inp" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  <select className="inp" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as CatalogEntry["category"] })}>
                    {Object.entries(CAT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input className="inp" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
                  <input className="inp" value={editForm.format} onChange={(e) => setEditForm({ ...editForm, format: e.target.value })} />
                  <input className="inp" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} />
                  <div style={{ display: "flex", gap: 10, gridColumn: "1 / -1" }}>
                    <button className="btn btn-teal btn-sm" onClick={() => saveEdit(item.id)}>Kaydet</button>
                    <button className="btn btn-line btn-sm" onClick={() => setEditingId(null)}>Vazgeç</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                      {CAT_LABELS[item.category]} · {item.duration} · {item.format} · {item.level}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                    <button onClick={() => togglePublished(item)} className={`pill ${item.published ? "p-live" : "p-off"}`} style={{ cursor: "pointer" }}>
                      {item.published ? "Yayında" : "Taslak"}
                    </button>
                    <button className="tbtn" title="Düzenle" onClick={() => startEdit(item)}>✎</button>
                    <button className="tbtn danger" title="Sil" onClick={() => remove(item.id)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
