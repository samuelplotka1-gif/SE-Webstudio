import "server-only";
import { demoSchema, LOGO_MAX_BYTES, normalizeWebsite, sniffImage, type DemoInput } from "@/lib/demo-schema";
import { forwardToCrm } from "./crm";
import { CONFIRMED_TTL_MS, env, PENDING_TTL_MS } from "./env";
import { confirmationMail, notifyMail, sendMail } from "./mail";
import { deleteRecord, listRecords, loadRecord, saveLogo, saveRecord, type DemoRecord } from "./store";
import { hashToken, newId, newToken, verifyToken } from "./tokens";

export type SubmitResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };

/** Mindestzeit zwischen Laden des Formulars und Absenden – Bots sind schneller. */
const MIN_FILL_MS = 4000;

export async function submitDemo(form: FormData, now = Date.now()): Promise<SubmitResult> {
  // Honeypot & Zeitfalle: Bots bekommen eine scheinbar erfolgreiche Antwort.
  const hp = String(form.get("firma_website") ?? "");
  const startedAt = Number(form.get("startedAt") ?? 0);
  if (hp || !startedAt || now - startedAt < MIN_FILL_MS) return { ok: true };

  const parsed = demoSchema.safeParse({
    name: form.get("name") ?? "",
    email: form.get("email") ?? "",
    company: form.get("company") ?? "",
    industry: form.get("industry") ?? "",
    description: form.get("description") ?? "",
    website: form.get("website") ?? "",
    phone: form.get("phone") ?? "",
    colors: form.getAll("colors").map(String),
    colorNote: form.get("colorNote") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, status: 422, error: "Bitte prüfen Sie Ihre Angaben.", fieldErrors };
  }
  const data: DemoInput = { ...parsed.data, website: parsed.data.website ? (normalizeWebsite(parsed.data.website) ?? undefined) : undefined };

  const id = newId();
  const token = newToken();
  let logo: DemoRecord["logo"];
  const file = form.get("logo");
  if (file instanceof File && file.size > 0) {
    if (file.size > LOGO_MAX_BYTES) return { ok: false, status: 413, error: "Das Logo ist zu groß (max. 3 MB).", fieldErrors: { logo: "Max. 3 MB" } };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return { ok: false, status: 415, error: "Das Logo muss PNG, JPG, WebP oder SVG sein.", fieldErrors: { logo: "Nur PNG, JPG, WebP oder SVG" } };
    const stored = await saveLogo(id, kind.ext, bytes);
    logo = { file: stored, mime: kind.mime, size: file.size, originalName: file.name.slice(0, 120) };
  }

  const rec: DemoRecord = {
    id,
    tokenHash: hashToken(token),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + PENDING_TTL_MS).toISOString(),
    status: "pending",
    data,
    logo,
    crm: { status: "pending", attempts: 0 },
  };
  await saveRecord(rec);

  const confirmUrl = `${env.siteUrl}/demo/bestaetigen?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
  try {
    await sendMail(confirmationMail({ name: data.name, email: data.email, company: data.company, confirmUrl }));
  } catch (err) {
    console.error("[demo] Bestätigungsmail fehlgeschlagen", err);
    await deleteRecord(rec);
    return { ok: false, status: 502, error: "Die Bestätigungsmail konnte nicht versendet werden. Bitte versuchen Sie es später erneut." };
  }
  return { ok: true };
}

export type ConfirmCheck =
  | { state: "valid"; rec: DemoRecord }
  | { state: "confirmed"; rec: DemoRecord }
  | { state: "expired" }
  | { state: "invalid" };

export async function checkConfirmation(id: string, token: string, now = Date.now()): Promise<ConfirmCheck> {
  if (!id || !token) return { state: "invalid" };
  let rec: DemoRecord | null = null;
  try {
    rec = await loadRecord(id);
  } catch {
    return { state: "invalid" };
  }
  if (!rec || !verifyToken(token, rec.tokenHash)) return { state: "invalid" };
  if (rec.status === "confirmed") return { state: "confirmed", rec };
  if (Date.parse(rec.expiresAt) < now) return { state: "expired" };
  return { state: "valid", rec };
}

/** Bestätigt eine Anfrage und gibt sie ans CRM weiter. Idempotent. */
export async function confirmDemo(id: string, token: string, now = Date.now()): Promise<ConfirmCheck["state"]> {
  const check = await checkConfirmation(id, token, now);
  if (check.state !== "valid") return check.state;
  const rec = check.rec;
  rec.status = "confirmed";
  rec.confirmedAt = new Date(now).toISOString();
  rec.expiresAt = new Date(now + CONFIRMED_TTL_MS).toISOString();
  await saveRecord(rec);

  rec.crm = await forwardToCrm(rec);
  if (rec.crm.status === "failed") console.error(`[demo] CRM-Übergabe für ${rec.id} fehlgeschlagen: ${rec.crm.lastError}`);
  const { company, name, industry } = rec.data;
  await saveRecord(redactIfDelivered(rec));

  if (env.notifyEmail) {
    const crmStatus = { sent: "übertragen", failed: "fehlgeschlagen – wird erneut versucht", skipped: "nicht eingerichtet", pending: "ausstehend" }[rec.crm.status];
    await sendMail(notifyMail({ to: env.notifyEmail, company, name, industry, crmStatus })).catch((e) =>
      console.error("[demo] Benachrichtigung fehlgeschlagen", e),
    );
  }
  return "confirmed";
}

/**
 * Datensparsamkeit: Ist die Anfrage im CRM angekommen, braucht die Website die Personendaten nicht mehr.
 * Übrig bleiben nur Firma, Branche und – für den Logo-Link – die Logo-Datei.
 */
export function redactIfDelivered(rec: DemoRecord): DemoRecord {
  if (rec.crm.status !== "sent") return rec;
  rec.data = { ...rec.data, name: "", email: "", description: "", phone: undefined, website: undefined, colorNote: undefined };
  return rec;
}

const MAX_CRM_ATTEMPTS = 12;

/** Aufräumen + erneute CRM-Übergabe. Wird regelmäßig über /api/cron/aufraeumen aufgerufen. */
export async function housekeeping(now = Date.now()) {
  const result = { deletedPending: 0, deletedConfirmed: 0, retried: 0, retryFailed: 0 };
  for (const rec of await listRecords()) {
    const expired = Date.parse(rec.expiresAt) < now;
    if (rec.status === "pending" && expired) {
      await deleteRecord(rec);
      result.deletedPending++;
      continue;
    }
    if (rec.status === "confirmed" && expired) {
      await deleteRecord(rec);
      result.deletedConfirmed++;
      continue;
    }
    if (rec.status === "confirmed" && rec.crm.status === "failed" && rec.crm.attempts < MAX_CRM_ATTEMPTS) {
      rec.crm = await forwardToCrm(rec);
      await saveRecord(redactIfDelivered(rec));
      result.retried++;
      if (rec.crm.status === "failed") result.retryFailed++;
    }
  }
  return result;
}
