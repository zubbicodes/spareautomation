import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, User } from "lucide-react";
import { useState, type FormEvent } from "react";

import { SiteHeader } from "@/components/shopify/SiteHeader";
import { loginShopifyCustomer } from "@/lib/api/shopify.functions";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In | Spares Automation" }, { name: "robots", content: "noindex, follow" }] }),
  component: LoginPage,
});

type LoginResult = {
  status: "idle" | "success" | "error";
  message: string;
};

function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LoginResult>({ status: "idle", message: "" });
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setResult({ status: "idle", message: "" });

    const form = new FormData(formElement);

    try {
      const response = await loginShopifyCustomer({
        data: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
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
        message: "You have successfully signed in!",
      });
      
      setTimeout(() => navigate({ to: "/account" }), 1000);
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not sign you in.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main id="main-content" className="mx-auto grid max-w-[1180px] gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:px-6 lg:py-12">
        <section className="flex min-h-[400px] md:min-h-[520px] flex-col justify-between border border-rule bg-charcoal p-6 text-white md:p-8 lg:p-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <div className="mt-12 md:mt-16 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              Trade Customer Access
            </div>
            <h1 className="mt-4 font-display text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase leading-none tracking-tight">
              Sign In
            </h1>
            <p className="mt-4 md:mt-6 max-w-md text-sm leading-7 text-white/55">
              Sign in directly to your Spares Automation account.
            </p>
          </div>
        </section>

        <section className="border border-rule bg-surface p-5 md:p-6 lg:p-8">
          <div className="mb-8 flex h-12 w-12 items-center justify-center bg-accent text-accent-foreground">
            <User className="h-5 w-5" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Secure Sign In
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight">
            Existing Customer
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <Field label="Email address" name="email" type="email" autoComplete="email" required />
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              showStrength={false}
              required
            />

            {result.message ? (
              <div
                role={result.status === "error" ? "alert" : "status"}
                aria-live="polite"
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
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              Sign In
            </button>

            <p className="text-sm text-ink-muted">
              <Link to="/forgot-password" className="font-semibold text-ink transition-colors hover:text-accent">Forgot your password?</Link>
            </p>
            <p className="text-sm text-ink-muted">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-ink transition-colors hover:text-accent">
                Register
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
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

function PasswordField({
  label,
  name,
  autoComplete,
  minLength,
  showStrength = true,
  required,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  showStrength?: boolean;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const calculateStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = calculateStrength(password);

  const getStrengthColor = (s: number) => {
    if (s === 0) return "bg-gray-300";
    if (s === 1) return "bg-red-500";
    if (s === 2) return "bg-orange-500";
    if (s === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = (s: number) => {
    if (s === 0) return "";
    if (s === 1) return "Weak";
    if (s === 2) return "Fair";
    if (s === 3) return "Good";
    return "Strong";
  };

  return (
    <label className="grid gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </span>
      <div className="relative border border-rule bg-background focus-within:border-accent">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-full bg-transparent px-4 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {showStrength && (
        <div className="mt-1">
          <div className="flex gap-1 h-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i < strength ? getStrengthColor(strength) : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            {getStrengthLabel(strength)}
          </div>
        </div>
      )}
    </label>
  );
}
