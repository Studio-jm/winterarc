"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Aujourd'hui" },
  { href: "/saisie", label: "Saisie" },
  { href: "/repas", label: "Repas" },
  { href: "/import", label: "Import" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_92%,black)] backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {LINKS.map((l) => {
          const active = path === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex h-14 items-center justify-center text-[13px] tracking-wide ${
                  active ? "text-[var(--fg)]" : "text-[var(--muted)]"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
