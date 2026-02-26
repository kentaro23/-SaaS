import type { SocietyRole } from "@prisma/client";

const roleRank: Record<SocietyRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  STAFF: 2,
  READ_ONLY: 1,
};

export function hasRole(actual: SocietyRole, minimum: SocietyRole) {
  return roleRank[actual] >= roleRank[minimum];
}
