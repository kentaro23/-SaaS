import { Prisma, type SocietyRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { renderTemplate } from "@/lib/utils";

export type TenantRepoContext = {
  societyId: string;
  actorUserId?: string | null;
};

export function createTenantRepo(ctx: TenantRepoContext) {
  const { societyId, actorUserId } = ctx;

  const audit = (args: Parameters<typeof recordAudit>[0]) =>
    recordAudit({ ...args, societyId, actorUserId });

  return {
    societyId,

    async dashboardSummary() {
      const [memberCount, unpaidInvoices, meetingsUpcoming, shipmentCount] = await Promise.all([
        prisma.member.count({ where: { societyId, status: "ACTIVE" } }),
        prisma.invoice.count({ where: { societyId, status: { in: ["SENT", "OVERDUE", "APPROVED"] } } }),
        prisma.meeting.count({ where: { societyId, scheduledAt: { gte: new Date() } } }),
        prisma.shipmentBatch.count({ where: { societyId } }),
      ]);

      return { memberCount, unpaidInvoices, meetingsUpcoming, shipmentCount };
    },

    async latestAuditLogs(limit = 20) {
      return prisma.auditLog.findMany({
        where: { societyId },
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    },

    async listMembers(params?: { q?: string; status?: "ACTIVE" | "INACTIVE" | "ALL" }) {
      const q = params?.q?.trim();
      const status = params?.status && params.status !== "ALL" ? params.status : undefined;
      return prisma.member.findMany({
        where: {
          societyId,
          ...(status ? { status } : {}),
          ...(q
            ? {
                OR: [
                  { memberNo: { contains: q, mode: "insensitive" } },
                  { name: { contains: q, mode: "insensitive" } },
                  { affiliation: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ status: "asc" }, { memberNo: "asc" }],
      });
    },

    async getMember(memberId: string) {
      return prisma.member.findFirst({
        where: { id: memberId, societyId },
        include: {
          invoices: { orderBy: { fiscalYear: "desc" } },
        },
      });
    },

    async upsertMember(input: Prisma.MemberUncheckedCreateInput & { id?: string }) {
      if (input.id) {
        const before = await prisma.member.findFirstOrThrow({ where: { id: input.id, societyId } });
        const member = await prisma.member.update({
          where: { id: input.id },
          data: {
            memberNo: input.memberNo,
            name: input.name,
            kana: input.kana ?? null,
            affiliation: input.affiliation,
            address: input.address,
            email: input.email,
            phone: input.phone ?? null,
            memberType: input.memberType,
            position: input.position ?? null,
            status: input.status,
            joinedAt: input.joinedAt,
            leftAt: input.leftAt ?? null,
          },
        });
        await audit({
          resourceType: "MEMBER",
          resourceId: member.id,
          action: "update",
          beforeJson: before as any,
          afterJson: member as any,
        });
        return member;
      }

      const member = await prisma.member.create({
        data: {
          societyId,
          memberNo: input.memberNo,
          name: input.name,
          kana: input.kana ?? null,
          affiliation: input.affiliation,
          address: input.address,
          email: input.email,
          phone: input.phone ?? null,
          memberType: input.memberType,
          position: input.position ?? null,
          status: input.status ?? "ACTIVE",
          joinedAt: input.joinedAt,
          leftAt: input.leftAt ?? null,
        },
      });
      await audit({
        resourceType: "MEMBER",
        resourceId: member.id,
        action: "create",
        afterJson: member as any,
      });
      return member;
    },

    async listInvoices(params: { fiscalYear?: number; status?: string | null }) {
      return prisma.invoice.findMany({
        where: {
          societyId,
          ...(params.fiscalYear ? { fiscalYear: params.fiscalYear } : {}),
          ...(params.status && params.status !== "ALL" ? { status: params.status as any } : {}),
        },
        include: { member: true, receipt: true },
        orderBy: [{ fiscalYear: "desc" }, { dueDate: "asc" }, { member: { memberNo: "asc" } }],
      });
    },

    async getInvoice(invoiceId: string) {
      return prisma.invoice.findFirst({
        where: { id: invoiceId, societyId },
        include: { member: true, receipt: true, emailLogs: { orderBy: { createdAt: "desc" } } },
      });
    },

    async generateAnnualInvoices(input: { fiscalYear: number; amount: number; dueDate: Date }) {
      const activeMembers = await prisma.member.findMany({
        where: { societyId, status: "ACTIVE" },
        orderBy: { memberNo: "asc" },
      });

      const results: { created: number; skipped: number } = { created: 0, skipped: 0 };
      for (const m of activeMembers) {
        const exists = await prisma.invoice.findUnique({
          where: { societyId_memberId_fiscalYear: { societyId, memberId: m.id, fiscalYear: input.fiscalYear } },
        });
        if (exists) {
          results.skipped += 1;
          continue;
        }
        const invoice = await prisma.invoice.create({
          data: {
            societyId,
            memberId: m.id,
            fiscalYear: input.fiscalYear,
            amount: input.amount,
            dueDate: input.dueDate,
            status: "DRAFT",
          },
        });
        results.created += 1;
        await audit({
          resourceType: "INVOICE",
          resourceId: invoice.id,
          action: "create",
          afterJson: invoice as any,
          metaJson: { bulk: true } as any,
        });
      }
      return results;
    },

    async updateInvoice(invoiceId: string, input: { status: any; paymentMethod?: any; notes?: string | null }) {
      const before = await prisma.invoice.findFirstOrThrow({ where: { id: invoiceId, societyId } });
      const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: input.status,
          paymentMethod: input.paymentMethod ?? null,
          notes: input.notes ?? null,
          sentAt: input.status === "SENT" ? new Date() : before.sentAt,
          paidAt: input.status === "PAID" ? new Date() : input.status === "CANCELLED" ? null : before.paidAt,
        },
      });
      await audit({
        resourceType: "INVOICE",
        resourceId: invoice.id,
        action: "update_status",
        beforeJson: before as any,
        afterJson: invoice as any,
      });
      return invoice;
    },

    async markOverdueInvoices() {
      const now = new Date();
      const targets = await prisma.invoice.findMany({
        where: {
          societyId,
          dueDate: { lt: now },
          status: { in: ["APPROVED", "SENT"] },
        },
      });
      for (const invoice of targets) {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "OVERDUE" } });
        await audit({
          resourceType: "INVOICE",
          resourceId: invoice.id,
          action: "auto_overdue",
          beforeJson: invoice as any,
          afterJson: { ...invoice, status: "OVERDUE" } as any,
        });
      }
      return targets.length;
    },

    async listInvoiceEmailTargets(filter: { fiscalYear?: number | null; invoiceStatus?: string | null; overdueOnly?: boolean }) {
      return prisma.invoice.findMany({
        where: {
          societyId,
          ...(filter.fiscalYear ? { fiscalYear: filter.fiscalYear } : {}),
          ...(filter.overdueOnly ? { OR: [{ status: "OVERDUE" }, { dueDate: { lt: new Date() } }] } : {}),
          ...(filter.invoiceStatus ? { status: filter.invoiceStatus as any } : {}),
          member: { email: { not: "" } },
        },
        include: { member: true },
        orderBy: [{ member: { memberNo: "asc" } }],
      });
    },

    async listEmailTemplates() {
      return prisma.emailTemplate.findMany({ where: { societyId }, orderBy: { key: "asc" } });
    },

    async getEmailTemplate(key: string) {
      return prisma.emailTemplate.findUnique({ where: { societyId_key: { societyId, key } } });
    },

    async upsertEmailTemplate(input: { key: string; name: string; subject: string; body: string }) {
      const template = await prisma.emailTemplate.upsert({
        where: { societyId_key: { societyId, key: input.key } },
        create: { societyId, ...input },
        update: { name: input.name, subject: input.subject, body: input.body },
      });
      await audit({
        resourceType: "EMAIL_TEMPLATE",
        resourceId: template.id,
        action: "upsert",
        afterJson: template as any,
      });
      return template;
    },

    async buildEmailPreview(input: {
      templateKey: string;
      fiscalYear?: number | null;
      invoiceStatus?: string | null;
      overdueOnly?: boolean;
      limit?: number;
    }) {
      const template = await this.getEmailTemplate(input.templateKey);
      if (!template) throw new Error("テンプレートが見つかりません");
      const targets = await this.listInvoiceEmailTargets(input);
      return targets.slice(0, input.limit ?? 20).map((invoice) => {
        const vars = {
          memberName: invoice.member.name,
          memberNo: invoice.member.memberNo,
          societyName: invoice.member.affiliation, // placeholder if society name hidden here
          fiscalYear: invoice.fiscalYear,
          invoiceAmount: invoice.amount,
          dueDate: invoice.dueDate.toISOString().slice(0, 10),
          invoiceStatus: invoice.status,
        };
        return {
          invoiceId: invoice.id,
          memberId: invoice.memberId,
          to: invoice.member.email,
          subjectRendered: renderTemplate(template.subject, vars),
          bodyRendered: renderTemplate(template.body, vars),
          member: invoice.member,
          invoice,
        };
      });
    },

    async createEmailApproval(input: {
      title: string;
      templateKey: string;
      filterJson?: Prisma.InputJsonValue;
    }) {
      const approval = await prisma.emailApproval.create({
        data: {
          societyId,
          templateKey: input.templateKey,
          title: input.title,
          filterJson: input.filterJson,
          createdByUserId: actorUserId || "system",
        },
      });
      await audit({
        resourceType: "EMAIL_APPROVAL",
        resourceId: approval.id,
        action: "create",
        afterJson: approval as any,
      });
      return approval;
    },

    async listEmailApprovals() {
      return prisma.emailApproval.findMany({
        where: { societyId },
        include: { _count: { select: { recipients: true } } },
        orderBy: { createdAt: "desc" },
      });
    },

    async getEmailApproval(id: string) {
      return prisma.emailApproval.findFirst({
        where: { id, societyId },
        include: { recipients: { include: { member: true, invoice: true }, orderBy: { createdAt: "asc" } } },
      });
    },

    async approveEmailApproval(id: string) {
      const before = await prisma.emailApproval.findFirstOrThrow({ where: { id, societyId } });
      const approval = await prisma.emailApproval.update({
        where: { id },
        data: { status: "APPROVED", approvedAt: new Date(), approvedByUserId: actorUserId ?? null },
      });
      await audit({
        resourceType: "EMAIL_APPROVAL",
        resourceId: id,
        action: "approve",
        beforeJson: before as any,
        afterJson: approval as any,
      });
      return approval;
    },

    async queueApprovalRecipients(id: string) {
      const approval = await prisma.emailApproval.findFirstOrThrow({ where: { id, societyId } });
      const filter = (approval.filterJson ?? {}) as Record<string, any>;
      const template = await this.getEmailTemplate(approval.templateKey);
      if (!template) throw new Error("テンプレート未登録");
      const invoices = await this.listInvoiceEmailTargets({
        fiscalYear: filter.fiscalYear ?? null,
        invoiceStatus: filter.invoiceStatus ?? null,
        overdueOnly: !!filter.overdueOnly,
      });

      let created = 0;
      for (const invoice of invoices) {
        const exists = await prisma.emailSendLog.findFirst({
          where: { emailApprovalId: approval.id, invoiceId: invoice.id },
        });
        if (exists) continue;
        const vars = {
          memberName: invoice.member.name,
          memberNo: invoice.member.memberNo,
          fiscalYear: invoice.fiscalYear,
          invoiceAmount: invoice.amount,
          dueDate: invoice.dueDate.toISOString().slice(0, 10),
          invoiceStatus: invoice.status,
        };
        await prisma.emailSendLog.create({
          data: {
            societyId,
            emailApprovalId: approval.id,
            templateKey: approval.templateKey,
            to: invoice.member.email,
            subject: renderTemplate(template.subject, vars),
            bodyRendered: renderTemplate(template.body, vars),
            status: "QUEUED",
            memberId: invoice.memberId,
            invoiceId: invoice.id,
          },
        });
        created += 1;
      }
      return created;
    },

    async markEmailSent(logId: string, result: { providerMessageId?: string | null; ok: boolean; errorMessage?: string | null }) {
      const before = await prisma.emailSendLog.findFirstOrThrow({ where: { id: logId, societyId } });
      const updated = await prisma.emailSendLog.update({
        where: { id: logId },
        data: {
          status: result.ok ? "SENT" : "FAILED",
          providerMessageId: result.providerMessageId ?? null,
          sentAt: result.ok ? new Date() : null,
          errorMessage: result.errorMessage ?? null,
        },
      });
      if (result.ok && before.invoiceId) {
        const inv = await prisma.invoice.findFirst({ where: { id: before.invoiceId, societyId } });
        if (inv && inv.status === "APPROVED") {
          await prisma.invoice.update({ where: { id: inv.id }, data: { status: "SENT", sentAt: new Date() } });
        }
      }
      await audit({
        resourceType: "EMAIL_SEND_LOG",
        resourceId: logId,
        action: result.ok ? "sent" : "failed",
        beforeJson: before as any,
        afterJson: updated as any,
      });
      return updated;
    },

    async finalizeEmailApprovalSent(id: string) {
      const before = await prisma.emailApproval.findFirstOrThrow({ where: { id, societyId } });
      const approval = await prisma.emailApproval.update({
        where: { id },
        data: { status: "SENT", sentAt: new Date() },
      });
      await audit({
        resourceType: "EMAIL_APPROVAL",
        resourceId: id,
        action: "sent",
        beforeJson: before as any,
        afterJson: approval as any,
      });
      return approval;
    },

    async getPlan() {
      return prisma.societyPlan.findUnique({ where: { societyId } });
    },

    async upsertPlan(input: {
      planName: string;
      electionSupport: boolean;
      shipmentSupport: boolean;
      committeeSupport: boolean;
      accountingSupport: boolean;
      monthlyFee: number;
      startDate: Date;
      endDate?: Date | null;
    }) {
      const before = await prisma.societyPlan.findUnique({ where: { societyId } });
      const plan = await prisma.societyPlan.upsert({
        where: { societyId },
        create: { societyId, ...input },
        update: input,
      });
      await audit({
        resourceType: "PLAN_CHANGE",
        resourceId: plan.id,
        action: before ? "update" : "create",
        beforeJson: before as any,
        afterJson: plan as any,
      });
      return plan;
    },

    async getSocietyMailSettings() {
      return prisma.society.findUnique({
        where: { id: societyId },
        select: {
          id: true,
          mailProvider: true,
          mailFrom: true,
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          smtpPass: true,
          gmailSender: true,
        },
      });
    },

    async updateSocietyMailSettings(input: {
      mailProvider: string;
      mailFrom?: string | null;
      smtpHost?: string | null;
      smtpPort?: number | null;
      smtpSecure?: boolean;
      smtpUser?: string | null;
      smtpPass?: string | null;
      gmailSender?: string | null;
    }) {
      const before = await prisma.society.findUniqueOrThrow({ where: { id: societyId } });
      const society = await prisma.society.update({
        where: { id: societyId },
        data: {
          mailProvider: input.mailProvider,
          mailFrom: input.mailFrom || null,
          smtpHost: input.smtpHost || null,
          smtpPort: input.smtpPort ?? null,
          smtpSecure: !!input.smtpSecure,
          smtpUser: input.smtpUser || null,
          smtpPass: input.smtpPass || null,
          gmailSender: input.gmailSender || null,
        },
      });
      await audit({
        resourceType: "SOCIETY",
        resourceId: society.id,
        action: "update_mail_settings",
        beforeJson: before as any,
        afterJson: society as any,
      });
      return society;
    },

    async listSocietyStaff() {
      return prisma.societyMember.findMany({
        where: { societyId },
        include: { user: true },
        orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      });
    },

    async assignSocietyStaff(userId: string, role: SocietyRole) {
      const membership = await prisma.societyMember.upsert({
        where: { userId_societyId: { userId, societyId } },
        create: { userId, societyId, role },
        update: { role },
        include: { user: true },
      });
      await audit({
        resourceType: "SOCIETY_MEMBER",
        resourceId: membership.id,
        action: "upsert",
        afterJson: membership as any,
      });
      return membership;
    },

    async listMeetings() {
      return prisma.meeting.findMany({
        where: { societyId },
        include: { _count: { select: { attendances: true, documents: true, tasks: true, decisions: true } } },
        orderBy: { scheduledAt: "desc" },
      });
    },

    async getMeeting(meetingId: string) {
      return prisma.meeting.findFirst({
        where: { id: meetingId, societyId },
        include: {
          attendances: { include: { member: true }, orderBy: { createdAt: "asc" } },
          documents: { include: { uploadedBy: true }, orderBy: [{ title: "asc" }, { version: "desc" }] },
          minutes: true,
          tasks: { orderBy: { createdAt: "asc" } },
          decisions: { orderBy: { decidedAt: "desc" } },
        },
      });
    },

    async upsertMeeting(input: {
      id?: string;
      title: string;
      type: any;
      scheduledAt: Date;
      location?: string | null;
      onlineUrl?: string | null;
      agenda?: string | null;
      status: any;
    }) {
      if (input.id) {
        const before = await prisma.meeting.findFirstOrThrow({ where: { id: input.id, societyId } });
        const meeting = await prisma.meeting.update({
          where: { id: input.id },
          data: { ...input, id: undefined },
        });
        await audit({ resourceType: "MEETING", resourceId: meeting.id, action: "update", beforeJson: before as any, afterJson: meeting as any });
        return meeting;
      }
      const meeting = await prisma.meeting.create({ data: { ...input, societyId } as any });
      await audit({ resourceType: "MEETING", resourceId: meeting.id, action: "create", afterJson: meeting as any });
      return meeting;
    },

    async addAttendance(meetingId: string, input: { memberId?: string | null; externalName?: string | null; status: any; note?: string | null }) {
      const meeting = await prisma.meeting.findFirst({ where: { id: meetingId, societyId }, select: { id: true } });
      if (!meeting) throw new Error("会議が見つかりません");
      const row = await prisma.attendance.create({ data: { meetingId, ...input } });
      await audit({ resourceType: "ATTENDANCE", resourceId: row.id, action: "create", afterJson: row as any });
      return row;
    },

    async addMeetingDocument(meetingId: string, input: { title: string; version: number; fileUrl: string }) {
      const meeting = await prisma.meeting.findFirst({ where: { id: meetingId, societyId }, select: { id: true } });
      if (!meeting) throw new Error("会議が見つかりません");
      const row = await prisma.meetingDocument.create({
        data: { meetingId, ...input, uploadedById: actorUserId ?? "system" },
      });
      await audit({ resourceType: "MEETING_DOCUMENT", resourceId: row.id, action: "create", afterJson: row as any });
      return row;
    },

    async saveMinutes(meetingId: string, minutesText: string) {
      const meeting = await prisma.meeting.findFirst({ where: { id: meetingId, societyId }, select: { id: true } });
      if (!meeting) throw new Error("会議が見つかりません");
      const row = await prisma.minutes.upsert({
        where: { meetingId },
        create: { meetingId, minutesText },
        update: { minutesText },
      });
      await audit({ resourceType: "MINUTES", resourceId: row.id, action: "upsert", afterJson: row as any });
      return row;
    },

    async addTask(meetingId: string, input: { title: string; assignee?: string | null; dueDate?: Date | null; status: any }) {
      const row = await prisma.task.create({ data: { meetingId, ...input } });
      await audit({ resourceType: "TASK", resourceId: row.id, action: "create", afterJson: row as any });
      return row;
    },

    async updateTask(taskId: string, input: { status: any }) {
      const task = await prisma.task.findFirst({ where: { id: taskId, meeting: { societyId } } });
      if (!task) throw new Error("タスクが見つかりません");
      const updated = await prisma.task.update({ where: { id: taskId }, data: { status: input.status } });
      await audit({ resourceType: "TASK", resourceId: taskId, action: "update_status", beforeJson: task as any, afterJson: updated as any });
      return updated;
    },

    async addDecision(meetingId: string, input: { title: string; detail?: string | null; decidedBy?: string | null; decidedAt: Date }) {
      const row = await prisma.decision.create({ data: { meetingId, ...input } });
      await audit({ resourceType: "DECISION", resourceId: row.id, action: "create", afterJson: row as any });
      return row;
    },

    async listArchives(params?: { q?: string; category?: string | null; issueNo?: string | null }) {
      const q = params?.q?.trim();
      return prisma.archive.findMany({
        where: {
          societyId,
          ...(params?.category && params.category !== "ALL" ? { category: params.category as any } : {}),
          ...(params?.issueNo ? { issueNo: { contains: params.issueNo, mode: "insensitive" } } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { tags: { hasSome: q.split(/\s+/).filter(Boolean) } },
                ],
              }
            : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      });
    },

    async createArchive(input: {
      category: any;
      title: string;
      issueNo?: string | null;
      publishedAt?: Date | null;
      fileUrl: string;
      tags: string[];
      note?: string | null;
    }) {
      const row = await prisma.archive.create({ data: { societyId, ...input } });
      await audit({ resourceType: "ARCHIVE", resourceId: row.id, action: "create", afterJson: row as any });
      return row;
    },

    async listShipmentBatches() {
      return prisma.shipmentBatch.findMany({
        where: { societyId },
        include: {
          createdBy: true,
          _count: { select: { recipients: true } },
          recipients: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async createShipmentBatchFromActiveMembers(input: { type: any; title?: string | null }) {
      const members = await prisma.member.findMany({ where: { societyId, status: "ACTIVE" }, orderBy: { memberNo: "asc" } });
      const batch = await prisma.shipmentBatch.create({
        data: {
          societyId,
          type: input.type,
          title: input.title ?? null,
          createdById: actorUserId ?? "system",
        },
      });

      if (members.length) {
        await prisma.shipmentRecipient.createMany({
          data: members.map((m) => ({
            batchId: batch.id,
            memberId: m.id,
            addressSnapshot: m.address,
            status: "QUEUED",
          })),
        });
      }

      await audit({
        resourceType: "SHIPMENT_BATCH",
        resourceId: batch.id,
        action: "create",
        afterJson: { ...batch, recipientCount: members.length } as any,
      });
      return batch;
    },

    async getShipmentBatch(batchId: string) {
      return prisma.shipmentBatch.findFirst({
        where: { id: batchId, societyId },
        include: {
          createdBy: true,
          recipients: { include: { member: true }, orderBy: { member: { memberNo: "asc" } } },
        },
      });
    },

    async updateShipmentRecipientStatus(batchId: string, recipientId: string, status: any) {
      const recipient = await prisma.shipmentRecipient.findFirst({
        where: { id: recipientId, batchId, batch: { societyId } },
      });
      if (!recipient) throw new Error("発送先が見つかりません");
      const updated = await prisma.shipmentRecipient.update({ where: { id: recipientId }, data: { status } });
      await audit({ resourceType: "SHIPMENT_RECIPIENT", resourceId: recipientId, action: "update_status", beforeJson: recipient as any, afterJson: updated as any });
      return updated;
    },

    async nextReceiptNo(year: number) {
      const prefix = `${societyId}-${year}-`;
      const count = await prisma.receipt.count({ where: { societyId, receiptNo: { startsWith: prefix } } });
      return `${prefix}${String(count + 1).padStart(4, "0")}`;
    },

    async attachReceipt(invoiceId: string, receiptNo: string, filePath: string) {
      const invoice = await prisma.invoice.findFirstOrThrow({ where: { id: invoiceId, societyId } });
      const receipt = await prisma.receipt.upsert({
        where: { invoiceId },
        create: { societyId, invoiceId, receiptNo, filePath },
        update: { receiptNo, filePath, issuedAt: new Date() },
      });
      await audit({
        resourceType: "RECEIPT",
        resourceId: receipt.id,
        action: "upsert",
        afterJson: { receipt, invoiceId: invoice.id } as any,
      });
      return receipt;
    },

    async getSocietyMeta() {
      return prisma.society.findUnique({ where: { id: societyId } });
    },
  };
}
