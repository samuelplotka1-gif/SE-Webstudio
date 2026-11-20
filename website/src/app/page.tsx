import Link from "next/link";
import { Faq, FinalCta, Plans, ProofSheet, ServiceIndex } from "@/components/blocks";
import { getService } from "@/content/services";

const hosting = getService("hosting-betreuung")!;

const homeFaq = [
  {
    q: "Ist die Demo wirklich kostenlos?",
    a: "Ja. Sie bekommen einen Entwurf Ihrer Startseite als Link und PDF. Kein Vertrag, keine Vorkasse. Wenn er Ihnen nicht gefällt, war es das.",
  },
  {
    q: "Warum muss ich meine E-Mail-Adresse bestätigen?",
    a: "Damit niemand in Ihrem Namen eine Anfrage stellt – und damit wir unsere Zeit in echte Anfragen stecken. Sie klicken einmal auf den Link in der Mail, fertig.",
  },
  {
    q: "Wie schnell bekomme ich die Demo?",
    a: "In der Regel am selben Werktag, an dem Sie Ihre Anfrage bestätigen. Kommt sie abends oder am Wochenende, am nächsten Werktag.",
  },
  {
    q: "Was passiert mit meinen Daten?",
    a: "Wir nutzen sie nur, um Ihre Demo zu erstellen und Ihnen zu schreiben. Unbestätigte Anfragen löschen wir nach 48 Stunden automatisch. Details in der Datenschutzerklärung.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <span className="mono-label">Websites · KI-Agenten · Automatisierung</span>
            <h1 className="display display--xl">
              Sie sehen Ihre neue Website<span className="mark">,</span> bevor Sie etwas bezahlen<span className="mark">.</span>
            </h1>
            <p className="lead">
              Beschreiben Sie Ihren Betrieb in drei kurzen Schritten. Wir bauen daraus eine Demo Ihrer Startseite und schicken sie Ihnen als Link und PDF – meist noch am selben Werktag.
            </p>
            <div className="cta-row">
              <Link href="/demo" className="btn btn--primary">
                Kostenlose Demo anfordern <span className="arrow">→</span>
              </Link>
              <Link href="/termin" className="btn btn--ghost">
                Gespräch buchen
              </Link>
            </div>
            <span className="cta-note">Unverbindlich · keine Vorkasse · ca. 3 Minuten</span>
          </div>
          <ProofSheet />
        </div>
      </section>

      <section className="section" aria-labelledby="ablauf">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <span className="mono-label">So läuft es ab</span>
              <h2 id="ablauf" className="display display--l">
                Vier Schritte. Einer davon ist Ihrer.
              </h2>
            </div>
            <p className="lead">Den Rest übernehmen wir. Sie müssen nichts vorbereiten – ein paar Sätze über Ihren Betrieb reichen.</p>
          </div>
          <ol className="steps">
            <li>
              <span className="steps__num">01</span>
              <h3>Anfrage stellen</h3>
              <p>Name, Firma, Branche und ein paar Sätze, was Sie vorhaben. Logo und Farben, wenn Sie mögen.</p>
              <span className="steps__time">ca. 3 Minuten</span>
            </li>
            <li>
              <span className="steps__num">02</span>
              <h3>E-Mail bestätigen</h3>
              <p>Ein Klick auf den Link in unserer Mail. So wissen wir, dass die Anfrage wirklich von Ihnen ist.</p>
              <span className="steps__time">ein Klick</span>
            </li>
            <li>
              <span className="steps__num">03</span>
              <h3>Demo erhalten</h3>
              <p>Ein Entwurf Ihrer Startseite in Ihrer Branche, mit Ihren Texten – als Vorschau-Link und PDF.</p>
              <span className="steps__time">meist am selben Werktag</span>
            </li>
            <li>
              <span className="steps__num">04</span>
              <h3>Reden, wenn Sie wollen</h3>
              <p>Gefällt Ihnen die Richtung, buchen Sie einen Termin. Wenn nicht, ist das auch in Ordnung.</p>
              <span className="steps__time">30 Minuten</span>
            </li>
          </ol>
          <p className="promise">
            <span className="mono" style={{ color: "var(--signal-strong)" }}>
              ※
            </span>
            <span>
              <strong>Kein Hinterhertelefonieren.</strong> Wenn wir nach der Demo nichts von Ihnen hören, erinnern wir Sie genau einmal. Danach melden wir uns nicht mehr.
            </span>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="leistungen">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <span className="mono-label">Leistungen</span>
              <h2 id="leistungen" className="display display--l">
                Was wir bauen.
              </h2>
            </div>
            <p className="lead">Jede Leistung mit „ab“-Preis. Darunter geht es nicht, und was darüber liegt, steht vorher schriftlich im Angebot.</p>
          </div>
          <ServiceIndex />
        </div>
      </section>

      <section className="section" aria-labelledby="anders">
        <div className="wrap">
          <span className="mono-label">Was Sie bei uns nicht bekommen</span>
          <h2 id="anders" className="display display--l" style={{ marginTop: 20, maxWidth: "14em" }}>
            Kein Agentur-Theater.
          </h2>
          <div className="honest">
            <div>
              <s>Vertrag vor dem ersten Entwurf</s>
              <h3>Erst die Demo, dann die Entscheidung.</h3>
              <p>Sie sehen, wie Ihre Seite aussehen könnte, bevor Sie irgendetwas unterschreiben.</p>
            </div>
            <div>
              <s>„Preis auf Anfrage“</s>
              <h3>Preise stehen auf der Seite.</h3>
              <p>Jede Leistung hat einen „ab“-Preis. Das genaue Angebot bekommen Sie schriftlich, ohne Überraschungen.</p>
            </div>
            <div>
              <s>Projektmanager als Zwischenstation</s>
              <h3>Sie sprechen mit denen, die bauen.</h3>
              <p>Keine Weiterleitungen, keine Ticketnummern. Eine feste Ansprechperson von der Demo bis zur Betreuung.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--ink" aria-labelledby="betreuung">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <span className="mono-label">Hosting & Betreuung</span>
              <h2 id="betreuung" className="display display--l">
                Nach dem Livegang sind wir nicht weg.
              </h2>
            </div>
            <p className="lead">{hosting.lead}</p>
          </div>
          <Plans packages={hosting.packages} />
          <div className="cta-row" style={{ marginTop: 32 }}>
            <Link href="/leistungen/hosting-betreuung" className="btn btn--ghost">
              Alle Details zur Betreuung
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="fragen">
        <div className="wrap">
          <span className="mono-label">Häufige Fragen</span>
          <h2 id="fragen" className="display display--l" style={{ marginTop: 20 }}>
            Kurz beantwortet.
          </h2>
          <Faq items={homeFaq} />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
