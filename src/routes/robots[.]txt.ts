import { createFileRoute } from "@tanstack/react-router";

import { loadPublishedContentBundle } from "@/lib/content/content.server";

export const Route = createFileRoute("/robots.txt")({
  server: { handlers: { GET: async () => {
    const { site } = await loadPublishedContentBundle();
    const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /account", "Disallow: /auth/", "Disallow: /cart", "Disallow: /login", "Disallow: /register", "Disallow: /search", "", `Sitemap: ${site.url.replace(/\/$/, "")}/sitemap.xml`, ""].join("\n");
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  } } },
});
