"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex items-center justify-center bg-rectra-gray">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-rectra-dark">Rectra Admin Girişi</h1>
        <div>
          <label className="text-sm text-gray-600">E-posta</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Şifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>
        {error && <p className="text-sm text-rectra-red">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rectra-red text-white py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </main>
  );
}
