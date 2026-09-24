"use client";
import { useEffect, useState } from "react";

type EventItem = {
  id: string;
  title: string;
  category: "AI" | "LIDER" | "SOFT" | "IK" | "ALIM" | "KOC";
  date: string;
  duration: string;
  location: string;
  hot: boolean;
  seatText: string;
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

const emptyForm = {
  title: "",
  category: "AI" as EventItem["category"],
  date: "",
  duration: "",
  location: "",
  hot: false,
  seatText: "Kontenjan açık",
};

export default function CalendarManager() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/calendar");
    const data = await res.json();
    setItems(data.events || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) return;
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    showToast("Etkinlik eklendi");
    load();
  }

  function startEdit(item: EventItem) {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      category: item.category,
      date: item.date.slice(0, 10),
      duration: item.duration,
      location: item.location,
      hot: item.hot,
      seatText: item.seatText,
    });
  }

  async function saveEdit(id: string) {
    await fetch(`/api/calendar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    showToast("Etkinlik güncellendi — birkaç saniye içinde sitede görünür");
    load();
  }

  async function togglePublished(item: EventItem) {
    await fetch(`/api/calendar/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    load();
  }

  async function remove(id: string) {
    setConfirmDeleteId(null);
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    showToast("Etkinlik silindi");
    load();
  }

  return (
    <>
      <div className="note" style={{ marginTop: 0, marginBottom: 18 }}>
        Canlı sitede "Yaklaşan açık eğitimler" bölümünde tarihe göre sıralı listelenir. Geri sayım ve koltuk rozeti otomatik hesaplanır.
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto" }}>
          <input className="inp" placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="inp" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventItem["category"] })}>
            {Object.entries(CAT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input className="inp" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input className="inp" placeholder="Süre (1 Gün)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <input className="inp" placeholder="Lokasyon" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button type="submit" className="btn btn-teal">+ Ekle</button>
        </form>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Henüz etkinlik yok.</p>
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {items.map((item) => (
            <div className="card" key={item.id} style={{ padding: 18 }}>
              {editingId === item.id ? (
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                  <input className="inp" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  <select className="inp" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as EventItem["category"] })}>
                    {Object.entries(CAT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input className="inp" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                  <input className="inp" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
                  <input className="inp" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                  <input className="inp" value={editForm.seatText} onChange={(e) => setEditForm({ ...editForm, seatText: e.target.value })} placeholder="Koltuk durumu metni" />
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={editForm.hot} onChange={(e) => setEditForm({ ...editForm, hot: e.target.checked })} />
                    Öne çıkar (kırmızı rozet)
                  </label>
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
                      {new Date(item.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })} · {CAT_LABELS[item.category]} · {item.duration} · {item.location} · {item.seatText}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                    {confirmDeleteId === item.id ? (
                      <>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>Silinsin mi?</span>
                        <button className="btn btn-line btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }} onClick={() => remove(item.id)}>Evet, sil</button>
                        <button className="btn btn-line btn-sm" onClick={() => setConfirmDeleteId(null)}>Vazgeç</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => togglePublished(item)} className={`pill ${item.published ? "p-live" : "p-off"}`} style={{ cursor: "pointer" }}>
                          {item.published ? "Yayında" : "Taslak"}
                        </button>
                        <button className="tbtn" title="Düzenle" onClick={() => startEdit(item)}>✎</button>
                        <button className="tbtn danger" title="Sil" onClick={() => setConfirmDeleteId(item.id)}>✕</button>
                      </>
                    )}
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
