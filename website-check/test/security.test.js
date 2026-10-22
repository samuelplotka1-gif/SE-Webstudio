import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateIp, isPrivateHostname, assertPublicHost, normalizeInput, checkSite, UserError } from "../src/fetchSite.js";

test("isPrivateIp sperrt interne IPv4-Bereiche", () => {
  for (const ip of ["127.0.0.1", "127.255.255.254", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.0.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "224.0.0.1"]) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
});

test("isPrivateIp lässt öffentliche IPv4-Adressen durch", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.0.1", "192.167.0.1", "100.63.0.1", "100.128.0.1"]) {
    assert.equal(isPrivateIp(ip), false, ip);
  }
});

test("isPrivateIp sperrt interne IPv6-Bereiche und gemappte IPv4-Adressen", () => {
  for (const ip of ["::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::7f00:1", "2002:7f00:1::"]) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
  assert.equal(isPrivateIp("2a00:1450:4001:80b::200e"), false);
  assert.equal(isPrivateIp("::ffff:8.8.8.8"), false);
});

test("isPrivateHostname erkennt lokale Namen", () => {
  assert.equal(isPrivateHostname("localhost"), true);
  assert.equal(isPrivateHostname("drucker.local"), true);
  assert.equal(isPrivateHostname("db.internal"), true);
  assert.equal(isPrivateHostname("firma.de"), false);
});

test("normalizeInput lehnt ungewöhnliche Ports ab", () => {
  assert.throws(() => normalizeInput("firma.de:22"), /Ports 80, 443/);
  assert.throws(() => normalizeInput("firma.de:3306"), /Ports 80, 443/);
  assert.equal(normalizeInput("firma.de:8080"), "firma.de:8080");
  assert.equal(normalizeInput("firma.de:443"), "firma.de");
});

test("assertPublicHost sperrt Domains, die auf interne IPs zeigen (DNS-Rebinding)", async () => {
  const lookup = async () => ["93.184.216.34", "127.0.0.1"];
  await assert.rejects(() => assertPublicHost("harmlos-aussehend.de", lookup), UserError);
  await assert.rejects(() => assertPublicHost("metadaten.de", async () => ["169.254.169.254"]), UserError);
  await assert.rejects(() => assertPublicHost("leer.de", async () => []), UserError);
  await assert.doesNotReject(() => assertPublicHost("firma.de", async () => ["93.184.216.34"]));
});

test("assertPublicHost meldet nicht auflösbare Domains verständlich", async () => {
  await assert.rejects(() => assertPublicHost("gibts-nicht.example", async () => { throw new Error("ENOTFOUND"); }), /nicht auflösen/);
});

function fakeFetch(routes) {
  return async (url) => {
    const r = routes[url.toString()];
    if (!r) throw new Error("ECONNREFUSED " + url);
    return new Response(r.body ?? "", { status: r.status ?? 200, headers: r.headers ?? {} });
  };
}

test("checkSite folgt Weiterleitungen nicht auf interne Adressen", async () => {
  const lookup = async (h) => (h === "firma.de" ? ["93.184.216.34"] : ["127.0.0.1"]);
  const fetchImpl = fakeFetch({
    "https://firma.de/": { status: 302, headers: { location: "http://127.0.0.1:8080/admin" } },
  });
  await assert.rejects(() => checkSite("firma.de", { lookup, fetchImpl }), /Port|Interne Adressen/);
});

test("checkSite folgt Weiterleitungen nicht auf eine Domain, die intern auflöst", async () => {
  const lookup = async (h) => (h === "firma.de" ? ["93.184.216.34"] : ["10.0.0.5"]);
  const fetchImpl = fakeFetch({
    "https://firma.de/": { status: 301, headers: { location: "https://intern.firma.de/" } },
  });
  await assert.rejects(() => checkSite("firma.de", { lookup, fetchImpl }), /Interne Adressen/);
});

test("checkSite folgt harmlosen Weiterleitungen und bricht bei zu vielen ab", async () => {
  const lookup = async () => ["93.184.216.34"];
  const okHtml = '<html lang="de"><head><title>Firma</title></head><body><h1>Hi</h1></body></html>';
  const fetchImpl = fakeFetch({
    "https://firma.de/": { status: 301, headers: { location: "https://www.firma.de/" } },
    "https://www.firma.de/": { status: 200, body: okHtml },
  });
  const r = await checkSite("firma.de", { lookup, fetchImpl });
  assert.equal(r.finalUrl, "https://www.firma.de/");
  assert.equal(r.checks.find((c) => c.id === "https").status, "ok");

  const loop = fakeFetch({ "https://loop.de/": { status: 302, headers: { location: "https://loop.de/" } } });
  await assert.rejects(() => checkSite("loop.de", { lookup, fetchImpl: loop }), /zu oft weiter/);
});

test("checkSite liest höchstens 3 MB, auch wenn die Seite mehr liefert", async () => {
  const lookup = async () => ["93.184.216.34"];
  const big = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(1024 * 1024)); // endlos 1 MB-Blöcke
    },
  });
  const fetchImpl = async () => new Response(big, { status: 200 });
  const r = await checkSite("riesig.de", { lookup, fetchImpl });
  assert.equal(r.truncated, true);
  assert.ok(r.checks.length > 0);
});

test("checkSite versucht nach einer Sperre nicht noch einmal über HTTP", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response("", { status: 200 }); };
  await assert.rejects(() => checkSite("firma.de", { lookup: async () => ["127.0.0.1"], fetchImpl }), UserError);
  assert.equal(calls, 0);
});
