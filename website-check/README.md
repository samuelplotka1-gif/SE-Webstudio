# SE-Webstudio Website-Check

Kostenloser Website-Check als Akquise-Werkzeug und Lead-Magnet für die Agentur.
Eine Domain eingeben, und das Tool prüft die Startseite auf Geschwindigkeit,
Sicherheit, Google-Tauglichkeit, Pflichtangaben und Barrierefreiheit. Heraus
kommt eine Punktzahl von 0 bis 100 und eine Liste mit Erklärungen in einfacher
Sprache, die man direkt an einen potenziellen Kunden schicken kann.

## Starten

```bash
cd website-check
npm install
npm start
```

Dann im Browser `http://localhost:3000` öffnen.

## Auf der Kommandozeile

```bash
npm run check -- beispiel-firma.de
```

## Tests

```bash
npm test
```

## Was geprüft wird

| Bereich          | Prüfung                                              |
|------------------|------------------------------------------------------|
| Sicherheit       | HTTPS erreichbar                                     |
| Geschwindigkeit  | Ladezeit des HTML, Größe des HTML                    |
| Mobil            | Viewport-Angabe vorhanden                            |
| SEO              | Titel, Meta-Beschreibung, H1, Sprache, kein noindex  |
| Pflichtangaben   | Impressum-Link, Datenschutz-Link                     |
| Barrierefreiheit | Alternativtexte bei Bildern                          |
| Technik          | Favicon, Open-Graph-Angaben                          |

Jede Prüfung hat ein Gewicht. Bestanden gibt volle Punkte, ein Hinweis die
Hälfte, ein Fehler nichts. Die Prüflogik liegt in `src/analyze.js` und ist
ohne Netzwerk testbar. Der Abruf der Seite liegt in `src/fetchSite.js`.

## Kontakte (Leads)

Vor dem Ergebnis müssen Besucher ihre E-Mail-Adresse eingeben und der
Kontaktaufnahme zustimmen. Jeder Check wird mit Zeitpunkt, E-Mail, optionalem
Namen, Domain und Punktzahl in `data/leads.jsonl` gespeichert. Die Datei ist
nicht im Git.

```bash
npm run leads        # alle Kontakte anzeigen, neueste zuerst
```

Optional lässt sich jeder neue Kontakt zusätzlich an einen Webhook schicken,
etwa Zapier, Make oder ein CRM:

```bash
LEAD_WEBHOOK_URL=https://hooks.zapier.com/... npm start
```

Weitere Einstellungen:

| Variable          | Bedeutung                                                    |
|-------------------|--------------------------------------------------------------|
| `PORT`            | Port des Servers, Standard 3000                              |
| `LEADS_FILE`      | Pfad der Kontaktdatei, Standard `data/leads.jsonl`           |
| `LEAD_WEBHOOK_URL`| Webhook, an den jeder neue Kontakt als JSON geschickt wird   |
| `REQUIRE_EMAIL=0` | E-Mail-Pflicht abschalten, z. B. für interne Nutzung          |
| `TRUST_PROXY=1`   | Nur hinter einem Reverse-Proxy setzen, sonst ist die Drossel umgehbar |
| `ALLOW_PRIVATE=1` | Nur für lokale Tests: hebt Host- und Port-Sperre auf. Nie im Betrieb |

Die Seite `public/datenschutz.html` ist ein Platzhalter und muss vor dem
Live-Gang durch die eigene Datenschutzerklärung ersetzt werden.

## Schnittstelle

`POST /api/check` mit `{ "url": "beispiel-firma.de", "email": "max@firma.de",
"name": "Max", "consent": true }`. Antwort ist JSON mit `score`, `summary` und
`checks`. Maximal 10 Anfragen pro Minute und IP.

## Sicherheit

Das Tool ruft fremde Adressen im Auftrag von Besuchern ab und ist damit ein
klassischer Kandidat für SSRF. Es prüft deshalb DNS-Auflösung, jede
Weiterleitung und den Port, liest höchstens 3 MB, setzt Sicherheits-Header
und gibt keine internen Fehler nach außen. Details, Hintergründe und eine
Checkliste für den Betrieb stehen in [SICHERHEIT.md](SICHERHEIT.md).

## Nächste Schritte

- Bericht als PDF mit Agentur-Logo zum Verschicken
- In die Agentur-Website einbauen
