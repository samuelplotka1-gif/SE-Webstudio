/*
 * ============================================================================
 * leads.js – Kontakte (Leads) prüfen, speichern und wieder einlesen
 * ============================================================================
 *
 * WOFÜR IST DIESE DATEI DA?
 * Ein "Lead" ist ein möglicher Kunde, der Interesse gezeigt hat – hier:
 * jemand, der seine Webseite prüfen lässt und dabei seine E-Mail angibt.
 * Diese Datei kümmert sich um alles rund um diese Kontakte:
 *   1. isValidEmail – prüft, ob eine E-Mail-Adresse plausibel aussieht.
 *   2. saveLead     – speichert einen Kontakt in einer Datei (und schickt ihn
 *                     auf Wunsch zusätzlich an einen anderen Dienst weiter).
 *   3. readLeads    – liest alle gespeicherten Kontakte wieder ein.
 *
 * WIE HÄNGT SIE MIT DEN ANDEREN DATEIEN ZUSAMMEN?
 *   - src/server.js     → benutzt isValidEmail und saveLead, wenn jemand
 *                         im Browser einen Check startet.
 *   - src/leads-cli.js  → benutzt readLeads, um dir in der Konsole alle
 *                         Kontakte anzuzeigen ("npm run leads").
 *   - test/leads.test.js → prüft automatisch, ob diese Funktionen richtig arbeiten.
 *
 * WO LANDEN DIE DATEN?
 * In der Datei data/leads.jsonl. "JSONL" heißt "JSON Lines": Jede Zeile ist
 * ein eigener Datensatz im JSON-Format – wie ein Karteikasten, in dem jede
 * Karteikarte eine Zeile ist.
 * ============================================================================
 */

// --- Importe ----------------------------------------------------------------
// "fs" steht für "file system" (Dateisystem). Damit kann Node.js Dateien
// lesen, schreiben und Ordner anlegen. Die Variante "fs/promises" arbeitet
// mit "await" (siehe unten) – das macht den Code einfacher zu lesen.
import fs from "node:fs/promises";

// "path" setzt Dateipfade richtig zusammen (egal ob Windows, Mac oder Linux).
import path from "node:path";

// --- Standard-Speicherort ---------------------------------------------------
// Der Ort, an dem die Kontakte gespeichert werden, falls nichts anderes
// eingestellt ist. "process.cwd()" ist der Ordner, aus dem das Programm
// gestartet wurde (cwd = "current working directory", aktueller Ordner).
// Großbuchstaben im Namen (DEFAULT_FILE) sind eine Konvention für feste
// Einstellungswerte, die sich während des Programms nie ändern.
const DEFAULT_FILE = path.join(process.cwd(), "data", "leads.jsonl");

