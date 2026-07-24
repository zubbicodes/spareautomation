import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
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

const TYPE_LABELS: Record<string, string> = {
  part_inquiry: "Part inquiry",
  trade_account: "Trade account",
  credit_account: "Credit account",
  support_tracking: "Order tracking",
  support_resources: "Resource request",
  support_question: "Product question",
  unsubscribe: "Unsubscribe",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
] as const;

export const Route = createFileRoute("/admin/submissions/$id")({
  head: () => ({
    meta: [{ title: "Submission | Spares Automation Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  loader: async ({ params }) => {
    const staff = await getAdminSession();
    if (!staff) {
      throw redirect({ to: "/admin/login" });
    }
    const result = await getSubmissionDetail({ data: { id: Number(params.id) } });
    if (!result.ok) {
      throw redirect({ to: "/admin", search: { type: "all", status: "all", search: "", page: 1 } });
    }
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
        setSubmission((prev) => ({ ...prev, status }));
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
        setSubmission((prev) => ({
          ...prev,
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
        setSubmission((prev) => ({
          ...prev,
          notes: [
            { id: Date.now(), body, staffName: staff.name, createdAt: new Date().toISOString() },
            ...prev.notes,
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

  const payloadEntries = Object.entries(submission.payload).filter(
    ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
  );

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
      setSubmission((prev) => ({
        ...prev,
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
    if (result.ok) {
      const win = window.open();
      if (win) {
        win.document.title = result.filename;
        const image = win.document.createElement("img");
        image.src = result.dataUrl;
        image.alt = result.filename;
        image.style.maxWidth = "100%";
        win.document.body.appendChild(image);
      }
    } else {
      setNotice(result.error);
    }
  }

  return (
    <AdminShell staff={staff} title={submission.reference ?? `Submission #${submission.id}`} eyebrow={TYPE_LABELS[submission.type] ?? submission.type}>
      <Link to="/admin" search={{ type: "all", status: "all", search: "", page: 1 }} className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back to submissions
      </Link>

      {notice ? (
        <div role="status" className="mb-5 border border-accent/40 bg-accent/10 p-3 text-sm text-ink">{notice}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="border border-rule bg-surface p-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">Submission details</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <DetailRow label="Contact name" value={submission.contactName} />
              <DetailRow label="Contact email" value={submission.contactEmail} />
              <DetailRow label="Company" value={submission.company} />
              <DetailRow label="Reference" value={submission.reference} />
              <DetailRow
                label="Received"
                value={new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(submission.createdAt))}
              />
              <DetailRow label="Reviewed by" value={submission.reviewedByName} />
            </dl>
          </section>

          <section className="border border-rule bg-surface p-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">Captured fields</h2>
            {payloadEntries.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No additional fields were captured.</p>
            ) : (
              <dl className="mt-4 divide-y divide-rule">
                {payloadEntries.map(([key, value]) => (
                  <div key={key} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">{key}</dt>
                    <dd className="whitespace-pre-wrap text-sm text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="border border-rule bg-surface p-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">Attachments</h2>
            {submission.attachments.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No files attached.</p>
            ) : (
              <ul className="mt-4 divide-y divide-rule">
                {submission.attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <ImageIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{attachment.filename}</span>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                          {attachment.mime} · {Math.max(1, Math.round(attachment.size / 1024))} KB
                        </span>
                      </span>
                    </span>
                    <button
                      onClick={() => void viewAttachment(attachment.id)}
                      className="inline-flex h-9 shrink-0 items-center border border-rule px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:border-accent hover:text-accent"
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-rule bg-surface p-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">Notes</h2>
            <form method="post" onSubmit={addNote} className="mt-4 grid gap-3">
              <textarea
                name="body"
                rows={3}
                placeholder="Add an internal note (visible to staff only)"
                className="resize-y border border-rule bg-background px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
              <div>
                <button
                  disabled={noteBusy || !hydrated}
                  className="inline-flex h-10 items-center gap-2 bg-accent px-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110 disabled:opacity-60"
                >
                  {noteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add note
                </button>
              </div>
            </form>

            <div className="mt-5 space-y-3">
              {submission.notes.length === 0 ? (
                <p className="text-sm text-ink-muted">No notes yet.</p>
              ) : (
                submission.notes.map((note) => (
                  <div key={note.id} className="border border-rule bg-background p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                        {note.staffName ?? "Staff"}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                        {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(note.createdAt))}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{note.body}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="border border-rule bg-surface p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-tight">Status</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Current: <span className="font-semibold text-ink">{submission.status.replace("_", " ")}</span>
            </p>
            <div className="mt-4 grid gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  disabled={statusBusy || submission.status === option.value}
                  onClick={() => void changeStatus(option.value)}
                  className={`inline-flex h-10 items-center justify-center border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed ${
                    submission.status === option.value
                      ? "border-accent bg-accent text-white"
                      : "border-rule bg-background text-ink hover:border-accent hover:text-accent disabled:opacity-40"
                  }`}
                >
                  {submission.status === option.value ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                  {option.label}
                </button>
              ))}
              {!submission.reviewedAt ? (
                <button
                  disabled={statusBusy}
                  onClick={() => void markReviewed()}
                  className="inline-flex h-10 items-center justify-center border border-rule bg-background px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  Mark reviewed
                </button>
              ) : null}
            </div>
          </section>

          {(submission.type === "trade_account" || submission.type === "credit_account") && (
            <section className="border border-rule bg-surface p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight">Shopify sync</h2>
              {submission.shopifySyncedAt ? (
                <p className="mt-2 text-sm text-ink-muted">
                  Synced to Shopify customer on{" "}
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(submission.shopifySyncedAt))}.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-ink-muted">
                    Create a tagged Shopify customer from this approved application. Orders and invoicing stay in Shopify.
                  </p>
                  {syncError ? (
                    <div role="alert" className="mt-3 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{syncError}</div>
                  ) : null}
                  <button
                    disabled={syncBusy}
                    onClick={() => void runSync()}
                    className="mt-4 inline-flex h-10 items-center gap-2 bg-accent px-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:brightness-110 disabled:opacity-60"
                  >
                    {syncBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {syncBusy ? "Syncing" : "Approve & sync to Shopify"}
                  </button>
                </>
              )}
            </section>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value ?? "—"}</dd>
    </div>
  );
}
