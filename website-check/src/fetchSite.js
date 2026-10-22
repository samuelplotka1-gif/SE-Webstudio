import dns from "node:dns/promises";
import net from "node:net";
import { analyze } from "./analyze.js";

const UA = "Mozilla/5.0 (compatible; SE-Webstudio-Check/1.0; +https://se-webstudio.de)";
const TIMEOUT_MS = 15000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
// Nur übliche Web-Ports. Sonst ließe sich das Tool als Port-Scanner missbrauchen.
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

// Testmodus: ALLOW_PRIVATE=1 hebt Host- und Port-Sperre auf. Nie im Betrieb setzen.
const devMode = () => process.env.ALLOW_PRIVATE === "1";

/** Fehler, deren Text dem Nutzer gezeigt werden darf. Alles andere bleibt im Log. */
export class UserError extends Error {}

/**
 * Normalisiert die Eingabe des Nutzers zu "host" oder "host:port".
 * Akzeptiert "example.de", "www.example.de/seite", "https://example.de".
 */
export function normalizeInput(input) {
  let s = String(input || "").trim();
  if (!s) throw new UserError("Bitte eine Domain eingeben.");
  if (s.length > 253) throw new UserError("Das sieht nicht nach einer gültigen Domain aus.");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let url;
  try {
    url = new URL(s);
  } catch {
    throw new UserError("Das sieht nicht nach einer gültigen Domain aus.");
  }
  const hostname = stripBrackets(url.hostname.toLowerCase());
  if (!devMode() && isPrivateHostname(hostname)) {
    throw new UserError("Interne Adressen können nicht geprüft werden.");
  }
  const isIp = net.isIP(hostname) !== 0;
  if (!isIp && hostname !== "localhost" && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) {
    throw new UserError("Das sieht nicht nach einer gültigen Domain aus.");
  }
  if (!devMode() && !ALLOWED_PORTS.has(url.port)) {
    throw new UserError("Nur die Ports 80, 443, 8080 und 8443 können geprüft werden.");
  }
  return url.host.toLowerCase();
}

function stripBrackets(h) {
  return h.startsWith("[") && h.endsWith("]") ? h.slice(1, -1) : h;
}

/** Offensichtlich interne Namen, noch bevor DNS gefragt wird. */
export function isPrivateHostname(hostname) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".home.arpa")) return true;
  return net.isIP(hostname) !== 0 && isPrivateIp(hostname);
}

/**
 * Prüft, ob eine IP-Adresse zu einem internen oder reservierten Bereich gehört.
 * Deckt IPv4, IPv6 und IPv4-mapped-IPv6 (::ffff:10.0.0.1) ab.
 */
export function isPrivateIp(ip) {
  let v = String(ip).toLowerCase();
  if (v.startsWith("::ffff:") && net.isIPv4(v.slice(7))) v = v.slice(7);

  if (net.isIPv4(v)) {
    const [a, b] = v.split(".").map(Number);
    return (
      a === 0 || // "dieses Netz"
      a === 10 || // privat
      a === 127 || // loopback
      (a === 100 && b >= 64 && b <= 127) || // Carrier-Grade NAT
      (a === 169 && b === 254) || // link-local, dort liegen Cloud-Metadaten-Dienste
      (a === 172 && b >= 16 && b <= 31) || // privat
      (a === 192 && b === 168) || // privat
      (a === 198 && (b === 18 || b === 19)) || // Benchmark-Netz
      a >= 224 // Multicast und reserviert
    );
  }

  if (net.isIPv6(v)) {
    if (v === "::" || v === "::1") return true;
    const first = parseInt(v.split(":")[0] || "", 16);
    if (Number.isNaN(first)) return true; // beginnt mit "::", z. B. IPv4-kompatible Altformen
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (first === 0x2002 || first === 0x0064) return true; // 6to4-Relay und 64:ff9b:: NAT64 können auf IPv4-Privatbereiche zeigen
    return false;
  }

  return true; // Unbekanntes Format: im Zweifel sperren.
}

const defaultLookup = async (hostname) => (await dns.lookup(hostname, { all: true })).map((a) => a.address);

