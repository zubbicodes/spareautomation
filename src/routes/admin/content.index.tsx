import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { getContentIndex } from "@/lib/content/content.functions";

export const Route = createFileRoute("/admin/content/")({
  head: () => ({ meta: [{ title: "Content | Spares Automation CMS" }, { name: "robots", content: "noindex, nofollow" }] }),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, documents: await getContentIndex() };
  },
  component: ContentIndex,
});

function ContentIndex() {
  const { staff, documents } = Route.useLoaderData();
  const groups = documents.reduce((result, document) => {
    const items = result.get(document.group) ?? [];
    items.push(document);
    result.set(document.group, items);
    return result;
  }, new Map<string, typeof documents>());
  return <AdminShell staff={staff} title="Website content" eyebrow="Content management">
    <p className="mb-6 max-w-3xl text-sm leading-6 text-ink-muted">Edit safe structured content, save a draft, preview it, then ask an administrator to publish. Shopify product and order data is not changed here.</p>
    <div className="grid gap-7">{[...groups].map(([group, items]) => <section key={group}>
      <h2 className="mb-3 font-display text-lg font-bold uppercase">{group}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Link key={item.key} to="/admin/content/$key" params={{ key: item.key }} className="border border-rule bg-surface p-5 transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-3"><h3 className="font-display font-bold uppercase">{item.label}</h3><span className={`border px-2 py-1 font-mono text-[8px] uppercase ${item.hasUnpublishedChanges ? "border-amber text-amber" : "border-rule text-ink-muted"}`}>{item.hasUnpublishedChanges ? "Draft changes" : "Published"}</span></div>
        <p className="mt-3 text-xs text-ink-muted">Draft v{item.draftVersion} · Live v{item.publishedVersion}</p>
        <p className="mt-1 text-xs text-ink-muted">Last edited {item.updatedAt ? new Date(item.updatedAt).toLocaleString("en-GB") : "from compiled defaults"}{item.updatedBy ? ` by ${item.updatedBy}` : ""}</p>
      </Link>)}</div>
    </section>)}</div>
  </AdminShell>;
}
