import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_FILE = path.join(process.cwd(), "data", "leads.jsonl");

/** Steuerzeichen entfernen: Sie könnten im Terminal oder in Logs Unsinn anrichten. */
function cleanName(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim().slice(0, 120);
}

/** Einfache, großzügige E-Mail-Prüfung: etwas@etwas.tld */
export function isValidEmail(value) {
  const s = String(value || "").trim();
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/**
 * Speichert einen Kontakt als Zeile in data/leads.jsonl und schickt ihn
 * optional an einen Webhook (z. B. Zapier, Make oder ein CRM).
 * Fehler beim Webhook werden nur protokolliert, der Check läuft trotzdem weiter.
 */
export async function saveLead(lead, options = {}) {
  const file = options.file || process.env.LEADS_FILE || DEFAULT_FILE;
  const webhook = options.webhook ?? process.env.LEAD_WEBHOOK_URL;

  const record = {
    createdAt: new Date().toISOString(),
    email: String(lead.email).trim().toLowerCase(),
    host: lead.host,
    score: lead.score,
    consent: true,
    ...(lead.name ? { name: cleanName(lead.name) } : {}),
  };

  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  // Nur der Betreiber darf die Datei lesen, sie enthält personenbezogene Daten.
  await fs.appendFile(file, JSON.stringify(record) + "\n", { encoding: "utf8", mode: 0o600 });

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) console.error(`Lead-Webhook antwortete mit Status ${res.status}`);
    } catch (err) {
      console.error(`Lead-Webhook fehlgeschlagen: ${err.message}`);
    }
  }

  return record;
}

/** Liest alle gespeicherten Kontakte, neueste zuerst. */
export async function readLeads(file = process.env.LEADS_FILE || DEFAULT_FILE) {
  let text;
  try {
    text = await fs.readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .reverse();
}
