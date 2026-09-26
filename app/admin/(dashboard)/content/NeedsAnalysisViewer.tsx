"use client";
import { useEffect, useState } from "react";

type Analysis = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  summary: string | null;
  recommended: { categoryLabel: string; competency: string }[] | null;
  createdAt: string;
};

export default function NeedsAnalysisViewer() {
  const [items, setItems] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/needs-analysis")
      .then((r) => r.json())
      .then((d) => setItems(d.analyses || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 18, maxWidth: 760 }}>
        Ziyaretçilerin web sitesindeki "Eğitim İhtiyaç Analizi" formunu doldurarak gönderdiği başvurular.
        Her başvuru aynı zamanda Talepler tablosuna "İhtiyaç Analizi" kaynağıyla bir lead olarak da düşer.
      </p>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Henüz başvuru yok.</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((a) => (
            <div key={a.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{a.companyName}</div>
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(a.createdAt).toLocaleString("tr-TR")}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                {a.contactName} · {a.contactEmail}{a.contactPhone ? ` · ${a.contactPhone}` : ""}
              </div>
              {a.summary && <p style={{ fontSize: 13.5, marginBottom: 8 }}>{a.summary}</p>}
              {a.recommended && a.recommended.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.recommended.map((r, i) => (
                    <span key={i} className="pill p-offer">{r.categoryLabel}: {r.competency}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
