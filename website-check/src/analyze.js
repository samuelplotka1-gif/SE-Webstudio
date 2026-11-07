/*
 * ============================================================================
 * analyze.js – Die eigentliche Bewertung einer Webseite
 * ============================================================================
 *
 * WOFÜR IST DIESE DATEI DA?
 * Hier wird entschieden, was an einer Webseite gut oder schlecht ist.
 * Die Datei bekommt den Text (das HTML) einer Startseite und ein paar
 * Messwerte (Ladezeit, Größe, HTTPS ja/nein) und prüft damit 14 Punkte:
 * Sicherheit, Geschwindigkeit, Handy-Tauglichkeit, SEO, Pflichtangaben,
 * Barrierefreiheit und Technik. Am Ende kommt eine Punktzahl von 0 bis 100
 * und ein kurzes Urteil heraus.
 * Vergleich: Diese Datei ist der TÜV-Prüfer. Er fährt nicht selbst los,
 * um das Auto zu holen (das macht fetchSite.js), sondern prüft nur das,
 * was man ihm hinstellt.
 *
 * WIE HÄNGT SIE MIT DEN ANDEREN DATEIEN ZUSAMMEN?
 *   - src/fetchSite.js      → lädt die Seite und ruft dann analyze() auf.
 *   - test/analyze.test.js  → testet analyze() mit selbst ausgedachtem HTML,
 *                             ganz ohne Internet.
 *   - public/index.html     → zeigt das Ergebnis (die Prüfpunkte) im Browser an.
 *
 * WICHTIGE BEGRIFFE:
 *   - HTML: die Sprache, in der Webseiten geschrieben sind. Sie besteht aus
 *     "Tags" wie <title>, <h1>, <img> oder <a> (Link).
 *   - SEO: "Search Engine Optimization" – alles, was hilft, bei Google
 *     gut gefunden zu werden.
 * ============================================================================
 */

