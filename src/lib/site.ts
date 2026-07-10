export const SITE = {
  name: "Spares Automation",
  url: "https://spares-automation.co.uk",
  email: "trade@spares-automation.co.uk",
  phoneDisplay: "+44 (0)161 818 7420",
  phoneHref: "+441618187420",
  whatsapp: "441618187420",
  location: "Manchester, United Kingdom",
  hours: "Monday to Friday, 07:30-18:00 GMT",
} as const;

export function emailHref(subject?: string, body?: string) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${SITE.email}${query ? `?${query}` : ""}`;
}

export function whatsappHref(message?: string) {
  return `https://wa.me/${SITE.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
