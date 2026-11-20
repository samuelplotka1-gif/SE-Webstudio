import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Anfrage bestätigt", robots: { index: false, follow: false } };

export default function ConfirmedPage() {
  return (
    <div className="wrap" style={{ padding: "clamp(48px, 8vw, 120px) var(--gutter)" }}>
      <div className="sheet done" style={{ maxWidth: 720 }}>
        <span className="mono-label">Bestätigt</span>
        <h1 className="step-title">Danke! Wir legen los.</h1>
        <p style={{ margin: 0 }}>
          Ihre Anfrage ist bei uns. Wir bauen jetzt Ihre Demo und schicken sie Ihnen per Mail – als Vorschau-Link und PDF, meist noch heute (an Werktagen).
        </p>
        <ol className="flow" style={{ marginTop: 8 }}>
          <li>Anfrage bestätigt</li>
          <li>Demo wird gebaut</li>
          <li>Mail mit Link & PDF</li>
        </ol>
        <div className="notice">
          Sie möchten die Demo lieber gemeinsam durchgehen? Buchen Sie schon jetzt einen Termin – wir zeigen sie Ihnen dann im Gespräch.
        </div>
        <div className="cta-row">
          <Link href="/termin" className="btn btn--primary">
            Gespräch buchen <span className="arrow">→</span>
          </Link>
          <Link href="/" className="btn btn--ghost">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
