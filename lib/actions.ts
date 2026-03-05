"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSocietyAdminRepo } from "@/lib/repositories/society-admin-repo";
import { createTenantRepo } from "@/lib/repositories/tenant-repo";
import { requireOwnerUser, requireUser, requireSocietyAccess } from "@/lib/session";
import { getMailProvider } from "@/lib/mail";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import { getUploadBaseDir, ensureDir } from "@/lib/files";
import { parseMemberCsvRows } from "@/lib/member-import";
import { buildMemberAddress, buildMemberFullName } from "@/lib/utils";
import {
  archiveSchema,
  annualInvoiceGenerateSchema,
  attendanceSchema,
  decisionSchema,
  emailApprovalCreateSchema,
  emailTemplateSchema,
  invoiceReminderUpdateSchema,
  invoiceUpdateSchema,
  meetingDocumentSchema,
  meetingSchema,
  memberSchema,
  minutesSchema,
  publicMemberFormSchema,
  publicMemberRegistrationSchema,
  shipmentBatchSchema,
  societyMailSettingSchema,
  societyPlanSchema,
  societySchema,
  taskSchema,
} from "@/lib/validators/forms";

function formDataToObject(formData: FormData) {
  const obj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    if (obj[key]) {
      obj[key] = Array.isArray(obj[key]) ? [...obj[key], value] : [obj[key], value];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

function boolVal(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function nullableText(v: unknown) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function nextPublicMemberNo(societyId: string) {
  const prefix = `WEB${new Date().getFullYear()}`;
  for (let i = 0; i < 20; i += 1) {
    const seq = Math.floor(Math.random() * 900000 + 100000);
    const memberNo = `${prefix}-${seq}`;
    const exists = await prisma.member.findUnique({
      where: { societyId_memberNo: { societyId, memberNo } },
      select: { id: true },
    });
    if (!exists) return memberNo;
  }
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

function ensureMailSettingsForSend(settings: {
  mailProvider?: string | null;
  mailFrom?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
}) {
  if (!settings.mailProvider) throw new Error("メール送信プロバイダが未設定です");
  if (settings.mailProvider === "smtp") {
    if (!settings.mailFrom) throw new Error("送信元アドレス（From）が未設定です");
    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
      throw new Error("SMTP設定が不足しています（Host/Port/User/Password）");
    }
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  await signIn("credentials", { email, password, redirectTo });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createSocietyAction(formData: FormData) {
  const user = await requireUser();
  const parsed = societySchema.parse(formDataToObject(formData));
  const repo = createSocietyAdminRepo(user.id);
  await repo.createSociety({
    ...parsed,
    feeSystem: nullableText(parsed.feeSystem),
    committeeFrequency: nullableText(parsed.committeeFrequency),
    liaisonName: nullableText(parsed.liaisonName),
    liaisonEmail: nullableText(parsed.liaisonEmail),
    liaisonPhone: nullableText(parsed.liaisonPhone),
  });
  revalidatePath("/admin/societies");
  redirect("/admin/societies");
}

export async function updateSocietyAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const parsed = societySchema.parse(formDataToObject(formData));
  const repo = createSocietyAdminRepo(user.id);
  await repo.updateSociety(id, {
    ...parsed,
    feeSystem: nullableText(parsed.feeSystem),
    committeeFrequency: nullableText(parsed.committeeFrequency),
    liaisonName: nullableText(parsed.liaisonName),
    liaisonEmail: nullableText(parsed.liaisonEmail),
    liaisonPhone: nullableText(parsed.liaisonPhone),
  });
  revalidatePath(`/admin/societies/${id}`);
  revalidatePath("/admin/societies");
}

export async function assignSocietyStaffAdminAction(formData: FormData) {
  const user = await requireUser();
  const societyId = String(formData.get("societyId"));
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as any;
  const repo = createSocietyAdminRepo(user.id);
  await repo.assignStaff(societyId, userId, role);
  revalidatePath(`/admin/societies/${societyId}`);
}

export async function removeSocietyStaffAdminAction(formData: FormData) {
  const user = await requireUser();
  const societyId = String(formData.get("societyId"));
  const userId = String(formData.get("userId"));
  const repo = createSocietyAdminRepo(user.id);
  await repo.removeStaff(societyId, userId);
  revalidatePath(`/admin/societies/${societyId}`);
}

export async function savePlanAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "ADMIN");
  const parsed = societyPlanSchema.parse({
    ...formDataToObject(formData),
    electionSupport: boolVal(formData, "electionSupport"),
    shipmentSupport: boolVal(formData, "shipmentSupport"),
    committeeSupport: boolVal(formData, "committeeSupport"),
    accountingSupport: boolVal(formData, "accountingSupport"),
  });
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.upsertPlan(parsed);
  revalidatePath(`/t/${societyId}/settings/plan`);
}

export async function saveSocietyStaffAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "ADMIN");
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as any;
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.assignSocietyStaff(userId, role);
  revalidatePath(`/t/${societyId}/settings/members`);
}

export async function saveSocietyMailSettingsAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "ADMIN");
  const parsed = societyMailSettingSchema.parse({
    ...formDataToObject(formData),
    smtpSecure: boolVal(formData, "smtpSecure"),
  });
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.updateSocietyMailSettings(parsed as any);
  revalidatePath(`/t/${societyId}/settings/mail`);
}

export async function sendMailSettingsTestAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "ADMIN");
  const testTo = String(formData.get("testTo") ?? "").trim();
  if (!testTo) throw new Error("テスト送信先メールアドレスを入力してください");

  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  const mailSettings = await repo.getSocietyMailSettings();
  ensureMailSettingsForSend(mailSettings ?? {});

  const provider = getMailProvider({
    mode: mailSettings?.mailProvider,
    smtp: {
      from: mailSettings?.mailFrom,
      host: mailSettings?.smtpHost,
      port: mailSettings?.smtpPort,
      secure: mailSettings?.smtpSecure,
      user: mailSettings?.smtpUser,
      pass: mailSettings?.smtpPass,
    },
  });
  const result = await provider.send({
    to: testTo,
    subject: `[学会事務局OS] メール送信設定テスト (${societyId})`,
    text: `このメールは送信設定テストです。\n送信日時: ${new Date().toISOString()}\nsocietyId: ${societyId}`,
  });
  if (!result.ok) throw new Error(result.errorMessage ?? "テスト送信に失敗しました");
  redirect(`/t/${societyId}/settings/mail?mailTest=ok`);
}

export async function saveMemberAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const id = formData.get("id") ? String(formData.get("id")) : undefined;
  const parsed = memberSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.upsertMember({
    id,
    societyId,
    ...parsed,
    name: buildMemberFullName(parsed.familyName, parsed.givenName),
    address: buildMemberAddress(parsed),
    kana: parsed.kana.trim(),
  } as any);
  revalidatePath(`/t/${societyId}/members`);
  if (id) revalidatePath(`/t/${societyId}/members/${id}`);
}

export async function importMembersCsvAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const file = formData.get("csvFile");
  if (!(file instanceof File)) throw new Error("CSVファイルを選択してください");

  const text = await file.text();
  const { rows, skipped } = parseMemberCsvRows(text);
  const repo = createTenantRepo({ societyId, actorUserId: user.id });

  let created = 0;
  let updated = 0;
  let skippedTotal = skipped;

  for (const row of rows) {
    const existing = await repo.findMemberByNo(row.memberNo);
    await repo.upsertMember({
      id: existing?.id,
      societyId,
      memberNo: row.memberNo,
      familyName: row.familyName,
      givenName: row.givenName,
      name: row.name,
      kana: row.kana,
      affiliation: row.affiliation,
      postalCode: row.postalCode,
      prefecture: row.prefecture,
      city: row.city,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2 ?? null,
      address: row.address,
      email: row.email,
      phone: row.phone ?? null,
      memberType: row.memberType,
      position: row.position ?? null,
      status: row.status,
      joinedAt: row.joinedAt,
      leftAt: row.leftAt ?? null,
    } as any);
    if (existing) updated += 1;
    else created += 1;
  }

  revalidatePath(`/t/${societyId}/members`);
  redirect(
    `/t/${societyId}/members?importCreated=${created}&importUpdated=${updated}&importSkipped=${skippedTotal}`,
  );
}

