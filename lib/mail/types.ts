export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SmtpRuntimeConfig = {
  host?: string | null;
  port?: number | null;
  secure?: boolean | null;
  user?: string | null;
  pass?: string | null;
  from?: string | null;
};

export type SendMailResult = {
  ok: boolean;
  providerMessageId?: string;
  errorMessage?: string;
};

export interface MailProvider {
  send(input: SendMailInput): Promise<SendMailResult>;
}
