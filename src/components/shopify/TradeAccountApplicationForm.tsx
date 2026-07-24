import { Link } from "@tanstack/react-router";
import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { submitTradeAccount } from "@/lib/api/cms.functions";
import { useHydrated } from "@/hooks/use-hydrated";

export function TradeAccountApplicationForm() {
  const hydrated = useHydrated();
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
      const result = await submitTradeAccount({
        data: {
          company: String(data.get("company") ?? ""),
          tradingName: String(data.get("tradingName") ?? ""),
          contactName: String(data.get("contactName") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          companyNumber: String(data.get("companyNumber") ?? ""),
          vatNumber: String(data.get("vatNumber") ?? ""),
          billingAddress: String(data.get("billingAddress") ?? ""),
          deliveryAddress: String(data.get("deliveryAddress") ?? ""),
          requirements: String(data.get("requirements") ?? ""),
          monthlySpend: String(data.get("monthlySpend") ?? ""),
          requestedTerms: String(data.get("requestedTerms") ?? "pay-as-you-go") as
            | "pay-as-you-go"
            | "credit-terms"
            | "not-sure",
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
      setError("We could not submit your application. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="trade-application-title" className="border-t border-rule bg-charcoal-deep py-10 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">Business application</div>
          <h2 id="trade-application-title" className="mt-3 font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">
            Apply for trade terms
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Complete the company details below. The sales desk will review your application and
            confirm eligibility and terms by email.
          </p>
        </div>

        {reference ? (
          <div role="status" className="mt-7 border border-accent/40 bg-accent/10 p-6 text-sm leading-6 text-white">
            <CheckCircle2 aria-hidden="true" className="mr-2 inline h-5 w-5 text-accent" />
            Thank you. Your trade account application has been received and our reference is{" "}
            <strong className="font-semibold">{reference}</strong>. We will review it and reply by
            email shortly.
          </div>
        ) : (
          <form method="post" onSubmit={submit} className="relative mt-7 grid gap-4 md:grid-cols-2">
            <label className="absolute -left-[9999px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <TradeField label="Registered company name" name="company" autoComplete="organization" required />
            <TradeField label="Trading name" name="tradingName" autoComplete="organization" />
            <TradeField label="Main contact" name="contactName" autoComplete="name" required />
            <TradeField label="Business email" name="email" type="email" autoComplete="email" required />
            <TradeField label="Business phone" name="phone" type="tel" autoComplete="tel" required />
            <TradeField label="Company registration number" name="companyNumber" />
            <TradeField label="VAT number" name="vatNumber" />
            <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 md:col-span-2">
              Billing address
              <textarea name="billingAddress" rows={3} autoComplete="billing street-address" required className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 md:col-span-2">
              Delivery address (if different)
              <textarea name="deliveryAddress" rows={3} autoComplete="shipping street-address" className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 md:col-span-2">
              Products and purchasing requirements
              <textarea name="requirements" rows={4} required className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <TradeField label="Estimated monthly spend" name="monthlySpend" placeholder="For example, £2,000–£5,000" />
            <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
              Requested terms
              <select name="requestedTerms" defaultValue="pay-as-you-go" className="h-12 border border-white/25 bg-charcoal px-4 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none">
                <option value="pay-as-you-go">Pay as you go / trade pricing</option>
                <option value="credit-terms">Credit terms requested</option>
                <option value="not-sure">Not sure — please advise</option>
              </select>
            </label>
            <label className="flex items-start gap-3 text-sm leading-6 text-white/75 md:col-span-2">
              <input name="confirmation" type="checkbox" required className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]" />
              I confirm that the information provided is accurate and that trade pricing or credit terms are subject to review and written approval.
            </label>

            {error ? (
              <div role="alert" className="border border-red-400/40 bg-red-500/10 p-4 text-sm leading-6 text-red-200 md:col-span-2">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:col-span-2">
              <button type="submit" disabled={busy || !hydrated} className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                <Send aria-hidden="true" className="h-4 w-4" /> {busy ? "Submitting" : "Submit application"}
              </button>
              <Link to="/credit-account" className="inline-flex h-12 items-center justify-center border border-white/20 px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white hover:border-accent hover:text-accent">
                Apply for credit terms instead
              </Link>
              <Link to="/register" className="inline-flex h-12 items-center justify-center border border-white/20 px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white hover:border-accent hover:text-accent">
                Create customer login separately
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function TradeField({ label, name, type = "text", autoComplete, required, placeholder }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required={required} placeholder={placeholder} className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white placeholder:text-white/40 focus:border-accent focus:outline-none" />
    </label>
  );
}
