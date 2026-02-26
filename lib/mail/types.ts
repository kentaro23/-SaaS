export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  ok: boolean;
  providerMessageId?: string;
  errorMessage?: string;
};

export interface MailProvider {
  send(input: SendMailInput): Promise<SendMailResult>;
}
