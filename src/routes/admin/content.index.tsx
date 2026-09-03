import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ExternalLink, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import { EmptyState, formatRelative, Notice } from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { getContentIndex } from "@/lib/content/content.functions";

export const Route = createFileRoute("/admin/content/")({
  head: () => cmsHead("Content"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    return { staff, documents: await getContentIndex() };
  },
  component: ContentIndexPage,
});

function ContentIndexPage() {
  const { staff, documents } = Route.useLoaderData();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? documents.filter(
          (document) =>
            document.label.toLowerCase().includes(needle) ||
            document.group.toLowerCase().includes(needle) ||
            document.key.toLowerCase().includes(needle),
        )
      : documents;
    return [...matched.reduce((result, document) => {
      const items = result.get(document.group) ?? [];
      items.push(document);
      result.set(document.group, items);
      return result;
    }, new Map<string, typeof documents>())];
  }, [documents, query]);

  const pending = documents.filter((document) => document.hasUnpublishedChanges).length;

  return (
    <CmsShell
      staff={staff}
      eyebrow="Website content"
      title="Content documents"
      subtitle="Every piece of editable wording on the website, grouped by area. Edit a draft, preview it, then publish — Shopify products, prices and orders are never changed here."
      breadcrumbs={[]}
      actions={
        <a href="/" target="_blank" rel="noreferrer" className="cms-btn">
          <ExternalLink aria-hidden="true" /> View website
        </a>
      }
    >
      {pending ? (
        <div style={{ marginBottom: 14 }}>
          <Notice tone="warning">
            {pending} document{pending === 1 ? "" : "s"} have unpublished draft changes. An
            administrator must publish them before visitors see the update.
          </Notice>
        </div>
      ) : null}

      <div className="cms-card cms-toolbar" style={{ marginBottom: 16 }}>
        <label className="cms-field cms-field-grow">
          <span className="cms-label">Find a document</span>
          <span className="cms-search">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, area or key"
              aria-label="Search content documents"
            />
          </span>
        </label>
        <span className="cms-badge">{documents.length} documents</span>
      </div>

      {groups.length === 0 ? (
        <section className="cms-card">
          <EmptyState
            icon={<FileText aria-hidden="true" />}
            title="No documents match that search"
            copy="Clear the search to see every content area again."
          />
        </section>
      ) : (
        <div className="cms-stack">
          {groups.map(([group, items]) => (
            <section key={group}>
              <h2
                className="cms-eyebrow"
                style={{ color: "var(--cms-text-muted)", marginBottom: 8 }}
              >
                {group}
              </h2>
              <div className="cms-grid cms-grid-cards">
                {items.map((item) => (
                  <Link
                    key={item.key}
                    to="/admin/content/$key"
                    params={{ key: item.key }}
                    className="cms-card cms-card-pad"
                    style={{ display: "grid", gap: 10, alignContent: "start" }}
                  >
                    <span className="cms-row-inline" style={{ alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ marginLeft: "auto" }}>
                        {item.hasUnpublishedChanges ? (
                          <span className="cms-badge cms-badge-warning">Draft changes</span>
                        ) : (
                          <span className="cms-badge cms-badge-success">Published</span>
                        )}
                      </span>
                    </span>
                    <span className="cms-faint" style={{ fontSize: 12 }}>
                      Draft v{item.draftVersion} · Live v{item.publishedVersion}
                    </span>
                    <span className="cms-faint" style={{ fontSize: 12 }}>
                      Edited {formatRelative(item.updatedAt)}
                      {item.updatedBy ? ` by ${item.updatedBy}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </CmsShell>
  );
}
