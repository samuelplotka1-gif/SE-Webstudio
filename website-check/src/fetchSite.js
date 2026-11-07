/*
 * ============================================================================
 * fetchSite.js – Eine fremde Webseite herunterladen und prüfen lassen
 * ============================================================================
 *
 * WOFÜR IST DIESE DATEI DA?
 * Wenn jemand "firma.de" eingibt, passiert hier Folgendes:
 *   1. normalizeInput – macht aus der Eingabe eine saubere Domain
 *                       und lehnt ungültige oder interne Adressen ab.
 *   2. fetchOnce      – lädt die Startseite einmal herunter und misst die Zeit.
 *   3. checkSite      – steuert alles: erst über HTTPS versuchen, sonst über
 *                       HTTP, und das Ergebnis dann an analyze.js übergeben.
 * Man kann sich das wie einen Boten vorstellen: Er prüft die Adresse,
 * holt das Paket (die Webseite) ab und bringt es zum Prüfer (analyze.js).
 *
 * WIE HÄNGT SIE MIT DEN ANDEREN DATEIEN ZUSAMMEN?
 *   - src/server.js  → ruft checkSite auf, wenn jemand im Browser prüft.
 *   - src/cli.js     → ruft checkSite auf, wenn man in der Konsole prüft
 *                      ("npm run check firma.de").
 *   - src/analyze.js → bekommt von hier das HTML und bewertet es.
 *   Diese Datei ist der einzige Teil, der wirklich ins Internet geht.
 *   analyze.js arbeitet nur mit dem fertigen Text – dadurch lässt es sich
 *   ohne Internet testen.
 * ============================================================================
 */

// Die Bewertungsfunktion aus analyze.js importieren.
import { analyze } from "./analyze.js";

// --- Feste Einstellungen ----------------------------------------------------

// Der "User-Agent" ist wie eine Visitenkarte: Mit jeder Anfrage sagen wir
// der fremden Webseite, wer wir sind. Manche Seiten blockieren Anfragen
// ohne User-Agent, deshalb geben wir einen an, der wie ein Browser beginnt
// und unseren Namen und unsere Webseite enthält.
const UA = "Mozilla/5.0 (compatible; SE-Webstudio-Check/1.0; +https://se-webstudio.de)";

// Höchstens 15.000 Millisekunden (= 15 Sekunden) auf eine Antwort warten.
// Warum? Ohne Grenze könnte eine kaputte Seite unseren Check ewig blockieren.
const TIMEOUT_MS = 15000;

// Höchstens 3 Megabyte HTML auswerten (3 × 1024 × 1024 Bytes).
// Ein "Byte" ist die kleinste Speichereinheit, ungefähr ein Buchstabe.
// Schutz davor, dass uns eine riesige Datei den Arbeitsspeicher füllt.
const MAX_BYTES = 3 * 1024 * 1024;

// ============================================================================
// Funktion 1: normalizeInput
// ============================================================================
/**
 * Normalisiert die Eingabe des Nutzers zu einem Hostnamen.
 * Akzeptiert "example.de", "www.example.de/seite", "https://example.de".
 */
