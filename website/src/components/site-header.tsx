"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/content/site";
import { Logo } from "./logo";

export function SiteHeader() {
  const pathname = usePathname();
  // Menü gilt nur für die Seite, auf der es geöffnet wurde – nach einem Seitenwechsel ist es automatisch zu.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (o: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);

  // Oben auf der Seite großes Logo (Unterzeile lesbar), beim Scrollen kompakte Leiste.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header" data-compact={compact}>
      <div className="wrap site-header__inner">
        <Logo />
        <nav className="nav" aria-label="Leistungen">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/demo" className="btn btn--primary header-cta">
          Kostenlose Demo
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Schließen" : "Menü"}
        </button>
      </div>
      <div id="mobile-nav" className="mobile-nav wrap" data-open={open}>
        {nav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/demo" className="btn btn--primary">
          Kostenlose Demo anfordern
        </Link>
        <Link href="/termin" className="btn btn--ghost" style={{ marginTop: 12 }}>
          Gespräch buchen
        </Link>
      </div>
    </header>
  );
}
