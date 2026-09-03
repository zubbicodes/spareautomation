import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { CookieConsent } from "@/components/shopify/CookieConsent";
import { InfoPage } from "@/components/shopify/InfoPage";
import { SiteFooter } from "@/components/shopify/SiteFooter";
import { SiteHeader } from "@/components/shopify/SiteHeader";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { ContentProvider, useContent } from "@/lib/content/ContentContext";
import { getContentEditor } from "@/lib/content/content.functions";
import { isContentKey, renderTemplateText, type ContentBundle } from "@/lib/content/registry";
import { Home } from "@/routes/index";

const VIEWPORTS = {
  desktop: { label: "Desktop", width: "100%" },
  tablet: { label: "Tablet", width: "768px" },
  mobile: { label: "Mobile", width: "390px" },
} as const;

type Viewport = keyof typeof VIEWPORTS;

/** Sample values so email templates can be reviewed exactly as customers see them. */
const EMAIL_SAMPLE = {
  reference: "SA-10482",
  orderNumber: "#1042",
  status: "Approved",
  statusMessage: "Return approved. Collection is booked for Thursday.",
  submissionType: "return request",
  details: "1 x Contactor LC1D18 — wrong part supplied",
};

export const Route = createFileRoute("/admin/content/$key/preview")({
  head: () => ({
    meta: [{ title: "Draft preview" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    raw: search.raw === true || search.raw === "true",
    page: typeof search.page === "string" ? search.page : "",
    width: (["desktop", "tablet", "mobile"] as const).includes(search.width as Viewport)
      ? (search.width as Viewport)
      : ("desktop" as const),
  }),
  loader: async ({ params }) => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    if (!isContentKey(params.key)) throw new Error("Unknown content document");
    return { staff, editor: await getContentEditor({ data: { key: params.key } }) };
  },
  component: PreviewPage,
});

function PreviewPage() {
  const { editor } = Route.useLoaderData();
  const search = Route.useSearch();
  const key = editor.document.key;
  const pageKeys =
    key === "pages" || key === "functional"
      ? Object.keys(editor.previewContent[key] as Record<string, unknown>).sort()
      : [];
  const selectedPage = pageKeys.includes(search.page) ? search.page : (pageKeys[0] ?? "");

  if (search.raw) {
    return (
      <ContentProvider value={editor.previewContent}>
        <PreviewBody contentKey={key} page={selectedPage} />
      </ContentProvider>
    );
  }

  const frameSource = `/admin/content/${key}/preview?raw=true&width=${search.width}${
    selectedPage ? `&page=${encodeURIComponent(selectedPage)}` : ""
  }`;

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="sticky top-0 z-[100] flex flex-wrap items-center gap-3 bg-amber px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal-deep">
        <span>Authenticated draft preview · {editor.document.label}</span>
        {pageKeys.length ? (
          <label className="flex items-center gap-2">
            Page
            <select
              value={selectedPage}
              onChange={(event) => {
                location.search = new URLSearchParams({
                  page: event.target.value,
                  width: search.width,
                }).toString();
              }}
              className="h-7 border border-charcoal-deep/40 bg-white px-2 font-mono text-[10px] uppercase"
            >
              {pageKeys.map((pageKey) => (
                <option key={pageKey} value={pageKey}>
                  {pageKey}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((viewport) => (
            <Link
              key={viewport}
              to="/admin/content/$key/preview"
              params={{ key }}
              search={{ raw: false, page: selectedPage, width: viewport }}
              className={`border px-2 py-1 ${
                search.width === viewport
                  ? "border-charcoal-deep bg-charcoal-deep text-white"
                  : "border-charcoal-deep/40"
              }`}
            >
              {VIEWPORTS[viewport].label}
            </Link>
          ))}
        </span>
      </div>
      <div className="mx-auto flex justify-center bg-charcoal-deep/5 p-4">
        <iframe
          key={frameSource}
          title="Draft preview"
          src={frameSource}
          className="h-[calc(100vh-6rem)] border border-rule bg-background"
          style={{ width: VIEWPORTS[search.width].width, maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}

/** Every group renders through the same components the public website uses. */
function PreviewBody({ contentKey, page }: { contentKey: string; page: string }) {
  const content = useContent();

  if (contentKey === "home" || contentKey === "catalogue" || contentKey === "product") {
    return <Home />;
  }

  if (contentKey === "pages") {
    return <InfoPage contentKey={page as Parameters<typeof InfoPage>[0]["contentKey"]} />;
  }

  if (contentKey === "functional") {
    if (page === "got-a-question" || page === "credit-account") {
      return <InfoPage functionalKey={page} />;
    }
    return <FunctionalPreview page={content.functional[page]} />;
  }

  if (contentKey === "messages") {
    return (
      <div className="min-h-screen bg-background text-ink">
        <SiteHeader />
        <main className="mx-auto grid max-w-4xl gap-6 p-6 md:p-10">
          <section className="border border-rule bg-surface p-6">
            <h1 className="font-display text-2xl font-extrabold uppercase">
              {content.messages["error.notFoundTitle"]}
            </h1>
            <p className="mt-3 text-sm text-ink-muted">{content.messages["error.notFoundCopy"]}</p>
          </section>
          <section className="border border-rule bg-surface p-6">
            <h2 className="font-display text-xl font-bold uppercase">
              {content.messages["error.genericTitle"]}
            </h2>
            <p className="mt-3 text-sm text-ink-muted">{content.messages["error.genericCopy"]}</p>
          </section>
          <section className="grid gap-2 border border-rule bg-surface p-6">
            <h2 className="font-display text-xl font-bold uppercase">Form and interface copy</h2>
            {Object.entries(content.messages).map(([messageKey, value]) => (
              <p key={messageKey} className="grid gap-1 border-b border-rule/60 py-2 last:border-0">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                  {messageKey}
                </span>
                <span className="text-sm">{value}</span>
              </p>
            ))}
          </section>
        </main>
        <CookieConsent />
        <SiteFooter />
      </div>
    );
  }

  if (contentKey === "emails") {
    return (
      <main className="mx-auto grid max-w-3xl gap-6 bg-background p-6 md:p-10">
        <h1 className="font-display text-2xl font-extrabold uppercase">Transactional emails</h1>
        <p className="text-sm text-ink-muted">
          Rendered with sample values. Variables that are not supplied stay visible so missing data
          is obvious.
        </p>
        {Object.entries(content.emails).map(([templateKey, template]) => (
          <article key={templateKey} className="border border-rule bg-surface">
            <header className="border-b border-rule bg-background px-5 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                {templateKey}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {renderTemplateText(template.subject, EMAIL_SAMPLE)}
              </div>
            </header>
            <pre className="whitespace-pre-wrap px-5 py-4 text-sm leading-6">
              {renderTemplateText(template.body, EMAIL_SAMPLE)}
            </pre>
          </article>
        ))}
      </main>
    );
  }

  // site and navigation: the header and footer are the production components.
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto min-h-[45vh] max-w-5xl p-6 md:p-10">
        <h1 className="font-display text-3xl font-extrabold uppercase">Global content preview</h1>
        <p className="mt-4 text-sm text-ink-muted">
          Header, footer and business details render exactly as the public website will show them
          once published.
        </p>
        <dl className="mt-8 grid gap-3">
          {Object.entries(content.site).map(([field, value]) => (
            <div key={field} className="grid grid-cols-[160px_minmax(0,1fr)] gap-3 border-b border-rule/60 py-2">
              <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                {field}
              </dt>
              <dd className="text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </main>
      <SiteFooter />
    </div>
  );
}

function FunctionalPreview({ page }: { page: ContentBundle["functional"][string] }) {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1200px] p-6 md:p-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          {page.eyebrow}
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
          {page.title}
        </h1>
        {page.intro ? <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{page.intro}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Section eyebrow", page.sectionEyebrow],
            ["Section title", page.sectionTitle],
            ["Notice title", page.noticeTitle],
            ["Empty state title", page.emptyTitle],
            ["Empty state copy", page.emptyCopy],
            ["Loading label", page.loadingLabel],
            ["Help copy", page.helpCopy],
            ["Call to action", page.ctaLabel ? `${page.ctaLabel} → ${page.ctaTo}` : ""],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <section key={label} className="border border-rule bg-surface p-5">
                <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                  {label}
                </h2>
                <p className="mt-2 text-sm leading-6">{value}</p>
              </section>
            ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
