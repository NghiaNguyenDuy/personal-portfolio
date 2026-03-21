import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "portfolio_session";
const ONE_WEEK = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "reader";
}

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? "development-auth-secret-change-me";
}

function toSessionRole(role: string): SessionUser["role"] {
  return role === "ADMIN" ? "admin" : "reader";
}

function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function decodeSession(value: string): SessionUser | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getAuthSecret()).update(payload).digest();
  const provided = Buffer.from(signature, "base64url");

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const attempted = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  return attempted.length === expected.length && timingSafeEqual(attempted, expected);
}

export async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return null;
  }

  const passwordHash = hashPassword(adminPassword);

  return prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      passwordHash,
      name: "Portfolio Admin"
    },
    create: {
      email: adminEmail,
      name: "Portfolio Admin",
      role: "ADMIN",
      passwordHash
    }
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) {
    return null;
  }

  return decodeSession(value);
}

export async function createUserSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_WEEK
  });
}

export async function clearUserSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/sign-in");
  }

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  return user;
}

export function asSessionUser(user: { id: string; email: string; name: string | null; role: string }): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email.split("@")[0],
    role: toSessionRole(user.role)
  };
}