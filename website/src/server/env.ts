import "server-only";
import path from "node:path";

function optional(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

export const env = {
  siteUrl: (optional("SITE_URL") ?? "http://localhost:3100").replace(/\/$/, ""),
  storageDir: path.resolve(/*turbopackIgnore: true*/ optional("STORAGE_DIR") ?? "./storage"),
  /** Signiert Logo-Links. Fehlt er, gibt es in Produktion einen Fehler beim ersten Gebrauch. */
  appSecret: optional("APP_SECRET"),
  smtp: {
    host: optional("SMTP_HOST"),
    port: Number(optional("SMTP_PORT") ?? 587),
    secure: optional("SMTP_SECURE") === "true",
    user: optional("SMTP_USER"),
    pass: optional("SMTP_PASS"),
  },
  mailFrom: optional("MAIL_FROM") ?? "S&E Webstudio <samuel.begaj@se-webstudio.de>",
  mailReplyTo: optional("MAIL_REPLY_TO"),
  notifyEmail: optional("NOTIFY_EMAIL"),
  crmWebhookUrl: optional("CRM_WEBHOOK_URL"),
  crmWebhookSecret: optional("CRM_WEBHOOK_SECRET"),
  cronSecret: optional("CRON_SECRET"),
  isProd: process.env.NODE_ENV === "production",
};

export function requireAppSecret(): string {
  if (env.appSecret && env.appSecret.length >= 32) return env.appSecret;
  if (env.isProd) throw new Error("APP_SECRET fehlt oder ist kürzer als 32 Zeichen.");
  return "dev-only-secret-dev-only-secret-dev-only";
}

/** Wie lange eine unbestätigte Anfrage gültig ist. */
export const PENDING_TTL_MS = 48 * 60 * 60 * 1000;
/** Wie lange bestätigte Anfragen (inkl. Logo) für das CRM abrufbar bleiben. */
export const CONFIRMED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
