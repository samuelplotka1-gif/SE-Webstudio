import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const tmp = mkdtempSync(path.join(os.tmpdir(), "sew-test-"));

beforeAll(() => {
  process.env.STORAGE_DIR = tmp;
  process.env.SITE_URL = "https://example.test";
  process.env.APP_SECRET = "x".repeat(40);
});
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function form(overrides: Record<string, string | string[]> = {}, now = Date.now()) {
  const fd = new FormData();
  const base: Record<string, string | string[]> = {
    name: "Erika Muster",
    email: "Erika@Muster.de",
    company: "Tischlerei Muster",
    industry: "Handwerk & Bau",
    description: "Wir bauen Küchen und Einbauschränke und brauchen eine neue Website mit Anfrageformular.",
    website: "muster.de",
    phone: "0561 123456",
    colors: ["#1f3a32"],
    colorNote: "",
    startedAt: String(now - 60_000),
    firma_website: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) (Array.isArray(v) ? v : [v]).forEach((x) => fd.append(k, x));
  return fd;
}

describe("demoSchema", () => {
  it("normalisiert Website und E-Mail und lehnt zu kurze Beschreibung ab", async () => {
    const { demoSchema, normalizeWebsite } = await import("@/lib/demo-schema");
    expect(normalizeWebsite("muster.de")).toBe("https://muster.de");
    expect(normalizeWebsite("kein url")).toBeNull();
    const ok = demoSchema.safeParse({ name: "Al", email: " A@B.DE ", company: "AB", industry: "Sonstiges", description: "x".repeat(30) });
    expect(ok.success && ok.data.email).toBe("a@b.de");
    const bad = demoSchema.safeParse({ name: "Al", email: "a@b.de", company: "AB", industry: "Sonstiges", description: "zu kurz" });
    expect(bad.success).toBe(false);
  });

  it("erkennt Bildformate an den ersten Bytes", async () => {
    const { sniffImage } = await import("@/lib/demo-schema");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))?.mime).toBe("image/png");
    expect(sniffImage(new TextEncoder().encode("<?xml?><svg xmlns=''/>"))?.ext).toBe("svg");
    expect(sniffImage(new TextEncoder().encode("MZ executable"))).toBeNull();
  });
});

describe("Double-Opt-in", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("legt Anfrage an, verschickt Bestätigungslink und bestätigt genau einmal", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { submitDemo, confirmDemo, checkConfirmation } = await import("@/server/demo-service");
    const res = await submitDemo(form());
    expect(res.ok).toBe(true);

    const logged = info.mock.calls.map((c) => String(c[0])).join("\n");
    const m = /bestaetigen\?id=([\w-]+)&t=([\w-]+)/.exec(logged);
    expect(m).not.toBeNull();
    const [, id, token] = m!;

    expect((await checkConfirmation(id, "falsch".repeat(5))).state).toBe("invalid");
    expect((await checkConfirmation(id, token)).state).toBe("valid");
    expect(await confirmDemo(id, token)).toBe("confirmed");
    expect((await checkConfirmation(id, token)).state).toBe("confirmed");
  });

  it("lässt abgelaufene Links nicht mehr zu und räumt sie auf", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { submitDemo, checkConfirmation, housekeeping } = await import("@/server/demo-service");
    const past = Date.now() - 3 * 24 * 3600 * 1000;
    await submitDemo(form({}, past), past);
    const [, id, token] = /bestaetigen\?id=([\w-]+)&t=([\w-]+)/.exec(info.mock.calls.map((c) => String(c[0])).join("\n"))!;
    expect((await checkConfirmation(id, token)).state).toBe("expired");
    const r = await housekeeping();
    expect(r.deletedPending).toBeGreaterThanOrEqual(1);
    expect((await checkConfirmation(id, token)).state).toBe("invalid");
  });

  it("ignoriert Bots still (Honeypot und zu schnelles Absenden)", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { submitDemo } = await import("@/server/demo-service");
    expect((await submitDemo(form({ firma_website: "spam" }))).ok).toBe(true);
    expect((await submitDemo(form({ startedAt: String(Date.now()) }))).ok).toBe(true);
    expect(info).not.toHaveBeenCalled();
  });

  it("meldet Feldfehler zurück", async () => {
    const { submitDemo } = await import("@/server/demo-service");
    const res = await submitDemo(form({ email: "kaputt", industry: "Raumfahrt" }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.fieldErrors?.email).toBeTruthy();
      expect(res.fieldErrors?.industry).toBeTruthy();
    }
  });

  it("lehnt Dateien ab, die keine Bilder sind", async () => {
    const { submitDemo } = await import("@/server/demo-service");
    const fd = form();
    fd.append("logo", new File([new TextEncoder().encode("MZ not an image")], "virus.png"));
    const res = await submitDemo(fd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(415);
  });
});

