"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { industries } from "@/content/site";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, LOGO_MAX_BYTES, MAX_COLORS } from "@/lib/demo-schema";

type Values = {
  name: string;
  email: string;
  company: string;
  industry: string;
  description: string;
  website: string;
  phone: string;
  colors: string[];
  colorNote: string;
};

type Errors = Partial<Record<keyof Values | "logo" | "form", string>>;

const STEPS = [
  { title: "Wer sind Sie?", sub: "Damit wir wissen, wem wir die Demo schicken." },
  { title: "Was haben Sie vor?", sub: "Ein paar Sätze reichen. Daraus schreiben wir die Texte Ihrer Demo." },
  { title: "Extras – wenn Sie mögen.", sub: "Alles freiwillig. Je mehr wir haben, desto näher ist die Demo an Ihrem Betrieb." },
] as const;

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function validateStep(step: number, v: Values, logo: File | null): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (v.name.trim().length < 2) e.name = "Bitte geben Sie Ihren Namen an.";
    if (!emailOk(v.email)) e.email = "Bitte prüfen Sie die E-Mail-Adresse.";
    if (v.company.trim().length < 2) e.company = "Bitte geben Sie Ihre Firma an.";
  }
  if (step === 1) {
    if (!v.industry) e.industry = "Bitte wählen Sie eine Branche.";
    const len = v.description.trim().length;
    if (len < DESCRIPTION_MIN) e.description = `Noch ${DESCRIPTION_MIN - len} Zeichen – ein, zwei Sätze mehr helfen uns sehr.`;
    if (len > DESCRIPTION_MAX) e.description = `Bitte höchstens ${DESCRIPTION_MAX} Zeichen.`;
  }
  if (step === 2) {
    if (v.phone.trim() && !/^[+\d(][\d\s()/-]{5,}$/.test(v.phone.trim())) e.phone = "Bitte prüfen Sie die Telefonnummer.";
    if (logo && logo.size > LOGO_MAX_BYTES) e.logo = "Das Logo darf höchstens 3 MB groß sein.";
  }
  return e;
}

const STEP_OF: Record<string, number> = { name: 0, email: 0, company: 0, industry: 1, description: 1, website: 2, phone: 2, colors: 2, colorNote: 2, logo: 2 };

