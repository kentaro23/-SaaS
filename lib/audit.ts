import type { AuditResourceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordAudit(input: {
  societyId?: string | null;
  actorUserId?: string | null;
  resourceType: AuditResourceType;
  resourceId: string;
  action: string;
  beforeJson?: Prisma.InputJsonValue | null;
  afterJson?: Prisma.InputJsonValue | null;
  metaJson?: Prisma.InputJsonValue | null;
}) {
  await prisma.auditLog.create({
    data: {
      societyId: input.societyId ?? null,
      actorUserId: input.actorUserId ?? null,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      action: input.action,
      beforeJson: input.beforeJson,
      afterJson: input.afterJson,
      metaJson: input.metaJson,
    },
  });
}