// "Normalisieren" heißt: verschiedene Schreibweisen in eine einheitliche
// Form bringen – so wie man "Str.", "Strasse" und "Straße" vereinheitlicht.
// Der "Hostname" ist der Name eines Rechners im Internet, z. B. "www.firma.de".
export function normalizeInput(input) {
  // Eingabe in Text umwandeln und Leerzeichen am Rand entfernen.
  // "let", weil wir s gleich eventuell noch verändern.
  let s = String(input || "").trim();

  // Leere Eingabe? Dann sofort mit einer verständlichen Fehlermeldung abbrechen.
  // "throw new Error(...)" erzeugt einen Fehler und "wirft" ihn. Der Aufrufer
  // (z. B. server.js) fängt ihn mit catch auf und zeigt die Meldung an.
  if (!s) throw new Error("Bitte eine Domain eingeben.");

  // Fehlt vorne "http://" oder "https://", ergänzen wir "https://".
  // Die Regex /^https?:\/\//i bedeutet: Am Anfang (^) steht "http",
  // optional ein "s" (s?), dann "://". Das "i" am Ende ignoriert
  // Groß-/Kleinschreibung. Warum ergänzen? Das URL-Werkzeug unten
  // versteht die Adresse nur mit diesem Anfang.
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;

  // Eine Variable für das zerlegte Adress-Objekt vorbereiten.
  let url;

  // "new URL(...)" zerlegt eine Adresse in ihre Teile (Protokoll, Host,
  // Pfad …). Ist die Adresse kaputt, wirft es einen Fehler – den fangen wir
  // ab und ersetzen ihn durch eine freundliche deutsche Meldung.
  try {
    url = new URL(s);
  } catch {
    throw new Error("Das sieht nicht nach einer gültigen Domain aus.");
  }

  // Nur den Hostnamen nehmen (ohne Pfad wie "/seite") und kleinschreiben.
  const hostname = url.hostname.toLowerCase();

  // ALLOW_PRIVATE=1 nur für lokale Tests, im Betrieb bleiben interne Adressen gesperrt.
  // Warum sperren? Sonst könnte jemand unseren Server benutzen, um in das
  // interne Netzwerk zu schauen, in dem der Server steht (z. B. Router,
  // Datenbanken). Das ist eine bekannte Angriffsart ("SSRF").
  if (process.env.ALLOW_PRIVATE !== "1" && isPrivateHost(hostname)) {
    throw new Error("Interne Adressen können nicht geprüft werden.");
  }

  // Ist der Hostname eine IPv4-Adresse, also vier Zahlen mit Punkten
  // (z. B. "93.184.216.34")? \d steht für eine Ziffer, {1,3} für 1 bis 3 davon.
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

  // Wenn es KEINE IP-Adresse und NICHT "localhost" ist, muss es wie eine
  // normale Domain aussehen: Buchstaben/Ziffern/Punkte/Bindestriche, dann ein
  // Punkt und eine Endung mit mindestens 2 Buchstaben (z. B. ".de").
  if (!isIPv4 && hostname !== "localhost" && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) {
    throw new Error("Das sieht nicht nach einer gültigen Domain aus.");
  }

  // Host inkl. Port zurückgeben, damit z. B. firma.de:8080 geprüft werden kann.
  // (url.hostname = nur der Name, url.host = Name plus eventueller Port.)
  return url.host.toLowerCase();
}

// ============================================================================
// Hilfsfunktion: isPrivateHost
// ============================================================================
// Prüft, ob eine Adresse ins "private" (interne) Netz zeigt.
// Ohne "export" – sie wird nur hier in dieser Datei gebraucht.
function isPrivateHost(host) {
  // Typische interne Namen: der eigene Rechner ("localhost") und Namen,
  // die auf ".local" oder ".internal" enden. "||" heißt "oder".
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;

  // Versuchen, den Host als vier Zahlen zu lesen. Die runden Klammern ( )
  // in der Regex merken sich jede Zahl einzeln. "m" ist dann ein Array:
  // m[0] = alles, m[1] = erste Zahl, m[2] = zweite Zahl, usw.
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);

  // Kein Treffer = keine IP-Adresse = ein normaler Name → nicht privat.
  if (!m) return false;

  // Die ersten beiden Zahlen herausholen und von Text in echte Zahlen
  // umwandeln (Number). Die eckigen Klammern links verteilen die zwei
  // Werte auf zwei Variablen a und b ("Destrukturierung" eines Arrays).
  const [a, b] = [Number(m[1]), Number(m[2])];

  // Diese Bereiche sind weltweit für interne Netze reserviert:
  //   10.x.x.x, 127.x.x.x (eigener Rechner), 0.x.x.x,
  //   169.254.x.x, 172.16–31.x.x und 192.168.x.x (typisch für Heimnetze).
  // Trifft einer zu, ist das Ergebnis true.
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// ============================================================================
// Funktion 2: fetchOnce
// ============================================================================
// Lädt eine Adresse genau einmal herunter und misst, wie lange das dauert.
async function fetchOnce(url) {
  // Ein "AbortController" ist wie ein Notaus-Knopf für eine laufende Anfrage.
  const controller = new AbortController();

  // Einen Wecker stellen: Nach TIMEOUT_MS Millisekunden wird der Notaus-
  // Knopf gedrückt. setTimeout führt eine Funktion zeitverzögert aus.
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Die Startzeit merken, um später die Ladezeit auszurechnen.
  // performance.now() ist eine sehr genaue Stoppuhr.
  const started = performance.now();

  // "try … finally": Der finally-Teil läuft IMMER am Ende, egal ob alles
  // geklappt hat oder ein Fehler passiert ist. Wie "Licht ausmachen beim
  // Verlassen des Raums" – das soll auf jeden Fall passieren.
  try {
    // Die Seite anfordern und auf die Antwort warten.
    const res = await fetch(url, {
      // Weiterleitungen folgen (z. B. von http:// auf https:// oder
      // von firma.de auf www.firma.de) – so wie ein Browser es auch tut.
      redirect: "follow",
      // Den Notaus-Knopf mit dieser Anfrage verbinden.
      signal: controller.signal,
      // Zusatzinfos ("Header") an die Webseite:
      //   user-agent      = unsere Visitenkarte (siehe oben)
      //   accept          = wir möchten am liebsten HTML bekommen
      //   accept-language = bitte bevorzugt Deutsch, sonst Englisch
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8", "accept-language": "de,en;q=0.8" },
    });

    // Den kompletten Inhalt der Antwort als rohe Bytes einlesen.
    // Ein "Buffer" ist ein Behälter für rohe Daten (noch kein Text).
    const buf = Buffer.from(await res.arrayBuffer());

    // Ladezeit = jetzt minus Startzeit (in Millisekunden).
    const loadTimeMs = performance.now() - started;

    // Höchstens MAX_BYTES verwenden und in lesbaren Text umwandeln.
    // ".subarray(0, MAX_BYTES)" nimmt nur den vorderen Teil.
    const html = buf.subarray(0, MAX_BYTES).toString("utf8");

    // Alle wichtigen Infos als ein Objekt zurückgeben:
    //   ok       = hat die Seite "alles gut" gemeldet?
    //   status   = der Statuscode (200 = ok, 404 = nicht gefunden, …)
    //   finalUrl = die Adresse NACH allen Weiterleitungen
    //   html     = der Seiteninhalt als Text
    //   bytes    = die echte Gesamtgröße
    //   loadTimeMs = die gemessene Ladezeit
    return { ok: res.ok, status: res.status, finalUrl: res.url, html, bytes: buf.length, loadTimeMs };
  } finally {
    // Den Wecker abschalten – sonst würde er später noch klingeln,
    // obwohl wir längst fertig sind.
    clearTimeout(timer);
  }
}

