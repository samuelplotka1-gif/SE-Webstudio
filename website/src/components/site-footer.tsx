import Link from "next/link";
import { company, nav, phoneHref } from "@/content/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG-Logo */}
        <img className="footer-logo" src="/brand/logo-quer-chrom.svg" alt="S&E Webstudio – Webdesign, KI, SEO" width={938} height={270} loading="lazy" />
        <div className="footer-grid">
          <div className="footer-col">
            <h2>Kontakt</h2>
            <address>
              {company.legalName}
              <br />
              {company.street}
              <br />
              {company.postalCode} {company.city}
              <br />
              <a href={`mailto:${company.email}`}>{company.email}</a>
              <br />
              <a href={phoneHref}>{company.phone}</a>
            </address>
          </div>
          <div className="footer-col">
            <h2>Leistungen</h2>
            <ul>
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h2>Nächster Schritt</h2>
            <ul>
              <li>
                <Link href="/demo">Kostenlose Website-Demo</Link>
              </li>
              <li>
                <Link href="/termin">Gespräch buchen</Link>
              </li>
              <li>
                <Link href="/impressum">Impressum</Link>
              </li>
              <li>
                <Link href="/datenschutz">Datenschutz</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} {company.name}
          </span>
          <span>Gebaut ohne Baukasten. Schriften lokal, keine Tracker.</span>
        </div>
      </div>
    </footer>
  );
}
