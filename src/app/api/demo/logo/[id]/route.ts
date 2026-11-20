import { NextResponse, type NextRequest } from "next/server";
import { requireAppSecret } from "@/server/env";
import { loadRecord, readLogo } from "@/server/store";
import { verifyLogoSignature } from "@/server/tokens";

/** Signierter, zeitlich begrenzter Download des hochgeladenen Logos (Link steht in der CRM-Notiz). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/demo/logo/[id]">) {
  const { id } = await ctx.params;
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyLogoSignature(requireAppSecret(), id, exp, sig)) return new NextResponse("Link ungültig oder abgelaufen", { status: 403 });

  const rec = await loadRecord(id).catch(() => null);
  if (!rec?.logo || rec.status !== "confirmed") return new NextResponse("Nicht gefunden", { status: 404 });
  const bytes = await readLogo(rec.logo.file);
  if (!bytes) return new NextResponse("Nicht gefunden", { status: 404 });

  const safeName = `logo-${rec.data.company.replace(/[^a-z0-9äöüß-]+/gi, "-").slice(0, 40) || id}.${rec.logo.file.split(".").pop()}`;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": rec.logo.mime,
      // Immer als Download – verhindert, dass ein SVG mit Skript im Browser ausgeführt wird.
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
