import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function newId(): string {
  return randomBytes(12).toString("base64url");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb);
}

export function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/** Prüft, ob ein Bestätigungs-Token zum gespeicherten Hash passt. */
export function verifyToken(token: string, storedHash: string): boolean {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return false;
  return safeEqualHex(hashToken(token), storedHash);
}

export function signLogoUrl(secret: string, id: string, expiresAt: number): string {
  return hmacHex(secret, `logo:${id}:${expiresAt}`);
}

export function verifyLogoSignature(secret: string, id: string, expiresAt: number, sig: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(sig) || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return safeEqualHex(signLogoUrl(secret, id, expiresAt), sig);
}
