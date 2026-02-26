import type { SocietyRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

export function createSocietyAdminRepo(actorUserId?: string | null) {
  return {
    async listSocieties() {
      return prisma.society.findMany({
        include: {
          plan: true,
          _count: { select: { members: true, staff: true, invoices: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async getSociety(id: string) {
      return prisma.society.findUnique({
        where: { id },
        include: {
          plan: true,
          staff: { include: { user: true }, orderBy: { createdAt: "asc" } },
        },
      });
    },

    async createSociety(data: {
      name: string;
      shortName: string;
      contactEmail: string;
      billingEmail: string;
      status: "ACTIVE" | "INACTIVE";
    }) {
      const society = await prisma.society.create({ data });
      await recordAudit({
        actorUserId,
        societyId: society.id,
        resourceType: "SOCIETY",
        resourceId: society.id,
        action: "create",
        afterJson: data as any,
      });
      return society;
    },

    async updateSociety(id: string, data: {
      name: string;
      shortName: string;
      contactEmail: string;
      billingEmail: string;
      status: "ACTIVE" | "INACTIVE";
    }) {
      const before = await prisma.society.findUniqueOrThrow({ where: { id } });
      const society = await prisma.society.update({ where: { id }, data });
      await recordAudit({
        actorUserId,
        societyId: id,
        resourceType: "SOCIETY",
        resourceId: id,
        action: "update",
        beforeJson: before as any,
        afterJson: society as any,
      });
      return society;
    },

    async deleteSociety(id: string) {
      const before = await prisma.society.findUnique({ where: { id } });
      if (!before) return;
      await prisma.society.delete({ where: { id } });
      await recordAudit({
        actorUserId,
        societyId: id,
        resourceType: "SOCIETY",
        resourceId: id,
        action: "delete",
        beforeJson: before as any,
      });
    },

    async listUsers() {
      return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    },

    async assignStaff(societyId: string, userId: string, role: SocietyRole) {
      const membership = await prisma.societyMember.upsert({
        where: { userId_societyId: { userId, societyId } },
        create: { userId, societyId, role },
        update: { role },
        include: { user: true },
      });
      await recordAudit({
        actorUserId,
        societyId,
        resourceType: "SOCIETY_MEMBER",
        resourceId: membership.id,
        action: "upsert",
        afterJson: membership as any,
      });
      return membership;
    },

    async removeStaff(societyId: string, userId: string) {
      const before = await prisma.societyMember.findUnique({
        where: { userId_societyId: { userId, societyId } },
      });
      if (!before) return;
      await prisma.societyMember.delete({ where: { userId_societyId: { userId, societyId } } });
      await recordAudit({
        actorUserId,
        societyId,
        resourceType: "SOCIETY_MEMBER",
        resourceId: before.id,
        action: "delete",
        beforeJson: before as any,
      });
    },
  };
}
