"use client";

import { useEffect, useState } from "react";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

/**
 * Zwei-Klick-Lösung: Calendly (USA) wird erst nach Zustimmung geladen.
 * Vorher geht keine Verbindung zu Calendly raus – kein Cookie-Banner nötig.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!consent) return;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, [consent]);

  if (!url) {
    return (
      <div className="consent-box">
        <span className="mono-label">Noch nicht eingerichtet</span>
        <p>
          Hier erscheint der Buchungskalender, sobald <code>NEXT_PUBLIC_CALENDLY_URL</code> gesetzt ist.
        </p>
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="consent-box">
        <span className="mono-label">Terminkalender</span>
        <h2 className="step-title" style={{ margin: 0 }}>
          Freie Termine anzeigen
        </h2>
        <p>
          Für die Terminbuchung nutzen wir <strong>Calendly</strong> (Calendly LLC, USA). Wenn Sie auf „Kalender laden“ klicken, werden Daten an Calendly übertragen und dort Cookies gesetzt. Mehr dazu in unserer{" "}
          <a href="/datenschutz#calendly">Datenschutzerklärung</a>.
        </p>
        <div className="cta-row">
          <button type="button" className="btn btn--primary" onClick={() => setConsent(true)}>
            Kalender laden <span className="arrow">→</span>
          </button>
          <a className="link-arrow" href={url} target="_blank" rel="noopener noreferrer">
            Oder direkt bei Calendly öffnen ↗
          </a>
        </div>
      </div>
    );
  }

  const embedUrl = `${url}${url.includes("?") ? "&" : "?"}hide_gdpr_banner=1&background_color=fbfaf6&text_color=141413&primary_color=e8492a`;
  return <div className="calendly-inline-widget calendly-frame" data-url={embedUrl} />;
}
