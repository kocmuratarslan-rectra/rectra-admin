"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  order: number;
  published: boolean;
};

const TABS = [
  { key: "SERVICE", label: "Hizmetler" },
  { key: "TESTIMONIAL", label: "Referanslar" },
  { key: "FAQ", label: "SSS" },
  { key: "BLOG", label: "Blog" },
];

export default function ContentManager() {
  const [tab, setTab] = useState("SERVICE");
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ title: "", subtitle: "", body: "" });
  const [loading, setLoading] = useState(true);

  async function load(type: string) {
    setLoading(true);
    const res = await fetch(`/api/content/${type}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    await fetch(`/api/content/${tab}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", subtitle: "", body: "" });
    load(tab);
  }

  async function togglePublished(item: Item) {
    await fetch(`/api/content/${tab}/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, published: !item.published }),
    });
    load(tab);
  }

  async function remove(id: string) {
    if (!confirm("Silinsin mi?")) return;
    await fetch(`/api/content/${tab}/${id}`, { method: "DELETE" });
    load(tab);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t.key ? "bg-rectra-red text-white" : "bg-white text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={addItem} className="bg-white rounded-2xl shadow-sm p-4 grid gap-3 sm:grid-cols-3">
        <input
          placeholder="Başlık"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Alt başlık (opsiyonel)"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Açıklama / içerik"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" className="sm:col-span-3 bg-rectra-dark text-white rounded-lg py-2 text-sm">
          Ekle
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Yükleniyor...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y">
          {items.length === 0 && <p className="p-4 text-gray-500 text-sm">Kayıt yok.</p>}
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-sm text-gray-500">{item.subtitle}</div>}
                {item.body && <div className="text-sm text-gray-400">{item.body}</div>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => togglePublished(item)}
                  className={`text-xs px-2 py-1 rounded ${item.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {item.published ? "Yayında" : "Taslak"}
                </button>
                <button onClick={() => remove(item.id)} className="text-rectra-red text-xs">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
