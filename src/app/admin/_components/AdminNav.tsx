"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/videos", label: "Список" },
  { href: "/admin/add-video", label: "Добавить видео" },
];

const HOME_LINK = { href: "/", label: "← На главную" };

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0",
        height: "44px",
        borderBottom: "1px solid var(--tv-border)",
        background: "var(--tv-bg)",
        flexShrink: 0,
        paddingLeft: "24px",
        position: "relative",
        zIndex: 2,
      }}
    >
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: "0 20px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              fontSize: "11px",
              fontFamily: "var(--font-geist-mono), monospace",
              fontWeight: active ? 700 : 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: active ? "var(--tv-accent)" : "var(--tv-muted)",
              borderBottom: active
                ? "2px solid var(--tv-accent)"
                : "2px solid transparent",
              transition: "color 0.15s",
            }}
          >
            {label}
          </Link>
        );
      })}

      <Link
        href={HOME_LINK.href}
        style={{
          marginLeft: "auto",
          padding: "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          fontFamily: "var(--font-geist-mono), monospace",
          letterSpacing: "0.1em",
          textDecoration: "none",
          color: "var(--tv-muted)",
          transition: "color 0.15s",
        }}
      >
        {HOME_LINK.label}
      </Link>
    </nav>
  );
}
