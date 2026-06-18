import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronRight,
  Mail,
  MapPin,
  Linkedin,
  Youtube,
  Twitter,
  ShieldCheck,
  Truck,
  Factory,
  CreditCard,
} from "lucide-react";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import asphalt from "@/assets/asphalt-plant.jpg";
import concrete from "@/assets/concrete-plant.jpg";
import catConcrete from "@/assets/cat-concrete.jpg";
import catPacking from "@/assets/cat-packing.jpg";
import catAutomation from "@/assets/cat-automation.jpg";
import catHome from "@/assets/cat-home.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spares Automation — Industrial Parts & Automation Spares" },
      {
        name: "description",
        content:
          "B2B procurement for asphalt, concrete, packing and automation spares. Search by part or manufacturer number.",
      },
      { property: "og:title", content: "Spares Automation" },
      { property: "og:description", content: "Industrial parts procurement platform." },
    ],
  }),
  component: Home,
});

const asphaltSubs = [
  { code: "AS-01", t: "Feeder System", c: "Belts · Idlers · Drives", skus: "4,210" },
  { code: "AS-02", t: "Burner / Dryer", c: "Nozzles · Fuel pumps", skus: "1,860" },
  { code: "AS-03", t: "Mixing Tower", c: "Paddles · Liners · Seals", skus: "920" },
  { code: "AS-04", t: "Baghouse", c: "Filters · Bags · Cages", skus: "2,540" },
  { code: "AS-05", t: "Bitumen", c: "Pumps · Valves · Hoses", skus: "3,120" },
  { code: "AS-06", t: "Hot Storage / Silo Systems", c: "Hot bins · Gates · Insulation", skus: "5,470" },
];

const concreteSubs = [
  { code: "CN-01", t: "Batching Plants", c: "Skips · Hoppers · Weighers", skus: "3,840" },
  { code: "CN-02", t: "Twin-Shaft Mixers", c: "Paddles · Liners · Shafts", skus: "2,160" },
  { code: "CN-03", t: "Cement Silos", c: "Filters · Aerators · Valves", skus: "1,420" },
  { code: "CN-04", t: "Weighing Systems", c: "Load cells · Indicators", skus: "980" },
  { code: "CN-05", t: "Pneumatic Valves", c: "Butterfly · Pinch · Knife", skus: "2,610" },
  { code: "CN-06", t: "PLC Controllers", c: "Siemens · Allen-Bradley", skus: "1,750" },
];

const categories = [
  { n: "01", t: "Concrete Product Machines", c: "Mixers · Pumps · Vibrators", img: catConcrete, to: "/concrete" },
  { n: "02", t: "Packing Machines", c: "Sealers · Rollers · Bearings", img: catPacking, to: "/packing" },
  { n: "03", t: "Automation & Drives", c: "VFDs · Servos · PLCs", img: catAutomation, to: "/automation" },
  { n: "04", t: "Home Controls", c: "Modules · Sensors · Relays", img: catHome, to: "/home-controls" },
];

