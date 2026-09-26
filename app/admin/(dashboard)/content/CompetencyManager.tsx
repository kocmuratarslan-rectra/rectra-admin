"use client";
import { useEffect, useState } from "react";

type Indicator = { id?: string; text: string; order: number; active?: boolean };
type Competency = {
  id: string;
  name: string;
  category: string;
  order: number;
  active: boolean;
  indicators: Indicator[];
};

const CAT_LABELS: Record<string, string> = {
  AI: "Yapay Zekâ", LIDER: "Liderlik", SOFT: "Soft Skills", IK: "İK", ALIM: "İşe Alım", KOC: "Koçluk",
};
const CATS = Object.keys(CAT_LABELS);

export default function CompetencyManager() {
  const [items, setItems] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Competency>>({});
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("AI");
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/competencies");
    const data = await res.json();
    const list: Competency[] = data.competencies || [];
    setItems(list);
    const d: Record<string, Competency> = {};
    list.forEach((c) => { d[c.id] = JSON.parse(JSON.stringify(c)); });
    setDrafts(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function updateDraft(id: string, patch: Partial<Competency>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }
  function updateIndicator(id: string, idx: number, text: string) {
    setDrafts((prev) => {
      const comp = { ...prev[id] };
      comp.indicators = comp.indicators.map((ind, i) => (i === idx ? { ...ind, text } : ind));
      return { ...prev, [id]: comp };
    });
  }
  function addIndicator(id: string) {
    setDrafts((prev) => {
      const comp = { ...prev[id] };
      comp.indicators = [...comp.indicators, { text: "", order: comp.indicators.length + 1 }];
      return { ...prev, [id]: comp };
    });
  }
  function removeIndicator(id: string, idx: number) {
    setDrafts((prev) => {
      const comp = { ...prev[id] };
      comp.indicators = comp.indicators.filter((_, i) => i !== idx);
      return { ...prev, [id]: comp };
    });
  }

  async function saveCompetency(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    const indicators = draft.indicators.filter((i) => i.text.trim());
    try {
      const res = await fetch(`/api/competencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          category: draft.category,
          active: draft.active,
          indicators: indicators.map((i, idx) => ({ id: i.id, text: i.text, order: idx + 1 })),
        }),
      });
      if (!res.ok) { showToast("Kaydedilemedi"); return; }
      showToast("Yetkinlik güncellendi");
      load();
    } catch {
      showToast("Bağlantı hatası");
    }
  }

  async function addCompetency(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/competencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), category: newCat, indicators: [] }),
      });
      if (!res.ok) { showToast("Eklenemedi"); return; }
      setNewName("");
      showToast("Yetkinlik eklendi — şimdi davranış göstergesi ekleyebilirsiniz");
      load();
    } catch {
      showToast("Bağlantı hatası");
    }
  }

  async function remove(id: string) {
    setConfirmDeleteId(null);
    await fetch(`/api/competencies/${id}`, { method: "DELETE" });
    showToast("Yetkinlik silindi");
    load();
  }

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 18, maxWidth: 760 }}>
        Web sitesindeki "Eğitim İhtiyaç Analizi" formunda ziyaretçilere gösterilen yetkinlik seti ve davranış
        göstergeleri. Bir yetkinliği pasif yaparsanız formda görünmez.
      </p>

      <form onSubmit={addCompetency} className="card" style={{ padding: 18, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input className="inp" style={{ flex: 1, minWidth: 200 }} placeholder="Yeni yetkinlik adı (ör. Zaman Yönetimi)" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <select className="inp" style={{ width: 160 }} value={newCat} onChange={(e) => setNewCat(e.target.value)}>
          {CATS.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
        <button className="btn btn-teal" type="submit">+ Yetkinlik Ekle</button>
      </form>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((c) => {
            const draft = drafts[c.id] || c;
            return (
              <div key={c.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <input className="inp" style={{ flex: 1, minWidth: 180, fontWeight: 700 }} value={draft.name} onChange={(e) => updateDraft(c.id, { name: e.target.value })} />
                  <select className="inp" style={{ width: 150 }} value={draft.category} onChange={(e) => updateDraft(c.id, { category: e.target.value })}>
                    {CATS.map((cat) => <option key={cat} value={cat}>{CAT_LABELS[cat]}</option>)}
                  </select>
                  <button
                    className={`pill ${draft.active ? "p-won" : "p-new"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => updateDraft(c.id, { active: !draft.active })}
                  >
                    {draft.active ? "Aktif" : "Pasif"}
                  </button>
                  {confirmDeleteId === c.id ? (
                    <>
                      <button className="btn btn-line btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }} onClick={() => remove(c.id)}>Evet, sil</button>
                      <button className="btn btn-line btn-sm" onClick={() => setConfirmDeleteId(null)}>Vazgeç</button>
                    </>
                  ) : (
                    <button className="tbtn danger" title="Yetkinliği sil" onClick={() => setConfirmDeleteId(c.id)}>✕</button>
                  )}
                </div>

                <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 8 }}>
                  Davranış Göstergeleri
                </label>
                <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                  {draft.indicators.map((ind, idx) => (
                    <div key={ind.id || idx} style={{ display: "flex", gap: 8 }}>
                      <input className="inp" style={{ flex: 1 }} value={ind.text} onChange={(e) => updateIndicator(c.id, idx, e.target.value)} placeholder="Gözlemlenebilir davranış ifadesi" />
                      <button className="tbtn danger" title="Sil" onClick={() => removeIndicator(c.id, idx)}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-line btn-sm" onClick={() => addIndicator(c.id)}>+ Gösterge Ekle</button>
                  <button className="btn btn-teal btn-sm" onClick={() => saveCompetency(c.id)}>Kaydet</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