export function DemoForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ name: "", email: "", company: "", industry: "", description: "", website: "", phone: "", colors: [], colorNote: "" });
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const startedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Fokus beim Schrittwechsel auf die Überschrift (Screenreader & Tastatur)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, sentTo]);

  const set = <K extends keyof Values>(key: K, val: Values[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const next = () => {
    const e = validateStep(step, values, logo);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  };

  async function submit() {
    const e = validateStep(2, values, logo);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    const fd = new FormData();
    (["name", "email", "company", "industry", "description", "website", "phone", "colorNote"] as const).forEach((k) => fd.append(k, values[k]));
    values.colors.forEach((c) => fd.append("colors", c));
    if (logo) fd.append("logo", logo);
    fd.append("startedAt", String(startedAt.current));
    fd.append("firma_website", (document.getElementById("firma_website") as HTMLInputElement | null)?.value ?? "");
    try {
      const res = await fetch("/api/demo", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: Errors };
      if (res.ok && json.ok) {
        setSentTo(values.email.trim());
        return;
      }
      const fe = json.fieldErrors ?? {};
      setErrors({ ...fe, form: json.error ?? "Da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut." });
      const firstField = Object.keys(fe).find((k) => k in STEP_OF);
      if (firstField) setStep(STEP_OF[firstField]);
    } catch {
      setErrors({ form: "Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut." });
    } finally {
      setSending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="sheet done" role="status">
        <span className="mono-label">Fast geschafft</span>
        <h2 className="step-title" tabIndex={-1} ref={headingRef}>
          Bitte bestätigen Sie Ihre E-Mail-Adresse.
        </h2>
        <p style={{ margin: 0 }}>
          Wir haben eine Mail an <span className="done__mail">{sentTo}</span> geschickt. Klicken Sie dort auf <strong>„Anfrage bestätigen“</strong> – erst dann beginnen wir mit Ihrer Demo.
        </p>
        <div className="notice">
          Keine Mail da? Schauen Sie bitte auch im Spam-Ordner nach. Der Link ist 48 Stunden gültig.
        </div>
        <p style={{ margin: 0, color: "var(--ink-2)" }}>
          Lieber direkt sprechen? <Link href="/termin" className="link-arrow">Gespräch buchen →</Link>
        </p>
      </div>
    );
  }

  const descLen = values.description.trim().length;
  const fieldProps = (key: keyof Values) => ({
    id: key,
    name: key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const err = (key: keyof Errors) =>
    errors[key] ? (
      <p className="error" id={`${key}-error`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <form
      className="sheet"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 2) next();
        else void submit();
      }}
    >
      <div className="progress" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span key={i} data-done={i < step} data-current={i === step} />
        ))}
      </div>
      <div className="progress-label">
        <span>
          Schritt {step + 1} von 3
        </span>
        <span>{step === 2 ? "optional" : "Pflichtangaben"}</span>
      </div>

      <h2 className="step-title" tabIndex={-1} ref={headingRef}>
        {STEPS[step].title}
      </h2>
      <p className="step-sub">{STEPS[step].sub}</p>

      {/* Honeypot: für Menschen unsichtbar */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="firma_website">Bitte leer lassen</label>
        <input id="firma_website" name="firma_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {step === 0 && (
        <div className="fields">
          <div className="field">
            <label htmlFor="name">Ihr Name</label>
            <input className="input" {...fieldProps("name")} autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
            {err("name")}
          </div>
          <div className="field">
            <label htmlFor="email">E-Mail</label>
            <input
              className="input"
              {...fieldProps("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <span className="hint">Hierhin schicken wir den Bestätigungslink und später die Demo.</span>
            {err("email")}
          </div>
          <div className="field">
            <label htmlFor="company">Firma</label>
            <input className="input" {...fieldProps("company")} autoComplete="organization" value={values.company} onChange={(e) => set("company", e.target.value)} />
            {err("company")}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fields">
          <div className="field">
            <fieldset aria-describedby={errors.industry ? "industry-error" : undefined}>
              <legend>Branche</legend>
              <div className="chips">
                {industries.map((ind) => (
                  <label className="chip" key={ind}>
                    <input type="radio" name="industry" value={ind} checked={values.industry === ind} onChange={() => set("industry", ind)} />
                    <span>{ind}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {err("industry")}
          </div>
          <div className="field">
            <label htmlFor="description">Grobe Beschreibung</label>
            <textarea
              className="textarea"
              {...fieldProps("description")}
              maxLength={DESCRIPTION_MAX}
              placeholder="Zum Beispiel: Wir sind eine Tischlerei mit 6 Leuten in Kassel und bauen vor allem Küchen und Einbauschränke. Die alte Seite ist von 2014 und auf dem Handy kaum lesbar. Wir wollen mehr Anfragen für Aufmaß-Termine."
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <span className="hint">
              <span>Was machen Sie, für wen, und was soll die Website erreichen?</span>
              <span className="mono" aria-live="polite">
                {descLen}/{DESCRIPTION_MAX}
              </span>
            </span>
            {err("description")}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fields">
          <div className="two">
            <div className="field">
              <label htmlFor="website">
                Bestehende Website <span className="opt">optional</span>
              </label>
              <input className="input" {...fieldProps("website")} inputMode="url" placeholder="www.ihre-firma.de" value={values.website} onChange={(e) => set("website", e.target.value)} />
              {err("website")}
            </div>
            <div className="field">
              <label htmlFor="phone">
                Telefon <span className="opt">optional</span>
              </label>
              <input className="input" {...fieldProps("phone")} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
              {err("phone")}
            </div>
          </div>

          <div className="field">
            <label htmlFor="logo">
              Logo <span className="opt">optional · PNG, JPG, WebP oder SVG · max. 3 MB</span>
            </label>
            <label className="file-drop">
              <span>{logo ? `Ausgewählt: ${logo.name}` : "Datei auswählen"}</span>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                aria-invalid={errors.logo ? true : undefined}
                aria-describedby={errors.logo ? "logo-error" : undefined}
                onChange={(e) => {
                  setLogo(e.target.files?.[0] ?? null);
                  setErrors((er) => ({ ...er, logo: undefined }));
                }}
              />
            </label>
            {err("logo")}
          </div>

          <div className="field">
            <span id="colors-label" style={{ fontWeight: 600, fontSize: 15 }}>
              Farben <span className="opt">optional</span>
            </span>
            <div className="colors" role="group" aria-labelledby="colors-label">
              {values.colors.map((c, i) => (
                <span className="swatch" key={i}>
                  <input
                    type="color"
                    aria-label={`Farbe ${i + 1}`}
                    value={c}
                    onChange={(e) =>
                      set(
                        "colors",
                        values.colors.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                  />
                  {c.toUpperCase()}
                  <button type="button" aria-label={`Farbe ${i + 1} entfernen`} onClick={() => set("colors", values.colors.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </span>
              ))}
              {values.colors.length < MAX_COLORS && (
                <button type="button" className="add-color" onClick={() => set("colors", [...values.colors, values.colors.length ? "#0b1f3a" : "#89cff0"])}>
                  + Farbe hinzufügen
                </button>
              )}
            </div>
            <input
              className="input"
              id="colorNote"
              name="colorNote"
              aria-label="Hinweis zu Farben"
              placeholder="Oder in Worten: z. B. „Dunkelgrün wie unser Firmenwagen, bitte kein Rot“"
              maxLength={200}
              value={values.colorNote}
              onChange={(e) => set("colorNote", e.target.value)}
            />
          </div>
        </div>
      )}

      {errors.form ? (
        <div className="notice notice--error" role="alert" style={{ marginTop: 24 }}>
          {errors.form}
        </div>
      ) : null}

      <div className="form-actions">
        {step > 0 ? (
          <button type="button" className="back" onClick={() => setStep((s) => s - 1)}>
            ← Zurück
          </button>
        ) : (
          <span className="cta-note">Dauert ca. 3 Minuten</span>
        )}
        <button type="submit" className="btn btn--primary" disabled={sending}>
          {step < 2 ? (
            <>
              Weiter <span className="arrow">→</span>
            </>
          ) : sending ? (
            "Wird gesendet …"
          ) : (
            <>
              Demo anfordern <span className="arrow">→</span>
            </>
          )}
        </button>
      </div>
      {step === 2 && (
        <p className="legal-note">
          Mit dem Absenden erhalten Sie eine Mail zur Bestätigung. Wir verwenden Ihre Angaben nur für Ihre Demo und die Kontaktaufnahme dazu. Mehr in der{" "}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      )}
    </form>
  );
}