function Home() {
  const [hover, setHover] = useState<"asphalt" | "concrete" | null>("asphalt");
  const [activeA, setActiveA] = useState(0);
  const [activeC, setActiveC] = useState(0);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      {/* ===== HERO 2-COLUMN SPLIT ===== */}
      <section className="grid w-full grid-cols-1 md:grid-cols-2">
        {/* Asphalt block */}
        <div 
          onMouseEnter={() => setHover("asphalt")}
          onMouseLeave={() => setHover(null)}
          className="group relative h-[50vh] md:h-[70vh] min-h-[400px] overflow-hidden text-left"
        >
          <img
            src={asphalt}
            alt="Industrial asphalt plant"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.08] group-hover:blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-deep/85 via-charcoal-deep/55 to-charcoal-deep/20 transition-opacity duration-700 group-hover:from-charcoal-deep/95 group-hover:via-charcoal-deep/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/70 to-transparent transition-opacity duration-700 group-hover:from-charcoal-deep/90" />

          {/* Index marker */}
          <div className="absolute left-4 md:left-10 top-4 md:top-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 transition-all duration-700 group-hover:opacity-0 group-hover:blur-md">
            <span className="h-px w-8 bg-accent" />
            Vertical 01 / Bituminous
          </div>

          {/* Title - Main Link */}
          <Link to="/asphalt" className="absolute bottom-0 left-0 right-0 p-6 md:p-10 transition-all duration-700 group-hover:opacity-0 group-hover:blur-xl block z-10">
            <h2 className="font-display text-[clamp(1.75rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white">
              ASPHALT /<br />BLACKTOP <span className="text-accent">SPARES</span>
            </h2>
            <div className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70">
              Browse Sub-Categories
              <ChevronRight className="h-3.5 w-3.5 text-accent transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Interactive sub-category panel */}
          <div
            className={`pointer-events-none absolute inset-x-4 md:inset-x-6 bottom-4 md:bottom-6 top-24 flex flex-col transition-all duration-500 ease-out z-20 ${
              hover === "asphalt" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="pointer-events-auto flex items-center justify-between border-b border-white/15 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
                Sub-Categories · 06
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                {asphaltSubs[activeA].code} · {asphaltSubs[activeA].skus} SKUs
              </span>
            </div>
            <div className="pointer-events-auto mt-4 grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2 content-start">
              {asphaltSubs.map((s, i) => (
                <Link
                  key={s.code}
                  to="/asphalt"
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setActiveA(i);
                  }}
                  style={{ transitionDelay: hover === "asphalt" ? `${i * 40}ms` : "0ms" }}
                  className={`group/item relative flex flex-col justify-between overflow-hidden border bg-charcoal-deep/70 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${
                    activeA === i
                      ? "border-accent bg-accent/15"
                      : "border-white/10 hover:border-accent/60"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-[3px] transition-all ${
                      activeA === i ? "bg-accent" : "bg-transparent"
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/45">
                      {s.code}
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-all ${
                        activeA === i ? "translate-x-0.5 text-accent" : "text-white/30"
                      }`}
                    />
                  </div>
                  <div className="mt-3">
                    <div className="font-display text-[14px] font-bold leading-tight text-white">
                      {s.t}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                      {s.c}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Concrete block */}
        <div 
          onMouseEnter={() => setHover("concrete")}
          onMouseLeave={() => setHover(null)}
          className="group relative h-[50vh] md:h-[70vh] min-h-[400px] overflow-hidden text-left"
        >
          <img
            src={concrete}
            alt="Ready-mix concrete plant"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.08] group-hover:blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-charcoal-deep/85 via-charcoal-deep/55 to-charcoal-deep/20 transition-opacity duration-700 group-hover:from-charcoal-deep/95 group-hover:via-charcoal-deep/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/70 to-transparent transition-opacity duration-700 group-hover:from-charcoal-deep/90" />

          <div className="absolute right-4 md:right-10 top-4 md:top-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 transition-all duration-700 group-hover:opacity-0 group-hover:blur-md">
            Vertical 02 / Cementitious
            <span className="h-px w-8 bg-amber" />
          </div>

          <Link to="/concrete" className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-right transition-all duration-700 group-hover:opacity-0 group-hover:blur-xl block z-10">
            <h2 className="font-display text-[clamp(1.75rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white">
              READY-MIX /<br />CONCRETE <span className="text-amber">SPARES</span>
            </h2>
            <div className="mt-6 flex items-center justify-end gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70">
              Browse Sub-Categories
              <ChevronRight className="h-3.5 w-3.5 text-amber transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <div
            className={`pointer-events-none absolute inset-x-4 md:inset-x-6 bottom-4 md:bottom-6 top-24 flex flex-col transition-all duration-500 ease-out z-20 ${
              hover === "concrete" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="pointer-events-auto flex items-center justify-between border-b border-white/15 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">
                {concreteSubs[activeC].code} · {concreteSubs[activeC].skus} SKUs
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
                Sub-Categories · 06
              </span>
            </div>
            <div className="pointer-events-auto mt-4 grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2 content-start">
              {concreteSubs.map((s, i) => (
                <Link
                  key={s.code}
                  to="/concrete"
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setActiveC(i);
                  }}
                  style={{ transitionDelay: hover === "concrete" ? `${i * 40}ms` : "0ms" }}
                  className={`group/item relative flex flex-col justify-between overflow-hidden border bg-charcoal-deep/70 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${
                    activeC === i
                      ? "border-amber bg-amber/15"
                      : "border-white/10 hover:border-amber/60"
                  }`}
                >
                  <span
                    className={`absolute right-0 top-0 h-full w-[3px] transition-all ${
                      activeC === i ? "bg-amber" : "bg-transparent"
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-all ${
                        activeC === i ? "translate-x-0.5 text-amber" : "text-white/30"
                      }`}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/45">
                      {s.code}
                    </span>
                  </div>
                  <div className="mt-3 text-right">
                    <div className="font-display text-[14px] font-bold leading-tight text-white">
                      {s.t}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                      {s.c}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4-COLUMN COLLECTION GRID ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.t}
            to={cat.to}
            className={`group relative flex aspect-square flex-col border-rule bg-surface ${
              i !== 0 ? "border-l" : ""
            } border-b`}
          >
            {/* Photo */}
            <div className="relative flex-1 overflow-hidden bg-[oklch(0.96 0.005 250)]">
              <img
                src={cat.img}
                alt={cat.t}
                loading="lazy"
                className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                Cat / {cat.n}
              </div>
              <div className="absolute right-5 top-5 h-3 w-3 border-r-2 border-t-2 border-charcoal opacity-40 transition-colors group-hover:border-accent" />
              <div className="absolute bottom-5 left-5 h-3 w-3 border-b-2 border-l-2 border-charcoal opacity-40 transition-colors group-hover:border-accent" />
            </div>

            {/* Label bar */}
            <div className="flex items-center justify-between border-t border-rule px-6 py-5 transition-colors group-hover:bg-charcoal-deep group-hover:text-white">
              <div>
                <h3 className="font-display text-[15px] font-bold uppercase tracking-tight">{cat.t}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted group-hover:text-white/50">
                  {cat.c}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent" />
            </div>
          </Link>
        ))}
      </section>

      {/* ===== Spec stat rail ===== */}
      <section className="border-t border-rule bg-charcoal-deep">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
          {[
            ["Catalogue SKUs", "184,302"],
            ["OEM Partners", "412"],
            ["Avg. Dispatch", "27h"],
            ["Procurement Uptime", "99.98%"],
          ].map(([k, v]) => (
            <div key={k} className="bg-charcoal-deep px-6 md:px-8 py-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{k}</div>
              <div className="mt-3 font-display text-2xl md:text-3xl font-bold text-white">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TRUST STRIP ===== */}
      <section className="border-t border-white/5 bg-charcoal">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
          {[
            { icon: Truck, t: "Next-Working-Day UK", c: "Order by 16:00 GMT · DPD & Tuffnells", to: "/contact-us" },
            { icon: Factory, t: "OEM-Grade Spares", c: "Genuine & approved equivalents", to: "/about-us" },
            { icon: ShieldCheck, t: "12-Month Warranty", c: "On all stocked line items", to: "/contact-us" },
            { icon: CreditCard, t: "30-Day Trade Account", c: "Subject to credit check", to: "/contact-us" },
          ].map(({ icon: Icon, t, c, to }) => (
            <Link key={t} to={to} className="flex items-start gap-4 bg-charcoal px-6 md:px-8 py-7 transition-colors hover:bg-white/[0.02]">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="font-display text-[13px] font-bold uppercase tracking-tight text-white">{t}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{c}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 bg-charcoal-deep text-white/70">
        <div className="mx-auto max-w-[1600px] px-6 py-16 md:py-20">
          {/* Newsletter & Payments Section (Top) */}
          <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
                Trade Bulletin
              </div>
              <h4 className="mt-4 font-display text-xl font-bold text-white uppercase tracking-tight">
                Join the UK Industrial Network
              </h4>
              <p className="mt-3 text-[14px] leading-relaxed text-white/50">
                Monthly stock alerts, OEM updates and procurement insights — exclusive for UK trade accounts.
              </p>
              <form className="mt-8 max-w-md" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-3 md:flex-row h-auto md:h-14 items-start md:items-center gap-2 border border-white/10 bg-white/[0.04] pl-5 pr-1 transition-colors focus-within:border-accent">
                  <Mail className="h-4 w-4 text-white/30 mt-4 md:mt-0" />
                  <input
                    type="email"
                    required
                    placeholder="business.email@company.co.uk"
                    className="flex-1 w-full bg-transparent font-mono text-[12px] tracking-wide text-white placeholder:text-white/20 focus:outline-none py-4 md:py-0"
                  />
                  <button
                    type="submit"
                    className="w-full md:w-auto h-12 bg-accent px-8 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:pl-20">
              <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30 mb-6">
                Logistics & Compliance
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3 text-white/50">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <span className="text-[12px] font-medium uppercase tracking-wider">ISO 9001:2015</span>
                </div>
                <div className="flex items-center gap-3 text-white/50">
                  <Truck className="h-5 w-5 text-accent" />
                  <span className="text-[12px] font-medium uppercase tracking-wider">UK-Wide Delivery</span>
                </div>
              </div>
              
                <div className="mt-10 border-t border-white/5 pt-10">
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30 mb-6 uppercase">
                    Accepted Trade Payments
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* VISA */}
                    <Link to="/contact-us" className="flex h-12 w-20 items-center justify-center border border-white/10 bg-white/[0.03] transition-all hover:border-accent hover:bg-accent/10 group">
                      <svg className="h-4 w-auto transition-transform group-hover:scale-110" viewBox="-74.7 -40.204 647.4 241.224" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="scale(89.72793 -89.72793) rotate(-20.218 .966 -.457)" spreadMethod="pad" id="visa-b">
                            <stop offset="0" stopColor="#222357"/>
                            <stop offset="1" stopColor="#254aa5"/>
                          </linearGradient>
                          <clipPath clipPathUnits="userSpaceOnUse" id="visa-a">
                            <path d="M413.742 90.435c-.057-4.494 4.005-7.002 7.065-8.493 3.144-1.53 4.2-2.511 4.188-3.879-.024-2.094-2.508-3.018-4.833-3.054-4.056-.063-6.414 1.095-8.289 1.971l-1.461-6.837c1.881-.867 5.364-1.623 8.976-1.656 8.478 0 14.025 4.185 14.055 10.674.033 8.235-11.391 8.691-11.313 12.372.027 1.116 1.092 2.307 3.426 2.61 1.155.153 4.344.27 7.959-1.395l1.419 6.615c-1.944.708-4.443 1.386-7.554 1.386-7.98 0-13.593-4.242-13.638-10.314m34.827 9.744c-1.548 0-2.853-.903-3.435-2.289l-12.111-28.917h8.472l1.686 4.659h10.353l.978-4.659h7.467l-6.516 31.206h-6.894m1.185-8.43l2.445-11.718h-6.696l4.251 11.718m-46.284 8.43l-6.678-31.206h8.073l6.675 31.206h-8.07m-11.943 0l-8.403-21.24-3.399 18.06c-.399 2.016-1.974 3.18-3.723 3.18h-13.737l-.192-.906c2.82-.612 6.024-1.599 7.965-2.655 1.188-.645 1.527-1.209 1.917-2.742l6.438-24.903h8.532l13.08 31.206h-8.478"/>
                          </clipPath>
                        </defs>
                        <g clipPath="url(#visa-a)" transform="matrix(4.98469 0 0 -4.98469 -1804.82 502.202)">
                          <path d="M0 0l98.437 36.252 22.394-60.809-98.436-36.252" fill="url(#visa-b)" transform="translate(351.611 96.896)"/>
                        </g>
                      </svg>
                    </Link>
                    {/* MASTERCARD */}
                    <Link to="/contact-us" className="flex h-12 w-20 items-center justify-center border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-accent hover:bg-accent/10 hover:text-white group">
                      <svg className="h-8 w-auto transition-transform group-hover:scale-110" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="18" cy="24" r="12" fill="currentColor" fillOpacity="0.5" />
                        <circle cx="30" cy="24" r="12" fill="currentColor" fillOpacity="0.8" />
                      </svg>
                    </Link>
                    {/* STRIPE */}
                    <Link to="/contact-us" className="flex h-12 w-20 items-center justify-center border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-accent hover:bg-accent/10 hover:text-white group">
                      <svg className="h-5 w-auto transition-transform group-hover:scale-110" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.1 19.7c0-2.3 1.9-3.4 4.8-3.4 2.5 0 4.8.7 6.3 1.5v-4.5c-1.7-.6-3.8-1-6-1-6.1 0-10.1 3.2-10.1 8.6 0 8.3 11.4 6.9 11.4 11.4 0 2.6-2.2 3.7-5.3 3.7-2.8 0-5.6-1-7.4-2.1v4.7c1.9.8 4.6 1.3 7.2 1.3 6.4 0 10.6-3.1 10.6-8.9 0-8.8-11.5-7.3-11.5-10.8z" fill="currentColor"/>
                      </svg>
                    </Link>
                  </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-16 border-t border-white/10 pt-20 lg:grid-cols-12">
            {/* Brand Column */}
            <div className="lg:col-span-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rotate-45 border-2 border-accent" />
                  <div className="absolute inset-[7px] rotate-45 bg-accent" />
                </div>
                <div className="leading-none">
                  <div className="font-display text-[18px] font-bold tracking-tight text-white uppercase">
                    SPARES<span className="text-accent">.</span>AUTOMATION
                  </div>
                  <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                    Industrial Procurement · UK
                  </div>
                </div>
              </Link>
              <p className="mt-8 max-w-sm text-[14px] leading-relaxed text-white/50">
                Specialist procurement of asphalt, ready-mix, packing and automation spares
                for heavy plant operators across the United Kingdom and Ireland. Trade-only
                supply since 2008.
              </p>
              
              <div className="mt-10 space-y-4">
                <Link to="/contact-us" className="flex items-center gap-4 text-white/40 transition-colors hover:text-accent group">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 group-hover:border-accent/30 transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">Sales Desk</div>
                    <div className="text-[13px] font-medium">+44 (0)161 818 7420</div>
                  </div>
                </Link>
                <Link to="/contact-us" className="flex items-center gap-4 text-white/40 transition-colors hover:text-accent group">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 group-hover:border-accent/30 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">Email Enquiries</div>
                    <div className="text-[13px] font-medium">trade@spares-automation.co.uk</div>
                  </div>
                </Link>
              </div>

              <div className="mt-10 flex gap-3">
                {[Linkedin, Youtube, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/40 transition-all hover:border-accent hover:bg-accent hover:text-accent-foreground"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
              {[
                {
                  h: "Catalogue",
                  links: [
                    { n: "All Products", to: "/products" },
                    { n: "Asphalt Spares", to: "/asphalt" },
                    { n: "Concrete Spares", to: "/concrete" },
                    { n: "Packing Machinery", to: "/packing" },
                    { n: "Automation & Drives", to: "/automation" },
                    { n: "Home Controls", to: "/home-controls" },
                    { n: "New Arrivals", to: "/new-arrivals" },
                  ],
                },
                {
                  h: "Trade Services",
                  links: [
                    { n: "Trade Account", to: "/account" },
                    { n: "Bulk Pricing", to: "/contact-us" },
                    { n: "Dispatch Info", to: "/contact-us" },
                    { n: "Engineer Call-Out", to: "/contact-us" },
                    { n: "Part Lookup", to: "/contact-us" },
                    { n: "OEM Partners", to: "/about-us" },
                  ],
                },
                {
                  h: "Company",
                  links: [
                    { n: "About Us", to: "/about-us" },
                    { n: "Industries", to: "/about-us" },
                    { n: "Case Studies", to: "/about-us" },
                    { n: "Careers UK", to: "/contact-us" },
                    { n: "Press Media", to: "/contact-us" },
                    { n: "Contact Us", to: "/contact-us" },
                  ],
                },
                {
                  h: "Support",
                  links: [
                    { n: "Track Order", to: "/contact-us" },
                    { n: "Returns & RMA", to: "/contact-us" },
                    { n: "Delivery Info", to: "/contact-us" },
                    { n: "Datasheets", to: "/contact-us" },
                    { n: "Help Centre", to: "/contact-us" },
                    { n: "Request Quote", to: "/contact-us" },
                  ],
                },
              ].map((col) => (
                <div key={col.h}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30 mb-8">
                    {col.h}
                  </div>
                  <ul className="space-y-4">
                    {col.links.map((l) => (
                      <li key={l.n}>
                        <Link to={l.to} className="text-[13px] text-white/50 transition-colors hover:text-accent">
                          {l.n}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 bg-charcoal-deep/50">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div>© {new Date().getFullYear()} Spares Automation Ltd · Manchester, United Kingdom</div>
              <div className="text-[9px] text-white/20">
                Registered in England & Wales · Co. No. 08421762 · VAT GB 162 4837 22
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Link to="/about-us" className="transition-colors hover:text-accent">Privacy Notice</Link>
              <Link to="/about-us" className="hover:text-accent transition-colors">Terms of Trade</Link>
              <Link to="/about-us" className="hover:text-accent transition-colors">Cookie Policy</Link>
              <div className="flex items-center gap-3 border-l border-white/10 pl-8 ml-2">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-white/40">Operational Status: 99.98%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}