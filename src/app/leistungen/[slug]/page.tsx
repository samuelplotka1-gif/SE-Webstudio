import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq, FinalCta, Plans } from "@/components/blocks";
import { formatPrice, getService, lowestPrice, services } from "@/content/services";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/leistungen/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  return { title: s.name, description: `${s.lead.split(". ")[0]}. ${formatPrice(lowestPrice(s))}.` };
}

export default async function ServicePage({ params }: PageProps<"/leistungen/[slug]">) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) notFound();

  const others = services.filter((o) => o.slug !== s.slug);

  return (
    <>
      <section className="wrap svc-hero">
        <nav className="crumbs" aria-label="Brotkrümel">
          <Link href="/">Start</Link> / Leistungen / <span aria-current="page">{s.name}</span>
        </nav>
        <span className="mono-label">
          {s.index} · {s.name}
        </span>
        <h1 className="display display--l" style={{ maxWidth: "16em" }}>
          {s.headline}
        </h1>
        <p className="lead">{s.lead}</p>
        <div className="svc-hero__meta">
          <span className="svc-hero__price">{formatPrice(lowestPrice(s))}</span>
          {s.recurring ? <span>Monatlich · planbar · ein Ansprechpartner</span> : <span>Festpreis-Angebot nach dem Gespräch</span>}
        </div>
        <div className="cta-row">
          <Link href="/demo" className="btn btn--primary">
            Kostenlose Demo anfordern <span className="arrow">→</span>
          </Link>
          <Link href="/termin" className="btn btn--ghost">
            Gespräch buchen
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="inhalt-titel">
        <div className="wrap">
          <span className="mono-label">Was drin ist</span>
          <h2 id="inhalt-titel" className="display display--m" style={{ marginTop: 16 }}>
            Worauf Sie sich verlassen können.
          </h2>
          <div className="includes">
            {s.includes.map((inc, i) => (
              <div key={inc.title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <h3>{inc.title}</h3>
                <p>{inc.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="pakete">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <span className="mono-label">Pakete & Preise</span>
              <h2 id="pakete" className="display display--m">
                {s.recurring ? "Drei Abos, monatlich abgerechnet." : "Drei Einstiege. Ein ehrlicher Preis."}
              </h2>
            </div>
            <p className="lead">„ab“ heißt: Darunter geht es nicht. Was Ihr Vorhaben genau kostet, steht vorher schriftlich im Angebot.</p>
          </div>
          <Plans packages={s.packages} light />
        </div>
      </section>

      <section className="section" aria-labelledby="ablauf-titel">
        <div className="wrap">
          <span className="mono-label">Ablauf</span>
          <h2 id="ablauf-titel" className="display display--m" style={{ marginTop: 16 }}>
            So kommen wir zusammen ans Ziel.
          </h2>
          <ol className="flow">
            {s.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {s.faq.length ? (
        <section className="section" aria-labelledby="faq-titel">
          <div className="wrap">
            <span className="mono-label">Fragen</span>
            <h2 id="faq-titel" className="display display--m" style={{ marginTop: 16 }}>
              Was oft gefragt wird.
            </h2>
            <Faq items={s.faq} />
          </div>
        </section>
      ) : null}

      <FinalCta title={`${s.name} für Ihren Betrieb?`} />

      <section className="section" aria-label="Weitere Leistungen">
        <div className="wrap">
          <span className="mono-label">Weitere Leistungen</span>
          <div className="cta-row" style={{ marginTop: 20 }}>
            {others.map((o) => (
              <Link key={o.slug} href={`/leistungen/${o.slug}`} className="link-arrow">
                {o.name} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