/**
 * Löst den Hostnamen auf und stellt sicher, dass KEINE der Adressen intern ist.
 * Das ist der eigentliche Schutz gegen SSRF: Jemand könnte "meine-domain.de"
 * auf 127.0.0.1 oder 169.254.169.254 zeigen lassen.
 */
export async function assertPublicHost(hostname, lookup = defaultLookup) {
  if (devMode()) return;
  const h = stripBrackets(hostname.toLowerCase());
  if (isPrivateHostname(h)) throw new UserError("Interne Adressen können nicht geprüft werden.");
  let addrs;
  try {
    addrs = await lookup(h);
  } catch {
    throw new UserError(`Die Domain ${h} lässt sich nicht auflösen.`);
  }
  if (addrs.length === 0 || addrs.some(isPrivateIp)) {
    throw new UserError("Interne Adressen können nicht geprüft werden.");
  }
}

/** Liest den Body, bricht aber bei MAX_BYTES ab, statt beliebig viel Speicher zu belegen. */
async function readCapped(body) {
  if (!body) return { buf: Buffer.alloc(0), bytes: 0, truncated: false };
  const chunks = [];
  let bytes = 0;
  for await (const chunk of body) {
    bytes += chunk.length;
    chunks.push(chunk);
    if (bytes >= MAX_BYTES) {
      await body.cancel().catch(() => {});
      return { buf: Buffer.concat(chunks).subarray(0, MAX_BYTES), bytes, truncated: true };
    }
  }
  return { buf: Buffer.concat(chunks), bytes, truncated: false };
}

/**
 * Ruft eine URL ab und folgt Weiterleitungen von Hand, damit jeder Sprung
 * erneut gegen die Host- und Port-Sperre geprüft wird.
 */
async function fetchChecked(startUrl, { lookup, fetchImpl = fetch } = {}) {
  let url = new URL(startUrl);
  const deadline = Date.now() + TIMEOUT_MS;
  const started = performance.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new UserError("Die Seite leitet auf eine nicht unterstützte Adresse weiter.");
    }
    if (!devMode() && !ALLOWED_PORTS.has(url.port)) {
      throw new UserError("Die Seite leitet auf einen nicht erlaubten Port weiter.");
    }
    await assertPublicHost(url.hostname, lookup);

    const remaining = deadline - Date.now();
    if (remaining <= 0) throw Object.assign(new Error("timeout"), { name: "TimeoutError" });

    const res = await fetchImpl(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(remaining),
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8", "accept-language": "de,en;q=0.8" },
    });

    const location = res.headers.get("location");
    if ([301, 302, 303, 307, 308].includes(res.status) && location) {
      await res.body?.cancel().catch(() => {});
      url = new URL(location, url);
      continue;
    }

    const { buf, bytes, truncated } = await readCapped(res.body);
    const loadTimeMs = performance.now() - started;
    return { ok: res.ok, status: res.status, finalUrl: url.toString(), html: buf.toString("utf8"), bytes, truncated, loadTimeMs };
  }

  throw new UserError("Die Seite leitet zu oft weiter.");
}

/**
 * Ruft die Startseite einer Domain ab (erst HTTPS, dann HTTP) und analysiert sie.
 * `options.lookup` und `options.fetchImpl` dienen nur Tests.
 */
export async function checkSite(input, options = {}) {
  const host = normalizeInput(input);

  let result = null;
  let lastError = null;

  for (const scheme of ["https", "http"]) {
    try {
      result = await fetchChecked(`${scheme}://${host}/`, options);
      break;
    } catch (err) {
      if (err instanceof UserError) throw err; // Sperre gegriffen: nicht mit HTTP erneut versuchen
      lastError = err;
    }
  }

  if (!result) {
    const timedOut = lastError?.name === "TimeoutError" || lastError?.name === "AbortError";
    throw new UserError(timedOut ? `Die Seite hat nicht innerhalb von 15 Sekunden geantwortet. (${host})` : `Die Seite ist nicht erreichbar. (${host})`);
  }

  const report = analyze({
    html: result.html,
    finalUrl: result.finalUrl,
    loadTimeMs: result.loadTimeMs,
    bytes: result.bytes,
    httpsOk: result.finalUrl.startsWith("https://"),
    httpStatus: result.status,
  });

  return { host, checkedAt: new Date().toISOString(), truncated: result.truncated, ...report };
}