export async function savePublicMemberFormAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = publicMemberFormSchema.parse({
    ...formDataToObject(formData),
    enabled: boolVal(formData, "enabled"),
    allowMemberTypeInput: boolVal(formData, "allowMemberTypeInput"),
  });
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  try {
    await repo.upsertPublicMemberForm({
      slug: parsed.slug.trim().toLowerCase(),
      enabled: parsed.enabled,
      title: parsed.title.trim(),
      description: nullableText(parsed.description),
      defaultMemberType: parsed.defaultMemberType.trim(),
      allowMemberTypeInput: parsed.allowMemberTypeInput,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      redirect(`/t/${societyId}/members?publicFormError=slug`);
    }
    throw error;
  }
  revalidatePath(`/t/${societyId}/members`);
  revalidatePath(`/join/${parsed.slug.trim().toLowerCase()}`);
  redirect(`/t/${societyId}/members?publicFormSaved=1`);
}

export async function submitPublicMemberRegistrationAction(slug: string, formData: FormData) {
  const form = await prisma.publicMemberForm.findUnique({
    where: { slug },
    select: {
      slug: true,
      enabled: true,
      societyId: true,
      defaultMemberType: true,
      allowMemberTypeInput: true,
    },
  });
  if (!form || !form.enabled) {
    redirect(`/join/${slug}?error=unavailable`);
  }

  const parsed = publicMemberRegistrationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    redirect(`/join/${slug}?error=invalid`);
  }

  const row = parsed.data;
  const memberType = form.allowMemberTypeInput
    ? nullableText(row.memberType) ?? form.defaultMemberType
    : form.defaultMemberType;
  const memberNo = await nextPublicMemberNo(form.societyId);
  const repo = createTenantRepo({ societyId: form.societyId, actorUserId: null });
  await repo.upsertMember({
    societyId: form.societyId,
    memberNo,
    familyName: row.familyName.trim(),
    givenName: row.givenName.trim(),
    name: buildMemberFullName(row.familyName, row.givenName),
    kana: row.kana.trim(),
    affiliation: row.affiliation.trim(),
    postalCode: row.postalCode.trim(),
    prefecture: row.prefecture.trim(),
    city: row.city.trim(),
    addressLine1: row.addressLine1.trim(),
    addressLine2: nullableText(row.addressLine2),
    address: buildMemberAddress({
      postalCode: row.postalCode,
      prefecture: row.prefecture,
      city: row.city,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
    }),
    email: row.email.trim(),
    phone: nullableText(row.phone),
    memberType,
    position: null,
    status: "ACTIVE",
    joinedAt: new Date(),
    leftAt: null,
  });
  revalidatePath(`/t/${form.societyId}/members`);
  redirect(`/join/${form.slug}?success=1`);
}

export async function generateAnnualInvoicesAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = annualInvoiceGenerateSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.generateAnnualInvoices(parsed);
  revalidatePath(`/t/${societyId}/invoices`);
}

export async function updateInvoiceAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const invoiceId = String(formData.get("invoiceId"));
  const parsed = invoiceUpdateSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.updateInvoice(invoiceId, parsed);
  revalidatePath(`/t/${societyId}/invoices`);
}

export async function updateInvoiceReminderStageAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const invoiceId = String(formData.get("invoiceId"));
  const parsed = invoiceReminderUpdateSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.updateInvoiceReminderStage(invoiceId, { stage: parsed.stage as any, note: parsed.note });
  revalidatePath(`/t/${societyId}/invoices`);
  revalidatePath(`/t/${societyId}/reminders`);
}

