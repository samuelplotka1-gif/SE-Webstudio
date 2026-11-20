import "server-only";
import { CONFIRMED_TTL_MS, env, requireAppSecret } from "./env";
import type { CrmState, DemoRecord } from "./store";
import { hmacHex, signLogoUrl } from "./tokens";

/**
 * Baut den JSON-Körper für den eingehenden Webhook des agentur-crm
 * (siehe agentur-crm/src/lib/webhooks.ts → mapInboundLead).
 * Feldnamen deutsch, damit die automatische Zuordnung greift.
 * Die Notiz bleibt unter 2.000 Zeichen (Limit im CRM).
 */
export function buildCrmPayload(rec: DemoRecord, logoUrl: string | null): Record<string, string> {
  const d = rec.data;
  const lines = [
    "DEMO-ANFRAGE über die Website",
    `Bestätigt (Double-Opt-in): ${new Date(rec.confirmedAt ?? Date.now()).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`,
    "",
    "Beschreibung:",
    d.description,
  ];
  const extras: string[] = [];
  if (d.colors.length) extras.push(`Wunschfarben: ${d.colors.join(", ")}`);
  if (d.colorNote) extras.push(`Hinweis zu Farben: ${d.colorNote}`);
  if (logoUrl) extras.push(`Logo: ${logoUrl} (Link 30 Tage gültig)`);
  if (extras.length) lines.push("", ...extras);
  lines.push("", `Anfrage-ID: ${rec.id}`);

  const payload: Record<string, string> = {
    firma: d.company,
    ansprechpartner: d.name,
    email: d.email,
    branche: d.industry,
    quelle: "Webseite",
    kategorien: "Demo angefragt, Website-Formular",
    nachricht: lines.join("\n").slice(0, 1990),
  };
  if (d.phone) payload.telefon = d.phone;
  if (d.website) payload.webseite = d.website;
  return payload;
}

export function logoUrlFor(rec: DemoRecord): string | null {
  if (!rec.logo) return null;
  const confirmed = rec.confirmedAt ? Date.parse(rec.confirmedAt) : Date.now();
  const exp = confirmed + CONFIRMED_TTL_MS;
  const sig = signLogoUrl(requireAppSecret(), rec.id, exp);
  return `${env.siteUrl}/api/demo/logo/${rec.id}?exp=${exp}&sig=${sig}`;
}

/** Sendet die bestätigte Anfrage ans CRM. Gibt den neuen CRM-Zustand zurück, wirft nie. */
export async function forwardToCrm(rec: DemoRecord, fetchImpl: typeof fetch = fetch): Promise<CrmState> {
  const attempts = rec.crm.attempts + 1;
  if (!env.crmWebhookUrl || !env.crmWebhookSecret) {
    if (env.isProd) return { status: "failed", attempts, lastError: "CRM_WEBHOOK_URL oder CRM_WEBHOOK_SECRET fehlt" };
    console.info("[crm] Kein CRM-Webhook eingerichtet – Übergabe übersprungen (Entwicklung).");
    return { status: "skipped", attempts };
  }
  const body = JSON.stringify(buildCrmPayload(rec, logoUrlFor(rec)));
  try {
    const res = await fetchImpl(env.crmWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": `sha256=${hmacHex(env.crmWebhookSecret, body)}`,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 200);
      return { status: "failed", attempts, lastError: `HTTP ${res.status} ${text}`.trim() };
    }
    const json = (await res.json().catch(() => ({}))) as { contactId?: string; duplicate?: boolean };
    return { status: "sent", attempts, contactId: json.contactId, duplicate: json.duplicate, sentAt: new Date().toISOString() };
  } catch (err) {
    return { status: "failed", attempts, lastError: err instanceof Error ? err.message : String(err) };
  }
}
