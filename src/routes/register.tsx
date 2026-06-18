import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { SiteHeader } from "@/components/shopify/SiteHeader";
import { createShopifyCustomer } from "@/lib/api/shopify.functions";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

type RegistrationResult = {
  status: "idle" | "success" | "error";
  message: string;
};

function normalizePhoneForShopify(countryCode: string, phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  const international = cleaned.startsWith("+")
    ? cleaned
    : `${countryCode}${cleaned.replace(/^0+/, "")}`;

  return /^\+[1-9]\d{6,14}$/.test(international) ? international : null;
}

function RegisterPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RegistrationResult>({ status: "idle", message: "" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setResult({ status: "idle", message: "" });

    const form = new FormData(formElement);
    const phone = normalizePhoneForShopify(
      String(form.get("countryCode") ?? "+44"),
      String(form.get("phone") ?? ""),
    );

    if (phone === null) {
      setBusy(false);
      setResult({
        status: "error",
        message: "Enter a valid phone number with the correct country code.",
      });
      return;
    }

    try {
      const response = await createShopifyCustomer({
        data: {
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          email: String(form.get("email") ?? ""),
          phone,
          password: String(form.get("password") ?? ""),
          acceptsMarketing: form.get("acceptsMarketing") === "on",
        },
      });

      if (response.errors.length) {
        setResult({
          status: "error",
          message: response.errors.map((error) => error.message).join(" "),
        });
        return;
      }

      setResult({
        status: "success",
        message:
          "Your account has been created in Shopify. Check your email if Shopify asks you to verify the account before signing in.",
      });
      formElement.reset();
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Shopify could not create this customer account.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main className="mx-auto grid max-w-[1180px] gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex min-h-[520px] flex-col justify-between border border-rule bg-charcoal p-8 text-white md:p-10">
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Back to catalogue
            </Link>
            <div className="mt-16 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              Trade Customer Access
            </div>
            <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-none tracking-tight">
              Create Your Account
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
              Register directly with Spares Automation. The account is created in Shopify, so
              customer data, checkout and future order history stay connected to the store.
            </p>
          </div>

          <div className="grid gap-4 border-t border-white/10 pt-6 text-sm text-white/55">
            <div>Trade pricing and order access after approval</div>
            <div>Account details synced into Shopify Customers</div>
          </div>
        </section>

        <section className="border border-rule bg-surface p-6 md:p-8">
          <div className="mb-8 flex h-12 w-12 items-center justify-center bg-accent text-accent-foreground">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Shopify Registration
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight">
            New Customer
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="First name" name="firstName" autoComplete="given-name" required />
              <Field label="Last name" name="lastName" autoComplete="family-name" required />
            </div>
            <Field label="Email address" name="email" type="email" autoComplete="email" required />
            <PhoneField />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label className="flex items-start gap-3 text-sm text-ink-muted">
              <input
                name="acceptsMarketing"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]"
              />
              Send me updates about parts availability, trade offers and new arrivals.
            </label>

            {result.message ? (
              <div
                className={`border p-4 text-sm leading-6 ${
                  result.status === "success"
                    ? "border-accent/40 bg-accent/10 text-ink"
                    : "border-red-500/30 bg-red-500/10 text-red-700"
                }`}
              >
                {result.status === "success" ? (
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-accent" />
                ) : null}
                {result.message}
              </div>
            ) : null}

            <button
              disabled={busy}
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create Account
            </button>

            <p className="text-sm text-ink-muted">
              Already registered?{" "}
              <Link to="/login" className="font-semibold text-ink transition-colors hover:text-accent">
                Sign in securely
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

const COUNTRIES = [
  { code: "+44", name: "United Kingdom" },
  { code: "+93", name: "Afghanistan" },
  { code: "+355", name: "Albania" },
  { code: "+213", name: "Algeria" },
  { code: "+376", name: "Andorra" },
  { code: "+244", name: "Angola" },
  { code: "+1-268", name: "Antigua and Barbuda" },
  { code: "+54", name: "Argentina" },
  { code: "+374", name: "Armenia" },
  { code: "+61", name: "Australia" },
  { code: "+43", name: "Austria" },
  { code: "+994", name: "Azerbaijan" },
  { code: "+1-242", name: "Bahamas" },
  { code: "+973", name: "Bahrain" },
  { code: "+880", name: "Bangladesh" },
  { code: "+1-246", name: "Barbados" },
  { code: "+375", name: "Belarus" },
  { code: "+32", name: "Belgium" },
  { code: "+501", name: "Belize" },
  { code: "+229", name: "Benin" },
  { code: "+975", name: "Bhutan" },
  { code: "+591", name: "Bolivia" },
  { code: "+387", name: "Bosnia and Herzegovina" },
  { code: "+267", name: "Botswana" },
  { code: "+55", name: "Brazil" },
  { code: "+673", name: "Brunei" },
  { code: "+359", name: "Bulgaria" },
  { code: "+226", name: "Burkina Faso" },
  { code: "+257", name: "Burundi" },
  { code: "+855", name: "Cambodia" },
  { code: "+237", name: "Cameroon" },
  { code: "+1", name: "Canada" },
  { code: "+238", name: "Cape Verde" },
  { code: "+236", name: "Central African Republic" },
  { code: "+235", name: "Chad" },
  { code: "+56", name: "Chile" },
  { code: "+86", name: "China" },
  { code: "+57", name: "Colombia" },
  { code: "+269", name: "Comoros" },
  { code: "+242", name: "Congo (Brazzaville)" },
  { code: "+243", name: "Congo (Kinshasa)" },
  { code: "+506", name: "Costa Rica" },
  { code: "+225", name: "Côte d'Ivoire" },
  { code: "+385", name: "Croatia" },
  { code: "+53", name: "Cuba" },
  { code: "+357", name: "Cyprus" },
  { code: "+420", name: "Czech Republic" },
  { code: "+45", name: "Denmark" },
  { code: "+253", name: "Djibouti" },
  { code: "+1-767", name: "Dominica" },
  { code: "+1-809, +1-829, +1-849", name: "Dominican Republic" },
  { code: "+593", name: "Ecuador" },
  { code: "+20", name: "Egypt" },
  { code: "+503", name: "El Salvador" },
  { code: "+240", name: "Equatorial Guinea" },
  { code: "+291", name: "Eritrea" },
  { code: "+372", name: "Estonia" },
  { code: "+268", name: "Eswatini" },
  { code: "+251", name: "Ethiopia" },
  { code: "+679", name: "Fiji" },
  { code: "+358", name: "Finland" },
  { code: "+33", name: "France" },
  { code: "+241", name: "Gabon" },
  { code: "+220", name: "Gambia" },
  { code: "+995", name: "Georgia" },
  { code: "+49", name: "Germany" },
  { code: "+233", name: "Ghana" },
  { code: "+30", name: "Greece" },
  { code: "+1-473", name: "Grenada" },
  { code: "+502", name: "Guatemala" },
  { code: "+224", name: "Guinea" },
  { code: "+245", name: "Guinea-Bissau" },
  { code: "+592", name: "Guyana" },
  { code: "+509", name: "Haiti" },
  { code: "+504", name: "Honduras" },
  { code: "+852", name: "Hong Kong" },
  { code: "+36", name: "Hungary" },
  { code: "+354", name: "Iceland" },
  { code: "+91", name: "India" },
  { code: "+62", name: "Indonesia" },
  { code: "+98", name: "Iran" },
  { code: "+964", name: "Iraq" },
  { code: "+353", name: "Ireland" },
  { code: "+972", name: "Israel" },
  { code: "+39", name: "Italy" },
  { code: "+1-876", name: "Jamaica" },
  { code: "+81", name: "Japan" },
  { code: "+962", name: "Jordan" },
  { code: "+7", name: "Kazakhstan" },
  { code: "+254", name: "Kenya" },
  { code: "+686", name: "Kiribati" },
  { code: "+965", name: "Kuwait" },
  { code: "+996", name: "Kyrgyzstan" },
  { code: "+856", name: "Laos" },
  { code: "+371", name: "Latvia" },
  { code: "+961", name: "Lebanon" },
  { code: "+266", name: "Lesotho" },
  { code: "+231", name: "Liberia" },
  { code: "+218", name: "Libya" },
  { code: "+423", name: "Liechtenstein" },
  { code: "+370", name: "Lithuania" },
  { code: "+352", name: "Luxembourg" },
  { code: "+853", name: "Macao" },
  { code: "+261", name: "Madagascar" },
  { code: "+265", name: "Malawi" },
  { code: "+60", name: "Malaysia" },
  { code: "+960", name: "Maldives" },
  { code: "+223", name: "Mali" },
  { code: "+356", name: "Malta" },
  { code: "+692", name: "Marshall Islands" },
  { code: "+222", name: "Mauritania" },
  { code: "+230", name: "Mauritius" },
  { code: "+52", name: "Mexico" },
  { code: "+691", name: "Micronesia" },
  { code: "+373", name: "Moldova" },
  { code: "+377", name: "Monaco" },
  { code: "+976", name: "Mongolia" },
  { code: "+382", name: "Montenegro" },
  { code: "+212", name: "Morocco" },
  { code: "+258", name: "Mozambique" },
  { code: "+95", name: "Myanmar" },
  { code: "+264", name: "Namibia" },
  { code: "+674", name: "Nauru" },
  { code: "+977", name: "Nepal" },
  { code: "+31", name: "Netherlands" },
  { code: "+64", name: "New Zealand" },
  { code: "+505", name: "Nicaragua" },
  { code: "+227", name: "Niger" },
  { code: "+234", name: "Nigeria" },
  { code: "+850", name: "North Korea" },
  { code: "+389", name: "North Macedonia" },
  { code: "+47", name: "Norway" },
  { code: "+968", name: "Oman" },
  { code: "+92", name: "Pakistan" },
  { code: "+680", name: "Palau" },
  { code: "+507", name: "Panama" },
  { code: "+675", name: "Papua New Guinea" },
  { code: "+595", name: "Paraguay" },
  { code: "+51", name: "Peru" },
  { code: "+63", name: "Philippines" },
  { code: "+48", name: "Poland" },
  { code: "+351", name: "Portugal" },
  { code: "+974", name: "Qatar" },
  { code: "+40", name: "Romania" },
  { code: "+7", name: "Russia" },
  { code: "+250", name: "Rwanda" },
  { code: "+1-869", name: "Saint Kitts and Nevis" },
  { code: "+1-758", name: "Saint Lucia" },
  { code: "+1-784", name: "Saint Vincent and the Grenadines" },
  { code: "+685", name: "Samoa" },
  { code: "+378", name: "San Marino" },
  { code: "+239", name: "São Tomé and Príncipe" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+221", name: "Senegal" },
  { code: "+381", name: "Serbia" },
  { code: "+248", name: "Seychelles" },
  { code: "+232", name: "Sierra Leone" },
  { code: "+65", name: "Singapore" },
  { code: "+421", name: "Slovakia" },
  { code: "+386", name: "Slovenia" },
  { code: "+677", name: "Solomon Islands" },
  { code: "+252", name: "Somalia" },
  { code: "+27", name: "South Africa" },
  { code: "+82", name: "South Korea" },
  { code: "+211", name: "South Sudan" },
  { code: "+34", name: "Spain" },
  { code: "+94", name: "Sri Lanka" },
  { code: "+249", name: "Sudan" },
  { code: "+597", name: "Suriname" },
  { code: "+46", name: "Sweden" },
  { code: "+41", name: "Switzerland" },
  { code: "+963", name: "Syria" },
  { code: "+886", name: "Taiwan" },
  { code: "+992", name: "Tajikistan" },
  { code: "+255", name: "Tanzania" },
  { code: "+66", name: "Thailand" },
  { code: "+670", name: "Timor-Leste" },
  { code: "+228", name: "Togo" },
  { code: "+676", name: "Tonga" },
  { code: "+1-868", name: "Trinidad and Tobago" },
  { code: "+216", name: "Tunisia" },
  { code: "+90", name: "Turkey" },
  { code: "+993", name: "Turkmenistan" },
  { code: "+688", name: "Tuvalu" },
  { code: "+256", name: "Uganda" },
  { code: "+380", name: "Ukraine" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+1", name: "United States" },
  { code: "+598", name: "Uruguay" },
  { code: "+998", name: "Uzbekistan" },
  { code: "+678", name: "Vanuatu" },
  { code: "+58", name: "Venezuela" },
  { code: "+84", name: "Vietnam" },
  { code: "+967", name: "Yemen" },
  { code: "+260", name: "Zambia" },
  { code: "+263", name: "Zimbabwe" },
];

function PhoneField() {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        Phone number
      </span>
      <div className="grid grid-cols-[160px_1fr] border border-rule bg-background focus-within:border-accent">
        <select
          name="countryCode"
          defaultValue="+44"
          className="h-12 border-r border-rule bg-background px-3 text-sm text-ink outline-none"
          aria-label="Phone country code"
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} {country.code}
            </option>
          ))}
        </select>
        <input
          name="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="07911 123456"
          className="h-12 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      <span className="text-xs leading-5 text-ink-muted">
        Shopify receives this in international format, for example +447911123456.
      </span>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="h-12 border border-rule bg-background px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
      />
    </label>
  );
}
