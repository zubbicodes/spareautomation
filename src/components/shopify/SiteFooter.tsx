import { Link } from "@tanstack/react-router";
import { ChevronRight, Mail, PackageSearch, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

const informationLinks = [
  { label: "All Products", to: "/products" },
  { label: "Contact us", to: "/contact-us" },
  { label: "About us", to: "/about-us" },
  { label: "View Cart", to: "/cart" },
  { label: "Open trade account", to: "/trade-account" },
  { label: "Track order", to: "/track-order" },
  { label: "My order history", to: "/account" },
  { label: "Got a question", to: "/got-a-question" },
];

const helpLinks = [
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
  { label: "Returns Policy", to: "/returns-policy" },
  { label: "Delivery Information", to: "/delivery-information" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Use of Cookies", to: "/cookies" },
  { label: "Disclaimer", to: "/disclaimer" },
  { label: "Unsubscribe", to: "/unsubscribe" },
];

export function SiteFooter() {
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
              SPARES<span className="text-accent">.</span>AUTOMATION
            </div>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Trade catalogue, quote support, and parts help for machinery teams.
          </p>
          <Link
            to="/products"
            search={{ category: "all", q: "", availability: "all", sort: "newest" }}
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
            <a href={`tel:${SITE.phoneHref}`} className="flex min-h-8 items-center gap-3 hover:text-white">
              <Phone className="h-4 w-4" />
              {SITE.phoneDisplay}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="flex min-h-8 items-center gap-3 hover:text-white"
            >
              <Mail className="h-4 w-4" />
              {SITE.email}
            </a>
          </div>
        </div>

        <FooterColumn title="Information" links={informationLinks} />
        <FooterColumn title="Help" links={helpLinks} />
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
        Spares Automation
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return (
    <div>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="inline-flex min-h-8 items-center text-sm text-white/70 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
