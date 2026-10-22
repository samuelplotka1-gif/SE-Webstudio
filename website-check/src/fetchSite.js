import { analyze } from "./analyze.js";

const UA = "Mozilla/5.0 (compatible; SE-Webstudio-Check/1.0; +https://se-webstudio.de)";
const TIMEOUT_MS = 15000;
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Normalisiert die Eingabe des Nutzers zu einem Hostnamen.
 * Akzeptiert "example.de", "www.example.de/seite", "https://example.de".
 */
export function normalizeInput(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("Bitte eine Domain eingeben.");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let url;
  try {
    url = new URL(s);
  } catch {
    throw new Error("Das sieht nicht nach einer gültigen Domain aus.");
  }
  const hostname = url.hostname.toLowerCase();
  // ALLOW_PRIVATE=1 nur für lokale Tests, im Betrieb bleiben interne Adressen gesperrt.
  if (process.env.ALLOW_PRIVATE !== "1" && isPrivateHost(hostname)) {
    throw new Error("Interne Adressen können nicht geprüft werden.");
  }
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  if (!isIPv4 && hostname !== "localhost" && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) {
    throw new Error("Das sieht nicht nach einer gültigen Domain aus.");
  }
  // Host inkl. Port zurückgeben, damit z. B. firma.de:8080 geprüft werden kann.
  return url.host.toLowerCase();
}

function isPrivateHost(host) {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8", "accept-language": "de,en;q=0.8" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const loadTimeMs = performance.now() - started;
    const html = buf.subarray(0, MAX_BYTES).toString("utf8");
    return { ok: res.ok, status: res.status, finalUrl: res.url, html, bytes: buf.length, loadTimeMs };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ruft die Startseite einer Domain ab (erst HTTPS, dann HTTP) und analysiert sie.
 */
export async function checkSite(input) {
  const host = normalizeInput(input);

  let result = null;
  let httpsOk = false;
  let lastError = null;

  try {
    result = await fetchOnce(`https://${host}/`);
    httpsOk = result.finalUrl.startsWith("https://");
  } catch (err) {
    lastError = err;
  }

  if (!result) {
    try {
      result = await fetchOnce(`http://${host}/`);
      httpsOk = result.finalUrl.startsWith("https://");
    } catch (err) {
      lastError = err;
    }
  }

  if (!result) {
    const reason = lastError?.name === "AbortError" ? "Die Seite hat nicht innerhalb von 15 Sekunden geantwortet." : "Die Seite ist nicht erreichbar.";
    throw new Error(`${reason} (${host})`);
  }

  const report = analyze({
    html: result.html,
    finalUrl: result.finalUrl,
    loadTimeMs: result.loadTimeMs,
    bytes: result.bytes,
    httpsOk,
    httpStatus: result.status,
  });

  return { host, checkedAt: new Date().toISOString(), ...report };
}
