import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-rectra-dark">Rectra Admin & CRM</h1>
        <p className="text-gray-600">Bu, Rectra yönetim panelidir. Ana site: rectra-site.vercel.app</p>
        <Link href="/admin/login" className="inline-block bg-rectra-red text-white px-5 py-2 rounded-lg font-medium">
          Panele Giriş Yap
        </Link>
      </div>
    </main>
  );
}
