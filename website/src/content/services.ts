/**
 * Leistungen mit „ab“-Preisen. Die Zahlen sind Startwerte und können hier
 * zentral angepasst werden – Startseite, Leistungsseiten und Sitemap lesen alle aus dieser Datei.
 */
export type Package = {
  name: string;
  price: number;
  /** "einmalig" oder "monatlich" */
  interval: "einmalig" | "monatlich";
  /** optionaler Zusatz, z. B. laufende Kosten */
  extra?: string;
  for: string;
  features: string[];
  highlight?: boolean;
};

export type Service = {
  slug: string;
  index: string;
  name: string;
  short: string;
  headline: string;
  lead: string;
  includes: { title: string; text: string }[];
  packages: Package[];
  steps: string[];
  faq: { q: string; a: string }[];
  recurring?: boolean;
  /** Kostenlose Demo gibt es nur für Websites – nur diese Seiten zeigen den Demo-Button. */
  demo?: boolean;
};

export const services: Service[] = [
  {
    slug: "webseiten",
    demo: true,
    index: "01",
    name: "Webseiten",
    short: "Schnell, klar, auf Anfragen ausgelegt.",
    headline: "Eine Website, die erklärt, was Sie tun – und Anfragen sammelt.",
    lead: "Wir bauen Websites für Betriebe, die online gefunden und angefragt werden wollen. Ohne Baukasten, ohne aufgeblähte Technik, mit Texten, die Ihre Kunden verstehen.",
    includes: [
      { title: "Eigenes Design", text: "Kein Theme von der Stange. Farben, Schrift und Aufbau passen zu Ihrem Betrieb." },
      { title: "Texte inklusive", text: "Wir schreiben aus Ihren Stichpunkten verständliche Seiten – Sie korrigieren nur noch." },
      { title: "Schnell & mobil", text: "Optimiert für Smartphones und kurze Ladezeiten, weil Google und Ihre Besucher es merken." },
      { title: "Rechtlich sauber", text: "Impressum, Datenschutz, Cookie-Hinweis nur wo nötig, Schriften lokal eingebunden." },
    ],
    packages: [
      {
        name: "Visitenkarte",
        price: 990,
        interval: "einmalig",
        for: "Für Selbstständige und kleine Betriebe, die seriös auffindbar sein wollen.",
        features: ["Eine Seite mit allen wichtigen Abschnitten", "Kontaktformular", "Grundlegende Suchmaschinen-Optimierung", "Fertig in ca. 2 Wochen"],
      },
      {
        name: "Unternehmensseite",
        price: 2490,
        interval: "einmalig",
        for: "Für Betriebe mit mehreren Leistungen, Team und Referenzen.",
        features: ["Bis zu 8 Unterseiten", "Texte aus Ihren Stichpunkten", "Anfrageformular mit CRM-Anbindung", "Google-Unternehmensprofil eingerichtet"],
        highlight: true,
      },
      {
        name: "Individuell",
        price: 4900,
        interval: "einmalig",
        for: "Für Shops, Buchungen, Mehrsprachigkeit oder besondere Funktionen.",
        features: ["Umfang nach Absprache", "Online-Buchung oder Shop", "Mehrsprachig möglich", "Schnittstellen zu Ihren Tools"],
      },
    ],
    steps: ["Demo ansehen", "Gespräch & Angebot", "Inhalte sammeln", "Umsetzung mit zwei Korrekturschleifen", "Livegang"],
    faq: [
      { q: "Was kostet die Demo?", a: "Nichts. Sie sehen einen Entwurf Ihrer Startseite, bevor Sie sich für irgendetwas entscheiden." },
      { q: "Kann ich die Seite später selbst ändern?", a: "Ja. Auf Wunsch bekommen Sie einen einfachen Zugang für Texte und Bilder – oder wir übernehmen Änderungen im Betreuungs-Abo." },
      { q: "Warum „ab“-Preise?", a: "Weil jeder Betrieb anders ist. Der „ab“-Preis ist ehrlich gemeint: Darunter geht es nicht, und was darüber liegt, steht vorher schriftlich im Angebot." },
    ],
  },
  {
    slug: "ki-agenten",
    index: "02",
    name: "KI-Agenten",
    short: "Assistenten, die Routinefragen übernehmen.",
    headline: "Ein KI-Assistent, der die immer gleichen Fragen beantwortet.",
    lead: "Öffnungszeiten, Preise, Termine, Status-Nachfragen: Ein KI-Agent beantwortet Routinefragen auf Ihrer Website oder sortiert eingehende E-Mails vor. Sie entscheiden, was er darf – und was nicht.",
    includes: [
      { title: "Ihr Wissen, nicht das Internet", text: "Der Agent antwortet nur aus Ihren Inhalten und sagt ehrlich, wenn er etwas nicht weiß." },
      { title: "Übergabe an Menschen", text: "Komplizierte Anliegen landen mit Zusammenfassung bei Ihnen statt im Nirgendwo." },
      { title: "Datenschutz bedacht", text: "Klare Hinweise für Nutzer, Auftragsverarbeitung geregelt, keine Trainingsnutzung Ihrer Daten." },
      { title: "Messbar", text: "Sie sehen, welche Fragen gestellt werden – oft die beste Quelle für bessere Website-Texte." },
    ],
    packages: [
      {
        name: "Website-Assistent",
        price: 1490,
        interval: "einmalig",
        extra: "Betrieb ab 49 €/Monat",
        for: "Beantwortet häufige Fragen direkt auf Ihrer Website.",
        features: ["Wissen aus Ihrer Website und Ihren Unterlagen", "Übergabe an Sie per E-Mail", "An Ihr Design angepasst", "Monatlicher Fragen-Bericht"],
      },
      {
        name: "Anfrage-Agent",
        price: 2900,
        interval: "einmalig",
        extra: "Betrieb ab 79 €/Monat",
        for: "Sortiert eingehende Anfragen und bereitet Antworten vor.",
        features: ["E-Mails einordnen und zusammenfassen", "Antwortentwürfe zur Freigabe", "Übergabe ins CRM", "Sie geben jede Antwort frei"],
        highlight: true,
      },
      {
        name: "Individueller Agent",
        price: 5900,
        interval: "einmalig",
        for: "Für eigene Abläufe mit mehreren Systemen.",
        features: ["Analyse Ihres Ablaufs", "Anbindung an Ihre Tools", "Test mit echten Fällen", "Schulung Ihres Teams"],
      },
    ],
    steps: ["Gespräch: Welche Fragen kosten Sie Zeit?", "Wissen sammeln", "Agent einrichten und testen", "Freigabe durch Sie", "Betrieb und monatlicher Bericht"],
    faq: [
      { q: "Erfindet der Agent Antworten?", a: "Wir begrenzen ihn auf Ihre Inhalte und testen mit echten Fragen. Weiß er etwas nicht, leitet er an Sie weiter." },
      { q: "Brauche ich dafür eine neue Website?", a: "Nein. Der Assistent lässt sich in fast jede bestehende Website einbauen." },
    ],
  },
  {
    slug: "automatisierung",
    index: "03",
    name: "Automatisierung",
    short: "Wiederkehrende Abläufe, die von allein laufen.",
    headline: "Was Sie jede Woche gleich machen, kann auch von allein laufen.",
    lead: "Formular → CRM → Bestätigungsmail → Aufgabe im Kalender: Wir verbinden Ihre Tools, damit Daten nicht mehr abgetippt und Nachfassen nicht mehr vergessen werden.",
    includes: [
      { title: "Bestehende Tools", text: "Wir arbeiten mit dem, was Sie haben: E-Mail, Kalender, Tabellen, CRM, Buchhaltung." },
      { title: "Nachvollziehbar", text: "Jeder Ablauf ist dokumentiert. Sie wissen, was wann warum passiert." },
      { title: "Mit Sicherheitsnetz", text: "Fehler werden gemeldet statt still verschluckt." },
      { title: "Klein anfangen", text: "Ein Ablauf, der heute nervt, reicht für den Start." },
    ],
    packages: [
      {
        name: "Einzelner Ablauf",
        price: 490,
        interval: "einmalig",
        for: "Ein konkreter Ablauf, z. B. Formular → CRM → Bestätigungsmail.",
        features: ["Aufnahme des Ablaufs", "Einrichtung und Test", "Kurze Dokumentation", "30 Tage Nachbesserung"],
      },
      {
        name: "Prozesspaket",
        price: 1290,
        interval: "einmalig",
        for: "Drei zusammenhängende Abläufe, z. B. von der Anfrage bis zur Rechnung.",
        features: ["Bis zu 3 Abläufe", "Fehlerbenachrichtigung", "Übergabe-Termin", "60 Tage Nachbesserung"],
        highlight: true,
      },
      {
        name: "Laufende Betreuung",
        price: 79,
        interval: "monatlich",
        for: "Wir überwachen Ihre Abläufe und passen sie an, wenn sich Tools ändern.",
        features: ["Überwachung", "Anpassungen bei Tool-Änderungen", "Kleine Erweiterungen inklusive", "Monatlich kündbar"],
      },
    ],
    steps: ["Ablauf gemeinsam aufschreiben", "Festpreis-Angebot", "Einrichtung", "Test mit echten Daten", "Übergabe"],
    faq: [
      { q: "Welche Tools verbinden Sie?", a: "Gängige E-Mail-, Kalender-, CRM- und Tabellen-Tools sowie alles mit einer Schnittstelle. Im Zweifel klären wir das im Gespräch." },
    ],
  },
  {
    slug: "crm-tools",
    index: "04",
    name: "CRM-Tools",
    short: "Kunden, Anfragen und Angebote an einem Ort.",
    headline: "Schluss mit Anfragen in fünf Postfächern und drei Tabellen.",
    lead: "Wir richten ein CRM ein, das zu Ihrem Betrieb passt – oder bauen eines nach Maß. Mit Pipeline, Wiedervorlagen, Angeboten und Rechnungen, auf Deutsch und DSGVO-konform.",
    includes: [
      { title: "Pipeline", text: "Sie sehen auf einen Blick, welche Anfrage wo steht und was als Nächstes zu tun ist." },
      { title: "Wiedervorlagen", text: "Niemand wird vergessen. Das System erinnert, wenn nachgefasst werden muss." },
      { title: "Angebote & Rechnungen", text: "Direkt aus dem Kontakt heraus, als PDF, mit sauberen Nummernkreisen." },
      { title: "Ihre Daten", text: "Hosting in Deutschland oder bei Ihnen, Export jederzeit möglich." },
    ],
    packages: [
      {
        name: "Einrichtung",
        price: 1290,
        interval: "einmalig",
        for: "Ein bestehendes CRM für Ihren Betrieb einrichten und Daten übernehmen.",
        features: ["Pipeline nach Ihrem Ablauf", "Datenübernahme aus Tabellen", "Website-Formular angebunden", "Schulung"],
      },
      {
        name: "CRM nach Maß",
        price: 6900,
        interval: "einmalig",
        for: "Ein eigenes System, das genau Ihre Abläufe abbildet.",
        features: ["Kontakte, Pipeline, Aufgaben", "Angebote und Rechnungen", "Automatisierungen", "Hosting in Deutschland"],
        highlight: true,
      },
      {
        name: "Erweiterung",
        price: 690,
        interval: "einmalig",
        for: "Neue Funktion für ein bestehendes System.",
        features: ["Analyse", "Umsetzung", "Test", "Dokumentation"],
      },
    ],
    steps: ["Ablauf verstehen", "Prototyp zeigen", "Umsetzung", "Datenübernahme", "Schulung & Start"],
    faq: [
      { q: "Was passiert mit meinen bestehenden Daten?", a: "Wir übernehmen Kontakte aus Excel, CSV oder Ihrem alten System – mit Duplikatprüfung." },
    ],
  },
  {
    slug: "hosting-betreuung",
    index: "05",
    name: "Hosting & Betreuung",
    short: "Wir kümmern uns, damit Ihre Seite läuft.",
    headline: "Nach dem Livegang fängt die Arbeit erst an. Die übernehmen wir.",
    lead: "Updates, Sicherheit, Backups, kleine Änderungen: Mit einem monatlichen Abo bleibt Ihre Website schnell, sicher und aktuell – ohne dass Sie sich darum kümmern müssen.",
    includes: [
      { title: "Hosting in Deutschland", text: "Schnelle Server, SSL-Zertifikat, tägliche Backups." },
      { title: "Updates & Sicherheit", text: "Wir halten alles aktuell und überwachen die Erreichbarkeit." },
      { title: "Änderungen inklusive", text: "Neue Öffnungszeiten, ein neues Foto, ein Text? Kurze Mail genügt." },
      { title: "Ein Ansprechpartner", text: "Sie haben eine feste Person, die Ihre Seite kennt." },
    ],
    packages: [
      {
        name: "Basis",
        price: 29,
        interval: "monatlich",
        for: "Hosting und Sicherheit für Ihre Website.",
        features: ["Hosting in Deutschland", "SSL-Zertifikat", "Tägliche Backups", "Sicherheits-Updates"],
      },
      {
        name: "Betreuung",
        price: 79,
        interval: "monatlich",
        for: "Für Betriebe, die regelmäßig Kleinigkeiten ändern wollen.",
        features: ["Alles aus Basis", "Bis zu 1 Stunde Änderungen pro Monat", "Erreichbarkeits-Überwachung", "Antwort innerhalb eines Werktags"],
        highlight: true,
      },
      {
        name: "Rundum",
        price: 179,
        interval: "monatlich",
        for: "Für Websites, die wachsen und laufend gepflegt werden.",
        features: ["Alles aus Betreuung", "Bis zu 3 Stunden pro Monat", "Monatlicher Bericht mit Besucherzahlen", "Quartalsgespräch zur Weiterentwicklung"],
      },
    ],
    steps: ["Abo wählen", "Umzug Ihrer Seite (falls nötig)", "Betreuung läuft"],
    faq: [
      { q: "Wie lange läuft das Abo?", a: "Die Mindestlaufzeit beträgt 12 Monate. Danach verlängert sich das Abo jeweils um einen Monat und ist mit einem Monat Frist zum Monatsende kündbar." },
      { q: "Betreuen Sie auch Seiten, die Sie nicht gebaut haben?", a: "Ja, nach einem kurzen Check. Manchmal empfehlen wir dabei einen Neuaufbau – aber nur, wenn er sich wirklich lohnt." },
    ],
    recurring: true,
    demo: true,
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function lowestPrice(s: Service): Package {
  const monthly = s.packages.filter((p) => p.interval === "monatlich");
  const pool = s.recurring && monthly.length ? monthly : s.packages.filter((p) => p.interval === "einmalig");
  return [...(pool.length ? pool : s.packages)].sort((a, b) => a.price - b.price)[0];
}

export function formatPrice(p: Pick<Package, "price" | "interval">): string {
  const value = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(p.price);
  return p.interval === "monatlich" ? `ab ${value} € / Monat` : `ab ${value} €`;
}
