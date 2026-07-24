import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * CMS data model.
 *
 * The CMS owns form submissions (part inquiries, trade/credit account
 * applications, support requests) and the staff who manage them. It does NOT
 * store orders, carts, or products — those remain in Shopify. Approved
 * trade/credit applications are synced to Shopify as tagged customers.
 */

export const submissionType = pgEnum("submission_type", [
  "part_inquiry",
  "trade_account",
  "credit_account",
  "support_tracking",
  "support_resources",
  "support_question",
  "unsubscribe",
]);

export const submissionStatus = pgEnum("submission_status", [
  "new",
  "in_review",
  "approved",
  "rejected",
  "completed",
]);

export const staffRole = pgEnum("staff_role", ["admin", "staff"]);

export const staffUsers = pgTable("staff_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  role: staffRole("role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    type: submissionType("type").notNull(),
    status: submissionStatus("status").notNull().default("new"),
    /** Free-form, type-specific fields captured from the public form. */
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    contactEmail: varchar("contact_email", { length: 254 }).notNull(),
    contactName: varchar("contact_name", { length: 160 }),
    company: varchar("company", { length: 160 }),
    /** Human-friendly reference shown to the submitter, e.g. SA-2026-000123. */
    reference: varchar("reference", { length: 60 }),
    /** Set once a trade/credit application has been synced to Shopify. */
    shopifyCustomerId: varchar("shopify_customer_id", { length: 60 }),
    shopifySyncedAt: timestamp("shopify_synced_at", { withTimezone: true }),
    createdByStaff: integer("created_by_staff").references(() => staffUsers.id),
    reviewedBy: integer("reviewed_by").references(() => staffUsers.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("submissions_type_status_idx").on(table.type, table.status),
    index("submissions_created_at_idx").on(table.createdAt),
  ],
);

export const submissionNotes = pgTable("submission_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  staffId: integer("staff_id").references(() => staffUsers.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Schema defined now; file uploads are implemented in a later phase. */
export const attachments = pgTable("attachments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mime: varchar("mime", { length: 120 }).notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StaffUser = typeof staffUsers.$inferSelect;
export type NewStaffUser = typeof staffUsers.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionNote = typeof submissionNotes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;

export type SubmissionType = (typeof submissionType.enumValues)[number];
export type SubmissionStatus = (typeof submissionStatus.enumValues)[number];