// ============================================================================
// Funktion 3: checkSite (die Hauptfunktion dieser Datei)
// ============================================================================
/**
 * Ruft die Startseite einer Domain ab (erst HTTPS, dann HTTP) und analysiert sie.
 */
export async function checkSite(input) {
  // Schritt 1: Eingabe säubern. Wirft einen Fehler, wenn sie ungültig ist.
  const host = normalizeInput(input);

  // Drei Variablen für den Zwischenstand:
  //   result    = das Ergebnis von fetchOnce (null = "noch nichts da")
  //   httpsOk   = ob die Seite am Ende über HTTPS erreichbar war
  //   lastError = der letzte aufgetretene Fehler, für die Fehlermeldung
  let result = null;
  let httpsOk = false;
  let lastError = null;

  // Schritt 2: Zuerst die sichere Variante HTTPS versuchen.
  try {
    result = await fetchOnce(`https://${host}/`);
    // HTTPS ist "ok", wenn die Seite (auch nach Weiterleitungen) mit
    // "https://" endet. ".startsWith" prüft den Anfang eines Textes.
    httpsOk = result.finalUrl.startsWith("https://");
  } catch (err) {
    // Hat nicht geklappt – Fehler merken und gleich HTTP probieren.
    lastError = err;
  }

  // Schritt 3: Wenn HTTPS nicht ging, das unsichere HTTP versuchen.
  // Warum? Manche alten Seiten haben kein HTTPS. Wir wollen sie trotzdem
  // prüfen können – genau dann ist der Check für sie ja besonders wertvoll.
  if (!result) {
    try {
      result = await fetchOnce(`http://${host}/`);
      // Vielleicht leitet HTTP doch auf HTTPS weiter – dann zählt es als ok.
      httpsOk = result.finalUrl.startsWith("https://");
    } catch (err) {
      lastError = err;
    }
  }

  // Schritt 4: Beides gescheitert? Dann eine verständliche Meldung erzeugen.
  if (!result) {
    // Das "?." ("optional chaining") greift nur dann auf .name zu, wenn
    // lastError existiert – sonst gäbe es selbst einen Fehler.
    // "AbortError" heißt: Unser Notaus-Wecker hat zugeschlagen (Zeit abgelaufen).
    const reason = lastError?.name === "AbortError" ? "Die Seite hat nicht innerhalb von 15 Sekunden geantwortet." : "Die Seite ist nicht erreichbar.";
    throw new Error(`${reason} (${host})`);
  }

  // Schritt 5: Das heruntergeladene HTML zur Bewertung an analyze.js geben.
  // Wir übergeben ein Objekt mit allen Infos, die analyze braucht.
  const report = analyze({
    html: result.html,
    finalUrl: result.finalUrl,
    loadTimeMs: result.loadTimeMs,
    bytes: result.bytes,
    httpsOk,
    httpStatus: result.status,
  });

  // Schritt 6: Das Endergebnis zurückgeben: Domain, Prüfzeitpunkt und
  // alles aus dem Bericht. "...report" kopiert alle Felder des Berichts
  // (Punktzahl, Prüfpunkte, Zusammenfassung …) in dieses neue Objekt.
  return { host, checkedAt: new Date().toISOString(), ...report };
}
