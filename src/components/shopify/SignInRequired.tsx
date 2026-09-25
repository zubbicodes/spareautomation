import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";

export function SignInRequired({
  redirect,
  title = "Sign in to continue",
  description,
}: {
  redirect: "/track-order" | "/returns";
  title?: string;
  description: string;
}) {
  return (
    <section className="border border-rule bg-surface p-5 md:p-8">
      <User aria-hidden="true" className="mb-4 h-7 w-7 text-accent md:h-8 md:w-8" />
      <h2 className="font-display text-xl font-bold uppercase tracking-tight md:text-2xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:mt-4">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
        <Link
          to="/login"
          search={{ redirect }}
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center border border-rule px-5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Register
        </Link>
      </div>
    </section>
  );
}
