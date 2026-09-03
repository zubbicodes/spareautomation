import { Link } from "@tanstack/react-router";
import { ChevronRight, Mail, PackageSearch, Phone } from "lucide-react";
import { PaymentMarks } from "@/components/shopify/PaymentMarks";
import { useContent } from "@/lib/content/ContentContext";
import { navTarget } from "@/lib/content/nav";

export function SiteFooter() {
  const content = useContent();
  const informationLinks = content.navigation.information.filter((item) => item.visible);
  const helpLinks = content.navigation.help.filter((item) => item.visible);
  return (
    <footer className="border-t border-rule bg-charcoal-deep text-white/70">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr_1fr] md:px-6 lg:px-10">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rotate-45 border-2 border-accent" />
              <div className="absolute inset-[6px] rotate-45 bg-accent" />
            </div>
            <div className="font-display text-[17px] font-bold uppercase tracking-tight text-white">
              {content.site.name === "Spares Automation" ? <>SPARES<span className="text-accent">.</span>AUTOMATION</> : content.site.name}
            </div>
          </Link>
          <Link
            to="/products"
            search={{ category: "all", availability: "all", sort: "newest" }}
            className="group mt-6 flex max-w-sm items-center justify-between border border-accent/35 bg-accent/10 p-4 text-white transition-colors hover:border-accent hover:bg-accent/15"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-accent text-accent-foreground">
                <PackageSearch className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-sm font-bold uppercase tracking-tight">
                  All Products
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                  Browse full catalogue
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="mt-6 space-y-3 text-sm text-white/70">
            <a
              href={`tel:${content.site.phoneHref}`}
              className="flex min-h-8 items-center gap-3 hover:text-white"
            >
              <Phone className="h-4 w-4" />
              {content.site.phoneDisplay}
            </a>
            <a
              href={`mailto:${content.site.email}`}
              className="flex min-h-8 items-center gap-3 hover:text-white"
            >
              <Mail className="h-4 w-4" />
              {content.site.email}
            </a>
          </div>
        </div>

        <FooterColumn title="Information" links={informationLinks} />
        <FooterColumn title="Help" links={helpLinks} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6 lg:px-10">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-tight text-white">
              Payments we support
            </h2>
            <p className="mt-1 text-xs text-white/55">
              Available payment methods are confirmed at secure checkout.
            </p>
          </div>
          <PaymentMarks />
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-5 gap-y-3 md:justify-between">
          <span>{content.site.name}</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-cookie-preferences"))}
            className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
          >
            Cookie settings
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white underline decoration-2 decoration-accent underline-offset-8">
        {title}
      </h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              {...navTarget(link.to)}
              className="inline-flex min-h-8 items-center text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
