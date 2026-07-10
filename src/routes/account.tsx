import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, PackageSearch, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/shopify/SiteHeader";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import {
  getShopifyCustomer,
  logoutShopifyCustomer,
} from "@/lib/api/shopify.functions";

type StorefrontCustomer = Awaited<ReturnType<typeof getShopifyCustomer>>;

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Customer Account | Spares Automation" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AccountPage,
});

function AccountPage() {
  const [storefrontCustomer, setStorefrontCustomer] = useState<StorefrontCustomer>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        setStorefrontCustomer(await getShopifyCustomer());
      } catch {
        setError("We could not load your account. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  async function handleLogout() {
    await logoutShopifyCustomer();
    window.location.href = "/";
  }

  const displayName =
    storefrontCustomer?.displayName ||
    storefrontCustomer?.firstName ||
    "Customer Account";
  const email = storefrontCustomer?.email;

  const isLoggedIn = Boolean(storefrontCustomer);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 md:mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Customer Account
          </div>
          <h1 className="mt-2 font-display text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight">
            Account
          </h1>
        </div>

        {error ? <div role="alert" className="mb-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
        {loading ? (
          <div className="border border-rule bg-surface px-4 py-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted md:px-8 md:py-16">
            Loading account
          </div>
        ) : !isLoggedIn ? (
          <section className="border border-rule bg-surface p-5 md:p-8">
            <User className="mb-4 md:mb-5 h-7 w-7 md:h-8 md:w-8 text-accent" />
            <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight">
              Sign in to view your trade account
            </h2>
            <p className="mt-3 md:mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Sign in securely to view your account details and continue to the catalogue.
            </p>
            <Link
              to="/login"
              className="mt-6 md:mt-8 inline-flex h-11 items-center justify-center bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Sign in
            </Link>
          </section>
        ) : (
          <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_360px]">
            <section className="border border-rule bg-surface p-5 md:p-8">
              <div className="mb-4 md:mb-6 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center bg-accent text-accent-foreground">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight">
                {displayName}
              </h2>
              {email && (
                <p className="mt-2 md:mt-3 text-sm text-ink-muted">
                  {email}
                </p>
              )}
              {storefrontCustomer?.phone && (
                <p className="mt-2 text-sm text-ink-muted">
                  {storefrontCustomer.phone}
                </p>
              )}
            </section>

            <aside className="space-y-3 md:space-y-4">
              <Link
                to="/products"
                search={{ category: "all", q: "", availability: "all", sort: "newest" }}
                className="flex items-center justify-between border border-rule bg-surface p-4 md:p-5 text-sm font-semibold uppercase tracking-[0.08em] transition-colors hover:border-accent hover:text-accent"
              >
                Browse catalogue <PackageSearch className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-between border border-rule bg-surface p-4 md:p-5 text-sm font-semibold uppercase tracking-[0.08em] transition-colors hover:border-accent hover:text-accent"
              >
                Sign out <LogOut className="h-3 w-3 md:h-4 md:w-4" />
              </button>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
