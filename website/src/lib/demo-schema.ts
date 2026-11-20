import { z } from "zod";
import { industries } from "@/content/site";

/** Muss unter dem CRM-Limit für Notizen (2.000 Zeichen) bleiben, zusammen mit den Zusatzangaben. */
export const DESCRIPTION_MIN = 30;
export const DESCRIPTION_MAX = 1200;
export const LOGO_MAX_BYTES = 3 * 1024 * 1024;
export const MAX_COLORS = 4;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

export function normalizeWebsite(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProto);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const demoSchema = z.object({
  name: z.string().trim().min(2, "Bitte geben Sie Ihren Namen an.").max(120),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email("Bitte prüfen Sie die E-Mail-Adresse.")),
  company: z.string().trim().min(2, "Bitte geben Sie Ihre Firma an.").max(160),
  industry: z.enum(industries, { error: "Bitte wählen Sie eine Branche." }),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN, `Bitte beschreiben Sie Ihr Vorhaben in mindestens ${DESCRIPTION_MIN} Zeichen.`)
    .max(DESCRIPTION_MAX, `Bitte höchstens ${DESCRIPTION_MAX} Zeichen.`),
  website: optionalText(300).refine((v) => v === undefined || normalizeWebsite(v) !== null, "Bitte prüfen Sie die Adresse Ihrer Website."),
  phone: optionalText(40).refine((v) => v === undefined || /^[+\d(][\d\s()/-]{5,}$/.test(v), "Bitte prüfen Sie die Telefonnummer."),
  colors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
    .max(MAX_COLORS)
    .default([]),
  colorNote: optionalText(200),
});

export type DemoInput = z.infer<typeof demoSchema>;

/** Prüft die ersten Bytes, damit nur echte Bilddateien angenommen werden. */
export function sniffImage(buf: Uint8Array): { mime: string; ext: string } | null {
  const starts = (...bytes: number[]) => bytes.every((b, i) => buf[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { mime: "image/png", ext: "png" };
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (starts(0x52, 0x49, 0x46, 0x46) && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return { mime: "image/webp", ext: "webp" };
  const head = new TextDecoder().decode(buf.slice(0, 1024)).toLowerCase();
  if (head.includes("<svg")) return { mime: "image/svg+xml", ext: "svg" };
  return null;
}
