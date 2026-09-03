import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { writeAdminAudit } from "./audit.server";
import { hashPassword, requireAdminRole, requireAuthenticatedStaff, validatePassword } from "./auth.server";
import { getDb } from "../db/index.server";
import { staffUsers } from "../db/schema";

const passwordSchema = z.string().max(200).superRefine((value, context) => {
  const error = validatePassword(value);
  if (error) context.addIssue({ code: z.ZodIssueCode.custom, message: error });
});

export const listStaffUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminRole();
  const rows = await getDb().select({
    id: staffUsers.id, email: staffUsers.email, name: staffUsers.name, role: staffUsers.role,
    isActive: staffUsers.isActive, mustChangePassword: staffUsers.mustChangePassword,
    createdAt: staffUsers.createdAt, updatedAt: staffUsers.updatedAt,
  }).from(staffUsers).orderBy(asc(staffUsers.name));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
});

export const createStaffUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    name: z.string().trim().min(1).max(120),
    role: z.enum(["admin", "staff"]),
    temporaryPassword: passwordSchema,
  }))
  .handler(async ({ data }) => {
    const actor = await requireAdminRole();
    try {
      const [created] = await getDb().insert(staffUsers).values({
        email: data.email, name: data.name, role: data.role,
        passwordHash: await hashPassword(data.temporaryPassword),
        mustChangePassword: true,
      }).returning({ id: staffUsers.id });
      await writeAdminAudit(getDb() as never, { staffId: actor.id, action: "user.created", targetType: "staff_user", targetId: String(created.id), details: { role: data.role } });
      return { ok: true as const };
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) return { ok: false as const, error: "A user with this email already exists." };
      throw error;
    }
  });

const updateUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "staff"]),
  isActive: z.boolean(),
});

export const updateStaffUser = createServerFn({ method: "POST" })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    const actor = await requireAdminRole();
    return getDb().transaction(async (tx) => {
      const activeAdmins = await tx.select({ id: staffUsers.id }).from(staffUsers).where(and(eq(staffUsers.role, "admin"), eq(staffUsers.isActive, true))).for("update");
      const [target] = await tx.select().from(staffUsers).where(eq(staffUsers.id, data.id)).for("update").limit(1);
      if (!target) return { ok: false as const, error: "User not found." };
      if (actor.id === target.id && !data.isActive) return { ok: false as const, error: "You cannot deactivate your own account." };
      if (target.role === "admin" && target.isActive && (data.role !== "admin" || !data.isActive) && activeAdmins.every((admin) => admin.id === target.id)) return { ok: false as const, error: "The final active administrator cannot be demoted or deactivated." };
      const invalidate = target.isActive && !data.isActive;
      await tx.update(staffUsers).set({ name: data.name, role: data.role, isActive: data.isActive, sessionVersion: invalidate ? sql`${staffUsers.sessionVersion} + 1` : target.sessionVersion, updatedAt: sql`now()` }).where(eq(staffUsers.id, target.id));
      await writeAdminAudit(tx as never, { staffId: actor.id, action: data.isActive ? "user.updated" : "user.deactivated", targetType: "staff_user", targetId: String(target.id), details: { role: data.role } });
      return { ok: true as const };
    });
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number().int().positive(), temporaryPassword: passwordSchema }))
  .handler(async ({ data }) => {
    const actor = await requireAdminRole();
    const [target] = await getDb().update(staffUsers).set({
      passwordHash: await hashPassword(data.temporaryPassword), mustChangePassword: true,
      sessionVersion: sql`${staffUsers.sessionVersion} + 1`, updatedAt: sql`now()`,
    }).where(eq(staffUsers.id, data.id)).returning({ id: staffUsers.id });
    if (!target) return { ok: false as const, error: "User not found." };
    await writeAdminAudit(getDb() as never, { staffId: actor.id, action: "user.password_reset", targetType: "staff_user", targetId: String(data.id) });
    return { ok: true as const };
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: passwordSchema, confirmation: z.string() }))
  .handler(async ({ data }) => {
    const staff = await requireAuthenticatedStaff();
    if (data.password !== data.confirmation) return { ok: false as const, error: "Passwords do not match." };
    await getDb().update(staffUsers).set({
      passwordHash: await hashPassword(data.password), mustChangePassword: false,
      sessionVersion: sql`${staffUsers.sessionVersion} + 1`, updatedAt: sql`now()`,
    }).where(eq(staffUsers.id, staff.id));
    await writeAdminAudit(getDb() as never, { staffId: staff.id, action: "user.password_changed", targetType: "staff_user", targetId: String(staff.id) });
    return { ok: true as const, signedOut: true as const };
  });
