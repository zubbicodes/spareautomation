import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAdminRole, requireStaff } from "../admin/auth.server";
import {
  ContentConflictError,
  listContentDocuments,
  listContentRevisions,
  loadContentDocument,
  loadPublishedContentBundle,
  publishContentDraft,
  restoreContentRevision,
  saveContentDraft,
} from "./content.server";
import { isContentKey, type ContentKey } from "./registry";

const keySchema = z.string().refine(isContentKey, "Unknown content document");

export const getPublishedContent = createServerFn({ method: "GET" }).handler(
  loadPublishedContentBundle,
);

export const getContentIndex = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  return listContentDocuments();
});

export const getContentEditor = createServerFn({ method: "GET" })
  .inputValidator(z.object({ key: keySchema }))
  .handler(async ({ data }) => {
    await requireStaff();
    const key = data.key as ContentKey;
    const [document, revisions, previewContent] = await Promise.all([
      loadContentDocument(key),
      listContentRevisions(key),
      loadPublishedContentBundle(),
    ]);
    previewContent[key] = document.draftData as never;
    return {
      document,
      previewContent,
      revisions: revisions.map((revision) => ({
        ...revision,
        createdAt: revision.createdAt.toISOString(),
      })),
    };
  });

export const saveDraft = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    key: keySchema,
    data: z.unknown(),
    version: z.number().int().positive(),
  }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    try {
      const version = await saveContentDraft(
        data.key as ContentKey, data.data, data.version, staff.id,
      );
      return { ok: true as const, version };
    } catch (error) {
      if (error instanceof ContentConflictError) {
        return { ok: false as const, conflict: true as const, error: "This document changed since you opened it. Reload before saving." };
      }
      if (error instanceof z.ZodError) {
        return { ok: false as const, error: "Content validation failed.", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
      }
      throw error;
    }
  });

export const publishDraft = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: keySchema }))
  .handler(async ({ data }) => {
    const staff = await requireAdminRole();
    try {
      return { ok: true as const, version: await publishContentDraft(data.key as ContentKey, staff.id) };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { ok: false as const, error: "The draft is not valid and cannot be published.", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
      }
      throw error;
    }
  });

export const restoreRevision = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: keySchema, revisionId: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const staff = await requireAdminRole();
    const version = await restoreContentRevision(data.key as ContentKey, data.revisionId, staff.id);
    return { ok: true as const, version };
  });
