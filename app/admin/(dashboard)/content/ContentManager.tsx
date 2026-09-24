"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  category?: string | null;
  order: number;
  published: boolean;
};

const TABS = [
  { key: "SERVICE", label: "Hizmetler", hint: "Not: Sitedeki 6 ana hizmet kartının metni Süper Admin · Site Kontrolü'nden düzenlenir (kategori/animasyon sistemine bağlı oldukları için sabit sayıdadır). Buradaki kayıtlar ek/alternatif hizmet listeleri için kullanılabilir." },
  { key: "TESTIMONIAL", label: "Referanslar", hint: "Canlı sitede \"Sonuç konuşsun\" bölümünde dönüşümlü gösterilir." },
  { key: "FAQ", label: "SSS", hint: "Canlı sitede \"Merak ettikleriniz\" bölümünde listelenir." },
  { key: "BLOG", label: "Blog", hint: "Blog & SEO (AI) fazı henüz başlamadı — bu kayıtlar şu an sitede gösterilmiyor." },
];

const emptyForm = { title: "", subtitle: "", body: "", category: "" };

export default function ContentManager() {
  const [tab, setTab] = useState("SERVICE");
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function load(type: string) {
    setLoading(true);
    const res = await fetch(`/api/content/${type}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load(tab);
    setEditingId(null);
  }, [tab]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    await fetch(`/api/content/${tab}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    showToast("Kayıt eklendi");
    load(tab);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      subtitle: item.subtitle || "",
      body: item.body || "",
      category: item.category || "",
    });
  }

  async function saveEdit(id: string) {
    await fetch(`/api/content/${tab}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    showToast("Değişiklik kaydedildi — birkaç saniye içinde sitede görünür");
    load(tab);
  }

  async function togglePublished(item: Item) {
    await fetch(`/api/content/${tab}/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    load(tab);
  }

  async function move(item: Item, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const target = items[idx + dir];
    if (!target) return;
    await Promise.all([
      fetch(`/api/content/${tab}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/content/${tab}/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: item.order }),
      }),
    ]);
    load(tab);
  }

  async function remove(id: string) {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/content/${tab}/${id}`, { method: "DELETE" });
    showToast("Kayıt silindi");
    load(tab);
  }

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <>
      <div className="filters" style={{ marginBottom: 10 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`fchip${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="note" style={{ marginTop: 0, marginBottom: 18 }}>{activeTab.hint}</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr auto" }}>
          <input className="inp" placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="inp" placeholder="Alt başlık (opsiyonel)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <input className="inp" placeholder="Açıklama / içerik" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <button type="submit" className="btn btn-teal">+ Ekle</button>
        </form>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Bu sekmede henüz kayıt yok.</p>
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {items.map((item, idx) => (
            <div className="card" key={item.id} style={{ padding: 18 }}>
              {editingId === item.id ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Başlık</label>
                    <input className="inp" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Alt başlık</label>
                    <input className="inp" value={editForm.subtitle} onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Açıklama / içerik</label>
                    <textarea className="inp" rows={3} value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-teal btn-sm" onClick={() => saveEdit(item.id)}>Kaydet</button>
                    <button className="btn btn-line btn-sm" onClick={() => setEditingId(null)}>Vazgeç</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                    {item.subtitle && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{item.subtitle}</div>}
                    {item.body && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{item.body}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                    <button className="tbtn" title="Yukarı" onClick={() => move(item, -1)} disabled={idx === 0}>↑</button>
                    <button className="tbtn" title="Aşağı" onClick={() => move(item, 1)} disabled={idx === items.length - 1}>↓</button>
                    <button
                      onClick={() => togglePublished(item)}
                      className={`pill ${item.published ? "p-live" : "p-off"}`}
                      style={{ cursor: "pointer" }}
                    >
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
