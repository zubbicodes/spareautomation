import { readFile } from "node:fs/promises";

import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { getCurrentStaff } from "@/lib/admin/auth.server";
import { getDb } from "@/lib/db/index.server";
import { contentMedia } from "@/lib/db/schema";
import { getContentMediaRoot, isPathInside } from "@/lib/content/media-storage.server";

export const Route = createFileRoute("/content-media/$id/$filename")({
  server: { handlers: { GET: async ({ params, request }) => {
    const [media] = await getDb().select().from(contentMedia).where(eq(contentMedia.id, params.id)).limit(1);
    if (!media || media.isArchived) return new Response("Not found", { status: 404 });
    if (!media.isPublished && !await getCurrentStaff()) return new Response("Not found", { status: 404 });
    if (params.filename !== media.filename) return Response.redirect(new URL(`/content-media/${media.id}/${encodeURIComponent(media.filename)}`, request.url), 308);
    if (!isPathInside(getContentMediaRoot(), media.path)) return new Response("Not found", { status: 404 });
    try { const data = await readFile(media.path); return new Response(data, { headers: { "content-type": media.mime, "content-length": String(data.length), "cache-control": media.isPublished ? "public, max-age=31536000, immutable" : "private, no-store", "x-content-type-options": "nosniff" } }); } catch { return new Response("Not found", { status: 404 }); }
  } } },
});
