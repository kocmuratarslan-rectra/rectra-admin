"use client";
import { useEffect, useState } from "react";
import CalendarManager from "./CalendarManager";
import CatalogManager from "./CatalogManager";
import BlogManager from "./BlogManager";
import PopupBannerManager from "./PopupBannerManager";
import CompetencyManager from "./CompetencyManager";
import NeedsAnalysisViewer from "./NeedsAnalysisViewer";

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
  { key: "CALENDAR", label: "Takvim", hint: "" },
  { key: "CATALOG", label: "Katalog", hint: "" },
  { key: "SERVICE", label: "Hizmetler", hint: "Not: Sitedeki 6 ana hizmet kartının metni Süper Admin · Site Kontrolü'nden düzenlenir (kategori/animasyon sistemine bağlı oldukları için sabit sayıdadır). Buradaki kayıtlar ek/alternatif hizmet listeleri için kullanılabilir." },
  { key: "TESTIMONIAL", label: "Referanslar", hint: "Canlı sitede \"Sonuç konuşsun\" bölümünde dönüşümlü gösterilir." },
  { key: "FAQ", label: "SSS", hint: "Canlı sitede \"Merak ettikleriniz\" bölümünde listelenir." },
  { key: "BLOG", label: "Blog", hint: "" },
  { key: "PLATFORM", label: "Platformlar", hint: "Canlı sitede \"Dijital Platformlar\" bölümündeki kartlar. Başlık = platform adı, alt başlık = küçük etiket, açıklama = kart metni. Yayından kaldırırsanız kart sitede görünmez." },
  { key: "INSTRUCTOR", label: "Eğitmenler", hint: "Canlı sitede eğitmen kadromuzu gösteren kartlar. Başlık = ad soyad, alt başlık = unvan, kategori alanı = sertifika/etiket satırı." },
  { key: "VIDEO", label: "Video Vitrini", hint: "Canlı sitede \"Keep In Mind\" video galerisinde gösterilir. Başlık = video başlığı, alt başlık = küçük etiket/kategori, açıklama alanına YouTube video ID'sini veya tam video linkini yazın (ör. https://youtu.be/xxxxxxxxxxx veya sadece xxxxxxxxxxx). Yayından kaldırırsanız video sitede görünmez." },
  { key: "POPUP", label: "Banner Pop Up", hint: "" },
  { key: "COMPETENCY", label: "Yetkinlik Taksonomisi", hint: "Web sitesindeki \"Eğitim İhtiyaç Analizi\" formunda kullanılan yetkinlik ve davranış göstergeleri." },
  { key: "NEEDS_ANALYSIS", label: "İhtiyaç Analizi Başvuruları", hint: "" },
];

const emptyForm = { title: "", subtitle: "", body: "", category: "" };

function getInitialTab() {
  if (typeof window === "undefined") return "SERVICE";
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tab");
  const valid = ["CALENDAR", "CATALOG", "SERVICE", "TESTIMONIAL", "FAQ", "BLOG", "PLATFORM", "INSTRUCTOR", "VIDEO", "POPUP", "COMPETENCY", "NEEDS_ANALYSIS"];
  return t && valid.includes(t) ? t : "SERVICE";
}

export default function ContentManager() {
  const [tab, setTab] = useState(getInitialTab);
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  function friendlyErr(status: number, err: any) {
    if (status === 401) return "Oturum süresi dolmuş — sayfayı yenileyip tekrar giriş yapın.";
    return err?.error || `hata ${status}`;
  }

  async function load(type: string) {
    setLoading(true);
    const res = await fetch(`/api/content/${type}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    if (tab === "CALENDAR" || tab === "CATALOG" || tab === "BLOG" || tab === "POPUP" || tab === "COMPETENCY" || tab === "NEEDS_ANALYSIS") return;
    load(tab);
    setEditingId(null);
  }, [tab]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    try {
      const res = await fetch(`/api/content/${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Eklenemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      setForm(emptyForm);
      showToast("Kayıt eklendi");
      load(tab);
    } catch {
      showToast("Eklenemedi: bağlantı hatası, tekrar deneyin.");
    }
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
    try {
      const res = await fetch(`/api/content/${tab}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Kaydedilemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      setEditingId(null);
      showToast("Değişiklik kaydedildi — birkaç saniye içinde sitede görünür");
      load(tab);
    } catch {
      showToast("Kaydedilemedi: bağlantı hatası, tekrar deneyin.");
    }
  }

  async function togglePublished(item: Item) {
    try {
      const res = await fetch(`/api/content/${tab}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Durum değiştirilemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      load(tab);
    } catch {
      showToast("Durum değiştirilemedi: bağlantı hatası.");
    }
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
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/content/${tab}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Silinemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      showToast("Kayıt silindi");
      load(tab);
    } catch {
      showToast("Silinemedi: bağlantı hatası, tekrar deneyin.");
    }
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
      {activeTab.hint && <div className="note" style={{ marginTop: 0, marginBottom: 18 }}>{activeTab.hint}</div>}

      {tab === "CALENDAR" ? (
        <CalendarManager />
      ) : tab === "CATALOG" ? (
        <CatalogManager />
      ) : tab === "BLOG" ? (
        <BlogManager />
      ) : tab === "POPUP" ? (
        <PopupBannerManager />
      ) : tab === "COMPETENCY" ? (
        <CompetencyManager />
      ) : tab === "NEEDS_ANALYSIS" ? (
        <NeedsAnalysisViewer />
      ) : (
        <ContentTabBody
          tab={tab}
          items={items}
          loading={loading}
          form={form}
          setForm={setForm}
          addItem={addItem}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          startEdit={startEdit}
          saveEdit={saveEdit}
          setEditingId={setEditingId}
          togglePublished={togglePublished}
          move={move}
          remove={remove}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
        />
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}

function ContentTabBody({
  items, loading, form, setForm, addItem, editingId, editForm, setEditForm, startEdit, saveEdit, setEditingId, togglePublished, move, remove, confirmDeleteId, setConfirmDeleteId,
}: any) {
  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr 1fr auto" }}>
          <input className="inp" placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="inp" placeholder="Alt başlık (opsiyonel)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <input className="inp" placeholder="Kategori / etiket (opsiyonel)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
          {items.map((item: Item, idx: number) => (
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
                    <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Kategori / etiket</label>
                    <input className="inp" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
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
                    {item.category && <div style={{ fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".06em", color: "var(--muted)", marginTop: 2 }}>{item.category}</div>}
                    {item.body && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{item.body}</div>}
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
    </>
  );
}
