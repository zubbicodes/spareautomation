import adminCss from "@/styles/admin.css?url";

/**
 * Head configuration shared by every CMS screen. The admin stylesheet is linked
 * here rather than imported globally so the public storefront never loads it.
 */
export function cmsHead(title: string) {
  return {
    meta: [
      { title: `${title} · Spares Automation CMS` },
      { name: "robots", content: "noindex, nofollow" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [{ rel: "stylesheet", href: adminCss }],
  };
}
