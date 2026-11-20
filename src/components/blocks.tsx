import Link from "next/link";
import { formatPrice, lowestPrice, services, type Package } from "@/content/services";
import { priceNote } from "@/content/site";

/** Hero-Grafik: eine Demo als Korrekturabzug – zeigt, was man nach der Anfrage bekommt. */
export function ProofSheet() {
  return (
    <figure className="proof" aria-label="Beispiel einer Demo: Startseite einer Tischlerei">
      <div className="proof__bar">
        <span className="proof__url">vorschau.se-webstudio.de/tischlerei-brandt</span>
        <span>Entwurf 1</span>
      </div>
      <div className="proof__site" aria-hidden="true">
        <div className="proof__site-nav">
          <span className="proof__site-logo">BRANDT</span>
          <span>Leistungen · Referenzen · Kontakt</span>
        </div>
        <h3>Möbel nach Maß aus der Werkstatt in Ihrer Nähe.</h3>
        <p>Küchen, Einbauschränke und Treppen – geplant, gebaut und montiert von einem Team.</p>
        <span className="proof__site-btn">Aufmaß-Termin anfragen</span>
      </div>
      <div className="proof__tiles" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="proof__stamp" aria-hidden="true">
        Demo
        <br />
        unverbindlich
      </div>
      <ul className="proof__notes">
        <li>
          <b>①</b> Ihr Logo und Ihre Farben
        </li>
        <li>
          <b>②</b> Texte aus Ihrer Beschreibung
        </li>
        <li>
          <b>③</b> Als Link und als PDF
        </li>
      </ul>
    </figure>
  );
}

export function ServiceIndex() {
  return (
    <ul className="index">
      {services.map((s) => {
        const p = lowestPrice(s);
        return (
          <li key={s.slug}>
            <Link href={`/leistungen/${s.slug}`}>
              <span className="index__num">{s.index}</span>
              <span className="index__name">
                {s.name}
                {s.recurring ? <span className="index__tag">Abo</span> : null}
              </span>
              <span className="index__short">{s.short}</span>
              <span className="index__price">{formatPrice(p)}</span>
              <span className="index__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Plans({ packages, light = false }: { packages: Package[]; light?: boolean }) {
  return (
    <>
      <div className={`plans${light ? " plans--light" : ""}`}>
        {packages.map((p) => {
          const value = `${new Intl.NumberFormat("de-DE").format(p.price)} €`;
          return (
            <div key={p.name} className={`plan${p.highlight ? " plan--hl" : ""}`}>
              {p.highlight ? <span className="plan__badge">Meist gewählt</span> : null}
              <span className="plan__name">{p.name}</span>
              <span className="plan__price">
                <span className="mono" style={{ fontSize: 15, fontWeight: 400, marginRight: 6 }}>
                  ab
                </span>
                {value}
                <small>{p.interval === "monatlich" ? "/ Monat" : "einmalig"}</small>
              </span>
              {p.extra ? <p className="plan__extra">+ {p.extra}</p> : null}
              <p className="plan__for">{p.for}</p>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="price-note">{priceNote} Den genauen Preis bekommen Sie schriftlich im Angebot.</p>
    </>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FinalCta({ title = "Wie möchten Sie weitermachen?" }: { title?: string }) {
  return (
    <section className="section" aria-labelledby="final-title">
      <div className="wrap">
        <span className="mono-label">Zwei Wege</span>
        <h2 id="final-title" className="display display--l" style={{ margin: "20px 0 48px" }}>
          {title}
        </h2>
        <div className="final">
          <div className="final__path">
            <span className="mono-label mono-label--plain">Weg A · ca. 3 Minuten</span>
            <h3 className="display display--m">Erst sehen, dann reden.</h3>
            <p>Sie beschreiben Ihr Vorhaben, wir bauen eine Demo Ihrer Startseite. Sie bekommen sie als Link und PDF – kostenlos und unverbindlich.</p>
            <div>
              <Link href="/demo" className="btn btn--primary">
                Kostenlose Demo anfordern <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div className="final__path">
            <span className="mono-label mono-label--plain">Weg B · 30 Minuten</span>
            <h3 className="display display--m">Direkt sprechen.</h3>
            <p>Sie wissen schon, was Sie brauchen, oder haben Fragen? Buchen Sie einen Termin für ein kurzes Gespräch per Telefon oder Video.</p>
            <div>
              <Link href="/termin" className="btn btn--ghost">
                Gespräch buchen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
