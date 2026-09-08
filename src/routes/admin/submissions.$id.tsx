import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileQuestion,
  Mail,
  Paperclip,
  Send,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { CmsShell } from "@/components/admin/CmsShell";
import {
  EmptyState,
  formatBytes,
  formatDateTime,
  formatRelative,
  InitialsAvatar,
  Notice,
  Pill,
  SectionCard,
  Spinner,
  StatusPill,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  addSubmissionNote,
  getAdminSession,
  getAttachmentDownload,
  getSubmissionDetail,
  markSubmissionReviewed,
  setSubmissionStatus,
  syncSubmissionToShopify,
  type SubmissionDetail,
} from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { cn } from "@/lib/utils";

type Status = SubmissionDetail["status"];

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

/** "partNumber" → "Part number", for payload keys with no declared schema. */
function fieldLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function SubmissionDetailPage() {
  const hydrated = useHydrated();
  const { staff, submission: initial } = Route.useLoaderData();
  const [submission, setSubmission] = useState<SubmissionDetail>(initial);
  const [statusBusy, setStatusBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");

  async function changeStatus(status: Status) {
    setStatusBusy(true);
    try {
      const result = await setSubmissionStatus({ data: { id: submission.id, status: status as never } });
      if (result.ok) {
        setSubmission((previous) => ({ ...previous, status }));
        toast.success(`Moved to ${SUBMISSION_STATUS_LABELS[status].toLowerCase()}`);
      }
    } catch {
      toast.error("Could not update the status.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function markReviewed() {
    setStatusBusy(true);
    try {
      const result = await markSubmissionReviewed({ data: { id: submission.id } });
      if (result.ok) {
        setSubmission((previous) => ({
          ...previous,
          reviewedByName: staff.name,
          reviewedAt: new Date().toISOString(),
        }));
        toast.success("Marked as reviewed");
      }
    } catch {
      toast.error("Could not mark this submission as reviewed.");
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
      toast.error("Could not add the note.");
    } finally {
      setNoteBusy(false);
    }
  }

  async function runSync() {
    setSyncBusy(true);
    setSyncError("");
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
      toast.success("Synced to Shopify", { description: "The application is now approved." });
    } catch {
      setSyncError("Could not sync to Shopify.");
    } finally {
      setSyncBusy(false);
    }
  }

  async function viewAttachment(id: number) {
    const result = await getAttachmentDownload({ data: { id } });
    if (!result.ok) {
      toast.error(result.error);
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
      breadcrumbs={[{ label: "Submissions", to: "/admin/submissions" }]}
      title={submission.reference ?? `Submission #${submission.id}`}
      subtitle={`${SUBMISSION_TYPE_LABELS[submission.type] ?? submission.type} · received ${formatRelative(submission.createdAt)}`}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${submission.contactEmail}`}>
              <Mail /> Reply by email
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/submissions" search={SUBMISSION_SEARCH}>
              <ArrowLeft /> Inbox
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4">
          <SectionCard
            title="Contact"
            action={<StatusPill status={submission.status} />}
          >
            <dl className="divide-y">
              <DetailRow label="Name">{submission.contactName ?? "—"}</DetailRow>
              <DetailRow label="Email">
                <a
                  href={`mailto:${submission.contactEmail}`}
                  className="text-primary hover:underline"
                >
                  {submission.contactEmail}
                </a>
              </DetailRow>
              <DetailRow label="Company">{submission.company ?? "—"}</DetailRow>
              <DetailRow label="Reference">
                <span className="font-mono text-[12px]">{submission.reference ?? "—"}</span>
              </DetailRow>
              <DetailRow label="Received">{formatDateTime(submission.createdAt)}</DetailRow>
              <DetailRow label="Reviewed by">
                {submission.reviewedByName ? (
                  <span className="flex items-center gap-2">
                    <InitialsAvatar
                      name={submission.reviewedByName}
                      className="size-5 text-[9px]"
                    />
                    {submission.reviewedByName}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not reviewed yet</span>
                )}
              </DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Captured fields">
            {payloadEntries.length === 0 ? (
              <EmptyState
                icon={<FileQuestion />}
                title="No additional fields captured"
                className="m-4 border-0"
              />
            ) : (
              <dl className="divide-y">
                {payloadEntries.map(([key, value]) => (
                  <DetailRow key={key} label={fieldLabel(key)}>
                    <span className="whitespace-pre-wrap">{String(value)}</span>
                  </DetailRow>
                ))}
              </dl>
            )}
          </SectionCard>

          <SectionCard
            title="Attachments"
            action={<Pill tone="neutral">{submission.attachments.length}</Pill>}
          >
            {submission.attachments.length === 0 ? (
              <EmptyState icon={<Paperclip />} title="No files attached" className="m-4 border-0" />
            ) : (
              <ul className="divide-y">
                {submission.attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Paperclip
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.mime} · {formatBytes(attachment.size)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void viewAttachment(attachment.id)}>
                      {attachment.mime.startsWith("image/") ? (
                        <>
                          <Eye /> View
                        </>
                      ) : (
                        <>
                          <Download /> Download
                        </>
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Internal notes" description="Visible to staff only.">
            <form onSubmit={addNote} className="space-y-2 border-b p-4">
              <Textarea
                name="body"
                rows={3}
                placeholder="What did you find out, or what happens next?"
                aria-label="Internal note"
              />
              <Button type="submit" size="sm" disabled={noteBusy || !hydrated}>
                {noteBusy ? <Spinner /> : <Send />} Add note
              </Button>
            </form>
            {submission.notes.length === 0 ? (
              <EmptyState
                icon={<Send />}
                title="No notes yet"
                copy="Notes keep the team's context with the enquiry."
                className="m-4 border-0"
              />
            ) : (
              <ul className="divide-y">
                {submission.notes.map((note) => (
                  <li key={note.id} className="flex gap-3 px-4 py-3">
                    <InitialsAvatar name={note.staffName ?? "Staff"} className="size-6 text-[10px]" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2 text-[13px]">
                        <span className="font-medium">{note.staffName ?? "Staff"}</span>
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={note.createdAt}
                          title={formatDateTime(note.createdAt)}
                        >
                          {formatRelative(note.createdAt)}
                        </time>
                      </p>
                      <p className="mt-1 text-[13px] whitespace-pre-wrap">{note.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-18 lg:self-start">
          <SectionCard title="Status">
            <div className="space-y-1 p-2">
              {(Object.keys(SUBMISSION_STATUS_LABELS) as Status[]).map((status) => {
                const current = submission.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={statusBusy || current}
                    onClick={() => void changeStatus(status)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:cursor-default",
                      current
                        ? "bg-primary/10 font-medium text-primary"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {current ? (
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}
                    {SUBMISSION_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
            {submission.reviewedAt ? null : (
              <div className="border-t p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={statusBusy}
                  onClick={() => void markReviewed()}
                >
                  Mark reviewed
                </Button>
              </div>
            )}
          </SectionCard>

          {submission.type === "credit_account" ? (
            <SectionCard title="Shopify">
              <div className="space-y-3 p-3.5">
                {submission.shopifySyncedAt ? (
                  <Notice tone="success" title="Customer created">
                    Synced on {formatDateTime(submission.shopifySyncedAt)}.
                  </Notice>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Create a tagged Shopify customer from this approved application. Orders and
                      invoicing stay in Shopify.
                    </p>
                    {syncError ? <Notice tone="danger">{syncError}</Notice> : null}
                    <Button size="sm" className="w-full" disabled={syncBusy} onClick={() => void runSync()}>
                      {syncBusy ? <Spinner /> : <CheckCircle2 />}
                      {syncBusy ? "Syncing" : "Approve and sync"}
                    </Button>
                  </>
                )}
              </div>
            </SectionCard>
          ) : null}
        </aside>
      </div>
    </CmsShell>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-3 px-4 py-2.5">
      <dt className="w-32 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px]">{children}</dd>
    </div>
  );
}
