import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import type { FormEvent } from "react";

import { SITE } from "@/lib/site";

export function TradeAccountApplicationForm() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      "Trade account application",
      `Company: ${String(data.get("company") ?? "")}`,
      `Trading name: ${String(data.get("tradingName") ?? "")}`,
      `Contact: ${String(data.get("contactName") ?? "")}`,
      `Email: ${String(data.get("email") ?? "")}`,
      `Phone: ${String(data.get("phone") ?? "")}`,
      `Company number: ${String(data.get("companyNumber") ?? "")}`,
      `VAT number: ${String(data.get("vatNumber") ?? "")}`,
      `Billing address: ${String(data.get("billingAddress") ?? "")}`,
      `Delivery address: ${String(data.get("deliveryAddress") ?? "")}`,
      `Purchasing requirements: ${String(data.get("requirements") ?? "")}`,
      `Estimated monthly spend: ${String(data.get("monthlySpend") ?? "")}`,
      `Requested terms: ${String(data.get("requestedTerms") ?? "")}`,
    ].join("\n");

    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("Trade account application")}&body=${encodeURIComponent(body)}`;
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
            Complete the company details below. Your email application will open ready to send to {SITE.email}; the sales desk will confirm eligibility and terms separately.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 grid gap-4 md:grid-cols-2">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:col-span-2">
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110">
              <Send aria-hidden="true" className="h-4 w-4" /> Prepare application email
            </button>
            <Link to="/register" className="inline-flex h-12 items-center justify-center border border-white/20 px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white hover:border-accent hover:text-accent">
              Create customer login separately
            </Link>
          </div>
        </form>
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
