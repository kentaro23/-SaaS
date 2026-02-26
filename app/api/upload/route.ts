import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveBufferToUpload } from "@/lib/files";

const allowedExt = new Set(["pdf"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const form = await req.formData();
  const societyId = String(form.get("societyId") ?? "");
  const subdir = String(form.get("subdir") ?? "misc");
  const file = form.get("file");

  if (!(file instanceof File)) return new NextResponse("file is required", { status: 400 });
  const filename = file.name || "upload.bin";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExt.has(ext)) return new NextResponse("Only PDF is allowed", { status: 400 });

  const membership = await prisma.societyMember.findUnique({ where: { userId_societyId: { userId: session.user.id, societyId } } });
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const buf = Buffer.from(await file.arrayBuffer());
  const url = await saveBufferToUpload({ societyId, subdir, filename, data: buf });

  return NextResponse.json({ ok: true, url });
}
