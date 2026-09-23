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

export default function SiteControl({ initialSections }: { initialSections: Section[] }) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  return (
    <div className="grid sa-grid">
      <div>
        <div className="sec-title">
          Site Ağacı
          <small>Sırala, gizle/göster, düzenle</small>
        </div>

        {sections.map((s, i) => (
          <div className={`trow${s.visible ? "" : " dis"}`} key={s.id}>
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
              <button className="tbtn" title="Düzenle" onClick={() => openEditor(s)}>✎</button>
            ) : (
              <button className="tbtn" title="Bu bölümde düzenlenebilir metin yok, sadece gizle/göster" disabled>✎</button>
            )}
          </div>
        ))}

        <div className="note">
          Yeni bölüm ekleme ve canlı sitede fiziksel sıralama, Faz 2'de eklenecek (bkz. Blog &amp; SEO fazı sonrası site geliştirmeleri). Şu an metin/görünürlük değişiklikleri anında canlıya yansır.
        </div>

        {editing && (
          <div id="sec-editor" className="show card" style={{ marginTop: 16 }}>
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
