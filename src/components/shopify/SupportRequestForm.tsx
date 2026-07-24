import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { submitSupportRequest } from "@/lib/api/cms.functions";
import { useHydrated } from "@/hooks/use-hydrated";

type RequestKind = "tracking" | "resources" | "question" | "unsubscribe";

const COPY: Record<RequestKind, { title: string; subject: string; reference: string; referenceLabel: string; detailsLabel: string }> = {
  tracking: { title: "Request an order update", subject: "Order tracking request", reference: "Order number", referenceLabel: "Order number", detailsLabel: "Delivery postcode or company name" },
  resources: { title: "Request product resources", subject: "Product resource request", reference: "Part or product number", referenceLabel: "Part or product number", detailsLabel: "Document, manual, or video required" },
  question: { title: "Send a product question", subject: "Product question", reference: "Part or product number", referenceLabel: "Part or product number (if known)", detailsLabel: "How can we help?" },
  unsubscribe: { title: "Request email removal", subject: "Unsubscribe request", reference: "Email address", referenceLabel: "Email address to remove", detailsLabel: "Any additional details (optional)" },
};

export function SupportRequestForm({ kind }: { kind: RequestKind }) {
  const hydrated = useHydrated();
  const copy = COPY[kind];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");

    try {
      const result = await submitSupportRequest({
        data: {
          kind,
          reference: String(data.get("reference") ?? ""),
          email: String(data.get("email") ?? ""),
          details: String(data.get("details") ?? ""),
          website: String(data.get("website") ?? ""),
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
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
    <section aria-labelledby={`${kind}-form-title`} className="border-t border-rule bg-charcoal-deep py-10 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h2 id={`${kind}-form-title`} className="font-display text-2xl font-bold uppercase tracking-tight">{copy.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
          Complete the details below and the team will respond by email.
        </p>

        {reference ? (
          <div role="status" className="mt-6 border border-accent/40 bg-accent/10 p-5 text-sm leading-6 text-white">
            <CheckCircle2 aria-hidden="true" className="mr-2 inline h-5 w-5 text-accent" />
            Thank you. Your request has been received and our reference is{" "}
            <strong className="font-semibold">{reference}</strong>. We will reply by email shortly.
          </div>
        ) : (
          <form method="post" onSubmit={submit} className="relative mt-6 grid gap-4 md:grid-cols-2">
            <label className="absolute -left-[9999px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
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

            {error ? (
              <div role="alert" className="border border-red-400/40 bg-red-500/10 p-4 text-sm leading-6 text-red-200 md:col-span-2">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={busy || !hydrated} className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit">
              <Send aria-hidden="true" className="h-4 w-4" /> {busy ? "Sending" : "Send request"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
