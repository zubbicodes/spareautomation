import { createServerFn } from "@tanstack/react-start";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

import { requireAdminRole, requireStaff } from "./auth.server";
import { getDb } from "../db/index.server";
import {
  adminAuditLog,
  contentDocuments,
  contentMedia,
  staffUsers,
  submissions,
} from "../db/schema";
import { CONTENT_REGISTRY, isContentKey, type ContentKey } from "../content/registry";

export type DashboardData = {
  ok: boolean;
  submissions: {
    total: number;
    last7Days: number;
    byStatus: Record<string, number>;
    recent: Array<{
      id: number;
      reference: string | null;
      type: string;
      status: string;
      contactEmail: string;
      createdAt: string;
    }>;
  };
  content: {
    total: number;
    pendingPublish: Array<{ key: ContentKey; label: string; group: string; updatedAt: string | null; updatedBy: string | null }>;
    lastPublishedAt: string | null;
  };
  media: { total: number; published: number; archived: number };
  team: { active: number; inactive: number; admins: number };
  activity: Array<{
    id: number;
    action: string;
    targetType: string;
    targetId: string;
    staff: string | null;
    createdAt: string;
  }>;
};

const EMPTY: DashboardData = {
  ok: false,
  submissions: { total: 0, last7Days: 0, byStatus: {}, recent: [] },
  content: { total: 0, pendingPublish: [], lastPublishedAt: null },
  media: { total: 0, published: 0, archived: 0 },
  team: { active: 0, inactive: 0, admins: 0 },
  activity: [],
};

/**
 * Single round trip for the CMS overview. A database outage returns the empty
 * shape with `ok: false` so the dashboard renders a notice instead of failing.
 */
export const getDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    await requireStaff();
    try {
      const db = getDb();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [statusRows, weekRows, recentRows, documentRows, mediaRows, staffRows, auditRows] =
        await Promise.all([
          db
            .select({ status: submissions.status, total: count() })
            .from(submissions)
            .groupBy(submissions.status),
          db.select({ total: count() }).from(submissions).where(gte(submissions.createdAt, weekAgo)),
          db
            .select({
              id: submissions.id,
              reference: submissions.reference,
              type: submissions.type,
              status: submissions.status,
              contactEmail: submissions.contactEmail,
              createdAt: submissions.createdAt,
            })
            .from(submissions)
            .orderBy(desc(submissions.createdAt))
            .limit(6),
          db
            .select({
              key: contentDocuments.key,
              draftVersion: contentDocuments.draftVersion,
              publishedVersion: contentDocuments.publishedVersion,
              updatedAt: contentDocuments.updatedAt,
              publishedAt: contentDocuments.publishedAt,
              updatedBy: staffUsers.name,
            })
            .from(contentDocuments)
            .leftJoin(staffUsers, eq(contentDocuments.updatedBy, staffUsers.id)),
          db
            .select({
              total: count(),
              published: sql<number>`count(*) filter (where ${contentMedia.isPublished})`,
              archived: sql<number>`count(*) filter (where ${contentMedia.isArchived})`,
            })
            .from(contentMedia),
          db
            .select({
              active: sql<number>`count(*) filter (where ${staffUsers.isActive})`,
              inactive: sql<number>`count(*) filter (where not ${staffUsers.isActive})`,
              admins: sql<number>`count(*) filter (where ${staffUsers.role} = 'admin' and ${staffUsers.isActive})`,
            })
            .from(staffUsers),
          db
            .select({
              id: adminAuditLog.id,
              action: adminAuditLog.action,
              targetType: adminAuditLog.targetType,
              targetId: adminAuditLog.targetId,
              staff: staffUsers.name,
              createdAt: adminAuditLog.createdAt,
            })
            .from(adminAuditLog)
            .leftJoin(staffUsers, eq(adminAuditLog.staffId, staffUsers.id))
            .orderBy(desc(adminAuditLog.id))
            .limit(8),
        ]);

      const byStatus = Object.fromEntries(statusRows.map((row) => [row.status, Number(row.total)]));
      const pendingPublish = documentRows
        .filter((row) => row.draftVersion !== row.publishedVersion && isContentKey(row.key))
        .map((row) => {
          const key = row.key as ContentKey;
          return {
            key,
            label: CONTENT_REGISTRY[key].label,
            group: CONTENT_REGISTRY[key].group,
            updatedAt: row.updatedAt?.toISOString() ?? null,
            updatedBy: row.updatedBy ?? null,
          };
        });
      const lastPublishedAt = documentRows
        .map((row) => row.publishedAt?.getTime() ?? 0)
        .reduce((latest, value) => Math.max(latest, value), 0);

      return {
        ok: true,
        submissions: {
          total: statusRows.reduce((total, row) => total + Number(row.total), 0),
          last7Days: Number(weekRows[0]?.total ?? 0),
          byStatus,
          recent: recentRows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
          })),
        },
        content: {
          total: documentRows.length,
          pendingPublish,
          lastPublishedAt: lastPublishedAt ? new Date(lastPublishedAt).toISOString() : null,
        },
        media: {
          total: Number(mediaRows[0]?.total ?? 0),
          published: Number(mediaRows[0]?.published ?? 0),
          archived: Number(mediaRows[0]?.archived ?? 0),
        },
        team: {
          active: Number(staffRows[0]?.active ?? 0),
          inactive: Number(staffRows[0]?.inactive ?? 0),
          admins: Number(staffRows[0]?.admins ?? 0),
        },
        activity: auditRows.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      console.error("[cms] Dashboard data unavailable:", error);
      return EMPTY;
    }
  },
);

export type AuditEntry = {
  id: number;
  action: string;
  targetType: string;
  targetId: string;
  staff: string | null;
  /** Compact JSON summary of the recorded change, safe to render as text. */
  details: string | null;
  createdAt: string;
};

/** Paged audit trail. Administrators only: it exposes who changed what. */
export const listAuditLog = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().int().min(1).max(500).default(1),
      action: z.string().trim().max(80).optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ entries: AuditEntry[]; page: number; pageCount: number; total: number }> => {
    await requireAdminRole();
    const db = getDb();
    const pageSize = 40;
    const filter = data.action ? eq(adminAuditLog.action, data.action) : undefined;
    const [totals] = await db.select({ total: count() }).from(adminAuditLog).where(filter);
    const total = Number(totals?.total ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(data.page, pageCount);
    const rows = await db
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        details: adminAuditLog.details,
        staff: staffUsers.name,
        createdAt: adminAuditLog.createdAt,
      })
      .from(adminAuditLog)
      .leftJoin(staffUsers, eq(adminAuditLog.staffId, staffUsers.id))
      .where(filter)
      .orderBy(desc(adminAuditLog.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      entries: rows.map((row) => ({
        ...row,
        details: row.details ? JSON.stringify(row.details) : null,
        createdAt: row.createdAt.toISOString(),
      })),
      page,
      pageCount,
      total,
    };
  });

/** Distinct audit actions, for the activity-log filter. */
export const listAuditActions = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminRole();
  const rows = await getDb()
    .selectDistinct({ action: adminAuditLog.action })
    .from(adminAuditLog)
    .orderBy(adminAuditLog.action);
  return rows.map((row) => row.action);
});
