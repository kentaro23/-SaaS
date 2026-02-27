import { ConsoleMailProvider } from "@/lib/mail/console-provider";
import { GmailApiMailProvider } from "@/lib/mail/gmail-api-provider";
import { SmtpMailProvider } from "@/lib/mail/smtp-provider";
import type { MailProvider, SmtpRuntimeConfig } from "@/lib/mail/types";

export function getMailProvider(config?: {
  mode?: string | null;
  smtp?: SmtpRuntimeConfig;
}): MailProvider {
  const mode = config?.mode ?? process.env.MAIL_PROVIDER ?? "console";
  if (mode === "smtp") {
    return new SmtpMailProvider(config?.smtp);
  }
  if (mode === "gmail_api") {
    return new GmailApiMailProvider();
  }
  return new ConsoleMailProvider();
}
