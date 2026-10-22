import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkSite, UserError } from "./fetchSite.js";
import { isValidEmail, saveLead } from "./leads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Verrät sonst "Express" in jeder Antwort. Angreifer suchen gezielt nach bekannten Frameworks.
app.disable("x-powered-by");

// Hinter einem Reverse-Proxy (nginx, Caddy, Hoster) TRUST_PROXY=1 setzen, sonst sehen
// alle Besucher wie dieselbe IP aus und die Drossel sperrt alle gemeinsam.
// Ohne Proxy NICHT setzen, sonst kann jeder seine IP per Header fälschen.
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);

// Sicherheits-Header für jede Antwort.
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (req.secure) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Drossel: max. 10 Checks pro Minute und IP, damit niemand das Tool als Scanner missbraucht.
// Alte Einträge werden regelmäßig entfernt, sonst wächst die Tabelle unbegrenzt.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    const recent = times.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}, WINDOW_MS).unref();

app.use("/api/check", (req, res, next) => {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Zu viele Anfragen. Bitte kurz warten." });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
});

// E-Mail-Pflicht lässt sich für interne Nutzung mit REQUIRE_EMAIL=0 abschalten.
const requireEmail = process.env.REQUIRE_EMAIL !== "0";

app.post("/api/check", async (req, res) => {
  const { url, email, name, consent } = req.body || {};

  if (requireEmail || email) {
    if (!isValidEmail(email)) return res.status(400).json({ error: "Bitte eine gültige E-Mail-Adresse angeben." });
    if (consent !== true) return res.status(400).json({ error: "Bitte der Kontaktaufnahme zustimmen." });
  }

  try {
    const report = await checkSite(url);
    if (email) {
      try {
        await saveLead({ email, name, host: report.host, score: report.score });
      } catch (err) {
        console.error(`Kontakt konnte nicht gespeichert werden: ${err.message}`);
      }
    }
    res.json(report);
  } catch (err) {
    if (err instanceof UserError) return res.status(400).json({ error: err.message });
    // Interne Fehler nie nach außen geben: sie verraten Pfade, Versionen und Logik.
    console.error("Unerwarteter Fehler beim Check:", err);
    res.status(500).json({ error: "Interner Fehler. Bitte später erneut versuchen." });
  }
});

// Ungültiges JSON oder zu großer Body: knappe JSON-Antwort statt Express-Standardseite mit Stacktrace.
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Ungültige Anfrage." });
  if (err?.type === "entity.too.large") return res.status(413).json({ error: "Anfrage zu groß." });
  console.error("Unerwarteter Fehler:", err);
  res.status(500).json({ error: "Interner Fehler." });
});

app.listen(PORT, () => {
  console.log(`SE-Webstudio Website-Check läuft auf http://localhost:${PORT}`);
});
