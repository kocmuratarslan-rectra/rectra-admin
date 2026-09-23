"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-xs bg-rectra-red px-3 py-1.5 rounded-lg"
    >
      Çıkış
    </button>
  );
}
