import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/content/site";

export const metadata: Metadata = {
  title: "AGB",
  description: `Allgemeine Geschäftsbedingungen von ${company.name} für Websites, KI-Agenten, Automatisierung, CRM-Tools sowie Hosting & Betreuung.`,
};

/**
 * Allgemeine Geschäftsbedingungen.
 * Entwurf, abgestimmt auf die Leistungen dieser Website. Vor der Veröffentlichung anwaltlich prüfen lassen.
 * Bewusst nur für Unternehmer (B2B): passt zu den Netto-Preisen und erspart Widerrufsbelehrung/Verbraucherregeln.
 */
export default function Agb() {
  return (
    <article className="wrap prose">
      <h1 className="display display--l">Allgemeine Geschäftsbedingungen</h1>
      <p>
        <span className="placeholder">[Entwurf – vor dem Livegang anwaltlich prüfen lassen]</span>
      </p>
      <p>
        {company.legalName}, {company.street}, {company.postalCode} {company.city} (nachfolgend „wir“ oder „{company.name}“)
      </p>
      <p>Stand: November 2026</p>

      <h2>§ 1 Geltungsbereich</h2>
      <ol>
        <li>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen {company.name} und ihren Kunden über die Erstellung von Websites, KI-Agenten, Automatisierungen und
          CRM-Tools sowie über Hosting, Betreuung und andere laufende Leistungen.
        </li>
        <li>
          Unsere Leistungen richten sich ausschließlich an Unternehmer im Sinne von § 14 BGB, juristische Personen des öffentlichen Rechts und öffentlich-rechtliche Sondervermögen. Verträge mit
          Verbrauchern (§ 13 BGB) schließen wir nicht.
        </li>
        <li>Abweichende oder ergänzende Geschäftsbedingungen des Kunden gelten nur, wenn wir ihnen ausdrücklich in Textform zustimmen.</li>
        <li>Individuelle Vereinbarungen, insbesondere im Angebot, haben Vorrang vor diesen AGB.</li>
      </ol>

      <h2>§ 2 Kostenlose Demo</h2>
      <ol>
        <li>
          Für Websites bieten wir eine kostenlose, unverbindliche Demo an (Entwurf einer Startseite als Vorschau-Link und PDF). Durch die Anfrage oder die Zusendung der Demo entsteht kein
          Vertrag und keine Zahlungspflicht.
        </li>
        <li>
          Alle Rechte an der Demo bleiben bei uns. Der Kunde darf sie zur eigenen Entscheidung ansehen und intern weitergeben. Eine Veröffentlichung oder Weiterverwendung, auch durch Dritte,
          ist nur nach Abschluss eines Vertrags erlaubt.
        </li>
        <li>
          Stellt der Kunde für die Demo Inhalte bereit (z. B. Logo, Texte, Bilder), versichert er, dass er sie dafür nutzen darf. Wir verwenden sie nur für die Demo und die Kommunikation dazu.
        </li>
      </ol>

      <h2>§ 3 Angebot und Vertragsschluss</h2>
      <ol>
        <li>
          Die „ab“-Preise auf unserer Website sind Richtwerte und kein verbindliches Angebot. Den genauen Leistungsumfang und Preis legen wir in einem schriftlichen Angebot fest.
        </li>
        <li>Unsere Angebote sind 30 Tage gültig, sofern im Angebot nichts anderes steht.</li>
        <li>Der Vertrag kommt zustande, wenn der Kunde das Angebot in Textform (z. B. per E-Mail oder Unterschrift) annimmt.</li>
      </ol>

      <h2>§ 4 Leistungsumfang und Änderungen</h2>
      <ol>
        <li>Der Umfang unserer Leistungen ergibt sich aus dem Angebot. Leistungen, die dort nicht genannt sind, schulden wir nicht.</li>
        <li>
          Die Erstellung von Websites, KI-Agenten, Automatisierungen und CRM-Tools erbringen wir als Werkleistung. Hosting, Betreuung und der laufende Betrieb sind Dauerleistungen mit
          monatlicher Abrechnung.
        </li>
        <li>
          Änderungswünsche nach Vertragsschluss, die über den vereinbarten Umfang hinausgehen, setzen wir nach Absprache um und berechnen sie nach Aufwand zu dem im Angebot genannten
          Stundensatz. Auswirkungen auf Termine teilen wir vorher mit.
        </li>
        <li>Wir dürfen geeignete Subunternehmer und Dienstleister (z. B. Hosting-Anbieter) einsetzen. Für sie haften wir wie für eigenes Handeln.</li>
      </ol>

      <h2>§ 5 Mitwirkung des Kunden</h2>
      <ol>
        <li>
          Der Kunde stellt die benötigten Inhalte (Texte, Bilder, Logos, Zugangsdaten, Informationen) rechtzeitig und in geeigneter Form bereit und benennt eine ansprechbare Person.
        </li>
        <li>
          Der Kunde ist für die Rechtmäßigkeit der von ihm gelieferten Inhalte verantwortlich und stellt uns von Ansprüchen Dritter frei, die auf diesen Inhalten beruhen.
        </li>
        <li>
          Impressum, Datenschutzerklärung und andere Rechtstexte der Kunden-Website liegen in der Verantwortung des Kunden. Wir binden sie technisch ein, leisten aber keine Rechtsberatung.
        </li>
        <li>Verzögert sich ein Projekt, weil Mitwirkungen fehlen, verschieben sich vereinbarte Termine entsprechend. Dadurch entstehender Mehraufwand kann berechnet werden.</li>
      </ol>

      <h2>§ 6 Korrekturschleifen und Abnahme</h2>
      <ol>
        <li>Bei Websites sind zwei Korrekturschleifen im Preis enthalten, sofern im Angebot nichts anderes vereinbart ist. Weitere Schleifen berechnen wir nach Aufwand.</li>
        <li>Nach Fertigstellung melden wir die Leistung zur Abnahme. Der Kunde prüft sie und erklärt die Abnahme in Textform. Unwesentliche Mängel berechtigen nicht zur Verweigerung.</li>
        <li>
          Die Leistung gilt als abgenommen, wenn der Kunde sie nicht innerhalb von 14 Tagen nach Meldung unter Angabe mindestens eines Mangels ablehnt, oder wenn er sie produktiv nutzt (z. B.
          Livegang der Website).
        </li>
      </ol>

      <h2>§ 7 Preise und Zahlung</h2>
      <ol>
        <li>Alle Preise verstehen sich netto zuzüglich der gesetzlichen Umsatzsteuer.</li>
        <li>Bei Projekten stellen wir 50 % des Preises bei Auftragserteilung und 50 % nach Abnahme in Rechnung, sofern im Angebot nichts anderes vereinbart ist.</li>
        <li>Laufende Leistungen (z. B. Hosting & Betreuung, Betrieb von KI-Agenten) rechnen wir monatlich im Voraus ab.</li>
        <li>Rechnungen sind innerhalb von 14 Tagen nach Rechnungsdatum ohne Abzug zu zahlen. Bei Zahlungsverzug gelten die gesetzlichen Regelungen (§§ 286, 288 BGB).</li>
        <li>
          Gerät der Kunde mit Zahlungen für laufende Leistungen mehr als 30 Tage in Verzug, dürfen wir diese Leistungen nach vorheriger Ankündigung mit angemessener Frist vorübergehend
          aussetzen.
        </li>
      </ol>

      <h2>§ 8 Laufzeit und Kündigung von Abonnements</h2>
      <ol>
        <li>
          Laufende Leistungen haben eine Mindestlaufzeit von 12 Monaten, sofern im Angebot oder auf der jeweiligen Leistungsseite nichts anderes angegeben ist (z. B. „monatlich kündbar“).
        </li>
        <li>Nach Ablauf der Mindestlaufzeit verlängert sich der Vertrag jeweils um einen Monat und kann mit einer Frist von einem Monat zum Monatsende gekündigt werden.</li>
        <li>Die Kündigung bedarf der Textform. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</li>
        <li>Im Abo enthaltene Arbeitsstunden gelten für den jeweiligen Monat und verfallen, wenn sie nicht genutzt werden.</li>
        <li>
          Nach Vertragsende stellen wir dem Kunden auf Wunsch die Daten seiner Website in einem üblichen Format bereit oder unterstützen den Umzug zu einem anderen Anbieter gegen Vergütung
          nach Aufwand. 30 Tage nach Vertragsende dürfen wir die Daten löschen.
        </li>
      </ol>

      <h2>§ 9 Hosting und Verfügbarkeit</h2>
      <ol>
        <li>
          Wir betreiben Websites auf Servern in Deutschland und streben eine hohe Verfügbarkeit an. Eine bestimmte Verfügbarkeit ist nur geschuldet, wenn sie im Angebot ausdrücklich
          zugesagt ist. Wartungsarbeiten führen wir möglichst außerhalb der üblichen Geschäftszeiten durch.
        </li>
        <li>Wir erstellen im Rahmen des Hostings regelmäßige Datensicherungen. Eigene Kopien wichtiger Inhalte bleiben in der Verantwortung des Kunden.</li>
        <li>
          Der Kunde darf keine rechtswidrigen Inhalte über die von uns gehosteten Systeme bereitstellen. Bei konkreten Hinweisen auf rechtswidrige Inhalte dürfen wir diese sperren und
          informieren den Kunden darüber.
        </li>
      </ol>

      <h2>§ 10 KI-Agenten und KI-gestützte Leistungen</h2>
      <ol>
        <li>
          KI-Agenten erzeugen Antworten automatisch. Trotz sorgfältiger Einrichtung können sie fehlerhafte oder unvollständige Ergebnisse liefern. Für Entscheidungen mit rechtlicher oder
          wirtschaftlicher Tragweite sind die Ergebnisse vom Kunden zu prüfen.
        </li>
        <li>
          Der Kunde ist für den Einsatz des KI-Agenten gegenüber seinen eigenen Kunden verantwortlich, insbesondere für die Information, dass Nutzer mit einem KI-System interagieren, sowie für
          die Einhaltung des Datenschutzes.
        </li>
        <li>
          Für KI-Funktionen setzen wir Modelle von Drittanbietern ein (z. B. Anthropic). Änderungen dieser Dienste können Anpassungen erforderlich machen. Wir informieren den Kunden darüber
          rechtzeitig.
        </li>
      </ol>

      <h2>§ 11 Nutzungsrechte</h2>
      <ol>
        <li>
          Mit vollständiger Bezahlung erhält der Kunde an den für ihn erstellten Arbeitsergebnissen ein einfaches, zeitlich und räumlich unbeschränktes Nutzungsrecht für den vertraglich
          vorgesehenen Zweck. Vor vollständiger Zahlung ist die Nutzung nur widerruflich gestattet.
        </li>
        <li>
          Allgemeines Know-how, wiederverwendbare Bausteine, Vorlagen und Werkzeuge, die wir unabhängig vom Projekt entwickelt haben, bleiben unser Eigentum und dürfen von uns weiter verwendet
          werden.
        </li>
        <li>Für eingebundene Komponenten Dritter (z. B. Open-Source-Software, Schriften, Bilder) gelten deren Lizenzbedingungen.</li>
        <li>Wir dürfen das Projekt mit Namen und Logo des Kunden als Referenz nennen. Der Kunde kann dem jederzeit in Textform widersprechen.</li>
      </ol>

      <h2>§ 12 Mängel</h2>
      <ol>
        <li>Bei Mängeln leisten wir zunächst nach unserer Wahl Nacherfüllung durch Beseitigung des Mangels oder Neuherstellung.</li>
        <li>Mängelansprüche verjähren in 12 Monaten ab Abnahme. Dies gilt nicht bei Vorsatz, grober Fahrlässigkeit und Schäden aus der Verletzung von Leben, Körper oder Gesundheit.</li>
      </ol>

      <h2>§ 13 Haftung</h2>
      <ol>
        <li>
          Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei der Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer
          übernommenen Garantie.
        </li>
        <li>
          Bei leichter Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht
          und auf deren Einhaltung der Kunde regelmäßig vertrauen darf. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
        </li>
        <li>
          Für den Verlust von Daten haften wir nur in Höhe des Aufwands, der bei ordnungsgemäßer und regelmäßiger Datensicherung durch den Kunden zur Wiederherstellung erforderlich wäre.
        </li>
      </ol>

      <h2>§ 14 Datenschutz und Auftragsverarbeitung</h2>
      <ol>
        <li>
          Verarbeiten wir im Auftrag des Kunden personenbezogene Daten (z. B. beim Hosting, bei CRM-Tools oder KI-Agenten), schließen wir einen Vertrag zur Auftragsverarbeitung nach Art. 28
          DSGVO.
        </li>
        <li>
          Informationen zur Verarbeitung personenbezogener Daten auf dieser Website finden Sie in unserer <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </li>
      </ol>

      <h2>§ 15 Vertraulichkeit</h2>
      <p>
        Beide Seiten behandeln vertrauliche Informationen der anderen Seite, insbesondere Zugangsdaten und Geschäftsinterna, vertraulich und nutzen sie nur zur Durchführung des Vertrags. Diese
        Pflicht gilt über das Vertragsende hinaus.
      </p>

      <h2>§ 16 Schlussbestimmungen</h2>
      <ol>
        <li>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</li>
        <li>
          Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand für alle Streitigkeiten aus dem Vertrag Karlsruhe.
        </li>
        <li>Änderungen und Ergänzungen des Vertrags bedürfen der Textform.</li>
        <li>Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</li>
      </ol>
    </article>
  );
}
