"use client";
import { useEffect, useRef, useState } from "react";

type PopupBanner = {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const emptyForm = { imageUrl: "", linkUrl: "", altText: "" };

export default function PopupBannerManager() {
  const [banners, setBanners] = useState<PopupBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/popup-banner");
    const data = await res.json();
    setBanners(data.banners || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("Görsel çok büyük — 8MB altında bir dosya seçin");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, filename: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`Yüklenemedi: ${data?.error || res.status}`);
        return;
      }
      setForm((f) => ({ ...f, imageUrl: data.url }));
      showToast("Görsel yüklendi");
    } catch {
      showToast("Yüklenemedi: bağlantı hatası");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim() || !form.linkUrl.trim()) {
      showToast("Görsel ve link zorunlu");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/popup-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: form.imageUrl.trim(),
          linkUrl: form.linkUrl.trim(),
          altText: form.altText.trim() || null,
          active: banners.length === 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Eklenemedi: ${err?.error || res.status}`);
        return;
      }
      setForm(emptyForm);
      showToast("Banner eklendi");
      load();
    } catch {
      showToast("Eklenemedi: bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(id: string, active: boolean) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active } : active ? { ...b, active: b.id === id } : b)));
    try {
      const res = await fetch(`/api/popup-banner/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        showToast("Durum güncellenemedi");
        load();
        return;
      }
      showToast(active ? "Banner yayınlandı — sitede görünüyor" : "Banner yayından kaldırıldı");
      load();
    } catch {
      showToast("Bağlantı hatası");
      load();
    }
  }

  async function remove(id: string) {
    setConfirmDeleteId(null);
    await fetch(`/api/popup-banner/${id}`, { method: "DELETE" });
    showToast("Banner silindi");
    load();
  }

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 18, maxWidth: 720 }}>
        Ziyaretçi siteye ilk girdiğinde ortada beliren, tıklandığında verdiğiniz linke götüren pop-up banner.
        Aynı anda yalnızca <b>yayında</b> işaretli tek banner sitede gösterilir.
      </p>

      <form onSubmit={addBanner} className="card" style={{ padding: 20, marginBottom: 24, display: "grid", gap: 14, maxWidth: 560 }}>
        <div>
          <label className="f-label" style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>Görsel</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-line btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Yükleniyor..." : "📁 Bilgisayardan Yükle"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFilePick} style={{ display: "none" }} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>veya URL yapıştırın →</span>
          </div>
          <input
            className="inp"
            style={{ marginTop: 8 }}
            placeholder="https://... görsel URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Önizleme" style={{ marginTop: 10, maxWidth: "100%", maxHeight: 220, borderRadius: 10, border: "1px solid var(--line)" }} />
          )}
        </div>
        <div>
          <label className="f-label" style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>Tıklanınca gidilecek link</label>
          <input
            className="inp"
            placeholder="https://rectra.com.tr/kampanya"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="f-label" style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700 }}>Alternatif metin (opsiyonel)</label>
          <input
            className="inp"
            placeholder="Örn: Yeni dönem kampanyası"
            value={form.altText}
            onChange={(e) => setForm({ ...form, altText: e.target.value })}
          />
        </div>
        <button className="btn btn-teal" type="submit" disabled={saving} style={{ justifySelf: "start" }}>
          {saving ? "Ekleniyor..." : "+ Banner Ekle"}
        </button>
      </form>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : banners.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Henüz banner eklenmedi.</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {banners.map((b) => (
            <div key={b.id} className="card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
              <img src={b.imageUrl} alt={b.altText || ""} style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, wordBreak: "break-all" }}>{b.linkUrl}</div>
                {b.altText && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{b.altText}</div>}
                <span className={`pill ${b.active ? "p-won" : "p-new"}`} style={{ marginTop: 8, display: "inline-block" }}>
                  {b.active ? "● Yayında" : "Pasif"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!b.active && (
                  <button className="btn btn-teal btn-sm" onClick={() => setActive(b.id, true)}>Yayınla</button>
                )}
                {b.active && (
                  <button className="btn btn-line btn-sm" onClick={() => setActive(b.id, false)}>Yayından Kaldır</button>
                )}
                {confirmDeleteId === b.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-line btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }} onClick={() => remove(b.id)}>Evet, sil</button>
                    <button className="btn btn-line btn-sm" onClick={() => setConfirmDeleteId(null)}>Vazgeç</button>
                  </div>
                ) : (
                  <button className="tbtn danger" title="Sil" onClick={() => setConfirmDeleteId(b.id)}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
