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
import { notifySalesDesk, sendEmail } from "../notify.server";
import { unsubscribeCustomerEmail } from "../shopify/customer-sync.server";
import { loadPublishedContentBundle } from "../content/content.server";
import { renderTemplateText } from "../content/registry";

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
  customerConfirmation?: {
    subject: string;
    heading: string;
    nextSteps: string[];
  };
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

  const content = await loadPublishedContentBundle();
  const notificationVariables = { reference, submissionType: input.type.replaceAll("_", " "), details: text };
  await notifySalesDesk({
    subject: renderTemplateText(content.emails.salesNotification.subject, notificationVariables).replace(/[\r\n]+/g, " "),
    text: renderTemplateText(content.emails.salesNotification.body, notificationVariables),
    replyTo: input.contactEmail,
  });

  if (input.customerConfirmation) {
    const orderNumber = String(input.payload["Order number"] ?? "").trim();
    const acknowledgement = orderNumber ? content.emails.returnAcknowledgement : null;
    await sendEmail({
      to: input.contactEmail,
      subject: acknowledgement ? renderTemplateText(acknowledgement.subject, { reference, orderNumber }).replace(/[\r\n]+/g, " ") : input.customerConfirmation.subject,
      replyTo: content.site.email,
      text: acknowledgement ? renderTemplateText(acknowledgement.body, { reference, orderNumber }) : [
        input.customerConfirmation.heading,
        "",
        `Your reference: ${reference}`,
        "",
        ...input.customerConfirmation.nextSteps,
        "",
        `Keep this reference when contacting us: ${reference}`,
        `${content.site.name} · ${content.site.email} · ${content.site.phoneDisplay}`,
      ].join("\n"),
    });
  }

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

// --- Credit account application ---------------------------------------------

const creditAccountSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(160),
  address: z.string().trim().min(1, "Address is required").max(1000),
  addressLine2: z.string().trim().max(1000).optional(),
  postcode: z.string().trim().min(1, "Postcode is required").max(30),
  companyType: z.enum(["Limited Company", "Sole Trader", "Partnership"], {
    errorMap: () => ({ message: "Select a company type" }),
  }),
  registrationNumber: z.string().trim().max(60).optional(),
  registeredOfficeAddress: z.string().trim().max(1000).optional(),
  telephone: z.string().trim().min(1, "Telephone is required").max(30),
  fax: z.string().trim().max(30).optional(),
  email: emailField,
  purchasingContact: z.string().trim().min(1, "Purchasing contact is required").max(160),
  accountsContact: z.string().trim().min(1, "Accounts contact is required").max(160),
  creditLimit: z.string().trim().max(40).optional(),
  tradeCompany1: z.string().trim().min(1, "First trade reference company is required").max(160),
  tradeContact1: z.string().trim().min(1, "First trade reference contact is required").max(160),
  tradeAddress1: z.string().trim().min(1, "First trade reference address is required").max(1000),
  tradePostcode1: z.string().trim().min(1, "First trade reference postcode is required").max(30),
  tradeTelephone1: z.string().trim().min(1, "First trade reference telephone is required").max(30),
  tradeEmail1: emailField,
  tradeCompany2: z.string().trim().min(1, "Second trade reference company is required").max(160),
  tradeContact2: z.string().trim().min(1, "Second trade reference contact is required").max(160),
  tradeAddress2: z.string().trim().min(1, "Second trade reference address is required").max(1000),
  tradePostcode2: z.string().trim().min(1, "Second trade reference postcode is required").max(30),
  tradeTelephone2: z.string().trim().min(1, "Second trade reference telephone is required").max(30),
  tradeEmail2: emailField,
  bankName: z.string().trim().min(1, "Bank name is required").max(160),
  bankBranch: z.string().trim().min(1, "Branch is required").max(160),
  accountNumber: z.string().trim().min(1, "Account number is required").max(40),
  sortCode: z.string().trim().min(1, "Sort code is required").max(20),
  signedName: z.string().trim().min(1, "Signed name is required").max(160),
  printedName: z.string().trim().min(1, "Printed name is required").max(160),
  position: z.string().trim().min(1, "Position is required").max(120),
  signatureDate: z.string().trim().min(1, "Date is required").max(40),
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
        Address: fields.address,
        "Address continued": fields.addressLine2,
        Postcode: fields.postcode,
        "Type of company": fields.companyType,
        "Registration number": fields.registrationNumber,
        "Registered office address": fields.registeredOfficeAddress,
        Telephone: fields.telephone,
        Fax: fields.fax,
        "Purchasing contact": fields.purchasingContact,
        "Accounts contact": fields.accountsContact,
        "Requested credit limit": fields.creditLimit,
        "Trade reference 1 company": fields.tradeCompany1,
        "Trade reference 1 contact": fields.tradeContact1,
        "Trade reference 1 address": fields.tradeAddress1,
        "Trade reference 1 postcode": fields.tradePostcode1,
        "Trade reference 1 telephone": fields.tradeTelephone1,
        "Trade reference 1 email": fields.tradeEmail1,
        "Trade reference 2 company": fields.tradeCompany2,
        "Trade reference 2 contact": fields.tradeContact2,
        "Trade reference 2 address": fields.tradeAddress2,
        "Trade reference 2 postcode": fields.tradePostcode2,
        "Trade reference 2 telephone": fields.tradeTelephone2,
        "Trade reference 2 email": fields.tradeEmail2,
        "Bank name": fields.bankName,
        Branch: fields.bankBranch,
        "Account number": fields.accountNumber,
        "Sort code": fields.sortCode,
        Signed: fields.signedName,
        "Printed name": fields.printedName,
        Position: fields.position,
        Date: fields.signatureDate,
      },
      contactEmail: fields.email,
      contactName: fields.purchasingContact,
      company: fields.company,
      emailSubject: `Credit account application: ${fields.company}`,
      emailHeading: "New credit account application",
    });
  });

