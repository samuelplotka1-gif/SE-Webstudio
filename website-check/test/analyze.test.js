import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, computeScore } from "../src/analyze.js";
import { normalizeInput } from "../src/fetchSite.js";

const goodHtml = `<!doctype html><html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Malerbetrieb Müller – Ihr Maler in Köln seit 1990</title>
<meta name="description" content="Malerbetrieb Müller in Köln: Innenanstrich, Fassaden, Tapezierarbeiten. Kostenlose Beratung vor Ort und faire Festpreise für Privat- und Geschäftskunden.">
<link rel="icon" href="/favicon.ico"><meta property="og:title" content="Malerbetrieb Müller">
</head><body><h1>Malerbetrieb Müller</h1><img src="a.jpg" alt="Team">
<footer><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a></footer></body></html>`;

const badHtml = `<html><head></head><body><p>Willkommen</p><img src="a.jpg"><img src="b.jpg"><h1>A</h1><h1>B</h1></body></html>`;

function byId(report, id) {
  return report.checks.find((c) => c.id === id);
}

test("gute Seite bekommt hohe Punktzahl", () => {
  const r = analyze({ html: goodHtml, finalUrl: "https://example.de/", loadTimeMs: 400, bytes: 20_000, httpsOk: true, httpStatus: 200 });
  assert.ok(r.score >= 95, `score was ${r.score}`);
  assert.equal(r.summary.fails, 0);
  assert.equal(byId(r, "impressum").status, "ok");
  assert.equal(byId(r, "datenschutz").status, "ok");
  assert.equal(byId(r, "title").status, "ok");
});

test("schlechte Seite bekommt niedrige Punktzahl und benennt die Probleme", () => {
  const r = analyze({ html: badHtml, finalUrl: "http://example.de/", loadTimeMs: 5000, bytes: 900_000, httpsOk: false, httpStatus: 200 });
  assert.ok(r.score < 30, `score was ${r.score}`);
  assert.equal(byId(r, "https").status, "fail");
  assert.equal(byId(r, "viewport").status, "fail");
  assert.equal(byId(r, "title").status, "fail");
  assert.equal(byId(r, "description").status, "fail");
  assert.equal(byId(r, "impressum").status, "fail");
  assert.equal(byId(r, "datenschutz").status, "fail");
  assert.equal(byId(r, "h1").status, "warn");
  assert.equal(byId(r, "alt").status, "fail");
  assert.equal(byId(r, "loadtime").status, "fail");
});

test("noindex wird als Fehler erkannt", () => {
  const html = goodHtml.replace("</head>", '<meta name="robots" content="noindex, nofollow"></head>');
  const r = analyze({ html, finalUrl: "https://example.de/", loadTimeMs: 400, bytes: 20_000, httpsOk: true, httpStatus: 200 });
  assert.equal(byId(r, "indexable").status, "fail");
});

test("Impressum wird auch über den Link-Pfad erkannt", () => {
  const html = `<html><body><a href="/legal-notice">Rechtliches</a><a href="/privacy">Privacy</a></body></html>`;
  const r = analyze({ html, finalUrl: "https://example.de/", loadTimeMs: 400, bytes: 1000, httpsOk: true, httpStatus: 200 });
  assert.equal(byId(r, "impressum").status, "ok");
  assert.equal(byId(r, "datenschutz").status, "ok");
});

test("computeScore gewichtet Warnungen halb", () => {
  const checks = [
    { status: "ok", weight: 10 },
    { status: "warn", weight: 10 },
    { status: "fail", weight: 10 },
  ];
  assert.equal(computeScore(checks), 50);
});

test("normalizeInput akzeptiert verschiedene Schreibweisen", () => {
  assert.equal(normalizeInput("example.de"), "example.de");
  assert.equal(normalizeInput("  https://www.Example.de/seite?x=1 "), "www.example.de");
  assert.equal(normalizeInput("http://example.de"), "example.de");
});

test("normalizeInput lehnt Unsinn und interne Adressen ab", () => {
  assert.throws(() => normalizeInput(""), /Domain eingeben/);
  assert.throws(() => normalizeInput("kein domain"), /gültigen Domain/);
  assert.throws(() => normalizeInput("localhost"), /Interne Adressen/);
  assert.throws(() => normalizeInput("192.168.1.1"), /Interne Adressen/);
  assert.throws(() => normalizeInput("10.0.0.5"), /Interne Adressen/);
});

test("normalizeInput behält einen Port bei", () => {
  assert.equal(normalizeInput("example.de:8080/pfad"), "example.de:8080");
});
