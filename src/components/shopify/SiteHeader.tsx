import { Link } from "@tanstack/react-router";
import { Globe, Menu, Phone, Search, ShoppingCart, User, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getShopifyCart, getShopifyCustomer } from "@/lib/api/shopify.functions";
import { getStoredCartId } from "@/lib/shopify/cart";
import { SITE } from "@/lib/site";

const navigation = [
  { label: "All products", to: "/products" },
  { label: "Asphalt", to: "/asphalt" },
  { label: "Concrete", to: "/concrete" },
  { label: "Packing", to: "/packing" },
  { label: "Automation", to: "/automation" },
  { label: "Resources", to: "/resources" },
  { label: "Contact", to: "/contact-us" },
] as const;

export function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [customer, setCustomer] = useState<Awaited<ReturnType<typeof getShopifyCustomer>>>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    let mounted = true;
    async function refreshCartCount() {
      const cartId = getStoredCartId();
      if (!cartId) return setCartCount(0);
      try {
        const cart = await getShopifyCart({ data: { cartId } });
        if (mounted) setCartCount(cart?.totalQuantity ?? 0);
      } catch {
        if (mounted) setCartCount(0);
      }
    }
    async function checkAuth() {
      try {
        const nextCustomer = await getShopifyCustomer();
        if (mounted) setCustomer(nextCustomer);
      } catch {
        if (mounted) setCustomer(null);
      }
    }
    void Promise.all([refreshCartCount(), checkAuth()]);
    window.addEventListener("shopify-cart-updated", refreshCartCount);
    return () => {
      mounted = false;
      window.removeEventListener("shopify-cart-updated", refreshCartCount);
    };
  }, []);

  const accountLabel = customer?.firstName || customer?.displayName || "Account";

  return (
    <header className="sticky top-0 z-50 min-w-0">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 bg-accent px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      <div className="bg-charcoal-deep text-white/80">
        <div className="flex min-h-9 w-full min-w-0 items-center justify-between gap-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] md:px-6 md:text-[11px] md:tracking-[0.18em]">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <span className="flex shrink-0 items-center gap-2">
              <Globe aria-hidden="true" className="h-3 w-3 text-accent" /> UK / EN-GB / GBP
            </span>
            <a href={`tel:${SITE.phoneHref}`} className="hidden min-h-7 items-center gap-2 text-white/70 hover:text-white md:flex">
              <Phone aria-hidden="true" className="h-3 w-3" /> {SITE.phoneDisplay}
            </a>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <AccountLinks customer={customer} accountLabel={accountLabel} />
            <CartLink count={cartCount} />
          </div>

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <CartLink count={cartCount} />
            <button
              type="button"
              disabled={!hydrated}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              className="flex h-9 w-9 items-center justify-center text-white/80 hover:text-white disabled:opacity-60"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-[oklch(0.285_0.012_250)]">
        <div className="grid w-full min-w-0 grid-cols-1 items-center gap-4 px-4 py-4 md:grid-cols-12 md:gap-6 md:px-6">
          <Link to="/" className="mx-auto flex items-center gap-3 md:col-span-3 md:mx-0">
            <BrandMark />
          </Link>
          <div className="min-w-0 md:col-span-9">
            <form action="/search" role="search" className="group flex h-12 min-w-0 items-center border border-white/25 bg-white/[0.08] pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-within:border-accent focus-within:bg-white/[0.11]">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
              <label htmlFor="site-search" className="sr-only">Search products or part number</label>
              <input id="site-search" name="q" type="search" placeholder="Search products or part number" className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[12px] tracking-wide text-white placeholder:text-white/70 focus:outline-none md:text-[13px]" />
              <button type="submit" aria-label="Search products" className="flex h-10 shrink-0 items-center bg-accent px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white hover:brightness-110 sm:px-5 md:px-6 md:text-[11px] md:tracking-[0.22em]">
                <span className="hidden sm:inline">Search</span><Search aria-hidden="true" className="h-4 w-4 sm:hidden" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <nav aria-label="Main navigation" className="hidden border-b border-white/10 bg-charcoal-deep md:block">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 px-4 md:px-6">
          {navigation.map((item) => (
            <Link key={item.to} to={item.to} activeProps={{ "aria-current": "page", className: "text-white bg-white/10" }} className="inline-flex min-h-10 items-center px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/65 transition-colors hover:bg-white/5 hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {mobileMenuOpen ? (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-b border-white/10 bg-charcoal-deep px-4 py-4 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {navigation.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center border border-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/75 hover:border-accent hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-white/10 pt-3"><AccountLinks customer={customer} accountLabel={accountLabel} mobile /></div>
        </nav>
      ) : null}
    </header>
  );
}

function BrandMark() {
  return <><span aria-hidden="true" className="relative h-9 w-9 shrink-0"><span className="absolute inset-0 rotate-45 border-2 border-accent" /><span className="absolute inset-[6px] rotate-45 bg-accent" /></span><span className="whitespace-nowrap font-display text-[15px] font-bold uppercase tracking-tight text-white sm:text-[17px]">SPARES<span className="text-accent">.</span>AUTOMATION</span></>;
}

function CartLink({ count }: { count: number }) {
  return <Link to="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`} className="flex h-9 min-w-9 items-center justify-center gap-1 text-white/75 hover:text-white"><ShoppingCart aria-hidden="true" className="h-4 w-4" />{count > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-[9px] font-bold text-white">{count}</span> : null}</Link>;
}

function AccountLinks({ customer, accountLabel, mobile = false }: { customer: Awaited<ReturnType<typeof getShopifyCustomer>>; accountLabel: string; mobile?: boolean }) {
  const className = mobile ? "flex min-h-11 items-center gap-2 text-sm text-white/75 hover:text-white" : "flex min-h-7 items-center gap-1.5 text-white/75 hover:text-white";
  if (customer) return <Link to="/account" className={className}><User aria-hidden="true" className="h-4 w-4" />{accountLabel}</Link>;
  return <div className={mobile ? "grid grid-cols-2 gap-2" : "flex items-center gap-5"}><Link to="/login" className={className}><User aria-hidden="true" className="h-4 w-4" />Sign in</Link><Link to="/register" className={className}><UserPlus aria-hidden="true" className="h-4 w-4" />Register</Link></div>;
}
