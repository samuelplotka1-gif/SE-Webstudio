import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isValidEmail, saveLead, readLeads } from "../src/leads.js";

test("isValidEmail erkennt gültige und ungültige Adressen", () => {
  assert.equal(isValidEmail("max@firma.de"), true);
  assert.equal(isValidEmail("  Max.Mustermann@sub.firma.co.uk "), true);
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("max@firma"), false);
  assert.equal(isValidEmail("max firma.de"), false);
  assert.equal(isValidEmail(undefined), false);
});

test("saveLead schreibt eine Zeile, readLeads liest sie neueste zuerst", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "leads-"));
  const file = path.join(dir, "sub", "leads.jsonl");

  await saveLead({ email: " Max@Firma.de ", host: "firma.de", score: 61, name: "Max" }, { file, webhook: null });
  await saveLead({ email: "anna@beispiel.de", host: "beispiel.de", score: 88 }, { file, webhook: null });

  const leads = await readLeads(file);
  assert.equal(leads.length, 2);
  assert.equal(leads[0].email, "anna@beispiel.de");
  assert.equal(leads[1].email, "max@firma.de");
  assert.equal(leads[1].name, "Max");
  assert.equal(leads[1].consent, true);
  assert.ok(leads[1].createdAt);
});

test("readLeads gibt leere Liste zurück, wenn es noch keine Datei gibt", async () => {
  const leads = await readLeads(path.join(os.tmpdir(), "gibt-es-nicht-" + Date.now(), "x.jsonl"));
  assert.deepEqual(leads, []);
});
