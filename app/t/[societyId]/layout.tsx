import { AppShell } from "@/components/AppShell";
import { getAccessibleSocieties, requireSocietyAccess } from "@/lib/session";

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { user } = await requireSocietyAccess(societyId, "READ_ONLY");
  const memberships = await getAccessibleSocieties(user.id);
  return <AppShell societyId={societyId} memberships={memberships} pathname="">{children}</AppShell>;
}
