import { createFileRoute } from "@tanstack/react-router";

import { loadPublishedContentBundle } from "@/lib/content/content.server";

export const Route = createFileRoute("/site.webmanifest")({
  server: { handlers: { GET: async () => {
    const { site } = await loadPublishedContentBundle();
    return Response.json({ name: site.name, short_name: site.name, start_url: "/", display: "standalone", background_color: "#f7f8f9", theme_color: "#1e2229" }, { headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "public, max-age=300" } });
  } } },
});
