"use client";
import { useEffect, useState } from "react";

type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: string | null;
  order: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
};

const CAT_LABELS: Record<string, string> = {
  AI: "Yapay Zekâ",
  LIDER: "Liderlik",
  SOFT: "Soft Skills",
  IK: "İK",
  ALIM: "İşe Alım",
  KOC: "Koçluk",
  GENEL: "Genel",
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  seoTitle: "",
  seoDescription: "",
  category: "GENEL",
  published: true,
};

function slugify(input: string) {
  const map: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export default function BlogManager() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSlugTouched, setEditSlugTouched] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  function friendlyErr(status: number, err: any) {
    if (status === 401) return "Oturum süresi dolmuş — sayfayı yenileyip tekrar giriş yapın.";
    if (status === 409) return err?.message || "Bu slug zaten kullanılıyor.";
    return err?.error || `hata ${status}`;
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/content/BLOG");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const slug = form.slug.trim() || slugify(form.title);
    if (!slug) {
      showToast("Slug oluşturulamadı — başlık en az bir harf/rakam içermeli.");
      return;
    }
    try {
      const res = await fetch("/api/content/BLOG", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug,
          excerpt: form.excerpt || null,
          content: form.content || null,
          coverImage: form.coverImage || null,
          seoTitle: form.seoTitle || null,
          seoDescription: form.seoDescription || null,
          category: form.category,
          published: form.published,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Eklenemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      setForm(emptyForm);
      setSlugTouched(false);
      setShowForm(false);
      showToast("Blog yazısı eklendi");
      load();
    } catch {
      showToast("Eklenemedi: bağlantı hatası, tekrar deneyin.");
    }
  }

  function startEdit(item: BlogPost) {
    setEditingId(item.id);
    setEditSlugTouched(true);
    setEditForm({
      title: item.title,
      slug: item.slug || "",
      excerpt: item.excerpt || "",
      content: item.content || "",
      coverImage: item.coverImage || "",
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      category: item.category || "GENEL",
      published: item.published,
    });
  }

  async function saveEdit(id: string) {
    const slug = editForm.slug.trim() || slugify(editForm.title);
    try {
      const res = await fetch(`/api/content/BLOG/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          slug,
          excerpt: editForm.excerpt || null,
          content: editForm.content || null,
          coverImage: editForm.coverImage || null,
          seoTitle: editForm.seoTitle || null,
          seoDescription: editForm.seoDescription || null,
          category: editForm.category,
          published: editForm.published,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Kaydedilemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      setEditingId(null);
      showToast("Yazı güncellendi — birkaç saniye içinde sitede görünür");
      load();
    } catch {
      showToast("Kaydedilemedi: bağlantı hatası, tekrar deneyin.");
    }
  }

  async function togglePublished(item: BlogPost) {
    try {
      const res = await fetch(`/api/content/BLOG/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Durum değiştirilemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      load();
    } catch {
      showToast("Durum değiştirilemedi: bağlantı hatası.");
    }
  }

  async function remove(id: string) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/content/BLOG/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Silinemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      showToast("Yazı silindi");
      load();
    } catch {
      showToast("Silinemedi: bağlantı hatası, tekrar deneyin.");
    }
  }

  const BLOG_BASE = "https://rectra-site.vercel.app/blog";

  return (
    <>
      <div className="note" style={{ marginTop: 0, marginBottom: 18 }}>
        Yayınladığınız yazılar canlı sitede <b>{BLOG_BASE}/[slug]</b> adresinde, arama motorları için başlık/açıklama (SEO) etiketleriyle birlikte görünür. SEO başlık/açıklama boş bırakılırsa otomatik olarak başlık ve özet kullanılır.
      </div>

      {!showForm ? (
        <button className="btn btn-teal" style={{ marginBottom: 20 }} onClick={() => setShowForm(true)}>
          + Yeni Yazı
        </button>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={addItem} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
              <input
                className="inp"
                placeholder="Başlık"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                }}
              />
              <select className="inp" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CAT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
                Slug ({BLOG_BASE}/…)
              </label>
              <input
                className="inp"
                placeholder="slug-otomatik-baslikdan-uretilir"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
              />
            </div>
            <textarea
              className="inp"
              rows={2}
              placeholder="Özet (liste kartlarında ve meta açıklamada gösterilir, ~160 karakter önerilir)"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
            <input
              className="inp"
              placeholder="Kapak görseli URL (opsiyonel)"
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            />
            <textarea
              className="inp"
              rows={10}
              placeholder={"İçerik — basit biçimlendirme desteklenir:\n## Alt başlık\n**kalın metin**\n- madde 1\n- madde 2\n[bağlantı metni](https://...)\n\nParagraflar boş satırla ayrılır."}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <details>
              <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>SEO başlık/açıklama özelleştir (opsiyonel)</summary>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <input className="inp" placeholder="SEO başlığı (boşsa yazı başlığı kullanılır)" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
                <textarea className="inp" rows={2} placeholder="SEO açıklaması (boşsa özet kullanılır)" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
              </div>
            </details>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Hemen yayınla
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-teal">Kaydet</button>
              <button type="button" className="btn btn-line" onClick={() => { setShowForm(false); setForm(emptyForm); setSlugTouched(false); }}>Vazgeç</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Henüz blog yazısı yok.</p>
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {items.map((item) => (
            <div className="card" key={item.id} style={{ padding: 18 }}>
              {editingId === item.id ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
                    <input
                      className="inp"
                      value={editForm.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setEditForm((f) => ({ ...f, title, slug: editSlugTouched ? f.slug : slugify(title) }));
                      }}
                    />
                    <select className="inp" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                      {Object.entries(CAT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    className="inp"
                    value={editForm.slug}
                    onChange={(e) => { setEditSlugTouched(true); setEditForm({ ...editForm, slug: slugify(e.target.value) }); }}
                  />
                  <textarea className="inp" rows={2} value={editForm.excerpt} onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })} placeholder="Özet" />
                  <input className="inp" value={editForm.coverImage} onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })} placeholder="Kapak görseli URL" />
                  <textarea className="inp" rows={10} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} placeholder="İçerik" />
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted)" }}>SEO başlık/açıklama</summary>
                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                      <input className="inp" placeholder="SEO başlığı" value={editForm.seoTitle} onChange={(e) => setEditForm({ ...editForm, seoTitle: e.target.value })} />
                      <textarea className="inp" rows={2} placeholder="SEO açıklaması" value={editForm.seoDescription} onChange={(e) => setEditForm({ ...editForm, seoDescription: e.target.value })} />
                    </div>
                  </details>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={editForm.published} onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })} />
                    Yayında
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-teal btn-sm" onClick={() => saveEdit(item.id)}>Kaydet</button>
                    <button className="btn btn-line btn-sm" onClick={() => setEditingId(null)}>Vazgeç</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                      {CAT_LABELS[item.category || "GENEL"] || item.category} · /{item.slug}
                    </div>
                    {item.excerpt && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{item.excerpt}</div>}
                    {item.published && item.slug && (
                      <a href={`${BLOG_BASE}/${item.slug}`} target="_blank" rel="noopener" style={{ fontSize: 12.5, color: "var(--teal, #0FA99A)", fontWeight: 700, marginTop: 6, display: "inline-block" }}>
                        Yazıyı görüntüle →
                      </a>
                    )}
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

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
