import type { Metadata } from "next";
import { company, phoneHref } from "@/content/site";

export const metadata: Metadata = { title: "Impressum" };

export default function Impressum() {
  return (
    <article className="wrap prose">
      <h1 className="display display--l">Impressum</h1>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {company.legalName}
        <br />
        {company.street}
        <br />
        {company.postalCode} {company.city}
      </p>
      <h2>Vertreten durch</h2>
      <p>{company.owners}</p>
      <h2>Kontakt</h2>
      <p>
        Telefon: <a href={phoneHref}>{company.phone}</a>
        <br />
        E-Mail: <a href={`mailto:${company.email}`}>{company.email}</a>
      </p>
      {company.vatId || company.smallBusiness ? (
        <>
          <h2>Umsatzsteuer</h2>
          <p>
            {company.vatId ? <>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {company.vatId}</> : null}
            {company.vatId && company.smallBusiness ? <br /> : null}
            {company.smallBusiness ? <>Kleinunternehmer gemäß § 19 UStG.</> : null}
          </p>
        </>
      ) : null}
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {company.owners}, {company.street}, {company.postalCode} {company.city}
      </p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </article>
  );
}
