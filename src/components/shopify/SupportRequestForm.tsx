import { CheckCircle2, FileText, Paperclip, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  submitSupportRequest,
  uploadSupportQuestionAttachment,
} from "@/lib/api/cms.functions";
import { useContent } from "@/lib/content/ContentContext";
import { useHydrated } from "@/hooks/use-hydrated";

type RequestKind = "tracking" | "resources" | "question" | "unsubscribe";

const QUESTION_ATTACHMENT_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
].join(",");
const QUESTION_ATTACHMENT_TYPES = new Set(QUESTION_ATTACHMENT_ACCEPT.split(","));
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_TOTAL_BYTES = 25 * 1024 * 1024;

/** Email subjects and payload field names stay code-owned; wording comes from the CMS. */
const COPY: Record<RequestKind, { subject: string; reference: string }> = {
  tracking: { subject: "Order tracking request", reference: "Order number" },
  resources: { subject: "Product resource request", reference: "Part or product number" },
  question: { subject: "Product question", reference: "Part or product details" },
  unsubscribe: { subject: "Unsubscribe request", reference: "Email address" },
};

export function SupportRequestForm({ kind }: { kind: RequestKind }) {
  const { messages } = useContent();
  const hydrated = useHydrated();
  const copy = COPY[kind];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [uploadWarning, setUploadWarning] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);
    setBusy(true);
    setError("");
    setUploadWarning("");

    if (files.length > MAX_ATTACHMENT_COUNT) {
      setError(`Attach no more than ${MAX_ATTACHMENT_COUNT} files.`);
      setBusy(false);
      return;
    }
    if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
      setError("Each attachment must be 10 MB or smaller.");
      setBusy(false);
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_TOTAL_BYTES) {
      setError("The combined attachment size must be 25 MB or smaller.");
      setBusy(false);
      return;
    }
    if (files.some((file) => !QUESTION_ATTACHMENT_TYPES.has(file.type))) {
      setError("Use an image, PDF, Word, Excel, PowerPoint, TXT, or CSV file.");
      setBusy(false);
      return;
    }

    try {
      const result = await submitSupportRequest({
        data: {
          kind,
          reference: String(data.get("reference") ?? ""),
          email: String(data.get("email") ?? ""),
          details: String(data.get("details") ?? ""),
          website: String(data.get("website") ?? ""),
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const failedUploads: string[] = [];
      for (const file of files) {
        try {
          const uploadData = new FormData();
          uploadData.set("reference", result.reference);
          uploadData.set("attachment", file);
          const upload = await uploadSupportQuestionAttachment({ data: uploadData });
          if (!upload.ok) failedUploads.push(`${file.name}: ${upload.error ?? "upload failed"}`);
        } catch {
          failedUploads.push(`${file.name}: upload failed`);
        }
      }
      if (failedUploads.length) {
        setUploadWarning(
          `Your question was received, but ${failedUploads.length} ${
            failedUploads.length === 1 ? "attachment" : "attachments"
          } could not be uploaded. ${failedUploads.join(" ")}`,
        );
      }
      setReference(result.reference);
      setAttachmentNames([]);
      form.reset();
    } catch {
      setError("We could not send your request. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={`${kind}-form-title`} className="border-t border-rule bg-charcoal-deep py-10 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h2 id={`${kind}-form-title`} className="font-display text-2xl font-bold uppercase tracking-tight">{messages[`support.${kind}.title`]}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{messages["support.intro"]}</p>

        {reference ? (
          <div role="status" className="mt-6 border border-accent/40 bg-accent/10 p-5 text-sm leading-6 text-white">
            <CheckCircle2 aria-hidden="true" className="mr-2 inline h-5 w-5 text-accent" />
            {messages["support.successBeforeReference"]}{" "}
            <strong className="font-semibold">{reference}</strong>.{" "}
            {messages["support.successAfterReference"]}
            {uploadWarning ? (
              <span className="mt-3 block border border-amber/50 bg-amber/10 p-3 text-amber-100">
                {uploadWarning}
              </span>
            ) : null}
          </div>
        ) : (
          <form method="post" onSubmit={submit} className="relative mt-6 grid gap-4 md:grid-cols-2">
            <label className="absolute -left-[9999px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
              {messages[`support.${kind}.referenceLabel`]}
              <input name="reference" required className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <label className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
              {messages["support.emailLabel"]}
              <input name="email" type="email" required className="h-12 min-w-0 border border-white/25 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>
            <label className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80 md:col-span-2">
              {messages[`support.${kind}.detailsLabel`]}
              <textarea name="details" rows={4} required={kind !== "unsubscribe"} className="min-w-0 resize-y border border-white/25 bg-white/10 px-4 py-3 font-sans text-sm normal-case tracking-normal text-white focus:border-accent focus:outline-none" />
            </label>

            {kind === "question" ? (
              <div className="grid gap-2 md:col-span-2">
                <label htmlFor="question-attachments" className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
                  {messages["support.attachmentsLabel"]}
                </label>
                <div className="border border-dashed border-white/30 bg-white/[0.06] p-4 transition-colors focus-within:border-accent">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/15 text-accent">
                      <Paperclip aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <input
                        id="question-attachments"
                        name="attachments"
                        type="file"
                        multiple
                        accept={QUESTION_ATTACHMENT_ACCEPT}
                        onChange={(event) =>
                          setAttachmentNames(
                            Array.from(event.currentTarget.files ?? []).map((file) => file.name),
                          )
                        }
                        className="w-full text-sm text-white/80 file:mr-3 file:border-0 file:bg-accent file:px-4 file:py-2 file:font-mono file:text-[10px] file:font-bold file:uppercase file:tracking-[0.14em] file:text-white hover:file:brightness-110"
                      />
                      <p className="mt-2 font-sans text-xs normal-case tracking-normal text-white/50">
                        {messages["support.attachmentsHelp"]}
                      </p>
                    </div>
                  </div>
                  {attachmentNames.length ? (
                    <ul className="mt-4 grid gap-2 border-t border-white/15 pt-3 sm:grid-cols-2">
                      {attachmentNames.map((name) => (
                        <li key={name} className="flex min-w-0 items-center gap-2 text-xs text-white/75">
                          <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                          <span className="truncate">{name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ) : null}

            {error ? (
              <div role="alert" className="border border-red-400/40 bg-red-500/10 p-4 text-sm leading-6 text-red-200 md:col-span-2">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={busy || !hydrated} className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit">
              <Send aria-hidden="true" className="h-4 w-4" />{" "}
              {busy ? messages["support.sending"] : messages["support.submit"]}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
