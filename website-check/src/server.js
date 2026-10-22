import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkSite } from "./fetchSite.js";
import { isValidEmail, saveLead } from "./leads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Einfache Drossel: max. 10 Checks pro Minute und IP, damit niemand das Tool als Scanner missbraucht.
const hits = new Map();
app.use("/api/check", (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 10) return res.status(429).json({ error: "Zu viele Anfragen. Bitte kurz warten." });
  recent.push(now);
  hits.set(ip, recent);
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
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SE-Webstudio Website-Check läuft auf http://localhost:${PORT}`);
});
