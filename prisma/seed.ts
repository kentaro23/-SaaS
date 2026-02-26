import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.shipmentRecipient.deleteMany();
  await prisma.shipmentBatch.deleteMany();
  await prisma.archive.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.task.deleteMany();
  await prisma.minutes.deleteMany();
  await prisma.meetingDocument.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.emailThread.deleteMany();
  await prisma.emailSendLog.deleteMany();
  await prisma.emailApproval.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.member.deleteMany();
  await prisma.societyPlan.deleteMany();
  await prisma.societyMember.deleteMany();
  await prisma.society.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.create({
    data: {
      email: "owner@example.com",
      name: "運営オーナー",
      passwordHash,
      status: "ACTIVE",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "staff@example.com",
      name: "運営スタッフ",
      passwordHash,
      status: "ACTIVE",
    },
  });

  const society = await prisma.society.create({
    data: {
      name: "日本サンプル学会",
      shortName: "JSS",
      contactEmail: "office@jss.example.com",
      billingEmail: "billing@jss.example.com",
      status: "ACTIVE",
    },
  });

  await prisma.societyPlan.create({
    data: {
      societyId: society.id,
      planName: "Standard",
      electionSupport: false,
      shipmentSupport: true,
      committeeSupport: true,
      accountingSupport: false,
      monthlyFee: 150000,
      startDate: new Date("2026-01-01"),
    },
  });

  await prisma.societyMember.createMany({
    data: [
      { societyId: society.id, userId: owner.id, role: "OWNER" },
      { societyId: society.id, userId: admin.id, role: "ADMIN" },
    ],
  });

  const members = [] as Array<{ id: string; name: string }>;
  for (let i = 1; i <= 10; i++) {
    const member = await prisma.member.create({
      data: {
        societyId: society.id,
        memberNo: `M${String(i).padStart(4, "0")}`,
        name: `会員${i}`,
        kana: `カイイン${i}`,
        affiliation: `サンプル大学 ${i}学部`,
        address: `東京都サンプル区${i}-1-1 サンプルマンション${i}01`,
        email: `member${i}@example.com`,
        phone: `090-0000-00${String(i).padStart(2, "0")}`,
        memberType: i <= 7 ? "正会員" : i <= 9 ? "準会員" : "賛助会員",
        position: i === 1 ? "理事" : null,
        status: i === 10 ? "INACTIVE" : "ACTIVE",
        joinedAt: new Date(`202${i % 4}-04-01`),
      },
    });
    members.push({ id: member.id, name: member.name });
  }

  const invoices = [] as string[];
  for (let i = 0; i < members.length; i++) {
    const fy = 2026;
    const status = i < 3 ? "PAID" : i < 6 ? "SENT" : i < 8 ? "OVERDUE" : "APPROVED";
    const inv = await prisma.invoice.create({
      data: {
        societyId: society.id,
        memberId: members[i].id,
        fiscalYear: fy,
        status: status as any,
        amount: 10000,
        dueDate: new Date("2026-06-30"),
        sentAt: ["SENT", "PAID", "OVERDUE"].includes(status) ? new Date("2026-05-01") : null,
        paidAt: status === "PAID" ? new Date("2026-05-10") : null,
        paymentMethod: status === "PAID" ? "BANK_TRANSFER" : null,
        notes: status === "OVERDUE" ? "督促対象" : null,
      },
    });
    invoices.push(inv.id);
  }

  await prisma.emailTemplate.createMany({
    data: [
      {
        societyId: society.id,
        key: "annual_invoice",
        name: "年会費請求",
        subject: "{{fiscalYear}}年度 年会費のご請求（{{memberName}} 様）",
        body: "{{memberName}} 様\n\n{{fiscalYear}}年度の年会費 {{invoiceAmount}}円 のご請求です。\n支払期限: {{dueDate}}\n\n日本サンプル学会事務局",
      },
      {
        societyId: society.id,
        key: "reminder_1",
        name: "督促1回目",
        subject: "【督促】年会費お支払いのお願い（{{memberName}} 様）",
        body: "{{memberName}} 様\n\n未納の年会費 {{invoiceAmount}}円 がございます。\n支払期限: {{dueDate}}\nご確認ください。",
      },
    ],
  });

  const approval = await prisma.emailApproval.create({
    data: {
      societyId: society.id,
      templateKey: "reminder_1",
      title: "2026年度 督促第1便",
      status: "APPROVED",
      createdByUserId: owner.id,
      approvedByUserId: owner.id,
      approvedAt: new Date(),
      filterJson: { fiscalYear: 2026, overdueOnly: true },
    },
  });

  const overdueInvoices = await prisma.invoice.findMany({ where: { societyId: society.id, status: "OVERDUE" }, include: { member: true } });
  for (const inv of overdueInvoices) {
    await prisma.emailSendLog.create({
      data: {
        societyId: society.id,
        emailApprovalId: approval.id,
        templateKey: "reminder_1",
        to: inv.member.email,
        subject: `【督促】年会費お支払いのお願い（${inv.member.name} 様）`,
        bodyRendered: `${inv.member.name} 様\n未納の年会費 10000円 がございます。`,
        status: "QUEUED",
        memberId: inv.memberId,
        invoiceId: inv.id,
      },
    });
  }

  const meeting = await prisma.meeting.create({
    data: {
      societyId: society.id,
      title: "第1回 理事会",
      type: "BOARD",
      scheduledAt: new Date("2026-03-15T10:00:00+09:00"),
      location: "オンライン",
      onlineUrl: "https://meet.example.com/jss-board-1",
      agenda: "予算案審議\n年次大会準備\n会誌発送計画",
      status: "SCHEDULED",
    },
  });

  await prisma.attendance.createMany({
    data: [
      { meetingId: meeting.id, memberId: members[0].id, status: "YES" },
      { meetingId: meeting.id, memberId: members[1].id, status: "MAYBE" },
      { meetingId: meeting.id, externalName: "顧問弁護士", status: "YES", note: "外部参加" },
    ],
  });

  await prisma.minutes.create({ data: { meetingId: meeting.id, minutesText: "議事録テンプレ\n- 予算案承認\n- 年次大会準備担当決定" } });
  await prisma.task.createMany({
    data: [
      { meetingId: meeting.id, title: "大会会場候補の最終確認", assignee: "事務局", dueDate: new Date("2026-03-25"), status: "OPEN" },
      { meetingId: meeting.id, title: "会誌発送先名簿の更新", assignee: "会員担当", dueDate: new Date("2026-03-20"), status: "DONE" },
    ],
  });
  await prisma.decision.create({
    data: { meetingId: meeting.id, decidedAt: new Date("2026-03-15T11:30:00+09:00"), title: "年次大会会場方針", detail: "首都圏大学会場を優先して調整", decidedBy: "理事会" },
  });

  await prisma.archive.createMany({
    data: [
      { societyId: society.id, category: "JOURNAL", title: "学会誌 Vol.12", issueNo: "12", publishedAt: new Date("2026-02-01"), fileUrl: "/uploads/demo/vol12.pdf", tags: ["journal", "vol12", "2026"], note: "特集号" },
      { societyId: society.id, category: "NOTICE", title: "年次大会開催案内", issueNo: null, publishedAt: new Date("2026-01-20"), fileUrl: "/uploads/demo/notice-annual.pdf", tags: ["notice", "annual"], note: null },
    ],
  });

  const batch = await prisma.shipmentBatch.create({
    data: { societyId: society.id, type: "JOURNAL", title: "学会誌 Vol.12 発送", createdById: owner.id },
  });
  const activeMembers = await prisma.member.findMany({ where: { societyId: society.id, status: "ACTIVE" } });
  await prisma.shipmentRecipient.createMany({
    data: activeMembers.map((m, idx) => ({
      batchId: batch.id,
      memberId: m.id,
      addressSnapshot: m.address,
      status: idx < 5 ? "SENT" : "QUEUED",
    })),
  });

  await prisma.emailThread.create({
    data: {
      societyId: society.id,
      provider: "gmail",
      providerThreadId: "stub-thread-001",
      subject: "年会費に関するお問い合わせ",
    },
  });

  console.log("Seed completed", { societyId: society.id, ownerEmail: owner.email, password: "password123" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
