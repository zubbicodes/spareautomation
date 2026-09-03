import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Send,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatDateTime,
  Notice,
  StatusBadge,
  SUBMISSION_TYPE_LABELS,
} from "@/components/admin/cms-ui";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  addSubmissionNote,
  getAttachmentDownload,
  getAdminSession,
  getSubmissionDetail,
  markSubmissionReviewed,
  setSubmissionStatus,
  syncSubmissionToShopify,
  type SubmissionDetail,
} from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
] as const;

const SUBMISSION_SEARCH = { type: "all", status: "all", search: "", page: 1 } as const;

export const Route = createFileRoute("/admin/submissions/$id")({
  head: () => cmsHead("Submission"),
  loader: async ({ params }) => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    const result = await getSubmissionDetail({ data: { id: Number(params.id) } });
    if (!result.ok) throw redirect({ to: "/admin/submissions", search: SUBMISSION_SEARCH });
    return { staff, submission: result.submission };
  },
  component: SubmissionDetailPage,
});

function SubmissionDetailPage() {
  const hydrated = useHydrated();
  const { staff, submission: initial } = Route.useLoaderData();
  const [submission, setSubmission] = useState<SubmissionDetail>(initial);
  const [statusBusy, setStatusBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [notice, setNotice] = useState("");

  async function changeStatus(status: (typeof STATUS_OPTIONS)[number]["value"]) {
    setStatusBusy(true);
    setNotice("");
    try {
      const result = await setSubmissionStatus({ data: { id: submission.id, status } });
      if (result.ok) {
        setSubmission((previous) => ({ ...previous, status }));
        setNotice(`Status updated to ${status.replace("_", " ")}.`);
      }
    } catch {
      setNotice("Could not update status.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function markReviewed() {
    setStatusBusy(true);
    setNotice("");
    try {
      const result = await markSubmissionReviewed({ data: { id: submission.id } });
      if (result.ok) {
        setSubmission((previous) => ({
          ...previous,
          reviewedByName: staff.name,
          reviewedAt: new Date().toISOString(),
        }));
        setNotice("Submission marked as reviewed.");
      }
    } catch {
      setNotice("Could not mark this submission as reviewed.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setNoteBusy(true);
    setNotice("");
    try {
      const result = await addSubmissionNote({ data: { submissionId: submission.id, body } });
      if (result.ok) {
        setSubmission((previous) => ({
          ...previous,
          notes: [
            { id: Date.now(), body, staffName: staff.name, createdAt: new Date().toISOString() },
            ...previous.notes,
          ],
        }));
        form.reset();
      }
    } catch {
      setNotice("Could not add note.");
    } finally {
      setNoteBusy(false);
    }
  }

  async function runSync() {
    setSyncBusy(true);
    setSyncError("");
    setNotice("");
    try {
      const result = await syncSubmissionToShopify({ data: { id: submission.id } });
      if (!result.ok) {
        setSyncError(result.error);
        return;
      }
      setSubmission((previous) => ({
        ...previous,
        status: "approved",
        shopifyCustomerId: result.shopifyCustomerId,
        shopifySyncedAt: result.syncedAt,
      }));
      setNotice("Synced to Shopify and marked approved.");
    } catch {
      setSyncError("Could not sync to Shopify.");
    } finally {
      setSyncBusy(false);
    }
  }

  async function viewAttachment(id: number) {
    const result = await getAttachmentDownload({ data: { id } });
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    if (!result.mime.startsWith("image/")) {
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    const win = window.open();
    if (win) {
      win.document.title = result.filename;
      const image = win.document.createElement("img");
      image.src = result.dataUrl;
      image.alt = result.filename;
      image.style.maxWidth = "100%";
      win.document.body.appendChild(image);
    }
  }

  const payloadEntries = Object.entries(submission.payload).filter(
    ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
  );

  return (
    <CmsShell
      staff={staff}
      eyebrow={SUBMISSION_TYPE_LABELS[submission.type] ?? submission.type}
      title={submission.reference ?? `Submission #${submission.id}`}
      breadcrumbs={[{ label: "Submissions", to: "/admin/submissions" }]}
      actions={
        <Link to="/admin/submissions" search={SUBMISSION_SEARCH} className="cms-btn">
          <ArrowLeft aria-hidden="true" /> Back to inbox
        </Link>
      }
    >
      {notice ? (
        <div style={{ marginBottom: 14 }}>
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}

      <div className="cms-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div
          className="cms-grid"
          style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 320px)", alignItems: "start" }}
        >
          <div className="cms-stack">
            <section className="cms-card">
              <header className="cms-card-head">
                <h2 className="cms-card-title">Submission details</h2>
                <span style={{ marginLeft: "auto" }}>
                  <StatusBadge status={submission.status} />
                </span>
              </header>
              <div className="cms-card-pad">
                <dl className="cms-kv">
                  <dt>Contact name</dt>
                  <dd>{submission.contactName ?? "—"}</dd>
                  <dt>Contact email</dt>
                  <dd>
                    <a className="cms-link" href={`mailto:${submission.contactEmail}`}>
                      {submission.contactEmail}
                    </a>
                  </dd>
                  <dt>Company</dt>
                  <dd>{submission.company ?? "—"}</dd>
                  <dt>Reference</dt>
                  <dd className="cms-mono">{submission.reference ?? "—"}</dd>
                  <dt>Received</dt>
                  <dd>{formatDateTime(submission.createdAt)}</dd>
                  <dt>Reviewed by</dt>
                  <dd>{submission.reviewedByName ?? "Not reviewed yet"}</dd>
                </dl>
              </div>
            </section>

            <section className="cms-card">
              <header className="cms-card-head">
                <h2 className="cms-card-title">Captured fields</h2>
              </header>
              {payloadEntries.length === 0 ? (
                <EmptyState icon={<ImageIcon aria-hidden="true" />} title="No additional fields captured" />
              ) : (
                <div className="cms-card-pad">
                  <dl className="cms-kv">
                    {payloadEntries.map(([key, value]) => (
                      <div key={key} style={{ display: "contents" }}>
                        <dt>{key}</dt>
                        <dd style={{ whiteSpace: "pre-wrap" }}>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>

            <section className="cms-card">
              <header className="cms-card-head">
                <h2 className="cms-card-title">Attachments</h2>
                <span className="cms-badge" style={{ marginLeft: "auto" }}>
                  {submission.attachments.length}
                </span>
              </header>
              {submission.attachments.length === 0 ? (
                <EmptyState icon={<ImageIcon aria-hidden="true" />} title="No files attached" />
              ) : (
                <div className="cms-list">
                  {submission.attachments.map((attachment) => (
                    <div key={attachment.id} className="cms-row">
                      <span className="cms-row-main">
                        <span className="cms-row-title">{attachment.filename}</span>
                        <span className="cms-row-meta">
                          {attachment.mime} · {Math.max(1, Math.round(attachment.size / 1024))} KB
                        </span>
                      </span>
                      <span className="cms-row-actions">
                        <button
                          type="button"
                          onClick={() => void viewAttachment(attachment.id)}
                          className="cms-btn cms-btn-sm"
                        >
                          {attachment.mime.startsWith("image/") ? (
                            <>
                              <Eye aria-hidden="true" /> View
                            </>
                          ) : (
                            <>
                              <Download aria-hidden="true" /> Download
                            </>
                          )}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="cms-card">
              <header className="cms-card-head">
                <h2 className="cms-card-title">Internal notes</h2>
              </header>
              <div className="cms-card-pad cms-stack-sm">
                <form method="post" onSubmit={addNote} className="cms-stack-sm">
                  <textarea
                    name="body"
                    rows={3}
                    className="cms-textarea"
                    placeholder="Add an internal note (visible to staff only)"
                  />
                  <div>
                    <button
                      disabled={noteBusy || !hydrated}
                      className="cms-btn cms-btn-primary"
                    >
                      {noteBusy ? (
                        <Loader2 aria-hidden="true" className="cms-spin" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}{" "}
                      Add note
                    </button>
                  </div>
                </form>
              </div>
              {submission.notes.length === 0 ? (
                <EmptyState icon={<Send aria-hidden="true" />} title="No notes yet" />
              ) : (
                <div className="cms-list">
                  {submission.notes.map((note) => (
                    <div key={note.id} className="cms-row" style={{ alignItems: "flex-start" }}>
                      <span className="cms-row-main">
                        <span className="cms-row-title">{note.staffName ?? "Staff"}</span>
                        <span className="cms-row-meta">{formatDateTime(note.createdAt)}</span>
                        <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{note.body}</p>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="cms-stack">
            <section className="cms-card">
              <header className="cms-card-head">
                <h2 className="cms-card-title">Workflow</h2>
              </header>
              <div className="cms-card-pad cms-stack-sm">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={statusBusy || submission.status === option.value}
                    onClick={() => void changeStatus(option.value)}
                    className={`cms-btn${submission.status === option.value ? " cms-btn-primary" : ""}`}
                    style={{ justifyContent: "flex-start" }}
                  >
                    {submission.status === option.value ? (
                      <CheckCircle2 aria-hidden="true" />
                    ) : (
                      <span style={{ width: 15 }} />
                    )}
                    {option.label}
                  </button>
                ))}
                {!submission.reviewedAt ? (
                  <button
                    type="button"
                    disabled={statusBusy}
                    onClick={() => void markReviewed()}
                    className="cms-btn"
                  >
                    Mark reviewed
                  </button>
                ) : null}
              </div>
            </section>

            {submission.type === "credit_account" ? (
              <section className="cms-card">
                <header className="cms-card-head">
                  <h2 className="cms-card-title">Shopify sync</h2>
                </header>
                <div className="cms-card-pad cms-stack-sm">
                  {submission.shopifySyncedAt ? (
                    <Notice tone="success">
                      Synced to Shopify customer on {formatDateTime(submission.shopifySyncedAt)}.
                    </Notice>
                  ) : (
                    <>
                      <p className="cms-muted">
                        Create a tagged Shopify customer from this approved application. Orders and
                        invoicing stay in Shopify.
                      </p>
                      {syncError ? <Notice tone="danger">{syncError}</Notice> : null}
                      <button
                        type="button"
                        disabled={syncBusy}
                        onClick={() => void runSync()}
                        className="cms-btn cms-btn-primary"
                      >
                        {syncBusy ? (
                          <Loader2 aria-hidden="true" className="cms-spin" />
                        ) : (
                          <CheckCircle2 aria-hidden="true" />
                        )}
                        {syncBusy ? "Syncing" : "Approve & sync to Shopify"}
                      </button>
                    </>
                  )}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </CmsShell>
  );
}