export async function generateMonthlyReportAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("年月の指定が不正です");
  }
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.generateMonthlyReport(year, month);
  revalidatePath(`/t/${societyId}`);
  revalidatePath(`/t/${societyId}/invoices`);
}

export async function markOverdueAction(societyId: string) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.markOverdueInvoices();
  revalidatePath(`/t/${societyId}/invoices`);
  revalidatePath(`/t/${societyId}/reminders`);
}

export async function upsertEmailTemplateAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = emailTemplateSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.upsertEmailTemplate(parsed);
  revalidatePath(`/t/${societyId}/settings/email-templates`);
  revalidatePath(`/t/${societyId}/invoices`);
  revalidatePath(`/t/${societyId}/mailings`);
  revalidatePath(`/t/${societyId}/reminders`);
}

export async function createEmailApprovalAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = emailApprovalCreateSchema.parse({
    ...formDataToObject(formData),
    overdueOnly: boolVal(formData, "overdueOnly"),
  });
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  const approval = await repo.createEmailApproval({
    title: parsed.title,
    templateKey: parsed.templateKey,
    filterJson: {
      targetScope: parsed.targetScope ?? "INVOICE",
      fiscalYear: parsed.fiscalYear ?? null,
      invoiceStatus: parsed.invoiceStatus ?? null,
      memberStatus: parsed.memberStatus ?? "ACTIVE",
      overdueOnly: parsed.overdueOnly,
    } as any,
  });
  await repo.queueApprovalRecipients(approval.id);
  revalidatePath(`/t/${societyId}/invoices`);
  revalidatePath(`/t/${societyId}/mailings`);
  revalidatePath(`/t/${societyId}/reminders`);
}

export async function approveEmailApprovalAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "ADMIN");
  const approvalId = String(formData.get("approvalId"));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.approveEmailApproval(approvalId);
  revalidatePath(`/t/${societyId}/invoices`);
  revalidatePath(`/t/${societyId}/mailings`);
  revalidatePath(`/t/${societyId}/reminders`);
}

export async function sendApprovedEmailAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "ADMIN");
  const approvalId = String(formData.get("approvalId"));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  const approval = await repo.getEmailApproval(approvalId);
  if (!approval) throw new Error("承認依頼が見つかりません");
  if (approval.status !== "APPROVED") throw new Error("Approved のみ送信可能です");

  const mailSettings = await repo.getSocietyMailSettings();
  ensureMailSettingsForSend(mailSettings ?? {});
  const provider = getMailProvider({
    mode: mailSettings?.mailProvider,
    smtp: {
      from: mailSettings?.mailFrom,
      host: mailSettings?.smtpHost,
      port: mailSettings?.smtpPort,
      secure: mailSettings?.smtpSecure,
      user: mailSettings?.smtpUser,
      pass: mailSettings?.smtpPass,
    },
  });
  for (const row of approval.recipients) {
    if (row.status === "SENT") continue;
    const result = await provider.send({
      to: row.to,
      subject: row.subject,
      text: row.bodyRendered,
    });
    await repo.markEmailSent(row.id, result);
  }
  await repo.finalizeEmailApprovalSent(approvalId);
  revalidatePath(`/t/${societyId}/invoices`);
  revalidatePath(`/t/${societyId}/mailings`);
  revalidatePath(`/t/${societyId}/reminders`);
}

export async function generateReceiptAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const invoiceId = String(formData.get("invoiceId"));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  const invoice = await repo.getInvoice(invoiceId);
  if (!invoice) throw new Error("請求が見つかりません");
  if (invoice.status !== "PAID") throw new Error("paid の請求のみ領収書を発行できます");
  const society = await repo.getSocietyMeta();
  if (!society) throw new Error("学会が見つかりません");
  const year = invoice.paidAt?.getFullYear() ?? new Date().getFullYear();
  const receiptNo = await repo.nextReceiptNo(year);
  const pdf = await buildReceiptPdf({
    receiptNo,
    societyName: society.name,
    memberName: invoice.member.name,
    amount: invoice.amount,
    fiscalYear: invoice.fiscalYear,
    paidAt: invoice.paidAt,
  });
  const dir = path.join(getUploadBaseDir(), societyId, "receipts");
  await ensureDir(dir);
  const fileName = `${receiptNo}.pdf`;
  const abs = path.join(dir, fileName);
  await fs.writeFile(abs, pdf);
  const filePath = `/uploads/${societyId}/receipts/${fileName}`;
  await repo.attachReceipt(invoiceId, receiptNo, filePath);
  revalidatePath(`/t/${societyId}/invoices`);
}

