import * as cheerio from "cheerio";

/**
 * Reine Analyse: bekommt HTML und Metadaten, gibt eine Liste von Prüfpunkten zurück.
 * Keine Netzwerkzugriffe hier, damit die Logik gut testbar ist.
 *
 * Jeder Prüfpunkt:
 *   id        eindeutiger Schlüssel
 *   title     kurze Überschrift
 *   status    "ok" | "warn" | "fail"
 *   weight    Gewicht für die Gesamtpunktzahl
 *   message   Erklärung in einfacher Sprache
 *   tip       was der Kunde tun sollte (optional)
 */
export function analyze({ html, finalUrl, loadTimeMs, bytes, httpsOk, httpStatus }) {
  const $ = cheerio.load(html || "");
  const checks = [];
  const add = (c) => checks.push(c);

  // --- Sicherheit -------------------------------------------------------
  add({
    id: "https",
    category: "Sicherheit",
    title: "Verschlüsselte Verbindung (HTTPS)",
    weight: 15,
    ...(httpsOk
      ? { status: "ok", message: "Die Seite ist über HTTPS erreichbar. Besucher sehen das Schloss-Symbol im Browser." }
      : {
          status: "fail",
          message: "Die Seite ist nicht über HTTPS erreichbar. Browser zeigen 'Nicht sicher' an, Google stuft die Seite ab.",
          tip: "SSL-Zertifikat einrichten (bei den meisten Hostern kostenlos über Let's Encrypt) und HTTP auf HTTPS umleiten.",
        }),
  });

  // --- Performance -------------------------------------------------------
  const seconds = loadTimeMs / 1000;
  add({
    id: "loadtime",
    category: "Geschwindigkeit",
    title: "Ladezeit der Startseite",
    weight: 15,
    value: `${seconds.toFixed(2)} s`,
    ...(seconds <= 1.5
      ? { status: "ok", message: `Das HTML wurde in ${seconds.toFixed(2)} Sekunden geladen. Das ist schnell.` }
      : seconds <= 3
        ? { status: "warn", message: `Das HTML brauchte ${seconds.toFixed(2)} Sekunden. Das ist akzeptabel, aber nicht schnell.`, tip: "Caching aktivieren und Hosting prüfen." }
        : { status: "fail", message: `Das HTML brauchte ${seconds.toFixed(2)} Sekunden. Viele Besucher springen ab, bevor die Seite erscheint.`, tip: "Hosting prüfen, Caching aktivieren, unnötige Plugins entfernen." }),
  });

  const kb = Math.round((bytes || 0) / 1024);
  add({
    id: "size",
    category: "Geschwindigkeit",
    title: "Größe des HTML-Dokuments",
    weight: 5,
    value: `${kb} KB`,
    ...(kb <= 150
      ? { status: "ok", message: `Das HTML ist ${kb} KB groß. Das ist schlank.` }
      : kb <= 500
        ? { status: "warn", message: `Das HTML ist ${kb} KB groß. Das ist recht viel für ein einzelnes Dokument.`, tip: "Inline-Skripte und -Styles auslagern, Page-Builder-Ballast reduzieren." }
        : { status: "fail", message: `Das HTML ist ${kb} KB groß. So große Dokumente bremsen besonders auf dem Handy.`, tip: "Seite entschlacken, Inline-Code auslagern." }),
  });

  // --- Mobil -------------------------------------------------------------
  const viewport = $('meta[name="viewport"]').attr("content");
  add({
    id: "viewport",
    category: "Mobil",
    title: "Mobile Darstellung (Viewport)",
    weight: 12,
    ...(viewport && /width\s*=\s*device-width/i.test(viewport)
      ? { status: "ok", message: "Die Seite ist für Smartphones eingerichtet." }
      : {
          status: "fail",
          message: "Es fehlt die Viewport-Angabe. Auf dem Handy wird die Seite winzig oder verschoben dargestellt.",
          tip: '<meta name="viewport" content="width=device-width, initial-scale=1"> im <head> ergänzen.',
        }),
  });

  // --- SEO ---------------------------------------------------------------
  const title = ($("title").first().text() || "").trim();
  add({
    id: "title",
    category: "SEO",
    title: "Seitentitel",
    weight: 8,
    value: title || "–",
    ...(!title
      ? { status: "fail", message: "Die Seite hat keinen Titel. Google zeigt dann irgendetwas an, oft nur die Domain.", tip: "Einen aussagekräftigen <title> setzen, z. B. 'Malerbetrieb Müller – Maler in Köln'." }
      : title.length < 20
        ? { status: "warn", message: `Der Titel '${title}' ist sehr kurz. Er verschenkt Platz in den Google-Ergebnissen.`, tip: "Leistung und Ort in den Titel aufnehmen." }
        : title.length > 65
          ? { status: "warn", message: `Der Titel ist ${title.length} Zeichen lang und wird bei Google abgeschnitten.`, tip: "Auf etwa 50 bis 60 Zeichen kürzen." }
          : { status: "ok", message: `Der Titel '${title}' ist vorhanden und hat eine gute Länge.` }),
  });

  const desc = ($('meta[name="description"]').attr("content") || "").trim();
  add({
    id: "description",
    category: "SEO",
    title: "Meta-Beschreibung",
    weight: 6,
    value: desc || "–",
    ...(!desc
      ? { status: "fail", message: "Es gibt keine Meta-Beschreibung. Google schreibt sich dann selbst einen Text zusammen.", tip: "Eine Beschreibung mit 120 bis 160 Zeichen hinterlegen, die zum Klicken einlädt." }
      : desc.length < 50
        ? { status: "warn", message: "Die Meta-Beschreibung ist sehr kurz.", tip: "Auf 120 bis 160 Zeichen ausbauen." }
        : desc.length > 170
          ? { status: "warn", message: `Die Meta-Beschreibung ist ${desc.length} Zeichen lang und wird abgeschnitten.`, tip: "Auf 120 bis 160 Zeichen kürzen." }
          : { status: "ok", message: "Die Meta-Beschreibung ist vorhanden und hat eine gute Länge." }),
  });

  const h1s = $("h1");
  add({
    id: "h1",
    category: "SEO",
    title: "Hauptüberschrift (H1)",
    weight: 6,
    value: String(h1s.length),
    ...(h1s.length === 1
      ? { status: "ok", message: `Genau eine Hauptüberschrift: '${h1s.first().text().trim().slice(0, 80)}'.` }
      : h1s.length === 0
        ? { status: "fail", message: "Die Seite hat keine H1-Überschrift. Google und Besucher erkennen das Thema der Seite schlechter.", tip: "Die wichtigste Überschrift als <h1> auszeichnen." }
        : { status: "warn", message: `Die Seite hat ${h1s.length} H1-Überschriften. Üblich ist genau eine.`, tip: "Nur die Hauptüberschrift als <h1> lassen, weitere als <h2>." }),
  });

  const lang = ($("html").attr("lang") || "").trim();
  add({
    id: "lang",
    category: "SEO",
    title: "Sprache der Seite",
    weight: 3,
    value: lang || "–",
    ...(lang
      ? { status: "ok", message: `Die Seitensprache ist als '${lang}' angegeben.` }
      : { status: "warn", message: "Die Seitensprache ist nicht angegeben. Screenreader und Suchmaschinen müssen raten.", tip: '<html lang="de"> setzen.' }),
  });

  const robotsMeta = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  add({
    id: "indexable",
    category: "SEO",
    title: "Sichtbarkeit für Google",
    weight: 10,
    ...(robotsMeta.includes("noindex")
      ? { status: "fail", message: "Die Seite sagt Google ausdrücklich, sie nicht aufzunehmen (noindex). Sie taucht in keiner Suche auf.", tip: "Die noindex-Angabe entfernen, falls das nicht beabsichtigt ist." }
      : { status: "ok", message: "Die Seite darf von Suchmaschinen aufgenommen werden." }),
  });

  // --- Pflichtangaben ----------------------------------------------------
  const linkMatches = (patterns) => {
    let found = false;
    $("a").each((_, el) => {
      const text = ($(el).text() || "").toLowerCase();
      const href = ($(el).attr("href") || "").toLowerCase();
      if (patterns.some((p) => text.includes(p) || href.includes(p))) found = true;
    });
    return found;
  };

  add({
    id: "impressum",
    category: "Pflichtangaben",
    title: "Impressum",
    weight: 8,
    ...(linkMatches(["impressum", "imprint", "legal-notice", "anbieterkennzeichnung"])
      ? { status: "ok", message: "Ein Link zum Impressum ist vorhanden." }
      : { status: "fail", message: "Kein Impressum-Link gefunden. In Deutschland ist das Impressum Pflicht und abmahnfähig.", tip: "Impressum anlegen und von jeder Seite aus verlinken, meist im Footer." }),
  });

  add({
    id: "datenschutz",
    category: "Pflichtangaben",
    title: "Datenschutzerklärung",
    weight: 8,
    ...(linkMatches(["datenschutz", "privacy"])
      ? { status: "ok", message: "Ein Link zur Datenschutzerklärung ist vorhanden." }
      : { status: "fail", message: "Kein Link zur Datenschutzerklärung gefunden. Die DSGVO verlangt sie auf jeder Website.", tip: "Datenschutzerklärung anlegen und im Footer verlinken." }),
  });

  // --- Barrierefreiheit --------------------------------------------------
  const imgs = $("img");
  const missingAlt = imgs.filter((_, el) => {
    const alt = $(el).attr("alt");
    return alt === undefined;
  }).length;
  add({
    id: "alt",
    category: "Barrierefreiheit",
    title: "Bilder mit Alternativtext",
    weight: 4,
    value: `${imgs.length - missingAlt} von ${imgs.length}`,
    ...(imgs.length === 0
      ? { status: "ok", message: "Auf der Startseite sind keine Bilder eingebunden." }
      : missingAlt === 0
        ? { status: "ok", message: `Alle ${imgs.length} Bilder haben einen Alternativtext.` }
        : missingAlt / imgs.length <= 0.3
          ? { status: "warn", message: `${missingAlt} von ${imgs.length} Bildern haben keinen Alternativtext.`, tip: "Jedem Bild ein alt-Attribut geben, das beschreibt, was zu sehen ist." }
          : { status: "fail", message: `${missingAlt} von ${imgs.length} Bildern haben keinen Alternativtext. Blinde Besucher und Google erfahren nicht, was gezeigt wird.`, tip: "Jedem Bild ein alt-Attribut geben." }),
  });

  // --- Technik -----------------------------------------------------------
  const favicon = $('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;
  add({
    id: "favicon",
    category: "Technik",
    title: "Favicon",
    weight: 2,
    ...(favicon
      ? { status: "ok", message: "Ein Favicon ist eingebunden." }
      : { status: "warn", message: "Kein Favicon gefunden. Im Browser-Tab und in Lesezeichen bleibt das Symbol leer.", tip: "Ein Favicon erstellen und im <head> verlinken." }),
  });

  const og = $('meta[property="og:title"], meta[property="og:image"]').length > 0;
  add({
    id: "opengraph",
    category: "Technik",
    title: "Vorschau beim Teilen (Open Graph)",
    weight: 3,
    ...(og
      ? { status: "ok", message: "Beim Teilen auf WhatsApp, Facebook oder LinkedIn erscheint eine Vorschau." }
      : { status: "warn", message: "Keine Open-Graph-Angaben. Beim Teilen des Links gibt es kein Vorschaubild und keinen Titel.", tip: "og:title, og:description und og:image im <head> setzen." }),
  });

  const score = computeScore(checks);
  return { finalUrl, httpStatus, score, checks, summary: summarize(score, checks) };
}

export function computeScore(checks) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => {
    if (c.status === "ok") return s + c.weight;
    if (c.status === "warn") return s + c.weight * 0.5;
    return s;
  }, 0);
  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

function summarize(score, checks) {
  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  let verdict;
  if (score >= 85) verdict = "Sehr gut. Die Seite ist technisch in guter Verfassung.";
  else if (score >= 65) verdict = "Solide Basis, aber mit klaren Verbesserungsmöglichkeiten.";
  else if (score >= 40) verdict = "Die Seite hat mehrere ernste Schwachstellen, die Kunden und Google abschrecken.";
  else verdict = "Die Seite braucht dringend eine Überarbeitung.";
  return { verdict, fails, warns };
}
