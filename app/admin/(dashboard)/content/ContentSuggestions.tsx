"use client";
import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string;
  category: string | null;
  evidence: any;
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

function EvidenceView({ evidence }: { evidence: any }) {
  if (!evidence || typeof evidence !== "object") return null;
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginTop: 10, fontSize: 13 }}>
      <div style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
        📊 Kanıt / Veri Kaynakları
      </div>
      {evidence.summary && <p style={{ marginBottom: 8 }}>{evidence.summary}</p>}
      {Array.isArray(evidence.keywords) && evidence.keywords.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <b>Arama talebi:</b>{" "}
          {evidence.keywords.map((k: any, i: number) => (
            <span key={i}>
              {i > 0 && ", "}
              "{k.keyword}" ({k.monthly_volume ?? "?"}/ay{k.cpc_usd ? `, $${k.cpc_usd} CPC` : ""})
            </span>
          ))}
        </div>
      )}
      {Array.isArray(evidence.competitors) && evidence.competitors.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <b>Öne çıkan rakipler:</b>{" "}
          {evidence.competitors.map((c: any, i: number) => (
            <span key={i}>
              {i > 0 && ", "}
              {c.domain}
              {c.avg_position ? ` (sıra ~${c.avg_position})` : ""}
            </span>
          ))}
        </div>
      )}
      {Array.isArray(evidence.ai_citations) && evidence.ai_citations.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <b>AI özetlerinde en çok anılan kaynaklar:</b>{" "}
          {evidence.ai_citations.map((c: any, i: number) => (
            <span key={i}>
              {i > 0 && ", "}
              {c.domain} ({c.citations})
            </span>
          ))}
        </div>
      )}
      {Array.isArray(evidence.sources) && evidence.sources.length > 0 && (
        <div>
          <b>Kaynaklar:</b>{" "}
          {evidence.sources.map((s: any, i: number) => (
            <span key={i}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener" style={{ color: "var(--teal-deep, #0FA99A)" }}>{s.title || s.url}</a>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContentSuggestions() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "GENEL" });
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  function friendlyErr(status: number, err: any) {
    if (status === 401) return "Oturum süresi dolmuş — sayfayı yenileyip tekrar giriş yapın.";
    if (status === 409) return err?.message || "Bu içerik zaten karara bağlanmış.";
    return err?.error || `hata ${status}`;
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/automation/content-suggestions");
      if (!res.ok) { setItems([]); setLoading(false); return; }
      const data = await res.json();
      setItems(data.suggestions || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(s: Suggestion) {
    setEditingId(s.id);
    setEditForm({
      title: s.title,
      slug: s.slug || "",
      excerpt: s.excerpt || "",
      content: s.content,
      category: s.category || "GENEL",
    });
  }

  async function publish(id: string) {
    try {
      const body = editingId === id
        ? { action: "approve", ...editForm }
        : { action: "approve" };
      const res = await fetch(`/api/automation/content-suggestions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Yayınlanamadı: ${friendlyErr(res.status, err)}`);
        return;
      }
      setEditingId(null);
      showToast("Yayınlandı — birkaç saniye içinde blogda görünür");
      load();
    } catch {
      showToast("Yayınlanamadı: bağlantı hatası.");
    }
  }

  async function reject(id: string) {
    try {
      const res = await fetch(`/api/automation/content-suggestions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Reddedilemedi: ${friendlyErr(res.status, err)}`);
        return;
      }
      showToast("Öneri reddedildi");
      load();
    } catch {
      showToast("Reddedilemedi: bağlantı hatası.");
    }
  }

  if (!loading && items.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 24, borderColor: "var(--teal-deep, #0FA99A)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔎 Onay Bekleyen Pazar Analizi Önerileri</div>
      <div className="note" style={{ marginTop: 0, marginBottom: 16 }}>
        3 günde bir çalışan pazar/rakip analizi tarafından hazırlandı — hiçbiri sizin onayınız olmadan siteye çıkmaz. Dilerseniz yayınlamadan önce metni düzenleyebilirsiniz.
      </div>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : (
        <div className="grid" style={{ gap: 14 }}>
          {items.map((s) => (
            <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18 }}>
              {editingId === s.id ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
                    <input className="inp" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                    <select className="inp" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                      {Object.entries(CAT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <input className="inp" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} placeholder="slug" />
                  <textarea className="inp" rows={2} value={editForm.excerpt} onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })} placeholder="Özet" />
                  <textarea className="inp" rows={10} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} placeholder="İçerik" />
                  <EvidenceView evidence={s.evidence} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-teal btn-sm" onClick={() => publish(s.id)}>Kaydet ve Yayınla</button>
                    <button className="btn btn-line btn-sm" onClick={() => setEditingId(null)}>Vazgeç</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                        {CAT_LABELS[s.category || "GENEL"] || s.category} · {new Date(s.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                      </div>
                      {s.excerpt && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{s.excerpt}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flex: "none" }}>
                      <button className="btn btn-teal btn-sm" onClick={() => publish(s.id)}>Yayınla</button>
                      <button className="btn btn-line btn-sm" onClick={() => startEdit(s)}>Düzenle</button>
                      <button className="btn btn-line btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }} onClick={() => reject(s.id)}>Reddet</button>
                    </div>
                  </div>
                  <EvidenceView evidence={s.evidence} />
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
