import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyEmbed } from "./calendly-embed";

export const metadata: Metadata = {
  title: "Gespräch buchen",
  description: "30 Minuten per Telefon oder Video: Buchen Sie direkt einen Termin mit S&E Webstudio.",
};

export default function TerminPage() {
  const url = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";
  return (
    <div className="wrap form-shell">
      <aside className="form-aside">
        <span className="mono-label">Gespräch buchen</span>
        <h1 className="display display--l">30 Minuten, ohne Verkaufsgespräch.</h1>
        <p className="lead">Wir hören zu, stellen Fragen und sagen Ihnen ehrlich, was sinnvoll ist – und was nicht. Per Telefon oder Video, wie Sie möchten.</p>
        <ol>
          <li>
            <span>01</span>Termin wählen
          </li>
          <li>
            <span>02</span>Bestätigung per Mail
          </li>
          <li>
            <span>03</span>Wir rufen pünktlich an
          </li>
        </ol>
        <p style={{ margin: 0, fontSize: 15, color: "var(--ink-2)" }}>
          Lieber erst etwas sehen? <Link href="/demo" className="link-arrow">Kostenlose Demo anfordern →</Link>
        </p>
      </aside>
      <CalendlyEmbed url={url} />
    </div>
  );
}
