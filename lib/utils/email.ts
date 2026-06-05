import nodemailer from "nodemailer";

/**
 * Send a transactional email via the Gmail SMTP credentials provisioned for
 * Tokoflow. No-op + logs when env vars are missing (Phase 0 reality where
 * production env may not have these populated yet).
 *
 * Use sparingly — Gmail SMTP has a soft cap of ~500/day. For new-order
 * notifications this is fine (Phase 1 target ~50 orders/merchant/month).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return { ok: false, reason: "smtp_not_configured" };
  }
  if (!opts.to || !opts.to.includes("@")) {
    return { ok: false, reason: "invalid_recipient" };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `Tokoflow <${user}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      ...(opts.html ? { html: opts.html } : {}),
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, reason: "send_failed" };
  }
}
