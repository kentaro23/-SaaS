import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: Promise<{ societyId: string; batchId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { societyId, batchId } = await params;
  const membership = await prisma.societyMember.findUnique({ where: { userId_societyId: { userId: session.user.id, societyId } } });
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const batch = await prisma.shipmentBatch.findFirst({
    where: { id: batchId, societyId },
    include: { recipients: { include: { member: true }, orderBy: { member: { memberNo: "asc" } } } },
  });
  if (!batch) return new NextResponse("Not Found", { status: 404 });

  const csv = toCsv(batch.recipients.map((r) => ({
    memberNo: r.member.memberNo,
    memberName: r.member.name,
    addressSnapshot: r.addressSnapshot,
    status: r.status,
  })));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=shipment-${batchId}.csv`,
    },
  });
}
