import type { Metadata } from "next";
import { company } from "@/content/site";

export const metadata: Metadata = { title: "Impressum" };

const P = ({ children }: { children: string }) => (children.startsWith("[") ? <span className="placeholder">{children}</span> : <>{children}</>);

export default function Impressum() {
  return (
    <article className="wrap prose">
      <h1 className="display display--l">Impressum</h1>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <P>{company.legalName}</P>
        <br />
        <P>{company.street}</P>
        <br />
        <P>{company.postalCode}</P> <P>{company.city}</P>
      </p>
      <h2>Vertreten durch</h2>
      <p>
        <P>{company.owners}</P>
      </p>
      <h2>Kontakt</h2>
      <p>
        Telefon: <P>{company.phone}</P>
        <br />
        E-Mail: <P>{company.email}</P>
      </p>
      <h2>Umsatzsteuer</h2>
      <p>
        <P>{company.vatId}</P>
        {company.smallBusiness ? <><br />Kleinunternehmer gemäß § 19 UStG.</> : null}
      </p>
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        <P>{company.owners}</P>, Anschrift wie oben
      </p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </article>
  );
}
