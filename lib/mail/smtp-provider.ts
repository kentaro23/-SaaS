import nodemailer from "nodemailer";
import type { MailProvider, SendMailInput, SendMailResult } from "@/lib/mail/types";

export class SmtpMailProvider implements MailProvider {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async send(input: SendMailInput): Promise<SendMailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM ?? "gakkaidaiko@gmail.com",
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { ok: true, providerMessageId: info.messageId };
    } catch (error) {
      return { ok: false, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }
}
