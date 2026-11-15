import nodemailer from "nodemailer";

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !user || !pass || !from || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, secure: process.env.SMTP_SECURE === "true", auth: { user, pass }, from };
}

export function isSmtpConfigured() {
  return Boolean(smtpConfig());
}

export async function sendAuthEmail(to: string, subject: string, text: string, html: string) {
  const config = smtpConfig();
  if (!config) throw new Error("SMTP_NOT_CONFIGURED");
  const transporter = nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure,
    requireTLS: !config.secure, auth: config.auth,
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
  });
  await transporter.sendMail({ from: config.from, to, subject, text, html });
}