// --- Return request ---------------------------------------------------------

const returnItemSchema = z.object({
  title: z.string().trim().min(1, "Enter the item name or part number").max(240),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(999),
  orderedQuantity: z.coerce.number().int().min(1).max(999).optional(),
  reason: z.enum([
    "faulty",
    "damaged",
    "incorrect",
    "not_required",
    "ordered_in_error",
    "other",
  ]),
  details: z.string().trim().max(1000).optional(),
});

const returnRequestSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required").max(80),
  contactName: z.string().trim().min(1, "Contact name is required").max(160),
  email: emailField,
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(160).optional(),
  items: z.array(returnItemSchema).min(1, "Select at least one item").max(20),
  resolution: z.enum(["refund", "replacement", "repair", "advice"]),
  collectionAddress: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(3000).optional(),
  website: honeypot,
});

const RETURN_REASON_LABELS: Record<z.infer<typeof returnItemSchema>["reason"], string> = {
  faulty: "Faulty or not working",
  damaged: "Damaged in delivery",
  incorrect: "Incorrect item received",
  not_required: "No longer required",
  ordered_in_error: "Ordered in error",
  other: "Other",
};

const RETURN_RESOLUTION_LABELS: Record<z.infer<typeof returnRequestSchema>["resolution"], string> = {
  refund: "Refund",
  replacement: "Replacement",
  repair: "Repair",
  advice: "Advice from the returns team",
};

