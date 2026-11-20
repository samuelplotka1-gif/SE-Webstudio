/**
 * Zentrale Firmendaten (Impressum, Datenschutz, Footer, E-Mails).
 */
export const company = {
  name: "S&E Webstudio",
  legalName: "S&E Webstudio – Inhaber Samuel Begaj",
  owners: "Samuel Begaj",
  street: "Durmersheimerstraße 45",
  postalCode: "76185",
  city: "Karlsruhe-Grünwinkel",
  email: "samuel.begaj@se-webstudio.de",
  phone: "+49 152 16479138",
  /** USt-IdNr. nach § 27a UStG – wird nachgetragen. Leer = Abschnitt im Impressum ausgeblendet. */
  vatId: "",
  /**
   * Kleinunternehmerregelung nach § 19 UStG.
   * false = Regelbesteuerung (auf die Kleinunternehmerregelung wurde verzichtet).
   */
  smallBusiness: false,
  domain: "se-webstudio.de",
};

/** Telefonnummer für tel:-Links (ohne Leerzeichen) */
export const phoneHref = `tel:${company.phone.replace(/[^\d+]/g, "")}`;

export const priceNote = company.smallBusiness
  ? "Alle Preise sind Endpreise. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
  : "Angebot nur für Unternehmen. Alle Preise zzgl. 19 % Umsatzsteuer.";

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
