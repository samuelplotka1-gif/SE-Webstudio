import { readLeads } from "./leads.js";

const leads = await readLeads();
if (leads.length === 0) {
  console.log("Noch keine Kontakte gespeichert.");
  process.exit(0);
}

console.log(`${leads.length} Kontakt(e), neueste zuerst:\n`);
for (const l of leads) {
  const when = new Date(l.createdAt).toLocaleString("de-DE");
  console.log(`${when}  ${String(l.score).padStart(3)} Punkte  ${l.host.padEnd(30)}  ${l.email}${l.name ? `  (${l.name})` : ""}`);
}
