import { Send } from "lucide-react";
import type { FormEvent } from "react";

import { SITE } from "@/lib/site";

type RequestKind = "tracking" | "resources" | "question" | "unsubscribe";

const COPY: Record<RequestKind, { title: string; subject: string; reference: string; referenceLabel: string; detailsLabel: string }> = {
  tracking: { title: "Request an order update", subject: "Order tracking request", reference: "Order number", referenceLabel: "Order number", detailsLabel: "Delivery postcode or company name" },
  resources: { title: "Request product resources", subject: "Product resource request", reference: "Part or product number", referenceLabel: "Part or product number", detailsLabel: "Document, manual, or video required" },
  question: { title: "Send a product question", subject: "Product question", reference: "Part or product number", referenceLabel: "Part or product number (if known)", detailsLabel: "How can we help?" },
  unsubscribe: { title: "Request email removal", subject: "Unsubscribe request", reference: "Email address", referenceLabel: "Email address to remove", detailsLabel: "Any additional details (optional)" },
};

export function SupportRequestForm({ kind }: { kind: RequestKind }) {
  const copy = COPY[kind];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      `Request type: ${copy.title}`,
      `${copy.reference}: ${String(data.get("reference") ?? "")}`,
      `Contact email: ${String(data.get("email") ?? "")}`,
      `Details: ${String(data.get("details") ?? "")}`,
    ].join("\n");
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section aria-labelledby={`${kind}-form-title`} className="border-t border-rule bg-charcoal-deep py-10 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h2 id={`${kind}-form-title`} className="font-display text-2xl font-bold uppercase tracking-tight">{copy.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Complete the details below and your email app will open with the request ready to send to {SITE.email}.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
            {copy.referenceLabel}
            <input name="reference" required={kind !== "question"} className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
          </label>
          <label className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
            Contact email
            <input name="email" type="email" required className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
          </label>
          <label className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80 md:col-span-2">
            {copy.detailsLabel}
            <textarea name="details" rows={4} required={kind !== "unsubscribe"} className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
          </label>
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:brightness-110 md:w-fit">
            <Send aria-hidden="true" className="h-4 w-4" /> Prepare email request
          </button>
        </form>
      </div>
    </section>
  );
}
