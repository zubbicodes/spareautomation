import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/shopify/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  head: () => pageHead("Cookie Information", "How essential cookies and browser storage support cart, account, and checkout functionality.", "/cookies"),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Use of cookies"
      intro="Cookies and local browser storage support core shopping functions such as cart persistence, login state, and site operation."
      sections={[
        {
          title: "Cart storage",
          copy: "The site stores cart information locally so selected products remain available as customers continue browsing.",
        },
        {
          title: "Account and checkout",
          copy: "Shopify services may use cookies or similar technology for secure login, checkout, and order processing.",
        },
        {
          title: "Strictly necessary storage",
          copy: "The current storefront uses browser storage for the cart and security cookies for customer sessions. These functions are necessary when you ask the site to remember a cart or sign you in.",
        },
        {
          title: "Third-party video",
          copy: "YouTube content is not loaded automatically. If a product has a YouTube guide, you choose whether to load it after seeing a notice that YouTube may store or access information on your device.",
        },
        {
          title: "Future analytics or marketing tools",
          copy: "Any non-essential analytics, advertising, or personalisation storage added later must remain disabled until an appropriate consent choice is provided.",
        },
      ]}
    />
  );
}
