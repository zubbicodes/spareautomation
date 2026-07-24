import nodemailer from "nodemailer";

import { getServerConfig } from "./config.server";

export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain-text body. */
  text: string;
  /** Optional HTML body. */
  html?: string;
  replyTo?: string;
};

type SmtpTransport = ReturnType<typeof nodemailer.createTransport>;

let transporter: SmtpTransport | undefined;

function getSmtpTransport(): SmtpTransport | undefined {
  const config = getServerConfig();
  if (!config.smtpHost) return undefined;
  if (!transporter) {
    const port = Number(config.smtpPort ?? 587);
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port,
      secure: port === 465,
      auth: config.smtpUser
        ? { user: config.smtpUser, pass: config.smtpPass }
        : undefined,
    });
  }
  return transporter;
}

async function sendWithResend(apiKey: string, message: EmailMessage, from: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend rejected the email (${response.status}): ${body}`);
  }
}

/**
 * Send a transactional email. Prefers Resend when RESEND_API_KEY is set,
 * otherwise falls back to SMTP/nodemailer. NEVER throws — email failures must
 * not break a form submission; they are logged and reported via the return value.
 *
 * Returns true when the email was handed to a provider, false when skipped
 * (no provider configured) or failed.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const config = getServerConfig();

  try {
    if (config.resendApiKey) {
      await sendWithResend(config.resendApiKey, message, config.mailFrom);
      return true;
    }

    const smtp = getSmtpTransport();
    if (smtp) {
      await smtp.sendMail({
        from: config.mailFrom,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
      });
      return true;
    }

    console.warn(`[notify] No email provider configured. Skipping: "${message.subject}"`);
    return false;
  } catch (error) {
    console.error(`[notify] Failed to send "${message.subject}":`, error);
    return false;
  }
}

/** Convenience wrapper to notify the sales desk of a new submission. */
export async function notifySalesDesk(input: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<boolean> {
  const config = getServerConfig();
  return sendEmail({ ...input, to: config.salesDeskEmail });
}
