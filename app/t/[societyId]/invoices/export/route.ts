import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: Promise<{ societyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { societyId } = await params;
  const membership = await prisma.societyMember.findUnique({ where: { userId_societyId: { userId: session.user.id, societyId } } });
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const invoices = await prisma.invoice.findMany({
    where: { societyId },
    include: { member: true },
    orderBy: [{ fiscalYear: "desc" }, { dueDate: "asc" }, { member: { memberNo: "asc" } }],
  });

  const csv = toCsv(
    invoices.map((inv) => ({
      fiscalYear: inv.fiscalYear,
      memberNo: inv.member.memberNo,
      memberName: inv.member.name,
      amount: inv.amount,
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      status: inv.status,
      paymentMethod: inv.paymentMethod ?? "",
      sentAt: inv.sentAt ? inv.sentAt.toISOString() : "",
      paidAt: inv.paidAt ? inv.paidAt.toISOString() : "",
      notes: inv.notes ?? "",
    })),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=invoices-${societyId}.csv`,
    },
  });
}
