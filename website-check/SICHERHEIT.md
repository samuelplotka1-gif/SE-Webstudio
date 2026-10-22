# Sicherheits-Review des Website-Checks

Dieses Dokument ist als Lernunterlage gedacht. Es beschreibt, welche
Schwachstellen das Tool in der ersten Fassung hatte, wie ein Angreifer sie
ausgenutzt hätte und wie sie behoben wurden. Die Einordnung folgt den
OWASP Top 10 (2021), der Liste der häufigsten Schwachstellen in
Webanwendungen.

Die Grundregel hinter fast allem hier: **Jede Eingabe von außen ist
feindlich, bis das Gegenteil geprüft ist.** Das gilt für die eingegebene
Domain, für die Antwort der geprüften Website und für jeden HTTP-Header.

---

## 1. SSRF: Das Tool als Brücke ins interne Netz

**OWASP A10:2021, Server-Side Request Forgery**

Der Website-Check ruft eine beliebige, vom Nutzer gewählte Adresse ab. Genau
das ist die klassische Ausgangslage für SSRF: Der Server macht Anfragen im
Auftrag eines Fremden. Wenn der Server in einem Netz steht, in dem es
interne Dienste gibt (Datenbank, Admin-Oberfläche, Cloud-Metadaten unter
`169.254.169.254`), kann ein Angreifer diese über das Tool erreichen.

Die erste Fassung hatte eine Sperre für `localhost` und private IP-Bereiche.
Die war aber auf drei Wegen zu umgehen:

**a) Domain, die intern auflöst.** Ein Angreifer registriert `harmlos.de` und
lässt sie per DNS auf `127.0.0.1` zeigen. Die Sperre prüfte nur den Text der
Eingabe, nie die tatsächliche IP.

*Fix:* `assertPublicHost()` löst den Namen per DNS auf und prüft **jede**
zurückgegebene Adresse mit `isPrivateIp()`. Die Prüfung deckt IPv4, IPv6 und
IPv4-mapped-IPv6 (`::ffff:127.0.0.1`) ab, dazu Sonderbereiche wie
Carrier-Grade NAT, Link-Local und NAT64.

**b) Weiterleitung.** `fetch()` folgte Weiterleitungen automatisch. Eine
harmlose öffentliche Seite kann per `Location: http://127.0.0.1:3000/`
weiterleiten, und der Server wäre blind gefolgt.

*Fix:* Weiterleitungen werden mit `redirect: "manual"` von Hand verfolgt.
Jeder Sprung durchläuft dieselbe Host-, Port- und Protokollprüfung wie die
Eingabe. Nach fünf Sprüngen ist Schluss.

**c) Beliebiger Port.** `firma.de:22` oder `firma.de:3306` waren erlaubt. Das
Tool hätte sich als Port-Scanner missbrauchen lassen: Die Antwort
"erreichbar" oder "nicht erreichbar" verrät, welche Dienste laufen.

*Fix:* Nur die Ports 80, 443, 8080 und 8443 sind zugelassen.

**Was bleibt:** Zwischen DNS-Prüfung und tatsächlichem Verbindungsaufbau
könnte ein Angreifer die DNS-Antwort ändern (DNS-Rebinding mit sehr kurzer
TTL). Das vollständig zu verhindern erfordert, die Verbindung an die geprüfte
IP zu binden. Für ein öffentliches Akquise-Tool ist das Restrisiko
vertretbar, der Server sollte aber ohnehin in keinem Netz mit sensiblen
internen Diensten stehen.

---

## 2. Speicherverbrauch: Eine riesige Antwort legt den Server lahm

**OWASP A04:2021, Insecure Design (Resource Exhaustion)**

Die erste Fassung lud die komplette Antwort mit `arrayBuffer()` in den
Speicher und schnitt sie erst danach auf 3 MB. Eine Seite, die endlos Daten
streamt, hätte den Prozess zum Absturz gebracht. Das ist ein Denial of
Service mit einer einzigen Anfrage.

*Fix:* `readCapped()` liest den Body stückweise und bricht bei 3 MB ab. Der
Bericht markiert die Antwort dann als `truncated`.

---

## 3. Fehlermeldungen verraten Interna

**OWASP A05:2021, Security Misconfiguration**

Der Server gab bei jedem Fehler `err.message` an den Nutzer zurück. Bei einem
unerwarteten Fehler (etwa im HTML-Parser) hätten dort Dateipfade oder
Bibliotheksnamen gestanden. Außerdem schickte Express bei ungültigem JSON
eine Standard-Fehlerseite mit Stacktrace.

