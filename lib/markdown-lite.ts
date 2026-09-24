// Bağımlılıksız, basit markdown-benzeri metin -> HTML dönüştürücü.
// Blog içeriği admin panelde düz metin alanına yazıldığı için tam bir
// markdown kütüphanesi yerine sık kullanılan birkaç kalıbı destekler:
// ## / ### başlıklar, **kalın**, *italik*, [metin](url) bağlantı,
// "- " ile başlayan madde listeleri, boş satırla ayrılmış paragraflar.
// Girdi her zaman admin (oturumlu) kullanıcıdan geldiği için XSS riski
// düşüktür, yine de temel HTML kaçışı uygulanır.

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string) {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>");
  out = out.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return out;
}

export function renderMarkdownLite(raw: string): string {
  if (!raw) return "";
  const blocks = raw.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (/^###\s+/.test(trimmed)) {
      html.push(`<h3>${inline(trimmed.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      html.push(`<h2>${inline(trimmed.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    const lines = trimmed.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
      const items = lines.map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ""))}</li>`).join("");
      html.push(`<ul>${items}</ul>`);
      continue;
    }

    html.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }

  return html.join("\n");
}

export function slugify(input: string) {
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

export function plainExcerpt(raw: string, max = 160) {
  const text = raw.replace(/[#*_\[\]()]/g, "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}
