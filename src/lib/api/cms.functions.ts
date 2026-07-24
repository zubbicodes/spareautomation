import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { SlidingWindowRateLimiter } from "../cms/rate-limit";
import { getDb } from "../db/index.server";
import { attachments, submissions, type SubmissionType } from "../db/schema";
import { notifySalesDesk } from "../notify.server";
import { unsubscribeCustomerEmail } from "../shopify/customer-sync.server";

/**
 * Public form submission endpoints. Each validates input (honeypot included),
 * applies a per-IP rate limit, stores the submission, and emails the sales desk.
 *
 * NOTE: These store submissions in the CMS. They never create orders — orders
 * and quotes remain in Shopify.
 */

export type SubmissionResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

// --- Rate limiting ---------------------------------------------------------

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 8;
const rateLimiter = new SlidingWindowRateLimiter(MAX_PER_WINDOW, WINDOW_MS);

function rateLimitKey(scope: string): string {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  return `${ip}:${scope}`;
}

/** Returns true when the request is within the allowed rate. */
function withinRateLimit(scope: string): boolean {
  return rateLimiter.consume(rateLimitKey(scope));
}

// --- Shared helpers --------------------------------------------------------

const honeypot = z.string().max(0);
const emailField = z.string().trim().email("Enter a valid email address").max(254);

function formatPayload(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}

async function recordSubmission(input: {
  type: SubmissionType;
  payload: Record<string, unknown>;
  contactEmail: string;
  contactName?: string;
  company?: string;
  emailSubject: string;
  emailHeading: string;
}): Promise<SubmissionResult> {
  const db = getDb();

  const [row] = await db
    .insert(submissions)
    .values({
      type: input.type,
      payload: input.payload,
      contactEmail: input.contactEmail,
      contactName: input.contactName ?? null,
      company: input.company ?? null,
    })
    .returning({ id: submissions.id });

  const reference = `SA-${new Date().getFullYear()}-${String(row.id).padStart(6, "0")}`;
  await db.update(submissions).set({ reference }).where(eq(submissions.id, row.id));

  const text = [
    input.emailHeading,
    `Reference: ${reference}`,
    `Contact email: ${input.contactEmail}`,
    input.contactName ? `Contact name: ${input.contactName}` : "",
    input.company ? `Company: ${input.company}` : "",
    "",
    formatPayload(input.payload),
  ]
    .filter((line) => line !== "")
    .join("\n");

  await notifySalesDesk({
    subject: input.emailSubject,
    text,
    replyTo: input.contactEmail,
  });

  return { ok: true, reference };
}

// --- Part inquiry (homepage) ----------------------------------------------

const partInquirySchema = z.object({
  partNumber: z.string().trim().min(1, "Part number is required").max(120),
  description: z.string().trim().max(3000).optional(),
  name: z.string().trim().max(120).optional(),
  email: emailField,
  phone: z.string().trim().max(30).optional(),
  website: honeypot,
});

export const submitPartInquiry = createServerFn({ method: "POST" })
  .inputValidator(partInquirySchema)
  .handler(async ({ data }): Promise<SubmissionResult> => {
    if (!withinRateLimit("part_inquiry")) {
      return { ok: false, error: "Too many requests. Please try again later." };
    }
    return recordSubmission({
      type: "part_inquiry",
      payload: {
        "Part number": data.partNumber,
        Description: data.description,
        Phone: data.phone,
      },
      contactEmail: data.email,
      contactName: data.name,
      emailSubject: `Part inquiry: ${data.partNumber}`,
      emailHeading: "New part inquiry",
    });
  });

// --- Trade account application ---------------------------------------------

const tradeAccountSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(160),
  tradingName: z.string().trim().max(160).optional(),
  contactName: z.string().trim().min(1, "Contact name is required").max(160),
  email: emailField,
  phone: z.string().trim().min(1, "Phone is required").max(30),
  companyNumber: z.string().trim().max(40).optional(),
  vatNumber: z.string().trim().max(40).optional(),
  billingAddress: z.string().trim().min(1, "Billing address is required").max(1000),
  deliveryAddress: z.string().trim().max(1000).optional(),
  requirements: z.string().trim().min(1, "Please tell us your requirements").max(3000),
  monthlySpend: z.string().trim().max(120).optional(),
  requestedTerms: z
    .enum(["pay-as-you-go", "credit-terms", "not-sure"])
    .default("pay-as-you-go"),
  website: honeypot,
});

export const submitTradeAccount = createServerFn({ method: "POST" })
  .inputValidator(tradeAccountSchema)
  .handler(async ({ data }): Promise<SubmissionResult> => {
    if (!withinRateLimit("trade_account")) {
      return { ok: false, error: "Too many requests. Please try again later." };
    }
    const { website: _honeypot, ...fields } = data;
    return recordSubmission({
      type: "trade_account",
      payload: {
        "Trading name": fields.tradingName,
        Phone: fields.phone,
        "Company number": fields.companyNumber,
        "VAT number": fields.vatNumber,
        "Billing address": fields.billingAddress,
        "Delivery address": fields.deliveryAddress,
        "Purchasing requirements": fields.requirements,
        "Estimated monthly spend": fields.monthlySpend,
        "Requested terms": fields.requestedTerms,
      },
      contactEmail: fields.email,
      contactName: fields.contactName,
      company: fields.company,
      emailSubject: `Trade account application: ${fields.company}`,
      emailHeading: "New trade account application",
    });
  });

// --- Credit account application ---------------------------------------------

const creditAccountSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(160),
  tradingName: z.string().trim().max(160).optional(),
  contactName: z.string().trim().min(1, "Contact name is required").max(160),
  email: emailField,
  phone: z.string().trim().min(1, "Phone is required").max(30),
  companyNumber: z.string().trim().max(40).optional(),
  vatNumber: z.string().trim().max(40).optional(),
  billingAddress: z.string().trim().min(1, "Billing address is required").max(1000),
  yearsTrading: z.string().trim().max(20).optional(),
  requestedCreditLimit: z
    .string()
    .trim()
    .min(1, "Requested credit limit is required")
    .max(60),
  bankReference: z.string().trim().max(300).optional(),
  tradeReference1: z.string().trim().max(300).optional(),
  tradeReference2: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(3000).optional(),
  website: honeypot,
});

export const submitCreditAccount = createServerFn({ method: "POST" })
  .inputValidator(creditAccountSchema)
  .handler(async ({ data }): Promise<SubmissionResult> => {
    if (!withinRateLimit("credit_account")) {
      return { ok: false, error: "Too many requests. Please try again later." };
    }
    const { website: _honeypot, ...fields } = data;
    return recordSubmission({
      type: "credit_account",
      payload: {
        "Trading name": fields.tradingName,
        Phone: fields.phone,
        "Company number": fields.companyNumber,
        "VAT number": fields.vatNumber,
        "Billing address": fields.billingAddress,
        "Years trading": fields.yearsTrading,
        "Requested credit limit": fields.requestedCreditLimit,
        "Bank reference": fields.bankReference,
        "Trade reference 1": fields.tradeReference1,
        "Trade reference 2": fields.tradeReference2,
        Notes: fields.notes,
      },
      contactEmail: fields.email,
      contactName: fields.contactName,
      company: fields.company,
      emailSubject: `Credit account application: ${fields.company}`,
      emailHeading: "New credit account application",
    });
  });

// --- Support request (tracking / resources / question / unsubscribe) --------

const supportTypeMap: Record<"tracking" | "resources" | "question" | "unsubscribe", SubmissionType> = {
  tracking: "support_tracking",
  resources: "support_resources",
  question: "support_question",
  unsubscribe: "unsubscribe",
};

const supportSubjectMap: Record<keyof typeof supportTypeMap, string> = {
  tracking: "Order tracking request",
  resources: "Product resource request",
  question: "Product question",
  unsubscribe: "Unsubscribe request",
};

const supportRequestSchema = z.object({
  kind: z.enum(["tracking", "resources", "question", "unsubscribe"]),
  reference: z.string().trim().max(160).optional(),
  email: emailField,
  details: z.string().trim().max(3000).optional(),
  website: honeypot,
});

export const submitSupportRequest = createServerFn({ method: "POST" })
  .inputValidator(supportRequestSchema)
  .handler(async ({ data }): Promise<SubmissionResult> => {
    if (!withinRateLimit(`support_${data.kind}`)) {
      return { ok: false, error: "Too many requests. Please try again later." };
    }
    const result = await recordSubmission({
      type: supportTypeMap[data.kind],
      payload: {
        Reference: data.reference,
        Details: data.details,
      },
      contactEmail: data.email,
      emailSubject: supportSubjectMap[data.kind],
      emailHeading: `New ${supportSubjectMap[data.kind].toLowerCase()}`,
    });

    // Best-effort: also flip the Shopify customer's marketing consent.
    if (result.ok && data.kind === "unsubscribe") {
      await unsubscribeCustomerEmail(data.email);
    }

    return result;
  });

// --- Part inquiry photo upload ---------------------------------------------

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
const PHOTO_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type UploadResult = { ok: boolean; error?: string };

function hasValidImageSignature(mime: string, buffer: Buffer): boolean {
  if (mime === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mime === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

function safeOriginalFilename(value: string, fallback: string): string {
  const basename = path.basename(value || fallback);
  const cleaned = basename.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 180);
  return cleaned || fallback;
}

/**
 * Attach a photo to a freshly created part inquiry. The submission is looked
 * up by its public reference and must be a part_inquiry. Files are stored on a
 * persistent volume and recorded in the attachments table.
 */
export const uploadPartInquiryPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }): Promise<UploadResult> => {
    if (!withinRateLimit("part_inquiry_upload")) {
      return { ok: false, error: "Too many requests. Please try again later." };
    }

    const reference = String(data.get("reference") ?? "").trim();
    const file = data.get("photo");
    if (!reference) return { ok: false, error: "Missing submission reference." };
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "No photo provided." };
    }
    const ext = PHOTO_MIME_TO_EXT[file.type];
    if (!ext) return { ok: false, error: "Only JPG, PNG or WebP images are allowed." };
    if (file.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: "Photo must be under 8 MB." };
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(submissions)
      .where(eq(submissions.reference, reference))
      .limit(1);
    const submission = rows[0];
    if (!submission || submission.type !== "part_inquiry") {
      return { ok: false, error: "Submission not found." };
    }

    try {
      const { uploadDir } = getServerConfig();
      await mkdir(uploadDir, { recursive: true });
      const filename = `${submission.id}-${Date.now()}${ext}`;
      const fullPath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!hasValidImageSignature(file.type, buffer)) {
        return { ok: false, error: "The uploaded file is not a valid image." };
      }
      await writeFile(fullPath, buffer);

      await db.insert(attachments).values({
        submissionId: submission.id,
        filename: safeOriginalFilename(file.name, filename),
        mime: file.type,
        size: file.size,
        path: fullPath,
      });
      return { ok: true };
    } catch (error) {
      console.error("[cms] Failed to store upload:", error);
      return { ok: false, error: "The photo could not be uploaded." };
    }
  });
