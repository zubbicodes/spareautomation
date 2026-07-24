import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import {
  clearSession,
  useSession as getServerSessionManager,
} from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

import { getServerConfig } from "../config.server";
import { getDb } from "../db/index.server";
import { staffUsers, type StaffUser } from "../db/schema";

const scryptAsync = promisify(scrypt);

const ADMIN_SESSION_COOKIE = "sa_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const UNAUTHORIZED = "ADMIN_UNAUTHORIZED";

type AdminSessionData = { staffUserId?: number };

function adminSessionConfig(secret: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    password: secret,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, "hex");
  return derived.length === keyBuffer.length && timingSafeEqual(derived, keyBuffer);
}

async function getAdminSession() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return null;
  const session = await getServerSessionManager<AdminSessionData>(
    adminSessionConfig(secret),
  );
  if (!session.data.staffUserId) return null;
  return session;
}

/** Return the staff user for the current admin session, or null. */
export async function getCurrentStaff(): Promise<StaffUser | null> {
  const session = await getAdminSession();
  if (!session?.data.staffUserId) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.id, session.data.staffUserId))
    .limit(1);
  return rows[0] ?? null;
}

/** Throw if there is no authenticated staff user. Used to guard admin fns. */
export async function requireAdmin(): Promise<StaffUser> {
  const staff = await getCurrentStaff();
  if (!staff) {
    throw new Error(UNAUTHORIZED);
  }
  return staff;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === UNAUTHORIZED;
}

export async function loginStaff(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();
  const rows = await db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.email, normalizedEmail))
    .limit(1);
  const user = rows[0];
  if (!user) return { ok: false, error: "Invalid email or password." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid email or password." };

  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return { ok: false, error: "Admin authentication is not configured." };

  const session = await getServerSessionManager<AdminSessionData>(
    adminSessionConfig(secret),
  );
  await session.update({ staffUserId: user.id });
  return { ok: true };
}

export async function logoutStaff(): Promise<void> {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return;
  await clearSession({
    name: ADMIN_SESSION_COOKIE,
    password: secret,
    cookie: { path: "/" },
  });
}

/**
 * Seed the first admin account from env when no staff users exist. Called on
 * boot after migrations. Safe to call repeatedly.
 */
export async function seedInitialAdmin(): Promise<void> {
  const { databaseUrl, adminSeedEmail, adminSeedPassword } = getServerConfig();
  if (!databaseUrl || !adminSeedEmail || !adminSeedPassword) return;

  try {
    const db = getDb();
    const existing = await db.select({ id: staffUsers.id }).from(staffUsers).limit(1);
    if (existing.length) return;

    const passwordHash = await hashPassword(adminSeedPassword);
    await db.insert(staffUsers).values({
      email: adminSeedEmail.trim().toLowerCase(),
      passwordHash,
      name: "Administrator",
      role: "admin",
    });
    console.info(`[admin] Seeded initial admin account: ${adminSeedEmail}`);
  } catch (error) {
    console.error("[admin] Failed to seed initial admin:", error);
  }
}
