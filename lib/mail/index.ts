import { ConsoleMailProvider } from "@/lib/mail/console-provider";
import { GmailApiMailProvider } from "@/lib/mail/gmail-api-provider";
import { SmtpMailProvider } from "@/lib/mail/smtp-provider";
import type { MailProvider } from "@/lib/mail/types";

let instance: MailProvider | null = null;

export function getMailProvider(): MailProvider {
  if (instance) return instance;
  const mode = process.env.MAIL_PROVIDER ?? "console";
  if (mode === "smtp") {
    instance = new SmtpMailProvider();
    return instance;
  }
  if (mode === "gmail_api") {
    instance = new GmailApiMailProvider();
    return instance;
  }
  instance = new ConsoleMailProvider();
  return instance;
}
