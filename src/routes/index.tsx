import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, FileText, Mail, MessageSquare, Paperclip, PlayCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import asphalt from "@/assets/asphalt-plant.jpg";
import concrete from "@/assets/concrete-plant.jpg";
import catAutomation from "@/assets/cat-automation.jpg";
import catHome from "@/assets/cat-home.jpg";
import catPacking from "@/assets/cat-packing.jpg";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { submitPartInquiry, uploadPartInquiryPhoto } from "@/lib/api/cms.functions";
import { useHydrated } from "@/hooks/use-hydrated";
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
      { label: "Feeders", meta: "Belts / Idlers / Drives", href: "/asphalt?line=feeders" },
      { label: "Burner / Drying", meta: "Nozzles / Fuel pumps", href: "/asphalt?line=burner-drying" },
      { label: "Bitumen", meta: "Pumps / Valves / Hoses", href: "/asphalt?line=bitumen" },
      { label: "Hot Stone / Silos", meta: "Hot bins / Storage", href: "/asphalt?line=hot-stone-silos" },
      { label: "Baghouse", meta: "Filters / Bags / Dust", href: "/asphalt?line=baghouse" },
      { label: "Mixing Tower", meta: "Flights / Liners / Seals", href: "/asphalt?line=mixing-tower" },
    ],
  },
  {
    title: "Ready-Mix / Concrete Spares",
    img: concrete,
    to: "/concrete",
    accent: "amber",
    lines: [
      { label: "Aggregate Feeding", meta: "Hoppers / Belts / Conveyors", href: "/concrete?line=aggregate-feeding" },
      { label: "Cement / Material Silos", meta: "Filters / Aerators / Valves", href: "/concrete?line=cement-material-silos" },
      { label: "Additive System", meta: "Admixture / Chemical / Dosing", href: "/concrete?line=additive-system" },
      { label: "Water Controls", meta: "Meters / Pumps / Flow Valves", href: "/concrete?line=water-controls" },
      { label: "Air Controls", meta: "Pneumatics / Compressors / Actuators", href: "/concrete?line=air-controls" },
      { label: "Automation Controls", meta: "PLCs / Sensors / Panels", href: "/concrete?line=automation-controls" },
    ],
  },
];

const categories = [
  // Replacement photos should be landscape, 4:3 or 16:10, minimum 1200px wide.
  { title: "Packing Machinery", img: catPacking, to: "/packing" },
  { title: "Automation & Drives", img: catAutomation, to: "/automation" },
  { title: "Home Automation and Controls", img: catHome, to: "/home-controls" },
  { title: "Control Panels & Software", img: catAutomation, to: "/control-panels-software" },
];

function HeroTitle({ title, accent }: { title: string; accent: "accent" | "amber" }) {
  const baseTitle = title.replace(/ Spares$/, "");

  return (
    <>
      {baseTitle}{" "}
      <span className={accent === "amber" ? "text-amber" : "text-accent"}>Spares</span>
    </>
  );
}

