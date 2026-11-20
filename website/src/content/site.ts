/**
 * Zentrale Firmendaten. Alles in [eckigen Klammern] ist ein Platzhalter
 * und wird vor dem Livegang ersetzt (Impressum, Datenschutz, Footer, E-Mails).
 */
export const company = {
  name: "S&E Webstudio",
  legalName: "[Rechtlicher Firmenname, z. B. S&E Webstudio – Inhaber Vorname Nachname]",
  owners: "[Vorname Nachname, Vorname Nachname]",
  street: "[Straße Hausnummer]",
  postalCode: "[PLZ]",
  city: "[Ort]",
  email: "[hallo@se-webstudio.de]",
  phone: "[+49 000 0000000]",
  vatId: "[USt-IdNr. oder Steuernummer]",
  /** Kleinunternehmerregelung nach § 19 UStG (wie im CRM eingestellt) */
  smallBusiness: true,
  domain: "se-webstudio.de",
};

export const priceNote = company.smallBusiness
  ? "Alle Preise sind Endpreise. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
  : "Alle Preise zzgl. gesetzlicher Umsatzsteuer.";

/** Branchen für das Demo-Formular. Die CRM-Erweiterung wählt danach die Demo-Vorlage. */
export const industries = [
  "Handwerk & Bau",
  "Gastronomie & Hotel",
  "Gesundheit & Praxis",
  "Beratung & Dienstleistung",
  "Einzelhandel",
  "Immobilien",
  "Fitness & Beauty",
  "Industrie & Produktion",
  "Verein & Organisation",
  "Sonstiges",
] as const;

export type Industry = (typeof industries)[number];

export const nav = [
  { href: "/leistungen/webseiten", label: "Webseiten" },
  { href: "/leistungen/ki-agenten", label: "KI-Agenten" },
  { href: "/leistungen/automatisierung", label: "Automatisierung" },
  { href: "/leistungen/crm-tools", label: "CRM-Tools" },
  { href: "/leistungen/hosting-betreuung", label: "Hosting & Betreuung" },
];
