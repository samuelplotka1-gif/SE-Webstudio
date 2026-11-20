import type { Metadata } from "next";
import { company } from "@/content/site";

export const metadata: Metadata = { title: "Datenschutz" };

/**
 * Gerüst der Datenschutzerklärung – beschreibt, was diese Website tatsächlich tut.
 * Vor dem Livegang mit den Firmendaten ergänzen und rechtlich prüfen lassen.
 */
export default function Datenschutz() {
  return (
    <article className="wrap prose">
      <h1 className="display display--l">Datenschutz</h1>
      <p>
        <span className="placeholder">[Entwurf – vor dem Livegang rechtlich prüfen lassen]</span>
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        {company.legalName}, {company.street}, {company.postalCode} {company.city}, {company.email}
      </p>

      <h2>2. Hosting und Server-Logfiles</h2>
      <p>
        Diese Website wird bei <span className="placeholder">[Hoster, Standort Deutschland]</span> betrieben. Beim Aufruf werden technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser) für
        höchstens <span className="placeholder">[7]</span> Tage gespeichert, um den sicheren Betrieb zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2 id="cookies">3. Cookies, Speicherung im Browser und Tracking</h2>
      <p>
        Diese Website setzt <strong>keine Cookies</strong> und speichert auch sonst nichts in Ihrem Browser (kein Local Storage, keine vergleichbaren Techniken). Wir nutzen keine Analyse-,
        Tracking- oder Marketing-Dienste und binden keine Inhalte von Drittanbietern ein, die beim bloßen Aufruf Daten übertragen. Alle Schriften, Bilder und Skripte werden von unserem eigenen
        Server geladen.
      </p>
      <p>
        Weil wir nicht auf Ihr Endgerät zugreifen, ist eine Einwilligung nach § 25 Abs. 1 TDDDG nicht erforderlich – deshalb sehen Sie auch kein Cookie-Banner.
      </p>
      <p>
        Einzige Ausnahme ist der Terminkalender von Calendly (siehe Abschnitt 5): Er wird erst geladen, wenn Sie auf der Seite „Gespräch buchen“ ausdrücklich auf „Kalender laden“ klicken. Erst
        dann setzt Calendly eigene Cookies. Ihre Zustimmung speichern wir nicht – beim nächsten Besuch oder nach dem Neuladen der Seite ist der Kalender wieder deaktiviert. Sie widerrufen sie
        also, indem Sie die Seite neu laden oder verlassen. Bereits gesetzte Calendly-Cookies können Sie in Ihren Browser-Einstellungen löschen.
      </p>

      <h2>4. Demo-Anfrage (Formular mit Bestätigung)</h2>
      <p>
        Wenn Sie eine Demo anfordern, verarbeiten wir Name, E-Mail-Adresse, Firma, Branche und Ihre Beschreibung sowie freiwillig Website, Telefonnummer, Logo und Farbwünsche, um Ihre
        Demo zu erstellen und Ihnen zu schreiben (Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Maßnahmen).
      </p>
      <p>
        Wir senden Ihnen zuerst eine E-Mail mit einem Bestätigungslink (Double-Opt-in). Nicht bestätigte Anfragen löschen wir nach 48 Stunden automatisch. Nach der Bestätigung übertragen wir die
        Anfrage in unser internes Kundenverwaltungssystem (gehostet in <span className="placeholder">[Standort]</span>) und löschen die Personendaten auf dem Webserver. Ein hochgeladenes Logo
        bleibt dort höchstens 30 Tage gespeichert.
      </p>
      <p>
        Zur Einordnung Ihrer Anfrage nutzen wir den KI-Dienst Claude der Anthropic PBC <span className="placeholder">[Angaben zu Auftragsverarbeitung/Drittlandübermittlung ergänzen]</span>.
        Die KI trifft keine Entscheidungen über Sie; jede Demo wird von einem Menschen erstellt und versendet.
      </p>
      <p>
        Wenn wir nach dem Versand der Demo nichts von Ihnen hören, erinnern wir Sie höchstens einmal. Ihre Daten speichern wir, bis der Zweck entfällt, längstens{" "}
        <span className="placeholder">[Frist, z. B. 12 Monate]</span> nach dem letzten Kontakt, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
      </p>

      <h2 id="calendly">5. Terminbuchung mit Calendly</h2>
      <p>
        Für die Buchung von Gesprächen nutzen wir Calendly (Calendly LLC, USA). Der Kalender wird erst geladen, wenn Sie auf „Kalender laden“ klicken (Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO
        und § 25 Abs. 1 TDDDG). Dann werden Daten an Calendly übertragen und Cookies gesetzt. Alternativ können Sie Calendly über den Link „Direkt bei Calendly öffnen“ auf deren eigener Website
        nutzen. Calendly ist unter dem EU-US Data Privacy Framework zertifiziert{" "}
        <span className="placeholder">[aktuellen Stand prüfen]</span>. Den gebuchten Termin übernehmen wir in unser Kundenverwaltungssystem.
      </p>

      <h2>6. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine erteilte Einwilligung jederzeit zu
        widerrufen. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren. Eine formlose Mail an {company.email} genügt.
      </p>
    </article>
  );
}
