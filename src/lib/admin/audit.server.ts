import { adminAuditLog } from "../db/schema";

type AuditDatabase = {
  insert: (table: typeof adminAuditLog) => {
    values: (value: typeof adminAuditLog.$inferInsert) => Promise<unknown>;
  };
};

export async function writeAdminAudit(
  db: AuditDatabase,
  entry: {
    staffId: number | null;
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
  },
) {
  await db.insert(adminAuditLog).values({
    staffId: entry.staffId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details,
  });
}
