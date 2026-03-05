import { redirect } from "next/navigation";

export default async function PlanSettingsRedirect({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  redirect(`/t/${societyId}/settings`);
}
