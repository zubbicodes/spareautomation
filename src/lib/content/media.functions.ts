import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";

import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { writeAdminAudit } from "../admin/audit.server";
import { requireAdminRole, requireStaff } from "../admin/auth.server";
import { getDb } from "../db/index.server";
import { contentMedia } from "../db/schema";
import { isMediaReferenced } from "./content.server";
import { buildContentMediaPath, getContentMediaRoot, isPathInside } from "./media-storage.server";

export const MAX_CONTENT_MEDIA_BYTES = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function hasContentImageSignature(mime: string, buffer: Buffer) {
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function safeFilename(value: string, extension: string) {
  const basename = value.replaceAll("\\", "/").split("/").at(-1) ?? "image";
  const stem = basename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "image";
  return `${stem}${extension}`;
}

export const listMedia = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const rows = await getDb().select().from(contentMedia).orderBy(desc(contentMedia.createdAt));
  return rows.map(({ path: _path, ...row }) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    url: `/content-media/${row.id}/${encodeURIComponent(row.filename)}`,
  }));
});

export const uploadMedia = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    const file = data.get("file");
    const defaultAlt = String(data.get("defaultAlt") ?? "").trim();
    if (!(file instanceof File) || !file.size) return { ok: false as const, error: "Choose an image." };
    if (!defaultAlt || defaultAlt.length > 300) return { ok: false as const, error: "Provide default alt text (maximum 300 characters)." };
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) return { ok: false as const, error: "Only JPEG, PNG and WebP images are allowed." };
    if (file.size > MAX_CONTENT_MEDIA_BYTES) return { ok: false as const, error: "Images must be 10 MB or smaller." };
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasContentImageSignature(file.type, buffer)) return { ok: false as const, error: "The image content does not match its file type." };

    const id = randomUUID().replaceAll("-", "");
    const { root, candidate: storagePath } = buildContentMediaPath(id, extension);
    await mkdir(root, { recursive: true });
    const filename = safeFilename(file.name, extension);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(storagePath, buffer, { flag: "wx" });
    try {
      await getDb().insert(contentMedia).values({
        id, filename, mime: file.type, size: file.size, path: storagePath,
        defaultAlt, createdBy: staff.id,
      });
      await writeAdminAudit(getDb() as never, {
        staffId: staff.id, action: "media.uploaded", targetType: "media", targetId: id,
        details: { filename, mime: file.type, size: file.size },
      });
    } catch (error) {
      await unlink(storagePath).catch(() => undefined);
      throw error;
    }
    return { ok: true as const, id, filename };
  });

const mediaIdSchema = z.object({ id: z.string().regex(/^[a-f0-9]{32}$/) });

export const archiveMedia = createServerFn({ method: "POST" })
  .inputValidator(mediaIdSchema)
  .handler(async ({ data }) => {
    const staff = await requireAdminRole();
    if (await isMediaReferenced(data.id)) return { ok: false as const, error: "This image is referenced by draft or published content." };
    await getDb().update(contentMedia).set({ isArchived: true, updatedAt: sql`now()` }).where(eq(contentMedia.id, data.id));
    await writeAdminAudit(getDb() as never, { staffId: staff.id, action: "media.archived", targetType: "media", targetId: data.id });
    return { ok: true as const };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .inputValidator(mediaIdSchema)
  .handler(async ({ data }) => {
    const staff = await requireAdminRole();
    if (await isMediaReferenced(data.id)) return { ok: false as const, error: "This image is referenced by draft or published content." };
    const [row] = await getDb().select().from(contentMedia).where(eq(contentMedia.id, data.id)).limit(1);
    if (!row) return { ok: false as const, error: "Image not found." };
    const root = getContentMediaRoot();
    if (!isPathInside(root, row.path)) throw new Error("Unsafe stored media path");
    await unlink(row.path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    await getDb().delete(contentMedia).where(eq(contentMedia.id, data.id));
    await writeAdminAudit(getDb() as never, { staffId: staff.id, action: "media.deleted", targetType: "media", targetId: data.id });
    return { ok: true as const };
  });
