# S&E Webstudio – Website

Öffentliche Website der S&E Webstudio. Landingpage mit zwei Wegen („Kostenlose Demo anfordern“ / „Gespräch buchen“), fünf Leistungsseiten mit „ab“-Preisen, ein Demo-Formular in drei Schritten mit Double-Opt-in und die Übergabe bestätigter Anfragen an das **agentur-crm**.

Technik wie im CRM: Next.js 16, React 19, TypeScript, zod. Kein CSS-Framework, keine Datenbank, keine Tracker.

## Was wo steht

| Was | Datei |
|---|---|
| Firmendaten, Umsatzsteuer-Regelung (`smallBusiness`) | `src/content/site.ts` |
| Leistungen, Pakete, „ab“-Preise, FAQ | `src/content/services.ts` |
| Branchenliste im Formular | `src/content/site.ts` → `industries` |
| Design (Farben, Schriften, alle Stile) | `src/app/globals.css` |
| Startseite | `src/app/page.tsx` |
| Leistungsseiten (eine Vorlage für alle 5) | `src/app/leistungen/[slug]/page.tsx` |
| Demo-Formular | `src/app/demo/demo-form.tsx` |
| Double-Opt-in, Aufräumen | `src/server/demo-service.ts` |
| Übergabe ans CRM | `src/server/crm.ts` |
| Mails (Bestätigung, Benachrichtigung) | `src/server/mail.ts` |
| Calendly-Einbindung | `src/app/termin/calendly-embed.tsx` |
| Impressum / Datenschutz (Entwurf) | `src/app/impressum`, `src/app/datenschutz` |

## Ablauf einer Demo-Anfrage

1. Besucher füllt 3 Schritte aus. Pflicht: Name, E-Mail, Firma, Branche, Beschreibung (30–1.200 Zeichen). Optional: Website, Telefon, Logo (PNG/JPG/WebP/SVG, max. 3 MB), Farben.
2. `POST /api/demo` prüft alles erneut. Dazu kommen ein unsichtbares Fallen-Feld gegen Bots (Honeypot), eine Mindest-Ausfüllzeit von 4 s und eine Begrenzung auf 5 Anfragen pro 10 Minuten und IP. Die Anfrage wird **vorläufig** in `storage/demo-anfragen/` abgelegt.
3. Bestätigungsmail mit Einmal-Link (48 h gültig, im Speicher steht nur der Hash des Tokens).
4. Der Link öffnet eine Seite mit **„Ja, Anfrage bestätigen“**. Bestätigt wird erst mit dem Knopf, weil Virenscanner in Firmenpostfächern Links automatisch öffnen.
5. Nach der Bestätigung geht die Anfrage per signiertem Webhook (`X-Signature: sha256=…`) ans CRM.
   - Sie kommt mit Quelle „Webseite“ und den Kategorien „Demo angefragt“ und „Website-Formular“ an.
   - Die Notiz enthält Beschreibung, Farben und einen signierten Logo-Link, der 30 Tage gilt.
   - Danach löscht die Website die Personendaten bei sich.
6. Optional geht eine Mail an `NOTIFY_EMAIL`, bis das CRM selbst benachrichtigt.
7. `POST /api/cron/aufraeumen` (alle 15 Min.):
   - löscht unbestätigte Anfragen nach 48 h und bestätigte nach 30 Tagen
   - wiederholt fehlgeschlagene CRM-Übergaben (bis zu 12 Versuche)

## Einrichten

```bash
npm install
cp .env.example .env      # Werte eintragen, siehe Kommentare in der Datei
npm run dev               # http://localhost:3100
```

Ohne `SMTP_HOST` landen Mails in der Entwicklung in `storage/outbox/`, und der Bestätigungslink steht zusätzlich in der Konsole. Ohne CRM-Webhook wird die Übergabe übersprungen.

### CRM verbinden

Im agentur-crm unter *Verwaltung → Automatisierungen → Webhooks → Webhook anlegen*:
1. Richtung **Eingehend** wählen, Name z. B. „Website Demo-Formular“.
2. Adresse und Geheimnis als `CRM_WEBHOOK_URL` und `CRM_WEBHOOK_SECRET` in die `.env` eintragen.

### Calendly

`NEXT_PUBLIC_CALENDLY_URL` auf den Link des Ereignistyps setzen und neu bauen. Der Kalender lädt erst nach einem Klick auf „Kalender laden“. Vorher geht keine Verbindung zu Calendly raus, deshalb ist kein Cookie-Banner nötig.

### Cronjob

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://se-webstudio.de/api/cron/aufraeumen
```

## Prüfen

```bash
npm test          # Tests: Formularprüfung, Double-Opt-in, Bot-Schutz, CRM-Payload & Signatur, Logo-Links
npm run typecheck
npm run lint
npm run build     # erzeugt .next/standalone für den Betrieb
```

## Vor dem Livegang

- [x] Firmendaten in `src/content/site.ts` eingetragen
- [ ] USt-IdNr. in `src/content/site.ts` → `vatId` nachtragen (erscheint dann automatisch im Impressum)
- [ ] Preise in `src/content/services.ts` prüfen, Abo-Laufzeit in der FAQ „Hosting & Betreuung“ eintragen
- [ ] Datenschutzerklärung vervollständigen und rechtlich prüfen lassen
- [ ] `.env` für Produktion: `SITE_URL`, `APP_SECRET`, SMTP, CRM-Webhook, Calendly, `CRON_SECRET`
- [ ] `storage/` muss beschreibbar und **nicht** öffentlich erreichbar sein
- [ ] Cronjob für `/api/cron/aufraeumen` einrichten

## Noch nicht hier, sondern im nächsten Projekt (CRM-Erweiterung)

Diese Punkte aus dem Ablauf gehören ins **agentur-crm** und sind bewusst nicht Teil der Website:
- Pipeline-Phasen „Demo angefragt“ und „Termin“
- KI-Einordnung mit Haiku
- Benachrichtigung bei neuen Leads
- Demo-Erstellung (Branchenvorlage plus Beschreibung, daraus Vorschau-Link und PDF)
- Versand am selben Tag
- nächtliche Wiedervorlage nach 3 Tagen (einmal, dann Schluss)
- Calendly-Buchung, die den Status auf „Termin“ setzt

Bis dahin kommen Demo-Anfragen als „Neuer Lead“ mit der Kategorie „Demo angefragt“ an.
