import type { MailProvider, SendMailInput, SendMailResult } from "@/lib/mail/types";

export class ConsoleMailProvider implements MailProvider {
  async send(input: SendMailInput): Promise<SendMailResult> {
    console.log("[MAIL:CONSOLE]", input);
    return { ok: true, providerMessageId: `console-${Date.now()}` };
  }
}
