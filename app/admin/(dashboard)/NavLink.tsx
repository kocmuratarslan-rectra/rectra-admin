"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  icon,
  label,
  badge,
  exact,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isOn = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} className={`snav${isOn ? " on" : ""}`}>
      <span className="ic">{icon}</span>
      {label}
      {badge && <span className="bdg">{badge}</span>}
    </Link>
  );
}