export const submitReturnRequest = createServerFn({ method: "POST" })
  .inputValidator(returnRequestSchema)
  .handler(async ({ data }): Promise<SubmissionResult> => {
    if (!withinRateLimit("return_request")) {
      return { ok: false, error: "Too many requests. Please try again later." };
    }

    const items = data.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.title} — returning ${item.quantity}${
            item.orderedQuantity ? ` of ${item.orderedQuantity} ordered` : ""
          } — ${RETURN_REASON_LABELS[item.reason]}${item.details ? `\n   Details: ${item.details}` : ""}`,
      )
      .join("\n");

    return recordSubmission({
      type: "return_request",
      payload: {
        "Order number": data.orderNumber,
        Phone: data.phone,
        "Items being returned": items,
        "Total quantity": data.items.reduce((total, item) => total + item.quantity, 0),
        "Requested outcome": RETURN_RESOLUTION_LABELS[data.resolution],
        "Collection address": data.collectionAddress,
        Notes: data.notes,
      },
      contactEmail: data.email,
      contactName: data.contactName,
      company: data.company,
      emailSubject: `Return request: ${data.orderNumber}`,
      emailHeading: "New customer return request",
      customerConfirmation: {
        subject: `We received your return request — ${data.orderNumber}`,
        heading: "We have received your return request.",
        nextSteps: [
          "Our returns team will check the order and the items listed in your request.",
          "We will email you with approval and return instructions. Please do not send the goods until those instructions arrive.",
          "If the request is approved, later status changes made by our team will also be emailed to you.",
        ],
      },
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
  reference: z.string().trim().min(1, "Product or reference details are required").max(160),
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
const QUESTION_ATTACHMENT_MIME_TO_EXT: Record<string, string> = {
  ...PHOTO_MIME_TO_EXT,
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
};
const MAX_QUESTION_ATTACHMENT_BYTES = 10 * 1024 * 1024;

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

function hasValidQuestionAttachmentSignature(mime: string, buffer: Buffer): boolean {
  if (mime in PHOTO_MIME_TO_EXT) return hasValidImageSignature(mime, buffer);
  if (mime === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (mime === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (mime === "text/plain" || mime === "text/csv") {
    return !buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0);
  }
  if (
    mime === "application/msword" ||
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.ms-powerpoint"
  ) {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      [0x03, 0x05, 0x07].includes(buffer[2]) &&
      [0x04, 0x06, 0x08].includes(buffer[3])
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

/**
 * Store an attachment against a product-question submission. Files remain
 * outside the public web root and are only retrievable through the protected
 * admin attachment endpoint.
 */
export const uploadSupportQuestionAttachment = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }): Promise<UploadResult> => {
    if (!withinRateLimit("support_question_upload")) {
      return { ok: false, error: "Too many uploads. Please try again later." };
    }

    const reference = String(data.get("reference") ?? "").trim();
    const file = data.get("attachment");
    if (!reference) return { ok: false, error: "Missing submission reference." };
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "No attachment provided." };
    }
    const ext = QUESTION_ATTACHMENT_MIME_TO_EXT[file.type];
    if (!ext) {
      return {
        ok: false,
        error: "This file type is not supported. Use an image, PDF, Word, Excel, PowerPoint, TXT, or CSV file.",
      };
    }
    if (file.size > MAX_QUESTION_ATTACHMENT_BYTES) {
      return { ok: false, error: "Each attachment must be 10 MB or smaller." };
    }

    const db = getDb();
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.reference, reference))
      .limit(1);
    if (!submission || submission.type !== "support_question") {
      return { ok: false, error: "Product question not found." };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!hasValidQuestionAttachmentSignature(file.type, buffer)) {
        return { ok: false, error: "The attachment content does not match its file type." };
      }

      const { uploadDir } = getServerConfig();
      await mkdir(uploadDir, { recursive: true });
      const filename = `${submission.id}-${Date.now()}-${crypto.randomUUID()}${ext}`;
      const fullPath = path.join(uploadDir, filename);
      await writeFile(fullPath, buffer);
      await db.insert(attachments).values({
        submissionId: submission.id,
        filename: safeOriginalFilename(file.name, `attachment${ext}`),
        mime: file.type,
        size: file.size,
        path: fullPath,
      });
      return { ok: true };
    } catch (error) {
      console.error("[cms] Failed to store product-question attachment:", error);
      return { ok: false, error: "The attachment could not be uploaded." };
    }
  });
