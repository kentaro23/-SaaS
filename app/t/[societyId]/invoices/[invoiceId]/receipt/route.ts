import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ societyId: string; invoiceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { societyId, invoiceId } = await params;

  const membership = await prisma.societyMember.findUnique({ where: { userId_societyId: { userId: session.user.id, societyId } } });
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const receipt = await prisma.receipt.findFirst({ where: { invoiceId, societyId } });
  if (!receipt) return new NextResponse("Not Found", { status: 404 });

  const abs = path.join(process.cwd(), "public", receipt.filePath.replace(/^\//, ""));
  const data = await fs.readFile(abs);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=receipt-${invoiceId}.pdf`,
    },
  });
}
