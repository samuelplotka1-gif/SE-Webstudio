import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkSite } from "./fetchSite.js";

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

app.post("/api/check", async (req, res) => {
  try {
    const report = await checkSite(req.body?.url);
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/check", async (req, res) => {
  try {
    const report = await checkSite(req.query.url);
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SE-Webstudio Website-Check läuft auf http://localhost:${PORT}`);
});
