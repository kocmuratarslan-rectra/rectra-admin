import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      {session && (
        <nav className="bg-rectra-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold">Rectra Admin</span>
            <Link href="/admin" className="text-sm text-gray-300 hover:text-white">Panel</Link>
            <Link href="/admin/leads" className="text-sm text-gray-300 hover:text-white">Talepler (CRM)</Link>
            <Link href="/admin/content" className="text-sm text-gray-300 hover:text-white">İçerik</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{session.user?.email}</span>
            <SignOutButton />
          </div>
        </nav>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
