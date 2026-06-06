import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronRight, User, UserPlus, Phone, Globe } from "lucide-react";
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
  "Feeders & Conveyors",
  "Silos & Storage",
  "Burner Systems",
  "Drum Mixers",
  "Sensors & Probes",
  "Control Cabinets",
];

const concreteSubs = [
  "Batching Plants",
  "Twin-Shaft Mixers",
  "Cement Silos",
  "Weighing Systems",
  "Pneumatic Valves",
  "PLC Controllers",
];

const categories = [
  { n: "01", t: "Concrete Product Machines", c: "Mixers · Pumps · Vibrators", img: catConcrete },
  { n: "02", t: "Packing Machines", c: "Sealers · Rollers · Bearings", img: catPacking },
  { n: "03", t: "Automation & Drives", c: "VFDs · Servos · PLCs", img: catAutomation },
  { n: "04", t: "Home Automation & Controls", c: "Modules · Sensors · Relays", img: catHome },
];

function Home() {
  const [hover, setHover] = useState<"asphalt" | "concrete" | null>("asphalt");

  return (
    <div className="min-h-screen bg-background text-ink">
      {/* ===== FIXED HEADER BLOCK ===== */}
      <header className="sticky top-0 z-50">
        {/* Utility row */}
        <div className="bg-charcoal-deep text-white/80">
          <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-between px-6 font-mono text-[11px] uppercase tracking-[0.18em]">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><Globe className="h-3 w-3 text-accent" /> Global · EN</span>
              <span className="hidden md:flex items-center gap-2 text-white/50"><Phone className="h-3 w-3" /> +1 (800) 555-0142 · 24/7 Procurement Desk</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1.5 text-white/70 transition-colors hover:text-accent">
                <User className="h-3 w-3" /> Sign In
              </button>
              <span className="h-3 w-px bg-white/15" />
              <button className="flex items-center gap-1.5 text-white/70 transition-colors hover:text-accent">
                <UserPlus className="h-3 w-3" /> Register
              </button>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="border-b border-rule bg-charcoal">
          <div className="mx-auto grid h-20 max-w-[1600px] grid-cols-12 items-center gap-6 px-6">
            {/* Logo */}
            <a href="/" className="col-span-3 flex items-center gap-3">
              <div className="relative h-9 w-9">
                <div className="absolute inset-0 rotate-45 border-2 border-accent" />
                <div className="absolute inset-[6px] rotate-45 bg-accent" />
              </div>
              <div className="leading-none">
                <div className="font-display text-[17px] font-bold tracking-tight text-white">
                  SPARES<span className="text-accent">.</span>AUTOMATION
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-white/45">
                  Industrial Procurement Platform
                </div>
              </div>
            </a>

            {/* Search — 75% */}
            <div className="col-span-9">
              <label className="group flex h-12 items-center gap-3 border border-white/10 bg-white/[0.04] pl-4 pr-1 transition-colors focus-within:border-accent">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Enter Part or Manufacturer Number to Search..."
                  className="flex-1 bg-transparent font-mono text-[13px] tracking-wide text-white placeholder:text-white/40 focus:outline-none"
                />
                <span className="hidden md:flex h-9 items-center border-l border-white/10 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  ⌘ K
                </span>
                <button className="flex h-10 items-center gap-2 bg-accent px-6 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90">
                  Search Catalog
                </button>
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO 2-COLUMN SPLIT ===== */}
      <section className="grid w-full grid-cols-1 md:grid-cols-2">
        {/* Asphalt block */}
        <button
          onMouseEnter={() => setHover("asphalt")}
          onMouseLeave={() => setHover(null)}
          className="group relative h-[70vh] min-h-[520px] overflow-hidden text-left"
        >
          <img
            src={asphalt}
            alt="Industrial asphalt blacktop plant with silos and conveyors at dusk"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-deep/85 via-charcoal-deep/55 to-charcoal-deep/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/70 to-transparent" />

          {/* Index marker */}
          <div className="absolute left-10 top-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
            <span className="h-px w-8 bg-accent" />
            Vertical 01 / Bituminous
          </div>

          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <h2 className="font-display text-[clamp(2.25rem,4.6vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white">
              ASPHALT /<br />BLACKTOP <span className="text-accent">SPARES</span>
            </h2>
            <div className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white/70">
              Browse Sub-Categories
              <ChevronRight className="h-3.5 w-3.5 text-accent transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Hover dropdown overlay */}
          <div
            className={`absolute right-8 top-8 w-[320px] origin-top-right border border-white/15 bg-charcoal-deep/95 backdrop-blur-md transition-all duration-300 ${
              hover === "asphalt" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
                Index · Asphalt
              </span>
              <span className="font-mono text-[10px] text-accent">06</span>
            </div>
            <ul>
              {asphaltSubs.map((s, i) => (
                <li key={s}>
                  <a
                    href="#"
                    className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-[13px] text-white/85 transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/40 group-hover:text-accent-foreground/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </button>

        {/* Concrete block */}
        <button
          onMouseEnter={() => setHover("concrete")}
          onMouseLeave={() => setHover(null)}
          className="group relative h-[70vh] min-h-[520px] overflow-hidden text-left"
        >
          <img
            src={concrete}
            alt="Ready-mix concrete batching plant with silos against dramatic sky"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-charcoal-deep/85 via-charcoal-deep/55 to-charcoal-deep/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/70 to-transparent" />

          <div className="absolute right-10 top-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
            Vertical 02 / Cementitious
            <span className="h-px w-8 bg-amber" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-10 text-right">
            <h2 className="font-display text-[clamp(2.25rem,4.6vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white">
              READY-MIX /<br />CONCRETE <span className="text-amber">SPARES</span>
            </h2>
            <div className="mt-6 flex items-center justify-end gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white/70">
              Browse Sub-Categories
              <ChevronRight className="h-3.5 w-3.5 text-amber transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {hover === "concrete" && (
            <div className="pointer-events-auto absolute left-8 top-8 w-[320px] origin-top-left border border-white/15 bg-charcoal-deep/95 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">Index · Concrete</span>
                <span className="font-mono text-[10px] text-amber">06</span>
              </div>
              <ul>
                {concreteSubs.map((s, i) => (
                  <li key={s}>
                    <a
                      href="#"
                      className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-[13px] text-white/85 transition-colors hover:bg-amber hover:text-charcoal-deep"
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-white/40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </button>
      </section>

      {/* ===== 4-COLUMN COLLECTION GRID ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4">
        {categories.map((cat, i) => (
          <a
            key={cat.t}
            href="#"
            className={`group relative flex aspect-square flex-col border-rule bg-surface ${
              i !== 0 ? "border-l" : ""
            } ${i !== categories.length - 1 ? "" : ""} border-b md:border-b-0`}
          >
            {/* Photo */}
            <div className="relative flex-1 overflow-hidden bg-[oklch(0.96_0.005_250)]">
              <img
                src={cat.img}
                alt={cat.t}
                loading="lazy"
                className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              />
              {/* Index */}
              <div className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                Cat / {cat.n}
              </div>
              {/* Hover crosshair accent */}
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
          </a>
        ))}
      </section>

      {/* ===== Spec footer rail ===== */}
      <section className="border-t border-rule bg-charcoal-deep">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
          {[
            ["Catalog SKUs", "184,302"],
            ["OEM Partners", "412"],
            ["Avg. Ship Time", "27h"],
            ["Procurement Uptime", "99.98%"],
          ].map(([k, v]) => (
            <div key={k} className="bg-charcoal-deep px-8 py-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{k}</div>
              <div className="mt-3 font-display text-3xl font-bold text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            <span>© Spares Automation · ISO 9001 Procurement</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Systems Operational</span>
          </div>
        </div>
      </section>
    </div>
  );
}
