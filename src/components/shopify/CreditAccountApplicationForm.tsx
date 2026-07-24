import { Link } from "@tanstack/react-router";
import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { submitCreditAccount } from "@/lib/api/cms.functions";
import { useHydrated } from "@/hooks/use-hydrated";

export function CreditAccountApplicationForm() {
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
      const result = await submitCreditAccount({
        data: {
          company: String(data.get("company") ?? ""),
          tradingName: String(data.get("tradingName") ?? ""),
          contactName: String(data.get("contactName") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          companyNumber: String(data.get("companyNumber") ?? ""),
          vatNumber: String(data.get("vatNumber") ?? ""),
          billingAddress: String(data.get("billingAddress") ?? ""),
          yearsTrading: String(data.get("yearsTrading") ?? ""),
          requestedCreditLimit: String(data.get("requestedCreditLimit") ?? ""),
          bankReference: String(data.get("bankReference") ?? ""),
          tradeReference1: String(data.get("tradeReference1") ?? ""),
          tradeReference2: String(data.get("tradeReference2") ?? ""),
          notes: String(data.get("notes") ?? ""),
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
    <section aria-labelledby="credit-application-title" className="border-t border-rule bg-charcoal-deep py-10 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">Credit application</div>
          <h2 id="credit-application-title" className="mt-3 font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">
            Apply for credit terms
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Credit accounts are subject to a credit check and written approval. Complete the company
            and reference details below; the sales desk will review your application and confirm the
            agreed credit limit and payment terms by email.
          </p>
        </div>

        {reference ? (
          <div role="status" className="mt-7 border border-accent/40 bg-accent/10 p-6 text-sm leading-6 text-white">
            <CheckCircle2 aria-hidden="true" className="mr-2 inline h-5 w-5 text-accent" />
            Thank you. Your credit account application has been received and our reference is{" "}
            <strong className="font-semibold">{reference}</strong>. We will run the necessary checks
            and reply by email shortly.
          </div>
        ) : (
          <form method="post" onSubmit={submit} className="relative mt-7 grid gap-4 md:grid-cols-2">
            <label className="absolute -left-[9999px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <CreditField label="Registered company name" name="company" autoComplete="organization" required />
            <CreditField label="Trading name" name="tradingName" autoComplete="organization" />
            <CreditField label="Main contact" name="contactName" autoComplete="name" required />
            <CreditField label="Business email" name="email" type="email" autoComplete="email" required />
            <CreditField label="Business phone" name="phone" type="tel" autoComplete="tel" required />
            <CreditField label="Company registration number" name="companyNumber" />
            <CreditField label="VAT number" name="vatNumber" />
            <CreditField label="Years trading" name="yearsTrading" placeholder="For example, 5" />
            <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 md:col-span-2">
              Billing address
              <textarea name="billingAddress" rows={3} autoComplete="billing street-address" required className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <CreditField label="Requested credit limit" name="requestedCreditLimit" placeholder="For example, £10,000" required />
            <CreditField label="Bank reference (name / sort code)" name="bankReference" />
            <CreditField label="Trade reference 1 (supplier)" name="tradeReference1" />
            <CreditField label="Trade reference 2 (supplier)" name="tradeReference2" />
            <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 md:col-span-2">
              Additional notes
              <textarea name="notes" rows={3} className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <label className="flex items-start gap-3 text-sm leading-6 text-white/75 md:col-span-2">
              <input name="confirmation" type="checkbox" required className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]" />
              I confirm the information provided is accurate and authorise Spares Automation to carry
              out credit checks. Credit terms and limits are subject to review and written approval.
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
              <Link to="/trade-account" className="inline-flex h-12 items-center justify-center border border-white/20 px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white hover:border-accent hover:text-accent">
                Apply for a trade account instead
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function CreditField({ label, name, type = "text", autoComplete, required, placeholder }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required={required} placeholder={placeholder} className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white placeholder:text-white/40 focus:border-accent focus:outline-none" />
    </label>
  );
}
