import { redirect } from "next/navigation";
import type { SocietyRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/authz";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function getAccessibleSocieties(userId: string) {
  return prisma.societyMember.findMany({
    where: { userId },
    include: { society: true },
    orderBy: { society: { name: "asc" } },
  });
}

export async function requireSocietyAccess(societyId: string, minimumRole: SocietyRole = "READ_ONLY") {
  const user = await requireUser();
  const membership = await prisma.societyMember.findUnique({
    where: { userId_societyId: { userId: user.id, societyId } },
    include: { society: true },
  });

  if (!membership || !hasRole(membership.role, minimumRole)) {
    redirect("/login");
  }

  return { user, membership, society: membership.society };
}
