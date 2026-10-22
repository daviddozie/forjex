import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { getDb, credentials } from "@/db";

export interface CliAuthorization {
  githubToken: string;
  vercelToken?: string;
  user: { username: string; name?: string; avatarUrl?: string };
}

const pending = new Map<string, { expires: number; payload: CliAuthorization }>();
const ttl = 3 * 60 * 1000;
const provider = "cli_session";
export const validCliSession = (session: unknown): session is string => typeof session === "string" && /^[a-f0-9]{64}$/.test(session);
const sessionKey = (session: string) => createHash("sha256").update(session).digest("hex");

function encryptionKey() {
  const secret = process.env.FORJEX_SESSION_SECRET || process.env.GITHUB_CLIENT_SECRET;
  if (!secret) throw new Error("Configure FORJEX_SESSION_SECRET for persistent CLI authorization");
  return createHash("sha256").update(secret).digest();
}

export function encryptCliAuthorization(payload: CliAuthorization) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function decryptCliAuthorization(value: string): CliAuthorization {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"));
}

export async function authorizeCliSession(session: string, payload: CliAuthorization) {
  const { db } = getDb();
  if (db) {
    const encrypted = encryptCliAuthorization(payload);
    await db.delete(credentials).where(and(eq(credentials.provider, provider), lt(credentials.createdAt, new Date(Date.now() - ttl))));
    await db.insert(credentials).values({ id: sessionKey(session), provider, accessToken: encrypted, username: payload.user.username });
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Database required for CLI authorization");
  for (const [key, entry] of pending) if (entry.expires < Date.now()) pending.delete(key);
  if (pending.size >= 1000 || pending.has(sessionKey(session))) throw new Error("CLI session cannot be authorized");
  pending.set(sessionKey(session), { expires: Date.now() + ttl, payload });
}

/** Atomic delete makes credential delivery single-use across server instances. */
export async function consumeCliSession(session: string): Promise<CliAuthorization | null> {
  const { db } = getDb();
  if (db) {
    const [record] = await db.delete(credentials).where(and(eq(credentials.id, sessionKey(session)), eq(credentials.provider, provider))).returning();
    if (!record || record.createdAt.getTime() < Date.now() - ttl) return null;
    return decryptCliAuthorization(record.accessToken);
  }
  if (process.env.NODE_ENV === "production") throw new Error("Database required for CLI authorization");
  const key = sessionKey(session);
  const entry = pending.get(key);
  pending.delete(key);
  return entry && entry.expires > Date.now() ? entry.payload : null;
}
