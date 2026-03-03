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

  const members = await prisma.member.findMany({
    where: { societyId },
    orderBy: [{ status: "asc" }, { memberNo: "asc" }],
  });

  const csv = toCsv(
    members.map((m) => ({
      memberNo: m.memberNo,
      name: m.name,
      kana: m.kana ?? "",
      affiliation: m.affiliation,
      address: m.address,
      email: m.email,
      phone: m.phone ?? "",
      memberType: m.memberType,
      position: m.position ?? "",
      status: m.status,
      joinedAt: m.joinedAt.toISOString().slice(0, 10),
      leftAt: m.leftAt ? m.leftAt.toISOString().slice(0, 10) : "",
    })),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=members-${societyId}.csv`,
    },
  });
}