// "cheerio" ist eine Bibliothek, die HTML-Text in eine durchsuchbare
// Struktur verwandelt. Damit können wir z. B. fragen: "Gib mir alle Bilder"
// oder "Wie lautet der Titel?". "* as cheerio" heißt: Wir holen alles, was
// cheerio anbietet, und sprechen es über den Namen "cheerio" an.
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
// Zusätzlich hat jeder Prüfpunkt eine "category" (z. B. "SEO") und manche
// einen "value" (den gemessenen Wert, z. B. "1.20 s").
//
// Die geschweiften Klammern im Parameter ({ html, finalUrl, … }) holen die
// einzelnen Werte direkt aus dem Objekt, das fetchSite.js übergibt
// ("Destrukturierung"). So schreiben wir später einfach "html" statt
// "eingabe.html".
export function analyze({ html, finalUrl, loadTimeMs, bytes, httpsOk, httpStatus }) {
  // Das HTML mit cheerio einlesen. Das Ergebnis heißt üblicherweise "$".
  // Mit $("title") findet man dann z. B. alle <title>-Tags – genau wie mit
  // der bekannten Bibliothek jQuery im Browser. "|| ''" schützt vor leerem HTML.
  const $ = cheerio.load(html || "");

  // Ein leeres Array, in das wir nach und nach alle Prüfpunkte legen.
  const checks = [];

  // Eine kleine Hilfsfunktion: add(prüfpunkt) legt einen Prüfpunkt in die
  // Liste. Sie spart nur Schreibarbeit, weil wir sie 14-mal brauchen.
  const add = (c) => checks.push(c);

  // --- Sicherheit -------------------------------------------------------
  // PRÜFPUNKT: Ist die Seite über HTTPS erreichbar?
  // HTTPS verschlüsselt die Verbindung, wie ein verschlossener Briefumschlag
  // statt einer Postkarte.
  //
  // SO SIND ALLE PRÜFPUNKTE AUFGEBAUT (gilt für den ganzen Rest der Datei):
  //   add({
  //     id, category, title, weight   ← immer gleich
  //     ...(Bedingung ? {Ergebnis A} : {Ergebnis B})   ← je nach Messwert
  //   })
  // "Bedingung ? A : B" ist eine Kurzform für "wenn … dann A, sonst B".
  // Die drei Punkte "..." ("Spread") kippen die Felder des gewählten
  // Ergebnisses (status, message, tip) in den Prüfpunkt hinein.
  // Bei drei oder mehr Möglichkeiten werden mehrere "? :" hintereinander
  // gehängt – lies sie wie eine Liste: wenn … sonst wenn … sonst.
  add({
    id: "https",
    category: "Sicherheit",
    title: "Verschlüsselte Verbindung (HTTPS)",
    // Das Gewicht sagt, wie wichtig der Punkt für die Gesamtnote ist.
    // 15 ist das höchste Gewicht in dieser Datei – HTTPS ist sehr wichtig.
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
  // PRÜFPUNKT: Wie schnell lädt die Startseite?
  // Millisekunden in Sekunden umrechnen (1 Sekunde = 1000 Millisekunden).
  const seconds = loadTimeMs / 1000;
  add({
    id: "loadtime",
    category: "Geschwindigkeit",
    title: "Ladezeit der Startseite",
    weight: 15,
    // ".toFixed(2)" rundet auf 2 Nachkommastellen, z. B. 1.2345 → "1.23".
    value: `${seconds.toFixed(2)} s`,
    // Drei Stufen: bis 1,5 s = ok, bis 3 s = Warnung, darüber = durchgefallen.
    // Warum diese Grenzen? Studien zeigen: Ab etwa 3 Sekunden springen
    // viele Besucher ab, bevor sie überhaupt etwas sehen.
    ...(seconds <= 1.5
      ? { status: "ok", message: `Das HTML wurde in ${seconds.toFixed(2)} Sekunden geladen. Das ist schnell.` }
      : seconds <= 3
        ? { status: "warn", message: `Das HTML brauchte ${seconds.toFixed(2)} Sekunden. Das ist akzeptabel, aber nicht schnell.`, tip: "Caching aktivieren und Hosting prüfen." }
        : { status: "fail", message: `Das HTML brauchte ${seconds.toFixed(2)} Sekunden. Viele Besucher springen ab, bevor die Seite erscheint.`, tip: "Hosting prüfen, Caching aktivieren, unnötige Plugins entfernen." }),
  });

  // PRÜFPUNKT: Wie groß ist das HTML-Dokument?
  // Bytes in Kilobytes umrechnen (1 KB = 1024 Bytes) und auf ganze Zahlen
  // runden (Math.round). "bytes || 0" schützt davor, dass bytes fehlt.
  const kb = Math.round((bytes || 0) / 1024);
  add({
    id: "size",
    category: "Geschwindigkeit",
    title: "Größe des HTML-Dokuments",
    weight: 5,
    value: `${kb} KB`,
    // Bis 150 KB = ok, bis 500 KB = Warnung, darüber = durchgefallen.
    // Große Dokumente laden vor allem über das Handynetz langsam.
    ...(kb <= 150
      ? { status: "ok", message: `Das HTML ist ${kb} KB groß. Das ist schlank.` }
      : kb <= 500
        ? { status: "warn", message: `Das HTML ist ${kb} KB groß. Das ist recht viel für ein einzelnes Dokument.`, tip: "Inline-Skripte und -Styles auslagern, Page-Builder-Ballast reduzieren." }
        : { status: "fail", message: `Das HTML ist ${kb} KB groß. So große Dokumente bremsen besonders auf dem Handy.`, tip: "Seite entschlacken, Inline-Code auslagern." }),
  });

  // --- Mobil -------------------------------------------------------------
  // PRÜFPUNKT: Ist die Seite fürs Handy eingerichtet?
  // Der "Viewport" sagt dem Handy-Browser, wie breit er die Seite darstellen
  // soll. Wir suchen das Tag <meta name="viewport"> und lesen dessen
  // Attribut "content" aus. (Ein "Attribut" ist eine Zusatzangabe in einem
  // Tag, z. B. name="..." oder content="...".)
  const viewport = $('meta[name="viewport"]').attr("content");
  add({
    id: "viewport",
    category: "Mobil",
    title: "Mobile Darstellung (Viewport)",
    weight: 12,
    // Ok nur, wenn es den Viewport gibt UND er "width=device-width" enthält
    // (= "nimm die echte Breite des Geräts"). Das \s* in der Regex erlaubt
    // beliebig viele Leerzeichen um das "=" herum.
    ...(viewport && /width\s*=\s*device-width/i.test(viewport)
      ? { status: "ok", message: "Die Seite ist für Smartphones eingerichtet." }
      : {
          status: "fail",
          message: "Es fehlt die Viewport-Angabe. Auf dem Handy wird die Seite winzig oder verschoben dargestellt.",
          tip: '<meta name="viewport" content="width=device-width, initial-scale=1"> im <head> ergänzen.',
        }),
  });

  // --- SEO ---------------------------------------------------------------
  // PRÜFPUNKT: Hat die Seite einen guten Titel?
  // Der <title> ist der Text im Browser-Tab und die blaue Überschrift bei
  // Google. ".first()" nimmt nur den ersten Treffer, ".text()" liest den
  // Text daraus, ".trim()" entfernt Leerzeichen am Rand.
  const title = ($("title").first().text() || "").trim();
  add({
    id: "title",
    category: "SEO",
    title: "Seitentitel",
    weight: 8,
    // "–" als Platzhalter anzeigen, falls kein Titel da ist.
    value: title || "–",
    // Vier Fälle: kein Titel → durchgefallen; unter 20 Zeichen → zu kurz;
    // über 65 Zeichen → Google schneidet ab; sonst → ok.
    ...(!title
      ? { status: "fail", message: "Die Seite hat keinen Titel. Google zeigt dann irgendetwas an, oft nur die Domain.", tip: "Einen aussagekräftigen <title> setzen, z. B. 'Malerbetrieb Müller – Maler in Köln'." }
      : title.length < 20
        ? { status: "warn", message: `Der Titel '${title}' ist sehr kurz. Er verschenkt Platz in den Google-Ergebnissen.`, tip: "Leistung und Ort in den Titel aufnehmen." }
        : title.length > 65
          ? { status: "warn", message: `Der Titel ist ${title.length} Zeichen lang und wird bei Google abgeschnitten.`, tip: "Auf etwa 50 bis 60 Zeichen kürzen." }
          : { status: "ok", message: `Der Titel '${title}' ist vorhanden und hat eine gute Länge.` }),
  });

  // PRÜFPUNKT: Gibt es eine Meta-Beschreibung?
  // Das ist der kurze graue Text unter dem Titel in den Google-Ergebnissen.
  const desc = ($('meta[name="description"]').attr("content") || "").trim();
  add({
    id: "description",
    category: "SEO",
    title: "Meta-Beschreibung",
    weight: 6,
    value: desc || "–",
    // Gleiches Muster wie beim Titel: fehlt / zu kurz (< 50) / zu lang (> 170) / ok.
    ...(!desc
      ? { status: "fail", message: "Es gibt keine Meta-Beschreibung. Google schreibt sich dann selbst einen Text zusammen.", tip: "Eine Beschreibung mit 120 bis 160 Zeichen hinterlegen, die zum Klicken einlädt." }
      : desc.length < 50
        ? { status: "warn", message: "Die Meta-Beschreibung ist sehr kurz.", tip: "Auf 120 bis 160 Zeichen ausbauen." }
        : desc.length > 170
          ? { status: "warn", message: `Die Meta-Beschreibung ist ${desc.length} Zeichen lang und wird abgeschnitten.`, tip: "Auf 120 bis 160 Zeichen kürzen." }
          : { status: "ok", message: "Die Meta-Beschreibung ist vorhanden und hat eine gute Länge." }),
  });

  // PRÜFPUNKT: Gibt es genau eine Hauptüberschrift <h1>?
  // Die <h1> ist wie die Schlagzeile einer Zeitung: Es sollte genau eine geben.
  // $("h1") findet alle H1-Überschriften, ".length" ist ihre Anzahl.
  const h1s = $("h1");
  add({
    id: "h1",
    category: "SEO",
    title: "Hauptüberschrift (H1)",
    weight: 6,
    // String(...) wandelt die Zahl in Text um, damit sie angezeigt werden kann.
    value: String(h1s.length),
    // Genau 1 → ok (und wir zeigen die ersten 80 Zeichen der Überschrift);
    // 0 → durchgefallen; mehr als 1 → Warnung.
    // "===" vergleicht genau: gleicher Wert UND gleicher Typ.
    ...(h1s.length === 1
      ? { status: "ok", message: `Genau eine Hauptüberschrift: '${h1s.first().text().trim().slice(0, 80)}'.` }
      : h1s.length === 0
        ? { status: "fail", message: "Die Seite hat keine H1-Überschrift. Google und Besucher erkennen das Thema der Seite schlechter.", tip: "Die wichtigste Überschrift als <h1> auszeichnen." }
        : { status: "warn", message: `Die Seite hat ${h1s.length} H1-Überschriften. Üblich ist genau eine.`, tip: "Nur die Hauptüberschrift als <h1> lassen, weitere als <h2>." }),
  });

  // PRÜFPUNKT: Ist die Sprache der Seite angegeben?
  // Steht z. B. als <html lang="de"> ganz oben in der Seite. Vorleseprogramme
  // für Blinde ("Screenreader") wählen damit die richtige Aussprache.
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

  // PRÜFPUNKT: Darf Google die Seite überhaupt aufnehmen?
  // Mit <meta name="robots" content="noindex"> kann eine Seite Google sagen:
  // "Nimm mich nicht auf." Das passiert manchmal aus Versehen, z. B. wenn
  // eine Testversion der Seite einfach live geschaltet wurde.
  const robotsMeta = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  add({
    id: "indexable",
    category: "SEO",
    title: "Sichtbarkeit für Google",
    weight: 10,
    // ".includes" prüft, ob ein Text in einem anderen Text vorkommt.
    ...(robotsMeta.includes("noindex")
      ? { status: "fail", message: "Die Seite sagt Google ausdrücklich, sie nicht aufzunehmen (noindex). Sie taucht in keiner Suche auf.", tip: "Die noindex-Angabe entfernen, falls das nicht beabsichtigt ist." }
      : { status: "ok", message: "Die Seite darf von Suchmaschinen aufgenommen werden." }),
  });

  // --- Pflichtangaben ----------------------------------------------------
  // Hilfsfunktion: Gibt es auf der Seite einen Link, dessen Text oder
  // Adresse eines der Suchwörter enthält? Wir brauchen sie gleich zweimal
  // (Impressum und Datenschutz), deshalb steht sie einmal hier.
  // "patterns" ist ein Array von Suchwörtern, z. B. ["impressum", "imprint"].
  const linkMatches = (patterns) => {
    // Am Anfang haben wir noch nichts gefunden.
    let found = false;

    // ".each" ist eine "Schleife": Sie geht jeden Link (<a>-Tag) der Seite
    // einzeln durch und führt für jeden die Funktion aus – wie wenn man
    // jede Karte in einem Stapel einzeln umdreht und anschaut.
    // "_" ist ein Platzhalter für die Nummer des Links, die wir nicht brauchen.
    // "el" (element) ist der aktuelle Link.
    $("a").each((_, el) => {
      // Den sichtbaren Linktext in Kleinbuchstaben holen, z. B. "impressum".
      const text = ($(el).text() || "").toLowerCase();

      // Die Zieladresse des Links (Attribut "href"), z. B. "/impressum.html".
      const href = ($(el).attr("href") || "").toLowerCase();

      // ".some" prüft, ob MINDESTENS EIN Suchwort im Text oder in der
      // Adresse vorkommt. Wenn ja, merken wir uns: gefunden!
      if (patterns.some((p) => text.includes(p) || href.includes(p))) found = true;
    });

    // Ergebnis zurückgeben: true oder false.
    return found;
  };

  // PRÜFPUNKT: Gibt es ein Impressum?
  // In Deutschland Pflicht für geschäftliche Webseiten. Fehlt es, kann man
  // abgemahnt werden (= teurer Brief vom Anwalt). Wir suchen nach mehreren
  // Wörtern, weil Seiten das unterschiedlich nennen (auch auf Englisch).
  add({
    id: "impressum",
    category: "Pflichtangaben",
    title: "Impressum",
    weight: 8,
    ...(linkMatches(["impressum", "imprint", "legal-notice", "anbieterkennzeichnung"])
      ? { status: "ok", message: "Ein Link zum Impressum ist vorhanden." }
      : { status: "fail", message: "Kein Impressum-Link gefunden. In Deutschland ist das Impressum Pflicht und abmahnfähig.", tip: "Impressum anlegen und von jeder Seite aus verlinken, meist im Footer." }),
  });

  // PRÜFPUNKT: Gibt es eine Datenschutzerklärung?
  // Die DSGVO (das europäische Datenschutzgesetz) schreibt sie vor.
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
  // PRÜFPUNKT: Haben die Bilder einen Alternativtext?
  // Der "alt"-Text beschreibt ein Bild in Worten (<img alt="Team-Foto">).
  // Blinde Menschen bekommen ihn vorgelesen, und Google versteht so das Bild.
  // Zuerst alle Bilder der Seite finden.
  const imgs = $("img");

  // Dann zählen, wie viele Bilder GAR KEIN alt-Attribut haben.
  // ".filter" behält nur die Bilder, für die die Funktion true ergibt.
  const missingAlt = imgs.filter((_, el) => {
    // Das alt-Attribut des Bildes lesen.
    const alt = $(el).attr("alt");
    // "undefined" heißt: Das Attribut fehlt komplett. Ein leeres alt=""
    // zählt dagegen als ok – das ist der richtige Weg für reine
    // Schmuckbilder, die man nicht vorlesen muss.
    return alt === undefined;
  }).length;

  add({
    id: "alt",
    category: "Barrierefreiheit",
    title: "Bilder mit Alternativtext",
    weight: 4,
    // Zeigt z. B. "8 von 10" (Bilder MIT alt-Text von allen Bildern).
    value: `${imgs.length - missingAlt} von ${imgs.length}`,
    // Keine Bilder → ok; alle haben alt → ok; bis 30 % fehlen → Warnung;
    // mehr als 30 % fehlen → durchgefallen.
    // "missingAlt / imgs.length" ist der Anteil, z. B. 3 / 10 = 0.3 = 30 %.
    ...(imgs.length === 0
      ? { status: "ok", message: "Auf der Startseite sind keine Bilder eingebunden." }
      : missingAlt === 0
        ? { status: "ok", message: `Alle ${imgs.length} Bilder haben einen Alternativtext.` }
        : missingAlt / imgs.length <= 0.3
          ? { status: "warn", message: `${missingAlt} von ${imgs.length} Bildern haben keinen Alternativtext.`, tip: "Jedem Bild ein alt-Attribut geben, das beschreibt, was zu sehen ist." }
          : { status: "fail", message: `${missingAlt} von ${imgs.length} Bildern haben keinen Alternativtext. Blinde Besucher und Google erfahren nicht, was gezeigt wird.`, tip: "Jedem Bild ein alt-Attribut geben." }),
  });

  // --- Technik -----------------------------------------------------------
  // PRÜFPUNKT: Gibt es ein Favicon?
  // Das Favicon ist das kleine Symbol im Browser-Tab. Es kann auf mehrere
  // Arten eingebunden sein, deshalb suchen wir nach drei Varianten (durch
  // Kommas getrennt = "eines davon"). "~=" bedeutet: Das Wort "icon" kommt
  // irgendwo in rel vor. "> 0" heißt: mindestens eins gefunden → true.
  const favicon = $('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;
  add({
    id: "favicon",
    category: "Technik",
    title: "Favicon",
    // Nur Gewicht 2: schön zu haben, aber nicht entscheidend.
    weight: 2,
    ...(favicon
      ? { status: "ok", message: "Ein Favicon ist eingebunden." }
      : { status: "warn", message: "Kein Favicon gefunden. Im Browser-Tab und in Lesezeichen bleibt das Symbol leer.", tip: "Ein Favicon erstellen und im <head> verlinken." }),
  });

  // PRÜFPUNKT: Gibt es eine Vorschau für das Teilen in sozialen Netzwerken?
  // "Open Graph" (og:...) sind Angaben, aus denen WhatsApp, Facebook &
  // Co. die kleine Vorschau-Karte mit Bild und Titel bauen.
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

  // --- Ergebnis zusammenstellen ------------------------------------------
  // Aus allen Prüfpunkten die Gesamtpunktzahl (0–100) berechnen.
  const score = computeScore(checks);

  // Alles als ein Objekt zurückgeben: Adresse, Statuscode, Punktzahl,
  // die Liste aller Prüfpunkte und eine kurze Zusammenfassung.
  // (Schreibt man nur "score" statt "score: score", ist das eine erlaubte
  // Abkürzung, wenn Feldname und Variablenname gleich sind.)
  return { finalUrl, httpStatus, score, checks, summary: summarize(score, checks) };
}

// ============================================================================
// computeScore – Gesamtpunktzahl ausrechnen
// ============================================================================
// Funktioniert wie eine gewichtete Schulnote: Wichtige Punkte zählen mehr.
//   ok   = volle Punkte (das ganze Gewicht)
//   warn = halbe Punkte
//   fail = keine Punkte
// Am Ende: erreichte Punkte geteilt durch mögliche Punkte, mal 100.
// Beispiel: 80 von 100 möglichen Punkten → Punktzahl 80.
export function computeScore(checks) {
  // ".reduce" geht die Liste durch und "sammelt" dabei einen Wert auf –
  // wie beim Einkaufen, wo man Artikel für Artikel die Preise addiert.
  // "s" ist die bisherige Summe (startet bei 0), "c" der aktuelle Prüfpunkt.
  // Hier: alle Gewichte zusammenzählen = maximal mögliche Punkte.
  const total = checks.reduce((s, c) => s + c.weight, 0);

  // Jetzt die tatsächlich erreichten Punkte zusammenzählen.
  const earned = checks.reduce((s, c) => {
    // ok → das volle Gewicht dazuzählen.
    if (c.status === "ok") return s + c.weight;
    // warn → das halbe Gewicht dazuzählen.
    if (c.status === "warn") return s + c.weight * 0.5;
    // fail → nichts dazuzählen, Summe bleibt gleich.
    return s;
  }, 0);

  // Schutz vor "Teilen durch null": Gibt es gar keine Prüfpunkte (total = 0),
  // ist die Punktzahl 0. Sonst in Prozent umrechnen und auf eine ganze Zahl runden.
  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

// ============================================================================
// summarize – Kurzes Urteil in Worten
// ============================================================================
// Ohne "export": wird nur innerhalb dieser Datei benutzt.
function summarize(score, checks) {
  // Zählen, wie viele Prüfpunkte durchgefallen sind …
  const fails = checks.filter((c) => c.status === "fail").length;
  // … und wie viele eine Warnung haben.
  const warns = checks.filter((c) => c.status === "warn").length;

  // Eine Variable für das Urteil; der Text wird gleich darunter festgelegt.
  let verdict;

  // "if … else if … else": Die Bedingungen werden von oben nach unten
  // geprüft. Die ERSTE, die zutrifft, gewinnt – die restlichen werden
  // übersprungen. Wie Notenstufen: ab 85 sehr gut, ab 65 solide, usw.
  if (score >= 85) verdict = "Sehr gut. Die Seite ist technisch in guter Verfassung.";
  else if (score >= 65) verdict = "Solide Basis, aber mit klaren Verbesserungsmöglichkeiten.";
  else if (score >= 40) verdict = "Die Seite hat mehrere ernste Schwachstellen, die Kunden und Google abschrecken.";
  else verdict = "Die Seite braucht dringend eine Überarbeitung.";

  // Urteil und die beiden Zahlen zurückgeben – index.html zeigt sie an.
  return { verdict, fails, warns };
}
