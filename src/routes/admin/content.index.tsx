import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ExternalLink, FileText, Loader2, Pencil, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  ChipSelect,
  EmptyState,
  FootBar,
  formatRelative,
  KebabMenu,
  Notice,
  SearchField,
} from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { getContentIndex, publishDraft } from "@/lib/content/content.functions";

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
  const loaded = Route.useLoaderData();
  const [documents, setDocuments] = useState(loaded.documents);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [state, setState] = useState("all");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const groups = useMemo(
    () => [...new Set(loaded.documents.map((document) => document.group))],
    [loaded.documents],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return documents.filter((document) => {
      if (group !== "all" && document.group !== group) return false;
      if (state === "draft" && !document.hasUnpublishedChanges) return false;
      if (state === "published" && document.hasUnpublishedChanges) return false;
      if (!needle) return true;
      return (
        document.label.toLowerCase().includes(needle) ||
        document.group.toLowerCase().includes(needle) ||
        document.key.toLowerCase().includes(needle)
      );
    });
  }, [documents, query, group, state]);

  const pending = documents.filter((document) => document.hasUnpublishedChanges).length;

  async function publish(key: string, label: string) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const result = await publishDraft({ data: { key } });
      if (!result.ok) {
        setError(`${label}: ${result.error}`);
        return;
      }
      setDocuments(await getContentIndex());
      setNotice(`${label} published to the live website.`);
    } catch {
      setError(`${label} could not be published.`);
    } finally {
      setBusy("");
    }
  }

  return (
    <CmsShell
      staff={loaded.staff}
      eyebrow="Website content"
      title="Content"
      subtitle="Every piece of editable wording on the website. Edit a draft, preview it, then publish — Shopify products, prices and orders are never changed here."
      actions={
        <a href="/" target="_blank" rel="noreferrer" className="cms-btn">
          <ExternalLink aria-hidden="true" /> View website
        </a>
      }
    >
      {pending ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="warning">
            {pending} document{pending === 1 ? "" : "s"} have unpublished draft changes.
          </Notice>
        </div>
      ) : null}
      {notice ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <div className="cms-filters">
        <ChipSelect
          label="Area"
          value={group}
          options={[
            { value: "all", label: "All areas" },
            ...groups.map((value) => ({ value, label: value })),
          ]}
          onChange={setGroup}
        />
        <ChipSelect
          label="Publish state"
          value={state}
          options={[
            { value: "all", label: "All states" },
            { value: "draft", label: "Draft changes" },
            { value: "published", label: "Published" },
          ]}
          onChange={setState}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search content documents"
          placeholder="Search documents…"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileText aria-hidden="true" />}
          title="No documents match these filters"
          copy="Clear the filters to see every content area again."
        />
      ) : (
        <>
          <div className="cms-list">
            {visible.map((item) => (
              <div
                key={item.key}
                className="cms-row"
                style={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ["--cms-row-columns" as any]: "minmax(0, 1fr) minmax(0, 210px) 120px 118px 40px",
                }}
              >
                <span className="cms-row-main">
                  <Link
                    to="/admin/content/$key"
                    params={{ key: item.key }}
                    className="cms-row-title"
                  >
                    {item.label}
                  </Link>
                  <span className="cms-row-meta">
                    Draft v{item.draftVersion} · Live v{item.publishedVersion}
                  </span>
                </span>
                <span className="cms-row-person">
                  <span>{item.group}</span>
                </span>
                <span className="cms-row-date">
                  {item.updatedAt ? formatRelative(item.updatedAt) : "—"}
                </span>
                <span>
                  {item.hasUnpublishedChanges ? (
                    <span className="cms-badge cms-badge-warning">Draft changes</span>
                  ) : (
                    <span className="cms-badge cms-badge-success">Published</span>
                  )}
                </span>
                <span className="cms-row-actions">
                  {busy === item.key ? (
                    <Loader2 aria-hidden="true" className="cms-spin" style={{ width: 15, height: 15 }} />
                  ) : (
                    <KebabMenu label={`Actions for ${item.label}`}>
                      {(close) => (
                        <>
                          <Link
                            to="/admin/content/$key"
                            params={{ key: item.key }}
                            role="menuitem"
                            onClick={close}
                          >
                            <Pencil aria-hidden="true" /> Edit content
                          </Link>
                          <Link
                            to="/admin/content/$key/preview"
                            params={{ key: item.key }}
                            search={{ raw: false, page: "", width: "desktop" as const }}
                            target="_blank"
                            role="menuitem"
                            onClick={close}
                          >
                            <ExternalLink aria-hidden="true" /> Preview draft
                          </Link>
                          {loaded.staff.role === "admin" ? (
                            <>
                              <div className="cms-menu-sep" />
                              <button
                                type="button"
                                role="menuitem"
                                disabled={!item.hasUnpublishedChanges}
                                onClick={() => {
                                  close();
                                  void publish(item.key, item.label);
                                }}
                              >
                                <Send aria-hidden="true" /> Publish draft
                              </button>
                            </>
                          ) : null}
                        </>
                      )}
                    </KebabMenu>
                  )}
                </span>
              </div>
            ))}
          </div>
          <FootBar
            shown={visible.length}
            total={documents.length}
            page={1}
            pageCount={1}
            noun="documents"
            onChange={() => undefined}
          />
        </>
      )}
    </CmsShell>
  );
}