export async function saveMeetingAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const id = formData.get("id") ? String(formData.get("id")) : undefined;
  const parsed = meetingSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  const meeting = await repo.upsertMeeting({ id, ...parsed } as any);
  revalidatePath(`/t/${societyId}/meetings`);
  revalidatePath(`/t/${societyId}/meetings/${meeting.id}`);
  if (!id) redirect(`/t/${societyId}/meetings/${meeting.id}`);
}

export async function addAttendanceAction(societyId: string, meetingId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = attendanceSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.addAttendance(meetingId, parsed as any);
  revalidatePath(`/t/${societyId}/meetings/${meetingId}`);
}

export async function addMeetingDocumentAction(societyId: string, meetingId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = meetingDocumentSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.addMeetingDocument(meetingId, parsed);
  revalidatePath(`/t/${societyId}/meetings/${meetingId}`);
}

export async function saveMinutesAction(societyId: string, meetingId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = minutesSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.saveMinutes(meetingId, parsed.minutesText);
  revalidatePath(`/t/${societyId}/meetings/${meetingId}`);
}

export async function addTaskAction(societyId: string, meetingId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = taskSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.addTask(meetingId, parsed as any);
  revalidatePath(`/t/${societyId}/meetings/${meetingId}`);
}

export async function updateTaskStatusAction(societyId: string, meetingId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const taskId = String(formData.get("taskId"));
  const status = String(formData.get("status")) as any;
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.updateTask(taskId, { status });
  revalidatePath(`/t/${societyId}/meetings/${meetingId}`);
}

export async function addDecisionAction(societyId: string, meetingId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = decisionSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.addDecision(meetingId, parsed);
  revalidatePath(`/t/${societyId}/meetings/${meetingId}`);
}

export async function createArchiveAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = archiveSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.createArchive({
    category: parsed.category,
    title: parsed.title,
    issueNo: parsed.issueNo,
    publishedAt: parsed.publishedAt,
    fileUrl: parsed.fileUrl,
    tags: parsed.tags.split(",").map((s) => s.trim()).filter(Boolean),
    note: parsed.note,
  });
  revalidatePath(`/t/${societyId}/archives`);
}

export async function createShipmentBatchAction(societyId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const parsed = shipmentBatchSchema.parse(formDataToObject(formData));
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.createShipmentBatchFromActiveMembers(parsed as any);
  revalidatePath(`/t/${societyId}/shipments`);
}

export async function updateShipmentRecipientStatusAction(societyId: string, batchId: string, formData: FormData) {
  const { user } = await requireSocietyAccess(societyId, "STAFF");
  const recipientId = String(formData.get("recipientId"));
  const status = String(formData.get("status")) as any;
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  await repo.updateShipmentRecipientStatus(batchId, recipientId, status);
  revalidatePath(`/t/${societyId}/shipments/${batchId}`);
}

export async function createStaffUserAction(formData: FormData) {
  const current = await requireOwnerUser();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  if (!email || !name || !password) throw new Error("必須項目が不足しています");
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("そのメールアドレスは既に登録されています");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.default.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash, status: "ACTIVE" } });
  revalidatePath("/admin/societies");
  revalidatePath("/staff-register");
  if (redirectTo) {
    redirect(`${redirectTo}?created=1`);
  }
  revalidatePath("/admin/societies");
  console.log("created by owner", current.id);
}
