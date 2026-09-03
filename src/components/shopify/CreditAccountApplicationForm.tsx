import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { submitCreditAccount } from "@/lib/api/cms.functions";

const companyTypes = ["Limited Company", "Sole Trader", "Partnership"] as const;
type CompanyType = (typeof companyTypes)[number];

export function CreditAccountApplicationForm() {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedCompanyType = String(data.get("companyType") ?? "");
    setBusy(true);
    setError("");

    if (!isCompanyType(selectedCompanyType)) {
      setError("Select a company type.");
      setBusy(false);
      return;
    }

    try {
      const result = await submitCreditAccount({
        data: {
          company: String(data.get("company") ?? ""),
          address: String(data.get("address") ?? ""),
          addressLine2: String(data.get("addressLine2") ?? ""),
          postcode: String(data.get("postcode") ?? ""),
          companyType: selectedCompanyType,
          registrationNumber: String(data.get("registrationNumber") ?? ""),
          registeredOfficeAddress: String(data.get("registeredOfficeAddress") ?? ""),
          telephone: String(data.get("telephone") ?? ""),
          fax: String(data.get("fax") ?? ""),
          email: String(data.get("email") ?? ""),
          purchasingContact: String(data.get("purchasingContact") ?? ""),
          accountsContact: String(data.get("accountsContact") ?? ""),
          creditLimit: String(data.get("creditLimit") ?? ""),
          tradeCompany1: String(data.get("tradeCompany1") ?? ""),
          tradeContact1: String(data.get("tradeContact1") ?? ""),
          tradeAddress1: String(data.get("tradeAddress1") ?? ""),
          tradePostcode1: String(data.get("tradePostcode1") ?? ""),
          tradeTelephone1: String(data.get("tradeTelephone1") ?? ""),
          tradeEmail1: String(data.get("tradeEmail1") ?? ""),
          tradeCompany2: String(data.get("tradeCompany2") ?? ""),
          tradeContact2: String(data.get("tradeContact2") ?? ""),
          tradeAddress2: String(data.get("tradeAddress2") ?? ""),
          tradePostcode2: String(data.get("tradePostcode2") ?? ""),
          tradeTelephone2: String(data.get("tradeTelephone2") ?? ""),
          tradeEmail2: String(data.get("tradeEmail2") ?? ""),
          bankName: String(data.get("bankName") ?? ""),
          bankBranch: String(data.get("bankBranch") ?? ""),
          accountNumber: String(data.get("accountNumber") ?? ""),
          sortCode: String(data.get("sortCode") ?? ""),
          signedName: String(data.get("signedName") ?? ""),
          printedName: String(data.get("printedName") ?? ""),
          position: String(data.get("position") ?? ""),
          signatureDate: String(data.get("signatureDate") ?? ""),
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
    <section
      aria-labelledby="credit-application-title"
      className="border-t border-rule bg-charcoal-deep py-10 text-white"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
            Credit application
          </div>
          <h2
            id="credit-application-title"
            className="mt-3 font-display text-2xl font-bold uppercase tracking-tight md:text-3xl"
          >
            Apply for credit terms
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Complete the customer details, trade references, bank details, and authorisation below.
            Credit accounts are subject to checks and written approval from the sales desk.
          </p>
        </div>

        {reference ? (
          <div
            role="status"
            className="mt-7 border border-accent/40 bg-accent/10 p-6 text-sm leading-6 text-white"
          >
            <CheckCircle2 aria-hidden="true" className="mr-2 inline h-5 w-5 text-accent" />
            Thank you. Your credit account application has been received and our reference is{" "}
            <strong className="font-semibold">{reference}</strong>. We will run the necessary checks
            and reply by email shortly.
          </div>
        ) : (
          <form method="post" onSubmit={submit} className="relative mt-7 grid gap-8">
            <label className="absolute -left-[9999px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <CreditLegend>Customer details</CreditLegend>
              <CreditField label="Registered company name" name="company" autoComplete="organization" required />
              <CreditField label="Postcode" name="postcode" autoComplete="postal-code" required />
              <CreditTextarea label="Address" name="address" autoComplete="street-address" required />
              <CreditTextarea label="Address continued" name="addressLine2" />
              <div className="grid gap-3 md:col-span-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                  Type of company
                </div>
                <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-3">
                  {companyTypes.map((type) => (
                    <label
                      key={type}
                      className="flex min-h-12 items-center gap-3 border border-white/25 bg-white/10 px-4"
                    >
                      <input
                        name="companyType"
                        type="radio"
                        value={type}
                        required
                        className="h-4 w-4 accent-[hsl(var(--accent))]"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <CreditField label="Registration number" name="registrationNumber" />
              <CreditField label="Telephone" name="telephone" type="tel" autoComplete="tel" required />
              <CreditTextarea
                label="Registered office address (if different from above)"
                name="registeredOfficeAddress"
              />
              <CreditField label="Fax" name="fax" type="tel" />
              <CreditField label="Email" name="email" type="email" autoComplete="email" required />
              <CreditField label="Purchasing contact" name="purchasingContact" autoComplete="name" required />
              <CreditField label="Accounts contact" name="accountsContact" autoComplete="name" required />
              <CreditField
                label="Requested credit limit"
                name="creditLimit"
                inputMode="numeric"
                placeholder="GBP amount"
              />
            </fieldset>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <CreditLegend>Trade references</CreditLegend>
              <CreditSubheading>Company 1</CreditSubheading>
              <CreditField label="Company" name="tradeCompany1" autoComplete="organization" required />
              <CreditField label="Contact name" name="tradeContact1" autoComplete="name" required />
              <CreditTextarea label="Address" name="tradeAddress1" required />
              <CreditField label="Postcode" name="tradePostcode1" required />
              <CreditField label="Telephone" name="tradeTelephone1" type="tel" required />
              <CreditField label="Email" name="tradeEmail1" type="email" autoComplete="email" required />

              <CreditSubheading>Company 2</CreditSubheading>
              <CreditField label="Company" name="tradeCompany2" autoComplete="organization" required />
              <CreditField label="Contact name" name="tradeContact2" autoComplete="name" required />
              <CreditTextarea label="Address" name="tradeAddress2" required />
              <CreditField label="Postcode" name="tradePostcode2" required />
              <CreditField label="Telephone" name="tradeTelephone2" type="tel" required />
              <CreditField label="Email" name="tradeEmail2" type="email" autoComplete="email" required />
            </fieldset>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <CreditLegend>Bank details</CreditLegend>
              <CreditField label="Bank name" name="bankName" required />
              <CreditField label="Branch" name="bankBranch" required />
              <CreditField label="Account number" name="accountNumber" inputMode="numeric" required />
              <CreditField label="Sort code" name="sortCode" placeholder="00-00-00" required />
            </fieldset>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <CreditLegend>Authorisation</CreditLegend>
              <p className="text-sm leading-6 text-white/75 md:col-span-2">
                I hereby authorise Spares Automation to obtain references from the above, as and when
                appropriate. I agree to abide by the Terms and Conditions as set out by Spares
                Automation, which include that all invoices are due to be paid within 30 days from the
                date of invoice, and that a purchase order must be given for services rendered.
              </p>
              <CreditField label="Signed" name="signedName" autoComplete="name" required />
              <CreditField label="Printed name" name="printedName" autoComplete="name" required />
              <CreditField label="Position" name="position" required />
              <CreditField label="Date" name="signatureDate" type="date" required />
            </fieldset>

            {error ? (
              <div role="alert" className="border border-red-400/40 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={busy || !hydrated}
                className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send aria-hidden="true" className="h-4 w-4" /> {busy ? "Submitting" : "Submit application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function isCompanyType(value: string): value is CompanyType {
  return companyTypes.includes(value as CompanyType);
}

function CreditLegend({ children }: { children: string }) {
  return (
    <legend className="mb-1 font-display text-lg font-bold uppercase tracking-tight text-white md:col-span-2">
      {children}
    </legend>
  );
}

function CreditSubheading({ children }: { children: string }) {
  return (
    <div className="border-t border-white/15 pt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55 md:col-span-2">
      {children}
    </div>
  );
}

function CreditField({
  label,
  name,
  type = "text",
  autoComplete,
  required,
  placeholder,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric";
}) {
  return (
    <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function CreditTextarea({
  label,
  name,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
      {label}
      <textarea
        name={name}
        rows={3}
        autoComplete={autoComplete}
        required={required}
        className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none"
      />
    </label>
  );
}
