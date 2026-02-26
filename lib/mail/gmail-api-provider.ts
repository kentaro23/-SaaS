import type { MailProvider, SendMailInput, SendMailResult } from "@/lib/mail/types";

// Placeholder for future Gmail API integration.
// Expected flow: OAuth token refresh -> Gmail users.messages.send -> persist provider ids/thread ids.
export class GmailApiMailProvider implements MailProvider {
  async send(input: SendMailInput): Promise<SendMailResult> {
    console.warn("Gmail API provider stub called", { to: input.to, subject: input.subject });
    return {
      ok: false,
      errorMessage: "Gmail API provider is not implemented yet. Use MAIL_PROVIDER=smtp or console.",
    };
  }
}
