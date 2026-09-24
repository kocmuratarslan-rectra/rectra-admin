"use client";
import { useMemo, useState } from "react";

type Section = {
  id: string;
  key: string;
  icon: string;
  name: string;
  color: string;
  order: number;
  visible: boolean;
  fields: Record<string, string>;
};

type CustomSection = {
  id: string;
  title: string;
  body: string;
  icon: string;
  color: string;
  order: number;
  visible: boolean;
};

const emptyCustomForm = { title: "", body: "", icon: "✨", color: "#0FA99A" };

export default function SiteControl({
  initialSections,
  initialCustomSections,
}: {
  initialSections: Section[];
  initialCustomSections: CustomSection[];
}) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [customSections, setCustomSections] = useState<CustomSection[]>(initialCustomSections);
  const [customForm, setCustomForm] = useState(emptyCustomForm);
  const [customEditingId, setCustomEditingId] = useState<string | null>(null);
  const [customEditForm, setCustomEditForm] = useState(emptyCustomForm);
  const [addingCustom, setAddingCustom] = useState(false);
  const [confirmDeleteCustomId, setConfirmDeleteCustomId] = useState<string | null>(null);

  const editing = useMemo(() => sections.find((s) => s.id === editingId) || null, [sections, editingId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  async function toggleVisible(s: Section) {
    const next = !s.visible;
    setSections((prev) => prev.map((x) => (x.id === s.id ? { ...x, visible: next } : x)));
    await fetch(`/api/sections/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: next }),
    });
    showToast(next ? `"${s.name}" canlı sitede yayına alındı` : `"${s.name}" canlı siteden gizlendi`);
  }

  async function move(index: number, dir: -1 | 1) {
    const arr = [...sections];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setSections(arr);
    await fetch("/api/sections/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: arr.map((s) => s.id) }),
    });
  }

  function openEditor(s: Section) {
    setEditingId(s.id);
    setDraftFields({ ...s.fields });
  }

  function closeEditor() {
    setEditingId(null);
    setDraftFields({});
  }

  async function saveEditor() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch(`/api/sections/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: draftFields }),
    });
    setSaving(false);
    if (res.ok) {
      setSections((prev) => prev.map((x) => (x.id === editing.id ? { ...x, fields: draftFields } : x)));
      showToast(`"${editing.name}" güncellendi — birkaç saniye içinde sitede görünecek`);
      closeEditor();
    } else {
      showToast("Kaydedilemedi, tekrar deneyin.");
    }
  }

  async function addCustomSection(e: React.FormEvent) {
    e.preventDefault();
    if (!customForm.title || !customForm.body) return;
    const res = await fetch("/api/custom-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customForm),
    });
    if (res.ok) {
      const data = await res.json();
      setCustomSections((prev) => [...prev, data.section]);
      setCustomForm(emptyCustomForm);
      setAddingCustom(false);
      showToast(`"${data.section.title}" yeni bölüm olarak siteye eklendi`);
    } else {
      showToast("Bölüm eklenemedi, tekrar deneyin.");
    }
  }

  function startCustomEdit(s: CustomSection) {
    setCustomEditingId(s.id);
    setCustomEditForm({ title: s.title, body: s.body, icon: s.icon, color: s.color });
  }

  async function saveCustomEdit(id: string) {
    const res = await fetch(`/api/custom-sections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customEditForm),
    });
    if (res.ok) {
      setCustomSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...customEditForm } : s)));
      setCustomEditingId(null);
      showToast("Bölüm güncellendi — birkaç saniye içinde sitede görünür");
    } else {
      showToast("Kaydedilemedi, tekrar deneyin.");
    }
  }

  async function toggleCustomVisible(s: CustomSection) {
    const next = !s.visible;
    setCustomSections((prev) => prev.map((x) => (x.id === s.id ? { ...x, visible: next } : x)));
    await fetch(`/api/custom-sections/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: next }),
    });
    showToast(next ? `"${s.title}" canlı sitede yayına alındı` : `"${s.title}" canlı siteden gizlendi`);
  }

  async function moveCustom(index: number, dir: -1 | 1) {
    const arr = [...customSections];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setCustomSections(arr);
    await Promise.all(
      arr.map((s, i) =>
        fetch(`/api/custom-sections/${s.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
        })
      )
    );
  }

  async function removeCustomSection(id: string) {
    setConfirmDeleteCustomId(null);
    const res = await fetch(`/api/custom-sections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCustomSections((prev) => prev.filter((s) => s.id !== id));
      showToast("Bölüm silindi");
    }
  }

  return (
    <div className="grid sa-grid">
      <div>
        <div className="sec-title">
          Site Ağacı
          <small>Sırala, gizle/göster, düzenle</small>
        </div>

        {sections.map((s, i) => (
          <div key={s.id}>
            <div className={`trow${s.visible ? "" : " dis"}`}>
              <span className="ticon" style={{ background: s.color, color: "#fff" }}>{s.icon}</span>
              <span className="tname">
                {s.name}
                <small>{s.key}</small>
              </span>
              <button className="tbtn" title="Yukarı" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="tbtn" title="Aşağı" onClick={() => move(i, 1)} disabled={i === sections.length - 1}>↓</button>
              <label className="tgl" title={s.visible ? "Gizle" : "Yayına al"}>
                <input type="checkbox" checked={s.visible} onChange={() => toggleVisible(s)} />
                <i></i>
              </label>
              {Object.keys(s.fields).length > 0 ? (
                <button className="tbtn" title="Düzenle" onClick={() => (editingId === s.id ? closeEditor() : openEditor(s))}>✎</button>
              ) : (
                <button className="tbtn" title="Bu bölümde düzenlenebilir metin yok, sadece gizle/göster" disabled>✎</button>
              )}
            </div>

            {(s.key === "calendar" || s.key === "services") && (
              <div className="note" style={{ marginTop: 6, marginBottom: 6 }}>
                {s.key === "calendar"
                  ? "Buradan yalnızca bölüm başlığı/alt başlığı ve görünürlüğü değişir. Tek tek eğitimleri eklemek, silmek veya tarihini değiştirmek için: İçerik (Hizmetler) → Takvim sekmesine gidin."
                  : "Buradan yalnızca bölüm görünürlüğü değişir. Hizmet kartlarının metnini düzenlemek için aşağıdaki kartların üzerine tıklayın ya da İçerik (Hizmetler) → Hizmetler sekmesini kullanın."}
                {s.key === "calendar" && (
                  <>
                    {" "}
                    <a href="/admin/content?tab=CALENDAR" style={{ color: "var(--teal, #0FA99A)", fontWeight: 700 }}>
                      Takvim yönetimine git →
                    </a>
                  </>
                )}
              </div>
            )}

            {editingId === s.id && editing && (
              <div id="sec-editor" className="show card" style={{ marginTop: 8, marginBottom: 12 }}>
                <div className="sec-title" style={{ margin: 0 }}>
                  {editing.icon} {editing.name}
                  <small>{editing.key}</small>
                </div>
                {Object.entries(draftFields).map(([field, value]) => (
                  <div key={field}>
                    <label>{field}</label>
                    {value.length > 80 ? (
                      <textarea
                        className="inp"
                        rows={3}
                        value={value}
                        onChange={(e) => setDraftFields((prev) => ({ ...prev, [field]: e.target.value }))}
                      />
                    ) : (
                      <input
                        className="inp"
                        value={value}
                        onChange={(e) => setDraftFields((prev) => ({ ...prev, [field]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button className="btn btn-teal" onClick={saveEditor} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}
                  </button>
                  <button className="btn btn-line" onClick={closeEditor} disabled={saving}>Vazgeç</button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="note">
          Aşağıdaki 14 bölüm sitenin sabit tasarımına bağlıdır (sırası, metni ve görünürlüğü buradan yönetilir). Tamamen yeni bir bölüm eklemek için aşağıdaki "Özel Bölümler" alanını kullanın — sitede Teklif Al bölümünden hemen önce görünür.
        </div>

        <div className="sec-title" style={{ marginTop: 28 }}>
          Özel Bölümler
          <small>Tamamen yeni ana sayfa içeriği — sizin eklediğiniz</small>
        </div>

        {customSections.length === 0 && !addingCustom && (
          <div className="note" style={{ marginBottom: 12 }}>Henüz özel bölüm eklemediniz.</div>
        )}

        {customSections.map((s, i) => (
          <div key={s.id}>
            {customEditingId === s.id ? (
              <div className="card" style={{ marginBottom: 10, padding: 16 }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <input className="inp" placeholder="Başlık" value={customEditForm.title} onChange={(e) => setCustomEditForm({ ...customEditForm, title: e.target.value })} />
                  <textarea className="inp" rows={3} placeholder="Metin" value={customEditForm.body} onChange={(e) => setCustomEditForm({ ...customEditForm, body: e.target.value })} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <input className="inp" style={{ width: 70 }} value={customEditForm.icon} onChange={(e) => setCustomEditForm({ ...customEditForm, icon: e.target.value })} />
                    <input className="inp" type="color" style={{ width: 60, padding: 4 }} value={customEditForm.color} onChange={(e) => setCustomEditForm({ ...customEditForm, color: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-teal btn-sm" onClick={() => saveCustomEdit(s.id)}>Kaydet</button>
                    <button className="btn btn-line btn-sm" onClick={() => setCustomEditingId(null)}>Vazgeç</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`trow${s.visible ? "" : " dis"}`}>
                <span className="ticon" style={{ background: s.color, color: "#fff" }}>{s.icon}</span>
                <span className="tname">
                  {s.title}
                  <small>özel bölüm</small>
                </span>
                {confirmDeleteCustomId === s.id ? (
                  <>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Silinsin mi?</span>
                    <button className="btn btn-line btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }} onClick={() => removeCustomSection(s.id)}>Evet, sil</button>
                    <button className="btn btn-line btn-sm" onClick={() => setConfirmDeleteCustomId(null)}>Vazgeç</button>
                  </>
                ) : (
                  <>
                    <button className="tbtn" title="Yukarı" onClick={() => moveCustom(i, -1)} disabled={i === 0}>↑</button>
                    <button className="tbtn" title="Aşağı" onClick={() => moveCustom(i, 1)} disabled={i === customSections.length - 1}>↓</button>
                    <label className="tgl" title={s.visible ? "Gizle" : "Yayına al"}>
                      <input type="checkbox" checked={s.visible} onChange={() => toggleCustomVisible(s)} />
                      <i></i>
                    </label>
                    <button className="tbtn" title="Düzenle" onClick={() => startCustomEdit(s)}>✎</button>
                    <button className="tbtn danger" title="Sil" onClick={() => setConfirmDeleteCustomId(s.id)}>✕</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {addingCustom ? (
          <form onSubmit={addCustomSection} className="card" style={{ marginTop: 10, padding: 16 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <input className="inp" placeholder="Bölüm başlığı" value={customForm.title} onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })} />
              <textarea className="inp" rows={3} placeholder="Bölüm metni" value={customForm.body} onChange={(e) => setCustomForm({ ...customForm, body: e.target.value })} />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>İkon</label>
                <input className="inp" style={{ width: 70 }} value={customForm.icon} onChange={(e) => setCustomForm({ ...customForm, icon: e.target.value })} />
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Renk</label>
                <input className="inp" type="color" style={{ width: 60, padding: 4 }} value={customForm.color} onChange={(e) => setCustomForm({ ...customForm, color: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn btn-teal btn-sm">Bölümü Ekle ve Yayınla</button>
                <button type="button" className="btn btn-line btn-sm" onClick={() => { setAddingCustom(false); setCustomForm(emptyCustomForm); }}>Vazgeç</button>
              </div>
            </div>
          </form>
        ) : (
          <button className="btn btn-line" style={{ marginTop: 10 }} onClick={() => setAddingCustom(true)}>+ Yeni Bölüm Ekle</button>
        )}
      </div>

      <div className="prev-frame">
        <div className="prev-head">
          <i></i><i></i><i></i>
          <span>rectra-site.vercel.app — ÖNİZLEME</span>
        </div>
        <div className="prev-body">
          {sections.map((s) => (
            <div className={`pblock${s.visible ? "" : " dis"}`} key={s.id} style={{ background: s.color }}>
              <span>{s.icon} {s.name}</span>
              <span className="ptag">{s.visible ? "YAYINDA" : "GİZLİ"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
