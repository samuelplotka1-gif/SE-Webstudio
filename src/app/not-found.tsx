import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: "clamp(64px, 10vw, 160px) var(--gutter)" }}>
      <span className="mono-label">Fehler 404</span>
      <h1 className="display display--xl" style={{ margin: "20px 0 24px" }}>
        Diese Seite gibt es nicht<span className="mark">.</span>
      </h1>
      <div className="cta-row">
        <Link href="/" className="btn btn--primary">
          Zur Startseite
        </Link>
        <Link href="/demo" className="btn btn--ghost">
          Kostenlose Demo anfordern
        </Link>
      </div>
    </div>
  );
}
