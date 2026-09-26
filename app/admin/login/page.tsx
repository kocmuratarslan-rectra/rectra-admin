"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/app/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      setError("E-posta veya şifre hatalı.");
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <main className="rectra-admin" style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sol marka paneli */}
      <div
        style={{
          flex: "1 1 46%",
          background: "linear-gradient(155deg,var(--ink) 0%,var(--ink-2) 55%,#1a2145 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
        }}
        className="admin-login-brand"
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,.22), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -160,
            left: -100,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(229,22,74,.16), transparent 70%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/rectra-logo-white.webp" alt="Rectra" style={{ height: 30, width: "auto", display: "block" }} />
          <small style={{ display: "block", fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".24em", color: "var(--mod)", marginTop: 6 }}>
            ADMIN &amp; CRM
          </small>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 34, lineHeight: 1.2, maxWidth: 380 }}>
            İnsan potansiyelini,<br />yapay zekâ hızıyla<br />yönetin.
          </h1>
          <p style={{ marginTop: 16, color: "var(--mod)", fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
            Rectra Business School yönetim paneline hoş geldiniz — talepler, içerikler ve site kontrolü tek yerde.
          </p>
        </div>
        <div style={{ position: "relative", zIndex: 1, fontFamily: "var(--font-m)", fontSize: 10.5, letterSpacing: ".08em", color: "var(--mod)" }}>
          Rectra Business School © {new Date().getFullYear()}
        </div>
      </div>

      {/* Sağ giriş formu */}
      <div
        style={{
          flex: "1 1 54%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--paper)",
        }}
      >
        <form onSubmit={handleSubmit} className="card" style={{ width: "100%", maxWidth: 380, padding: 34 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/rectra-logo-red.webp" alt="Rectra" style={{ height: 26, width: "auto", display: "block", marginBottom: 22 }} className="admin-login-mobile-logo" />
          <h1 style={{ fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 22, color: "var(--ink)" }}>Admin Girişi</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, marginBottom: 26 }}>
            Devam etmek için hesap bilgilerinizle giriş yapın.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
              E-posta
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="inp"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Şifre
            </label>
            <PasswordInput className="inp" value={password} onChange={setPassword} required autoComplete="current-password" />
          </div>

          {error && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginTop: 10 }}>{error}</div>
          )}

          <button type="submit" className="btn btn-teal" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .admin-login-brand { display: none; }
        }
        @media (min-width: 861px) {
          .admin-login-mobile-logo { display: none; }
        }
      `}</style>
    </main>
  );
}
