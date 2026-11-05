/*
 * ============================================================================
 * server.js – Der Webserver des Website-Checks
 * ============================================================================
 *
 * WOFÜR IST DIESE DATEI DA?
 * Ein "Server" ist ein Programm, das ständig läuft und auf Anfragen wartet –
 * wie ein Kellner, der im Restaurant steht und auf Bestellungen wartet.
 * Diese Datei startet so einen Server. Er macht zwei Dinge:
 *   1. Er liefert die Webseite aus (die Dateien im Ordner "public",
 *      z. B. public/index.html), damit man sie im Browser sehen kann.
 *   2. Er nimmt Prüfaufträge entgegen ("Bitte prüfe www.beispiel.de")
 *      und schickt das Ergebnis zurück.
 *
 * WIE HÄNGT SIE MIT DEN ANDEREN DATEIEN ZUSAMMEN?
 *   - public/index.html  → die Seite im Browser. Sie schickt die Anfrage hierher.
 *   - src/fetchSite.js   → lädt die fremde Webseite herunter und lässt sie prüfen.
 *   - src/analyze.js     → (wird von fetchSite.js benutzt) bewertet das HTML.
 *   - src/leads.js       → prüft E-Mail-Adressen und speichert Kontakte.
 *   Diese Datei ist also die "Zentrale", die alles verbindet.
 *
 * STARTEN: im Ordner website-check "npm start" eingeben,
 * dann im Browser http://localhost:3000 öffnen.
 * ============================================================================
 */

// --- Importe ----------------------------------------------------------------
// Ein "Import" holt Code aus einer anderen Datei oder einer Bibliothek
// (= fertiger Code, den andere geschrieben haben) in diese Datei.
// So muss man nicht alles selbst schreiben – wie Werkzeug aus dem Werkzeugkasten nehmen.

// "express" ist eine beliebte Bibliothek, mit der man in Node.js
// sehr einfach Webserver baut. Sie steht in package.json unter "dependencies".
import express from "express";

// "path" ist in Node.js eingebaut ("node:" heißt: kommt von Node selbst).
// Damit setzt man Dateipfade sicher zusammen, egal ob Windows ("\")
// oder Mac/Linux ("/") – path kümmert sich um die richtigen Trennzeichen.
import path from "node:path";

// "fileURLToPath" wandelt eine Datei-Adresse wie "file:///home/…/server.js"
// in einen normalen Pfad wie "/home/…/server.js" um. Brauchen wir gleich unten.
import { fileURLToPath } from "node:url";

// Unsere eigene Funktion aus fetchSite.js: Sie prüft eine Webseite.
// Eine "Funktion" ist ein benannter Code-Block, den man aufrufen kann –
// wie ein Rezept: einmal aufgeschrieben, beliebig oft nachkochbar.
// Die geschweiften Klammern { } heißen: Wir holen nur diese eine Sache aus der Datei.
import { checkSite } from "./fetchSite.js";

// Zwei Funktionen aus leads.js: E-Mail prüfen und Kontakt speichern.
// ("Lead" = ein möglicher Kunde, der Interesse gezeigt hat.)
import { isValidEmail, saveLead } from "./leads.js";

// --- Grundeinstellungen -----------------------------------------------------
// Eine "Variable" ist ein beschrifteter Behälter für einen Wert.
// "const" bedeutet: Der Behälter bekommt einmal einen Wert, der danach
// nicht mehr ausgetauscht wird (konstant).

// Den Ordner herausfinden, in dem diese Datei liegt (also ".../website-check/src").
// "import.meta.url" ist die Adresse dieser Datei. Mit "type": "module" in
// package.json gibt es das praktische "__dirname" nicht automatisch,
// deshalb bauen wir es hier selbst nach.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Unsere Server-App erzeugen. "app" ist ab jetzt unser Kellner,
// dem wir gleich beibringen, wie er auf welche Anfrage reagiert.
const app = express();