*Fix:* Es gibt jetzt eine Klasse `UserError` für Meldungen, die der Nutzer
sehen darf. Alles andere wird protokolliert und mit einem generischen
"Interner Fehler" beantwortet. Ungültiges JSON und zu große Anfragen bekommen
knappe JSON-Antworten. Der Header `X-Powered-By: Express` ist abgeschaltet.

---

## 4. Fehlende Sicherheits-Header

**OWASP A05:2021, Security Misconfiguration**

Ohne diese Header verlässt sich die Seite allein auf fehlerfreien Code.
Jeder Header ist ein zusätzliches Sicherheitsnetz:

| Header                      | Schutz                                                         |
|-----------------------------|----------------------------------------------------------------|
| `Content-Security-Policy`   | Nur eigene Skripte und Styles laufen. Ein eingeschleustes `<script>` bleibt wirkungslos. Dafür wurden Script und CSS aus dem HTML in `app.js` und `style.css` ausgelagert. |
| `X-Frame-Options: DENY`     | Die Seite kann nicht in einem fremden iframe versteckt werden (Clickjacking). |
| `X-Content-Type-Options`    | Der Browser rät keine Dateitypen und führt keine getarnten Skripte aus. |
| `Referrer-Policy`           | Besucher-URLs landen nicht bei fremden Seiten.                  |
| `Strict-Transport-Security` | Browser nutzen künftig nur noch HTTPS (wird nur über HTTPS gesetzt). |

---

## 5. Drossel mit zwei Schwächen

**OWASP A04:2021, Insecure Design**

Die Tabelle der Anfragen pro IP wurde nie geleert. Bei vielen verschiedenen
IPs wäre der Speicher langsam vollgelaufen. Und hinter einem Reverse-Proxy
sehen alle Besucher wie dieselbe IP aus, die Drossel hätte alle gemeinsam
gesperrt.

*Fix:* Alte Einträge werden jede Minute entfernt. `TRUST_PROXY=1` schaltet die
Auswertung des `X-Forwarded-For`-Headers ein. Wichtig: Diese Variable darf
**nur** gesetzt werden, wenn wirklich ein Proxy davor steht, sonst kann jeder
Besucher seine IP im Header fälschen und die Drossel umgehen.

---

## 6. Gespeicherte Kontakte

**OWASP A01:2021, Broken Access Control** und **A03:2021, Injection**

Die Datei `data/leads.jsonl` enthält personenbezogene Daten. Sie wurde mit
Standardrechten angelegt, auf einem geteilten Server also oft für alle lesbar.
Außerdem ließ das Namensfeld Steuerzeichen durch. Ein Name wie
`Max\x1b[31m` hätte in der Terminal-Übersicht Farben und Cursor manipuliert
(ANSI-Injection), in Logs Zeilen vorgetäuscht.

*Fix:* Datei und Ordner werden mit Rechten `600` beziehungsweise `700`
angelegt. Steuerzeichen werden aus dem Namen entfernt. Die Anfrage ist auf
10 KB begrenzt.

---

## Was bereits in Ordnung war

- **XSS im Bericht:** Alle Texte aus der geprüften Seite (Titel,
  Beschreibung, Überschrift) werden vor der Anzeige mit `esc()` maskiert.
  Ohne das hätte eine geprüfte Seite Skripte in den Bericht einschleusen
  können.
- **Alternative IP-Schreibweisen:** `127.1`, `0x7f000001` oder `2130706433`
  normalisiert Node's URL-Parser zu `127.0.0.1`, die Sperre greift.
- **Abhängigkeiten:** `npm audit` meldet keine bekannten Schwachstellen.
  Regelmäßig wiederholen.

---

## Checkliste für den Betrieb

- [ ] `ALLOW_PRIVATE` ist **nicht** gesetzt.
- [ ] `TRUST_PROXY=1` nur, wenn ein Reverse-Proxy davor steht.
- [ ] Das Tool läuft hinter HTTPS (Proxy oder Hoster).
- [ ] Der Server steht in keinem Netz mit sensiblen internen Diensten.
- [ ] `data/` liegt außerhalb des Web-Roots und wird gesichert.
- [ ] `npm audit` läuft regelmäßig, etwa monatlich.
- [ ] `public/datenschutz.html` ist durch die echte Datenschutzerklärung ersetzt.

## Weiterlesen

- OWASP Top 10: https://owasp.org/Top10/
- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Node.js Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
