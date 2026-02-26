import { createTenantRepo } from "@/lib/repositories/tenant-repo";
import { requireSocietyAccess } from "@/lib/session";

export async function getTenantContext(societyId: string, minimumRole: any = "READ_ONLY") {
  const { user, membership, society } = await requireSocietyAccess(societyId, minimumRole);
  const repo = createTenantRepo({ societyId, actorUserId: user.id });
  return { user, membership, society, repo };
}
