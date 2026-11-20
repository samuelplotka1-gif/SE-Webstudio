import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DemoInput } from "@/lib/demo-schema";
import { env } from "./env";

/**
 * Kleine Ablage auf dem Dateisystem: eine JSON-Datei pro Anfrage.
 * Bewusst ohne Datenbank – die Website hält Daten nur kurz, das CRM ist die Quelle der Wahrheit.
 */
export type CrmState = {
  status: "pending" | "sent" | "failed" | "skipped";
  attempts: number;
  lastError?: string;
  contactId?: string;
  duplicate?: boolean;
  sentAt?: string;
};

export type DemoRecord = {
  id: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "confirmed";
  confirmedAt?: string;
  data: DemoInput & { website?: string };
  logo?: { file: string; mime: string; size: number; originalName: string };
  crm: CrmState;
};

const dir = () => path.join(env.storageDir, "demo-anfragen");
const fileFor = (id: string) => {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) throw new Error("Ungültige ID");
  return path.join(dir(), `${id}.json`);
};

export async function saveRecord(rec: DemoRecord): Promise<void> {
  await fs.mkdir(dir(), { recursive: true });
  const target = fileFor(rec.id);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rec, null, 2), { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, target);
}

export async function loadRecord(id: string): Promise<DemoRecord | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(id), "utf8")) as DemoRecord;
  } catch {
    return null;
  }
}

export async function saveLogo(id: string, ext: string, bytes: Uint8Array): Promise<string> {
  await fs.mkdir(dir(), { recursive: true });
  const name = `${id}-logo.${ext}`;
  await fs.writeFile(path.join(dir(), name), bytes, { mode: 0o600 });
  return name;
}

export async function readLogo(file: string): Promise<Buffer | null> {
  if (!/^[A-Za-z0-9_-]{8,40}-logo\.(png|jpg|webp|svg)$/.test(file)) return null;
  try {
    return await fs.readFile(path.join(dir(), file));
  } catch {
    return null;
  }
}

export async function deleteRecord(rec: DemoRecord): Promise<void> {
  await fs.rm(fileFor(rec.id), { force: true });
  if (rec.logo) await fs.rm(path.join(dir(), rec.logo.file), { force: true });
}

export async function listRecords(): Promise<DemoRecord[]> {
  let names: string[] = [];
  try {
    names = await fs.readdir(dir());
  } catch {
    return [];
  }
  const out: DemoRecord[] = [];
  for (const n of names) {
    if (!n.endsWith(".json")) continue;
    const rec = await loadRecord(n.slice(0, -5));
    if (rec) out.push(rec);
  }
  return out;
}
