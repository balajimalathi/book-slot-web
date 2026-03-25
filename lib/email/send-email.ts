import nodemailer from "nodemailer";

import { env } from "@/env";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "Missing SMTP env vars. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM."
    );
  }

  const port = SMTP_PORT ?? 587;
  const secure = port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const transport = getTransporter();

  await transport.sendMail({
    from: env.SMTP_FROM!,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationEmail(
  {
    user,
    url,
  }: {
    user: { email: string | null };
    url: string;
    token?: string;
  },
  _request: unknown
) {
  const to = user.email;
  if (!to) throw new Error("sendVerificationEmail: user email is missing.");

  // Avoid awaiting where BetterAuth supports it (timing attack mitigation),
  // but still keep this helper async for a consistent interface.
  await sendEmail({
    to,
    subject: "Verify your email address",
    text: `Click the link to verify your email: ${url}`,
  });
}

export async function sendResetPasswordEmail(
  {
    user,
    url,
  }: {
    user: { email: string | null };
    url: string;
    token?: string;
  },
  _request: unknown
) {
  const to = user.email;
  if (!to) throw new Error("sendResetPasswordEmail: user email is missing.");

  await sendEmail({
    to,
    subject: "Reset your password",
    text: `Click the link to reset your password: ${url}`,
  });
}

