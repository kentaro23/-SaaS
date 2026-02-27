import nodemailer from "nodemailer";
import type { MailProvider, SendMailInput, SendMailResult, SmtpRuntimeConfig } from "@/lib/mail/types";

export class SmtpMailProvider implements MailProvider {
  private fromAddress: string;
  private transporter: nodemailer.Transporter;

  constructor(config?: SmtpRuntimeConfig) {
    const host = config?.host || process.env.SMTP_HOST;
    const port = config?.port ?? Number(process.env.SMTP_PORT ?? 587);
    const secure = config?.secure ?? (process.env.SMTP_SECURE === "true");
    const user = config?.user || process.env.SMTP_USER;
    const pass = config?.pass || process.env.SMTP_PASS;
    this.fromAddress = config?.from || process.env.MAIL_FROM || "gakkaidaiko@gmail.com";
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
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
