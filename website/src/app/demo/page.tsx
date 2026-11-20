import type { Metadata } from "next";
import Link from "next/link";
import { DemoForm } from "./demo-form";

export const metadata: Metadata = {
  title: "Kostenlose Demo anfordern",
  description: "In drei kurzen Schritten zur kostenlosen Demo Ihrer neuen Website – als Vorschau-Link und PDF, unverbindlich.",
};

export default function DemoPage() {
  return (
    <div className="wrap form-shell">
      <aside className="form-aside">
        <span className="mono-label">Kostenlose Demo</span>
        <h1 className="display display--l">Drei Schritte zu Ihrer Demo.</h1>
        <p className="lead">Sie bekommen einen Entwurf Ihrer Startseite als Vorschau-Link und PDF. Kostenlos, unverbindlich, meist noch am selben Werktag.</p>
        <ol>
          <li>
            <span>01</span>Formular ausfüllen
          </li>
          <li>
            <span>02</span>E-Mail-Adresse bestätigen
          </li>
          <li>
            <span>03</span>Demo per Mail erhalten
          </li>
        </ol>
        <p style={{ margin: 0, fontSize: 15, color: "var(--ink-2)" }}>
          Keine Demo nötig? <Link href="/termin" className="link-arrow">Direkt ein Gespräch buchen →</Link>
        </p>
      </aside>
      <DemoForm />
    </div>
  );
}
