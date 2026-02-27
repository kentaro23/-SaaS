import { z } from "zod";

export const societySchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  contactEmail: z.string().email(),
  billingEmail: z.string().email(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const societyPlanSchema = z.object({
  planName: z.string().min(1),
  electionSupport: z.coerce.boolean().default(false),
  shipmentSupport: z.coerce.boolean().default(false),
  committeeSupport: z.coerce.boolean().default(false),
  accountingSupport: z.coerce.boolean().default(false),
  monthlyFee: z.coerce.number().int().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const memberSchema = z.object({
  memberNo: z.string().min(1),
  name: z.string().min(1),
  kana: z.string().optional().nullable(),
  affiliation: z.string().min(1),
  address: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  memberType: z.string().min(1),
  position: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  joinedAt: z.coerce.date(),
  leftAt: z.coerce.date().optional().nullable(),
});

export const annualInvoiceGenerateSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  amount: z.coerce.number().int().positive(),
  dueDate: z.coerce.date(),
});

export const invoiceUpdateSchema = z.object({
  status: z.enum(["DRAFT", "APPROVED", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
  paymentMethod: z.enum(["BANK_TRANSFER", "CARD", "OTHER"]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const emailTemplateSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const societyMailSettingSchema = z.object({
  mailProvider: z.enum(["smtp", "gmail_api", "console"]),
  mailFrom: z.string().email().optional().or(z.literal("")).nullable(),
  smtpHost: z.string().optional().or(z.literal("")).nullable(),
  smtpPort: z.coerce.number().int().positive().optional().nullable(),
  smtpSecure: z.coerce.boolean().optional().default(false),
  smtpUser: z.string().optional().or(z.literal("")).nullable(),
  smtpPass: z.string().optional().or(z.literal("")).nullable(),
  gmailSender: z.string().email().optional().or(z.literal("")).nullable(),
});

export const emailApprovalCreateSchema = z.object({
  title: z.string().min(1),
  templateKey: z.string().min(1),
  fiscalYear: z.coerce.number().int().optional().nullable(),
  invoiceStatus: z.string().optional().nullable(),
  overdueOnly: z.coerce.boolean().optional().default(false),
});

export const meetingSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["BOARD", "COMMITTEE", "OTHER"]),
  scheduledAt: z.coerce.date(),
  location: z.string().optional().nullable(),
  onlineUrl: z.string().url().optional().or(z.literal("")).nullable(),
  agenda: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "DONE"]),
});

export const attendanceSchema = z.object({
  memberId: z.string().optional().nullable(),
  externalName: z.string().optional().nullable(),
  status: z.enum(["YES", "NO", "MAYBE"]),
  note: z.string().optional().nullable(),
});

export const meetingDocumentSchema = z.object({
  title: z.string().min(1),
  version: z.coerce.number().int().min(1),
  fileUrl: z.string().min(1),
});

export const minutesSchema = z.object({
  minutesText: z.string().min(1),
});

export const taskSchema = z.object({
  title: z.string().min(1),
  assignee: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  status: z.enum(["OPEN", "DONE"]),
});

export const decisionSchema = z.object({
  title: z.string().min(1),
  detail: z.string().optional().nullable(),
  decidedBy: z.string().optional().nullable(),
  decidedAt: z.coerce.date(),
});

export const archiveSchema = z.object({
  category: z.enum(["JOURNAL", "NOTICE", "OTHER"]),
  title: z.string().min(1),
  issueNo: z.string().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  fileUrl: z.string().min(1),
  tags: z.string().optional().default(""),
  note: z.string().optional().nullable(),
});

export const shipmentBatchSchema = z.object({
  type: z.enum(["JOURNAL", "NOTICE"]),
  title: z.string().optional().nullable(),
});
