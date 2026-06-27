import { cookies } from "next/headers";
import { timingSafeEqual, createHmac, pbkdf2Sync, randomBytes } from "crypto";

const cookieName = "slushi_admin";
const sessionMaxAgeSeconds = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-only-slushi-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeCompare(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function hashAdminPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return "pbkdf2_sha256$310000$" + salt + "$" + hash;
}

function verifyPasswordHash(password: string, storedHash: string) {
  const [algorithm, iterationsRaw, salt, expected] = storedHash.split("$");
  const iterations = Number(iterationsRaw);

  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !expected) {
    return false;
  }

  const actual = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return safeCompare(actual, expected);
}

export function verifyPassword(password: string) {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (configuredHash) {
    return verifyPasswordHash(password, configuredHash);
  }

  const configured = process.env.ADMIN_PASSWORD ?? "change-me";
  return safeCompare(password, configured);
}

export async function setAdminSession(email: string) {
  const value = `${email}:${Date.now()}`;
  const cookieStore = await cookies();

  cookieStore.set(cookieName, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export function parseSignedSession(raw: string) {
  const separatorIndex = raw.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  return {
    value: raw.slice(0, separatorIndex),
    signature: raw.slice(separatorIndex + 1)
  };
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(cookieName)?.value;

  if (!raw) {
    throw new Error("Unauthorized");
  }

  const session = parseSignedSession(raw);
  if (!session || !safeCompare(sign(session.value), session.signature)) {
    throw new Error("Unauthorized");
  }

  const [email, issuedAtRaw] = session.value.split(":");
  const issuedAt = Number(issuedAtRaw);
  if (!email || !issuedAt || Date.now() - issuedAt > sessionMaxAgeSeconds * 1000) {
    throw new Error("Unauthorized");
  }

  return { email };
}
