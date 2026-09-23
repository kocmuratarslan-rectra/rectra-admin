"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.16)",
        borderRadius: 100,
        padding: "6px 14px",
      }}
    >
      Çıkış Yap
    </button>
  );
}
