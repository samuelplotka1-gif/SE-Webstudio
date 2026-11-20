import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { company } from "@/content/site";
import { env } from "./env";

type Mail = { to: string; subject: string; text: string; html: string };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

let transporter: Transporter | null = null;

/**
 * Versendet über das eigene Firmenpostfach (SMTP, z. B. IONOS – wie im CRM).
 * Ohne SMTP_HOST wird die Mail in storage/outbox abgelegt und der Inhalt in der Konsole ausgegeben (Entwicklung).
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!env.smtp.host) {
    if (env.isProd) throw new Error("SMTP_HOST fehlt – in Produktion kann keine Mail versendet werden.");
    const outbox = path.join(env.storageDir, "outbox");
    await fs.mkdir(outbox, { recursive: true });
    const file = path.join(outbox, `${Date.now()}-${mail.to.replace(/[^a-z0-9@.]/gi, "_")}.txt`);
    await fs.writeFile(file, `An: ${mail.to}\nBetreff: ${mail.subject}\n\n${mail.text}`, "utf8");
    console.info(`[mail] SMTP nicht eingerichtet – Mail abgelegt unter ${file}\n${mail.text}`);
    return;
  }
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  await transporter.sendMail({ from: env.mailFrom, replyTo: env.mailReplyTo, ...mail });
}

function layout(bodyHtml: string): string {
  // Helle Mail → flache Logo-Version (absolute URL, damit Mailprogramme sie laden können)
  const logoUrl = `${env.siteUrl}/brand/SE-Webstudio_Quer_flach_hell.png`;
  return `<!doctype html><html lang="de"><body style="margin:0;background:#eaf5fb;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf5fb;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:2px solid #0b1f3a">
<tr><td style="padding:4px 12px;border-bottom:3px solid #89cff0"><img src="${logoUrl}" width="220" alt="S&amp;E Webstudio" style="display:block;border:0;width:220px;height:auto"></td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #c7dae7;font-size:12px;color:#5a6a82;line-height:1.6">${escapeHtml(company.legalName)} · ${escapeHtml(company.street)} · ${escapeHtml(company.postalCode)} ${escapeHtml(company.city)}<br>${escapeHtml(company.email)} · ${escapeHtml(company.phone)}</td></tr>
</table></td></tr></table></body></html>`;
}

export function confirmationMail(opts: { name: string; email: string; company: string; confirmUrl: string }): Mail {
  const first = opts.name.split(/\s+/)[0];
  const text = `Hallo ${first},

danke für Ihre Demo-Anfrage für ${opts.company}.

Bitte bestätigen Sie kurz, dass die Anfrage von Ihnen stammt:
${opts.confirmUrl}

Sobald Sie bestätigt haben, erstellen wir Ihre Demo – meist noch am selben Werktag. Sie bekommen sie als Vorschau-Link und PDF.

Der Link ist 48 Stunden gültig. Wenn Sie nichts angefragt haben, ignorieren Sie diese Mail einfach – Ihre Daten werden dann automatisch gelöscht.

Viele Grüße
${company.name}`;
  const html = layout(`
<p style="margin:0 0 16px">Hallo ${escapeHtml(first)},</p>
<p style="margin:0 0 16px">danke für Ihre Demo-Anfrage für <strong>${escapeHtml(opts.company)}</strong>. Bitte bestätigen Sie kurz, dass die Anfrage von Ihnen stammt:</p>
<p style="margin:24px 0"><a href="${escapeHtml(opts.confirmUrl)}" style="display:inline-block;background:#89cff0;color:#0b1f3a;text-decoration:none;font-weight:bold;padding:14px 22px;border:2px solid #0b1f3a">Anfrage bestätigen →</a></p>
<p style="margin:0 0 16px">Sobald Sie bestätigt haben, erstellen wir Ihre Demo – meist noch am selben Werktag. Sie bekommen sie als Vorschau-Link und PDF.</p>
<p style="margin:0;font-size:13px;color:#5a6a82">Der Link ist 48 Stunden gültig. Wenn Sie nichts angefragt haben, ignorieren Sie diese Mail einfach – Ihre Daten werden dann automatisch gelöscht.</p>`);
  return { to: opts.email, subject: "Bitte bestätigen: Ihre Demo-Anfrage bei S&E Webstudio", text, html };
}

export function notifyMail(opts: { to: string; company: string; name: string; industry: string; crmStatus: string }): Mail {
  const text = `Neue bestätigte Demo-Anfrage

Firma: ${opts.company}
Name: ${opts.name}
Branche: ${opts.industry}
CRM-Übergabe: ${opts.crmStatus}

Alle Details stehen im CRM.`;
  return {
    to: opts.to,
    subject: `Demo angefragt: ${opts.company}`,
    text,
    html: layout(`<p style="margin:0 0 12px"><strong>Neue bestätigte Demo-Anfrage</strong></p>
<p style="margin:0">Firma: ${escapeHtml(opts.company)}<br>Name: ${escapeHtml(opts.name)}<br>Branche: ${escapeHtml(opts.industry)}<br>CRM-Übergabe: ${escapeHtml(opts.crmStatus)}</p>
<p style="margin:16px 0 0;color:#5a6a82">Alle Details stehen im CRM.</p>`),
  };
}
