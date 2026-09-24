import Link from "next/link";
import { SITE_URL } from "@/lib/site";

// Blog, admin CRM'inden bağımsız, herkese açık bir bölümdür (NextAuth oturumu
// gerekmez). rectra-site.vercel.app/blog/* rewrite'ı ile ana site domaininde
// gösterilir; bu yüzden tasarımı admin panelinden değil doğrudan rectra-site'ın
// marka diliyle (ink/teal/amber/paper) hizalanır.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rblog">
      <style>{`
        .rblog{background:var(--paper);min-height:100vh;color:var(--text)}
        .rblog-nav{background:var(--ink);padding:18px 0}
        .rblog-nav .wrap{max-width:900px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between}
        .rblog-logo{font-family:var(--font-d),sans-serif;font-weight:700;font-size:19px;color:#fff;text-decoration:none;letter-spacing:.02em}
        .rblog-logo em{font-style:normal;color:#FF4D6A}
        .rblog-nav-links{display:flex;align-items:center;gap:18px}
        .rblog-nav-links a{color:#C6CCE2;font-size:13.5px;font-weight:600;text-decoration:none}
        .rblog-nav-links a:hover{color:#fff}
        .rblog-cta{background:linear-gradient(120deg,#E5164A,#B10D31);color:#fff!important;padding:9px 18px;border-radius:100px;font-weight:700!important}
        .rblog-main{max-width:900px;margin:0 auto;padding:48px 24px 80px}
        .rblog-foot{border-top:1px solid var(--line);padding:28px 24px;text-align:center;font-size:12.5px;color:var(--muted)}
        .rblog-foot a{color:var(--teal-deep,#0FA99A);font-weight:700;text-decoration:none}
      `}</style>
      <nav className="rblog-nav">
        <div className="wrap">
          <a href={SITE_URL} className="rblog-logo">REC<em>TRA</em></a>
          <div className="rblog-nav-links">
            <Link href="/blog">Blog</Link>
            <a href={`${SITE_URL}/#teklif`} className="rblog-cta">Teklif Al</a>
          </div>
        </div>
      </nav>
      <main className="rblog-main">{children}</main>
      <footer className="rblog-foot">
        Rectra Business School © {new Date().getFullYear()} · <a href={SITE_URL}>rectra-site.vercel.app</a>
      </footer>
    </div>
  );
}
