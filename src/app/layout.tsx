import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { company } from "@/content/site";
import "./globals.css";

// next/font lädt die Schriften beim Build herunter und liefert sie selbst aus – keine Verbindung zu Google beim Besuch.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plex", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plex-mono", display: "swap" });

const siteUrl = process.env.SITE_URL ?? `https://${company.domain}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${company.name} – Websites, KI-Agenten & Automatisierung`, template: `%s · ${company.name}` },
  description:
    "Websites, KI-Agenten, Automatisierung und CRM-Tools für kleine und mittlere Betriebe. Kostenlose Demo Ihrer neuen Website – unverbindlich, am selben Werktag.",
  openGraph: { type: "website", locale: "de_DE", siteName: company.name },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
      <body>
        <a href="#inhalt" className="skip">
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <main id="inhalt">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
