import adminCss from "@/styles/admin.css?url";

/**
 * Applied before first paint so a dark-mode editor never flashes light. The
 * attribute has to be on <html> because Radix portals render onto <body>.
 */
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("cms-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-cms-theme",t)}catch(e){document.documentElement.setAttribute("data-cms-theme","light")}`;

/**
 * Head configuration shared by every CMS screen. The admin stylesheet is linked
 * here rather than imported globally so the public storefront never loads it,
 * and neither do its fonts.
 */
export function cmsHead(title: string) {
  return {
    meta: [
      { title: `${title} · Spares Automation CMS` },
      { name: "robots", content: "noindex, nofollow" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
    ],
    links: [
      { rel: "stylesheet", href: adminCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
    scripts: [{ children: THEME_BOOTSTRAP }],
  };
}