function Home() {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [photoError, setPhotoError] = useState("");

  async function submitPartRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = data.get("photo");
    setBusy(true);
    setError("");
    setPhotoError("");
    try {
      const result = await submitPartInquiry({
        data: {
          partNumber: String(data.get("partNumber") ?? ""),
          description: String(data.get("description") ?? ""),
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          website: String(data.get("website") ?? ""),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (photo instanceof File && photo.size > 0) {
        const uploadData = new FormData();
        uploadData.set("reference", result.reference);
        uploadData.set("photo", photo);
        const upload = await uploadPartInquiryPhoto({ data: uploadData });
        if (!upload.ok) {
          setPhotoError(upload.error ?? "The photo could not be uploaded.");
        }
      }
      setReference(result.reference);
      form.reset();
    } catch {
      setError("We could not send your request. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main id="main-content">
      <h1 className="sr-only">Industrial parts and automation spares</h1>
      <section className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2">
        {primaryRanges.map((range, index) => (
          <article
            key={range.title}
            className="hero-range group relative flex min-h-[390px] items-stretch overflow-hidden border-b border-rule md:min-h-[460px]"
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
            <div className="absolute inset-0 bg-charcoal-deep/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/55 to-charcoal-deep/10" />

            <div className="relative z-10 flex min-h-[390px] min-w-0 w-full flex-col justify-end gap-4 p-4 md:min-h-[460px] md:gap-6 md:p-8 lg:p-10">
              <div className="hero-range-title flex min-w-0 flex-col justify-end transition-all duration-500">
                <Link to={range.to} className="block max-w-xl focus-visible:outline-white">
                  <h2 className="break-words font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-white">
                    <HeroTitle title={range.title} accent={range.accent as "accent" | "amber"} />
                  </h2>
                </Link>
              </div>

              <div className="hero-range-panel z-20 overflow-hidden border border-white/25 bg-charcoal-deep/92 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-500 md:absolute md:inset-x-8 md:inset-y-8 md:flex md:flex-col md:bg-charcoal-deep/70 md:shadow-none md:backdrop-blur-sm lg:inset-x-10">
                <div className="grid min-h-0 grid-cols-2 gap-1 p-2 md:grid-rows-3 md:gap-1.5 md:p-2.5">
                  {range.lines.map((line) => (
                    <a
                      key={line.label}
                      href={line.href}
                      className={`group/item grid min-h-[62px] grid-cols-[1fr_auto] items-center border border-white/12 bg-charcoal-deep/72 px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-colors md:min-h-[64px] md:px-4 ${
                        range.accent === "amber"
                          ? "hover:border-amber hover:bg-amber/10 focus-visible:border-amber"
                          : "hover:border-accent hover:bg-accent/15 focus-visible:border-accent"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-bold leading-tight text-white">
                          {line.label}
                        </span>
                        <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
                          {line.meta}
                        </span>
                      </span>
                      <ChevronRight
                        className={`ml-3 h-3 w-3 shrink-0 transition-transform group-hover/item:translate-x-0.5 ${
                          range.accent === "amber" ? "text-amber" : "text-accent"
                        }`}
                      />
                    </a>
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  data-testid={`hero-hover-title-${index}`}
                  className="hidden flex-1 items-end border-t border-white/15 bg-gradient-to-t from-charcoal-deep/90 to-transparent px-6 py-6 md:flex lg:px-8 lg:py-7"
                >
                  <div className="max-w-xl font-display text-[clamp(2rem,3.2vw,3rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-white">
                    <HeroTitle title={range.title} accent={range.accent as "accent" | "amber"} />
                  </div>
                </div>
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

      <section className="border-b border-rule bg-charcoal-deep py-10 md:py-14">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-10">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white md:text-3xl">
              Need help finding a part?
            </h2>
            <p className="mx-auto mt-2 max-w-4xl font-display text-lg font-bold uppercase tracking-tight text-white/85 md:text-2xl">
              Send a part number or product description.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            {reference ? (
              <div role="status" className="border border-accent/40 bg-accent/10 p-6 text-sm leading-6 text-white">
                <CheckCircle2 aria-hidden="true" className="mr-2 inline h-5 w-5 text-accent" />
                Thank you. Your part request has been received and our reference is{" "}
                <strong className="font-semibold">{reference}</strong>. The sales desk will reply by
                email shortly.
                {photoError ? (
                  <span className="mt-2 block text-red-200">Note: {photoError}</span>
                ) : null}
              </div>
            ) : (
            <form
              method="post"
              onSubmit={submitPartRequest}
              className="relative space-y-5 border border-white/10 bg-white/[0.035] p-4 sm:p-5 md:p-6"
            >
              <label className="absolute -left-[9999px]" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="part-name" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                      Your name
                    </label>
                    <input
                      id="part-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Full name"
                      className="h-12 w-full border border-white/20 bg-white/10 px-4 text-sm text-white transition-colors placeholder:text-white/40 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="part-email" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                      Email
                    </label>
                    <input
                      id="part-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@company.co.uk"
                      className="h-12 w-full border border-white/20 bg-white/10 px-4 text-sm text-white transition-colors placeholder:text-white/40 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="part-number" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                    Part Number
                  </label>
                  <input
                    id="part-number"
                    name="partNumber"
                    type="text"
                    required
                    placeholder="Enter part number here..."
                    className="h-12 w-full border border-white/20 bg-white/10 px-4 text-sm text-white transition-colors placeholder:text-white/40 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="part-description" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                    Description
                  </label>
                  <textarea
                    id="part-description"
                    name="description"
                    rows={3}
                    placeholder="Describe the part you need..."
                    className="w-full resize-y border border-white/20 bg-white/10 px-4 py-3 text-sm text-white transition-colors placeholder:text-white/40 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="part-photo" className="font-mono text-xs uppercase tracking-[0.2em] text-white/75 block mb-2">
                    Photo (optional)
                  </label>
                  <div className="flex items-center gap-3 border border-white/20 bg-white/10 px-4 py-3">
                    <Paperclip aria-hidden="true" className="h-4 w-4 shrink-0 text-white/50" />
                    <input
                      id="part-photo"
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="w-full text-sm text-white/80 file:mr-3 file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-bold file:uppercase file:tracking-[0.14em] file:text-white"
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/45">JPG, PNG or WebP, up to 8 MB.</p>
                </div>
              </div>
              {error ? (
                <div role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm leading-6 text-red-200">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={busy || !hydrated}
                className="flex h-11 w-full items-center justify-center gap-2 bg-accent px-5 text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Send className="h-4 w-4" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                  {busy ? "Sending" : "Submit Request"}
                </span>
              </button>
            </form>
            )}

            <div className="border border-white/10 bg-white/[0.035] p-4 sm:p-5 md:p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                Other contact options
              </div>
              <h3 className="mt-2 font-display text-lg font-bold text-white">
                Contact the sales desk directly
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Email for detailed enquiries or use WhatsApp when you need to send a product photo.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex h-11 items-center justify-center gap-2 border border-accent bg-accent px-4 text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                    Email sales
                  </span>
                </a>
                <a
                  href={whatsappHref("Hello Spares Automation, I need help identifying a part.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 border border-[#25D366] bg-[#25D366] px-4 text-charcoal-deep transition-colors hover:bg-[#25D366]/85"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                    WhatsApp
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