// Der "Port" ist wie eine Türnummer am Computer: Über diese Nummer
// erreicht der Browser unseren Server. "process.env.PORT" liest eine
// Umgebungsvariable (= Einstellung, die man von außen beim Start mitgibt).
// "||" heißt "oder": Ist keine PORT-Einstellung gesetzt, nehmen wir 3000.
// Warum? Hosting-Anbieter geben oft einen eigenen Port vor – lokal reicht 3000.
const PORT = process.env.PORT || 3000;

// --- Middleware -------------------------------------------------------------
// "Middleware" sind Zwischenschritte, die jede Anfrage durchläuft, bevor sie
// bearbeitet wird – wie eine Sicherheitskontrolle am Flughafen vor dem Gate.
// "app.use(...)" hängt so einen Zwischenschritt ein.

// Wenn der Browser Daten im JSON-Format schickt, packt dieser Schritt sie aus
// und legt sie in "req.body" ab. JSON ist ein Textformat für Daten,
// z. B. {"url": "beispiel.de"}. Ohne diese Zeile wäre req.body leer.
app.use(express.json());

// Alle Dateien im Ordner "public" direkt ausliefern (index.html, Bilder …).
// path.join setzt den Pfad zusammen: von "src" eine Ebene hoch ("..") und
// dann in "public". Ruft jemand http://localhost:3000 auf, bekommt er index.html.
app.use(express.static(path.join(__dirname, "..", "public")));

// --- Drossel (Schutz vor zu vielen Anfragen) --------------------------------
// Einfache Drossel: max. 10 Checks pro Minute und IP, damit niemand das Tool
// als Scanner missbraucht (also tausende fremde Seiten über uns abfragt).
// Die "IP" ist die Adresse eines Geräts im Internet – wie eine Hausnummer.

// Eine "Map" ist eine Art Nachschlagetabelle: zu jedem Schlüssel (hier die IP)
// speichert sie einen Wert (hier eine Liste mit Zeitpunkten der letzten Anfragen).
// Wie ein Notizbuch: "Besucher 1.2.3.4 war um 10:01, 10:02 und 10:05 da."
const hits = new Map();

// Diese Middleware gilt nur für Anfragen an "/api/check".
// Sie bekommt drei Dinge:
//   req  (request)  = die Anfrage, die reinkommt
//   res  (response) = die Antwort, die wir zurückschicken
//   next           = eine Funktion für "alles okay, weiter zum nächsten Schritt"
// "=>" ist eine Kurzschreibweise für eine Funktion ("Pfeilfunktion").
app.use("/api/check", (req, res, next) => {
  // Die IP-Adresse des Anfragenden merken.
  const ip = req.ip;

  // Die aktuelle Zeit in Millisekunden (1000 ms = 1 Sekunde).
  const now = Date.now();

  // Die Liste der bisherigen Zeitpunkte dieser IP holen. Gibt es noch keine,
  // nehmen wir eine leere Liste [] (ein "Array" = eine geordnete Liste von Werten).
  // ".filter(...)" behält nur die Einträge, für die die Bedingung stimmt:
  // hier nur Zeitpunkte, die weniger als 60.000 ms (= 1 Minute) her sind.
  // (Der Unterstrich in 60_000 dient nur der Lesbarkeit, wie ein Tausenderpunkt.)
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);

  // Eine "if"-Bedingung: Nur WENN die Aussage stimmt, wird der Code ausgeführt.
  // Waren es schon 10 oder mehr Anfragen in der letzten Minute, lehnen wir ab.
  // Status 429 ist der offizielle Code für "Zu viele Anfragen".
  // "return" beendet die Funktion sofort – next() wird dann nicht mehr erreicht.
  if (recent.length >= 10) return res.status(429).json({ error: "Zu viele Anfragen. Bitte kurz warten." });

  // Die aktuelle Anfrage zur Liste hinzufügen ("push" = hinten anhängen) …
  recent.push(now);

  // … und die aktualisierte Liste wieder im Notizbuch speichern.
  hits.set(ip, recent);

  // Alles in Ordnung: weiter zum eigentlichen Check (siehe unten).
  next();
});

