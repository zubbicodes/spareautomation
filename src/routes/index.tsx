import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Mail, MessageSquare, PlayCircle, Send } from "lucide-react";
import { useState } from "react";

import asphalt from "@/assets/asphalt-plant.jpg";
import concrete from "@/assets/concrete-plant.jpg";
import catAutomation from "@/assets/cat-automation.jpg";
import catHome from "@/assets/cat-home.jpg";
import catPacking from "@/assets/cat-packing.jpg";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SITE, whatsappHref } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spares Automation - Industrial Parts & Automation Spares" },
      {
        name: "description",
        content: "Browse product ranges, request quotes, and find support from Spares Automation.",
      },
      { property: "og:title", content: "Spares Automation" },
      { property: "og:description", content: "Industrial parts and automation support." },
    ],
    links: [{ rel: "canonical", href: SITE.url }],
  }),
  component: Home,
});

const primaryRanges = [
  {
    title: "Asphalt / Blacktop Spares",
    img: asphalt,
    to: "/asphalt",
    accent: "accent",
    lines: [
      { label: "Feeders", href: "/asphalt?line=feeders" },
      { label: "Burner / Drying", href: "/asphalt?line=burner-drying" },
      { label: "Bitumen", href: "/asphalt?line=bitumen" },
      { label: "Hot Stone / Silos", href: "/asphalt?line=hot-stone-silos" },
      { label: "Baghouse", href: "/asphalt?line=baghouse" },
      { label: "Mixing Tower", href: "/asphalt?line=mixing-tower" },
    ],
  },
  {
    title: "Ready-Mix / Concrete Spares",
    img: concrete,
    to: "/concrete",
    accent: "amber",
    lines: [
      { label: "Aggregate Feeding", href: "/concrete?line=aggregate-feeding" },
      { label: "Cement / Material silos", href: "/concrete?line=cement-material-silos" },
      { label: "Additive system", href: "/concrete?line=additive-system" },
      { label: "Water controls", href: "/concrete?line=water-controls" },
      { label: "Air controls", href: "/concrete?line=air-controls" },
      { label: "Automation controls", href: "/concrete?line=automation-controls" },
    ],
  },
];

const categories = [
  // Replacement photos should be landscape, 4:3 or 16:10, minimum 1200px wide.
  { title: "Packing Machinery", img: catPacking, to: "/packing" },
  { title: "Automation & Drives", img: catAutomation, to: "/automation" },
  { title: "Home Controls", img: catHome, to: "/home-controls" },
  { title: "New Arrivals", img: catAutomation, to: "/new-arrivals" },
];

function Home() {
  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main id="main-content">
      <h1 className="sr-only">Industrial parts and automation spares</h1>
      <section className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2">
        {primaryRanges.map((range, index) => (
          <article
            key={range.title}
            className="group relative flex min-h-[390px] items-end overflow-hidden border-b border-rule md:min-h-[560px]"
          >
            <img
              src={range.img}
              alt=""
              aria-hidden="true"
              width={1600}
              height={1000}
              fetchPriority={index === 0 ? "high" : "auto"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/70 to-charcoal-deep/20" />

            <div className="relative z-10 flex min-h-[390px] min-w-0 w-full flex-col justify-end p-6 transition-all duration-500 md:min-h-[560px] md:p-10">
              <Link to={range.to} className="block max-w-2xl focus-visible:outline-white">
                <h2 className="break-words font-display text-[clamp(1.75rem,7.7vw,4.3rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-white">
                  {range.title}
                </h2>
              </Link>
              <div className="mt-7 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                {range.lines.map((line) => (
                  <a
                    key={line.label}
                    href={line.href}
                    className={`flex min-h-10 items-center justify-between border bg-charcoal-deep/70 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors ${
                      range.accent === "amber"
                        ? "border-white/10 hover:border-amber"
                        : "border-white/10 hover:border-accent"
                    }`}
                  >
                    <span className="truncate">{line.label}</span>
                    <ChevronRight
                      className={`ml-3 h-3.5 w-3.5 shrink-0 ${
                        range.accent === "amber" ? "text-amber" : "text-accent"
                      }`}
                    />
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.title}
            to={category.to}
            className="group flex min-h-[360px] flex-col border-b border-rule bg-surface lg:border-l"
          >
            <div className="relative flex-1 overflow-hidden bg-[oklch(0.96_0.005_250)]">
              <img
                src={category.img}
                alt=""
                aria-hidden="true"
                width={1200}
                height={900}
                loading="lazy"
                className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between border-t border-rule px-5 py-5 transition-colors group-hover:bg-charcoal-deep group-hover:text-white">
              <div>
                <h2 className="font-display text-[15px] font-bold uppercase tracking-tight">
                  {category.title}
                </h2>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent" />
            </div>
          </Link>
        ))}
      </section>

      <section className="border-b border-rule bg-surface py-10">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 px-4 md:grid-cols-2 md:px-6 lg:px-10">
          <Link
            to="/resources"
            className="group flex items-center justify-between border border-rule bg-background p-5 transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-lg font-bold uppercase tracking-tight">
                  PDFs & Manuals
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  Request datasheets, guides, and technical documents.
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/resources"
            className="group flex items-center justify-between border border-rule bg-background p-5 transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center bg-charcoal-deep text-accent">
                <PlayCircle className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-lg font-bold uppercase tracking-tight">
                  Videos
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  Find product setup help and plant support videos.
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="border-b border-rule bg-charcoal-deep py-14 md:py-16">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-10">
          <div className="text-center mb-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/60">
              Need help finding a part?
            </div>
            <h2 className="mx-auto mt-4 max-w-4xl font-display text-2xl font-extrabold uppercase tracking-tight text-white md:text-4xl">
              Send a part number, product photo, or cart details.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Handle form submission here - e.g., send to email, API, etc.
                const mailtoLink = `mailto:${SITE.email}?subject=Part Request: ${encodeURIComponent(partNumber)}&body=${encodeURIComponent(`Part Number: ${partNumber}\n\nDescription: ${description}`)}`;
                window.location.href = mailtoLink;
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="part-number" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                    Part Number
                  </label>
                  <input
                    id="part-number"
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    required
                    placeholder="Enter part number here..."
                    className="w-full h-14 px-5 border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="part-description" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                    Description
                  </label>
                  <textarea
                    id="part-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the part you need..."
                    className="w-full px-5 py-4 border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-7 py-5 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <Send className="h-5 w-5" />
                <span className="font-mono text-sm uppercase tracking-[0.2em] font-bold">
                  Submit Request
                </span>
              </button>
            </form>

            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                Or contact us directly
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <a
                  href={`mailto:${SITE.email}`}
                  className="relative flex items-center justify-center px-16 py-5 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <Mail className="absolute left-7 h-6 w-6" />
                  <span className="text-center font-mono text-sm uppercase tracking-[0.2em] font-bold">
                    Contact via Email
                  </span>
                </a>
                <a
                  href={whatsappHref("Hello Spares Automation, I need help identifying a part.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center justify-center bg-[#25D366] px-16 py-5 text-charcoal-deep transition-colors hover:bg-[#25D366]/85"
                >
                  <MessageSquare className="absolute left-7 h-6 w-6" />
                  <span className="text-center font-mono text-sm uppercase tracking-[0.2em] font-bold">
                    Contact via WhatsApp
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      <SiteFooter />
    </div>
  );
}
