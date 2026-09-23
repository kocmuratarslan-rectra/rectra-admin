import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rectra Admin & CRM",
  description: "Rectra yönetim paneli ve CRM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
