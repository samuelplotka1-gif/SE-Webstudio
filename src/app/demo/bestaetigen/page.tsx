import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkConfirmation, confirmDemo } from "@/server/demo-service";

export const metadata: Metadata = { title: "Anfrage bestätigen", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function confirmAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const t = String(formData.get("t") ?? "");
  const state = await confirmDemo(id, t);
  if (state === "confirmed") redirect("/demo/bestaetigt");
  redirect(`/demo/bestaetigen?status=${state}`);
}

/**
 * Bewusst mit Knopf statt Bestätigung beim bloßen Öffnen:
 * Virenscanner in Firmen-Postfächern öffnen Links automatisch und würden sonst jede Anfrage „bestätigen“.
 */
export default async function ConfirmPage({ searchParams }: PageProps<"/demo/bestaetigen">) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  const t = typeof sp.t === "string" ? sp.t : "";
  const forced = sp.status === "expired" || sp.status === "invalid" ? sp.status : null;

  const check = forced ? { state: forced } : await checkConfirmation(id, t);

  if (check.state === "confirmed") redirect("/demo/bestaetigt");

  return (
    <div className="wrap" style={{ padding: "clamp(48px, 8vw, 120px) var(--gutter)" }}>
      <div className="sheet" style={{ maxWidth: 680 }}>
        {check.state === "valid" ? (
          <form action={confirmAction} className="done">
            <span className="mono-label">Letzter Schritt</span>
            <h1 className="step-title">Ist die Anfrage von Ihnen?</h1>
            {"rec" in check && check.rec ? (
              <p style={{ margin: 0 }}>
                Demo-Anfrage für <strong>{check.rec.data.company}</strong> ({check.rec.data.industry}).
              </p>
            ) : null}
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="t" value={t} />
            <div>
              <button type="submit" className="btn btn--primary">
                Ja, Anfrage bestätigen <span className="arrow">→</span>
              </button>
            </div>
            <p className="legal-note" style={{ margin: 0 }}>
              Nicht von Ihnen? Dann schließen Sie diese Seite einfach. Die Anfrage wird nach 48 Stunden automatisch gelöscht.
            </p>
          </form>
        ) : check.state === "expired" ? (
          <div className="done">
            <span className="mono-label">Link abgelaufen</span>
            <h1 className="step-title">Dieser Link ist leider nicht mehr gültig.</h1>
            <p style={{ margin: 0 }}>Bestätigungslinks gelten 48 Stunden. Stellen Sie die Anfrage einfach neu – es dauert nur ein paar Minuten.</p>
            <div>
              <Link href="/demo" className="btn btn--primary">
                Neue Demo anfordern
              </Link>
            </div>
          </div>
        ) : (
          <div className="done">
            <span className="mono-label">Link ungültig</span>
            <h1 className="step-title">Diesen Bestätigungslink kennen wir nicht.</h1>
            <p style={{ margin: 0 }}>Vielleicht wurde er beim Kopieren abgeschnitten. Öffnen Sie den Link bitte direkt aus der Mail oder stellen Sie die Anfrage neu.</p>
            <div className="cta-row">
              <Link href="/demo" className="btn btn--primary">
                Demo anfordern
              </Link>
              <Link href="/termin" className="btn btn--ghost">
                Gespräch buchen
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