// --- Einstellung: Ist die E-Mail Pflicht? -----------------------------------
// E-Mail-Pflicht lässt sich für interne Nutzung mit REQUIRE_EMAIL=0 abschalten.
// "!==" heißt "ist nicht gleich". Ergebnis ist true (wahr) oder false (falsch).
// Standardmäßig (nichts eingestellt) ist die E-Mail also Pflicht.
const requireEmail = process.env.REQUIRE_EMAIL !== "0";

// --- Der eigentliche Check --------------------------------------------------
// "app.post" legt fest, was passiert, wenn jemand Daten an "/api/check" SCHICKT.
// (POST = Daten senden, im Gegensatz zu GET = etwas abrufen.)
// "async" bedeutet: In dieser Funktion gibt es Schritte, die dauern
// (z. B. eine fremde Webseite laden). Mit "await" warten wir darauf,
// ohne dass der ganze Server stillsteht – wie Wäsche in die Maschine stecken
// und in der Zwischenzeit etwas anderes erledigen.
app.post("/api/check", async (req, res) => {
  // Die gesendeten Daten auspacken. Diese Schreibweise heißt "Destrukturierung":
  // Wir holen vier Werte auf einmal aus req.body heraus, statt
  // viermal "req.body.url", "req.body.email" usw. zu schreiben.
  // "|| {}" sorgt dafür, dass es nicht abstürzt, falls gar nichts geschickt wurde.
  const { url, email, name, consent } = req.body || {};

  // E-Mail prüfen, WENN sie Pflicht ist ODER trotzdem eine angegeben wurde.
  if (requireEmail || email) {
    // "!" dreht die Aussage um: "wenn die E-Mail NICHT gültig ist".
    // Status 400 bedeutet "fehlerhafte Anfrage" – der Fehler liegt beim Absender.
    if (!isValidEmail(email)) return res.status(400).json({ error: "Bitte eine gültige E-Mail-Adresse angeben." });

    // Die Zustimmung zur Kontaktaufnahme muss ausdrücklich "true" sein.
    // Das ist wegen des Datenschutzes (DSGVO) wichtig.
    if (consent !== true) return res.status(400).json({ error: "Bitte der Kontaktaufnahme zustimmen." });
  }

  // "try" / "catch": Wir VERSUCHEN etwas, und falls dabei ein Fehler passiert,
  // FANGEN wir ihn auf, statt dass das Programm abstürzt.
  // Wie ein Sicherheitsnetz beim Trapez.
  try {
    // Die Webseite prüfen lassen (passiert in fetchSite.js) und auf das Ergebnis warten.
    // "report" enthält danach u. a. die Punktzahl und alle Prüfpunkte.
    const report = await checkSite(url);

    // Nur wenn eine E-Mail angegeben wurde, den Kontakt speichern.
    if (email) {
      // Ein zweites, inneres Sicherheitsnetz: Klappt das Speichern nicht,
      // soll der Besucher sein Ergebnis TROTZDEM bekommen.
      try {
        await saveLead({ email, name, host: report.host, score: report.score });
      } catch (err) {
        // Den Fehler nur in der Konsole (dem Server-Protokoll) vermerken,
        // damit wir ihn später sehen können. Der Besucher merkt davon nichts.
        // Die `Backticks` erlauben es, mit ${...} Werte in einen Text einzusetzen.
        console.error(`Kontakt konnte nicht gespeichert werden: ${err.message}`);
      }
    }

    // Das Ergebnis als JSON an den Browser zurückschicken.
    // index.html liest es aus und zeigt es schön an.
    res.json(report);
  } catch (err) {
    // Ist beim Prüfen etwas schiefgegangen (z. B. Seite nicht erreichbar),
    // schicken wir die Fehlermeldung mit Status 400 zurück.
    res.status(400).json({ error: err.message });
  }
});

// --- Server starten ---------------------------------------------------------
// Jetzt öffnet der Kellner die Tür: Der Server lauscht ab sofort auf dem Port.
// Die Funktion in den Klammern wird einmal aufgerufen, sobald er bereit ist,
// und schreibt eine Erfolgsmeldung in die Konsole.
app.listen(PORT, () => {
  console.log(`SE-Webstudio Website-Check läuft auf http://localhost:${PORT}`);
});
