"use client";
import { useState } from "react";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPassword.length < 8) {
      setMsg({ type: "err", text: "Yeni şifre en az 8 karakter olmalı." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: "err", text: "Yeni şifreler birbiriyle eşleşmiyor." });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const text =
          data.error === "wrong_current_password"
            ? "Mevcut şifre yanlış."
            : "Şifre değiştirilemedi. Lütfen tekrar deneyin.";
        setMsg({ type: "err", text });
      } else {
        setMsg({ type: "ok", text: "Şifreniz güncellendi." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası. Lütfen tekrar deneyin." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <div>
        <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
          Mevcut Şifre
        </label>
        <input className="inp" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      </div>
      <div>
        <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
          Yeni Şifre
        </label>
        <input className="inp" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
      </div>
      <div>
        <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
          Yeni Şifre (Tekrar)
        </label>
        <input className="inp" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
      </div>

      {msg && (
        <div style={{ fontSize: 13, fontWeight: 600, color: msg.type === "ok" ? "#22c55e" : "#f87171" }}>{msg.text}</div>
      )}

      <button type="submit" className="btn btn-teal" disabled={busy} style={{ justifySelf: "start" }}>
        {busy ? "Kaydediliyor..." : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}
