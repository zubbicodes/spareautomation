import { createFileRoute } from "@tanstack/react-router";

import { loadPublishedContentBundle } from "@/lib/content/content.server";

const ROUTES = ["/", "/products", "/asphalt", "/concrete", "/packing", "/automation", "/home-controls", "/control-panels-software", "/resources", "/about-us", "/contact-us", "/terms-and-conditions", "/returns", "/returns-policy", "/delivery-information", "/privacy-policy", "/cookies"] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: async () => {
    const { site } = await loadPublishedContentBundle();
    const base = site.url.replace(/\/$/, "").replaceAll("&", "&amp;");
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROUTES.map((route) => `  <url><loc>${base}${route}</loc></url>`).join("\n")}\n</urlset>\n`;
    return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  } } },
});
