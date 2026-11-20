import { NextResponse, type NextRequest } from "next/server";
import { LOGO_MAX_BYTES } from "@/lib/demo-schema";
import { submitDemo } from "@/server/demo-service";
import { clientIp, SlidingLimiter } from "@/server/rate-limit";

/** 5 Anfragen pro 10 Minuten und IP */
const limiter = new SlidingLimiter(5, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  if (!limiter.allow(clientIp(req.headers))) {
    return NextResponse.json({ ok: false, error: "Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut." }, { status: 429 });
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > LOGO_MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ ok: false, error: "Die Anfrage ist zu groß. Das Logo darf höchstens 3 MB haben." }, { status: 413 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
  }
  try {
    const result = await submitDemo(form);
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/demo] Fehler", err);
    return NextResponse.json({ ok: false, error: "Da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut." }, { status: 500 });
  }
}
