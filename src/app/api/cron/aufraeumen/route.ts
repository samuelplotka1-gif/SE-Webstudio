import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { housekeeping } from "@/server/demo-service";
import { env } from "@/server/env";

/**
 * Regelmäßig aufrufen (z. B. alle 15 Minuten per Cronjob):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://se-webstudio.de/api/cron/aufraeumen
 * Löscht unbestätigte Anfragen nach 48 h, bestätigte nach 30 Tagen und wiederholt fehlgeschlagene CRM-Übergaben.
 */
export async function POST(req: NextRequest) {
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(env.cronSecret ?? "");
  if (!env.cronSecret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const result = await housekeeping();
  return NextResponse.json({ ok: true, ...result });
}
