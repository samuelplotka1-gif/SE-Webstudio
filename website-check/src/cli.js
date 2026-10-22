import { checkSite } from "./fetchSite.js";

const input = process.argv[2];
if (!input) {
  console.error("Aufruf: npm run check -- example.de");
  process.exit(1);
}

const icons = { ok: "✔", warn: "⚠", fail: "✘" };

try {
  const r = await checkSite(input);
  console.log(`\nWebsite-Check für ${r.host}`);
  console.log(`Geprüft: ${r.finalUrl}\n`);
  console.log(`Punktzahl: ${r.score} / 100  –  ${r.summary.verdict}\n`);
  let cat = "";
  for (const c of r.checks) {
    if (c.category !== cat) {
      cat = c.category;
      console.log(`[${cat}]`);
    }
    console.log(`  ${icons[c.status]} ${c.title}${c.value ? ` (${c.value})` : ""}`);
    console.log(`     ${c.message}`);
    if (c.tip) console.log(`     → ${c.tip}`);
  }
  console.log("");
} catch (err) {
  console.error(`Fehler: ${err.message}`);
  process.exit(2);
}
