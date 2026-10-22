"use strict";
const form = document.getElementById("form");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const result = document.getElementById("result");

const order = ["Sicherheit", "Geschwindigkeit", "Mobil", "SEO", "Pflichtangaben", "Barrierefreiheit", "Technik"];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = document.getElementById("url").value.trim();
  const email = document.getElementById("email").value.trim();
  const name = document.getElementById("name").value.trim();
  const consent = document.getElementById("consent").checked;
  btn.disabled = true;
  result.hidden = true;
  errorEl.hidden = true;
  statusEl.hidden = false;
  statusEl.textContent = "Seite wird geladen und geprüft …";
  try {
    const res = await fetch("/api/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, email, name, consent }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
    render(data);
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    statusEl.hidden = true;
  }
});

function render(r) {
  const ring = document.getElementById("ring");
  ring.textContent = r.score;
  ring.style.background = r.score >= 85 ? "var(--ok)" : r.score >= 60 ? "var(--warn)" : "var(--fail)";
  document.getElementById("verdict").textContent = r.summary.verdict;
  document.getElementById("meta").textContent = `${r.host} · ${r.summary.fails} Probleme, ${r.summary.warns} Hinweise · geprüft am ${new Date(r.checkedAt).toLocaleString("de-DE")}`;

  const wrap = document.getElementById("checks");
  wrap.innerHTML = "";
  for (const cat of order) {
    const items = r.checks.filter((c) => c.category === cat);
    if (!items.length) continue;
    const h = document.createElement("div");
    h.className = "cat";
    h.textContent = cat;
    wrap.appendChild(h);
    for (const c of items) {
      const el = document.createElement("div");
      el.className = "check " + c.status;
      el.innerHTML = `<div class="dot"></div><div><strong>${esc(c.title)} ${c.value ? `<span class="val">${esc(c.value)}</span>` : ""}</strong><p>${esc(c.message)}</p>${c.tip ? `<div class="tip">Empfehlung: ${esc(c.tip)}</div>` : ""}</div>`;
      wrap.appendChild(el);
    }
  }
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