// ============================================================================
// Funktion 1: isValidEmail
// ============================================================================
/** Einfache, großzügige E-Mail-Prüfung: etwas@etwas.tld */
// "export" bedeutet: Diese Funktion darf von anderen Dateien importiert
// werden. Ohne "export" wäre sie nur in dieser Datei sichtbar.
// "value" ist der "Parameter": der Wert, den man der Funktion beim Aufruf
// mitgibt – hier die E-Mail-Adresse, die geprüft werden soll.
export function isValidEmail(value) {
  // Den Wert sicher in Text umwandeln ("String" = Zeichenkette, also Text).
  // "value || ''" heißt: Ist value leer oder undefined, nimm einen leeren Text.
  // ".trim()" entfernt Leerzeichen am Anfang und Ende – Nutzer tippen oft
  // versehentlich ein Leerzeichen mit.
  const s = String(value || "").trim();

  // "return" gibt das Ergebnis der Funktion zurück: true (gültig) oder false.
  // "&&" heißt "und": Beide Bedingungen müssen stimmen.
  //   1. Höchstens 254 Zeichen – länger darf eine E-Mail-Adresse offiziell nicht sein.
  //   2. Das Muster passt. Das Muster zwischen den Schrägstrichen /.../ ist ein
  //      "regulärer Ausdruck" (kurz Regex): eine Mini-Sprache, um Textmuster
  //      zu beschreiben. Dieses hier bedeutet übersetzt:
  //        ^            Anfang des Textes
  //        [^\s@]+      ein oder mehr Zeichen, die KEIN Leerzeichen und KEIN @ sind
  //        @            genau ein @-Zeichen
  //        [^\s@]+      wieder Zeichen ohne Leerzeichen/@ (der Domain-Name)
  //        \.           ein Punkt
  //        [^\s@]{2,}   mindestens 2 Zeichen (die Endung, z. B. "de" oder "com")
  //        $            Ende des Textes
  //      ".test(s)" prüft, ob der Text s zu diesem Muster passt.
  // Warum "großzügig"? Eine 100 % exakte E-Mail-Prüfung ist extrem kompliziert.
  // Lieber ein paar seltsame Adressen durchlassen als echte Kunden abweisen.
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

// ============================================================================
// Funktion 2: saveLead
// ============================================================================
/**
 * Speichert einen Kontakt als Zeile in data/leads.jsonl und schickt ihn
 * optional an einen Webhook (z. B. Zapier, Make oder ein CRM).
 * Fehler beim Webhook werden nur protokolliert, der Check läuft trotzdem weiter.
 */
// Ein "Webhook" ist eine Internet-Adresse, an die man automatisch Daten
// schickt – wie ein Briefkasten eines anderen Programms. Ein "CRM" ist eine
// Software zur Kundenverwaltung.
// "async" heißt: Die Funktion macht Dinge, die etwas dauern (Datei schreiben,
// Daten verschicken). Mit "await" wartet sie darauf, ohne alles zu blockieren.
// Parameter:
//   lead    = ein "Objekt" mit den Kontaktdaten. Ein Objekt ist eine Sammlung
//             von beschrifteten Werten, z. B. { email: "a@b.de", score: 70 }.
//   options = zusätzliche Einstellungen. "= {}" ist ein Standardwert:
//             Gibt man nichts mit, ist options ein leeres Objekt.
//             (Die Tests nutzen das, um in eine Testdatei statt in die echte zu schreiben.)
export async function saveLead(lead, options = {}) {
  // Wohin speichern? Reihenfolge: 1. options.file, 2. Umgebungsvariable
  // LEADS_FILE, 3. der Standardort. "||" nimmt den ersten Wert, der nicht leer ist.
  const file = options.file || process.env.LEADS_FILE || DEFAULT_FILE;

  // Welcher Webhook? "??" ist fast wie "||", mit einem Unterschied:
  // Es greift NUR, wenn der linke Wert null oder undefined ist.
  // So kann ein Test bewusst "webhook: null" setzen … und das ist dann ernst
  // gemeint: kein Webhook. (Ein leerer Text "" würde bei "??" stehen bleiben.)
  const webhook = options.webhook ?? process.env.LEAD_WEBHOOK_URL;

  // Den Datensatz zusammenbauen, der gespeichert wird – unsere "Karteikarte".
  const record = {
    // Datum und Uhrzeit jetzt, in einem weltweit einheitlichen Format
    // (ISO, z. B. "2026-11-07T10:15:00.000Z"), damit man später sortieren kann.
    createdAt: new Date().toISOString(),

    // E-Mail ohne Leerzeichen und in Kleinbuchstaben. Warum klein?
    // "Max@Firma.de" und "max@firma.de" sind dieselbe Adresse – so
    // entstehen keine doppelten Einträge in unterschiedlicher Schreibweise.
    email: String(lead.email).trim().toLowerCase(),

    // Die geprüfte Domain (z. B. "firma.de") und die erreichte Punktzahl.
    host: lead.host,
    score: lead.score,

    // Wir speichern nur, wenn zugestimmt wurde (das prüft server.js vorher).
    // Diese Notiz dient als Nachweis für den Datenschutz.
    consent: true,

    // Den Namen nur aufnehmen, wenn einer angegeben wurde.
    // "? :" ist eine Kurzform von wenn/dann/sonst ("ternärer Operator"):
    //   Bedingung ? Wert-wenn-ja : Wert-wenn-nein
    // Die drei Punkte "..." ("Spread") kippen den Inhalt eines Objekts hier
    // hinein. Ein leeres Objekt {} fügt also einfach nichts hinzu.
    // ".slice(0, 120)" schneidet nach 120 Zeichen ab – als Schutz vor
    // absurd langen Eingaben.
    ...(lead.name ? { name: String(lead.name).trim().slice(0, 120) } : {}),
  };

  // Den Ordner "data" anlegen, falls es ihn noch nicht gibt.
  // "path.dirname(file)" ist der Ordner-Teil des Pfads (ohne Dateinamen).
  // "recursive: true" legt auch fehlende Zwischenordner an und meckert nicht,
  // wenn der Ordner schon existiert.
  await fs.mkdir(path.dirname(file), { recursive: true });

  // Den Datensatz als eine Zeile ans Ende der Datei anhängen ("append").
  // JSON.stringify wandelt das Objekt in Text um, "\n" ist ein Zeilenumbruch.
  // Warum anhängen statt die ganze Datei neu zu schreiben? Es ist schneller
  // und alte Einträge können dabei nicht versehentlich verloren gehen.
  // "utf8" ist die Zeichenkodierung – damit Umlaute wie ä, ö, ü korrekt bleiben.
  await fs.appendFile(file, JSON.stringify(record) + "\n", "utf8");

  // Nur wenn ein Webhook eingestellt ist, die Daten zusätzlich dorthin schicken.
  if (webhook) {
    // Sicherheitsnetz: Wenn das Verschicken scheitert, soll das Programm
    // nicht abstürzen. Der Kontakt ist ja schon in der Datei gespeichert.
    try {
      // "fetch" schickt eine Anfrage an eine Internet-Adresse.
      const res = await fetch(webhook, {
        // POST = wir schicken Daten hin.
        method: "POST",
        // Wir sagen dem Empfänger: "Was jetzt kommt, ist JSON."
        headers: { "content-type": "application/json" },
        // Der eigentliche Inhalt: unser Datensatz als Text.
        body: JSON.stringify(record),
        // Nach 8 Sekunden aufgeben, damit wir nicht ewig warten,
        // falls der andere Dienst hängt.
        signal: AbortSignal.timeout(8000),
      });

      // "res.ok" ist true, wenn der Empfänger "alles gut" geantwortet hat.
      // Wenn nicht, notieren wir das in der Konsole.
      if (!res.ok) console.error(`Lead-Webhook antwortete mit Status ${res.status}`);
    } catch (err) {
      // Netzwerkfehler oder Zeitüberschreitung: nur protokollieren.
      console.error(`Lead-Webhook fehlgeschlagen: ${err.message}`);
    }
  }

  // Den gespeicherten Datensatz zurückgeben – praktisch für Tests,
  // die nachprüfen wollen, was genau gespeichert wurde.
  return record;
}

// ============================================================================
// Funktion 3: readLeads
// ============================================================================
/** Liest alle gespeicherten Kontakte, neueste zuerst. */
// Der Parameter "file" hat einen Standardwert: Wird nichts mitgegeben,
// nehmen wir LEADS_FILE oder den Standardort (wie bei saveLead).
export async function readLeads(file = process.env.LEADS_FILE || DEFAULT_FILE) {
  // "let" erzeugt eine Variable, deren Wert sich später noch ändern darf
  // (im Gegensatz zu "const"). Hier ist sie zuerst leer und bekommt im
  // try-Block den Dateiinhalt.
  let text;

  // Versuchen, die Datei als Text zu lesen.
  try {
    text = await fs.readFile(file, "utf8");
  } catch (err) {
    // "ENOENT" ist der Fehlercode für "Datei gibt es nicht".
    // Das ist kein echtes Problem: Es gibt dann einfach noch keine Kontakte,
    // also geben wir eine leere Liste [] zurück.
    if (err.code === "ENOENT") return [];

    // Jeder andere Fehler (z. B. keine Leserechte) ist ein echtes Problem.
    // "throw" wirft den Fehler weiter, damit der Aufrufer davon erfährt.
    throw err;
  }

  // Den Text Schritt für Schritt in eine Liste von Kontakten verwandeln.
  // Jede Zeile mit Punkt am Anfang ist ein Arbeitsschritt, der auf das
  // Ergebnis des vorherigen Schritts angewendet wird – wie ein Fließband.
  return text
    // 1. Den Text an jedem Zeilenumbruch zerschneiden → Array von Zeilen.
    .split("\n")
    // 2. Leere Zeilen aussortieren (die letzte Zeile ist nach "\n" immer leer).
    //    "Boolean" als Filter behält nur Werte, die nicht leer sind.
    .filter(Boolean)
    // 3. Jede Zeile von JSON-Text zurück in ein Objekt verwandeln.
    //    ".map" wendet eine Funktion auf jedes Element der Liste an.
    .map((line) => JSON.parse(line))
    // 4. Reihenfolge umdrehen: Neue Kontakte stehen am Dateiende,
    //    wir wollen sie aber zuerst sehen.
    .reverse();
}
