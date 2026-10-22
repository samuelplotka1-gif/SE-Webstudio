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

## Schnittstelle

`POST /api/check` mit `{ "url": "beispiel-firma.de" }` oder
`GET /api/check?url=beispiel-firma.de`. Antwort ist JSON mit `score`,
`summary` und `checks`. Maximal 10 Anfragen pro Minute und IP.

## Nächste Schritte

- E-Mail-Feld vor dem Ergebnis, damit aus dem Check ein Kontakt wird
- Bericht als PDF mit Agentur-Logo zum Verschicken
- In die Agentur-Website einbauen