describe("CRM-Übergabe", () => {
  it("baut Payload mit deutschen Feldnamen unter 2.000 Zeichen und signiert korrekt", async () => {
    vi.resetModules();
    process.env.CRM_WEBHOOK_URL = "https://crm.example.test/api/webhooks/website-abc";
    process.env.CRM_WEBHOOK_SECRET = "geheim";
    const { buildCrmPayload, forwardToCrm } = await import("@/server/crm");
    const rec = {
      id: "abcdefgh1234",
      tokenHash: "",
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      status: "confirmed" as const,
      confirmedAt: new Date().toISOString(),
      data: {
        name: "Erika Muster",
        email: "erika@muster.de",
        company: "Tischlerei Muster",
        industry: "Handwerk & Bau" as const,
        description: "y".repeat(1200),
        website: "https://muster.de",
        colors: ["#1f3a32", "#d9a441"],
        colorNote: "Grün wie der Firmenwagen",
      },
      logo: { file: "abcdefgh1234-logo.png", mime: "image/png", size: 10, originalName: "logo.png" },
      crm: { status: "pending" as const, attempts: 0 },
    };
    const payload = buildCrmPayload(rec, "https://example.test/api/demo/logo/abcdefgh1234?exp=1&sig=2");
    expect(payload).toMatchObject({ firma: "Tischlerei Muster", ansprechpartner: "Erika Muster", email: "erika@muster.de", branche: "Handwerk & Bau", webseite: "https://muster.de" });
    expect(payload.kategorien).toContain("Demo angefragt");
    expect(payload.nachricht.length).toBeLessThan(2000);
    expect(payload.nachricht).toContain("Wunschfarben: #1f3a32, #d9a441");

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body);
      const sig = (init?.headers as Record<string, string>)["X-Signature"];
      expect(sig).toBe(`sha256=${createHmac("sha256", "geheim").update(body).digest("hex")}`);
      return new Response(JSON.stringify({ ok: true, contactId: "c1", duplicate: false }), { status: 200 });
    });
    const state = await forwardToCrm(rec, fetchMock as unknown as typeof fetch);
    expect(state).toMatchObject({ status: "sent", attempts: 1, contactId: "c1" });

    const failing = vi.fn(async () => new Response("nope", { status: 401 }));
    const failed = await forwardToCrm(rec, failing as unknown as typeof fetch);
    expect(failed.status).toBe("failed");
    expect(failed.lastError).toContain("401");
  });
});

describe("Logo-Link", () => {
  it("akzeptiert nur gültige, nicht abgelaufene Signaturen", async () => {
    const { signLogoUrl, verifyLogoSignature } = await import("@/server/tokens");
    const exp = Date.now() + 60_000;
    const sig = signLogoUrl("s".repeat(40), "abcdefgh1234", exp);
    expect(verifyLogoSignature("s".repeat(40), "abcdefgh1234", exp, sig)).toBe(true);
    expect(verifyLogoSignature("s".repeat(40), "anderer-id12", exp, sig)).toBe(false);
    expect(verifyLogoSignature("s".repeat(40), "abcdefgh1234", Date.now() - 1, signLogoUrl("s".repeat(40), "abcdefgh1234", Date.now() - 1))).toBe(false);
  });
});
